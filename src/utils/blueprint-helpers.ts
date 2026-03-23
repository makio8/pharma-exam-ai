import { EXAM_BLUEPRINT } from '../data/exam-blueprint'
import { QUESTION_TOPIC_MAP } from '../data/question-topic-map'
import { EXEMPLAR_STATS } from '../data/exemplar-stats'
import { getQuestionsForExemplar } from '../data/question-exemplar-map'
import type { MajorCategory } from '../types/blueprint'
import type { QuestionSubject } from '../types/question'

/**
 * 科目の大項目（MajorCategory）一覧を取得
 */
export function getMajorCategoriesForSubject(
  subject: QuestionSubject
): MajorCategory[] {
  const blueprint = EXAM_BLUEPRINT.find(b => b.subject === subject)
  return blueprint?.majorCategories ?? []
}

/**
 * 大項目名 + 科目から、紐づく問題IDの一覧を取得
 * QUESTION_TOPIC_MAP（MiddleCategory）→ MajorCategory に集約
 */
export function getQuestionIdsForMajorCategory(
  majorCategoryName: string,
  subject: QuestionSubject
): string[] {
  const blueprint = EXAM_BLUEPRINT.find(b => b.subject === subject)
  const major = blueprint?.majorCategories.find(
    m => m.name === majorCategoryName
  )
  if (!major) return []

  const middleCategoryIds = new Set(
    major.middleCategories.map(mc => mc.id)
  )

  const questionIds: string[] = []
  for (const [questionId, topicId] of Object.entries(QUESTION_TOPIC_MAP)) {
    if (middleCategoryIds.has(topicId)) {
      questionIds.push(questionId)
    }
  }
  return questionIds
}

/**
 * 出題頻度が高い例示（yearsAppeared >= threshold）に紐づく問題IDを取得
 * 「頻出テーマ」プリセット用
 */
export function getFrequentExemplarQuestionIds(
  minYearsAppeared: number = 3
): string[] {
  const frequentExemplars = EXEMPLAR_STATS.filter(
    e => e.yearsAppeared >= minYearsAppeared
  )

  const questionIdSet = new Set<string>()
  for (const exemplar of frequentExemplars) {
    const mappings = getQuestionsForExemplar(exemplar.exemplarId)
    for (const m of mappings) {
      questionIdSet.add(m.questionId)
    }
  }

  return Array.from(questionIdSet)
}
