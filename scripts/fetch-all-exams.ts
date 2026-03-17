/**
 * 第107〜109回 薬剤師国家試験 問題一括取得スクリプト
 * 正答JSONと問題テキストを組み合わせる
 *
 * 使い方: npx tsx scripts/fetch-all-exams.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ===== 設定 =====

interface ExamConfig {
  year: number
  sections: { name: string; section: '必須' | '理論' | '実践'; url: string }[]
}

const EXAMS: ExamConfig[] = [
  {
    year: 107,
    sections: [
      { name: '必須問題', section: '必須', url: 'https://yakugakulab.info/%e7%ac%ac107%e5%9b%9e%e8%96%ac%e5%89%a4%e5%b8%ab%e5%9b%bd%e5%ae%b6%e8%a9%a6%e9%a8%93/%e7%ac%ac107%e5%9b%9e%e3%80%80%e5%bf%85%e9%a0%88%e5%95%8f%e9%a1%8c/' },
      { name: '理論問題①', section: '理論', url: 'https://yakugakulab.info/%e7%ac%ac107%e5%9b%9e%e8%96%ac%e5%89%a4%e5%b8%ab%e5%9b%bd%e5%ae%b6%e8%a9%a6%e9%a8%93/%e7%ac%ac107%e5%9b%9e%e3%80%80%e7%90%86%e8%ab%96%e5%95%8f%e9%a1%8c%e2%91%a0/' },
      { name: '理論問題②', section: '理論', url: 'https://yakugakulab.info/%e7%ac%ac107%e5%9b%9e%e8%96%ac%e5%89%a4%e5%b8%ab%e5%9b%bd%e5%ae%b6%e8%a9%a6%e9%a8%93/%e7%ac%ac107%e5%9b%9e%e3%80%80%e7%90%86%e8%ab%96%e5%95%8f%e9%a1%8c%e2%91%a1/' },
    ],
  },
  {
    year: 108,
    sections: [
      { name: '必須問題', section: '必須', url: 'https://yakugakulab.info/%e7%ac%ac108%e5%9b%9e%e3%80%80%e5%bf%85%e9%a0%88%e5%95%8f%e9%a1%8c/' },
      { name: '理論問題①', section: '理論', url: 'https://yakugakulab.info/%e7%ac%ac108%e5%9b%9e%e3%80%80%e7%90%86%e8%ab%96%e5%95%8f%e9%a1%8c%e2%91%a0/' },
      { name: '理論問題②', section: '理論', url: 'https://yakugakulab.info/%e7%ac%ac108%e5%9b%9e%e3%80%80%e7%90%86%e8%ab%96%e5%95%8f%e9%a1%8c%e2%91%a1/' },
    ],
  },
  {
    year: 109,
    sections: [
      { name: '必須問題', section: '必須', url: 'https://yakugakulab.info/%e7%ac%ac109%e5%9b%9e%e3%80%80%e5%bf%85%e9%a0%88%e5%95%8f%e9%a1%8c/' },
      { name: '理論問題①', section: '理論', url: 'https://yakugakulab.info/%e7%ac%ac109%e5%9b%9e%e3%80%80%e7%90%86%e8%ab%96%e5%95%8f%e9%a1%8c%e2%91%a0/' },
      { name: '理論問題②', section: '理論', url: 'https://yakugakulab.info/%e7%ac%ac109%e5%9b%9e%e3%80%80%e7%90%86%e8%ab%96%e5%95%8f%e9%a1%8c%e2%91%a1/' },
    ],
  },
]

// ===== 科目マッピング =====
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

// ===== HTML解析 =====

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

interface RawQuestion {
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

function parseQuestionPage(html: string, examYear: number, qNum: number, section: string, officialAnswer: number): RawQuestion | null {
  try {
    const contentMatch = html.match(/<div class="post_content">([\s\S]*?)(?:<\/div>\s*<div class="(?:w-singleBottom|p-articleFoot))/)
    if (!contentMatch) return null

    const content = contentMatch[1]
    const spoilerIndex = content.indexOf('su-spoiler')
    const beforeSpoiler = spoilerIndex > 0 ? content.substring(0, spoilerIndex) : content

    // 問題文
    const pTags = beforeSpoiler.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || []
    const questionParts: string[] = []
    for (const p of pTags) {
      const text = stripHtml(p)
      if (text && text.length > 2) questionParts.push(text)
    }
    const questionText = questionParts.join('\n').trim()

    // 選択肢 (<ol><li>)
    const choices: { key: number; text: string }[] = []
    const olMatch = beforeSpoiler.match(/<ol[^>]*>([\s\S]*?)<\/ol>/i)
    if (olMatch) {
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
      let liMatch
      let choiceNum = 1
      while ((liMatch = liRegex.exec(olMatch[1])) !== null && choiceNum <= 5) {
        choices.push({ key: choiceNum, text: stripHtml(liMatch[1]) })
        choiceNum++
      }
    }

    // 正答: 厚労省JSONから取得（優先）、なければページから
    let correctAnswer = officialAnswer
    if (correctAnswer === 0) {
      const spoilerContent = content.match(/su-spoiler-content[\s\S]*?<\/div>\s*<\/div>/i)
      if (spoilerContent) {
        const ansMatch = spoilerContent[0].match(/解答[\s\S]*?<span>(\d)<\/span>/)
        if (ansMatch) correctAnswer = parseInt(ansMatch[1])
      }
    }

    // 解説
    let explanation = ''
    const spoilerContent = content.match(/su-spoiler-content[\s\S]*?<\/div>\s*<\/div>/i)
    if (spoilerContent) {
      const explMatch = spoilerContent[0].match(/解説([\s\S]*)/)
      if (explMatch) explanation = stripHtml(explMatch[1]).substring(0, 500)
    }

    const hasImage = /<img[^>]+(?:src|data-src)/.test(beforeSpoiler)
    const subject = getSubject(qNum, section)

    if (questionText.length > 5 && choices.length >= 2) {
      return {
        exam_year: examYear,
        question_number: qNum,
        section,
        subject,
        question_text: questionText,
        choices,
        correct_answer: correctAnswer,
        explanation,
        has_image: hasImage,
      }
    }
    return null
  } catch {
    return null
  }
}

// ===== ネットワーク =====

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; pharma-exam-study-tool/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

async function getQuestionUrls(listPageUrl: string, year: number): Promise<{ number: number; url: string }[]> {
  const html = await fetchPage(listPageUrl)
  const results: { number: number; url: string }[] = []
  const linkRegex = /<a[^>]+href="(https:\/\/yakugakulab\.info\/[^"]*)"[^>]*>/gi
  let match
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1]
    const decoded = decodeURIComponent(url)
    const numMatch = decoded.match(/第\d+回.*問(\d+)/)
    if (numMatch) {
      results.push({ number: parseInt(numMatch[1]), url })
    }
  }
  const unique = new Map<number, string>()
  for (const r of results) {
    if (!unique.has(r.number)) unique.set(r.number, r.url)
  }
  return Array.from(unique.entries())
    .map(([number, url]) => ({ number, url }))
    .sort((a, b) => a.number - b.number)
}

// ===== メイン =====

async function main() {
  const outputDir = path.join(__dirname, '..', 'src', 'data', 'real-questions')
  fs.mkdirSync(outputDir, { recursive: true })

  console.log('=== 第107〜109回 薬剤師国家試験 一括取得 ===\n')

  for (const exam of EXAMS) {
    // 正答JSONを読み込み
    let officialAnswers: Record<string, number> = {}
    const answersPath = `/tmp/claude/answers-${exam.year}.json`
    try {
      const answersData = JSON.parse(fs.readFileSync(answersPath, 'utf-8'))
      officialAnswers = answersData.answers || {}
      console.log(`📋 第${exam.year}回 正答JSON読み込み: ${Object.keys(officialAnswers).length}問`)
    } catch {
      console.log(`⚠️ 第${exam.year}回 正答JSON未発見（ページ内正答を使用）`)
    }

    const examQuestions: RawQuestion[] = []

    for (const sec of exam.sections) {
      console.log(`\n--- 第${exam.year}回 ${sec.name} ---`)
      let urls: { number: number; url: string }[] = []
      try {
        urls = await getQuestionUrls(sec.url, exam.year)
        console.log(`  ${urls.length} 問のURLを取得`)
      } catch (e: any) {
        console.log(`  ❌ URL一覧取得失敗: ${e.message}`)
        continue
      }

      for (const { number: qNum, url } of urls) {
        try {
          process.stdout.write(`  問${qNum}...`)
          const html = await fetchPage(url)
          const officialAnswer = officialAnswers[String(qNum)] || 0
          const q = parseQuestionPage(html, exam.year, qNum, sec.section, officialAnswer)

          if (q) {
            examQuestions.push(q)
            const img = q.has_image ? '📷' : '📝'
            process.stdout.write(` ${img} 正答:${q.correct_answer} ${q.question_text.substring(0, 25)}...\n`)
          } else {
            process.stdout.write(' ⚠️ パース失敗\n')
          }
          await new Promise(r => setTimeout(r, 1000))
        } catch (e: any) {
          process.stdout.write(` ❌ ${e.message}\n`)
        }
      }
    }

    // JSON保存
    const jsonPath = path.join(outputDir, `exam-${exam.year}.json`)
    fs.writeFileSync(jsonPath, JSON.stringify(examQuestions, null, 2), 'utf-8')

    // 使用可能な問題のみフィルタしてTS出力
    const usable = examQuestions.filter(q => q.has_image === false && q.correct_answer > 0 && q.choices.length === 5)
    const tsQuestions = usable.map(q => ({
      id: `r${exam.year}-${String(q.question_number).padStart(3, '0')}`,
      year: q.exam_year,
      question_number: q.question_number,
      section: q.section,
      subject: q.subject,
      category: '',
      question_text: q.question_text,
      choices: q.choices.map(c => ({ key: c.key as 1|2|3|4|5, text: c.text })),
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      tags: [] as string[],
    }))

    const tsContent = `// 第${exam.year}回薬剤師国家試験 実問題データ（テキストのみ・自動取得）
// 出典: 厚生労働省 第${exam.year}回薬剤師国家試験

import type { Question } from '../../types/question'

export const EXAM_${exam.year}_QUESTIONS: Question[] = ${JSON.stringify(tsQuestions, null, 2)}
`
    const tsPath = path.join(outputDir, `exam-${exam.year}.ts`)
    fs.writeFileSync(tsPath, tsContent, 'utf-8')

    console.log(`\n✅ 第${exam.year}回: 取得${examQuestions.length}問 / 使用可能${usable.length}問 → ${tsPath}`)
  }

  console.log('\n========== 全回完了 ==========')
}

main().catch(console.error)
