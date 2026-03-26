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
