/**
 * useQuestionAnswerState — 回答ロジック凝集フック
 *
 * 選択・送信・スキップの状態管理を 1 箇所にまとめる。
 * ロジック本体は AnswerStateManager クラスに抽出し、
 * 単体テスト可能にしている（@testing-library/react 不要）。
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import type { Question, AnswerHistory } from '../types/question'
import { useAnswerHistory } from './useAnswerHistory'
import {
  isMultiAnswer,
  isCorrectAnswer,
  getRequiredSelections,
} from '../utils/question-helpers'

// ---------------------------------------------------------------------------
// Pure logic — exported for unit testing
// ---------------------------------------------------------------------------

/** submitAnswer / skipQuestion の戻り値（saveAnswer に渡すペイロード） */
export type AnswerPayload = Omit<AnswerHistory, 'id'>

/**
 * 回答状態を管理する純粋クラス。
 * React 層は状態変更のたびに re-render をトリガーするだけ。
 */
export class AnswerStateManager {
  // --- 読み取り専用プロパティ ---
  readonly isMulti: boolean
  readonly requiredCount: number

  // --- 変更可能な状態 ---
  selectedAnswer: number | null = null
  selectedAnswers: number[] = []
  isAnswered = false
  isCorrect = false
  isSkipped = false
  existingResult: AnswerHistory | undefined = undefined

  private readonly question: Question

  constructor(question: Question) {
    this.question = question
    this.isMulti = isMultiAnswer(question)
    this.requiredCount = getRequiredSelections(
      question.question_text,
      question.correct_answer,
    )
  }

  /** 送信可能か（単一: 選択済み、複数: requiredCount に到達） */
  get canSubmit(): boolean {
    if (this.isAnswered) return false
    if (this.isMulti) {
      return this.selectedAnswers.length === this.requiredCount
    }
    return this.selectedAnswer !== null
  }

  // --- 操作 ---

  /** 単一選択肢を選択 */
  selectAnswer(key: number): void {
    if (this.isAnswered) return
    this.selectedAnswer = key
  }

  /** 複数選択肢を設定 */
  selectMultiAnswers(keys: number[]): void {
    if (this.isAnswered) return
    this.selectedAnswers = [...keys]
  }

  /**
   * 回答を送信し、saveAnswer に渡すペイロードを返す。
   * @param elapsedSeconds 経過時間（秒）
   */
  submitAnswer(elapsedSeconds: number): AnswerPayload {
    const selected = this.isMulti ? this.selectedAnswers : this.selectedAnswer
    if (selected === null || (Array.isArray(selected) && selected.length === 0)) {
      throw new Error('Cannot submit without a selection')
    }

    const correct = isCorrectAnswer(this.question.correct_answer, selected as number | number[])
    this.isAnswered = true
    this.isCorrect = correct

    return {
      user_id: '',  // フック側で補完
      question_id: this.question.id,
      selected_answer: selected,
      is_correct: correct,
      answered_at: new Date().toISOString(),
      time_spent_seconds: elapsedSeconds,
    }
  }

  /**
   * スキップし、saveAnswer に渡すペイロードを返す。
   * @param elapsedSeconds 経過時間（秒）
   */
  skipQuestion(elapsedSeconds: number): AnswerPayload {
    this.isAnswered = true
    this.isSkipped = true
    this.isCorrect = false

    return {
      user_id: '',
      question_id: this.question.id,
      selected_answer: null,
      is_correct: false,
      answered_at: new Date().toISOString(),
      time_spent_seconds: elapsedSeconds,
      skipped: true,
    }
  }

  /** 既存の回答結果から状態を復元する */
  restoreFromExisting(result: AnswerHistory): void {
    this.existingResult = result
    this.isAnswered = true
    this.isCorrect = result.is_correct
    this.isSkipped = result.skipped ?? false

    if (result.selected_answer === null) {
      this.selectedAnswer = null
      this.selectedAnswers = []
    } else if (Array.isArray(result.selected_answer)) {
      this.selectedAnswers = [...result.selected_answer]
      this.selectedAnswer = null
    } else {
      this.selectedAnswer = result.selected_answer
      this.selectedAnswers = []
    }
  }
}

// ---------------------------------------------------------------------------
// React フック
// ---------------------------------------------------------------------------

export interface UseQuestionAnswerStateResult {
  // 状態
  selectedAnswer: number | null
  selectedAnswers: number[]
  isAnswered: boolean
  isCorrect: boolean
  isSkipped: boolean
  existingResult: AnswerHistory | undefined

  // 操作
  selectAnswer: (key: number) => void
  selectMultiAnswers: (keys: number[]) => void
  submitAnswer: (elapsedSeconds: number) => void
  skipQuestion: (elapsedSeconds: number) => void

  // 判定
  canSubmit: boolean
  isMulti: boolean
  requiredCount: number
}

/**
 * 回答選択・送信・スキップのロジックを凝集するフック。
 *
 * - useAnswerHistory() から既存結果を取得して復元
 * - submitAnswer / skipQuestion で saveAnswer に time_spent_seconds を渡す
 */
export function useQuestionAnswerState(question: Question): UseQuestionAnswerStateResult {
  const { getQuestionResult, saveAnswer, history } = useAnswerHistory()
  const mgrRef = useRef<AnswerStateManager>(new AnswerStateManager(question))

  // question が変わったらマネージャーを再生成
  // （re-render をトリガーするために version カウンタを使用）
  const [, forceUpdate] = useState(0)
  const triggerUpdate = useCallback(() => forceUpdate((v) => v + 1), [])

  // question が変わったらリセット
  useEffect(() => {
    mgrRef.current = new AnswerStateManager(question)
    triggerUpdate()
  }, [question.id, triggerUpdate])

  // history ロード完了後に既存結果を同期
  useEffect(() => {
    const mgr = mgrRef.current
    if (mgr.isAnswered) return // 既に回答済みなら何もしない

    const existing = getQuestionResult(question.id)
    if (existing) {
      mgr.restoreFromExisting(existing)
      triggerUpdate()
    }
  }, [question.id, history, getQuestionResult, triggerUpdate])

  const mgr = mgrRef.current

  const selectAnswer = useCallback(
    (key: number) => {
      mgr.selectAnswer(key)
      triggerUpdate()
    },
    [mgr, triggerUpdate],
  )

  const selectMultiAnswers = useCallback(
    (keys: number[]) => {
      mgr.selectMultiAnswers(keys)
      triggerUpdate()
    },
    [mgr, triggerUpdate],
  )

  const handleSubmitAnswer = useCallback(
    (elapsedSeconds: number) => {
      const payload = mgr.submitAnswer(elapsedSeconds)
      saveAnswer(payload)
      triggerUpdate()
    },
    [mgr, saveAnswer, triggerUpdate],
  )

  const handleSkipQuestion = useCallback(
    (elapsedSeconds: number) => {
      const payload = mgr.skipQuestion(elapsedSeconds)
      saveAnswer(payload)
      triggerUpdate()
    },
    [mgr, saveAnswer, triggerUpdate],
  )

  return {
    selectedAnswer: mgr.selectedAnswer,
    selectedAnswers: mgr.selectedAnswers,
    isAnswered: mgr.isAnswered,
    isCorrect: mgr.isCorrect,
    isSkipped: mgr.isSkipped,
    existingResult: mgr.existingResult,

    selectAnswer,
    selectMultiAnswers,
    submitAnswer: handleSubmitAnswer,
    skipQuestion: handleSkipQuestion,

    canSubmit: mgr.canSubmit,
    isMulti: mgr.isMulti,
    requiredCount: mgr.requiredCount,
  }
}
