/**
 * e-RECデータ + 正答PDFから exam-{year}.ts を生成するスクリプト
 *
 * 第100-106回用（e-RECが主データソース、正答PDFで correct_answer を上書き）
 *
 * npx tsx scripts/build-exam-from-erec.ts [--year 106]
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '..', 'src', 'data', 'real-questions')

// CLI引数
const args = process.argv.slice(2)
const yearArgIdx = args.indexOf('--year')
const years = yearArgIdx >= 0
  ? [parseInt(args[yearArgIdx + 1])]
  : [100, 101, 102, 103, 104, 105, 106]

function getSection(qNum: number): string {
  if (qNum <= 90) return '必須'
  if (qNum <= 195) return '理論'
  return '実践'
}

function getSubject(qNum: number, section: string): string {
  if (section === '必須') {
    if (qNum <= 5) return '物理'; if (qNum <= 10) return '化学'; if (qNum <= 15) return '生物'
    if (qNum <= 25) return '衛生'; if (qNum <= 35) return '薬理'; if (qNum <= 45) return '薬剤'
    if (qNum <= 55) return '病態・薬物治療'; if (qNum <= 65) return '法規・制度・倫理'; return '実務'
  }
  if (section === '理論') {
    if (qNum <= 95) return '物理'; if (qNum <= 100) return '化学'; if (qNum <= 105) return '生物'
    if (qNum <= 120) return '衛生'; if (qNum <= 135) return '薬理'; if (qNum <= 150) return '薬剤'
    if (qNum <= 165) return '病態・薬物治療'; if (qNum <= 175) return '法規・制度・倫理'
    if (qNum <= 183) return '薬剤'; return '病態・薬物治療'
  }
  return '実務'
}

let grandTotal = 0

for (const year of years) {
  console.log(`\n=== 第${year}回 ===`)

  // 1. e-RECデータ読み込み
  const erecPath = path.join(dataDir, `exam-${year}-erec.json`)
  if (!fs.existsSync(erecPath)) {
    console.log(`  ⚠ exam-${year}-erec.json が見つかりません。スキップ。`)
    continue
  }
  const erecData: any[] = JSON.parse(fs.readFileSync(erecPath, 'utf-8'))
  console.log(`  e-REC: ${erecData.length}問`)

  // 2. 正答データ読み込み（あれば）
  let answers: Record<string, any> = {}
  const answersPath = `/tmp/claude/answers-${year}.json`
  try {
    const answersList: any[] = JSON.parse(fs.readFileSync(answersPath, 'utf-8'))
    for (const a of answersList) {
      answers[a.question_number] = a.correct_answers
    }
    console.log(`  正答PDF: ${answersList.length}問`)
  } catch {
    console.log(`  ⚠ 正答PDF (${answersPath}) が見つかりません。e-RECのanswer_textを使用`)
  }

  // 3. e-REC問題番号でない問題を全345問分補完
  const erecMap = new Map(erecData.map((q: any) => [q.question_number, q]))

  const questions: any[] = []
  for (let qNum = 1; qNum <= 345; qNum++) {
    const erec = erecMap.get(qNum) as any
    const section = getSection(qNum)
    const subject = getSubject(qNum, section)
    const id = `r${year}-${String(qNum).padStart(3, '0')}`

    // 正答の決定（PDF正答 > e-REC）
    let correctAnswer = 0
    if (answers[qNum]) {
      // PDF正答（配列の場合は最初の値）
      const ca = answers[qNum]
      correctAnswer = Array.isArray(ca) ? ca[0] : ca
    } else if (erec?.answer_text) {
      // answer_textから数字を抽出
      const m = erec.answer_text.match(/(\d)/)
      if (m) correctAnswer = parseInt(m[1])
    }

    if (erec) {
      questions.push({
        id, year, question_number: qNum, section, subject,
        category: erec.category || '',
        question_text: erec.question_text || '',
        choices: (erec.choices || []).map((c: any) => ({ key: c.key, text: c.text })),
        correct_answer: correctAnswer,
        explanation: erec.explanation || '',
        tags: [],
      })
    } else {
      // e-RECにない問題（画像問題等）- 最低限の情報で追加
      questions.push({
        id, year, question_number: qNum, section, subject,
        category: '',
        question_text: `第${year}回 問${qNum}`,
        choices: [],
        correct_answer: correctAnswer,
        explanation: '',
        tags: [],
      })
    }
  }

  // 4. TypeScript出力
  const ts = `// 第${year}回薬剤師国家試験 実問題データ（e-REC + 厚労省正答PDF）
// 出典: 厚生労働省 第${year}回薬剤師国家試験

import type { Question } from '../../types/question'

export const EXAM_${year}_QUESTIONS: Question[] = ${JSON.stringify(questions, null, 2)}
`
  const outputPath = path.join(dataDir, `exam-${year}.ts`)
  fs.writeFileSync(outputPath, ts, 'utf-8')

  const withChoices = questions.filter(q => q.choices.length >= 5)
  const withExpl = questions.filter(q => q.explanation.length > 10)
  const withAnswer = questions.filter(q => q.correct_answer > 0)
  console.log(`  出力: ${questions.length}問 (選択肢5つ: ${withChoices.length}, 解説あり: ${withExpl.length}, 正答あり: ${withAnswer.length})`)
  console.log(`  → ${outputPath}`)
  grandTotal += questions.length
}

console.log(`\n=== 合計 ${grandTotal}問 ===`)
