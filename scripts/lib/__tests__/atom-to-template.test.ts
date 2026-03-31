import { describe, it, expect } from 'vitest'
import { generateCardId, atomToTemplates } from '../atom-to-template'
import type { KnowledgeAtom } from '../../../src/types/knowledge-atom'

// --- テストデータ ---

const sampleAtom: KnowledgeAtom = {
  id: 'ex-pharm-001-mechanism-001',
  exemplar_id: 'ex-pharm-001',
  subject: '薬理',
  knowledge_type: 'mechanism',
  difficulty_tier: 'basic',
  description: 'β遮断薬の作用機序',
  source_question_ids: ['r100-026'],
  source_note_ids: ['fusen-0100'],
  cards: [
    {
      recall_direction: 'drug_to_mech',
      format: 'question_answer',
      front: 'プロプラノロールの作用機序は？',
      back: 'β1/β2受容体の非選択的遮断',
      confidence_score: 0.95,
    },
    {
      recall_direction: 'mech_to_drug',
      format: 'question_answer',
      front: 'β1/β2受容体を非選択的に遮断する代表薬は？',
      back: 'プロプラノロール',
      confidence_score: 0.9,
    },
  ],
}

const singleCardAtom: KnowledgeAtom = {
  id: 'ex-pharm-002-classification-001',
  exemplar_id: 'ex-pharm-002',
  subject: '薬理',
  knowledge_type: 'classification',
  difficulty_tier: 'applied',
  description: 'β遮断薬の分類',
  source_question_ids: ['r101-030'],
  source_note_ids: [],
  cards: [
    {
      recall_direction: 'drug_to_class',
      format: 'term_definition',
      front: 'プロプラノロールの分類は？',
      back: '非選択的β遮断薬',
      confidence_score: 0.85,
    },
  ],
}

// --- generateCardId ---

describe('generateCardId', () => {
  it('exemplar_id × knowledge_type × recall_direction の形式でIDを生成する', () => {
    const id = generateCardId('ex-pharm-001', 'mechanism', 'drug_to_mech')
    expect(id).toBe('ex-pharm-001-mechanism-drug_to_mech')
  })

  it('異なる recall_direction で異なるIDになる', () => {
    const id1 = generateCardId('ex-pharm-001', 'mechanism', 'drug_to_mech')
    const id2 = generateCardId('ex-pharm-001', 'mechanism', 'mech_to_drug')
    expect(id1).not.toBe(id2)
  })
})

// --- atomToTemplates ---

describe('atomToTemplates', () => {
  it('2枚カードのatomから2つのFlashCardTemplateを生成する', () => {
    const templates = atomToTemplates(sampleAtom)
    expect(templates).toHaveLength(2)
  })

  it('source_type が "knowledge_atom" である', () => {
    const templates = atomToTemplates(sampleAtom)
    for (const t of templates) {
      expect(t.source_type).toBe('knowledge_atom')
    }
  })

  it('各フィールドが正しくマッピングされる', () => {
    const templates = atomToTemplates(sampleAtom)
    const first = templates[0]

    expect(first.id).toBe('ex-pharm-001-mechanism-drug_to_mech')
    expect(first.source_id).toBe('ex-pharm-001-mechanism-001')
    expect(first.primary_exemplar_id).toBe('ex-pharm-001')
    expect(first.subject).toBe('薬理')
    expect(first.front).toBe('プロプラノロールの作用機序は？')
    expect(first.back).toBe('β1/β2受容体の非選択的遮断')
    expect(first.format).toBe('question_answer')
    expect(first.knowledge_atom_id).toBe('ex-pharm-001-mechanism-001')
    expect(first.knowledge_type).toBe('mechanism')
    expect(first.recall_direction).toBe('drug_to_mech')
    expect(first.difficulty_tier).toBe('basic')
    expect(first.content_type).toBe('text')
    expect(first.generation_model).toBe('claude-opus-4-6')
    expect(first.confidence_score).toBe(0.95)
    expect(first.source_question_ids).toEqual(['r100-026'])
    expect(first.source_note_ids).toEqual(['fusen-0100'])
  })

  it('tags に knowledge_type と difficulty_tier を含む', () => {
    const templates = atomToTemplates(sampleAtom)
    for (const t of templates) {
      expect(t.tags).toContain('mechanism')
      expect(t.tags).toContain('basic')
    }
  })

  it('2枚カードのatomでは reverse_of_id が相互に設定される', () => {
    const templates = atomToTemplates(sampleAtom)
    expect(templates[0].reverse_of_id).toBe(templates[1].id)
    expect(templates[1].reverse_of_id).toBe(templates[0].id)
  })

  it('1枚カードのatomでは reverse_of_id が undefined', () => {
    const templates = atomToTemplates(singleCardAtom)
    expect(templates).toHaveLength(1)
    expect(templates[0].reverse_of_id).toBeUndefined()
  })

  it('3枚以上のカードでは reverse_of_id が undefined', () => {
    const threeCardAtom: KnowledgeAtom = {
      ...sampleAtom,
      cards: [
        ...sampleAtom.cards,
        {
          recall_direction: 'indication_to_drug',
          format: 'question_answer',
          front: '高血圧に使うβ遮断薬は？',
          back: 'プロプラノロール',
          confidence_score: 0.8,
        },
      ],
    }
    const templates = atomToTemplates(threeCardAtom)
    expect(templates).toHaveLength(3)
    for (const t of templates) {
      expect(t.reverse_of_id).toBeUndefined()
    }
  })
})
