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

### 課金モデル（2026-03-27改訂。DB設計spec v1.1で確定）
- 🆓 Free: 過去問全3,470問+AI解説。チュートリアル固定問題で付箋+暗記カードを体験可能
- 💎 Pro月額: 980円/月。付箋全1,000枚+暗記カード+分析+クラウド同期
- 💎 Pro年度パス: 7,800円/年（受験年度4月〜翌3月）
- 🏆 Premium（将来）: 1,980円/月。AI類題+先輩コーチAI+個別相談
- 🎯 単発パック（将来）: オリジナル模試、科目別拡張パック等

### 認証・課金の設計判断（2026-03-27確定）
- **認証**: ログイン必須（D案）。LINE Login（主）+ Apple Login（App Store審査用）。ゲストなし
- **決済**: Web=Stripe / アプリ=IAP。DBが唯一の真実源（二重課金防止）
- **DB**: Supabase (PostgreSQL) + RLS。20テーブル。課金は6テーブル分割
- **詳細**: `docs/superpowers/specs/2026-03-27-db-design-spec.md`（v1.1、GPT-5.4×4+エージェント4チームレビュー済み）

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

## 既知の問題・注意事項

### データ保存層の問題（Phase 1 暫定対応済み）
- `answerHistoryRepo` は Phase 1 で常に `LocalAnswerHistoryRepo` を強制使用（`src/repositories/index.ts`）
- 理由: `.env.local` に Supabase 環境変数があると未認証でも `SupabaseAnswerHistoryRepo` が使われ、save が黙って失敗しデータが消失するバグがあった
- `useAnalytics()` は `loadFromStorage('answer_history')` で直接 localStorage を読む（リポジトリ層をバイパス）。Phase 2 で async 化してリポジトリ統一が必要
- `stickyNoteRepo` は Supabase 切替がまだ残っている（同じバグの可能性あり）

### PWA Service Worker キャッシュ
- `vite-plugin-pwa` の `registerType: 'autoUpdate'` でも、スマホブラウザは古いキャッシュを返すことがある
- スマホテスト時は Safari の「Webサイトデータ削除」または別ブラウザで確認
- dev サーバーでも SW が登録される場合あり

### スマホ実機テスト
- `npx vite --host` でLAN公開が必要（`npm run dev` はlocalhost限定）
- Vite のポート番号は起動のたびに変わる可能性あり（5173, 5174, 5175...）
- 未解決: スマホ Safari で演習データが保存されない問題（SW キャッシュが原因の可能性大、要調査）

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
  - **次: スマホ実機テスト（SWキャッシュ問題解決要）→ FlashCardPage リデザイン or オンボーディング**
- **Phase 1 Week 5 完了: NotesPage リデザイン**
  - 276行→39行（86%削減）、Ant Design依存ゼロ
  - 2タブ構成: マイ付箋（ブックマーク済み）/ 全付箋（科目別グリッド）
  - 2列画像グリッド: FusenThumbnail（サムネイル+タイトル+重要度バッジ）
  - 付箋詳細ページ: `/notes/:fusenId`（画像+AI要約+関連問題+暗記カード準備中+CTA）
  - 新規: FusenLibraryCore（純粋関数テスト13件）、useFusenLibrary、useFusenDetail
  - 新規コンポーネント: FusenGrid, SubjectSection, FusenThumbnail, EmptyState, RelatedQuestionList, FusenBreadcrumb, FlashCardSection
  - OfficialNote型変更: linkedCardIds廃止、exemplarIds?/noteType?追加
  - GPT-5.4レビュー: 各タスク後に実行、既知のデータ品質問題（spec §13）のみ検出
  - テスト: 22ファイル417件全パス
  - 設計: `docs/superpowers/specs/2026-03-26-notespage-redesign-design.md`（v1.3、GPT-5.4+Spec Review済み）
  - 計画: `docs/superpowers/plans/2026-03-26-notespage-redesign.md`（v1.1、7タスク全完了）
  - **次: ブラウザ動作確認 → FlashCardPage リデザイン or オンボーディング**
- **学習サイクル循環設計（2026-03-26）**
  - 3機能（演習・付箋・暗記カード）をExemplar（986件）ハブで紐付ける全体設計
  - データモデル: OfficialNoteにexemplarIds追加、FlashCard→FlashCardTemplate+CardProgress分離、linkedCardIds廃止予定
  - 循環ナビ: LearningLinkService（6種Map）、FlashCardPracticeContext、付箋>カード優先ルール
  - カード生成: 付箋ベース+問題解説ベースの2系統バッチ生成、テンプレート公式/進捗ユーザーの分離
  - データ蓄積: user_profiles/purchases/device_tokens/card_review_history/notification_preferences追加
  - プラットフォーム: PWA継続+データ層先取り、行動ログはMixpanel外出し
  - GPT-5.4レビュー3回（セクション1-2-4）+ 5人チームレビュー（PdM/グロース/アナリティクス/アーキテクト/モバイル）
  - 設計: `docs/superpowers/specs/2026-03-26-learning-cycle-architecture-design.md`（v1.2）
  - NotesPage spec v1.3と整合確認済み
  - **次: DB設計spec策定 → FlashCardPage UIリデザイン**
- **付箋→例示マッチング パイプライン（2026-03-26）**
  - 付箋23枚を例示986件にClaude推論でセマンティックマッチング（topicId第一制約）
  - 中間JSON（confidence + reasoning付き）→ レビューUI → official-notes.ts反映の3段階フロー
  - レビューUI: `/dev-tools/exemplar-mapping`（1カラム、fusen-reviewパターン踏襲）
  - 候補単位の承認/却下/primary⇔secondary切替、キーボードナビ、エクスポート機能
  - バリデーションルール5件追加（exists, duplicates, subject, topic, has-exemplars）+ テスト10件
  - official-notes.ts 全23枚に exemplarIds 投入済み
  - GPT-5.4レビュー: 設計spec P1×3修正、実装計画P1×5修正、最終コードP2×2修正
  - テスト: 25ファイル456件全パス
  - 設計: `docs/superpowers/specs/2026-03-26-note-exemplar-mapping-design.md`（v1.1）
  - 計画: `docs/superpowers/plans/2026-03-26-note-exemplar-mapping.md`
  - **次: OCR完了後に1599枚への横展開（1枚ずつClaude推論 × N回、topicId単位でグループ化）→ exemplarIds直接反映 → validateで異常値チェック**
- **付箋→例示マッチングUI改善（2026-03-27）**
  - 同topicId全exemplar折りたたみ一覧 + 手動追加機能（Primary/Secondary選択 → 即approved）
  - `getEffectiveMatches()` 純粋関数を単一真実源に。全操作（表示・一括承認・リセット・エクスポート）を統一
  - MappingReviewState v2（addedMatches追加、v1→v2 migration）
  - キーボードショートカット closest() ベース除外、候補0件ガード
  - GPT-5.4レビュー: 設計spec 3回（P1×7修正）、実装計画 1回（P1×2修正）、最終コード 1回（P1×1修正）
  - テスト: 29ファイル499件全パス
  - **パイプライン判断変更**: マッチング精度が十分（スマホ実機確認済み）なため人間レビューをスキップ。Claude推論（1枚ずつ） → official-notes.ts 直接反映 → validateで異常値チェック。レビューUIは異常値修正用に残す
  - 設計: `docs/superpowers/specs/2026-03-26-exemplar-list-in-mapping-ui-design.md`（v1.1、GPT-5.4×3回）
  - 計画: `docs/superpowers/plans/2026-03-26-exemplar-list-in-mapping-ui.md`（GPT-5.4×1回）
  - **次: 別セッションOCR（1599枚）完了待ち → 1枚ずつClaude推論マッチング → official-notes.ts反映**
- **FlashCard データ層リファクタリング（2026-03-26）**
  - FlashCard → FlashCardTemplate（公式コンテンツ）+ CardProgress（ユーザー進捗）に分離
  - SM2Scheduler 純粋クラス抽出（12テスト）
  - LearningLinkService: 6種Map逆引きサービス（17テスト）
  - サンプルテンプレート10枚（on-001〜on-003 + 問題解説3枚）
  - IFlashCardTemplateRepo（読み取り専用）+ ICardProgressRepo（localStorage CRUD）
  - useFlashCardTemplates / useCardProgress / useLearningLinks フック
  - FlashCardSection: プレースホルダー → カードプレビューリスト（タップ展開）
  - TemplatePractice: テンプレートベース練習コンポーネント（フリップ+SM-2復習ボタン）
  - FlashCardPage: PracticeContext 対応（テンプレート練習 + 旧レガシー復習共存）
  - QuestionPage: onFlashCard → PracticeContext 付き遷移（カード枚数表示）
  - 旧 FlashCard 型に @deprecated マーカー
  - テスト: 24ファイル446件全パス
  - 計画: `docs/superpowers/plans/2026-03-26-flashcard-data-layer.md`
  - **次: FlashCardPage/FlashCardListPage Soft Companion ビジュアルリデザイン**
- **データ品質レビューUI改善（2026-03-25）**
  - PdfViewer PDF描画修正（Safari ポリフィル + CMap + StrictMode対策）
  - 3カラムレイアウト（PDF / カード+メモ / 修正パネル常時表示）
  - 全問表示モード、メモ(note)フィールド、自動クロップ保存、連問シナリオ表示
  - 100回全345問レビュー済み（修正65問 = 19%）
- **選択肢サフィックス漏れ自動修正（2026-03-25）**
  - fix-choice-suffix-leak.ts: 全4,094問スキャン → 391件検出
  - AUTO_HIGH 12問を自動修正適用済み（8年度分のexam-*.ts更新）
  - 残り379件は reports/suffix-leak-review.json に手動レビュー候補
  - GPT-5.4レビュー3回、P1指摘4件修正済み
  - テスト: 21ファイル404件全パス
  - バリデーター新ルール choice-suffix-in-question-text 追加済み（Task 5完了）
  - 次: 101回以降の手動レビュー（レビューUIで年度フィルタ101→全問表示）
- **付箋パイプライン（Phase 2c: 全量パイプライン完走、旧パイプライン完全廃止）**
  - 新パイプライン完走: アノテーション→crop→OCR→マスターJSON（1,642件）
  - フロー: 人間bbox描画 → crop-from-annotation.ts → ocr-cropped-notes.ts → build-fusens-master.ts --from-crop → official-notes.ts
  - アノテーション: **全258ページ完了**（227ページ annotated / 30 skipped / 1 empty）、1,642 bbox
  - crop: **1,642枚の個別画像生成済み** → `public/images/fusens/page-NNN-{left|right}/note-NN.png`
  - OCR: **1,642/1,642枚 完了**（Gemini 2.5 Flash、GCP課金有効、RATE_LIMIT_MS=200ms）
  - マスター: **1,642件**（fusen-0001〜fusen-1642、全draft、topicId未設定）
  - 旧パイプライン完全廃止: 旧154件をマスターから削除、旧画像（page-NNN/）も削除済み
  - アノテーションJSON: `/tmp/claude/fusens/annotation-export-2026-03-26.json`
  - 設計: `docs/superpowers/specs/2026-03-25-fusen-annotate-ui-design.md`（GPT-5.4 Approved）
  - レビューUI: `/dev-tools/fusen-review`（判定+キーボードナビ）
  - パイプライン手順スキル: `pharma-exam-fusen-pipeline`（新PDF追加時に参照）
  - **次: topicId一括設定 → official-notes.ts を23枚→1,642枚に拡大 → exemplarマッチング横展開**
- Ant Design: 未移行ページ（FlashCardPage, FlashCardListPage）がまだ依存中。NotesPageはリデザイン済み
- AppLayout: `REDESIGNED_EXACT` + `matchPath('/practice/:questionId')` でリデザイン済みページを管理

## コマンド
- `npm run dev` — 開発サーバー
- `npm run build` — `tsc -b && vite build`（noUnusedLocals: true、未使用importでエラー）
- `npx vitest run` — テスト（29ファイル499テスト）
- `npx tsc --noEmit` — 型チェックのみ
- `codex review --base <SHA>` — GPT-5.4によるコードレビュー（マルチモデル戦略）
- `codex review --commit <SHA>` — 特定コミットのレビュー
- `npm run validate` — 全問データ品質チェック（44ルール、CLI + JSONレポート出力）
- `/dev-tools/review` — データ品質レビューUI（dev serverのみ。`npm run dev` → ブラウザでアクセス）
- `npx tsx scripts/crop-from-annotation.ts <annotation-json>` — アノテーションJSON→個別画像切り抜き（`--dry-run`対応）
- `npx tsx scripts/ocr-cropped-notes.ts` — 個別画像→Gemini OCR（resume対応、`--status`/`--limit N`/`--all`）**※1プロセスのみ実行**
- `npx tsx scripts/build-fusens-master.ts --from-crop` — crop-OCR結果→マスターJSON変換
- `npx tsx scripts/build-fusens-master.ts --stats` — 付箋統計（半ページ体系の件数も表示）
- `/dev-tools/fusen-review` — 付箋レビューUI（dev serverのみ）
- `npx tsx scripts/split-pages.ts --source makio --input /tmp/claude/fusens/pages/` — 見開き→左右分割
- `/dev-tools/fusen-annotate` — 付箋bboxアノテーションUI（dev serverのみ）
- `/dev-tools/exemplar-mapping` — 付箋→例示マッチングレビューUI（dev serverのみ）
- `npx tsx scripts/fix-choice-suffix-leak.ts` — 選択肢サフィックス漏れ検出（全年度スキャン）
- `npx tsx scripts/fix-choice-suffix-leak.ts --dry-run --year 101` — 年度指定ドライラン
- `npx tsx scripts/fix-choice-suffix-leak.ts --apply` — corrections JSON出力（AUTO_HIGHのみ）

## アーキテクチャ
- デザイントークン: `src/styles/tokens.css`（CSS変数 `--accent`, `--bg`, `--card` 等）
- ベーススタイル: `src/styles/base.css`（`.sc-page`, `.section-title` クラス）
- 共通UIコンポーネント: `src/components/ui/`（Chip, FloatingNav, BottomSheet, QuestionCard 等）
- データ層: `src/data/`（all-questions, exam-blueprint, question-topic-map, exemplar-stats, flashcard-templates）
- カスタムフック: `src/hooks/`（useAnswerHistory, useTopicMastery, useAnalytics, useFlashCards）
- カスタムフック（新規）: `src/hooks/`（useQuestionAnswerState, useTimeTracking, useSwipeNavigation, useOfficialNotes, useBookmarks, useFusenLibrary, useFusenDetail, useFlashCardTemplates, useCardProgress, useLearningLinks）
- カードテンプレート: `src/data/flashcard-templates.ts`（サンプル10枚）、型: `src/types/flashcard-template.ts`
- カード進捗: localStorage `card_progress` キー、型: `src/types/card-progress.ts`
- SM-2 スケジューラ: `src/utils/sm2-scheduler.ts`（純粋クラス、テスト12件）
- 学習循環サービス: `src/utils/learning-link-service.ts`（6種Map逆引き、テスト17件）
- カード練習UI: `src/components/flashcard/TemplatePractice.tsx`（PracticeContext対応、Ant Design）
- ノートドメインコンポーネント: `src/components/notes/`（FusenGrid, SubjectSection, FusenThumbnail, EmptyState, RelatedQuestionList, FusenBreadcrumb, FlashCardSection）
- 付箋コアロジック: `src/utils/fusen-library-core.ts`（FusenLibraryCore — グルーピング・フィルター・ソート・バッジ計算。純粋関数テスト13件）
- 問題ドメインコンポーネント: `src/components/question/`（ProgressHeader, QuestionBody, ChoiceList, ChoiceCard, ActionArea, ResultBanner, ExplanationSection, OfficialNoteCard, NoteImageViewer, MetaAccordion）— LinkedQuestionViewer からも再利用前提
- 公式付箋データ: `src/data/official-notes.ts`（現在23枚、1,642枚への拡大待ち）、型: `src/types/official-note.ts`（linkedCardIds廃止済み、exemplarIds?/noteType?追加）
- データバリデーター: `src/utils/data-validator/`（44ルール、4カテゴリ: 構造/整合性/品質/付箋）
- レビューUI: `src/dev-tools/review/`（Vite dev server統合、本番ビルドに含まれない）
- 修正スクリプト: `scripts/apply-corrections.ts`（中間JSON方式） + `scripts/json-to-exam-ts.ts`
- 選択肢サフィックス漏れ検出: `scripts/fix-choice-suffix-leak.ts`（CLI） + `scripts/lib/suffix-leak-detector.ts`（コアロジック、50テスト）
- レビューUI 3カラム: PDF / ReviewCard+メモ / CorrectionPanel常時表示
- 付箋データパイプライン: annotation JSON → `crop-manifest.json` → `crop-ocr-results.json` → `fusens-master.json` → `official-notes.ts`（旧パイプライン廃止済み。手順スキル: `pharma-exam-fusen-pipeline`）
- 付箋crop: `scripts/crop-from-annotation.ts` + `scripts/lib/crop-annotation-core.ts`（bbox→sharp extract変換、テスト14件）
- 付箋OCR（新）: `scripts/ocr-cropped-notes.ts` + `scripts/lib/ocr-cropped-core.ts`（個別画像テキスト読み取り、bbox検出不要で精度UP、テスト11件）
- 付箋マスター型: `scripts/lib/fusens-master-types.ts`（Fusen, FusenMaster, FusenSource に pageId/side 追加）
- 付箋マスター変換: `scripts/lib/fusens-master-core.ts`（ocrToMaster + cropOcrToMaster, 新旧fingerprint両対応）
- 付箋中間データ: `src/data/fusens/crop-manifest.json`（crop結果、次段OCR用）、`src/data/fusens/crop-ocr-results.json`（OCR結果）
- 付箋→例示マッチング: `src/data/fusens/note-exemplar-mappings.json`（Claude推論結果、confidence+reasoning付き）
- 付箋→例示マッチング型: `src/types/note-exemplar-mapping.ts`（NoteExemplarMatch, MappingEntry, MappingsFile）
- 付箋レビューUI: `src/dev-tools/fusen-review/`（既存review/と同パターン、localStorage永続化）
- 付箋→例示マッチングUI: `src/dev-tools/exemplar-mapping/`（1カラム、候補承認/却下/primary切替 + 同topicId全exemplar折りたたみ一覧 + 手動追加機能）
- effective matches: `src/dev-tools/exemplar-mapping/utils/effective-matches.ts`（getEffectiveMatches — original+added+overridesマージ、テスト13件）
- マッチングUI型: `src/dev-tools/exemplar-mapping/types.ts`（MappingReviewState v2、AddedMatch）
- 付箋アノテーションUI: `src/dev-tools/fusen-annotate/`（Canvas bbox描画、localStorage永続化）
- 付箋アノテーション型: `src/dev-tools/fusen-annotate/types.ts`（NormalizedBbox [y1,x1,y2,x2] 0-1000）
- 付箋ロジック: `utils/CanvasDrawManager.ts`（座標変換・hitTest）、`utils/AnnotationStateManager.ts`（永続化・エクスポート）
- 付箋左右分割画像: `public/images/fusens/sources/makio/page-NNN-left.png`
- split-pagesコア: `scripts/lib/split-pages-core.ts`（parsePageFiles, generatePageIds）
- 付箋画像: `public/images/fusens/page-NNN-{left|right}/note-NN.png`（半ページからcrop、1,642枚）
- 付箋PDF: Google Drive > pharma-exam-ai > fusen-image > fusen-note-makio.pdf → `/tmp/claude/fusens/all-subjects.pdf`
- ブループリント: 科目 → 大項目(MajorCategory) → 中項目(MiddleCategory) の3階層

## 重要なパターン
- 連問セット（linked_group）: `r{year}-{start}-{end}` 形式。セッション開始時に兄弟問題を補完必須
- フィルター階層: 科目 → 大項目 → 中項目。親解除時に子フィルターもクリア必須（隠しフィルターバグ防止）
- z-index設計: FloatingNav(1000) > BottomSheet overlay(900)/sheet(901) > StickyActionBar(800)
- BottomSheet: padding-bottom 100px以上必要（FloatingNavとの被り防止）
- QuestionCard: onClick時は tabIndex + onKeyDown も必要（アクセシビリティ）
- BottomSheet: 閉じている間は aria-hidden + inert で操作不能に
- ページコンポーネントのexportパターン: `export function PageName()`（named export）。`export default` は不可。routes.tsx が `.then(m => ({ default: m.PageName }))` でラップ
- CSS変数: セカンダリテキストは `var(--text-2)`。`var(--text-sub)` は存在しない
- ロジック分離パターン: FusenLibraryCore のように純粋クラスに抽出 → フック(useFusenLibrary)がラップ → コンポーネントはフック経由で使用。テストはクラスに対して行う
- exemplar-mapping effective list パターン: `entry.matches` を直接参照せず `getEffectiveMatches()` を単一真実源にする。手動追加分の Exemplar lookup は `exemplarById` Map でフォールバック
- キーボードショートカット除外: `tagName` ベースではなく `closest('button, summary, [contenteditable], input, textarea, select')` が堅牢

## Vite dev server の注意事項
- `server.fs.allow` を明示指定すると**プロジェクトルートのデフォルト許可が消える** → 必ず `__dirname` を先頭に含める
- `public/` 外のファイル配信: `/@fs` + 絶対パス（例: `/@fs/Users/ai/.../file`）。相対パス（`/data/pdfs/file`）では不可
- `define` で絶対パス注入時、パスは `/` で始まるので `/@fs${path}` と結合（`/@fs/${path}` だとスラッシュ重複 → 403）

## 開発時の注意事項（gotchas）
- `jsx: react-jsx` 設定のため `React.KeyboardEvent` 等の名前空間型は使えない → `import type { KeyboardEvent } from 'react'` を使う
- `@testing-library/react` / jsdom 未導入。フックのテストはロジックをクラスに分離して純粋関数テスト（TimeTracker, AnswerStateManager, SwipeNavigator パターン）
- `codex review --commit <SHA>` にプロンプトを渡すときは stdin（heredoc）を使う。引数としては渡せない
- `codex review --base <SHA>` と `codex review --commit <SHA>` は排他。同時指定不可（エラーになる）
- `codex exec "プロンプト"` で GPT-5.4 に設計レビュー等の自由質問が可能
- official-notes.ts の linkedQuestionIds は暫定マッピング（question-topic-mapから逆引き）。本格運用時にトピック紐付けで自動化予定
- Gemini 2.5 Flash: GCP課金有効（$300クレジット）、RATE_LIMIT_MS=200ms。旧無料枠（250RPD/10RPM）から大幅緩和済み
- ocr-cropped-notes.ts は**必ず1プロセスのみ実行**。並列実行すると `.tmp` ファイル rename 競合で ENOENT クラッシュ
- `fusens-master.json` は `src/data/` と `public/data/` の両方に存在。`build-fusens-master.ts` が両方に書き出す
- OCRの空ページ（notes:[]）は429失敗の可能性あり。付箋0枚ページは保存しない設計（API失敗=null、本当に空=[]で区別）
- `erasableSyntaxOnly: true` → `constructor(private x: T)` パラメータプロパティ構文は使えない。フィールド宣言+constructor内代入
- `src/` 配下の `__tests__/` は `tsconfig.app.json` の `exclude` で除外済み（vitest globals型がtsc -bで認識されないため）
- ESMスクリプト（tsx）では `__dirname` 未定義 → `fileURLToPath(import.meta.url)` + `path.dirname()` が必要
- `import * as fs from 'fs'`（`import fs from 'fs'` はプロジェクト規約外）
- `Object.defineProperty` でMap prototypeポリフィルする場合、`@ts-ignore` が必要（`getOrInsertComputed` は TypeScript 未定義）
- corrections JSON形式: `apply-corrections.ts` はフラット配列を期待。レビューUIの `CorrectionsFile`（`Record<qId, {items}>` 形式）とは異なるので注意
- suffix-leak検出: 複数ターミネータ（連問テキスト）は即null返却が安全。AUTO_MEDIUMの自動適用は危険（GPT-5.4 P1指摘）
- 付箋座標系: 既存パイプライン全体が0-1000正規化。新規コードも必ず0-1000に統一すること
- 付箋座標系は半ページ画像基準の0-1000正規化（旧パイプライン廃止済み）
- `scripts/lib/` のコードは `src/` から import 不可（ビルドスコープ外）。同じロジックが必要な場合はインラインか `src/utils/` に配置
- textSummaryは実画像の内容と正確に一致させること（GPT-5.4 P1指摘: 画像と矛盾するサマリーはユーザーに誤情報を与える）

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
2026-03-25: P1指摘4件（連問テキスト誤検出、非suffix行AUTO_HIGH昇格、corrections JSON形式非互換、AUTO_MEDIUM自動適用の危険性）
2026-03-25: P1指摘3件（付箋textSummaryと実画像の内容不一致: ヨウ素CT/壊変表/被曝線量）+ P2指摘1件（濃度ノートのtopicId誤り）
設計レビューも `codex exec` で可能（スクリプト設計方針の妥当性確認等）
- 設計レビュー: `codex exec "プロンプト" 2>&1` — 非対話モードでGPT-5.4に設計レビュー依頼
- コミットレビュー: `codex review --commit <SHA>` — 差分ベースのコードレビュー
- 複数コミット: `codex review --base <SHA>` — ベースからHEADまでまとめてレビュー
- 設計書には必ず「GPT-5.4レビュー対応記録」セクションを設けて修正履歴を残す

## 設計ドキュメント（Soft Companion リデザイン）
- `docs/superpowers/specs/2026-03-24-phase1-week1-2-redesign-design.md` — HomePage + PracticePage 設計
- `docs/superpowers/specs/2026-03-24-questionpage-redesign-design.md` — QuestionPage 設計（GPT-5.4 Approved）
- `docs/superpowers/specs/2026-03-24-linked-question-redesign-design.md` — 連問横展開 設計（GPT-5.4 Approved、実装計画未作成）
- `docs/superpowers/plans/2026-03-24-questionpage-redesign.md` — QuestionPage 実装計画（12タスク完了）
- `docs/superpowers/specs/2026-03-25-fusen-annotate-ui-design.md` — 付箋アノテーションUI設計（GPT-5.4 Approved）
- `docs/superpowers/plans/2026-03-25-fusen-annotate-ui.md` — アノテーションUI実装計画（12タスク完了）
- `docs/superpowers/specs/2026-03-24-fusens-master-layer-design.md` — 付箋マスター層設計
- `docs/superpowers/plans/2026-03-25-fix-choice-suffix-leak.md` — 選択肢サフィックス漏れ修正計画（全5タスク完了）
- `docs/superpowers/specs/2026-03-26-learning-cycle-architecture-design.md` — **学習サイクル循環設計 v1.2**（3機能紐付け+ナビ+カード生成+DB蓄積、GPT-5.4×3回+5人チームレビュー済み）
- `docs/superpowers/specs/2026-03-26-notespage-redesign-design.md` — NotesPage リデザイン v1.3（循環設計と整合済み、§4.1暗記カード実装済み）
- `docs/superpowers/specs/2026-03-27-db-design-spec.md` — **DB設計spec v1.1**（20テーブルDDL+RLS+課金6テーブル+認証+削除、GPT-5.4×4+エージェント4チームレビュー済み）
- `docs/superpowers/plans/2026-03-26-notespage-redesign.md` — NotesPage 実装計画 v1.1（7タスク全完了、GPT-5.4+Spec Review済み）
- `docs/superpowers/plans/2026-03-26-flashcard-data-layer.md` — **FlashCard データ層実装計画**（14タスク全完了）

## データ構造メモ
- `QUESTION_TOPIC_MAP`: Record<questionId, topicId> — 問題→中項目マッピング
- `EXAM_BLUEPRINT`: SubjectBlueprint[] — 科目→大項目→中項目の階層
- `ALL_TOPICS`: { id, major, middle, minor, subject }[] — フラット化したトピック一覧
- `EXEMPLAR_STATS`: 出題頻度統計（yearsAppeared, totalQuestions等）
- `useAnswerHistory()`: { history, getQuestionResult, saveAnswer }
- `useTopicMastery()`: { topicsBySubject, allTopics, getSubjectSummary }
- `FLASHCARD_TEMPLATES`: FlashCardTemplate[]（サンプル10枚、source_type='fusen'|'explanation'）
- `useFlashCardTemplates()`: { templates, getByExemplarId, getBySourceId }
- `useCardProgress()`: { allProgress, dueProgress, reviewCard, getProgressForTemplate }
- `useLearningLinks()`: LearningLinkService（6種Map逆引き）
- `FlashCardPracticeContext`: { mode, exemplarId?, noteId?, cardIds, returnTo } — カード練習の文脈
