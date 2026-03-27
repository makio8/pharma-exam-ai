// ブックマーク（公式付箋のお気に入り）を localStorage で管理するカスタムフック
import { useState, useCallback } from 'react'
import type { BookmarkedNote } from '../types/official-note'

const STORAGE_KEY = 'bookmarked_notes'
const USER_ID = 'local'

/** 旧 on-NNN → 新 fusen-NNNN のIDマッピング（23件） */
const BOOKMARK_ID_MIGRATION: Record<string, string> = {
  'on-001': 'fusen-0001',
  'on-002': 'fusen-0002',
  'on-003': 'fusen-0003',
  'on-004': 'fusen-0004',
  'on-005': 'fusen-0005',
  'on-006': 'fusen-0006',
  'on-007': 'fusen-0007',
  'on-008': 'fusen-0008',
  'on-009': 'fusen-0009',
  'on-010': 'fusen-0010',
  'on-011': 'fusen-0011',
  'on-012': 'fusen-0012',
  'on-013': 'fusen-0013',
  'on-014': 'fusen-0014',
  'on-015': 'fusen-0015',
  'on-016': 'fusen-0016',
  'on-017': 'fusen-0017',
  'on-018': 'fusen-0018',
  'on-019': 'fusen-0019',
  'on-020': 'fusen-0020',
  'on-021': 'fusen-0021',
  'on-022': 'fusen-0022',
  'on-023': 'fusen-0023',
}

/** localStorage内の旧 on-NNN IDを fusen-NNNN に変換 */
function migrateBookmarkIds(bookmarks: BookmarkedNote[]): BookmarkedNote[] {
  let migrated = false
  const result = bookmarks.map((b) => {
    const newId = BOOKMARK_ID_MIGRATION[b.note_id]
    if (newId) {
      migrated = true
      return { ...b, note_id: newId }
    }
    return b
  })
  if (migrated) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
  }
  return result
}

function loadBookmarks(): BookmarkedNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const bookmarks = JSON.parse(raw) as BookmarkedNote[]
    return migrateBookmarkIds(bookmarks)
  } catch {
    return []
  }
}

function saveBookmarks(bookmarks: BookmarkedNote[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // フォールバック: 簡易UUID
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** ブックマーク一覧の取得・追加・削除を提供するフック */
export function useBookmarks(): {
  bookmarks: BookmarkedNote[]
  isBookmarked: (noteId: string) => boolean
  toggleBookmark: (noteId: string) => void
} {
  const [bookmarks, setBookmarks] = useState<BookmarkedNote[]>(loadBookmarks)

  const isBookmarked = useCallback(
    (noteId: string): boolean => bookmarks.some((b) => b.note_id === noteId),
    [bookmarks],
  )

  const toggleBookmark = useCallback((noteId: string): void => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.note_id === noteId)
      const next = exists
        ? prev.filter((b) => b.note_id !== noteId)
        : [
            ...prev,
            {
              id: generateId(),
              user_id: USER_ID,
              note_id: noteId,
              bookmarked_at: new Date().toISOString(),
              review_count: 0,
            } satisfies BookmarkedNote,
          ]
      saveBookmarks(next)
      return next
    })
  }, [])

  return { bookmarks, isBookmarked, toggleBookmark }
}
