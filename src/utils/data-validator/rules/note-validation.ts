import type { Question } from '../../../types/question'
import type { ValidationContext, ValidationIssue } from '../types'

export function noteValidationRules(
  _questions: Question[],
  context: ValidationContext,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const notes = context.officialNotesWithExemplars
  const exemplarMap = new Map(
    context.exemplars.map(e => [e.id, e])
  )

  for (const note of notes) {
    const exemplarIds = note.exemplarIds

    // note-has-exemplars: 未設定または空配列チェック
    if (!exemplarIds || exemplarIds.length === 0) {
      issues.push({
        questionId: note.id,
        rule: 'note-has-exemplars',
        severity: 'info',
        message: `付箋 ${note.id} に exemplarIds が未設定です`,
      })
      continue
    }

    // note-exemplar-no-duplicates: 重複チェック
    const seen = new Set<string>()
    for (const eid of exemplarIds) {
      if (seen.has(eid)) {
        issues.push({
          questionId: note.id,
          rule: 'note-exemplar-no-duplicates',
          severity: 'error',
          message: `付箋 ${note.id} の exemplarIds に重複: ${eid}`,
          field: 'exemplarIds',
          actual: eid,
        })
      }
      seen.add(eid)
    }

    for (const eid of exemplarIds) {
      const exemplar = exemplarMap.get(eid)

      // note-exemplar-exists: 存在チェック
      if (!exemplar) {
        issues.push({
          questionId: note.id,
          rule: 'note-exemplar-exists',
          severity: 'error',
          message: `付箋 ${note.id} の exemplarId "${eid}" が EXEMPLARS に存在しません`,
          field: 'exemplarIds',
          actual: eid,
        })
        continue
      }

      // note-exemplar-subject-match: 科目一致チェック
      if (note.subject !== exemplar.subject) {
        issues.push({
          questionId: note.id,
          rule: 'note-exemplar-subject-match',
          severity: 'warning',
          message: `付箋 ${note.id}(${note.subject}) と exemplar ${eid}(${exemplar.subject}) の科目が不一致`,
          field: 'subject',
          expected: note.subject,
          actual: exemplar.subject,
        })
      }

      // note-exemplar-topic-match: topicId一致チェック
      if (note.topicId !== exemplar.middleCategoryId) {
        issues.push({
          questionId: note.id,
          rule: 'note-exemplar-topic-match',
          severity: 'warning',
          message: `付箋 ${note.id}(${note.topicId}) と exemplar ${eid}(${exemplar.middleCategoryId}) の topicId が不一致`,
          field: 'topicId',
          expected: note.topicId,
          actual: exemplar.middleCategoryId,
        })
      }
    }
  }

  return issues
}
