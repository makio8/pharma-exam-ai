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
- **Phase 1 Week 4 完了: AnalysisPage リデザイン**
  - 371行→120行（68%削減）、Ant Design依存ゼロ
  - 深掘り特化: ホームとの重複排除、苦手問題（2モード）+ 回答履歴のみ
  - 新規: computeMissedEssentials（必須取りこぼし計算）、WeakQuestionCard、HistoryItem
  - useAnalytics に allHistory 追加、weakQuestions 20件化、recentHistory 30件化
  - Chipでモード切替: 🔥自分の苦手 | ⚠️必須の取りこぼし
  - GPT-5.4レビュー: AnalysisPage本体は指摘ゼロ
  - テスト: 15ファイル278件全パス
  - **次: ブラウザ動作確認 → NotesPage or FlashCardPage リデザイン or オンボーディング**
- **付箋パイプライン（Phase 2a アノテーションUI完成）**
  - 新パイプライン: 人間がbbox描画 → 切り抜き → OCR → テキスト確認 → トピック紐付け
  - Gemini bbox検出精度が不十分→人間描画に方針転換
  - アノテーションUI: `/dev-tools/fusen-annotate`（19ファイル、308テスト）
  - split-pages.ts: 見開きA3→左右分割完了（91見開き→182枚）
  - 残り38ページ（page-091〜109, 111〜129）のPNG未生成（PDFから抽出が必要）
  - 次: ブラウザ動作確認 → 全ページbboxアノテーション → crop → OCR再実行
  - 設計: `docs/superpowers/specs/2026-03-25-fusen-annotate-ui-design.md`（GPT-5.4 Approved）
  - 計画: `docs/superpowers/plans/2026-03-25-fusen-annotate-ui.md`
  - レビューUI Phase 1: `/dev-tools/fusen-review`（判定+キーボードナビ、Phase 2b以降で使用）
- Ant Design: 未移行ページ（NotesPage, FlashCardPage）がまだ依存中
- AppLayout: `REDESIGNED_EXACT` + `matchPath('/practice/:questionId')` でリデザイン済みページを管理

## コマンド
- `npm run dev` — 開発サーバー
- `npm run build` — `tsc -b && vite build`（noUnusedLocals: true、未使用importでエラー）
- `npx vitest run` — テスト（18ファイル308テスト）
- `npx tsc --noEmit` — 型チェックのみ
- `codex review --base <SHA>` — GPT-5.4によるコードレビュー（マルチモデル戦略）
- `codex review --commit <SHA>` — 特定コミットのレビュー
- `npm run validate` — 全問データ品質チェック（38ルール、CLI + JSONレポート出力）
- `/dev-tools/review` — データ品質レビューUI（dev serverのみ。`npm run dev` → ブラウザでアクセス）
- `npx tsx scripts/ocr-fusens.ts --all` — 全ページOCR（Gemini 2.5 Flash、6秒間隔）
- `npx tsx scripts/ocr-fusens.ts --status` — OCR進捗確認
- `npx tsx scripts/build-fusens-master.ts` — OCR結果→マスターJSON変換（冪等）
- `npx tsx scripts/build-fusens-master.ts --stats` — 付箋統計
- `/dev-tools/fusen-review` — 付箋レビューUI（dev serverのみ）
- `npx tsx scripts/split-pages.ts --source makio --input /tmp/claude/fusens/pages/` — 見開き→左右分割
- `/dev-tools/fusen-annotate` — 付箋bboxアノテーションUI（dev serverのみ）

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
- 付箋データパイプライン: `ocr-results.json`(生データ) → `fusens-master.json`(ID付きマスター) → `official-notes.ts`(プロダクト用)
- 付箋OCR: `scripts/ocr-fusens.ts`（Gemini 2.5 Flash、bbox座標付き、429失敗時null返却で保存スキップ）
- 付箋マスター型: `scripts/lib/fusens-master-types.ts`（Fusen, FusenMaster）
- 付箋マスター変換: `scripts/lib/fusens-master-core.ts`（ocrToMaster, source fingerprint重複排除）
- 付箋レビューUI: `src/dev-tools/fusen-review/`（既存review/と同パターン、localStorage永続化）
- 付箋アノテーションUI: `src/dev-tools/fusen-annotate/`（Canvas bbox描画、localStorage永続化）
- 付箋アノテーション型: `src/dev-tools/fusen-annotate/types.ts`（NormalizedBbox [y1,x1,y2,x2] 0-1000）
- 付箋ロジック: `utils/CanvasDrawManager.ts`（座標変換・hitTest）、`utils/AnnotationStateManager.ts`（永続化・エクスポート）
- 付箋左右分割画像: `public/images/fusens/sources/makio/page-NNN-left.png`
- split-pagesコア: `scripts/lib/split-pages-core.ts`（parsePageFiles, generatePageIds）
- 付箋画像: `public/images/fusens/page-NNN/note-NN.png`（bbox切り抜き済み）
- 付箋PDF: Google Drive > pharma-exam-ai > fusen-image > fusen-note-makio.pdf → `/tmp/claude/fusens/all-subjects.pdf`
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
- Gemini 2.5 Flash 無料枠: 250RPD/日、10RPM。429エラー時はnullを返し保存しない（0枚保存バグ修正済み）
- `fusens-master.json` は `src/data/` と `public/data/` の両方に存在。`build-fusens-master.ts` が両方に書き出す
- OCRの空ページ（notes:[]）は429失敗の可能性あり。付箋0枚ページは保存しない設計（API失敗=null、本当に空=[]で区別）
- `erasableSyntaxOnly: true` → `constructor(private x: T)` パラメータプロパティ構文は使えない。フィールド宣言+constructor内代入
- `src/` 配下の `__tests__/` は `tsconfig.app.json` の `exclude` で除外済み（vitest globals型がtsc -bで認識されないため）
- ESMスクリプト（tsx）では `__dirname` 未定義 → `fileURLToPath(import.meta.url)` + `path.dirname()` が必要
- `import * as fs from 'fs'`（`import fs from 'fs'` はプロジェクト規約外）
- `npm run build` は既存 `PdfViewer.tsx` の `getOrInsertComputed` エラーで失敗する（既知、付箋関連の変更とは無関係）
- 付箋座標系: 既存パイプライン全体が0-1000正規化。新規コードも必ず0-1000に統一すること

## pdfjs-dist v5 + Vite + Safari 実装ノート（PdfViewer で解決済み、再利用時参照）
- **pdfjs-dist v5.5+** は `Map.prototype.getOrInsertComputed`（TC39 Stage 3）を使用。Safari 18.x以前は未サポート
  - メインスレッド: コンポーネントファイル先頭にポリフィル追加（`src/dev-tools/review/components/PdfViewer.tsx`）
  - Workerスレッド: ポリフィル入りラッパー経由で読み込み（`src/dev-tools/review/pdf-worker-polyfill.js`）
  - Worker は独立スレッドなのでメインスレッドのポリフィルが適用されない。必ず別途対応が必要
- **日本語PDF表示には CMap 設定が必須**: `getDocument({ url, cMapUrl, cMapPacked: true })` を指定しないと文字化け
  - CMapファイルは `node_modules/pdfjs-dist/cmaps/`（169ファイル）に同梱済み
  - Vite dev server: `/@fs${__CMAPS_ROOT__}/` 経由でアクセス（`vite.config.ts` の define で絶対パス注入）
- **render() の useEffect にはクリーンアップ関数が必須**: React StrictMode で2回発火するため
  - `let cancelled = false` + cleanup で `cancelled = true` + `renderTask.cancel()`
  - pdfjs-dist v5 は `#canvasInUse` WeakSet で Canvas 重複使用を検出し、2回目の render でエラーになる
- **render() API**: v5では `pdfPage.render({ canvas, viewport })` が推奨。`canvasContext` は後方互換用で `canvas` 同時指定すると無視される
- **Vite での PDF アクセス**: `/@fs${絶対パス}` パターン。`server.fs.allow` にディレクトリ追加が必要
- **付箋レビューUIでPDF表示を追加する場合**: 上記パターンをそのまま再利用可能。ポリフィルは1箇所に共通化を検討

## マルチモデルレビュー戦略
ユーザーはCodex CLI（GPT-5.4）での各タスクレビューを重視。
実装後に必ず `codex review` を実行し、指摘を修正してからコミット。
過去に発見されたバグ例: 未使用import、ルート判定の過剰マッチ、フィルター状態の残存、連問補完漏れ。

## 設計ドキュメント（Soft Companion リデザイン）
- `docs/superpowers/specs/2026-03-24-phase1-week1-2-redesign-design.md` — HomePage + PracticePage 設計
- `docs/superpowers/specs/2026-03-24-questionpage-redesign-design.md` — QuestionPage 設計（GPT-5.4 Approved）
- `docs/superpowers/specs/2026-03-24-linked-question-redesign-design.md` — 連問横展開 設計（GPT-5.4 Approved、実装計画未作成）
- `docs/superpowers/plans/2026-03-24-questionpage-redesign.md` — QuestionPage 実装計画（12タスク完了）
- `docs/superpowers/specs/2026-03-25-fusen-annotate-ui-design.md` — 付箋アノテーションUI設計（GPT-5.4 Approved）
- `docs/superpowers/plans/2026-03-25-fusen-annotate-ui.md` — アノテーションUI実装計画（12タスク完了）
- `docs/superpowers/specs/2026-03-24-fusens-master-layer-design.md` — 付箋マスター層設計

## データ構造メモ
- `QUESTION_TOPIC_MAP`: Record<questionId, topicId> — 問題→中項目マッピング
- `EXAM_BLUEPRINT`: SubjectBlueprint[] — 科目→大項目→中項目の階層
- `ALL_TOPICS`: { id, major, middle, minor, subject }[] — フラット化したトピック一覧
- `EXEMPLAR_STATS`: 出題頻度統計（yearsAppeared, totalQuestions等）
- `useAnswerHistory()`: { history, getQuestionResult, saveAnswer }
- `useTopicMastery()`: { topicsBySubject, allTopics, getSubjectSummary }
