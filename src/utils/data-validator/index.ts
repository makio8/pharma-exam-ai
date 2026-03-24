import type { Question } from '../../types/question'
import type { ValidationContext, ValidationIssue, ValidationReport, Severity } from './types'
import { structuralRules } from './rules/structural'
import { consistencyRules } from './rules/consistency'
import { qualityRules } from './rules/quality'

export function runAllRules(questions: Question[], context: ValidationContext): ValidationReport {
  const allIssues: ValidationIssue[] = [
    ...structuralRules(questions, context),
    ...consistencyRules(questions, context),
    ...qualityRules(questions, context),
  ]

  const questionIdsWithIssues = new Set(allIssues.map(i => i.questionId))

  const byYear: Record<number, { total: number; issues: number }> = {}
  for (const q of questions) {
    if (!byYear[q.year]) byYear[q.year] = { total: 0, issues: 0 }
    byYear[q.year].total++
    if (questionIdsWithIssues.has(q.id)) byYear[q.year].issues++
  }

  const byRule: Record<string, number> = {}
  for (const issue of allIssues) {
    byRule[issue.rule] = (byRule[issue.rule] ?? 0) + 1
  }

  const summary: Record<Severity, number> = { error: 0, warning: 0, info: 0 }
  for (const issue of allIssues) {
    summary[issue.severity]++
  }

  return {
    timestamp: new Date().toISOString(),
    gitCommit: '',
    totalQuestions: questions.length,
    passCount: questions.length - questionIdsWithIssues.size,
    issues: allIssues,
    summary,
    byYear,
    byRule,
  }
}

export type { ValidationIssue, ValidationReport, ValidationContext, Severity } from './types'
