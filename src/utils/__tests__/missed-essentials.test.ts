// src/utils/__tests__/missed-essentials.test.ts
import { describe, it, expect } from 'vitest'
import { computeMissedEssentials } from '../missed-essentials'
import type { Question, AnswerHistory } from '../../types/question'

function makeQuestion(overrides: Partial<Question>): Question {
  return {
    id: 'q1',
    year: 111,
    question_number: 1,
    section: '必須',
    subject: '薬理',
    category: '薬物動態',
    question_text: 'テスト問題',
    choices: [{ key: 1, text: 'A' }, { key: 2, text: 'B' }],
    correct_answer: 1,
    explanation: '解説',
    tags: [],
    ...overrides,
  }
}

function makeHistory(overrides: Partial<AnswerHistory>): AnswerHistory {
  return {
    id: 'h1',
    user_id: 'u1',
    question_id: 'q1',
    selected_answer: 1,
    is_correct: true,
    answered_at: '2026-03-25T10:00:00Z',
    ...overrides,
  }
}

describe('computeMissedEssentials', () => {
  it('必須問題で最新回答が不正解の問題を返す', () => {
    const questions = [
      makeQuestion({ id: 'q1', section: '必須' }),
      makeQuestion({ id: 'q2', section: '必須' }),
    ]
    const history = [
      makeHistory({ id: 'h1', question_id: 'q1', is_correct: false, answered_at: '2026-03-25T10:00:00Z' }),
      makeHistory({ id: 'h2', question_id: 'q2', is_correct: true, answered_at: '2026-03-25T10:00:00Z' }),
    ]
    const result = computeMissedEssentials(history, questions)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('q1')
  })

  it('必須以外の問題は含めない', () => {
    const questions = [
      makeQuestion({ id: 'q1', section: '理論' }),
    ]
    const history = [
      makeHistory({ id: 'h1', question_id: 'q1', is_correct: false }),
    ]
    const result = computeMissedEssentials(history, questions)
    expect(result).toHaveLength(0)
  })

  it('同じ問題の複数回答: 最新回答で判定する', () => {
    const questions = [makeQuestion({ id: 'q1', section: '必須' })]
    const history = [
      makeHistory({ id: 'h1', question_id: 'q1', is_correct: false, answered_at: '2026-03-24T10:00:00Z' }),
      makeHistory({ id: 'h2', question_id: 'q1', is_correct: true, answered_at: '2026-03-25T10:00:00Z' }),
    ]
    const result = computeMissedEssentials(history, questions)
    expect(result).toHaveLength(0)
  })

  it('未回答の必須問題は含めない', () => {
    const questions = [makeQuestion({ id: 'q1', section: '必須' })]
    const result = computeMissedEssentials([], questions)
    expect(result).toHaveLength(0)
  })

  it('最大20件に制限される', () => {
    const questions = Array.from({ length: 25 }, (_, i) =>
      makeQuestion({ id: `q${i}`, section: '必須', question_number: i + 1 })
    )
    const history = questions.map((q, i) =>
      makeHistory({ id: `h${i}`, question_id: q.id, is_correct: false })
    )
    const result = computeMissedEssentials(history, questions)
    expect(result).toHaveLength(20)
  })

  it('問番号順でソートされる', () => {
    const questions = [
      makeQuestion({ id: 'q3', section: '必須', question_number: 30 }),
      makeQuestion({ id: 'q1', section: '必須', question_number: 10 }),
      makeQuestion({ id: 'q2', section: '必須', question_number: 20 }),
    ]
    const history = questions.map(q =>
      makeHistory({ id: `h-${q.id}`, question_id: q.id, is_correct: false })
    )
    const result = computeMissedEssentials(history, questions)
    expect(result.map(r => r.question_number)).toEqual([10, 20, 30])
  })

  it('incorrectCount は常に 1', () => {
    const questions = [makeQuestion({ id: 'q1', section: '必須' })]
    const history = [
      makeHistory({ id: 'h1', question_id: 'q1', is_correct: false }),
    ]
    const result = computeMissedEssentials(history, questions)
    expect(result[0].incorrectCount).toBe(1)
  })
})
