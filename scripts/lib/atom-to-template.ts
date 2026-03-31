// scripts/lib/atom-to-template.ts
// KnowledgeAtom → FlashCardTemplate[] 変換

import type { FlashCardTemplate } from '../../src/types/flashcard-template'
import type { KnowledgeAtom } from '../../src/types/knowledge-atom'

/** カードIDを生成: atomId + recall_direction（atom IDが一意なので衝突しない） */
export function generateCardId(atomId: string, recallDirection: string): string {
  return `${atomId}-${recallDirection}`
}

/** 1つのKnowledgeAtomからFlashCardTemplate[]に変換 */
export function atomToTemplates(atom: KnowledgeAtom): FlashCardTemplate[] {
  const cardIds = atom.cards.map(card =>
    generateCardId(atom.id, card.recall_direction),
  )

  return atom.cards.map((card, idx) => {
    // 逆カードのID（2枚の場合のみ設定）
    let reverseOfId: string | undefined
    if (atom.cards.length === 2) {
      reverseOfId = cardIds[idx === 0 ? 1 : 0]
    }

    return {
      id: cardIds[idx],
      source_type: 'knowledge_atom' as const,
      source_id: atom.id,
      primary_exemplar_id: atom.exemplar_id,
      subject: atom.subject,
      front: card.front,
      back: card.back,
      format: card.format,
      tags: [atom.knowledge_type, atom.difficulty_tier],
      knowledge_atom_id: atom.id,
      knowledge_type: atom.knowledge_type,
      recall_direction: card.recall_direction,
      reverse_of_id: reverseOfId,
      difficulty_tier: atom.difficulty_tier,
      content_type: 'text' as const,
      generation_model: 'claude-opus-4-6',
      confidence_score: card.confidence_score,
      source_question_ids: atom.source_question_ids,
      source_note_ids: atom.source_note_ids,
    }
  })
}
