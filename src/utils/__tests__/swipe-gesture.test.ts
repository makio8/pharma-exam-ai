// src/utils/__tests__/swipe-gesture.test.ts
import { describe, it, expect } from 'vitest'
import {
  evaluateSwipe,
  calculateSwipeProgress,
  isDiagonalSwipe,
  calculateRotation,
} from '../swipe-gesture'

describe('evaluateSwipe', () => {
  it('右スワイプ超過 (150px / 375px = 40% > 30%) → "right"', () => {
    expect(evaluateSwipe(150, 375)).toBe('right')
  })

  it('左スワイプ超過 (-150px / 375px) → "left"', () => {
    expect(evaluateSwipe(-150, 375)).toBe('left')
  })

  it('閾値内 (50px / 375px = 13%) → "none"', () => {
    expect(evaluateSwipe(50, 375)).toBe('none')
  })

  it('ゼロ → "none"', () => {
    expect(evaluateSwipe(0, 375)).toBe('none')
  })

  it('containerWidth=0 のガード → "none"', () => {
    expect(evaluateSwipe(150, 0)).toBe('none')
  })
})

describe('calculateSwipeProgress', () => {
  const W = 375
  const threshold = W * 0.3 // 112.5px

  it('offsetX=0 のとき progress=0', () => {
    expect(calculateSwipeProgress(0, W)).toBe(0)
  })

  it('閾値の半分 (56.25px) のとき progress ≈ 0.5', () => {
    expect(calculateSwipeProgress(threshold / 2, W)).toBeCloseTo(0.5)
  })

  it('閾値ちょうど (112.5px) のとき progress=1.0', () => {
    expect(calculateSwipeProgress(threshold, W)).toBeCloseTo(1.0)
  })

  it('閾値超過 (200px) でも progress は 1 にキャップされる', () => {
    expect(calculateSwipeProgress(200, W)).toBe(1)
  })

  it('負のoffset でも絶対値で計算される', () => {
    expect(calculateSwipeProgress(-threshold, W)).toBeCloseTo(1.0)
  })

  it('containerWidth=0 のガード → 0', () => {
    expect(calculateSwipeProgress(150, 0)).toBe(0)
  })
})

describe('isDiagonalSwipe', () => {
  it('|deltaX|=100, |deltaY|=30 → false (横スワイプ優勢)', () => {
    expect(isDiagonalSwipe(100, 30)).toBe(false)
  })

  it('|deltaX|=50, |deltaY|=40 → true (スクロール意図)', () => {
    expect(isDiagonalSwipe(50, 40)).toBe(true)
  })
})

describe('calculateRotation', () => {
  it('正のoffset → 正の角度', () => {
    expect(calculateRotation(100, 375)).toBeGreaterThan(0)
  })

  it('負のoffset → 負の角度', () => {
    expect(calculateRotation(-100, 375)).toBeLessThan(0)
  })

  it('containerWidth=0 のガード → 0', () => {
    expect(calculateRotation(150, 0)).toBe(0)
  })
})
