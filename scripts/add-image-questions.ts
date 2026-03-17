/**
 * 画像問題を exam-110.ts に統合する
 * 画像URLマップを使って、画像ありの問題も Question 型で出力
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', 'src', 'data', 'real-questions')

// 全問題データ（画像あり含む）
const rawData = JSON.parse(fs.readFileSync(path.join(dataDir, 'exam-110.json'), 'utf-8'))

// 画像URLマップ
const imageUrls: Record<string, string> = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'image-urls-110.json'), 'utf-8')
)

function getSubject(qNum: number, section: string): string {
  if (section === '必須') {
    if (qNum <= 5) return '物理'
    if (qNum <= 10) return '化学'
    if (qNum <= 15) return '生物'
    if (qNum <= 25) return '実務'
    if (qNum <= 35) return '薬理'
    if (qNum <= 45) return '薬剤'
    if (qNum <= 55) return '病態・薬物治療'
    if (qNum <= 65) return '法規・制度・倫理'
    return '実務'
  }
  if (section === '理論') {
    if (qNum <= 95) return '物理'
    if (qNum <= 100) return '化学'
    if (qNum <= 105) return '生物'
    if (qNum <= 120) return '実務'
    if (qNum <= 135) return '薬理'
    if (qNum <= 150) return '薬剤'
    if (qNum <= 165) return '病態・薬物治療'
    if (qNum <= 175) return '法規・制度・倫理'
    if (qNum <= 183) return '薬剤'
    return '病態・薬物治療'
  }
  return '実務'
}

// 正答あり＋選択肢5つの問題を全て取得（画像有無問わず）
const usable = rawData.filter((q: any) => q.correct_answer > 0 && q.choices.length === 5)

const questions = usable.map((q: any) => {
  const id = `r110-${String(q.question_number).padStart(3, '0')}`
  const imageUrl = imageUrls[id] || undefined

  return {
    id,
    year: q.exam_year,
    question_number: q.question_number,
    section: q.section,
    subject: getSubject(q.question_number, q.section),
    category: '',
    question_text: q.question_text,
    choices: q.choices.map((c: any) => ({ key: c.key, text: c.text })),
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    tags: [],
    ...(imageUrl ? { image_url: imageUrl } : {}),
  }
})

// 統計
const withImage = questions.filter((q: any) => q.image_url)
const textOnly = questions.filter((q: any) => !q.image_url)

console.log(`全問題: ${questions.length}問`)
console.log(`テキストのみ: ${textOnly.length}問`)
console.log(`画像あり: ${withImage.length}問（image_url 付き）`)

// TypeScript出力
const tsContent = `// 第110回薬剤師国家試験 実問題データ（テキスト+画像問題）
// 出典: 厚生労働省 第110回薬剤師国家試験（令和7年2月実施）
// 画像問題は public/images/questions/110/ に配置

import type { Question } from '../../types/question'

export const EXAM_110_QUESTIONS: Question[] = ${JSON.stringify(questions, null, 2)}
`

fs.writeFileSync(path.join(dataDir, 'exam-110.ts'), tsContent, 'utf-8')
console.log(`\n保存: ${path.join(dataDir, 'exam-110.ts')}`)
