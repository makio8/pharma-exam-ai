// 単元（中項目）別マスター判定フック
// localStorageの回答履歴から各トピックの習熟度を算出する

import { useMemo } from 'react'
import type { AnswerHistory, QuestionSubject } from '../types/question'
import type { TopicId, TopicMastery } from '../types/blueprint'
import { ALL_TOPICS } from '../data/exam-blueprint'
import { QUESTION_TOPIC_MAP } from '../data/question-topic-map'

/** localStorage からJSON配列を安全に読み込む（useAnalytics.ts と同じパターン） */
function loadFromStorage<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

/** 科目別サマリー */
export interface SubjectMasterySummary {
  mastered: number
  almost: number
  learning: number
  notStarted: number
  total: number
}

export interface UseTopicMasteryReturn {
  /** 全トピックのマスター情報 */
  allTopics: TopicMastery[]
  /** 科目別にグループ化したマスター情報 */
  topicsBySubject: Record<QuestionSubject, TopicMastery[]>
  /** マスター済みトピック数 */
  masteredCount: number
  /** 全トピック数 */
  totalTopics: number
  /** トピックIDからマスター情報を取得 */
  getTopicMastery: (topicId: TopicId) => TopicMastery | undefined
  /** 科目別のサマリーを取得 */
  getSubjectSummary: (subject: QuestionSubject) => SubjectMasterySummary
}

/**
 * マスター判定ロジック:
 * - mastered:    3問以上回答 かつ 正答率80%以上
 * - almost:      3問以上回答 かつ 正答率60%以上
 * - learning:    1問以上回答（上記条件を満たさない）
 * - not_started: 未回答
 */
function determineMasteryStatus(
  answeredCount: number,
  correctRate: number,
): TopicMastery['status'] {
  if (answeredCount === 0) return 'not_started'
  if (answeredCount >= 3 && correctRate >= 0.8) return 'mastered'
  if (answeredCount >= 3 && correctRate >= 0.6) return 'almost'
  return 'learning'
}

export function useTopicMastery(): UseTopicMasteryReturn {
  return useMemo(() => {
    const allHistory = loadFromStorage<AnswerHistory>('answer_history')

    // --- 同じ問題を複数回回答した場合、最新の回答のみ使用 ---
    const latestByQuestion = new Map<string, AnswerHistory>()
    for (const h of allHistory) {
      const existing = latestByQuestion.get(h.question_id)
      if (!existing || new Date(h.answered_at) > new Date(existing.answered_at)) {
        latestByQuestion.set(h.question_id, h)
      }
    }

    // --- トピックIDごとに問題IDをグループ化 ---
    const questionsByTopic = new Map<TopicId, string[]>()
    for (const [questionId, topicId] of Object.entries(QUESTION_TOPIC_MAP)) {
      const list = questionsByTopic.get(topicId)
      if (list) {
        list.push(questionId)
      } else {
        questionsByTopic.set(topicId, [questionId])
      }
    }

    // --- 各トピックのマスター情報を算出 ---
    const allTopicMasteries: TopicMastery[] = ALL_TOPICS.map((topic) => {
      const questionIds = questionsByTopic.get(topic.id) ?? []
      const totalQuestions = questionIds.length

      // このトピックで回答済みの問題（最新回答のみ）
      let answeredQuestions = 0
      let correctCount = 0
      for (const qId of questionIds) {
        const answer = latestByQuestion.get(qId)
        if (answer) {
          answeredQuestions++
          if (answer.is_correct) correctCount++
        }
      }

      const correctRate = answeredQuestions > 0 ? correctCount / answeredQuestions : 0
      const status = determineMasteryStatus(answeredQuestions, correctRate)

      return {
        topicId: topic.id,
        subject: topic.subject,
        majorCategory: topic.major,
        middleCategory: topic.middle,
        status,
        totalQuestions,
        answeredQuestions,
        correctRate,
      }
    })

    // --- 科目別グループ化 ---
    const topicsBySubject = {} as Record<QuestionSubject, TopicMastery[]>
    const allSubjects: QuestionSubject[] = [
      '物理', '化学', '生物', '衛生', '薬理', '薬剤', '病態・薬物治療', '法規・制度・倫理', '実務',
    ]
    for (const s of allSubjects) {
      topicsBySubject[s] = []
    }
    for (const tm of allTopicMasteries) {
      topicsBySubject[tm.subject]?.push(tm)
    }

    // --- マスター済みカウント ---
    const masteredCount = allTopicMasteries.filter((t) => t.status === 'mastered').length

    // --- ルックアップマップ ---
    const masteryMap = new Map<TopicId, TopicMastery>()
    for (const tm of allTopicMasteries) {
      masteryMap.set(tm.topicId, tm)
    }

    const getTopicMastery = (topicId: TopicId): TopicMastery | undefined => {
      return masteryMap.get(topicId)
    }

    const getSubjectSummary = (subject: QuestionSubject): SubjectMasterySummary => {
      const topics = topicsBySubject[subject] ?? []
      return {
        mastered: topics.filter((t) => t.status === 'mastered').length,
        almost: topics.filter((t) => t.status === 'almost').length,
        learning: topics.filter((t) => t.status === 'learning').length,
        notStarted: topics.filter((t) => t.status === 'not_started').length,
        total: topics.length,
      }
    }

    return {
      allTopics: allTopicMasteries,
      topicsBySubject,
      masteredCount,
      totalTopics: allTopicMasteries.length,
      getTopicMastery,
      getSubjectSummary,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // ページマウント時に1回だけ計算（localStorageはページ遷移で更新される）
}
