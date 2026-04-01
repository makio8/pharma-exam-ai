/**
 * 厚労省PDFから問題文＋選択肢を抽出するスクリプト（v2: 選択肢パーサー改良版）
 *
 * 改良ポイント:
 * 1. 連番問題（問196−197）をサブ問題ヘッダーで正しく分割
 * 2. 横並び選択肢（1 xxx  2 xxx  3 xxx）の検出
 * 3. インデント付き縦並び選択肢の改良正規表現
 * 4. 問題文中の数字の誤検出防止
 *
 * npx tsx scripts/parse-pdf-questions-v2.ts
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
    year: 100,
    pdfs: [
      { url: '', file: 'q100-hissu.pdf', section: '必須' },
      { url: '', file: 'q100-riron1.pdf', section: '理論' },
      { url: '', file: 'q100-riron2.pdf', section: '理論' },
      { url: '', file: 'q100-jissen1.pdf', section: '実践' },
      { url: '', file: 'q100-jissen2.pdf', section: '実践' },
      { url: '', file: 'q100-jissen3.pdf', section: '実践' },
    ],
  },
  {
    year: 101,
    pdfs: [
      { url: '', file: 'q101-hissu.pdf', section: '必須' },
      { url: '', file: 'q101-riron1.pdf', section: '理論' },
      { url: '', file: 'q101-riron2.pdf', section: '理論' },
      { url: '', file: 'q101-jissen1.pdf', section: '実践' },
      { url: '', file: 'q101-jissen2.pdf', section: '実践' },
      { url: '', file: 'q101-jissen3.pdf', section: '実践' },
    ],
  },
  {
    year: 102,
    pdfs: [
      { url: '', file: 'q102-hissu.pdf', section: '必須' },
      { url: '', file: 'q102-riron1.pdf', section: '理論' },
      { url: '', file: 'q102-riron2.pdf', section: '理論' },
      { url: '', file: 'q102-jissen1.pdf', section: '実践' },
      { url: '', file: 'q102-jissen2.pdf', section: '実践' },
      { url: '', file: 'q102-jissen3.pdf', section: '実践' },
    ],
  },
  {
    year: 103,
    pdfs: [
      { url: '', file: 'q103-hissu.pdf', section: '必須' },
      { url: '', file: 'q103-riron1.pdf', section: '理論' },
      { url: '', file: 'q103-riron2.pdf', section: '理論' },
      { url: '', file: 'q103-jissen1.pdf', section: '実践' },
      { url: '', file: 'q103-jissen2.pdf', section: '実践' },
      { url: '', file: 'q103-jissen3.pdf', section: '実践' },
    ],
  },
  {
    year: 104,
    pdfs: [
      { url: '', file: 'q104-hissu.pdf', section: '必須' },
      { url: '', file: 'q104-riron1.pdf', section: '理論' },
      { url: '', file: 'q104-riron2.pdf', section: '理論' },
      { url: '', file: 'q104-jissen1.pdf', section: '実践' },
      { url: '', file: 'q104-jissen2.pdf', section: '実践' },
      { url: '', file: 'q104-jissen3.pdf', section: '実践' },
    ],
  },
  {
    year: 105,
    pdfs: [
      { url: '', file: 'q105-hissu.pdf', section: '必須' },
      { url: '', file: 'q105-riron1.pdf', section: '理論' },
      { url: '', file: 'q105-riron2.pdf', section: '理論' },
      { url: '', file: 'q105-jissen1.pdf', section: '実践' },
      { url: '', file: 'q105-jissen2.pdf', section: '実践' },
      { url: '', file: 'q105-jissen3.pdf', section: '実践' },
    ],
  },
  {
    year: 106,
    pdfs: [
      { url: '', file: 'q106-hissu.pdf', section: '必須' },
      { url: '', file: 'q106-riron1.pdf', section: '理論' },
      { url: '', file: 'q106-riron2.pdf', section: '理論' },
      { url: '', file: 'q106-jissen1.pdf', section: '実践' },
      { url: '', file: 'q106-jissen2.pdf', section: '実践' },
      { url: '', file: 'q106-jissen3.pdf', section: '実践' },
    ],
  },
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
  {
    year: 111,
    pdfs: [
      { url: 'https://www.mhlw.go.jp/content/001677927.pdf', file: 'q111-hissu.pdf', section: '必須' },
      { url: 'https://www.mhlw.go.jp/content/001677928.pdf', file: 'q111-riron1.pdf', section: '理論' },
      { url: 'https://www.mhlw.go.jp/content/001677929.pdf', file: 'q111-riron2.pdf', section: '理論' },
      { url: 'https://www.mhlw.go.jp/content/001677930.pdf', file: 'q111-jissen1.pdf', section: '実践' },
      { url: 'https://www.mhlw.go.jp/content/001677931.pdf', file: 'q111-jissen2.pdf', section: '実践' },
      { url: 'https://www.mhlw.go.jp/content/001677932.pdf', file: 'q111-jissen3.pdf', section: '実践' },
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
    return
  }
  console.log(`  DL: ${url}`)
  execSync(`curl -sL -o "${dest}" "${url}"`, { timeout: 30000 })
}

function extractText(pdfPath: string): string {
  return execSync(`pdftotext -layout "${pdfPath}" -`, { encoding: 'utf-8', timeout: 30000 })
}

/** ノイズ行を除去するフィルタ */
function isNoiseLine(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length === 0) return true
  // ページ番号行: 中央に数字だけ
  if (/^\s*\d{1,3}\s*$/.test(trimmed)) return true
  // ファイル名行
  if (/^7083_/.test(trimmed)) return true
  // 日付行
  if (/^\d{4}\/\d{2}\/\d{2}/.test(trimmed)) return true
  // ページ区切り行
  if (/^[—\-]+\s*\d+\s*[—\-]+$/.test(trimmed)) return true
  return false
}

/**
 * 選択肢を抽出する（改良版）
 *
 * パターン:
 * A) 縦並び: 行頭インデント + 番号 + スペース + テキスト
 *    "    1    テキスト"
 * B) 横並び: 1行に複数の番号+テキスト
 *    "    1  テキストA               2  テキストB               3  テキストC"
 * C) 横並び（短い選択肢）:
 *    "    1  xxx    2  xxx    3  xxx    4  xxx    5  xxx"
 */
function extractChoices(lines: string[]): string[] {
  const choices = new Map<number, string>()

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 横並びパターンの検出: 1行に2つ以上の選択肢番号がある
    // "   1  テキストA               2  テキストB"
    const horizontalMatches = findHorizontalChoices(line)
    if (horizontalMatches.length >= 2) {
      for (const m of horizontalMatches) {
        if (m.num >= 1 && m.num <= 6 && m.text.length >= 1) {
          choices.set(m.num, m.text)
        }
      }
      continue
    }

    // 縦並びパターン: インデントされた行で番号始まり
    // 最低5スペースのインデント + 番号(1-6) + 最低2スペース + テキスト(4文字以上)
    const verticalMatch = line.match(/^(\s{4,})([1-6])\s{2,}(\S.{2,})/)
    if (verticalMatch) {
      const num = parseInt(verticalMatch[2])
      let text = verticalMatch[3].trim()

      // 次の行が同じインデントで番号なしなら続き
      const indent = verticalMatch[1].length
      let j = i + 1
      while (j < lines.length) {
        const nextLine = lines[j]
        // 次の選択肢番号が来たら終了
        if (/^\s{4,}[1-6]\s{2,}\S/.test(nextLine)) break
        // 問ヘッダーが来たら終了
        if (/^\s*問\s*\d/.test(nextLine)) break
        // 空行が来たら終了
        if (nextLine.trim().length === 0) break
        // ノイズ行
        if (isNoiseLine(nextLine)) break
        // 続き行: 同程度のインデント（番号の後の位置）
        const contMatch = nextLine.match(/^(\s{6,})(\S.+)/)
        if (contMatch && contMatch[1].length >= indent + 2) {
          text += ' ' + contMatch[2].trim()
          j++
        } else {
          break
        }
      }

      if (num >= 1 && num <= 6) {
        choices.set(num, text)
      }
    }
  }

  // 結果を番号順に返す
  const result: string[] = []
  const maxNum = Math.max(...Array.from(choices.keys()), 0)
  for (let n = 1; n <= maxNum; n++) {
    if (choices.has(n)) {
      result.push(choices.get(n)!)
    }
  }
  return result
}

/**
 * 横並び選択肢を検出する
 * "   1  テキストA               2  テキストB               3  テキストC"
 */
function findHorizontalChoices(line: string): { num: number; text: string }[] {
  const results: { num: number; text: string }[] = []

  // 行全体のインデントが4以上でないと選択肢行と見なさない
  if (!/^\s{4,}/.test(line)) return results

  // 選択肢番号の位置をすべて見つける
  // パターン: スペース + 番号(1-6) + 2スペース以上 + テキスト
  const positions: { index: number; num: number }[] = []
  const regex = /(?:^|\s{2,})([1-6])\s{2,}(\S)/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(line)) !== null) {
    positions.push({ index: match.index, num: parseInt(match[1]) })
  }

  if (positions.length < 2) return results

  // 番号が連続的（1,2,3 or 4,5 等）か確認
  const nums = positions.map(p => p.num)
  let isSequential = true
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] !== nums[i - 1] + 1) {
      isSequential = false
      break
    }
  }
  if (!isSequential) return results

  // 各選択肢のテキストを切り出す
  for (let i = 0; i < positions.length; i++) {
    const startIdx = positions[i].index
    const endIdx = i + 1 < positions.length ? positions[i + 1].index : line.length

    // 番号部分を取り除いてテキスト抽出
    const segment = line.substring(startIdx, endIdx)
    const segMatch = segment.match(/\s*[1-6]\s{2,}(.+?)(\s{3,}|$)/)
    if (segMatch) {
      results.push({ num: positions[i].num, text: segMatch[1].trim() })
    } else {
      // フォールバック
      const fallback = segment.match(/\s*[1-6]\s+(.+)/)
      if (fallback) {
        results.push({ num: positions[i].num, text: fallback[1].trim() })
      }
    }
  }

  return results
}

/**
 * テキスト全体から問題ヘッダーの位置を検出する
 */
interface QuestionHeader {
  lineIndex: number
  number: number
  isRangeStart: boolean // 連番ブロックの先頭行か
  rangeEnd: number | null // 連番の終端番号
  isSubQuestion: boolean // 連番ブロック内のサブ問題か
}

function detectQuestionHeaders(lines: string[]): QuestionHeader[] {
  const headers: QuestionHeader[] = []

  // フェーズ1: 全ヘッダーを検出
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // 注意事項セクションの中はスキップ（「問 500」などの例示）
    if (/問\s*[4-9]\d{2}/.test(trimmed)) continue
    // 「問 1 9 0」のようなスペース区切り数字もスキップ（注意事項内）
    if (/問\s+\d\s+\d/.test(trimmed)) continue
    // 答案用紙の例
    if (/答案用紙/.test(trimmed)) continue
    if (/塗りつぶ/.test(trimmed)) continue
    // ページフッター
    if (/^7083_/.test(trimmed)) continue

    // パターン: "問 196−197" 連番問題
    const rangeMatch = trimmed.match(/^問\s*(\d{1,3})\s*[−\-–]\s*(\d{1,3})/)
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1])
      const end = parseInt(rangeMatch[2])
      if (start >= 1 && start <= 345 && end >= 1 && end <= 345 && end > start && end - start <= 3) {
        headers.push({
          lineIndex: i,
          number: start,
          isRangeStart: true,
          rangeEnd: end,
          isSubQuestion: false,
        })
        continue
      }
    }

    // パターン: "問 196（物理・化学・生物）" サブ問題ヘッダー
    const subMatch = trimmed.match(/^問\s*(\d{1,3})\s*[（(]/)
    if (subMatch) {
      const num = parseInt(subMatch[1])
      if (num >= 1 && num <= 345) {
        headers.push({
          lineIndex: i,
          number: num,
          isRangeStart: false,
          rangeEnd: null,
          isSubQuestion: true,
        })
        continue
      }
    }

    // パターン: "問N " 単一問題（行頭 or インデント付き）
    const singleMatch = trimmed.match(/^問\s*(\d{1,3})\s/)
    if (singleMatch) {
      const num = parseInt(singleMatch[1])
      if (num >= 1 && num <= 345) {
        // サブ問題でないことを確認（後に（科目名）がない）
        headers.push({
          lineIndex: i,
          number: num,
          isRangeStart: false,
          rangeEnd: null,
          isSubQuestion: false,
        })
      }
    }
  }

  return headers
}

/**
 * pdftotext の出力から問題を切り出す（v2）
 */
function parseQuestionsFromText(text: string, section: string, year: number, pdfFile: string): ParsedQuestion[] {
  const lines = text.split('\n')
  const questions: ParsedQuestion[] = []
  const headers = detectQuestionHeaders(lines)

  if (headers.length === 0) return questions

  // 連番ブロックの範囲を管理
  // rangeStart -> [subQuestion1, subQuestion2, ...]
  const rangeBlocks = new Map<number, { startLine: number; endLine: number; rangeEnd: number }>()

  // まず連番ブロックの範囲を特定
  for (let hi = 0; hi < headers.length; hi++) {
    const h = headers[hi]
    if (h.isRangeStart && h.rangeEnd) {
      // この連番ブロックの終了行 = 次のトップレベルヘッダーの開始行
      let endLine = lines.length
      for (let hj = hi + 1; hj < headers.length; hj++) {
        const nh = headers[hj]
        // 同じ連番ブロック内のサブ問題はスキップ
        if (nh.isSubQuestion && nh.number >= h.number && nh.number <= h.rangeEnd) continue
        endLine = nh.lineIndex
        break
      }
      rangeBlocks.set(h.number, { startLine: h.lineIndex, endLine, rangeEnd: h.rangeEnd })
    }
  }

  // 処理済み番号を追跡
  const processed = new Set<number>()

  for (let hi = 0; hi < headers.length; hi++) {
    const h = headers[hi]

    if (h.isRangeStart && h.rangeEnd) {
      // 連番ブロック: サブ問題ヘッダーを探して分割
      const block = rangeBlocks.get(h.number)!
      const blockLines = lines.slice(block.startLine, block.endLine)

      // 共通テキスト = 連番ヘッダーから最初のサブ問題ヘッダーまで
      const subHeaders: { localLine: number; number: number }[] = []
      for (let li = 0; li < blockLines.length; li++) {
        const trimmed = blockLines[li].trim()
        const subMatch = trimmed.match(/^問\s*(\d{1,3})\s*[（(]/)
        if (subMatch) {
          const num = parseInt(subMatch[1])
          if (num >= h.number && num <= h.rangeEnd) {
            subHeaders.push({ localLine: li, number: num })
          }
        }
      }

      // 共通テキスト
      const commonEndLine = subHeaders.length > 0 ? subHeaders[0].localLine : blockLines.length
      const commonText = blockLines.slice(0, commonEndLine)
        .map(l => l.trim())
        .filter(l => !isNoiseLine(l))
        .join('\n')

      if (subHeaders.length > 0) {
        // サブ問題ごとに処理
        for (let si = 0; si < subHeaders.length; si++) {
          const sub = subHeaders[si]
          const subEndLine = si + 1 < subHeaders.length
            ? subHeaders[si + 1].localLine
            : blockLines.length
          const subLines = blockLines.slice(sub.localLine, subEndLine)

          const subText = subLines
            .map(l => l.trim())
            .filter(l => !isNoiseLine(l))
            .join('\n')

          const fullText = commonText + '\n' + subText
          const choices = extractChoices(subLines)

          questions.push({
            exam_year: year,
            question_number: sub.number,
            section,
            question_text: fullText,
            choices,
            page_in_pdf: 0,
            pdf_file: pdfFile,
          })
          processed.add(sub.number)
        }
      } else {
        // サブヘッダーなし: 連番の各問題を1つずつ同じテキストで登録
        const choices = extractChoices(blockLines)
        for (let n = h.number; n <= h.rangeEnd; n++) {
          questions.push({
            exam_year: year,
            question_number: n,
            section,
            question_text: commonText,
            choices,
            page_in_pdf: 0,
            pdf_file: pdfFile,
          })
          processed.add(n)
        }
      }
      continue
    }

    // サブ問題ヘッダー（連番ブロック内で処理済み）はスキップ
    if (h.isSubQuestion && processed.has(h.number)) continue

    // 単一問題
    if (processed.has(h.number)) continue

    // 終了行を決定
    let endLine = lines.length
    for (let hj = hi + 1; hj < headers.length; hj++) {
      const nh = headers[hj]
      // サブ問題は同じ問題番号なのでスキップ
      if (nh.isSubQuestion && nh.number === h.number) continue
      endLine = nh.lineIndex
      break
    }

    const questionLines = lines.slice(h.lineIndex, endLine)
    const questionText = questionLines
      .map(l => l.trim())
      .filter(l => !isNoiseLine(l))
      .join('\n')

    const choices = extractChoices(questionLines)

    questions.push({
      exam_year: year,
      question_number: h.number,
      section,
      question_text: questionText,
      choices,
      page_in_pdf: 0,
      pdf_file: pdfFile,
    })
    processed.add(h.number)
  }

  return questions
}

async function main() {
  const tmpDir = '/tmp/claude'
  const outputDir = path.join(__dirname, '..', 'src', 'data', 'real-questions')

  // CLI引数で年度指定: --year 100-106 or --year 103
  const yearArg = process.argv.find((_, i) => process.argv[i - 1] === '--year')
  let targetYears: number[] | null = null
  if (yearArg && yearArg.includes('-')) {
    const [start, end] = yearArg.split('-').map(Number)
    targetYears = Array.from({ length: end - start + 1 }, (_, i) => start + i)
  } else if (yearArg) {
    targetYears = [Number(yearArg)]
  }
  const exams = targetYears ? EXAMS.filter(e => targetYears!.includes(e.year)) : EXAMS

  // 改善前の統計を読み込む
  const beforeStats: Record<number, { total: number; with5: number }> = {}
  for (const exam of exams) {
    const existingPath = path.join(outputDir, `exam-${exam.year}-pdf.json`)
    if (fs.existsSync(existingPath)) {
      const existing: ParsedQuestion[] = JSON.parse(fs.readFileSync(existingPath, 'utf-8'))
      beforeStats[exam.year] = {
        total: existing.length,
        with5: existing.filter(q => q.choices.length >= 5).length,
      }
    }
  }

  for (const exam of exams) {
    console.log(`\n=== 第${exam.year}回 PDFダイレクトパース (v2) ===`)

    const allQuestions: ParsedQuestion[] = []

    for (const pdf of exam.pdfs) {
      const pdfPath = path.join(tmpDir, pdf.file)
      downloadPdf(pdf.url, pdfPath)

      const text = extractText(pdfPath)
      const questions = parseQuestionsFromText(text, pdf.section, exam.year, pdf.file)
      console.log(`  ${pdf.file}: ${questions.length}問検出`)
      allQuestions.push(...questions)
    }

    // 重複除去（後に来たものを優先 = サブ問題が連番ブロック全体より優先）
    const deduped = new Map<number, ParsedQuestion>()
    for (const q of allQuestions) {
      const existing = deduped.get(q.question_number)
      // 選択肢が多い方を優先
      if (!existing || q.choices.length > existing.choices.length) {
        deduped.set(q.question_number, q)
      }
    }
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
      console.log('全345問検出')
    }

    // 選択肢統計
    const with5 = final.filter(q => q.choices.length >= 5).length
    const with0 = final.filter(q => q.choices.length === 0).length
    const partial = final.filter(q => q.choices.length > 0 && q.choices.length < 5).length
    console.log(`選択肢5つ以上: ${with5}問, 部分的: ${partial}問, 選択肢なし: ${with0}問`)

    // 改善前との比較
    if (beforeStats[exam.year]) {
      const before = beforeStats[exam.year]
      const diff = with5 - before.with5
      console.log(`改善: ${before.with5} → ${with5} (${diff >= 0 ? '+' : ''}${diff}問)`)
    }

    // JSON保存
    const outPath = path.join(outputDir, `exam-${exam.year}-pdf.json`)
    fs.writeFileSync(outPath, JSON.stringify(final, null, 2), 'utf-8')
    console.log(`保存: ${outPath}`)
  }

  // 全体統計
  console.log('\n=== 全体統計 ===')
  let totalBefore = 0
  let totalAfter = 0
  for (const exam of exams) {
    const outPath = path.join(outputDir, `exam-${exam.year}-pdf.json`)
    const data: ParsedQuestion[] = JSON.parse(fs.readFileSync(outPath, 'utf-8'))
    const with5 = data.filter(q => q.choices.length >= 5).length
    totalAfter += with5
    if (beforeStats[exam.year]) {
      totalBefore += beforeStats[exam.year].with5
    }
    console.log(`第${exam.year}回: ${data.length}問, 選択肢5つ以上: ${with5}問`)
  }
  console.log(`合計: 選択肢5つ以上 ${totalBefore} → ${totalAfter} (${totalAfter - totalBefore >= 0 ? '+' : ''}${totalAfter - totalBefore}問)`)
}

main().catch(console.error)
