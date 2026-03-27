// src/utils/__tests__/learning-link-service.test.ts
import { describe, it, expect } from 'vitest'
import { LearningLinkService } from '../learning-link-service'
import type { QuestionExemplarMapping } from '../../types/blueprint'
import type { OfficialNote } from '../../types/official-note'
import type { FlashCardTemplate } from '../../types/flashcard-template'

function makeNote(overrides: Partial<OfficialNote>): OfficialNote {
  return {
    id: 'n-test',
    title: 'テスト付箋',
    imageUrl: '/test.png',
    textSummary: 'テスト',
    subject: '物理',
    topicId: 'physics-test',
    tags: [],
    importance: 2,
    tier: 'free',
    ...overrides,
  }
}

function makeTemplate(overrides: Partial<FlashCardTemplate>): FlashCardTemplate {
  return {
    id: 'fct-test',
    source_type: 'fusen',
    source_id: 'n-test',
    primary_exemplar_id: 'ex-test',
    subject: '物理',
    front: 'Q',
    back: 'A',
    format: 'term_definition',
    tags: [],
    ...overrides,
  }
}

const mappings: QuestionExemplarMapping[] = [
  { questionId: 'q1', exemplarId: 'ex1', isPrimary: true },
  { questionId: 'q2', exemplarId: 'ex1', isPrimary: true },
  { questionId: 'q2', exemplarId: 'ex2', isPrimary: false },
  { questionId: 'q3', exemplarId: 'ex3', isPrimary: true },
]

const notes: OfficialNote[] = [
  makeNote({ id: 'n1', exemplarIds: ['ex1'] }),
  makeNote({ id: 'n2', exemplarIds: ['ex2'] }),
  makeNote({ id: 'n3' }), // exemplarIds なし
]

const templates: FlashCardTemplate[] = [
  makeTemplate({ id: 'fct-1', source_type: 'fusen', source_id: 'n1', primary_exemplar_id: 'ex1' }),
  makeTemplate({ id: 'fct-2', source_type: 'explanation', source_id: 'q1', primary_exemplar_id: 'ex1' }),
  makeTemplate({ id: 'fct-3', source_type: 'fusen', source_id: 'n2', primary_exemplar_id: 'ex2' }),
]

describe('LearningLinkService', () => {
  const service = new LearningLinkService(mappings, notes, templates)

  describe('getNotesForQuestion', () => {
    it('問題→exemplar→付箋 を辿って関連付箋を返す', () => {
      const result = service.getNotesForQuestion('q1')
      expect(result.map(n => n.id)).toEqual(['n1'])
    })

    it('複数 exemplar を持つ問題は複数付箋を返す', () => {
      const result = service.getNotesForQuestion('q2')
      expect(result.map(n => n.id).sort()).toEqual(['n1', 'n2'])
    })

    it('付箋なしの exemplar は空配列', () => {
      expect(service.getNotesForQuestion('q3')).toEqual([])
    })

    it('存在しない問題IDは空配列', () => {
      expect(service.getNotesForQuestion('nonexistent')).toEqual([])
    })
  })

  describe('getCardsForQuestion', () => {
    it('問題→exemplar→カード を辿って関連カードを返す', () => {
      const result = service.getCardsForQuestion('q1')
      expect(result.map(t => t.id).sort()).toEqual(['fct-1', 'fct-2'])
    })

    it('存在しない問題IDは空配列', () => {
      expect(service.getCardsForQuestion('nonexistent')).toEqual([])
    })
  })

  describe('getSourceCards', () => {
    it('付箋から直接生成されたカードのみ返す', () => {
      const result = service.getSourceCards('n1')
      expect(result.map(t => t.id)).toEqual(['fct-1'])
    })

    it('explanation 由来のカードは含まない', () => {
      const result = service.getSourceCards('n1')
      expect(result.every(t => t.source_type === 'fusen')).toBe(true)
    })

    it('カードなしの付箋は空配列', () => {
      expect(service.getSourceCards('n3')).toEqual([])
    })
  })

  describe('getExemplarCards', () => {
    it('同 exemplar の全カードを返す（source_type 問わず）', () => {
      const result = service.getExemplarCards('n1')
      expect(result.map(t => t.id).sort()).toEqual(['fct-1', 'fct-2'])
    })

    it('exemplarIds なしの付箋は空配列', () => {
      expect(service.getExemplarCards('n3')).toEqual([])
    })
  })

  describe('getQuestionsForNote', () => {
    it('付箋→exemplar→問題 を辿って関連問題IDを返す', () => {
      const result = service.getQuestionsForNote('n1')
      expect(result.sort()).toEqual(['q1', 'q2'])
    })

    it('exemplarIds なしの付箋は空配列', () => {
      expect(service.getQuestionsForNote('n3')).toEqual([])
    })
  })

  describe('getRelatedNote', () => {
    it('fusen 由来: source_id で直接取得', () => {
      const result = service.getRelatedNote(templates[0])
      expect(result?.id).toBe('n1')
    })

    it('explanation 由来: primary_exemplar_id 経由でフォールバック', () => {
      const result = service.getRelatedNote(templates[1])
      expect(result?.id).toBe('n1')
    })

    it('関連付箋なしは undefined', () => {
      const card = makeTemplate({ source_type: 'explanation', source_id: 'q99', primary_exemplar_id: 'ex99' })
      const svc = new LearningLinkService(mappings, notes, [card])
      expect(svc.getRelatedNote(card)).toBeUndefined()
    })
  })

  describe('getQuestionsForCard', () => {
    it('primary_exemplar_id 経由で関連問題IDを返す', () => {
      const result = service.getQuestionsForCard(templates[0])
      expect(result.sort()).toEqual(['q1', 'q2'])
    })
  })
})
