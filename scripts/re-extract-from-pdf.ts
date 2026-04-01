#!/usr/bin/env npx tsx
/**
 * 改善版 PDF再抽出パイプライン
 *
 * 第100回の人力レビュー結果(gold set)を踏まえた改善:
 * 1. 実務連問のシナリオを正確に分離 (linked_scenario)
 * 2. 処方箋・検査値ブロックを検出し {{image:N}} に置換
 * 3. question_text のクリーニング改善
 * 4. 選択肢の特殊文字復元
 * 5. 不要画像フラグ (image_url を持つべきでない問題の検出)
 *
 * Usage:
 *   npx tsx scripts/re-extract-from-pdf.ts --year 100 --dry-run
 *   npx tsx scripts/re-extract-from-pdf.ts --year 100
 *   npx tsx scripts/re-extract-from-pdf.ts --year 100-111
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..')
const DATA_DIR = path.join(PROJECT_ROOT, 'src', 'data', 'real-questions')
const PDF_DIR = path.join(PROJECT_ROOT, 'data', 'pdfs')
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'reports')

// ─────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const VERBOSE = args.includes('--verbose')
const yearArg = args.find((_, i) => args[i - 1] === '--year')

function parseYears(arg: string | undefined): number[] {
  if (!arg) return [100]
  if (arg.includes('-')) {
    const [start, end] = arg.split('-').map(Number)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }
  return [Number(arg)]
}
const TARGET_YEARS = parseYears(yearArg)

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface PdfSection {
  file: string
  section: '必須' | '理論' | '実践'
}

interface ExtractedQuestion {
  id: string
  year: number
  question_number: number
  section: string
  question_text: string
  choices: { key: number; text: string }[]
  linked_group: string | null
  linked_scenario: string | null
  image_needs: ImageNeed[]
  pdf_file: string
  pdf_page: number
  /** true if current image_url should be removed */
  flag_image_remove: boolean
}

interface ImageNeed {
  id: number
  target: 'scenario' | 'question'
  reason: string
  pdf_file: string
  pdf_page_approx: number
}

interface LinkedGroupInfo {
  headerLine: number
  firstQNum: number
  lastQNum: number
  scenarioLines: string[]
  scenarioStartLine: number
  scenarioEndLine: number
  pdfFile: string
  pageNum: number
}

// ─────────────────────────────────────────────
// PDF configs per year (reuse from parse-pdf-questions-v2.ts)
// ─────────────────────────────────────────────
function getPdfSections(year: number): PdfSection[] {
  return [
    { file: `q${year}-hissu.pdf`, section: '必須' },
    { file: `q${year}-riron1.pdf`, section: '理論' },
    { file: `q${year}-riron2.pdf`, section: '理論' },
    { file: `q${year}-jissen1.pdf`, section: '実践' },
    { file: `q${year}-jissen2.pdf`, section: '実践' },
    { file: `q${year}-jissen3.pdf`, section: '実践' },
  ]
}

// ─────────────────────────────────────────────
// PDF text extraction with page tracking
// ─────────────────────────────────────────────
interface PdfPage {
  pageNum: number  // 1-based
  lines: string[]
}

function extractPdfPages(pdfPath: string): PdfPage[] {
  const raw = execSync(`pdftotext -layout "${pdfPath}" -`, {
    encoding: 'utf-8',
    timeout: 30000,
  })
  const pages: PdfPage[] = []
  // pdftotext uses form feed (\f) to separate pages
  const pageTexts = raw.split('\f')
  for (let i = 0; i < pageTexts.length; i++) {
    const text = pageTexts[i]
    if (text.trim().length === 0) continue
    pages.push({
      pageNum: i + 1,
      lines: text.split('\n'),
    })
  }
  return pages
}

// ─────────────────────────────────────────────
// Noise detection
// ─────────────────────────────────────────────
function isNoiseLine(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length === 0) return true
  // Page number: centered digits only
  if (/^\s*⎜?\s*\d{1,3}\s*⎜?\s*$/.test(trimmed)) return true
  // File name lines (PDF footer)
  if (/^\d{4}_\d+/.test(trimmed)) return true
  // Date lines
  if (/^\d{4}\/\d{2}\/\d{2}/.test(trimmed)) return true
  // Page separator
  if (/^[—\-]+\s*\d+\s*[—\-]+$/.test(trimmed)) return true
  // Exam instruction headers
  if (/^注\s*意\s*事\s*項/.test(trimmed)) return true
  if (/^◎指示があるまで/.test(trimmed)) return true
  if (/^一般問題（薬学/.test(trimmed)) return true
  if (/^【.*／.*】/.test(trimmed)) return true
  if (/答案用紙/.test(trimmed)) return true
  if (/塗りつぶ/.test(trimmed)) return true
  if (/^問題の内容については/.test(trimmed)) return true
  if (/^設問中の科学用語/.test(trimmed)) return true
  if (/解答方法は次の/.test(trimmed)) return true
  if (/^⑴|^⑵|^⑶|^⑷/.test(trimmed)) return true
  if (/医薬品医療機器等法/.test(trimmed)) return true
  if (/^試験問題の数は/.test(trimmed)) return true
  if (/分以内で解答/.test(trimmed)) return true
  if (/鉛筆で濃く/.test(trimmed)) return true
  if (/消しゴム/.test(trimmed)) return true
  if (/折り曲げたり/.test(trimmed)) return true
  if (/正しい答えは/.test(trimmed)) return true
  if (/悪い解答例/.test(trimmed)) return true
  if (/採点されない/.test(trimmed)) return true
  if (/とすればよい/.test(trimmed)) return true
  if (/正答数と異なる/.test(trimmed)) return true
  if (/^（例）/.test(trimmed)) return true
  return false
}

function isInstructionSection(line: string): boolean {
  return /^100\s+.*一般問題/.test(line.trim()) ||
    /^\d+\s+日目/.test(line.trim())
}

// ─────────────────────────────────────────────
// Prescription / Lab / Table block detection
// ─────────────────────────────────────────────

/** Detect if a block of lines is a prescription/structured data block */
function isPrescriptionStart(line: string): boolean {
  const trimmed = line.trim()
  // Normalize parentheses for matching (mixed full/half-width)
  const normalized = trimmed
    .replace(/[（(]/g, '(')
    .replace(/[）)]/g, ')')

  return /^[\s]*(持参薬|処方|処方\s*[1-9１-９]|Rp|注射薬|注射|注)\s*[)）]?\s*$/i.test(normalized) ||
    /^\(?(持参薬|処方|処方\s*[1-9１-９]|Rp)\)?/.test(normalized) ||
    /^処方[1-9１-９]?\s*[)）]?\s*$/.test(trimmed) ||
    /^Rp\s*[)）.]?\s*$/.test(trimmed) ||
    // お薬手帳, 血液検査, etc. - structured record blocks
    /^[（(]?\s*(お薬手帳|薬歴|服薬歴|持参薬一覧)\s*[）)]?\s*$/.test(normalized) ||
    // Table headers for medicine records
    /^\s*年\s+月\s+日\s+.*処方/.test(trimmed)
}

function isDrugDosageLine(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length === 0) return false

  // Reject if it looks like a narrative sentence (long text with sentence particles)
  // Narrative lines flow like sentences; prescription lines are structured/tabular
  if (trimmed.length > 40 && /[をにでがはも、。]$/.test(trimmed)) return false
  if (trimmed.length > 50 && !/\s{4,}/.test(trimmed)) return false  // No tabular gaps

  // Deep indentation + dosage schedule (continuation of prescription)
  if (/^\s{8,}/.test(line) && /[０-９0-9]日[０-９0-9]回|[０-９0-9]回[０-９0-9]|朝食後|夕食後|昼食後|食後|食前|就寝前|日分/.test(trimmed)) return true

  // Indented drug name line: starts with spaces + drug name + dosage unit, with tabular gaps
  // Match both ASCII and fullwidth digits
  const D = '[0-9０-９]'
  const unitRe = new RegExp(`${D}+\\s*(?:mg|μg|mL|g\\b|錠|カプセル|包|散|mEq)`)
  if (/^\s{3,}/.test(line) && /\s{3,}/.test(trimmed) && unitRe.test(trimmed)) return true

  // Lines that are clearly dosage instructions (short, structured)
  if (/^[１1]日[１-９1-9]回|^[１1]回[１-９1-9]/.test(trimmed)) return true

  // Indented dosage continuation
  if (/^\s{6,}/.test(line) && /[０-９0-9]回|[０-９0-9]日|朝|夕|昼|食後|食前/.test(trimmed) && trimmed.length < 40) return true

  return false
}

function isLabValueStart(line: string): boolean {
  const trimmed = line.trim()
  return /^[（(]?検査[値結果所見]/.test(trimmed) ||
    /^臨床検査/.test(trimmed) ||
    /^血液検査/.test(trimmed) ||
    /^入院時[のの]?検査/.test(trimmed) ||
    /^術前検査/.test(trimmed) ||
    /^生化学検査/.test(trimmed)
}

function isLabValueLine(line: string): boolean {
  const trimmed = line.trim()
  // Lab value patterns: name + number + unit
  if (/\d+\.?\d*\s*(mg\/dL|g\/dL|mEq\/L|IU\/L|U\/L|mmHg|mm|%|×\s*10)/.test(trimmed)) return true
  if (/[A-Z]{2,}\s+\d/.test(trimmed)) return true  // BUN 15, AST 22, etc.
  if (/白血球|赤血球|血小板|ヘモグロビン|ヘマトクリット|アルブミン|クレアチニン|血糖/.test(trimmed) && /\d/.test(trimmed)) return true
  return false
}

function isTableLine(line: string): boolean {
  // Lines with multiple large-gap-separated columns (tabular data)
  const segments = line.split(/\s{4,}/).filter(s => s.trim().length > 0)
  return segments.length >= 3
}

interface StructuredBlock {
  startLine: number
  endLine: number
  type: 'prescription' | 'lab' | 'table'
}

function detectStructuredBlocks(lines: string[]): StructuredBlock[] {
  const blocks: StructuredBlock[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // Prescription block
    if (isPrescriptionStart(line)) {
      const start = i
      i++
      // Consume drug/dosage lines and empty lines between them
      while (i < lines.length) {
        const next = lines[i].trim()
        if (next.length === 0) {
          // Check if next non-empty line is still prescription
          let j = i + 1
          while (j < lines.length && lines[j].trim().length === 0) j++
          if (j < lines.length && isDrugDosageLine(lines[j])) {
            i = j
            continue
          }
          break
        }
        if (isDrugDosageLine(lines[i]) || /^\s{6,}/.test(lines[i])) {
          i++
          continue
        }
        break
      }
      if (i - start >= 2) {
        blocks.push({ startLine: start, endLine: i, type: 'prescription' })
      }
      continue
    }

    // Lab value block
    if (isLabValueStart(line)) {
      const start = i
      i++
      while (i < lines.length) {
        const next = lines[i].trim()
        if (next.length === 0) {
          let j = i + 1
          while (j < lines.length && lines[j].trim().length === 0) j++
          if (j < lines.length && isLabValueLine(lines[j])) {
            i = j
            continue
          }
          break
        }
        if (isLabValueLine(lines[i]) || isTableLine(lines[i])) {
          i++
          continue
        }
        break
      }
      if (i - start >= 2) {
        blocks.push({ startLine: start, endLine: i, type: 'lab' })
      }
      continue
    }

    i++
  }

  return blocks
}

// ─────────────────────────────────────────────
// Linked group detection and scenario extraction
// ─────────────────────────────────────────────
const DASH_CHARS = '[\u002D\u2011\u2012\u2013\u2014\u2015\u2212\uFF0D−–]'

interface ParsedHeader {
  lineIndex: number
  globalLineIndex: number
  pageNum: number
  qNum: number
  type: 'range' | 'individual' | 'standalone'
  rangeEnd?: number
}

function detectHeaders(pages: PdfPage[], pdfFile: string): ParsedHeader[] {
  const headers: ParsedHeader[] = []
  let globalLine = 0

  for (const page of pages) {
    for (let li = 0; li < page.lines.length; li++) {
      const line = page.lines[li]
      const trimmed = line.trim()

      // Skip instruction/noise
      if (isNoiseLine(trimmed) || isInstructionSection(trimmed)) {
        globalLine++
        continue
      }

      // Skip example questions (問 500 etc.)
      if (/問\s*[4-9]\d{2}/.test(trimmed)) { globalLine++; continue }

      // Range header: "問 196−199" or "問196‑197"
      const rangeRe = new RegExp(`^問\\s*(\\d{1,3})\\s*${DASH_CHARS}\\s*(\\d{1,3})`)
      const rangeMatch = trimmed.match(rangeRe)
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1])
        const end = parseInt(rangeMatch[2])
        if (start >= 1 && start <= 345 && end > start && end - start <= 4) {
          headers.push({
            lineIndex: li,
            globalLineIndex: globalLine,
            pageNum: page.pageNum,
            qNum: start,
            type: 'range',
            rangeEnd: end,
          })
        }
        globalLine++
        continue
      }

      // Individual question in linked group: "問 196（実務）"
      const indivMatch = trimmed.match(/^問\s*(\d{1,3})\s*[（(]/)
      if (indivMatch) {
        const num = parseInt(indivMatch[1])
        if (num >= 1 && num <= 345) {
          headers.push({
            lineIndex: li,
            globalLineIndex: globalLine,
            pageNum: page.pageNum,
            qNum: num,
            type: 'individual',
          })
        }
        globalLine++
        continue
      }

      // Standalone question: "問 1 次に示す..."
      const standaloneMatch = trimmed.match(/^問\s*(\d{1,3})\s+/)
      if (standaloneMatch) {
        const num = parseInt(standaloneMatch[1])
        if (num >= 1 && num <= 345) {
          headers.push({
            lineIndex: li,
            globalLineIndex: globalLine,
            pageNum: page.pageNum,
            qNum: num,
            type: 'standalone',
          })
        }
      }

      globalLine++
    }
    globalLine++ // page boundary
  }

  return headers
}

// ─────────────────────────────────────────────
// Choice extraction (improved)
// ─────────────────────────────────────────────

function extractChoicesFromLines(lines: string[]): { key: number; text: string }[] {
  const choices = new Map<number, string>()

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Horizontal choices: "  1  textA     2  textB     3  textC"
    const horizontalResults = findHorizontalChoices(line)
    if (horizontalResults.length >= 2) {
      for (const hr of horizontalResults) {
        if (hr.num >= 1 && hr.num <= 6) choices.set(hr.num, hr.text)
      }
      continue
    }

    // Vertical choices: indented number + text (as few as 1-2 spaces indent in PDF)
    const vertMatch = line.match(/^(\s{1,})([1-6])\s{1,}(\S.{1,})/)
    if (vertMatch) {
      const num = parseInt(vertMatch[2])
      let text = vertMatch[3].trim()
      const indent = vertMatch[1].length

      // Continuation lines (indented deeper than the number)
      let j = i + 1
      while (j < lines.length) {
        const nextLine = lines[j]
        if (/^\s{1,}[1-6]\s{1,}\S/.test(nextLine)) break
        if (/^\s*問\s*\d/.test(nextLine)) break
        if (nextLine.trim().length === 0) break
        const contMatch = nextLine.match(/^(\s{2,})(\S.+)/)
        if (contMatch && contMatch[1].length >= indent) {
          text += ' ' + contMatch[2].trim()
          j++
        } else {
          break
        }
      }

      if (num >= 1 && num <= 6) {
        choices.set(num, cleanChoiceText(text))
      }
    }
  }

  // Build result
  const result: { key: number; text: string }[] = []
  const maxNum = Math.max(...Array.from(choices.keys()), 0)
  for (let n = 1; n <= maxNum; n++) {
    if (choices.has(n)) result.push({ key: n, text: choices.get(n)! })
  }
  return result
}

function findHorizontalChoices(line: string): { num: number; text: string }[] {
  if (!/^\s{1,}/.test(line)) return []

  const positions: { index: number; num: number }[] = []
  const regex = /(?:^|\s{2,})([1-6])\s{2,}(\S)/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(line)) !== null) {
    positions.push({ index: match.index, num: parseInt(match[1]) })
  }

  if (positions.length < 2) return []

  // Check sequential
  const nums = positions.map(p => p.num)
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] !== nums[i - 1] + 1) return []
  }

  const results: { num: number; text: string }[] = []
  for (let i = 0; i < positions.length; i++) {
    const startIdx = positions[i].index
    const endIdx = i + 1 < positions.length ? positions[i + 1].index : line.length
    const segment = line.substring(startIdx, endIdx)
    const segMatch = segment.match(/\s*[1-6]\s{2,}(.+?)(\s{3,}|$)/)
    if (segMatch) {
      results.push({ num: positions[i].num, text: cleanChoiceText(segMatch[1].trim()) })
    } else {
      const fallback = segment.match(/\s*[1-6]\s+(.+)/)
      if (fallback) results.push({ num: positions[i].num, text: cleanChoiceText(fallback[1].trim()) })
    }
  }

  return results
}

// ─────────────────────────────────────────────
// Text cleaning
// ─────────────────────────────────────────────

function cleanChoiceText(text: string): string {
  // Fix common special character issues from PDF
  text = text.replace(/＋/g, '＋')  // full-width plus
  text = text.replace(/（/g, '（').replace(/）/g, '）')
  // Clean trailing whitespace
  text = text.replace(/\s+$/, '')
  return text
}

function cleanScenarioText(text: string): string {
  // Remove page markers
  text = text.replace(/\n?\d{4}_\d+_\w+\.indd\s+\d+\s+\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}\s*/g, '')
  // Remove page numbers (standalone on a line)
  text = text.replace(/\n\s*⎜?\s*\d{1,3}\s*⎜?\s*$/gm, '')
  // Collapse multiple blank lines
  text = text.replace(/\n{3,}/g, '\n\n')
  // Join PDF layout line breaks (mid-sentence breaks)
  text = joinPdfLineBreaks(text)
  return text.trim()
}

/**
 * PDF由来の行折り返しを結合する。
 * 文の途中で切れた行（行末が句読点でない、次行が小文字/続き）を結合。
 * {{image:N}} の前後は改行を維持。
 */
function joinPdfLineBreaks(text: string): string {
  const lines = text.split('\n')
  const result: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const nextLine = i + 1 < lines.length ? lines[i + 1]?.trim() : ''

    // Keep blank lines
    if (line.length === 0) {
      result.push('')
      continue
    }

    // Keep {{image:N}} on its own line
    if (line.startsWith('{{image:') || nextLine.startsWith('{{image:')) {
      result.push(line)
      continue
    }

    // If line ends with a sentence-ending character, keep the break
    if (/[。．.）)」』】]$/.test(line)) {
      result.push(line)
      continue
    }

    // If next line is empty or starts a new paragraph/section, keep break
    if (nextLine.length === 0 || nextLine.startsWith('{{image:')) {
      result.push(line)
      continue
    }

    // If this line seems to continue into the next (mid-sentence break)
    // Indicators: line ends with hiragana, katakana, kanji that's not a sentence end
    if (/[ぁ-んァ-ヶ一-龠ー、，a-zA-Z0-9０-９]$/.test(line) && nextLine.length > 0) {
      // Join with next line(s) - keep joining as long as continuation pattern holds
      let joined = line
      while (i + 1 < lines.length) {
        const peek = lines[i + 1]?.trim()
        if (!peek || peek.length === 0) break
        if (peek.startsWith('{{image:')) break
        const needsSpace = /[a-zA-Z0-9]$/.test(joined) && /^[a-zA-Z0-9]/.test(peek)
        joined = joined + (needsSpace ? ' ' : '') + peek
        i++
        // Stop if this joined line now ends with sentence-ending punctuation
        if (/[。．.）)」』】]$/.test(joined)) break
        // Stop if it no longer looks like a continuation
        if (!/[ぁ-んァ-ヶ一-龠ー、，a-zA-Z0-9０-９]$/.test(joined)) break
      }
      result.push(joined)
      continue
    }

    result.push(line)
  }

  return result.join('\n')
}

function cleanQuestionText(text: string): string {
  // Remove question header "問 NNN（科目）" prefix
  text = text.replace(/^問\s*\d{1,3}\s*[（(][^）)]*[）)]\s*\n?/m, '')
  // Remove standalone question header "問 NNN "
  text = text.replace(/^問\s*\d{1,3}\s+/, '')
  // Remove page markers and numbers
  text = text.replace(/\n?\d{4}_\d+_\w+\.indd\s+\d+\s+\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}\s*/g, '')
  text = text.replace(/\n\s*⎜?\s*\d{1,3}\s*⎜?\s*$/gm, '')
  // Join PDF layout line breaks
  text = joinPdfLineBreaks(text)
  // Fix broken "N つ選べ" patterns
  text = text.replace(/\s+つ選べ/, 'つ選べ')
  text = text.replace(/\s+つ\s+選べ/, 'つ選べ')
  // Collapse multiple blank lines
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

function stripGroupHeader(text: string): string {
  const re = new RegExp(`^問\\s*\\d+\\s*${DASH_CHARS}\\s*\\d+\\s*`)
  return text.replace(re, '').trim()
}

// ─────────────────────────────────────────────
// Scenario block → {{image:N}} replacement
// ─────────────────────────────────────────────

interface ScenarioWithImages {
  text: string
  imageNeeds: ImageNeed[]
}

function replaceStructuredBlocksWithImages(
  lines: string[],
  blocks: StructuredBlock[],
  pdfFile: string,
  pageNum: number,
  target: 'scenario' | 'question',
): ScenarioWithImages {
  if (blocks.length === 0) {
    return {
      text: lines.map(l => l.trim()).filter(l => l.length > 0).join('\n'),
      imageNeeds: [],
    }
  }

  // Sort blocks by startLine
  const sorted = [...blocks].sort((a, b) => a.startLine - b.startLine)

  let imageId = 1
  const imageNeeds: ImageNeed[] = []
  const resultParts: string[] = []
  let pos = 0

  for (const block of sorted) {
    // Add text before the block
    const beforeLines = lines.slice(pos, block.startLine)
    const beforeText = beforeLines.map(l => l.trim()).filter(l => l.length > 0).join('\n')
    if (beforeText.length > 0) resultParts.push(beforeText)

    // Replace block with {{image:N}}
    resultParts.push(`{{image:${imageId}}}`)
    imageNeeds.push({
      id: imageId,
      target,
      reason: block.type,
      pdf_file: pdfFile,
      pdf_page_approx: pageNum,
    })
    imageId++
    pos = block.endLine
  }

  // Add remaining text
  const afterLines = lines.slice(pos)
  const afterText = afterLines.map(l => l.trim()).filter(l => l.length > 0).join('\n')
  if (afterText.length > 0) resultParts.push(afterText)

  return {
    text: resultParts.join('\n'),
    imageNeeds,
  }
}

// ─────────────────────────────────────────────
// Main extraction logic
// ─────────────────────────────────────────────

function extractYear(year: number): ExtractedQuestion[] {
  const sections = getPdfSections(year)
  const allQuestions: ExtractedQuestion[] = []

  // Flatten all pages across all PDFs with file tracking
  interface GlobalLine {
    text: string
    pdfFile: string
    pageNum: number
    localLineIndex: number
  }
  const globalLines: GlobalLine[] = []

  for (const sec of sections) {
    const pdfPath = path.join(PDF_DIR, sec.file)
    if (!existsSync(pdfPath)) {
      console.warn(`  ⚠ MISSING PDF: ${sec.file} — section will be empty`)
      continue
    }

    const pages = extractPdfPages(pdfPath)

    // Parse headers
    const headers = detectHeaders(pages, sec.file)

    // Flatten pages to continuous lines with metadata
    const flatLines: { text: string; pageNum: number }[] = []
    for (const page of pages) {
      for (const line of page.lines) {
        flatLines.push({ text: line, pageNum: page.pageNum })
      }
    }

    // Process headers to build question blocks
    // First pass: identify linked groups
    const rangeHeaders = headers.filter(h => h.type === 'range')

    for (const rh of rangeHeaders) {
      // Find the range header in flatLines
      const rangeStartIdx = findLineInFlat(flatLines, rh, pages)
      if (rangeStartIdx < 0) continue

      // Find individual question headers within this range
      const individualHeaders = headers.filter(
        h => h.type === 'individual' && h.qNum >= rh.qNum && h.qNum <= rh.rangeEnd!
      )

      // Find the next range header or standalone question after this range
      const nextHeaderIdx = findNextGroupBoundary(flatLines, rangeStartIdx, rh.rangeEnd!, headers, pages)

      // Extract scenario: from range header to first individual question
      const firstIndiv = individualHeaders.length > 0
        ? findLineInFlat(flatLines, individualHeaders[0], pages)
        : nextHeaderIdx

      if (firstIndiv <= rangeStartIdx) continue

      // Scenario lines (between range header and first individual question)
      // Keep raw lines with indentation for block detection
      const scenarioRawLines = flatLines.slice(rangeStartIdx, firstIndiv)
        .map(l => l.text)

      // Filter noise lines but keep indentation
      const scenarioFilteredLines = scenarioRawLines.filter(l => !isNoiseLine(l))

      // Strip group header from first non-empty line
      if (scenarioFilteredLines.length > 0) {
        scenarioFilteredLines[0] = stripGroupHeader(scenarioFilteredLines[0])
      }

      // Detect structured blocks on RAW indented lines (before cleaning)
      const blocks = detectStructuredBlocks(scenarioFilteredLines)
      const scenarioPageNum = flatLines[rangeStartIdx]?.pageNum || 1

      // Replace blocks with {{image:N}} placeholders
      const { text: rawScenarioWithImages, imageNeeds: scenarioImageNeeds } =
        replaceStructuredBlocksWithImages(
          scenarioFilteredLines, blocks, sec.file, scenarioPageNum, 'scenario'
        )

      // Now clean the text
      const finalScenario = cleanScenarioText(rawScenarioWithImages)

      // Process each individual question
      for (let qi = 0; qi < individualHeaders.length; qi++) {
        const ih = individualHeaders[qi]
        const ihIdx = findLineInFlat(flatLines, ih, pages)
        if (ihIdx < 0) continue

        // End of this individual question
        let qEndIdx: number
        if (qi + 1 < individualHeaders.length) {
          qEndIdx = findLineInFlat(flatLines, individualHeaders[qi + 1], pages)
        } else {
          qEndIdx = nextHeaderIdx
        }

        const qLines = flatLines.slice(ihIdx, qEndIdx).map(l => l.text)
        const filteredLines = qLines.filter(l => !isNoiseLine(l))

        // Extract question text (remove header line with 問NNN（科目）)
        const qTextLines = [...filteredLines]
        let questionText = qTextLines.join('\n')
        questionText = cleanQuestionText(questionText)

        // Extract choices from the question lines
        const choices = extractChoicesFromLines(filteredLines)

        // Remove choice text from question_text
        if (choices.length >= 2) {
          questionText = removeChoicesFromText(questionText, choices)
        }

        const qPageNum = flatLines[ihIdx]?.pageNum || 1
        const qId = `r${year}-${String(ih.qNum).padStart(3, '0')}`
        const groupId = `r${year}-${rh.qNum}-${rh.rangeEnd}`

        allQuestions.push({
          id: qId,
          year,
          question_number: ih.qNum,
          section: sec.section,
          question_text: questionText.trim(),
          choices,
          linked_group: groupId,
          linked_scenario: cleanScenarioText(finalScenario),
          image_needs: [...scenarioImageNeeds],
          pdf_file: sec.file,
          pdf_page: qPageNum,
          flag_image_remove: false,
        })
      }

      // If no individual headers found, use full block text + choices as fallback
      // (matches parse-pdf-questions-v2.ts behavior)
      if (individualHeaders.length === 0) {
        const blockLines = flatLines.slice(rangeStartIdx, nextHeaderIdx).map(l => l.text)
        const blockFiltered = blockLines.filter(l => !isNoiseLine(l))
        const blockText = blockFiltered.join('\n')
        const fallbackText = cleanQuestionText(stripGroupHeader(blockText))
        const fallbackChoices = extractChoicesFromLines(blockFiltered)

        for (let qNum = rh.qNum; qNum <= rh.rangeEnd!; qNum++) {
          const qId = `r${year}-${String(qNum).padStart(3, '0')}`
          const groupId = `r${year}-${rh.qNum}-${rh.rangeEnd}`
          allQuestions.push({
            id: qId,
            year,
            question_number: qNum,
            section: sec.section,
            question_text: fallbackText,
            choices: fallbackChoices,
            linked_group: groupId,
            linked_scenario: cleanScenarioText(finalScenario),
            image_needs: [...scenarioImageNeeds],
            pdf_file: sec.file,
            pdf_page: flatLines[rangeStartIdx]?.pageNum || 1,
            flag_image_remove: false,
          })
        }
      }
    }

    // Process standalone questions (not in linked groups)
    const linkedQNums = new Set<number>()
    for (const rh of rangeHeaders) {
      for (let n = rh.qNum; n <= rh.rangeEnd!; n++) linkedQNums.add(n)
    }

    const standaloneHeaders = headers.filter(
      h => (h.type === 'standalone' || h.type === 'individual') && !linkedQNums.has(h.qNum)
    )
    // Deduplicate
    const seenStandalone = new Set<number>()
    for (const sh of standaloneHeaders) {
      if (seenStandalone.has(sh.qNum)) continue
      seenStandalone.add(sh.qNum)

      const shIdx = findLineInFlat(flatLines, sh, pages)
      if (shIdx < 0) continue

      // Find end: next header
      let endIdx = flatLines.length
      for (const h of headers) {
        const hIdx = findLineInFlat(flatLines, h, pages)
        if (hIdx > shIdx && h.qNum !== sh.qNum) {
          endIdx = hIdx
          break
        }
      }

      const qLines = flatLines.slice(shIdx, endIdx).map(l => l.text)
      const filteredLines = qLines.filter(l => !isNoiseLine(l))

      let questionText = filteredLines.join('\n')
      questionText = cleanQuestionText(questionText)

      const choices = extractChoicesFromLines(filteredLines)
      if (choices.length >= 2) {
        questionText = removeChoicesFromText(questionText, choices)
      }

      const qId = `r${year}-${String(sh.qNum).padStart(3, '0')}`
      allQuestions.push({
        id: qId,
        year,
        question_number: sh.qNum,
        section: sec.section,
        question_text: questionText.trim(),
        choices,
        linked_group: null,
        linked_scenario: null,
        image_needs: [],
        pdf_file: sec.file,
        pdf_page: flatLines[shIdx]?.pageNum || 1,
        flag_image_remove: false,
      })
    }
  }

  // Deduplicate by question_number (keep the one with more data)
  const byNum = new Map<number, ExtractedQuestion>()
  for (const q of allQuestions) {
    const existing = byNum.get(q.question_number)
    if (!existing) {
      byNum.set(q.question_number, q)
    } else {
      // Keep the one with more choices or longer text
      const existingScore = (existing.choices.length * 10) + existing.question_text.length
      const newScore = (q.choices.length * 10) + q.question_text.length
      if (newScore > existingScore) byNum.set(q.question_number, q)
    }
  }

  return Array.from(byNum.values()).sort((a, b) => a.question_number - b.question_number)
}

// ─────────────────────────────────────────────
// Helper: find line index in flat array
// ─────────────────────────────────────────────
function findLineInFlat(
  flatLines: { text: string; pageNum: number }[],
  header: ParsedHeader,
  pages: PdfPage[],
): number {
  // Find the page
  let offset = 0
  for (const page of pages) {
    if (page.pageNum === header.pageNum) {
      return offset + header.lineIndex
    }
    offset += page.lines.length
  }
  return -1
}

function findNextGroupBoundary(
  flatLines: { text: string; pageNum: number }[],
  currentStart: number,
  rangeEnd: number,
  allHeaders: ParsedHeader[],
  pages: PdfPage[],
): number {
  // Find the next header that is outside this range
  for (const h of allHeaders) {
    if (h.qNum > rangeEnd || (h.type === 'range' && h.qNum > rangeEnd)) {
      const idx = findLineInFlat(flatLines, h, pages)
      if (idx > currentStart) return idx
    }
  }
  return flatLines.length
}

// ─────────────────────────────────────────────
// Remove choice text from question_text
// ─────────────────────────────────────────────
function removeChoicesFromText(text: string, choices: { key: number; text: string }[]): string {
  const lines = text.split('\n')
  const cleanedLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    // Check if this line is a choice line
    let isChoiceLine = false
    for (const c of choices) {
      // Vertical choice: "N  text" or "N text"
      if (new RegExp(`^\\s*${c.key}\\s+`).test(line) && c.text.length > 5 && trimmed.includes(c.text.substring(0, Math.min(10, c.text.length)))) {
        isChoiceLine = true
        break
      }
    }
    // Horizontal choice: multiple numbers on one line
    const horizontalNums = line.match(/(?:^|\s{2,})([1-6])\s{1,}\S/g)
    if (horizontalNums && horizontalNums.length >= 2) {
      isChoiceLine = true
    }
    // Choice continuation (indented, follows a removed line)
    if (cleanedLines.length > 0 && /^\s{2,}\S/.test(line) && !isChoiceLine) {
      const prevLine = cleanedLines[cleanedLines.length - 1]
      if (prevLine === '' && !/^\s*問\s*\d/.test(trimmed)) {
        // Check it looks like continuation (short, no question markers)
        if (trimmed.length < 50 && !/はどれか|を選べ|つ選べ/.test(trimmed)) {
          isChoiceLine = true
        }
      }
    }

    if (!isChoiceLine) {
      cleanedLines.push(line)
    } else {
      cleanedLines.push('') // mark removal
    }
  }

  // Clean up: remove trailing empty lines, collapse multiple empty lines
  let result = cleanedLines.join('\n')
  result = result.replace(/\n{3,}/g, '\n\n')
  result = result.replace(/\n+$/, '')
  return result.trim()
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true })

console.log(DRY_RUN ? '=== Dry Run ===' : '=== Re-extract from PDF ===')
console.log(`Years: ${TARGET_YEARS.join(', ')}`)
console.log()

for (const year of TARGET_YEARS) {
  console.log(`\n=== 第${year}回 ===`)

  const questions = extractYear(year)
  console.log(`  抽出: ${questions.length}問`)

  // Validate: warn if significantly fewer than expected 345 questions
  if (questions.length < 300) {
    console.error(`  ✗ ERROR: Only ${questions.length} questions extracted (expected ~345). Some PDFs may be missing or malformed.`)
    console.error(`  Skipping save for year ${year} to prevent partial data propagation.`)
    continue
  }

  // Stats
  const withChoices = questions.filter(q => q.choices.length >= 2)
  const withScenario = questions.filter(q => q.linked_scenario)
  const withImageNeeds = questions.filter(q => q.image_needs.length > 0)
  const linked = questions.filter(q => q.linked_group)

  console.log(`  選択肢あり: ${withChoices.length}問`)
  console.log(`  連問: ${linked.length}問 (${new Set(linked.map(q => q.linked_group)).size}グループ)`)
  console.log(`  シナリオ付き: ${withScenario.length}問`)
  console.log(`  画像必要フラグ: ${withImageNeeds.length}問`)

  // Count {{image:N}} in scenarios
  const scenariosWithImage = withScenario.filter(q => q.linked_scenario?.includes('{{image:'))
  console.log(`  {{image:N}}付きシナリオ: ${scenariosWithImage.length}問`)

  // Save
  const outPath = path.join(OUTPUT_DIR, `re-extracted-${year}.json`)
  if (!DRY_RUN) {
    writeFileSync(outPath, JSON.stringify(questions, null, 2), 'utf-8')
    console.log(`  保存: ${outPath}`)
  }

  // Show samples if verbose
  if (VERBOSE) {
    console.log('\n  --- サンプル (連問シナリオ) ---')
    const samples = questions.filter(q => q.linked_scenario && q.linked_scenario.includes('{{image:'))
    for (const s of samples.slice(0, 3)) {
      console.log(`  ${s.id}:`)
      console.log(`    scenario: ${s.linked_scenario?.substring(0, 150)}...`)
      console.log(`    question: ${s.question_text.substring(0, 100)}...`)
      console.log(`    choices: ${s.choices.length}`)
      console.log(`    images: ${s.image_needs.map(i => `${i.reason}@p${i.pdf_page_approx}`).join(', ')}`)
    }
  }
}

console.log('\nDone.')
