// ブックマーク（公式付箋のお気に入り）を localStorage で管理するカスタムフック
import { useState, useCallback } from 'react'
import type { BookmarkedNote } from '../types/official-note'

const STORAGE_KEY = 'bookmarked_notes'
const USER_ID = 'local'

function loadBookmarks(): BookmarkedNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as BookmarkedNote[]
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
