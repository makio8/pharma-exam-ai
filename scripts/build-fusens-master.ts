/**
 * 付箋マスター生成: OCR結果 → fusens-master.json
 *
 * Usage:
 *   npx tsx scripts/build-fusens-master.ts                # 旧パイプライン（見開きOCR）
 *   npx tsx scripts/build-fusens-master.ts --from-crop    # 新パイプライン（半ページアノテーション+OCR）
 *   npx tsx scripts/build-fusens-master.ts --stats        # 統計表示
 *   npx tsx scripts/build-fusens-master.ts --unreviewed   # 未レビュー一覧
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { ocrToMaster, cropOcrToMaster } from './lib/fusens-master-core'
import type { FusenMaster, OcrPageResult } from './lib/fusens-master-types'
import type { CropOcrOutput } from './lib/ocr-cropped-core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const OCR_PATH = path.join(__dirname, '..', 'src', 'data', 'fusens', 'ocr-results.json')
const CROP_OCR_PATH = path.join(__dirname, '..', 'src', 'data', 'fusens', 'crop-ocr-results.json')
const MASTER_PATH = path.join(__dirname, '..', 'src', 'data', 'fusens', 'fusens-master.json')
const PUBLIC_MASTER_PATH = path.join(__dirname, '..', 'public', 'data', 'fusens', 'fusens-master.json')
const PDF_NAME = 'fusen-note-makio.pdf'

const args = process.argv.slice(2)
const isStats = args.includes('--stats')
const isUnreviewed = args.includes('--unreviewed')
const isFromCrop = args.includes('--from-crop')

function loadMaster(): FusenMaster | null {
  try {
    return JSON.parse(fs.readFileSync(MASTER_PATH, 'utf-8'))
  } catch {
    return null
  }
}

function saveMaster(master: FusenMaster): void {
  const json = JSON.stringify(master, null, 2)
  // src/data/ に保存（マスターデータ）
  const tmpPath = MASTER_PATH + '.tmp'
  fs.writeFileSync(tmpPath, json, 'utf-8')
  fs.renameSync(tmpPath, MASTER_PATH)
  // public/data/ にもコピー（レビューUI用）
  fs.mkdirSync(path.dirname(PUBLIC_MASTER_PATH), { recursive: true })
  fs.writeFileSync(PUBLIC_MASTER_PATH, json, 'utf-8')
}

function showStats(): void {
  const master = loadMaster()
  if (!master) { console.log('fusens-master.json がありません'); return }

  const fusens = Object.values(master.fusens)
  const active = fusens.filter(f => f.status === 'active')
  const draft = fusens.filter(f => f.status === 'draft')
  const archived = fusens.filter(f => f.status === 'archived')
  const duplicate = fusens.filter(f => f.status === 'duplicate')

  console.log(`=== 付箋マスター統計 ===`)
  console.log(`総数: ${fusens.length}`)
  console.log(`  active: ${active.length}  draft: ${draft.length}  archived: ${archived.length}  duplicate: ${duplicate.length}`)

  const bySubject: Record<string, number> = {}
  const byType: Record<string, number> = {}
  const withTopic = fusens.filter(f => f.topicId).length
  const reviewed = fusens.filter(f => f.reviewedAt).length
  const withPageId = fusens.filter(f => f.source.pageId).length

  for (const f of fusens) {
    bySubject[f.subject] = (bySubject[f.subject] || 0) + 1
    byType[f.noteType] = (byType[f.noteType] || 0) + 1
  }

  console.log(`\n科目別:`)
  for (const [s, c] of Object.entries(bySubject).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${s}: ${c}`)
  }
  console.log(`\n分類別:`)
  for (const [t, c] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t}: ${c}`)
  }
  console.log(`\ntopicId設定済み: ${withTopic} / ${fusens.length}`)
  console.log(`レビュー済み: ${reviewed} / ${fusens.length}`)
  console.log(`半ページ体系: ${withPageId} / ${fusens.length}`)
}

function showUnreviewed(): void {
  const master = loadMaster()
  if (!master) { console.log('fusens-master.json がありません'); return }

  const unreviewed = Object.values(master.fusens)
    .filter(f => !f.reviewedAt && f.status !== 'archived' && f.status !== 'duplicate')
    .sort((a, b) => a.id.localeCompare(b.id))

  console.log(`未レビュー: ${unreviewed.length}件\n`)
  for (const f of unreviewed.slice(0, 30)) {
    const topic = f.topicId ? `✅ ${f.topicId}` : '❌ topicId未設定'
    console.log(`${f.id} | ${f.subject} | ${f.noteType} | ${f.title} | ${topic}`)
  }
  if (unreviewed.length > 30) {
    console.log(`  ... 他${unreviewed.length - 30}件`)
  }
}

function buildFromCrop(): void {
  if (!fs.existsSync(CROP_OCR_PATH)) {
    console.error(`crop-ocr-results.json なし: ${CROP_OCR_PATH}`)
    console.error('先に ocr-cropped-notes.ts を実行してください')
    process.exit(1)
  }
  const cropData: CropOcrOutput = JSON.parse(fs.readFileSync(CROP_OCR_PATH, 'utf-8'))
  console.log(`crop-OCRデータ: ${cropData.totalNotes}件 (${cropData.ocrModel})`)

  const existing = loadMaster()
  if (existing) {
    const existingCount = Object.keys(existing.fusens).length
    console.log(`既存マスター: ${existingCount}件 → マージモード`)
  } else {
    console.log('既存マスターなし → 新規生成')
  }

  const master = cropOcrToMaster(cropData.results, PDF_NAME, existing ?? undefined)
  const newCount = Object.keys(master.fusens).length - (existing ? Object.keys(existing.fusens).length : 0)

  saveMaster(master)
  console.log(`\n=== 完了 ===`)
  console.log(`新規追加: ${newCount}件`)
  console.log(`累計: ${Object.keys(master.fusens).length}件`)
  console.log(`保存: ${MASTER_PATH}`)
}

function buildFromOcr(): void {
  if (!fs.existsSync(OCR_PATH)) {
    console.error(`OCRデータなし: ${OCR_PATH}`)
    process.exit(1)
  }
  const ocrData: OcrPageResult[] = JSON.parse(fs.readFileSync(OCR_PATH, 'utf-8'))
  const totalNotes = ocrData.reduce((s, p) => s + p.notes.length, 0)
  console.log(`OCRデータ: ${ocrData.length}ページ / ${totalNotes}件のnote`)

  const existing = loadMaster()
  if (existing) {
    const existingCount = Object.keys(existing.fusens).length
    console.log(`既存マスター: ${existingCount}件 → マージモード`)
  } else {
    console.log('既存マスターなし → 新規生成')
  }

  const master = ocrToMaster(ocrData, PDF_NAME, existing ?? undefined)
  const newCount = Object.keys(master.fusens).length - (existing ? Object.keys(existing.fusens).length : 0)

  saveMaster(master)
  console.log(`\n=== 完了 ===`)
  console.log(`新規追加: ${newCount}件`)
  console.log(`累計: ${Object.keys(master.fusens).length}件`)
  console.log(`保存: ${MASTER_PATH}`)
}

function main(): void {
  if (isStats) { showStats(); return }
  if (isUnreviewed) { showUnreviewed(); return }
  if (isFromCrop) { buildFromCrop(); return }
  buildFromOcr()
}

main()
