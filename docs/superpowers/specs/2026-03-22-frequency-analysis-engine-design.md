# 頻出度分析エンジン設計書

**日付**: 2026-03-22
**ステータス**: 承認済み（GPT-5.4レビュー反映済み v2）
**前提**: exemplar mapping v3 完了（966例示 × 4,140問 × 12年度）

## 背景と目的

薬剤師国家試験の出題は偏りが大きく、正答率60%以上の頻出分野を確実に押さえることが合格の鍵。
本エンジンは例示（Exemplar）単位の出題頻度を定量化し、「基礎を固めまくるアプリ」の学習優先度判断に使うデータ基盤を構築する。

> **将来拡張メモ**: 学習優先度 = 頻出度 × 正答率の統合は次フェーズ。本設計は頻度データのみをスコープとする。

## 設計方針

- MVP ファースト：まずスクリプトでCSV出力 → 人間が確認 → OKならTS定数化
- 各ステップにレビューゲート（承認なしにデータ更新しない）
- 実行順序：1 → 2 → 3 → **1再計算** → 4（分割・漏れ修正後にStats再生成）
- スクリプトは1パスで `Map` を構築する（`filter` の繰返し呼び出しを避ける）

## 共通：入力データソース

| データ | ファイル | 読み込み方法 |
|--------|---------|-------------|
| 例示マスタ | `src/data/exemplars.ts` → `EXEMPLARS` | 直接import |
| マッピング | `src/data/question-exemplar-map.ts` → `QUESTION_EXEMPLAR_MAP` | 直接import |
| 全問題 | `src/data/all-questions.ts` → `ALL_QUESTIONS` | 直接import（`question_text`, `explanation`, `question_concepts`, `semantic_labels` を使用） |

## 共通：データ検証ゲート（全スクリプト共通）

各スクリプト実行前に以下を自動検証し、1つでも失敗したらエラー終了する：

1. 各 questionId に primary マッピングがちょうど1件存在すること
2. マッピングの参照先 exemplarId が `EXEMPLARS` に存在すること
3. 同一 (questionId, exemplarId) ペアが重複しないこと
4. 未使用例示数が前回実行時と大きく乖離していないこと（±10%以内）

成果物: `scripts/validate-data-integrity.ts`（共通バリデータ）

---

## セクション1：ExemplarStats 計算エンジン

### 入力
- `EXEMPLARS`（966件）
- `QUESTION_EXEMPLAR_MAP`（4,385件）
- `ALL_QUESTIONS`（連問判定用に `linked_group` を参照）

### 出力型（既存 `blueprint.ts` の `ExemplarStats` を上書き拡張）

```typescript
interface ExemplarStats {
  exemplarId: string
  subject: QuestionSubject
  // 全体（マッピング件数ベース）
  yearsAppeared: number          // 出題年度数（0-12）
  totalQuestions: number         // マッピング件数の合計（primary + secondary）
  yearDetails: { year: number; count: number }[]
  // primary/secondary 内訳（マッピング件数ベース）
  primaryQuestions: number       // isPrimary=true のマッピング件数
  secondaryQuestions: number     // isPrimary=false のマッピング件数
  primaryYearsAppeared: number   // primary で出題された年度数
  // 連問補正指標
  linkedGroupCount: number       // linked_group でユニークなシナリオ数（連問を1と数える）
  // 派生指標
  avgQuestionsPerYear: number   // totalQuestions / yearsAppeared（yearsAppeared=0なら0）
}
```

> **`totalQuestions` vs `linkedGroupCount` の使い分け**:
> 薬剤師国試は1シナリオが2〜4問に展開される連問が多い。`totalQuestions` だけ見ると連問化された年度を過大評価する。
> `linkedGroupCount` は連問を1ケースとして数えるため、「何トピック出たか」の指標として併用する。

### 計算ロジック
1. `QUESTION_EXEMPLAR_MAP` を1パスで `Map<exemplarId, mapping[]>` に構築
2. 各グループを `isPrimary` で分割してカウント
3. `yearDetails` は全マッピング（primary + secondary）から年度別集計
4. `linkedGroupCount`: マッピングされた questionId → `ALL_QUESTIONS` の `linked_group` を参照し、同一グループを1件としてカウント（`linked_group` が null の問題は1件扱い）
5. 未使用例示は `totalQuestions: 0` で全966件を出力対象に含める
6. `avgQuestionsPerYear = yearsAppeared > 0 ? totalQuestions / yearsAppeared : 0`

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
1. **データ抽出** — 対象問題の `question_text` + `explanation` + `question_concepts` を `ALL_QUESTIONS` から収集しCSV出力
2. **キーワード分析** — 以下の軸で自動抽出し、自然なクラスタ案を生成
   - 疾患名・病態（例：糖尿病、高血圧）
   - 薬効群・作用機序（例：DPP-4阻害、β遮断）
   - 臨床場面・手技（例：処方提案、副作用モニタリング、服薬指導）
   - 対象患者（例：高齢者、妊婦、小児）
   - 剤形・投与経路（例：吸入剤、自己注射）
3. **レビューゲート** — 6件すべての分割案をまとめてユーザーに提示。承認後にデータ更新
4. **データ更新** — `exemplars.ts` に新サブ例示を追加、`question-exemplar-map.ts` を振り替え

### 命名規則
`ex-practice-043a`, `ex-practice-043b`, ...（既存IDにアルファベット接尾辞、a〜z）

### 分割ガイドライン
- 各クラスタは **最低3問** を含むこと（それ未満は隣接クラスタに統合）
- 上限はガイドラインとして設定：043は15、他5件は8。ただし自然なクラスタを優先
- 自然なクラスタが上限を超えたら、類似を統合

### バリデーション（分割後に自動チェック）
- 新IDが既存の全exemplar IDと衝突しないこと
- 旧IDへのマッピング参照が0件になること（取り残しなし）
- 全新IDが `exemplars.ts` に存在すること
- 分割前後で総マッピング件数が一致すること

### 旧IDの扱い
削除して新IDに完全移行。以下のファイルから旧IDを完全除去する：
- `src/data/exemplars.ts`
- `src/data/question-exemplar-map.ts`
- `src/data/exemplar-stats.ts`（セクション1再計算時に自動更新）
- `src/data/heatmap-data.ts`（セクション4実行時に自動更新）

### 成果物
- `scripts/analyze-split-candidates.ts` — 分割候補分析スクリプト
- `scripts/output/split-candidates/` — 分析結果CSV

---

## セクション3：未使用例示のマッピング漏れ検出

### 目的
199件の未使用例示が「本当に出題されていない」のか「マッピング漏れ」なのかを判別する。

### 前処理：例示テキストの正規化
例示マスタにはOCR由来の壊れた文字列（切れた文、不完全な `minorCategory`）が混在する。
キーワード抽出前に以下の正規化・除外ルールを適用する：
- `text` が10文字未満の例示は除外（壊れデータの可能性）
- `minorCategory` が途中で切れている場合（末尾が「す」「い」等）はフラグを付けてログ出力
- 句読点・助詞・「説明できる」等の定型フレーズを除去してからキーワード抽出

### 類似度計算

| マッチ対象 | 重み |
|---|---|
| `question_text` | 1x |
| `explanation` | 1x |
| `question_concepts` | **2x**（専門用語が凝縮されているため） |
| `semantic_labels`（選択肢） | 1x |

- 例示の `text` からキーワード抽出（正規化済み）
- 問題の上記4フィールドを結合したテキストと照合
- キーワードの一致判定は **重複除外**（同一キーワードが複数フィールドで一致しても1回カウント）
- スコア = 一致したユニークキーワード数（concepts一致分は2倍加算）/ 例示のキーワード総数
- スコアは `Math.min(score, 1.0)` で上限クリップ

### Vision AI抽出データの活用
- `question_concepts` には構造式・グラフの概念キーワードが含まれている（Vision AI統合済み）
- 画像問題（`visual_content_type: structural_formula` 等）でも `question_concepts` 経由で検出可能
- `semantic_labels` で選択肢の画像内容もテキストマッチ可能
- カバレッジ：839/4,094問に `question_concepts` が付与済み（約20%）

### 出力フォーマット（CSV）

```
exemplarId, exemplarText, questionId, questionText, score, matchedKeywords
ex-biology-002, エンドサイトーシスと..., r105-032, 細胞膜を介した..., 0.8, エンドサイトーシス;エキソサイトーシス
```

### フロー
1. スクリプトが候補ペアをCSV出力（スコア閾値0.3以上）
2. ユーザーが確認・承認
3. 承認されたペアを `question-exemplar-map.ts` に追加

### 成果物
- `scripts/detect-mapping-gaps.ts` — 漏れ検出スクリプト
- `scripts/output/mapping-gap-candidates.csv` — 候補ペア

---

## セクション1再計算

セクション2（分割）・セクション3（漏れ修正）完了後に、`compute-exemplar-stats.ts` を再実行して `exemplar-stats.ts` を最終版に更新する。

---

## セクション4：ヒートマップデータ生成

### データ構造

```typescript
// 正本データ（これだけを永続化する）
interface HeatmapCell {
  subject: QuestionSubject
  exemplarId: string
  year: number
  count: number           // その年度の出題数
  primaryCount: number    // うちprimary
}

// ランタイム集計（アプリ側で cells から計算する。永続化しない）
// bySubjectYear: Record<QuestionSubject, Record<number, number>>
// byExemplarYear: Record<string, Record<number, number>>
```

### 出力
1. **CSV（探索用）**
   - `scripts/output/heatmap-subject-year.csv` — 科目×年度クロス集計
   - `scripts/output/heatmap-exemplar-year.csv` — 例示×年度クロス集計（966行×12列）
2. **TS定数（アプリ用）**
   - `src/data/heatmap-data.ts` — `HeatmapCell[]` のみを永続化

### 生成タイミング
- セクション1再計算の後に実行（最終マッピング確定後）

### 成果物
- `scripts/generate-heatmap-data.ts` — ヒートマップ生成スクリプト

---

## 依存関係（修正版）

```
セクション1（Stats初回計算）
    → セクション2（分割）  ※Stats結果で分割対象を確認
        → セクション3（漏れ検出）  ※分割後のIDでマッチング
            → セクション1再計算（Stats最終版）  ※分割+漏れ修正反映
                → セクション4（ヒートマップ）  ※最終マッピングで生成
```

## スクリプト構成

```
scripts/
├── validate-data-integrity.ts     # 共通バリデータ
├── compute-exemplar-stats.ts      # セクション1（＋再計算）
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
- 学習優先度 = 頻出度 × 正答率の統合
