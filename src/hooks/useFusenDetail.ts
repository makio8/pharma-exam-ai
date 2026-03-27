import { useMemo } from 'react'
import { OFFICIAL_NOTES } from '../data/official-notes'
import { EXAM_BLUEPRINT } from '../data/exam-blueprint'
import { QUESTION_TOPIC_MAP } from '../data/question-topic-map'
import { useBookmarks } from './useBookmarks'
import { useAnswerHistory } from './useAnswerHistory'
import type { OfficialNote } from '../types/official-note'

export interface RelatedQuestionItem {
  questionId: string
  displayLabel: string
  userStatus: 'correct' | 'incorrect' | 'unanswered'
  correctRate?: number
}

export interface FusenBreadcrumb {
  subject: string
  major: string
  middle: string
}

// NOTE: パフォーマンス制約 — 各呼び出しが独立して localStorage から履歴を読み込む。
// Day 1 では付箋23件のため許容範囲。付箋数が大幅に増えた場合は
// useFusenLibrary 側で一括ロードして渡す方式への変更を検討する。
export function useFusenDetail(fusenId: string): {
  fusen: OfficialNote | undefined
  relatedQuestions: RelatedQuestionItem[]
  breadcrumb: FusenBreadcrumb
  isBookmarked: boolean
  toggleBookmark: () => void
} {
  const { isBookmarked: checkBookmarked, toggleBookmark: toggle } = useBookmarks()
  const { getQuestionResult } = useAnswerHistory()

  const fusen = useMemo(
    () => OFFICIAL_NOTES.find(n => n.id === fusenId),
    [fusenId],
  )

  // topicId → questionId[] の逆引き（linkedQuestionIds は JSON から除外済み）
  const relatedQuestions = useMemo((): RelatedQuestionItem[] => {
    if (!fusen) return []
    const questionIds = Object.entries(QUESTION_TOPIC_MAP)
      .filter(([, topicId]) => topicId === fusen.topicId)
      .map(([qId]) => qId)

    return questionIds
      .map(qId => {
        const match = qId.match(/^r(\d+)-(\d+)$/)
        const displayLabel = match ? `${match[1]}回-問${parseInt(match[2], 10)}` : qId
        const result = getQuestionResult(qId)
        let userStatus: 'correct' | 'incorrect' | 'unanswered' = 'unanswered'
        if (result?.is_correct === true) userStatus = 'correct'
        else if (result?.is_correct === false) userStatus = 'incorrect'
        return { questionId: qId, displayLabel, userStatus }
      })
      .sort((a, b) => {
        const order = { unanswered: 0, incorrect: 1, correct: 2 }
        return order[a.userStatus] - order[b.userStatus]
      })
  }, [fusen, getQuestionResult])

  const breadcrumb = useMemo((): FusenBreadcrumb => {
    if (!fusen) return { subject: '', major: '', middle: '' }
    for (const subject of EXAM_BLUEPRINT) {
      for (const major of subject.majorCategories) {
        for (const middle of major.middleCategories) {
          if (middle.id === fusen.topicId) {
            return {
              subject: subject.subject,
              major: major.name,
              middle: middle.name,
            }
          }
        }
      }
    }
    return { subject: fusen.subject, major: '', middle: '' }
  }, [fusen])

  return {
    fusen,
    relatedQuestions,
    breadcrumb,
    isBookmarked: fusen ? checkBookmarked(fusen.id) : false,
    toggleBookmark: () => { if (fusen) toggle(fusen.id) },
  }
}
