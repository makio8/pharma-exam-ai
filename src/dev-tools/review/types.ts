import type { Choice, QuestionSection, QuestionSubject, VisualContentType } from '../../types/question'

export type JudgmentStatus = 'ok' | 'needs-fix' | 'ng'
export type CorrectionStatus = 'draft' | 'ready' | 'applied' | 'verified'

export type Correction =
  | { type: 'text'; field: 'question_text' | 'explanation' | 'category'; value: string }
  | { type: 'choices'; value: Choice[] }
  | { type: 'answer'; value: number | number[] }
  | { type: 'image-crop'; crop: PdfCropRect; pdfFile: string; pdfPage: number }
  | { type: 'image-remove' }
  | { type: 'set-section'; value: QuestionSection }
  | { type: 'set-subject'; value: QuestionSubject }
  | { type: 'set-visual-content-type'; value: VisualContentType }
  | { type: 'set-display-mode'; value: 'text' | 'image' | 'both' }
  | { type: 'set-linked-group'; value: string }
  | { type: 'set-linked-scenario'; value: string }

export interface PdfCropRect {
  x: number; y: number; w: number; h: number
  viewportWidth: number; viewportHeight: number
  scale: number; rotation: 0 | 90 | 180 | 270
}

export interface ReviewState {
  version: 1
  updatedAt: string
  reportGitCommit: string
  judgments: Record<string, JudgmentStatus>
  correctionStatuses: Record<string, CorrectionStatus>
  corrections: Record<string, Correction[]>
  /** 問題ごとのレビューメモ（修正理由・画像切れ等） */
  notes: Record<string, string>
  lastPosition: string
  confirmedPdfPages: Record<string, { pdfFile: string; page: number }>
  savedFilters?: FilterPreset[]
}

export interface FilterPreset {
  name: string
  filters: FilterConfig
}

export interface FilterConfig {
  severities: ('error' | 'warning' | 'info')[]
  years: number[]
  sections: QuestionSection[]
  judgmentStatus: JudgmentStatus | 'pending' | 'all'
  rules: string[]
  /** true のとき全問表示（バリデーションissueの有無を問わない） */
  showAll?: boolean
}

export interface CorrectionsFile {
  version: string
  timestamp: string
  baseGitCommit: string
  reportTimestamp: string
  corrections: Record<string, { dataHash: string; items: Correction[] }>
}
