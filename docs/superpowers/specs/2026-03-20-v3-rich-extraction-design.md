# 画像パイプライン v3: リッチ抽出設計

**作成日**: 2026-03-20
**ステータス**: 承認済み
**前提**: v2パイプライン完了（867問クロップ済み、品質テスト合格）

---

## 背景と目的

### v2の限界

v2パイプラインは867問の画像クロップとテキストクリーニングを完了したが、実機検証で5つの課題が判明した（詳細は `2026-03-20-v3-session-handoff.md`）。

### v3で解決すること

1. **画像余白トリム**: ページ末尾の巨大余白・ページ番号を除去
2. **choices復元**: choices空の867問からテキスト化可能な選択肢を復元（推定200-300問）
3. **リッチメタデータ抽出**: 選択肢の意味ラベル・問題概念を取得し、下流分析に活用

### なぜリッチ抽出が必要か

| ユースケース | 必要なデータ | Before（v2） | After（v3） |
|---|---|---|---|
| 苦手分野解析 | ユーザーが選んだ選択肢の意味 | 「1を選んだ」 | 「アコニチン（トリカブト毒）を選んだ」 |
| 類似問題生成 | 問題が扱う概念 | category のみ | `question_concepts: ["メソ化合物", "立体化学"]` |
| 問題分類マッピング | 画像内容の分類 | なし | `visual_content_type: "structural_formula"` |
| UI表示改善 | テキスト化された選択肢 | 画像+番号ボタン | テキスト選択肢（可能な問題のみ） |

---

## 技術的意思決定

### AI Vision の実行方式: Claude Code（案C）

テスト結果に基づき、Claude Code 自身が画像を Read して解析する方式を採用。

| 検討した案 | 結果 |
|---|---|
| A. Claude API（従量課金） | APIキー未発行、クレカ登録が必要。~$8-10 |
| B. Gemini Flash（無料枠） | quota 0 で使用不可。有料プラン要契約 |
| **C. Claude Code（MAXサブスク）** | **テスト済み。追加費用ゼロ、品質完璧** |

**テスト結果**（100回 問233, 問239）:
- 表形式の選択肢: 完璧にテキスト化
- 長文テキスト選択肢: 正確（特殊文字 α、── も問題なし）
- 処理時間: 1画像あたり約5-10秒

### 実行方法

Claude Code 内で Agent を並列起動し、各 Agent が画像を Read → 解析 → JSON ファイルに Write するバッチ処理。年度別に分割して3-5並列で実行。

---

## データスキーマ

### VisionExtraction（1問ごとの抽出結果）

```typescript
interface VisionExtraction {
  question_id: string              // "r100-233"

  // --- 問題文 ---
  question_text_clean: string      // AI再生成のクリーンテキスト
  question_concepts: string[]      // 問題が扱う概念キーワード（2-5個）

  // --- 画像分類 ---
  visual_content_type:
    | "structural_formula"         // 構造式・化学式
    | "graph"                      // グラフ・チャート
    | "table"                      // 表（組合せ表含む）
    | "diagram"                    // フロー図・模式図・反応経路図
    | "prescription"               // 処方箋・検査値表
    | "text_only"                  // テキストのみ（画像不要だった問題）
    | "mixed"                      // 複合（表+構造式など）

  // --- 選択肢 ---
  choices_extractable: boolean     // テキスト化してUI表示可能か
  choices: VisionChoice[]

  // --- 連問情報 ---
  linked_group?: string            // "r100-232-233" 連問グループID
  linked_scenario?: string         // 共通シナリオテキスト

  // --- メタ ---
  confidence: number               // 0-1 抽出の自信度
  notes?: string                   // 特記事項
}

interface VisionChoice {
  key: number                      // 1-5
  text: string | null              // テキスト化可能ならテキスト、不可ならnull
  semantic_labels: string[]        // 意味ラベル（化合物名、概念名、特徴など）
  choice_type:
    | "text"                       // プレーンテキスト（「希釈する場合は...」）
    | "text_pair"                  // 組合せ表（「ツキヨタケ ── イルジンS」）
    | "structural_formula"         // 構造式
    | "graph"                      // グラフ
    | "equation"                   // 数式・化学反応式
    | "image_other"                // その他画像
}
```

### 具体例

#### 例1: 100回 問233（表形式 → テキスト化可能）

```json
{
  "question_id": "r100-233",
  "question_text_clean": "植物とその有毒成分の組合せのうち、本症状の原因として最も可能性が高いのはどれか。1つ選べ。",
  "question_concepts": ["有毒植物", "天然毒素", "食中毒", "衛生"],
  "visual_content_type": "table",
  "choices_extractable": true,
  "choices": [
    {"key": 1, "text": "ツキヨタケ ── イルジンS", "semantic_labels": ["ツキヨタケ", "イルジンS", "キノコ毒"], "choice_type": "text_pair"},
    {"key": 2, "text": "タマゴテングタケ ── α-アマニチン", "semantic_labels": ["タマゴテングタケ", "α-アマニチン", "キノコ毒"], "choice_type": "text_pair"},
    {"key": 3, "text": "ジギタリス ── ジギトキシン", "semantic_labels": ["ジギタリス", "ジギトキシン", "植物毒"], "choice_type": "text_pair"},
    {"key": 4, "text": "ワラビ ── プタキロシド", "semantic_labels": ["ワラビ", "プタキロシド", "植物毒"], "choice_type": "text_pair"},
    {"key": 5, "text": "トリカブト ── アコニチン", "semantic_labels": ["トリカブト", "アコニチン", "植物毒"], "choice_type": "text_pair"}
  ],
  "linked_group": "r100-232-233",
  "linked_scenario": "41歳男性。山歩きの時に採取したきのこや山菜を、おひたしにしてその日の夕食で食べたところ、1時間後に口唇のしびれが出現した。症状が次第に悪化し、激しい嘔吐、四肢のしびれ、呼吸困難を起こしたため、救急搬送された。病院到着時に重篤な心室性不整脈が出現したため、アミオダロン塩酸塩注射液が投与された。",
  "confidence": 0.95
}
```

#### 例2: 100回 問8（構造式 → 画像のまま）

```json
{
  "question_id": "r100-008",
  "question_text_clean": "メソ化合物はどれか。1つ選べ。",
  "question_concepts": ["メソ化合物", "立体化学", "対称性", "有機化学"],
  "visual_content_type": "structural_formula",
  "choices_extractable": false,
  "choices": [
    {"key": 1, "text": null, "semantic_labels": ["2,3-ジブロモブタン", "Br置換", "メソ体候補"], "choice_type": "structural_formula"},
    {"key": 2, "text": null, "semantic_labels": ["2,3-ジクロロブタン", "Cl置換"], "choice_type": "structural_formula"},
    {"key": 3, "text": null, "semantic_labels": ["ブタン誘導体", "Me置換のみ"], "choice_type": "structural_formula"},
    {"key": 4, "text": null, "semantic_labels": ["2-エチル-3-ヒドロキシブタン", "HO,Et置換"], "choice_type": "structural_formula"},
    {"key": 5, "text": null, "semantic_labels": ["2-ヒドロキシ-3-メチルブタン", "HO,Me置換"], "choice_type": "structural_formula"}
  ],
  "confidence": 0.85,
  "notes": "構造式のIUPAC名は画像から推定。正式名称は化学DBで要検証"
}
```

---

## 実装タスク

### Task 1: 画像余白トリム（30分）

- **スクリプト**: `scripts/trim-image-whitespace.ts`
- **処理**:
  1. クロップ済み画像を再生成（`crop-question-images.ts` 再実行、画像が `/tmp` 消失のため）
  2. `sharp(img).trim({ threshold: 10 })` で白余白を自動除去
  3. ページ番号領域（下端80px、「− N −」パターン）をカット
  4. `public/images/questions/{year}/q{NNN}.png` に保存
- **対象**: 867枚
- **依存**: sharp（インストール済み）

### Task 2: リッチ Vision 抽出（2-3時間）

- **スクリプト**: `scripts/vision-extract-batch.ts`（問題リスト生成+結果集約用）
- **処理**:
  1. choices空の867問リストを生成（`all-questions.ts` から抽出）
  2. 問題→ページ画像のマッピング（`crop-question-images.ts` のロジック再利用）
  3. Claude Code Agent が画像を Read → VisionExtraction JSON を生成 → ファイルに Write
  4. 結果を `scripts/output/vision-extractions.jsonl` に集約
  5. 品質チェック: confidence < 0.7 の問題をレビュー対象としてフラグ
- **並列化**: 年度別に3-5 Agent 並列
- **プロンプト**: 後述の抽出プロンプトを使用

### Task 3: データマージ（30分）

- **スクリプト**: `scripts/merge-vision-results.ts`
- **処理**:
  1. `vision-extractions.jsonl` を読み込み
  2. `choices_extractable: true` の問題の choices を Question 型にマージ
  3. `question_text_clean` で question_text を更新（original はバックアップ済み）
  4. `question_concepts`, `visual_content_type`, `semantic_labels` を新フィールドとして追加
  5. `all-questions.ts` と年度別ファイルを更新
- **Question 型の拡張**:
  ```typescript
  // 追加フィールド
  visual_content_type?: string
  question_concepts?: string[]
  linked_group?: string
  linked_scenario?: string
  ```
- **Choice 型の拡張**:
  ```typescript
  // 追加フィールド
  semantic_labels?: string[]
  choice_type?: string
  ```

### Task 4: 連問構造化（別セッション推奨、3-4時間）

- Task 2 の抽出で `linked_group` と `linked_scenario` は取得済み
- UI変更（連問グループ一括表示）が大きいため別セッション

---

## 抽出プロンプト（Task 2 で使用）

```
この薬剤師国家試験の問題画像を分析し、以下のJSON形式で情報を抽出してください。

## 抽出ルール

### question_text_clean
- 画像内の問題文を正確に書き起こす
- OCRゴミ（グラフラベル、表データの断片）は除外
- 「問 N」の番号は除外、問い文のみ

### question_concepts
- この問題が問うている薬学概念を2-5個のキーワードで
- 例: ["メソ化合物", "立体化学", "対称性"]

### visual_content_type
- structural_formula: 構造式・化学式が主体
- graph: グラフ・チャート
- table: 表形式（組合せ表含む）
- diagram: フロー図・模式図
- prescription: 処方箋・検査値
- text_only: テキストのみ
- mixed: 複合

### choices
- テキスト化可能な選択肢: text にテキストを、choice_type を "text" or "text_pair" に
- 構造式・グラフなど画像でしか表現できない選択肢: text を null に、choice_type を適切に
- semantic_labels: 各選択肢が表す概念・物質名・特徴を1-3個

### 連問検出
- 「問 N-M」パターンがあれば linked_group に記録
- 共通シナリオ（患者情報・症例）があれば linked_scenario に記録

### confidence
- 0.9-1.0: 明確に読み取れた
- 0.7-0.9: 概ね読み取れたが一部推定あり
- 0.5-0.7: 推定が多い（手動レビュー推奨）

## 出力形式
1ページに複数問ある場合は配列で出力。JSONのみ、説明不要。
```

---

## ファイル構成（新規作成）

```
scripts/
├── trim-image-whitespace.ts       # Task 1: 余白トリム
├── vision-extract-batch.ts        # Task 2: 抽出バッチ管理
├── merge-vision-results.ts        # Task 3: 結果マージ
├── test-gemini-vision.ts          # テスト用（作成済み）
└── output/
    └── vision-extractions.jsonl   # 抽出結果（1行1問）

src/types/
└── question.ts                    # Choice, Question 型の拡張
```

---

## リスクと対策

| リスク | 対策 |
|---|---|
| Claude Code のトークン消費が大きい | 年度を分割し、1セッションで2-3年度ずつ処理 |
| 構造式の semantic_labels が不正確 | confidence フィールドで自信度を記録、低スコアは手動レビュー |
| ページ画像と問題番号のマッピングずれ | bbox-parser のロジックを再利用し、座標ベースでマッピング |
| 867問全件処理中にセッションが切れる | JSONL形式で1問ずつ書き込み、途中再開可能に |

---

## 成功基準

- [ ] 867問の画像余白が除去されている
- [ ] 200-300問の choices が復元されている（choices_extractable: true）
- [ ] 全867問に question_concepts と visual_content_type が付与されている
- [ ] 全867問の choices に semantic_labels が付与されている
- [ ] confidence < 0.7 の問題がリストアップされ、手動レビュー可能な状態
