// src/utils/practice-complete-logic.ts
// 練習完了画面のロジック — 純粋関数

import type { FlashCardTemplate } from '../types/flashcard-template'
import type { ReviewResult } from '../types/card-progress'

export interface NextAction {
  type: 'related_questions' | 'more_practice' | 'go_home'
  label: string
  emoji: string
  questionIds?: string[]
}

/**
 * 次アクションの候補リストを構築する。
 * - again 結果のカードの primary_exemplar_id を通じて関連問題を収集
 * - 関連問題が 1 件以上ある場合のみ 'related_questions' アクションを追加
 * - 常に 'more_practice' と 'go_home' を追加
 */
export function buildNextActions(
  results: { cardId: string; result: ReviewResult }[],
  cards: FlashCardTemplate[],
  linkService: { getQuestionsForExemplar: (id: string) => string[] },
): NextAction[] {
  const cardById = new Map<string, FlashCardTemplate>(cards.map(c => [c.id, c]))

  // again 結果のカードを抽出
  const againCardIds = results
    .filter(r => r.result === 'again')
    .map(r => r.cardId)

  // again カードの primary_exemplar_id から関連問題を収集（重複除去）
  const relatedQuestionIds = new Set<string>()
  for (const cardId of againCardIds) {
    const card = cardById.get(cardId)
    if (!card) continue
    const qIds = linkService.getQuestionsForExemplar(card.primary_exemplar_id)
    for (const qId of qIds) {
      relatedQuestionIds.add(qId)
    }
  }

  const actions: NextAction[] = []

  // 関連問題が 1 件以上ある場合のみ追加
  if (relatedQuestionIds.size > 0) {
    actions.push({
      type: 'related_questions',
      label: '関連問題を解く',
      emoji: '📝',
      questionIds: [...relatedQuestionIds],
    })
  }

  actions.push({
    type: 'more_practice',
    label: 'もっと練習する',
    emoji: '🔁',
  })

  actions.push({
    type: 'go_home',
    label: 'ホームに戻る',
    emoji: '🏠',
  })

  return actions
}

/**
 * 練習結果の統計を計算する。
 * - ok: 'good' または 'easy' の件数
 * - again: 'again' または 'hard' の件数
 * - total: 合計件数
 * - isPerfect: again === 0 かつ total > 0
 */
export function calculateStats(results: { result: ReviewResult }[]): {
  ok: number
  again: number
  total: number
  isPerfect: boolean
} {
  const ok = results.filter(r => r.result === 'good' || r.result === 'easy').length
  const again = results.filter(r => r.result === 'again' || r.result === 'hard').length
  const total = results.length
  const isPerfect = again === 0 && total > 0

  return { ok, again, total, isPerfect }
}
