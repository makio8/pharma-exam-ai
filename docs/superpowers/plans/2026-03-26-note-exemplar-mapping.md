# 付箋→例示マッチング パイプライン 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 付箋23枚を例示986件にAI半自動マッチングし、レビューUIで確認後、official-notes.tsに反映する

**Architecture:** 中間JSON（マッチング結果+reasoning）→ レビューUI（1カラム、fusen-reviewパターン）→ official-notes.ts反映。状態管理はlocalStorage正本。既存dev-toolsのパターンを完全踏襲。

**Tech Stack:** React 19, TypeScript 5.9, Vite 8, CSS Modules, vitest

**Spec:** `docs/superpowers/specs/2026-03-26-note-exemplar-mapping-design.md` v1.1

---

## ファイル構成

### 新規作成

| ファイル | 責務 |
|---------|------|
| `src/types/note-exemplar-mapping.ts` | マッチング中間データの型定義 |
| `src/data/fusens/note-exemplar-mappings.json` | Claude推論結果（中間JSON） |
| `src/dev-tools/exemplar-mapping/types.ts` | レビューUI固有の型 |
| `src/dev-tools/exemplar-mapping/hooks/useMappingData.ts` | JSON+exemplarデータ読み込み |
| `src/dev-tools/exemplar-mapping/hooks/useMappingReviewState.ts` | localStorage状態管理 |
| `src/dev-tools/exemplar-mapping/hooks/useMappingKeyboardNav.ts` | キーボードナビ |
| `src/dev-tools/exemplar-mapping/components/ExemplarCandidate.tsx` | 個別候補の表示・操作 |
| `src/dev-tools/exemplar-mapping/components/ExemplarCandidate.module.css` | 候補スタイル |
| `src/dev-tools/exemplar-mapping/components/MappingCard.tsx` | 付箋情報+候補リスト |
| `src/dev-tools/exemplar-mapping/components/MappingCard.module.css` | カードスタイル |
| `src/dev-tools/exemplar-mapping/ExemplarMappingPage.tsx` | ページコンポーネント |
| `src/dev-tools/exemplar-mapping/ExemplarMappingPage.module.css` | ページスタイル |
| `src/utils/data-validator/rules/note-validation.ts` | 付箋バリデーションルール |
| `src/utils/data-validator/__tests__/note-validation.test.ts` | バリデーションテスト |

### 変更

| ファイル | 変更内容 |
|---------|---------|
| `src/routes.tsx` | `/dev-tools/exemplar-mapping` ルート追加 |
| `src/utils/data-validator/index.ts` | noteValidationRules を統合 |
| `src/utils/data-validator/types.ts` | ValidationContext に exemplars, officialNotesWithExemplars 追加 |
| `scripts/validate-data.ts` | ValidationContext に exemplars, officialNotesWithExemplars を渡す |
| `src/utils/data-validator/__tests__/real-data.test.ts` | テストの ValidationContext 更新 |
| `src/data/official-notes.ts` | 各ノートに `exemplarIds` フィールド追加 |

---

## Task 1: 型定義

**Files:**
- Create: `src/types/note-exemplar-mapping.ts`

- [ ] **Step 1: 型定義ファイルを作成**

```typescript
// src/types/note-exemplar-mapping.ts

/** 候補単位のレビュー状態 */
export type MatchStatus = 'pending' | 'approved' | 'rejected'

/** 付箋→例示マッチング結果（1件） */
export interface NoteExemplarMatch {
  exemplarId: string
  isPrimary: boolean
  confidence: number
  reasoning: string
  status: MatchStatus
}

/** 付箋単位のレビュー状態 */
export type EntryReviewStatus = 'pending' | 'approved' | 'rejected' | 'modified' | 'needs-manual'

/** 1枚の付箋のマッチング結果 */
export interface NoteExemplarMappingEntry {
  noteId: string
  noteTitle: string
  subject: string
  topicId: string
  matches: NoteExemplarMatch[]
  reviewStatus: EntryReviewStatus
  reviewedAt?: string
}

/** マッチング結果ファイル全体 */
export interface NoteExemplarMappingsFile {
  version: 1
  generatedAt: string
  generatedBy: 'claude-session'
  noteCount: number
  mappings: NoteExemplarMappingEntry[]
}
```

- [ ] **Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS（新規ファイルは import されていないので影響なし）

- [ ] **Step 3: コミット**

```bash
git add src/types/note-exemplar-mapping.ts
git commit -m "feat: 付箋→例示マッチング型定義（NoteExemplarMatch, MappingEntry）"
```

---

## Task 2: Claude推論でマッチングJSON生成

**Files:**
- Create: `src/data/fusens/note-exemplar-mappings.json`
- Reference: `src/data/official-notes.ts`, `src/data/exemplars.ts`

このタスクはコード実装ではなく、**Claude Codeセッション自身が23枚の付箋を1枚ずつ推論**してマッチング結果を生成する。

- [ ] **Step 1: 推論実行**

`src/data/official-notes.ts` の23枚と `src/data/exemplars.ts` の986件を読み、以下のルールでマッチング:
- 第一制約: `topicId === middleCategoryId` の exemplar を最優先
- 第二制約: 同一 `subject` 内で意味的に最も近い exemplar
- Primary: 直接カバーする例示（confidence >= 0.80）、1-3件
- Secondary: 関連する例示（confidence >= 0.60）、0-2件
- no-match: `matches: []`, `reviewStatus: 'needs-manual'`

出力形式は `NoteExemplarMappingsFile` に準拠。

- [ ] **Step 2: JSON を `src/data/fusens/note-exemplar-mappings.json` に保存**

- [ ] **Step 3: public にもコピー（dev server 配信用）**

```bash
mkdir -p public/data/fusens
cp src/data/fusens/note-exemplar-mappings.json public/data/fusens/
```

- [ ] **Step 4: コミット**

```bash
git add src/data/fusens/note-exemplar-mappings.json public/data/fusens/note-exemplar-mappings.json
git commit -m "feat: 付箋→例示マッチングJSON生成（23枚、Claude推論）"
```

---

## Task 3: データ読み込みフック

**Files:**
- Create: `src/dev-tools/exemplar-mapping/hooks/useMappingData.ts`

- [ ] **Step 1: useMappingData フックを作成**

```typescript
// src/dev-tools/exemplar-mapping/hooks/useMappingData.ts
import { useState, useEffect } from 'react'
import type {
  NoteExemplarMappingsFile,
  NoteExemplarMappingEntry,
} from '../../../types/note-exemplar-mapping'
import type { Exemplar } from '../../../types/blueprint'
import { EXEMPLARS } from '../../../data/exemplars'

export interface MappingDataEntry extends NoteExemplarMappingEntry {
  /** matches 内の exemplarId を解決済みの Exemplar オブジェクトの辞書 */
  exemplarMap: Map<string, Exemplar>
}

interface UseMappingDataResult {
  entries: MappingDataEntry[]
  loading: boolean
  error: string | null
}

/** exemplarId → Exemplar の辞書を構築（初回のみ） */
const exemplarById = new Map<string, Exemplar>(
  EXEMPLARS.map(e => [e.id, e])
)

export function useMappingData(): UseMappingDataResult {
  const [entries, setEntries] = useState<MappingDataEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/data/fusens/note-exemplar-mappings.json')
      .then(res => {
        if (!res.ok) throw new Error(
          'note-exemplar-mappings.json not found.\n' +
          'Task 2（Claude推論）を先に実行してください。'
        )
        return res.json()
      })
      .then((data: NoteExemplarMappingsFile) => {
        const list: MappingDataEntry[] = data.mappings.map(entry => {
          const exemplarMap = new Map<string, Exemplar>()
          for (const m of entry.matches) {
            const ex = exemplarById.get(m.exemplarId)
            if (ex) exemplarMap.set(m.exemplarId, ex)
          }
          return { ...entry, exemplarMap }
        })
        setEntries(list)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { entries, loading, error }
}
```

- [ ] **Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add src/dev-tools/exemplar-mapping/hooks/useMappingData.ts
git commit -m "feat: useMappingData フック（JSON+Exemplar読み込み）"
```

---

## Task 4: レビュー状態管理フック

**Files:**
- Create: `src/dev-tools/exemplar-mapping/types.ts`
- Create: `src/dev-tools/exemplar-mapping/hooks/useMappingReviewState.ts`

- [ ] **Step 1: レビューUI固有の型を作成**

```typescript
// src/dev-tools/exemplar-mapping/types.ts
import type { MatchStatus, EntryReviewStatus } from '../../types/note-exemplar-mapping'

export type { MatchStatus, EntryReviewStatus }

/** localStorage に保存するレビュー状態 */
export interface MappingReviewState {
  version: 1
  /** 候補単位: `${noteId}:${exemplarId}` → MatchStatus */
  matchStatuses: Record<string, MatchStatus>
  /** primary/secondary 変更: `${noteId}:${exemplarId}` → boolean */
  primaryOverrides: Record<string, boolean>
  /** 付箋単位のレビュー状態 */
  entryStatuses: Record<string, EntryReviewStatus>
  /** 最終表示位置（noteId） */
  lastPosition: string
  updatedAt: string
}
```

- [ ] **Step 2: useMappingReviewState フックを作成**

```typescript
// src/dev-tools/exemplar-mapping/hooks/useMappingReviewState.ts
import { useState, useCallback } from 'react'
import type { MappingReviewState, MatchStatus, EntryReviewStatus } from '../types'

const STORAGE_KEY = 'exemplar-mapping-review-v1'

const initialState: MappingReviewState = {
  version: 1,
  matchStatuses: {},
  primaryOverrides: {},
  entryStatuses: {},
  lastPosition: '',
  updatedAt: new Date().toISOString(),
}

function loadState(): MappingReviewState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return initialState
    const parsed = JSON.parse(stored) as MappingReviewState
    if (parsed.version !== 1) return initialState
    return parsed
  } catch {
    return initialState
  }
}

function persist(state: MappingReviewState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...state, updatedAt: new Date().toISOString(),
  }))
}

export function useMappingReviewState() {
  const [state, setState] = useState<MappingReviewState>(loadState)

  const setMatchStatus = useCallback((noteId: string, exemplarId: string, status: MatchStatus) => {
    setState(prev => {
      const key = `${noteId}:${exemplarId}`
      const next = {
        ...prev,
        matchStatuses: { ...prev.matchStatuses, [key]: status },
      }
      persist(next)
      return next
    })
  }, [])

  /** primary⇔secondary 切替。元値を受け取って反転する */
  const togglePrimary = useCallback((noteId: string, exemplarId: string, currentIsPrimary: boolean) => {
    setState(prev => {
      const key = `${noteId}:${exemplarId}`
      const next = {
        ...prev,
        primaryOverrides: {
          ...prev.primaryOverrides,
          [key]: !currentIsPrimary,
        },
      }
      persist(next)
      return next
    })
  }, [])

  const setEntryStatus = useCallback((noteId: string, status: EntryReviewStatus) => {
    setState(prev => {
      const next = {
        ...prev,
        entryStatuses: { ...prev.entryStatuses, [noteId]: status },
      }
      persist(next)
      return next
    })
  }, [])

  const setLastPosition = useCallback((noteId: string) => {
    setState(prev => {
      const next = { ...prev, lastPosition: noteId }
      persist(next)
      return next
    })
  }, [])

  /** 指定付箋の全候補を一括承認 */
  const approveAll = useCallback((noteId: string, exemplarIds: string[]) => {
    setState(prev => {
      const newStatuses = { ...prev.matchStatuses }
      for (const eid of exemplarIds) {
        newStatuses[`${noteId}:${eid}`] = 'approved'
      }
      const next = {
        ...prev,
        matchStatuses: newStatuses,
        entryStatuses: { ...prev.entryStatuses, [noteId]: 'approved' as EntryReviewStatus },
      }
      persist(next)
      return next
    })
  }, [])

  /** 指定付箋の全候補を一括却下 */
  const rejectAll = useCallback((noteId: string, exemplarIds: string[]) => {
    setState(prev => {
      const newStatuses = { ...prev.matchStatuses }
      for (const eid of exemplarIds) {
        newStatuses[`${noteId}:${eid}`] = 'rejected'
      }
      const next = {
        ...prev,
        matchStatuses: newStatuses,
        entryStatuses: { ...prev.entryStatuses, [noteId]: 'rejected' as EntryReviewStatus },
      }
      persist(next)
      return next
    })
  }, [])

  /** レビュー状態をリセット（matchStatuses + primaryOverrides + entryStatuses すべてクリア） */
  const resetEntry = useCallback((noteId: string, exemplarIds: string[]) => {
    setState(prev => {
      const newMatchStatuses = { ...prev.matchStatuses }
      const newPrimaryOverrides = { ...prev.primaryOverrides }
      const newEntryStatuses = { ...prev.entryStatuses }
      for (const eid of exemplarIds) {
        const key = `${noteId}:${eid}`
        delete newMatchStatuses[key]
        delete newPrimaryOverrides[key]
      }
      delete newEntryStatuses[noteId]
      const next = {
        ...prev,
        matchStatuses: newMatchStatuses,
        primaryOverrides: newPrimaryOverrides,
        entryStatuses: newEntryStatuses,
      }
      persist(next)
      return next
    })
  }, [])

  return {
    state,
    setMatchStatus,
    togglePrimary,
    setEntryStatus,
    setLastPosition,
    approveAll,
    rejectAll,
    resetEntry,
  }
}
```

- [ ] **Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: コミット**

```bash
git add src/dev-tools/exemplar-mapping/types.ts src/dev-tools/exemplar-mapping/hooks/useMappingReviewState.ts
git commit -m "feat: useMappingReviewState（localStorage状態管理）"
```

---

## Task 5: キーボードナビフック

**Files:**
- Create: `src/dev-tools/exemplar-mapping/hooks/useMappingKeyboardNav.ts`

- [ ] **Step 1: useMappingKeyboardNav フックを作成**

```typescript
// src/dev-tools/exemplar-mapping/hooks/useMappingKeyboardNav.ts
import { useEffect, useRef } from 'react'

export interface MappingKeyboardNavActions {
  onNext: () => void
  onPrev: () => void
  onApprove: () => void
  onModified: () => void
  onReject: () => void
  onReset: () => void
  onJumpToNextUnresolved: () => void
  onExport: () => void
  onToggleHelp: () => void
}

export function useMappingKeyboardNav(actions: MappingKeyboardNavActions) {
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
        case '1': a.onApprove(); break
        case '2': a.onModified(); break
        case '3': a.onReject(); break
        case '0': a.onReset(); break
        case 'g': case 'G': a.onJumpToNextUnresolved(); break
        case 'e': case 'E': a.onExport(); break
        case '?': a.onToggleHelp(); break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
```

- [ ] **Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: コミット**

```bash
git add src/dev-tools/exemplar-mapping/hooks/useMappingKeyboardNav.ts
git commit -m "feat: useMappingKeyboardNav（キーボードショートカット）"
```

---

## Task 6: ExemplarCandidate コンポーネント

**Files:**
- Create: `src/dev-tools/exemplar-mapping/components/ExemplarCandidate.tsx`
- Create: `src/dev-tools/exemplar-mapping/components/ExemplarCandidate.module.css`

- [ ] **Step 1: CSS を作成**

```css
/* src/dev-tools/exemplar-mapping/components/ExemplarCandidate.module.css */
.candidate {
  background: #16162a;
  border-radius: 8px;
  padding: 12px;
  border-left: 3px solid #444;
}
.candidatePrimary { border-left-color: #22c55e; }
.candidateSecondary { border-left-color: #3b82f6; }
.candidateRejected { opacity: 0.4; }

.topRow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.statusIcon { font-size: 14px; }
.roleBadge {
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  color: white;
}
.rolePrimary { background: #22c55e; }
.roleSecondary { background: #3b82f6; }
.confidence {
  font-size: 11px;
  color: #888;
  margin-left: auto;
}

.exemplarId {
  font-size: 11px;
  color: #666;
  font-family: monospace;
}
.exemplarText {
  font-size: 13px;
  color: #ccc;
  margin: 4px 0;
  line-height: 1.5;
}
.category {
  font-size: 11px;
  color: #555;
}
.reasoning {
  font-size: 11px;
  color: #777;
  margin-top: 4px;
  padding: 6px 8px;
  background: #0d0d1a;
  border-radius: 4px;
  line-height: 1.4;
}

.actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}
.actionBtn {
  padding: 4px 10px;
  border: 1px solid #333;
  border-radius: 4px;
  background: transparent;
  color: #aaa;
  font-size: 11px;
  cursor: pointer;
}
.actionBtn:hover { background: #222; }
.actionBtnApproved { border-color: #22c55e; color: #22c55e; }
.actionBtnRejected { border-color: #ef4444; color: #ef4444; }
```

- [ ] **Step 2: コンポーネントを作成**

```typescript
// src/dev-tools/exemplar-mapping/components/ExemplarCandidate.tsx
import type { NoteExemplarMatch } from '../../../types/note-exemplar-mapping'
import type { Exemplar } from '../../../types/blueprint'
import type { MatchStatus } from '../types'
import styles from './ExemplarCandidate.module.css'

interface Props {
  match: NoteExemplarMatch
  exemplar: Exemplar | undefined
  /** localStorage から読み取った承認状態（未設定なら match.status を使用） */
  reviewedStatus: MatchStatus | undefined
  /** localStorage から読み取った primary 変更（未設定なら match.isPrimary を使用） */
  primaryOverride: boolean | undefined
  onApprove: () => void
  onReject: () => void
  onTogglePrimary: (currentIsPrimary: boolean) => void
}

export function ExemplarCandidate({
  match, exemplar, reviewedStatus, primaryOverride,
  onApprove, onReject, onTogglePrimary,
}: Props) {
  const status = reviewedStatus ?? match.status
  const isPrimary = primaryOverride ?? match.isPrimary

  const statusIcon = status === 'approved' ? '✅'
    : status === 'rejected' ? '❌'
    : '⏳'

  const candidateClass = [
    styles.candidate,
    isPrimary ? styles.candidatePrimary : styles.candidateSecondary,
    status === 'rejected' ? styles.candidateRejected : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={candidateClass}>
      <div className={styles.topRow}>
        <span className={styles.statusIcon}>{statusIcon}</span>
        <span className={`${styles.roleBadge} ${isPrimary ? styles.rolePrimary : styles.roleSecondary}`}>
          {isPrimary ? 'Primary' : 'Secondary'}
        </span>
        <span className={styles.confidence}>{(match.confidence * 100).toFixed(0)}%</span>
      </div>
      <div className={styles.exemplarId}>{match.exemplarId}</div>
      <div className={styles.exemplarText}>
        {exemplar?.text ?? '（Exemplar が見つかりません）'}
      </div>
      {exemplar && (
        <div className={styles.category}>
          📁 {exemplar.minorCategory} &gt; {exemplar.middleCategoryId}
        </div>
      )}
      <div className={styles.reasoning}>💬 {match.reasoning}</div>
      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${status === 'approved' ? styles.actionBtnApproved : ''}`}
          onClick={onApprove}
        >
          ✅ 承認
        </button>
        <button
          className={`${styles.actionBtn} ${status === 'rejected' ? styles.actionBtnRejected : ''}`}
          onClick={onReject}
        >
          ❌ 却下
        </button>
        <button className={styles.actionBtn} onClick={() => onTogglePrimary(isPrimary)}>
          🔄 {isPrimary ? 'Secondary に' : 'Primary に'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: コミット**

```bash
git add src/dev-tools/exemplar-mapping/components/ExemplarCandidate.tsx src/dev-tools/exemplar-mapping/components/ExemplarCandidate.module.css
git commit -m "feat: ExemplarCandidate コンポーネント（候補表示・承認/却下）"
```

---

## Task 7: MappingCard コンポーネント

**Files:**
- Create: `src/dev-tools/exemplar-mapping/components/MappingCard.tsx`
- Create: `src/dev-tools/exemplar-mapping/components/MappingCard.module.css`

- [ ] **Step 1: CSS を作成**

```css
/* src/dev-tools/exemplar-mapping/components/MappingCard.module.css */
.card {
  background: var(--card, #1e1e2e);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
.badgeId { background: #e94560; color: white; }
.badgeSubject { background: #0f3460; color: white; }
.badgeTopic { background: #1a3a4a; color: #7ac; font-size: 10px; }
.badgeNeedsManual { background: #f59e0b; color: white; }
.imagePreview { width: 100%; max-height: 300px; object-fit: contain; border-radius: 8px; background: #0a0a1a; }
.title { font-size: 16px; font-weight: 600; color: var(--text-primary, #e0e0e0); }
.summary { font-size: 13px; color: var(--text-secondary, #999); line-height: 1.5; }
.tags { display: flex; gap: 4px; flex-wrap: wrap; }
.tag { padding: 2px 8px; border-radius: 12px; font-size: 11px; background: #1a1a3e; color: #aaa; }

.sectionTitle {
  font-size: 13px;
  font-weight: 600;
  color: #888;
  padding-top: 8px;
  border-top: 1px solid #222;
}
.candidates { display: flex; flex-direction: column; gap: 8px; }
.noCandidates {
  font-size: 13px;
  color: #f59e0b;
  padding: 12px;
  background: #1a1a10;
  border-radius: 8px;
  text-align: center;
}

.judgmentBar { display: flex; gap: 8px; }
.judgmentBtn { flex: 1; padding: 8px; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; opacity: 0.6; transition: opacity 0.15s; }
.judgmentBtn:hover { opacity: 1; }
.judgmentBtnActive { opacity: 1; }
.btnApprove { background: #22c55e; color: white; }
.btnModified { background: #f59e0b; color: white; }
.btnReject { background: #ef4444; color: white; }
.btnReset { background: #444; color: white; }

.navBar { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.navBtn { padding: 6px 16px; border: 1px solid #333; border-radius: 6px; background: transparent; color: #aaa; cursor: pointer; font-size: 13px; }
.navBtn:hover { background: #222; }
.navBtn:disabled { opacity: 0.3; cursor: default; }
.position { font-size: 12px; color: #666; }
```

- [ ] **Step 2: コンポーネントを作成**

```typescript
// src/dev-tools/exemplar-mapping/components/MappingCard.tsx
import type { MappingDataEntry } from '../hooks/useMappingData'
import type { MappingReviewState, EntryReviewStatus } from '../types'
import { ExemplarCandidate } from './ExemplarCandidate'
import { OFFICIAL_NOTES } from '../../../data/official-notes'
import styles from './MappingCard.module.css'

interface Props {
  entry: MappingDataEntry
  reviewState: MappingReviewState
  currentIndex: number
  totalCount: number
  onSetMatchStatus: (noteId: string, exemplarId: string, status: 'approved' | 'rejected') => void
  onTogglePrimary: (noteId: string, exemplarId: string, currentIsPrimary: boolean) => void
  onApproveAll: () => void
  onModified: () => void
  onRejectAll: () => void
  onReset: () => void
  onNext: () => void
  onPrev: () => void
}

export function MappingCard({
  entry, reviewState, currentIndex, totalCount,
  onSetMatchStatus, onTogglePrimary,
  onApproveAll, onModified, onRejectAll, onReset,
  onNext, onPrev,
}: Props) {
  const note = OFFICIAL_NOTES.find(n => n.id === entry.noteId)
  const entryStatus = reviewState.entryStatuses[entry.noteId] ?? entry.reviewStatus

  return (
    <div className={styles.card}>
      {/* ヘッダー: ID + 科目 + topicId */}
      <div className={styles.header}>
        <span className={`${styles.badge} ${styles.badgeId}`}>{entry.noteId}</span>
        <span className={`${styles.badge} ${styles.badgeSubject}`}>{entry.subject}</span>
        <span className={`${styles.badge} ${styles.badgeTopic}`}>{entry.topicId}</span>
        {entry.matches.length === 0 && (
          <span className={`${styles.badge} ${styles.badgeNeedsManual}`}>要手動</span>
        )}
      </div>

      {/* 付箋画像 */}
      {note?.imageUrl && (
        <img src={note.imageUrl} alt={entry.noteTitle} className={styles.imagePreview} />
      )}

      {/* タイトル + テキストサマリー */}
      <div className={styles.title}>{entry.noteTitle}</div>
      {note?.textSummary && <div className={styles.summary}>{note.textSummary}</div>}

      {/* タグ */}
      {note?.tags && (
        <div className={styles.tags}>
          {note.tags.map((tag, i) => (
            <span key={i} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}

      {/* Exemplar 候補セクション */}
      <div className={styles.sectionTitle}>
        Exemplar 候補 ({entry.matches.length}件)
      </div>

      {entry.matches.length === 0 ? (
        <div className={styles.noCandidates}>
          ⚠️ マッチする Exemplar がありません。手動で追加が必要です。
        </div>
      ) : (
        <div className={styles.candidates}>
          {entry.matches.map(match => {
            const key = `${entry.noteId}:${match.exemplarId}`
            return (
              <ExemplarCandidate
                key={match.exemplarId}
                match={match}
                exemplar={entry.exemplarMap.get(match.exemplarId)}
                reviewedStatus={reviewState.matchStatuses[key]}
                primaryOverride={reviewState.primaryOverrides[key]}
                onApprove={() => onSetMatchStatus(entry.noteId, match.exemplarId, 'approved')}
                onReject={() => onSetMatchStatus(entry.noteId, match.exemplarId, 'rejected')}
                onTogglePrimary={(currentIsPrimary) => onTogglePrimary(entry.noteId, match.exemplarId, currentIsPrimary)}
              />
            )
          })}
        </div>
      )}

      {/* 判定バー（needs-manual は approve/modified 不可） */}
      {entry.matches.length > 0 ? (
        <div className={styles.judgmentBar}>
          <button
            className={`${styles.judgmentBtn} ${styles.btnApprove} ${entryStatus === 'approved' ? styles.judgmentBtnActive : ''}`}
            onClick={onApproveAll}
          >Approve [1]</button>
          <button
            className={`${styles.judgmentBtn} ${styles.btnModified} ${entryStatus === 'modified' ? styles.judgmentBtnActive : ''}`}
            onClick={onModified}
          >Modified [2]</button>
          <button
            className={`${styles.judgmentBtn} ${styles.btnReject} ${entryStatus === 'rejected' ? styles.judgmentBtnActive : ''}`}
            onClick={onRejectAll}
          >Reject [3]</button>
          <button className={`${styles.judgmentBtn} ${styles.btnReset}`} onClick={onReset}>
            Reset [0]
          </button>
        </div>
      ) : (
        <div className={styles.noCandidates}>
          手動追加は Claude Code セッションで実行してください
        </div>
      )}

      {/* ナビ */}
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

- [ ] **Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: コミット**

```bash
git add src/dev-tools/exemplar-mapping/components/MappingCard.tsx src/dev-tools/exemplar-mapping/components/MappingCard.module.css
git commit -m "feat: MappingCard コンポーネント（付箋情報+候補リスト+判定）"
```

---

## Task 8: ExemplarMappingPage + ルート登録

**Files:**
- Create: `src/dev-tools/exemplar-mapping/ExemplarMappingPage.tsx`
- Create: `src/dev-tools/exemplar-mapping/ExemplarMappingPage.module.css`
- Modify: `src/routes.tsx`

- [ ] **Step 1: ページ CSS を作成**

```css
/* src/dev-tools/exemplar-mapping/ExemplarMappingPage.module.css */
.page { min-height: 100vh; background: #0a0a1a; color: #e0e0e0; padding: 16px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #222; }
.headerTitle { font-size: 18px; font-weight: 700; }
.stats { display: flex; gap: 12px; font-size: 12px; }
.statApproved { color: #22c55e; }
.statModified { color: #f59e0b; }
.statRejected { color: #ef4444; }
.statPending { color: #666; }
.content { max-width: 640px; margin: 0 auto; }
.loading { display: flex; align-items: center; justify-content: center; min-height: 50vh; font-size: 16px; color: #666; }
.error { background: #2d1111; color: #ef4444; padding: 24px; border-radius: 12px; text-align: center; white-space: pre-wrap; }
.empty { text-align: center; color: #666; padding: 48px; font-size: 14px; }
.footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
.exportBtn { padding: 8px 16px; border: 1px solid #333; border-radius: 6px; background: transparent; color: #aaa; cursor: pointer; font-size: 13px; }
.exportBtn:hover { background: #222; }
.helpHint { font-size: 11px; color: #444; }
.helpOverlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.helpModal { background: #1e1e2e; border-radius: 12px; padding: 24px; max-width: 360px; color: #e0e0e0; }
.helpModal h3 { margin: 0 0 12px; font-size: 16px; }
.helpModal table { width: 100%; font-size: 13px; }
.helpModal td { padding: 4px 8px; }
.helpModal td:first-child { font-family: monospace; color: #f59e0b; white-space: nowrap; }
```

- [ ] **Step 2: ページコンポーネントを作成**

```typescript
// src/dev-tools/exemplar-mapping/ExemplarMappingPage.tsx
import { useState, useMemo, useCallback } from 'react'
import { useMappingData } from './hooks/useMappingData'
import { useMappingReviewState } from './hooks/useMappingReviewState'
import { useMappingKeyboardNav } from './hooks/useMappingKeyboardNav'
import { MappingCard } from './components/MappingCard'
import type { NoteExemplarMappingsFile, NoteExemplarMatch } from '../../types/note-exemplar-mapping'
import type { EntryReviewStatus } from './types'
import styles from './ExemplarMappingPage.module.css'

export default function ExemplarMappingPage() {
  const { entries, loading, error } = useMappingData()
  const reviewState = useMappingReviewState()
  const { state, setMatchStatus, togglePrimary, setEntryStatus, setLastPosition, approveAll, rejectAll, resetEntry } = reviewState
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [showHelp, setShowHelp] = useState(false)

  const initializedIndex = useMemo(() => {
    if (entries.length === 0) return 0
    if (state.lastPosition) {
      const idx = entries.findIndex(e => e.noteId === state.lastPosition)
      if (idx >= 0) return idx
    }
    return 0
  }, [entries, state.lastPosition])

  const safeIndex = currentIndex ?? initializedIndex
  const currentEntry = entries[safeIndex]

  const stats = useMemo(() => {
    let approved = 0, modified = 0, rejected = 0
    for (const entry of entries) {
      const s = state.entryStatuses[entry.noteId]
      if (s === 'approved') approved++
      else if (s === 'modified') modified++
      else if (s === 'rejected') rejected++
    }
    return { approved, modified, rejected, pending: entries.length - approved - modified - rejected }
  }, [entries, state.entryStatuses])

  const navigate = useCallback((delta: number) => {
    setCurrentIndex(prev => {
      const next = Math.max(0, Math.min(entries.length - 1, (prev ?? initializedIndex) + delta))
      const entry = entries[next]
      if (entry) setLastPosition(entry.noteId)
      return next
    })
  }, [entries, initializedIndex, setLastPosition])

  const handleApproveAll = useCallback(() => {
    if (!currentEntry) return
    approveAll(currentEntry.noteId, currentEntry.matches.map(m => m.exemplarId))
  }, [currentEntry, approveAll])

  const handleModified = useCallback(() => {
    if (!currentEntry) return
    setEntryStatus(currentEntry.noteId, 'modified')
  }, [currentEntry, setEntryStatus])

  const handleRejectAll = useCallback(() => {
    if (!currentEntry) return
    rejectAll(currentEntry.noteId, currentEntry.matches.map(m => m.exemplarId))
  }, [currentEntry, rejectAll])

  const handleReset = useCallback(() => {
    if (!currentEntry) return
    resetEntry(currentEntry.noteId, currentEntry.matches.map(m => m.exemplarId))
  }, [currentEntry, resetEntry])

  const handleJumpToNextUnresolved = useCallback(() => {
    const start = (currentIndex ?? initializedIndex) + 1
    for (let i = start; i < entries.length; i++) {
      if (!state.entryStatuses[entries[i].noteId]) {
        setCurrentIndex(i)
        setLastPosition(entries[i].noteId)
        return
      }
    }
    for (let i = 0; i < start; i++) {
      if (!state.entryStatuses[entries[i].noteId]) {
        setCurrentIndex(i)
        setLastPosition(entries[i].noteId)
        return
      }
    }
  }, [currentIndex, initializedIndex, entries, state.entryStatuses, setLastPosition])

  const handleExport = useCallback(() => {
    if (entries.length === 0) return
    const exported: NoteExemplarMappingsFile = {
      version: 1,
      generatedAt: new Date().toISOString(),
      generatedBy: 'claude-session',
      noteCount: entries.length,
      mappings: entries.map(entry => {
        const entryStatus = state.entryStatuses[entry.noteId] ?? entry.reviewStatus
        const mergedMatches: NoteExemplarMatch[] = entry.matches.map(m => {
          const key = `${entry.noteId}:${m.exemplarId}`
          return {
            ...m,
            status: state.matchStatuses[key] ?? m.status,
            isPrimary: state.primaryOverrides[key] ?? m.isPrimary,
          }
        })
        return {
          noteId: entry.noteId,
          noteTitle: entry.noteTitle,
          subject: entry.subject,
          topicId: entry.topicId,
          matches: mergedMatches,
          reviewStatus: entryStatus as EntryReviewStatus,
          reviewedAt: entryStatus !== 'pending' ? new Date().toISOString() : undefined,
        }
      }),
    }
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'note-exemplar-mappings-reviewed.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [entries, state])

  useMappingKeyboardNav({
    onNext: () => navigate(1),
    onPrev: () => navigate(-1),
    onApprove: handleApproveAll,
    onModified: handleModified,
    onReject: handleRejectAll,
    onReset: handleReset,
    onJumpToNextUnresolved: handleJumpToNextUnresolved,
    onExport: handleExport,
    onToggleHelp: () => setShowHelp(v => !v),
  })

  if (loading) return <div className={styles.loading}>読み込み中...</div>
  if (error) return <div className={styles.page}><div className={styles.error}>{error}</div></div>
  if (entries.length === 0) return <div className={styles.page}><div className={styles.empty}>マッピングデータがありません</div></div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>Exemplar Mapping Review</div>
        <div className={styles.stats}>
          <span className={styles.statApproved}>✅ {stats.approved}</span>
          <span className={styles.statModified}>✏️ {stats.modified}</span>
          <span className={styles.statRejected}>❌ {stats.rejected}</span>
          <span className={styles.statPending}>⏳ {stats.pending}</span>
        </div>
      </div>
      <div className={styles.content}>
        {currentEntry && (
          <MappingCard
            entry={currentEntry}
            reviewState={state}
            currentIndex={safeIndex}
            totalCount={entries.length}
            onSetMatchStatus={setMatchStatus}
            onTogglePrimary={togglePrimary}
            onApproveAll={handleApproveAll}
            onModified={handleModified}
            onRejectAll={handleRejectAll}
            onReset={handleReset}
            onNext={() => navigate(1)}
            onPrev={() => navigate(-1)}
          />
        )}
      </div>
      <div className={styles.footer}>
        <button className={styles.exportBtn} onClick={handleExport}>
          📥 Export JSON [e]
        </button>
        <span className={styles.helpHint}>? でショートカット一覧</span>
      </div>
      {showHelp && (
        <div className={styles.helpOverlay} onClick={() => setShowHelp(false)}>
          <div className={styles.helpModal}>
            <h3>キーボードショートカット</h3>
            <table>
              <tbody>
                <tr><td>j / →</td><td>次の付箋</td></tr>
                <tr><td>k / ←</td><td>前の付箋</td></tr>
                <tr><td>1</td><td>Approve（全候補承認）</td></tr>
                <tr><td>2</td><td>Modified（変更あり）</td></tr>
                <tr><td>3</td><td>Reject（全候補却下）</td></tr>
                <tr><td>0</td><td>Reset</td></tr>
                <tr><td>g</td><td>次の未レビューへ</td></tr>
                <tr><td>e</td><td>Export JSON</td></tr>
                <tr><td>?</td><td>このヘルプ</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: ルート登録**

`src/routes.tsx` に以下を追加:

```typescript
// 既存の FusenAnnotate の下に追加（lazy import セクション）
const ExemplarMapping = import.meta.env.DEV
  ? React.lazy(() => import('./dev-tools/exemplar-mapping/ExemplarMappingPage'))
  : null

// ルート配列の最後（FusenAnnotate の後）に追加
...(import.meta.env.DEV && ExemplarMapping ? [{
  path: '/dev-tools/exemplar-mapping',
  element: <Suspense fallback={<Loading />}><ExemplarMapping /></Suspense>,
}] : []),
```

- [ ] **Step 4: 型チェック + dev server 起動確認**

Run: `npx tsc --noEmit`
Expected: PASS

Run: `npm run dev` → ブラウザで `/dev-tools/exemplar-mapping` にアクセス
Expected: ページが表示される（Task 2 のJSONがなければエラーメッセージ表示）

- [ ] **Step 5: コミット**

```bash
git add src/dev-tools/exemplar-mapping/ExemplarMappingPage.tsx src/dev-tools/exemplar-mapping/ExemplarMappingPage.module.css src/routes.tsx
git commit -m "feat: ExemplarMappingPage + ルート登録（/dev-tools/exemplar-mapping）"
```

---

## Task 9: バリデーションルール追加

**Files:**
- Create: `src/utils/data-validator/rules/note-validation.ts`
- Create: `src/utils/data-validator/__tests__/note-validation.test.ts`
- Modify: `src/utils/data-validator/types.ts`
- Modify: `src/utils/data-validator/index.ts`

- [ ] **Step 1: テストを先に書く**

```typescript
// src/utils/data-validator/__tests__/note-validation.test.ts
import { describe, it, expect } from 'vitest'
import { noteValidationRules } from '../rules/note-validation'
import type { ValidationContext } from '../types'
import type { Exemplar } from '../../../types/blueprint'

const testExemplars: Exemplar[] = [
  { id: 'ex-physics-001', minorCategory: '化学結合', middleCategoryId: 'physics-material-structure', subject: '物理', text: '化学結合の様式について説明できる。' },
  { id: 'ex-chemistry-001', minorCategory: '基本性質', middleCategoryId: 'chemistry-basic-properties', subject: '化学', text: '基本性質を説明できる。' },
]

const baseContext: ValidationContext = {
  topicMap: {},
  blueprintTopicIds: new Set(['physics-material-structure', 'chemistry-basic-properties']),
  exemplarQuestionIds: new Set(),
  officialNotes: [],
  questionIds: new Set(),
  imageDir: '',
  exemplars: testExemplars,
  officialNotesWithExemplars: [],
}

describe('note-exemplar-exists', () => {
  it('存在するexemplarIdはエラーなし', () => {
    const ctx: ValidationContext = {
      ...baseContext,
      officialNotesWithExemplars: [
        { id: 'on-001', exemplarIds: ['ex-physics-001'], subject: '物理', topicId: 'physics-material-structure' },
      ],
    }
    const issues = noteValidationRules([], ctx)
    const exists = issues.filter(i => i.rule === 'note-exemplar-exists')
    expect(exists).toHaveLength(0)
  })

  it('存在しないexemplarIdはerror', () => {
    const ctx: ValidationContext = {
      ...baseContext,
      officialNotesWithExemplars: [
        { id: 'on-001', exemplarIds: ['ex-nonexistent'], subject: '物理', topicId: 'physics-material-structure' },
      ],
    }
    const issues = noteValidationRules([], ctx)
    const exists = issues.filter(i => i.rule === 'note-exemplar-exists')
    expect(exists).toHaveLength(1)
    expect(exists[0].severity).toBe('error')
  })
})

describe('note-exemplar-no-duplicates', () => {
  it('重複なしはエラーなし', () => {
    const ctx: ValidationContext = {
      ...baseContext,
      officialNotesWithExemplars: [
        { id: 'on-001', exemplarIds: ['ex-physics-001', 'ex-chemistry-001'], subject: '物理', topicId: 'physics-material-structure' },
      ],
    }
    const issues = noteValidationRules([], ctx).filter(i => i.rule === 'note-exemplar-no-duplicates')
    expect(issues).toHaveLength(0)
  })

  it('重複ありはerror', () => {
    const ctx: ValidationContext = {
      ...baseContext,
      officialNotesWithExemplars: [
        { id: 'on-001', exemplarIds: ['ex-physics-001', 'ex-physics-001'], subject: '物理', topicId: 'physics-material-structure' },
      ],
    }
    const issues = noteValidationRules([], ctx).filter(i => i.rule === 'note-exemplar-no-duplicates')
    expect(issues).toHaveLength(1)
    expect(issues[0].severity).toBe('error')
  })
})

describe('note-exemplar-subject-match', () => {
  it('subject一致はwarningなし', () => {
    const ctx: ValidationContext = {
      ...baseContext,
      officialNotesWithExemplars: [
        { id: 'on-001', exemplarIds: ['ex-physics-001'], subject: '物理', topicId: 'physics-material-structure' },
      ],
    }
    const issues = noteValidationRules([], ctx).filter(i => i.rule === 'note-exemplar-subject-match')
    expect(issues).toHaveLength(0)
  })

  it('subject不一致はwarning', () => {
    const ctx: ValidationContext = {
      ...baseContext,
      officialNotesWithExemplars: [
        { id: 'on-001', exemplarIds: ['ex-chemistry-001'], subject: '物理', topicId: 'physics-material-structure' },
      ],
    }
    const issues = noteValidationRules([], ctx).filter(i => i.rule === 'note-exemplar-subject-match')
    expect(issues).toHaveLength(1)
    expect(issues[0].severity).toBe('warning')
  })
})

describe('note-exemplar-topic-match', () => {
  it('topicId一致はwarningなし', () => {
    const ctx: ValidationContext = {
      ...baseContext,
      officialNotesWithExemplars: [
        { id: 'on-001', exemplarIds: ['ex-physics-001'], subject: '物理', topicId: 'physics-material-structure' },
      ],
    }
    const issues = noteValidationRules([], ctx).filter(i => i.rule === 'note-exemplar-topic-match')
    expect(issues).toHaveLength(0)
  })

  it('topicId不一致はwarning', () => {
    const ctx: ValidationContext = {
      ...baseContext,
      officialNotesWithExemplars: [
        { id: 'on-001', exemplarIds: ['ex-chemistry-001'], subject: '化学', topicId: 'physics-material-structure' },
      ],
    }
    const issues = noteValidationRules([], ctx).filter(i => i.rule === 'note-exemplar-topic-match')
    expect(issues).toHaveLength(1)
    expect(issues[0].severity).toBe('warning')
  })
})

describe('note-has-exemplars', () => {
  it('exemplarIds未設定はinfo', () => {
    const ctx: ValidationContext = {
      ...baseContext,
      officialNotesWithExemplars: [
        { id: 'on-001', exemplarIds: undefined, subject: '物理', topicId: 'physics-material-structure' },
      ],
    }
    const issues = noteValidationRules([], ctx).filter(i => i.rule === 'note-has-exemplars')
    expect(issues).toHaveLength(1)
    expect(issues[0].severity).toBe('info')
  })

  it('空配列もinfo', () => {
    const ctx: ValidationContext = {
      ...baseContext,
      officialNotesWithExemplars: [
        { id: 'on-001', exemplarIds: [], subject: '物理', topicId: 'physics-material-structure' },
      ],
    }
    const issues = noteValidationRules([], ctx).filter(i => i.rule === 'note-has-exemplars')
    expect(issues).toHaveLength(1)
  })
})
```

- [ ] **Step 2: テスト実行（失敗確認）**

Run: `npx vitest run src/utils/data-validator/__tests__/note-validation.test.ts`
Expected: FAIL（`noteValidationRules` が存在しない）

- [ ] **Step 3: ValidationContext の型を拡張**

`src/utils/data-validator/types.ts` の `ValidationContext` に追加:

```typescript
import type { Exemplar } from '../../types/blueprint'
import type { OfficialNote } from '../../types/official-note'

export interface ValidationContext {
  topicMap: Record<string, string>
  blueprintTopicIds: Set<string>
  exemplarQuestionIds: Set<string>
  officialNotes: Array<{ id: string; linkedQuestionIds: string[]; topicId: string }>
  questionIds: Set<string>
  imageDir: string
  /** 例示マスタ（付箋バリデーション用） */
  exemplars: Exemplar[]
  /** exemplarIds 付き付箋（付箋バリデーション用） */
  officialNotesWithExemplars: Array<{ id: string; exemplarIds?: string[]; subject: string; topicId: string }>
}
```

**注意**: `exemplars` と `officialNotesWithExemplars` は非optional。既存の呼び出し元も全て更新する。

- [ ] **Step 4: バリデーションルールを実装**

```typescript
// src/utils/data-validator/rules/note-validation.ts
import type { Question } from '../../../types/question'
import type { ValidationContext, ValidationIssue } from '../types'

export function noteValidationRules(
  _questions: Question[],
  context: ValidationContext,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const notes = context.officialNotesWithExemplars
  const exemplarMap = new Map(
    context.exemplars.map(e => [e.id, e])
  )

  for (const note of notes) {
    const exemplarIds = note.exemplarIds

    // note-has-exemplars: 未設定チェック
    if (!exemplarIds || exemplarIds.length === 0) {
      issues.push({
        questionId: note.id,
        rule: 'note-has-exemplars',
        severity: 'info',
        message: `付箋 ${note.id} に exemplarIds が未設定です`,
      })
      continue
    }

    // note-exemplar-no-duplicates: 重複チェック
    const seen = new Set<string>()
    for (const eid of exemplarIds) {
      if (seen.has(eid)) {
        issues.push({
          questionId: note.id,
          rule: 'note-exemplar-no-duplicates',
          severity: 'error',
          message: `付箋 ${note.id} の exemplarIds に重複: ${eid}`,
          field: 'exemplarIds',
          actual: eid,
        })
      }
      seen.add(eid)
    }

    for (const eid of exemplarIds) {
      const exemplar = exemplarMap.get(eid)

      // note-exemplar-exists: 存在チェック
      if (!exemplar) {
        issues.push({
          questionId: note.id,
          rule: 'note-exemplar-exists',
          severity: 'error',
          message: `付箋 ${note.id} の exemplarId "${eid}" が EXEMPLARS に存在しません`,
          field: 'exemplarIds',
          actual: eid,
        })
        continue
      }

      // note-exemplar-subject-match: 科目一致チェック
      if (note.subject !== exemplar.subject) {
        issues.push({
          questionId: note.id,
          rule: 'note-exemplar-subject-match',
          severity: 'warning',
          message: `付箋 ${note.id}(${note.subject}) と exemplar ${eid}(${exemplar.subject}) の科目が不一致`,
          field: 'subject',
          expected: note.subject,
          actual: exemplar.subject,
        })
      }

      // note-exemplar-topic-match: topicId一致チェック
      if (note.topicId !== exemplar.middleCategoryId) {
        issues.push({
          questionId: note.id,
          rule: 'note-exemplar-topic-match',
          severity: 'warning',
          message: `付箋 ${note.id}(${note.topicId}) と exemplar ${eid}(${exemplar.middleCategoryId}) の topicId が不一致`,
          field: 'topicId',
          expected: note.topicId,
          actual: exemplar.middleCategoryId,
        })
      }
    }
  }

  return issues
}
```

- [ ] **Step 5: テスト実行（成功確認）**

Run: `npx vitest run src/utils/data-validator/__tests__/note-validation.test.ts`
Expected: ALL PASS（10テスト）

- [ ] **Step 6: index.ts に統合**

`src/utils/data-validator/index.ts` に追加:

```typescript
import { noteValidationRules } from './rules/note-validation'

// runAllRules 内の allIssues に追加
const allIssues: ValidationIssue[] = [
  ...structuralRules(questions, context),
  ...consistencyRules(questions, context),
  ...qualityRules(questions, context),
  ...noteValidationRules(questions, context),
]
```

- [ ] **Step 7: scripts/validate-data.ts の ValidationContext 更新**

`scripts/validate-data.ts` の context 構築に `exemplars` と `officialNotesWithExemplars` を追加:

```typescript
import { EXEMPLARS } from '../src/data/exemplars'
import { OFFICIAL_NOTES } from '../src/data/official-notes'

const context: ValidationContext = {
  // ...既存フィールド
  exemplars: EXEMPLARS,
  officialNotesWithExemplars: OFFICIAL_NOTES.map(n => ({
    id: n.id,
    exemplarIds: n.exemplarIds,
    subject: n.subject,
    topicId: n.topicId,
  })),
}
```

- [ ] **Step 8: real-data.test.ts の ValidationContext 更新**

`src/utils/data-validator/__tests__/real-data.test.ts` の context 構築にも同様に追加:

```typescript
import { EXEMPLARS } from '../../../data/exemplars'

const context: ValidationContext = {
  // ...既存フィールド
  exemplars: EXEMPLARS,
  officialNotesWithExemplars: OFFICIAL_NOTES.map(n => ({
    id: n.id,
    exemplarIds: n.exemplarIds,
    subject: n.subject,
    topicId: n.topicId,
  })),
}
```

- [ ] **Step 9: 全テスト実行**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 10: npm run validate 実行**

Run: `npm run validate`
Expected: 新ルールが動作し、note-has-exemplars の info が表示される（exemplarIds 未設定の付箋がある場合）

- [ ] **Step 11: コミット**

```bash
git add src/utils/data-validator/rules/note-validation.ts src/utils/data-validator/__tests__/note-validation.test.ts src/utils/data-validator/types.ts src/utils/data-validator/index.ts scripts/validate-data.ts
git commit -m "feat: 付箋バリデーションルール5件追加（exists, duplicates, subject, topic, has-exemplars）"
```

---

## Task 10: official-notes.ts に exemplarIds 反映

**Files:**
- Modify: `src/data/official-notes.ts`
- Reference: エクスポートされたレビュー済みJSON

このタスクはレビューUI完了後に実行する。

- [ ] **Step 1: レビューUIでエクスポートしたJSONを読み取り**

エクスポートされた `note-exemplar-mappings-reviewed.json` を読み取り、各ノートの `exemplarIds` を確認:
- `reviewStatus === 'approved' || 'modified'` のエントリのみ対象
- `match.status === 'approved'` の候補のみ抽出
- Primary（`isPrimary: true`）を先頭に配置

- [ ] **Step 2: official-notes.ts を更新**

各ノートに `exemplarIds: [...]` を追加。例:

```typescript
{
  id: 'on-001',
  title: 'SI基本単位',
  // ... 既存フィールド
  linkedQuestionIds: ['r100-001', 'r102-001', 'r104-001', 'r109-001'],
  exemplarIds: ['ex-physics-058'],  // ← 追加
  importance: 4,
  tier: 'free',
},
```

- [ ] **Step 3: 型チェック + バリデーション**

Run: `npx tsc --noEmit`
Expected: PASS

Run: `npm run validate`
Expected: note-exemplar-exists エラーなし

- [ ] **Step 4: 全テスト実行**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 5: コミット**

```bash
git add src/data/official-notes.ts
git commit -m "feat: official-notes.ts に exemplarIds 反映（23枚、レビュー済み）"
```

---

## Task 11: 中間JSONを永続アセットとして更新

**Files:**
- Modify: `src/data/fusens/note-exemplar-mappings.json`
- Modify: `public/data/fusens/note-exemplar-mappings.json`

- [ ] **Step 1: レビュー済みJSONで中間JSONを更新**

エクスポートした `note-exemplar-mappings-reviewed.json` の内容で `src/data/fusens/note-exemplar-mappings.json` を置換。
これにより primary/secondary、confidence、reasoning がgit管理される。

- [ ] **Step 2: public にもコピー**

```bash
cp src/data/fusens/note-exemplar-mappings.json public/data/fusens/
```

- [ ] **Step 3: コミット**

```bash
git add src/data/fusens/note-exemplar-mappings.json public/data/fusens/note-exemplar-mappings.json
git commit -m "feat: 中間JSON更新（レビュー済みステータス反映）"
```

---

## 実行順序の依存関係

```
Task 1 (型定義)
  ↓
Task 2 (Claude推論 → JSON生成) ← 実データ依存
  ↓
Task 3 (useMappingData) ← Task 1, 2 に依存
Task 4 (useMappingReviewState) ← Task 1 に依存
Task 5 (useMappingKeyboardNav) ← 独立
  ↓
Task 6 (ExemplarCandidate) ← Task 1, 4 に依存
  ↓
Task 7 (MappingCard) ← Task 3, 4, 6 に依存
  ↓
Task 8 (ExemplarMappingPage + route) ← Task 3-7 に依存
  ↓
Task 9 (バリデーション) ← Task 1 に依存（UI と並行可能）
  ↓
[レビューUI で確認・修正] ← 手動作業
  ↓
Task 10 (official-notes.ts 反映) ← レビュー完了後 + Task 9（validator で反映後チェック）
Task 11 (中間JSON更新) ← Task 10 と同時
```
