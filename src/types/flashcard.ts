// 薬剤師国試：暗記カード（フラッシュカード）の型定義

import type { QuestionSubject } from './question'

/** カードのフォーマット */
export type CardFormat = 'term_definition' | 'question_answer' | 'mnemonic'

/** 暗記カード */
export interface FlashCard {
  id: string
  user_id: string
  question_id: string       // 元の問題ID (e.g., "r110-001")
  topic_id: string           // 中項目ID (e.g., "pharmacology-autonomic-nervous")
  subject: QuestionSubject
  front: string              // 表面（問い/用語/語呂）
  back: string               // 裏面（答え/定義/対象）
  format: CardFormat
  tags: string[]
  ease_factor: number        // SM-2係数（デフォルト2.5）
  interval_days: number      // 次回復習までの日数
  next_review_at: string     // ISO8601 次回復習日
  review_count: number       // 復習回数
  correct_streak: number     // 連続正答数
  created_at: string
  updated_at: string
}

/** 復習結果 */
export type ReviewResult = 'again' | 'hard' | 'good' | 'easy'

/** カード作成フォーム */
export interface FlashCardFormValues {
  front: string
  back: string
  format: CardFormat
  tags: string[]
}

/** カードフォーマットの表示設定 */
export const CARD_FORMAT_CONFIG: Record<CardFormat, { label: string; emoji: string; frontLabel: string; backLabel: string }> = {
  term_definition: { label: '用語↔定義', emoji: '📖', frontLabel: '用語', backLabel: '定義' },
  question_answer: { label: '問い↔答え', emoji: '❓', frontLabel: '問い', backLabel: '答え' },
  mnemonic: { label: '語呂↔対象', emoji: '🎵', frontLabel: '語呂合わせ', backLabel: '覚える内容' },
}
