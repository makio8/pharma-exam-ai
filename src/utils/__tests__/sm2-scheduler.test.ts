// src/utils/__tests__/sm2-scheduler.test.ts
import { describe, it, expect } from 'vitest'
import { SM2Scheduler } from '../sm2-scheduler'
import type { CardProgress } from '../../types/card-progress'

/** テスト用ヘルパー: デフォルト進捗を生成 */
function makeProgress(overrides: Partial<CardProgress> = {}): CardProgress {
  return {
    template_id: 'fct-test',
    user_id: 'local',
    ease_factor: 2.5,
    interval_days: 1,
    next_review_at: '2026-03-26T00:00:00.000Z',
    review_count: 3,
    correct_streak: 2,
    last_reviewed_at: '2026-03-25T00:00:00.000Z',
    ...overrides,
  }
}

const NOW = new Date('2026-03-26T12:00:00.000Z').getTime()

describe('SM2Scheduler', () => {
  describe('calculate', () => {
    it('again: interval=1, ease-0.2, streak=0', () => {
      const progress = makeProgress({ ease_factor: 2.5, interval_days: 10, correct_streak: 3 })
      const result = SM2Scheduler.calculate(progress, 'again', NOW)
      expect(result.interval_days).toBe(1)
      expect(result.ease_factor).toBeCloseTo(2.3)
      expect(result.correct_streak).toBe(0)
      expect(result.review_count).toBe(4)
    })

    it('again: ease_factor の下限は 1.3', () => {
      const progress = makeProgress({ ease_factor: 1.4 })
      const result = SM2Scheduler.calculate(progress, 'again', NOW)
      expect(result.ease_factor).toBeCloseTo(1.3)
    })

    it('hard: interval×1.2, ease-0.15, streak=0', () => {
      const progress = makeProgress({ interval_days: 10, ease_factor: 2.5, correct_streak: 2 })
      const result = SM2Scheduler.calculate(progress, 'hard', NOW)
      expect(result.interval_days).toBe(12)
      expect(result.ease_factor).toBeCloseTo(2.35)
      expect(result.correct_streak).toBe(0)
    })

    it('hard: interval 最小値は 1', () => {
      const progress = makeProgress({ interval_days: 0 })
      const result = SM2Scheduler.calculate(progress, 'hard', NOW)
      expect(result.interval_days).toBe(1)
    })

    it('good (streak=0): interval=1', () => {
      const progress = makeProgress({ correct_streak: 0, interval_days: 5, ease_factor: 2.5 })
      const result = SM2Scheduler.calculate(progress, 'good', NOW)
      expect(result.interval_days).toBe(1)
      expect(result.correct_streak).toBe(1)
      expect(result.ease_factor).toBeCloseTo(2.5)
    })

    it('good (streak>0): interval×ease_factor', () => {
      const progress = makeProgress({ correct_streak: 2, interval_days: 5, ease_factor: 2.5 })
      const result = SM2Scheduler.calculate(progress, 'good', NOW)
      expect(result.interval_days).toBe(13)
      expect(result.correct_streak).toBe(3)
    })

    it('easy: interval×ease×1.3, ease+0.15', () => {
      const progress = makeProgress({ interval_days: 5, ease_factor: 2.5, correct_streak: 1 })
      const result = SM2Scheduler.calculate(progress, 'easy', NOW)
      expect(result.interval_days).toBe(16)
      expect(result.ease_factor).toBeCloseTo(2.65)
      expect(result.correct_streak).toBe(2)
    })

    it('next_review_at は now + interval_days 日後', () => {
      const progress = makeProgress({ interval_days: 1 })
      const result = SM2Scheduler.calculate(progress, 'good', NOW)
      const expected = new Date(NOW + result.interval_days * 86400000).toISOString()
      expect(result.next_review_at).toBe(expected)
    })

    it('review_count は +1 される', () => {
      const progress = makeProgress({ review_count: 0 })
      const result = SM2Scheduler.calculate(progress, 'good', NOW)
      expect(result.review_count).toBe(1)
    })
  })

  describe('createInitialProgress', () => {
    it('デフォルト値で進捗を生成', () => {
      const progress = SM2Scheduler.createInitialProgress('fct-001', 'local', NOW)
      expect(progress.template_id).toBe('fct-001')
      expect(progress.user_id).toBe('local')
      expect(progress.ease_factor).toBe(2.5)
      expect(progress.interval_days).toBe(0)
      expect(progress.review_count).toBe(0)
      expect(progress.correct_streak).toBe(0)
      expect(progress.last_reviewed_at).toBe('')
    })

    it('next_review_at は now（即復習可能）', () => {
      const progress = SM2Scheduler.createInitialProgress('fct-001', 'local', NOW)
      expect(progress.next_review_at).toBe(new Date(NOW).toISOString())
    })

    it('user_id 省略時は "local"', () => {
      const progress = SM2Scheduler.createInitialProgress('fct-001')
      expect(progress.user_id).toBe('local')
    })
  })
})
