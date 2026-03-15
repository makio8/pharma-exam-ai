// 分析データフック: localStorageから回答履歴・付箋を集計する
import { useMemo } from 'react'
import type {
  AnswerHistory,
  Question,
  QuestionSubject,
  SubjectAccuracy,
} from '../types/question'
import type { NoteType, StickyNote } from '../types/note'
import { DUMMY_QUESTIONS } from '../data/dummy-questions'

/** 全科目リスト */
const ALL_SUBJECTS: QuestionSubject[] = [
  '物理',
  '化学',
  '生物',
  '薬理',
  '薬剤',
  '病態・薬物治療',
  '法規・制度・倫理',
  '実務',
]

/** 全NoteTypeリスト */
const ALL_NOTE_TYPES: NoteType[] = [
  'knowledge',
  'solution',
  'mnemonic',
  'caution',
  'related',
  'intuition',
]

/** localStorage からJSON配列を安全に読み込む */
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

/** 今日（YYYY-MM-DD）かどうか判定 */
function isToday(isoString: string): boolean {
  const d = new Date(isoString)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

/** 過去N日以内かどうか */
function isWithinDays(isoString: string, days: number): boolean {
  const d = new Date(isoString)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  cutoff.setHours(0, 0, 0, 0)
  return d >= cutoff
}

/** 曜日ラベル（過去7日間） */
function getWeeklyLabels(): string[] {
  const labels: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dayNames = ['日', '月', '火', '水', '木', '金', '土']
    labels.push(dayNames[d.getDay()])
  }
  return labels
}

/** 過去7日間の日付文字列（YYYY-MM-DD） */
function getWeeklyDateKeys(): string[] {
  const keys: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    keys.push(d.toISOString().slice(0, 10))
  }
  return keys
}

export interface TodayStats {
  answered: number
  correct: number
  accuracy: number
}

export interface WeeklyData {
  labels: string[]
  counts: number[]
  maxCount: number
}

export interface NoteStats {
  total: number
  byType: Record<NoteType, number>
}

export interface UseAnalyticsReturn {
  /** 科目別正答率 */
  subjectAccuracies: SubjectAccuracy[]
  /** 苦手問題リスト（2回以上不正解） */
  weakQuestions: (Question & { incorrectCount: number })[]
  /** 今日の統計 */
  todayStats: TodayStats
  /** 直近20件の回答履歴 */
  recentHistory: AnswerHistory[]
  /** 総回答数 */
  totalAnswered: number
  /** 総問題数 */
  totalQuestions: number
  /** 付箋統計 */
  noteStats: NoteStats
  /** 今週の回答数（過去7日間） */
  weeklyData: WeeklyData
  /** おすすめ問題（未回答・苦手から3問） */
  recommendedQuestions: Question[]
  /** 最新の付箋3件 */
  recentNotes: StickyNote[]
  /** データが空か（初回起動判定用） */
  isEmpty: boolean
}

export function useAnalytics(): UseAnalyticsReturn {
  // useMemo内でloadしてdepsを安定させる（毎レンダーで新配列が作られるのを防ぐ）
  return useMemo(() => {
    const allHistory = loadFromStorage<AnswerHistory>('answer_history')
    const allNotes = loadFromStorage<StickyNote>('sticky_notes')
    // --- 今日の統計 ---
    const todayHistory = allHistory.filter((h) => isToday(h.answered_at))
    const todayCorrect = todayHistory.filter((h) => h.is_correct).length
    const todayStats: TodayStats = {
      answered: todayHistory.length,
      correct: todayCorrect,
      accuracy: todayHistory.length > 0 ? todayCorrect / todayHistory.length : 0,
    }

    // --- 科目別正答率 ---
    const subjectMap = new Map<
      QuestionSubject,
      { total: number; correct: number }
    >()
    for (const s of ALL_SUBJECTS) {
      subjectMap.set(s, { total: 0, correct: 0 })
    }
    // question_id → subject のルックアップ
    const questionMap = new Map<string, Question>()
    for (const q of DUMMY_QUESTIONS) {
      questionMap.set(q.id, q)
    }
    for (const h of allHistory) {
      const q = questionMap.get(h.question_id)
      if (!q) continue
      const entry = subjectMap.get(q.subject)
      if (!entry) continue
      entry.total++
      if (h.is_correct) entry.correct++
    }
    const subjectAccuracies: SubjectAccuracy[] = ALL_SUBJECTS.map((s) => {
      const entry = subjectMap.get(s)!
      return {
        subject: s,
        total: entry.total,
        correct: entry.correct,
        accuracy: entry.total > 0 ? entry.correct / entry.total : 0,
      }
    })

    // --- 苦手問題リスト ---
    const incorrectCountMap = new Map<string, number>()
    for (const h of allHistory) {
      if (!h.is_correct) {
        incorrectCountMap.set(
          h.question_id,
          (incorrectCountMap.get(h.question_id) ?? 0) + 1
        )
      }
    }
    const weakQuestions = Array.from(incorrectCountMap.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([qId, count]) => {
        const q = questionMap.get(qId)
        return q ? { ...q, incorrectCount: count } : null
      })
      .filter((q): q is Question & { incorrectCount: number } => q !== null)

    // --- 直近20件 ---
    const recentHistory = [...allHistory]
      .sort(
        (a, b) =>
          new Date(b.answered_at).getTime() - new Date(a.answered_at).getTime()
      )
      .slice(0, 20)

    // --- 今週の回答数 ---
    const weekHistory = allHistory.filter((h) =>
      isWithinDays(h.answered_at, 7)
    )
    const dateKeys = getWeeklyDateKeys()
    const labels = getWeeklyLabels()
    const dayCounts = dateKeys.map((dk) => {
      return weekHistory.filter(
        (h) => h.answered_at.slice(0, 10) === dk
      ).length
    })
    const weeklyData: WeeklyData = {
      labels,
      counts: dayCounts,
      maxCount: Math.max(...dayCounts, 1),
    }

    // --- 付箋統計 ---
    const byType: Record<NoteType, number> = {} as Record<NoteType, number>
    for (const t of ALL_NOTE_TYPES) {
      byType[t] = 0
    }
    for (const n of allNotes) {
      if (n.note_type in byType) {
        byType[n.note_type]++
      }
    }
    const noteStats: NoteStats = {
      total: allNotes.length,
      byType,
    }

    // --- おすすめ問題（未回答 + 苦手から3問ピックアップ） ---
    const answeredIds = new Set(allHistory.map((h) => h.question_id))
    const unanswered = DUMMY_QUESTIONS.filter((q) => !answeredIds.has(q.id))
    // 苦手問題（不正解があるもの）を優先
    const weakIds = new Set(incorrectCountMap.keys())
    const weakForRecommend = DUMMY_QUESTIONS.filter(
      (q) => weakIds.has(q.id)
    ).sort(
      (a, b) =>
        (incorrectCountMap.get(b.id) ?? 0) -
        (incorrectCountMap.get(a.id) ?? 0)
    )
    const recommended: Question[] = []
    // 苦手問題を先に追加
    for (const q of weakForRecommend) {
      if (recommended.length >= 3) break
      recommended.push(q)
    }
    // 不足分は未回答からランダム
    if (recommended.length < 3) {
      const shuffled = [...unanswered].sort(() => Math.random() - 0.5)
      for (const q of shuffled) {
        if (recommended.length >= 3) break
        if (!recommended.find((r) => r.id === q.id)) {
          recommended.push(q)
        }
      }
    }
    // それでも足りなければダミーからランダム
    if (recommended.length < 3) {
      const shuffled = [...DUMMY_QUESTIONS].sort(() => Math.random() - 0.5)
      for (const q of shuffled) {
        if (recommended.length >= 3) break
        if (!recommended.find((r) => r.id === q.id)) {
          recommended.push(q)
        }
      }
    }

    // --- 最新付箋3件 ---
    const recentNotes = [...allNotes]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 3)

    const isEmpty = allHistory.length === 0 && allNotes.length === 0

    return {
      subjectAccuracies,
      weakQuestions,
      todayStats,
      recentHistory,
      totalAnswered: allHistory.length,
      totalQuestions: DUMMY_QUESTIONS.length,
      noteStats,
      weeklyData,
      recommendedQuestions: recommended,
      recentNotes,
      isEmpty,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // ページマウント時に1回だけ計算（localStorageはページ遷移で更新される）
}
