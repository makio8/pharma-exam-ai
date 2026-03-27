# 同topicId全Exemplar一覧 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MappingCard に同 topicId の全 exemplar 折りたたみ一覧を追加し、手動で候補に追加できるようにする

**Architecture:** `getEffectiveMatches()` 純粋関数を単一真実源とし、全操作（表示・一括承認・リセット・エクスポート）をこれに統一。localStorage スキーマを v2 に拡張（`addedMatches` 追加）。MappingCard にインライン折りたたみセクションを追加。

**Tech Stack:** React 19 / TypeScript 5.9 / CSS Modules / Vitest

**Spec:** `docs/superpowers/specs/2026-03-26-exemplar-list-in-mapping-ui-design.md` v1.1

---

## ファイル構成

| ファイル | 操作 | 責務 |
|---------|------|------|
| `src/dev-tools/exemplar-mapping/types.ts` | 修正 | `MappingReviewState` v2 + `AddedMatch` 型 |
| `src/dev-tools/exemplar-mapping/utils/effective-matches.ts` | 新規 | `getEffectiveMatches()` 純粋関数 |
| `src/dev-tools/exemplar-mapping/__tests__/effective-matches.test.ts` | 新規 | 純粋関数テスト |
| `src/dev-tools/exemplar-mapping/__tests__/migration-v1-v2.test.ts` | 新規 | migration テスト |
| `src/dev-tools/exemplar-mapping/hooks/useMappingReviewState.ts` | 修正 | v1→v2 migration, `addMatch()`, `resetEntry` 修正 |
| `src/dev-tools/exemplar-mapping/hooks/useMappingKeyboardNav.ts` | 修正 | `closest()` ベースの除外判定 |
| `src/dev-tools/exemplar-mapping/components/MappingCard.tsx` | 修正 | effective list 統一 + 折りたたみセクション追加 |
| `src/dev-tools/exemplar-mapping/components/MappingCard.module.css` | 修正 | 折りたたみセクションのスタイル |
| `src/dev-tools/exemplar-mapping/ExemplarMappingPage.tsx` | 修正 | effective list 統一 + `addMatch` コールバック + export 修正 |

---

### Task 1: 型定義の拡張（types.ts）

**Files:**
- Modify: `src/dev-tools/exemplar-mapping/types.ts`

- [ ] **Step 1: types.ts を v2 に更新**

```typescript
import type { MatchStatus, EntryReviewStatus } from '../../types/note-exemplar-mapping'

export type { MatchStatus, EntryReviewStatus }

export interface AddedMatch {
  isPrimary: boolean
  source: 'manual'
  reasoning: '手動追加'
}

export interface MappingReviewState {
  version: 1 | 2
  matchStatuses: Record<string, MatchStatus>
  primaryOverrides: Record<string, boolean>
  entryStatuses: Record<string, EntryReviewStatus>
  addedMatches: Record<string, AddedMatch>
  lastPosition: string
  updatedAt: string
}
```

`version` は `1 | 2` のユニオン型にする（migration 時に v1 データを受け入れるため）。

- [ ] **Step 2: コミットは Task 3 完了後にまとめて行う**（型エラーが残る状態でコミットしない）

---

### Task 2: getEffectiveMatches 純粋関数 + テスト（TDD）

**Files:**
- Create: `src/dev-tools/exemplar-mapping/utils/effective-matches.ts`
- Create: `src/dev-tools/exemplar-mapping/__tests__/effective-matches.test.ts`

- [ ] **Step 1: テストファイルを作成**

```typescript
// src/dev-tools/exemplar-mapping/__tests__/effective-matches.test.ts
import { describe, it, expect } from 'vitest'
import { getEffectiveMatches } from '../utils/effective-matches'
import type { NoteExemplarMatch } from '../../../types/note-exemplar-mapping'
import type { AddedMatch } from '../types'

// テスト用のヘルパー: 最小限の NoteExemplarMatch を作る
function makeMatch(exemplarId: string, opts?: Partial<NoteExemplarMatch>): NoteExemplarMatch {
  return {
    exemplarId,
    isPrimary: false,
    confidence: 0.8,
    reasoning: 'test',
    status: 'pending',
    ...opts,
  }
}

// テスト用: 存在する exemplarId のセット（stale 判定用）
const validIds = new Set(['ex-001', 'ex-002', 'ex-003', 'ex-004', 'ex-005'])

describe('getEffectiveMatches', () => {
  it('original のみ（added なし）→ そのまま返す', () => {
    const original = [makeMatch('ex-001'), makeMatch('ex-002')]
    const result = getEffectiveMatches(original, {}, {}, {}, 'on-001', validIds)
    expect(result).toHaveLength(2)
    expect(result[0].exemplarId).toBe('ex-001')
    expect(result[1].exemplarId).toBe('ex-002')
  })

  it('original + added のマージ', () => {
    const original = [makeMatch('ex-001')]
    const added: Record<string, AddedMatch> = {
      'on-001:ex-003': { isPrimary: false, source: 'manual', reasoning: '手動追加' },
    }
    const result = getEffectiveMatches(original, added, {}, {}, 'on-001', validIds)
    expect(result).toHaveLength(2)
    expect(result[0].exemplarId).toBe('ex-001')
    expect(result[1].exemplarId).toBe('ex-003')
    expect(result[1].confidence).toBe(0)
    expect(result[1].reasoning).toBe('手動追加')
    expect(result[1].status).toBe('pending')
  })

  it('別の noteId の addedMatches は無視する', () => {
    const original = [makeMatch('ex-001')]
    const added: Record<string, AddedMatch> = {
      'on-002:ex-003': { isPrimary: false, source: 'manual', reasoning: '手動追加' },
    }
    const result = getEffectiveMatches(original, added, {}, {}, 'on-001', validIds)
    expect(result).toHaveLength(1)
  })

  it('dedupe: original 優先で added を捨てる', () => {
    const original = [makeMatch('ex-001', { confidence: 0.85 })]
    const added: Record<string, AddedMatch> = {
      'on-001:ex-001': { isPrimary: true, source: 'manual', reasoning: '手動追加' },
    }
    const result = getEffectiveMatches(original, added, {}, {}, 'on-001', validIds)
    expect(result).toHaveLength(1)
    expect(result[0].confidence).toBe(0.85) // original の値が残る
  })

  it('stale exemplarId を除外', () => {
    const original = [makeMatch('ex-001'), makeMatch('ex-STALE')]
    const result = getEffectiveMatches(original, {}, {}, {}, 'on-001', validIds)
    expect(result).toHaveLength(1)
    expect(result[0].exemplarId).toBe('ex-001')
  })

  it('matchStatuses で status を上書き', () => {
    const original = [makeMatch('ex-001', { status: 'pending' })]
    const statuses = { 'on-001:ex-001': 'approved' as const }
    const result = getEffectiveMatches(original, {}, statuses, {}, 'on-001', validIds)
    expect(result[0].status).toBe('approved')
  })

  it('primaryOverrides で isPrimary を上書き', () => {
    const original = [makeMatch('ex-001', { isPrimary: false })]
    const overrides = { 'on-001:ex-001': true }
    const result = getEffectiveMatches(original, {}, {}, overrides, 'on-001', validIds)
    expect(result[0].isPrimary).toBe(true)
  })

  it('Primary 1件以下に正規化（複数あれば先頭のみ）', () => {
    const original = [
      makeMatch('ex-001', { isPrimary: true }),
      makeMatch('ex-002', { isPrimary: true }),
      makeMatch('ex-003', { isPrimary: false }),
    ]
    const result = getEffectiveMatches(original, {}, {}, {}, 'on-001', validIds)
    const primaries = result.filter(m => m.isPrimary)
    expect(primaries).toHaveLength(1)
    expect(primaries[0].exemplarId).toBe('ex-001')
  })

  it('reset 後は original のみに戻る（added + overrides が空）', () => {
    const original = [makeMatch('ex-001')]
    // reset 後の状態をシミュレート: added/statuses/overrides が空
    const result = getEffectiveMatches(original, {}, {}, {}, 'on-001', validIds)
    expect(result).toHaveLength(1)
    expect(result[0].exemplarId).toBe('ex-001')
    expect(result[0].status).toBe('pending')
  })

  it('added の status は pending だが matchStatuses で approved に上書きされる', () => {
    const added: Record<string, AddedMatch> = {
      'on-001:ex-003': { isPrimary: false, source: 'manual', reasoning: '手動追加' },
    }
    const statuses = { 'on-001:ex-003': 'approved' as const }
    const result = getEffectiveMatches([], added, statuses, {}, 'on-001', validIds)
    expect(result[0].status).toBe('approved')
  })

  it('original に Primary がいる状態で added を Primary 追加 → 先頭のみ Primary', () => {
    const original = [makeMatch('ex-001', { isPrimary: true })]
    const added: Record<string, AddedMatch> = {
      'on-001:ex-003': { isPrimary: true, source: 'manual', reasoning: '手動追加' },
    }
    const result = getEffectiveMatches(original, added, {}, {}, 'on-001', validIds)
    expect(result).toHaveLength(2)
    const primaries = result.filter(m => m.isPrimary)
    expect(primaries).toHaveLength(1)
    expect(primaries[0].exemplarId).toBe('ex-001') // original が先頭
  })

  it('added に対する primaryOverrides が効く', () => {
    const added: Record<string, AddedMatch> = {
      'on-001:ex-003': { isPrimary: false, source: 'manual', reasoning: '手動追加' },
    }
    const overrides = { 'on-001:ex-003': true }
    const result = getEffectiveMatches([], added, {}, overrides, 'on-001', validIds)
    expect(result[0].isPrimary).toBe(true)
  })

  it('stale な addedMatch に override/status があっても結果に混ざらない', () => {
    const added: Record<string, AddedMatch> = {
      'on-001:ex-STALE': { isPrimary: true, source: 'manual', reasoning: '手動追加' },
    }
    const statuses = { 'on-001:ex-STALE': 'approved' as const }
    const overrides = { 'on-001:ex-STALE': true }
    const result = getEffectiveMatches([], added, statuses, overrides, 'on-001', validIds)
    expect(result).toHaveLength(0)
  })
})
```

- [ ] **Step 2: テストを実行して全て FAIL を確認**

Run: `npx vitest run src/dev-tools/exemplar-mapping/__tests__/effective-matches.test.ts`
Expected: FAIL — `getEffectiveMatches` が存在しない

- [ ] **Step 3: getEffectiveMatches を実装**

```typescript
// src/dev-tools/exemplar-mapping/utils/effective-matches.ts
import type { NoteExemplarMatch, MatchStatus } from '../../../types/note-exemplar-mapping'
import type { AddedMatch } from '../types'

/**
 * 単一真実源: original + added + overrides をマージして effective matches を返す。
 * 全ての表示・操作・エクスポートはこの関数の結果を基準にする。
 *
 * 適用順序:
 * 1. originalMatches をコピー
 * 2. addedMatches から noteId: で始まるエントリを NoteExemplarMatch に変換して追加
 * 3. exemplarId で dedupe（original 優先）
 * 4. validExemplarIds に存在しない exemplarId を除外（stale 対策）
 * 5. matchStatuses / primaryOverrides で上書き
 * 6. Primary 1件以下に正規化
 */
export function getEffectiveMatches(
  originalMatches: NoteExemplarMatch[],
  addedMatches: Record<string, AddedMatch>,
  matchStatuses: Record<string, MatchStatus>,
  primaryOverrides: Record<string, boolean>,
  noteId: string,
  validExemplarIds: Set<string>,
): NoteExemplarMatch[] {
  // Step 1: original をコピー
  const merged: NoteExemplarMatch[] = originalMatches.map(m => ({ ...m }))
  const seenIds = new Set(merged.map(m => m.exemplarId))

  // Step 2: addedMatches から noteId: プレフィックスのものを変換して追加
  const prefix = `${noteId}:`
  for (const [key, added] of Object.entries(addedMatches)) {
    if (!key.startsWith(prefix)) continue
    const exemplarId = key.slice(prefix.length)
    // Step 3: dedupe — original にあれば追加しない
    if (seenIds.has(exemplarId)) continue
    seenIds.add(exemplarId)
    merged.push({
      exemplarId,
      isPrimary: added.isPrimary,
      confidence: 0,
      reasoning: '手動追加',
      status: 'pending',
    })
  }

  // Step 4: stale 除外
  const filtered = merged.filter(m => validExemplarIds.has(m.exemplarId))

  // Step 5: overrides 適用
  for (const m of filtered) {
    const key = `${noteId}:${m.exemplarId}`
    if (key in matchStatuses) {
      m.status = matchStatuses[key]
    }
    if (key in primaryOverrides) {
      m.isPrimary = primaryOverrides[key]
    }
  }

  // Step 6: Primary 正規化（先頭のみ Primary）
  let foundPrimary = false
  for (const m of filtered) {
    if (m.isPrimary) {
      if (foundPrimary) {
        m.isPrimary = false
      } else {
        foundPrimary = true
      }
    }
  }

  return filtered
}
```

- [ ] **Step 4: テストを実行して全て PASS を確認**

Run: `npx vitest run src/dev-tools/exemplar-mapping/__tests__/effective-matches.test.ts`
Expected: 13 tests PASS

- [ ] **Step 5: コミット**

```bash
git add src/dev-tools/exemplar-mapping/utils/effective-matches.ts src/dev-tools/exemplar-mapping/__tests__/effective-matches.test.ts
git commit -m "feat(exemplar-mapping): getEffectiveMatches 純粋関数 + テスト13件"
```

---

### Task 3: useMappingReviewState v2 migration + addMatch + resetEntry 修正

**Files:**
- Modify: `src/dev-tools/exemplar-mapping/hooks/useMappingReviewState.ts`
- Create: `src/dev-tools/exemplar-mapping/__tests__/migration-v1-v2.test.ts`

- [ ] **Step 1: migration テストを作成**

```typescript
// src/dev-tools/exemplar-mapping/__tests__/migration-v1-v2.test.ts
import { describe, it, expect } from 'vitest'
import { migrateState } from '../hooks/useMappingReviewState'

describe('migrateState (v1 → v2)', () => {
  it('v1 state に addedMatches: {} を補完する', () => {
    const v1 = {
      version: 1 as const,
      matchStatuses: { 'on-001:ex-001': 'approved' as const },
      primaryOverrides: {},
      entryStatuses: {},
      lastPosition: 'on-001',
      updatedAt: '2026-03-26T00:00:00.000Z',
    }
    const result = migrateState(v1 as any)
    expect(result.addedMatches).toEqual({})
    expect(result.matchStatuses).toEqual(v1.matchStatuses)
    expect(result.lastPosition).toBe('on-001')
  })

  it('v2 state はそのまま返す', () => {
    const v2 = {
      version: 2 as const,
      matchStatuses: {},
      primaryOverrides: {},
      entryStatuses: {},
      addedMatches: { 'on-001:ex-003': { isPrimary: false, source: 'manual' as const, reasoning: '手動追加' as const } },
      lastPosition: '',
      updatedAt: '2026-03-26T00:00:00.000Z',
    }
    const result = migrateState(v2 as any)
    expect(result.addedMatches).toEqual(v2.addedMatches)
  })
})
```

- [ ] **Step 2: テスト FAIL を確認**

Run: `npx vitest run src/dev-tools/exemplar-mapping/__tests__/migration-v1-v2.test.ts`
Expected: FAIL — `migrateState` が存在しない

- [ ] **Step 3: useMappingReviewState.ts を修正**

```typescript
// src/dev-tools/exemplar-mapping/hooks/useMappingReviewState.ts
import { useState, useCallback } from 'react'
import type { MappingReviewState, MatchStatus, EntryReviewStatus, AddedMatch } from '../types'

const STORAGE_KEY = 'exemplar-mapping-review-v1'

const initialState: MappingReviewState = {
  version: 2,
  matchStatuses: {},
  primaryOverrides: {},
  entryStatuses: {},
  addedMatches: {},
  lastPosition: '',
  updatedAt: new Date().toISOString(),
}

/** v1 → v2 migration: addedMatches を補完 */
export function migrateState(raw: Record<string, unknown>): MappingReviewState {
  const state = raw as MappingReviewState
  if (!state.addedMatches) {
    return { ...state, version: 2, addedMatches: {} }
  }
  return state
}

function loadState(): MappingReviewState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return initialState
    const parsed = JSON.parse(stored) as Record<string, unknown>
    const version = parsed.version
    if (version !== 1 && version !== 2) return initialState
    return migrateState(parsed)
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
        entryStatuses: { ...prev.entryStatuses, [noteId]: 'modified' as EntryReviewStatus },
      }
      persist(next)
      return next
    })
  }, [])

  const togglePrimary = useCallback((noteId: string, exemplarId: string, currentIsPrimary: boolean, allExemplarIds: string[]) => {
    setState(prev => {
      const newOverrides = { ...prev.primaryOverrides }
      const key = `${noteId}:${exemplarId}`
      const newValue = !currentIsPrimary

      if (newValue) {
        for (const eid of allExemplarIds) {
          if (eid !== exemplarId) {
            newOverrides[`${noteId}:${eid}`] = false
          }
        }
      }
      newOverrides[key] = newValue

      const next = {
        ...prev,
        primaryOverrides: newOverrides,
        entryStatuses: { ...prev.entryStatuses, [noteId]: 'modified' as EntryReviewStatus },
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

  /** resetEntry: matchStatuses + primaryOverrides + entryStatuses + addedMatches を全削除 */
  const resetEntry = useCallback((noteId: string, exemplarIds: string[]) => {
    setState(prev => {
      const newMatchStatuses = { ...prev.matchStatuses }
      const newPrimaryOverrides = { ...prev.primaryOverrides }
      const newEntryStatuses = { ...prev.entryStatuses }
      const newAddedMatches = { ...prev.addedMatches }

      for (const eid of exemplarIds) {
        const key = `${noteId}:${eid}`
        delete newMatchStatuses[key]
        delete newPrimaryOverrides[key]
      }
      delete newEntryStatuses[noteId]

      // addedMatches から noteId: プレフィックスのキーを全削除
      const prefix = `${noteId}:`
      for (const key of Object.keys(newAddedMatches)) {
        if (key.startsWith(prefix)) {
          delete newAddedMatches[key]
        }
      }

      const next = {
        ...prev,
        matchStatuses: newMatchStatuses,
        primaryOverrides: newPrimaryOverrides,
        entryStatuses: newEntryStatuses,
        addedMatches: newAddedMatches,
      }
      persist(next)
      return next
    })
  }, [])

  /** 手動追加: addedMatches + matchStatuses + primaryOverrides を一括更新 */
  const addMatch = useCallback((noteId: string, exemplarId: string, isPrimary: boolean, allExemplarIds: string[]) => {
    setState(prev => {
      const key = `${noteId}:${exemplarId}`
      const newAddedMatches = {
        ...prev.addedMatches,
        [key]: { isPrimary, source: 'manual' as const, reasoning: '手動追加' as const },
      }
      const newMatchStatuses = { ...prev.matchStatuses, [key]: 'approved' as MatchStatus }
      const newPrimaryOverrides = { ...prev.primaryOverrides, [key]: isPrimary }

      // Primary 追加時、同 note 内の既存 Primary を Secondary に降格
      if (isPrimary) {
        for (const eid of allExemplarIds) {
          if (eid !== exemplarId) {
            newPrimaryOverrides[`${noteId}:${eid}`] = false
          }
        }
      }

      const next = {
        ...prev,
        addedMatches: newAddedMatches,
        matchStatuses: newMatchStatuses,
        primaryOverrides: newPrimaryOverrides,
        entryStatuses: { ...prev.entryStatuses, [noteId]: 'modified' as EntryReviewStatus },
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
    addMatch,
  }
}
```

- [ ] **Step 4: migration テスト PASS を確認**

Run: `npx vitest run src/dev-tools/exemplar-mapping/__tests__/migration-v1-v2.test.ts`
Expected: 2 tests PASS

- [ ] **Step 5: 全テスト PASS を確認**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 6: コミット**

```bash
git add src/dev-tools/exemplar-mapping/types.ts src/dev-tools/exemplar-mapping/hooks/useMappingReviewState.ts src/dev-tools/exemplar-mapping/__tests__/migration-v1-v2.test.ts
git commit -m "feat(exemplar-mapping): MappingReviewState v2 + addMatch + resetEntry修正 + migration"
```

**注**: Task 1 の types.ts もここでまとめてコミット（型エラーが残る状態をコミットしない）。

---

### Task 4: キーボードショートカット修正

**Files:**
- Modify: `src/dev-tools/exemplar-mapping/hooks/useMappingKeyboardNav.ts`

- [ ] **Step 1: closest() ベースの除外に変更**

`useMappingKeyboardNav.ts` の L21-22 を修正:

```typescript
// Before:
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

// After:
      const interactive = (e.target as HTMLElement).closest(
        'button, summary, [contenteditable], input, textarea, select'
      )
      if (interactive) return
```

- [ ] **Step 2: tsc + 全テスト PASS を確認**

Run: `npx tsc --noEmit && npx vitest run`
Expected: ALL PASS

- [ ] **Step 3: コミット**

```bash
git add src/dev-tools/exemplar-mapping/hooks/useMappingKeyboardNav.ts
git commit -m "fix(exemplar-mapping): キーボードショートカット closest()ベースの除外判定"
```

---

### Task 5: ExemplarMappingPage を effective list 基準に統一

**Files:**
- Modify: `src/dev-tools/exemplar-mapping/ExemplarMappingPage.tsx`

- [ ] **Step 1: import 追加 + effectiveMatches 計算 + 全操作を統一**

ExemplarMappingPage.tsx を以下のように修正:

```typescript
// src/dev-tools/exemplar-mapping/ExemplarMappingPage.tsx
import { useState, useMemo, useCallback } from 'react'
import { useMappingData } from './hooks/useMappingData'
import { useMappingReviewState } from './hooks/useMappingReviewState'
import { useMappingKeyboardNav } from './hooks/useMappingKeyboardNav'
import { MappingCard } from './components/MappingCard'
import { getEffectiveMatches } from './utils/effective-matches'
import { EXEMPLARS } from '../../data/exemplars'
import type { NoteExemplarMappingsFile, NoteExemplarMatch } from '../../types/note-exemplar-mapping'
import type { EntryReviewStatus } from './types'
import styles from './ExemplarMappingPage.module.css'

const validExemplarIds = new Set(EXEMPLARS.map(e => e.id))

export default function ExemplarMappingPage() {
  const { entries, loading, error } = useMappingData()
  const reviewState = useMappingReviewState()
  const { state, setMatchStatus, togglePrimary, setEntryStatus, setLastPosition, approveAll, rejectAll, resetEntry, addMatch } = reviewState
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

  // effective list: 全操作の基準
  const effectiveMatches = useMemo(() => {
    if (!currentEntry) return []
    return getEffectiveMatches(
      currentEntry.matches,
      state.addedMatches,
      state.matchStatuses,
      state.primaryOverrides,
      currentEntry.noteId,
      validExemplarIds,
    )
  }, [currentEntry, state.addedMatches, state.matchStatuses, state.primaryOverrides])

  const allExemplarIds = useMemo(() => effectiveMatches.map(m => m.exemplarId), [effectiveMatches])

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

  // effective list 基準の一括操作
  const handleApproveAll = useCallback(() => {
    if (!currentEntry) return
    approveAll(currentEntry.noteId, allExemplarIds)
  }, [currentEntry, allExemplarIds, approveAll])

  const handleModified = useCallback(() => {
    if (!currentEntry) return
    setEntryStatus(currentEntry.noteId, 'modified')
  }, [currentEntry, setEntryStatus])

  const handleRejectAll = useCallback(() => {
    if (!currentEntry) return
    rejectAll(currentEntry.noteId, allExemplarIds)
  }, [currentEntry, allExemplarIds, rejectAll])

  const handleReset = useCallback(() => {
    if (!currentEntry) return
    resetEntry(currentEntry.noteId, allExemplarIds)
  }, [currentEntry, allExemplarIds, resetEntry])

  const handleAddMatch = useCallback((exemplarId: string, isPrimary: boolean) => {
    if (!currentEntry) return
    addMatch(currentEntry.noteId, exemplarId, isPrimary, allExemplarIds)
  }, [currentEntry, allExemplarIds, addMatch])

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

  // export も effective list 基準
  const handleExport = useCallback(() => {
    if (entries.length === 0) return
    const exported: NoteExemplarMappingsFile = {
      version: 1,
      generatedAt: new Date().toISOString(),
      generatedBy: 'claude-session',
      noteCount: entries.length,
      mappings: entries.map(entry => {
        const entryStatus = state.entryStatuses[entry.noteId] ?? entry.reviewStatus
        const mergedMatches = getEffectiveMatches(
          entry.matches,
          state.addedMatches,
          state.matchStatuses,
          state.primaryOverrides,
          entry.noteId,
          validExemplarIds,
        )
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
            effectiveMatches={effectiveMatches}
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
            onAddMatch={handleAddMatch}
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

- [ ] **Step 2: コミットは Task 6 完了後にまとめて行う**（MappingCard の Props 未更新で型エラーが残るため）

---

### Task 6: MappingCard を effective list 基準に修正 + 折りたたみセクション追加

**Files:**
- Modify: `src/dev-tools/exemplar-mapping/components/MappingCard.tsx`
- Modify: `src/dev-tools/exemplar-mapping/components/MappingCard.module.css`

- [ ] **Step 1: MappingCard.tsx を全面修正**

```typescript
// src/dev-tools/exemplar-mapping/components/MappingCard.tsx
import { useMemo } from 'react'
import type { MappingDataEntry } from '../hooks/useMappingData'
import type { MappingReviewState } from '../types'
import type { NoteExemplarMatch } from '../../../types/note-exemplar-mapping'
import type { Exemplar } from '../../../types/blueprint'
import { ExemplarCandidate } from './ExemplarCandidate'
import { OFFICIAL_NOTES } from '../../../data/official-notes'
import { EXEMPLARS } from '../../../data/exemplars'
import styles from './MappingCard.module.css'

/** EXEMPLARS の全件 id→Exemplar 逆引き（手動追加分の lookup に使用） */
const exemplarById = new Map<string, Exemplar>(
  EXEMPLARS.map(e => [e.id, e])
)

interface Props {
  entry: MappingDataEntry
  effectiveMatches: NoteExemplarMatch[]
  reviewState: MappingReviewState
  currentIndex: number
  totalCount: number
  onSetMatchStatus: (noteId: string, exemplarId: string, status: 'approved' | 'rejected') => void
  onTogglePrimary: (noteId: string, exemplarId: string, currentIsPrimary: boolean, allExemplarIds: string[]) => void
  onApproveAll: () => void
  onModified: () => void
  onRejectAll: () => void
  onReset: () => void
  onNext: () => void
  onPrev: () => void
  onAddMatch: (exemplarId: string, isPrimary: boolean) => void
}

/** 同 topicId の全 exemplar（topicId 変更時のみ再計算される module-level Map） */
const exemplarsByTopic = new Map<string, Exemplar[]>()
for (const ex of EXEMPLARS) {
  const list = exemplarsByTopic.get(ex.middleCategoryId) ?? []
  list.push(ex)
  exemplarsByTopic.set(ex.middleCategoryId, list)
}

export function MappingCard({
  entry, effectiveMatches, reviewState, currentIndex, totalCount,
  onSetMatchStatus, onTogglePrimary,
  onApproveAll, onModified, onRejectAll, onReset,
  onNext, onPrev, onAddMatch,
}: Props) {
  const note = OFFICIAL_NOTES.find(n => n.id === entry.noteId)
  const entryStatus = reviewState.entryStatuses[entry.noteId] ?? entry.reviewStatus

  const allExemplarIds = useMemo(() => effectiveMatches.map(m => m.exemplarId), [effectiveMatches])

  // 同 topicId の全 exemplar（候補済みかどうかを判定用に Set も作る）
  const topicExemplars = exemplarsByTopic.get(entry.topicId) ?? []
  const candidateIdSet = useMemo(() => new Set(effectiveMatches.map(m => m.exemplarId)), [effectiveMatches])

  return (
    <div className={styles.card}>
      {/* ヘッダー: ID + 科目 + topicId */}
      <div className={styles.header}>
        <span className={`${styles.badge} ${styles.badgeId}`}>{entry.noteId}</span>
        <span className={`${styles.badge} ${styles.badgeSubject}`}>{entry.subject}</span>
        <span className={`${styles.badge} ${styles.badgeTopic}`}>{entry.topicId}</span>
        {effectiveMatches.length === 0 && (
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

      {/* Exemplar 候補セクション（effective list 基準） */}
      <div className={styles.sectionTitle}>
        Exemplar 候補 ({effectiveMatches.length}件)
      </div>

      {effectiveMatches.length === 0 ? (
        <div className={styles.noCandidates}>
          ⚠️ マッチする Exemplar がありません。下の一覧から手動で追加してください。
        </div>
      ) : (
        <div className={styles.candidates}>
          {effectiveMatches.map(match => {
            const key = `${entry.noteId}:${match.exemplarId}`
            return (
              <ExemplarCandidate
                key={match.exemplarId}
                match={match}
                exemplar={entry.exemplarMap.get(match.exemplarId) ?? exemplarById.get(match.exemplarId)}
                reviewedStatus={reviewState.matchStatuses[key]}
                primaryOverride={reviewState.primaryOverrides[key]}
                onApprove={() => onSetMatchStatus(entry.noteId, match.exemplarId, 'approved')}
                onReject={() => onSetMatchStatus(entry.noteId, match.exemplarId, 'rejected')}
                onTogglePrimary={(currentIsPrimary) => onTogglePrimary(entry.noteId, match.exemplarId, currentIsPrimary, allExemplarIds)}
              />
            )
          })}
        </div>
      )}

      {/* 同トピック全 Exemplar 一覧（折りたたみ） */}
      {topicExemplars.length > 0 ? (
        <details className={styles.topicExemplars}>
          <summary className={styles.topicExemplarsSummary}>
            同トピックの全 Exemplar ({topicExemplars.length}件)
          </summary>
          <div className={styles.topicExemplarsList}>
            {topicExemplars.map(ex => {
              const isCandidate = candidateIdSet.has(ex.id)
              return (
                <div key={ex.id} className={`${styles.topicExemplarRow} ${isCandidate ? styles.topicExemplarRowAdded : ''}`}>
                  <div className={styles.topicExemplarHeader}>
                    {isCandidate && <span className={styles.topicExemplarBadge}>✅</span>}
                    <span className={styles.topicExemplarId}>{ex.id}</span>
                  </div>
                  <div className={styles.topicExemplarText}>{ex.text}</div>
                  <div className={styles.topicExemplarCategory}>📁 {ex.minorCategory}</div>
                  {!isCandidate && (
                    <div className={styles.topicExemplarActions}>
                      <button
                        className={`${styles.addBtn} ${styles.addBtnPrimary}`}
                        onClick={() => onAddMatch(ex.id, true)}
                      >
                        🟢 Primary
                      </button>
                      <button
                        className={`${styles.addBtn} ${styles.addBtnSecondary}`}
                        onClick={() => onAddMatch(ex.id, false)}
                      >
                        🔵 Secondary
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </details>
      ) : (
        <div className={styles.noCandidates}>
          ⚠️ このトピックに Exemplar はありません
        </div>
      )}

      {/* 判定バー（effectiveMatches が 0 件なら非表示 — needs-manual 誤完了防止） */}
      {effectiveMatches.length > 0 && (
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

- [ ] **Step 2: MappingCard.module.css にスタイル追加**

既存ファイルの末尾に追加:

```css
/* 同トピック全 Exemplar 折りたたみ */
.topicExemplars {
  border-top: 1px solid #222;
  padding-top: 8px;
}
.topicExemplarsSummary {
  font-size: 13px;
  font-weight: 600;
  color: #888;
  cursor: pointer;
  padding: 4px 0;
  list-style: none;
}
.topicExemplarsSummary::marker { content: ''; }
.topicExemplarsSummary::before { content: '▶ '; font-size: 10px; }
.topicExemplars[open] > .topicExemplarsSummary::before { content: '▼ '; }
.topicExemplarsList {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}
.topicExemplarRow {
  background: #16162a;
  border-radius: 6px;
  padding: 8px 10px;
}
.topicExemplarRowAdded { opacity: 0.5; }
.topicExemplarHeader { display: flex; align-items: center; gap: 6px; }
.topicExemplarBadge { font-size: 12px; }
.topicExemplarId { font-size: 11px; color: #666; font-family: monospace; }
.topicExemplarText { font-size: 12px; color: #bbb; margin: 4px 0; line-height: 1.4; }
.topicExemplarCategory { font-size: 10px; color: #555; }
.topicExemplarActions { display: flex; gap: 6px; margin-top: 6px; }
.addBtn {
  padding: 4px 10px;
  border: 1px solid #333;
  border-radius: 4px;
  background: transparent;
  font-size: 11px;
  cursor: pointer;
}
.addBtn:hover { background: #222; }
.addBtnPrimary { color: #22c55e; border-color: #22c55e40; }
.addBtnPrimary:hover { background: #22c55e15; }
.addBtnSecondary { color: #3b82f6; border-color: #3b82f640; }
.addBtnSecondary:hover { background: #3b82f615; }
```

- [ ] **Step 3: tsc + 全テスト PASS を確認**

Run: `npx tsc --noEmit && npx vitest run`
Expected: ALL PASS

- [ ] **Step 4: npm run build で本番ビルド確認**

Run: `npm run build`
Expected: BUILD SUCCESS

- [ ] **Step 5: コミット**

```bash
git add src/dev-tools/exemplar-mapping/ExemplarMappingPage.tsx src/dev-tools/exemplar-mapping/components/MappingCard.tsx src/dev-tools/exemplar-mapping/components/MappingCard.module.css
git commit -m "feat(exemplar-mapping): effective list統一 + 同topicId全exemplar折りたたみ一覧"
```

**注**: Task 5 の ExemplarMappingPage.tsx もここでまとめてコミット（型エラーが残る状態をコミットしない）。

---

### Task 7: ブラウザ動作確認

**Files:** なし（手動テスト）

- [ ] **Step 1: dev サーバー起動**

Run: `npm run dev`

- [ ] **Step 2: ブラウザで `/dev-tools/exemplar-mapping` を開いて確認**

チェックリスト:
- [ ] 既存候補が ExemplarCandidate として表示されること
- [ ] 「同トピックの全 Exemplar (N件)」折りたたみが候補リスト下に表示されること
- [ ] 折りたたみをクリックして開閉できること
- [ ] 候補済み exemplar に ✅ バッジが付き、ボタンが表示されないこと
- [ ] 未追加 exemplar に [🟢 Primary] [🔵 Secondary] ボタンが表示されること
- [ ] [🟢 Primary] タップで候補リストに追加されること
- [ ] 追加後、折りたたみ内の ✅ バッジが更新されること
- [ ] Approve [1] が手動追加含む全候補に適用されること
- [ ] Reset [0] で手動追加が消えること
- [ ] キーボードショートカット（j/k/1/2/3/0）が正常に動作すること
- [ ] 折りたたみ内のボタンクリック時にショートカットが誤発火しないこと
- [ ] Export JSON が手動追加を含むこと

- [ ] **Step 3: 問題があれば修正してコミット**
