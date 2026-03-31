// src/types/flashcard-template.ts
// 暗記カードテンプレート（公式コンテンツ — 全ユーザー共通、TSファイルに焼き込み）

import type { QuestionSubject } from './question'

/** 知識の種別（knowledge atomの分類） */
export type KnowledgeType =
  | 'mechanism'        // 作用機序
  | 'classification'   // 分類
  | 'adverse_effect'   // 副作用
  | 'pharmacokinetics' // 薬物動態
  | 'interaction'      // 相互作用
  | 'indication'       // 適応
  | 'contraindication' // 禁忌
  | 'structure'        // 構造式
  | 'calculation'      // 計算
  | 'regulation'       // 法規
  | 'mnemonic'         // 語呂合わせ

/** 難易度ティア */
export type DifficultyTier = 'basic' | 'applied' | 'integrated'

/** カードのコンテンツ種別 */
export type ContentType = 'text' | 'image' | 'image_text'

/** カードのフォーマット（表示形式） */
export type CardFormat =
  | 'term_definition'
  | 'question_answer'
  | 'mnemonic'
  | 'cloze'
  | 'comparison'
  | 'structural_identification'
  | 'structural_features'
  | 'structural_pattern'
  | 'structure_activity'
  | 'structural_comparison'

/** カードフォーマットの表示設定 */
export const CARD_FORMAT_CONFIG: Record<CardFormat, { label: string; emoji: string; frontLabel: string; backLabel: string }> = {
  term_definition: { label: '用語↔定義', emoji: '📖', frontLabel: '用語', backLabel: '定義' },
  question_answer: { label: '問い↔答え', emoji: '❓', frontLabel: '問い', backLabel: '答え' },
  mnemonic: { label: '語呂↔対象', emoji: '🎵', frontLabel: '語呂合わせ', backLabel: '覚える内容' },
  cloze: { label: '穴埋め', emoji: '🔲', frontLabel: '文（穴あき）', backLabel: '答え' },
  comparison: { label: '比較・弁別', emoji: '⚖️', frontLabel: '比較問い', backLabel: '違い' },
  structural_identification: { label: '構造式→物質名', emoji: '🔬', frontLabel: '構造式', backLabel: '物質名' },
  structural_features: { label: '物質名→構造的特徴', emoji: '🧪', frontLabel: '物質名', backLabel: '構造的特徴' },
  structural_pattern: { label: '部分構造→分類', emoji: '🧩', frontLabel: '部分構造', backLabel: '化合物群' },
  structure_activity: { label: '構造→薬理作用', emoji: '💊', frontLabel: '構造', backLabel: '薬理作用' },
  structural_comparison: { label: '構造比較', emoji: '🔄', frontLabel: '2つの構造', backLabel: '違い' },
}

/** 暗記カードテンプレート（公式コンテンツ） */
export interface FlashCardTemplate {
  // 既存（必須）
  id: string                      // 'fct-001' or 'ex-pharmacology-067d-mechanism-drug_to_mech'
  source_type: 'fusen' | 'explanation' | 'knowledge_atom' | 'structure_db'
  source_id: string               // 付箋ID or 問題ID or knowledge_atom_id
  primary_exemplar_id: string     // Exemplarハブへの接続点
  subject: QuestionSubject
  front: string                   // 表面（問い）
  back: string                    // 裏面（答え）
  format: CardFormat
  tags: string[]

  // 新規（AI生成カード用、既存サンプルにはないのでoptional）
  knowledge_atom_id?: string
  knowledge_type?: KnowledgeType
  recall_direction?: string       // 'drug_to_mech', 'mech_to_drug' 等
  reverse_of_id?: string          // 逆カードのID
  difficulty_tier?: DifficultyTier
  content_type?: ContentType
  media_url?: string
  smiles?: string
  generation_model?: string       // 'claude-opus-4-6' 等
  confidence_score?: number       // 0.0-1.0
  source_question_ids?: string[]  // 根拠となる過去問ID群
  source_note_ids?: string[]      // 根拠となる付箋ID群
}
