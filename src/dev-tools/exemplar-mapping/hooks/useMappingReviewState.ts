import { useState, useCallback } from 'react'
import type { MappingReviewState, MatchStatus, EntryReviewStatus } from '../types'

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
  const state = raw as unknown as MappingReviewState
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
