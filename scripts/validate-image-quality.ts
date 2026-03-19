/**
 * 画像問題の品質バリデーション
 * 867問の画像を5つのチェック項目で検証し、quality-report.json を生成する
 *
 * npx tsx scripts/validate-image-quality.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { parseBboxPage, findQuestionPositions, isCoverPage, type PageInfo } from './lib/bbox-parser.ts'
import { cleanQuestionText } from './lib/text-cleaner.ts'
import { pdfToPixel } from './lib/crop-utils.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PUBLIC_DIR = path.join(__dirname, '..', 'public')
const PDF_DIR = '/tmp/claude'

// --- PDF 設定 ---
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

// --- PDF ページキャッシュ ---
// key: "${year}-${suffix}-${page}" → PageInfo | null
const pageCache = new Map<string, PageInfo | null>()

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

/** PDF の全ページを解析してキャッシュする */
function loadPdfPages(year: number, suffix: string): void {
  const pdfPath = path.join(PDF_DIR, `q${year}-${suffix}.pdf`)
  if (!fs.existsSync(pdfPath)) return

  const totalPages = getPdfPageCount(pdfPath)
  for (let p = 1; p <= totalPages; p++) {
    const cacheKey = `${year}-${suffix}-${p}`
    if (pageCache.has(cacheKey)) continue
    const html = getBboxHtml(pdfPath, p)
    if (!html) {
      pageCache.set(cacheKey, null)
      continue
    }
    const pageInfo = parseBboxPage(html)
    pageCache.set(cacheKey, pageInfo)
  }
}

/** 問題番号を含むページを探す (year, suffix から) */
function findPageForQuestion(year: number, suffix: string, questionNumber: number): { page: number; pageInfo: PageInfo } | null {
  const pdfPath = path.join(PDF_DIR, `q${year}-${suffix}.pdf`)
  if (!fs.existsSync(pdfPath)) return null

  const totalPages = getPdfPageCount(pdfPath)
  for (let p = 1; p <= totalPages; p++) {
    const cacheKey = `${year}-${suffix}-${p}`
    const pageInfo = pageCache.get(cacheKey)
    if (!pageInfo) continue

    const positions = findQuestionPositions(pageInfo)
    if (positions.some(pos => pos.questionNumber === questionNumber)) {
      return { page: p, pageInfo }
    }
  }
  return null
}

// --- データ読み込み ---
interface QuestionData {
  id: string
  year: number
  question_number: number
  question_text: string
  image_url?: string
  choices: unknown[]
}

function loadExamQuestions(year: number): QuestionData[] {
  const tsPath = path.join(__dirname, '..', 'src', 'data', 'real-questions', `exam-${year}.ts`)
  if (!fs.existsSync(tsPath)) return []

  const content = fs.readFileSync(tsPath, 'utf-8')
  const arrayStart = content.indexOf('[\n')
  if (arrayStart === -1) return []

  const jsonPart = content.substring(arrayStart).trimEnd()
  // TypeScript 末尾を除去（]の後）
  const lastBracket = jsonPart.lastIndexOf(']')
  const cleanJson = jsonPart.substring(0, lastBracket + 1)

  try {
    const questions = JSON.parse(cleanJson) as QuestionData[]
    return questions.filter(q => !q.choices || q.choices.length === 0)
  } catch (e) {
    console.error(`  警告: exam-${year}.ts のJSONパースエラー: ${(e as Error).message}`)
    return []
  }
}

// --- チェック関数 ---

/** Check 1: 画像ファイルが存在するか */
function checkFileExists(imageUrl: string): boolean {
  if (!imageUrl) return false
  const fullPath = path.join(PUBLIC_DIR, imageUrl)
  return fs.existsSync(fullPath)
}

/** Check 2: 画像サイズが十分か (height >= 100px, width >= 300px) */
async function checkImageSize(imageUrl: string): Promise<{ ok: boolean; width?: number; height?: number }> {
  const fullPath = path.join(PUBLIC_DIR, imageUrl)
  try {
    const metadata = await sharp(fullPath).metadata()
    const w = metadata.width ?? 0
    const h = metadata.height ?? 0
    return { ok: h >= 100 && w >= 300, width: w, height: h }
  } catch {
    return { ok: false }
  }
}

/** Check 3 & 4: カバーページでないか / 問番号がクロップ領域内にあるか */
function checkSourcePage(
  year: number,
  questionNumber: number
): { notCover: boolean; qInCrop: boolean; reason?: string } {
  const suffix = getPdfSuffix(questionNumber)
  const result = findPageForQuestion(year, suffix, questionNumber)

  if (!result) {
    // PDFが見つからない or ページにこの問題がない
    return { notCover: true, qInCrop: false, reason: `PDF page not found for q${questionNumber}` }
  }

  const { pageInfo } = result

  // Check 3: カバーページチェック
  if (isCoverPage(pageInfo)) {
    return { notCover: false, qInCrop: false, reason: '注意事項ページを検出' }
  }

  // Check 4: 問番号の Y 座標がクロップ領域内にあるか
  const positions = findQuestionPositions(pageInfo)
  const qPos = positions.find(p => p.questionNumber === questionNumber)

  if (!qPos) {
    return { notCover: true, qInCrop: false, reason: `問${questionNumber}の位置が見つからない` }
  }

  // クロップ領域を再現: 問位置から次の問の直前まで
  const posIdx = positions.findIndex(p => p.questionNumber === questionNumber)
  const nextQPos = posIdx < positions.length - 1 ? positions[posIdx + 1] : null

  const MARGIN_TOP = 20
  const MARGIN_BOTTOM = 30
  const topPx = Math.max(0, pdfToPixel(qPos.yMin) - MARGIN_TOP)
  const bottomPx = nextQPos
    ? pdfToPixel(nextQPos.yMin) - MARGIN_BOTTOM
    : pdfToPixel(pageInfo.height) - 10

  // 問番号のY座標（PDF→pixel変換後）がクロップ範囲内にあるか
  const qYPx = pdfToPixel(qPos.yMin)
  const inCrop = qYPx >= topPx && qYPx <= bottomPx

  return { notCover: true, qInCrop: inCrop, reason: inCrop ? undefined : `Y座標 ${qYPx}px がクロップ範囲[${topPx}, ${bottomPx}]外` }
}

/** Check 5: テキストがクリーン（さらに変更不要）か */
function checkTextClean(text: string): boolean {
  if (!text) return true
  const cleaned = cleanQuestionText(text)
  return cleaned === text.trim() || cleaned === text
}

// --- レポート型 ---
interface CheckResult {
  file_exists: boolean
  size_ok: boolean
  not_cover: boolean
  q_in_crop: boolean
  text_clean: boolean
}

type FailReason = 'no_image' | 'too_small' | 'cover_page' | 'q_not_in_crop' | 'text_dirty'

interface FailureEntry {
  id: string
  year: number
  question_number: number
  checks: CheckResult
  reason: FailReason
  details: string
}

interface YearStats {
  total: number
  passed: number
  failed: number
}

interface QualityReport {
  timestamp: string
  total: number
  passed: number
  failed: number
  pass_rate: string
  by_year: Record<string, YearStats>
  failures: FailureEntry[]
}

// --- メイン ---
async function main() {
  console.log('=== 画像品質バリデーション開始 ===')
  console.log('対象: 第100回〜第110回 / choices空の問題のみ\n')

  const years = Array.from({ length: 11 }, (_, i) => 100 + i)

  // 全問題を読み込む
  const allQuestions: QuestionData[] = []
  for (const year of years) {
    const qs = loadExamQuestions(year)
    allQuestions.push(...qs)
    console.log(`第${year}回: ${qs.length}問 読み込み`)
  }
  console.log(`\n合計: ${allQuestions.length}問\n`)

  // PDFページをプリロード（キャッシュ）
  console.log('PDFページをプリロード中...')
  const usedYearSuffixes = new Set<string>()
  for (const q of allQuestions) {
    const suffix = getPdfSuffix(q.question_number)
    usedYearSuffixes.add(`${q.year}-${suffix}`)
  }
  for (const ys of usedYearSuffixes) {
    const [yearStr, suffix] = ys.split('-', 2)
    const year = parseInt(yearStr)
    process.stdout.write(`  ${ys}... `)
    loadPdfPages(year, suffix)
    console.log('完了')
  }
  console.log()

  // 各問題を検証
  const failures: FailureEntry[] = []
  const byYear: Record<string, YearStats> = {}

  let passed = 0
  let failed = 0
  let processed = 0

  for (const q of allQuestions) {
    const yearKey = String(q.year)
    if (!byYear[yearKey]) byYear[yearKey] = { total: 0, passed: 0, failed: 0 }
    byYear[yearKey].total++
    processed++

    if (processed % 50 === 0) {
      process.stdout.write(`\r  進捗: ${processed}/${allQuestions.length}問...`)
    }

    const checks: CheckResult = {
      file_exists: false,
      size_ok: false,
      not_cover: false,
      q_in_crop: false,
      text_clean: false,
    }

    let reason: FailReason | null = null
    let details = ''

    // Check 1: ファイル存在
    const imageUrl = q.image_url ?? ''
    checks.file_exists = checkFileExists(imageUrl)

    if (!checks.file_exists) {
      reason = 'no_image'
      details = imageUrl ? `ファイルが見つからない: ${imageUrl}` : 'image_url が未設定'
      // Check 3, 4 は no_image でスキップ
      checks.not_cover = false
      checks.q_in_crop = false
    } else {
      // Check 2: サイズ
      const sizeResult = await checkImageSize(imageUrl)
      checks.size_ok = sizeResult.ok

      if (!checks.size_ok && reason === null) {
        reason = 'too_small'
        details = `サイズ不足: ${sizeResult.width}x${sizeResult.height}px (要: 300x100以上)`
      }

      // Check 3 & 4: カバーページ / q_in_crop
      const sourceCheck = checkSourcePage(q.year, q.question_number)
      checks.not_cover = sourceCheck.notCover
      checks.q_in_crop = sourceCheck.qInCrop

      if (!checks.not_cover && reason === null) {
        reason = 'cover_page'
        details = sourceCheck.reason ?? 'カバーページを検出'
      } else if (!checks.q_in_crop && reason === null) {
        reason = 'q_not_in_crop'
        details = sourceCheck.reason ?? '問番号がクロップ範囲外'
      }
    }

    // Check 5: テキストクリーン
    checks.text_clean = checkTextClean(q.question_text)
    if (!checks.text_clean && reason === null) {
      reason = 'text_dirty'
      details = 'cleanQuestionText() で変更が発生する'
    }

    // 結果集計
    const isPass =
      checks.file_exists &&
      checks.size_ok &&
      checks.not_cover &&
      checks.q_in_crop &&
      checks.text_clean

    if (isPass) {
      passed++
      byYear[yearKey].passed++
    } else {
      failed++
      byYear[yearKey].failed++
      failures.push({
        id: q.id,
        year: q.year,
        question_number: q.question_number,
        checks,
        reason: reason ?? 'no_image',
        details,
      })
    }
  }

  console.log(`\n\n検証完了: ${allQuestions.length}問\n`)

  // レポート生成
  const total = allQuestions.length
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) + '%' : '0%'

  const report: QualityReport = {
    timestamp: new Date().toISOString(),
    total,
    passed,
    failed,
    pass_rate: passRate,
    by_year: byYear,
    failures,
  }

  // JSON保存
  const reportPath = path.join(__dirname, 'quality-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8')
  console.log(`レポートを保存: ${reportPath}\n`)

  // コンソールサマリー
  console.log('=== 品質レポート ===')
  console.log(`合計: ${total}問`)
  console.log(`合格: ${passed}問 (${passRate})`)
  console.log(`不合格: ${failed}問`)

  if (failed > 0) {
    // 失敗理由の内訳
    const reasonCounts: Record<FailReason, number> = {
      no_image: 0,
      too_small: 0,
      cover_page: 0,
      q_not_in_crop: 0,
      text_dirty: 0,
    }
    for (const f of failures) {
      reasonCounts[f.reason]++
    }

    console.log('\n失敗理由の内訳:')
    const order: FailReason[] = ['no_image', 'too_small', 'cover_page', 'q_not_in_crop', 'text_dirty']
    for (const r of order) {
      if (reasonCounts[r] > 0) {
        console.log(`  ${r}: ${reasonCounts[r]}`)
      }
    }
  }

  console.log('\n=== 年度別 ===')
  for (const year of years) {
    const ys = byYear[String(year)]
    if (!ys) continue
    const yRate = ys.total > 0 ? ((ys.passed / ys.total) * 100).toFixed(1) : '0.0'
    console.log(`第${year}回: ${ys.total}問 → 合格${ys.passed} / 不合格${ys.failed} (${yRate}%)`)
  }
}

main().catch(console.error)
