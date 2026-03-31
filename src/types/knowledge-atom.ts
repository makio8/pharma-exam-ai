// src/types/knowledge-atom.ts
import type { KnowledgeType, DifficultyTier, CardFormat } from './flashcard-template'
import type { QuestionSubject } from './question'

/** Knowledge Atom（知識原子）— exemplarから抽出された最小知識単位 */
export interface KnowledgeAtom {
  id: string                      // 'ex-pharmacology-067d-mechanism-001'
  exemplar_id: string
  subject: QuestionSubject
  knowledge_type: KnowledgeType
  difficulty_tier: DifficultyTier
  description: string             // atomの説明（人間が読むサマリー）
  source_question_ids: string[]   // このatomの根拠となる過去問
  source_note_ids: string[]       // 関連する付箋
  cards: KnowledgeAtomCard[]      // このatomから生成するカード群
}

/** KnowledgeAtomから生成する個別カード */
export interface KnowledgeAtomCard {
  recall_direction: string        // 'drug_to_mech', 'definition_to_term' 等
  format: CardFormat
  front: string
  back: string
  confidence_score: number        // AIの自信度 0.0-1.0
}
