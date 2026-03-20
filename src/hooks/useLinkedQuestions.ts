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
 * 検出ロジック:
 * 1. current.linked_group があればそのグループを返す
 * 2. なければ、同年度の隣接問題の linked_group に自分の番号が含まれるかチェック
 *    (例: r101-248 に linked_group がなくても、r101-249 の linked_group が "r101-248-249" なら検出)
 */
export function useLinkedQuestions(questionId: string | undefined): LinkedGroup | null {
  return useMemo(() => {
    if (!questionId) return null
    const current = ALL_QUESTIONS.find((q) => q.id === questionId)
    if (!current) return null

    // パターン1: 自分にlinked_groupがある
    if (current.linked_group) {
      return buildGroup(current.linked_group, current)
    }

    // パターン2: 隣接問題のlinked_groupに自分の番号が含まれる
    // linked_group のフォーマット: "r{year}-{first}-{last}"
    const neighbors = ALL_QUESTIONS.filter(
      (q) =>
        q.year === current.year &&
        q.linked_group &&
        Math.abs(q.question_number - current.question_number) <= 5
    )

    for (const neighbor of neighbors) {
      if (!neighbor.linked_group) continue
      // "r101-248-249" → 248〜249 の範囲に current.question_number が含まれるか
      const match = neighbor.linked_group.match(/^r(\d+)-(\d+)-(\d+)$/)
      if (match) {
        const [, , startStr, endStr] = match
        const start = parseInt(startStr, 10)
        const end = parseInt(endStr, 10)
        if (current.question_number >= start && current.question_number <= end) {
          return buildGroup(neighbor.linked_group, current)
        }
      }
    }

    return null
  }, [questionId])
}

function buildGroup(groupId: string, current: Question): LinkedGroup | null {
  // groupId "r101-248-249" → 248〜249
  const match = groupId.match(/^r(\d+)-(\d+)-(\d+)$/)
  if (!match) return null

  const [, yearStr, startStr, endStr] = match
  const year = parseInt(yearStr, 10)
  const start = parseInt(startStr, 10)
  const end = parseInt(endStr, 10)

  // グループ内の問題を番号範囲で取得（linked_groupが無い問題も含める）
  const groupQuestions = ALL_QUESTIONS
    .filter(
      (q) =>
        q.year === year &&
        q.question_number >= start &&
        q.question_number <= end
    )
    .sort((a, b) => a.question_number - b.question_number)

  if (groupQuestions.length <= 1) return null

  // シナリオはlinked_scenarioから取得、なければ最初の問題のquestion_textの冒頭
  const scenario = groupQuestions.find((q) => q.linked_scenario)?.linked_scenario ?? ''

  return {
    groupId,
    scenario,
    questions: groupQuestions,
  }
}
