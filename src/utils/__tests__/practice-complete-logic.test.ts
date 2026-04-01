// src/utils/__tests__/practice-complete-logic.test.ts
import { describe, it, expect } from 'vitest'
import { buildNextActions, calculateStats } from '../practice-complete-logic'
import type { FlashCardTemplate } from '../../types/flashcard-template'
import type { ReviewResult } from '../../types/card-progress'

// テスト用カード生成ヘルパー
function makeCard(id: string, exemplarId: string): FlashCardTemplate {
  return {
    id,
    source_type: 'fusen',
    source_id: 'fusen-0001',
    primary_exemplar_id: exemplarId,
    subject: '薬理',
    front: 'Q',
    back: 'A',
    format: 'term_definition',
    tags: [],
  }
}

// テスト用 linkService ヘルパー
function makeLinkService(map: Record<string, string[]>) {
  return {
    getQuestionsForExemplar: (id: string) => map[id] ?? [],
  }
}

describe('buildNextActions', () => {
  it('again + 関連問題あり → related_questions が含まれる', () => {
    const cards = [makeCard('card-1', 'ex-001')]
    const results = [{ cardId: 'card-1', result: 'again' as ReviewResult }]
    const linkService = makeLinkService({ 'ex-001': ['q-100', 'q-101'] })

    const actions = buildNextActions(results, cards, linkService)

    const types = actions.map(a => a.type)
    expect(types).toContain('related_questions')

    const rq = actions.find(a => a.type === 'related_questions')
    expect(rq?.questionIds).toEqual(expect.arrayContaining(['q-100', 'q-101']))
  })

  it('again + 関連問題なし → related_questions が含まれない', () => {
    const cards = [makeCard('card-1', 'ex-001')]
    const results = [{ cardId: 'card-1', result: 'again' as ReviewResult }]
    const linkService = makeLinkService({ 'ex-001': [] }) // 関連問題 0 件

    const actions = buildNextActions(results, cards, linkService)

    const types = actions.map(a => a.type)
    expect(types).not.toContain('related_questions')
  })

  it('全部 good → more_practice が含まれる', () => {
    const cards = [makeCard('card-1', 'ex-001'), makeCard('card-2', 'ex-002')]
    const results = [
      { cardId: 'card-1', result: 'good' as ReviewResult },
      { cardId: 'card-2', result: 'good' as ReviewResult },
    ]
    const linkService = makeLinkService({})

    const actions = buildNextActions(results, cards, linkService)

    const types = actions.map(a => a.type)
    expect(types).toContain('more_practice')
  })

  it('常に go_home が含まれる', () => {
    const cards = [makeCard('card-1', 'ex-001')]
    const results = [{ cardId: 'card-1', result: 'good' as ReviewResult }]
    const linkService = makeLinkService({})

    const actions = buildNextActions(results, cards, linkService)

    const types = actions.map(a => a.type)
    expect(types).toContain('go_home')
  })

  it('空配列 → go_home のみ（related_questions なし）', () => {
    const actions = buildNextActions([], [], makeLinkService({}))

    const types = actions.map(a => a.type)
    expect(types).not.toContain('related_questions')
    expect(types).toContain('go_home')
  })
})

describe('calculateStats', () => {
  it('ok / again / total を正しく計算する', () => {
    const results: { result: ReviewResult }[] = [
      { result: 'good' },
      { result: 'easy' },
      { result: 'again' },
      { result: 'hard' },
    ]

    const stats = calculateStats(results)

    expect(stats.ok).toBe(2)    // good + easy
    expect(stats.again).toBe(2) // again + hard
    expect(stats.total).toBe(4)
  })

  it('isPerfect = true when again === 0 && total > 0', () => {
    const results: { result: ReviewResult }[] = [
      { result: 'good' },
      { result: 'easy' },
    ]

    expect(calculateStats(results).isPerfect).toBe(true)
  })

  it('isPerfect = false when again > 0', () => {
    const results: { result: ReviewResult }[] = [
      { result: 'good' },
      { result: 'again' },
    ]

    expect(calculateStats(results).isPerfect).toBe(false)
  })

  it('空配列 → isPerfect = false', () => {
    expect(calculateStats([]).isPerfect).toBe(false)
  })
})
