// scripts/lib/fusens-master-core.ts
import type {
  Fusen, FusenMaster, NoteType, OcrPageResult,
} from './fusens-master-types'
import { normalizeSubject } from './normalize-subject'

const VALID_NOTE_TYPES: NoteType[] = [
  'knowledge', 'mnemonic', 'solution', 'caution', 'related', 'intuition',
]

export function normalizeNoteType(raw: string): NoteType {
  if (VALID_NOTE_TYPES.includes(raw as NoteType)) return raw as NoteType
  return 'knowledge'
}

/** source fingerprint: PDF名+ページ+noteIndex で同一ノートを識別 */
export function generateFingerprint(pdf: string, page: number, noteIndex: number): string {
  return `${pdf}:${page}:${noteIndex}`
}

/** 既存IDの最大値+1 を返す（malformed ID防御付き） */
export function getNextId(fusens: Record<string, Fusen>): string {
  const ids = Object.keys(fusens)
  if (ids.length === 0) return 'fusen-001'
  const nums = ids.map(id => parseInt(id.replace('fusen-', ''), 10)).filter(n => !isNaN(n))
  const maxNum = nums.length > 0 ? Math.max(...nums) : 0
  return formatId(maxNum + 1)
}

function formatId(num: number): string {
  return `fusen-${String(num).padStart(3, '0')}`
}

/**
 * OCR結果 → FusenMaster に変換。
 * existingMaster が渡された場合はマージ（fingerprint重複はスキップ）。
 */
export function ocrToMaster(
  ocrPages: OcrPageResult[],
  pdfName: string,
  existingMaster?: FusenMaster,
): FusenMaster {
  const fusens: Record<string, Fusen> = existingMaster
    ? { ...existingMaster.fusens }
    : {}

  // 既存fingerprint集合（マージ時の重複スキップ用）
  const existingFingerprints = new Set(
    Object.values(fusens).map(f =>
      generateFingerprint(f.source.pdf, f.source.page, f.source.noteIndex)
    )
  )

  // 次のID番号を算出
  let nextNum = Object.keys(fusens).length === 0
    ? 1
    : Math.max(...Object.keys(fusens).map(id => parseInt(id.replace('fusen-', ''), 10))) + 1

  for (const page of ocrPages) {
    if (page.notes.length === 0) continue

    for (let i = 0; i < page.notes.length; i++) {
      const note = page.notes[i]
      const fp = generateFingerprint(pdfName, page.page, i)

      // マージ時: 既にインポート済みならスキップ
      if (existingFingerprints.has(fp)) continue

      const id = formatId(nextNum++)
      const fusen: Fusen = {
        id,
        title: note.title || '(無題)',
        body: note.body || '',
        imageFile: note.imageFile || '',
        subject: normalizeSubject(note.subject),
        noteType: normalizeNoteType(note.note_type),
        tags: note.tags || [],
        source: {
          pdf: pdfName,
          page: page.page,
          noteIndex: i,
          bbox: note.bbox || [0, 0, 0, 0],
        },
        topicId: null,
        linkedQuestionIds: [],
        importance: 0,
        tier: 'free',
        status: 'draft',
        reviewedAt: null,
        notes: '',
      }
      fusens[id] = fusen
    }
  }

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    fusens,
  }
}
