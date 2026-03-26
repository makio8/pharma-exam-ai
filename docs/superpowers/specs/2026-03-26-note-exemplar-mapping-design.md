# 付箋→例示マッチング パイプライン設計 v1.0

## 概要

付箋（OfficialNote）23枚を例示（Exemplar）986件にAI半自動マッチングする。
3機能循環（演習→付箋→暗記カード）の「ミッシングリンク」を埋める。

```
演習問題 ←question-exemplar-map→ Exemplar ←note-exemplar-map→ 付箋
                                     ↕
                            暗記カードテンプレート
```

## 1. マッチングフロー

### 1.1 全体フロー

```
① Claude推論（このセッション内）
   23枚 × 986 exemplar → セマンティックマッチング
   ↓
② 中間JSON保存
   src/data/fusens/note-exemplar-mappings.json
   ↓
③ レビューUI で確認・修正
   /dev-tools/exemplar-mapping
   ↓
④ official-notes.ts へ反映
   承認済み mapping → exemplarIds[] 投入
```

### 1.2 マッチング方式

- **実行者**: このClaude Codeセッション自身（外部API不使用）
- **方式**: 1枚ずつ推論。付箋の `title + textSummary + tags + subject` と exemplar の `text + minorCategory + subject` をセマンティックマッチ
- **科目フィルタ**: 付箋の `subject` と exemplar の `subject` が一致するものを優先。ただし科目横断の付箋（例: 物理の単位→薬剤の計算）は cross-subject マッチも許可
- **精度目標**: 95%以上（セッションハンドオフ spec v3 と同等）

### 1.3 マッチングルール

| ルール | 条件 |
|--------|------|
| Primary | 付箋の内容を直接カバーする例示。1付箋あたり1-3件 |
| Secondary | 関連するが直接的でない例示。0-2件 |
| confidence | 0.0-1.0。Primary >= 0.80、Secondary >= 0.60 |
| 科目一致 | 同一科目を優先。cross-subject は reasoning に明記 |

## 2. 中間データ形式

### 2.1 型定義

```typescript
// src/types/note-exemplar-mapping.ts（新規）

/** 付箋→例示マッチング結果（1件） */
interface NoteExemplarMatch {
  exemplarId: string        // "ex-physics-017"
  isPrimary: boolean        // true = 直接紐付け
  confidence: number        // 0.0-1.0
  reasoning: string         // マッチング根拠（日本語）
}

/** 1枚の付箋のマッチング結果 */
interface NoteExemplarMappingEntry {
  noteId: string            // "on-001"
  noteTitle: string         // 表示用（レビューUIで使う）
  subject: string           // 科目
  matches: NoteExemplarMatch[]
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'modified'
  reviewedAt?: string       // ISO8601
}

/** マッチング結果ファイル全体 */
interface NoteExemplarMappingsFile {
  version: 1
  generatedAt: string       // ISO8601
  generatedBy: 'claude-session'
  noteCount: number
  mappings: NoteExemplarMappingEntry[]
}
```

### 2.2 保存先

- `src/data/fusens/note-exemplar-mappings.json` — 中間JSON（推論結果+レビュー状態）
- レビューUI の状態（承認/却下）は localStorage ではなくこのJSONに直接保存
  - 理由: 23枚分のレビュー結果はファイルに永続化した方がgit管理・再利用しやすい

### 2.3 サンプル

```json
{
  "version": 1,
  "generatedAt": "2026-03-26T10:00:00.000Z",
  "generatedBy": "claude-session",
  "noteCount": 23,
  "mappings": [
    {
      "noteId": "on-001",
      "noteTitle": "SI基本単位",
      "subject": "物理",
      "matches": [
        {
          "exemplarId": "ex-physics-017",
          "isPrimary": true,
          "confidence": 0.70,
          "reasoning": "付箋はSI基本単位7つの暗記。例示は原子構造と放射壊変。直接一致しないが、物理量の基礎として関連。"
        }
      ],
      "reviewStatus": "pending"
    }
  ]
}
```

**注意**: exemplar 986件の中にSI単位を直接扱う例示がない場合もある。その場合は最も近い例示を confidence 低めで提示し、レビューで判断する。

## 3. レビューUI

### 3.1 ルーティング

- パス: `/dev-tools/exemplar-mapping`
- dev環境のみ（`import.meta.env.DEV`）
- 既存パターン: `React.lazy` + `Suspense`

### 3.2 レイアウト（1カラム、fusen-reviewパターン）

```
┌─────────────────────────────────────────┐
│ 📋 Exemplar Mapping Review              │
│ ✅ 5  ❌ 1  ✏️ 2  ⏳ 15                  │
├─────────────────────────────────────────┤
│                                         │
│ [on-001] SI基本単位        物理         │
│ ┌─────────────────────────────────────┐ │
│ │ 🖼️ 付箋画像                         │ │
│ └─────────────────────────────────────┘ │
│ SI基本単位7つの語呂合わせ。Cd m A K ... │
│ 🏷️ SI基本単位 | 語呂合わせ | 物理量    │
│                                         │
│ ── Exemplar候補 ──────────────────────  │
│                                         │
│ 🟢 Primary  0.85                        │
│ ex-physics-017: 原子の構造と放射壊変に  │
│ ついて説明できる。                       │
│ 📁 放射線と放射能 > physics-material-... │
│ [✅ 承認] [❌ 却下] [🔄 Secondary に変更]│
│                                         │
│ 🔵 Secondary  0.65                      │
│ ex-physics-019: 代表的な放射性核種の... │
│ [✅ 承認] [❌ 却下] [🔄 Primary に変更]  │
│                                         │
│ ── 操作 ──────────────────────────────  │
│ [➕ Exemplar を追加] [全承認] [全却下]   │
│                                         │
│ ── ナビ ──────────────────────────────  │
│ [← Prev k]  3 / 23  [Next j →]         │
│                                         │
│ 判定: [✅ Approve 1] [✏️ Modified 2]    │
│       [❌ Reject 3]  [↩️ Reset 0]       │
└─────────────────────────────────────────┘
```

### 3.3 コンポーネント構成

```
src/dev-tools/exemplar-mapping/
├── ExemplarMappingPage.tsx          # ページコンポーネント (~150行)
├── ExemplarMappingPage.module.css   # スタイル
├── types.ts                         # レビュー固有の型
├── components/
│   ├── MappingCard.tsx              # 付箋情報 + exemplar候補リスト
│   ├── ExemplarCandidate.tsx        # 個別exemplar候補の表示・操作
│   └── ExemplarSearchModal.tsx      # exemplar追加用の検索モーダル
└── hooks/
    ├── useMappingData.ts            # JSON読み込み + exemplarデータ結合
    ├── useMappingReviewState.ts     # レビュー状態管理（JSON書き出し）
    └── useMappingKeyboardNav.ts     # キーボードナビ
```

### 3.4 状態管理

レビュー状態は **`note-exemplar-mappings.json` 自体を更新**する方式（localStorage不使用）。

理由:
- 23枚分のデータは小さい（数KB）
- git で差分管理できる
- セッションをまたいでも結果が残る
- 最終的に official-notes.ts に反映するので、ソースファイルに近い方が扱いやすい

ただし dev server から直接ファイル書き込みはできないため、以下の方式:
- **読み込み**: `fetch('/data/fusens/note-exemplar-mappings.json')` で public/ から読む
  - または `import` で src/data/ から静的読み込み
- **書き出し**: レビュー結果を localStorage に一時保存 + エクスポートボタンで JSON をダウンロード
  - ダウンロードした JSON を `src/data/fusens/note-exemplar-mappings.json` に手動配置
  - または CLI スクリプトで localStorage → JSON 変換

**簡易方式（推奨）**: localStorage に永続化（fusen-review と同パターン）+ エクスポート機能で JSON ダウンロード。
- 理由: dev server で直接ファイル書き込みは不可能。既存 dev-tools の実績あるパターンに合わせる方が安全。
- エクスポート JSON を Claude Code セッションで読み取り → official-notes.ts に反映。

### 3.5 キーボードショートカット

| キー | 機能 |
|------|------|
| j / → | 次の付箋 |
| k / ← | 前の付箋 |
| 1 | Approve（全候補承認） |
| 2 | Modified（変更あり） |
| 3 | Reject（全候補却下） |
| 0 | Reset |
| g | 次の未レビューへジャンプ |
| e | エクスポート（JSONダウンロード） |
| ? | ヘルプ表示 |

### 3.6 Exemplar追加機能

レビュー中に「この exemplar も紐付けたい」と思ったとき用:
- `[➕ Exemplar を追加]` ボタン → 検索モーダル
- 科目でフィルタ → テキスト検索（exemplar.text + minorCategory）
- 選択 → primary/secondary を指定して追加
- 手動追加分は `confidence: 1.0, reasoning: "手動追加"` として記録

## 4. official-notes.ts への反映

### 4.1 反映フロー

```
note-exemplar-mappings.json（レビュー済み）
  ↓ このセッション or スクリプトで変換
official-notes.ts の各ノートに exemplarIds: [...] を追加
```

### 4.2 反映ルール

- `reviewStatus === 'approved' || 'modified'` の mapping のみ反映
- 却下されていない match の `exemplarId` を配列で投入
- Primary を先頭に、Secondary を後ろに配置
- `linkedQuestionIds` は残す（フォールバック用）

### 4.3 変換例

```typescript
// Before
{
  id: 'on-001',
  title: 'SI基本単位',
  // ... other fields
  linkedQuestionIds: ['r100-001', 'r102-001', 'r104-001', 'r109-001'],
  // exemplarIds なし
}

// After
{
  id: 'on-001',
  title: 'SI基本単位',
  // ... other fields
  linkedQuestionIds: ['r100-001', 'r102-001', 'r104-001', 'r109-001'],
  exemplarIds: ['ex-physics-017', 'ex-physics-019'],  // ← 追加
}
```

## 5. バリデーション

### 5.1 追加ルール（data-validator）

| ルール名 | レベル | チェック内容 |
|---------|--------|------------|
| `note-exemplar-exists` | error | `exemplarIds` の各IDが `EXEMPLARS` に存在するか |
| `note-exemplar-subject-match` | warning | 付箋の `subject` と exemplar の `subject` が一致するか（cross-subject は warning） |
| `note-has-exemplars` | info | `exemplarIds` が未設定の付箋を報告 |

### 5.2 実装場所

- `src/utils/data-validator/rules/` に新規ルールファイル追加
- 既存の `validateAllQuestions()` パターンを踏襲

## 6. 設計判断の記録

| 判断 | 決定 | 理由 |
|------|------|------|
| マッチングAPI | Claude Codeセッション自身 | トークン余剰、最高精度、スクリプト不要 |
| 対象 | official-notes.ts 23枚 | キュレーション済みで精度検証しやすい |
| 中間形式 | JSON（reasoning付き） | 推論根拠の保存、やり直し可能 |
| レビューUI | 新規 `/dev-tools/exemplar-mapping` | fusen-review と関心分離 |
| レイアウト | 1カラム | シンプル、fusen-reviewパターン踏襲 |
| 状態保存 | localStorage + エクスポート | dev server 制約、既存パターン踏襲 |
| exemplarIds | OfficialNote に直接投入 | 型定義済み（`exemplarIds?: string[]`） |

## 7. スコープ外（将来タスク）

- fusens-master.json 177枚への横展開
- Supabase `official_note_exemplars` テーブル
- LearningLinkService の逆引きマップ実装
- 暗記カードテンプレートとの紐付け
- 2カラムレイアウトへの変更（1カラムで不便なら）

## GPT-5.4 レビュー対応記録

（レビュー後に記載）
