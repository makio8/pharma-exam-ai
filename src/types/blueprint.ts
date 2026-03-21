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
  subject: QuestionSubject
  // 全体（マッピング件数ベース）
  yearsAppeared: number          // 出題年度数（0-12）
  totalQuestions: number         // マッピング件数の合計（primary + secondary）
  yearDetails: { year: number; count: number }[]
  // primary/secondary 内訳（マッピング件数ベース）
  primaryQuestions: number       // isPrimary=true のマッピング件数
  secondaryQuestions: number     // isPrimary=false のマッピング件数
  primaryYearsAppeared: number   // primary で出題された年度数
  // 連問補正指標
  linkedGroupCount: number       // linked_group でユニークなシナリオ数
  // 派生指標
  avgQuestionsPerYear: number    // totalQuestions / yearsAppeared（0除算は0）
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
