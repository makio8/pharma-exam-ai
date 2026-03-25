#!/usr/bin/env npx tsx
/**
 * fix-choice-suffix-leak.ts
 *
 * 問題文末尾に漏れ出した選択肢サフィックスを検出し、修正候補を出力する。
 *
 * Usage:
 *   npx tsx scripts/fix-choice-suffix-leak.ts                    # 全年度スキャン + サマリ
 *   npx tsx scripts/fix-choice-suffix-leak.ts --dry-run          # 上位20件のdiff表示
 *   npx tsx scripts/fix-choice-suffix-leak.ts --year 103-106     # 年度範囲指定
 *   npx tsx scripts/fix-choice-suffix-leak.ts --apply            # corrections JSON 出力
 */

import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Question } from '../src/types/question.js'
import { detectSuffixLeak } from './lib/suffix-leak-detector.js'
import type { LeakDetectionResult, Confidence } from './lib/suffix-leak-detector.js'

// ESM __dirname 相当
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..')

// ─────────────────────────────────────────────
// ANSI カラー
// ─────────────────────────────────────────────

const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const CYAN = '\x1b[36m'
const GRAY = '\x1b[90m'
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'

function log(msg: string) { console.log(msg) }
function ok(msg: string) { console.log(`${GREEN}ok${RESET} ${msg}`) }
function warn(msg: string) { console.log(`${YELLOW}!!${RESET} ${msg}`) }
function info(msg: string) { console.log(`${CYAN}--${RESET} ${msg}`) }

// ─────────────────────────────────────────────
// CLIオプション解析
// ─────────────────────────────────────────────

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const applyMode = args.includes('--apply')

function parseYears(): number[] {
  const idx = args.indexOf('--year')
  if (idx === -1 || idx + 1 >= args.length) {
    // デフォルト: 全年度
    return Array.from({ length: 12 }, (_, i) => 100 + i) // 100-111
  }
  const raw = args[idx + 1]
  if (raw.includes('-')) {
    const [startStr, endStr] = raw.split('-')
    const start = parseInt(startStr, 10)
    const end = parseInt(endStr, 10)
    if (isNaN(start) || isNaN(end) || start > end) {
      console.error(`${RED}ERROR${RESET} --year の範囲が不正です: ${raw}`)
      process.exit(1)
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }
  const single = parseInt(raw, 10)
  if (isNaN(single)) {
    console.error(`${RED}ERROR${RESET} --year の値が不正です: ${raw}`)
    process.exit(1)
  }
  return [single]
}

const targetYears = parseYears()

// ─────────────────────────────────────────────
// dataHash（apply-corrections.ts と同一アルゴリズム）
// ─────────────────────────────────────────────

function computeDataHash(q: Question): string {
  const str = q.question_text + JSON.stringify(q.choices) + JSON.stringify(q.correct_answer)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(36)
}

// ─────────────────────────────────────────────
// 試験データ読み込み
// ─────────────────────────────────────────────

async function loadExamQuestions(year: number): Promise<Question[]> {
  const filePath = path.join(PROJECT_ROOT, `src/data/real-questions/exam-${year}.ts`)
  try {
    const mod = await import(filePath)
    // 名前付きexportから配列を探す（例: EXAM_100_QUESTIONS）
    const questions: Question[] = Object.values(mod).find(v => Array.isArray(v)) as Question[] ?? []
    return questions
  } catch (e) {
    warn(`exam-${year}.ts の読み込みに失敗: ${e}`)
    return []
  }
}

// ─────────────────────────────────────────────
// diff表示ヘルパー
// ─────────────────────────────────────────────

function printDiff(result: LeakDetectionResult, question: Question) {
  const confColor = result.confidence === 'AUTO_HIGH' ? GREEN
    : result.confidence === 'AUTO_MEDIUM' ? YELLOW
    : RED
  log(``)
  log(`${BOLD}${confColor}[${result.confidence}]${RESET} ${result.questionId}`)
  log(`${GRAY}  leaked lines: ${result.leakedLines.join(' | ')}${RESET}`)
  log(`  ${RED}- question_text (末尾):${RESET}`)
  // 問題文末尾を表示（ターミネータ行 + リーク行）
  const originalLines = question.question_text.split('\n')
  const showFrom = Math.max(0, originalLines.length - result.leakedLines.length - 2)
  for (let i = showFrom; i < originalLines.length; i++) {
    const prefix = i > originalLines.length - result.leakedLines.length - 1 ? RED + '-' : ' '
    log(`  ${prefix} ${originalLines[i]}${RESET}`)
  }
  log(`  ${GREEN}+ question_text (cleaned, 末尾):${RESET}`)
  const cleanedLines = result.cleanedText.split('\n')
  const showCleanFrom = Math.max(0, cleanedLines.length - 2)
  for (let i = showCleanFrom; i < cleanedLines.length; i++) {
    log(`  ${GREEN}  ${cleanedLines[i]}${RESET}`)
  }
  log(`  choices:`)
  for (let i = 0; i < result.mergedChoices.length; i++) {
    const orig = question.choices[i]
    const merged = result.mergedChoices[i]
    if (orig.text !== merged.text) {
      log(`    ${RED}- ${orig.key}: ${orig.text}${RESET}`)
      log(`    ${GREEN}+ ${merged.key}: ${merged.text}${RESET}`)
    } else {
      log(`    ${GRAY}  ${orig.key}: ${orig.text}${RESET}`)
    }
  }
}

// ─────────────────────────────────────────────
// corrections JSON 生成（--apply 用）
// ─────────────────────────────────────────────

interface CorrectionItem {
  type: string
  field?: string
  value: unknown
}

interface CorrectionEntry {
  dataHash: string
  items: CorrectionItem[]
}

interface CorrectionsFile {
  version: string
  timestamp: string
  baseGitCommit: string
  reportTimestamp: string
  corrections: Record<string, CorrectionEntry>
}

interface ReviewEntry {
  questionId: string
  confidence: Confidence
  leakedLines: string[]
  reason: string
}

// ─────────────────────────────────────────────
// メイン処理
// ─────────────────────────────────────────────

async function main() {
  log('')
  log(`${CYAN}${BOLD}=== fix-choice-suffix-leak.ts ===${RESET}`)
  log(`${GRAY}対象年度: ${targetYears.join(', ')}${RESET}`)
  if (dryRun) log(`${YELLOW}[DRY-RUN モード] 上位20件のdiffを表示${RESET}`)
  if (applyMode) log(`${GREEN}[APPLY モード] corrections JSON を出力${RESET}`)
  log('')

  // 全年度スキャン
  const allResults: { result: LeakDetectionResult; question: Question }[] = []
  let totalQuestions = 0

  for (const year of targetYears) {
    const questions = await loadExamQuestions(year)
    if (questions.length === 0) {
      warn(`第${year}回: 問題データなし（スキップ）`)
      continue
    }
    totalQuestions += questions.length

    let yearDetections = 0
    for (const q of questions) {
      const result = detectSuffixLeak({
        id: q.id,
        question_text: q.question_text,
        choices: q.choices,
      })
      if (result) {
        allResults.push({ result, question: q })
        yearDetections++
      }
    }

    if (yearDetections > 0) {
      info(`第${year}回: ${questions.length}問 → ${yearDetections}件検出`)
    } else {
      log(`${GRAY}  第${year}回: ${questions.length}問 → 検出なし${RESET}`)
    }
  }

  log('')

  // 信頼度別集計
  const byConfidence: Record<Confidence, typeof allResults> = {
    'AUTO_HIGH': [],
    'AUTO_MEDIUM': [],
    'REVIEW': [],
  }
  for (const item of allResults) {
    byConfidence[item.result.confidence].push(item)
  }

  // ─── サマリ出力 ───
  log(`${BOLD}=== サマリ ===${RESET}`)
  log(`  スキャン問題数: ${totalQuestions}`)
  log(`  検出合計:       ${allResults.length}`)
  log(`    ${GREEN}AUTO_HIGH${RESET}:   ${byConfidence['AUTO_HIGH'].length} （行数=選択肢数、自動修正可）`)
  log(`    ${YELLOW}AUTO_MEDIUM${RESET}: ${byConfidence['AUTO_MEDIUM'].length} （行数=選択肢数-1、自動修正可）`)
  log(`    ${RED}REVIEW${RESET}:      ${byConfidence['REVIEW'].length} （要手動確認）`)
  log('')

  // ─── --dry-run: 上位20件のdiff表示 ───
  if (dryRun) {
    const autoResults = [
      ...byConfidence['AUTO_HIGH'],
      ...byConfidence['AUTO_MEDIUM'],
      ...byConfidence['REVIEW'],
    ]
    const showCount = Math.min(20, autoResults.length)
    log(`${BOLD}=== Diff（上位${showCount}件） ===${RESET}`)
    for (let i = 0; i < showCount; i++) {
      printDiff(autoResults[i].result, autoResults[i].question)
    }
    if (autoResults.length > showCount) {
      log(`${GRAY}  ... 他 ${autoResults.length - showCount}件 省略${RESET}`)
    }
    log('')
    return
  }

  // ─── --apply: corrections JSON 出力 ───
  if (applyMode) {
    const reportsDir = path.join(PROJECT_ROOT, 'reports')
    mkdirSync(reportsDir, { recursive: true })

    // AUTO_HIGH + AUTO_MEDIUM → corrections JSON
    const autoItems = [...byConfidence['AUTO_HIGH'], ...byConfidence['AUTO_MEDIUM']]
    const corrections: Record<string, CorrectionEntry> = {}

    for (const { result, question } of autoItems) {
      const dataHash = computeDataHash(question)
      corrections[result.questionId] = {
        dataHash,
        items: [
          { type: 'text', field: 'question_text', value: result.cleanedText },
          {
            type: 'choices',
            value: result.mergedChoices.map(c => ({ key: c.key, text: c.text })),
          },
        ],
      }
    }

    const correctionsFile: CorrectionsFile = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      baseGitCommit: '',
      reportTimestamp: new Date().toISOString(),
      corrections,
    }

    const correctionsPath = path.join(reportsDir, 'suffix-leak-auto-corrections.json')
    writeFileSync(correctionsPath, JSON.stringify(correctionsFile, null, 2), 'utf-8')
    ok(`auto corrections: ${correctionsPath} (${autoItems.length}件)`)

    // REVIEW → review JSON
    const reviewItems: ReviewEntry[] = byConfidence['REVIEW'].map(({ result }) => ({
      questionId: result.questionId,
      confidence: result.confidence,
      leakedLines: result.leakedLines,
      reason: `leaked ${result.leakedLines.length} lines, needs manual review`,
    }))

    const reviewPath = path.join(reportsDir, 'suffix-leak-review.json')
    writeFileSync(reviewPath, JSON.stringify(reviewItems, null, 2), 'utf-8')
    ok(`review candidates: ${reviewPath} (${reviewItems.length}件)`)

    log('')
    log(`${BOLD}次のステップ:${RESET}`)
    log(`  1. reports/suffix-leak-auto-corrections.json を確認`)
    log(`  2. reports/suffix-leak-review.json の手動確認`)
    log(`  3. npx tsx scripts/apply-corrections.ts reports/suffix-leak-auto-corrections.json`)
    log('')
    return
  }

  // ─── デフォルト: 上位20件を簡易表示 ───
  if (allResults.length > 0) {
    const showCount = Math.min(20, allResults.length)
    log(`${BOLD}=== 検出一覧（上位${showCount}件） ===${RESET}`)
    for (let i = 0; i < showCount; i++) {
      const { result } = allResults[i]
      const confColor = result.confidence === 'AUTO_HIGH' ? GREEN
        : result.confidence === 'AUTO_MEDIUM' ? YELLOW
        : RED
      log(`  ${confColor}[${result.confidence}]${RESET} ${result.questionId} — leaked: ${result.leakedLines.join(' | ')}`)
    }
    if (allResults.length > showCount) {
      log(`${GRAY}  ... 他 ${allResults.length - showCount}件${RESET}`)
    }
    log('')
    log(`${GRAY}詳細 diff を見るには: npx tsx scripts/fix-choice-suffix-leak.ts --dry-run${RESET}`)
    log(`${GRAY}corrections JSON を出力: npx tsx scripts/fix-choice-suffix-leak.ts --apply${RESET}`)
    log('')
  } else {
    ok('サフィックスリークは検出されませんでした')
    log('')
  }
}

main().catch(e => {
  console.error(`${RED}ERROR${RESET} ${e}`)
  process.exit(1)
})
