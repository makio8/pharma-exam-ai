/**
 * カード生成パイプライン内部型定義
 *
 * パイプライン各ステージで使われる中間データ構造を定義する。
 * card-pipeline-core.ts やメイン生成スクリプトからインポートされる。
 */

import type { QuestionSubject } from '../../src/types/question'
import type { KnowledgeAtom } from '../../src/types/knowledge-atom'

// ──────────────────────────────────────────────
// フィルタリングティア（出題頻度グループ）
// ──────────────────────────────────────────────

/** フィルタリングティア（出題頻度グループ） */
export type FrequencyTier = 'frequent' | 'regular' | 'selective'

/** ティアごとの設定 */
export const TIER_CONFIG: Record<FrequencyTier, { minYears: number; maxYears: number; maxAtoms: number }> = {
  frequent:  { minYears: 6, maxYears: Infinity, maxAtoms: 15 },
  regular:   { minYears: 4, maxYears: 5,        maxAtoms: 8 },
  selective: { minYears: 2, maxYears: 3,        maxAtoms: 3 },
}

// ──────────────────────────────────────────────
// コンテキスト型（Claude APIへ送信するデータ）
// ──────────────────────────────────────────────

/** exemplarに紐づく過去問+付箋のコンテキスト */
export interface ExemplarContext {
  exemplarId: string
  subject: QuestionSubject
  exemplarText: string            // exemplarの説明文
  tier: FrequencyTier
  maxAtoms: number
  questions: QuestionSummary[]    // 紐づく過去問
  notes: NoteSummary[]            // 紐づく付箋
}

/** 過去問の要約（Claude送信用） */
export interface QuestionSummary {
  id: string
  year: number
  questionText: string
  choices: string[]               // '1. テキスト' 形式
  correctAnswer: number | number[]
  explanation: string
  isPrimary: boolean
}

/** 付箋の要約（Claude送信用） */
export interface NoteSummary {
  id: string
  title: string
  textSummary: string
  noteType?: string
}

// ──────────────────────────────────────────────
// 生成結果・進捗
// ──────────────────────────────────────────────

/** Claude APIからの生成結果（1 exemplar分） */
export interface GenerationResult {
  exemplarId: string
  atoms: KnowledgeAtom[]
  rawResponse: string             // デバッグ用の生レスポンス
  tokenUsage: { input: number; output: number }
}

/** パイプライン全体の進捗 */
export interface PipelineProgress {
  total: number
  completed: number
  failed: string[]                // 失敗したexemplarId
  skipped: string[]               // 既存カードでスキップ
}
