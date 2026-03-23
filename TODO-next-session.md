# pharma-exam-ai 次セッション要件書

## 前回セッションの成果（2026-03-23 #2）

### 画像欠落修復パイプライン（最優先タスク完了 ✅）
- **256問にimage_url設定**（確定リスト258問中、カバー率99.2%）
- 画像総数: 909枚 → 1,165枚に拡充
- 既存画像は一切上書きなし（保護確認済み）
- 残り2問（r102-254, r105-310）は処方箋テキスト問題で画像不要（偽陽性）
- 107-110回のPDFダウンロード+ページ画像生成完了
- ページ画像を `/tmp/claude/` → `data/exam-pages/` に永続化（100-110全年度）

### マルチモデルレビュー（Claude + GPT-5.4）
- GPT-5.4による設計レビュー: 🔴3件 🟡3件 → 全て設計に反映
- GPT-5.4による計画レビュー: 🔴3件 🟡4件 → 全て実装に反映
- GPT-5.4による実装レビュー: 🔴2件 🟡3件 → 将来改善項目として記録

### 新規・変更ファイル
| ファイル | 変更内容 |
|---------|---------|
| `scripts/crop-question-images.ts` | フィルタ拡張（確定IDリスト+キーワード+dry-run+既存保護） |
| `scripts/add-image-urls-batch.ts` | ファイルスキャン方式+既存値保護+dry-run |
| `scripts/generate-missing-image-ids.ts` | 新規: 確定IDリスト生成 |
| `scripts/lib/paths.ts` | 新規: パス定数一元管理 |
| `scripts/download-exam-pdfs.sh` | 107-110回URL追加+出力先data/pdfs/ |
| `src/data/real-questions/missing-image-ids.json` | 新規: 確定IDリスト（258問、凍結版） |
| `.gitignore` | data/pdfs/, data/exam-pages/ 追加 |
| `src/data/real-questions/exam-{100-110}.ts` | 256問にimage_url追加 |

### 注意: worktreeの扱い
- devサーバーはメインリポ `/Users/ai/projects/personal/pharma-exam-ai/` から起動中
- **メインリポで直接作業すること**（worktree不要）

## 今回やること

### 1. GPT-5.4指摘の堅牢性改善 — 中

#### 1a. DLスクリプトの失敗検知（GPT-5.4 🔴）
- `download-exam-pdfs.sh` に `set -euo pipefail` + `curl -f` 追加
- PDFファイルサイズ検証（0バイトや小さすぎるファイルを警告）

#### 1b. 確定IDリストのドリフト防止（GPT-5.4 🔴）
- `crop-question-images.ts` のフィルタから `keywordHit` を除去し、`confirmedIds || emptyChoices` のみにする
- 偽陽性2問（r102-254, r105-310）をdenylistに追加
- `generate-missing-image-ids.ts` を実行しても既存JSONを上書きしない仕組み

#### 1c. bbox-parserの「問N」1トークン対応
- `findQuestionPositions()` に「問3」のような結合トークンパターンも検出するよう拡張
- テスト追加

### 2. Tier 1 目視確認 — 高 ⚠️
- Tier 1（78問）の画像が正しい問題を指しているか、devサーバーで全件確認
- `npm run dev -- --host` で起動し、各問題ページを確認

### 3. 連問シナリオの表・処方箋のUI改善 — 中
- linked_scenario 内の表パターンを検出
- HTML `<table>` でフォーマット

### 4. VCT=text_only 監査 — 低
- 531件のうち誤分類がないか監査

### 5. 暗記カード自動生成 — オプション
- 解説テキストの【覚え方💡】セクションから一問一答形式の暗記カード自動生成

### 6. Supabaseデータ投入 — オプション
- ローカルのexam-{year}.tsデータをSupabaseに投入

## コミット履歴（今セッション）
```
4fa1615 feat: 画像欠落256問にimage_url設定（909→1165枚に拡充）
d89c662 feat: crop-question-images フィルタ拡張（確定IDリスト+キーワード+dry-run+既存保護）
b9426bf feat: add-image-urls-batch 全年度対応+既存値保護+ファイルスキャン方式
f322f42 feat: download-exam-pdfs.sh 107-110回対応+出力先をdata/pdfs/に変更
0fc157c chore: paths.ts新設 + data/ディレクトリをgitignore追加
fcbd92f feat: 画像欠落問題の確定IDリスト生成（凍結版）
```

## コマンドリファレンス
```bash
# 開発サーバー起動（メインリポから）
cd /Users/ai/projects/personal/pharma-exam-ai
npm run dev -- --host

# ビルド確認
npm run build

# 画像パイプライン（再実行安全: 冪等性あり）
npx tsx scripts/crop-question-images.ts --dry-run    # 確認
npx tsx scripts/crop-question-images.ts              # 実行
npx tsx scripts/add-image-urls-batch.ts --dry-run    # 確認
npx tsx scripts/add-image-urls-batch.ts              # 実行

# PDFダウンロード
bash scripts/download-exam-pdfs.sh

# 画像トリミング（既存画像注意: 新規ファイルリストを使うこと）
npx tsx scripts/trim-image-whitespace.ts --dry-run
```

## スキル参照
- `~/.claude/skills/pharma-exam-add-year.md` — 新年度追加パイプライン
