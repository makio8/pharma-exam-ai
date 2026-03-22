/**
 * e-RECデータからフルシナリオを抽出して linked_scenario を更新するスクリプト
 *
 * e-REC JSON の question_text には連問の共有シナリオ＋各問の問題文が
 * すべて含まれている。最初の「問XXX（」マーカーより前のテキストが
 * 患者症例などの共有シナリオ部分。
 *
 * Usage:
 *   npx tsx scripts/extract-scenarios-from-erec.ts --dry-run   # 変更なし、ログのみ
 *   npx tsx scripts/extract-scenarios-from-erec.ts              # 実行
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'

const DRY_RUN = process.argv.includes('--dry-run')
const VERBOSE = process.argv.includes('--verbose')
const dir = 'src/data/real-questions'

// ======================================================================
// Types
// ======================================================================
interface ErecQuestion {
  year: number
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
// e-REC scenario extraction
// ======================================================================
function extractScenarioFromErec(erecQuestionText: string, firstQuestionNumber: number): string | null {
  // Find the marker for the first question: 問196（実務） or 問 196（ etc.
  const markerPatterns = [
    new RegExp(`問${firstQuestionNumber}[（(\\s]`),
    new RegExp(`問\\s+${firstQuestionNumber}[（(\\s]`),
    new RegExp(`問${firstQuestionNumber}　`),  // full-width space
  ]

  for (const pattern of markerPatterns) {
    const match = erecQuestionText.match(pattern)
    if (match && match.index !== undefined && match.index > 20) {
      let scenario = erecQuestionText.slice(0, match.index).trim()
      // Strip group header like "問124〜126\n" or "問196〜199 \n"
      scenario = scenario.replace(/^問\s*\d+\s*[〜~\u2011\u2012\u2013\u2014\u2015\u2212\uFF0D\-]\s*\d+\s*\n?/, '').trim()
      if (scenario.length > 20) return scenario
    }
  }
  return null
}

// ======================================================================
// TS file parsing - find linked groups and their positions
// ======================================================================
function parseLinkedGroups(content: string): LinkedGroup[] {
  const groups = new Map<string, LinkedGroup>()

  // Find all linked_group occurrences
  const lgRegex = /"linked_group":\s*"(r(\d+)-(\d+)-(\d+))"/g
  let lgMatch: RegExpExecArray | null

  while ((lgMatch = lgRegex.exec(content)) !== null) {
    const groupId = lgMatch[1]
    const firstQNum = parseInt(lgMatch[2 + 1])  // 3rd capture: first question number
    const lastQNum = parseInt(lgMatch[3 + 1])    // 4th capture: last question number

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
// ======================================================================
function updateLinkedScenario(
  content: string,
  group: LinkedGroup,
  newScenario: string,
): string {
  // Escape for JSON string embedding
  const escapedScenario = newScenario
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .replace(/\t/g, '\\t')

  // Sort positions in reverse order so replacements don't shift later positions
  const sorted = [...group.memberPositions].sort((a, b) => b.blockStart - a.blockStart)

  for (const pos of sorted) {
    const block = content.slice(pos.blockStart, pos.blockEnd + 1)
    const newField = `"linked_scenario": "${escapedScenario}"`
    let newBlock: string

    if (pos.linkedScenario !== '') {
      // Replace existing linked_scenario
      const oldField = `"linked_scenario": "${pos.linkedScenario}"`
      if (!block.includes(oldField)) {
        if (VERBOSE) console.log(`    WARNING: could not find linked_scenario in block at ${pos.blockStart}`)
        continue
      }
      newBlock = block.replace(oldField, newField)
    } else {
      // No linked_scenario field exists - add after linked_group
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
}

const allStats = new Map<number, YearStats>()
let totalImproved = 0

console.log(DRY_RUN ? '=== Dry Run Mode ===' : '=== Extract Scenarios from e-REC ===')
console.log()

for (let year = 100; year <= 111; year++) {
  const erecPath = `${dir}/exam-${year}-erec.json`
  const tsPath = `${dir}/exam-${year}.ts`

  if (!existsSync(erecPath)) {
    console.log(`exam-${year}: e-RECファイルなし、スキップ`)
    continue
  }
  if (!existsSync(tsPath)) {
    console.log(`exam-${year}: TSファイルなし、スキップ`)
    continue
  }

  const erecData: ErecQuestion[] = JSON.parse(readFileSync(erecPath, 'utf-8'))
  let tsContent = readFileSync(tsPath, 'utf-8')
  const groups = parseLinkedGroups(tsContent)

  const yearStats: YearStats = { improved: 0, skipped: 0 }
  let modified = false

  // Build e-REC lookup by question_number
  const erecByNum = new Map<number, ErecQuestion>()
  for (const q of erecData) {
    erecByNum.set(q.question_number, q)
  }

  for (const group of groups) {
    // Find the first question in e-REC
    const erecQ = erecByNum.get(group.firstQNum)
    if (!erecQ) {
      if (VERBOSE) console.log(`  ${group.groupId}: e-RECにQ${group.firstQNum}なし`)
      yearStats.skipped++
      continue
    }

    // Extract scenario
    const newScenario = extractScenarioFromErec(erecQ.question_text, group.firstQNum)
    if (!newScenario) {
      if (VERBOSE) console.log(`  ${group.groupId}: シナリオ抽出失敗`)
      yearStats.skipped++
      continue
    }

    // Compare with current scenario (use the first member's)
    const currentScenario = group.memberPositions[0].linkedScenario
    // Unescape current for fair length comparison
    const currentUnescaped = currentScenario
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')

    if (newScenario.length <= currentUnescaped.length) {
      if (VERBOSE) console.log(`  ${group.groupId}: 現在のほうが長い (${currentUnescaped.length} >= ${newScenario.length})`)
      yearStats.skipped++
      continue
    }

    // Update
    yearStats.improved++
    totalImproved++

    if (DRY_RUN) {
      console.log(`  ${group.groupId}: ${currentUnescaped.length}文字 → ${newScenario.length}文字`)
      console.log(`    OLD: ${currentUnescaped.substring(0, 60)}...`)
      console.log(`    NEW: ${newScenario.substring(0, 60)}...`)
    }

    tsContent = updateLinkedScenario(tsContent, group, newScenario)
    // Re-parse after modification to get updated positions
    const updatedGroups = parseLinkedGroups(tsContent)
    // Update remaining groups' positions
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
  console.log(`exam-${year}: ${yearStats.improved} improved, ${yearStats.skipped} skipped ${status}`)
}

console.log(`\n=== Summary ===`)
console.log(`Total scenarios improved: ${totalImproved}`)
for (const [year, stats] of allStats) {
  if (stats.improved > 0) {
    console.log(`  exam-${year}: ${stats.improved} improved`)
  }
}
if (DRY_RUN) console.log('(dry run - no files changed)')
