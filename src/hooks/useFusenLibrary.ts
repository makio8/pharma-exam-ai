import { useMemo } from 'react'
import { OFFICIAL_NOTES } from '../data/official-notes'
import { FusenLibraryCore } from '../utils/fusen-library-core'
import type { FusenGroup } from '../utils/fusen-library-core'
import type { OfficialNote } from '../types/official-note'
import { useBookmarks } from './useBookmarks'

export function useFusenLibrary(): {
  allFusens: OfficialNote[]
  bookmarkedFusens: OfficialNote[]
  bookmarkedIds: Set<string>
  allGrouped: FusenGroup[]
  bookmarkedGrouped: FusenGroup[]
  getFusenById: (id: string) => OfficialNote | undefined
} {
  const { bookmarks } = useBookmarks()

  const core = useMemo(() => new FusenLibraryCore(OFFICIAL_NOTES), [])

  const bookmarkedIds = useMemo(
    () => new Set(bookmarks.map(b => b.note_id)),
    [bookmarks],
  )

  const bookmarkedFusens = useMemo(
    () => core.filterBookmarked(bookmarkedIds),
    [core, bookmarkedIds],
  )

  const allGrouped = useMemo(() => {
    const sorted = core.sortByImportance()
    return new FusenLibraryCore(sorted).groupBySubject()
  }, [core])

  const bookmarkedGrouped = useMemo(
    () => new FusenLibraryCore(bookmarkedFusens).groupBySubject(),
    [bookmarkedFusens],
  )

  const getFusenById = useMemo(
    () => (id: string) => core.getFusenById(id),
    [core],
  )

  return {
    allFusens: OFFICIAL_NOTES,
    bookmarkedFusens,
    bookmarkedIds,
    allGrouped,
    bookmarkedGrouped,
    getFusenById,
  }
}
