# 付箋マスターレイヤー設計

## 概要

OCR生データ（`ocr-results.json`、ページ単位）とプロダクト用データ（`OfficialNote`、問題紐付き）の間に **付箋マスターJSON** を中間レイヤーとして設置する。

```
ocr-results.json          → 変換スクリプト →  fusens-master.json         → ビルドスクリプト →  official-notes.ts
(ページ単位、bbox付き)        (1回 + 差分)    (付箋単位、ID付き)            (topicId/tier設定)   (プロダクト用、型付き)
```

## なぜ中間レイヤーが必要か

| 課題 | ocr-results.json だけだと | fusens-master.json があると |
|------|-------------------------|---------------------------|
| 付箋の特定 | page+index でしか参照不可 | 安定ID `fusen-001` で参照 |
| 追加PDF取り込み | ページ番号が衝突しうる | IDベースなので衝突しない |
| 手動修正 | ページの中から探すのが大変 | IDで直接アクセス |
| 重複排除 | タイトル+bodyで推定するしかない | IDで管理 |
| topicId紐付け | OCRデータに概念がない | フィールドとして保持 |
| tier/status管理 | 管理する場所がない | フィールドとして保持 |

## データ構造

### fusens-master.json

```typescript
interface FusenMaster {
  version: number              // スキーマバージョン（将来の移行用）
  generatedAt: string          // ISO8601
  fusens: Record<string, Fusen>
}

interface Fusen {
  id: string                   // "fusen-001" 形式。連番で自動採番
  title: string                // OCRから取得（手動修正可）
  body: string                 // OCRから取得（手動修正可）
  imageFile: string            // "page-001/note-01.png"（public/images/fusens/ からの相対パス）
  subject: QuestionSubject     // 9科目。OCRの "物理|化学" は正規化して1つに
  noteType: NoteType           // knowledge | mnemonic | solution | caution | related
  tags: string[]               // OCRから取得

  // --- OCR出自情報（トレーサビリティ） ---
  source: {
    pdf: string                // "fusen-note-makio.pdf"
    page: number               // PDFのページ番号
    noteIndex: number           // そのページ内の何番目か（0始まり）
    bbox: [number, number, number, number]  // [y1, x1, y2, x2] 正規化座標
  }

  // --- プロダクト紐付け（後から設定） ---
  topicId: string | null       // ALL_TOPICS.id。nullは未マッピング
  linkedQuestionIds: string[]  // この付箋が役立つ問題ID群
  importance: number           // 0-5。linkedQuestionIds.length から自動算出 or 手動
  tier: 'free' | 'premium'    // 課金ティア

  // --- 運用管理 ---
  status: 'active' | 'draft' | 'archived' | 'duplicate'
  reviewedAt: string | null    // 人間が目視確認した日時
  notes: string                // 運用メモ（空文字OK）
}
```

### ID採番ルール

- `fusen-{NNN}` 形式（3桁ゼロ埋め、例: `fusen-001`）
- 1000超えたら `fusen-1001` に自然拡張
- 一度振ったIDは変更しない（削除時は status: 'archived'）
- 追加PDF取り込み時は最大ID + 1 から採番

### subject の正規化

OCRが `"物理|化学"` のようにパイプ区切りで返す場合がある。正規化ルール：
1. 最初の科目を採用（`"物理|化学"` → `"物理"`）
2. 有効な `QuestionSubject` 9値以外は `"物理"` にフォールバック
3. 手動修正可能（master JSONを直接編集）

### topicId マッピング戦略

3段階で精度を上げる：

**Phase 1: タグベースの自動マッピング（OCR完了直後）**
- 各付箋の `tags` と `ALL_TOPICS` の中項目名を照合
- 類似度が高いtopicIdを候補として提示
- 確信度が高いもの（1候補のみ）は自動設定、それ以外は null

**Phase 2: 問題紐付け経由の推定**
- `QUESTION_TOPIC_MAP` から各topicIdに属する問題を逆引き
- 問題のキーワードと付箋のtags/bodyを照合
- マッチした問題群の topicId を付箋に設定
- `linkedQuestionIds` も同時に設定

**Phase 3: 手動レビュー**
- `topicId: null` の付箋を一覧表示するレビューUI or CLIツール
- 人間が正しいtopicIdを選択

### importance 算出

```
importance = min(5, ceil(linkedQuestionIds.length / 2))
```

| linkedQuestionIds数 | importance |
|-------------------|-----------|
| 0 | 0 |
| 1-2 | 1 |
| 3-4 | 2 |
| 5-6 | 3 |
| 7-8 | 4 |
| 9+ | 5 |

### tier 割り当て（決定的ソート）

PRDの設計に準拠。**再実行しても結果が変わらない決定的ルール**：
1. `importance DESC`（重要度高い順）
2. 同スコアなら `id ASC`（ID昇順 = 先に登録された順）
3. 上位200枚 → `free`、残り → `premium`

```typescript
const sorted = fusens
  .filter(f => f.status === 'active' && f.topicId)
  .sort((a, b) => b.importance - a.importance || a.id.localeCompare(b.id))
sorted.forEach((f, i) => { f.tier = i < 200 ? 'free' : 'premium' })
```

## 変換スクリプト設計

### `scripts/build-fusens-master.ts`

```
入力: src/data/fusens/ocr-results.json
出力: src/data/fusens/fusens-master.json

Usage:
  npx tsx scripts/build-fusens-master.ts              # 初回生成
  npx tsx scripts/build-fusens-master.ts --merge       # 追加OCRデータをマージ
  npx tsx scripts/build-fusens-master.ts --stats        # 統計表示
  npx tsx scripts/build-fusens-master.ts --unreviewed   # 未レビュー一覧
```

**初回生成フロー:**
1. `ocr-results.json` を読み込み
2. 各ページの各noteにIDを採番（`fusen-001` 〜）
3. subject を正規化
4. `notes: []` のページ（表紙など）はスキップ
5. Phase 1 の自動topicIdマッピングを実行
6. `fusens-master.json` に保存

**マージフロー（追加PDF取り込み時）:**
1. 既存 `fusens-master.json` を読み込み
2. 新しい `ocr-results.json` を読み込み
3. **source fingerprint** (`${source.pdf}:${source.page}:${source.noteIndex}`) で既存マスターと照合
4. fingerprint 一致 → スキップ（既にインポート済み）
5. fingerprint 不一致（新規）→ コンテンツ重複チェック（title + body の類似度 > 0.8 → `status: 'duplicate'`）
6. 新規分にIDを採番して追加
7. 保存

**同一性判定の例:**
```typescript
// source fingerprint でマスター内の既存エントリを検索
const fingerprint = `${pdf}:${page}:${noteIndex}`
const existing = Object.values(master.fusens).find(
  f => `${f.source.pdf}:${f.source.page}:${f.source.noteIndex}` === fingerprint
)
if (existing) continue // 既にインポート済み → スキップ
```

### `scripts/build-official-notes.ts`

```
入力: src/data/fusens/fusens-master.json
出力: src/data/official-notes.ts（OFFICIAL_NOTESを上書き）

Usage:
  npx tsx scripts/build-official-notes.ts
```

**フロー:**
1. `fusens-master.json` から `status: 'active'` かつ `topicId != null` のみ抽出
2. `OfficialNote` 形式に変換
3. `importance` を算出（linkedQuestionIds ベース）
4. `tier` を割り当て（上位200枚 = free）
5. TypeScript ファイルとして出力

## ファイル配置

```
src/data/fusens/
├── ocr-results.json         # OCR生データ（ページ単位）← 既存
├── fusens-master.json       # 付箋マスター（ID単位）← NEW
└── (ocr-results.json.tmp)   # アトミック書き込み用
scripts/
├── ocr-fusens.ts            # OCRパイプライン ← 既存（v2改修済み）
├── build-fusens-master.ts   # マスター生成 ← NEW
└── build-official-notes.ts  # プロダクト用データ生成 ← NEW
public/images/fusens/
├── page-001/note-01.png     # 個別切り抜き画像 ← 既存
└── ...
```

## 運用フロー

### 初回（今回）
```
1. OCR全ページ実行 → ocr-results.json (129ページ分)
2. build-fusens-master.ts → fusens-master.json (全付箋にID付与)
3. 手動 or AIでtopicIdマッピング
4. build-official-notes.ts → official-notes.ts (プロダクトに反映)
```

### 追加PDF取り込み時
```
1. 新PDFをOCR → ocr-results.json に追記
2. build-fusens-master.ts --merge → 新付箋をマスターに追加
3. topicIdマッピング（新分のみ）
4. build-official-notes.ts → official-notes.ts 更新
```

### 付箋の修正・削除
```
fusens-master.json を直接編集 → build-official-notes.ts で反映
（ocr-results.json は触らない。生データとして保全）
```

## 今後の拡張

- **暗記カード連携**: `linkedCardIds` にQuizletデータのIDを設定
- **先輩コーチAI**: 付箋のbodyをRAGのソースとして活用
- **学習進捗連動**: ユーザーの苦手topicIdに対応する付箋を優先表示
