# PDF再抽出パイプライン設計

**日付**: 2026-04-01
**目的**: 第100回の人力レビュー結果(gold set)を活用し、101-111回の再抽出精度を改善する

## 背景

第100回345問の人力レビューで218問に修正が必要と判明（63%）。特に実務セクション(196-345)は93%に修正が必要。主な問題系統:

1. `linked_scenario` の欠落・不完全抽出（116件）
2. 処方箋・検査値の画像化不足（multi-image-crop 76件）
3. `question_text` の崩れ（141件）
4. 不要画像の誤割当（image-remove 85件）
5. `choices` の特殊文字崩れ（41件）

## 方針

**PDFテキスト抽出を主軸**、Vision は画像・表・処方・構造式の補完用途に限定。

### 改善アーキテクチャ

```
PDF (pdftotext -layout)
  ↓
re-extract-from-pdf.ts     ← NEW: 改善版パーサー
  ├─ ページ追跡
  ├─ 連問グループ検出
  ├─ シナリオ抽出 + 行結合
  ├─ 処方/検査値ブロック → {{image:N}} 置換
  ├─ 選択肢抽出
  └─ reports/re-extracted-{year}.json
  ↓
apply-re-extraction.ts     ← NEW: 選択的適用
  ├─ linked_scenario: 再抽出で上書き（{{image:N}} 対応）
  ├─ choices: 不足分のみPDFで補完
  ├─ question_text: 現行データ維持（Web由来がクリーン）
  └─ image_url: 不要フラグ
  ↓
evaluate-post-apply.ts     ← NEW: gold set 評価
  └─ 改善前後の定量比較
```

### 既存パイプラインとの関係

- `parse-pdf-questions-v2.ts` → `exam-{year}-pdf.json` (既存、変更なし)
- `extract-scenarios-from-pdf.ts` → exam-{year}.ts (既存、変更なし)
- **`re-extract-from-pdf.ts`** → `reports/re-extracted-{year}.json` (新規)
- **`apply-re-extraction.ts`** → exam-{year}.ts 更新 (新規)
- **`evaluate-post-apply.ts`** → `reports/post-apply-evaluation-{year}.json` (新規)
- **`run-extraction-pipeline.ts`** → CLI ランナー (新規)

## 第100回 検証結果

### 定量評価 (509修正項目中)

| 指標 | 値 |
|------|-----|
| **Resolved** (人手修正不要) | 133項目 (29.0%) |
| **Improved** (修正量削減) | 74項目 (16.1%) |
| Unchanged | 250項目 (54.5%) |
| Regressed | 2項目 (0.4%) |
| N/A (image-crop) | 50項目 |
| **改善合計** | **207/459 (45.1%)** |

### タイプ別

| タイプ | Resolved | Improved | Unchanged |
|--------|----------|----------|-----------|
| linked_scenario | 86 | 16 | 12 |
| multi-image-crop | 0 | 38 | 38 |
| image-remove | 0 | 20 | 65 |
| choices | 5 | 0 | 36 |
| question_text | 42 | 0 | 99 |

### 人手レビュー必要問題数

- Before: **218問**
- After: **159問** (27%減)

## 処方/検査値ブロック検出パターン

以下のテキストパターンを検出し `{{image:N}}` に置換:

- `(持参薬)`, `(処方)`, `(処方1)`, `Rp`
- `(お薬手帳)`, `(服薬歴)`
- `検査値`, `検査結果`, `臨床検査`
- 年月日ヘッダ付きの処方テーブル

## 横展開手順

### CLI実行

```bash
# 1. 年度指定で抽出のみ（reports/ に出力）
npx tsx scripts/run-extraction-pipeline.ts --year 101-110

# 2. 抽出 + 適用（exam-{year}.ts を更新、バックアップ自動作成）
npx tsx scripts/run-extraction-pipeline.ts --year 101-110 --apply

# 3. 特定年度のみ
npx tsx scripts/run-extraction-pipeline.ts --year 105 --apply

# 4. Gold set がある場合の評価付き
npx tsx scripts/run-extraction-pipeline.ts --year 100 --apply --evaluate /path/to/corrections.json
```

### 優先度付けレビュー戦略

1. **High risk (優先レビュー)**: 実務セクション (196-345) の連問
   - シナリオ内 `{{image:N}}` の crop 座標は人手で設定が必要
   - 処方ブロック検出漏れの可能性あり
2. **Medium risk**: 理論セクション (91-195) の画像問題
   - 化学式・グラフを含む問題
3. **Low risk**: 必須セクション (1-90)
   - テキストベースが多く、現行データの精度が高い

### 失敗時の再実行

- `exam-{year}.ts.bak` が自動作成されるため、いつでもロールバック可能
- 再抽出は冪等（何度実行しても同じ結果）
- 個別年度の再実行: `--year {N}` で指定

## 残課題

1. **image-crop 座標**: 自動化不可。レビューUIでの人手設定が必要
2. **question_text の化学式**: PDF由来は上付き/下付きが崩れる。Web由来を維持
3. **choices の特殊文字**: 一部の化学記号はPDF抽出で復元困難
4. **111回のPDFがない**: data/pdfs/ にPDFを配置する必要あり
