// 暗記カードのCRUD + SM-2復習ロジックを管理するカスタムフック
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FlashCard, ReviewResult } from '../types/flashcard'
import { flashCardRepo } from '../repositories'
import type { NewFlashCardInput } from '../repositories'

/** SM-2 アルゴリズムで次回復習日を計算 */
function calculateNextReview(card: FlashCard, result: ReviewResult): Partial<FlashCard> {
  let { ease_factor, interval_days, correct_streak } = card

  switch (result) {
    case 'again':
      interval_days = 1
      ease_factor = Math.max(1.3, ease_factor - 0.2)
      correct_streak = 0
      break
    case 'hard':
      interval_days = Math.max(1, Math.round(interval_days * 1.2))
      ease_factor = Math.max(1.3, ease_factor - 0.15)
      correct_streak = 0
      break
    case 'good':
      interval_days = correct_streak === 0 ? 1 : Math.round(interval_days * ease_factor)
      correct_streak += 1
      break
    case 'easy':
      interval_days = Math.round(interval_days * ease_factor * 1.3)
      ease_factor += 0.15
      correct_streak += 1
      break
  }

  const next_review_at = new Date(Date.now() + interval_days * 86400000).toISOString()
  return { ease_factor, interval_days, next_review_at, correct_streak, review_count: card.review_count + 1 }
}

export function useFlashCards() {
  const [cards, setCards] = useState<FlashCard[]>([])
  const [loading, setLoading] = useState(true)

  // 初回ロード
  useEffect(() => {
    flashCardRepo.getAll().then((data) => {
      setCards(data)
      setLoading(false)
    })
  }, [])

  // 他タブでのlocalStorage変更を反映
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === 'flash_cards') {
        flashCardRepo.getAll().then(setCards)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  /** 今日が復習日のカード */
  const dueCards = useMemo(() => {
    const now = new Date().toISOString()
    return cards.filter((c) => c.next_review_at <= now)
  }, [cards])

  /** カードを追加 */
  const addCard = useCallback((input: NewFlashCardInput) => {
    return flashCardRepo.add(input).then((card) => {
      setCards((prev) => [card, ...prev])
      return card
    })
  }, [])

  /** カードを更新 */
  const updateCard = useCallback((id: string, updates: Partial<FlashCard>) => {
    flashCardRepo.update(id, updates).then(() => {
      setCards((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, ...updates, updated_at: new Date().toISOString() }
            : c,
        ),
      )
    })
  }, [])

  /** カードを削除 */
  const deleteCard = useCallback((id: string) => {
    flashCardRepo.delete(id).then(() => {
      setCards((prev) => prev.filter((c) => c.id !== id))
    })
  }, [])

  /** 復習結果を反映（SM-2） */
  const reviewCard = useCallback((id: string, result: ReviewResult) => {
    const card = cards.find((c) => c.id === id)
    if (!card) return
    const updates = calculateNextReview(card, result)
    flashCardRepo.update(id, updates).then(() => {
      setCards((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, ...updates, updated_at: new Date().toISOString() }
            : c,
        ),
      )
    })
  }, [cards])

  /** 特定の問題に紐づくカードを取得 */
  const getCardsByQuestion = useCallback(
    (questionId: string): FlashCard[] => cards.filter((c) => c.question_id === questionId),
    [cards],
  )

  return { cards, loading, dueCards, addCard, updateCard, deleteCard, reviewCard, getCardsByQuestion } as const
}
