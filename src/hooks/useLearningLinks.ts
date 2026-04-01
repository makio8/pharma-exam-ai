// src/hooks/useLearningLinks.ts
// LearningLinkService（逆引き表）の React ラッパー

import { useMemo } from 'react'
import { LearningLinkService } from '../utils/learning-link-service'
import { QUESTION_EXEMPLAR_MAP } from '../data/question-exemplar-map'
import { OFFICIAL_NOTES } from '../data/official-notes'
import { useUnifiedTemplates } from './useUnifiedTemplates'

export function useLearningLinks(): LearningLinkService {
  const { allTemplates } = useUnifiedTemplates()
  return useMemo(
    () => new LearningLinkService(QUESTION_EXEMPLAR_MAP, OFFICIAL_NOTES, allTemplates),
    [allTemplates],
  )
}
