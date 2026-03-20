import { useMemo } from 'react'
import { ALL_QUESTIONS } from '../data/all-questions'
import type { Question } from '../types/question'

export interface LinkedGroup {
  groupId: string
  scenario: string
  questions: Question[]
}

export function useLinkedQuestions(questionId: string | undefined): LinkedGroup | null {
  return useMemo(() => {
    if (!questionId) return null
    const current = ALL_QUESTIONS.find((q) => q.id === questionId)
    if (!current?.linked_group) return null

    const groupQuestions = ALL_QUESTIONS
      .filter((q) => q.linked_group === current.linked_group)
      .sort((a, b) => a.question_number - b.question_number)

    if (groupQuestions.length <= 1) return null

    return {
      groupId: current.linked_group,
      scenario: current.linked_scenario
        ?? groupQuestions.find(q => q.linked_scenario)?.linked_scenario
        ?? '',
      questions: groupQuestions,
    }
  }, [questionId])
}
