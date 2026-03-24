/**
 * useQuestionAnswerState のロジック単体テスト
 *
 * @testing-library/react と jsdom が未導入のため、
 * フックが内部で使う AnswerStateManager クラスを直接テストする。
 * React 部分（useState / useEffect）は統合テストに委ねる。
 */
import { describe, it, expect } from 'vitest'
import { AnswerStateManager } from '../useQuestionAnswerState'
import type { Question, AnswerHistory } from '../../types/question'

// ---------- テスト用ヘルパー ----------

/** 単一選択問題（正解: 3） */
function makeSingleQuestion(overrides?: Partial<Question>): Question {
  return {
    id: 'q-single-1',
    year: 108,
    question_number: 1,
    section: '必須',
    subject: '薬理',
    category: '薬物動態',
    question_text: '次のうち正しいのはどれか。1つ選べ。',
    choices: [
      { key: 1, text: '選択肢1' },
      { key: 2, text: '選択肢2' },
      { key: 3, text: '選択肢3' },
      { key: 4, text: '選択肢4' },
      { key: 5, text: '選択肢5' },
    ],
    correct_answer: 3,
    explanation: '解説テキスト',
    tags: [],
    ...overrides,
  }
}

/** 複数選択問題（正解: [1, 3]、「2つ選べ」） */
function makeMultiQuestion(overrides?: Partial<Question>): Question {
  return {
    id: 'q-multi-1',
    year: 108,
    question_number: 2,
    section: '理論',
    subject: '化学',
    category: '有機化学',
    question_text: '正しいのはどれか。2つ選べ。',
    choices: [
      { key: 1, text: '選択肢1' },
      { key: 2, text: '選択肢2' },
      { key: 3, text: '選択肢3' },
      { key: 4, text: '選択肢4' },
      { key: 5, text: '選択肢5' },
    ],
    correct_answer: [1, 3],
    explanation: '解説テキスト',
    tags: [],
    ...overrides,
  }
}

/** AnswerHistory のモック生成 */
function makeExistingResult(overrides?: Partial<AnswerHistory>): AnswerHistory {
  return {
    id: 'ah-1',
    user_id: 'test-user',
    question_id: 'q-single-1',
    selected_answer: 3,
    is_correct: true,
    answered_at: '2026-03-20T10:00:00Z',
    time_spent_seconds: 15,
    ...overrides,
  }
}

// ---------- AnswerStateManager: 初期状態 ----------

describe('AnswerStateManager: 初期状態', () => {
  it('初期状態: isAnswered=false, selectedAnswer=null, canSubmit=false', () => {
    const q = makeSingleQuestion()
    const mgr = new AnswerStateManager(q)

    expect(mgr.isAnswered).toBe(false)
    expect(mgr.selectedAnswer).toBeNull()
    expect(mgr.selectedAnswers).toEqual([])
    expect(mgr.canSubmit).toBe(false)
    expect(mgr.isCorrect).toBe(false)
    expect(mgr.isSkipped).toBe(false)
  })

  it('単一選択問題: isMulti=false, requiredCount=1', () => {
    const q = makeSingleQuestion()
    const mgr = new AnswerStateManager(q)

    expect(mgr.isMulti).toBe(false)
    expect(mgr.requiredCount).toBe(1)
  })

  it('複数選択問題: isMulti=true, requiredCount=2', () => {
    const q = makeMultiQuestion()
    const mgr = new AnswerStateManager(q)

    expect(mgr.isMulti).toBe(true)
    expect(mgr.requiredCount).toBe(2)
  })
})

// ---------- AnswerStateManager: 単一選択 ----------

describe('AnswerStateManager: 単一選択', () => {
  it('selectAnswer(3) → selectedAnswer=3, canSubmit=true', () => {
    const q = makeSingleQuestion()
    const mgr = new AnswerStateManager(q)

    mgr.selectAnswer(3)
    expect(mgr.selectedAnswer).toBe(3)
    expect(mgr.canSubmit).toBe(true)
  })

  it('selectAnswer を 2 回呼ぶと最後の選択が残る', () => {
    const q = makeSingleQuestion()
    const mgr = new AnswerStateManager(q)

    mgr.selectAnswer(1)
    mgr.selectAnswer(4)
    expect(mgr.selectedAnswer).toBe(4)
  })

  it('submitAnswer: 正解の場合 isCorrect=true', () => {
    const q = makeSingleQuestion({ correct_answer: 3 })
    const mgr = new AnswerStateManager(q)

    mgr.selectAnswer(3)
    const result = mgr.submitAnswer(10)

    expect(mgr.isAnswered).toBe(true)
    expect(mgr.isCorrect).toBe(true)
    expect(result.is_correct).toBe(true)
    expect(result.selected_answer).toBe(3)
    expect(result.time_spent_seconds).toBe(10)
  })

  it('submitAnswer: 不正解の場合 isCorrect=false', () => {
    const q = makeSingleQuestion({ correct_answer: 3 })
    const mgr = new AnswerStateManager(q)

    mgr.selectAnswer(1)
    const result = mgr.submitAnswer(5)

    expect(mgr.isAnswered).toBe(true)
    expect(mgr.isCorrect).toBe(false)
    expect(result.is_correct).toBe(false)
    expect(result.selected_answer).toBe(1)
    expect(result.time_spent_seconds).toBe(5)
  })

  it('submitAnswer: 未選択のまま送信すると例外', () => {
    const q = makeSingleQuestion()
    const mgr = new AnswerStateManager(q)

    expect(() => mgr.submitAnswer(5)).toThrow()
  })

  it('submitAnswer 後は selectAnswer が無視される', () => {
    const q = makeSingleQuestion()
    const mgr = new AnswerStateManager(q)

    mgr.selectAnswer(3)
    mgr.submitAnswer(10)
    mgr.selectAnswer(1) // 回答済みなので無視される

    expect(mgr.selectedAnswer).toBe(3)
  })
})

// ---------- AnswerStateManager: 複数選択 ----------

describe('AnswerStateManager: 複数選択', () => {
  it('selectMultiAnswers([1,3]) → selectedAnswers=[1,3]', () => {
    const q = makeMultiQuestion()
    const mgr = new AnswerStateManager(q)

    mgr.selectMultiAnswers([1, 3])
    expect(mgr.selectedAnswers).toEqual([1, 3])
  })

  it('requiredCount と選択数が合えば canSubmit=true', () => {
    const q = makeMultiQuestion() // requiredCount=2
    const mgr = new AnswerStateManager(q)

    mgr.selectMultiAnswers([1]) // 1 つだけ → canSubmit=false
    expect(mgr.canSubmit).toBe(false)

    mgr.selectMultiAnswers([1, 3]) // 2 つ → canSubmit=true
    expect(mgr.canSubmit).toBe(true)
  })

  it('submitAnswer: 複数選択の正解判定', () => {
    const q = makeMultiQuestion({ correct_answer: [1, 3] })
    const mgr = new AnswerStateManager(q)

    mgr.selectMultiAnswers([1, 3])
    const result = mgr.submitAnswer(20)

    expect(mgr.isCorrect).toBe(true)
    expect(result.is_correct).toBe(true)
    expect(result.selected_answer).toEqual([1, 3])
    expect(result.time_spent_seconds).toBe(20)
  })

  it('submitAnswer: 複数選択の不正解判定', () => {
    const q = makeMultiQuestion({ correct_answer: [1, 3] })
    const mgr = new AnswerStateManager(q)

    mgr.selectMultiAnswers([1, 2])
    const result = mgr.submitAnswer(15)

    expect(mgr.isCorrect).toBe(false)
    expect(result.is_correct).toBe(false)
  })
})

// ---------- AnswerStateManager: スキップ ----------

describe('AnswerStateManager: スキップ', () => {
  it('skipQuestion → isAnswered=true, isSkipped=true, isCorrect=false', () => {
    const q = makeSingleQuestion()
    const mgr = new AnswerStateManager(q)

    mgr.skipQuestion(8)

    expect(mgr.isAnswered).toBe(true)
    expect(mgr.isSkipped).toBe(true)
    expect(mgr.isCorrect).toBe(false)
  })

  it('skipQuestion: saveAnswer に time_spent_seconds + skipped:true を含む', () => {
    const q = makeSingleQuestion()
    const mgr = new AnswerStateManager(q)

    const result = mgr.skipQuestion(8)

    expect(result.time_spent_seconds).toBe(8)
    expect(result.skipped).toBe(true)
    expect(result.selected_answer).toBeNull()
    expect(result.is_correct).toBe(false)
  })

  it('skipQuestion: 選択していてもスキップ可能（選択は破棄される）', () => {
    const q = makeSingleQuestion()
    const mgr = new AnswerStateManager(q)

    mgr.selectAnswer(3)
    const result = mgr.skipQuestion(12)

    expect(mgr.isSkipped).toBe(true)
    expect(result.selected_answer).toBeNull()
  })
})

// ---------- AnswerStateManager: 既存結果の復元 ----------

describe('AnswerStateManager: 既存結果の復元', () => {
  it('existingResult が設定されると isAnswered=true になる', () => {
    const q = makeSingleQuestion()
    const mgr = new AnswerStateManager(q)

    const existing = makeExistingResult({
      question_id: q.id,
      selected_answer: 3,
      is_correct: true,
    })

    mgr.restoreFromExisting(existing)

    expect(mgr.isAnswered).toBe(true)
    expect(mgr.isCorrect).toBe(true)
    expect(mgr.selectedAnswer).toBe(3)
    expect(mgr.existingResult).toBe(existing)
  })

  it('existingResult がスキップ結果の場合', () => {
    const q = makeSingleQuestion()
    const mgr = new AnswerStateManager(q)

    const existing = makeExistingResult({
      question_id: q.id,
      selected_answer: null,
      is_correct: false,
      skipped: true,
    })

    mgr.restoreFromExisting(existing)

    expect(mgr.isAnswered).toBe(true)
    expect(mgr.isSkipped).toBe(true)
    expect(mgr.isCorrect).toBe(false)
    expect(mgr.selectedAnswer).toBeNull()
  })

  it('existingResult が複数選択の場合', () => {
    const q = makeMultiQuestion()
    const mgr = new AnswerStateManager(q)

    const existing = makeExistingResult({
      question_id: q.id,
      selected_answer: [1, 3],
      is_correct: true,
    })

    mgr.restoreFromExisting(existing)

    expect(mgr.isAnswered).toBe(true)
    expect(mgr.selectedAnswers).toEqual([1, 3])
  })
})
