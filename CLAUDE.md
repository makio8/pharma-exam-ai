# pharma-exam-ai プロジェクト CLAUDE.md

## プロジェクト概要
薬剤師国家試験対策PWA → Capacitor化予定。React 19 / TypeScript 5.9 / Vite 8 / CSS Modules。
デザインシステム「Soft Companion」でAnt Design段階的脱却中。

## プロダクト戦略（全セッション共通の指針）

### ビジョン
> 「次に何を勉強すべきか、もう迷わない」
> 「検索ツール型」→「学習コンパニオン型」への転換。競合Emeryの空白「上級者×コンパニオン型」を狙う。

### ファウンダーの学習モデル（プロダクトの核心）
ファウンダー自身が国試浪人→合格した実体験から抽出した学習サイクル：
1. **発見**: 必須問題（正答率60-70%以上の基本問題）で知識の穴を見つける
2. **理解**: 穴の原因を特定（例: 交感神経の作用機序が頭にない）→ 公式付箋で可視化
3. **暗記**: 付箋の知識をフラッシュカードで隙間時間に反復（歩き・電車・歯磨き）
4. **確認**: 覚えた知識で別の問題が解けるか検証 → 解ければマスター
**重要**: 「科目」単位ではなく「分野」単位（薬理>抗がん剤>アルキル化薬）で学習する。
**重要**: 「過去問だけ解いてやった気になる」のが一番危険。違う切り口で問われても解ける「武器」にする。

### 付箋の設計判断
- 付箋 = **公式コンテンツ**。ユーザー作成ではない。手書き画像（1,000枚）+ AIテキスト要約
- 理由: 作用機序フロー図・ゴロ合わせ・思考プロセスは手書きが最適。アプリ内テキスト作成ではハードル高すぎる
- 権利: ファウンダー自作 + 購入済みコンテンツ。権利問題なし

### プラットフォーム戦略
- Phase 1: Web PWA（現状）でUXを磨く
- Phase 2: Capacitorでネイティブ化 → App Store + Google Play
- 理由: 既存React+Viteコード95%再利用可、ネイティブプッシュ通知対応、書き直し不要

### 課金モデル
- 🆓 Free: 過去問3,470問+AI解説+公式付箋200枚
- 💎 付箋パック（買い切り2,980-4,980円）: 全1,000枚
- 🤖 AIパック（月額480-780円）: AI類題+先輩コーチAI

### 長期ビジョン: 「先輩の知恵が循環するプラットフォーム」
6年生の知識・体験 → コンテンツ化 → 下の学年（5年生CBT、就活、実習）に価値を届ける
- 国試対策（演習+付箋+暗記カード）← 今ここ
- 就活情報（先輩アンケート1,000-1,500件）
- 実習情報（病院・薬局アンケート）
- 先輩コーチAI（受験アンケート500件をRAGに、LINEコミュニティQ&A 5-6年分）

### 既存アセット
| アセット | 量 | 活用Phase |
|---------|---|----------|
| 手書き付箋ノート | ~1,000枚 | Phase 1-2 |
| Quizlet暗記カード | 既存データ | Phase 1 |
| LINEコミュニティ | 1,200人、5-6年分Q&A | Phase 2（βテスター）、Phase 3（RAG） |
| 受験アンケート | 500件（模試推移+勉強法） | Phase 3（先輩コーチAI） |
| 就活アンケート | 1,000-1,500件 | Phase 3以降 |

### PRD・設計ドキュメント
すべて `docs/specs/` に格納:
- PRD_v1.md（v1.2: 全画面IA、学習サイクル、課金設計、オンボーディング、アセット計画）
- COMPETITIVE_ANALYSIS.md（Emery含む9社分析）
- USER_RESEARCH_REPORT.md（ペルソナ3人、ジャーニーマップ）

### デザインモック
Google Drive（マイドライブ>pharma-exam-ai>design-mockups/）:
- v1/: 演習ページモック3枚
- v2/: 全7画面モック + デザイン方向性3パターン（A:Refined Medical, B:Soft Companion, C:Bold Minimal）→ **B採用**

## 開発状況（2026-03-25時点）
- Phase 1 Week 1-2 完了: PracticePage + HomePage を Soft Companion にリデザイン済み
- Phase 1 Week 3 完了: QuestionPage を Soft Companion にフルリデザイン
  - 730行→285行（61%削減）、Ant Design依存ゼロ
  - 新規フック5つ + コンポーネント10個 + テスト42件追加
  - 公式付箋（OfficialNote）の自動表示・ブックマーク機能
  - スワイプナビゲーション、解答時間自動計測、「わからん」スキップ
- **Phase 1 Week 3b 完了: LinkedQuestionViewer 横展開**
  - 409行→44行（89%削減）、Ant Design依存ゼロ
  - 新規コンポーネント: ScenarioCard + LinkedQuestionItem
  - useQuestionAnswerState に externalHistory/restoreExisting オプション追加
  - extractQuestionBody をユーティリティに切り出し
  - ChoiceList 数値グリッドに正誤表示追加
  - useAnswerHistory に skip オプション追加（N重ロード防止）
  - GPT-5.4レビュー: P2指摘2件修正済み
  - テスト: 14ファイル271件全パス
  - **次: ブラウザ動作確認 → AnalysisPage リデザイン（ブレストから）**
- Ant Design: 未移行ページ（AnalysisPage, NotesPage, FlashCardPage）がまだ依存中
- AppLayout: `REDESIGNED_EXACT` + `matchPath('/practice/:questionId')` でリデザイン済みページを管理

## コマンド
- `npm run dev` — 開発サーバー
- `npm run build` — `tsc -b && vite build`（noUnusedLocals: true、未使用importでエラー）
- `npx vitest run` — テスト（14ファイル271テスト）
- `npx tsc --noEmit` — 型チェックのみ
- `codex review --base <SHA>` — GPT-5.4によるコードレビュー（マルチモデル戦略）
- `codex review --commit <SHA>` — 特定コミットのレビュー
- `npm run validate` — 全問データ品質チェック（38ルール、CLI + JSONレポート出力）
- `/dev-tools/review` — データ品質レビューUI（dev serverのみ。`npm run dev` → ブラウザでアクセス）

## アーキテクチャ
- デザイントークン: `src/styles/tokens.css`（CSS変数 `--accent`, `--bg`, `--card` 等）
- ベーススタイル: `src/styles/base.css`（`.sc-page`, `.section-title` クラス）
- 共通UIコンポーネント: `src/components/ui/`（Chip, FloatingNav, BottomSheet, QuestionCard 等）
- データ層: `src/data/`（all-questions, exam-blueprint, question-topic-map, exemplar-stats）
- カスタムフック: `src/hooks/`（useAnswerHistory, useTopicMastery, useAnalytics, useFlashCards）
- カスタムフック（新規）: `src/hooks/`（useQuestionAnswerState, useTimeTracking, useSwipeNavigation, useOfficialNotes, useBookmarks）
- 問題ドメインコンポーネント: `src/components/question/`（ProgressHeader, QuestionBody, ChoiceList, ChoiceCard, ActionArea, ResultBanner, ExplanationSection, OfficialNoteCard, NoteImageViewer, MetaAccordion）— LinkedQuestionViewer からも再利用前提
- 公式付箋データ: `src/data/official-notes.ts`（モック10枚）、型: `src/types/official-note.ts`
- データバリデーター: `src/utils/data-validator/`（38ルール、3レベル: 構造/整合性/品質）
- レビューUI: `src/dev-tools/review/`（Vite dev server統合、本番ビルドに含まれない）
- 修正スクリプト: `scripts/apply-corrections.ts`（中間JSON方式） + `scripts/json-to-exam-ts.ts`
- ブループリント: 科目 → 大項目(MajorCategory) → 中項目(MiddleCategory) の3階層

## 重要なパターン
- 連問セット（linked_group）: `r{year}-{start}-{end}` 形式。セッション開始時に兄弟問題を補完必須
- フィルター階層: 科目 → 大項目 → 中項目。親解除時に子フィルターもクリア必須（隠しフィルターバグ防止）
- z-index設計: FloatingNav(1000) > BottomSheet overlay(900)/sheet(901) > StickyActionBar(800)
- BottomSheet: padding-bottom 100px以上必要（FloatingNavとの被り防止）
- QuestionCard: onClick時は tabIndex + onKeyDown も必要（アクセシビリティ）
- BottomSheet: 閉じている間は aria-hidden + inert で操作不能に

## 開発時の注意事項（gotchas）
- `jsx: react-jsx` 設定のため `React.KeyboardEvent` 等の名前空間型は使えない → `import type { KeyboardEvent } from 'react'` を使う
- `@testing-library/react` / jsdom 未導入。フックのテストはロジックをクラスに分離して純粋関数テスト（TimeTracker, AnswerStateManager, SwipeNavigator パターン）
- `codex review --commit <SHA>` にプロンプトを渡すときは stdin（heredoc）を使う。引数としては渡せない
- `codex exec "プロンプト"` で GPT-5.4 に設計レビュー等の自由質問が可能
- モックデータの linkedQuestionIds は実問題IDと未検証。ダミー値注意コメント付き

## マルチモデルレビュー戦略
ユーザーはCodex CLI（GPT-5.4）での各タスクレビューを重視。
実装後に必ず `codex review` を実行し、指摘を修正してからコミット。
過去に発見されたバグ例: 未使用import、ルート判定の過剰マッチ、フィルター状態の残存、連問補完漏れ。

## 設計ドキュメント（Soft Companion リデザイン）
- `docs/superpowers/specs/2026-03-24-phase1-week1-2-redesign-design.md` — HomePage + PracticePage 設計
- `docs/superpowers/specs/2026-03-24-questionpage-redesign-design.md` — QuestionPage 設計（GPT-5.4 Approved）
- `docs/superpowers/specs/2026-03-24-linked-question-redesign-design.md` — 連問横展開 設計（GPT-5.4 Approved、実装計画未作成）
- `docs/superpowers/plans/2026-03-24-questionpage-redesign.md` — QuestionPage 実装計画（12タスク完了）

## データ構造メモ
- `QUESTION_TOPIC_MAP`: Record<questionId, topicId> — 問題→中項目マッピング
- `EXAM_BLUEPRINT`: SubjectBlueprint[] — 科目→大項目→中項目の階層
- `ALL_TOPICS`: { id, major, middle, minor, subject }[] — フラット化したトピック一覧
- `EXEMPLAR_STATS`: 出題頻度統計（yearsAppeared, totalQuestions等）
- `useAnswerHistory()`: { history, getQuestionResult, saveAnswer }
- `useTopicMastery()`: { topicsBySubject, allTopics, getSubjectSummary }
