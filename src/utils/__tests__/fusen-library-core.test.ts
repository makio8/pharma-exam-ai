import { describe, it, expect } from 'vitest'
import { FusenLibraryCore } from '../fusen-library-core'
import type { OfficialNote } from '../../types/official-note'

function makeNote(overrides: Partial<OfficialNote>): OfficialNote {
  return {
    id: 'test-001',
    title: 'テスト付箋',
    imageUrl: '/images/fusens/test.png',
    textSummary: 'テスト要約',
    subject: '物理',
    topicId: 'physics-material-structure',
    tags: [],
    linkedQuestionIds: [],
    importance: 0,
    tier: 'free',
    ...overrides,
  }
}

describe('FusenLibraryCore', () => {
  describe('groupBySubject', () => {
    it('科目ごとにグルーピングされる', () => {
      const notes = [
        makeNote({ id: 'n1', subject: '物理', topicId: 'physics-a' }),
        makeNote({ id: 'n2', subject: '化学', topicId: 'chemistry-a' }),
        makeNote({ id: 'n3', subject: '物理', topicId: 'physics-b' }),
      ]
      const core = new FusenLibraryCore(notes)
      const groups = core.groupBySubject()
      expect(groups).toHaveLength(2)
      expect(groups[0].subject).toBe('物理')
      expect(groups[0].fusens).toHaveLength(2)
      expect(groups[1].subject).toBe('化学')
      expect(groups[1].fusens).toHaveLength(1)
    })

    it('空配列の場合は空グループ', () => {
      const core = new FusenLibraryCore([])
      expect(core.groupBySubject()).toHaveLength(0)
    })
  })

  describe('filterBookmarked', () => {
    it('ブックマーク済みの付箋のみ返す', () => {
      const notes = [
        makeNote({ id: 'n1' }),
        makeNote({ id: 'n2' }),
        makeNote({ id: 'n3' }),
      ]
      const core = new FusenLibraryCore(notes)
      const result = core.filterBookmarked(new Set(['n1', 'n3']))
      expect(result).toHaveLength(2)
      expect(result.map(n => n.id)).toEqual(['n1', 'n3'])
    })

    it('ブックマークなしの場合は空配列', () => {
      const core = new FusenLibraryCore([makeNote({ id: 'n1' })])
      expect(core.filterBookmarked(new Set())).toHaveLength(0)
    })
  })

  describe('getRelatedQuestionIds', () => {
    it('linkedQuestionIds をフォールバックとして返す（exemplarIds なし）', () => {
      const note = makeNote({ linkedQuestionIds: ['r100-001', 'r101-002'] })
      const result = FusenLibraryCore.getRelatedQuestionIds(note)
      expect(result).toEqual(['r100-001', 'r101-002'])
    })

    it('exemplarIds が空配列の場合も linkedQuestionIds にフォールバック', () => {
      const note = makeNote({ exemplarIds: [], linkedQuestionIds: ['r100-001'] })
      const result = FusenLibraryCore.getRelatedQuestionIds(note)
      expect(result).toEqual(['r100-001'])
    })
  })

  describe('getImportanceBadge', () => {
    it('10問以上は 🔥', () => {
      expect(FusenLibraryCore.getImportanceBadge(12)).toEqual({ emoji: '🔥', count: 12 })
    })
    it('5問以上は 📊', () => {
      expect(FusenLibraryCore.getImportanceBadge(7)).toEqual({ emoji: '📊', count: 7 })
    })
    it('1-4問は 📝', () => {
      expect(FusenLibraryCore.getImportanceBadge(3)).toEqual({ emoji: '📝', count: 3 })
    })
    it('0問は null', () => {
      expect(FusenLibraryCore.getImportanceBadge(0)).toBeNull()
    })
  })

  describe('sortByImportance', () => {
    it('importance 降順でソート', () => {
      const notes = [
        makeNote({ id: 'low', importance: 1 }),
        makeNote({ id: 'high', importance: 10 }),
        makeNote({ id: 'mid', importance: 5 }),
      ]
      const core = new FusenLibraryCore(notes)
      const sorted = core.sortByImportance()
      expect(sorted.map(n => n.id)).toEqual(['high', 'mid', 'low'])
    })
  })

  describe('getFusenById', () => {
    it('存在するIDで付箋を返す', () => {
      const notes = [
        makeNote({ id: 'n1', title: '付箋1' }),
        makeNote({ id: 'n2', title: '付箋2' }),
      ]
      const core = new FusenLibraryCore(notes)
      const result = core.getFusenById('n2')
      expect(result).toBeDefined()
      expect(result!.title).toBe('付箋2')
    })

    it('存在しないIDで undefined を返す', () => {
      const core = new FusenLibraryCore([makeNote({ id: 'n1' })])
      expect(core.getFusenById('nonexistent')).toBeUndefined()
    })
  })
})
