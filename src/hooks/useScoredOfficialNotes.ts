// 公式付箋スコアリングフック
// OfficialNoteScoringCore をラップするだけ（ロジックなし）
import { useMemo } from 'react'
import type { OfficialNote } from '../types/official-note'
import type { Question } from '../types/question'
import { OFFICIAL_NOTES } from '../data/official-notes'
import { QUESTION_TOPIC_MAP } from '../data/question-topic-map'
import { QUESTION_EXEMPLAR_MAP } from '../data/question-exemplar-map'
import { OfficialNoteScoringCore } from '../utils/official-note-scoring-core'

// モジュールスコープで事前構築（再マウントでも再計算しない）
// TODO: 将来的に useOfficialNotes.ts の topicToNotes と統合して重複を排除する
const scoringCore = new OfficialNoteScoringCore(QUESTION_EXEMPLAR_MAP)

const topicToNotes = new Map<string, OfficialNote[]>()
for (const note of OFFICIAL_NOTES) {
  const list = topicToNotes.get(note.topicId)
  if (list) list.push(note)
  else topicToNotes.set(note.topicId, [note])
}

/** questionに関連する公式付箋を上位limit件返す */
export function useScoredOfficialNotes(
  question: Question | undefined,
  limit = 5,
): { notes: OfficialNote[]; isLoading: boolean } {
  const notes = useMemo(() => {
    if (!question) return []
    const topicId = QUESTION_TOPIC_MAP[question.id]
    if (!topicId) return []
    const topicNotes = topicToNotes.get(topicId) ?? []
    return scoringCore.topNotes(topicNotes, question, limit)
  }, [question, limit])

  return { notes, isLoading: false }
}
