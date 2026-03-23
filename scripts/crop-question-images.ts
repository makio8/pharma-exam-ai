/**
 * 座標ベースで問題画像をクロップする
 * pdftotext -bbox の座標情報を使い、問題ごとに必要な領域だけ切り出す
 *
 * npx tsx scripts/crop-question-images.ts --year 100       # 単年
 * npx tsx scripts/crop-question-images.ts --year 100-110   # 範囲指定
 * npx tsx scripts/crop-question-images.ts                  # デフォルト: 100-110
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { parseBboxPage, findQuestionPositions, isCoverPage } from './lib/bbox-parser.ts'
import { calcCropRegion, cropImage } from './lib/crop-utils.ts'
import { PAGES_DIR, OUTPUT_DIR, REAL_QUESTIONS_DIR, PDF_DIR } from './lib/paths.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// --- PDF設定 ---
interface PdfConfig {
  file: string
  prefix: string
  section: string
  qRange: [number, number]
}

function getPdfConfigs(year: number): PdfConfig[] {
  return [
    { file: `q${year}-hissu.pdf`, prefix: `q${year}-hissu`, section: '必須', qRange: [1, 90] },
    { file: `q${year}-riron1.pdf`, prefix: `q${year}-riron1`, section: '理論', qRange: [91, 150] },
    { file: `q${year}-riron2.pdf`, prefix: `q${year}-riron2`, section: '理論', qRange: [151, 195] },
    { file: `q${year}-jissen1.pdf`, prefix: `q${year}-jissen1`, section: '実践', qRange: [196, 245] },
    { file: `q${year}-jissen2.pdf`, prefix: `q${year}-jissen2`, section: '実践', qRange: [246, 285] },
    { file: `q${year}-jissen3.pdf`, prefix: `q${year}-jissen3`, section: '実践', qRange: [286, 345] },
  ]
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

function findPageImage(pagesDir: string, prefix: string, page: number): string | null {
  // 2桁パディングを試す
  const pad2 = path.join(pagesDir, `${prefix}-${String(page).padStart(2, '0')}.png`)
  if (fs.existsSync(pad2)) return pad2
  // 3桁パディングを試す
  const pad3 = path.join(pagesDir, `${prefix}-${String(page).padStart(3, '0')}.png`)
  if (fs.existsSync(pad3)) return pad3
  return null
}

// Note: IMAGE_KEYWORDS is kept for reference/diagnostics but NOT used in the crop filter
// to prevent target drift. The crop filter uses confirmedIds + emptyChoices only.
const IMAGE_KEYWORDS = /下図|この図|次の図|図[1-9１-９]|構造式[をがはの]|下の構造|模式図|グラフ[をがはの]|以下の図|図に示|スキーム|下表|処方[箋せん]/

/** 確定IDリスト（missing-image-ids.json）を読み込む */
function loadConfirmedIds(): Set<string> {
  const listPath = path.join(REAL_QUESTIONS_DIR, 'missing-image-ids.json')
  if (!fs.existsSync(listPath)) return new Set()
  const data = JSON.parse(fs.readFileSync(listPath, 'utf-8'))
  return new Set(data.ids as string[])
}

const confirmedIds = loadConfirmedIds()

/** 偽陽性として確認済みのID（画像不要） */
const denyIds = new Set(['r102-254', 'r105-310'])

/** 画像抽出対象の問題番号セットを返す（拡張版） */
function loadTargetQuestions(year: number): Set<number> {
  const tsPath = path.join(REAL_QUESTIONS_DIR, `exam-${year}.ts`)
  if (!fs.existsSync(tsPath)) {
    console.log(`  警告: ${tsPath} が見つかりません`)
    return new Set()
  }
  const content = fs.readFileSync(tsPath, 'utf-8')
  const arrayStart = content.indexOf('[\n')
  if (arrayStart === -1) {
    console.log(`  警告: exam-${year}.ts のパースに失敗`)
    return new Set()
  }
  const jsonPart = content.substring(arrayStart).trimEnd()
  try {
    const questions = JSON.parse(jsonPart)
    const targets = new Set<number>()
    for (const q of questions) {
      // 既に image_url が設定済みの問題はスキップ（保護）
      if (q.image_url) continue
      if (denyIds.has(q.id)) continue  // 偽陽性（画像不要と確認済み）

      const inConfirmedList = confirmedIds.has(q.id)
      const emptyChoices = !q.choices || q.choices.length === 0
      // keywordHit は使わない（ドリフト防止のため）
      // const keywordHit = IMAGE_KEYWORDS.test(q.question_text || '')

      if (inConfirmedList || emptyChoices) {
        targets.add(q.question_number)
      }
    }
    return targets
  } catch (e) {
    console.log(`  警告: exam-${year}.ts のJSONパースエラー: ${(e as Error).message}`)
    return new Set()
  }
}

// --- メイン処理 ---
interface YearResult {
  year: number
  targetQuestions: number
  cropped: number
  skipped: number
  errors: number
  newFiles: string[]
}

async function processYear(year: number): Promise<YearResult> {
  console.log(`\n=== 第${year}回 ===`)

  const pagesDir = path.join(PAGES_DIR, String(year))
  const outputDir = path.join(OUTPUT_DIR, String(year))
  fs.mkdirSync(outputDir, { recursive: true })

  const dryRun = process.argv.includes('--dry-run')
  const newFiles: string[] = []

  const targetSet = loadTargetQuestions(year)
  console.log(`  対象問題: ${targetSet.size}問（確定ID + choices空）`)

  if (targetSet.size === 0) {
    return { year, targetQuestions: 0, cropped: 0, skipped: 0, errors: 0, newFiles }
  }

  const pdfs = getPdfConfigs(year)
  let cropped = 0
  let skipped = 0
  let errors = 0

  for (const pdf of pdfs) {
    const pdfPath = path.join(PDF_DIR, pdf.file)
    if (!fs.existsSync(pdfPath)) {
      console.log(`  警告: ${pdfPath} が見つかりません — スキップ`)
      continue
    }

    // この PDF の範囲に該当する対象問題があるか
    const relevantTargets = [...targetSet].filter(
      n => n >= pdf.qRange[0] && n <= pdf.qRange[1]
    )
    if (relevantTargets.length === 0) continue

    const totalPages = getPdfPageCount(pdfPath)
    console.log(`  ${pdf.file}: ${totalPages}ページ, 対象${relevantTargets.length}問`)

    for (let p = 1; p <= totalPages; p++) {
      const html = getBboxHtml(pdfPath, p)
      if (!html) continue

      const pageInfo = parseBboxPage(html)
      if (isCoverPage(pageInfo)) continue

      const positions = findQuestionPositions(pageInfo)
      if (positions.length === 0) continue

      // このページに対象問題があるか
      const targetPositions = positions.filter(pos => targetSet.has(pos.questionNumber))
      if (targetPositions.length === 0) continue

      // ページ画像を探す
      const imgPath = findPageImage(pagesDir, pdf.prefix, p)
      if (!imgPath) {
        console.log(`    警告: ページ画像なし ${pdf.prefix}-${p}`)
        skipped += targetPositions.length
        continue
      }

      // 画像の実際の高さを取得
      const metadata = await sharp(imgPath).metadata()
      const imageHeight = metadata.height ?? 0
      if (imageHeight === 0) {
        skipped += targetPositions.length
        continue
      }

      // 各対象問題をクロップ
      for (const tPos of targetPositions) {
        const destFile = path.join(
          outputDir,
          `q${String(tPos.questionNumber).padStart(3, '0')}.png`
        )

        // 既存画像はスキップ（上書き防止）
        if (fs.existsSync(destFile)) {
          skipped++
          continue
        }

        if (dryRun) {
          console.log(`    [dry-run] q${tPos.questionNumber}: would crop from page`)
          cropped++
          continue
        }

        // 次の問題の位置を探す（同じページ内の次の問題）
        const posIdx = positions.findIndex(p => p.questionNumber === tPos.questionNumber)
        const nextPos = posIdx < positions.length - 1 ? positions[posIdx + 1] : null

        const region = calcCropRegion(
          tPos,
          nextPos,
          pageInfo.width,
          pageInfo.height,
          imageHeight
        )

        const ok = await cropImage(imgPath, region, destFile)
        if (ok) {
          newFiles.push(destFile)
          cropped++
        } else {
          errors++
        }
      }
    }
  }

  console.log(`  結果: クロップ ${cropped}枚 / スキップ ${skipped} / エラー ${errors}`)
  if (newFiles.length > 0) {
    console.log(`  新規画像: ${newFiles.length}枚`)
  }
  return { year, targetQuestions: targetSet.size, cropped, skipped, errors, newFiles }
}

async function main() {
  const yearArg = process.argv.find((_, i) => process.argv[i - 1] === '--year')
  let years: number[]
  if (yearArg && yearArg.includes('-')) {
    const [start, end] = yearArg.split('-').map(Number)
    years = Array.from({ length: end - start + 1 }, (_, i) => start + i)
  } else if (yearArg) {
    years = [Number(yearArg)]
  } else {
    years = Array.from({ length: 11 }, (_, i) => 100 + i) // 100-110
  }

  console.log(`処理対象: 第${years[0]}回〜第${years[years.length - 1]}回`)

  const results: YearResult[] = []
  for (const year of years) {
    results.push(await processYear(year))
  }

  // サマリー
  console.log('\n=== サマリー ===')
  let totalTarget = 0
  let totalCropped = 0
  let totalSkipped = 0
  let totalErrors = 0
  for (const r of results) {
    console.log(
      `第${r.year}回: 対象${r.targetQuestions}問 → クロップ${r.cropped}枚 / スキップ${r.skipped} / エラー${r.errors}`
    )
    totalTarget += r.targetQuestions
    totalCropped += r.cropped
    totalSkipped += r.skipped
    totalErrors += r.errors
  }
  console.log(`合計: 対象${totalTarget}問 → クロップ${totalCropped}枚 / スキップ${totalSkipped} / エラー${totalErrors}`)

  // 新規画像リストをファイルに出力（トリムステップ用）
  const allNewFiles = results.flatMap(r => r.newFiles)
  if (allNewFiles.length > 0) {
    const listPath = path.join(OUTPUT_DIR, '..', 'new-crop-files.txt')
    fs.writeFileSync(listPath, allNewFiles.join('\n') + '\n', 'utf-8')
    console.log(`\n新規画像リスト: ${listPath} (${allNewFiles.length}ファイル)`)
  }
}

main().catch(console.error)
