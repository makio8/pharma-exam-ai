/**
 * 付箋切り抜き: アノテーションJSON + 分割画像 → 個別PNG
 *
 * 入力:
 *   - アノテーションJSON（fusen-annotate UIのエクスポート）
 *   - 分割画像: public/images/fusens/sources/{source}/page-NNN-{left|right}.png
 *
 * 出力:
 *   - 個別PNG: public/images/fusens/{pageId}/note-NN.png
 *   - マニフェスト: src/data/fusens/crop-manifest.json（次段OCR用）
 *
 * Usage:
 *   npx tsx scripts/crop-from-annotation.ts <annotation-json>
 *   npx tsx scripts/crop-from-annotation.ts /tmp/annotations.json --dry-run
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import type { CropManifest, CropNote } from './lib/crop-annotation-core'
import { isValidBbox, bboxToExtract } from './lib/crop-annotation-core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PROJECT_ROOT = path.join(__dirname, '..')
const IMAGES_DIR = path.join(PROJECT_ROOT, 'public', 'images', 'fusens')
const MANIFEST_PATH = path.join(PROJECT_ROOT, 'src', 'data', 'fusens', 'crop-manifest.json')

// --- Types (annotation export) ---
interface ExportBbox {
  noteIndex: number
  bbox: [number, number, number, number]
}

interface ExportPage {
  pageId: string
  spreadPage: number
  side: 'left' | 'right'
  status: 'done' | 'skipped'
  bboxes: ExportBbox[]
}

interface ExportJson {
  version: string
  source: string
  exportedAt: string
  summary: {
    totalPages: number
    annotatedPages: number
    skippedPages: number
    totalBboxes: number
  }
  pages: ExportPage[]
}

// --- CLI ---
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const jsonPath = args.find(a => !a.startsWith('--'))

if (!jsonPath) {
  console.error('Usage: npx tsx scripts/crop-from-annotation.ts <annotation-json> [--dry-run]')
  console.error('  annotation-json: fusen-annotate UIのエクスポートJSON')
  console.error('  --dry-run: 実際の切り抜きを行わず、処理内容のみ表示')
  process.exit(1)
}

if (!fs.existsSync(jsonPath)) {
  console.error(`ファイルが見つかりません: ${jsonPath}`)
  process.exit(1)
}

// --- Main ---
async function main(): Promise<void> {
  const data: ExportJson = JSON.parse(fs.readFileSync(jsonPath!, 'utf-8'))

  console.log(`付箋切り抜き${isDryRun ? '（dry-run）' : ''}`)
  console.log(`  ソース: ${data.source}`)
  console.log(`  アノテーション: ${data.summary.annotatedPages}ページ / ${data.summary.totalBboxes}枚`)
  console.log(`  スキップ: ${data.summary.skippedPages}ページ`)
  console.log('')

  const sourcesDir = path.join(IMAGES_DIR, 'sources', data.source)
  if (!fs.existsSync(sourcesDir)) {
    console.error(`ソース画像ディレクトリが見つかりません: ${sourcesDir}`)
    process.exit(1)
  }

  const donePages = data.pages.filter(p => p.status === 'done' && p.bboxes.length > 0)

  let totalCropped = 0
  let totalErrors = 0
  const manifestNotes: CropNote[] = []

  for (const page of donePages) {
    const srcPath = path.join(sourcesDir, `${page.pageId}.png`)
    if (!fs.existsSync(srcPath)) {
      console.error(`  ❌ 画像なし: ${page.pageId}.png`)
      totalErrors += page.bboxes.length
      continue
    }

    const meta = await sharp(srcPath).metadata()
    if (!meta.width || !meta.height) {
      console.error(`  ❌ メタデータ取得失敗: ${page.pageId}`)
      totalErrors += page.bboxes.length
      continue
    }

    const pageDir = path.join(IMAGES_DIR, page.pageId)
    if (!isDryRun) {
      fs.mkdirSync(pageDir, { recursive: true })
    }

    let pageCropped = 0
    let pageErrors = 0

    for (const entry of page.bboxes) {
      if (!isValidBbox(entry.bbox)) {
        console.error(`  ❌ ${page.pageId}/note-${entry.noteIndex + 1}: invalid bbox ${JSON.stringify(entry.bbox)}`)
        pageErrors++
        continue
      }

      const extract = bboxToExtract(entry.bbox, meta.width, meta.height)
      if (!extract) {
        console.error(`  ❌ ${page.pageId}/note-${entry.noteIndex + 1}: bbox too small`)
        pageErrors++
        continue
      }

      const noteNum = String(entry.noteIndex + 1).padStart(2, '0')
      const fileName = `note-${noteNum}.png`
      const relPath = `${page.pageId}/${fileName}`
      const outPath = path.join(pageDir, fileName)

      if (!isDryRun) {
        await sharp(srcPath)
          .extract(extract)
          .toFile(outPath)
      }

      manifestNotes.push({
        pageId: page.pageId,
        spreadPage: page.spreadPage,
        side: page.side,
        noteIndex: entry.noteIndex,
        bbox: entry.bbox,
        imageFile: relPath,
        cropSize: { width: extract.width, height: extract.height },
      })

      pageCropped++
    }

    totalCropped += pageCropped
    totalErrors += pageErrors
    const errorStr = pageErrors > 0 ? ` ❌ ${pageErrors}エラー` : ''
    console.log(`  ${page.pageId}: ${pageCropped}枚切り抜き${errorStr}`)
  }

  // マニフェスト保存（次段OCR用）
  const manifest: CropManifest = {
    version: '1.0.0',
    source: data.source,
    annotationExportedAt: data.exportedAt,
    croppedAt: new Date().toISOString(),
    totalNotes: manifestNotes.length,
    notes: manifestNotes,
  }

  if (!isDryRun) {
    fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true })
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8')
  }

  console.log('')
  console.log(`=== ${isDryRun ? 'dry-run 完了' : '完了'} ===`)
  console.log(`切り抜き: ${totalCropped}枚`)
  if (totalErrors > 0) console.log(`エラー: ${totalErrors}枚`)
  console.log(`画像: ${IMAGES_DIR}/{pageId}/note-NN.png`)
  console.log(`マニフェスト: ${MANIFEST_PATH}`)
}

main().catch(console.error)
