// scripts/lib/fusens-master-types.ts
import type { QuestionSubject } from '../../src/types/question'
import type { NoteType } from '../../src/types/note'

export type { NoteType }
export type FusenStatus = 'active' | 'draft' | 'archived' | 'duplicate'

export interface FusenSource {
  pdf: string
  page: number                          // spreadPage（見開きページ番号）
  pageId?: string                       // 半ページID（例: "page-001-left"）
  side?: 'left' | 'right'              // 左右どちら
  noteIndex: number
  bbox: [number, number, number, number]
}

export interface Fusen {
  id: string
  title: string
  body: string
  imageFile: string
  subject: QuestionSubject
  noteType: NoteType
  tags: string[]
  source: FusenSource
  topicId: string | null
  linkedQuestionIds: string[]
  importance: number
  tier: 'free' | 'premium'
  status: FusenStatus
  reviewedAt: string | null
  notes: string
}

export interface FusenMaster {
  version: number
  generatedAt: string
  fusens: Record<string, Fusen>
}

/** ocr-results.json のnote 1件 */
export interface OcrNote {
  title: string
  body: string
  subject: string
  note_type: string
  tags: string[]
  bbox?: [number, number, number, number]
  imageFile?: string
}

/** ocr-results.json の1ページ */
export interface OcrPageResult {
  page: number
  notes: OcrNote[]
}
