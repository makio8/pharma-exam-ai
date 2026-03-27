import { describe, it, expect } from 'vitest'
import {
  parseGeminiResponse,
  mergeNoteResult,
  filterUnprocessed,
} from '../ocr-cropped-core'
import type { CropNote } from '../crop-annotation-core'
import type { CropOcrNote } from '../ocr-cropped-core'

// --- parseGeminiResponse ---
describe('parseGeminiResponse', () => {
  it('parses valid JSON object', () => {
    const text = '{"title":"SI基本単位","body":"Cd n A K s mol kg","subject":"物理","note_type":"mnemonic","tags":["SI単位"]}'
    const result = parseGeminiResponse(text)
    expect(result).not.toBeNull()
    expect(result!.title).toBe('SI基本単位')
    expect(result!.note_type).toBe('mnemonic')
    expect(result!.tags).toEqual(['SI単位'])
  })

  it('extracts JSON from markdown code block', () => {
    const text = '```json\n{"title":"テスト","body":"本文","subject":"化学","note_type":"knowledge","tags":[]}\n```'
    const result = parseGeminiResponse(text)
    expect(result).not.toBeNull()
    expect(result!.title).toBe('テスト')
  })

  it('extracts JSON with surrounding text', () => {
    const text = 'Here is the result:\n{"title":"力","body":"N = kg・m・s⁻²","subject":"物理","note_type":"knowledge","tags":["力"]}\nDone.'
    const result = parseGeminiResponse(text)
    expect(result).not.toBeNull()
    expect(result!.title).toBe('力')
  })

  it('returns null for empty input', () => {
    expect(parseGeminiResponse('')).toBeNull()
    expect(parseGeminiResponse('   ')).toBeNull()
  })

  it('returns null for invalid JSON', () => {
    expect(parseGeminiResponse('not json at all')).toBeNull()
    expect(parseGeminiResponse('{broken')).toBeNull()
  })

  it('handles multiline body with \\n', () => {
    const text = '{"title":"単位換算","body":"1Pa = N/m²\\n1atm = 101325 Pa","subject":"物理","note_type":"mnemonic","tags":[]}'
    const result = parseGeminiResponse(text)
    expect(result).not.toBeNull()
    expect(result!.body).toContain('\n')
  })
})

// --- mergeNoteResult ---
describe('mergeNoteResult', () => {
  const cropNote: CropNote = {
    pageId: 'page-001-left',
    spreadPage: 1,
    side: 'left',
    noteIndex: 0,
    bbox: [77, 154, 188, 509],
    imageFile: 'page-001-left/note-01.png',
    cropSize: { width: 608, height: 280 },
  }

  it('merges crop metadata with OCR result', () => {
    const result = mergeNoteResult(cropNote, {
      title: 'SI基本単位',
      body: 'Cd n A K s mol kg',
      subject: '物理',
      note_type: 'mnemonic',
      tags: ['SI単位', '語呂合わせ'],
    })
    expect(result.pageId).toBe('page-001-left')
    expect(result.spreadPage).toBe(1)
    expect(result.side).toBe('left')
    expect(result.noteIndex).toBe(0)
    expect(result.bbox).toEqual([77, 154, 188, 509])
    expect(result.imageFile).toBe('page-001-left/note-01.png')
    expect(result.title).toBe('SI基本単位')
    expect(result.body).toBe('Cd n A K s mol kg')
    expect(result.noteType).toBe('mnemonic')
  })

  it('uses defaults for missing OCR fields', () => {
    const result = mergeNoteResult(cropNote, {
      title: '',
      body: '',
      subject: '',
      note_type: '',
      tags: [],
    })
    expect(result.title).toBe('(無題)')
    expect(result.subject).toBe('物理')
    expect(result.noteType).toBe('knowledge')
  })
})

// --- filterUnprocessed ---
describe('filterUnprocessed', () => {
  const notes: CropNote[] = [
    { pageId: 'page-001-left', spreadPage: 1, side: 'left', noteIndex: 0, bbox: [0, 0, 100, 100], imageFile: 'a.png', cropSize: { width: 100, height: 100 } },
    { pageId: 'page-001-left', spreadPage: 1, side: 'left', noteIndex: 1, bbox: [0, 0, 100, 100], imageFile: 'b.png', cropSize: { width: 100, height: 100 } },
    { pageId: 'page-001-right', spreadPage: 1, side: 'right', noteIndex: 0, bbox: [0, 0, 100, 100], imageFile: 'c.png', cropSize: { width: 100, height: 100 } },
  ]

  it('returns all when no existing results', () => {
    expect(filterUnprocessed(notes, []).length).toBe(3)
  })

  it('excludes already processed notes', () => {
    const existing: CropOcrNote[] = [{
      pageId: 'page-001-left', spreadPage: 1, side: 'left', noteIndex: 0,
      bbox: [0, 0, 100, 100], imageFile: 'a.png',
      title: 'test', body: '', subject: '物理', noteType: 'knowledge', tags: [],
    }]
    const result = filterUnprocessed(notes, existing)
    expect(result.length).toBe(2)
    expect(result[0].imageFile).toBe('b.png')
    expect(result[1].imageFile).toBe('c.png')
  })

  it('returns empty when all processed', () => {
    const existing: CropOcrNote[] = notes.map(n => ({
      ...n, title: '', body: '', subject: '物理', noteType: 'knowledge', tags: [],
    }))
    expect(filterUnprocessed(notes, existing).length).toBe(0)
  })
})
