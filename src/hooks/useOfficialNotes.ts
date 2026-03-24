// 公式付箋を問題IDで逆引きするカスタムフック
import { useMemo } from 'react'
import type { OfficialNote } from '../types/official-note'
import { OFFICIAL_NOTES } from '../data/official-notes'

/** questionId → その問題に紐づく公式付箋一覧を返す */
export function useOfficialNotes(questionId: string): {
  notes: OfficialNote[]
  isLoading: boolean
} {
  // 逆引きマップ: questionId → OfficialNote[]
  const reverseMap = useMemo(() => {
    const map = new Map<string, OfficialNote[]>()
    for (const note of OFFICIAL_NOTES) {
      for (const qid of note.linkedQuestionIds) {
        const existing = map.get(qid)
        if (existing) {
          existing.push(note)
        } else {
          map.set(qid, [note])
        }
      }
    }
    return map
  }, [])

  const notes = useMemo(
    () => reverseMap.get(questionId) ?? [],
    [reverseMap, questionId],
  )

  return { notes, isLoading: false }
}
