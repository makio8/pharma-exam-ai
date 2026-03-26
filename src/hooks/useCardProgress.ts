// src/hooks/useCardProgress.ts
// カード復習進捗（SM-2）の管理フック

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CardProgress, ReviewResult } from '../types/card-progress'
import { cardProgressRepo } from '../repositories'
import { SM2Scheduler } from '../utils/sm2-scheduler'

export function useCardProgress() {
  const [allProgress, setAllProgress] = useState<CardProgress[]>([])
  const [loading, setLoading] = useState(true)

  // 初回ロード
  useEffect(() => {
    cardProgressRepo.getAll().then((data) => {
      setAllProgress(data)
      setLoading(false)
    })
  }, [])

  // 他タブでの localStorage 変更を反映
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === 'card_progress') {
        cardProgressRepo.getAll().then(setAllProgress)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  /** 今日が復習日のカード進捗 */
  const dueProgress = useMemo(() => {
    const now = new Date().toISOString()
    return allProgress.filter((p) => p.next_review_at <= now)
  }, [allProgress])

  /** 復習結果を反映し、SM-2 で次回スケジュールを計算 */
  const reviewCard = useCallback(
    async (templateId: string, result: ReviewResult) => {
      const existing = allProgress.find((p) => p.template_id === templateId)
      const current = existing ?? SM2Scheduler.createInitialProgress(templateId)
      const updates = SM2Scheduler.calculate(current, result)
      const updated: CardProgress = {
        ...current,
        ...updates,
        last_reviewed_at: new Date().toISOString(),
      }
      await cardProgressRepo.save(updated)
      setAllProgress((prev) => {
        const idx = prev.findIndex((p) => p.template_id === templateId)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = updated
          return next
        }
        return [updated, ...prev]
      })
      return updated
    },
    [allProgress],
  )

  /** 特定テンプレートの進捗を取得 */
  const getProgressForTemplate = useCallback(
    (templateId: string): CardProgress | undefined =>
      allProgress.find((p) => p.template_id === templateId),
    [allProgress],
  )

  return { allProgress, loading, dueProgress, reviewCard, getProgressForTemplate } as const
}
