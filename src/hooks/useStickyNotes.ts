// 付箋のCRUDをリポジトリ経由で管理するカスタムフック
import { useCallback, useEffect, useState } from 'react'
import type { StickyNote } from '../types/note'
import { stickyNoteRepo } from '../repositories'
import type { NewNoteInput } from '../repositories'

export function useStickyNotes() {
  const [notes, setNotes] = useState<StickyNote[]>([])
  const [loading, setLoading] = useState(true)

  // 初回ロード
  useEffect(() => {
    stickyNoteRepo.getAll().then((data) => {
      setNotes(data)
      setLoading(false)
    })
  }, [])

  // 他タブでのlocalStorage変更を反映
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === 'sticky_notes') {
        stickyNoteRepo.getAll().then(setNotes)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  /** 付箋を追加 */
  const addNote = useCallback((input: NewNoteInput) => {
    stickyNoteRepo.add(input).then((note) => {
      setNotes((prev) => [note, ...prev])
    })
  }, [])

  /** 付箋を更新 */
  const updateNote = useCallback((id: string, updates: Partial<StickyNote>) => {
    stickyNoteRepo.update(id, updates).then(() => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, ...updates, updated_at: new Date().toISOString() }
            : n,
        ),
      )
    })
  }, [])

  /** 付箋を削除 */
  const deleteNote = useCallback((id: string) => {
    stickyNoteRepo.delete(id).then(() => {
      setNotes((prev) => prev.filter((n) => n.id !== id))
    })
  }, [])

  /** 特定の問題に紐づく付箋を取得 */
  const getNotesByQuestion = useCallback(
    (questionId: string): StickyNote[] => notes.filter((n) => n.question_id === questionId),
    [notes],
  )

  return { notes, loading, addNote, updateNote, deleteNote, getNotesByQuestion } as const
}
