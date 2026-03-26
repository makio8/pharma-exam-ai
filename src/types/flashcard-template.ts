// src/types/flashcard-template.ts
// 暗記カードテンプレート（公式コンテンツ — 全ユーザー共通、TSファイルに焼き込み）

import type { QuestionSubject } from './question'

/** カードのフォーマット（表示形式） */
export type CardFormat = 'term_definition' | 'question_answer' | 'mnemonic'

/** カードフォーマットの表示設定 */
export const CARD_FORMAT_CONFIG: Record<CardFormat, { label: string; emoji: string; frontLabel: string; backLabel: string }> = {
  term_definition: { label: '用語↔定義', emoji: '📖', frontLabel: '用語', backLabel: '定義' },
  question_answer: { label: '問い↔答え', emoji: '❓', frontLabel: '問い', backLabel: '答え' },
  mnemonic: { label: '語呂↔対象', emoji: '🎵', frontLabel: '語呂合わせ', backLabel: '覚える内容' },
}

/** 暗記カードテンプレート（公式コンテンツ） */
export interface FlashCardTemplate {
  id: string                      // 'fct-001'
  source_type: 'fusen' | 'explanation'  // 生成元: 付箋ベース or 問題解説ベース
  source_id: string               // 付箋ID or 問題ID
  primary_exemplar_id: string     // Exemplarハブへの接続点
  subject: QuestionSubject
  front: string                   // 表面（問い）
  back: string                    // 裏面（答え）
  format: CardFormat
  tags: string[]
}
