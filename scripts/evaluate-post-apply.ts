#!/usr/bin/env npx tsx
/**
 * 適用後の実データ vs Gold Set の比較評価
 *
 * evaluate-against-gold.ts が re-extracted 生データを比較するのに対し、
 * こちらは apply-re-extraction 適用後の exam-{year}.ts を直接 gold set と比較する。
 *
 * Usage:
 *   npx tsx scripts/evaluate-post-apply.ts
 *   npx tsx scripts/evaluate-post-apply.ts --corrections /path/to/corrections.json
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..')

const args = process.argv.slice(2)
const correctionsArg = args.find((_, i) => args[i - 1] === '--corrections')
const VERBOSE = args.includes('--verbose')

// Find corrections file (search common locations if not specified)
let correctionsPath = correctionsArg
if (!correctionsPath) {
  const candidates = [
    path.join(PROJECT_ROOT, 'corrections.json'),
    path.join(PROJECT_ROOT, 'reports', 'corrections.json'),
  ]
  // Also check ~/Downloads for corrections-*.json
  const homeDownloads = path.join(process.env.HOME || '', 'Downloads')
  try {
    const dlFiles = readdirSync(homeDownloads)
      .filter((f: string) => f.startsWith('corrections-') && f.endsWith('.json'))
      .sort()
      .reverse()
    if (dlFiles.length > 0) candidates.push(path.join(homeDownloads, dlFiles[0]))
  } catch {}
  correctionsPath = candidates.find(p => existsSync(p))
}
if (!correctionsPath || !existsSync(correctionsPath)) {
  console.error('Corrections file not found. Use --corrections <path>')
  process.exit(1)
}

interface CorrectionItem {
  type: string; field?: string; value?: any; target?: string; images?: any[]
}
interface CorrectionsFile {
  corrections: Record<string, { dataHash: string; items: CorrectionItem[] }>
}

const corrections: CorrectionsFile = JSON.parse(readFileSync(correctionsPath, 'utf-8'))
const firstQId = Object.keys(corrections.corrections)[0]
const year = parseInt(firstQId.match(/r(\d+)/)![1])

// Load POST-APPLY current data
const tsPath = path.join(PROJECT_ROOT, 'src', 'data', 'real-questions', `exam-${year}.ts`)
const tsContent = readFileSync(tsPath, 'utf-8')
const jsonStr = tsContent.substring(tsContent.indexOf('[\n')).trimEnd()
const currentQuestions = JSON.parse(jsonStr)
const currentMap = new Map(currentQuestions.map((q: any) => [q.id, q]))

// Load BACKUP (pre-apply) data for before/after comparison
const bakPath = tsPath + '.bak'
let beforeMap: Map<string, any> | null = null
if (!existsSync(bakPath)) {
  console.warn(`⚠ Backup not found: ${bakPath}`)
  console.warn('  Before/after comparison will be skipped (all diffs shown as unchanged)')
}
if (existsSync(bakPath)) {
  const bakContent = readFileSync(bakPath, 'utf-8')
  const bakJson = bakContent.substring(bakContent.indexOf('[\n')).trimEnd()
  const bakQuestions = JSON.parse(bakJson)
  beforeMap = new Map(bakQuestions.map((q: any) => [q.id, q]))
}

// Normalize for comparison
function normalize(text: string | null | undefined): string {
  if (!text) return ''
  return text.replace(/\s+/g, ' ').trim()
}

function similarity(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 1.0
  if (na.length === 0 || nb.length === 0) return 0.0
  let common = 0
  for (let i = 0; i < na.length; i++) {
    const chunk = na.substring(i, Math.min(i + 8, na.length))
    if (nb.includes(chunk)) { common += chunk.length; i += chunk.length - 1 }
    else if (nb.includes(na[i])) common++
  }
  return Math.min(1.0, common / Math.max(na.length, nb.length))
}

// Evaluate each correction
type Verdict = 'resolved' | 'improved' | 'unchanged' | 'regressed' | 'not_applicable'

interface Result {
  qid: string; type: string; field?: string; verdict: Verdict; detail: string
  beforeSim?: number; afterSim?: number
}

const results: Result[] = []

for (const [qid, correction] of Object.entries(corrections.corrections)) {
  const current = currentMap.get(qid)
  const before = beforeMap?.get(qid)
  if (!current) {
    correction.items.forEach(i => results.push({ qid, type: i.type, field: i.field, verdict: 'not_applicable', detail: 'Not in data' }))
    continue
  }

  for (const item of correction.items) {
    if (item.type === 'text') {
      const field = item.field as string
      const goldValue = item.value as string
      const currentValue = field === 'linked_scenario' ? (current.linked_scenario || '') : current.question_text
      const beforeValue = before ? (field === 'linked_scenario' ? (before.linked_scenario || '') : before.question_text) : currentValue

      const beforeSim = similarity(beforeValue, goldValue)
      const afterSim = similarity(currentValue, goldValue)

      // Check {{image:N}} match
      const goldHasImage = /\{\{image:\d+\}\}/.test(goldValue)
      const afterHasImage = /\{\{image:\d+\}\}/.test(currentValue)
      const beforeHasImage = /\{\{image:\d+\}\}/.test(beforeValue)

      let verdict: Verdict = 'unchanged'
      let detail = ''

      if (afterSim > 0.9 || (goldHasImage && afterHasImage && afterSim > 0.8)) {
        verdict = 'resolved'
        detail = `sim=${afterSim.toFixed(2)}`
      } else if (afterSim > beforeSim + 0.05) {
        verdict = 'improved'
        detail = `${beforeSim.toFixed(2)}→${afterSim.toFixed(2)}`
      } else if (afterSim < beforeSim - 0.05) {
        verdict = 'regressed'
        detail = `${beforeSim.toFixed(2)}→${afterSim.toFixed(2)}`
      } else {
        verdict = 'unchanged'
        detail = `sim=${afterSim.toFixed(2)} (was ${beforeSim.toFixed(2)})`
      }

      // Bonus: if gold has image and now we do too, count as improved even if text sim is lower
      if (goldHasImage && afterHasImage && !beforeHasImage && verdict !== 'resolved') {
        verdict = 'improved'
        detail += ' +{{image:N}}'
      }

      results.push({ qid, type: 'text', field, verdict, detail, beforeSim, afterSim })
    } else if (item.type === 'choices') {
      const goldChoices = (item.value as { key: number; text: string }[]) || []
      const currentChoices = current.choices || []
      const beforeChoices = before?.choices || currentChoices

      let beforeMatches = 0
      let afterMatches = 0
      for (const gc of goldChoices) {
        const gn = normalize(gc.text)
        if (beforeChoices.some((c: any) => similarity(normalize(c.text), gn) > 0.85)) beforeMatches++
        if (currentChoices.some((c: any) => similarity(normalize(c.text), gn) > 0.85)) afterMatches++
      }

      const total = goldChoices.length
      let verdict: Verdict = 'unchanged'
      if (afterMatches === total) verdict = 'resolved'
      else if (afterMatches > beforeMatches) verdict = 'improved'
      else if (afterMatches < beforeMatches) verdict = 'regressed'

      results.push({ qid, type: 'choices', verdict, detail: `${beforeMatches}→${afterMatches}/${total}` })
    } else if (item.type === 'image-remove') {
      // Check if image_url still exists or if it's been flagged
      const hasImage = !!current.image_url
      const wasFlagged = current._flag_image_review
      if (!hasImage) {
        results.push({ qid, type: 'image-remove', verdict: 'resolved', detail: 'No image' })
      } else if (wasFlagged) {
        results.push({ qid, type: 'image-remove', verdict: 'improved', detail: 'Flagged for review' })
      } else {
        results.push({ qid, type: 'image-remove', verdict: 'unchanged', detail: 'Still has image_url' })
      }
    } else if (item.type === 'multi-image-crop') {
      const target = item.target as string
      const textToCheck = target === 'scenario' ? (current.linked_scenario || '') : current.question_text
      const goldImages = item.images || []
      const hasPlaceholder = /\{\{image:\d+\}\}/.test(textToCheck)

      if (hasPlaceholder) {
        results.push({ qid, type: 'multi-image-crop', verdict: 'improved', detail: `{{image:N}} in ${target}. Crop coords need human` })
      } else {
        results.push({ qid, type: 'multi-image-crop', verdict: 'unchanged', detail: `No {{image:N}} in ${target}` })
      }
    } else if (item.type === 'image-crop') {
      results.push({ qid, type: 'image-crop', verdict: 'not_applicable', detail: 'Requires manual crop' })
    }
  }
}

// Report
console.log('=== Post-Apply Evaluation Report ===')
console.log(`Year: ${year}`)
console.log(`Data: exam-${year}.ts (after apply-re-extraction)`)
console.log(`Corrections: ${Object.keys(corrections.corrections).length} questions, ${results.length} items`)
console.log()

const byType: Record<string, Record<Verdict, number>> = {}
for (const r of results) {
  const key = r.type === 'text' ? `text:${r.field}` : r.type
  if (!byType[key]) byType[key] = { resolved: 0, improved: 0, unchanged: 0, regressed: 0, not_applicable: 0 }
  byType[key][r.verdict]++
}

console.log('Type                  | Resolved | Improved | Unchanged | Regressed | N/A')
console.log('─'.repeat(80))

let totals = { resolved: 0, improved: 0, unchanged: 0, regressed: 0, not_applicable: 0 }
for (const [type, counts] of Object.entries(byType).sort()) {
  for (const k of Object.keys(totals) as Verdict[]) totals[k] += counts[k]
  console.log([
    type.padEnd(22),
    String(counts.resolved).padStart(8),
    String(counts.improved).padStart(9),
    String(counts.unchanged).padStart(10),
    String(counts.regressed).padStart(10),
    String(counts.not_applicable).padStart(6),
  ].join(' | '))
}
console.log('─'.repeat(80))
console.log([
  'TOTAL'.padEnd(22),
  String(totals.resolved).padStart(8),
  String(totals.improved).padStart(9),
  String(totals.unchanged).padStart(10),
  String(totals.regressed).padStart(10),
  String(totals.not_applicable).padStart(6),
].join(' | '))

const applicable = results.length - totals.not_applicable
console.log()
console.log(`Resolved (人手修正不要): ${totals.resolved}/${applicable} (${(totals.resolved / applicable * 100).toFixed(1)}%)`)
console.log(`Improved (修正量削減): ${totals.improved}/${applicable} (${(totals.improved / applicable * 100).toFixed(1)}%)`)
console.log(`改善合計: ${totals.resolved + totals.improved}/${applicable} (${((totals.resolved + totals.improved) / applicable * 100).toFixed(1)}%)`)
console.log(`Unchanged: ${totals.unchanged}/${applicable} (${(totals.unchanged / applicable * 100).toFixed(1)}%)`)
console.log(`Regressed: ${totals.regressed}/${applicable} (${(totals.regressed / applicable * 100).toFixed(1)}%)`)

if (totals.regressed > 0) {
  console.log('\n=== Regressed Items ===')
  results.filter(r => r.verdict === 'regressed').forEach(r => {
    console.log(`  ${r.qid} [${r.type}${r.field ? ':' + r.field : ''}]: ${r.detail}`)
  })
}

// Save report
const reportPath = path.join(PROJECT_ROOT, 'reports', `post-apply-evaluation-${year}.json`)
writeFileSync(reportPath, JSON.stringify({ year, timestamp: new Date().toISOString(), summary: totals, byType, results }, null, 2))
console.log(`\nReport saved: ${reportPath}`)

// Remaining fix count
const totalCorrectedQuestions = Object.keys(corrections.corrections).length
const stillNeeds = [...new Set(results.filter(r => r.verdict === 'unchanged' || r.verdict === 'regressed').map(r => r.qid))]
console.log(`\nStill needs human review: ${stillNeeds.length} questions (was ${totalCorrectedQuestions})`)
console.log(`Reduction: ${totalCorrectedQuestions - stillNeeds.length} questions (${((totalCorrectedQuestions - stillNeeds.length) / totalCorrectedQuestions * 100).toFixed(0)}% fewer)`)
