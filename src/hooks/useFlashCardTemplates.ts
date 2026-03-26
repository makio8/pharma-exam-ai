// src/hooks/useFlashCardTemplates.ts
// カードテンプレート（公式コンテンツ）へのアクセスフック

import { useMemo } from 'react'
import { flashCardTemplateRepo } from '../repositories'
import type { FlashCardTemplate } from '../types/flashcard-template'

export function useFlashCardTemplates() {
  const templates = useMemo(() => flashCardTemplateRepo.getAll(), [])

  const getByExemplarId = useMemo(
    () => (exemplarId: string): FlashCardTemplate[] =>
      flashCardTemplateRepo.getByExemplarId(exemplarId),
    [],
  )

  const getBySourceId = useMemo(
    () => (sourceId: string): FlashCardTemplate[] =>
      flashCardTemplateRepo.getBySourceId(sourceId),
    [],
  )

  return { templates, getByExemplarId, getBySourceId } as const
}
