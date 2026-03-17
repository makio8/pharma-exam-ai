/**
 * 取得した実データをアプリの dummy-questions.ts に追加できる形式に変換
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

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

// 理論問題の科目マッピング（第110回）
// 問91〜105: 物理/化学/生物
// 問106〜120: 衛生
// 問121〜135: 薬理
// 問136〜150: 薬剤
// 問151〜165: 病態・薬物治療(1)
// 問166〜180: 法規/制度/倫理 + 薬剤(2)
// 問181〜195: 病態・薬物治療(2) + 実務
function getSubject110(qNum: number, section: string): string {
  if (section === '必須') {
    if (qNum <= 5) return '物理'
    if (qNum <= 10) return '化学'
    if (qNum <= 15) return '生物'
    if (qNum <= 25) return '実務'  // 衛生
    if (qNum <= 35) return '薬理'
    if (qNum <= 45) return '薬剤'
    if (qNum <= 55) return '病態・薬物治療'
    if (qNum <= 65) return '法規・制度・倫理'
    return '実務'
  }
  if (section === '理論') {
    if (qNum <= 105) return qNum <= 95 ? '物理' : (qNum <= 100 ? '化学' : '生物')
    if (qNum <= 120) return '実務'  // 衛生
    if (qNum <= 135) return '薬理'
    if (qNum <= 150) return '薬剤'
    if (qNum <= 165) return '病態・薬物治療'
    if (qNum <= 175) return '法規・制度・倫理'
    if (qNum <= 183) return '薬剤'
    return '病態・薬物治療'
  }
  return '実務'
}

const data: RawQ[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'real-questions', 'exam-110.json'), 'utf-8')
)

// テキストのみ・正答あり・選択肢5つの問題を抽出
const usable = data.filter(q => q.has_image === false && q.correct_answer > 0 && q.choices.length === 5)

// 科目を再マッピング
const questions = usable.map(q => ({
  id: `r110-${String(q.question_number).padStart(3, '0')}`,
  year: q.exam_year,
  question_number: q.question_number,
  section: q.section as '必須' | '理論' | '実践',
  subject: getSubject110(q.question_number, q.section),
  category: '',
  question_text: q.question_text,
  choices: q.choices.map(c => ({ key: c.key as 1|2|3|4|5, text: c.text })),
  correct_answer: q.correct_answer,
  explanation: q.explanation,
  tags: [] as string[],
}))

// 科目別集計
const bySubject: Record<string, number> = {}
for (const q of questions) {
  bySubject[q.subject] = (bySubject[q.subject] || 0) + 1
}
console.log('科目別（修正後）:')
for (const [s, n] of Object.entries(bySubject).sort()) {
  console.log(`  ${s}: ${n}問`)
}

// TypeScript ファイルとして出力
const tsContent = `// 第110回薬剤師国家試験 実問題データ（テキストのみ・自動取得）
// 出典: 厚生労働省 第110回薬剤師国家試験（令和7年2月実施）
// 注意: 正答は厚労省公式正答に基づく。解説は参考情報。

import type { Question } from '../../types/question'

export const EXAM_110_QUESTIONS: Question[] = ${JSON.stringify(questions, null, 2)}
`

const outputPath = path.join(__dirname, '..', 'src', 'data', 'real-questions', 'exam-110.ts')
fs.writeFileSync(outputPath, tsContent, 'utf-8')
console.log(`\n${questions.length} 問を ${outputPath} に保存`)
console.log('合計:', questions.length, '問')
