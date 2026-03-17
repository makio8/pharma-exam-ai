/**
 * 全回のJSONデータからTSファイルを再生成
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '..', 'src', 'data', 'real-questions')

function getSubject(qNum: number, section: string): string {
  if (section === '必須') {
    if (qNum <= 5) return '物理'; if (qNum <= 10) return '化学'; if (qNum <= 15) return '生物'
    if (qNum <= 25) return '実務'; if (qNum <= 35) return '薬理'; if (qNum <= 45) return '薬剤'
    if (qNum <= 55) return '病態・薬物治療'; if (qNum <= 65) return '法規・制度・倫理'; return '実務'
  }
  if (section === '理論') {
    if (qNum <= 95) return '物理'; if (qNum <= 100) return '化学'; if (qNum <= 105) return '生物'
    if (qNum <= 120) return '実務'; if (qNum <= 135) return '薬理'; if (qNum <= 150) return '薬剤'
    if (qNum <= 165) return '病態・薬物治療'; if (qNum <= 175) return '法規・制度・倫理'
    if (qNum <= 183) return '薬剤'; return '病態・薬物治療'
  }
  return '実務'
}

const years = [107, 108, 109, 110]
let grandTotal = 0

for (const year of years) {
  const rawData = JSON.parse(fs.readFileSync(path.join(dataDir, `exam-${year}.json`), 'utf-8'))

  // 画像URLマップ読み込み（110回のみ既存）
  let imageUrls: Record<string, string> = {}
  try {
    imageUrls = JSON.parse(fs.readFileSync(path.join(dataDir, `image-urls-${year}.json`), 'utf-8'))
  } catch {}

  // 正答あり＋選択肢5つ
  const usable = rawData.filter((q: any) => q.correct_answer > 0 && q.choices.length === 5)

  const questions = usable.map((q: any) => {
    const id = `r${year}-${String(q.question_number).padStart(3, '0')}`
    const imageUrl = imageUrls[id] || undefined
    return {
      id, year: q.exam_year, question_number: q.question_number,
      section: q.section, subject: getSubject(q.question_number, q.section),
      category: '', question_text: q.question_text,
      choices: q.choices.map((c: any) => ({ key: c.key, text: c.text })),
      correct_answer: q.correct_answer, explanation: q.explanation, tags: [],
      ...(imageUrl ? { image_url: imageUrl } : {}),
    }
  })

  const ts = `// 第${year}回薬剤師国家試験 実問題データ（自動取得）
// 出典: 厚生労働省 第${year}回薬剤師国家試験

import type { Question } from '../../types/question'

export const EXAM_${year}_QUESTIONS: Question[] = ${JSON.stringify(questions, null, 2)}
`
  fs.writeFileSync(path.join(dataDir, `exam-${year}.ts`), ts, 'utf-8')
  console.log(`第${year}回: ${questions.length}問 (全${rawData.length}問中)`)
  grandTotal += questions.length
}

console.log(`\n実データ合計: ${grandTotal}問`)
console.log(`ダミー200問を加えて総合計: ${grandTotal + 200}問`)
