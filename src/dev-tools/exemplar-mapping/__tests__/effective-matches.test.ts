import { describe, it, expect } from 'vitest'
import { getEffectiveMatches } from '../utils/effective-matches'
import type { NoteExemplarMatch } from '../../../types/note-exemplar-mapping'
import type { AddedMatch } from '../types'

function makeMatch(exemplarId: string, opts?: Partial<NoteExemplarMatch>): NoteExemplarMatch {
  return {
    exemplarId,
    isPrimary: false,
    confidence: 0.8,
    reasoning: 'test',
    status: 'pending',
    ...opts,
  }
}

const validIds = new Set(['ex-001', 'ex-002', 'ex-003', 'ex-004', 'ex-005'])

describe('getEffectiveMatches', () => {
  it('original のみ（added なし）→ そのまま返す', () => {
    const original = [makeMatch('ex-001'), makeMatch('ex-002')]
    const result = getEffectiveMatches(original, {}, {}, {}, 'on-001', validIds)
    expect(result).toHaveLength(2)
    expect(result[0].exemplarId).toBe('ex-001')
    expect(result[1].exemplarId).toBe('ex-002')
  })

  it('original + added のマージ', () => {
    const original = [makeMatch('ex-001')]
    const added: Record<string, AddedMatch> = {
      'on-001:ex-003': { isPrimary: false, source: 'manual', reasoning: '手動追加' },
    }
    const result = getEffectiveMatches(original, added, {}, {}, 'on-001', validIds)
    expect(result).toHaveLength(2)
    expect(result[0].exemplarId).toBe('ex-001')
    expect(result[1].exemplarId).toBe('ex-003')
    expect(result[1].confidence).toBe(0)
    expect(result[1].reasoning).toBe('手動追加')
    expect(result[1].status).toBe('pending')
  })

  it('別の noteId の addedMatches は無視する', () => {
    const original = [makeMatch('ex-001')]
    const added: Record<string, AddedMatch> = {
      'on-002:ex-003': { isPrimary: false, source: 'manual', reasoning: '手動追加' },
    }
    const result = getEffectiveMatches(original, added, {}, {}, 'on-001', validIds)
    expect(result).toHaveLength(1)
  })

  it('dedupe: original 優先で added を捨てる', () => {
    const original = [makeMatch('ex-001', { confidence: 0.85 })]
    const added: Record<string, AddedMatch> = {
      'on-001:ex-001': { isPrimary: true, source: 'manual', reasoning: '手動追加' },
    }
    const result = getEffectiveMatches(original, added, {}, {}, 'on-001', validIds)
    expect(result).toHaveLength(1)
    expect(result[0].confidence).toBe(0.85)
  })

  it('stale exemplarId を除外', () => {
    const original = [makeMatch('ex-001'), makeMatch('ex-STALE')]
    const result = getEffectiveMatches(original, {}, {}, {}, 'on-001', validIds)
    expect(result).toHaveLength(1)
    expect(result[0].exemplarId).toBe('ex-001')
  })

  it('matchStatuses で status を上書き', () => {
    const original = [makeMatch('ex-001', { status: 'pending' })]
    const statuses = { 'on-001:ex-001': 'approved' as const }
    const result = getEffectiveMatches(original, {}, statuses, {}, 'on-001', validIds)
    expect(result[0].status).toBe('approved')
  })

  it('primaryOverrides で isPrimary を上書き', () => {
    const original = [makeMatch('ex-001', { isPrimary: false })]
    const overrides = { 'on-001:ex-001': true }
    const result = getEffectiveMatches(original, {}, {}, overrides, 'on-001', validIds)
    expect(result[0].isPrimary).toBe(true)
  })

  it('Primary 1件以下に正規化（複数あれば先頭のみ）', () => {
    const original = [
      makeMatch('ex-001', { isPrimary: true }),
      makeMatch('ex-002', { isPrimary: true }),
      makeMatch('ex-003', { isPrimary: false }),
    ]
    const result = getEffectiveMatches(original, {}, {}, {}, 'on-001', validIds)
    const primaries = result.filter(m => m.isPrimary)
    expect(primaries).toHaveLength(1)
    expect(primaries[0].exemplarId).toBe('ex-001')
  })

  it('reset 後は original のみに戻る（added + overrides が空）', () => {
    const original = [makeMatch('ex-001')]
    const result = getEffectiveMatches(original, {}, {}, {}, 'on-001', validIds)
    expect(result).toHaveLength(1)
    expect(result[0].exemplarId).toBe('ex-001')
    expect(result[0].status).toBe('pending')
  })

  it('added の status は pending だが matchStatuses で approved に上書きされる', () => {
    const added: Record<string, AddedMatch> = {
      'on-001:ex-003': { isPrimary: false, source: 'manual', reasoning: '手動追加' },
    }
    const statuses = { 'on-001:ex-003': 'approved' as const }
    const result = getEffectiveMatches([], added, statuses, {}, 'on-001', validIds)
    expect(result[0].status).toBe('approved')
  })

  it('original に Primary がいる状態で added を Primary 追加 → 先頭のみ Primary', () => {
    const original = [makeMatch('ex-001', { isPrimary: true })]
    const added: Record<string, AddedMatch> = {
      'on-001:ex-003': { isPrimary: true, source: 'manual', reasoning: '手動追加' },
    }
    const result = getEffectiveMatches(original, added, {}, {}, 'on-001', validIds)
    expect(result).toHaveLength(2)
    const primaries = result.filter(m => m.isPrimary)
    expect(primaries).toHaveLength(1)
    expect(primaries[0].exemplarId).toBe('ex-001')
  })

  it('added に対する primaryOverrides が効く', () => {
    const added: Record<string, AddedMatch> = {
      'on-001:ex-003': { isPrimary: false, source: 'manual', reasoning: '手動追加' },
    }
    const overrides = { 'on-001:ex-003': true }
    const result = getEffectiveMatches([], added, {}, overrides, 'on-001', validIds)
    expect(result[0].isPrimary).toBe(true)
  })

  it('stale な addedMatch に override/status があっても結果に混ざらない', () => {
    const added: Record<string, AddedMatch> = {
      'on-001:ex-STALE': { isPrimary: true, source: 'manual', reasoning: '手動追加' },
    }
    const statuses = { 'on-001:ex-STALE': 'approved' as const }
    const overrides = { 'on-001:ex-STALE': true }
    const result = getEffectiveMatches([], added, statuses, overrides, 'on-001', validIds)
    expect(result).toHaveLength(0)
  })
})
