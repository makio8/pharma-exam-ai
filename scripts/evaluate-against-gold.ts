#!/usr/bin/env npx tsx
/**
 * Gold set（人力レビュー修正データ）と再抽出結果を比較して改善効果を定量評価する
 *
 * 各修正項目について:
 * - 再抽出データが gold set と一致 → "resolved" (人手修正が不要になった)
 * - 再抽出データが元データより改善 → "improved" (修正量は減るが人手は要る)
 * - 変化なし → "unchanged"
 * - 悪化 → "regressed"
 *
 * Usage:
 *   npx tsx scripts/evaluate-against-gold.ts --corrections /path/to/corrections.json
 *   npx tsx scripts/evaluate-against-gold.ts  # defaults to ~/Downloads/corrections-*.json
 */

import { readFileSync, readdirSync, existsSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..')

// ─────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────
const args = process.argv.slice(2)
const correctionsArg = args.find((_, i) => args[i - 1] === '--corrections')
const VERBOSE = args.includes('--verbose')

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface CorrectionItem {
  type: string
  field?: string
  value?: any
  target?: string
  images?: any[]
  crop?: any
  pdfFile?: string
  pdfPage?: number
}

interface QuestionCorrection {
  dataHash: string
  items: CorrectionItem[]
}

interface CorrectionsFile {
  version: string
  corrections: Record<string, QuestionCorrection>
}

interface ReExtractedQuestion {
  id: string
  year: number
  question_number: number
  section: string
  question_text: string
  choices: { key: number; text: string }[]
  linked_group: string | null
  linked_scenario: string | null
  image_needs: any[]
  pdf_file: string
  pdf_page: number
  flag_image_remove: boolean
}

interface CurrentQuestion {
  id: string
  question_text: string
  choices: { key: number; text: string }[]
  linked_scenario?: string | null
  linked_group?: string | null
  image_url?: string
}

type Verdict = 'resolved' | 'improved' | 'unchanged' | 'regressed' | 'not_applicable'

interface ItemEvaluation {
  questionId: string
  type: string
  field?: string
  verdict: Verdict
  detail: string
}

// ─────────────────────────────────────────────
// Text similarity
// ─────────────────────────────────────────────

/** Normalize text for comparison (ignore whitespace, linebreak differences) */
function normalize(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/\s+/g, ' ')
    .replace(/[（(]/g, '(')
    .replace(/[）)]/g, ')')
    .replace(/[１-９０]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .trim()
}

/** Simple similarity score (0-1) based on character overlap */
function similarity(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 1.0
  if (na.length === 0 || nb.length === 0) return 0.0

  // Longest common substring ratio
  const shorter = na.length <= nb.length ? na : nb
  const longer = na.length > nb.length ? na : nb

  let commonLen = 0
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter.substring(i, i + 10))) {
      commonLen += 10
      i += 9
    } else if (longer.includes(shorter.substring(i, i + 5))) {
      commonLen += 5
      i += 4
    } else if (longer.includes(shorter[i])) {
      commonLen++
    }
  }

  return commonLen / longer.length
}

/** Check if text contains {{image:N}} placeholder */
function hasImagePlaceholder(text: string | null | undefined): boolean {
  return /\{\{image:\d+\}\}/.test(text || '')
}

// ─────────────────────────────────────────────
// Evaluation logic
// ─────────────────────────────────────────────

function evaluateTextCorrection(
  item: CorrectionItem,
  currentQ: CurrentQuestion,
  reExtracted: ReExtractedQuestion,
): ItemEvaluation {
  const field = item.field as 'question_text' | 'linked_scenario'
  const goldValue = item.value as string
  const currentValue = field === 'linked_scenario'
    ? (currentQ.linked_scenario || '')
    : currentQ.question_text
  const reExtractedValue = field === 'linked_scenario'
    ? (reExtracted.linked_scenario || '')
    : reExtracted.question_text

  const goldNorm = normalize(goldValue)
  const currentNorm = normalize(currentValue)
  const reNorm = normalize(reExtractedValue)

  // Special case: gold has {{image:N}} placeholder
  if (field === 'linked_scenario' && hasImagePlaceholder(goldValue)) {
    const goldWithoutImage = normalize(goldValue.replace(/\{\{image:\d+\}\}/g, ''))
    const reWithoutImage = normalize(reExtractedValue.replace(/\{\{image:\d+\}\}/g, ''))

    const goldHasImage = hasImagePlaceholder(goldValue)
    const reHasImage = hasImagePlaceholder(reExtractedValue)

    if (reHasImage && similarity(reWithoutImage, goldWithoutImage) > 0.8) {
      return {
        questionId: currentQ.id,
        type: 'text',
        field,
        verdict: 'resolved',
        detail: `{{image:N}} in both, text similarity=${similarity(reWithoutImage, goldWithoutImage).toFixed(2)}`,
      }
    }

    if (reHasImage) {
      return {
        questionId: currentQ.id,
        type: 'text',
        field,
        verdict: 'improved',
        detail: `{{image:N}} detected, text needs refinement (sim=${similarity(reWithoutImage, goldWithoutImage).toFixed(2)})`,
      }
    }

    // Re-extracted doesn't have image placeholder but gold does
    const simToGold = similarity(reExtractedValue, goldWithoutImage)
    const simCurrentToGold = similarity(currentValue, goldWithoutImage)
    if (simToGold > simCurrentToGold) {
      return {
        questionId: currentQ.id,
        type: 'text',
        field,
        verdict: 'improved',
        detail: `Text improved (${simCurrentToGold.toFixed(2)}→${simToGold.toFixed(2)}) but missing {{image:N}}`,
      }
    }

    return {
      questionId: currentQ.id,
      type: 'text',
      field,
      verdict: 'unchanged',
      detail: `Gold has {{image:N}} but re-extracted doesn't`,
    }
  }

  // Normal text comparison
  const simCurrentToGold = similarity(currentValue, goldValue)
  const simReToGold = similarity(reExtractedValue, goldValue)

  if (simReToGold > 0.9) {
    return { questionId: currentQ.id, type: 'text', field, verdict: 'resolved', detail: `sim=${simReToGold.toFixed(2)}` }
  }
  if (simReToGold > simCurrentToGold + 0.1) {
    return { questionId: currentQ.id, type: 'text', field, verdict: 'improved', detail: `${simCurrentToGold.toFixed(2)}→${simReToGold.toFixed(2)}` }
  }
  if (simReToGold < simCurrentToGold - 0.1) {
    return { questionId: currentQ.id, type: 'text', field, verdict: 'regressed', detail: `${simCurrentToGold.toFixed(2)}→${simReToGold.toFixed(2)}` }
  }
  return { questionId: currentQ.id, type: 'text', field, verdict: 'unchanged', detail: `sim=${simReToGold.toFixed(2)}` }
}

function evaluateChoicesCorrection(
  item: CorrectionItem,
  currentQ: CurrentQuestion,
  reExtracted: ReExtractedQuestion,
): ItemEvaluation {
  const goldChoices = (item.value as { key: number; text: string }[]) || []
  const currentChoices = currentQ.choices || []
  const reChoices = reExtracted.choices || []

  // Count matching choices
  let currentMatches = 0
  let reMatches = 0
  for (const gc of goldChoices) {
    const gcNorm = normalize(gc.text)
    if (currentChoices.some(c => similarity(normalize(c.text), gcNorm) > 0.85)) currentMatches++
    if (reChoices.some(c => similarity(normalize(c.text), gcNorm) > 0.85)) reMatches++
  }

  const total = goldChoices.length
  if (reMatches === total) {
    return { questionId: currentQ.id, type: 'choices', verdict: 'resolved', detail: `${reMatches}/${total} match` }
  }
  if (reMatches > currentMatches) {
    return { questionId: currentQ.id, type: 'choices', verdict: 'improved', detail: `${currentMatches}→${reMatches}/${total}` }
  }
  if (reMatches < currentMatches) {
    return { questionId: currentQ.id, type: 'choices', verdict: 'regressed', detail: `${currentMatches}→${reMatches}/${total}` }
  }
  return { questionId: currentQ.id, type: 'choices', verdict: 'unchanged', detail: `${reMatches}/${total}` }
}

function evaluateImageRemove(
  currentQ: CurrentQuestion,
  reExtracted: ReExtractedQuestion,
): ItemEvaluation {
  // Gold says: remove the image. Check if re-extracted doesn't have an image reference
  // Since re-extracted doesn't carry image_url, check if it flags removal
  if (!currentQ.image_url) {
    return { questionId: currentQ.id, type: 'image-remove', verdict: 'resolved', detail: 'No image in current data' }
  }
  // Re-extraction doesn't assign images, so this is inherently resolved
  return { questionId: currentQ.id, type: 'image-remove', verdict: 'resolved', detail: 'Re-extraction doesnt assign images' }
}

function evaluateMultiImageCrop(
  item: CorrectionItem,
  reExtracted: ReExtractedQuestion,
): ItemEvaluation {
  // Check if re-extracted has matching {{image:N}} placeholders
  const target = item.target as string // 'scenario' or 'question'
  const goldImages = item.images as any[] || []

  const textToCheck = target === 'scenario'
    ? reExtracted.linked_scenario || ''
    : reExtracted.question_text

  const reImageCount = (textToCheck.match(/\{\{image:\d+\}\}/g) || []).length

  if (reImageCount >= goldImages.length) {
    return {
      questionId: reExtracted.id,
      type: 'multi-image-crop',
      verdict: 'improved',
      detail: `{{image:N}} placeholder present (${reImageCount}/${goldImages.length}). Crop coords still need human review`,
    }
  }

  if (reImageCount > 0) {
    return {
      questionId: reExtracted.id,
      type: 'multi-image-crop',
      verdict: 'improved',
      detail: `Partial: ${reImageCount}/${goldImages.length} image placeholders`,
    }
  }

  return {
    questionId: reExtracted.id,
    type: 'multi-image-crop',
    verdict: 'unchanged',
    detail: `No {{image:N}} in re-extracted ${target}`,
  }
}

function evaluateImageCrop(
  item: CorrectionItem,
  reExtracted: ReExtractedQuestion,
): ItemEvaluation {
  // Image crop corrections add a new image. Can't automate crop coords.
  // But we can flag the image_needs
  const hasNeed = reExtracted.image_needs.length > 0
  return {
    questionId: reExtracted.id,
    type: 'image-crop',
    verdict: 'not_applicable',
    detail: hasNeed ? 'Image need flagged' : 'No image need flagged (requires manual crop)',
  }
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

// Find corrections file (search common locations if not specified)
let correctionsPath = correctionsArg
if (!correctionsPath) {
  const candidates = [
    path.join(PROJECT_ROOT, 'corrections.json'),
    path.join(PROJECT_ROOT, 'reports', 'corrections.json'),
  ]
  const homeDownloads = path.join(process.env.HOME || '', 'Downloads')
  try {
    const dlFiles = readdirSync(homeDownloads)
      .filter((f: string) => f.startsWith('corrections-') && f.endsWith('.json'))
      .sort()
      .reverse()
    if (dlFiles.length > 0) candidates.push(path.join(homeDownloads, dlFiles[0]))
  } catch {}
  correctionsPath = candidates.find(p => existsSync(p))
  if (!correctionsPath) {
    console.error('No corrections file found. Use --corrections <path>')
    process.exit(1)
  }
}

const corrections: CorrectionsFile = JSON.parse(readFileSync(correctionsPath!, 'utf-8'))

// Determine year from corrections (all r100-xxx → year 100)
const firstQId = Object.keys(corrections.corrections)[0]
const yearMatch = firstQId.match(/r(\d+)/)
const year = yearMatch ? parseInt(yearMatch[1]) : 100

// Load re-extracted data
const reExtractedPath = path.join(PROJECT_ROOT, 'reports', `re-extracted-${year}.json`)
if (!existsSync(reExtractedPath)) {
  console.error(`Re-extracted data not found: ${reExtractedPath}`)
  console.error('Run: npx tsx scripts/re-extract-from-pdf.ts --year ' + year)
  process.exit(1)
}
const reExtracted: ReExtractedQuestion[] = JSON.parse(readFileSync(reExtractedPath, 'utf-8'))
const reMap = new Map(reExtracted.map(q => [q.id, q]))

// Load current data
const tsPath = path.join(PROJECT_ROOT, 'src', 'data', 'real-questions', `exam-${year}.ts`)
const tsContent = readFileSync(tsPath, 'utf-8')
const jsonPart = tsContent.substring(tsContent.indexOf('[\n'))
const currentQuestions: CurrentQuestion[] = JSON.parse(jsonPart.trimEnd())
const currentMap = new Map(currentQuestions.map(q => [q.id, q]))

// Evaluate
const evaluations: ItemEvaluation[] = []
const verdictCounts: Record<string, Record<Verdict, number>> = {}

for (const [qid, correction] of Object.entries(corrections.corrections)) {
  const currentQ = currentMap.get(qid)
  const reQ = reMap.get(qid)

  if (!currentQ || !reQ) {
    for (const item of correction.items) {
      evaluations.push({
        questionId: qid,
        type: item.type,
        field: item.field,
        verdict: 'not_applicable',
        detail: !currentQ ? 'Not in current data' : 'Not in re-extracted data',
      })
    }
    continue
  }

  for (const item of correction.items) {
    let evaluation: ItemEvaluation

    switch (item.type) {
      case 'text':
        evaluation = evaluateTextCorrection(item, currentQ, reQ)
        break
      case 'choices':
        evaluation = evaluateChoicesCorrection(item, currentQ, reQ)
        break
      case 'image-remove':
        evaluation = evaluateImageRemove(currentQ, reQ)
        break
      case 'multi-image-crop':
        evaluation = evaluateMultiImageCrop(item, reQ)
        break
      case 'image-crop':
        evaluation = evaluateImageCrop(item, reQ)
        break
      default:
        evaluation = {
          questionId: qid,
          type: item.type,
          verdict: 'not_applicable',
          detail: `Unknown type: ${item.type}`,
        }
    }

    evaluations.push(evaluation)

    // Count by type
    const typeKey = item.type === 'text' ? `text:${item.field}` : item.type
    if (!verdictCounts[typeKey]) {
      verdictCounts[typeKey] = { resolved: 0, improved: 0, unchanged: 0, regressed: 0, not_applicable: 0 }
    }
    verdictCounts[typeKey][evaluation.verdict]++
  }
}

// ─────────────────────────────────────────────
// Report
// ─────────────────────────────────────────────

console.log('=== Gold Set Evaluation Report ===')
console.log(`Year: ${year}`)
console.log(`Corrections file: ${correctionsPath}`)
console.log(`Total questions with corrections: ${Object.keys(corrections.corrections).length}`)
console.log(`Total correction items: ${evaluations.length}`)
console.log()

// Summary table
console.log('=== Summary by Correction Type ===')
console.log('Type                  | Resolved | Improved | Unchanged | Regressed | N/A')
console.log('─'.repeat(80))

let totalResolved = 0
let totalImproved = 0
let totalUnchanged = 0
let totalRegressed = 0
let totalNA = 0

for (const [type, counts] of Object.entries(verdictCounts).sort()) {
  const { resolved, improved, unchanged, regressed, not_applicable } = counts
  totalResolved += resolved
  totalImproved += improved
  totalUnchanged += unchanged
  totalRegressed += regressed
  totalNA += not_applicable

  const line = [
    type.padEnd(22),
    String(resolved).padStart(8),
    String(improved).padStart(9),
    String(unchanged).padStart(10),
    String(regressed).padStart(10),
    String(not_applicable).padStart(6),
  ].join(' | ')
  console.log(line)
}

console.log('─'.repeat(80))
const totalLine = [
  'TOTAL'.padEnd(22),
  String(totalResolved).padStart(8),
  String(totalImproved).padStart(9),
  String(totalUnchanged).padStart(10),
  String(totalRegressed).padStart(10),
  String(totalNA).padStart(6),
].join(' | ')
console.log(totalLine)

const automatable = totalResolved + totalImproved
const total = evaluations.length - totalNA
console.log()
console.log(`Resolved (人手修正不要): ${totalResolved}/${total} (${(totalResolved / total * 100).toFixed(1)}%)`)
console.log(`Improved (修正量削減): ${totalImproved}/${total} (${(totalImproved / total * 100).toFixed(1)}%)`)
console.log(`改善合計: ${automatable}/${total} (${(automatable / total * 100).toFixed(1)}%)`)
console.log(`Unchanged (効果なし): ${totalUnchanged}/${total} (${(totalUnchanged / total * 100).toFixed(1)}%)`)
console.log(`Regressed (悪化): ${totalRegressed}/${total} (${(totalRegressed / total * 100).toFixed(1)}%)`)

// Show regressed items
if (totalRegressed > 0) {
  console.log('\n=== Regressed Items (要確認) ===')
  for (const e of evaluations.filter(e => e.verdict === 'regressed')) {
    console.log(`  ${e.questionId} [${e.type}${e.field ? ':' + e.field : ''}]: ${e.detail}`)
  }
}

// Show verbose per-question
if (VERBOSE) {
  console.log('\n=== Per-Item Details ===')
  for (const e of evaluations) {
    const icon = e.verdict === 'resolved' ? '✓' : e.verdict === 'improved' ? '↑' : e.verdict === 'regressed' ? '✗' : '·'
    console.log(`  ${icon} ${e.questionId} [${e.type}${e.field ? ':' + e.field : ''}] ${e.verdict}: ${e.detail}`)
  }
}

// Save detailed report
const reportPath = path.join(PROJECT_ROOT, 'reports', `evaluation-${year}.json`)
writeFileSync(reportPath, JSON.stringify({
  year,
  timestamp: new Date().toISOString(),
  summary: {
    total: evaluations.length,
    resolved: totalResolved,
    improved: totalImproved,
    unchanged: totalUnchanged,
    regressed: totalRegressed,
    not_applicable: totalNA,
  },
  byType: verdictCounts,
  evaluations,
}, null, 2), 'utf-8')
console.log(`\nDetailed report saved: ${reportPath}`)

// Still-needs-fix list
const stillNeedsFix = evaluations
  .filter(e => e.verdict === 'unchanged' || e.verdict === 'regressed')
  .map(e => e.questionId)
const uniqueStillNeedsFix = [...new Set(stillNeedsFix)]
console.log(`\nStill needs human fix: ${uniqueStillNeedsFix.length} questions`)
const stillFixPath = path.join(PROJECT_ROOT, 'reports', `still-needs-fix-${year}.json`)
writeFileSync(stillFixPath, JSON.stringify({
  year,
  count: uniqueStillNeedsFix.length,
  questionIds: uniqueStillNeedsFix,
  details: evaluations.filter(e => e.verdict === 'unchanged' || e.verdict === 'regressed'),
}, null, 2), 'utf-8')
console.log(`Still-needs-fix list saved: ${stillFixPath}`)
