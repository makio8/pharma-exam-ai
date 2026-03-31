import { describe, it, expect } from 'vitest'
import { validateCard, validateAtom, validateAllAtoms } from '../card-validator'
import type { KnowledgeAtom, KnowledgeAtomCard } from '../../../src/types/knowledge-atom'

// --- ヘルパー ---

function makeCard(overrides: Partial<KnowledgeAtomCard> = {}): KnowledgeAtomCard {
  return {
    recall_direction: 'drug_to_mech',
    format: 'question_answer',
    front: 'この薬の作用機序は？',
    back: 'セロトニン再取り込み阻害',
    confidence_score: 0.9,
    ...overrides,
  }
}

function makeAtom(overrides: Partial<KnowledgeAtom> = {}): KnowledgeAtom {
  return {
    id: 'ex-pharmacology-067d-mechanism-001',
    exemplar_id: 'pharmacology-067d',
    subject: '薬理',
    knowledge_type: 'mechanism',
    difficulty_tier: 'basic',
    description: 'SSRIの作用機序',
    source_question_ids: ['r100-001'],
    source_note_ids: [],
    cards: [makeCard()],
    ...overrides,
  }
}

// ============================
// validateCard
// ============================
describe('validateCard', () => {
  const atomId = 'ex-pharmacology-067d-mechanism-001'

  it('正常なカード → エラーなし', () => {
    const errors = validateCard(makeCard(), atomId)
    expect(errors).toHaveLength(0)
  })

  it('EMPTY_FRONT: front が空文字', () => {
    const errors = validateCard(makeCard({ front: '' }), atomId)
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('EMPTY_FRONT')
    expect(errors[0].severity).toBe('error')
    expect(errors[0].atomId).toBe(atomId)
  })

  it('EMPTY_FRONT: front が空白のみ', () => {
    const errors = validateCard(makeCard({ front: '   \n\t' }), atomId)
    expect(errors.some(e => e.code === 'EMPTY_FRONT')).toBe(true)
  })

  it('EMPTY_BACK: back が空文字', () => {
    const errors = validateCard(makeCard({ back: '' }), atomId)
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('EMPTY_BACK')
    expect(errors[0].severity).toBe('error')
  })

  it('EMPTY_BACK: back が空白のみ', () => {
    const errors = validateCard(makeCard({ back: '  ' }), atomId)
    expect(errors.some(e => e.code === 'EMPTY_BACK')).toBe(true)
  })

  it('FRONT_TOO_LONG: front が201文字 → warning', () => {
    const errors = validateCard(makeCard({ front: 'あ'.repeat(201) }), atomId)
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('FRONT_TOO_LONG')
    expect(errors[0].severity).toBe('warning')
  })

  it('front が200文字ちょうど → OK', () => {
    const errors = validateCard(makeCard({ front: 'あ'.repeat(200) }), atomId)
    expect(errors).toHaveLength(0)
  })

  it('BACK_TOO_LONG: back が501文字 → warning', () => {
    const errors = validateCard(makeCard({ back: 'あ'.repeat(501) }), atomId)
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('BACK_TOO_LONG')
    expect(errors[0].severity).toBe('warning')
  })

  it('back が500文字ちょうど → OK', () => {
    const errors = validateCard(makeCard({ back: 'あ'.repeat(500) }), atomId)
    expect(errors).toHaveLength(0)
  })

  it('INVALID_CONFIDENCE: confidence_score が 1.5', () => {
    const errors = validateCard(makeCard({ confidence_score: 1.5 }), atomId)
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('INVALID_CONFIDENCE')
    expect(errors[0].severity).toBe('error')
  })

  it('INVALID_CONFIDENCE: confidence_score が -0.1', () => {
    const errors = validateCard(makeCard({ confidence_score: -0.1 }), atomId)
    expect(errors.some(e => e.code === 'INVALID_CONFIDENCE')).toBe(true)
  })

  it('confidence_score が 0.0 → OK（境界値）', () => {
    const errors = validateCard(makeCard({ confidence_score: 0.0 }), atomId)
    expect(errors).toHaveLength(0)
  })

  it('confidence_score が 1.0 → OK（境界値）', () => {
    const errors = validateCard(makeCard({ confidence_score: 1.0 }), atomId)
    expect(errors).toHaveLength(0)
  })

  it('CLOZE_MISSING_PLACEHOLDER: cloze形式に {{c1::}} がない', () => {
    const errors = validateCard(
      makeCard({ format: 'cloze', front: 'SSRIはセロトニンを阻害する' }),
      atomId,
    )
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('CLOZE_MISSING_PLACEHOLDER')
    expect(errors[0].severity).toBe('error')
  })

  it('cloze形式に {{c1::text}} がある → OK', () => {
    const errors = validateCard(
      makeCard({ format: 'cloze', front: 'SSRIは{{c1::セロトニン}}を阻害する' }),
      atomId,
    )
    expect(errors).toHaveLength(0)
  })

  it('cloze形式に {{c2::text}} がある → OK（c1以外もOK）', () => {
    const errors = validateCard(
      makeCard({ format: 'cloze', front: '{{c2::フルオキセチン}}はSSRIである' }),
      atomId,
    )
    expect(errors).toHaveLength(0)
  })

  it('cloze以外の形式では {{c1::}} チェックしない', () => {
    const errors = validateCard(
      makeCard({ format: 'question_answer', front: 'clozeパターンなし' }),
      atomId,
    )
    expect(errors).toHaveLength(0)
  })

  it('EMPTY_RECALL_DIRECTION: recall_direction が空', () => {
    const errors = validateCard(makeCard({ recall_direction: '' }), atomId)
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('EMPTY_RECALL_DIRECTION')
    expect(errors[0].severity).toBe('error')
  })

  it('EMPTY_RECALL_DIRECTION: recall_direction が空白のみ', () => {
    const errors = validateCard(makeCard({ recall_direction: '  ' }), atomId)
    expect(errors.some(e => e.code === 'EMPTY_RECALL_DIRECTION')).toBe(true)
  })

  it('複数エラーが同時に返る', () => {
    const errors = validateCard(
      makeCard({ front: '', back: '', confidence_score: 2.0 }),
      atomId,
    )
    expect(errors.length).toBeGreaterThanOrEqual(3)
    const codes = errors.map(e => e.code)
    expect(codes).toContain('EMPTY_FRONT')
    expect(codes).toContain('EMPTY_BACK')
    expect(codes).toContain('INVALID_CONFIDENCE')
  })
})

// ============================
// validateAtom
// ============================
describe('validateAtom', () => {
  it('正常なatom → エラーなし', () => {
    const errors = validateAtom(makeAtom())
    expect(errors).toHaveLength(0)
  })

  it('NO_SOURCE_QUESTIONS: source_question_ids が空', () => {
    const errors = validateAtom(makeAtom({ source_question_ids: [] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('NO_SOURCE_QUESTIONS')
    expect(errors[0].severity).toBe('error')
  })

  it('NO_CARDS: cards が空', () => {
    const errors = validateAtom(makeAtom({ cards: [] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('NO_CARDS')
    expect(errors[0].severity).toBe('error')
  })

  it('INVALID_ATOM_ID: IDがパターンに合致しない', () => {
    const errors = validateAtom(makeAtom({ id: 'bad-id' }))
    expect(errors.some(e => e.code === 'INVALID_ATOM_ID')).toBe(true)
    expect(errors.find(e => e.code === 'INVALID_ATOM_ID')!.severity).toBe('error')
  })

  it('INVALID_ATOM_ID: 末尾が3桁数字でない', () => {
    const errors = validateAtom(makeAtom({ id: 'ex-pharmacology-067d-mechanism-01' }))
    expect(errors.some(e => e.code === 'INVALID_ATOM_ID')).toBe(true)
  })

  it('INVALID_ATOM_ID: ex-で始まらない', () => {
    const errors = validateAtom(makeAtom({ id: 'pharmacology-067d-mechanism-001' }))
    expect(errors.some(e => e.code === 'INVALID_ATOM_ID')).toBe(true)
  })

  it('正常なIDパターン → INVALID_ATOM_IDなし', () => {
    const errors = validateAtom(makeAtom({ id: 'ex-pharmacology-067d-mechanism-001' }))
    expect(errors.some(e => e.code === 'INVALID_ATOM_ID')).toBe(false)
  })

  it('DUPLICATE_RECALL_DIRECTION: 同じrecall_directionが2回', () => {
    const errors = validateAtom(
      makeAtom({
        cards: [
          makeCard({ recall_direction: 'drug_to_mech' }),
          makeCard({ recall_direction: 'drug_to_mech' }),
        ],
      }),
    )
    expect(errors.some(e => e.code === 'DUPLICATE_RECALL_DIRECTION')).toBe(true)
    expect(errors.find(e => e.code === 'DUPLICATE_RECALL_DIRECTION')!.severity).toBe('error')
  })

  it('異なるrecall_direction → DUPLICATE_RECALL_DIRECTIONなし', () => {
    const errors = validateAtom(
      makeAtom({
        cards: [
          makeCard({ recall_direction: 'drug_to_mech' }),
          makeCard({ recall_direction: 'mech_to_drug' }),
        ],
      }),
    )
    expect(errors.some(e => e.code === 'DUPLICATE_RECALL_DIRECTION')).toBe(false)
  })

  it('atom-levelエラー + card-levelエラーが両方返る', () => {
    const errors = validateAtom(
      makeAtom({
        source_question_ids: [],
        cards: [makeCard({ front: '' })],
      }),
    )
    const codes = errors.map(e => e.code)
    expect(codes).toContain('NO_SOURCE_QUESTIONS')
    expect(codes).toContain('EMPTY_FRONT')
  })
})

// ============================
// validateAllAtoms
// ============================
describe('validateAllAtoms', () => {
  it('正常なatom配列 → エラーなし、summary正確', () => {
    const result = validateAllAtoms([makeAtom()])
    expect(result.errors).toHaveLength(0)
    expect(result.summary.total).toBe(1)
    expect(result.summary.withErrors).toBe(0)
    expect(result.summary.errorCount).toBe(0)
    expect(result.summary.warningCount).toBe(0)
  })

  it('空配列 → summary全0', () => {
    const result = validateAllAtoms([])
    expect(result.errors).toHaveLength(0)
    expect(result.summary.total).toBe(0)
  })

  it('複数atomのエラーが集約される', () => {
    const result = validateAllAtoms([
      makeAtom({ id: 'ex-pharm-067d-mechanism-001', source_question_ids: [] }),
      makeAtom({ id: 'ex-pharm-067d-mechanism-002', cards: [makeCard({ front: '' })] }),
    ])
    expect(result.errors.length).toBeGreaterThanOrEqual(2)
    expect(result.summary.total).toBe(2)
    expect(result.summary.withErrors).toBe(2)
  })

  it('errorCount と warningCount を正しく分類', () => {
    const result = validateAllAtoms([
      makeAtom({
        cards: [makeCard({ front: 'あ'.repeat(201) })], // warning
      }),
      makeAtom({
        id: 'ex-pharm-067d-mechanism-002',
        cards: [makeCard({ front: '' })], // error
      }),
    ])
    expect(result.summary.warningCount).toBeGreaterThanOrEqual(1)
    expect(result.summary.errorCount).toBeGreaterThanOrEqual(1)
  })

  it('withErrors は error を持つ atom のみカウント（warning のみは含まない）', () => {
    const result = validateAllAtoms([
      makeAtom({
        cards: [makeCard({ front: 'あ'.repeat(201) })], // warning only
      }),
    ])
    expect(result.summary.withErrors).toBe(0)
    expect(result.summary.warningCount).toBe(1)
  })
})
