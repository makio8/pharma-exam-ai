/**
 * PDFデータからフルシナリオを抽出して linked_scenario を更新するスクリプト
 *
 * PDF JSON の question_text には連問の共有シナリオが
 * 「問NNN−MMM シナリオ本文... 問NNN（科目）各問の問題文...」
 * の形式で含まれていることが多い。
 * 最初の「問NNN（」マーカーより前のテキストがシナリオ部分。
 *
 * また、シナリオが前の問題の question_text 末尾に付着している場合もあるため、
 * 前の問題もチェックする。
 *
 * Usage:
 *   npx tsx scripts/extract-scenarios-from-pdf.ts --dry-run   # 変更なし、ログのみ
 *   npx tsx scripts/extract-scenarios-from-pdf.ts              # 実行
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'

const DRY_RUN = process.argv.includes('--dry-run')
const VERBOSE = process.argv.includes('--verbose')
const dir = 'src/data/real-questions'

// ======================================================================
// Types
// ======================================================================
interface PdfQuestion {
  exam_year: number
  question_number: number
  question_text: string
  [key: string]: unknown
}

interface LinkedGroup {
  groupId: string
  firstQNum: number
  lastQNum: number
  memberPositions: { blockStart: number; blockEnd: number; linkedScenario: string }[]
}

// ======================================================================
// PDF scenario extraction
// ======================================================================

/**
 * PDFのquestion_textからシナリオ部分を抽出する。
 *
 * パターン1: リード問題のquestion_textが
 *   "問 NNN−MMM シナリオ本文...\n問 NNN（科目）\n各問の問題文..."
 * の形式の場合、「問 NNN（」より前がシナリオ。
 *
 * パターン2: 前の問題のquestion_textの末尾にシナリオが付着している場合。
 */
function extractScenarioFromPdfQuestion(
  questionText: string,
  firstQNum: number
): string | null {
  // Try to find the individual question marker: 問196（実務） etc.
  const markerPatterns = [
    new RegExp(`問\\s*${firstQNum}\\s*[（(]`),
    new RegExp(`問\\s*${firstQNum}\\s`),
  ]

  for (const pattern of markerPatterns) {
    const match = questionText.match(pattern)
    if (match && match.index !== undefined && match.index > 20) {
      let scenario = questionText.slice(0, match.index).trim()

      // Strip group header like "問 196−197" or "問196‑197" at the start
      scenario = stripGroupHeader(scenario)

      // Clean up PDF artifacts
      scenario = cleanPdfScenario(scenario)

      if (scenario.length > 20) return scenario
    }
  }

  return null
}

/**
 * 前の問題のquestion_textの末尾からシナリオを抽出する。
 * PDFページ境界で、次のグループのシナリオが前の問題に付着することがある。
 */
function extractScenarioFromPrevQuestion(
  prevQuestionText: string,
  firstQNum: number,
  lastQNum: number
): string | null {
  // Look for group header pattern: "問 NNN−MMM" or "問NNN‑MMM"
  const dashChars = '[\\u002D\\u2011\\u2012\\u2013\\u2014\\u2015\\u2212\\uFF0D−]'
  const headerRe = new RegExp(`問\\s*${firstQNum}\\s*${dashChars}\\s*${lastQNum}`)

  const headerMatch = prevQuestionText.match(headerRe)
  if (!headerMatch || headerMatch.index === undefined) return null

  // Everything after the header until the first "問 NNN（" individual question marker
  let afterHeader = prevQuestionText.slice(headerMatch.index + headerMatch[0].length).trim()

  // Find where the first individual question starts
  const individualQRe = new RegExp(`問\\s*${firstQNum}\\s*[（(]`)
  const individualMatch = afterHeader.match(individualQRe)
  if (individualMatch && individualMatch.index !== undefined) {
    afterHeader = afterHeader.slice(0, individualMatch.index).trim()
  }

  let scenario = cleanPdfScenario(afterHeader)
  if (scenario.length > 20) return scenario

  return null
}

/**
 * Strip group header like "問 NNN−MMM" at the beginning
 */
function stripGroupHeader(s: string): string {
  return s.replace(/^問\s*\d+\s*[\u002D\u2011\u2012\u2013\u2014\u2015\u2212\uFF0D−]\s*\d+\s*/, '').trim()
}

/**
 * Clean up PDF-extracted text
 */
function cleanPdfScenario(s: string): string {
  // Remove trailing page markers like "4083_03_1DAY3_M.indd 28  2022/01/13 10:25"
  s = s.replace(/\n?\d{4}_\d+_\w+\.indd\s+\d+\s+\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}\s*$/g, '')

  // Remove trailing page numbers (standalone numbers at end)
  s = s.replace(/\n\d{1,3}\s*$/, '')

  // Trim whitespace
  s = s.trim()

  return s
}

// ======================================================================
// TS file parsing - find linked groups and their positions
// (Reused from extract-scenarios-from-erec.ts)
// ======================================================================
function parseLinkedGroups(content: string): LinkedGroup[] {
  const groups = new Map<string, LinkedGroup>()

  const lgRegex = /"linked_group":\s*"(r(\d+)-(\d+)-(\d+))"/g
  let lgMatch: RegExpExecArray | null

  while ((lgMatch = lgRegex.exec(content)) !== null) {
    const groupId = lgMatch[1]
    const firstQNum = parseInt(lgMatch[3])
    const lastQNum = parseInt(lgMatch[4])

    // Find the enclosing object block
    let braceCount = 0
    let blockStart = lgMatch.index
    for (let i = lgMatch.index; i >= 0; i--) {
      if (content[i] === '{') braceCount++
      else if (content[i] === '}') braceCount--
      if (braceCount === 1) { blockStart = i; break }
    }

    braceCount = 0
    let blockEnd = lgMatch.index
    for (let i = blockStart; i < content.length; i++) {
      if (content[i] === '{') braceCount++
      else if (content[i] === '}') {
        braceCount--
        if (braceCount === 0) { blockEnd = i; break }
      }
    }

    const block = content.slice(blockStart, blockEnd + 1)
    const lsMatch = block.match(/"linked_scenario":\s*"((?:[^"\\]|\\.)*)"/)
    const linkedScenario = lsMatch?.[1] || ''

    if (!groups.has(groupId)) {
      groups.set(groupId, {
        groupId,
        firstQNum,
        lastQNum,
        memberPositions: [],
      })
    }
    groups.get(groupId)!.memberPositions.push({
      blockStart,
      blockEnd,
      linkedScenario,
    })
  }

  return Array.from(groups.values())
}

// ======================================================================
// Update linked_scenario in content
// (Reused from extract-scenarios-from-erec.ts)
// ======================================================================
function updateLinkedScenario(
  content: string,
  group: LinkedGroup,
  newScenario: string,
): string {
  const escapedScenario = newScenario
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .replace(/\t/g, '\\t')

  const sorted = [...group.memberPositions].sort((a, b) => b.blockStart - a.blockStart)

  for (const pos of sorted) {
    const block = content.slice(pos.blockStart, pos.blockEnd + 1)
    const newField = `"linked_scenario": "${escapedScenario}"`
    let newBlock: string

    if (pos.linkedScenario !== '') {
      const oldField = `"linked_scenario": "${pos.linkedScenario}"`
      if (!block.includes(oldField)) {
        if (VERBOSE) console.log(`    WARNING: could not find linked_scenario in block at ${pos.blockStart}`)
        continue
      }
      newBlock = block.replace(oldField, newField)
    } else {
      const lgField = `"linked_group": "${group.groupId}"`
      const lgIdx = block.indexOf(lgField)
      if (lgIdx < 0) {
        if (VERBOSE) console.log(`    WARNING: could not find linked_group in block at ${pos.blockStart}`)
        continue
      }
      const insertPos = lgIdx + lgField.length
      newBlock = block.slice(0, insertPos) + `,\n    ${newField}` + block.slice(insertPos)
    }

    content = content.slice(0, pos.blockStart) + newBlock + content.slice(pos.blockEnd + 1)
  }

  return content
}

// ======================================================================
// Main
// ======================================================================
interface YearStats {
  improved: number
  skipped: number
  noData: number
}

const allStats = new Map<number, YearStats>()
let totalImproved = 0

console.log(DRY_RUN ? '=== Dry Run Mode ===' : '=== Extract Scenarios from PDF ===')
console.log()

for (let year = 100; year <= 111; year++) {
  const pdfPath = `${dir}/exam-${year}-pdf.json`
  const tsPath = `${dir}/exam-${year}.ts`

  if (!existsSync(pdfPath)) {
    if (VERBOSE) console.log(`exam-${year}: PDFファイルなし、スキップ`)
    continue
  }
  if (!existsSync(tsPath)) {
    if (VERBOSE) console.log(`exam-${year}: TSファイルなし、スキップ`)
    continue
  }

  const pdfData: PdfQuestion[] = JSON.parse(readFileSync(pdfPath, 'utf-8'))
  let tsContent = readFileSync(tsPath, 'utf-8')
  const groups = parseLinkedGroups(tsContent)

  const yearStats: YearStats = { improved: 0, skipped: 0, noData: 0 }
  let modified = false

  // Build PDF lookup by question_number
  const pdfByNum = new Map<number, PdfQuestion>()
  for (const q of pdfData) {
    pdfByNum.set(q.question_number, q)
  }

  for (const group of groups) {
    // Check current scenario length - only process short ones
    const currentScenario = group.memberPositions[0].linkedScenario
    const currentUnescaped = currentScenario
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')

    if (currentUnescaped.length >= 80) {
      yearStats.skipped++
      continue
    }

    // Strategy 1: Check the lead question's question_text in PDF data
    let newScenario: string | null = null
    const leadPdfQ = pdfByNum.get(group.firstQNum)
    if (leadPdfQ) {
      newScenario = extractScenarioFromPdfQuestion(leadPdfQ.question_text, group.firstQNum)
      if (newScenario && VERBOSE) console.log(`  ${group.groupId}: found in lead Q${group.firstQNum} PDF text`)
    }

    // Strategy 2: Check the previous question's question_text
    if (!newScenario) {
      const prevQNum = group.firstQNum - 1
      const prevPdfQ = pdfByNum.get(prevQNum)
      if (prevPdfQ) {
        newScenario = extractScenarioFromPrevQuestion(prevPdfQ.question_text, group.firstQNum, group.lastQNum)
        if (newScenario && VERBOSE) console.log(`  ${group.groupId}: found in prev Q${prevQNum} PDF text`)
      }
    }

    // Strategy 3: Check other group members' question_text (they often repeat the scenario)
    if (!newScenario) {
      for (let qNum = group.firstQNum + 1; qNum <= group.lastQNum; qNum++) {
        const memberPdfQ = pdfByNum.get(qNum)
        if (memberPdfQ) {
          newScenario = extractScenarioFromPdfQuestion(memberPdfQ.question_text, qNum)
          if (newScenario) {
            if (VERBOSE) console.log(`  ${group.groupId}: found in member Q${qNum} PDF text`)
            break
          }
        }
      }
    }

    if (!newScenario) {
      yearStats.noData++
      if (VERBOSE) console.log(`  ${group.groupId}: PDFデータにシナリオなし`)
      continue
    }

    // Only update if meaningfully longer
    if (newScenario.length <= currentUnescaped.length) {
      yearStats.skipped++
      if (VERBOSE) console.log(`  ${group.groupId}: 現在のほうが長い (${currentUnescaped.length} >= ${newScenario.length})`)
      continue
    }

    yearStats.improved++
    totalImproved++

    if (DRY_RUN) {
      console.log(`  ${group.groupId}: ${currentUnescaped.length}文字 → ${newScenario.length}文字`)
      console.log(`    OLD: ${currentUnescaped.substring(0, 80)}...`)
      console.log(`    NEW: ${newScenario.substring(0, 80)}...`)
    }

    tsContent = updateLinkedScenario(tsContent, group, newScenario)
    // Re-parse after modification to get updated positions
    const updatedGroups = parseLinkedGroups(tsContent)
    for (const g of groups) {
      if (g.groupId === group.groupId) continue
      const updated = updatedGroups.find(ug => ug.groupId === g.groupId)
      if (updated) {
        g.memberPositions = updated.memberPositions
      }
    }
    modified = true
  }

  if (modified && !DRY_RUN) {
    writeFileSync(tsPath, tsContent, 'utf-8')
  }

  allStats.set(year, yearStats)
  const status = modified ? (DRY_RUN ? '(would update)' : 'updated') : 'no changes'
  console.log(`exam-${year}: ${yearStats.improved} improved, ${yearStats.skipped} skipped, ${yearStats.noData} no PDF data ${status}`)
}

console.log(`\n=== Summary ===`)
console.log(`Total scenarios improved: ${totalImproved}`)
for (const [year, stats] of allStats) {
  if (stats.improved > 0) {
    console.log(`  exam-${year}: ${stats.improved} improved`)
  }
}
if (DRY_RUN) console.log('(dry run - no files changed)')
