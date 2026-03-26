import type { MatchStatus, EntryReviewStatus } from '../../types/note-exemplar-mapping'

export type { MatchStatus, EntryReviewStatus }

export interface AddedMatch {
  isPrimary: boolean
  source: 'manual'
  reasoning: '手動追加'
}

export interface MappingReviewState {
  version: 1 | 2
  matchStatuses: Record<string, MatchStatus>
  primaryOverrides: Record<string, boolean>
  entryStatuses: Record<string, EntryReviewStatus>
  addedMatches: Record<string, AddedMatch>
  lastPosition: string
  updatedAt: string
}
