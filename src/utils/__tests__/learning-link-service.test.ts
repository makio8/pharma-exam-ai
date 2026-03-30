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
    primaryExemplarIds: [],
    secondaryExemplarIds: [],
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

  describe('getRelatedQuestions', () => {
    // q1 → ex1
    // q2 → ex1, ex2
    // q3 → ex3
    // q1からみると: q2がex1で一致(score=1)、q3は一致なし

    it('exemplar一致の問題を先に返す', () => {
      const result = service.getRelatedQuestions('q1', ['q2', 'q3'], 10)
      // q2はex1で一致 → 先頭、q3はexemplar一致なし → トピック補完
      expect(result[0]).toBe('q2')
      expect(result).toContain('q3')
    })

    it('exemplarに複数マッチする問題はスコアが高くなる', () => {
      // q2はex1,ex2を持つ。別の問題q4をex1+ex2両方に紐づけるとスコア2
      const extendedMappings: QuestionExemplarMapping[] = [
        ...mappings,
        { questionId: 'q4', exemplarId: 'ex1', isPrimary: true },
        { questionId: 'q4', exemplarId: 'ex2', isPrimary: false },
      ]
      const svc = new LearningLinkService(extendedMappings, notes, templates)
      // q2視点: ex1でq1,q4と一致、ex2でq4と一致 → q4のscore=2, q1のscore=1
      const result = svc.getRelatedQuestions('q2', [], 10)
      expect(result[0]).toBe('q4') // score=2が先頭
      expect(result[1]).toBe('q1') // score=1が次
    })

    it('exemplarが limit に満たない場合はトピック補完する', () => {
      // q3はex3のみ。ex3に他の問題がない → exemplar一致0件
      // topicFallback=['q1','q2'] で補完される
      const result = service.getRelatedQuestions('q3', ['q1', 'q2'], 10)
      expect(result).toEqual(['q1', 'q2'])
    })

    it('exemplar一致がlimitを超えてもトピック補完しない', () => {
      // ex1に10問以上紐づける
      const manyMappings: QuestionExemplarMapping[] = Array.from({ length: 12 }, (_, i) => ({
        questionId: `qa${i}`,
        exemplarId: 'ex1',
        isPrimary: true,
      }))
      const svc = new LearningLinkService(manyMappings, [], [])
      const result = svc.getRelatedQuestions('qa0', ['fallback1', 'fallback2'], 10)
      expect(result).toHaveLength(10)
      expect(result).not.toContain('fallback1')
    })

    it('トピック補完で自問は含まれない', () => {
      const result = service.getRelatedQuestions('q1', ['q1', 'q2', 'q3'], 10)
      expect(result).not.toContain('q1')
    })

    it('exemplar一致とトピック補完で重複しない', () => {
      // q1のexemplar一致=q2。topicFallbackにもq2が含まれる場合
      const result = service.getRelatedQuestions('q1', ['q2', 'q3'], 10)
      const unique = new Set(result)
      expect(unique.size).toBe(result.length)
    })

    it('QEMにない問題はトピック補完のみ返す', () => {
      const result = service.getRelatedQuestions('no-such-question', ['q1', 'q2'], 10)
      expect(result).toEqual(['q1', 'q2'])
    })

    it('limit=0は空配列を返す', () => {
      expect(service.getRelatedQuestions('q1', ['q2', 'q3'], 0)).toEqual([])
    })
  })
})
