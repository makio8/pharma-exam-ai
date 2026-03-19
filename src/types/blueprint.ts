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

// --- 正規化データモデル（例示ベース） ---

/** 小項目の例示（最小粒度、951個） */
export interface Exemplar {
  id: string              // "ex-physics-001"
  minorCategory: string   // 小項目名
  middleCategoryId: TopicId // 中項目ID（既存のIDを参照）
  subject: QuestionSubject
  text: string            // "化学結合の様式について説明できる。"
}

/** 問題↔例示の多対多マッピング */
export interface QuestionExemplarMapping {
  questionId: string      // "r110-001"
  exemplarId: string      // "ex-physics-001"
  isPrimary: boolean      // メインの例示かどうか
}

/** 例示の出題統計（集約ビュー） */
export interface ExemplarStats {
  exemplarId: string
  yearsAppeared: number        // 出題された年度数（max 11）
  totalQuestions: number       // 総出題数
  yearDetails: { year: number; count: number }[]  // 年度別出題数
}

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
