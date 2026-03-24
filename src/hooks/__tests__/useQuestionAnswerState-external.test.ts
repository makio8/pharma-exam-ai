/**
 * useQuestionAnswerState: 連問ロック動作のテスト
 *
 * 連問（LinkedQuestionViewer）では親が useAnswerHistory() を 1 回だけ呼び、
 * 子に externalHistory として注入する。
 * restoreExisting: true にすると restoreFromExisting() で既存回答を復元＆ロック。
 *
 * ここではロジック本体の AnswerStateManager を直接テストする。
 */
import { describe, it, expect } from 'vitest'
import { AnswerStateManager } from '../useQuestionAnswerState'
import type { Question, AnswerHistory } from '../../types/question'

function makeSingleQuestion(overrides?: Partial<Question>): Question {
  return {
    id: 'q-ext-1',
    year: 108,
    question_number: 195,
    section: '実践',
    subject: '実務',
    category: '薬物治療',
    question_text: '次のうち正しいのはどれか。1つ選べ。',
    choices: [
      { key: 1, text: '選択肢1' },
      { key: 2, text: '選択肢2' },
      { key: 3, text: '選択肢3' },
    ],
    correct_answer: 2,
    explanation: '解説',
    tags: [],
    ...overrides,
  }
}

function makeMultiQuestion(overrides?: Partial<Question>): Question {
  return {
    id: 'q-ext-2',
    year: 108,
    question_number: 196,
    section: '実践',
    subject: '実務',
    category: '薬物治療',
    question_text: '正しいのはどれか。2つ選べ。',
    choices: [
      { key: 1, text: '選択肢1' },
      { key: 2, text: '選択肢2' },
      { key: 3, text: '選択肢3' },
    ],
    correct_answer: [1, 3],
    explanation: '解説',
    tags: [],
    ...overrides,
  }
}

function makeExistingResult(overrides?: Partial<AnswerHistory>): AnswerHistory {
  return {
    id: 'ah-ext-1',
    user_id: 'test-user',
    question_id: 'q-ext-1',
    selected_answer: 2,
    is_correct: true,
    answered_at: '2026-03-24T10:00:00Z',
    time_spent_seconds: 12,
    ...overrides,
  }
}

describe('AnswerStateManager: 連問ロック動作', () => {
  it('restoreFromExisting 後は selectAnswer が無視される（操作ロック）', () => {
    const q = makeSingleQuestion()
    const mgr = new AnswerStateManager(q)
    const existing = makeExistingResult()

    mgr.restoreFromExisting(existing)
    mgr.selectAnswer(3) // ロック中なので無視される

    expect(mgr.selectedAnswer).toBe(2)  // 復元された値が維持
    expect(mgr.isAnswered).toBe(true)
    expect(mgr.canSubmit).toBe(false)   // 再送信不可
  })

  it('restoreFromExisting 後は selectMultiAnswers が無視される（複数選択ロック）', () => {
    const q = makeMultiQuestion()
    const mgr = new AnswerStateManager(q)
    const existing = makeExistingResult({
      question_id: 'q-ext-2',
      selected_answer: [1, 3],
      is_correct: true,
    })

    mgr.restoreFromExisting(existing)
    mgr.selectMultiAnswers([2, 3]) // ロック中なので無視される

    expect(mgr.selectedAnswers).toEqual([1, 3])  // 復元された値が維持
    expect(mgr.isAnswered).toBe(true)
  })

  it('スキップ結果の復元: isSkipped=true, selectedAnswer=null', () => {
    const q = makeSingleQuestion()
    const mgr = new AnswerStateManager(q)
    const existing = makeExistingResult({
      selected_answer: null,
      is_correct: false,
      skipped: true,
    })

    mgr.restoreFromExisting(existing)

    expect(mgr.isSkipped).toBe(true)
    expect(mgr.isCorrect).toBe(false)
    expect(mgr.selectedAnswer).toBeNull()
    expect(mgr.canSubmit).toBe(false)
  })

  it('不正解結果の復元: isCorrect=false, 選択肢が復元される', () => {
    const q = makeSingleQuestion()
    const mgr = new AnswerStateManager(q)
    const existing = makeExistingResult({
      selected_answer: 3,
      is_correct: false,
    })

    mgr.restoreFromExisting(existing)

    expect(mgr.isCorrect).toBe(false)
    expect(mgr.selectedAnswer).toBe(3)
    expect(mgr.isAnswered).toBe(true)
  })
})
