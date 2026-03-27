// 公式付箋を問題IDで逆引きするカスタムフック
// linkedQuestionIds は JSON から除外済み（4チームレビュー P1 修正）
// topicId → QUESTION_TOPIC_MAP で逆引き
import { useMemo } from 'react'
import type { OfficialNote } from '../types/official-note'
import { OFFICIAL_NOTES } from '../data/official-notes'
import { QUESTION_TOPIC_MAP } from '../data/question-topic-map'

/** questionId → その問題に紐づく公式付箋一覧を返す */
export function useOfficialNotes(questionId: string): {
  notes: OfficialNote[]
  isLoading: boolean
} {
  // 逆引きマップ: questionId → OfficialNote[]
  // topicId ベース: 同じ topicId を持つ付箋を紐づける
  const reverseMap = useMemo(() => {
    // topicId → OfficialNote[] のマップを先に構築
    const topicToNotes = new Map<string, OfficialNote[]>()
    for (const note of OFFICIAL_NOTES) {
      const list = topicToNotes.get(note.topicId)
      if (list) {
        list.push(note)
      } else {
        topicToNotes.set(note.topicId, [note])
      }
    }

    // questionId → topicId → OfficialNote[] でフラット化
    const map = new Map<string, OfficialNote[]>()
    for (const [qId, topicId] of Object.entries(QUESTION_TOPIC_MAP)) {
      const notes = topicToNotes.get(topicId)
      if (notes) {
        map.set(qId, notes)
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
