// 薬剤師国家試験 出題基準（ブループリント）の型定義

import type { QuestionSubject } from './question'

/** 中項目（習熟度トラッキングの基本単位） */
export interface MiddleCategory {
  id: string              // ユニークID（例: "physics-material-structure"）
  name: string            // 中項目名（例: "物質の構造"）
  minorCategories: string[] // 小項目名リスト
}

/** 大項目 */
export interface MajorCategory {
  name: string            // 大項目名（例: "物質の物理的性質"）
  middleCategories: MiddleCategory[]
}

/** 科目別ブループリント（出題基準） */
export interface SubjectBlueprint {
  subject: QuestionSubject
  majorCategories: MajorCategory[]
}

/** トピックID（MiddleCategory.id のエイリアス） */
export type TopicId = string

/** トピック別の習熟度 */
export interface TopicMastery {
  topicId: TopicId
  subject: QuestionSubject
  majorCategory: string
  middleCategory: string
  status: 'not_started' | 'learning' | 'almost' | 'mastered'
  totalQuestions: number
  answeredQuestions: number
  correctRate: number
}
