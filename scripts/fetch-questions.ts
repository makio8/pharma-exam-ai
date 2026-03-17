/**
 * 薬剤師国家試験 過去問取得スクリプト
 * yakugakulab.info から問題テキストを取得してJSONデータに変換する
 *
 * 使い方: npx tsx scripts/fetch-questions.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ===== 科目マッピング =====
// 第110回 必須問題（問1〜90）の科目配分
function getSubject110(qNum: number): string {
  if (qNum <= 5) return '物理'
  if (qNum <= 10) return '化学'
  if (qNum <= 15) return '生物'
  if (qNum <= 25) return '実務'      // 衛生 → 実務に統合
  if (qNum <= 35) return '薬理'
  if (qNum <= 45) return '薬剤'
  if (qNum <= 55) return '病態・薬物治療'
  if (qNum <= 65) return '法規・制度・倫理'
  return '実務'
}

interface RawQuestion {
  exam_year: number
  question_number: number
  section: '必須' | '理論' | '実践'
  subject: string
  question_text: string
  choices: { key: number; text: string }[]
  correct_answer: number
  explanation: string
  tags: string[]
  category: string
  has_image: boolean
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

/** yakugakulab.info の問題ページHTMLをパース */
function parseQuestionPage(html: string, examYear: number, questionNumber: number, section: '必須' | '理論' | '実践'): RawQuestion | null {
  try {
    // post_content ブロックを取得
    const contentMatch = html.match(/<div class="post_content">([\s\S]*?)<\/div>\s*<div class="w-singleBottom"/)
    if (!contentMatch) {
      // 別パターン
      const altMatch = html.match(/<div class="post_content">([\s\S]*?)<\/div>\s*<div class="p-articleFoot/)
      if (!altMatch) return null
      return parseContent(altMatch[1], examYear, questionNumber, section)
    }
    return parseContent(contentMatch[1], examYear, questionNumber, section)
  } catch (e) {
    console.error(`  Parse error q${questionNumber}:`, e)
    return null
  }
}

function parseContent(content: string, examYear: number, questionNumber: number, section: '必須' | '理論' | '実践'): RawQuestion | null {
  // 問題文: spoiler の前のテキスト
  const spoilerIndex = content.indexOf('su-spoiler')
  const beforeSpoiler = spoilerIndex > 0 ? content.substring(0, spoilerIndex) : content

  // <p> タグから問題文を取得
  const pTags = beforeSpoiler.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || []
  const questionParts: string[] = []
  for (const p of pTags) {
    const text = stripHtml(p)
    if (text && text.length > 2) {
      questionParts.push(text)
    }
  }
  const questionText = questionParts.join('\n').trim()

  // 選択肢: <ol><li> パターン
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

  // 正答: su-spoiler 内の <span>数字</span>
  let correctAnswer = 0
  const spoilerContent = content.match(/su-spoiler-content[\s\S]*?<\/div>\s*<\/div>/i)
  if (spoilerContent) {
    // パターン: 解答\n<span>3</span>
    const ansMatch = spoilerContent[0].match(/解答[\s\S]*?<span>(\d)<\/span>/)
    if (ansMatch) {
      correctAnswer = parseInt(ansMatch[1])
    } else {
      // パターン: 正解 3 or 正答 3
      const altAns = spoilerContent[0].match(/正[解答]\s*[\s\S]*?(\d)/)
      if (altAns) correctAnswer = parseInt(altAns[1])
    }
  }

  // 解説
  let explanation = ''
  if (spoilerContent) {
    const explMatch = spoilerContent[0].match(/解説[\s\S]*?<\/p>([\s\S]*?)(?:<\/div>|$)/)
    if (explMatch) {
      explanation = stripHtml(explMatch[1]).substring(0, 500)
    } else {
      // 解答の後のテキスト全体
      const afterAnswer = spoilerContent[0].match(/解説([\s\S]*)/)
      if (afterAnswer) {
        explanation = stripHtml(afterAnswer[1]).substring(0, 500)
      }
    }
  }

  // 画像有無
  const hasImage = /<img[^>]+(?:src|data-src)/.test(beforeSpoiler)

  // 科目
  const subject = getSubject110(questionNumber)

  // 最低限のデータがあれば返す
  if (questionText.length > 5 && choices.length >= 2) {
    return {
      exam_year: examYear,
      question_number: questionNumber,
      section,
      subject,
      question_text: questionText,
      choices,
      correct_answer: correctAnswer,
      explanation,
      tags: [],
      category: '',
      has_image: hasImage,
    }
  }

  return null
}

// ===== URL取得 =====

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; pharma-exam-study-tool/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  return res.text()
}

async function getQuestionUrls(listPageUrl: string): Promise<{ number: number; url: string }[]> {
  const html = await fetchPage(listPageUrl)
  const results: { number: number; url: string }[] = []

  // aタグからリンクを抽出
  const linkRegex = /<a[^>]+href="(https:\/\/yakugakulab\.info\/[^"]*%e5%95%8f[^"]*)"[^>]*>/gi
  let match
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1]
    const decoded = decodeURIComponent(url)
    const numMatch = decoded.match(/問(\d+)/)
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

  console.log('=== 薬剤師国家試験 過去問取得スクリプト ===\n')

  const sections = [
    {
      name: '第110回 必須問題',
      section: '必須' as const,
      year: 110,
      url: 'https://yakugakulab.info/%e8%96%ac%e5%89%a4%e5%b8%ab%e5%9b%bd%e5%ae%b6%e8%a9%a6%e9%a8%93%e9%81%8e%e5%8e%bb%e5%95%8f%e8%a7%a3%e8%aa%ac/%e7%ac%ac110%e5%9b%9e%e8%96%ac%e5%89%a4%e5%b8%ab%e5%9b%bd%e5%ae%b6%e8%a9%a6%e9%a8%93/%e7%ac%ac110%e5%9b%9e%e3%80%80%e5%bf%85%e9%a0%88%e5%95%8f%e9%a1%8c/',
    },
    {
      name: '第110回 理論問題①',
      section: '理論' as const,
      year: 110,
      url: 'https://yakugakulab.info/%e8%96%ac%e5%89%a4%e5%b8%ab%e5%9b%bd%e5%ae%b6%e8%a9%a6%e9%a8%93%e9%81%8e%e5%8e%bb%e5%95%8f%e8%a7%a3%e8%aa%ac/%e7%ac%ac110%e5%9b%9e%e8%96%ac%e5%89%a4%e5%b8%ab%e5%9b%bd%e5%ae%b6%e8%a9%a6%e9%a8%93/%e7%ac%ac110%e5%9b%9e%e3%80%80%e7%90%86%e8%ab%96%e5%95%8f%e9%a1%8c%e2%91%a0/',
    },
    {
      name: '第110回 理論問題②',
      section: '理論' as const,
      year: 110,
      url: 'https://yakugakulab.info/%e8%96%ac%e5%89%a4%e5%b8%ab%e5%9b%bd%e5%ae%b6%e8%a9%a6%e9%a8%93%e9%81%8e%e5%8e%bb%e5%95%8f%e8%a7%a3%e8%aa%ac/%e7%ac%ac110%e5%9b%9e%e8%96%ac%e5%89%a4%e5%b8%ab%e5%9b%bd%e5%ae%b6%e8%a9%a6%e9%a8%93/%e7%ac%ac110%e5%9b%9e%e3%80%80%e7%90%86%e8%ab%96%e5%95%8f%e9%a1%8c%e2%91%a1/',
    },
  ]

  const allQuestions: RawQuestion[] = []

  for (const sec of sections) {
    console.log(`\n--- ${sec.name} ---`)
    const urls = await getQuestionUrls(sec.url)
    console.log(`  ${urls.length} 問のURLを取得`)

    for (const { number, url } of urls) {
      try {
        process.stdout.write(`  問${number}...`)
        const html = await fetchPage(url)
        const q = parseQuestionPage(html, sec.year, number, sec.section)

        if (q) {
          allQuestions.push(q)
          const imgTag = q.has_image ? '📷' : '📝'
          process.stdout.write(` ${imgTag} ${q.question_text.substring(0, 30)}... 正答:${q.correct_answer} 選択肢:${q.choices.length}\n`)
        } else {
          process.stdout.write(' ⚠️ パース失敗\n')
        }

        await new Promise(r => setTimeout(r, 1200))
      } catch (e: any) {
        process.stdout.write(` ❌ ${e.message}\n`)
      }
    }
  }

  // JSON出力
  const outputPath = path.join(outputDir, 'exam-110.json')
  fs.writeFileSync(outputPath, JSON.stringify(allQuestions, null, 2), 'utf-8')

  // 統計
  const textOnly = allQuestions.filter(q => !q.has_image)
  const withImage = allQuestions.filter(q => q.has_image)
  const withAnswer = allQuestions.filter(q => q.correct_answer > 0)

  console.log(`\n========== 結果 ==========`)
  console.log(`合計: ${allQuestions.length} 問を取得`)
  console.log(`テキストのみ: ${textOnly.length} 問（アプリに直接使える）`)
  console.log(`画像あり: ${withImage.length} 問（画像対応が必要）`)
  console.log(`正答あり: ${withAnswer.length} 問`)
  console.log(`保存先: ${outputPath}`)
}

main().catch(console.error)
