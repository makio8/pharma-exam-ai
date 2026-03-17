/**
 * 厚労省PDF → 問題番号ごとのページ画像を紐付け
 * 画像問題をアプリに統合するためのスクリプト
 *
 * npx tsx scripts/extract-question-images.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface PageQuestionMap {
  page: number
  file: string
  questions: number[]
}

function extractPageText(pdfPath: string, pageNum: number): string {
  try {
    return execSync(`pdftotext -f ${pageNum} -l ${pageNum} -layout "${pdfPath}" -`, {
      encoding: 'utf-8',
      timeout: 10000,
    })
  } catch {
    return ''
  }
}

function findQuestionsInText(text: string): number[] {
  const matches = text.match(/問\s*(\d{1,3})\s/g) || []
  const numbers = matches.map(m => {
    const n = m.match(/\d+/)
    return n ? parseInt(n[0]) : 0
  }).filter(n => n > 0 && n <= 345)

  // 重複除去
  return [...new Set(numbers)].sort((a, b) => a - b)
}

async function main() {
  const pagesDir = '/tmp/claude/exam-pages/110'
  const outputDir = path.join(__dirname, '..', 'public', 'images', 'questions', '110')
  fs.mkdirSync(outputDir, { recursive: true })

  const pdfs = [
    { path: '/tmp/claude/q110-hissu.pdf', prefix: 'hissu', section: '必須' },
    { path: '/tmp/claude/q110-riron1.pdf', prefix: 'riron1', section: '理論' },
    { path: '/tmp/claude/q110-riron2.pdf', prefix: 'riron2', section: '理論' },
  ]

  console.log('=== 問題番号 → ページ画像 紐付け ===\n')

  const questionPageMap: Record<number, string[]> = {}

  for (const pdf of pdfs) {
    // ページ数を取得
    const info = execSync(`pdfinfo "${pdf.path}" 2>/dev/null`, { encoding: 'utf-8' })
    const pagesMatch = info.match(/Pages:\s+(\d+)/)
    const totalPages = pagesMatch ? parseInt(pagesMatch[1]) : 0

    console.log(`${pdf.section}（${pdf.prefix}）: ${totalPages}ページ`)

    for (let p = 1; p <= totalPages; p++) {
      const text = extractPageText(pdf.path, p)
      const questions = findQuestionsInText(text)

      if (questions.length > 0) {
        // ページ画像ファイル名
        const paddedPage = String(p).padStart(2, '0')
        const srcFile = path.join(pagesDir, `${pdf.prefix}-${paddedPage}.png`)

        for (const qNum of questions) {
          if (!questionPageMap[qNum]) questionPageMap[qNum] = []
          questionPageMap[qNum].push(srcFile)
        }
      }
    }
  }

  // 画像問題（スクレイピングで has_image=true だったもの）のページ画像をコピー
  const rawData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'real-questions', 'exam-110.json'), 'utf-8')
  )
  const imageQuestions = rawData.filter((q: any) => q.has_image === true)

  console.log(`\n画像問題: ${imageQuestions.length}問`)

  let copied = 0
  for (const q of imageQuestions) {
    const qNum = q.question_number
    const pages = questionPageMap[qNum]
    if (pages && pages.length > 0) {
      // 最初のページ画像をコピー
      const destFile = path.join(outputDir, `q${String(qNum).padStart(3, '0')}.png`)
      try {
        fs.copyFileSync(pages[0], destFile)
        copied++
      } catch {}
    }
  }

  console.log(`コピー済み: ${copied}枚 → ${outputDir}`)

  // 画像URLマッピングを出力
  const imageUrlMap: Record<string, string> = {}
  for (const q of imageQuestions) {
    const qNum = q.question_number
    const filename = `q${String(qNum).padStart(3, '0')}.png`
    const destPath = path.join(outputDir, filename)
    if (fs.existsSync(destPath)) {
      imageUrlMap[`r110-${String(qNum).padStart(3, '0')}`] = `/images/questions/110/${filename}`
    }
  }

  const mapPath = path.join(__dirname, '..', 'src', 'data', 'real-questions', 'image-urls-110.json')
  fs.writeFileSync(mapPath, JSON.stringify(imageUrlMap, null, 2), 'utf-8')
  console.log(`画像URLマップ: ${Object.keys(imageUrlMap).length}件 → ${mapPath}`)
}

main().catch(console.error)
