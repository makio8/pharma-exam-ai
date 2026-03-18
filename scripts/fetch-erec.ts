/**
 * e-REC から問題データを取得するスクリプト
 * 静的HTML → 問題文・選択肢・解説・画像URLを抽出
 *
 * npx tsx scripts/fetch-erec.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE = 'https://e-rec123.jp/e-REC/contents'

interface ErecQuestion {
  year: number
  question_number: number
  title: string
  question_text: string
  choices: { key: number; text: string }[]
  answer_text: string
  explanation: string
  category: string
  has_image: boolean
  image_urls: string[]
}

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

function parseErecPage(html: string, year: number, qNum: number): ErecQuestion | null {
  try {
    // ページ存在確認
    if (!html.includes("id='about'") && !html.includes('id="about"')) return null

    // 問題タイトル
    let title = ''
    const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
    if (titleMatch) title = stripHtml(titleMatch[1])

    // 問題文+選択肢: section#about 内の最初の <p style='font-size:130%'>
    let questionBlock = ''
    const pMatch = html.match(/<p\s+style='font-size:130%;[^']*'>([\s\S]*?)<\/p>/i)
    if (!pMatch) {
      // 別のパターン
      const altMatch = html.match(/<p\s+style="font-size:130%[^"]*">([\s\S]*?)<\/p>/i)
      if (altMatch) questionBlock = altMatch[1]
    } else {
      questionBlock = pMatch[1]
    }

    // 選択肢を抽出: <span class='indent'>N text</span>
    const choices: { key: number; text: string }[] = []
    const choiceRegex = /<span\s+class=['"]indent['"][^>]*>([\s\S]*?)<\/span>/gi
    let choiceMatch
    while ((choiceMatch = choiceRegex.exec(questionBlock)) !== null) {
      const text = stripHtml(choiceMatch[1]).trim()
      // 全角数字 or 半角数字 で始まる
      const numMatch = text.match(/^([１-９\d])[．.\s　]+(.+)/)
      if (numMatch) {
        let key = numMatch[1]
        // 全角→半角変換
        if (key >= '１' && key <= '９') {
          key = String(key.charCodeAt(0) - '１'.charCodeAt(0) + 1)
        }
        choices.push({ key: parseInt(key), text: numMatch[2].trim() })
      } else if (text.length > 1) {
        choices.push({ key: choices.length + 1, text })
      }
    }

    // 問題文（選択肢を除いたテキスト）
    let questionText = ''
    // questionBlockから<span class='indent'>を除去
    const textOnly = questionBlock
      .replace(/<span\s+class=['"]indent['"][^>]*>[\s\S]*?<\/span>/gi, '')
    questionText = stripHtml(textOnly).trim()

    // 解説: <dd id='REC_PDF'> 内の <p style='font-size:130%'>
    let explanation = ''
    const ddMatch = html.match(/<dd\s+id='REC_PDF'[^>]*>([\s\S]*?)<\/dd>/i)
    if (ddMatch) {
      const explPMatch = ddMatch[1].match(/<p[^>]*>([\s\S]*?)<\/p>/i)
      if (explPMatch) {
        explanation = stripHtml(explPMatch[1]).trim()
      } else {
        explanation = stripHtml(ddMatch[1]).trim()
      }
      if (explanation.length > 1000) explanation = explanation.substring(0, 1000)
    }

    // カテゴリ: パンくずリスト最後の要素
    let category = ''
    const breadMatch = html.match(/<div\s+id=['"]topicpath['"][^>]*>[\s\S]*?<\/div>/i)
    if (breadMatch) {
      const lis = breadMatch[0].match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || []
      if (lis.length > 0) {
        category = stripHtml(lis[lis.length - 1])
      }
    }

    // 画像URL
    const imageUrls: string[] = []
    const imgRegex = /<img[^>]+src=['"]([^'"]+)['"]/gi
    let imgMatch
    while ((imgMatch = imgRegex.exec(questionBlock)) !== null) {
      if (imgMatch[1].includes('contents/')) {
        imageUrls.push(imgMatch[1].startsWith('http') ? imgMatch[1] : `https://e-rec123.jp${imgMatch[1]}`)
      }
    }

    const hasImage = imageUrls.length > 0

    if (questionText.length < 3 && choices.length === 0) return null

    return {
      year, question_number: qNum, title,
      question_text: questionText, choices,
      answer_text: '', explanation, category,
      has_image: hasImage, image_urls: imageUrls,
    }
  } catch {
    return null
  }
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; pharma-exam-study-tool/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

async function main() {
  const outputDir = path.join(__dirname, '..', 'src', 'data', 'real-questions')
  // CLI引数で年度指定: npx tsx scripts/fetch-erec.ts --year 106
  const args = process.argv.slice(2)
  const yearArgIdx = args.indexOf('--year')
  const years = yearArgIdx >= 0
    ? [parseInt(args[yearArgIdx + 1])]
    : [107, 108, 109, 110]

  for (const year of years) {
    console.log(`\n=== 第${year}回 e-REC取得 ===`)

    const questions: ErecQuestion[] = []
    let failCount = 0

    for (let qNum = 1; qNum <= 345; qNum++) {
      const url = `${BASE}/${year}/${qNum}.html`
      try {
        process.stdout.write(`  問${qNum}...`)
        const html = await fetchPage(url)
        const q = parseErecPage(html, year, qNum)

        if (q) {
          questions.push(q)
          const img = q.has_image ? '📷' : '📝'
          process.stdout.write(` ${img} 選択肢${q.choices.length} ${q.question_text.substring(0, 20)}...\n`)
        } else {
          failCount++
          process.stdout.write(' ⚠️\n')
        }

        // レート制限: 800ms
        await new Promise(r => setTimeout(r, 800))
      } catch (e: any) {
        failCount++
        process.stdout.write(` ❌\n`)
        // 連続失敗が多い場合は中断
        if (failCount > 20) {
          console.log('  連続失敗が多いため中断')
          break
        }
      }
    }

    // JSON保存
    const outPath = path.join(outputDir, `exam-${year}-erec.json`)
    fs.writeFileSync(outPath, JSON.stringify(questions, null, 2), 'utf-8')

    const withChoices = questions.filter(q => q.choices.length >= 5)
    const withExpl = questions.filter(q => q.explanation.length > 10)
    console.log(`\n第${year}回: ${questions.length}問取得 / 選択肢5つ: ${withChoices.length}問 / 解説あり: ${withExpl.length}問`)
    console.log(`→ ${outPath}`)
  }
}

main().catch(console.error)
