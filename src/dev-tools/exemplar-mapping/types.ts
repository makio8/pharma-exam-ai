import type { MatchStatus, EntryReviewStatus } from '../../types/note-exemplar-mapping'

export type { MatchStatus, EntryReviewStatus }

export interface MappingReviewState {
  version: 1
  matchStatuses: Record<string, MatchStatus>
  primaryOverrides: Record<string, boolean>
  entryStatuses: Record<string, EntryReviewStatus>
  lastPosition: string
  updatedAt: string
}
