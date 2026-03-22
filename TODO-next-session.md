# pharma-exam-ai 次セッション要件書

## 前回セッションの成果（2026-03-23）

### getDisplayMode 全体最適化
- **P0修正**: choices空テキスト（131件）が `both` → `image` に正しく分類
- **P2修正**: VCT未設定（42件）が `text` → `both` にフォールバック（画像表示される）
- **GPT-5.4レビュー反映**: image判定の保守化 + trim()対応
- **display_mode_override**: Question型にフィールド追加。実機確認ベースで個別上書き可能
- **画像トリミング**: 全11年分906枚のページ番号除去（安全版: 下端80px一律カット）
  - ⚠ `sharp.trim(threshold=20)` は危険（文字削りバグ）→ 廃止済み
- **選択肢クロップスクリプト**: 実験的。OCRテキスト比率ベースは精度不足。tesseract/Vision API要

### 注意: worktreeの扱い
- devサーバーはメインリポ `/Users/ai/projects/personal/pharma-exam-ai/` から起動中
- worktree の変更はdevサーバーに反映されない
- **メインリポで直接作業すること**（worktree不要）

## 今回やること

### 1. 画像欠落問題の修復 — 最優先 🔴

**現状**: 172問が画像を参照（「下図」「構造式」等）しているが `image_url` が未設定

| 優先度 | 状況 | 件数 |
|--------|------|------|
| Tier 1 | 回答不能（下図/この図） | 95問 |
| Tier 2 | 画像推奨（グラフ/模式図） | 66問 |
| Tier 3 | テキスト代替可能（下表等） | 11問 |

**具体例**: r100-224（ホルモンA/Bの構造式なし → 回答不能）

**対応方法**:
1. 厚労省サイトからPDFをダウンロード（100-109回分）
2. `scripts/extract-question-images.ts` で画像抽出
3. 172問に `image_url` を設定
4. `scripts/trim-image-whitespace.ts` でページ番号除去

**PDF取得先**: https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iyakuhin/yakuzaishi-shiken/kakomon/

### 2. 連問シナリオの表・処方箋のUI改善 — 中

**現状**: q228のような連問シナリオに表（成分分析表等）がある場合、テキスト羅列で読みづらい
**方針**: テキストUIでの表レンダリング改善（画像より文字が大きく読みやすい）
- linked_scenario 内の表パターンを検出
- HTML `<table>` でフォーマット
- または question_text の表パターンを正規化

### 3. VCT=text_only 監査 — 低

- 531件のうち誤分類がないか監査スクリプトで確認
- GPT-5.4指摘: text_only は推定ラベル（無条件マージ）なので全面信用は危険

### 4. 暗記カード自動生成 — オプション

解説テキストの【覚え方💡】セクションから一問一答形式の暗記カードを自動生成。

### 5. Supabaseデータ投入 — オプション

ローカルのexam-{year}.tsデータをSupabaseに投入し、クラウド同期を有効化。

## コミット履歴（今セッション）

```
775f306 chore: 全11年分906枚の画像ページ番号除去（安全版トリミング）
a838598 Revert "chore: 全11年分906枚の画像余白トリミング（ページ番号除去+白余白除去）"
3fe570f chore: 全11年分906枚の画像余白トリミング（ページ番号除去+白余白除去）
8aa4b64 feat: getDisplayMode全体最適化 — P0バグ修正+P2フォールバック改善+display_mode_override
```

## 主要ファイル

| ファイル | 説明 |
|---------|------|
| `src/utils/text-normalizer.ts` | getDisplayMode 定義（表示モード判定） |
| `src/types/question.ts` | Question型（display_mode_override追加） |
| `src/pages/QuestionPage.tsx` | 問題表示UI |
| `src/components/LinkedQuestionViewer.tsx` | 連問表示UI |
| `scripts/trim-image-whitespace.ts` | 画像トリミング（安全版） |
| `scripts/crop-choices-from-images.ts` | 選択肢クロップ（実験的） |
| `docs/superpowers/specs/2026-03-23-display-mode-optimization.md` | 設計書 |

## コマンドリファレンス

```bash
# 開発サーバー起動（メインリポから）
cd /Users/ai/projects/personal/pharma-exam-ai
npm run dev -- --host

# ビルド確認
npm run build

# 画像トリミング（安全版: ページ番号のみ除去）
npx tsx scripts/trim-image-whitespace.ts --year 100 --dry-run
npx tsx scripts/trim-image-whitespace.ts

# 選択肢クロップ（実験的）
npx tsx scripts/crop-choices-from-images.ts --dry-run
```

## スキル参照
- `~/.claude/skills/pharma-exam-add-year.md` — 新年度追加パイプライン
