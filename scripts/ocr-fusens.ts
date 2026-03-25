/**
 * 付箋OCRパイプライン v2: Gemini Vision + bbox で個別切り抜き
 *
 * 入力: /tmp/claude/fusens/all-subjects.pdf
 * 処理: Gemini 2.5 Flash で OCR + bbox → sharp で切り抜き
 * 出力:
 *   - src/data/fusens/ocr-results.json (構造化データ)
 *   - public/images/fusens/page-NNN/note-NN.png (個別画像)
 *
 * Usage:
 *   npx tsx scripts/ocr-fusens.ts --page 1 --pages 5   # ページ1から5ページ
 *   npx tsx scripts/ocr-fusens.ts --all                 # 全ページ
 *   npx tsx scripts/ocr-fusens.ts --status              # 進捗表示
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// --- Config ---
const PDF_PATH = '/tmp/claude/fusens/all-subjects.pdf'
const IMG_DIR = '/tmp/claude/fusens/pages'
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data', 'fusens')
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'fusens')
const RATE_LIMIT_MS = 6000 // 6秒間隔 = 10RPM以下

// --- CLI ---
const args = process.argv.slice(2)
const isAll = args.includes('--all')
const isStatus = args.includes('--status')
const startPage = parseInt(
  args.find(a => a === '--page') ? args[args.indexOf('--page') + 1] : '1'
)
const numPages = parseInt(
  args.find(a => a === '--pages') ? args[args.indexOf('--pages') + 1] : '3'
)

// --- API Key ---
const API_KEY = (() => {
  try {
    const envPath = path.join(__dirname, '..', '.env.local')
    const content = fs.readFileSync(envPath, 'utf-8')
    const match = content.match(/GOOGLE_AI_API_KEY=(.+)/)
    return match ? match[1].trim().replace(/^["']|["']$/g, '') : ''
  } catch {
    return ''
  }
})()

if (!API_KEY && !isStatus) {
  console.error('GOOGLE_AI_API_KEY not found in .env.local')
  process.exit(1)
}

// --- Prompt (bbox対応) ---
const PROMPT = `あなたは薬学の専門家です。この画像は薬剤師国家試験の学習ノートで、ルーズリーフに手書きの付箋が貼られています。

各付箋を個別に読み取り、JSON配列で出力してください。

■ 座標（bbox）のルール:
- 各付箋の位置を [y1, x1, y2, x2] で返す（0〜1000の正規化座標）
- (0,0)が画像の左上、(1000,1000)が右下
- 付箋の外枠ギリギリを囲む

■ note_type の分類基準（重要）:
- "knowledge": 知識の整理・定義・分類（「〇〇とは」「〇〇の定義」）
- "mnemonic": 語呂合わせ・覚え方・暗記法・単位換算の早見表
- "solution": 解法・計算手順・考え方のフロー
- "caution": 注意点・ひっかけ・間違いやすいポイント
- "related": 比較表・まとめ・対比

■ タイトルのルール:
- 赤字の見出しがあればそれをタイトルにする
- なければ内容を10文字以内で要約（nullにしない）

■ 分類の追加ルール（迷ったらこちらを優先）:
- 「〇〇 = △△」変換・換算 → "mnemonic"
- 「ゴロ」「語呂」→ "mnemonic"
- 対数や数値の暗記 → "mnemonic"
- 「〇〇の定義」「〇〇とは」→ "knowledge"
- ①②③の番号リストで複数項目整理 → "related"
- 計算過程・フローチャート → "solution"
- 「注意」「間違いやすい」「禁忌」→ "caution"

[{"title":"タイトル","body":"本文","subject":"物理|化学|生物|薬理|薬剤|病態・薬物治療|法規・制度・倫理|実務|衛生","note_type":"knowledge|mnemonic|solution|caution|related","tags":["タグ1","タグ2"],"bbox":[y1,x1,y2,x2]}]

注意:
- 手書き文字を可能な限り正確に読み取る
- 薬学・化学の専門用語は正確に
- 読み取れない部分は [不明] と記載
- JSONのみ出力（説明文不要）
- 付箋がないページは空配列 [] を返す`

// --- Types ---
interface FusenNote {
  title: string
  body: string
  subject: string
  note_type: string
  tags: string[]
  bbox: [number, number, number, number] // [y1, x1, y2, x2] normalized 0-1000
  imageFile?: string // e.g. "page-001/note-01.png"
}

interface FusenPageResult {
  page: number
  notes: FusenNote[]
}

// --- Status ---
function showStatus(): void {
  const outputPath = path.join(OUTPUT_DIR, 'ocr-results.json')
  if (!fs.existsSync(outputPath)) {
    console.log('まだ結果がありません')
    return
  }
  const results: FusenPageResult[] = JSON.parse(fs.readFileSync(outputPath, 'utf-8'))
  const totalNotes = results.reduce((s, r) => s + r.notes.length, 0)
  const pages = results.map(r => r.page).sort((a, b) => a - b)
  console.log(`処理済み: ${results.length}ページ / 付箋: ${totalNotes}枚`)
  console.log(`ページ: ${pages.join(', ')}`)

  const bySubject: Record<string, number> = {}
  const byType: Record<string, number> = {}
  for (const r of results) {
    for (const n of r.notes) {
      bySubject[n.subject] = (bySubject[n.subject] || 0) + 1
      byType[n.note_type] = (byType[n.note_type] || 0) + 1
    }
  }
  console.log('\n科目別:', JSON.stringify(bySubject, null, 2))
  console.log('分類別:', JSON.stringify(byType, null, 2))
}

// --- PDF → Image ---
async function generatePageImage(pageNum: number): Promise<string | null> {
  const pad = String(pageNum).padStart(3, '0')
  const imgPath = path.join(IMG_DIR, `page-${pad}.png`)

  if (fs.existsSync(imgPath)) return imgPath

  const prefix = path.join(IMG_DIR, `tmp-p${pad}`)
  try {
    execSync(
      `pdftoppm -png -r 150 -f ${pageNum} -l ${pageNum} "${PDF_PATH}" "${prefix}"`,
      { timeout: 30000 }
    )
  } catch {
    console.error(`  PDF→画像変換失敗: page ${pageNum}`)
    return null
  }

  const files = fs.readdirSync(IMG_DIR)
    .filter(f => f.startsWith(`tmp-p${pad}`) && f.endsWith('.png'))
  if (files.length > 0) {
    fs.renameSync(path.join(IMG_DIR, files[0]), imgPath)
    return imgPath
  }
  return null
}

// --- Resize for API ---
async function resizeForApi(imgPath: string): Promise<string> {
  const smallPath = imgPath.replace('.png', '-api.png')
  // キャッシュ利用（1KB以上のファイルのみ有効とみなす）
  if (fs.existsSync(smallPath) && fs.statSync(smallPath).size > 1000) {
    return smallPath
  }
  await sharp(imgPath).resize(1200, null, { fit: 'inside' }).toFile(smallPath)
  return smallPath
}

// --- Gemini API Call ---
// 成功時: FusenNote[]  API失敗時: null（0枚との区別のため）
async function callGeminiOCR(imgPath: string): Promise<FusenNote[] | null> {
  const imgB64 = fs.readFileSync(imgPath).toString('base64')

  let retries = 0
  const maxRetries = 5

  while (true) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationConfig: { temperature: 0.1 },
          contents: [{
            parts: [
              { text: PROMPT },
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
      return null // API失敗 → 保存しない（0枚と区別）
    }

    const data = await response.json() as any

    // finishReason チェック（トークン切れ検出）
    const finishReason = data.candidates?.[0]?.finishReason
    if (finishReason && finishReason !== 'STOP') {
      console.error(`  Gemini finishReason: ${finishReason} (応答切れの可能性)`)
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (!text) {
      console.error(`  API応答なし`)
      return null // API失敗 → 保存しない
    }

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) return JSON.parse(jsonMatch[0])
      console.error(`  JSON抽出失敗: ${text.substring(0, 100)}`)
    } catch {
      console.error(`  JSONパース失敗: ${text.substring(0, 100)}`)
    }
    return []
  }
}

// --- bbox バリデーション ---
function isValidBbox(bbox: unknown): bbox is [number, number, number, number] {
  if (!Array.isArray(bbox) || bbox.length !== 4) return false
  const [y1, x1, y2, x2] = bbox
  // 全て数値で、0-1000の範囲内で、y1<y2, x1<x2
  if ([y1, x1, y2, x2].some(v => typeof v !== 'number' || isNaN(v) || v < 0 || v > 1000)) return false
  if (y1 >= y2 || x1 >= x2) return false
  return true
}

// --- Crop Notes ---
async function cropNotes(
  imgPath: string,
  notes: FusenNote[],
  pageNum: number
): Promise<void> {
  const pad = String(pageNum).padStart(3, '0')
  const pageDir = path.join(IMAGES_DIR, `page-${pad}`)
  fs.mkdirSync(pageDir, { recursive: true })

  const meta = await sharp(imgPath).metadata()
  if (!meta.width || !meta.height) {
    console.error(`  画像メタデータ取得失敗: ${imgPath}`)
    return
  }
  const imgW = meta.width
  const imgH = meta.height
  const PADDING = 10

  for (let i = 0; i < notes.length; i++) {
    const n = notes[i]

    if (!isValidBbox(n.bbox)) {
      console.error(`  note-${i + 1}: invalid bbox ${JSON.stringify(n.bbox)}, skipping crop`)
      continue
    }

    const [y1, x1, y2, x2] = n.bbox
    const left = Math.max(0, Math.floor(x1 / 1000 * imgW) - PADDING)
    const top = Math.max(0, Math.floor(y1 / 1000 * imgH) - PADDING)
    const right = Math.min(imgW, Math.ceil(x2 / 1000 * imgW) + PADDING)
    const bottom = Math.min(imgH, Math.ceil(y2 / 1000 * imgH) + PADDING)
    const width = right - left
    const height = bottom - top

    if (width < 30 || height < 30) {
      console.error(`  note-${i + 1}: bbox too small (${width}x${height}), skipping`)
      continue
    }

    const fileName = `note-${String(i + 1).padStart(2, '0')}.png`
    await sharp(imgPath).extract({ left, top, width, height }).toFile(path.join(pageDir, fileName))
    n.imageFile = `page-${pad}/${fileName}`
  }
}

// --- Atomic JSON save（書き込み中クラッシュ対策） ---
function saveResultsAtomic(outputPath: string, data: FusenPageResult[]): void {
  const tmpPath = outputPath + '.tmp'
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8')
  fs.renameSync(tmpPath, outputPath) // rename はほとんどのFSでアトミック
}

// --- Main ---
async function main(): Promise<void> {
  if (isStatus) { showStatus(); return }

  fs.mkdirSync(IMG_DIR, { recursive: true })
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.mkdirSync(IMAGES_DIR, { recursive: true })

  // PDF総ページ数（pdfinfo失敗時のエラーハンドリング）
  let totalPages: number
  try {
    const info = execSync(`pdfinfo "${PDF_PATH}" 2>/dev/null`, { encoding: 'utf-8' })
    totalPages = parseInt(info.match(/Pages:\s+(\d+)/)?.[1] || '0')
  } catch {
    console.error(`PDF not found or pdfinfo not installed: ${PDF_PATH}`)
    process.exit(1)
  }
  console.log(`付箋PDF: ${totalPages}ページ`)

  const effStart = isAll ? 1 : startPage
  const effEnd = isAll ? totalPages : Math.min(startPage + numPages - 1, totalPages)
  const totalToProcess = effEnd - effStart + 1
  console.log(`処理: ページ${effStart}〜${effEnd} (${totalToProcess}ページ)`)
  console.log(`レート制限: ${RATE_LIMIT_MS / 1000}秒間隔`)

  // 日次リクエスト上限チェック
  const DAILY_LIMIT = 250
  if (totalToProcess > DAILY_LIMIT) {
    console.warn(`⚠ ${totalToProcess}ページは日次上限${DAILY_LIMIT}RPDを超過する可能性があります`)
  }
  console.log('')

  // 既存結果読み込み
  const outputPath = path.join(OUTPUT_DIR, 'ocr-results.json')
  let allResults: FusenPageResult[] = []
  try {
    const raw = fs.readFileSync(outputPath, 'utf-8')
    allResults = JSON.parse(raw)
    if (!Array.isArray(allResults)) allResults = []
  } catch {
    console.log('既存結果なし、新規開始')
  }
  const existingPages = new Set(allResults.map(r => r.page))

  let processedCount = 0
  let totalNotes = 0
  const startTime = Date.now()

  for (let p = effStart; p <= effEnd; p++) {
    if (existingPages.has(p)) {
      const existing = allResults.find(r => r.page === p)
      console.log(`ページ${p}: スキップ済み (${existing?.notes.length || 0}枚)`)
      continue
    }

    // 1. PDF → 画像
    const imgPath = await generatePageImage(p)
    if (!imgPath) continue

    // 2. API用にリサイズ
    const apiImg = await resizeForApi(imgPath)

    // 3. Gemini OCR + bbox
    process.stdout.write(`ページ${p}...`)
    const notes = await callGeminiOCR(apiImg)

    // API失敗（null）の場合は保存せずスキップ → 次回再処理される
    if (notes === null) {
      console.log(` ⚠ API失敗 → スキップ（次回再処理）`)
      // レート制限待ちは実行してから次へ（連続リクエスト防止）
      await new Promise(r => setTimeout(r, RATE_LIMIT_MS))
      continue
    }

    // 4. 個別切り抜き（元画像の高解像度版から）
    if (notes.length > 0) {
      await cropNotes(imgPath, notes, p)
    }

    // 5. 結果保存（cropNotes完了後にアトミック書き込み）
    const result: FusenPageResult = { page: p, notes }
    allResults.push(result)
    allResults.sort((a, b) => a.page - b.page)
    saveResultsAtomic(outputPath, allResults)

    processedCount++
    totalNotes += notes.length
    console.log(` ${notes.length}枚`)

    // 6. レート制限待機 + ETA表示
    const remaining = effEnd - p
    if (remaining > 0) {
      const elapsed = (Date.now() - startTime) / 1000
      const avgSec = elapsed / processedCount
      const eta = Math.ceil(avgSec * remaining / 60)
      console.log(`  [残${remaining}ページ, ETA ~${eta}分]`)
      await new Promise(r => setTimeout(r, RATE_LIMIT_MS))
    }
  }

  // サマリー
  const totalAll = allResults.reduce((s, r) => s + r.notes.length, 0)
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
  console.log(`\n=== 完了 ===`)
  console.log(`今回処理: ${processedCount}ページ / ${totalNotes}枚`)
  console.log(`累計: ${allResults.length}ページ / ${totalAll}枚`)
  console.log(`所要時間: ${elapsed}分`)
  console.log(`保存: ${outputPath}`)
  console.log(`画像: ${IMAGES_DIR}`)
}

main().catch(console.error)
