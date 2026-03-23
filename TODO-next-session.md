# pharma-exam-ai 次セッション要件書

## 前回セッション成果（2026-03-24）

### 画像修復パイプライン — 完了
- **256問にimage_url設定**（909→1165枚）
- v3レビューに基づく品質修正: 🔴15問修正 + 🟡30問改善
- シナリオ画像誤配置7問のimage_url除去
- 選択肢テキスト混入25問のbboxベース除去
- 横軸凡例保護クロップ6問

### マルチモデルレビュー戦略
- GPT-5.4 × 5回（設計/計画/実装/堅牢性/改善策）
- Claude Opus × 1回（セカンドオピニオン）
- Codex CLI (`codex exec -m gpt-5.4 --full-auto`) でのレビュー統合

### 堅牢性改善
- DLスクリプト: `set -euo pipefail` + `curl -sfL` + PDF検証
- ドリフト防止: keywordHit除去 + frozen必須化 + denylist + exitCode
- パス永続化: `/tmp/claude/` → `data/exam-pages/` + `data/pdfs/`

## 今回やること

### 1. Tier1 v4レビュー — 高
v3修正後の再確認。特に:
- 横軸凡例6問: 凡例が見えるようになったか
- 選択肢除去25問: 図だけになったか（切りすぎてないか）
- シナリオ画像除去7問: アプリ上でシナリオが正しく表示されるか

### 2. 🟡改善の残課題（10問） — 中
v3で未対応だった改善問題:
- 問題文/シナリオ重複 (4問): r100-178, r104-220, r106-093, r106-288
- 選択肢下に図がある (3問): r101-126, r102-093, r102-149
- 空白過多 (1問): r108-001
- 選択肢位置未検出 (2問): r101-087, r107-041

### 3. 将来改善の技術検討 — 低
GPT-5.4/Claude Opus ダブルレビュー結果:

| 施策 | 推奨 | 備考 |
|------|------|------|
| 図のみ自動抽出（PDF bbox+OCR） | 中期 | 既存bboxパーサーのパラメータ調整が先 |
| AI提案→人手承認の半自動ワークフロー | 将来 | 個人開発には過剰（Claude Opus指摘） |
| データモデル拡張（images[]/role/cropRect） | 将来 | 全問レビュー後に必要性を再評価 |
| 手動クロップUI（レビューサイトでドラッグ） | 検討中 | 費用対効果の高い方法 |

### 4. 回数別全問レビュー — オプション
build-review-page.ts を拡張して、回数を指定して全345問のレビューページを生成。
全年度の画像品質をチェック。

### 5. 連問シナリオの表・処方箋UI改善 — 中
### 6. VCT=text_only 監査 — 低
### 7. 暗記カード自動生成 — オプション
### 8. Supabaseデータ投入 — オプション

## コミット履歴（今セッション）
```
43cb355 fix: v3レビュー結果に基づく画像修正（🔴15問+🟡30問）
32461b0 fix: 🔴致命的13問の精密修復v2
b30cfa5 fix: Tier1レビュー結果に基づく画像修復（🔴13問+🟡38問）
7506284 fix: GPT-5.4残課題対応（frozen必須化+exitCode+emptyChoices可視化）
9da832d fix: ドリフト防止（keywordHit除去+frozen保護+denylist追加）
xxxxxxx fix: download-exam-pdfs.sh に失敗検知追加
4fa1615 feat: 画像欠落256問にimage_url設定（909→1165枚に拡充）
各種: crop/add-image-urls/paths/download スクリプト改修
```

## コマンドリファレンス
```bash
# 開発サーバー
npm run dev -- --host

# レビューページ生成
npx tsx scripts/build-review-page.ts

# 画像パイプライン（冪等性あり）
npx tsx scripts/crop-question-images.ts --dry-run
npx tsx scripts/add-image-urls-batch.ts --dry-run

# Codex CLI でGPT-5.4レビュー
codex exec -m gpt-5.4 --full-auto "レビュー依頼..."
```
