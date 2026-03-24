# 全問データ品質バリデーター設計書

## 概要

4,140問（第100〜111回）の全問題データを自動チェックし、問題を検出・修正するシステム。
2つの部品から構成される：

- **🅰 バリデーター本体**: 32ルールで自動チェック → CLI出力 + Vitestテスト
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
    structural.ts       ← レベル① 構造チェック（10ルール）
    consistency.ts      ← レベル② 整合性チェック（8ルール）
    quality.ts          ← レベル③ 品質チェック（14ルール）
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
  expected?: string         // 期待値（あれば）
  actual?: string           // 実際の値（あれば）
}

interface ValidationReport {
  timestamp: string         // ISO8601
  totalQuestions: number    // 4140
  passCount: number         // 問題なしの問題数
  issues: ValidationIssue[] // 全エラー・警告・info
  summary: Record<Severity, number>  // { error: 12, warning: 45, info: 120 }
  byYear: Record<number, { total: number; issues: number }>
  byRule: Record<string, number>     // ルールごとの検出数
}
```

### チェックルール一覧（32ルール）

#### レベル① 構造チェック（10ルール）

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

#### レベル② 整合性チェック（8ルール）

| # | ルール名 | チェック内容 | 深刻度 |
|---|---------|-------------|--------|
| 11 | `topic-map-exists` | QUESTION_TOPIC_MAPにエントリがあるか | warning |
| 12 | `topic-id-valid` | トピックIDがEXAM_BLUEPRINTに実在するか | error |
| 13 | `exemplar-map-exists` | QUESTION_EXEMPLAR_MAPにエントリがあるか | warning |
| 14 | `linked-group-format` | linked_groupが `r{3桁}-{3桁}-{3桁}` 形式か | error |
| 15 | `linked-group-complete` | linked_group内の全問が存在するか（歯抜け検出） | error |
| 16 | `linked-scenario-shared` | linked_group内の全問が同一scenarioを持つか | warning |
| 17 | `note-question-exists` | 公式付箋が参照するquestionIdが実在するか | warning |
| 18 | `note-topic-valid` | 公式付箋のtopicIdがBLUEPRINTに実在するか | warning |

#### レベル③ 品質チェック（14ルール）

| # | ルール名 | チェック内容 | 深刻度 |
|---|---------|-------------|--------|
| 19 | `question-text-length` | 問題文が極端に短い（<10文字）or長い（>2000文字）か | warning |
| 20 | `explanation-length` | 解説が極端に短い（<20文字）か | warning |
| 21 | `correct-rate-range` | correct_rateが0〜1の範囲か | error |
| 22 | `image-visual-type` | image_urlがある問題にvisual_content_typeが設定されているか | info |
| 23 | `text-contamination` | 問題文に「次の問題」「問XX」等の混入パターンがないか | warning |
| 24 | `choice-text-empty` | 選択肢テキストが空文字でないか | error |
| 25 | `duplicate-question-text` | 異なるIDで同一の問題文がないか（コピペミス検出） | warning |
| 26 | `choice-text-truncated` | 選択肢が極端に短い（≤2文字）のにchoice_typeがtextか未設定 | warning |
| 27 | `choice-text-duplicate` | 同一問題内で選択肢テキストが重複 | error |
| 28 | `question-text-table-leak` | 問題文に表データの繰り返しパターンが混入 | warning |
| 29 | `question-text-choice-leak` | 問題文末に選択肢テキストが混入（部分一致検出） | warning |
| 30 | `select-count-missing` | 「つ選べ」の前に数字がない | warning |
| 31 | `image-only-choices` | 全選択肢が番号のみなのにdisplay_mode_overrideが未設定 | info |
| 32 | `choice-count-mismatch` | 「Nつ選べ」のNとcorrect_answer配列長が不一致 | error |

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
    it('全問のIDが r{3桁}-{3桁} 形式であること')
    it('全問のIDが重複していないこと')
    it('correct_answerが選択肢keyに含まれること')
    // ... 各ルールに1テスト
  })
  describe('レベル②: 整合性チェック', () => { ... })
  describe('レベル③: 品質チェック', () => { ... })

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

### Vite設定

```typescript
// vite.config.ts への追加
{
  server: {
    fs: {
      allow: ['data/pdfs']  // PDFファイルへのアクセスを許可
    }
  },
  build: {
    rollupOptions: {
      // dev-tools/ はプロダクションビルドから除外
      external: (id) => id.includes('dev-tools')
    }
  }
}
```

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
第100回 理論 (問91-195)   → PDF: q100-riron.pdf
第100回 実践 (問196-345)  → PDF: q100-jissen.pdf
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
| `E` | エクスポート（結果JSON出力） |
| `P` / `N` | PDFページ 前/次 |
| `/` | 問題ID検索 |
| `?` | ショートカットヘルプ |

### 判定状態の管理

```typescript
// localStorage キー: 'data-quality-review-v1'
interface ReviewState {
  judgments: Record<string, 'ok' | 'needs-fix' | 'ng'>
  corrections: Record<string, Correction[]>
  lastPosition: string  // 最後に見ていた問題ID（セッション復元用）
}
```

### 修正機能（corrections.json）

#### 3つの修正パターン

```typescript
type Correction =
  | { type: 'text'; field: 'question_text' | 'explanation' | 'category'; value: string }
  | { type: 'choices'; value: Array<{ key: number; text: string }> }
  | { type: 'answer'; value: number | number[] }
  | { type: 'image-crop'; crop: CropRect; pdfFile: string; pdfPage: number }
  | { type: 'image-remove' }  // image_urlを削除（テキストのみ問題）
  | { type: 'field-set'; field: string; value: unknown }  // 任意フィールド設定

interface CropRect {
  x: number  // 0.0-1.0（相対座標）
  y: number
  w: number
  h: number
}

// corrections.json の構造
interface CorrectionsFile {
  version: string
  timestamp: string
  corrections: Record<string, Correction[]>  // questionId → 修正配列
}
```

#### PDF側のクロップ操作フロー

1. 修正パネルで「✂️ 画像修正」を選択
2. PDF表示パネルがクロップモードに切り替わる
3. マウスドラッグで範囲を指定（前回tier1-reviewと同じUI）
4. Canvasにクロップ結果をプレビュー表示
5. 「保存」でcorrections.jsonに座標 + PDFファイル名 + ページ番号を記録
6. 「やり直し」で範囲指定をリセット

#### 反映スクリプト

```
scripts/apply-corrections.ts

入力: corrections.json
処理:
  - type: 'text' / 'choices' / 'answer' → exam-{year}.ts のデータを書き換え
  - type: 'image-crop' → PDFから再クロップして /public/images/questions/{year}/qXXX.png を上書き
  - type: 'image-remove' → Question.image_url を undefined に
  - type: 'field-set' → 任意フィールドの値を設定
出力: 修正済みデータファイル + 適用ログ
```

### PDFビューア実装

pdf.js を使用してブラウザ内でPDFをレンダリング:

```typescript
// PdfViewer.tsx の主要ロジック
// - Viteのdev serverが data/pdfs/ を静的配信
// - 年度 + 区分（section）→ PDFファイルを自動選択
// - 問番からおおよそのページ番号を推定（区分内問題数 / PDF総ページ数）
// - ページ送り（P/N キー）でPDF内を移動
// - クロップモード時はCanvas overlayでドラッグ選択UI
```

PDFファイル選択ロジック:
```typescript
function getPdfFile(year: number, section: QuestionSection): string {
  const sectionMap = { '必須': 'hissu', '理論': 'riron', '実践': 'jissen' }
  // 理論・実践は複数ファイルに分割されている年度あり
  // 例: q104-riron1.pdf, q104-riron2.pdf
  return `q${year}-${sectionMap[section]}.pdf`
}
```

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

1. 全4,140問に対して32ルールのバリデーションが完走すること
2. `npm run validate` で1分以内にレポートが出力されること
3. Vitestテストで severity=error の問題が0件になること（修正完了後）
4. レビューUIでPDF原本と並べてエラー問題を確認・修正できること
5. corrections.json → apply-corrections.ts で修正が正しく反映されること
