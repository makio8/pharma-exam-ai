import type { Question } from '../../types/question'

export type Severity = 'error' | 'warning' | 'info'

export interface ValidationIssue {
  questionId: string
  rule: string
  severity: Severity
  message: string
  field?: string
  expected?: unknown
  actual?: unknown
}

export type ValidationRule = (questions: Question[], context: ValidationContext) => ValidationIssue[]

export interface ValidationContext {
  topicMap: Record<string, string>
  blueprintTopicIds: Set<string>
  exemplarQuestionIds: Set<string>
  officialNotes: Array<{ id: string; linkedQuestionIds: string[]; topicId: string }>
  questionIds: Set<string>
  imageDir: string
}

export interface ValidationReport {
  timestamp: string
  gitCommit: string
  totalQuestions: number
  passCount: number
  issues: ValidationIssue[]
  summary: Record<Severity, number>
  byYear: Record<number, { total: number; issues: number }>
  byRule: Record<string, number>
}
