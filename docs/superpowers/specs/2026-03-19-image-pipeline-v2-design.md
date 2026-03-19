# 画像データパイプライン v2 設計

**日付**: 2026-03-19
**ステータス**: 承認済み
**目的**: 画像問題867問を問題単位でクロップし、テキストをクリーニングし、品質テストで検証する

## 背景

実機確認で3つのデータ品質課題が発覚:
1. **表紙/注意事項ページが表示される** — image_urlが表紙ページにマッピング
2. **1ページに複数問表示** — PDFページ単位の画像で問題単位にクロップされていない
3. **question_textに図・数式由来のゴミテキスト混入** — pdftotext が構造式・グラフデータも抽出

## 設計

### 1. 座標ベース画像クロップ（crop-question-images.ts）

**処理フロー**:
```
PDF → pdftotext -bbox で「問N」のY座標取得
    → pdftoppm でページ画像生成（既存）
    → sharp で問題領域をクロップ
    → public/images/questions/{year}/q{NNN}.png を上書き
```

**座標取得**:
- `pdftotext -bbox` でPDF内テキスト要素のbounding box（位置座標）を取得
- 正規表現 `問\s*(\d{1,3})` でマッチする要素のY座標を問題開始位置とする
- 次の「問N+1」のY座標を問題終了位置とする（ページ最後の問題はページ下端まで）
- マージン: 上に20px、下に30px追加（図のはみ出し対策）

**表紙除外ルール**:
- 「注意事項」「指示があるまで開いてはいけません」「解答方法は次のとおり」を含むページはスキップ
- ページ内の問題数検出が10以上のページはスキップ（表紙の「問1から問90」パターン）

**出力**: 問題ごとにクロップされたPNG画像（幅=ページ全幅、高さ=問題領域のみ）

### 2. question_text クリーニング（clean-question-text.ts）

**対象**: `choices: []` の867問

**クリーニングルール**:
1. **構造式ゴミ除去**: 連続する1-2文字トークン（元素記号等）が5個以上並ぶ行を除去
   - 例: `Br Br Cl Me Me Me` → 除去
   - 例: `HO Et Me OH` → 除去
2. **数値テーブル除去**: 数字のみの行、または「数字 数字 数字」パターンの行を除去
   - 例: `0.8 0.8 0.8` → 除去
   - 例: `1 1 1` → 除去
3. **選択肢番号のみの行を除去**: `^\s*[1-5]\s*$` パターン
4. **分数平文化パターン除去**: 「× 100」を含む行で、前後に分母・分子があるパターン
5. **問題文本体は保持**: 「〜はどれか」「〜を選べ」で終わる文は必ず保持
6. **空行の正規化**: 連続空行を1つに

**安全策**: クリーニング前のテキストを `question_text_original` として保存（ロールバック可能）

### 3. 品質テストスクリプト（validate-image-quality.ts）

全867問に対して自動検証を実行:

| チェック | 方法 | 合格基準 |
|---|---|---|
| 画像に問題番号が含まれるか | pdftotext -bbox の座標データと照合 | 問Nの座標がクロップ範囲内にある |
| 表紙/注意事項でないか | 画像元ページのテキストに除外キーワードがないか | 除外キーワードなし |
| 画像サイズが適切か | sharp でメタデータ取得 | 高さ100px以上、幅300px以上 |
| question_textにゴミがないか | パターンマッチ | 連続短トークン5個以上なし |
| image_urlのファイルが存在するか | fs.existsSync | ファイルが存在する |

**出力**: `scripts/quality-report.json`
```json
{
  "total": 867,
  "passed": 820,
  "failed": 47,
  "failures": [
    { "id": "r108-009", "reason": "cover_page", "details": "注意事項ページを検出" },
    { "id": "r100-008", "reason": "too_small", "details": "高さ50px" }
  ]
}
```

### 4. Gemini フォールバック（gemini-crop-fallback.ts）

品質テストで不合格の問題に対して実行:
- ページ画像 + プロンプト「この画像から問Nの領域の上端と下端のY座標をピクセル単位で返してください」
- Gemini 2.5 Flash（無料枠 20req/日、または有料API）
- 返された座標でsharpクロップ
- 処理後に品質テストを再実行

### 5. 依存ライブラリ

| ライブラリ | 用途 | 新規/既存 |
|---|---|---|
| sharp | 画像クロップ・メタデータ取得 | **新規** npm install |
| pdftotext | PDF テキスト+座標抽出 | 既存（poppler-utils） |
| pdftoppm | PDF→画像変換 | 既存（poppler-utils） |
| @google/generative-ai | Gemini API（フォールバック） | 既存（.env.local設定済み） |

### 6. 影響範囲

| ファイル | 変更 |
|---|---|
| `scripts/crop-question-images.ts` | **新規** |
| `scripts/clean-question-text.ts` | **新規** |
| `scripts/validate-image-quality.ts` | **新規** |
| `scripts/gemini-crop-fallback.ts` | **新規** |
| `public/images/questions/{year}/q*.png` | クロップ版で上書き |
| `src/data/real-questions/exam-{year}.ts` | question_textクリーニング反映 |
| `package.json` | sharp 追加 |
| UIコード変更なし | — |

### 7. 実行順序

```
1. sharp インストール
2. crop-question-images.ts 実行（座標ベースクロップ）
3. clean-question-text.ts 実行（テキストクリーニング）
4. validate-image-quality.ts 実行（品質テスト）
5. 不合格分に gemini-crop-fallback.ts 実行
6. validate-image-quality.ts 再実行（最終確認）
7. ビルド + E2Eテスト
8. コミット + push
```

### 8. スコープ外

- 画像内テキストのOCR→テキスト選択肢への変換
- 画像の解像度最適化
- choicesありの問題の画像クロップ（補助画像なので優先度低）
- question_text_original フィールドのUI表示

### 9. 前提条件

- 厚労省PDFファイルが `/tmp/claude/` に存在すること（過去セッションでDL済み）
- PDFが存在しない場合は再ダウンロードスクリプトを実行
