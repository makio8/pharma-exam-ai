/**
 * 付箋OCRパイプライン: Gemini Vision で手書き付箋をテキスト化
 *
 * 入力: Google Driveの付箋PDF → ページ画像
 * 処理: Gemini 2.5 Flash で OCR → JSON構造化
 * 出力: src/data/fusens/ocr-results.json
 *
 * npx tsx scripts/ocr-fusens.ts [--page 1] [--pages 5]
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// CLI引数
const args = process.argv.slice(2)
const startPage = parseInt(args.find(a => a === '--page')
  ? args[args.indexOf('--page') + 1] : '1')
const numPages = parseInt(args.find(a => a === '--pages')
  ? args[args.indexOf('--pages') + 1] : '3')

const API_KEY = (() => {
  const envPath = path.join(__dirname, '..', '.env.local')
  const content = fs.readFileSync(envPath, 'utf-8')
  const match = content.match(/GOOGLE_AI_API_KEY=(.+)/)
  return match ? match[1].trim() : ''
})()

if (!API_KEY) {
  console.error('GOOGLE_AI_API_KEY not found in .env.local')
  process.exit(1)
}

const PDF_PATH = '/tmp/claude/fusens/all-subjects.pdf'
const IMG_DIR = '/tmp/claude/fusens/pages'
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data', 'fusens')

const PROMPT = `あなたは薬学の専門家です。この画像は薬剤師国家試験の学習ノートで、ルーズリーフに手書きの付箋が貼られています。

この画像に含まれる全ての付箋を個別に読み取り、以下のJSON配列形式で出力してください。

[
  {
    "title": "付箋のタイトル（赤字の見出し。なければ内容から推定）",
    "body": "本文テキスト（数式・化学式を含む。改行は\\nで表現）",
    "subject": "物理|化学|生物|薬理|薬剤|病態・薬物治療|法規・制度・倫理|実務|衛生",
    "note_type": "knowledge|solution|mnemonic|caution|related",
    "tags": ["タグ1", "タグ2", "タグ3"],
    "color": "yellow|pink|green|blue|orange"
  }
]

注意:
- 手書き文字を可能な限り正確に読み取ってください
- 薬学・化学の専門用語（受容体名、薬物名、化学式等）は正確に
- 付箋の色（黄色・ピンク・緑・青等）も記録
- 読み取れない部分は [不明] と記載
- JSONのみ出力（説明文は不要）`

interface FusenOCRResult {
  page: number
  notes: {
    title: string
    body: string
    subject: string
    note_type: string
    tags: string[]
    color: string
  }[]
}

async function ocrPage(pageNum: number): Promise<FusenOCRResult> {
  // ページ画像を生成
  const imgPath = path.join(IMG_DIR, `page-${String(pageNum).padStart(3, '0')}.png`)

  if (!fs.existsSync(imgPath)) {
    execSync(
      `pdftoppm -png -r 200 -f ${pageNum} -l ${pageNum} "${PDF_PATH}" "${IMG_DIR}/page"`,
      { timeout: 30000 }
    )
    // pdftoppmは page-001.png のように生成するのでリネーム
    const generated = fs.readdirSync(IMG_DIR).find(f => f.startsWith('page-') && f.endsWith('.png'))
    if (generated) {
      const src = path.join(IMG_DIR, generated)
      fs.renameSync(src, imgPath)
    }
  }

  if (!fs.existsSync(imgPath)) {
    console.error(`  画像生成失敗: page ${pageNum}`)
    return { page: pageNum, notes: [] }
  }

  // 画像を縮小（API制限対策）
  const smallPath = imgPath.replace('.png', '-small.png')
  execSync(`sips -Z 1200 "${imgPath}" --out "${smallPath}" 2>/dev/null`)

  // base64エンコード
  const imgB64 = fs.readFileSync(smallPath).toString('base64')

  // Gemini API呼び出し
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

  const data = await response.json() as any
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // JSONを抽出（```json...```ブロックまたは直接JSON）
  let notes: any[] = []
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      notes = JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    console.error(`  JSONパース失敗（page ${pageNum}）: ${text.substring(0, 100)}`)
  }

  return { page: pageNum, notes }
}

async function main() {
  fs.mkdirSync(IMG_DIR, { recursive: true })
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  // PDFの総ページ数確認
  const info = execSync(`pdfinfo "${PDF_PATH}" 2>/dev/null`, { encoding: 'utf-8' })
  const totalPages = parseInt(info.match(/Pages:\s+(\d+)/)?.[1] || '0')
  console.log(`付箋PDF: ${totalPages}ページ`)

  const endPage = Math.min(startPage + numPages - 1, totalPages)
  console.log(`処理: ページ${startPage}〜${endPage}\n`)

  // 既存結果を読み込み
  const outputPath = path.join(OUTPUT_DIR, 'ocr-results.json')
  let allResults: FusenOCRResult[] = []
  try {
    allResults = JSON.parse(fs.readFileSync(outputPath, 'utf-8'))
  } catch {}
  const existingPages = new Set(allResults.map(r => r.page))

  let totalNotes = 0

  for (let p = startPage; p <= endPage; p++) {
    if (existingPages.has(p)) {
      console.log(`ページ${p}: スキップ（処理済み）`)
      continue
    }

    process.stdout.write(`ページ${p}...`)
    const result = await ocrPage(p)
    allResults.push(result)
    totalNotes += result.notes.length
    console.log(` ${result.notes.length}枚の付箋を検出`)

    // 1ページごとに保存
    fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2), 'utf-8')

    // レート制限対策
    await new Promise(r => setTimeout(r, 2000))
  }

  console.log(`\n=== 結果 ===`)
  console.log(`処理ページ: ${startPage}〜${endPage}`)
  console.log(`検出付箋数: ${totalNotes}枚`)
  console.log(`累計: ${allResults.reduce((s, r) => s + r.notes.length, 0)}枚`)
  console.log(`保存: ${outputPath}`)
}

main().catch(console.error)
