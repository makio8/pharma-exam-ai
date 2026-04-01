#!/usr/bin/env npx tsx
/**
 * 再抽出結果を現行データに選択的に適用する
 *
 * 方針:
 * - linked_scenario: 再抽出データで上書き（PDF由来が正確、特に{{image:N}}対応）
 * - question_text: 現行データを維持（Web由来がクリーン）
 *   - ただし現行が空/極短の場合のみPDFで補完
 * - choices: 現行が不足している場合のみPDFで補完
 * - image_url: linked_scenarioに{{image:N}}がある場合、不要なimage_urlをフラグ
 *
 * Usage:
 *   npx tsx scripts/apply-re-extraction.ts --year 100 --dry-run
 *   npx tsx scripts/apply-re-extraction.ts --year 100
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..')

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const yearArg = args.find((_, i) => args[i - 1] === '--year') || '100'
const year = parseInt(yearArg)

interface ReExtractedQ {
  id: string
  question_number: number
  question_text: string
  choices: { key: number; text: string }[]
  linked_group: string | null
  linked_scenario: string | null
  image_needs: any[]
  pdf_file: string
  pdf_page: number
}

// Load re-extracted data
const reExtractedPath = path.join(PROJECT_ROOT, 'reports', `re-extracted-${year}.json`)
if (!existsSync(reExtractedPath)) {
  console.error(`Re-extracted data not found. Run: npx tsx scripts/re-extract-from-pdf.ts --year ${year}`)
  process.exit(1)
}
const reExtracted: ReExtractedQ[] = JSON.parse(readFileSync(reExtractedPath, 'utf-8'))
const reMap = new Map(reExtracted.map(q => [q.id, q]))

// Load current TS data
const tsPath = path.join(PROJECT_ROOT, 'src', 'data', 'real-questions', `exam-${year}.ts`)
const tsContent = readFileSync(tsPath, 'utf-8')

// Robust JSON extraction: find the first top-level '[' that starts the array
const arrayStartRe = /^export\s+const\s+\w+\s*:\s*\w+\[\]\s*=\s*/m
const exportMatch = tsContent.match(arrayStartRe)
let headerEnd: number
if (exportMatch && exportMatch.index !== undefined) {
  headerEnd = exportMatch.index + exportMatch[0].length
} else {
  // Fallback: find first '[\n'
  headerEnd = tsContent.indexOf('[\n')
  if (headerEnd < 0) {
    console.error(`Could not parse ${tsPath}: no array found`)
    process.exit(1)
  }
}
const header = tsContent.substring(0, headerEnd)
const jsonStr = tsContent.substring(headerEnd).trimEnd()
let currentQuestions: any[]
try {
  currentQuestions = JSON.parse(jsonStr)
} catch (e) {
  console.error(`Failed to parse JSON in ${tsPath}: ${(e as Error).message}`)
  process.exit(1)
}

// Stats
let scenarioUpdated = 0
let scenarioAdded = 0
let choicesImproved = 0
let imageUrlFlagged = 0
let questionTextFilled = 0

// Apply improvements
for (const q of currentQuestions) {
  const re = reMap.get(q.id)
  if (!re) continue

  // 1. linked_scenario: use re-extracted if meaningful
  if (re.linked_scenario && re.linked_scenario.length > 20) {
    const currentScenario = q.linked_scenario || ''

    // The re-extracted scenario should already have cleaned line breaks
    // (joinPdfLineBreaks was applied in re-extract-from-pdf.ts)
    let cleanScenario = re.linked_scenario.trim()

    // Only update if re-extracted is meaningfully different/better
    const reHasImage = cleanScenario.includes('{{image:')
    const currentHasImage = currentScenario.includes('{{image:')

    if (reHasImage && !currentHasImage) {
      // Re-extracted has image placeholders that current doesn't
      q.linked_scenario = cleanScenario
      scenarioUpdated++
    } else if (!currentScenario || currentScenario.length < 30) {
      // Current has no/short scenario, use re-extracted
      q.linked_scenario = cleanScenario
      scenarioAdded++
    } else if (cleanScenario.length > currentScenario.length * 1.3) {
      // Re-extracted is significantly longer (more complete)
      q.linked_scenario = cleanScenario
      scenarioUpdated++
    }

    // Set linked_group from re-extraction if missing
    if (!q.linked_group && re.linked_group) {
      q.linked_group = re.linked_group
    }
  }

  // 2. choices: supplement if current has fewer
  if (re.choices.length >= 4 && (!q.choices || q.choices.length < re.choices.length)) {
    q.choices = re.choices
    choicesImproved++
  }

  // 3. question_text: only fill if empty/very short
  if ((!q.question_text || q.question_text.length < 10) && re.question_text.length > 10) {
    q.question_text = re.question_text
      .replace(/([^\n])\n([^\n])/g, '$1$2')
      .trim()
    questionTextFilled++
  }

  // 4. Flag image_url for removal if linked_scenario has {{image:N}}
  if (q.linked_scenario?.includes('{{image:') && q.image_url) {
    // The old image_url was probably a fallback for the whole question
    // Now that we have proper scenario with image placeholders, flag it
    q._flag_image_review = true
    imageUrlFlagged++
  }
}

console.log(`=== Apply Re-extraction Results (Year ${year}) ===`)
console.log(`Scenario updated: ${scenarioUpdated}`)
console.log(`Scenario added: ${scenarioAdded}`)
console.log(`Choices improved: ${choicesImproved}`)
console.log(`Question text filled: ${questionTextFilled}`)
console.log(`Image URL flagged for review: ${imageUrlFlagged}`)

if (!DRY_RUN) {
  // Write updated TS file
  const newTs = header + JSON.stringify(currentQuestions, null, 2) + '\n'
  writeFileSync(tsPath, newTs, 'utf-8')
  console.log(`\nUpdated: ${tsPath}`)
} else {
  console.log('\n(Dry run - no files changed)')
}
