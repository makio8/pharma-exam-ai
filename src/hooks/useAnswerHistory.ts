// 回答履歴をlocalStorageで管理するカスタムフック
import { useState, useCallback } from 'react'
import type { AnswerHistory } from '../types/question'

const STORAGE_KEY = 'answer_history'

function loadHistory(): AnswerHistory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as AnswerHistory[]
  } catch {
    return []
  }
}

function persistHistory(history: AnswerHistory[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

export function useAnswerHistory() {
  const [history, setHistory] = useState<AnswerHistory[]>(loadHistory)

  /** 回答を保存（idは自動生成） */
  const saveAnswer = useCallback((answer: Omit<AnswerHistory, 'id'>) => {
    const newEntry: AnswerHistory = {
      ...answer,
      id: crypto.randomUUID(),
    }
    setHistory((prev) => {
      const next = [...prev, newEntry]
      persistHistory(next)
      return next
    })
  }, [])

  /** 特定の問題の最新回答を取得 */
  const getQuestionResult = useCallback(
    (questionId: string): AnswerHistory | undefined => {
      // 最新の回答を返す（同じ問題を複数回解く可能性がある）
      const filtered = history.filter((h) => h.question_id === questionId)
      return filtered.length > 0 ? filtered[filtered.length - 1] : undefined
    },
    [history],
  )

  return { history, saveAnswer, getQuestionResult } as const
}
