import type { QuestionSubject } from '../../src/types/question'

export type StructureCategory =
  | 'heterocycle'
  | 'vitamin'
  | 'amino_acid'
  | 'nucleobase'
  | 'prodrug'
  | 'carcinogen'
  | 'sweetener'
  | 'preservative'
  | 'antioxidant'
  | 'antifungal'
  | 'pesticide'
  | 'endocrine_disruptor'
  | 'antidote'
  | 'foshu'
  | 'pharmacology'

export interface StructureEntry {
  id: string                      // 'struct-thiamine'
  name_ja: string
  name_en: string
  pubchem_cid: number | null
  smiles: string | null
  scaffold: string
  functional_groups: string[]
  category: StructureCategory
  priority: 1 | 2 | 3 | 4 | 5
  subjects: QuestionSubject[]
  representative_of?: string      // heterocycle only
}

export interface StructuralFormulaRegistry {
  version: string
  generated_at: string
  entries: StructureEntry[]
}
