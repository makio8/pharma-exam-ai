# 全問データ品質バリデーター設計書

## 概要

4,140問（第100〜111回）の全問題データを自動チェックし、問題を検出・修正するシステム。
2つの部品から構成される：

- **🅰 バリデーター本体**: 38ルールで自動チェック → CLI出力 + Vitestテスト
- **🅱 レビューUI**: 左にPDF原本・右にレビューカードの比較ビュー + 修正機能

## 背景と動機

### 既知の品質問題

tier1-review-v4（78問サンプル）で発見済み：
- critical 14問（データ混入・シナリオ誤配置）
- 改善推奨 41問（画像クロップ不良等）

### 実機フィードバックで発見された追加パターン

| パターン | 例 | 原因 |
|---------|---|------|
| 選択肢テキスト切れ | 選択肢4が「γ」のみ（正: γ-アミノ酪酸GABAA受容体） | PDF抽出時のパース失敗 |
| 選択肢テキスト重複 | 「K+」「K+」「Na+」「Na+」「Ca2+」 | テーブル形式の選択肢が正しくパースされていない |
| 問題文へのテーブル混入 | 「チャネル活性化/チャネル遮断...」が問題文に連結 | PDF抽出時にテーブルがフラットテキスト化 |
| 問題文への選択肢混入 | 問題文末に「受容体」「-アミノ酪酸GABAA受容体」 | 選択肢が問題文に含まれてしまった |
| 「つ選べ」の数字欠損 | 「　つ選べ。」（「1つ選べ」のはず） | PDF抽出時の文字化け |
| 画像のみ選択肢 | 「1.」「2.」「3.」のみ | 構造式等が画像内にあり、テキスト不在 |

**これらは78問サンプルでは発見できなかった。全4,140問の網羅チェックが必要。**

## 🅰 バリデーター本体

### アーキテクチャ

```
src/utils/data-validator/
  index.ts              ← エントリポイント（全ルール実行 + レポート生成）
  rules/
    structural.ts       ← レベル① 構造チェック（13ルール）
    consistency.ts      ← レベル② 整合性チェック（10ルール）
    quality.ts          ← レベル③ 品質チェック（15ルール）
  types.ts              ← バリデーション結果の型定義

scripts/
  validate-data.ts      ← CLIエントリ（npm run validate）

src/__tests__/
  data-validation.test.ts ← Vitestテスト
```

### 型定義

```typescript
type Severity = 'error' | 'warning' | 'info'
// error   = 確実にバグ。ユーザーに影響する（表示崩壊・データ欠損）
// warning = 要目視確認。品質に影響する可能性がある
// info    = 改善推奨。なくても動くが直した方がよい

interface ValidationIssue {
  questionId: string        // "r110-001"
  rule: string              // "choice-text-duplicate"
  severity: Severity
  message: string           // 人間が読む日本語の説明
  field?: string            // 問題のあるフィールド名（"choices", "question_text" 等）
  expected?: unknown        // 期待値（JSON-serializable。UIで表示整形する）
  actual?: unknown          // 実際の値（JSON-serializable）
}

interface ValidationReport {
  timestamp: string         // ISO8601
  gitCommit: string         // レポート生成時のgitコミットハッシュ（整合性確認用）
  totalQuestions: number    // 4140
  passCount: number         // 問題なしの問題数
  issues: ValidationIssue[] // 全エラー・警告・info
  summary: Record<Severity, number>  // { error: 12, warning: 45, info: 120 }
  byYear: Record<number, { total: number; issues: number }>
  byRule: Record<string, number>     // ルールごとの検出数
}
```

### Questionの必須/任意フィールド定義

型定義 `Question` との整合性を明確化する（GPT-5.4指摘M2対応）：

| フィールド | 型上の定義 | バリデーション上の扱い |
|-----------|----------|-------------------|
| id | 必須 | error: 空チェック + 形式チェック |
| year | 必須 | error: 範囲チェック |
| question_number | 必須 | error: 範囲 + 重複チェック |
| section | 必須 | error: enum チェック |
| subject | 必須 | error: enum チェック |
| category | 必須 | warning: 空チェック（空でも表示は壊れない） |
| question_text | 必須 | error: 空チェック |
| choices | 必須 | error: 構造チェック |
| correct_answer | 必須 | error: 選択肢との整合 |
| explanation | 必須 | warning: 空/短文チェック（AI生成で空はないはずだが表示は壊れない） |
| tags | 必須（空配列OK） | なし |
| correct_rate | 任意 | error: 設定時は0-1範囲 |
| image_url | 任意 | warning: 設定時はファイル存在確認 |
| その他optional | 任意 | info: 推奨フィールド未設定 |

### チェックルール一覧（38ルール）

#### レベル① 構造チェック（13ルール）

| # | ルール名 | チェック内容 | 深刻度 |
|---|---------|-------------|--------|
| 1 | `id-format` | IDが `r{3桁}-{3桁}` 形式か | error |
| 2 | `id-year-match` | IDの年度部分とyearフィールドが一致するか | error |
| 3 | `id-qnum-match` | IDの問番部分とquestion_numberが一致するか | error |
| 4 | `year-range` | yearが100〜111の範囲内か | error |
| 5 | `required-fields` | question_text, choices, correct_answer, section, subjectが空でないか | error |
| 6 | `choices-valid` | 選択肢が1〜5個、key重複なし、key値が1-5範囲内か | error |
| 7 | `answer-in-choices` | correct_answerが選択肢のkeyに含まれるか | error |
| 8 | `section-enum` | sectionが「必須」「理論」「実践」のいずれかか | error |
| 9 | `subject-enum` | subjectが9科目のいずれかか | error |
| 10 | `id-unique` | 全問でIDが重複していないか | error |
| 11 | `qnum-unique-in-year` | 同一年度内でquestion_numberが重複していないか | error |
| 12 | `answer-format` | 単一選択問題はscalar、複数選択問題は昇順配列か | error |
| 13 | `answer-no-duplicate` | correct_answer配列内に重複がないか | error |

#### レベル② 整合性チェック（10ルール）

| # | ルール名 | チェック内容 | 深刻度 |
|---|---------|-------------|--------|
| 14 | `topic-map-exists` | QUESTION_TOPIC_MAPにエントリがあるか | warning |
| 15 | `topic-id-valid` | トピックIDがEXAM_BLUEPRINTに実在するか | error |
| 16 | `exemplar-map-exists` | QUESTION_EXEMPLAR_MAPにエントリがあるか | warning |
| 17 | `linked-group-format` | linked_groupが `r{3桁}-{3桁}-{3桁}` 形式か | error |
| 18 | `linked-group-complete` | linked_group内の全問が存在するか（歯抜け検出） | error |
| 19 | `linked-group-same-year` | linked_group内の全問が同一年度・同一区分か | error |
| 20 | `linked-scenario-shared` | linked_group内の全問が同一scenarioを持つか | warning |
| 21 | `note-question-exists` | 公式付箋が参照するquestionIdが実在するか | warning |
| 22 | `note-topic-valid` | 公式付箋のtopicIdがBLUEPRINTに実在するか | warning |
| 23 | `image-file-exists` | image_urlが設定されている場合、実ファイルが存在するか | warning |

#### レベル③ 品質チェック（15ルール）

| # | ルール名 | チェック内容 | 深刻度 |
|---|---------|-------------|--------|
| 24 | `question-text-length` | 問題文が極端に短い（<10文字）or長い（>2000文字）か | warning |
| 25 | `explanation-length` | 解説が極端に短い（<20文字）か | warning |
| 26 | `correct-rate-range` | correct_rateが0〜1の範囲か | error |
| 27 | `image-visual-type` | image_urlがある問題にvisual_content_typeが設定されているか | info |
| 28 | `text-contamination` | 問題文に「次の問題」「問XX」等の混入パターンがないか | warning |
| 29 | `choice-text-empty` | **choice_type が 'text' or 未設定** の選択肢でテキストが空文字でないか（画像/構造式選択肢は除外） | error |
| 30 | `duplicate-question-text` | 異なるIDで同一の問題文がないか（コピペミス検出） | warning |
| 31 | `choice-text-truncated` | 選択肢が極端に短い（≤2文字）のに **choice_typeがtextか未設定** | warning |
| 32 | `choice-text-duplicate` | 同一問題内で選択肢テキストが重複 | error |
| 33 | `question-text-table-leak` | 問題文に表データの繰り返しパターンが混入 | warning |
| 34 | `question-text-choice-leak` | 問題文末に選択肢テキストが混入（部分一致検出） | warning |
| 35 | `select-count-missing` | 「つ選べ」の前に数字がない | warning |
| 36 | `image-only-choices` | 全選択肢が番号のみなのにdisplay_mode_overrideが未設定 | info |
| 37 | `choice-count-mismatch` | 「Nつ選べ」のNとcorrect_answer配列長が不一致 | error |
| 38 | `display-mode-consistency` | display_mode_overrideとimage_url/choice_typeの整合 | info |

### CLI出力

```
$ npm run validate

📊 データ品質レポート（4,140問）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 構造チェック     4,128 / 4,140  (99.7%)
⚠️  整合性チェック   4,095 / 4,140  (98.9%)
💡 品質チェック      4,020 / 4,140  (97.1%)

❌ error:   12件
⚠️  warning: 45件
💡 info:    120件

年度別:
  100回: ⬛⬛⬛⬛⬛⬛⬛⬛⬛░  3件
  101回: ⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛  0件
  ...
  110回: ⬛⬛⬛⬛⬛⬛⬛░░░  9件

📁 詳細: reports/validation-report.json
```

出力先:
- ターミナル: 色付きサマリー（上記）
- JSON: `reports/validation-report.json`（レビューUIが読み込む）

### Vitestテスト

```typescript
// src/__tests__/data-validation.test.ts
describe('データ品質チェック', () => {
  describe('レベル①: 構造チェック', () => {
    // 各ルールに対して3種のテスト:
    // 1. 正常系: 正しいデータでエラーが出ないこと
    // 2. 異常系: 問題のあるデータでエラーが出ること
    // 3. 誤検知防止: 正常だが境界的なケースでエラーが出ないこと
    //    例: choice-text-empty は choice_type='image' で text='' を許容すること
    it('全問のIDが r{3桁}-{3桁} 形式であること')
    it('不正ID "r10-1" がerrorになること')
    it('全問のIDが重複していないこと')
    it('correct_answerが選択肢keyに含まれること')
    // ...
  })
  describe('レベル②: 整合性チェック', () => { ... })
  describe('レベル③: 品質チェック', () => {
    // 誤検知防止が特に重要なルール
    it('choice_type="image" の選択肢で text="" はエラーにならないこと')
    it('choice_type="structural_formula" の選択肢で text="" はエラーにならないこと')
    // ...
  })

  // 実データ回帰テスト: 既知のNG問題が検出されること
  describe('回帰テスト: tier1-review既知問題', () => {
    it('r104-220 がtext-contaminationで検出されること')
    it('r106-093 がtext-contaminationで検出されること')
  })

  // severity=error のルールはテスト失敗にする
  // severity=warning/info はテストパスだが件数をレポート
})
```

## 🅱 レビューUI

### アーキテクチャ（Vite統合型）

```
src/dev-tools/
  review/
    ReviewPage.tsx          ← メインページ（ルーティング: /dev-tools/review）
    components/
      ReviewHeader.tsx      ← フィルタ・進捗・キーボード操作ヘルプ
      ReviewCard.tsx        ← 問題レビューカード（右側）
      PdfViewer.tsx         ← PDF表示パネル（左側）
      CorrectionPanel.tsx   ← 修正入力パネル
      PdfCropper.tsx        ← PDF画像クロップ機能
      ProgressBar.tsx       ← 判定進捗バー
    hooks/
      useValidationReport.ts  ← レポートJSON読み込み
      useReviewState.ts       ← 判定状態管理（localStorage）
      useKeyboardNav.ts       ← キーボードショートカット
      usePdfNavigation.ts     ← PDF年度・ページ管理
    types.ts
```

### Vite設定（GPT-5.4指摘H3対応: ビルド除外の安全な方式）

```typescript
// vite.config.ts への追加
{
  server: {
    fs: {
      // 絶対パスで指定（環境依存を防ぐ）
      allow: [path.resolve(__dirname, 'data/pdfs')]
    }
  }
}

// ルーティング側での分岐（src/App.tsx）
// rollupOptions.external ではなく、import.meta.env.DEV で分岐する
const DevToolsReview = import.meta.env.DEV
  ? lazy(() => import('./dev-tools/review/ReviewPage'))
  : null

// ルート登録
{import.meta.env.DEV && (
  <Route path="/dev-tools/review" element={
    <Suspense fallback={<div>Loading...</div>}>
      <DevToolsReview />
    </Suspense>
  } />
)}
```

この方式なら:
- 本番ビルドでは `import()` 自体が発行されないため、dev-tools コードはバンドルに含まれない
- `rollupOptions.external` の不完全な除外リスクがない
- pdf.js の worker ファイルは dev-tools 内で `import('pdfjs-dist/build/pdf.worker.mjs')` するため、本番に混入しない

### レイアウト

```
┌──────────────────────────────────────────────────────────┐
│  📊 進捗: ✅ 23  ⚠️ 45  ❌ 12  未判定: 4060              │
│  フィルタ: [全問|エラーのみ|警告のみ|未判定] 年度:[▼100]   │
│  ショートカット: [?] で表示                               │
│  ████████░░░░░░░░░░░░░░░░░░░░░ 2%                       │
├────────────────────────┬─────────────────────────────────┤
│                        │                                 │
│   📄 厚労省PDF          │   🔍 レビューカード              │
│                        │                                 │
│   第110回 必須          │   r110-001  物理  必須           │
│   ◀ Page 3/24 ▶        │   ❌ choice-text-duplicate       │
│                        │   ⚠️ question-text-table-leak    │
│   ┌────────────────┐   │                                 │
│   │                │   │   問題文:                        │
│   │   PDF原本      │   │   「テトラカインの局所…」         │
│   │   ページ画像    │   │                                 │
│   │                │   │   選択肢:                        │
│   │   ☝️ クロップ   │   │   1: K+  ← ⚠️                  │
│   │   ドラッグ可    │   │   2: K+  ← ❌ 重複              │
│   │                │   │   ...                           │
│   └────────────────┘   │                                 │
│                        │   アプリ表示プレビュー:           │
│                        │   ┌───────────────────┐         │
│                        │   │  (実際のアプリ表示) │         │
│                        │   └───────────────────┘         │
│                        │                                 │
│                        │   判定: [✅OK] [⚠️要修正] [❌NG]  │
│                        │   修正: [📋テキスト] [✂️画像]     │
│                        │                                 │
├────────────────────────┴─────────────────────────────────┤
│  ← 前の問題 (K)    r110-001  問1/345    次の問題 (J) →    │
└──────────────────────────────────────────────────────────┘
```

### レビュー順序の設計

**原則: 年度×区分×問番の昇順で、PDFの行き来を最小化する**

```
第100回 必須 (問1-90)     → PDF: q100-hissu.pdf
第100回 理論 (問91-195)   → PDF: q100-riron.pdf (→ riron2.pdf等に自動切替)
第100回 実践 (問196-345)  → PDF: q100-jissen.pdf (→ jissen2/3等に自動切替)
第101回 必須 ...
...
第111回 実践 ...
```

- デフォルト表示順: 年度昇順 → 区分（必須→理論→実践）→ 問番昇順
- PDFは区分が変わった時だけ自動切り替え
- 問番が進むにつれてPDFページも順方向に進むので、戻りが発生しない
- フィルタ「エラーのみ」にしても、同じソート順を維持

### フィルタ機能

| フィルタ | 説明 | デフォルト |
|---------|------|---------|
| 深刻度 | error / warning / info / 全問 | error |
| 年度 | 100〜111、複数選択可 | 全年度 |
| 区分 | 必須 / 理論 / 実践 | 全区分 |
| 判定状態 | 未判定 / OK / 要修正 / NG | 未判定 |
| ルール | 特定ルールで絞り込み | 全ルール |

追加UX（GPT-5.4指摘L1対応）:
- 「次の未解決issueへジャンプ」ボタン（`G` キー）
- フィルタプリセット保存機能（よく使う組み合わせをワンクリックで呼び出し）

### キーボードショートカット

| キー | 操作 |
|------|------|
| `J` / `→` | 次の問題 |
| `K` / `←` | 前の問題 |
| `1` | 判定: ✅ OK |
| `2` | 判定: ⚠️ 要修正 |
| `3` | 判定: ❌ NG |
| `0` | 判定リセット |
| `F` | フィルタパネル開閉 |
| `C` | 修正パネル開閉 |
| `S` | スキップ（判定せず次へ） |
| `G` | 次の未解決issueへジャンプ |
| `E` | エクスポート（結果JSON出力） |
| `P` / `N` | PDFページ 前/次 |
| `/` | 問題ID検索 |
| `?` | ショートカットヘルプ |

### 判定状態の管理（GPT-5.4指摘M4, M6対応）

```typescript
// localStorage キー: 'data-quality-review-v1'

// 判定と修正のライフサイクルを分離
type JudgmentStatus = 'ok' | 'needs-fix' | 'ng'
type CorrectionStatus = 'draft' | 'ready' | 'applied' | 'verified'

interface ReviewState {
  version: 1                        // スキーマバージョン（マイグレーション用）
  updatedAt: string                 // ISO8601
  reportGitCommit: string           // どのバリデーションレポートに対するレビューか
  judgments: Record<string, JudgmentStatus>
  correctionStatuses: Record<string, CorrectionStatus>
  lastPosition: string              // 最後に見ていた問題ID（セッション復元用）
  confirmedPdfPages: Record<string, number>  // 確定済みPDFページ番号（手動確認結果を保存）
  savedFilters?: FilterPreset[]     // 保存済みフィルタプリセット
}

interface FilterPreset {
  name: string
  filters: FilterConfig
}
```

ライフサイクル:
```
未判定 → [OK] → ok（完了）
未判定 → [要修正] → needs-fix → correction入力 → draft → [確定] → ready
        → apply-corrections.ts 実行 → applied → [再検証] → verified
未判定 → [NG] → ng（修正不可能。元データの根本修正が必要）
```

### 修正機能（corrections.json）

#### 修正パターン（GPT-5.4指摘H4, H5対応: 型安全な設計）

```typescript
import type { Choice, QuestionSection, QuestionSubject, VisualContentType } from '../types/question'

// field-set の代わりに、修正可能フィールドを列挙型で限定する
type Correction =
  | { type: 'text'; field: 'question_text' | 'explanation' | 'category'; value: string }
  | { type: 'choices'; value: Choice[] }  // Choice型全体（choice_type, semantic_labels含む）
  | { type: 'answer'; value: number | number[] }
  | { type: 'image-crop'; crop: PdfCropRect; pdfFile: string; pdfPage: number }
  | { type: 'image-remove' }  // image_urlを削除（テキストのみ問題）
  | { type: 'set-section'; value: QuestionSection }
  | { type: 'set-subject'; value: QuestionSubject }
  | { type: 'set-visual-content-type'; value: VisualContentType }
  | { type: 'set-display-mode'; value: 'text' | 'image' | 'both' }
  | { type: 'set-linked-group'; value: string }
  | { type: 'set-linked-scenario'; value: string }

// GPT-5.4指摘H7対応: クロップ座標にviewport情報を含める
interface PdfCropRect {
  x: number              // 0.0-1.0（PDF座標系での相対値）
  y: number
  w: number
  h: number
  viewportWidth: number   // pdf.jsのviewport.width（再現用）
  viewportHeight: number  // pdf.jsのviewport.height（再現用）
  scale: number           // pdf.jsのレンダリングスケール
  rotation: 0 | 90 | 180 | 270  // PDFページの回転角
}

// GPT-5.4指摘H6対応: バージョン整合性を保証する
interface CorrectionsFile {
  version: string               // "1.0.0"
  timestamp: string             // ISO8601
  baseGitCommit: string         // corrections作成時のgitコミットハッシュ
  reportTimestamp: string       // 元になったvalidation-report.jsonのtimestamp
  corrections: Record<string, {
    dataHash: string            // 修正対象の問題データのハッシュ（変更検出用）
    items: Correction[]
  }>
}
```

`apply-corrections.ts` は適用前に以下を検証：
1. `baseGitCommit` が現在のHEADの祖先であること（元データが巻き戻っていない）
2. 各問題の `dataHash` が現在のデータと一致すること（他の修正で変わっていない）
3. 不一致の場合は警告を出し、`--force` フラグなしでは適用を中断

#### PDF側のクロップ操作フロー

1. 修正パネルで「✂️ 画像修正」を選択
2. PDF表示パネルがクロップモードに切り替わる
3. マウスドラッグで範囲を指定（前回tier1-reviewと同じUI）
4. Canvasにクロップ結果をプレビュー表示
5. 「保存」でcorrections.jsonに座標 + PDFファイル名 + ページ番号 + viewport情報を記録
6. 「やり直し」で範囲指定をリセット

#### 反映スクリプト

```
scripts/apply-corrections.ts

入力: corrections.json
前処理:
  1. baseGitCommit の祖先チェック
  2. 各問題の dataHash 一致確認（不一致は警告 → --force で無視可）
処理:
  - type: 'text' / 'choices' / 'answer' → exam-{year}.ts のデータを書き換え
  - type: 'image-crop' → PDFから再クロップ（viewport情報で正確な座標復元）
    → /public/images/questions/{year}/qXXX.png を上書き
  - type: 'image-remove' → Question.image_url を undefined に
  - type: 'set-*' → 対応フィールドの値を設定
出力: 修正済みデータファイル + 適用ログ + 適用後の自動バリデーション再実行
```

### PDFビューア実装

pdf.js を使用してブラウザ内でPDFをレンダリング:

```typescript
// PdfViewer.tsx の主要ロジック
// - Viteのdev serverが data/pdfs/ を静的配信
// - 年度 + 区分（section）+ 問番 → PDFファイルを自動選択
// - ページ送り（P/N キー）でPDF内を移動
// - 確定済みページ番号は ReviewState.confirmedPdfPages に保存（次回自動復元）
// - クロップモード時はCanvas overlayでドラッグ選択UI
// - pdf.js worker は dynamic import で dev-tools 内に閉じ込める
```

PDFファイル選択ロジック（GPT-5.4指摘H2対応: 分割PDF対応）:
```typescript
// 年度×区分→PDFファイル(s)のマスタマッピング
// getPdfFile() の単純ロジックではなく、実際のファイル構成に基づくマッピングテーブル
const PDF_FILE_MAP: Record<string, string[]> = {
  '100-必須': ['q100-hissu.pdf'],
  '100-理論': ['q100-riron.pdf'],
  '100-実践': ['q100-jissen.pdf'],
  // ...
  '104-理論': ['q104-riron1.pdf', 'q104-riron2.pdf'],  // 分割
  '104-実践': ['q104-jissen1.pdf', 'q104-jissen2.pdf', 'q104-jissen3.pdf'],
  // ...
}

function getPdfFiles(year: number, section: QuestionSection): string[] {
  return PDF_FILE_MAP[`${year}-${section}`] ?? []
}

// UIでは複数PDFがある場合にタブ or ドロップダウンで切替
// 問番の範囲で「おそらくこのPDF」を推定して初期表示
```

ページ推定とキャッシュ（GPT-5.4指摘M5対応）:
```typescript
// 初回は問番から按分推定（不正確だがスタート地点として有用）
function estimatePage(questionNumber: number, section: QuestionSection, totalPages: number): number {
  const sectionRanges = { '必須': [1, 90], '理論': [91, 195], '実践': [196, 345] }
  const [start, end] = sectionRanges[section]
  const position = (questionNumber - start) / (end - start)
  return Math.max(1, Math.round(position * totalPages))
}

// ユーザーが手動でページを確定したら confirmedPdfPages に保存
// 次回同じ問題を表示する時は保存済みページを使用
// 隣接問題のページも推定精度が上がる（確定ページからの差分計算）
```

## GPT-5.4 レビュー対応記録

| # | 深刻度 | 指摘 | 対応 |
|---|--------|------|------|
| H1 | high | choice-text-emptyが画像選択肢を誤検出 | ルール29,31にchoice_type条件を追加 |
| H2 | high | getPdfFile()が分割PDFに対応できない | PDF_FILE_MAPマスタテーブル方式に変更 |
| H3 | high | Viteビルド除外が不安全 | import.meta.env.DEV + lazy import方式に変更 |
| H4 | high | field-setの型がunknown | 列挙型の個別set-*型に分離 |
| H5 | high | choices修正がChoice型全体を保持できない | Choice[]型を使用 |
| H6 | high | corrections.jsonにバージョン整合性なし | baseGitCommit + dataHash追加 |
| H7 | high | PDFクロップ座標にviewport情報不足 | PdfCropRect型にviewport/scale/rotation追加 |
| M1 | medium | ルール追加候補 | 6ルール追加（計38ルール） |
| M2 | medium | required-fieldsと型の必須/任意が不一致 | 必須/任意テーブルを明確化 |
| M3 | medium | expected/actualがstring固定 | unknown型に変更 |
| M4 | medium | ReviewStateにバージョニングなし | version, updatedAt, reportGitCommit追加 |
| M5 | medium | PDFページ推定が不正確 | confirmedPdfPages + 隣接推定ロジック追加 |
| M6 | medium | 判定と修正のライフサイクルが曖昧 | draft/ready/applied/verifiedステート追加 |
| M7 | medium | Vitestテストが薄い | 3種テスト(正常/異常/誤検知防止) + 回帰テスト追加 |
| L1 | low | フィルタのデフォルトが制限的 | ジャンプ機能 + プリセット保存追加 |
| L2 | low | fs.allowパスとworker設定未記載 | 絶対パス + dynamic import記載 |

## 将来拡張（今回のスコープ外）

以下はこのセッションでは作らない。設計だけ記録：

### 🅲 ユーザー報告フォーム
- アプリ内QuestionPageに「バグ報告」ボタンを設置
- 問題ID + カテゴリ（テキスト誤り / 画像不良 / 正答誤り / その他）+ 自由コメント
- ベータ期間（1ヶ月）のみ表示
- 報告先: Google Forms or Supabase テーブル

### 🅳 AI駆動の自動修正パイプライン
- ユーザー報告 → corrections.json 形式に変換
- AIエージェントがPDF原本を参照して修正案を生成
- 人間が修正案をレビュー → 承認 → apply-corrections.ts で反映
- CI/CDパイプラインに組み込んで自動化

## 成功基準

1. 全4,140問に対して38ルールのバリデーションが完走すること
2. `npm run validate` で1分以内にレポートが出力されること
3. Vitestテストで severity=error の問題が0件になること（修正完了後）
4. レビューUIでPDF原本と並べてエラー問題を確認・修正できること
5. corrections.json → apply-corrections.ts で修正が正しく反映されること
6. corrections.json 適用前にバージョン整合性チェックが通ること
