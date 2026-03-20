この薬剤師国家試験の問題画像を分析し、以下のJSON形式で情報を抽出してください。

## 対象問題

この画像には問題番号 {QUESTION_NUMBERS} が含まれています。
そのうち {TARGET_QUESTIONS} の情報を抽出してください。

## 抽出ルール

### question_text_clean
- 問題文を正確に書き起こす
- 「問 N」の番号は除外し、問い文のみ記載
- OCRゴミ（グラフラベル・表データの断片）は除外
- 下付き・上付きの数字は通常の数字に正規化（「₁₇歳」→「17歳」）

### question_concepts
- この問題が問う薬学概念を2-5個のキーワードで
- 具体的な物質名ではなく、分野・テーマレベル
- 例: ["メソ化合物", "立体化学", "対称性"]

### visual_content_type
- structural_formula: 構造式・化学式が主体
- graph: グラフ・チャート
- table: 表形式（組合せ表含む）
- diagram: フロー図・模式図・反応経路図
- prescription: 処方箋・検査値表
- text_only: テキストのみ（画像がなくても解ける問題）
- mixed: 複合（表+構造式など）

### choices
- **テキスト化可能な選択肢**:
  - text にテキストを記載
  - choice_type を "text"（通常テキスト）または "text_pair"（A──B の組合せ）に
- **画像でしか表現できない選択肢**（構造式・グラフなど）:
  - text を ""（空文字）に
  - choice_type を "structural_formula", "graph", "equation", "image_other" のいずれかに
- choices_extractable: 選択肢の過半数がテキスト化可能なら true

### semantic_labels（最重要）
- 各選択肢が何を表しているかを1-3個のラベルで記述
- テキスト選択肢でも必ず付与する
- 構造式: 化合物名、官能基、特徴（例: ["2,3-ジブロモブタン", "Br置換", "メソ体候補"]）
- テキスト: キーワード（例: ["ツキヨタケ", "イルジンS", "キノコ毒"]）
- 数式: 式の意味（例: ["一次反応速度式", "k=0.01/min"]）

### 連問検出
- 「問 N-M」「問 N〜M」パターン → linked_group: "r{year}-{N}-{M}"
- 共通シナリオ（患者情報・症例）→ linked_scenario にテキスト記載

### confidence
- 0.9-1.0: 明確に読み取れた
- 0.7-0.9: 概ね正確だが一部推定
- 0.5-0.7: 推定が多い（手動レビュー推奨）

## 出力形式

JSON配列で出力。説明文は不要、JSONのみ。

[
  {
    "question_id": "r{year}-{number}",
    "question_text_clean": "...",
    "question_concepts": ["...", "..."],
    "visual_content_type": "table",
    "choices_extractable": true,
    "choices": [
      {"key": 1, "text": "...", "semantic_labels": ["...", "..."], "choice_type": "text_pair"}
    ],
    "linked_group": null,
    "linked_scenario": null,
    "confidence": 0.95
  }
]
