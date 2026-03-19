/**
 * choices: [] の問題の question_text をクリーニングする
 * OCRゴミ（化学式・数値テーブル・裸の選択番号など）を除去する
 *
 * npx tsx scripts/clean-question-text.ts --dry-run --year 100      # 単年・ドライラン
 * npx tsx scripts/clean-question-text.ts --year 100-110            # 範囲指定
 * npx tsx scripts/clean-question-text.ts                           # デフォルト: 100-110
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { cleanQuestionText } from './lib/text-cleaner.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface Question {
  id: string
  year: number
  question_number: number
  section?: string
  subject?: string
  category?: string
  question_text: string
  question_text_original?: string
  choices: unknown[]
  correct_answer?: unknown
  explanation?: string
  tags?: unknown[]
  [key: string]: unknown
}

interface YearResult {
  year: number
  processed: number
  modified: number
  linesRemoved: number
}

function parseExamFile(filePath: string): { prefix: string; questions: Question[] } | null {
  if (!fs.existsSync(filePath)) {
    console.log(`  警告: ${filePath} が見つかりません`)
    return null
  }

  const content = fs.readFileSync(filePath, 'utf-8')

  // Find the array start (first '[' on a line)
  const arrayStart = content.indexOf('[\n')
  if (arrayStart === -1) {
    console.log(`  警告: ${filePath} のJSONパースに失敗（配列が見つかりません）`)
    return null
  }

  const prefix = content.substring(0, arrayStart)
  const jsonPart = content.substring(arrayStart).trimEnd()

  try {
    const questions = JSON.parse(jsonPart) as Question[]
    return { prefix, questions }
  } catch (e) {
    console.log(`  警告: ${filePath} のJSONパースエラー: ${(e as Error).message}`)
    return null
  }
}

function countLines(text: string): number {
  return text.split('\n').length
}

function processYear(year: number, dryRun: boolean): YearResult {
  console.log(`\n=== 第${year}回 ===`)

  const tsPath = path.join(__dirname, '..', 'src', 'data', 'real-questions', `exam-${year}.ts`)
  const parsed = parseExamFile(tsPath)

  if (!parsed) {
    return { year, processed: 0, modified: 0, linesRemoved: 0 }
  }

  const { prefix, questions } = parsed

  // Filter to empty choices only
  const targetQuestions = questions.filter(q => !q.choices || q.choices.length === 0)
  console.log(`  対象問題（choices空）: ${targetQuestions.length}問`)

  let modified = 0
  let totalLinesRemoved = 0

  for (const q of targetQuestions) {
    const original = q.question_text
    const cleaned = cleanQuestionText(original)

    if (cleaned === original) continue

    const originalLines = countLines(original)
    const cleanedLines = countLines(cleaned)
    const linesRemoved = originalLines - cleanedLines

    totalLinesRemoved += linesRemoved
    modified++

    if (dryRun) {
      const origPreview = original.replace(/\n/g, '\\n').substring(0, 50)
      const cleanedPreview = cleaned.replace(/\n/g, '\\n').substring(0, 50)
      console.log(`  [DRY-RUN] ${q.id} (${linesRemoved}行削除)`)
      console.log(`    元: ${origPreview}`)
      console.log(`    後: ${cleanedPreview}`)
    }

    if (!dryRun) {
      // Save original and apply cleaned version
      q.question_text_original = original
      q.question_text = cleaned
    }
  }

  if (!dryRun && modified > 0) {
    // Write back to file, preserving prefix (import + export statement)
    const jsonContent = JSON.stringify(questions, null, 2)
    fs.writeFileSync(tsPath, prefix + jsonContent + '\n', 'utf-8')
    console.log(`  書き込み完了: ${modified}問を更新`)
  } else if (dryRun) {
    console.log(`  [DRY-RUN] 変更予定: ${modified}問 / ${totalLinesRemoved}行削除`)
  } else {
    console.log(`  変更なし`)
  }

  return { year, processed: targetQuestions.length, modified, linesRemoved: totalLinesRemoved }
}

function main() {
  const dryRun = process.argv.includes('--dry-run')
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

  if (dryRun) {
    console.log('[DRY-RUN モード] ファイルへの書き込みはしません')
  }
  console.log(`処理対象: 第${years[0]}回〜第${years[years.length - 1]}回`)

  const results: YearResult[] = []
  for (const year of years) {
    results.push(processYear(year, dryRun))
  }

  // Summary
  console.log('\n=== サマリー ===')
  let totalProcessed = 0
  let totalModified = 0
  let totalLinesRemoved = 0

  for (const r of results) {
    if (r.processed > 0) {
      console.log(
        `第${r.year}回: 処理${r.processed}問 → 変更${r.modified}問 / ${r.linesRemoved}行削除`
      )
    }
    totalProcessed += r.processed
    totalModified += r.modified
    totalLinesRemoved += r.linesRemoved
  }

  console.log(`\n合計: 処理${totalProcessed}問 → 変更${totalModified}問 / ${totalLinesRemoved}行削除`)

  if (dryRun) {
    console.log('\n[DRY-RUN] 実際に適用するには --dry-run を外して実行してください')
  }
}

main()
