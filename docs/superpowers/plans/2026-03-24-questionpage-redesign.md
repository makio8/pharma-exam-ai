# QuestionPage Soft Companion リデザイン 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** QuestionPage を Ant Design から Soft Companion デザインシステムにフルリデザインし、公式付箋の自動表示・ブックマーク・スワイプナビゲーションを実装する。

**Architecture:** フロー型レイアウト（解答→解説→公式付箋が1本の縦スクロール）。730行の QuestionPage を 10+ の小コンポーネントと 5 つのカスタムフックに分割。既存 AnswerHistory は後方互換で拡張。

**Tech Stack:** React 19 / TypeScript 5.9 / Vite 8 / CSS Modules / Soft Companion デザインシステム（tokens.css + base.css）

**Design Spec:** `docs/superpowers/specs/2026-03-24-questionpage-redesign-design.md`

**Review Protocol:** 各タスク完了後に `codex review --commit <SHA>` でGPT-5.4レビュー必須。指摘があれば修正してから次タスクへ。

---

## ファイル構成（全体マップ）

### 新規作成ファイル

| ファイル | 責務 |
|---------|------|
| `src/types/official-note.ts` | OfficialNote, BookmarkedNote 型定義 |
| `src/data/official-notes.ts` | モックデータ（5-10枚） |
| `src/hooks/useTimeTracking.ts` | Page Visibility 対応の解答時間計測 |
| `src/hooks/useQuestionAnswerState.ts` | 回答ロジック凝集（選択・送信・スキップ） |
| `src/hooks/useOfficialNotes.ts` | 問題→付箋ルックアップ |
| `src/hooks/useBookmarks.ts` | 付箋ブックマーク CRUD |
| `src/hooks/useSwipeNavigation.ts` | タッチスワイプ + 前後問題計算 |
| `src/hooks/__tests__/useTimeTracking.test.ts` | 時間計測テスト |
| `src/hooks/__tests__/useQuestionAnswerState.test.ts` | 回答ロジックテスト |
| `src/hooks/__tests__/useSwipeNavigation.test.ts` | ナビゲーションテスト |
| `src/components/question/ProgressHeader.tsx` | 問番号 + 科目 |
| `src/components/question/ProgressHeader.module.css` | |
| `src/components/question/QuestionBody.tsx` | 問題文 + 画像 |
| `src/components/question/QuestionBody.module.css` | |
| `src/components/question/ChoiceCard.tsx` | 個別選択肢カード |
| `src/components/question/ChoiceList.tsx` | 選択肢グループ |
| `src/components/question/Choice.module.css` | |
| `src/components/question/ActionArea.tsx` | わからん + 解答ボタン |
| `src/components/question/ActionArea.module.css` | |
| `src/components/question/ResultBanner.tsx` | 正誤表示 |
| `src/components/question/ResultBanner.module.css` | |
| `src/components/question/ExplanationSection.tsx` | AI解説 |
| `src/components/question/ExplanationSection.module.css` | |
| `src/components/question/OfficialNoteCard.tsx` | 公式付箋カード |
| `src/components/question/OfficialNoteCard.module.css` | |
| `src/components/question/NoteImageViewer.tsx` | 画像拡大（BottomSheet） |
| `src/components/question/MetaAccordion.tsx` | 詳細情報折りたたみ |
| `src/components/question/MetaAccordion.module.css` | |
| `src/components/question/index.ts` | barrel export |
| `src/pages/QuestionPage.module.css` | ページ固有スタイル |

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/types/question.ts` | AnswerHistory 後方互換拡張（null, optional, skipped） |
| `src/types/note.ts` | OfficialNote, BookmarkedNote の export 追加 |
| `src/repositories/supabase/answerHistoryRepo.ts` | null/skipped 対応 |
| `src/components/layout/AppLayout.tsx` | matchPath で QuestionPage をリデザイン対象に追加 |
| `src/pages/QuestionPage.tsx` | フルリライト（730行 → ~200行のコンテナ） |

---

## Task 1: 型定義とモックデータ

**Files:**
- Modify: `src/types/question.ts:88-97` (AnswerHistory 拡張)
- Create: `src/types/official-note.ts`
- Modify: `src/types/note.ts` (re-export 追加)
- Create: `src/data/official-notes.ts`

- [ ] **Step 1: AnswerHistory を後方互換で拡張**

`src/types/question.ts` の AnswerHistory を変更:
```typescript
export interface AnswerHistory {
  id: string
  user_id: string
  question_id: string
  selected_answer: number | number[] | null  // null追加
  is_correct: boolean
  answered_at: string
  confidence_level?: ConfidenceLevel         // optional化
  time_spent_seconds?: number
  skipped?: boolean                          // 新規
}
```

- [ ] **Step 2: OfficialNote, BookmarkedNote 型を作成**

`src/types/official-note.ts` を作成（設計書 §6.1 参照）。

- [ ] **Step 3: モックデータ作成**

`src/data/official-notes.ts` にモック 5-10 枚。`linkedQuestionIds` は 3桁ゼロ埋め形式（`r111-001`）。
実データの `ALL_TOPICS` から実在する topicId を使用すること。

- [ ] **Step 4: ビルド確認**

Run: `npm run build`
Expected: 成功（既存コードへの影響なし。型は optional 追加のみ）

- [ ] **Step 5: Codex レビュー & コミット**

```bash
git add src/types/question.ts src/types/official-note.ts src/types/note.ts src/data/official-notes.ts
git commit -m "feat: OfficialNote型定義とモックデータ、AnswerHistory後方互換拡張"
codex review --commit $(git rev-parse HEAD)
```

---

## Task 2: Supabase repo 層の後方互換修正 + DBマイグレーション

**Files:**
- Modify: `src/repositories/supabase/answerHistoryRepo.ts:25-50,70-81`

**注意（※ GPT-5.4 P1指摘）**: repo コード修正だけでなく、DB スキーマ変更が必須。
現時点では Supabase は未使用（localStorage のみ）なので、マイグレーション SQL をファイルに記録し、Supabase 有効化時に実行する運用とする。

- [ ] **Step 1: save() の null/optional 対応**

```typescript
// save() の insert 部分を修正
.insert({
  user_id: user.id,
  question_id: answer.question_id as unknown as string,
  selected_answer: answer.selected_answer,        // null を許容
  is_correct: answer.is_correct,
  confidence_level: answer.confidence_level ?? null, // optional → null
  time_spent_seconds: answer.time_spent_seconds || null,
  skipped: answer.skipped ?? false,                // 新規
})
```

- [ ] **Step 2: mapRow() の skipped/null 対応**

```typescript
private mapRow(row: Record<string, unknown>): AnswerHistory {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    question_id: row.question_id as string,
    selected_answer: row.selected_answer as number | number[] | null,
    is_correct: row.is_correct as boolean,
    answered_at: row.answered_at as string,
    confidence_level: (row.confidence_level as AnswerHistory['confidence_level']) ?? undefined,
    time_spent_seconds: row.time_spent_seconds as number | undefined,
    skipped: (row.skipped as boolean) ?? false,
  }
}
```

- [ ] **Step 3: DBマイグレーション SQL を記録**

`supabase/migrations/20260324_answer_history_skipped.sql` を作成:
```sql
-- QuestionPage リデザイン: スキップ機能 + 自信度廃止の後方互換対応
ALTER TABLE answer_history ALTER COLUMN confidence_level DROP NOT NULL;
ALTER TABLE answer_history ALTER COLUMN selected_answer DROP NOT NULL;
ALTER TABLE answer_history ADD COLUMN IF NOT EXISTS skipped boolean DEFAULT false;
```
※ 現時点では localStorage のみ使用。Supabase 有効化時にこの SQL を実行する。

- [ ] **Step 4: ビルド確認**

Run: `npm run build`
Expected: 成功

- [ ] **Step 5: Codex レビュー & コミット**

```bash
git add src/repositories/supabase/answerHistoryRepo.ts supabase/migrations/20260324_answer_history_skipped.sql
git commit -m "fix: AnswerHistory repo層をnull/skipped対応に拡張 + DBマイグレーション追加"
codex review --commit $(git rev-parse HEAD)
```

---

## Task 3: useTimeTracking フック

**Files:**
- Create: `src/hooks/useTimeTracking.ts`
- Create: `src/hooks/__tests__/useTimeTracking.test.ts`

- [ ] **Step 1: テスト作成**

`src/hooks/__tests__/useTimeTracking.test.ts`:
- questionId 変更で時間がリセットされること
- getElapsedSeconds() が経過時間を返すこと
- （Page Visibility は JSDOM では限界があるのでロジック単体テスト中心）

- [ ] **Step 2: テスト実行で失敗確認**

Run: `npx vitest run src/hooks/__tests__/useTimeTracking.test.ts`
Expected: FAIL

- [ ] **Step 3: useTimeTracking 実装**

`src/hooks/useTimeTracking.ts`:
- `useRef` で startTime, visibleTime を内部管理
- `useEffect` で Page Visibility API のリスナー登録
- questionId 変更を deps で検知して自動 reset
- `getElapsedSeconds()` で可視時間のみを返す

- [ ] **Step 4: テスト通過確認**

Run: `npx vitest run src/hooks/__tests__/useTimeTracking.test.ts`
Expected: PASS

- [ ] **Step 5: Codex レビュー & コミット**

```bash
git add src/hooks/useTimeTracking.ts src/hooks/__tests__/useTimeTracking.test.ts
git commit -m "feat: useTimeTracking フック（Page Visibility対応の解答時間計測）"
codex review --commit $(git rev-parse HEAD)
```

---

## Task 4: useQuestionAnswerState フック

**Files:**
- Create: `src/hooks/useQuestionAnswerState.ts`
- Create: `src/hooks/__tests__/useQuestionAnswerState.test.ts`

- [ ] **Step 1: テスト作成**

テストケース:
- 初期状態: isAnswered=false, selectedAnswer=null, canSubmit=false
- selectAnswer(3) → selectedAnswer=3, canSubmit=true
- submitAnswer(elapsedSeconds) → isAnswered=true, isCorrect が正誤に応じて設定、saveAnswer に time_spent_seconds を含む
- skipQuestion(elapsedSeconds) → isAnswered=true, isSkipped=true, isCorrect=false、saveAnswer に time_spent_seconds + skipped:true を含む
- 複数選択: selectMultiAnswers([1,3]) → selectedAnswers=[1,3]
- requiredCount と選択数が合えば canSubmit=true
- existingResult: useAnswerHistory から既存結果が反映されること

- [ ] **Step 2: テスト実行で失敗確認**

Run: `npx vitest run src/hooks/__tests__/useQuestionAnswerState.test.ts`
Expected: FAIL

- [ ] **Step 3: useQuestionAnswerState 実装**

- `useAnswerHistory()` から `getQuestionResult`, `saveAnswer` を取得
- 選択・送信・スキップのロジックを凝集
- **`submitAnswer(elapsedSeconds)` / `skipQuestion(elapsedSeconds)` で経過時間を受け取り、`saveAnswer` に `time_spent_seconds` として渡す**（※ GPT-5.4 P1指摘: 時間保存の退行防止）
- `useEffect` で history ロード完了後に existingResult を同期
- isMulti, requiredCount は question から算出

- [ ] **Step 4: テスト通過確認**

Run: `npx vitest run src/hooks/__tests__/useQuestionAnswerState.test.ts`
Expected: PASS

- [ ] **Step 5: Codex レビュー & コミット**

```bash
git add src/hooks/useQuestionAnswerState.ts src/hooks/__tests__/useQuestionAnswerState.test.ts
git commit -m "feat: useQuestionAnswerState フック（回答ロジック凝集）"
codex review --commit $(git rev-parse HEAD)
```

---

## Task 5: useSwipeNavigation フック

**Files:**
- Create: `src/hooks/useSwipeNavigation.ts`
- Create: `src/hooks/__tests__/useSwipeNavigation.test.ts`

- [ ] **Step 1: テスト作成**

テストケース:
- sessionIds=['a','b','c'], currentId='b' → prevId='a', nextId='c', currentIndex=1, totalCount=3
- currentId='a' → canGoPrev=false, canGoNext=true
- currentId='c' → canGoPrev=true, canGoNext=false
- 連問グループスキップ: linked_group を持つ問題は getGroupStartId() でグループ先頭に飛ぶ

- [ ] **Step 2: テスト実行で失敗確認**

Run: `npx vitest run src/hooks/__tests__/useSwipeNavigation.test.ts`
Expected: FAIL

- [ ] **Step 3: useSwipeNavigation 実装**

- prevId/nextId 計算（linked_group 対応）
- タッチイベントハンドラー（onTouchStart/Move/End）
- 閾値 50px 以上のスワイプで navigate 実行
- goPrev/goNext は `useNavigate()` で `/practice/${id}` に遷移

- [ ] **Step 4: テスト通過確認**

Run: `npx vitest run src/hooks/__tests__/useSwipeNavigation.test.ts`
Expected: PASS

- [ ] **Step 5: Codex レビュー & コミット**

```bash
git add src/hooks/useSwipeNavigation.ts src/hooks/__tests__/useSwipeNavigation.test.ts
git commit -m "feat: useSwipeNavigation フック（スワイプ+連問スキップ）"
codex review --commit $(git rev-parse HEAD)
```

---

## Task 6: useOfficialNotes + useBookmarks フック

**Files:**
- Create: `src/hooks/useOfficialNotes.ts`
- Create: `src/hooks/useBookmarks.ts`

- [ ] **Step 1: useOfficialNotes 実装**

- `OFFICIAL_NOTES` から `linkedQuestionIds` に questionId を含む付箋を抽出
- `useMemo` で逆引きマップを構築
- 返り値: `{ notes: OfficialNote[], isLoading: boolean }`

- [ ] **Step 2: useBookmarks 実装**

- localStorage に `bookmarked_notes` キーで保存
- `isBookmarked(noteId)` → boolean
- `toggleBookmark(noteId)` → 追加/削除
- BookmarkedNote の id は `crypto.randomUUID()` で生成

- [ ] **Step 3: ビルド確認**

Run: `npm run build`
Expected: 成功

- [ ] **Step 4: Codex レビュー & コミット**

```bash
git add src/hooks/useOfficialNotes.ts src/hooks/useBookmarks.ts
git commit -m "feat: useOfficialNotes + useBookmarks フック"
codex review --commit $(git rev-parse HEAD)
```

---

## Task 7: 解答前コンポーネント群（ProgressHeader, QuestionBody, ChoiceList, ActionArea）

**Files:**
- Create: `src/components/question/ProgressHeader.tsx` + `.module.css`
- Create: `src/components/question/QuestionBody.tsx` + `.module.css`
- Create: `src/components/question/ChoiceCard.tsx`
- Create: `src/components/question/ChoiceList.tsx`
- Create: `src/components/question/Choice.module.css`
- Create: `src/components/question/ActionArea.tsx` + `.module.css`

- [ ] **Step 1: ProgressHeader 実装**

```tsx
interface Props {
  subject: string       // 科目名
  currentIndex: number  // 0-based
  totalCount: number
  canGoPrev: boolean
  canGoNext: boolean
}
```
表示: `薬理  問 3/10  ← →`
CSS: `var(--text-2)` で控えめ、矢印は canGo で opacity 切替

- [ ] **Step 2: QuestionBody 実装**

```tsx
interface Props {
  bodyText: string
  imageUrl?: string
  displayMode: 'text' | 'image' | 'both'
}
```
- displayMode で表示切替（既存 `getDisplayMode()` を利用）
- imageUrl がある場合: `<img>` + fallback SVG
- bodyText: `white-space: pre-wrap` で整形保持

- [ ] **Step 3: ChoiceCard + ChoiceList 実装**

ChoiceCard props:
```tsx
interface Props {
  choiceKey: number
  text: string
  state: 'default' | 'selected' | 'correct' | 'incorrect' | 'dimmed'
  isMulti: boolean
  disabled: boolean
  onClick: () => void
}
```
ChoiceList: question と answerState を受け取り、問題タイプ（単一/複数/数値）に応じて ChoiceCard を描画。
- 数値入力: 1-9 のボタングリッド
- 複数選択: 「N個選んでください（M/N）」ヒント
- アクセシビリティ: role, aria-checked, tabIndex, onKeyDown

- [ ] **Step 4: ActionArea 実装**

```tsx
interface Props {
  canSubmit: boolean
  onSubmit: () => void
  onSkip: () => void
  isAnswered: boolean
}
```
- 解答前: 「わからん」テキストリンク + グラデーションCTA
- 解答後: 非表示
- disabled 理由を aria-describedby で表示

- [ ] **Step 5: ビルド確認**

Run: `npm run build`
Expected: 成功（未使用 import がないこと確認）

- [ ] **Step 6: Codex レビュー & コミット**

```bash
git add src/components/question/ProgressHeader.tsx src/components/question/ProgressHeader.module.css \
  src/components/question/QuestionBody.tsx src/components/question/QuestionBody.module.css \
  src/components/question/ChoiceCard.tsx src/components/question/ChoiceList.tsx src/components/question/Choice.module.css \
  src/components/question/ActionArea.tsx src/components/question/ActionArea.module.css
git commit -m "feat: 解答前コンポーネント群（ProgressHeader, QuestionBody, ChoiceList, ActionArea）"
codex review --commit $(git rev-parse HEAD)
```

---

## Task 8: 解答後コンポーネント群（ResultBanner, ExplanationSection, MetaAccordion）

**Files:**
- Create: `src/components/question/ResultBanner.tsx` + `.module.css`
- Create: `src/components/question/ExplanationSection.tsx` + `.module.css`
- Create: `src/components/question/MetaAccordion.tsx` + `.module.css`

- [ ] **Step 1: ResultBanner 実装**

```tsx
interface Props {
  isCorrect: boolean
  isSkipped: boolean
  correctAnswer: number | number[]
  elapsedSeconds: number
}
```
- 正解/不正解/スキップの3パターン（設計書 §5 参照）
- 時間フォーマット: <60s → "12.3秒", ≥60s → "1:23"
- `aria-live="polite"` で読み上げ対応

- [ ] **Step 2: ExplanationSection 実装**

```tsx
interface Props {
  explanation: string
}
```
- カード内に `white-space: pre-wrap` でテキスト表示
- 設計書 §5 のスタイル（var(--card), var(--r-card), padding 20px）

- [ ] **Step 3: MetaAccordion 実装**

```tsx
interface Props {
  question: Question
  topicName?: string
}
```
- デフォルト閉じ。タップ/Enter で展開
- 回次、区分、科目、分野（Chip コンポーネント使用）、タグ、正答率
- `max-height` + `transition 0.3s` でアニメーション

- [ ] **Step 4: ビルド確認**

Run: `npm run build`
Expected: 成功

- [ ] **Step 5: Codex レビュー & コミット**

```bash
git add src/components/question/ResultBanner.tsx src/components/question/ResultBanner.module.css \
  src/components/question/ExplanationSection.tsx src/components/question/ExplanationSection.module.css \
  src/components/question/MetaAccordion.tsx src/components/question/MetaAccordion.module.css
git commit -m "feat: 解答後コンポーネント群（ResultBanner, ExplanationSection, MetaAccordion）"
codex review --commit $(git rev-parse HEAD)
```

---

## Task 9: 公式付箋コンポーネント（OfficialNoteCard + NoteImageViewer）

**Files:**
- Create: `src/components/question/OfficialNoteCard.tsx` + `.module.css`
- Create: `src/components/question/NoteImageViewer.tsx`

- [ ] **Step 1: OfficialNoteCard 実装**

```tsx
interface Props {
  note: OfficialNote
  isBookmarked: boolean
  onToggleBookmark: () => void
  onFlashCard: () => void
  onImageTap: () => void
}
```
- 手書き画像（bg: #faf5ee、タップで拡大）
- title + textSummary（max 3行）
- 重要度バッジ（🔥/📊/📝 + N問で使う知識）
- ☆保存 / 🃏暗記カード ボタン
- Premium 付箋: blur(8px) + 🔒マーク

- [ ] **Step 2: NoteImageViewer 実装**

- 既存 BottomSheet コンポーネントを wrap
- 画像を `object-fit: contain` で全画面表示
- 閉じるボタン

- [ ] **Step 3: 暗記カード導線の実装（※ GPT-5.4 P2指摘）**

`onFlashCard` の実装方針:
- `navigate('/cards/review', { state: { filterCardIds: note.linkedCardIds } })` で state 渡し
- FlashCardPage 側の変更は**今回スコープ外**（既存 FlashCardPage は `dueCards` 全体を表示）
- 将来: FlashCardPage が `location.state.filterCardIds` を読んでフィルタリング
- 今回: ボタンは配置するが、遷移先は `/cards/review`（フィルタリングなし）で暫定動作
- TODO コメントで「linkedCardIds によるフィルタリングは FlashCardPage リデザイン時に対応」を明記

- [ ] **Step 4: ビルド確認**

Run: `npm run build`
Expected: 成功

- [ ] **Step 5: Codex レビュー & コミット**

```bash
git add src/components/question/OfficialNoteCard.tsx src/components/question/OfficialNoteCard.module.css \
  src/components/question/NoteImageViewer.tsx
git commit -m "feat: 公式付箋コンポーネント（OfficialNoteCard + NoteImageViewer）"
codex review --commit $(git rev-parse HEAD)
```

---

## Task 10: AppLayout の REDESIGNED_EXACT 更新（※ Task 11 から前倒し — GPT-5.4 P2指摘）

**Files:**
- Modify: `src/components/layout/AppLayout.tsx:1-5,28-36`

- [ ] **Step 1: matchPath import 追加 + 判定ロジック変更**

```typescript
import { matchPath } from 'react-router-dom'

const REDESIGNED_EXACT = ['/', '/practice']

const isRedesigned =
  REDESIGNED_EXACT.includes(location.pathname) ||
  matchPath('/practice/:questionId', location.pathname) !== null
```

- [ ] **Step 2: ビルド確認**

Run: `npm run build`
Expected: 成功

- [ ] **Step 3: Codex レビュー & コミット**

```bash
git add src/components/layout/AppLayout.tsx
git commit -m "feat: AppLayoutでQuestionPageをリデザイン対象に追加（matchPath使用）"
codex review --commit $(git rev-parse HEAD)
```

---

## Task 11: barrel export + QuestionPage フルリライト

**Files:**
- Create: `src/components/question/index.ts`
- Create: `src/pages/QuestionPage.module.css`
- Modify: `src/pages/QuestionPage.tsx` (フルリライト)

- [ ] **Step 1: barrel export 作成**

`src/components/question/index.ts`:
```typescript
export { ProgressHeader } from './ProgressHeader'
export { QuestionBody } from './QuestionBody'
export { ChoiceList } from './ChoiceList'
export { ChoiceCard } from './ChoiceCard'
export { ActionArea } from './ActionArea'
export { ResultBanner } from './ResultBanner'
export { ExplanationSection } from './ExplanationSection'
export { OfficialNoteCard } from './OfficialNoteCard'
export { NoteImageViewer } from './NoteImageViewer'
export { MetaAccordion } from './MetaAccordion'
```

- [ ] **Step 2: QuestionPage.module.css 作成**

- `.sc-page` ベース（base.css）
- セクション間余白 24px
- スワイプ中のスライドアニメーション

- [ ] **Step 3: QuestionPage.tsx フルリライト**

既存 730行 → ~200行のコンテナに。
- Ant Design import を全て削除
- useQuestionAnswerState, useTimeTracking, useSwipeNavigation, useOfficialNotes, useBookmarks を束ねる
- コンポーネント群を配置
- 解答後の自動スクロール（scrollIntoView）
- スワイプハンドラーをルート要素に適用
- 404 ケース: カスタム表示（Result コンポーネント不要）
- sessionIds のロード（localStorage.practice_session → fallback to ALL_QUESTIONS）

**重要**: 既存の LinkedQuestionViewer への分岐（`linkedGroup ? <LinkedQuestionViewer> : ...`）はそのまま維持。連問は次フェーズ。

- [ ] **Step 4: ビルド確認**

Run: `npm run build`
Expected: 成功。未使用 import エラーなし（`noUnusedLocals: true`）

- [ ] **Step 5: 開発サーバーで動作確認**

Run: `npm run dev`
確認ポイント:
- 単問表示が Soft Companion デザインで表示される
- 選択肢の選択→解答→正誤表示が動作する
- 「わからん」ボタンが動作する
- 公式付箋が表示される（モックデータに linkedQuestionIds がマッチする問題で確認）
- スワイプで前後の問題に移動できる
- FloatingNav が表示される
- 連問（linked_group）は既存 LinkedQuestionViewer にフォールバックする

- [ ] **Step 6: Codex レビュー & コミット**

```bash
git add src/components/question/index.ts src/pages/QuestionPage.tsx src/pages/QuestionPage.module.css
git commit -m "feat: QuestionPageをSoft Companionデザインでフルリライト"
codex review --commit $(git rev-parse HEAD)
```

---

## Task 12: 全体テスト + ビルド確認 + 最終レビュー

**Files:** なし（確認のみ）

- [ ] **Step 1: 全テスト実行**

Run: `npx vitest run`
Expected: 全テスト PASS（既存 20 + 新規テスト）

- [ ] **Step 2: プロダクションビルド**

Run: `npm run build`
Expected: 成功、警告なし

- [ ] **Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: 開発サーバーで E2E 動作確認**

Run: `npm run dev`
確認チェックリスト:
- [ ] ホーム画面 → 演習 → 問題選択 → QuestionPage 遷移
- [ ] 単問: 選択肢タップ → 解答 → 正誤 → 解説 → 公式付箋
- [ ] 「わからん」→ スキップ → 正解表示 → 解説
- [ ] 公式付箋: 画像タップ → 全画面 → 閉じる
- [ ] 公式付箋: ☆ブックマーク → 保存 → 再度タップで解除
- [ ] スワイプ: 左右で前後問題に移動
- [ ] プログレス: 「問 3/10」が正しく更新
- [ ] 連問: linked_group の問題は LinkedQuestionViewer にフォールバック
- [ ] FloatingNav: 表示され、ホーム/演習/ノート/分析に遷移可能
- [ ] 詳細情報: アコーディオン展開で回次/科目/タグ表示
- [ ] 解答時間: ResultBanner に秒数表示

- [ ] **Step 5: Codex 最終レビュー**

```bash
codex review --base <Task1のコミットSHA の1つ前>
```
全変更を一括レビュー。

- [ ] **Step 6: （指摘があれば修正して新規コミット）**

---

## 依存関係グラフ

```
Task 1 (型定義+モック)
  ├──→ Task 2 (Supabase repo + DBマイグレーション)
  ├──→ Task 3 (useTimeTracking)
  ├──→ Task 4 (useQuestionAnswerState) ←── Task 3 に依存
  ├──→ Task 5 (useSwipeNavigation)
  └──→ Task 6 (useOfficialNotes + useBookmarks)
         │
         ▼
Task 7 (解答前コンポーネント) ←── Task 4
Task 8 (解答後コンポーネント)
Task 9 (公式付箋コンポーネント) ←── Task 6
         │
         ▼
Task 10 (AppLayout REDESIGNED_EXACT) ←── 独立（先行実行可）
         │
         ▼
Task 11 (QuestionPage リライト) ←── Task 3,4,5,6,7,8,9,10
         │
         ▼
Task 12 (最終確認)
```

**並列実行可能グループ:**
- Group A: Task 2, 3 （独立）
- Group B: Task 5, 6, 10 （Task 1 のみに依存 / 独立）
- Group C: Task 7, 8, 9 （フック完了後に並列可能）
