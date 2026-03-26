import { describe, it, expect } from 'vitest'
import { migrateState } from '../hooks/useMappingReviewState'

describe('migrateState (v1 → v2)', () => {
  it('v1 state に addedMatches: {} を補完する', () => {
    const v1 = {
      version: 1 as const,
      matchStatuses: { 'on-001:ex-001': 'approved' as const },
      primaryOverrides: {},
      entryStatuses: {},
      lastPosition: 'on-001',
      updatedAt: '2026-03-26T00:00:00.000Z',
    }
    const result = migrateState(v1 as any)
    expect(result.addedMatches).toEqual({})
    expect(result.matchStatuses).toEqual(v1.matchStatuses)
    expect(result.lastPosition).toBe('on-001')
  })

  it('v2 state はそのまま返す', () => {
    const v2 = {
      version: 2 as const,
      matchStatuses: {},
      primaryOverrides: {},
      entryStatuses: {},
      addedMatches: { 'on-001:ex-003': { isPrimary: false, source: 'manual' as const, reasoning: '手動追加' as const } },
      lastPosition: '',
      updatedAt: '2026-03-26T00:00:00.000Z',
    }
    const result = migrateState(v2 as any)
    expect(result.addedMatches).toEqual(v2.addedMatches)
  })
})
