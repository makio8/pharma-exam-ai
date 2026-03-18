/**
 * 100-106回のPDFページ画像を問題番号に紐付け
 * choices空の問題にimage_urlを設定するための画像マッピング生成
 *
 * npx tsx scripts/extract-question-images-batch.ts [--year 100-106]
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
  const matches = text.match(/問\s*(\d{1,3})\b/g) || []
  const numbers = matches.map(m => {
    const n = m.match(/\d+/)
    return n ? parseInt(n[0]) : 0
  }).filter(n => n > 0 && n <= 345)
  return [...new Set(numbers)].sort((a, b) => a - b)
}

function getPdfPageCount(pdfPath: string): number {
  try {
    const info = execSync(`pdfinfo "${pdfPath}" 2>/dev/null`, { encoding: 'utf-8' })
    const m = info.match(/Pages:\s+(\d+)/)
    return m ? parseInt(m[1]) : 0
  } catch {
    return 0
  }
}

async function processYear(year: number) {
  const pagesDir = `/tmp/claude/exam-pages/${year}`
  const outputDir = path.join(__dirname, '..', 'public', 'images', 'questions', String(year))
  const dataDir = path.join(__dirname, '..', 'src', 'data', 'real-questions')
  fs.mkdirSync(outputDir, { recursive: true })

  const pdfs = [
    { path: `/tmp/claude/q${year}-hissu.pdf`, prefix: `q${year}-hissu`, section: '必須' },
    { path: `/tmp/claude/q${year}-riron1.pdf`, prefix: `q${year}-riron1`, section: '理論' },
    { path: `/tmp/claude/q${year}-riron2.pdf`, prefix: `q${year}-riron2`, section: '理論' },
    { path: `/tmp/claude/q${year}-jissen1.pdf`, prefix: `q${year}-jissen1`, section: '実践' },
    { path: `/tmp/claude/q${year}-jissen2.pdf`, prefix: `q${year}-jissen2`, section: '実践' },
    { path: `/tmp/claude/q${year}-jissen3.pdf`, prefix: `q${year}-jissen3`, section: '実践' },
  ]

  console.log(`\n=== 第${year}回 ===`)

  // 1. 問題番号 → ページ画像ファイル のマッピングを構築
  const questionPageMap: Record<number, string> = {}

  for (const pdf of pdfs) {
    if (!fs.existsSync(pdf.path)) {
      console.log(`  ⚠ ${pdf.path} が見つかりません`)
      continue
    }
    const totalPages = getPdfPageCount(pdf.path)

    for (let p = 1; p <= totalPages; p++) {
      const text = extractPageText(pdf.path, p)
      const questions = findQuestionsInText(text)

      if (questions.length > 0) {
        // ページ画像のファイル名パターン: q{year}-{type}-{page}.png
        // pdftoppmは q100-hissu-01.png の形式で出力
        const paddedPage = String(p).padStart(2, '0')
        const srcPattern = path.join(pagesDir, `${pdf.prefix}-${paddedPage}.png`)

        // 実際のファイルを検索（pdftoppmの出力形式に対応）
        let srcFile = srcPattern
        if (!fs.existsSync(srcFile)) {
          // 3桁ページ番号の場合
          const paddedPage3 = String(p).padStart(3, '0')
          srcFile = path.join(pagesDir, `${pdf.prefix}-${paddedPage3}.png`)
        }

        if (fs.existsSync(srcFile)) {
          for (const qNum of questions) {
            // 最初に見つけたページを優先（問題文が最初に出るページ）
            if (!questionPageMap[qNum]) {
              questionPageMap[qNum] = srcFile
            }
          }
        }
      }
    }
  }

  // 2. exam-{year}.ts でchoices空の問題を特定
  const tsPath = path.join(dataDir, `exam-${year}.ts`)
  const tsContent = fs.readFileSync(tsPath, 'utf-8')
  const arrayStart = tsContent.indexOf('[\n')
  const questions = JSON.parse(tsContent.substring(arrayStart).trimEnd())
  const emptyChoicesQuestions = questions.filter((q: any) => !q.choices || q.choices.length === 0)

  console.log(`  問題→ページ紐付け: ${Object.keys(questionPageMap).length}問`)
  console.log(`  choices空の問題: ${emptyChoicesQuestions.length}問`)

  // 3. choices空の問題のページ画像をpublic/に配置
  let copied = 0
  const imageUrlMap: Record<string, string> = {}

  for (const q of emptyChoicesQuestions) {
    const qNum = q.question_number
    const srcFile = questionPageMap[qNum]
    if (srcFile && fs.existsSync(srcFile)) {
      const filename = `q${String(qNum).padStart(3, '0')}.png`
      const destFile = path.join(outputDir, filename)
      fs.copyFileSync(srcFile, destFile)
      imageUrlMap[`r${year}-${String(qNum).padStart(3, '0')}`] = `/images/questions/${year}/${filename}`
      copied++
    }
  }

  console.log(`  画像コピー: ${copied}枚 → ${outputDir}`)

  // 4. image-urls-{year}.json を出力
  const mapPath = path.join(dataDir, `image-urls-${year}.json`)
  fs.writeFileSync(mapPath, JSON.stringify(imageUrlMap, null, 2), 'utf-8')
  console.log(`  image-urls: ${Object.keys(imageUrlMap).length}件`)

  return { year, mapped: Object.keys(questionPageMap).length, copied, imageUrls: Object.keys(imageUrlMap).length }
}

async function main() {
  const yearArg = process.argv.find((_, i) => process.argv[i - 1] === '--year')
  let years: number[]
  if (yearArg && yearArg.includes('-')) {
    const [start, end] = yearArg.split('-').map(Number)
    years = Array.from({ length: end - start + 1 }, (_, i) => start + i)
  } else if (yearArg) {
    years = [Number(yearArg)]
  } else {
    years = [100, 101, 102, 103, 104, 105, 106]
  }

  const results = []
  for (const year of years) {
    results.push(await processYear(year))
  }

  console.log('\n=== サマリー ===')
  let totalImages = 0
  for (const r of results) {
    console.log(`第${r.year}回: 紐付け${r.mapped}問 / 画像${r.copied}枚 / image-urls ${r.imageUrls}件`)
    totalImages += r.copied
  }
  console.log(`合計: ${totalImages}枚の問題画像を配置`)
}

main().catch(console.error)
