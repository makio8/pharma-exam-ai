// 付箋のCRUDをlocalStorageで管理するカスタムフック
import { useCallback, useEffect, useState } from 'react'
import type { StickyNote } from '../types/note.ts'

const STORAGE_KEY = 'sticky_notes'

/** localStorageから付箋配列を読み込む */
function loadNotes(): StickyNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as StickyNote[]
  } catch {
    return []
  }
}

/** localStorageに付箋配列を保存する */
function saveNotes(notes: StickyNote[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

/** 新規付箋作成時に省略可能なフィールド */
type NewNoteInput = Omit<StickyNote, 'id' | 'saves_count' | 'likes_count' | 'created_at' | 'updated_at'>

export function useStickyNotes() {
  const [notes, setNotes] = useState<StickyNote[]>(loadNotes)

  // 他タブでの変更を反映
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setNotes(loadNotes())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  /** 付箋を追加 */
  const addNote = useCallback((input: NewNoteInput) => {
    const now = new Date().toISOString()
    const note: StickyNote = {
      ...input,
      id: crypto.randomUUID(),
      saves_count: 0,
      likes_count: 0,
      created_at: now,
      updated_at: now,
    }
    setNotes(prev => {
      const next = [note, ...prev]
      saveNotes(next)
      return next
    })
  }, [])

  /** 付箋を更新 */
  const updateNote = useCallback((id: string, updates: Partial<StickyNote>) => {
    setNotes(prev => {
      const next = prev.map(n =>
        n.id === id
          ? { ...n, ...updates, updated_at: new Date().toISOString() }
          : n,
      )
      saveNotes(next)
      return next
    })
  }, [])

  /** 付箋を削除 */
  const deleteNote = useCallback((id: string) => {
    setNotes(prev => {
      const next = prev.filter(n => n.id !== id)
      saveNotes(next)
      return next
    })
  }, [])

  /** 特定の問題に紐づく付箋を取得 */
  const getNotesByQuestion = useCallback(
    (questionId: string): StickyNote[] => notes.filter(n => n.question_id === questionId),
    [notes],
  )

  return { notes, addNote, updateNote, deleteNote, getNotesByQuestion } as const
}
