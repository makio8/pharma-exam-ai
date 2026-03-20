/**
 * choices空の867問から、Vision抽出用のタスクリストを生成する
 * 各問題に対応するページ画像パスをマッピングして出力
 *
 * npx tsx scripts/build-vision-task-list.ts
 * 出力: scripts/output/vision-tasks.json
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

import { parseBboxPage, findQuestionPositions, isCoverPage } from './lib/bbox-parser.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface VisionTask {
  question_id: string
  year: number
  question_number: number
  page_image_path: string
  page_questions: number[]
}

interface PdfConfig {
  file: string
  prefix: string
  qRange: [number, number]
}

function getPdfConfigs(year: number): PdfConfig[] {
  return [
    { file: `q${year}-hissu.pdf`, prefix: `q${year}-hissu`, qRange: [1, 90] },
    { file: `q${year}-riron1.pdf`, prefix: `q${year}-riron1`, qRange: [91, 150] },
    { file: `q${year}-riron2.pdf`, prefix: `q${year}-riron2`, qRange: [151, 195] },
    { file: `q${year}-jissen1.pdf`, prefix: `q${year}-jissen1`, qRange: [196, 245] },
    { file: `q${year}-jissen2.pdf`, prefix: `q${year}-jissen2`, qRange: [246, 285] },
    { file: `q${year}-jissen3.pdf`, prefix: `q${year}-jissen3`, qRange: [286, 345] },
  ]
}

function getPdfPageCount(pdfPath: string): number {
  try {
    const info = execSync(`pdfinfo "${pdfPath}" 2>/dev/null`, { encoding: 'utf-8' })
    const m = info.match(/Pages:\s+(\d+)/)
    return m ? parseInt(m[1]) : 0
  } catch { return 0 }
}

function getBboxHtml(pdfPath: string, page: number): string {
  try {
    return execSync(`pdftotext -bbox -f ${page} -l ${page} "${pdfPath}" -`, {
      encoding: 'utf-8', timeout: 10000,
    })
  } catch { return '' }
}

function findPageImage(pagesDir: string, prefix: string, page: number): string | null {
  const pad2 = path.join(pagesDir, `${prefix}-${String(page).padStart(2, '0')}.png`)
  if (fs.existsSync(pad2)) return pad2
  const pad3 = path.join(pagesDir, `${prefix}-${String(page).padStart(3, '0')}.png`)
  if (fs.existsSync(pad3)) return pad3
  return null
}

function loadEmptyChoicesQuestions(year: number): Set<number> {
  const tsPath = path.join(__dirname, '..', 'src', 'data', 'real-questions', `exam-${year}.ts`)
  if (!fs.existsSync(tsPath)) return new Set()
  const content = fs.readFileSync(tsPath, 'utf-8')
  const arrayStart = content.indexOf('[\n')
  if (arrayStart === -1) return new Set()
  const jsonPart = content.substring(arrayStart).trimEnd()
  try {
    const questions = JSON.parse(jsonPart)
    const emptySet = new Set<number>()
    for (const q of questions) {
      if (!q.choices || q.choices.length === 0) emptySet.add(q.question_number)
    }
    return emptySet
  } catch { return new Set() }
}

async function main() {
  const outputDir = path.join(__dirname, 'output')
  fs.mkdirSync(outputDir, { recursive: true })

  const years = Array.from({ length: 11 }, (_, i) => 100 + i)
  const tasks: VisionTask[] = []

  for (const year of years) {
    const targetSet = loadEmptyChoicesQuestions(year)
    if (targetSet.size === 0) continue
    console.log(`第${year}回: choices空 ${targetSet.size}問`)

    const pagesDir = `/tmp/claude/exam-pages/${year}`
    const pdfs = getPdfConfigs(year)

    for (const pdf of pdfs) {
      const pdfPath = `/tmp/claude/${pdf.file}`
      if (!fs.existsSync(pdfPath)) continue

      const relevantTargets = [...targetSet].filter(
        n => n >= pdf.qRange[0] && n <= pdf.qRange[1]
      )
      if (relevantTargets.length === 0) continue

      const totalPages = getPdfPageCount(pdfPath)

      for (let p = 1; p <= totalPages; p++) {
        const html = getBboxHtml(pdfPath, p)
        if (!html) continue

        const pageInfo = parseBboxPage(html)
        if (isCoverPage(pageInfo)) continue

        const positions = findQuestionPositions(pageInfo)
        if (positions.length === 0) continue

        const pageQNums = positions.map(pos => pos.questionNumber)
        const targetPositions = positions.filter(pos => targetSet.has(pos.questionNumber))
        if (targetPositions.length === 0) continue

        const imgPath = findPageImage(pagesDir, pdf.prefix, p)
        if (!imgPath) continue

        for (const tPos of targetPositions) {
          tasks.push({
            question_id: `r${year}-${String(tPos.questionNumber).padStart(3, '0')}`,
            year,
            question_number: tPos.questionNumber,
            page_image_path: imgPath,
            page_questions: pageQNums,
          })
        }
      }
    }
  }

  // 重複排除
  const seen = new Set<string>()
  const uniqueTasks = tasks.filter(t => {
    if (seen.has(t.question_id)) return false
    seen.add(t.question_id)
    return true
  })

  const outputPath = path.join(outputDir, 'vision-tasks.json')
  fs.writeFileSync(outputPath, JSON.stringify(uniqueTasks, null, 2))

  console.log(`\n=== サマリー ===`)
  console.log(`タスク生成: ${uniqueTasks.length}問`)
  console.log(`出力: ${outputPath}`)

  const byYear = new Map<number, number>()
  for (const t of uniqueTasks) {
    byYear.set(t.year, (byYear.get(t.year) ?? 0) + 1)
  }
  for (const [y, c] of [...byYear].sort((a, b) => a[0] - b[0])) {
    console.log(`  第${y}回: ${c}問`)
  }
}

main().catch(console.error)
