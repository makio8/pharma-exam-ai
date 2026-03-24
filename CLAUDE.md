# pharma-exam-ai プロジェクト CLAUDE.md

## プロジェクト概要
薬剤師国家試験対策PWA。React 19 / TypeScript 5.9 / Vite 8 / CSS Modules。
デザインシステム「Soft Companion」でAnt Design段階的脱却中。

## 開発状況（2026-03-24時点）
- Phase 1 Week 1-2 完了: PracticePage + HomePage を Soft Companion にリデザイン済み
- 次: Week 3 QuestionPage リデザイン（ブレストから開始）
- Ant Design: 未移行ページ（QuestionPage, AnalysisPage, NotesPage, FlashCardPage）がまだ依存中
- AppLayout: `REDESIGNED_EXACT` 配列でリデザイン済みページを管理（完全一致のみ！startsWith禁止）

## コマンド
- `npm run dev` — 開発サーバー
- `npm run build` — `tsc -b && vite build`（noUnusedLocals: true、未使用importでエラー）
- `npx vitest run` — テスト（4ファイル20テスト）
- `npx tsc --noEmit` — 型チェックのみ
- `codex review --base <SHA>` — GPT-5.4によるコードレビュー（マルチモデル戦略）
- `codex review --commit <SHA>` — 特定コミットのレビュー

## アーキテクチャ
- デザイントークン: `src/styles/tokens.css`（CSS変数 `--accent`, `--bg`, `--card` 等）
- ベーススタイル: `src/styles/base.css`（`.sc-page`, `.section-title` クラス）
- 共通UIコンポーネント: `src/components/ui/`（Chip, FloatingNav, BottomSheet, QuestionCard 等）
- データ層: `src/data/`（all-questions, exam-blueprint, question-topic-map, exemplar-stats）
- カスタムフック: `src/hooks/`（useAnswerHistory, useTopicMastery, useAnalytics, useFlashCards）
- ブループリント: 科目 → 大項目(MajorCategory) → 中項目(MiddleCategory) の3階層

## 重要なパターン
- 連問セット（linked_group）: `r{year}-{start}-{end}` 形式。セッション開始時に兄弟問題を補完必須
- フィルター階層: 科目 → 大項目 → 中項目。親解除時に子フィルターもクリア必須（隠しフィルターバグ防止）
- z-index設計: FloatingNav(1000) > BottomSheet overlay(900)/sheet(901) > StickyActionBar(800)
- BottomSheet: padding-bottom 100px以上必要（FloatingNavとの被り防止）
- QuestionCard: onClick時は tabIndex + onKeyDown も必要（アクセシビリティ）
- BottomSheet: 閉じている間は aria-hidden + inert で操作不能に

## マルチモデルレビュー戦略
ユーザーはCodex CLI（GPT-5.4）での各タスクレビューを重視。
実装後に必ず `codex review` を実行し、指摘を修正してからコミット。
過去に発見されたバグ例: 未使用import、ルート判定の過剰マッチ、フィルター状態の残存、連問補完漏れ。

## データ構造メモ
- `QUESTION_TOPIC_MAP`: Record<questionId, topicId> — 問題→中項目マッピング
- `EXAM_BLUEPRINT`: SubjectBlueprint[] — 科目→大項目→中項目の階層
- `ALL_TOPICS`: { id, major, middle, minor, subject }[] — フラット化したトピック一覧
- `EXEMPLAR_STATS`: 出題頻度統計（yearsAppeared, totalQuestions等）
- `useAnswerHistory()`: { history, getQuestionResult, saveAnswer }
- `useTopicMastery()`: { topicsBySubject, allTopics, getSubjectSummary }
