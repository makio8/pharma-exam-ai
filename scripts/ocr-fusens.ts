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

各付箋を個別に読み取り、JSON配列で出力してください。

■ note_type の分類基準（重要）:
- "knowledge": 知識の整理・定義・分類（「〇〇とは」「〇〇の定義」）
- "mnemonic": 語呂合わせ・覚え方・暗記法・単位換算の早見表（「〇〇で覚える」矢印で変換法を示すもの）
- "solution": 解法・計算手順・考え方のフロー（「まず〇〇→次に〇〇」導出過程）
- "caution": 注意点・ひっかけ・間違いやすいポイント（「〇〇に注意」「〇〇と混同しない」）
- "related": 比較表・まとめ・対比（「A vs B」番号付きリスト）

■ タイトルのルール:
- 赤字の見出しがあればそれをタイトルにする
- なければ内容を10文字以内で要約してタイトルを作る（絶対にnullにしない）

[{"title":"タイトル(10文字以内で必須)","body":"本文(数式・化学式含む)","subject":"物理|化学|生物|薬理|薬剤|病態・薬物治療|法規・制度・倫理|実務|衛生","note_type":"knowledge|mnemonic|solution|caution|related","tags":["タグ1","タグ2","タグ3"]}]

■ 分類の追加ルール（迷ったらこちらを優先）:
- 「〇〇 = △△」「〇〇 → △△」の変換・換算 → "mnemonic"
- 「〇〇で覚える」「ゴロ」「語呂」→ "mnemonic"
- 対数（log 2 = 0.3等）や数値の暗記 → "mnemonic"
- 「〇〇の定義」「〇〇とは」→ "knowledge"
- ①②③の番号リストで複数項目を整理 → "related"
- 計算過程・導出・フローチャート → "solution"
- 「注意」「間違いやすい」「禁忌」→ "caution"

注意:
- 手書き文字を可能な限り正確に読み取る
- 薬学・化学の専門用語は正確に
- 読み取れない部分は [不明] と記載
- JSONのみ出力（説明文不要）`

interface FusenOCRResult {
  page: number
  notes: {
    title: string
    body: string
    subject: string
    note_type: string
    tags: string[]
  }[]
}

async function ocrPage(pageNum: number): Promise<FusenOCRResult> {
  const padNum = String(pageNum).padStart(3, '0')
  const imgPath = path.join(IMG_DIR, `page-${padNum}.png`)

  // 画像生成
  if (!fs.existsSync(imgPath)) {
    const prefix = path.join(IMG_DIR, `tmp-page`)
    execSync(
      `pdftoppm -png -r 200 -f ${pageNum} -l ${pageNum} "${PDF_PATH}" "${prefix}"`,
      { timeout: 30000 }
    )
    // pdftoppmが生成したファイルを見つけてリネーム
    const files = fs.readdirSync(IMG_DIR).filter(f => f.startsWith('tmp-page') && f.endsWith('.png') && !f.includes('small'))
    if (files.length > 0) {
      fs.renameSync(path.join(IMG_DIR, files[0]), imgPath)
    }
  }

  if (!fs.existsSync(imgPath)) {
    console.error(`  画像生成失敗: page ${pageNum}`)
    return { page: pageNum, notes: [] }
  }

  // A3見開きを左右に分割（横幅 > 縦幅 なら見開き）
  const sizeInfo = execSync(`sips -g pixelWidth -g pixelHeight "${imgPath}" 2>/dev/null`, { encoding: 'utf-8' })
  const w = parseInt(sizeInfo.match(/pixelWidth:\s*(\d+)/)?.[1] || '0')
  const h = parseInt(sizeInfo.match(/pixelHeight:\s*(\d+)/)?.[1] || '0')

  const allNotes: any[] = []

  if (w > h * 1.2) {
    // 見開きページ → 左右に分割してそれぞれOCR
    const halfW = Math.floor(w / 2)
    const leftPath = path.join(IMG_DIR, `page-${padNum}-left.png`)
    const rightPath = path.join(IMG_DIR, `page-${padNum}-right.png`)

    if (!fs.existsSync(leftPath)) {
      execSync(`sips -c ${h} ${halfW} --cropOffset 0 0 "${imgPath}" --out "${leftPath}" 2>/dev/null`)
    }
    if (!fs.existsSync(rightPath)) {
      execSync(`sips -c ${h} ${halfW} --cropOffset 0 ${halfW} "${imgPath}" --out "${rightPath}" 2>/dev/null`)
    }

    // 左ページOCR
    const leftSmall = leftPath.replace('.png', '-small.png')
    execSync(`sips -Z 1000 "${leftPath}" --out "${leftSmall}" 2>/dev/null`)
    const leftNotes = await callGeminiOCR(leftSmall)
    allNotes.push(...leftNotes)

    // 右ページOCR
    const rightSmall = rightPath.replace('.png', '-small.png')
    execSync(`sips -Z 1000 "${rightPath}" --out "${rightSmall}" 2>/dev/null`)
    const rightNotes = await callGeminiOCR(rightSmall)
    allNotes.push(...rightNotes)
  } else {
    // 単ページ → そのままOCR
    const smallPath = imgPath.replace('.png', '-small.png')
    execSync(`sips -Z 1200 "${imgPath}" --out "${smallPath}" 2>/dev/null`)
    const notes = await callGeminiOCR(smallPath)
    allNotes.push(...notes)
  }

  return { page: pageNum, notes: allNotes }
}

/** Gemini Vision API で画像内の付箋をOCR */
async function callGeminiOCR(imgPath: string): Promise<any[]> {
  const imgB64 = fs.readFileSync(imgPath).toString('base64')

  // リトライロジック（429レート制限対策）
  let retries = 0
  const maxRetries = 3

  let response: Response
  while (true) {
    response = await fetch(
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
      const waitSec = Math.pow(2, retries) * 5 // 10秒、20秒、40秒
      console.error(`  429レート制限 → ${waitSec}秒待機 (retry ${retries}/${maxRetries})`)
      await new Promise(r => setTimeout(r, waitSec * 1000))
      continue
    }
    break
  }

  const data = await response.json() as any
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  if (!text) {
    console.error(`  API応答なし. status=${response.status}, error=${JSON.stringify(data.error || {})}`)
    return []
  }

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    console.error(`  JSON抽出失敗: ${text.substring(0, 100)}`)
  } catch (e) {
    console.error(`  JSONパース失敗: ${text.substring(0, 100)}`)
  }
  return []
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
