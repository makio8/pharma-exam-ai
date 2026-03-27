import { describe, it, expect } from 'vitest'
import {
  isValidBbox,
  bboxToExtract,
  noteFileName,
  noteRelativePath,
} from '../crop-annotation-core'

// --- isValidBbox ---
describe('isValidBbox', () => {
  it('accepts valid bbox [y1, x1, y2, x2]', () => {
    expect(isValidBbox([100, 200, 500, 800])).toBe(true)
    expect(isValidBbox([0, 0, 1000, 1000])).toBe(true)
    expect(isValidBbox([77, 154, 188, 509])).toBe(true) // 実データ
  })

  it('rejects non-array', () => {
    expect(isValidBbox(null)).toBe(false)
    expect(isValidBbox(undefined)).toBe(false)
    expect(isValidBbox('100,200,500,800')).toBe(false)
    expect(isValidBbox({})).toBe(false)
  })

  it('rejects wrong length', () => {
    expect(isValidBbox([100, 200, 500])).toBe(false)
    expect(isValidBbox([100, 200, 500, 800, 900])).toBe(false)
    expect(isValidBbox([])).toBe(false)
  })

  it('rejects out-of-range values', () => {
    expect(isValidBbox([-1, 200, 500, 800])).toBe(false)
    expect(isValidBbox([100, 200, 500, 1001])).toBe(false)
  })

  it('rejects inverted coordinates (y1 >= y2 or x1 >= x2)', () => {
    expect(isValidBbox([500, 200, 100, 800])).toBe(false)  // y1 > y2
    expect(isValidBbox([100, 800, 500, 200])).toBe(false)  // x1 > x2
    expect(isValidBbox([500, 200, 500, 800])).toBe(false)  // y1 == y2
    expect(isValidBbox([100, 800, 500, 800])).toBe(false)  // x1 == x2
  })

  it('rejects NaN', () => {
    expect(isValidBbox([NaN, 200, 500, 800])).toBe(false)
  })
})

// --- bboxToExtract ---
describe('bboxToExtract', () => {
  const W = 2000 // 画像幅
  const H = 3000 // 画像高さ

  it('converts normalized bbox to pixel extract region', () => {
    // bbox: y1=100, x1=200, y2=500, x2=800
    // y1=100/1000*3000=300, x1=200/1000*2000=400
    // y2=500/1000*3000=1500, x2=800/1000*2000=1600
    // padding=10 → left=390, top=290, right=1610, bottom=1510
    const result = bboxToExtract([100, 200, 500, 800], W, H)
    expect(result).not.toBeNull()
    expect(result!.left).toBe(390)
    expect(result!.top).toBe(290)
    expect(result!.width).toBe(1220)  // 1610-390
    expect(result!.height).toBe(1220) // 1510-290
  })

  it('clamps to image boundaries with padding', () => {
    // bbox near top-left corner
    const result = bboxToExtract([0, 0, 100, 100], W, H)
    expect(result).not.toBeNull()
    expect(result!.left).toBe(0)   // max(0, 0-10) = 0
    expect(result!.top).toBe(0)    // max(0, 0-10) = 0
  })

  it('clamps to image boundaries at bottom-right', () => {
    const result = bboxToExtract([900, 900, 1000, 1000], W, H)
    expect(result).not.toBeNull()
    expect(result!.left + result!.width).toBeLessThanOrEqual(W)
    expect(result!.top + result!.height).toBeLessThanOrEqual(H)
  })

  it('returns null for too-small bbox', () => {
    // 1px x 1px region → after scaling, likely < 30px
    const result = bboxToExtract([500, 500, 501, 501], W, H)
    expect(result).toBeNull()
  })

  it('respects custom padding', () => {
    const noPad = bboxToExtract([100, 200, 500, 800], W, H, 0)
    const bigPad = bboxToExtract([100, 200, 500, 800], W, H, 50)
    expect(noPad).not.toBeNull()
    expect(bigPad).not.toBeNull()
    // bigger padding → larger region
    expect(bigPad!.width).toBeGreaterThan(noPad!.width)
    expect(bigPad!.height).toBeGreaterThan(noPad!.height)
  })

  it('handles real annotation data from page-001-left', () => {
    // 実データ: 分割画像は約1650x2330px想定（300dpi A4）
    const imgW = 1650
    const imgH = 2330
    // bbox: [77, 154, 188, 509] from user's annotation
    const result = bboxToExtract([77, 154, 188, 509], imgW, imgH)
    expect(result).not.toBeNull()
    expect(result!.left).toBeGreaterThanOrEqual(0)
    expect(result!.top).toBeGreaterThanOrEqual(0)
    expect(result!.width).toBeGreaterThan(MIN_SIZE)
    expect(result!.height).toBeGreaterThan(MIN_SIZE)
  })
})

const MIN_SIZE = 30

// --- noteFileName ---
describe('noteFileName', () => {
  it('generates zero-padded filename', () => {
    expect(noteFileName(0)).toBe('note-01.png')
    expect(noteFileName(1)).toBe('note-02.png')
    expect(noteFileName(9)).toBe('note-10.png')
    expect(noteFileName(99)).toBe('note-100.png')
  })
})

// --- noteRelativePath ---
describe('noteRelativePath', () => {
  it('combines pageId and noteIndex', () => {
    expect(noteRelativePath('page-001-left', 0)).toBe('page-001-left/note-01.png')
    expect(noteRelativePath('page-003-right', 5)).toBe('page-003-right/note-06.png')
  })
})
