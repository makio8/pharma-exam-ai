# 画像欠落137問の修復 — 設計書

**日付**: 2026-03-23
**ステータス**: レビュー済み（GPT-5.4 レビュー反映 v2）
**優先度**: 🔴 最優先

## 背景

### 問題
137問が問題文中で画像を参照（「下図」「構造式」等）しているが、`image_url` が未設定のため `getDisplayMode()` が `'text'` を返し、画像が表示されない。うち79問は画像なしでは**回答不能**。

### 根本原因
既存の画像抽出スクリプト（`extract-question-images-batch.ts`, `crop-question-images.ts`）が `choices: []`（選択肢が空の問題）のみをフィルタ対象にしている。テキスト選択肢を持ちつつ画像を参照する問題（135問）が抽出から漏れた。

### 現状データ

| 区分 | 件数 | 画像ファイル有 | 画像ファイル無 |
|------|------|:---:|:---:|
| Tier 1: 回答不能（下図/この図） | 79 | 2 | 77 |
| Tier 2: 画像推奨（構造式/グラフ） | 22 | 0 | 22 |
| Tier 3: テキスト代替可能（下表等） | 36 | 0 | 36 |
| **合計** | **137** | **2** | **135** |

### 年度別内訳

| 年度 | 欠落数 | 既存ページ画像 | PDFページ画像状態 |
|------|--------|:---:|---|
| 100 | 10 | 193枚 | ✅ 充分 |
| 101 | 18 | 206枚 | ✅ 充分 |
| 102 | 14 | 222枚 | ✅ 充分 |
| 103 | 9 | 223枚 | ✅ 充分 |
| 104 | 12 | 243枚 | ✅ 充分 |
| 105 | 11 | 279枚 | ✅ 充分 |
| 106 | 15 | 270枚 | ✅ 充分 |
| 107 | 9 | 15枚 | ⚠️ 不足 → PDF再変換必要 |
| 108 | 18 | 3枚 | ⚠️ 不足 → PDF再変換必要 |
| 109 | 19 | 1枚 | ⚠️ 不足 → PDF再変換必要 |
| 110 | 2 | 11枚 | ⚠️ 不足 → PDF再変換必要 |

## 設計

### アプローチ: フルパイプライン再実行（確定IDリスト + フィルタ条件拡張）

**GPT-5.4レビュー反映**: 対象判定はキーワードヒューリスティックだけに頼らず、**確定IDリスト**を一次ソースとし、ヒューリスティックは新規発見用の補助に留める。

### 変更1: 確定IDリスト + フィルタ関数の拡張

**新規ファイル**: `src/data/real-questions/missing-image-ids.json`

診断スクリプトで特定した137問のIDを確定リストとして保存：
```json
{
  "description": "image_url未設定かつ画像参照キーワードを含む問題のIDリスト（2026-03-23診断）",
  "ids": ["r100-011", "r100-031", "r100-048", "...全137件"]
}
```

**対象ファイル**: `scripts/crop-question-images.ts`（画像クロップの主担当）

```typescript
// BEFORE: choices空のみ
function loadEmptyChoicesQuestions(year: number): Set<number>

// AFTER: 確定IDリスト + choices空 + キーワード（補助）
function loadTargetQuestions(year: number): Set<number> {
  const targets = new Set<number>()
  for (const q of questions) {
    // 1. 確定IDリストに含まれる（一次ソース）
    // 2. choices が空（既存ロジック）
    // 3. キーワードヒット & image_url 未設定（補助：新規発見用）
    const inConfirmedList = confirmedIds.has(q.id)
    const emptyChoices = !q.choices || q.choices.length === 0
    const keywordHit = hasImageKeyword(q.question_text) && !q.image_url

    if (inConfirmedList || emptyChoices || keywordHit) {
      targets.add(q.question_number)
    }
  }
  return targets
}

function hasImageKeyword(text: string): boolean {
  // Tier 1-3 全キーワード網羅（下表・処方も含む）
  return /下図|この図|次の図|図[1-9１-９]|構造式[をがはの]|下の構造|模式図|グラフ[をがはの]|以下の図|図に示|スキーム|下表|処方[箋せん]/.test(text)
}
```

**既存画像の保護**:
- 画像ファイルが既に存在 → スキップ（上書きしない）
- `image_url` が既に設定済み → スキップ（警告ログ出力のみ）
- 既存値と生成値が不一致 → 警告ログ出力、上書きしない

### 変更2: スクリプト責務の明確化（GPT-5.4 🔴指摘対応）

**問題**: `extract-question-images-batch.ts` が「ページ画像コピー」と「URL生成」の二重責務を持つ。

**対応**: 責務を分離し、パイプラインを一本化。

| スクリプト | 責務（変更後） |
|-----------|--------------|
| `crop-question-images.ts` | **画像生成の主担当**: PDF→ページ画像→座標クロップ→`public/`に配置。フィルタ拡張もここ |
| `extract-question-images-batch.ts` | **使わない**（cropで統一。将来のfallbackとしてのみ残す） |
| `add-image-urls-batch.ts` | **URL設定の主担当**: `public/images/questions/{year}/` の実在ファイルをスキャンし、`exam-{year}.ts` に `image_url` を追加 |
| `trim-image-whitespace.ts` | **トリミング**: 変更なし（既に全年度対応） |

### 変更3: PDFダウンロードスクリプト拡張

**対象ファイル**: `scripts/download-exam-pdfs.sh`

- 107-110回のPDF URLを追加
- 出力先を `/tmp/claude/` → `data/pdfs/` に変更

### 変更4: 全年度のページ画像永続化（GPT-5.4 🔴指摘対応）

**問題**: ページ画像が `/tmp/claude/exam-pages/` にあり、OS再起動で消失。100-106は既存利用の前提だが、新環境では再現できない。

**対応**:
1. 100-106: `/tmp/claude/exam-pages/{year}/` → `data/exam-pages/{year}/` にコピー（一度だけ）
2. 107-110: PDFから `data/exam-pages/{year}/` に直接生成
3. 全スクリプトの入力パスを `data/exam-pages/` に統一

```
data/
├── pdfs/              ← PDFファイル永続化 (.gitignore)
│   ├── q100-hissu.pdf
│   └── ...
└── exam-pages/        ← ページ画像永続化 (.gitignore)
    ├── 100/
    │   ├── q100-hissu-01.png
    │   └── ...
    └── 110/
```

**パス設定の一元管理**: スクリプト共通の定数ファイルを作成
```typescript
// scripts/lib/paths.ts
export const DATA_DIR = path.join(__dirname, '..', '..', 'data')
export const PDF_DIR = path.join(DATA_DIR, 'pdfs')
export const PAGES_DIR = path.join(DATA_DIR, 'exam-pages')
export const OUTPUT_DIR = path.join(__dirname, '..', '..', 'public', 'images', 'questions')
```

### 変更5: add-image-urls-batch.ts の拡張

**対象ファイル**: `scripts/add-image-urls-batch.ts`

```typescript
// BEFORE
const years = [100, 101, 102, 103, 104, 105, 106]
// AFTER
const years = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110]
```

**GPT-5.4 🟡指摘対応**: `image_url` 既存値の保護
```typescript
for (const q of questions) {
  const expectedUrl = `/images/questions/${year}/q${pad(q.question_number)}.png`
  const imageExists = fs.existsSync(path.join(publicDir, expectedUrl))

  if (q.image_url && q.image_url !== expectedUrl) {
    console.warn(`⚠ ${q.id}: 既存image_url="${q.image_url}" と生成値不一致。スキップ`)
    continue  // 上書きしない
  }
  if (!q.image_url && imageExists) {
    q.image_url = expectedUrl
    added++
  }
}
```

### パイプライン実行順序

```
Step 0: 確定IDリスト生成（診断スクリプト → missing-image-ids.json）

Step 1: PDF DL（全年度、data/pdfs/ に保存）
        → data/pdfs/q{year}-{section}.pdf

Step 2: ページ画像化
        - 100-106: /tmp/claude/exam-pages/ → data/exam-pages/ にコピー
        - 107-110: PDFから data/exam-pages/{year}/ に生成
        → data/exam-pages/{year}/

Step 3: 座標クロップ（確定IDリスト + フィルタ拡張版、全年度）
        - 既存画像ファイルがある場合はスキップ
        → public/images/questions/{year}/q{NNN}.png

Step 4: トリミング（Step3で新規生成された画像のみ）
        - 判定基準: Step3のログから新規生成ファイルリストを受け取る
        - または: 画像高さ > 1000px をトリミング対象とする（冪等性担保）
        → public/images/questions/{year}/q{NNN}.png (in-place)

Step 5: URL設定（public/ の実在ファイルをスキャンして exam-{year}.ts に反映）
        - 既存 image_url は上書きしない（不一致時は警告のみ）
        → src/data/real-questions/exam-{year}.ts

Step 6: 検証
        - 自動: 137問全てに image_url が設定され、ファイルが存在するか
        - 目視: Tier 1（79問）は全件、Tier 2-3 はサンプリング確認
```

### 安全策

- `--dry-run` フラグで事前に対象問題リストを出力
- 既存の909枚の画像は上書きしない（ファイル存在チェック）
- `image_url` 既存値は上書きしない（不一致時は警告ログ）
- クロップ前にページ画像の存在を確認
- 各ステップでログ出力（問題ID、対象ページ、出力ファイル）
- トリミングは冪等（画像高さベースの判定で複数回実行しても安全）

### 成功基準

1. 137問全てに `image_url` が設定されている（確定IDリストと照合）
2. 対応する画像ファイルが `public/images/questions/` に存在する
3. `getDisplayMode()` が `'text'` ではなく `'both'` を返す
4. `npm run build` が成功する
5. 既存の909枚の画像が壊れていない
6. **Tier 1（79問）の画像を全件目視確認し、正しい問題の画像であることを検証**
7. Tier 2-3 は10問以上のサンプリング確認

## 影響範囲

### 変更ファイル
| ファイル | 変更内容 |
|---------|---------|
| `scripts/crop-question-images.ts` | フィルタ関数拡張（確定IDリスト + キーワード）、パス設定変更 |
| `scripts/add-image-urls-batch.ts` | 年度範囲拡張、既存値保護ロジック追加 |
| `scripts/download-exam-pdfs.sh` | 107-110 URL追加、出力先変更 |
| `scripts/lib/paths.ts` | **新規**: パス定数の一元管理 |
| `src/data/real-questions/missing-image-ids.json` | **新規**: 確定IDリスト |
| `.gitignore` | `data/pdfs/`, `data/exam-pages/` 追加 |
| `src/data/real-questions/exam-{100-110}.ts` | image_url フィールド追加（137問） |

### 変更しないファイル
- `src/utils/text-normalizer.ts` — getDisplayMode は変更不要
- `src/types/question.ts` — 型定義は変更不要（image_url? は既存）
- `scripts/trim-image-whitespace.ts` — 既に全年度対応（パス引数のみ調整）
- `scripts/extract-question-images-batch.ts` — 使用停止（cropに統一）
- 既存の909枚の画像ファイル — 上書きしない

## GPT-5.4 レビュー対応ログ

| 指摘 | 重要度 | 対応 |
|------|--------|------|
| extract と crop の責務不明確 | 🔴 | crop に一本化。extract は使用停止 |
| 永続化パスがスクリプトに未反映 | 🔴 | paths.ts 新設、全スクリプトのパスを data/ に統一 |
| 正規表現ヒューリスティックが不安定 | 🔴 | 確定IDリスト（missing-image-ids.json）を一次ソースに |
| image_url 既存値の保護が弱い | 🟡 | 不一致時は警告のみ、上書きしない方針を明記 |
| トリミングの冪等性が未定義 | 🟡 | 画像高さベースの判定で冪等性担保 |
| 検証が存在確認のみ | 🟡 | Tier1 全件目視確認を追加 |
