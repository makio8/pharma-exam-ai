// src/utils/sm2-scheduler.ts
// SM-2 間隔反復アルゴリズム（純粋クラス、副作用なし）
// 既存 useFlashCards.ts の calculateNextReview を抽出・テスト可能にしたもの

import type { CardProgress, ReviewResult } from '../types/card-progress'

/** SM-2 計算結果（CardProgress の部分更新） */
export interface ScheduleResult {
  ease_factor: number
  interval_days: number
  next_review_at: string
  review_count: number
  correct_streak: number
}

export class SM2Scheduler {
  static calculate(progress: CardProgress, result: ReviewResult, now: number = Date.now()): ScheduleResult {
    let { ease_factor, interval_days, correct_streak } = progress

    switch (result) {
      case 'again':
        interval_days = 1
        ease_factor = Math.max(1.3, ease_factor - 0.2)
        correct_streak = 0
        break
      case 'hard':
        interval_days = Math.max(1, Math.round(interval_days * 1.2))
        ease_factor = Math.max(1.3, ease_factor - 0.15)
        correct_streak = 0
        break
      case 'good':
        interval_days = correct_streak === 0 ? 1 : Math.round(interval_days * ease_factor)
        correct_streak += 1
        break
      case 'easy':
        interval_days = Math.round(interval_days * ease_factor * 1.3)
        ease_factor += 0.15
        correct_streak += 1
        break
    }

    const next_review_at = new Date(now + interval_days * 86400000).toISOString()
    return {
      ease_factor,
      interval_days,
      next_review_at,
      review_count: progress.review_count + 1,
      correct_streak,
    }
  }

  static createInitialProgress(templateId: string, userId: string = 'local', now: number = Date.now()): CardProgress {
    return {
      template_id: templateId,
      user_id: userId,
      ease_factor: 2.5,
      interval_days: 0,
      next_review_at: new Date(now).toISOString(),
      review_count: 0,
      correct_streak: 0,
      last_reviewed_at: '',
    }
  }
}
