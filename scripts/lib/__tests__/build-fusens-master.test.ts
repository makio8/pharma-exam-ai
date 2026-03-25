import { describe, it, expect } from 'vitest'
import { normalizeSubject } from '../normalize-subject'
import { ocrToMaster, generateFingerprint, getNextId } from '../fusens-master-core'
import type { OcrPageResult } from '../fusens-master-types'

// --- normalizeSubject ---
describe('normalizeSubject', () => {
  it('returns valid subject as-is', () => {
    expect(normalizeSubject('薬理')).toBe('薬理')
    expect(normalizeSubject('病態・薬物治療')).toBe('病態・薬物治療')
  })

  it('takes first subject from pipe-separated', () => {
    expect(normalizeSubject('物理|化学')).toBe('物理')
    expect(normalizeSubject('物理|薬剤')).toBe('物理')
  })

  it('falls back to 物理 for invalid subject', () => {
    expect(normalizeSubject('unknown')).toBe('物理')
    expect(normalizeSubject('')).toBe('物理')
  })
})

// --- generateFingerprint ---
describe('generateFingerprint', () => {
  it('creates consistent fingerprint from source fields', () => {
    expect(generateFingerprint('test.pdf', 1, 0)).toBe('test.pdf:1:0')
    expect(generateFingerprint('test.pdf', 10, 3)).toBe('test.pdf:10:3')
  })
})

// --- getNextId ---
describe('getNextId', () => {
  it('returns fusen-001 for empty master', () => {
    expect(getNextId({})).toBe('fusen-001')
  })
  it('increments from highest existing ID', () => {
    expect(getNextId({ 'fusen-003': {} as any, 'fusen-001': {} as any })).toBe('fusen-004')
  })
  it('handles IDs over 999', () => {
    expect(getNextId({ 'fusen-999': {} as any })).toBe('fusen-1000')
  })
  it('ignores malformed IDs (NaN guard)', () => {
    expect(getNextId({ 'fusen-abc': {} as any, 'fusen-003': {} as any })).toBe('fusen-004')
  })
  it('returns fusen-001 when all IDs are malformed', () => {
    expect(getNextId({ 'bad-key': {} as any })).toBe('fusen-001')
  })
})

// --- ocrToMaster ---
describe('ocrToMaster', () => {
  const sampleOcr: OcrPageResult[] = [
    {
      page: 1,
      notes: [
        {
          title: 'SI基本単位',
          body: 'Cd n A K s mol kg',
          subject: '物理',
          note_type: 'mnemonic',
          tags: ['SI単位'],
          bbox: [88, 56, 200, 305],
          imageFile: 'page-001/note-01.png',
        },
        {
          title: 'ppm換算',
          body: 'ppm = mg/L',
          subject: '物理|薬剤',
          note_type: 'knowledge',
          tags: ['ppm'],
          bbox: [210, 320, 320, 580],
          imageFile: 'page-001/note-02.png',
        },
      ],
    },
    { page: 2, notes: [] },
  ]

  it('converts OCR pages to master with stable IDs', () => {
    const master = ocrToMaster(sampleOcr, 'test.pdf')
    const fusens = Object.values(master.fusens)
    expect(fusens).toHaveLength(2)
    expect(fusens[0].id).toBe('fusen-001')
    expect(fusens[1].id).toBe('fusen-002')
  })

  it('normalizes pipe-separated subject', () => {
    const master = ocrToMaster(sampleOcr, 'test.pdf')
    expect(master.fusens['fusen-002'].subject).toBe('物理')
  })

  it('sets source fingerprint correctly', () => {
    const master = ocrToMaster(sampleOcr, 'test.pdf')
    const f = master.fusens['fusen-001']
    expect(f.source.pdf).toBe('test.pdf')
    expect(f.source.page).toBe(1)
    expect(f.source.noteIndex).toBe(0)
  })

  it('skips empty pages', () => {
    const master = ocrToMaster(sampleOcr, 'test.pdf')
    expect(Object.keys(master.fusens)).toHaveLength(2)
  })

  it('defaults topicId to null and status to draft', () => {
    const master = ocrToMaster(sampleOcr, 'test.pdf')
    const f = master.fusens['fusen-001']
    expect(f.topicId).toBeNull()
    expect(f.status).toBe('draft')
    expect(f.importance).toBe(0)
    expect(f.tier).toBe('free')
  })

  it('maps note_type to noteType', () => {
    const master = ocrToMaster(sampleOcr, 'test.pdf')
    expect(master.fusens['fusen-001'].noteType).toBe('mnemonic')
    expect(master.fusens['fusen-002'].noteType).toBe('knowledge')
  })

  it('sets version to 1', () => {
    const master = ocrToMaster(sampleOcr, 'test.pdf')
    expect(master.version).toBe(1)
  })
})

// --- merge ---
describe('ocrToMaster merge', () => {
  const page1: OcrPageResult[] = [
    { page: 1, notes: [
      { title: 'A', body: 'body-a', subject: '物理', note_type: 'knowledge', tags: [], bbox: [0, 0, 100, 100], imageFile: 'p1/n1.png' },
    ]},
  ]
  const page2: OcrPageResult[] = [
    { page: 1, notes: [
      { title: 'A', body: 'body-a', subject: '物理', note_type: 'knowledge', tags: [], bbox: [0, 0, 100, 100], imageFile: 'p1/n1.png' },
    ]},
    { page: 2, notes: [
      { title: 'B', body: 'body-b', subject: '化学', note_type: 'mnemonic', tags: [], bbox: [0, 0, 100, 100], imageFile: 'p2/n1.png' },
    ]},
  ]

  it('skips already-imported notes on merge (same fingerprint)', () => {
    const initial = ocrToMaster(page1, 'test.pdf')
    expect(Object.keys(initial.fusens)).toHaveLength(1)

    const merged = ocrToMaster(page2, 'test.pdf', initial)
    expect(Object.keys(merged.fusens)).toHaveLength(2)
    expect(merged.fusens['fusen-001'].title).toBe('A')
    expect(merged.fusens['fusen-002'].title).toBe('B')
  })

  it('does not overwrite existing fusens', () => {
    const initial = ocrToMaster(page1, 'test.pdf')
    initial.fusens['fusen-001'].title = 'Modified'
    const merged = ocrToMaster(page2, 'test.pdf', initial)
    expect(merged.fusens['fusen-001'].title).toBe('Modified')
  })

  it('is idempotent (running twice with same data adds nothing)', () => {
    const initial = ocrToMaster(page2, 'test.pdf')
    const count = Object.keys(initial.fusens).length
    const again = ocrToMaster(page2, 'test.pdf', initial)
    expect(Object.keys(again.fusens)).toHaveLength(count)
  })
})
