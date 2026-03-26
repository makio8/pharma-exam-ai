import { describe, it, expect } from 'vitest'
import {
  parseTextWithImages,
  insertPlaceholder,
  removePlaceholder,
  validateImagePlaceholders,
  nextImageId,
} from '../placeholder-utils'
import type { CropImage, PdfCropRect } from '../../types'

const dummyCrop: PdfCropRect = {
  x: 0.1, y: 0.2, w: 0.3, h: 0.4,
  viewportWidth: 800, viewportHeight: 1130, scale: 1.5, rotation: 0,
}

function makeCropImage(id: number): CropImage {
  return { id, crop: dummyCrop, pdfFile: 'exam-108.pdf', pdfPage: 1 }
}

describe('parseTextWithImages', () => {
  it('テキストのみの場合は text ブロック1つ', () => {
    const result = parseTextWithImages('hello world', [])
    expect(result).toEqual([{ type: 'text', content: 'hello world' }])
  })

  it('プレースホルダー1つを含む場合', () => {
    const images = [makeCropImage(1)]
    const result = parseTextWithImages('前の文{{image:1}}後の文', images)
    expect(result).toEqual([
      { type: 'text', content: '前の文' },
      { type: 'image', imageId: 1 },
      { type: 'text', content: '後の文' },
    ])
  })

  it('複数のプレースホルダーを含む場合', () => {
    const images = [makeCropImage(1), makeCropImage(2)]
    const result = parseTextWithImages('A{{image:1}}B{{image:2}}C', images)
    expect(result).toEqual([
      { type: 'text', content: 'A' },
      { type: 'image', imageId: 1 },
      { type: 'text', content: 'B' },
      { type: 'image', imageId: 2 },
      { type: 'text', content: 'C' },
    ])
  })

  it('存在しない画像IDのプレースホルダーはテキストとして扱う', () => {
    const images = [makeCropImage(1)]
    const result = parseTextWithImages('前{{image:99}}後', images)
    expect(result).toEqual([
      { type: 'text', content: '前{{image:99}}後' },
    ])
  })

  it('空文字列の場合は空配列', () => {
    const result = parseTextWithImages('', [])
    expect(result).toEqual([])
  })
})

describe('insertPlaceholder', () => {
  it('カーソル位置（中間）に挿入', () => {
    const result = insertPlaceholder('abcdef', 3, 1)
    expect(result.text).toBe('abc{{image:1}}def')
    expect(result.newCursorPos).toBe(3 + '{{image:1}}'.length)
  })

  it('末尾に挿入', () => {
    const result = insertPlaceholder('abc', 3, 2)
    expect(result.text).toBe('abc{{image:2}}')
    expect(result.newCursorPos).toBe('abc{{image:2}}'.length)
  })

  it('先頭（位置0）に挿入', () => {
    const result = insertPlaceholder('abc', 0, 3)
    expect(result.text).toBe('{{image:3}}abc')
    expect(result.newCursorPos).toBe('{{image:3}}'.length)
  })
})

describe('removePlaceholder', () => {
  it('存在するプレースホルダーを削除', () => {
    const result = removePlaceholder('前の文{{image:1}}後の文', 1)
    expect(result).toBe('前の文後の文')
  })

  it('存在しないIDを削除しようとしても変化なし', () => {
    const result = removePlaceholder('前の文{{image:1}}後の文', 99)
    expect(result).toBe('前の文{{image:1}}後の文')
  })

  it('プレースホルダーが行単独の場合は改行を折りたたむ', () => {
    const result = removePlaceholder('前の行\n{{image:1}}\n後の行', 1)
    expect(result).toBe('前の行\n後の行')
  })

  it('同じIDが複数あるとき全て削除（GPT-5.4 P2-7修正）', () => {
    const result = removePlaceholder('A{{image:1}}B{{image:1}}C', 1)
    expect(result).toBe('ABC')
  })
})

describe('validateImagePlaceholders', () => {
  it('すべて OK の場合は空配列', () => {
    const images = [makeCropImage(1), makeCropImage(2)]
    const result = validateImagePlaceholders('{{image:1}}テキスト{{image:2}}', images)
    expect(result.orphanPlaceholders).toEqual([])
    expect(result.unreferencedImages).toEqual([])
  })

  it('孤立プレースホルダー（images に存在しない ID）を検出', () => {
    const images = [makeCropImage(1)]
    const result = validateImagePlaceholders('{{image:1}}{{image:99}}', images)
    expect(result.orphanPlaceholders).toContain(99)
    expect(result.unreferencedImages).toEqual([])
  })

  it('未参照画像（テキスト中に出現しない ID）を検出', () => {
    const images = [makeCropImage(1), makeCropImage(2)]
    const result = validateImagePlaceholders('{{image:1}}', images)
    expect(result.orphanPlaceholders).toEqual([])
    expect(result.unreferencedImages).toContain(2)
  })
})

describe('nextImageId', () => {
  it('空配列の場合は 1 を返す', () => {
    expect(nextImageId([])).toBe(1)
  })

  it('最大 ID + 1 を返す', () => {
    const images = [makeCropImage(3), makeCropImage(1), makeCropImage(5)]
    expect(nextImageId(images)).toBe(6)
  })
})
