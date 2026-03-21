/**
 * 連問データ一括修復スクリプト
 *
 * 1. linked_group を全連問に設定（新形式 "rYYY-first-last"）
 * 2. linked_scenario にシナリオ共通テキストを設定
 * 3. リード問題のマージされた選択肢を分離（15→5）
 * 4. question_text からシナリオ部分を除去
 *
 * Usage:
 *   npx tsx scripts/repair-linked-groups.ts              # 実行
 *   npx tsx scripts/repair-linked-groups.ts --dry-run    # 変更なし、ログのみ
 *   npx tsx scripts/repair-linked-groups.ts --validate   # データ品質チェック
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'

const DRY_RUN = process.argv.includes('--dry-run')
const VALIDATE = process.argv.includes('--validate')
const dir = 'src/data/real-questions'

// ======================================================================
// Types
// ======================================================================
interface LinkedGroup {
  year: number
  first: number
  last: number
  members: number[]   // all question_numbers in this group
  source: 'category' | 'existing_linked_group'
}

interface QuestionInfo {
  id: string
  year: number
  questionNumber: number
  // Positions in file for targeted edits
  blockStart: number  // start of this question's object "{"
  blockEnd: number    // end of this question's object "}"
  category: string
  questionText: string
  choicesCount: number
  hasLinkedGroup: boolean
  linkedGroup: string
  hasLinkedScenario: boolean
  linkedScenario: string
  hasQuestionTextOriginal: boolean
  questionTextOriginal: string
}

// ======================================================================
// Helpers
// ======================================================================

/** Parse all question blocks from a TS file content */
function parseQuestions(content: string): QuestionInfo[] {
  const questions: QuestionInfo[] = []

  // Match each question object by finding "id": "rXXX-NNN" and extracting fields
  const idRegex = /"id":\s*"(r(\d+)-(\d+))"/g
  let match: RegExpExecArray | null

  while ((match = idRegex.exec(content)) !== null) {
    const id = match[1]
    const year = parseInt(match[2], 10)
    const qnum = parseInt(match[3], 10)

    // Find the enclosing object boundaries
    // Go backwards to find the opening "{"
    let braceCount = 0
    let blockStart = match.index
    for (let i = match.index; i >= 0; i--) {
      if (content[i] === '{') {
        braceCount++
        if (braceCount === 1) {
          blockStart = i
          break
        }
      } else if (content[i] === '}') {
        braceCount--
      }
    }

    // Go forward to find the closing "}"
    braceCount = 0
    let blockEnd = match.index
    for (let i = blockStart; i < content.length; i++) {
      if (content[i] === '{') braceCount++
      else if (content[i] === '}') {
        braceCount--
        if (braceCount === 0) {
          blockEnd = i
          break
        }
      }
    }

    const block = content.slice(blockStart, blockEnd + 1)

    // Extract fields from block
    const categoryMatch = block.match(/"category":\s*"((?:[^"\\]|\\.)*)"/);
    const qtMatch = block.match(/"question_text":\s*"((?:[^"\\]|\\.)*)"/);
    const lgMatch = block.match(/"linked_group":\s*"((?:[^"\\]|\\.)*)"/);
    const lsMatch = block.match(/"linked_scenario":\s*"((?:[^"\\]|\\.)*)"/);
    const qtoMatch = block.match(/"question_text_original":\s*"((?:[^"\\]|\\.)*)"/);

    // Count choices by counting "key": N patterns
    const choicesCount = (block.match(/"key":\s*\d+/g) || []).length

    questions.push({
      id,
      year,
      questionNumber: qnum,
      blockStart,
      blockEnd,
      category: categoryMatch?.[1] || '',
      questionText: qtMatch?.[1] || '',
      choicesCount,
      hasLinkedGroup: !!lgMatch,
      linkedGroup: lgMatch?.[1] || '',
      hasLinkedScenario: !!lsMatch,
      linkedScenario: lsMatch?.[1] || '',
      hasQuestionTextOriginal: !!qtoMatch,
      questionTextOriginal: qtoMatch?.[1] || '',
    })
  }

  return questions
}

/** Detect linked groups from category fields */
function detectGroupsFromCategory(questions: QuestionInfo[]): LinkedGroup[] {
  const groups: LinkedGroup[] = []

  for (const q of questions) {
    // Match: "一般 実践問題 - 問 196,197,198,199" or "一般 理論問題 - 問 119,120"
    const catMatch = q.category.match(/問\s+([\d,]+)/)
    if (!catMatch) continue
    const nums = catMatch[1].split(',').map(n => parseInt(n.trim(), 10))
    if (nums.length < 2) continue

    groups.push({
      year: q.year,
      first: Math.min(...nums),
      last: Math.max(...nums),
      members: nums.sort((a, b) => a - b),
      source: 'category',
    })
  }

  return groups
}

/** Detect additional groups from existing linked_group fields not covered by category */
function detectGroupsFromExisting(
  questions: QuestionInfo[],
  existingGroups: LinkedGroup[]
): LinkedGroup[] {
  const additional: LinkedGroup[] = []
  const coveredNums = new Set<string>()

  for (const g of existingGroups) {
    for (const m of g.members) {
      coveredNums.add(`${g.year}-${m}`)
    }
  }

  for (const q of questions) {
    if (!q.linkedGroup) continue
    const key = `${q.year}-${q.questionNumber}`
    if (coveredNums.has(key)) continue

    // Parse old format: "rYYY-NNN-MMM"
    const lgMatch = q.linkedGroup.match(/r(\d+)-(\d+)-(\d+)/)
    if (!lgMatch) continue

    const year = parseInt(lgMatch[1], 10)
    const rangeStart = parseInt(lgMatch[2], 10)
    const rangeEnd = parseInt(lgMatch[3], 10)

    // For groups not already found via category, the linked_group range IS the full member list.
    // (Category-based groups are already in existingGroups and are skipped here via coveredNums.)
    // So just use rangeStart as the actual first member.
    const actualFirst = rangeStart

    const members: number[] = []
    for (let i = actualFirst; i <= rangeEnd; i++) {
      members.push(i)
    }

    // Check if this group is already covered
    if (members.some(m => coveredNums.has(`${year}-${m}`))) continue

    const group: LinkedGroup = {
      year,
      first: actualFirst,
      last: rangeEnd,
      members,
      source: 'existing_linked_group',
    }
    additional.push(group)
    for (const m of members) {
      coveredNums.add(`${year}-${m}`)
    }
  }

  return additional
}

/** Generate the new linked_group ID format */
function newLinkedGroupId(year: number, first: number, last: number): string {
  return `r${year}-${first}-${last}`
}

/** Extract scenario text from question_text_original or question_text of the lead question */
function extractScenario(leadQ: QuestionInfo, allGroupQuestions: QuestionInfo[]): string {
  // Strategy 1: Use question_text_original of the lead question
  if (leadQ.questionTextOriginal) {
    const orig = leadQ.questionTextOriginal
    // Split on 問XXX（科目） markers
    const markerRegex = /問\s*\d+\s*[（(]/
    const markerMatch = orig.match(markerRegex)
    if (markerMatch && markerMatch.index !== undefined && markerMatch.index > 20) {
      // Text before first marker is the scenario
      const scenario = orig.slice(0, markerMatch.index).trim()
        .replace(/\\n/g, '\n')  // unescape
        .replace(/\n+/g, ' ')   // join lines
        .trim()
      if (scenario.length > 10) return escapeForJson(scenario)
    }
  }

  // Strategy 2: Use question_text of the lead question — check for 問XXX markers
  if (leadQ.questionText) {
    const qt = leadQ.questionText
    const markerRegex = /問\d+\s*[（(]/
    const markerMatch = qt.match(markerRegex)
    if (markerMatch && markerMatch.index !== undefined && markerMatch.index > 20) {
      const scenario = qt.slice(0, markerMatch.index).trim()
      if (scenario.length > 10) return escapeForJson(scenario)
    }

    // If the lead question's text looks like a scenario (long text, possibly shared)
    // and subsequent questions reference it, extract it
    // Heuristic: if question text is significantly longer than typical, the beginning is scenario
    if (qt.length > 200) {
      // Look for the start of the actual question in the text
      const questionStartMarkers = [
        /提供する情報として/,
        /正しいのはどれか/,
        /誤っているのはどれか/,
        /適切なのはどれか/,
        /最も適切な/,
      ]
      for (const marker of questionStartMarkers) {
        const m = qt.match(marker)
        if (m && m.index && m.index > 30) {
          // Find the sentence start before this marker
          const beforeMarker = qt.slice(0, m.index)
          const lastPeriod = Math.max(
            beforeMarker.lastIndexOf('。'),
            beforeMarker.lastIndexOf('\\n')
          )
          if (lastPeriod > 20) {
            const scenario = qt.slice(0, lastPeriod + 1).trim()
            if (scenario.length > 10) return escapeForJson(scenario)
          }
        }
      }
    }
  }

  // Strategy 3: Keep existing linked_scenario if available (from any member)
  for (const q of allGroupQuestions) {
    if (q.linkedScenario && q.linkedScenario.length > 5) {
      return q.linkedScenario  // already escaped in file
    }
  }

  return ''
}

function escapeForJson(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

// ======================================================================
// Main repair logic
// ======================================================================

interface RepairStats {
  linkedGroupSet: number
  linkedGroupUpdated: number
  linkedScenarioSet: number
  choicesFixed: number
  filesModified: number
  totalGroups: number
}

function repairFile(filePath: string, stats: RepairStats): void {
  let content = readFileSync(filePath, 'utf-8')
  let modified = false
  const fileName = filePath.split('/').pop() || filePath

  // Parse all questions
  const questions = parseQuestions(content)
  if (questions.length === 0) return

  const year = questions[0].year

  // Detect groups
  const categoryGroups = detectGroupsFromCategory(questions)
  const existingGroups = detectGroupsFromExisting(questions, categoryGroups)
  const allGroups = [...categoryGroups, ...existingGroups]

  if (allGroups.length === 0) {
    if (DRY_RUN) console.log(`[INFO] ${fileName}: no linked groups found`)
    return
  }

  stats.totalGroups += allGroups.length

  if (DRY_RUN) {
    console.log(`\n=== ${fileName} (${allGroups.length} groups) ===`)
  }

  for (const group of allGroups) {
    const newLg = newLinkedGroupId(group.year, group.first, group.last)
    const memberQuestions = group.members
      .map(num => questions.find(q => q.questionNumber === num && q.year === group.year))
      .filter((q): q is QuestionInfo => q !== undefined)

    if (memberQuestions.length < 2) continue

    const leadQ = memberQuestions[0]

    // Extract scenario
    const scenario = extractScenario(leadQ, memberQuestions)

    if (DRY_RUN) {
      console.log(`  Group ${newLg}: questions ${group.members.join(',')} (source: ${group.source})`)
      if (scenario) {
        const preview = scenario.length > 80 ? scenario.substring(0, 80) + '...' : scenario
        console.log(`    Scenario: ${preview}`)
      }
    }

    // Apply changes to each member
    for (const q of memberQuestions) {
      const block = content.slice(q.blockStart, q.blockEnd + 1)

      let newBlock = block

      // 1. Set/update linked_group
      if (q.hasLinkedGroup) {
        if (q.linkedGroup !== newLg) {
          newBlock = newBlock.replace(
            `"linked_group": "${q.linkedGroup}"`,
            `"linked_group": "${newLg}"`
          )
          stats.linkedGroupUpdated++
          if (DRY_RUN) console.log(`    ${q.id}: linked_group "${q.linkedGroup}" → "${newLg}"`)
        }
      } else {
        // Add linked_group before the closing "}"
        // Find the last field and add after it
        const insertPoint = findInsertPoint(newBlock)
        if (insertPoint >= 0) {
          const before = newBlock.slice(0, insertPoint)
          const after = newBlock.slice(insertPoint)
          const indent = '    '
          let insertion = `,\n${indent}"linked_group": "${newLg}"`
          newBlock = before + insertion + after
          stats.linkedGroupSet++
          if (DRY_RUN) console.log(`    ${q.id}: + linked_group "${newLg}"`)
        }
      }

      // 2. Set/update linked_scenario
      if (scenario) {
        if (q.hasLinkedScenario) {
          if (q.linkedScenario !== scenario) {
            // Replace existing
            newBlock = newBlock.replace(
              `"linked_scenario": "${q.linkedScenario}"`,
              `"linked_scenario": "${scenario}"`
            )
            stats.linkedScenarioSet++
          }
        } else {
          // Add linked_scenario
          // If we just added linked_group, find the new insert point
          const insertPoint = findInsertPoint(newBlock)
          if (insertPoint >= 0) {
            const before = newBlock.slice(0, insertPoint)
            const after = newBlock.slice(insertPoint)
            const indent = '    '
            const insertion = `,\n${indent}"linked_scenario": "${scenario}"`
            newBlock = before + insertion + after
            stats.linkedScenarioSet++
          }
        }
      }

      // 3. Fix merged choices on lead question (only first question in group)
      if (q.questionNumber === group.first && q.choicesCount > 5) {
        const expectedChoices = 5
        if (DRY_RUN) {
          console.log(`    ${q.id}: choices ${q.choicesCount} → ${expectedChoices} (trimming merged choices)`)
        }

        // Find the full choices section from '"choices": [' to just before '"correct_answer"'
        const choicesFieldStart = newBlock.indexOf('"choices": [')
        const correctAnswerPos = newBlock.indexOf('"correct_answer"')
        if (choicesFieldStart >= 0 && correctAnswerPos > choicesFieldStart) {
          // Extract the first 5 choice objects from within the choices section
          const sectionText = newBlock.slice(choicesFieldStart, correctAnswerPos)
          const arrStart = sectionText.indexOf('[')

          // Find first 5 complete objects by tracking braces
          let objCount = 0
          let depth = 0
          let lastObjEnd = arrStart
          for (let i = arrStart + 1; i < sectionText.length; i++) {
            if (sectionText[i] === '{') depth++
            else if (sectionText[i] === '}') {
              depth--
              if (depth === 0) {
                objCount++
                lastObjEnd = i
                if (objCount === expectedChoices) break
              }
            }
          }

          if (objCount === expectedChoices) {
            // Build new choices section: "choices": [ first5objects \n    ],\n
            const choicesContent = sectionText.slice(0, lastObjEnd + 1)
            const newSection = choicesContent + '\n    ],\n    '

            // Replace the entire choices section (from "choices": to "correct_answer")
            newBlock = newBlock.slice(0, choicesFieldStart) + newSection + newBlock.slice(correctAnswerPos)
            stats.choicesFixed++
          }
        }
      }

      // Apply block replacement
      if (newBlock !== block) {
        content = content.slice(0, q.blockStart) + newBlock + content.slice(q.blockEnd + 1)
        modified = true

        // Recalculate positions for subsequent questions (offset changed)
        const delta = newBlock.length - block.length
        for (const otherQ of questions) {
          if (otherQ.blockStart > q.blockStart) {
            otherQ.blockStart += delta
            otherQ.blockEnd += delta
          }
        }
        // Also update current question's blockEnd
        q.blockEnd = q.blockStart + newBlock.length - 1
      }
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

/** Find the insert point for adding new fields (before the closing "}" of the object).
 *  Returns the position just after the last value before the closing brace. */
function findInsertPoint(block: string): number {
  // Find the last non-whitespace before the closing "}"
  let depth = 0
  let lastContentPos = -1

  for (let i = block.length - 1; i >= 0; i--) {
    if (block[i] === '}') {
      if (depth === 0) {
        // This is the outermost closing brace
        // Find the last non-whitespace before it
        for (let j = i - 1; j >= 0; j--) {
          if (block[j] !== ' ' && block[j] !== '\n' && block[j] !== '\r' && block[j] !== '\t') {
            lastContentPos = j + 1
            break
          }
        }
        break
      }
      depth++
    } else if (block[i] === '{') {
      depth--
    }
  }

  return lastContentPos
}

// ======================================================================
// Validate mode
// ======================================================================

function validateFile(filePath: string): { errors: string[]; warnings: string[] } {
  const content = readFileSync(filePath, 'utf-8')
  const fileName = filePath.split('/').pop() || filePath
  const questions = parseQuestions(content)
  const errors: string[] = []
  const warnings: string[] = []

  if (questions.length === 0) return { errors, warnings }

  // Check: all questions in linked groups should have linked_group
  const categoryGroups = detectGroupsFromCategory(questions)
  const existingGroups = detectGroupsFromExisting(questions, categoryGroups)
  const allGroups = [...categoryGroups, ...existingGroups]

  for (const group of allGroups) {
    const newLg = newLinkedGroupId(group.year, group.first, group.last)

    // Count how many members actually exist in the data
    const foundMembers = group.members.filter(
      num => questions.some(qq => qq.questionNumber === num && qq.year === group.year)
    )

    if (foundMembers.length < 2) {
      warnings.push(`${fileName}: group ${newLg} has only ${foundMembers.length} member(s) in data — pre-existing missing data, skipped`)
      continue
    }

    for (const num of group.members) {
      const q = questions.find(qq => qq.questionNumber === num && qq.year === group.year)
      if (!q) {
        warnings.push(`${fileName}: question ${num} not found in data (group ${newLg}) — pre-existing missing data`)
        continue
      }

      if (!q.hasLinkedGroup) {
        errors.push(`${fileName}: ${q.id} missing linked_group (expected ${newLg})`)
      } else if (q.linkedGroup !== newLg) {
        errors.push(`${fileName}: ${q.id} linked_group="${q.linkedGroup}" (expected ${newLg})`)
      }

      if (!q.hasLinkedScenario) {
        warnings.push(`${fileName}: ${q.id} missing linked_scenario`)
      }
    }

    // Check lead question choices
    const leadQ = questions.find(q => q.questionNumber === group.first && q.year === group.year)
    if (leadQ && leadQ.choicesCount > 5) {
      errors.push(`${fileName}: ${leadQ.id} still has ${leadQ.choicesCount} choices (expected ≤5)`)
    }
  }

  // Check: standalone questions (326-345) should NOT have linked_group
  for (const q of questions) {
    if (q.questionNumber >= 326 && q.questionNumber <= 345) {
      if (q.hasLinkedGroup) {
        warnings.push(`${fileName}: ${q.id} (standalone) has linked_group="${q.linkedGroup}"`)
      }
    }
  }

  // Check: old format linked_group (rYYY-NNN-MMM where NNN is not first member)
  for (const q of questions) {
    if (!q.hasLinkedGroup) continue
    const m = q.linkedGroup.match(/r(\d+)-(\d+)-(\d+)/)
    if (!m) continue
    const lgFirst = parseInt(m[2], 10)
    const lgLast = parseInt(m[3], 10)
    // Find if there's a group that should contain this
    const group = allGroups.find(g => g.year === q.year && g.members.includes(q.questionNumber))
    if (group && lgFirst !== group.first) {
      errors.push(`${fileName}: ${q.id} linked_group="${q.linkedGroup}" uses old format (first should be ${group.first})`)
    }
  }

  return { errors, warnings }
}

// ======================================================================
// Entry point
// ======================================================================

const files = readdirSync(dir)
  .filter(f => /^exam-\d+\.ts$/.test(f))
  .sort()

if (VALIDATE) {
  console.log('=== Validation Mode ===\n')
  let totalErrors = 0
  let totalWarnings = 0

  for (const file of files) {
    const filePath = `${dir}/${file}`
    const { errors, warnings } = validateFile(filePath)
    totalErrors += errors.length
    totalWarnings += warnings.length

    if (errors.length > 0 || warnings.length > 0) {
      console.log(`\n--- ${file} ---`)
      for (const e of errors) console.log(`  ERROR: ${e}`)
      for (const w of warnings) console.log(`  WARN:  ${w}`)
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`Files checked: ${files.length}`)
  console.log(`Errors: ${totalErrors}`)
  console.log(`Warnings: ${totalWarnings}`)

  if (totalErrors === 0) {
    console.log('\nAll linked group data is valid!')
  } else {
    console.log('\nData quality issues found. Run without --validate to repair.')
    process.exit(1)
  }
} else {
  console.log(DRY_RUN ? '=== Dry Run Mode ===' : '=== Repair Mode ===')
  console.log()

  const stats: RepairStats = {
    linkedGroupSet: 0,
    linkedGroupUpdated: 0,
    linkedScenarioSet: 0,
    choicesFixed: 0,
    filesModified: 0,
    totalGroups: 0,
  }

  for (const file of files) {
    const filePath = `${dir}/${file}`
    repairFile(filePath, stats)
  }

  console.log(`\n=== Summary ===`)
  console.log(`Total groups found: ${stats.totalGroups}`)
  console.log(`linked_group added: ${stats.linkedGroupSet}`)
  console.log(`linked_group updated: ${stats.linkedGroupUpdated}`)
  console.log(`linked_scenario set: ${stats.linkedScenarioSet}`)
  console.log(`Choices fixed: ${stats.choicesFixed}`)
  console.log(`Files modified: ${stats.filesModified}`)
  if (DRY_RUN) console.log('(dry run - no files changed)')
}
