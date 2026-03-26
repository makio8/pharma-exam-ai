// 薬剤師国試：暗記カード（フラッシュカード）の型定義
// ⚠️ DEPRECATED: 新コードは flashcard-template.ts + card-progress.ts を使用すること
// 後方互換のため re-export を維持

import type { QuestionSubject } from './question'

// 新型から re-export（既存 import を壊さない）
export type { CardFormat } from './flashcard-template'
export { CARD_FORMAT_CONFIG } from './flashcard-template'
export type { ReviewResult } from './card-progress'

/**
 * @deprecated FlashCardTemplate + CardProgress に分離済み。
 * 旧ユーザー作成カード用。新コードでは使わないこと。
 */
export interface FlashCard {
  id: string
  user_id: string
  question_id: string
  topic_id: string
  subject: QuestionSubject
  front: string
  back: string
  format: 'term_definition' | 'question_answer' | 'mnemonic'
  tags: string[]
  ease_factor: number
  interval_days: number
  next_review_at: string
  review_count: number
  correct_streak: number
  created_at: string
  updated_at: string
}

/** @deprecated 新コードでは FlashCardTemplate + source_type/source_id を使用 */
export interface FlashCardFormValues {
  front: string
  back: string
  format: 'term_definition' | 'question_answer' | 'mnemonic'
  tags: string[]
}
