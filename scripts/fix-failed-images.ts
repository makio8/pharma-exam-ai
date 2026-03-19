/**
 * 失敗した29問の画像をスマートな再クロップで修正する
 *
 * 2種類の失敗に対して異なる戦略で対処:
 * 1. cover_page (10問): PDFの全ページをスキャンして正しいページを見つける
 * 2. q_not_in_crop (19問): 正しいページを見つけ、より広いマージンでクロップ
 *
 * PDFによって問番号のフォーマットが異なる:
 * - パターンA: 単語として分離 "問" + "233（実務）"
 * - パターンB: 結合された単語 "問6"
 * 両方に対応するため、独自のスキャン関数を使う
 *
 * npx tsx scripts/fix-failed-images.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { parseBboxPage, isCoverPage } from './lib/bbox-parser.ts'
import { cropImage, pdfToPixel } from './lib/crop-utils.ts'
import type { QuestionPosition, PageInfo } from './lib/bbox-parser.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PDF_DIR = '/tmp/claude'
const PUBLIC_DIR = path.join(__dirname, '..', 'public')

// --- PDF設定 ---
interface PdfConfig {
  suffix: string
  qRange: [number, number]
}

const PDF_CONFIGS: PdfConfig[] = [
  { suffix: 'hissu',   qRange: [1,   90]  },
  { suffix: 'riron1',  qRange: [91,  150] },
  { suffix: 'riron2',  qRange: [151, 195] },
  { suffix: 'jissen1', qRange: [196, 245] },
  { suffix: 'jissen2', qRange: [246, 285] },
  { suffix: 'jissen3', qRange: [286, 345] },
]

function getPdfSuffix(questionNumber: number): string {
  for (const cfg of PDF_CONFIGS) {
    if (questionNumber >= cfg.qRange[0] && questionNumber <= cfg.qRange[1]) {
      return cfg.suffix
    }
  }
  return 'hissu'
}

// --- ユーティリティ ---
function getPdfPageCount(pdfPath: string): number {
  try {
    const info = execSync(`pdfinfo "${pdfPath}" 2>/dev/null`, { encoding: 'utf-8' })
    const m = info.match(/Pages:\s+(\d+)/)
    return m ? parseInt(m[1]) : 0
  } catch {
    return 0
  }
}

function getBboxHtml(pdfPath: string, page: number): string {
  try {
    return execSync(`pdftotext -bbox -f ${page} -l ${page} "${pdfPath}" -`, {
      encoding: 'utf-8',
      timeout: 10000,
    })
  } catch {
    return ''
  }
}

function findPageImage(year: number, prefix: string, page: number): string | null {
  const pagesDir = `/tmp/claude/exam-pages/${year}`
  // 2桁パディング
  const pad2 = path.join(pagesDir, `${prefix}-${String(page).padStart(2, '0')}.png`)
  if (fs.existsSync(pad2)) return pad2
  // 3桁パディング
  const pad3 = path.join(pagesDir, `${prefix}-${String(page).padStart(3, '0')}.png`)
  if (fs.existsSync(pad3)) return pad3
  return null
}

/**
 * 拡張版の問番号検索:
 * 通常のfindQuestionPositionsが対応しない形式にも対応する
 *
 * 対応パターン:
 * 1. 単語結合型: <word>問6</word>  (必須問題のPDFなど)
 * 2. 分離型:    <word>問</word><word>233（実務）</word>  (実践問題のPDFなど)
 * 3. 分離+ピュア数字: <word>問</word><word>233</word>  (一部のPDF)
 */
function findQuestionPositionsRobust(html: string): QuestionPosition[] {
  const positions: QuestionPosition[] = []

  // パターン1: <word ...>問N</word> (Nは数字のみ、または数字で始まる)
  // "問6", "問90" など
  const combinedRegex = /<word\s+xMin="[\d.]+"\s+yMin="([\d.]+)"\s+xMax="[\d.]+"\s+yMax="[\d.]+">問(\d+)<\/word>/g
  let m: RegExpExecArray | null
  while ((m = combinedRegex.exec(html)) !== null) {
    const yMin = parseFloat(m[1])
    const num = parseInt(m[2])
    if (num >= 1 && num <= 345) {
      positions.push({ questionNumber: num, yMin })
    }
  }

  // パターン2: <word>問</word> に続く <word>NUMBER... </word>
  // "問" の直後のwordが数字で始まる場合
  // 例: <word>問</word><word>233（実務）</word>
  const wordRegex = /<word\s+xMin="[\d.]+"\s+yMin="([\d.]+)"\s+xMax="[\d.]+"\s+yMax="[\d.]+">([^<]*)<\/word>/g
  const allWords: Array<{ text: string; yMin: number }> = []
  let wm: RegExpExecArray | null
  while ((wm = wordRegex.exec(html)) !== null) {
    allWords.push({ yMin: parseFloat(wm[1]), text: wm[2] })
  }

  for (let i = 0; i < allWords.length; i++) {
    const w = allWords[i]
    if (w.text !== '問') continue
    const next = allWords[i + 1]
    if (!next) continue
    // Same line check
    if (Math.abs(next.yMin - w.yMin) > 5) continue
    // Extract leading number from next.text (e.g., "233（実務）" → 233)
    const numMatch = next.text.match(/^(\d+)/)
    if (!numMatch) continue
    const num = parseInt(numMatch[1])
    if (num < 1 || num > 345) continue
    // Avoid duplicates from pattern 1
    if (!positions.some(p => p.questionNumber === num && Math.abs(p.yMin - w.yMin) < 5)) {
      positions.push({ questionNumber: num, yMin: w.yMin })
    }
  }

  return positions
}

// --- スキャン結果 ---
interface FoundPage {
  pdfPath: string
  prefix: string
  pageNum: number
  pageInfo: PageInfo
  positions: QuestionPosition[]
}

/**
 * PDFの全ページをスキャンして、指定の問題番号を含む正しいページを見つける
 * カバーページはスキップする
 * 拡張版パーサーを使用して両フォーマットに対応
 */
function findCorrectPage(year: number, questionNumber: number): FoundPage | null {
  const suffix = getPdfSuffix(questionNumber)
  const pdfPath = path.join(PDF_DIR, `q${year}-${suffix}.pdf`)

  if (!fs.existsSync(pdfPath)) {
    console.log(`    警告: PDFなし ${pdfPath}`)
    return null
  }

  const totalPages = getPdfPageCount(pdfPath)
  if (totalPages === 0) {
    console.log(`    警告: ページ数取得失敗 ${pdfPath}`)
    return null
  }

  const prefix = `q${year}-${suffix}`

  for (let p = 1; p <= totalPages; p++) {
    const html = getBboxHtml(pdfPath, p)
    if (!html) continue

    const pageInfo = parseBboxPage(html)

    // 拡張版パーサーで問題番号を探す（カバーページ判定の前に）
    const positions = findQuestionPositionsRobust(html)

    // 問題番号が見つかったページは、たとえカバーページと判定されても使う
    // (例: 問題文中に"注意事項"という単語が含まれる場合、誤ってカバーページと判定される)
    if (positions.some(pos => pos.questionNumber === questionNumber)) {
      return { pdfPath, prefix, pageNum: p, pageInfo, positions }
    }

    // 問題番号が見つからない場合のみ、カバーページを確認してスキップ
    if (isCoverPage(pageInfo)) continue
  }

  return null
}

// --- fix対象の型 ---
interface FailureEntry {
  id: string
  year: number
  question_number: number
  reason: 'cover_page' | 'q_not_in_crop'
  details: string
}

// --- 修正ログの型 ---
interface FixLog {
  id: string
  oldReason: string
  action: string
  success: boolean
  message?: string
}

// --- cover_page の修正 ---
/**
 * cover_page 失敗: PDFの正しいページを探して再クロップする
 */
async function fixCoverPage(entry: FailureEntry): Promise<FixLog> {
  const log: FixLog = {
    id: entry.id,
    oldReason: entry.reason,
    action: 'scan_all_pages_for_correct_page',
    success: false,
  }

  const found = findCorrectPage(entry.year, entry.question_number)

  if (!found) {
    log.message = `正しいページが見つからなかった (q${entry.question_number})`
    console.log(`  [${entry.id}] FAIL: ${log.message}`)
    return log
  }

  const { prefix, pageNum, pageInfo, positions } = found
  const imgPath = findPageImage(entry.year, prefix, pageNum)

  if (!imgPath) {
    log.message = `ページ画像なし: ${prefix}-${pageNum}`
    console.log(`  [${entry.id}] FAIL: ${log.message}`)
    return log
  }

  const metadata = await sharp(imgPath).metadata()
  const imageHeight = metadata.height ?? 0
  if (imageHeight === 0) {
    log.message = `画像メタデータ取得失敗: ${imgPath}`
    console.log(`  [${entry.id}] FAIL: ${log.message}`)
    return log
  }

  const qPos = positions.find(p => p.questionNumber === entry.question_number)

  if (!qPos) {
    log.message = `ページ内に問${entry.question_number}の座標が見つからない`
    console.log(`  [${entry.id}] FAIL: ${log.message}`)
    return log
  }

  const MARGIN_TOP = 20
  const MARGIN_BOTTOM = 30
  const imgWidth = metadata.width ?? 0

  const posIdx = positions.findIndex(p => p.questionNumber === entry.question_number)
  const nextQPos = posIdx < positions.length - 1 ? positions[posIdx + 1] : null

  let top = pdfToPixel(qPos.yMin) - MARGIN_TOP
  let bottom: number
  if (nextQPos) {
    bottom = pdfToPixel(nextQPos.yMin) - MARGIN_BOTTOM
  } else {
    bottom = imageHeight - 10
  }

  top = Math.max(0, top)
  bottom = Math.min(imageHeight, bottom)

  const region = {
    left: 0,
    top,
    width: imgWidth,
    height: Math.max(1, bottom - top),
  }

  const outputDir = path.join(PUBLIC_DIR, 'images', 'questions', String(entry.year))
  fs.mkdirSync(outputDir, { recursive: true })
  const destFile = path.join(outputDir, `q${String(entry.question_number).padStart(3, '0')}.png`)

  const ok = await cropImage(imgPath, region, destFile)
  log.success = ok
  log.action = `correct_page_found: ${prefix}-p${pageNum}, y[${region.top}, ${region.top + region.height}]`
  log.message = ok ? `OK: ${prefix} p${pageNum} → ${path.basename(destFile)}` : 'cropImage失敗'

  console.log(`  [${entry.id}] ${ok ? 'OK ' : 'FAIL'}: cover→正しいページ p${pageNum} (${prefix})`)
  return log
}

// --- q_not_in_crop の修正 ---
/**
 * q_not_in_crop 失敗: 正しいページを探して、より広いマージンでクロップする
 * - 1問だけのページ: ページ全体をクロップ (上50px/下30px削除)
 * - 複数問のページ: MARGIN_TOP=40, MARGIN_BOTTOM=50 で再クロップ
 */
async function fixQNotInCrop(entry: FailureEntry): Promise<FixLog> {
  const log: FixLog = {
    id: entry.id,
    oldReason: entry.reason,
    action: 'wider_crop',
    success: false,
  }

  const found = findCorrectPage(entry.year, entry.question_number)

  if (!found) {
    log.message = `正しいページが見つからなかった (q${entry.question_number})`
    console.log(`  [${entry.id}] FAIL: ${log.message}`)
    return log
  }

  const { prefix, pageNum, positions } = found
  const imgPath = findPageImage(entry.year, prefix, pageNum)

  if (!imgPath) {
    log.message = `ページ画像なし: ${prefix}-${pageNum}`
    console.log(`  [${entry.id}] FAIL: ${log.message}`)
    return log
  }

  const metadata = await sharp(imgPath).metadata()
  const imageWidth = metadata.width ?? 0
  const imageHeight = metadata.height ?? 0
  if (imageHeight === 0) {
    log.message = `画像メタデータ取得失敗: ${imgPath}`
    console.log(`  [${entry.id}] FAIL: ${log.message}`)
    return log
  }

  const qPos = positions.find(p => p.questionNumber === entry.question_number)

  let region: { left: number; top: number; width: number; height: number }

  if (positions.length <= 1) {
    // このページには1問しかない → ページ全体を使う (上50px, 下30px除く)
    const top = 50
    const bottom = imageHeight - 30
    region = {
      left: 0,
      top,
      width: imageWidth,
      height: Math.max(1, bottom - top),
    }
    log.action = `full_page: y[${top}, ${bottom}] (1問のみ)`
  } else if (!qPos) {
    // 問の座標が見つからない → ページ全体にフォールバック
    const top = 50
    const bottom = imageHeight - 30
    region = {
      left: 0,
      top,
      width: imageWidth,
      height: Math.max(1, bottom - top),
    }
    log.action = `full_page_fallback: 座標未発見`
  } else {
    // 複数問あるページ → 広いマージンで再クロップ
    const WIDE_MARGIN_TOP = 40
    const WIDE_MARGIN_BOTTOM = 50

    const posIdx = positions.findIndex(p => p.questionNumber === entry.question_number)
    const nextQPos = posIdx < positions.length - 1 ? positions[posIdx + 1] : null

    let top = pdfToPixel(qPos.yMin) - WIDE_MARGIN_TOP
    let bottom: number
    if (nextQPos) {
      bottom = pdfToPixel(nextQPos.yMin) - WIDE_MARGIN_BOTTOM
    } else {
      bottom = imageHeight - 10
    }

    top = Math.max(0, top)
    bottom = Math.min(imageHeight, bottom)

    region = {
      left: 0,
      top,
      width: imageWidth,
      height: Math.max(1, bottom - top),
    }
    log.action = `wide_margin: MARGIN_TOP=40 MARGIN_BOTTOM=50, y[${top}, ${bottom}]`
  }

  const outputDir = path.join(PUBLIC_DIR, 'images', 'questions', String(entry.year))
  fs.mkdirSync(outputDir, { recursive: true })
  const destFile = path.join(outputDir, `q${String(entry.question_number).padStart(3, '0')}.png`)

  const ok = await cropImage(imgPath, region, destFile)
  log.success = ok
  log.message = ok
    ? `OK: ${prefix} p${pageNum} → ${path.basename(destFile)}`
    : 'cropImage失敗'

  console.log(`  [${entry.id}] ${ok ? 'OK ' : 'FAIL'}: not_in_crop→${log.action}`)
  return log
}

// --- メイン ---
async function main() {
  console.log('=== 失敗画像の修正スクリプト ===\n')

  // quality-report.json を読み込む
  const reportPath = path.join(__dirname, 'quality-report.json')
  if (!fs.existsSync(reportPath)) {
    console.error(`エラー: quality-report.json が見つかりません: ${reportPath}`)
    process.exit(1)
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'))
  const failures: FailureEntry[] = report.failures.filter(
    (f: FailureEntry) => f.reason === 'cover_page' || f.reason === 'q_not_in_crop'
  )

  const coverPageFailures = failures.filter(f => f.reason === 'cover_page')
  const notInCropFailures = failures.filter(f => f.reason === 'q_not_in_crop')

  console.log(`対象: ${failures.length}問 (cover_page: ${coverPageFailures.length}, q_not_in_crop: ${notInCropFailures.length})\n`)

  const logs: FixLog[] = []

  // cover_page の修正
  if (coverPageFailures.length > 0) {
    console.log(`--- cover_page (${coverPageFailures.length}問) ---`)
    for (const entry of coverPageFailures) {
      const log = await fixCoverPage(entry)
      logs.push(log)
    }
    console.log()
  }

  // q_not_in_crop の修正
  if (notInCropFailures.length > 0) {
    console.log(`--- q_not_in_crop (${notInCropFailures.length}問) ---`)
    for (const entry of notInCropFailures) {
      const log = await fixQNotInCrop(entry)
      logs.push(log)
    }
    console.log()
  }

  // サマリー
  const succeeded = logs.filter(l => l.success).length
  const failed = logs.filter(l => !l.success).length

  console.log('=== 修正結果サマリー ===')
  console.log(`成功: ${succeeded}/${logs.length}`)
  console.log(`失敗: ${failed}/${logs.length}`)
  console.log()

  if (failed > 0) {
    console.log('失敗した問題:')
    for (const l of logs.filter(l => !l.success)) {
      console.log(`  [${l.id}] ${l.oldReason} → ${l.message}`)
    }
    console.log()
  }

  if (succeeded > 0) {
    console.log('成功した問題:')
    for (const l of logs.filter(l => l.success)) {
      console.log(`  [${l.id}] → ${l.action}`)
    }
    console.log()
  }

  console.log('次のコマンドで品質を再検証してください:')
  console.log('  npx tsx scripts/validate-image-quality.ts')
}

main().catch(console.error)
