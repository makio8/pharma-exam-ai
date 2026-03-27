/**
 * crop-from-annotation コアロジック（テスト可能な純粋関数群）
 *
 * 座標系: [y1, x1, y2, x2] 正規化 0-1000（top-left原点）
 * 既存パイプライン（ocr-fusens.ts / AnnotationStateManager）と同一
 */

// --- Types ---

/** sharp の extract() に渡す形式 */
export interface ExtractRegion {
  left: number
  top: number
  width: number
  height: number
}

/** crop-manifest.json の1件 */
export interface CropNote {
  pageId: string
  spreadPage: number
  side: 'left' | 'right'
  noteIndex: number
  bbox: [number, number, number, number]
  imageFile: string       // 相対パス: "page-001-left/note-01.png"
  cropSize: { width: number; height: number }
}

/** crop-manifest.json 全体 */
export interface CropManifest {
  version: string
  source: string
  annotationExportedAt: string
  croppedAt: string
  totalNotes: number
  notes: CropNote[]
}

// --- Config ---
const PADDING = 10
const MIN_SIZE = 30

// --- Functions ---

/** bbox が有効か検証（[y1, x1, y2, x2] 0-1000） */
export function isValidBbox(bbox: unknown): bbox is [number, number, number, number] {
  if (!Array.isArray(bbox) || bbox.length !== 4) return false
  const [y1, x1, y2, x2] = bbox
  if ([y1, x1, y2, x2].some(v => typeof v !== 'number' || isNaN(v) || v < 0 || v > 1000)) return false
  if (y1 >= y2 || x1 >= x2) return false
  return true
}

/**
 * 正規化bbox → sharp extract パラメータに変換
 * @returns ExtractRegion or null（小さすぎる場合）
 */
export function bboxToExtract(
  bbox: [number, number, number, number],
  imgWidth: number,
  imgHeight: number,
  padding: number = PADDING,
): ExtractRegion | null {
  const [y1, x1, y2, x2] = bbox
  const left = Math.max(0, Math.floor(x1 / 1000 * imgWidth) - padding)
  const top = Math.max(0, Math.floor(y1 / 1000 * imgHeight) - padding)
  const right = Math.min(imgWidth, Math.ceil(x2 / 1000 * imgWidth) + padding)
  const bottom = Math.min(imgHeight, Math.ceil(y2 / 1000 * imgHeight) + padding)
  const width = right - left
  const height = bottom - top

  if (width < MIN_SIZE || height < MIN_SIZE) return null
  return { left, top, width, height }
}

/**
 * noteIndex → ファイル名を生成
 * 例: noteIndex=0 → "note-01.png", noteIndex=9 → "note-10.png"
 */
export function noteFileName(noteIndex: number): string {
  return `note-${String(noteIndex + 1).padStart(2, '0')}.png`
}

/**
 * pageId + noteIndex → 相対パスを生成
 * 例: ("page-001-left", 0) → "page-001-left/note-01.png"
 */
export function noteRelativePath(pageId: string, noteIndex: number): string {
  return `${pageId}/${noteFileName(noteIndex)}`
}
