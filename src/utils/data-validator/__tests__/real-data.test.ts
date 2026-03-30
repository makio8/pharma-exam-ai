import { describe, it, expect } from 'vitest'
import { ALL_QUESTIONS } from '../../../data/all-questions'
import { QUESTION_TOPIC_MAP } from '../../../data/question-topic-map'
import { QUESTION_EXEMPLAR_MAP } from '../../../data/question-exemplar-map'
import { EXAM_BLUEPRINT } from '../../../data/exam-blueprint'
import { OFFICIAL_NOTES } from '../../../data/official-notes'
import { EXEMPLARS } from '../../../data/exemplars'
import { runAllRules } from '../index'
import type { ValidationContext } from '../types'

// コンテキスト構築
const blueprintTopicIds = new Set<string>()
for (const bp of EXAM_BLUEPRINT) {
  for (const major of bp.majorCategories) {
    for (const mid of major.middleCategories) {
      blueprintTopicIds.add(mid.id)
    }
  }
}

const context: ValidationContext = {
  topicMap: QUESTION_TOPIC_MAP,
  blueprintTopicIds,
  exemplarQuestionIds: new Set(QUESTION_EXEMPLAR_MAP.map(m => m.questionId)),
  officialNotes: OFFICIAL_NOTES.map(n => ({
    id: n.id,
    linkedQuestionIds: n.linkedQuestionIds ?? [],
    topicId: n.topicId,
  })),
  questionIds: new Set(ALL_QUESTIONS.map(q => q.id)),
  imageDir: '',  // テスト時はファイル存在チェックスキップ
  exemplars: EXEMPLARS,
  officialNotesWithExemplars: OFFICIAL_NOTES.map(n => ({
    id: n.id,
    primaryExemplarIds: n.primaryExemplarIds,
    secondaryExemplarIds: n.secondaryExemplarIds,
    subject: n.subject,
    topicId: n.topicId,
  })),
}

describe('実データバリデーション', () => {
  const report = runAllRules(ALL_QUESTIONS, context)

  it('全問が読み込まれること', () => {
    expect(ALL_QUESTIONS.length).toBeGreaterThanOrEqual(4000)
  })

  it('レポート構造が正しいこと', () => {
    expect(report.totalQuestions).toBe(ALL_QUESTIONS.length)
    expect(report.summary.error + report.summary.warning + report.summary.info).toBe(report.issues.length)
  })

  it('severity=errorの件数を記録', () => {
    console.log(`error: ${report.summary.error}, warning: ${report.summary.warning}, info: ${report.summary.info}`)
    // 初期閾値: 実測値239件 + 10%マージン = 263件
    // 修正が進むにつれて下げる
    expect(report.summary.error).toBeLessThanOrEqual(263)
  })
})
