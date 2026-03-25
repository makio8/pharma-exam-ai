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
