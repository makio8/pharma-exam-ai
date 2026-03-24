// 回答履歴をリポジトリ経由で管理するカスタムフック
import { useState, useCallback, useEffect } from 'react'
import type { AnswerHistory } from '../types/question'
import { answerHistoryRepo } from '../repositories'

export function useAnswerHistory(options?: { skip?: boolean }) {
  const [history, setHistory] = useState<AnswerHistory[]>([])
  const [loading, setLoading] = useState(true)

  // 初回ロード（skip: true の場合はロードしない — 連問で親から外部注入時の N重ロード防止）
  const skip = options?.skip ?? false
  useEffect(() => {
    if (skip) return
    answerHistoryRepo.getAll().then((data) => {
      setHistory(data)
      setLoading(false)
    })
  }, [skip])

  /** 回答を保存（idは自動生成） */
  const saveAnswer = useCallback((answer: Omit<AnswerHistory, 'id'>) => {
    answerHistoryRepo.save(answer).then((newEntry) => {
      setHistory((prev) => [...prev, newEntry])
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

  return { history, loading, saveAnswer, getQuestionResult } as const
}
