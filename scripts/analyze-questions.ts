import * as fs from 'fs'
import { fileURLToPath } from 'url'
import * as path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface RawQ {
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

const data: RawQ[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'real-questions', 'exam-110.json'), 'utf-8')
)

const usable = data.filter(q => q.has_image === false && q.correct_answer > 0 && q.choices.length === 5)
console.log('使用可能な問題数:', usable.length)
console.log('\n科目別:')
const bySubject: Record<string, number> = {}
for (const q of usable) {
  bySubject[q.subject] = (bySubject[q.subject] || 0) + 1
}
for (const [s, n] of Object.entries(bySubject).sort()) {
  console.log(`  ${s}: ${n}問`)
}

// TypeScript Question 型に変換して出力
const questions = usable.map(q => ({
  id: `r110-${String(q.question_number).padStart(3, '0')}`,
  year: q.exam_year,
  question_number: q.question_number,
  section: q.section,
  subject: q.subject,
  category: '',
  question_text: q.question_text,
  choices: q.choices,
  correct_answer: q.correct_answer,
  explanation: q.explanation,
  tags: [],
  correct_rate: undefined,
}))

const outputPath = path.join(__dirname, '..', 'src', 'data', 'real-questions', 'exam-110-usable.json')
fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2), 'utf-8')
console.log(`\n${questions.length} 問を ${outputPath} に保存`)
