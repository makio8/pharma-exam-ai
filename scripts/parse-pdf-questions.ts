/**
 * 厚労省PDFから直接問題文を抽出するスクリプト
 * pdftotext + ページ画像で全345問をカバー
 *
 * npx tsx scripts/parse-pdf-questions.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ===== PDF設定 =====
interface PdfConfig {
  year: number
  pdfs: { url: string; file: string; section: '必須' | '理論' | '実践' }[]
}

const EXAMS: PdfConfig[] = [
  {
    year: 107,
    pdfs: [
      { url: 'https://www.mhlw.go.jp/content/000915525.pdf', file: 'q107-hissu.pdf', section: '必須' },
      { url: 'https://www.mhlw.go.jp/content/000915526.pdf', file: 'q107-riron1.pdf', section: '理論' },
      { url: 'https://www.mhlw.go.jp/content/000915527.pdf', file: 'q107-riron2.pdf', section: '理論' },
      { url: 'https://www.mhlw.go.jp/content/000915529.pdf', file: 'q107-jissen1.pdf', section: '実践' },
      { url: 'https://www.mhlw.go.jp/content/000915530.pdf', file: 'q107-jissen2.pdf', section: '実践' },
      { url: 'https://www.mhlw.go.jp/content/000915531.pdf', file: 'q107-jissen3.pdf', section: '実践' },
    ],
  },
  {
    year: 108,
    pdfs: [
      { url: 'https://www.mhlw.go.jp/content/001074628.pdf', file: 'q108-hissu.pdf', section: '必須' },
      { url: 'https://www.mhlw.go.jp/content/001074629.pdf', file: 'q108-riron1.pdf', section: '理論' },
      { url: 'https://www.mhlw.go.jp/content/001074630.pdf', file: 'q108-riron2.pdf', section: '理論' },
      { url: 'https://www.mhlw.go.jp/content/001074631.pdf', file: 'q108-jissen1.pdf', section: '実践' },
      { url: 'https://www.mhlw.go.jp/content/001074632.pdf', file: 'q108-jissen2.pdf', section: '実践' },
      { url: 'https://www.mhlw.go.jp/content/001074633.pdf', file: 'q108-jissen3.pdf', section: '実践' },
    ],
  },
  {
    year: 109,
    pdfs: [
      { url: 'https://www.mhlw.go.jp/content/001226759.pdf', file: 'q109-hissu.pdf', section: '必須' },
      { url: 'https://www.mhlw.go.jp/content/001226760.pdf', file: 'q109-riron1.pdf', section: '理論' },
      { url: 'https://www.mhlw.go.jp/content/001226761.pdf', file: 'q109-riron2.pdf', section: '理論' },
      { url: 'https://www.mhlw.go.jp/content/001226762.pdf', file: 'q109-jissen1.pdf', section: '実践' },
      { url: 'https://www.mhlw.go.jp/content/001226763.pdf', file: 'q109-jissen2.pdf', section: '実践' },
      { url: 'https://www.mhlw.go.jp/content/001226764.pdf', file: 'q109-jissen3.pdf', section: '実践' },
    ],
  },
  {
    year: 110,
    pdfs: [
      { url: 'https://www.mhlw.go.jp/content/001455149.pdf', file: 'q110-hissu.pdf', section: '必須' },
      { url: 'https://www.mhlw.go.jp/content/001455152.pdf', file: 'q110-riron1.pdf', section: '理論' },
      { url: 'https://www.mhlw.go.jp/content/001455159.pdf', file: 'q110-riron2.pdf', section: '理論' },
      { url: 'https://www.mhlw.go.jp/content/001455160.pdf', file: 'q110-jissen1.pdf', section: '実践' },
      { url: 'https://www.mhlw.go.jp/content/001455161.pdf', file: 'q110-jissen2.pdf', section: '実践' },
      { url: 'https://www.mhlw.go.jp/content/001455162.pdf', file: 'q110-jissen3.pdf', section: '実践' },
    ],
  },
]

interface ParsedQuestion {
  exam_year: number
  question_number: number
  section: string
  question_text: string
  choices: string[]
  page_in_pdf: number
  pdf_file: string
}

function downloadPdf(url: string, dest: string): void {
  if (fs.existsSync(dest)) {
    console.log(`  既存: ${dest}`)
    return
  }
  console.log(`  DL: ${url}`)
  execSync(`curl -sL -o "${dest}" "${url}"`, { timeout: 30000 })
}

function extractText(pdfPath: string): string {
  return execSync(`pdftotext -layout "${pdfPath}" -`, { encoding: 'utf-8', timeout: 30000 })
}

/**
 * pdftotext の出力から問題を切り出す
 * 「問N」で始まる行を検出し、次の「問N+1」までを1問分として取得
 */
function parseQuestionsFromText(text: string, section: string, year: number, pdfFile: string): ParsedQuestion[] {
  const lines = text.split('\n')
  const questions: ParsedQuestion[] = []

  // 問番号の出現位置を検出
  const questionStarts: { lineIndex: number; number: number }[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    // パターン1: "問N " 単一問題
    // パターン2: "問N−N" or "問N-N" 連番問題（実践問題）
    // パターン3: "問 N " スペース入り
    const singleMatch = line.match(/^問\s*(\d{1,3})\s/)
    const rangeMatch = line.match(/^問\s*(\d{1,3})\s*[−\-–]\s*(\d{1,3})/)

    if (rangeMatch) {
      const start = parseInt(rangeMatch[1])
      const end = parseInt(rangeMatch[2])
      if (start >= 1 && end <= 345) {
        // 連番の各問題番号を登録
        for (let n = start; n <= end; n++) {
          questionStarts.push({ lineIndex: i, number: n })
        }
      }
    } else if (singleMatch) {
      const num = parseInt(singleMatch[1])
      if (num >= 1 && num <= 345) {
        questionStarts.push({ lineIndex: i, number: num })
      }
    }
  }

  // 各問題のテキストを切り出し
  for (let qi = 0; qi < questionStarts.length; qi++) {
    const start = questionStarts[qi]
    const endLine = qi + 1 < questionStarts.length
      ? questionStarts[qi + 1].lineIndex
      : Math.min(start.lineIndex + 50, lines.length) // 最後の問題は50行分

    const questionLines = lines.slice(start.lineIndex, endLine)
    const questionText = questionLines
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .filter(l => !l.match(/^[—-]\s*\d+\s*[—-]$/)) // ページ番号除去
      .filter(l => !l.match(/^\d{4}\/\d{2}\/\d{2}/)) // 日付除去
      .filter(l => !l.match(/^7083_/)) // ファイル名除去
      .join('\n')

    // 選択肢を抽出（"1 xxx  2 xxx  3 xxx" のパターン）
    const choices: string[] = []
    for (const line of questionLines) {
      const trimmed = line.trim()
      // 選択肢パターン: 行頭の数字
      const choiceMatch = trimmed.match(/^([1-5])\s+(.+)/)
      if (choiceMatch) {
        choices.push(choiceMatch[2].trim())
      }
    }

    questions.push({
      exam_year: year,
      question_number: start.number,
      section,
      question_text: questionText,
      choices,
      page_in_pdf: 0, // 後で計算
      pdf_file: pdfFile,
    })
  }

  return questions
}

async function main() {
  const tmpDir = '/tmp/claude'
  const outputDir = path.join(__dirname, '..', 'src', 'data', 'real-questions')

  for (const exam of EXAMS) {
    console.log(`\n=== 第${exam.year}回 PDFダイレクトパース ===`)

    const allQuestions: ParsedQuestion[] = []

    for (const pdf of exam.pdfs) {
      const pdfPath = path.join(tmpDir, pdf.file)
      downloadPdf(pdf.url, pdfPath)

      const text = extractText(pdfPath)
      const questions = parseQuestionsFromText(text, pdf.section, exam.year, pdf.file)
      console.log(`  ${pdf.file}: ${questions.length}問検出`)
      allQuestions.push(...questions)
    }

    // 重複除去
    const deduped = new Map<number, ParsedQuestion>()
    for (const q of allQuestions) deduped.set(q.question_number, q)
    const final = Array.from(deduped.values()).sort((a, b) => a.question_number - b.question_number)

    console.log(`\n第${exam.year}回 合計: ${final.length}問 / 345問`)

    // 欠番チェック
    const found = new Set(final.map(q => q.question_number))
    const missing: number[] = []
    for (let i = 1; i <= 345; i++) {
      if (!found.has(i)) missing.push(i)
    }
    if (missing.length > 0) {
      console.log(`欠番: ${missing.length}問 (${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''})`)
    } else {
      console.log('✅ 全345問検出！')
    }

    // JSON保存
    const outPath = path.join(outputDir, `exam-${exam.year}-pdf.json`)
    fs.writeFileSync(outPath, JSON.stringify(final, null, 2), 'utf-8')
    console.log(`保存: ${outPath}`)
  }
}

main().catch(console.error)
