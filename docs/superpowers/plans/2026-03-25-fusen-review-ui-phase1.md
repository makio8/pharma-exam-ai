# 付箋レビューUI Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 付箋データを j/k で送りながら 1/2/3 で判定できる最小レビューUIを構築する。

**Architecture:** 既存の `src/dev-tools/review/` と同じパターンで `src/dev-tools/fusen-review/` を構築。FusenReviewPage（オーケストレーター）+ FusenCard（表示+判定）+ hooks（データ読込・状態永続化・キーボード）の最小構成。Phase 2 で bbox調整・編集パネル・エクスポートを追加する。

**Tech Stack:** React 19, TypeScript 5.9, CSS Modules, localStorage

**Spec:** `docs/superpowers/specs/2026-03-25-fusen-review-ui-design.md`

---

## File Structure

| File | Role |
|------|------|
| `src/dev-tools/fusen-review/types.ts` | **Create** — FusenReviewState, FusenCorrection, JudgmentStatus 型定義 |
| `src/dev-tools/fusen-review/hooks/useFusenData.ts` | **Create** — fusens-master.json 読み込み |
| `src/dev-tools/fusen-review/hooks/useFusenReviewState.ts` | **Create** — localStorage 永続化 |
| `src/dev-tools/fusen-review/hooks/useFusenKeyboardNav.ts` | **Create** — キーボードショートカット |
| `src/dev-tools/fusen-review/components/FusenCard.tsx` | **Create** — 付箋カード（画像+メタ+判定） |
| `src/dev-tools/fusen-review/components/FusenCard.module.css` | **Create** — カードスタイル |
| `src/dev-tools/fusen-review/FusenReviewPage.tsx` | **Create** — オーケストレーター |
| `src/dev-tools/fusen-review/FusenReviewPage.module.css` | **Create** — ページスタイル |
| `src/routes.tsx` | **Modify** — `/dev-tools/fusen-review` ルート追加 |

---

### Task 1: 型定義

**Files:**
- Create: `src/dev-tools/fusen-review/types.ts`

- [ ] **Step 1: 型定義を作成**

```typescript
// src/dev-tools/fusen-review/types.ts
import type { QuestionSubject } from '../../types/question'
import type { NoteType } from '../../types/note'

export type JudgmentStatus = 'ok' | 'needs-fix' | 'ng'

export type FusenCorrection =
  | { type: 'title'; value: string }
  | { type: 'body'; value: string }
  | { type: 'tags'; value: string[] }
  | { type: 'subject'; value: QuestionSubject }
  | { type: 'noteType'; value: NoteType }
  | { type: 'bbox'; value: [number, number, number, number] }
  | { type: 'notes'; value: string }

export interface FusenReviewState {
  version: 1
  judgments: Record<string, JudgmentStatus>
  corrections: Record<string, FusenCorrection[]>
  lastPosition: string
  updatedAt: string
}

export interface FusenFilterConfig {
  subjects: QuestionSubject[]
  judgmentStatus: JudgmentStatus | 'pending' | 'all'
}
```

- [ ] **Step 2: コミット**

```bash
git add src/dev-tools/fusen-review/types.ts
git commit -m "feat: add fusen review UI type definitions"
```

---

### Task 2: useFusenData フック

**Files:**
- Create: `src/dev-tools/fusen-review/hooks/useFusenData.ts`

- [ ] **Step 1: データ読み込みフックを作成**

fusens-master.json を `public/data/fusens/` に配置して fetch する方式。

```typescript
// src/dev-tools/fusen-review/hooks/useFusenData.ts
import { useState, useEffect } from 'react'

/** scripts/lib/fusens-master-types.ts と同じ構造（dev-toolsからscripts/は直接importしない） */
interface FusenSource {
  pdf: string
  page: number
  noteIndex: number
  bbox: [number, number, number, number]
}

export interface FusenData {
  id: string
  title: string
  body: string
  imageFile: string
  subject: string
  noteType: string
  tags: string[]
  source: FusenSource
  topicId: string | null
  status: string
  reviewedAt: string | null
  notes: string
}

interface FusenMasterData {
  version: number
  generatedAt: string
  fusens: Record<string, FusenData>
}

interface UseFusenDataResult {
  fusens: FusenData[]
  loading: boolean
  error: string | null
}

export function useFusenData(): UseFusenDataResult {
  const [fusens, setFusens] = useState<FusenData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/data/fusens/fusens-master.json')
      .then(res => {
        if (!res.ok) throw new Error('fusens-master.json not found.\nRun: npx tsx scripts/build-fusens-master.ts')
        return res.json()
      })
      .then((data: FusenMasterData) => {
        const list = Object.values(data.fusens).sort((a, b) => a.id.localeCompare(b.id))
        setFusens(list)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { fusens, loading, error }
}
```

- [ ] **Step 2: fusens-master.json を public/ にコピー**

```bash
mkdir -p public/data/fusens
cp src/data/fusens/fusens-master.json public/data/fusens/fusens-master.json
```

- [ ] **Step 3: コミット**

```bash
git add src/dev-tools/fusen-review/hooks/useFusenData.ts public/data/fusens/fusens-master.json
git commit -m "feat: add useFusenData hook for loading fusens-master.json"
```

---

### Task 3: useFusenReviewState フック

**Files:**
- Create: `src/dev-tools/fusen-review/hooks/useFusenReviewState.ts`

- [ ] **Step 1: 既存の useReviewState をベースに作成**

```typescript
// src/dev-tools/fusen-review/hooks/useFusenReviewState.ts
import { useState, useCallback } from 'react'
import type { FusenReviewState, JudgmentStatus, FusenCorrection } from '../types'

const STORAGE_KEY = 'fusen-review-v1'

const initialState: FusenReviewState = {
  version: 1,
  judgments: {},
  corrections: {},
  lastPosition: '',
  updatedAt: new Date().toISOString(),
}

function loadState(): FusenReviewState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return initialState
    const parsed = JSON.parse(stored) as FusenReviewState
    if (parsed.version !== 1) return initialState
    return parsed
  } catch {
    return initialState
  }
}

export function useFusenReviewState() {
  const [state, setState] = useState<FusenReviewState>(loadState)

  const save = useCallback((newState: FusenReviewState) => {
    const updated = { ...newState, updatedAt: new Date().toISOString() }
    setState(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }, [])

  const setJudgment = useCallback((fusenId: string, status: JudgmentStatus) => {
    setState(prev => {
      const next = { ...prev, judgments: { ...prev.judgments, [fusenId]: status } }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, updatedAt: new Date().toISOString() }))
      return next
    })
  }, [])

  const setLastPosition = useCallback((fusenId: string) => {
    setState(prev => {
      const next = { ...prev, lastPosition: fusenId }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, updatedAt: new Date().toISOString() }))
      return next
    })
  }, [])

  const addCorrection = useCallback((fusenId: string, correction: FusenCorrection) => {
    setState(prev => {
      const existing = prev.corrections[fusenId] ?? []
      const next = {
        ...prev,
        corrections: { ...prev.corrections, [fusenId]: [...existing, correction] },
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, updatedAt: new Date().toISOString() }))
      return next
    })
  }, [])

  return { state, setJudgment, setLastPosition, addCorrection, save }
}
```

- [ ] **Step 2: コミット**

```bash
git add src/dev-tools/fusen-review/hooks/useFusenReviewState.ts
git commit -m "feat: add useFusenReviewState hook with localStorage persistence"
```

---

### Task 4: useFusenKeyboardNav フック

**Files:**
- Create: `src/dev-tools/fusen-review/hooks/useFusenKeyboardNav.ts`

- [ ] **Step 1: 既存の useKeyboardNav をベースに付箋用に作成**

```typescript
// src/dev-tools/fusen-review/hooks/useFusenKeyboardNav.ts
import { useEffect, useRef } from 'react'
import type { JudgmentStatus } from '../types'

export interface FusenKeyboardNavActions {
  onNext: () => void
  onPrev: () => void
  onJudge: (status: JudgmentStatus) => void
  onResetJudgment: () => void
  onJumpToNextUnresolved: () => void
  onToggleHelp: () => void
}

/**
 * 付箋レビューUI用キーボードショートカット。
 * actionsRef パターンで常に最新コールバックを呼び出す。
 */
export function useFusenKeyboardNav(actions: FusenKeyboardNavActions) {
  const actionsRef = useRef(actions)
  actionsRef.current = actions

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const a = actionsRef.current

      switch (e.key) {
        case 'j': case 'J': case 'ArrowRight':
          e.preventDefault(); a.onNext(); break
        case 'k': case 'K': case 'ArrowLeft':
          e.preventDefault(); a.onPrev(); break
        case '1': a.onJudge('ok'); break
        case '2': a.onJudge('needs-fix'); break
        case '3': a.onJudge('ng'); break
        case '0': a.onResetJudgment(); break
        case 'g': case 'G': a.onJumpToNextUnresolved(); break
        case '?': a.onToggleHelp(); break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
```

- [ ] **Step 2: コミット**

```bash
git add src/dev-tools/fusen-review/hooks/useFusenKeyboardNav.ts
git commit -m "feat: add useFusenKeyboardNav hook"
```

---

### Task 5: FusenCard コンポーネント

**Files:**
- Create: `src/dev-tools/fusen-review/components/FusenCard.tsx`
- Create: `src/dev-tools/fusen-review/components/FusenCard.module.css`

- [ ] **Step 1: CSSを作成**

```css
/* src/dev-tools/fusen-review/components/FusenCard.module.css */
.card {
  background: var(--card, #1e1e2e);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.badgeId { background: #e94560; color: white; }
.badgeSubject { background: #0f3460; color: white; }
.badgeType { background: #533483; color: white; }
.badgeStatus { background: #444; color: white; }

.imagePreview {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 8px;
  background: #0a0a1a;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #e0e0e0);
}

.body {
  font-size: 13px;
  color: var(--text-secondary, #999);
  white-space: pre-wrap;
  max-height: 120px;
  overflow-y: auto;
  line-height: 1.5;
}

.tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  background: #1a1a3e;
  color: #aaa;
}

.judgmentBar {
  display: flex;
  gap: 8px;
}

.judgmentBtn {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.15s;
}

.judgmentBtn:hover { opacity: 1; }
.judgmentBtnActive { opacity: 1; }

.btnOk { background: #22c55e; color: white; }
.btnFix { background: #f59e0b; color: white; }
.btnNg { background: #ef4444; color: white; }
.btnReset { background: #444; color: white; }

.navBar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.navBtn {
  padding: 6px 16px;
  border: 1px solid #333;
  border-radius: 6px;
  background: transparent;
  color: #aaa;
  cursor: pointer;
  font-size: 13px;
}

.navBtn:hover { background: #222; }
.navBtn:disabled { opacity: 0.3; cursor: default; }

.position {
  font-size: 12px;
  color: #666;
}
```

- [ ] **Step 2: コンポーネントを作成**

```typescript
// src/dev-tools/fusen-review/components/FusenCard.tsx
import type { FusenData } from '../hooks/useFusenData'
import type { JudgmentStatus } from '../types'
import styles from './FusenCard.module.css'

interface Props {
  fusen: FusenData
  judgment: JudgmentStatus | undefined
  currentIndex: number
  totalCount: number
  onJudge: (status: JudgmentStatus) => void
  onResetJudgment: () => void
  onNext: () => void
  onPrev: () => void
}

export function FusenCard({
  fusen, judgment, currentIndex, totalCount,
  onJudge, onResetJudgment, onNext, onPrev,
}: Props) {
  const imgSrc = fusen.imageFile ? `/images/fusens/${fusen.imageFile}` : undefined

  return (
    <div className={styles.card}>
      {/* バッジ行 */}
      <div className={styles.header}>
        <span className={`${styles.badge} ${styles.badgeId}`}>{fusen.id}</span>
        <span className={`${styles.badge} ${styles.badgeSubject}`}>{fusen.subject}</span>
        <span className={`${styles.badge} ${styles.badgeType}`}>{fusen.noteType}</span>
        <span className={`${styles.badge} ${styles.badgeStatus}`}>{fusen.status}</span>
      </div>

      {/* 切り抜き画像 */}
      {imgSrc && <img src={imgSrc} alt={fusen.title} className={styles.imagePreview} />}

      {/* タイトル + 本文 */}
      <div className={styles.title}>{fusen.title}</div>
      <div className={styles.body}>{fusen.body}</div>

      {/* タグ */}
      <div className={styles.tags}>
        {fusen.tags.map((tag, i) => (
          <span key={i} className={styles.tag}>{tag}</span>
        ))}
      </div>

      {/* 判定ボタン */}
      <div className={styles.judgmentBar}>
        <button
          className={`${styles.judgmentBtn} ${styles.btnOk} ${judgment === 'ok' ? styles.judgmentBtnActive : ''}`}
          onClick={() => onJudge('ok')}
        >✅ OK [1]</button>
        <button
          className={`${styles.judgmentBtn} ${styles.btnFix} ${judgment === 'needs-fix' ? styles.judgmentBtnActive : ''}`}
          onClick={() => onJudge('needs-fix')}
        >✏️ Fix [2]</button>
        <button
          className={`${styles.judgmentBtn} ${styles.btnNg} ${judgment === 'ng' ? styles.judgmentBtnActive : ''}`}
          onClick={() => onJudge('ng')}
        >🗑️ NG [3]</button>
        <button
          className={`${styles.judgmentBtn} ${styles.btnReset}`}
          onClick={onResetJudgment}
        >↩ [0]</button>
      </div>

      {/* ナビゲーション */}
      <div className={styles.navBar}>
        <button className={styles.navBtn} onClick={onPrev} disabled={currentIndex === 0}>
          ← Prev [k]
        </button>
        <span className={styles.position}>{currentIndex + 1} / {totalCount}</span>
        <button className={styles.navBtn} onClick={onNext} disabled={currentIndex >= totalCount - 1}>
          Next [j] →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: コミット**

```bash
git add src/dev-tools/fusen-review/components/FusenCard.tsx src/dev-tools/fusen-review/components/FusenCard.module.css
git commit -m "feat: add FusenCard component with judgment buttons"
```

---

### Task 6: FusenReviewPage + ルーティング

**Files:**
- Create: `src/dev-tools/fusen-review/FusenReviewPage.tsx`
- Create: `src/dev-tools/fusen-review/FusenReviewPage.module.css`
- Modify: `src/routes.tsx`

- [ ] **Step 1: ページCSSを作成**

```css
/* src/dev-tools/fusen-review/FusenReviewPage.module.css */
.page {
  min-height: 100vh;
  background: #0a0a1a;
  color: #e0e0e0;
  padding: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #222;
}

.headerTitle {
  font-size: 18px;
  font-weight: 700;
}

.stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.statOk { color: #22c55e; }
.statFix { color: #f59e0b; }
.statNg { color: #ef4444; }
.statPending { color: #666; }

.content {
  max-width: 600px;
  margin: 0 auto;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  font-size: 16px;
  color: #666;
}

.error {
  background: #2d1111;
  color: #ef4444;
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  white-space: pre-wrap;
}

.empty {
  text-align: center;
  color: #666;
  padding: 48px;
  font-size: 14px;
}

.helpHint {
  position: fixed;
  bottom: 12px;
  right: 12px;
  font-size: 11px;
  color: #444;
}
```

- [ ] **Step 2: ページコンポーネントを作成**

```typescript
// src/dev-tools/fusen-review/FusenReviewPage.tsx
import { useState, useMemo, useCallback } from 'react'
import { useFusenData } from './hooks/useFusenData'
import { useFusenReviewState } from './hooks/useFusenReviewState'
import { useFusenKeyboardNav } from './hooks/useFusenKeyboardNav'
import { FusenCard } from './components/FusenCard'
import type { JudgmentStatus } from './types'
import styles from './FusenReviewPage.module.css'

export default function FusenReviewPage() {
  const { fusens, loading, error } = useFusenData()
  const { state, setJudgment, setLastPosition } = useFusenReviewState()
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)

  // lastPosition から初期位置を復元（fusens ロード後に1回だけ）
  const initializedIndex = useMemo(() => {
    if (fusens.length === 0) return 0
    if (state.lastPosition) {
      const idx = fusens.findIndex(f => f.id === state.lastPosition)
      if (idx >= 0) return idx
    }
    return 0
  }, [fusens, state.lastPosition])

  const safeIndex = currentIndex ?? initializedIndex
  const currentFusen = fusens[safeIndex]

  // 統計
  const stats = useMemo(() => {
    const ok = Object.values(state.judgments).filter(j => j === 'ok').length
    const fix = Object.values(state.judgments).filter(j => j === 'needs-fix').length
    const ng = Object.values(state.judgments).filter(j => j === 'ng').length
    return { ok, fix, ng, pending: fusens.length - ok - fix - ng }
  }, [state.judgments, fusens.length])

  const navigate = useCallback((delta: number) => {
    setCurrentIndex(prev => {
      const next = Math.max(0, Math.min(fusens.length - 1, (prev ?? initializedIndex) + delta))
      const fusen = fusens[next]
      if (fusen) setLastPosition(fusen.id)
      return next
    })
  }, [fusens, initializedIndex, setLastPosition])

  const handleJudge = useCallback((status: JudgmentStatus) => {
    if (!currentFusen) return
    setJudgment(currentFusen.id, status)
  }, [currentFusen, setJudgment])

  const handleResetJudgment = useCallback(() => {
    if (!currentFusen) return
    // judgment を削除するために save を使う
    const { [currentFusen.id]: _, ...rest } = state.judgments
    // 簡易的にsetJudgmentの代わりにstateを直接更新
    localStorage.setItem('fusen-review-v1', JSON.stringify({
      ...state, judgments: rest, updatedAt: new Date().toISOString(),
    }))
    window.location.reload() // 簡易リセット（Phase 2 で改善）
  }, [currentFusen, state])

  const handleJumpToNextUnresolved = useCallback(() => {
    const start = (currentIndex ?? initializedIndex) + 1
    for (let i = start; i < fusens.length; i++) {
      if (!state.judgments[fusens[i].id]) {
        setCurrentIndex(i)
        setLastPosition(fusens[i].id)
        return
      }
    }
    // 末尾まで見つからなければ先頭から
    for (let i = 0; i < start; i++) {
      if (!state.judgments[fusens[i].id]) {
        setCurrentIndex(i)
        setLastPosition(fusens[i].id)
        return
      }
    }
  }, [currentIndex, initializedIndex, fusens, state.judgments, setLastPosition])

  useFusenKeyboardNav({
    onNext: () => navigate(1),
    onPrev: () => navigate(-1),
    onJudge: handleJudge,
    onResetJudgment: handleResetJudgment,
    onJumpToNextUnresolved: handleJumpToNextUnresolved,
    onToggleHelp: () => {}, // Phase 2
  })

  if (loading) return <div className={styles.loading}>読み込み中...</div>
  if (error) return <div className={styles.page}><div className={styles.error}>{error}</div></div>
  if (fusens.length === 0) return <div className={styles.page}><div className={styles.empty}>レビュー対象の付箋がありません</div></div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>付箋レビュー</div>
        <div className={styles.stats}>
          <span className={styles.statOk}>✅ {stats.ok}</span>
          <span className={styles.statFix}>✏️ {stats.fix}</span>
          <span className={styles.statNg}>🗑️ {stats.ng}</span>
          <span className={styles.statPending}>⏳ {stats.pending}</span>
        </div>
      </div>
      <div className={styles.content}>
        {currentFusen && (
          <FusenCard
            fusen={currentFusen}
            judgment={state.judgments[currentFusen.id]}
            currentIndex={safeIndex}
            totalCount={fusens.length}
            onJudge={handleJudge}
            onResetJudgment={handleResetJudgment}
            onNext={() => navigate(1)}
            onPrev={() => navigate(-1)}
          />
        )}
      </div>
      <div className={styles.helpHint}>? でショートカット一覧</div>
    </div>
  )
}
```

- [ ] **Step 3: ルーティング追加**

`src/routes.tsx` に以下を追加:

```typescript
// 既存の DevToolsReview の下に追加
const FusenReview = import.meta.env.DEV
  ? React.lazy(() => import('./dev-tools/fusen-review/FusenReviewPage'))
  : null
```

ルート配列に追加（既存の `dev-tools/review` の下）:

```typescript
...(import.meta.env.DEV && FusenReview ? [{
  path: '/dev-tools/fusen-review',
  element: <Suspense fallback={<Loading />}><FusenReview /></Suspense>,
}] : []),
```

- [ ] **Step 4: devサーバーで動作確認**

```bash
npm run dev
# ブラウザで http://localhost:5173/dev-tools/fusen-review を開く
```

Expected:
- 付箋データが読み込まれて最初の付箋が表示
- 切り抜き画像プレビュー + title + body + tags が見える
- j/k で前後移動、1/2/3 で判定
- 判定後にリロードしても保持（localStorage）

- [ ] **Step 5: コミット**

```bash
git add src/dev-tools/fusen-review/FusenReviewPage.tsx src/dev-tools/fusen-review/FusenReviewPage.module.css src/routes.tsx
git commit -m "feat: add FusenReviewPage with keyboard navigation and judgment"
```

---

### Task 7: ビルド確認

- [ ] **Step 1: ビルド確認**

```bash
npm run build
```

Expected: エラーなし（dev-tools はプロダクションビルドから除外される）

- [ ] **Step 2: 全テスト実行**

```bash
npx vitest run
```

Expected: 既存テスト全パス（新規UIテストはPhase 2）

- [ ] **Step 3: 最終コミット（修正があれば）**

```bash
git add -A
git commit -m "fix: address build issues for fusen review UI"
```
