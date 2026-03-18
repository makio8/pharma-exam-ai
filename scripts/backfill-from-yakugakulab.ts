/**
 * yakugakulabデータでexam-{year}.tsの空問題を補完するスクリプト
 *
 * exam-{year}.json（yakugakulab）のデータで、exam-{year}.tsの
 * question_text/choices が空の問題を埋める。
 *
 * npx tsx scripts/backfill-from-yakugakulab.ts
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

interface YakugakulabQuestion {
  exam_year: number
  question_number: number
  section: string
  subject: string
  question_text: string
  choices: { key: number; text: string }[]
  correct_answer: number
  explanation: string
  has_image: boolean
}

let grandTotalUpdated = 0
let grandTotalSkipped = 0

for (const year of years) {
  console.log(`\n=== 第${year}回 ===`)

  // 1. yakugakulabデータを読み込み
  const yakuPath = path.join(dataDir, `exam-${year}.json`)
  if (!fs.existsSync(yakuPath)) {
    console.log(`  ⚠ exam-${year}.json が見つかりません。スキップします。`)
    continue
  }
  const yakuData: YakugakulabQuestion[] = JSON.parse(fs.readFileSync(yakuPath, 'utf-8'))
  const yakuMap = new Map<number, YakugakulabQuestion>()
  for (const q of yakuData) yakuMap.set(q.question_number, q)
  console.log(`  yakugakulab: ${yakuData.length}問`)

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
  console.log(`  exam-{year}.ts: ${questions.length}問`)

  // 3. 空問題を補完
  let updated = 0
  let skipped = 0

  for (const q of questions) {
    const qNum = parseInt(q.id.split('-')[1])
    const yaku = yakuMap.get(qNum)
    if (!yaku) { skipped++; continue }

    const isEmptyQuestion = !q.question_text || q.question_text.startsWith(`第${year}回`) ||
                            (q.choices as any[]).length === 0

    if (isEmptyQuestion && yaku.question_text && yaku.choices.length >= 2) {
      // 問題文と選択肢を補完
      q.question_text = yaku.question_text
      q.choices = yaku.choices
      // yakugakulabの解説も追加（既存が短い場合のみ）
      if (yaku.explanation && yaku.explanation.length > (q.explanation || '').length) {
        // 既存の構造化解説（【ポイント】）は維持し、yakugakulabの解説は上書きしない
        if (!(q.explanation || '').includes('【ポイント】')) {
          q.explanation = yaku.explanation
        }
      }
      updated++
    } else {
      skipped++
    }
  }

  console.log(`  補完: ${updated}問`)
  console.log(`  スキップ: ${skipped}問`)
  grandTotalUpdated += updated
  grandTotalSkipped += skipped

  // 4. 書き戻し
  const newTsContent = header + JSON.stringify(questions, null, 2) + '\n'
  fs.writeFileSync(tsPath, newTsContent, 'utf-8')
  console.log(`  ✓ exam-${year}.ts を書き出しました`)
}

console.log(`\n=== 全体サマリー ===`)
console.log(`補完: ${grandTotalUpdated}問`)
console.log(`スキップ: ${grandTotalSkipped}問`)
