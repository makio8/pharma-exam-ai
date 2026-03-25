# AnalysisPage Soft Companion リデザイン 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AnalysisPage（371行、Ant Design 13コンポーネント）を Soft Companion にリデザインし、苦手問題（2モード）+ 回答履歴の深掘り特化画面にする。

**Architecture:** `computeMissedEssentials` ユーティリティで必須取りこぼしを計算し、`WeakQuestionCard` と `HistoryItem` コンポーネントで表示する。`useAnalytics()` に `allHistory` 返却と件数上限変更を加える。AnalysisPage 本体は Chip でモード切替する軽量ページ。

**Tech Stack:** React 19 / TypeScript 5.9 / Vite 8 / CSS Modules / vitest

---

## ファイル構成

### 新規作成
| ファイル | 責務 |
|---------|------|
| `src/utils/missed-essentials.ts` | 必須取りこぼし計算関数 |
| `src/utils/__tests__/missed-essentials.test.ts` | テスト |
| `src/components/analysis/WeakQuestionCard.tsx` | 苦手問題カード |
| `src/components/analysis/WeakQuestionCard.module.css` | |
| `src/components/analysis/HistoryItem.tsx` | 回答履歴行 |
| `src/components/analysis/HistoryItem.module.css` | |
| `src/pages/AnalysisPage.module.css` | ページスタイル |

### 変更
| ファイル | 変更内容 |
|---------|---------|
| `src/hooks/useAnalytics.ts` | weakQuestions 20件化、recentHistory 30件化、allHistory 追加 |
| `src/pages/AnalysisPage.tsx` | フルリライト（371行→~120行） |
| `src/components/layout/AppLayout.tsx` | `REDESIGNED_EXACT` に `'/analysis'` 追加 |

---

### Task 1: computeMissedEssentials ユーティリティ作成

**Files:**
- Create: `src/utils/missed-essentials.ts`
- Create: `src/utils/__tests__/missed-essentials.test.ts`

- [ ] **Step 1: テストファイルを作成**

```ts
// src/utils/__tests__/missed-essentials.test.ts
import { describe, it, expect } from 'vitest'
import { computeMissedEssentials } from '../missed-essentials'
import type { Question, AnswerHistory } from '../../types/question'

function makeQuestion(overrides: Partial<Question>): Question {
  return {
    id: 'q1',
    year: 111,
    question_number: 1,
    section: '必須',
    subject: '薬理',
    category: '薬物動態',
    question_text: 'テスト問題',
    choices: [{ key: 1, text: 'A' }, { key: 2, text: 'B' }],
    correct_answer: 1,
    explanation: '解説',
    tags: [],
    ...overrides,
  }
}

function makeHistory(overrides: Partial<AnswerHistory>): AnswerHistory {
  return {
    id: 'h1',
    user_id: 'u1',
    question_id: 'q1',
    selected_answer: 1,
    is_correct: true,
    answered_at: '2026-03-25T10:00:00Z',
    ...overrides,
  }
}

describe('computeMissedEssentials', () => {
  it('必須問題で最新回答が不正解の問題を返す', () => {
    const questions = [
      makeQuestion({ id: 'q1', section: '必須' }),
      makeQuestion({ id: 'q2', section: '必須' }),
    ]
    const history = [
      makeHistory({ id: 'h1', question_id: 'q1', is_correct: false, answered_at: '2026-03-25T10:00:00Z' }),
      makeHistory({ id: 'h2', question_id: 'q2', is_correct: true, answered_at: '2026-03-25T10:00:00Z' }),
    ]
    const result = computeMissedEssentials(history, questions)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('q1')
  })

  it('必須以外の問題は含めない', () => {
    const questions = [
      makeQuestion({ id: 'q1', section: '理論' }),
    ]
    const history = [
      makeHistory({ id: 'h1', question_id: 'q1', is_correct: false }),
    ]
    const result = computeMissedEssentials(history, questions)
    expect(result).toHaveLength(0)
  })

  it('同じ問題の複数回答: 最新回答で判定する', () => {
    const questions = [makeQuestion({ id: 'q1', section: '必須' })]
    const history = [
      makeHistory({ id: 'h1', question_id: 'q1', is_correct: false, answered_at: '2026-03-24T10:00:00Z' }),
      makeHistory({ id: 'h2', question_id: 'q1', is_correct: true, answered_at: '2026-03-25T10:00:00Z' }),
    ]
    const result = computeMissedEssentials(history, questions)
    expect(result).toHaveLength(0)  // 最新が正解なので含めない
  })

  it('未回答の必須問題は含めない', () => {
    const questions = [makeQuestion({ id: 'q1', section: '必須' })]
    const result = computeMissedEssentials([], questions)
    expect(result).toHaveLength(0)
  })

  it('最大20件に制限される', () => {
    const questions = Array.from({ length: 25 }, (_, i) =>
      makeQuestion({ id: `q${i}`, section: '必須', question_number: i + 1 })
    )
    const history = questions.map((q, i) =>
      makeHistory({ id: `h${i}`, question_id: q.id, is_correct: false })
    )
    const result = computeMissedEssentials(history, questions)
    expect(result).toHaveLength(20)
  })

  it('問番号順でソートされる', () => {
    const questions = [
      makeQuestion({ id: 'q3', section: '必須', question_number: 30 }),
      makeQuestion({ id: 'q1', section: '必須', question_number: 10 }),
      makeQuestion({ id: 'q2', section: '必須', question_number: 20 }),
    ]
    const history = questions.map(q =>
      makeHistory({ id: `h-${q.id}`, question_id: q.id, is_correct: false })
    )
    const result = computeMissedEssentials(history, questions)
    expect(result.map(r => r.question_number)).toEqual([10, 20, 30])
  })

  it('incorrectCount は常に 1', () => {
    const questions = [makeQuestion({ id: 'q1', section: '必須' })]
    const history = [
      makeHistory({ id: 'h1', question_id: 'q1', is_correct: false }),
    ]
    const result = computeMissedEssentials(history, questions)
    expect(result[0].incorrectCount).toBe(1)
  })
})
```

- [ ] **Step 2: テスト実行 → 失敗を確認**

Run: `npx vitest run src/utils/__tests__/missed-essentials.test.ts`
Expected: FAIL（モジュールが見つからない）

- [ ] **Step 3: 実装**

```ts
// src/utils/missed-essentials.ts
import type { Question, AnswerHistory } from '../types/question'

/**
 * 「必須問題なのに最新回答が不正解」の問題を抽出
 *
 * ロジック:
 * 1. history を answered_at 降順でソート
 * 2. Map<question_id, AnswerHistory> に各問題の最新回答だけを格納
 * 3. allQuestions から section === '必須' をフィルタ
 * 4. Map から最新回答を引き、is_correct === false のものを収集
 * 5. 問番号順でソート、最大20件
 */
export function computeMissedEssentials(
  history: AnswerHistory[],
  allQuestions: Question[],
): (Question & { incorrectCount: number })[] {
  // 最新回答マップを構築
  const sorted = [...history].sort(
    (a, b) => new Date(b.answered_at).getTime() - new Date(a.answered_at).getTime(),
  )
  const latestByQuestion = new Map<string, AnswerHistory>()
  for (const h of sorted) {
    if (!latestByQuestion.has(h.question_id)) {
      latestByQuestion.set(h.question_id, h)
    }
  }

  // 必須問題で最新回答が不正解のものを収集
  return allQuestions
    .filter((q) => {
      if (q.section !== '必須') return false
      const latest = latestByQuestion.get(q.id)
      return latest != null && !latest.is_correct
    })
    .sort((a, b) => a.question_number - b.question_number)
    .slice(0, 20)
    .map((q) => ({ ...q, incorrectCount: 1 }))
}
```

- [ ] **Step 4: テスト実行 → パスを確認**

Run: `npx vitest run src/utils/__tests__/missed-essentials.test.ts`
Expected: PASS（全7件）

- [ ] **Step 5: コミット**

```bash
git add src/utils/missed-essentials.ts src/utils/__tests__/missed-essentials.test.ts
git commit -m "feat: computeMissedEssentials 必須取りこぼし計算関数"
```

---

### Task 2: useAnalytics フック変更

**Files:**
- Modify: `src/hooks/useAnalytics.ts`

- [ ] **Step 1: weakQuestions のslice上限を 10→20 に変更**

`src/hooks/useAnalytics.ts` の193行目付近:

変更前: `.slice(0, 10)`
変更後: `.slice(0, 20)`

- [ ] **Step 2: recentHistory のslice上限を 20→30 に変更**

`src/hooks/useAnalytics.ts` の206行目付近:

変更前: `.slice(0, 20)`
変更後: `.slice(0, 30)`

- [ ] **Step 3: UseAnalyticsReturn に allHistory を追加**

インターフェースに追加:

```ts
/** 全回答履歴（必須取りこぼし計算用） */
allHistory: AnswerHistory[]
```

返り値オブジェクトに追加:

```ts
return {
  // ... 既存フィールド
  allHistory,  // ← 追加（L138 で既にローカル変数として存在）
}
```

- [ ] **Step 4: recentHistory のJSDocコメントを更新**

```ts
/** 直近30件の回答履歴 */
recentHistory: AnswerHistory[]
```

- [ ] **Step 5: 型チェック + 全テスト**

Run: `npx tsc --noEmit && npx vitest run`
Expected: エラーなし、全テストPASS

- [ ] **Step 6: コミット**

```bash
git add src/hooks/useAnalytics.ts
git commit -m "feat: useAnalytics に allHistory 追加、件数上限拡張（20件/30件）"
```

---

### Task 3: WeakQuestionCard コンポーネント作成

**Files:**
- Create: `src/components/analysis/WeakQuestionCard.tsx`
- Create: `src/components/analysis/WeakQuestionCard.module.css`

- [ ] **Step 1: CSS モジュール作成**

```css
/* src/components/analysis/WeakQuestionCard.module.css */
.card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--card);
  border-radius: var(--r);
  box-shadow: var(--shadow-sm);
  margin-bottom: 8px;
  cursor: pointer;
  transition: transform 0.1s ease;
  font-family: var(--font);
}

.card:active {
  transform: scale(0.98);
}

.left {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.subject {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-light);
  padding: 2px 8px;
  border-radius: var(--r-chip);
}

.essentialTag {
  font-size: 11px;
  font-weight: 600;
  color: var(--warn);
  background: rgba(245, 158, 11, 0.1);
  padding: 2px 8px;
  border-radius: var(--r-chip);
}

.questionLabel {
  font-size: 13px;
  color: var(--text-2);
}

.right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.incorrectBadge {
  font-size: 12px;
  font-weight: 700;
  color: var(--ng);
}

.reviewBtn {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-light);
  border: none;
  padding: 6px 12px;
  border-radius: var(--r-sm);
  cursor: pointer;
  font-family: var(--font);
  white-space: nowrap;
}

.reviewBtn:active {
  opacity: 0.8;
}
```

- [ ] **Step 2: コンポーネント作成**

```tsx
// src/components/analysis/WeakQuestionCard.tsx
import type { Question } from '../../types/question'
import styles from './WeakQuestionCard.module.css'

interface Props {
  question: Question
  incorrectCount?: number
  isMissedEssential?: boolean
  onReview: () => void
}

export function WeakQuestionCard({ question, incorrectCount, isMissedEssential, onReview }: Props) {
  return (
    <div
      className={styles.card}
      role="button"
      tabIndex={0}
      onClick={onReview}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onReview() } }}
    >
      <div className={styles.left}>
        <div className={styles.meta}>
          <span className={styles.subject}>{question.subject}</span>
          {isMissedEssential && <span className={styles.essentialTag}>必須</span>}
        </div>
        <span className={styles.questionLabel}>
          第{question.year}回 問{question.question_number}
        </span>
      </div>
      <div className={styles.right}>
        {incorrectCount != null && incorrectCount > 0 && (
          <span className={styles.incorrectBadge}>❌ {incorrectCount}回</span>
        )}
        <button type="button" className={styles.reviewBtn} onClick={(e) => { e.stopPropagation(); onReview() }}>
          復習 →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/components/analysis/WeakQuestionCard.tsx src/components/analysis/WeakQuestionCard.module.css
git commit -m "feat: WeakQuestionCard コンポーネント作成（苦手問題カード）"
```

---

### Task 4: HistoryItem コンポーネント作成

**Files:**
- Create: `src/components/analysis/HistoryItem.tsx`
- Create: `src/components/analysis/HistoryItem.module.css`

- [ ] **Step 1: CSS モジュール作成**

```css
/* src/components/analysis/HistoryItem.module.css */
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: var(--card);
  border-radius: var(--r-sm);
  margin-bottom: 4px;
  cursor: pointer;
  transition: transform 0.1s ease;
  font-family: var(--font);
}

.row:active {
  transform: scale(0.99);
}

.icon {
  font-size: 16px;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}

.date {
  font-size: 11px;
  color: var(--text-3);
  min-width: 72px;
  flex-shrink: 0;
}

.label {
  font-size: 13px;
  color: var(--text);
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time {
  font-size: 11px;
  color: var(--text-3);
  flex-shrink: 0;
}
```

- [ ] **Step 2: コンポーネント作成**

```tsx
// src/components/analysis/HistoryItem.tsx
import styles from './HistoryItem.module.css'

interface Props {
  isCorrect: boolean
  isSkipped: boolean
  answeredAt: string
  subject: string
  year: number
  questionNumber: number
  timeSpentSeconds?: number
  onTap: () => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const mo = d.getMonth() + 1
  const day = d.getDate()
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${mo}/${day} ${h}:${m}`
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function HistoryItem({
  isCorrect,
  isSkipped,
  answeredAt,
  subject,
  year,
  questionNumber,
  timeSpentSeconds,
  onTap,
}: Props) {
  const icon = isSkipped ? '🤷' : isCorrect ? '✅' : '❌'
  const showTime = timeSpentSeconds != null && timeSpentSeconds > 0

  return (
    <div
      className={styles.row}
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap() } }}
      aria-label={`${subject} 第${year}回 問${questionNumber} ${isSkipped ? 'スキップ' : isCorrect ? '正解' : '不正解'}`}
    >
      <span className={styles.icon}>{icon}</span>
      <span className={styles.date}>{formatDate(answeredAt)}</span>
      <span className={styles.label}>
        {subject} - 第{year}回 問{questionNumber}
      </span>
      {showTime && (
        <span className={styles.time}>⏱ {formatTime(timeSpentSeconds!)}</span>
      )}
    </div>
  )
}
```

- [ ] **Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/components/analysis/HistoryItem.tsx src/components/analysis/HistoryItem.module.css
git commit -m "feat: HistoryItem コンポーネント作成（回答履歴行）"
```

---

### Task 5: AnalysisPage フルリライト + AppLayout 更新

**Files:**
- Create: `src/pages/AnalysisPage.module.css`
- Modify: `src/pages/AnalysisPage.tsx`
- Modify: `src/components/layout/AppLayout.tsx`

- [ ] **Step 1: AnalysisPage.module.css 作成**

```css
/* src/pages/AnalysisPage.module.css */
/* 注意: .sc-page が padding: 20px 16px 160px を提供するため、追加パディング不要 */

.header {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  font-family: var(--font);
  margin-bottom: 20px;
}

.chipRow {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.emptyState {
  text-align: center;
  padding: 40px 20px;
}

.emptyIcon {
  font-size: 40px;
  margin-bottom: 12px;
}

.emptyTitle {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 6px;
}

.emptySub {
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 20px;
  line-height: 1.5;
}

.ctaBtn {
  background: linear-gradient(135deg, var(--accent), #8b5cf6);
  color: #fff;
  border: none;
  padding: 12px 28px;
  border-radius: var(--r);
  font-size: 15px;
  font-weight: 700;
  font-family: var(--font);
  box-shadow: var(--shadow-cta);
  cursor: pointer;
}

.sectionEmpty {
  text-align: center;
  padding: 24px 0;
  color: var(--text-3);
  font-size: 13px;
}
```

- [ ] **Step 2: AnalysisPage.tsx フルリライト**

```tsx
// src/pages/AnalysisPage.tsx — Soft Companion リデザイン
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalytics } from '../hooks/useAnalytics'
import { ALL_QUESTIONS } from '../data/all-questions'
import { computeMissedEssentials } from '../utils/missed-essentials'
import { Chip } from '../components/ui/Chip'
import { DecoWave } from '../components/ui/DecoWave'
import { FloatingNav } from '../components/ui/FloatingNav'
import { WeakQuestionCard } from '../components/analysis/WeakQuestionCard'
import { HistoryItem } from '../components/analysis/HistoryItem'
import type { Question } from '../types/question'
import styles from './AnalysisPage.module.css'

export function AnalysisPage() {
  const navigate = useNavigate()
  const { weakQuestions, recentHistory, allHistory, isEmpty } = useAnalytics()
  const [mode, setMode] = useState<'weak' | 'missed'>('weak')

  const displayQuestions = useMemo(() => {
    if (mode === 'weak') return weakQuestions
    return computeMissedEssentials(allHistory, ALL_QUESTIONS)
  }, [mode, weakQuestions, allHistory])

  // 回答履歴の問題逆引きマップ
  const questionMap = useMemo(() => {
    const map = new Map<string, Question>()
    for (const q of ALL_QUESTIONS) map.set(q.id, q)
    return map
  }, [])

  if (isEmpty) {
    return (
      <div className="sc-page">
        <DecoWave />
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📊</div>
          <p className={styles.emptyTitle}>分析を始めましょう！</p>
          <p className={styles.emptySub}>
            問題を解くと、苦手分析や回答履歴が<br />ここに表示されます
          </p>
          <button type="button" className={styles.ctaBtn} onClick={() => navigate('/practice')}>
            ▶ 演習を始める
          </button>
        </div>
        <FloatingNav />
      </div>
    )
  }

  return (
    <div className="sc-page">
      <DecoWave />
      <div className={styles.header}>📊 分析</div>

      {/* --- 苦手問題 --- */}
      <div className="section-title">🔍 苦手問題</div>
      <div className={styles.chipRow}>
        <Chip label="🔥 自分の苦手" active={mode === 'weak'} onClick={() => setMode('weak')} />
        <Chip label="⚠️ 必須の取りこぼし" active={mode === 'missed'} onClick={() => setMode('missed')} />
      </div>

      {displayQuestions.length === 0 ? (
        <p className={styles.sectionEmpty}>
          {mode === 'weak' ? '💪 苦手問題はまだありません' : '✨ 必須問題の取りこぼしなし！'}
        </p>
      ) : (
        displayQuestions.map((q) => (
          <WeakQuestionCard
            key={q.id}
            question={q}
            incorrectCount={mode === 'weak' ? q.incorrectCount : undefined}
            isMissedEssential={mode === 'missed'}
            onReview={() => navigate(`/practice/${q.id}`)}
          />
        ))
      )}

      {/* --- 回答履歴 --- */}
      <div className="section-title" style={{ marginTop: 24 }}>🕐 回答履歴</div>

      {recentHistory.length === 0 ? (
        <p className={styles.sectionEmpty}>📝 回答履歴がありません</p>
      ) : (
        recentHistory.map((item) => {
          const q = questionMap.get(item.question_id)
          if (!q) {
            // 問題データが見つからない場合のフォールバック
            return (
              <HistoryItem
                key={item.id}
                isCorrect={item.is_correct}
                isSkipped={item.skipped === true}
                answeredAt={item.answered_at}
                subject="不明"
                year={0}
                questionNumber={0}
                timeSpentSeconds={item.time_spent_seconds}
                onTap={() => navigate(`/practice/${item.question_id}`)}
              />
            )
          }
          return (
            <HistoryItem
              key={item.id}
              isCorrect={item.is_correct}
              isSkipped={item.skipped === true}
              answeredAt={item.answered_at}
              subject={q.subject}
              year={q.year}
              questionNumber={q.question_number}
              timeSpentSeconds={item.time_spent_seconds}
              onTap={() => navigate(`/practice/${item.question_id}`)}
            />
          )
        })
      )}
      <FloatingNav />
    </div>
  )
}
```

- [ ] **Step 3: AppLayout の REDESIGNED_EXACT に '/analysis' を追加**

`src/components/layout/AppLayout.tsx` の28行目:

変更前: `const REDESIGNED_EXACT = ['/', '/practice']`
変更後: `const REDESIGNED_EXACT = ['/', '/practice', '/analysis']`

- [ ] **Step 4: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 5: 全テスト実行**

Run: `npx vitest run`
Expected: 全テストPASS

- [ ] **Step 6: ビルド確認**

Run: `npm run build`
Expected: ビルド成功（`noUnusedLocals: true` で未使用import検出）

- [ ] **Step 7: コミット**

```bash
git add src/pages/AnalysisPage.tsx src/pages/AnalysisPage.module.css src/components/layout/AppLayout.tsx
git commit -m "feat: AnalysisPage フルリライト（371行→~120行、Ant Design依存ゼロ）"
```

---

### Task 6: 統合確認

**Files:**
- 全体の確認

- [ ] **Step 1: ビルド確認**

Run: `npm run build`
Expected: ビルド成功

- [ ] **Step 2: 全テスト実行**

Run: `npx vitest run`
Expected: 全テストPASS

- [ ] **Step 3: 開発サーバーで動作確認**

Run: `npm run dev`

手動確認チェックリスト:
- `/analysis` にアクセス → Soft Companion デザインで表示
- FloatingNav の「分析」がアクティブ
- 「🔥 自分の苦手」チップ → 苦手問題リスト表示
- 「⚠️ 必須の取りこぼし」チップ → 必須取りこぼし表示
- カードタップ → QuestionPage に遷移
- 回答履歴タイムライン → 正誤アイコン・日時・解答時間が表示
- データなし状態 → 空状態ウェルカムメッセージ
- ホーム画面 (`/`) が変わらず動作すること

- [ ] **Step 4: 行数確認**

Run: `wc -l src/pages/AnalysisPage.tsx`
Expected: ~120行（371行から67%削減）

- [ ] **Step 5: コミット（必要な修正があれば）**

```bash
git add src/
git commit -m "chore: AnalysisPage 統合確認 + 調整"
```

---

## 完了基準

| チェック | 基準 |
|---------|------|
| Ant Design依存 | AnalysisPage から 0（import なし） |
| 行数 | 371行 → ~120行（67%削減） |
| テスト | 既存テスト + 新規7件 全PASS |
| ビルド | `npm run build` 成功 |
| 型チェック | `npx tsc --noEmit` エラーなし |
| 2モード | 「自分の苦手」「必須の取りこぼし」がChipで切替可能 |
| ホーム非干渉 | HomePage の表示・動作に影響なし |
