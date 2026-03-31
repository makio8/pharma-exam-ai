// このファイルは assemble-card-templates.ts により自動生成されます
// 手動で編集しないでください

import type { FlashCardTemplate } from '../../types/flashcard-template'
import type { QuestionSubject } from '../../types/question'

const SUBJECT_FILES: Record<QuestionSubject, string> = {
  '物理': 'physics',
  '化学': 'chemistry',
  '生物': 'biology',
  '衛生': 'hygiene',
  '薬理': 'pharmacology',
  '薬剤': 'pharmaceutics',
  '病態・薬物治療': 'pathology',
  '法規・制度・倫理': 'regulation',
  '実務': 'practice',
}

export async function loadCardTemplates(subject: QuestionSubject): Promise<FlashCardTemplate[]> {
  const file = SUBJECT_FILES[subject]
  if (!file) return []
  try {
    const mod = await import(`./${file}.json`)
    return mod.default as FlashCardTemplate[]
  } catch {
    return []
  }
}

export async function loadAllCardTemplates(): Promise<FlashCardTemplate[]> {
  const subjects = Object.keys(SUBJECT_FILES) as QuestionSubject[]
  const results = await Promise.all(subjects.map(s => loadCardTemplates(s)))
  return results.flat()
}
