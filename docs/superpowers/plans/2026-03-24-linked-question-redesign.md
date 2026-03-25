# LinkedQuestionViewer Soft Companion 横展開 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 連問表示コンポーネント（LinkedQuestionViewer, 409行, Ant Design 9コンポーネント）を、QuestionPageリデザインで作った `components/question/` の部品を再利用して Soft Companion にリデザインする。

**Architecture:** `useQuestionAnswerState` に外部history注入オプションを追加し、新規 `LinkedQuestionItem` 子コンポーネントで各問題を独立管理する。`extractQuestionBody` をutilsに切り出し、`ScenarioCard` で共通シナリオを表示する。Ant Design依存を完全に除去する。

**Tech Stack:** React 19 / TypeScript 5.9 / Vite 8 / CSS Modules / vitest

---

## ファイル構成

### 新規作成
| ファイル | 責務 |
|---------|------|
| `src/utils/extract-question-body.ts` | `extractQuestionBody` 関数（LinkedQuestionViewerから切り出し） |
| `src/utils/__tests__/extract-question-body.test.ts` | extractQuestionBody のテスト |
| `src/components/question/ScenarioCard.tsx` | 連問の共通シナリオ表示 |
| `src/components/question/ScenarioCard.module.css` | ScenarioCard のスタイル |
| `src/components/question/LinkedQuestionItem.tsx` | 連問内の1問を表示（フック使用） |
| `src/components/question/LinkedQuestionItem.module.css` | LinkedQuestionItem のスタイル |
| `src/hooks/__tests__/useQuestionAnswerState-external.test.ts` | externalHistory オプションのテスト |

### 変更
| ファイル | 変更内容 |
|---------|---------|
| `src/hooks/useQuestionAnswerState.ts` | `options: { externalHistory?, restoreExisting? }` 追加 |
| `src/components/question/ChoiceList.tsx` | `correct_answer === 0` ガード（データ準備中プレースホルダー） |
| `src/components/question/index.ts` | ScenarioCard, LinkedQuestionItem を export 追加 |
| `src/components/LinkedQuestionViewer.tsx` | フルリライト（409行 → ~60行） |

---

### Task 1: extractQuestionBody をユーティリティに切り出す

**Files:**
- Create: `src/utils/extract-question-body.ts`
- Create: `src/utils/__tests__/extract-question-body.test.ts`

- [ ] **Step 1: テストファイルを作成**

```ts
// src/utils/__tests__/extract-question-body.test.ts
import { describe, it, expect } from 'vitest'
import { extractQuestionBody } from '../extract-question-body'

describe('extractQuestionBody', () => {
  it('シナリオ部分を除去して問題文を返す', () => {
    const text = 'シナリオ文\n問196（実務）\n質問文196\n問197（実務）\n質問文197'
    const result = extractQuestionBody(text, 196, 'シナリオ文')
    expect(result).toBe('質問文196')
  })

  it('シナリオなし: マーカーで分割して該当問番号を抽出', () => {
    const text = '問196（実務）\n質問文196\n問197（実務）\n質問文197'
    const result = extractQuestionBody(text, 197, '')
    expect(result).toBe('質問文197')
  })

  it('マーカーなし: ヘッダー除去してテキスト全体を返す', () => {
    const text = '問1（必須）\nシンプルな問題文'
    const result = extractQuestionBody(text, 1, '')
    expect(result).toBe('シンプルな問題文')
  })

  it('自分のマーカーがない場合: 最初のマーカー手前を返す', () => {
    const text = '前文テキスト（20文字以上の十分な長さのテキスト）\n問197（実務）\n質問文197'
    const result = extractQuestionBody(text, 196, '')
    expect(result).toBe('前文テキスト（20文字以上の十分な長さのテキスト）')
  })

  it('空のシナリオ: 正しく処理される', () => {
    const text = '問196（実務）\n質問文'
    const result = extractQuestionBody(text, 196, '')
    expect(result).toBe('質問文')
  })
})
```

- [ ] **Step 2: テスト実行 → 失敗を確認**

Run: `npx vitest run src/utils/__tests__/extract-question-body.test.ts`
Expected: FAIL（モジュールが見つからない）

- [ ] **Step 3: extractQuestionBody 関数を実装**

`src/components/LinkedQuestionViewer.tsx` の358-408行目にある `extractQuestionBody` 関数をそのまま `src/utils/extract-question-body.ts` にコピー＆export する。

```ts
// src/utils/extract-question-body.ts

/**
 * question_text から該当問題の本文だけを抽出
 *
 * 連問では1つの question_text に複数問分のテキストが結合されていることがある:
 *   "シナリオ...\n問196（実務）\n質問文196...\n問197（実務）\n質問文197..."
 *
 * この関数は questionNumber に該当する部分だけを抽出する
 */
export function extractQuestionBody(questionText: string, questionNumber: number, scenario: string): string {
  // まずシナリオ部分を除去
  let text = questionText
  if (scenario && text.startsWith(scenario)) {
    text = text.slice(scenario.length).trim()
  }

  // 「問XXX」マーカーで分割
  const questionPattern = /問(\d+)\s*[（(]([^）)]*)[）)]\s*\n?/g
  const markers: { num: number; start: number; end: number }[] = []
  let m: RegExpExecArray | null
  while ((m = questionPattern.exec(text)) !== null) {
    markers.push({ num: parseInt(m[1], 10), start: m.index, end: m.index + m[0].length })
  }

  if (markers.length === 0) {
    // マーカーがない場合：問番号ヘッダーだけ除去して返す
    return text.replace(/^問\d+\s*[（(][^）)]*[）)]\s*\n*/g, '')
      .replace(/^問\d+\s*\n+/g, '')
      .trim() || questionText
  }

  // 該当する問番号のマーカーを探す
  const myMarker = markers.find((mk) => mk.num === questionNumber)
  if (!myMarker) {
    // 自分の番号がない場合（最初の問題にマーカーがないケース等）
    // → 最初のマーカーの手前のテキストを使う
    if (markers[0].start > 0) {
      const beforeFirst = text.slice(0, markers[0].start).trim()
      if (beforeFirst.length > 10) return beforeFirst
    }
    return text.replace(/^問\d+\s*[（(][^）)]*[）)]\s*\n*/g, '').trim() || questionText
  }

  // 自分のマーカーから次のマーカーまでを抽出
  const myIndex = markers.indexOf(myMarker)
  const nextMarker = markers[myIndex + 1]
  const bodyStart = myMarker.end
  const bodyEnd = nextMarker ? nextMarker.start : text.length
  const body = text.slice(bodyStart, bodyEnd).trim()

  return body || questionText
}
```

- [ ] **Step 4: テスト実行 → パスを確認**

Run: `npx vitest run src/utils/__tests__/extract-question-body.test.ts`
Expected: PASS（全5件）

- [ ] **Step 5: コミット**

```bash
git add src/utils/extract-question-body.ts src/utils/__tests__/extract-question-body.test.ts
git commit -m "refactor: extractQuestionBody をユーティリティに切り出し"
```

---

### Task 2: useQuestionAnswerState に externalHistory / restoreExisting オプション追加

**Files:**
- Modify: `src/hooks/useQuestionAnswerState.ts`
- Create: `src/hooks/__tests__/useQuestionAnswerState-external.test.ts`

**背景:**
- 連問では `LinkedQuestionItem` × N が描画される。各子が `useAnswerHistory()` を呼ぶと N回ロードされる
- 対策: 親の `LinkedQuestionViewer` で1回だけ `useAnswerHistory()` を呼び、結果を子に props で渡す
- `useQuestionAnswerState` に `externalHistory` オプションを追加して、外部からhistoryを注入可能に
- `restoreExisting: true` の場合、既存回答があれば `restoreFromExisting()` を自動呼び出しして回答をロック

- [ ] **Step 1: AnswerStateManager の restoreFromExisting テストが既にあることを確認**

Run: `npx vitest run src/hooks/__tests__/useQuestionAnswerState.test.ts`
Expected: PASS（既存17件がすべて通る。restoreFromExisting のテストは既にある）

- [ ] **Step 2: 連問ロック動作のテストを作成**

**テストの目的:** 連問での `restoreFromExisting` 後のロック動作を検証する。
既存テスト（useQuestionAnswerState.test.ts）は「復元が正しく動くか」をテスト済み。
このテストは「復元後に操作が正しくブロックされるか」（連問固有の要件）をカバーする。

> **Note:** `useEffect` 内の `restoreExisting` 分岐はReactフックテスト（@testing-library/react）がないため、
> Task 7 の手動テストで検証する。ここでは AnswerStateManager レベルでロック保証を確認する。

```ts
// src/hooks/__tests__/useQuestionAnswerState-external.test.ts
import { describe, it, expect } from 'vitest'
import { AnswerStateManager } from '../useQuestionAnswerState'
import type { Question, AnswerHistory } from '../../types/question'

function makeSingleQuestion(overrides?: Partial<Question>): Question {
  return {
    id: 'q-ext-1',
    year: 108,
    question_number: 195,
    section: '実践',
    subject: '実務',
    category: '薬物治療',
    question_text: '次のうち正しいのはどれか。1つ選べ。',
    choices: [
      { key: 1, text: '選択肢1' },
      { key: 2, text: '選択肢2' },
      { key: 3, text: '選択肢3' },
    ],
    correct_answer: 2,
    explanation: '解説',
    tags: [],
    ...overrides,
  }
}

function makeMultiQuestion(overrides?: Partial<Question>): Question {
  return {
    id: 'q-ext-2',
    year: 108,
    question_number: 196,
    section: '実践',
    subject: '実務',
    category: '薬物治療',
    question_text: '正しいのはどれか。2つ選べ。',
    choices: [
      { key: 1, text: '選択肢1' },
      { key: 2, text: '選択肢2' },
      { key: 3, text: '選択肢3' },
    ],
    correct_answer: [1, 3],
    explanation: '解説',
    tags: [],
    ...overrides,
  }
}

function makeExistingResult(overrides?: Partial<AnswerHistory>): AnswerHistory {
  return {
    id: 'ah-ext-1',
    user_id: 'test-user',
    question_id: 'q-ext-1',
    selected_answer: 2,
    is_correct: true,
    answered_at: '2026-03-24T10:00:00Z',
    time_spent_seconds: 12,
    ...overrides,
  }
}

describe('AnswerStateManager: 連問ロック動作', () => {
  it('restoreFromExisting 後は selectAnswer が無視される（操作ロック）', () => {
    const q = makeSingleQuestion()
    const mgr = new AnswerStateManager(q)
    const existing = makeExistingResult()

    mgr.restoreFromExisting(existing)
    mgr.selectAnswer(3) // ロック中なので無視される

    expect(mgr.selectedAnswer).toBe(2)  // 復元された値が維持
    expect(mgr.isAnswered).toBe(true)
    expect(mgr.canSubmit).toBe(false)   // 再送信不可
  })

  it('restoreFromExisting 後は selectMultiAnswers が無視される（複数選択ロック）', () => {
    const q = makeMultiQuestion()
    const mgr = new AnswerStateManager(q)
    const existing = makeExistingResult({
      question_id: 'q-ext-2',
      selected_answer: [1, 3],
      is_correct: true,
    })

    mgr.restoreFromExisting(existing)
    mgr.selectMultiAnswers([2, 3]) // ロック中なので無視される

    expect(mgr.selectedAnswers).toEqual([1, 3])  // 復元された値が維持
    expect(mgr.isAnswered).toBe(true)
  })

  it('スキップ結果の復元: isSkipped=true, selectedAnswer=null', () => {
    const q = makeSingleQuestion()
    const mgr = new AnswerStateManager(q)
    const existing = makeExistingResult({
      selected_answer: null,
      is_correct: false,
      skipped: true,
    })

    mgr.restoreFromExisting(existing)

    expect(mgr.isSkipped).toBe(true)
    expect(mgr.isCorrect).toBe(false)
    expect(mgr.selectedAnswer).toBeNull()
    expect(mgr.canSubmit).toBe(false)
  })

  it('不正解結果の復元: isCorrect=false, 選択肢が復元される', () => {
    const q = makeSingleQuestion()
    const mgr = new AnswerStateManager(q)
    const existing = makeExistingResult({
      selected_answer: 3,
      is_correct: false,
    })

    mgr.restoreFromExisting(existing)

    expect(mgr.isCorrect).toBe(false)
    expect(mgr.selectedAnswer).toBe(3)
    expect(mgr.isAnswered).toBe(true)
  })
})
```

- [ ] **Step 3: テスト実行 → パスを確認**

Run: `npx vitest run src/hooks/__tests__/useQuestionAnswerState-external.test.ts`
Expected: PASS（全4件。AnswerStateManager の既存実装で対応済み）

- [ ] **Step 4: useQuestionAnswerState フックに externalHistory オプション追加**

`src/hooks/useQuestionAnswerState.ts` を変更:

```ts
// 新しいオプション型を追加（UseQuestionAnswerStateResult の後に）
export interface UseQuestionAnswerStateOptions {
  /** 外部から注入する answerHistory（連問で親から渡す場合） */
  externalHistory?: {
    history: AnswerHistory[]
    saveAnswer: (answer: Omit<AnswerHistory, 'id'>) => void
    getQuestionResult: (questionId: string) => AnswerHistory | undefined
  }
  /** true にすると既存回答があれば restoreFromExisting() で復元＆ロック（連問用） */
  restoreExisting?: boolean
}
```

フック関数のシグネチャを変更:

```ts
export function useQuestionAnswerState(
  question: Question,
  options?: UseQuestionAnswerStateOptions,
): UseQuestionAnswerStateResult {
```

フック内部で、`useAnswerHistory()` の呼び出しを条件付きに変更:

```ts
  // externalHistory があればそれを使う、なければ自前で呼ぶ
  const internal = useAnswerHistory()
  const { getQuestionResult, saveAnswer, history } = options?.externalHistory ?? internal
```

既存結果復元の useEffect を修正（`restoreExisting` オプション対応）:

```ts
  // history ロード完了後に既存結果を同期
  useEffect(() => {
    const mgr = mgrRef.current
    if (mgr.isAnswered) return

    const existing = getQuestionResult(question.id)
    if (existing) {
      if (options?.restoreExisting) {
        // 連問モード: 既存回答を完全復元してロック
        mgr.restoreFromExisting(existing)
      } else {
        // 単問モード: 参照情報としてのみ保持（再演習可能）
        mgr.existingResult = existing
      }
      triggerUpdate()
    }
  }, [question.id, history, getQuestionResult, options?.restoreExisting, triggerUpdate])
```

- [ ] **Step 5: 既存テスト + 新テストが全パスすることを確認**

Run: `npx vitest run src/hooks/__tests__/useQuestionAnswerState.test.ts src/hooks/__tests__/useQuestionAnswerState-external.test.ts`
Expected: PASS（既存17件 + 新規4件 = 21件）

- [ ] **Step 6: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 7: コミット**

```bash
git add src/hooks/useQuestionAnswerState.ts src/hooks/__tests__/useQuestionAnswerState-external.test.ts
git commit -m "feat: useQuestionAnswerState に externalHistory/restoreExisting オプション追加"
```

---

### Task 3: ChoiceList に「データ準備中」ガード + 数値グリッド正誤表示追加

**Files:**
- Modify: `src/components/question/ChoiceList.tsx`
- Modify: `src/components/question/Choice.module.css`

**背景:**
1. 現行 LinkedQuestionViewer は `choices.length === 0 && correct_answer === 0` で「データ準備中」を表示する。ChoiceList の numericGrid は 1-9 固定なのでこのケースを吸収できない
2. **（P1修正）** 現行 ChoiceList の数値グリッドは回答後の正誤表示がない。旧 LinkedQuestionViewer はインラインスタイルで正解（緑）/不正解（赤）を表示していた。横展開でこのフィードバックが失われないよう、ChoiceList に正誤状態の CSS を追加する

- [ ] **Step 1: ChoiceList にガード + 数値グリッド正誤スタイルを追加**

`src/components/question/ChoiceList.tsx` の `isNumeric` 分岐を以下に置き換え:

```tsx
  // Numeric input (1–9 grid)
  if (isNumeric) {
    // データ準備中ガード: correct_answer === 0 の場合はプレースホルダー
    const ca = question.correct_answer
    if (!Array.isArray(ca) && ca === 0) {
      return (
        <p className={styles.preparingText}>この問題はデータ準備中です</p>
      )
    }

    const selectedNum = answerState.selectedAnswer
    return (
      <div
        className={styles.numericGrid}
        role="radiogroup"
        aria-label="数値を選択"
      >
        {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => {
          let btnClass = styles.numericBtn
          if (isAnswered) {
            if (isCorrectKey(question.correct_answer, num)) {
              btnClass = `${styles.numericBtn} ${styles.numericBtnCorrect}`
            } else if (selectedNum === num) {
              btnClass = `${styles.numericBtn} ${styles.numericBtnIncorrect}`
            } else {
              btnClass = `${styles.numericBtn} ${styles.numericBtnDimmed}`
            }
          } else if (selectedNum === num) {
            btnClass = `${styles.numericBtn} ${styles.numericBtnSelected}`
          }

          return (
            <button
              key={num}
              type="button"
              className={btnClass}
              disabled={isAnswered}
              onClick={() => onSelect(num)}
              aria-label={`${num}`}
              aria-pressed={selectedNum === num}
            >
              {num}
              {isAnswered && isCorrectKey(question.correct_answer, num) && ' ✓'}
              {isAnswered && selectedNum === num && !isCorrectKey(question.correct_answer, num) && ' ✗'}
            </button>
          )
        })}
      </div>
    )
  }
```

**注意:** `isCorrectKey` は既に import 済み（ChoiceList.tsx 2行目）。

- [ ] **Step 2: CSS に正誤スタイルを追加**

`src/components/question/Choice.module.css` に追記:

```css
.preparingText {
  text-align: center;
  color: var(--text-3);
  font-size: 14px;
  padding: 24px 0;
}

.numericBtnCorrect {
  border-color: var(--ok) !important;
  background: rgba(16, 185, 129, 0.1) !important;
  color: var(--ok) !important;
}

.numericBtnIncorrect {
  border-color: var(--ng) !important;
  background: rgba(239, 68, 68, 0.1) !important;
  color: var(--ng) !important;
}

.numericBtnDimmed {
  opacity: 0.5;
}
```

- [ ] **Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/components/question/ChoiceList.tsx src/components/question/Choice.module.css
git commit -m "fix: ChoiceList 数値グリッドに正誤表示追加 + データ準備中ガード"
```

---

### Task 4: ScenarioCard コンポーネント作成

**Files:**
- Create: `src/components/question/ScenarioCard.tsx`
- Create: `src/components/question/ScenarioCard.module.css`
- Modify: `src/components/question/index.ts`

- [ ] **Step 1: ScenarioCard.module.css 作成**

```css
/* src/components/question/ScenarioCard.module.css */
.card {
  background: var(--card);
  border: 1px solid var(--accent-border);
  border-radius: var(--r-card);
  padding: 16px;
  margin-bottom: 16px;
}

.label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 12px;
  font-family: var(--font);
}
```

- [ ] **Step 2: ScenarioCard.tsx 作成**

```tsx
// src/components/question/ScenarioCard.tsx
import { QuestionBody } from './QuestionBody'
import { normalizeForDisplay } from '../../utils/text-normalizer'
import styles from './ScenarioCard.module.css'

interface Props {
  scenario: string
  totalQuestions: number
}

export function ScenarioCard({ scenario, totalQuestions }: Props) {
  return (
    <div className={styles.card}>
      <p className={styles.label}>
        📋 連問（{totalQuestions}問セット）
      </p>
      {scenario && (
        <QuestionBody
          bodyText={normalizeForDisplay(scenario)}
          displayMode="text"
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: index.ts に export 追加**

`src/components/question/index.ts` に追記:

```ts
export { ScenarioCard } from './ScenarioCard'
```

- [ ] **Step 4: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/components/question/ScenarioCard.tsx src/components/question/ScenarioCard.module.css src/components/question/index.ts
git commit -m "feat: ScenarioCard コンポーネント作成（連問シナリオ表示）"
```

---

### Task 5: LinkedQuestionItem コンポーネント作成

**Files:**
- Create: `src/components/question/LinkedQuestionItem.tsx`
- Create: `src/components/question/LinkedQuestionItem.module.css`
- Modify: `src/components/question/index.ts`

- [ ] **Step 1: LinkedQuestionItem.module.css 作成**

```css
/* src/components/question/LinkedQuestionItem.module.css */
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-left: 4px solid var(--accent);
  border-radius: var(--r-card);
  padding: 0;
  margin-bottom: 20px;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 16px;
  background: var(--accent-light);
  border-bottom: 1px solid var(--accent-border);
  font-family: var(--font);
}

.questionNum {
  font-size: 14px;
  font-weight: 700;
  color: var(--accent);
}

.subject {
  font-size: 12px;
  color: var(--text-2);
  background: var(--bg);
  padding: 2px 8px;
  border-radius: var(--r-chip);
}

.multiHint {
  font-size: 12px;
  color: var(--orange);
  font-weight: 600;
}

.statusTag {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--r-chip);
}

.statusCorrect {
  background: rgba(16, 185, 129, 0.1);
  color: var(--ok);
}

.statusIncorrect {
  background: rgba(239, 68, 68, 0.1);
  color: var(--ng);
}

.statusSkipped {
  background: var(--bg);
  color: var(--text-3);
}

.body {
  padding: 16px;
}
```

- [ ] **Step 2: LinkedQuestionItem.tsx 作成**

```tsx
// src/components/question/LinkedQuestionItem.tsx
import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Question, AnswerHistory } from '../../types/question'
import { useQuestionAnswerState } from '../../hooks/useQuestionAnswerState'
import { useTimeTracking } from '../../hooks/useTimeTracking'
import { useOfficialNotes } from '../../hooks/useOfficialNotes'
import { useBookmarks } from '../../hooks/useBookmarks'
import { normalizeForDisplay, getDisplayMode } from '../../utils/text-normalizer'
import { extractQuestionBody } from '../../utils/extract-question-body'
import { isMultiAnswer, getRequiredSelections } from '../../utils/question-helpers'
import { QuestionBody } from './QuestionBody'
import { ChoiceList } from './ChoiceList'
import { ActionArea } from './ActionArea'
import { ResultBanner } from './ResultBanner'
import { ExplanationSection } from './ExplanationSection'
import { OfficialNoteCard } from './OfficialNoteCard'
import styles from './LinkedQuestionItem.module.css'

interface Props {
  question: Question
  questionIndex: number
  totalInGroup: number
  scenario: string
  externalHistory: {
    history: AnswerHistory[]
    saveAnswer: (answer: Omit<AnswerHistory, 'id'>) => void
    getQuestionResult: (questionId: string) => AnswerHistory | undefined
  }
}

export function LinkedQuestionItem({
  question,
  questionIndex,
  totalInGroup,
  scenario,
  externalHistory,
}: Props) {
  const navigate = useNavigate()

  const answerState = useQuestionAnswerState(question, {
    externalHistory,
    restoreExisting: true,
  })

  const { getElapsedSeconds } = useTimeTracking(question.id)
  const { notes } = useOfficialNotes(question.id)
  const { isBookmarked, toggleBookmark } = useBookmarks()

  const resultRef = useRef<HTMLDivElement>(null)

  // 回答後に ResultBanner へ自動スクロール
  useEffect(() => {
    if (answerState.isAnswered && !answerState.existingResult) {
      const timer = setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [answerState.isAnswered, answerState.existingResult])

  const handleSubmit = () => {
    answerState.submitAnswer(getElapsedSeconds())
  }

  const handleSkip = () => {
    answerState.skipQuestion(getElapsedSeconds())
  }

  const displayMode = getDisplayMode(question)
  const isMulti = isMultiAnswer(question)
  const requiredCount = isMulti ? getRequiredSelections(question.question_text, question.correct_answer) : 1
  const bodyText = extractQuestionBody(question.question_text, question.question_number, scenario)

  return (
    <div className={styles.card} id={`linked-q-${question.id}`}>
      {/* ヘッダー */}
      <div className={styles.header}>
        <span className={styles.questionNum}>
          問{question.question_number}（{questionIndex}/{totalInGroup}）
        </span>
        <span className={styles.subject}>{question.subject}</span>
        {isMulti && (
          <span className={styles.multiHint}>{requiredCount}つ選べ</span>
        )}
        {answerState.isAnswered && (
          <span
            className={`${styles.statusTag} ${
              answerState.isSkipped
                ? styles.statusSkipped
                : answerState.isCorrect
                  ? styles.statusCorrect
                  : styles.statusIncorrect
            }`}
          >
            {answerState.isSkipped ? 'スキップ' : answerState.isCorrect ? '正解' : '不正解'}
          </span>
        )}
      </div>

      {/* 本体 */}
      <div className={styles.body}>
        <QuestionBody
          bodyText={normalizeForDisplay(bodyText)}
          imageUrl={question.image_url}
          displayMode={displayMode}
        />

        <ChoiceList
          question={question}
          answerState={answerState}
          onSelect={answerState.selectAnswer}
          onMultiSelect={answerState.selectMultiAnswers}
        />

        {!answerState.isAnswered && (
          <ActionArea
            canSubmit={answerState.canSubmit}
            onSubmit={handleSubmit}
            onSkip={handleSkip}
            isAnswered={false}
          />
        )}

        {answerState.isAnswered && (
          <>
            <div ref={resultRef}>
              <ResultBanner
                isCorrect={answerState.isCorrect}
                isSkipped={answerState.isSkipped}
                correctAnswer={question.correct_answer}
                elapsedSeconds={getElapsedSeconds()}
              />
            </div>

            {question.explanation && (
              <ExplanationSection
                explanation={normalizeForDisplay(question.explanation)}
              />
            )}

            {notes.map((note) => (
              <OfficialNoteCard
                key={note.id}
                note={note}
                isBookmarked={isBookmarked(note.id)}
                onToggleBookmark={() => toggleBookmark(note.id)}
                onFlashCard={() => navigate('/cards')}
                onImageTap={() => {}}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: index.ts に export 追加**

`src/components/question/index.ts` に追記:

```ts
export { LinkedQuestionItem } from './LinkedQuestionItem'
```

- [ ] **Step 4: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/components/question/LinkedQuestionItem.tsx src/components/question/LinkedQuestionItem.module.css src/components/question/index.ts
git commit -m "feat: LinkedQuestionItem コンポーネント作成（連問内の1問表示）"
```

---

### Task 6: LinkedQuestionViewer フルリライト

**Files:**
- Modify: `src/components/LinkedQuestionViewer.tsx`

- [ ] **Step 1: LinkedQuestionViewer.tsx をフルリライト**

409行 → ~40行に書き直し。Ant Design import を全て除去。

```tsx
// src/components/LinkedQuestionViewer.tsx
import { useMemo } from 'react'
import type { LinkedGroup } from '../hooks/useLinkedQuestions'
import { useAnswerHistory } from '../hooks/useAnswerHistory'
import { ScenarioCard, LinkedQuestionItem } from './question'

interface Props {
  group: LinkedGroup
}

/**
 * 連問グループを1ページで縦スクロール表示
 * - 共通シナリオを ScenarioCard で1回だけ表示
 * - 各問題を LinkedQuestionItem で独立管理
 * - useAnswerHistory は親で1回だけ呼び、子に props で渡す（N回ロード防止）
 */
export function LinkedQuestionViewer({ group }: Props) {
  const { history, saveAnswer, getQuestionResult } = useAnswerHistory()

  // useMemo で参照安定化（子コンポーネントの不要な再レンダリング防止）
  const externalHistory = useMemo(
    () => ({ history, saveAnswer, getQuestionResult }),
    [history, saveAnswer, getQuestionResult],
  )

  return (
    <div>
      <ScenarioCard
        scenario={group.scenario}
        totalQuestions={group.questions.length}
      />
      {group.questions.map((q, i) => (
        <LinkedQuestionItem
          key={q.id}
          question={q}
          questionIndex={i + 1}
          totalInGroup={group.questions.length}
          scenario={group.scenario}
          externalHistory={externalHistory}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: 全テスト実行**

Run: `npx vitest run`
Expected: 全テストPASS

- [ ] **Step 4: コミット**

```bash
git add src/components/LinkedQuestionViewer.tsx
git commit -m "feat: LinkedQuestionViewer フルリライト（409行→40行、Ant Design依存ゼロ）"
```

---

### Task 7: 統合確認 + 未使用import掃除

**Files:**
- 全体の確認

- [ ] **Step 1: ビルド確認**

Run: `npm run build`
Expected: ビルド成功（`noUnusedLocals: true` なので未使用importがあればエラーになる）

ビルドエラーがあれば修正:
- 旧 LinkedQuestionViewer の import が他のファイルに残っていないか確認
- `ConfidenceLevel` 型の import が不要になっていれば削除

- [ ] **Step 2: 全テスト実行**

Run: `npx vitest run`
Expected: 全テストPASS

- [ ] **Step 3: 開発サーバーで動作確認**

Run: `npm run dev`

手動確認チェックリスト:
- 連問URL（例: `http://localhost:5175/practice/r108-195`）にアクセス
- ScenarioCard に共通シナリオが表示される
- 各問題が独立したカードで表示される
- 選択 → 解答 → 正誤バナー → 解説が動作
- 「わからん」スキップが動作
- 回答済みの問題はロック状態（再選択不可）
- 通常の単問（`/practice/r111-001`）は変わらず動作

- [ ] **Step 4: 行数確認**

Run: `wc -l src/components/LinkedQuestionViewer.tsx`
Expected: ~40行（409行から90%削減）

- [ ] **Step 5: コミット（必要な修正があれば）**

```bash
git add -A
git commit -m "chore: LinkedQuestionViewer 統合確認 + 未使用import掃除"
```

---

## 完了基準

| チェック | 基準 |
|---------|------|
| Ant Design依存 | LinkedQuestionViewer から 0（import なし） |
| 行数 | 409行 → ~40行（90%削減） |
| テスト | 既存243件 + 新規9件 = 252件 全PASS |
| ビルド | `npm run build` 成功 |
| 型チェック | `npx tsc --noEmit` エラーなし |
| 新機能 | 公式付箋・わからん・時間計測・ブックマークが連問でも動作 |
