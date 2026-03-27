// 薬剤師国試：公式付箋の型定義

import type { QuestionSubject } from './question'

/** 公式付箋の種別 */
export type NoteType = 'mnemonic' | 'knowledge' | 'related' | 'caution' | 'solution'

/** 公式付箋（運営提供コンテンツ） */
export interface OfficialNote {
  id: string
  title: string                // 例: 「交感神経 α1受容体の作用機序」
  imageUrl: string             // 手書きノート画像（PNG/WebP）
  textSummary: string          // AIテキスト要約
  subject: QuestionSubject     // 例: 「薬理」
  topicId: string              // ALL_TOPICS.id で join
  tags: string[]
  /** @deprecated JSON から除外済み。ランタイムで topicId → QUESTION_TOPIC_MAP 逆引きを使う */
  linkedQuestionIds?: string[]
  exemplarIds?: string[]       // AIマッチング結果（類題ID群）
  noteType?: NoteType          // 付箋種別（デフォルト: 'knowledge'）
  importance: number           // 紐づく問題数から自動算出
  tier: 'free' | 'premium'
}

/** ユーザーのブックマーク（snake_case規約に統一） */
export interface BookmarkedNote {
  id: string
  user_id: string
  note_id: string              // OfficialNote.id
  bookmarked_at: string        // ISO8601
  review_count: number         // 何回見たか
  last_reviewed_at?: string    // 最後に確認した日時
}
