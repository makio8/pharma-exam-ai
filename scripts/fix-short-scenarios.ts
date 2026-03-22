/**
 * 短い linked_scenario を修復するスクリプト
 *
 * 連問グループの linked_scenario が短い（<50文字）場合、
 * 以下のソースからフルシナリオを抽出して更新する：
 *
 * 1. 先行問題の question_text_original に埋め込まれた次グループのシナリオ
 *    （例: qto の末尾に「問 NNN‑MMM シナリオテキスト...」）
 * 2. 先行問題の question_text に埋め込まれた次グループのシナリオ
 * 3. リード問題の question_text からシナリオ部分を抽出
 * 4. メンバー問題の question_text から共通シナリオ部分を抽出
 *
 * Usage:
 *   npx tsx scripts/fix-short-scenarios.ts              # 実行
 *   npx tsx scripts/fix-short-scenarios.ts --dry-run    # 変更なし、ログのみ
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'

const DRY_RUN = process.argv.includes('--dry-run')
const VERBOSE = process.argv.includes('--verbose')
const dir = 'src/data/real-questions'

// ======================================================================
// Types
// ======================================================================
interface QuestionInfo {
  id: string
  year: number
  questionNumber: number
  blockStart: number
  blockEnd: number
  linkedGroup: string
  linkedScenario: string
  questionText: string
  questionTextOriginal: string
}

// ======================================================================
// Parsing
// ======================================================================
function parseQuestions(content: string): QuestionInfo[] {
  const questions: QuestionInfo[] = []
  const idRegex = /"id":\s*"(r(\d+)-(\d+))"/g
  let match: RegExpExecArray | null

  while ((match = idRegex.exec(content)) !== null) {
    const id = match[1]
    const year = parseInt(match[2], 10)
    const qnum = parseInt(match[3], 10)

    let braceCount = 0
    let blockStart = match.index
    for (let i = match.index; i >= 0; i--) {
      if (content[i] === '{') braceCount++
      else if (content[i] === '}') braceCount--
      if (braceCount === 1) { blockStart = i; break }
    }

    braceCount = 0
    let blockEnd = match.index
    for (let i = blockStart; i < content.length; i++) {
      if (content[i] === '{') braceCount++
      else if (content[i] === '}') {
        braceCount--
        if (braceCount === 0) { blockEnd = i; break }
      }
    }

    const block = content.slice(blockStart, blockEnd + 1)

    const lgMatch = block.match(/"linked_group":\s*"((?:[^"\\]|\\.)*)"/);
    const lsMatch = block.match(/"linked_scenario":\s*"((?:[^"\\]|\\.)*)"/);
    const qtMatch = block.match(/"question_text":\s*"((?:[^"\\]|\\.)*)"/);
    const qtoMatch = block.match(/"question_text_original":\s*"((?:[^"\\]|\\.)*)"/);

    questions.push({
      id,
      year,
      questionNumber: qnum,
      blockStart,
      blockEnd,
      linkedGroup: lgMatch?.[1] || '',
      linkedScenario: lsMatch?.[1] || '',
      questionText: qtMatch?.[1] || '',
      questionTextOriginal: qtoMatch?.[1] || '',
    })
  }

  return questions
}

// ======================================================================
// Scenario extraction strategies
// ======================================================================

/**
 * Strategy 1: Find scenario in preceding question's question_text_original or question_text.
 * The OCR-extracted text often includes the header+scenario for the NEXT linked group
 * at the end: "問 NNN‑MMM scenario text..."
 */
function findScenarioInPrecedingQuestions(
  groupFirst: number,
  groupLast: number,
  allQuestions: QuestionInfo[]
): string {
  // Search through ALL questions (not just group members) for embedded scenario
  for (const q of allQuestions) {
    // Only look at questions that come before this group
    if (q.questionNumber >= groupFirst) continue

    for (const textField of [q.questionTextOriginal, q.questionText]) {
      if (!textField || textField.length < 30) continue

      // Look for header patterns: "問 NNN‑MMM" or "問 NNN-MMM" or "問NNN‑MMM"
      // Using various dash characters: ‑ (non-breaking hyphen), - (hyphen), – (en-dash), ― (horizontal bar)
      const headerPatterns = [
        new RegExp(`問\\s*${groupFirst}\\s*[‑\\-–―]\\s*${groupLast}`),
        // Also try with \\n versions (escaped in JSON)
        new RegExp(`問\\s*${groupFirst}\\s*[‑\\-–―]\\s*${groupLast}`),
      ]

      for (const pattern of headerPatterns) {
        const headerMatch = textField.match(pattern)
        if (!headerMatch || headerMatch.index === undefined) continue

        // Extract text after the header
        const afterHeader = textField.substring(headerMatch.index + headerMatch[0].length)

        // The scenario is everything until the next "問 NNN" marker (individual question)
        // or until "⎜" (answer marker) or end of meaningful text
        const nextQuestionRe = /\\n問\s*\d+\s*[（(]/
        const answerMarkerRe = /⎜/
        const nextGroupRe = /\\n問\s*\d+\s*[‑\-–―]/

        let scenarioEnd = afterHeader.length
        for (const endRe of [nextQuestionRe, answerMarkerRe, nextGroupRe]) {
          const endMatch = afterHeader.match(endRe)
          if (endMatch && endMatch.index !== undefined && endMatch.index < scenarioEnd) {
            scenarioEnd = endMatch.index
          }
        }

        let scenario = afterHeader.substring(0, scenarioEnd).trim()

        // Clean up the scenario
        scenario = cleanScenario(scenario)

        // Remove leading "問 NNN−NNN" group header if still present
        scenario = stripGroupHeader(scenario)

        if (scenario.length > 20) {
          return scenario
        }
      }
    }
  }

  return ''
}

/**
 * Strategy 2: Extract scenario from lead question's question_text.
 * If the lead question's qt starts with scenario text before a "問NNN（科目）" marker.
 */
function findScenarioInLeadQt(
  leadQ: QuestionInfo,
  groupFirst: number
): string {
  const qt = leadQ.questionText
  if (!qt || qt.length < 30) return ''

  // Check for "問NNN（" marker
  const markerRe = new RegExp(`問\\s*${groupFirst}\\s*[（(]`)
  const markerMatch = qt.match(markerRe)
  if (markerMatch && markerMatch.index !== undefined && markerMatch.index > 15) {
    let scenario = qt.substring(0, markerMatch.index).trim()
    scenario = cleanScenario(scenario)
    scenario = stripGroupHeader(scenario)
    if (scenario.length > 20) return scenario
  }

  // Generic marker
  const genericMatch = qt.match(/問\s*\d+\s*[（(]/)
  if (genericMatch && genericMatch.index !== undefined && genericMatch.index > 15) {
    let scenario = qt.substring(0, genericMatch.index).trim()
    scenario = cleanScenario(scenario)
    scenario = stripGroupHeader(scenario)
    if (scenario.length > 20) return scenario
  }

  return ''
}

/**
 * Strategy 3: Extract scenario from any member's question_text that contains a
 * "問NNN（科目）" header with scenario text before it.
 */
function findScenarioInMemberQt(
  members: QuestionInfo[]
): string {
  for (const mem of members) {
    const qt = mem.questionText
    if (!qt || qt.length < 50) continue

    // Check if qt starts with scenario-like text before "問NNN（"
    const markerRe = new RegExp(`問\\s*${mem.questionNumber}\\s*[（(]`)
    const markerMatch = qt.match(markerRe)
    if (markerMatch && markerMatch.index !== undefined && markerMatch.index > 15) {
      let scenario = qt.substring(0, markerMatch.index).trim()
      scenario = cleanScenario(scenario)
      scenario = stripGroupHeader(scenario)
      if (scenario.length > 20) return scenario
    }
  }
  return ''
}

/**
 * Strategy 4: Extract from question_text_original of any member.
 * The qto may contain preceding group text including scenario.
 */
function findScenarioInMemberQto(
  members: QuestionInfo[],
  groupFirst: number,
  groupLast: number
): string {
  for (const mem of members) {
    const qto = mem.questionTextOriginal
    if (!qto || qto.length < 30) continue

    // Check if qto contains text before the question header that's scenario
    // Format: "scenario text\n問 NNN（科目）\n..."
    const headerRe = new RegExp(`問\\s*${mem.questionNumber}\\s*[（(]`)
    const headerMatch = qto.match(headerRe)
    if (headerMatch && headerMatch.index !== undefined && headerMatch.index > 15) {
      let scenario = qto.substring(0, headerMatch.index).trim()

      // Remove any preceding question answer markers (e.g., "⎜ 5⎜\n")
      scenario = scenario.replace(/⎜\s*\d+\s*⎜\s*$/g, '').trim()

      // Remove the "問 NNN-MMM" group header if present at the start
      const groupHeaderRe = new RegExp(`^問\\s*${groupFirst}\\s*[‑\\-–―]\\s*${groupLast}\\s*`)
      scenario = scenario.replace(groupHeaderRe, '').trim()

      scenario = cleanScenario(scenario)
      scenario = stripGroupHeader(scenario)
      if (scenario.length > 20) return scenario
    }
  }
  return ''
}

/**
 * Strip leading group header like "問 NNN−MMM" or "問 NNN‑MMM" from scenario text.
 * Dash chars: U+2011 (‑), U+002D (-), U+2212 (−), U+2013 (–), U+2015 (―)
 */
function stripGroupHeader(s: string): string {
  // Use a broad dash character class including common Unicode dashes
  return s.replace(/^問\s*\d+\s*[\u002D\u2011\u2012\u2013\u2014\u2015\u2212\uFF0D]\s*\d+\s*/, '').trim()
}

/**
 * Clean up extracted scenario text
 */
function cleanScenario(s: string): string {
  // Remove leading/trailing whitespace and newlines
  s = s.replace(/^[\s\\n]+/, '').replace(/[\s\\n]+$/, '')

  // Collapse multiple escaped newlines
  s = s.replace(/(\\n\s*)+/g, '\\n')

  // Remove trailing punctuation artifacts
  s = s.replace(/\\n$/, '')

  // Remove answer/choice markers that leaked in
  s = s.replace(/\n?\d+\s+[^\n]{1,30}$/g, '')

  return s.trim()
}

/**
 * Escape string for JSON embedding
 */
function escapeForJson(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .replace(/\t/g, '\\t')
}

// ======================================================================
// Main logic
// ======================================================================

interface Stats {
  totalShortGroups: number
  scenariosImproved: number
  filesModified: number
  unchangedGroups: number
}

function processFile(filePath: string, stats: Stats): void {
  let content = readFileSync(filePath, 'utf-8')
  const fileName = filePath.split('/').pop() || filePath
  let modified = false

  const questions = parseQuestions(content)
  if (questions.length === 0) return

  // Build group map
  const groupMap = new Map<string, QuestionInfo[]>()
  for (const q of questions) {
    if (!q.linkedGroup) continue
    if (!groupMap.has(q.linkedGroup)) groupMap.set(q.linkedGroup, [])
    groupMap.get(q.linkedGroup)!.push(q)
  }

  for (const [groupId, members] of groupMap) {
    members.sort((a, b) => a.questionNumber - b.questionNumber)

    const currentScenario = members[0].linkedScenario
    if (currentScenario.length >= 50) continue

    stats.totalShortGroups++

    // Parse group range from linked_group id: "rYYY-first-last"
    const groupMatch = groupId.match(/r(\d+)-(\d+)-(\d+)/)
    if (!groupMatch) continue
    const groupFirst = parseInt(groupMatch[2])
    const groupLast = parseInt(groupMatch[3])

    // Try extraction strategies in order of reliability
    let newScenario = ''

    // Strategy 1: From preceding question's qto/qt
    if (!newScenario) {
      newScenario = findScenarioInPrecedingQuestions(groupFirst, groupLast, questions)
      if (newScenario && VERBOSE) console.log(`  ${groupId}: found in preceding qto/qt`)
    }

    // Strategy 2: From lead question's qt
    if (!newScenario) {
      newScenario = findScenarioInLeadQt(members[0], groupFirst)
      if (newScenario && VERBOSE) console.log(`  ${groupId}: found in lead qt`)
    }

    // Strategy 3: From any member's qt
    if (!newScenario) {
      newScenario = findScenarioInMemberQt(members)
      if (newScenario && VERBOSE) console.log(`  ${groupId}: found in member qt`)
    }

    // Strategy 4: From any member's qto (before question header)
    if (!newScenario) {
      newScenario = findScenarioInMemberQto(members, groupFirst, groupLast)
      if (newScenario && VERBOSE) console.log(`  ${groupId}: found in member qto`)
    }

    // Only update if we found a meaningfully longer scenario
    if (!newScenario || newScenario.length <= currentScenario.length + 10) {
      stats.unchangedGroups++
      if (VERBOSE) {
        console.log(`  ${groupId}: no improvement (current ${currentScenario.length} chars, found ${newScenario.length} chars)`)
      }
      continue
    }

    // Update linked_scenario for all members
    stats.scenariosImproved++
    if (DRY_RUN) {
      console.log(`  ${groupId}: scenario ${currentScenario.length} → ${newScenario.length} chars`)
      console.log(`    OLD: ${currentScenario.substring(0, 80)}`)
      console.log(`    NEW: ${newScenario.substring(0, 80)}`)
    }

    for (const mem of members) {
      const block = content.slice(mem.blockStart, mem.blockEnd + 1)
      let newBlock = block

      if (mem.linkedScenario) {
        // Replace existing linked_scenario value
        const oldField = `"linked_scenario": "${mem.linkedScenario}"`
        const newField = `"linked_scenario": "${newScenario}"`

        if (!block.includes(oldField)) {
          if (VERBOSE) console.log(`    WARNING: could not find linked_scenario field in ${mem.id}`)
          continue
        }

        newBlock = block.replace(oldField, newField)
      } else {
        // No linked_scenario field exists — add it after linked_group
        const lgField = `"linked_group": "${mem.linkedGroup}"`
        const lgIdx = block.indexOf(lgField)
        if (lgIdx < 0) {
          if (VERBOSE) console.log(`    WARNING: could not find linked_group field in ${mem.id}`)
          continue
        }

        const insertPos = lgIdx + lgField.length
        const insertion = `,\n    "linked_scenario": "${newScenario}"`
        newBlock = block.slice(0, insertPos) + insertion + block.slice(insertPos)
      }

      if (newBlock === block) continue

      content = content.slice(0, mem.blockStart) + newBlock + content.slice(mem.blockEnd + 1)
      modified = true

      // Recalculate positions
      const delta = newBlock.length - block.length
      for (const otherQ of questions) {
        if (otherQ.blockStart > mem.blockStart) {
          otherQ.blockStart += delta
          otherQ.blockEnd += delta
        }
      }
      mem.blockEnd = mem.blockStart + newBlock.length - 1
    }
  }

  if (modified) {
    stats.filesModified++
    if (!DRY_RUN) {
      writeFileSync(filePath, content, 'utf-8')
      console.log(`Updated: ${fileName}`)
    }
  }
}

// ======================================================================
// Entry point
// ======================================================================

const files = readdirSync(dir)
  .filter(f => /^exam-\d+\.ts$/.test(f))
  .sort()

console.log(DRY_RUN ? '=== Dry Run Mode ===' : '=== Fix Short Scenarios ===')
console.log()

const stats: Stats = {
  totalShortGroups: 0,
  scenariosImproved: 0,
  filesModified: 0,
  unchangedGroups: 0,
}

for (const file of files) {
  const filePath = `${dir}/${file}`
  if (DRY_RUN || VERBOSE) console.log(`\n--- ${file} ---`)
  processFile(filePath, stats)
}

console.log(`\n=== Summary ===`)
console.log(`Short scenario groups found: ${stats.totalShortGroups}`)
console.log(`Scenarios improved: ${stats.scenariosImproved}`)
console.log(`Unchanged (no better data): ${stats.unchangedGroups}`)
console.log(`Files modified: ${stats.filesModified}`)
if (DRY_RUN) console.log('(dry run - no files changed)')
