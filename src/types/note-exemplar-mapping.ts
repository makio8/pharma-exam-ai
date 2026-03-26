/** 候補単位のレビュー状態 */
export type MatchStatus = 'pending' | 'approved' | 'rejected'

/** 付箋→例示マッチング結果（1件） */
export interface NoteExemplarMatch {
  exemplarId: string
  isPrimary: boolean
  confidence: number
  reasoning: string
  status: MatchStatus
}

/** 付箋単位のレビュー状態 */
export type EntryReviewStatus = 'pending' | 'approved' | 'rejected' | 'modified' | 'needs-manual'

/** 1枚の付箋のマッチング結果 */
export interface NoteExemplarMappingEntry {
  noteId: string
  noteTitle: string
  subject: string
  topicId: string
  matches: NoteExemplarMatch[]
  reviewStatus: EntryReviewStatus
  reviewedAt?: string
}

/** マッチング結果ファイル全体 */
export interface NoteExemplarMappingsFile {
  version: 1
  generatedAt: string
  generatedBy: 'claude-session'
  noteCount: number
  mappings: NoteExemplarMappingEntry[]
}
