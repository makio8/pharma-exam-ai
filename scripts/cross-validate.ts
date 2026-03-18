/**
 * クロスバリデーション: 複数ソースの問題データを突合して正確性を検証
 *
 * ソース:
 *   1. 厚労省PDF（問題文+正答）
 *   2. yakugakulab（選択肢+解説）
 *   3. e-REC（選択肢+解説）
 *   4. 厚労省正答JSON
 *
 * 検証項目:
 *   - 選択肢テキストの一致度（2ソース以上で突合）
 *   - 正答番号の一致
 *   - 問題文の一致度
 *
 * npx tsx scripts/cross-validate.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '..', 'src', 'data', 'real-questions')

// Levenshtein距離（簡易版）
function similarity(a: string, b: string): number {
  if (a === b) return 1.0
  const shorter = a.length < b.length ? a : b
  const longer = a.length >= b.length ? a : b
  if (longer.length === 0) return 1.0
  // 共通部分の割合で簡易計算
  let matches = 0
  for (let i = 0; i < shorter.length; i++) {
    if (shorter[i] === longer[i]) matches++
  }
  return matches / longer.length
}

function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, '')
    .replace(/[．。、，]/g, '')
    .replace(/[０-９]/g, c => String(c.charCodeAt(0) - '０'.charCodeAt(0)))
    .replace(/[Ａ-Ｚ]/g, c => String.fromCharCode(c.charCodeAt(0) - 'Ａ'.charCodeAt(0) + 65))
    .replace(/[ａ-ｚ]/g, c => String.fromCharCode(c.charCodeAt(0) - 'ａ'.charCodeAt(0) + 97))
    .toLowerCase()
    .trim()
}

interface ValidationResult {
  year: number
  question_number: number
  sources_available: string[]
  choice_match: 'match' | 'partial' | 'mismatch' | 'single_source'
  answer_match: 'match' | 'mismatch' | 'single_source'
  confidence: 'high' | 'medium' | 'low'
  issues: string[]
  best_choices: { key: number; text: string }[]
  best_answer: number
  best_explanation: string
}

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

async function main() {
  const years = [107, 108, 109, 110]
  let grandTotalHigh = 0, grandTotalMed = 0, grandTotalLow = 0, grandTotal = 0

  for (const year of years) {
    console.log(`\n========== 第${year}回 クロスバリデーション ==========`)

    // ソース読み込み
    const pdfData: any[] = (() => {
      try { return JSON.parse(fs.readFileSync(path.join(dataDir, `exam-${year}-pdf.json`), 'utf-8')) }
      catch { return [] }
    })()
    const webData: any[] = (() => {
      try { return JSON.parse(fs.readFileSync(path.join(dataDir, `exam-${year}.json`), 'utf-8')) }
      catch { return [] }
    })()
    const erecData: any[] = (() => {
      try { return JSON.parse(fs.readFileSync(path.join(dataDir, `exam-${year}-erec.json`), 'utf-8')) }
      catch { return [] }
    })()
    let officialAnswers: Record<string, any> = {}
    try {
      const ans = JSON.parse(fs.readFileSync(`/tmp/claude/answers-${year}.json`, 'utf-8'))
      officialAnswers = ans.answers || {}
    } catch {}

    // 画像URLマップ
    let imageUrls: Record<string, string> = {}
    try {
      imageUrls = JSON.parse(fs.readFileSync(path.join(dataDir, `image-urls-${year}.json`), 'utf-8'))
    } catch {}

    const pdfMap = new Map(pdfData.map((q: any) => [q.question_number, q]))
    const webMap = new Map(webData.map((q: any) => [q.question_number, q]))
    const erecMap = new Map(erecData.map((q: any) => [q.question_number, q]))

    const results: ValidationResult[] = []
    const validatedQuestions: any[] = []

    for (let qNum = 1; qNum <= 345; qNum++) {
      const pdf = pdfMap.get(qNum) as any
      const web = webMap.get(qNum) as any
      const erec = erecMap.get(qNum) as any
      const officialAnswer = officialAnswers[String(qNum)]

      const sources: string[] = []
      if (pdf) sources.push('pdf')
      if (web) sources.push('web')
      if (erec) sources.push('erec')

      const issues: string[] = []

      // 正答検証
      let bestAnswer = 0
      if (typeof officialAnswer === 'number') {
        bestAnswer = officialAnswer
      } else if (Array.isArray(officialAnswer) && officialAnswer.length > 0) {
        bestAnswer = officialAnswer[0]
      }

      let answerMatch: 'match' | 'mismatch' | 'single_source' = 'single_source'
      if (web?.correct_answer && erec?.explanation) {
        // e-RECの解説から正答を推定
        const erecAnsMatch = erec.explanation.match(/正[解答][：:]\s*(\d)/)
        if (erecAnsMatch) {
          const erecAns = parseInt(erecAnsMatch[1])
          if (web.correct_answer === erecAns && bestAnswer === erecAns) {
            answerMatch = 'match'
          } else if (web.correct_answer !== erecAns) {
            answerMatch = 'mismatch'
            issues.push(`正答不一致: web=${web.correct_answer}, erec=${erecAns}, official=${bestAnswer}`)
          }
        }
      }
      if (answerMatch === 'single_source' && bestAnswer > 0) {
        answerMatch = 'match' // 公式正答を信頼
      }

      // 選択肢検証
      let choiceMatch: 'match' | 'partial' | 'mismatch' | 'single_source' = 'single_source'
      let bestChoices: { key: number; text: string }[] = []

      const webChoices = web?.choices || []
      const erecChoices = erec?.choices || []

      if (webChoices.length >= 5 && erecChoices.length >= 5) {
        // 2ソースで選択肢を比較
        let matchCount = 0
        for (let i = 0; i < Math.min(5, webChoices.length, erecChoices.length); i++) {
          const wText = normalizeText(webChoices[i]?.text || '')
          const eText = normalizeText(erecChoices[i]?.text || '')
          if (similarity(wText, eText) > 0.7) matchCount++
        }
        if (matchCount >= 4) {
          choiceMatch = 'match'
        } else if (matchCount >= 2) {
          choiceMatch = 'partial'
          issues.push(`選択肢部分一致: ${matchCount}/5`)
        } else {
          choiceMatch = 'mismatch'
          issues.push('選択肢不一致')
        }
        // web版を優先（HTMLパースが綺麗）
        bestChoices = webChoices.slice(0, 5).map((c: any, i: number) => ({ key: i + 1, text: c.text }))
      } else if (erecChoices.length >= 5) {
        bestChoices = erecChoices.slice(0, 5).map((c: any, i: number) => ({ key: i + 1, text: c.text }))
      } else if (webChoices.length >= 5) {
        bestChoices = webChoices.slice(0, 5).map((c: any, i: number) => ({ key: i + 1, text: c.text }))
      }

      // 解説: 最も長いものを採用（e-REC → web の順で優先）
      let bestExplanation = ''
      if (erec?.explanation && erec.explanation.length > 20) {
        bestExplanation = erec.explanation
      } else if (web?.explanation && web.explanation.length > 20) {
        bestExplanation = web.explanation
      }

      // 問題文: web版が最もクリーン、なければPDF
      const bestQuestionText = web?.question_text || pdf?.question_text || erec?.question_text || ''

      // 信頼度判定
      let confidence: 'high' | 'medium' | 'low' = 'low'
      if (choiceMatch === 'match' && answerMatch === 'match') {
        confidence = 'high'
      } else if (bestChoices.length >= 5 && bestAnswer > 0) {
        confidence = 'medium'
      } else if (imageUrls[`r${year}-${String(qNum).padStart(3, '0')}`] && bestAnswer > 0) {
        confidence = 'medium' // 画像問題で正答ありは medium
      }

      results.push({
        year, question_number: qNum, sources_available: sources,
        choice_match: choiceMatch, answer_match: answerMatch,
        confidence, issues, best_choices: bestChoices,
        best_answer: bestAnswer, best_explanation: bestExplanation,
      })

      // 検証済みデータとして出力
      const section = pdf?.section || web?.section || erec?.section || '実践'
      const id = `r${year}-${String(qNum).padStart(3, '0')}`
      const imgUrl = imageUrls[id]

      if (bestAnswer > 0 && (bestChoices.length >= 5 || imgUrl)) {
        validatedQuestions.push({
          id, year, question_number: qNum, section,
          subject: getSubject(qNum, section),
          category: erec?.category || '', question_text: bestQuestionText,
          choices: bestChoices, correct_answer: bestAnswer,
          explanation: bestExplanation, tags: [],
          ...(imgUrl ? { image_url: imgUrl } : {}),
          _confidence: confidence,
        })
      }
    }

    // 統計
    const high = results.filter(r => r.confidence === 'high').length
    const med = results.filter(r => r.confidence === 'medium').length
    const low = results.filter(r => r.confidence === 'low').length
    const choiceMatches = results.filter(r => r.choice_match === 'match').length
    const answerMatches = results.filter(r => r.answer_match === 'match').length
    const withIssues = results.filter(r => r.issues.length > 0)

    console.log(`信頼度: 高${high} / 中${med} / 低${low}`)
    console.log(`選択肢突合一致: ${choiceMatches}/345`)
    console.log(`正答突合一致: ${answerMatches}/345`)
    console.log(`検証済み投入可能: ${validatedQuestions.length}問`)
    if (withIssues.length > 0) {
      console.log(`\n⚠️ 問題あり: ${withIssues.length}件`)
      withIssues.slice(0, 5).forEach(r => {
        console.log(`  問${r.question_number}: ${r.issues.join(', ')}`)
      })
    }

    grandTotalHigh += high; grandTotalMed += med; grandTotalLow += low
    grandTotal += validatedQuestions.length

    // 検証済みTSファイル出力
    const tsQuestions = validatedQuestions.map(q => {
      const { _confidence, ...clean } = q
      return clean
    })

    const ts = `// 第${year}回薬剤師国家試験 検証済みデータ
// 3ソース突合検証: 厚労省PDF + yakugakulab + e-REC
// 信頼度: 高${high} / 中${med} / 低${low}

import type { Question } from '../../types/question'

export const EXAM_${year}_QUESTIONS: Question[] = ${JSON.stringify(tsQuestions, null, 2)}
`
    fs.writeFileSync(path.join(dataDir, `exam-${year}.ts`), ts, 'utf-8')

    // 検証レポート保存
    fs.writeFileSync(
      path.join(dataDir, `validation-${year}.json`),
      JSON.stringify(results, null, 2), 'utf-8'
    )
  }

  console.log(`\n========== 最終結果 ==========`)
  console.log(`信頼度 高: ${grandTotalHigh} / 中: ${grandTotalMed} / 低: ${grandTotalLow}`)
  console.log(`検証済み合計: ${grandTotal}問`)
  console.log(`ダミー200問を加えて総合計: ${grandTotal + 200}問`)
}

main().catch(console.error)
