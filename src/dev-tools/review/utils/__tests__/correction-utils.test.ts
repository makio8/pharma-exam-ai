import { describe, it, expect } from 'vitest'
import { replaceCorrections, removeCorrection, getEffectiveText } from '../correction-utils'
import type { Correction } from '../../types'

describe('replaceCorrections', () => {
  it('同じ type+field の text correction を置換する', () => {
    const existing: Correction[] = [
      { type: 'text', field: 'question_text', value: '旧テキスト' },
    ]
    const result = replaceCorrections(existing, [
      { type: 'text', field: 'question_text', value: '新テキスト' },
    ])
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ type: 'text', field: 'question_text', value: '新テキスト' })
  })

  it('異なる field は追加される', () => {
    const existing: Correction[] = [
      { type: 'text', field: 'question_text', value: 'テキスト' },
    ]
    const result = replaceCorrections(existing, [
      { type: 'text', field: 'explanation', value: '解説' },
    ])
    expect(result).toHaveLength(2)
  })

  it('multi-image-crop は target で置換を判定', () => {
    const crop = { x: 0, y: 0, w: 1, h: 1, viewportWidth: 800, viewportHeight: 1130, scale: 1.5, rotation: 0 as const }
    const existing: Correction[] = [
      { type: 'multi-image-crop', target: 'scenario', images: [{ id: 1, crop, pdfFile: 'a.pdf', pdfPage: 1 }] },
    ]
    const result = replaceCorrections(existing, [
      { type: 'multi-image-crop', target: 'scenario', images: [] },
    ])
    expect(result).toHaveLength(1)
    expect(result[0].type === 'multi-image-crop' && result[0].images).toEqual([])
  })

  it('異なる target の multi-image-crop は追加される', () => {
    const crop = { x: 0, y: 0, w: 1, h: 1, viewportWidth: 800, viewportHeight: 1130, scale: 1.5, rotation: 0 as const }
    const existing: Correction[] = [
      { type: 'multi-image-crop', target: 'question', images: [{ id: 1, crop, pdfFile: 'a.pdf', pdfPage: 1 }] },
    ]
    const result = replaceCorrections(existing, [
      { type: 'multi-image-crop', target: 'scenario', images: [] },
    ])
    expect(result).toHaveLength(2)
  })

  it('空の existing に追加', () => {
    const result = replaceCorrections([], [
      { type: 'text', field: 'question_text', value: '新テキスト' },
    ])
    expect(result).toHaveLength(1)
  })

  it('既存 corrections を変更しない（イミュータブル）', () => {
    const existing: Correction[] = [
      { type: 'text', field: 'question_text', value: '旧テキスト' },
    ]
    const original = [...existing]
    replaceCorrections(existing, [
      { type: 'text', field: 'question_text', value: '新テキスト' },
    ])
    expect(existing).toEqual(original)
  })
})

describe('removeCorrection', () => {
  it('type で除去', () => {
    const existing: Correction[] = [
      { type: 'text', field: 'question_text', value: 'テキスト' },
      { type: 'image-remove' },
    ]
    const result = removeCorrection(existing, 'image-remove')
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('text')
  })

  it('type + target で除去', () => {
    const crop = { x: 0, y: 0, w: 1, h: 1, viewportWidth: 800, viewportHeight: 1130, scale: 1.5, rotation: 0 as const }
    const existing: Correction[] = [
      { type: 'multi-image-crop', target: 'question', images: [{ id: 1, crop, pdfFile: 'a.pdf', pdfPage: 1 }] },
      { type: 'multi-image-crop', target: 'scenario', images: [] },
    ]
    const result = removeCorrection(existing, 'multi-image-crop', 'question')
    expect(result).toHaveLength(1)
    expect(result[0].type === 'multi-image-crop' && result[0].target).toBe('scenario')
  })
})

describe('getEffectiveText', () => {
  it('correction があればその値を返す', () => {
    const corrections: Correction[] = [
      { type: 'text', field: 'question_text', value: '修正後' },
    ]
    expect(getEffectiveText(corrections, 'question_text', '元テキスト')).toBe('修正後')
  })

  it('correction がなければ元値を返す', () => {
    expect(getEffectiveText([], 'question_text', '元テキスト')).toBe('元テキスト')
  })

  it('異なる field の correction は無視', () => {
    const corrections: Correction[] = [
      { type: 'text', field: 'explanation', value: '解説修正' },
    ]
    expect(getEffectiveText(corrections, 'question_text', '元テキスト')).toBe('元テキスト')
  })
})
