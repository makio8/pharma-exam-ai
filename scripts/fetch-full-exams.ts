/**
 * 第107〜110回 全345問×4回 = 1,380問 取得スクリプト
 * 必須 + 理論①② + 実践①②③ の全6セクション対応
 *
 * npx tsx scripts/fetch-full-exams.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ===== URL構成 =====
// yakugakulab.info のURL構造:
// 107: /第107回薬剤師国家試験/第107回　XXX/
// 108-110: /第NNN回　XXX/

const BASE = 'https://yakugakulab.info'

function encJP(s: string): string {
  return encodeURIComponent(s).replace(/%20/g, '%E3%80%80') // 全角スペース
}

interface ExamSection {
  name: string
  section: '必須' | '理論' | '実践'
  url: string
}

function getExamSections(year: number): ExamSection[] {
  // 107回はURL構造が異なる（サブディレクトリあり）
  const prefix107 = `${BASE}/%e7%ac%ac107%e5%9b%9e%e8%96%ac%e5%89%a4%e5%b8%ab%e5%9b%bd%e5%ae%b6%e8%a9%a6%e9%a8%93`

  const sections: Record<number, ExamSection[]> = {
    107: [
      { name: '必須', section: '必須', url: `${prefix107}/%e7%ac%ac107%e5%9b%9e%e3%80%80%e5%bf%85%e9%a0%88%e5%95%8f%e9%a1%8c/` },
      { name: '理論①', section: '理論', url: `${prefix107}/%e7%ac%ac107%e5%9b%9e%e3%80%80%e7%90%86%e8%ab%96%e5%95%8f%e9%a1%8c%e2%91%a0/` },
      { name: '理論②', section: '理論', url: `${prefix107}/%e7%ac%ac107%e5%9b%9e%e3%80%80%e7%90%86%e8%ab%96%e5%95%8f%e9%a1%8c%e2%91%a1/` },
      { name: '実践①', section: '実践', url: `${prefix107}/%e7%ac%ac107%e5%9b%9e%e3%80%80%e5%ae%9f%e8%b7%b5%e5%95%8f%e9%a1%8c%e2%91%a0/` },
      { name: '実践②', section: '実践', url: `${prefix107}/%e7%ac%ac107%e5%9b%9e%e3%80%80%e5%ae%9f%e8%b7%b5%e5%95%8f%e9%a1%8c%e2%91%a1/` },
      { name: '実践③', section: '実践', url: `${prefix107}/%e7%ac%ac107%e5%9b%9e%e3%80%80%e5%ae%9f%e8%b7%b5%e5%95%8f%e9%a1%8c%e2%91%a2/` },
    ],
    108: [
      { name: '必須', section: '必須', url: `${BASE}/%e7%ac%ac108%e5%9b%9e%e3%80%80%e5%bf%85%e9%a0%88%e5%95%8f%e9%a1%8c/` },
      { name: '理論①', section: '理論', url: `${BASE}/%e7%ac%ac108%e5%9b%9e%e3%80%80%e7%90%86%e8%ab%96%e5%95%8f%e9%a1%8c%e2%91%a0/` },
      { name: '理論②', section: '理論', url: `${BASE}/%e7%ac%ac108%e5%9b%9e%e3%80%80%e7%90%86%e8%ab%96%e5%95%8f%e9%a1%8c%e2%91%a1/` },
      { name: '実践①', section: '実践', url: `${BASE}/%e7%ac%ac108%e5%9b%9e%e3%80%80%e5%ae%9f%e8%b7%b5%e5%95%8f%e9%a1%8c%e2%91%a0/` },
      { name: '実践②', section: '実践', url: `${BASE}/%e7%ac%ac108%e5%9b%9e%e3%80%80%e5%ae%9f%e8%b7%b5%e5%95%8f%e9%a1%8c%e2%91%a1/` },
      { name: '実践③', section: '実践', url: `${BASE}/%e7%ac%ac108%e5%9b%9e%e3%80%80%e5%ae%9f%e8%b7%b5%e5%95%8f%e9%a1%8c%e2%91%a2/` },
    ],
    109: [
      { name: '必須', section: '必須', url: `${BASE}/%e7%ac%ac109%e5%9b%9e%e3%80%80%e5%bf%85%e9%a0%88%e5%95%8f%e9%a1%8c/` },
      { name: '理論①', section: '理論', url: `${BASE}/%e7%ac%ac109%e5%9b%9e%e3%80%80%e7%90%86%e8%ab%96%e5%95%8f%e9%a1%8c%e2%91%a0/` },
      { name: '理論②', section: '理論', url: `${BASE}/%e7%ac%ac109%e5%9b%9e%e3%80%80%e7%90%86%e8%ab%96%e5%95%8f%e9%a1%8c%e2%91%a1/` },
      { name: '実践①', section: '実践', url: `${BASE}/%e7%ac%ac109%e5%9b%9e%e3%80%80%e5%ae%9f%e8%b7%b5%e5%95%8f%e9%a1%8c%e2%91%a0/` },
      { name: '実践②', section: '実践', url: `${BASE}/%e7%ac%ac109%e5%9b%9e%e3%80%80%e5%ae%9f%e8%b7%b5%e5%95%8f%e9%a1%8c%e2%91%a1/` },
      { name: '実践③', section: '実践', url: `${BASE}/%e7%ac%ac109%e5%9b%9e%e3%80%80%e5%ae%9f%e8%b7%b5%e5%95%8f%e9%a1%8c%e2%91%a2/` },
    ],
    110: [
      { name: '必須', section: '必須', url: `${BASE}/%e8%96%ac%e5%89%a4%e5%b8%ab%e5%9b%bd%e5%ae%b6%e8%a9%a6%e9%a8%93%e9%81%8e%e5%8e%bb%e5%95%8f%e8%a7%a3%e8%aa%ac/%e7%ac%ac110%e5%9b%9e%e8%96%ac%e5%89%a4%e5%b8%ab%e5%9b%bd%e5%ae%b6%e8%a9%a6%e9%a8%93/%e7%ac%ac110%e5%9b%9e%e3%80%80%e5%bf%85%e9%a0%88%e5%95%8f%e9%a1%8c/` },
      { name: '理論①', section: '理論', url: `${BASE}/%e8%96%ac%e5%89%a4%e5%b8%ab%e5%9b%bd%e5%ae%b6%e8%a9%a6%e9%a8%93%e9%81%8e%e5%8e%bb%e5%95%8f%e8%a7%a3%e8%aa%ac/%e7%ac%ac110%e5%9b%9e%e8%96%ac%e5%89%a4%e5%b8%ab%e5%9b%bd%e5%ae%b6%e8%a9%a6%e9%a8%93/%e7%ac%ac110%e5%9b%9e%e3%80%80%e7%90%86%e8%ab%96%e5%95%8f%e9%a1%8c%e2%91%a0/` },
      { name: '理論②', section: '理論', url: `${BASE}/%e8%96%ac%e5%89%a4%e5%b8%ab%e5%9b%bd%e5%ae%b6%e8%a9%a6%e9%a8%93%e9%81%8e%e5%8e%bb%e5%95%8f%e8%a7%a3%e8%aa%ac/%e7%ac%ac110%e5%9b%9e%e8%96%ac%e5%89%a4%e5%b8%ab%e5%9b%bd%e5%ae%b6%e8%a9%a6%e9%a8%93/%e7%ac%ac110%e5%9b%9e%e3%80%80%e7%90%86%e8%ab%96%e5%95%8f%e9%a1%8c%e2%91%a1/` },
      { name: '実践①', section: '実践', url: `${BASE}/%e8%96%ac%e5%89%a4%e5%b8%ab%e5%9b%bd%e5%ae%b6%e8%a9%a6%e9%a8%93%e9%81%8e%e5%8e%bb%e5%95%8f%e8%a7%a3%e8%aa%ac/%e7%ac%ac110%e5%9b%9e%e8%96%ac%e5%89%a4%e5%b8%ab%e5%9b%bd%e5%ae%b6%e8%a9%a6%e9%a8%93/%e7%ac%ac110%e5%9b%9e%e3%80%80%e5%ae%9f%e8%b7%b5%e5%95%8f%e9%a1%8c%e2%91%a0/` },
      { name: '実践②', section: '実践', url: `${BASE}/%e8%96%ac%e5%89%a4%e5%b8%ab%e5%9b%bd%e5%ae%b6%e8%a9%a6%e9%a8%93%e9%81%8e%e5%8e%bb%e5%95%8f%e8%a7%a3%e8%aa%ac/%e7%ac%ac110%e5%9b%9e%e8%96%ac%e5%89%a4%e5%b8%ab%e5%9b%bd%e5%ae%b6%e8%a9%a6%e9%a8%93/%e7%ac%ac110%e5%9b%9e%e3%80%80%e5%ae%9f%e8%b7%b5%e5%95%8f%e9%a1%8c%e2%91%a1/` },
      { name: '実践③', section: '実践', url: `${BASE}/%e8%96%ac%e5%89%a4%e5%b8%ab%e5%9b%bd%e5%ae%b6%e8%a9%a6%e9%a8%93%e9%81%8e%e5%8e%bb%e5%95%8f%e8%a7%a3%e8%aa%ac/%e7%ac%ac110%e5%9b%9e%e8%96%ac%e5%89%a4%e5%b8%ab%e5%9b%bd%e5%ae%b6%e8%a9%a6%e9%a8%93/%e7%ac%ac110%e5%9b%9e%e3%80%80%e5%ae%9f%e8%b7%b5%e5%95%8f%e9%a1%8c%e2%91%a2/` },
    ],
  }
  return sections[year] || []
}

// ===== 科目マッピング =====
function getSubject(qNum: number, section: string): string {
  if (section === '必須') {
    if (qNum <= 5) return '物理'
    if (qNum <= 10) return '化学'
    if (qNum <= 15) return '生物'
    if (qNum <= 25) return '実務' // 衛生
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
  // 実践問題は科目混合（問題内容から判定が必要だが、ひとまず「実務」で統一）
  return '実務'
}

// ===== HTML解析 =====
function stripHtml(html: string): string {
  return html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/\n{3,}/g, '\n\n').trim()
}

interface RawQuestion {
  exam_year: number; question_number: number; section: string; subject: string
  question_text: string; choices: { key: number; text: string }[]
  correct_answer: number; explanation: string; has_image: boolean
}

function parseQuestionPage(html: string, year: number, qNum: number, section: string, officialAnswer: number): RawQuestion | null {
  try {
    const contentMatch = html.match(/<div class="post_content">([\s\S]*?)(?:<\/div>\s*<div class="(?:w-singleBottom|p-articleFoot))/)
    if (!contentMatch) return null
    const content = contentMatch[1]
    const spoilerIndex = content.indexOf('su-spoiler')
    const beforeSpoiler = spoilerIndex > 0 ? content.substring(0, spoilerIndex) : content

    const pTags = beforeSpoiler.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || []
    const questionParts: string[] = []
    for (const p of pTags) {
      const text = stripHtml(p)
      if (text && text.length > 2) questionParts.push(text)
    }
    const questionText = questionParts.join('\n').trim()

    const choices: { key: number; text: string }[] = []
    const olMatch = beforeSpoiler.match(/<ol[^>]*>([\s\S]*?)<\/ol>/i)
    if (olMatch) {
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
      let liMatch, choiceNum = 1
      while ((liMatch = liRegex.exec(olMatch[1])) !== null && choiceNum <= 5) {
        choices.push({ key: choiceNum, text: stripHtml(liMatch[1]) })
        choiceNum++
      }
    }

    let correctAnswer = officialAnswer
    if (correctAnswer === 0) {
      const sp = content.match(/su-spoiler-content[\s\S]*?<\/div>\s*<\/div>/i)
      if (sp) {
        const am = sp[0].match(/解答[\s\S]*?<span>(\d)<\/span>/)
        if (am) correctAnswer = parseInt(am[1])
      }
    }

    let explanation = ''
    const sp = content.match(/su-spoiler-content[\s\S]*?<\/div>\s*<\/div>/i)
    if (sp) {
      const em = sp[0].match(/解説([\s\S]*)/)
      if (em) explanation = stripHtml(em[1]).substring(0, 500)
    }

    const hasImage = /<img[^>]+(?:src|data-src)/.test(beforeSpoiler)
    if (questionText.length > 5 && choices.length >= 2) {
      return { exam_year: year, question_number: qNum, section, subject: getSubject(qNum, section),
        question_text: questionText, choices, correct_answer: correctAnswer, explanation, has_image: hasImage }
    }
    return null
  } catch { return null }
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; pharma-exam-study-tool/1.0)' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

async function getQuestionUrls(listUrl: string): Promise<{ number: number; url: string }[]> {
  const html = await fetchPage(listUrl)
  const results: { number: number; url: string }[] = []
  const linkRegex = /<a[^>]+href="(https:\/\/yakugakulab\.info\/[^"]*)"[^>]*>/gi
  let match
  while ((match = linkRegex.exec(html)) !== null) {
    const decoded = decodeURIComponent(match[1])
    const numMatch = decoded.match(/問(\d+)/)
    if (numMatch) results.push({ number: parseInt(numMatch[1]), url: match[1] })
  }
  const unique = new Map<number, string>()
  for (const r of results) { if (!unique.has(r.number)) unique.set(r.number, r.url) }
  return Array.from(unique.entries()).map(([n, u]) => ({ number: n, url: u })).sort((a, b) => a.number - b.number)
}

// ===== メイン =====
async function main() {
  const outputDir = path.join(__dirname, '..', 'src', 'data', 'real-questions')
  fs.mkdirSync(outputDir, { recursive: true })

  const years = [107, 108, 109, 110]
  const grandTotal: Record<number, { total: number; usable: number }> = {}

  for (const year of years) {
    let officialAnswers: Record<string, number> = {}
    try {
      const data = JSON.parse(fs.readFileSync(`/tmp/claude/answers-${year}.json`, 'utf-8'))
      officialAnswers = data.answers || {}
      console.log(`\n📋 第${year}回 正答JSON: ${Object.keys(officialAnswers).length}問`)
    } catch {
      console.log(`\n⚠️ 第${year}回 正答JSONなし`)
    }

    // 既存データを読み込み（追記モード）
    let existing: RawQuestion[] = []
    const jsonPath = path.join(outputDir, `exam-${year}.json`)
    try {
      existing = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    } catch {}
    const existingNums = new Set(existing.map(q => q.question_number))

    const sections = getExamSections(year)
    const newQuestions: RawQuestion[] = []

    for (const sec of sections) {
      console.log(`--- 第${year}回 ${sec.name} ---`)
      let urls: { number: number; url: string }[] = []
      try {
        urls = await getQuestionUrls(sec.url)
        // 既存データにない問題のみ取得
        urls = urls.filter(u => !existingNums.has(u.number))
        console.log(`  新規: ${urls.length}問`)
      } catch (e: any) {
        console.log(`  ❌ ${e.message}`)
        continue
      }

      for (const { number: qNum, url } of urls) {
        try {
          process.stdout.write(`  問${qNum}...`)
          const html = await fetchPage(url)
          const ans = officialAnswers[String(qNum)] || 0
          const q = parseQuestionPage(html, year, qNum, sec.section, ans)
          if (q) {
            newQuestions.push(q)
            process.stdout.write(` ${q.has_image ? '📷' : '📝'} 正答:${q.correct_answer}\n`)
          } else {
            process.stdout.write(' ⚠️\n')
          }
          await new Promise(r => setTimeout(r, 800))
        } catch (e: any) {
          process.stdout.write(` ❌\n`)
        }
      }
    }

    // 既存+新規を統合
    const allQuestions = [...existing, ...newQuestions].sort((a, b) => a.question_number - b.question_number)
    // 重複除去
    const deduped = new Map<number, RawQuestion>()
    for (const q of allQuestions) deduped.set(q.question_number, q)
    const final = Array.from(deduped.values()).sort((a, b) => a.question_number - b.question_number)

    fs.writeFileSync(jsonPath, JSON.stringify(final, null, 2), 'utf-8')

    const usable = final.filter(q => q.correct_answer > 0 && q.choices.length === 5)
    grandTotal[year] = { total: final.length, usable: usable.length }
    console.log(`✅ 第${year}回: ${existing.length}→${final.length}問 (新規${newQuestions.length}問追加)`)
  }

  console.log('\n========== 全回サマリー ==========')
  let totalAll = 0
  for (const [y, t] of Object.entries(grandTotal)) {
    console.log(`第${y}回: ${t.total}問取得 / ${t.usable}問使用可能`)
    totalAll += t.usable
  }
  console.log(`\n実データ合計: ${totalAll}問`)
}

main().catch(console.error)
