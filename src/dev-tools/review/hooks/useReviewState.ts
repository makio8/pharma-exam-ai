import { useState, useCallback } from 'react'
import type { ReviewState, JudgmentStatus, Correction } from '../types'

const STORAGE_KEY = 'data-quality-review-v1'

const initialState: ReviewState = {
  version: 1,
  updatedAt: new Date().toISOString(),
  reportGitCommit: '',
  judgments: {},
  correctionStatuses: {},
  corrections: {},
  lastPosition: '',
  confirmedPdfPages: {},
}

function loadState(): ReviewState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return initialState
    const parsed = JSON.parse(stored) as ReviewState
    if (parsed.version !== 1) return initialState // マイグレーション未実装版はリセット
    return parsed
  } catch {
    return initialState
  }
}

export function useReviewState() {
  const [state, setState] = useState<ReviewState>(loadState)

  const save = useCallback((newState: ReviewState) => {
    const updated = { ...newState, updatedAt: new Date().toISOString() }
    setState(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }, [])

  const setJudgment = useCallback((questionId: string, status: JudgmentStatus) => {
    save({ ...state, judgments: { ...state.judgments, [questionId]: status } })
  }, [state, save])

  const setLastPosition = useCallback((questionId: string) => {
    save({ ...state, lastPosition: questionId })
  }, [state, save])

  const confirmPdfPage = useCallback((questionId: string, pdfFile: string, page: number) => {
    save({
      ...state,
      confirmedPdfPages: {
        ...state.confirmedPdfPages,
        [questionId]: { pdfFile, page },
      },
    })
  }, [state, save])

  const addCorrection = useCallback((questionId: string, correction: Correction) => {
    const existing = state.corrections[questionId] ?? []
    save({
      ...state,
      corrections: {
        ...state.corrections,
        [questionId]: [...existing, correction],
      },
    })
  }, [state, save])

  return { state, setJudgment, setLastPosition, confirmPdfPage, addCorrection, save }
}
