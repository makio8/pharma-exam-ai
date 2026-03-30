// 薬剤師国試：公式付箋の型定義

import type { QuestionSubject } from './question'

/** 公式付箋の種別 */
export type NoteType = 'mnemonic' | 'knowledge' | 'related' | 'caution' | 'solution'

/** 公式付箋（運営提供コンテンツ） */
export interface OfficialNote {
  id: string
  title: string
  imageUrl: string
  textSummary: string
  subject: QuestionSubject
  topicId: string
  tags: string[]
  primaryExemplarIds: string[]    // 主要な紐づき（isPrimary=true）
  secondaryExemplarIds: string[]  // 補助的な紐づき（isPrimary=false）
  /** @deprecated primaryExemplarIds / secondaryExemplarIds を使用すること。新JSONには含まれない */
  exemplarIds?: string[]
  noteType?: NoteType
  importance: number
  tier: 'free' | 'premium'
}

/** ユーザーのブックマーク（snake_case規約に統一） */
export interface BookmarkedNote {
  id: string
  user_id: string
  note_id: string
  bookmarked_at: string
  review_count: number
  last_reviewed_at?: string
}
