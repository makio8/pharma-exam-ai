/**
 * useSwipeNavigation
 *
 * スワイプジェスチャーによる問題間ナビゲーション。
 * 連問グループ（linked_group）は先頭にまとめてスキップする。
 *
 * テスト可能なロジックは SwipeNavigator クラスに分離し、
 * React フックはそのラッパーとして実装する。
 */
import { useRef } from 'react'
import type { TouchEventHandler } from 'react'
import { useNavigate } from 'react-router-dom'
import { ALL_QUESTIONS } from '../data/all-questions'
import type { Question } from '../types/question'

// ---------- SwipeNavigator クラス（テスト可能なピュアロジック） ----------

/** 最小限の問題情報（テスト用にも使える） */
type QuestionLike = Pick<Question, 'id' | 'year' | 'question_number'> & {
  linked_group?: string
}

/** スワイプ評価の結果 */
export type SwipeDirection = 'prev' | 'next' | 'none'

/** スワイプ閾値（px） */
const SWIPE_THRESHOLD = 50

export class SwipeNavigator {
  private readonly sessionIds: string[]
  private readonly questionMap: Map<string, QuestionLike>

  readonly prevId: string | null
  readonly nextId: string | null
  readonly currentIndex: number
  readonly totalCount: number
  readonly canGoPrev: boolean
  readonly canGoNext: boolean

  constructor(
    sessionIds: string[],
    currentId: string,
    questions: QuestionLike[],
  ) {
    this.sessionIds = sessionIds
    this.questionMap = new Map(questions.map((q) => [q.id, q]))
    this.totalCount = sessionIds.length

    const currentIdx = sessionIds.indexOf(currentId)
    this.currentIndex = currentIdx >= 0 ? currentIdx : 0

    const currentQ = this.questionMap.get(currentId)

    if (!currentQ || currentIdx < 0) {
      this.prevId = null
      this.nextId = null
      this.canGoPrev = false
      this.canGoNext = false
      return
    }

    // 現在問題の連問グループ境界を計算
    const { groupStart, groupEnd } = this.getGroupBoundaries(currentQ)

    // --- nextId: グループ終端より後の最初の問題 ---
    let nextId: string | null = null
    for (let i = currentIdx + 1; i < sessionIds.length; i++) {
      const q = this.questionMap.get(sessionIds[i])
      if (!q) continue
      // 同じ年度の場合は question_number が groupEnd より後の問題
      // または異なる年度の問題
      const isAfterGroup =
        q.year > currentQ.year ||
        (q.year === currentQ.year && q.question_number > groupEnd)
      if (isAfterGroup) {
        nextId = this.resolveGroupStartId(q.id)
        break
      }
    }

    // --- prevId: グループ開始より前の最後の問題 ---
    let prevId: string | null = null
    for (let i = currentIdx - 1; i >= 0; i--) {
      const q = this.questionMap.get(sessionIds[i])
      if (!q) continue
      const isBeforeGroup =
        q.year < currentQ.year ||
        (q.year === currentQ.year && q.question_number < groupStart)
      if (isBeforeGroup) {
        prevId = this.resolveGroupStartId(q.id)
        break
      }
    }

    this.nextId = nextId
    this.prevId = prevId
    this.canGoNext = nextId !== null
    this.canGoPrev = prevId !== null
  }

  /**
   * 連問グループの境界（start/end question_number）を返す。
   * linked_group がない場合は question_number 自身を返す。
   */
  private getGroupBoundaries(q: QuestionLike): {
    groupStart: number
    groupEnd: number
  } {
    if (!q.linked_group) {
      return { groupStart: q.question_number, groupEnd: q.question_number }
    }
    const match = q.linked_group.match(/^r(\d+)-(\d+)-(\d+)$/)
    if (!match) {
      return { groupStart: q.question_number, groupEnd: q.question_number }
    }
    return {
      groupStart: parseInt(match[2], 10),
      groupEnd: parseInt(match[3], 10),
    }
  }

  /**
   * 指定した questionId が連問グループに属する場合、
   * sessionIds 内でそのグループ先頭の questionId を返す。
   * 連問グループでない場合はそのまま返す。
   */
  resolveGroupStartId(questionId: string): string {
    const q = this.questionMap.get(questionId)
    if (!q || !q.linked_group) return questionId

    const match = q.linked_group.match(/^r(\d+)-(\d+)-(\d+)$/)
    if (!match) return questionId

    const year = parseInt(match[1], 10)
    const groupStart = parseInt(match[2], 10)

    // sessionIds 内でグループ先頭（year + question_number === groupStart）を探す
    for (const id of this.sessionIds) {
      const candidate = this.questionMap.get(id)
      if (
        candidate &&
        candidate.year === year &&
        candidate.question_number === groupStart
      ) {
        return id
      }
    }

    // セッション内に先頭がなければそのまま返す
    return questionId
  }

  /**
   * スワイプジェスチャーを評価する。
   * @param startX タッチ開始X座標
   * @param deltaX 移動量（正: 右スワイプ / 負: 左スワイプ）
   */
  evaluateSwipe(startX: number, deltaX: number): SwipeDirection {
    // startX は将来的な方向検証のために残す（現時点は未使用）
    void startX

    const abs = Math.abs(deltaX)
    if (abs < SWIPE_THRESHOLD) return 'none'

    if (deltaX < 0) {
      // 左スワイプ → 次の問題
      return this.canGoNext ? 'next' : 'none'
    } else {
      // 右スワイプ → 前の問題
      return this.canGoPrev ? 'prev' : 'none'
    }
  }
}

// ---------- useSwipeNavigation React フック ----------

export interface UseSwipeNavigationResult {
  onTouchStart: TouchEventHandler
  onTouchMove: TouchEventHandler
  onTouchEnd: TouchEventHandler
  prevId: string | null
  nextId: string | null
  canGoPrev: boolean
  canGoNext: boolean
  goPrev: () => void
  goNext: () => void
  currentIndex: number
  totalCount: number
}

export function useSwipeNavigation(
  sessionIds: string[],
  currentId: string,
): UseSwipeNavigationResult {
  const navigate = useNavigate()
  const touchStartXRef = useRef<number | null>(null)
  const touchCurrentXRef = useRef<number | null>(null)

  const navigator = new SwipeNavigator(sessionIds, currentId, ALL_QUESTIONS)

  const goPrev = () => {
    if (navigator.prevId) {
      navigate(`/practice/${navigator.prevId}`)
    }
  }

  const goNext = () => {
    if (navigator.nextId) {
      navigate(`/practice/${navigator.nextId}`)
    }
  }

  const onTouchStart: TouchEventHandler = (e) => {
    touchStartXRef.current = e.touches[0].clientX
    touchCurrentXRef.current = e.touches[0].clientX
  }

  const onTouchMove: TouchEventHandler = (e) => {
    touchCurrentXRef.current = e.touches[0].clientX
  }

  const onTouchEnd: TouchEventHandler = () => {
    const startX = touchStartXRef.current
    const currentX = touchCurrentXRef.current
    if (startX === null || currentX === null) return

    const deltaX = currentX - startX
    const direction = navigator.evaluateSwipe(startX, deltaX)

    if (direction === 'next') {
      goNext()
    } else if (direction === 'prev') {
      goPrev()
    }

    touchStartXRef.current = null
    touchCurrentXRef.current = null
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    prevId: navigator.prevId,
    nextId: navigator.nextId,
    canGoPrev: navigator.canGoPrev,
    canGoNext: navigator.canGoNext,
    goPrev,
    goNext,
    currentIndex: navigator.currentIndex,
    totalCount: navigator.totalCount,
  }
}
