import { useMemo } from 'react'
import { ALL_QUESTIONS } from '../data/all-questions'
import type { Question } from '../types/question'

export interface LinkedGroup {
  groupId: string
  scenario: string
  questions: Question[]
}

/**
 * 連問グループを検出するフック
 *
 * 修復済みデータでは全連問に linked_group が設定されているため、
 * linked_group の有無だけでシンプルに判定する。
 */
export function useLinkedQuestions(questionId: string | undefined): LinkedGroup | null {
  return useMemo(() => {
    if (!questionId) return null
    const current = ALL_QUESTIONS.find((q) => q.id === questionId)
    if (!current || !current.linked_group) return null

    return buildGroup(current.linked_group)
  }, [questionId])
}

function buildGroup(groupId: string): LinkedGroup | null {
  const match = groupId.match(/^r(\d+)-(\d+)-(\d+)$/)
  if (!match) return null

  const [, yearStr, startStr, endStr] = match
  const year = parseInt(yearStr, 10)
  const start = parseInt(startStr, 10)
  const end = parseInt(endStr, 10)

  const groupQuestions = ALL_QUESTIONS
    .filter(
      (q) =>
        q.year === year &&
        q.question_number >= start &&
        q.question_number <= end
    )
    .sort((a, b) => a.question_number - b.question_number)

  if (groupQuestions.length <= 1) return null

  const scenario = groupQuestions.find((q) => q.linked_scenario)?.linked_scenario ?? ''

  return {
    groupId,
    scenario,
    questions: groupQuestions,
  }
}
