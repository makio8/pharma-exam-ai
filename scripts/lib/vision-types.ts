import type { ChoiceType, VisualContentType } from '../../src/types/question'

export interface VisionExtraction {
  question_id: string
  question_text_clean: string
  question_concepts: string[]
  visual_content_type: VisualContentType
  choices_extractable: boolean
  choices: VisionChoice[]
  linked_group?: string
  linked_scenario?: string
  confidence: number
  notes?: string
}

export interface VisionChoice {
  key: number
  text: string              // "" for non-extractable choices (maintains compat with Choice.text: string)
  semantic_labels: string[]
  choice_type: ChoiceType
}
