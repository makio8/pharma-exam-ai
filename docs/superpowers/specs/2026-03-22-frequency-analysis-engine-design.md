# 頻出度分析エンジン設計書

**日付**: 2026-03-22
**ステータス**: 承認済み
**前提**: exemplar mapping v3 完了（966例示 × 4,140問 × 12年度）

## 背景と目的

薬剤師国家試験の出題は偏りが大きく、正答率60%以上の頻出分野を確実に押さえることが合格の鍵。
本エンジンは例示（Exemplar）単位の出題頻度を定量化し、「基礎を固めまくるアプリ」の学習優先度判断に使うデータ基盤を構築する。

## 設計方針

- MVP ファースト：まずスクリプトでCSV出力 → 人間が確認 → OKならTS定数化
- 各ステップにレビューゲート（承認なしにデータ更新しない）
- 実行順序：1 → 2 → 3 → 4（後続は前段の結果に依存）

---

## セクション1：ExemplarStats 計算エンジン

### 入力
- `src/data/exemplars.ts`（966件）
- `src/data/question-exemplar-map.ts`（4,385件）

### 出力型（既存ExemplarStatsを拡張）

```typescript
interface ExemplarStats {
  exemplarId: string
  subject: QuestionSubject
  // 全体
  yearsAppeared: number          // 出題年度数（0-12）
  totalQuestions: number         // 合計問題数
  yearDetails: { year: number; count: number }[]
  // primary/secondary 内訳
  primaryQuestions: number       // primary マッピングのみの問題数
  secondaryQuestions: number     // secondary マッピングのみの問題数
  primaryYearsAppeared: number   // primary で出題された年度数
  // 派生指標
  avgQuestionsPerYear: number   // 出題年あたりの平均問題数（yearsAppeared=0なら0）
}
```

### 計算ロジック
1. マッピングを `exemplarId` でグループ化
2. 各グループを `isPrimary` で分割してカウント
3. `yearDetails` は全マッピング（primary + secondary）から年度別集計
4. 未使用例示は `totalQuestions: 0` で全966件を出力対象に含める
5. `avgQuestionsPerYear = yearsAppeared > 0 ? totalQuestions / yearsAppeared : 0`

### 成果物
- `scripts/compute-exemplar-stats.ts` — 統計計算スクリプト
- `src/data/exemplar-stats.ts` — アプリで使うTS定数

---

## セクション2：粗い例示の分割

### 対象（30問以上の6件）

| ID | 問題数 | 内容 |
|---|---|---|
| ex-practice-043 | 137 | 服薬指導・患者教育 |
| ex-practice-045 | 48 | 製剤の取扱い説明（吸入剤・自己注射等） |
| ex-practice-087 | 38 | 副作用の症状・検査所見評価 |
| ex-pharmacology-067 | 36 | 抗悪性腫瘍薬の薬理 |
| ex-practice-074 | 32 | 適切な処方の提案 |
| ex-practice-082 | 30 | 副作用モニタリング |

### アプローチ
1. **データ抽出** — 対象問題の `question_text` + `explanation` + `question_concepts` を収集しCSV出力
2. **キーワード分析** — 疾患名・薬効群・対象患者・剤形などを自動抽出し、自然なクラスタ案を生成
3. **レビューゲート** — 6件すべての分割案をまとめてユーザーに提示。承認後にデータ更新
4. **データ更新** — `exemplars.ts` に新サブ例示を追加、`question-exemplar-map.ts` を振り替え

### 命名規則
`ex-practice-043a`, `ex-practice-043b`, ...（既存IDに接尾辞）

### 上限ガイドライン
- 137問の ex-practice-043 → 最大15サブカテゴリ
- 30〜48問の他5件 → 最大5〜8サブカテゴリ
- 自然なクラスタが上限を超えたら類似を統合

### 旧IDの扱い
削除して新IDに完全移行（エイリアスは作らない）

### 成果物
- `scripts/analyze-split-candidates.ts` — 分割候補分析スクリプト
- `scripts/output/split-candidates/` — 分析結果CSV

---

## セクション3：未使用例示のマッピング漏れ検出

### 目的
199件の未使用例示が「本当に出題されていない」のか「マッピング漏れ」なのかを判別する。

### 類似度計算

| マッチ対象 | 重み |
|---|---|
| `question_text` | 1x |
| `explanation` | 1x |
| `question_concepts` | **2x**（専門用語が凝縮されているため） |
| `semantic_labels`（選択肢） | 1x |

- 例示の `text` からキーワード抽出
- 問題の上記4フィールドを結合したテキストと照合
- スコア = 重み付き一致キーワード数 / 例示のキーワード総数

### Vision AI抽出データの活用
- `question_concepts` には構造式・グラフの概念キーワードが含まれている（Vision AI統合済み）
- 画像問題（`visual_content_type: structural_formula` 等）でも `question_concepts` 経由で検出可能
- `semantic_labels` で選択肢の画像内容もテキストマッチ可能

### 出力フォーマット（CSV）

```
exemplarId, exemplarText, questionId, questionText, score, matchedKeywords
ex-biology-002, エンドサイトーシスと..., r105-032, 細胞膜を介した..., 0.8, エンドサイトーシス;エキソサイトーシス
```

### フロー
1. スクリプトが候補ペアをCSV出力
2. ユーザーが確認・承認
3. 承認されたペアを `question-exemplar-map.ts` に追加

### 成果物
- `scripts/detect-mapping-gaps.ts` — 漏れ検出スクリプト
- `scripts/output/mapping-gap-candidates.csv` — 候補ペア

---

## セクション4：ヒートマップデータ生成

### データ構造

```typescript
interface HeatmapCell {
  subject: QuestionSubject
  exemplarId: string
  year: number
  count: number           // その年度の出題数
  primaryCount: number    // うちprimary
}

interface HeatmapData {
  cells: HeatmapCell[]
  bySubjectYear: Record<QuestionSubject, Record<number, number>>  // 科目×年度の合計
  byExemplarYear: Record<string, Record<number, number>>          // 例示×年度の合計
}
```

### 出力
1. **CSV（探索用）**
   - `scripts/output/heatmap-subject-year.csv` — 科目×年度クロス集計
   - `scripts/output/heatmap-exemplar-year.csv` — 例示×年度クロス集計（966行×12列）
2. **TS定数（アプリ用）**
   - `src/data/heatmap-data.ts`

### 生成タイミング
- セクション2の分割 + セクション3の漏れ修正が完了した後に実行
- 最終的なマッピングデータで生成する

### 成果物
- `scripts/generate-heatmap-data.ts` — ヒートマップ生成スクリプト

---

## 依存関係

```
セクション1（Stats計算）
    → セクション2（分割）  ※Stats結果で分割対象を確認
        → セクション3（漏れ検出）  ※分割後のIDでマッチング
            → セクション4（ヒートマップ）  ※最終マッピングで生成
```

## スクリプト構成

```
scripts/
├── compute-exemplar-stats.ts      # セクション1
├── analyze-split-candidates.ts    # セクション2
├── detect-mapping-gaps.ts         # セクション3
├── generate-heatmap-data.ts       # セクション4
└── output/
    ├── split-candidates/          # セクション2の分析結果
    ├── mapping-gap-candidates.csv # セクション3の候補ペア
    ├── heatmap-subject-year.csv   # セクション4
    └── heatmap-exemplar-year.csv  # セクション4
```

## スコープ外（次回セッション以降）
- 分析タブUIの実装（ヒートマップ表示・フィルタリング）
- 画像問題の直接的なVision AI再分析（今回はquestion_conceptsで間接検出）
- 20〜29問の例示の分割検討
