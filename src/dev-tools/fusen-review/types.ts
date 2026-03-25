import type { QuestionSubject } from '../../types/question'
import type { NoteType } from '../../types/note'

export type JudgmentStatus = 'ok' | 'needs-fix' | 'ng'

export type FusenCorrection =
  | { type: 'title'; value: string }
  | { type: 'body'; value: string }
  | { type: 'tags'; value: string[] }
  | { type: 'subject'; value: QuestionSubject }
  | { type: 'noteType'; value: NoteType }
  | { type: 'bbox'; value: [number, number, number, number] }
  | { type: 'notes'; value: string }

export interface FusenReviewState {
  version: 1
  judgments: Record<string, JudgmentStatus>
  corrections: Record<string, FusenCorrection[]>
  lastPosition: string
  updatedAt: string
}

export interface FusenFilterConfig {
  subjects: QuestionSubject[]
  judgmentStatus: JudgmentStatus | 'pending' | 'all'
}
