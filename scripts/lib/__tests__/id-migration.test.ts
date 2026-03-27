import { describe, it, expect } from 'vitest'
import {
  ON_TO_FUSEN_MAP,
  FUSEN_TO_ON_MAP,
  onIdToFusenId,
  fusenIdToOnId,
} from '../id-migration'

// --- ON_TO_FUSEN_MAP ---
describe('ON_TO_FUSEN_MAP', () => {
  it('対応表が23件ある', () => {
    expect(Object.keys(ON_TO_FUSEN_MAP)).toHaveLength(23)
  })

  it('全てのキーが on-NNN 形式', () => {
    for (const key of Object.keys(ON_TO_FUSEN_MAP)) {
      expect(key).toMatch(/^on-\d{3}$/)
    }
  })

  it('全ての値が fusen-NNNN 形式', () => {
    for (const value of Object.values(ON_TO_FUSEN_MAP)) {
      expect(value).toMatch(/^fusen-\d{4}$/)
    }
  })

  it('全てのon-IDがユニークなfusen-IDにマッピングされている', () => {
    const fusenIds = Object.values(ON_TO_FUSEN_MAP)
    const uniqueIds = new Set(fusenIds)
    expect(uniqueIds.size).toBe(fusenIds.length)
  })
})

// --- FUSEN_TO_ON_MAP ---
describe('FUSEN_TO_ON_MAP', () => {
  it('逆引き表も23件ある', () => {
    expect(Object.keys(FUSEN_TO_ON_MAP)).toHaveLength(23)
  })

  it('ON_TO_FUSEN_MAP の逆引きと一致する', () => {
    for (const [onId, fusenId] of Object.entries(ON_TO_FUSEN_MAP)) {
      expect(FUSEN_TO_ON_MAP[fusenId]).toBe(onId)
    }
  })
})

// --- onIdToFusenId ---
describe('onIdToFusenId', () => {
  it('on-001 → fusen-0001 に変換できる', () => {
    expect(onIdToFusenId('on-001')).toBe('fusen-0001')
  })

  it('on-023 → fusen-0023 に変換できる', () => {
    expect(onIdToFusenId('on-023')).toBe('fusen-0023')
  })

  it('未知のIDはそのまま返す', () => {
    expect(onIdToFusenId('on-999')).toBe('on-999')
    expect(onIdToFusenId('unknown')).toBe('unknown')
  })

  it('fusen-NNNN 形式はそのまま返す（変換不要）', () => {
    expect(onIdToFusenId('fusen-0500')).toBe('fusen-0500')
  })
})

// --- fusenIdToOnId ---
describe('fusenIdToOnId', () => {
  it('fusen-0001 → on-001 に逆変換できる', () => {
    expect(fusenIdToOnId('fusen-0001')).toBe('on-001')
  })

  it('fusen-0023 → on-023 に逆変換できる', () => {
    expect(fusenIdToOnId('fusen-0023')).toBe('on-023')
  })

  it('対応表に無いfusen-IDはそのまま返す', () => {
    expect(fusenIdToOnId('fusen-0500')).toBe('fusen-0500')
    expect(fusenIdToOnId('fusen-1642')).toBe('fusen-1642')
  })

  it('on-NNN 形式はそのまま返す（変換不要）', () => {
    expect(fusenIdToOnId('on-001')).toBe('on-001')
  })
})

// --- 双方向整合性 ---
describe('双方向整合性', () => {
  it('全てのon-IDで on→fusen→on のラウンドトリップが成立する', () => {
    for (const onId of Object.keys(ON_TO_FUSEN_MAP)) {
      const fusenId = onIdToFusenId(onId)
      const roundTripped = fusenIdToOnId(fusenId)
      expect(roundTripped).toBe(onId)
    }
  })
})
