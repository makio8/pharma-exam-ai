/**
 * 個別切り抜き付箋のOCR: crop-manifest.json → Gemini Vision → crop-ocr-results.json
 *
 * 人間がアノテーションした bbox で切り出した個別画像を Gemini に送信。
 * bbox検出が不要なため、テキスト読み取り精度が向上。
 *
 * Usage:
 *   npx tsx scripts/ocr-cropped-notes.ts                  # 未処理分を実行
 *   npx tsx scripts/ocr-cropped-notes.ts --all             # 全件再実行
 *   npx tsx scripts/ocr-cropped-notes.ts --status          # 進捗表示
 *   npx tsx scripts/ocr-cropped-notes.ts --limit 5         # 最大5件だけ処理
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import type { CropManifest, CropNote } from './lib/crop-annotation-core'
import type { CropOcrNote, CropOcrOutput, GeminiNoteResult } from './lib/ocr-cropped-core'
import {
  SINGLE_NOTE_PROMPT,
  parseGeminiResponse,
  mergeNoteResult,
  filterUnprocessed,
} from './lib/ocr-cropped-core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// --- Config ---
const PROJECT_ROOT = path.join(__dirname, '..')
const IMAGES_DIR = path.join(PROJECT_ROOT, 'public', 'images', 'fusens')
const MANIFEST_PATH = path.join(PROJECT_ROOT, 'src', 'data', 'fusens', 'crop-manifest.json')
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'src', 'data', 'fusens', 'crop-ocr-results.json')
const RATE_LIMIT_MS = 200 // 0.2秒間隔（GCP課金有効: 2,000RPM、余裕をもって300RPM）
const OCR_MODEL = 'gemini-2.5-flash'

// --- CLI ---
const args = process.argv.slice(2)
const isAll = args.includes('--all')
const isStatus = args.includes('--status')
const limitIdx = args.indexOf('--limit')
const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : Infinity

// --- API Key ---
const API_KEY = (() => {
  try {
    const envPath = path.join(PROJECT_ROOT, '.env.local')
    const content = fs.readFileSync(envPath, 'utf-8')
    const match = content.match(/GOOGLE_AI_API_KEY=(.+)/)
    return match ? match[1].trim().replace(/^["']|["']$/g, '') : ''
  } catch {
    return ''
  }
})()

// --- Load existing results ---
function loadExisting(): CropOcrNote[] {
  try {
    const data: CropOcrOutput = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'))
    return data.results || []
  } catch {
    return []
  }
}

// --- Save results (atomic) ---
function saveResults(source: string, results: CropOcrNote[]): void {
  const output: CropOcrOutput = {
    version: '1.0.0',
    source,
    ocrModel: OCR_MODEL,
    processedAt: new Date().toISOString(),
    totalNotes: results.length,
    results,
  }
  const tmpPath = OUTPUT_PATH + '.tmp'
  fs.writeFileSync(tmpPath, JSON.stringify(output, null, 2), 'utf-8')
  fs.renameSync(tmpPath, OUTPUT_PATH)
}

// --- Status ---
function showStatus(): void {
  const manifest = loadManifest()
  const existing = loadExisting()

  console.log(`=== 付箋OCR進捗 ===`)
  console.log(`マニフェスト: ${manifest.totalNotes}枚`)
  console.log(`処理済み: ${existing.length}枚`)
  console.log(`未処理: ${manifest.totalNotes - existing.length}枚`)

  if (existing.length === 0) return

  const bySubject: Record<string, number> = {}
  const byType: Record<string, number> = {}
  for (const r of existing) {
    bySubject[r.subject] = (bySubject[r.subject] || 0) + 1
    byType[r.noteType] = (byType[r.noteType] || 0) + 1
  }
  console.log('\n科目別:', JSON.stringify(bySubject, null, 2))
  console.log('分類別:', JSON.stringify(byType, null, 2))

  // ページ別
  const byPage: Record<string, number> = {}
  for (const r of existing) {
    byPage[r.pageId] = (byPage[r.pageId] || 0) + 1
  }
  console.log('\nページ別:')
  for (const [p, c] of Object.entries(byPage).sort()) {
    console.log(`  ${p}: ${c}枚`)
  }
}

// --- Load manifest ---
function loadManifest(): CropManifest {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`マニフェストが見つかりません: ${MANIFEST_PATH}`)
    console.error('先に crop-from-annotation.ts を実行してください')
    process.exit(1)
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
}

// --- Gemini API Call (single note) ---
async function callGeminiOCR(imgPath: string): Promise<GeminiNoteResult | null> {
  const imgB64 = fs.readFileSync(imgPath).toString('base64')

  let retries = 0
  const maxRetries = 5

  while (true) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${OCR_MODEL}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationConfig: { temperature: 0.1 },
          contents: [{
            parts: [
              { text: SINGLE_NOTE_PROMPT },
              { inline_data: { mime_type: 'image/png', data: imgB64 } },
            ],
          }],
        }),
      }
    )

    if (response.status === 429 && retries < maxRetries) {
      retries++
      const waitSec = Math.pow(2, retries) * 5
      console.error(`  429レート制限 → ${waitSec}秒待機 (retry ${retries}/${maxRetries})`)
      await new Promise(r => setTimeout(r, waitSec * 1000))
      continue
    }

    if (!response.ok) {
      console.error(`  API error: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json() as Record<string, unknown>
    const candidates = data.candidates as Array<Record<string, unknown>> | undefined
    const content = candidates?.[0]?.content as Record<string, unknown> | undefined
    const parts = content?.parts as Array<Record<string, unknown>> | undefined
    const text = (parts?.[0]?.text as string) || ''

    const finishReason = candidates?.[0]?.finishReason as string | undefined
    if (finishReason && finishReason !== 'STOP') {
      console.error(`  finishReason: ${finishReason}`)
    }

    if (!text) {
      console.error(`  API応答なし`)
      return null
    }

    const parsed = parseGeminiResponse(text)
    if (!parsed) {
      console.error(`  JSONパース失敗: ${text.substring(0, 80)}`)
      return null
    }
    return parsed
  }
}

// --- Main ---
async function main(): Promise<void> {
  if (isStatus) { showStatus(); return }

  if (!API_KEY) {
    console.error('GOOGLE_AI_API_KEY not found in .env.local')
    process.exit(1)
  }

  const manifest = loadManifest()
  const existing = loadExisting()

  // 処理対象決定
  const toProcess = isAll
    ? manifest.notes
    : filterUnprocessed(manifest.notes, existing)

  const effectiveLimit = Math.min(toProcess.length, limit)
  const queue = toProcess.slice(0, effectiveLimit)

  console.log(`付箋OCR（個別画像）`)
  console.log(`  モデル: ${OCR_MODEL}`)
  console.log(`  マニフェスト: ${manifest.totalNotes}枚`)
  console.log(`  処理済み: ${existing.length}枚`)
  console.log(`  今回処理: ${queue.length}枚${limit < Infinity ? ` (--limit ${limit})` : ''}`)
  console.log(`  レート: ${RATE_LIMIT_MS / 1000}秒間隔`)
  console.log('')

  if (queue.length === 0) {
    console.log('処理対象なし ✅')
    return
  }

  // isAll の場合は既存結果をクリア
  const results: CropOcrNote[] = isAll ? [] : [...existing]
  let processed = 0
  let failed = 0
  const startTime = Date.now()

  for (const note of queue) {
    const imgPath = path.join(IMAGES_DIR, note.imageFile)
    if (!fs.existsSync(imgPath)) {
      console.error(`  ❌ 画像なし: ${note.imageFile}`)
      failed++
      continue
    }

    process.stdout.write(`  ${note.imageFile}...`)
    const ocrResult = await callGeminiOCR(imgPath)

    if (!ocrResult) {
      console.log(` ❌ API失敗`)
      failed++
      // レート制限待ちは実行（連続失敗防止）
      await new Promise(r => setTimeout(r, RATE_LIMIT_MS))
      continue
    }

    const merged = mergeNoteResult(note, ocrResult)
    results.push(merged)
    saveResults(manifest.source, results)

    processed++
    console.log(` ✅ ${ocrResult.title} [${ocrResult.note_type}]`)

    // レート制限 + ETA
    const remaining = queue.length - (processed + failed)
    if (remaining > 0) {
      const elapsed = (Date.now() - startTime) / 1000
      const avgSec = elapsed / (processed + failed)
      const eta = Math.ceil(avgSec * remaining / 60)
      if (remaining % 10 === 0 || remaining <= 5) {
        console.log(`    [残${remaining}枚, ETA ~${eta}分]`)
      }
      await new Promise(r => setTimeout(r, RATE_LIMIT_MS))
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
  console.log('')
  console.log(`=== 完了 ===`)
  console.log(`今回処理: ${processed}枚 / 失敗: ${failed}枚`)
  console.log(`累計: ${results.length} / ${manifest.totalNotes}枚`)
  console.log(`所要時間: ${elapsed}分`)
  console.log(`保存: ${OUTPUT_PATH}`)
}

main().catch(console.error)
