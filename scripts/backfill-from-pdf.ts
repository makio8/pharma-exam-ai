/**
 * PDF抽出データでexam-{year}.tsの空問題を補完するスクリプト
 *
 * exam-{year}-pdf.json（pdftotext抽出）のデータで、exam-{year}.tsの
 * question_text/choices が空の問題を埋める。
 *
 * npx tsx scripts/backfill-from-pdf.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '..', 'src', 'data', 'real-questions')

const years = [100, 101, 102, 103, 104, 105, 106]

interface QuestionObj {
  id: string
  question_text: string
  choices: { key: number; text: string }[]
  correct_answer: number
  explanation: string
  [key: string]: unknown
}

interface PdfQuestion {
  exam_year: number
  question_number: number
  section: string
  question_text: string
  choices: string[]
  page_in_pdf: number
}

let grandTotalUpdated = 0
let grandTotalTextOnly = 0

for (const year of years) {
  console.log(`\n=== 第${year}回 ===`)

  // 1. PDF抽出データを読み込み
  const pdfPath = path.join(dataDir, `exam-${year}-pdf.json`)
  if (!fs.existsSync(pdfPath)) {
    console.log(`  ⚠ exam-${year}-pdf.json が見つかりません。スキップします。`)
    continue
  }
  const pdfData: PdfQuestion[] = JSON.parse(fs.readFileSync(pdfPath, 'utf-8'))
  const pdfMap = new Map<number, PdfQuestion>()
  for (const q of pdfData) pdfMap.set(q.question_number, q)
  console.log(`  PDF抽出: ${pdfData.length}問`)

  // 2. exam-{year}.ts を読み込み
  const tsPath = path.join(dataDir, `exam-${year}.ts`)
  const tsContent = fs.readFileSync(tsPath, 'utf-8')
  const arrayStartIndex = tsContent.indexOf('[\n')
  if (arrayStartIndex === -1) {
    console.log(`  ⚠ JSON配列が見つかりません。スキップします。`)
    continue
  }
  const header = tsContent.substring(0, arrayStartIndex)
  const arrayContent = tsContent.substring(arrayStartIndex).trimEnd()
  let questions: QuestionObj[]
  try {
    questions = JSON.parse(arrayContent)
  } catch (e) {
    console.log(`  ⚠ JSONパース失敗: ${e}`)
    continue
  }

  // 3. 空問題を補完
  let updated = 0
  let textOnly = 0

  for (const q of questions) {
    const qNum = parseInt(q.id.split('-')[1])
    const pdf = pdfMap.get(qNum)
    if (!pdf) continue

    const isEmptyQuestion = !q.question_text || q.question_text.startsWith(`第${year}回`) ||
                            (q.choices as any[]).length === 0

    if (isEmptyQuestion && pdf.question_text && pdf.question_text.length > 10) {
      // 問題文を補完
      q.question_text = pdf.question_text

      // 選択肢があれば補完
      if (pdf.choices.length >= 2 && (q.choices as any[]).length === 0) {
        q.choices = pdf.choices.map((text, i) => ({ key: i + 1, text }))
        updated++
      } else {
        // 問題文のみ補完（選択肢は画像のため取れない）
        textOnly++
      }
    }
  }

  console.log(`  問題文+選択肢 補完: ${updated}問`)
  console.log(`  問題文のみ補完: ${textOnly}問`)
  grandTotalUpdated += updated
  grandTotalTextOnly += textOnly

  // 4. 書き戻し
  const newTsContent = header + JSON.stringify(questions, null, 2) + '\n'
  fs.writeFileSync(tsPath, newTsContent, 'utf-8')
  console.log(`  ✓ exam-${year}.ts を書き出しました`)
}

console.log(`\n=== 全体サマリー ===`)
console.log(`問題文+選択肢 補完: ${grandTotalUpdated}問`)
console.log(`問題文のみ補完: ${grandTotalTextOnly}問`)
console.log(`合計: ${grandTotalUpdated + grandTotalTextOnly}問`)
