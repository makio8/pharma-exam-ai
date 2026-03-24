import { existsSync } from 'fs'
import type { Question } from '../../../types/question'
import type { ValidationContext, ValidationIssue } from '../types'

// ─────────────────────────────────────────────
// 定数
// ─────────────────────────────────────────────

/** linked_group の正規表現: r{3桁}-{3桁}-{3桁} */
const LINKED_GROUP_RE = /^r(\d{3})-(\d{3})-(\d{3})$/

// ─────────────────────────────────────────────
// メイン関数
// ─────────────────────────────────────────────

export function consistencyRules(
  questions: Question[],
  context: ValidationContext,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // ─── ルール 14〜16: 各問題に対する個別チェック ───
  for (const q of questions) {
    // ─── ルール 14: topic-map-exists ───
    if (!(q.id in context.topicMap)) {
      issues.push({
        questionId: q.id,
        rule: 'topic-map-exists',
        severity: 'warning',
        message: `QUESTION_TOPIC_MAP にエントリがありません: "${q.id}"`,
        field: 'id',
      })
    } else {
      // ─── ルール 15: topic-id-valid ───
      const topicId = context.topicMap[q.id]
      if (!context.blueprintTopicIds.has(topicId)) {
        issues.push({
          questionId: q.id,
          rule: 'topic-id-valid',
          severity: 'error',
          message: `トピックID "${topicId}" が EXAM_BLUEPRINT に存在しません`,
          field: 'topicId',
          expected: 'EXAM_BLUEPRINTに存在するID',
          actual: topicId,
        })
      }
    }

    // ─── ルール 16: exemplar-map-exists ───
    if (!context.exemplarQuestionIds.has(q.id)) {
      issues.push({
        questionId: q.id,
        rule: 'exemplar-map-exists',
        severity: 'warning',
        message: `QUESTION_EXEMPLAR_MAP にエントリがありません: "${q.id}"`,
        field: 'id',
      })
    }

    // ─── ルール 23: image-file-exists ───
    if (q.image_url !== undefined && q.image_url !== null && context.imageDir !== '') {
      // imageDir は public/ ディレクトリのルート。image_url は "/images/questions/..." 形式なのでそのまま結合
      const filePath = context.imageDir + q.image_url
      if (!existsSync(filePath)) {
        issues.push({
          questionId: q.id,
          rule: 'image-file-exists',
          severity: 'warning',
          message: `image_url が設定されていますが実ファイルが存在しません: "${filePath}"`,
          field: 'image_url',
          expected: '実ファイルが存在すること',
          actual: filePath,
        })
      }
    }
  }

  // ─── ルール 17〜20: linked_group 系チェック ───
  // まず linked_group を持つ問題を集め、groupId → questions[] の Map を作る
  const groupMap = new Map<string, Question[]>()
  for (const q of questions) {
    if (q.linked_group != null) {
      const group = groupMap.get(q.linked_group) ?? []
      group.push(q)
      groupMap.set(q.linked_group, group)
    }
  }

  for (const [groupId, groupQuestions] of groupMap) {
    const representativeId = groupQuestions[0].id

    // ─── ルール 17: linked-group-format ───
    const formatMatch = LINKED_GROUP_RE.exec(groupId)
    if (!formatMatch) {
      issues.push({
        questionId: representativeId,
        rule: 'linked-group-format',
        severity: 'error',
        message: `linked_group が r{3桁}-{3桁}-{3桁} 形式ではありません: "${groupId}"`,
        field: 'linked_group',
        expected: 'r{3桁}-{3桁}-{3桁}',
        actual: groupId,
      })
      // フォーマット不正の場合、18・19・20 はスキップ
      continue
    }

    const groupYear = parseInt(formatMatch[1], 10)
    const startNum = parseInt(formatMatch[2], 10)
    const endNum = parseInt(formatMatch[3], 10)

    // ─── ルール 18: linked-group-complete ───
    const missingIds: string[] = []
    for (let num = startNum; num <= endNum; num++) {
      const expectedId = `r${String(groupYear).padStart(3, '0')}-${String(num).padStart(3, '0')}`
      if (!context.questionIds.has(expectedId)) {
        missingIds.push(expectedId)
      }
    }
    if (missingIds.length > 0) {
      issues.push({
        questionId: representativeId,
        rule: 'linked-group-complete',
        severity: 'error',
        message: `linked_group "${groupId}" 内に存在しない問題があります（歯抜け）: [${missingIds.join(', ')}]`,
        field: 'linked_group',
        expected: `r${String(groupYear).padStart(3, '0')}-${String(startNum).padStart(3, '0')} 〜 r${String(groupYear).padStart(3, '0')}-${String(endNum).padStart(3, '0')} が全て存在すること`,
        actual: `欠落: ${missingIds.join(', ')}`,
      })
    }

    // ─── ルール 19: linked-group-same-year ───
    const years = new Set(groupQuestions.map(q => q.year))
    const sections = new Set(groupQuestions.map(q => q.section))
    if (years.size > 1 || sections.size > 1) {
      const yearList = [...years].join(', ')
      const sectionList = [...sections].join(', ')
      issues.push({
        questionId: representativeId,
        rule: 'linked-group-same-year',
        severity: 'error',
        message: `linked_group "${groupId}" 内の問題が異なるyear/sectionを持っています (year: [${yearList}], section: [${sectionList}])`,
        field: 'linked_group',
        expected: '全問が同一year・section',
        actual: { years: yearList, sections: sectionList },
      })
    }

    // ─── ルール 20: linked-scenario-shared ───
    const scenarios = new Set(groupQuestions.map(q => q.linked_scenario))
    if (scenarios.size > 1) {
      const scenarioList = [...scenarios].map(s => s ?? '(未設定)').join(', ')
      issues.push({
        questionId: representativeId,
        rule: 'linked-scenario-shared',
        severity: 'warning',
        message: `linked_group "${groupId}" 内の問題が異なるlinked_scenarioを持っています: [${scenarioList}]`,
        field: 'linked_scenario',
        expected: '全問が同一linked_scenario',
        actual: scenarioList,
      })
    }
  }

  // ─── ルール 21〜22: 公式付箋チェック ───
  for (const note of context.officialNotes) {
    // ─── ルール 21: note-question-exists ───
    for (const questionId of note.linkedQuestionIds) {
      if (!context.questionIds.has(questionId)) {
        issues.push({
          questionId: note.id, // 付箋IDを使う
          rule: 'note-question-exists',
          severity: 'warning',
          message: `公式付箋 "${note.id}" が参照するquestionId "${questionId}" が存在しません`,
          field: 'linkedQuestionIds',
          expected: '存在するquestionId',
          actual: questionId,
        })
      }
    }

    // ─── ルール 22: note-topic-valid ───
    if (!context.blueprintTopicIds.has(note.topicId)) {
      issues.push({
        questionId: note.id, // 付箋IDを使う
        rule: 'note-topic-valid',
        severity: 'warning',
        message: `公式付箋 "${note.id}" のtopicId "${note.topicId}" が EXAM_BLUEPRINT に存在しません`,
        field: 'topicId',
        expected: 'EXAM_BLUEPRINTに存在するID',
        actual: note.topicId,
      })
    }
  }

  return issues
}
