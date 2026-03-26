// カードテンプレートリポジトリ（読み取り専用、静的データから取得）

import { FLASHCARD_TEMPLATES } from '../../data/flashcard-templates'
import type { FlashCardTemplate } from '../../types/flashcard-template'
import type { IFlashCardTemplateRepo } from '../interfaces'

export class LocalFlashCardTemplateRepo implements IFlashCardTemplateRepo {
  getAll(): FlashCardTemplate[] {
    return FLASHCARD_TEMPLATES
  }

  getByExemplarId(exemplarId: string): FlashCardTemplate[] {
    return FLASHCARD_TEMPLATES.filter(t => t.primary_exemplar_id === exemplarId)
  }

  getBySourceId(sourceId: string): FlashCardTemplate[] {
    return FLASHCARD_TEMPLATES.filter(t => t.source_id === sourceId)
  }
}
