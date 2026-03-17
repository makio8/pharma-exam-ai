/**
 * 全ソースを統合: PDFテキスト + 正答JSON + yakugakulab解説 → アプリ用データ
 *
 * npx tsx scripts/merge-all-sources.ts
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
  // 1. PDFテキスト（全345問）
  const pdfData: any[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, `exam-${year}-pdf.json`), 'utf-8')
  )
  const pdfMap = new Map(pdfData.map(q => [q.question_number, q]))

  // 2. yakugakulabデータ（解説・選択肢あり）
  let webData: any[] = []
  try {
    webData = JSON.parse(fs.readFileSync(path.join(dataDir, `exam-${year}.json`), 'utf-8'))
  } catch {}
  const webMap = new Map(webData.map(q => [q.question_number, q]))

  // 3. 正答JSON
  let answers: Record<string, any> = {}
  try {
    const ansData = JSON.parse(fs.readFileSync(`/tmp/claude/answers-${year}.json`, 'utf-8'))
    answers = ansData.answers || {}
  } catch {}

  // 4. 画像URLマップ
  let imageUrls: Record<string, string> = {}
  try {
    imageUrls = JSON.parse(fs.readFileSync(path.join(dataDir, `image-urls-${year}.json`), 'utf-8'))
  } catch {}

  // 統合
  const merged: any[] = []
  for (let qNum = 1; qNum <= 345; qNum++) {
    const pdf = pdfMap.get(qNum)
    const web = webMap.get(qNum)
    const answer = answers[String(qNum)]

    if (!pdf && !web) continue

    const section = pdf?.section || web?.section || '実務'
    const id = `r${year}-${String(qNum).padStart(3, '0')}`
    const imageUrl = imageUrls[id]

    // 優先: web版の選択肢（構造化済み） > PDFの選択肢（テキストのみ）
    let choices = web?.choices || []
    if (choices.length < 2 && pdf?.choices?.length >= 2) {
      choices = pdf.choices.map((text: string, i: number) => ({ key: i + 1, text }))
    }

    // 正答: 正答JSON > web版 > 0
    let correctAnswer = 0
    if (typeof answer === 'number') {
      correctAnswer = answer
    } else if (Array.isArray(answer) && answer.length > 0) {
      correctAnswer = answer[0] // 複数正答は最初の1つ
    } else if (web?.correct_answer) {
      correctAnswer = web.correct_answer
    }

    // 問題文: web版（クリーン） > PDF版（生テキスト）
    const questionText = web?.question_text || pdf?.question_text || ''

    // 解説: web版のみ
    const explanation = web?.explanation || ''

    // 画像判定
    const hasImage = web?.has_image || false

    merged.push({
      id,
      year,
      question_number: qNum,
      section,
      subject: getSubject(qNum, section),
      category: '',
      question_text: questionText,
      choices: choices.length >= 2 ? choices.map((c: any) => ({
        key: typeof c.key === 'number' ? c.key : parseInt(c.key),
        text: c.text || c,
      })) : [],
      correct_answer: correctAnswer,
      explanation,
      tags: [],
      ...(imageUrl ? { image_url: imageUrl } : {}),
      _source: web ? 'web+pdf' : 'pdf_only',
      _has_image: hasImage,
      _has_choices: choices.length >= 5 && choices.length <= 6, // 5-6個のみ（横並びパースの誤検出を除外）
      _has_answer: correctAnswer > 0,
    })
  }

  // 統計
  const withChoices = merged.filter(q => q._has_choices)
  const withAnswer = merged.filter(q => q._has_answer)
  const appReady = merged.filter(q => q._has_choices && q._has_answer && q.question_text.length > 10)
  const pdfOnly = merged.filter(q => q._source === 'pdf_only')

  console.log(`\n=== 第${year}回 ===`)
  console.log(`全問題: ${merged.length}/345`)
  console.log(`選択肢あり: ${withChoices.length}`)
  console.log(`正答あり: ${withAnswer.length}`)
  console.log(`アプリ投入可能: ${appReady.length}`)
  console.log(`PDFのみ（解説なし）: ${pdfOnly.length}`)

  // アプリ用TS出力（選択肢+正答ありのもの、choicesは5つに制限）
  const tsQuestions = appReady.map(q => {
    const { _source, _has_image, _has_choices, _has_answer, ...clean } = q
    // 選択肢を5つに制限し、keyを1-5にリナンバリング
    if (clean.choices.length > 5) {
      clean.choices = clean.choices.slice(0, 5)
    }
    clean.choices = clean.choices.map((c: any, i: number) => ({
      key: i + 1,
      text: c.text,
    }))
    return clean
  })

  const ts = `// 第${year}回薬剤師国家試験 実問題データ
// 出典: 厚生労働省 + yakugakulab.info
// PDFテキスト + 正答JSON + Web解説 を統合

import type { Question } from '../../types/question'

export const EXAM_${year}_QUESTIONS: Question[] = ${JSON.stringify(tsQuestions, null, 2)}
`
  fs.writeFileSync(path.join(dataDir, `exam-${year}.ts`), ts, 'utf-8')
  console.log(`→ ${tsQuestions.length}問を exam-${year}.ts に保存`)
  grandTotal += tsQuestions.length
}

console.log(`\n========== 最終結果 ==========`)
console.log(`実データ合計: ${grandTotal}問`)
console.log(`ダミー200問を加えて総合計: ${grandTotal + 200}問`)
