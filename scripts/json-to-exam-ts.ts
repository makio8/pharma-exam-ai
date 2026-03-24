#!/usr/bin/env npx tsx
/**
 * JSON → exam-{year}.ts 再生成スクリプト
 *
 * apply-corrections.ts が出力した reports/corrected-{year}.json を読み込み、
 * src/data/real-questions/exam-{year}.ts を再生成する。
 *
 * Usage:
 *   npx tsx scripts/json-to-exam-ts.ts              # reports/corrected-*.json を全て処理
 *   npx tsx scripts/json-to-exam-ts.ts 111          # 指定年度のみ
 *   npx tsx scripts/json-to-exam-ts.ts --dry-run    # プレビューのみ（ファイル書き込みなし）
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Question } from '../src/types/question.js'

// ESM __dirname 相当
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..')

// ─────────────────────────────────────────────
// CLIオプション解析
// ─────────────────────────────────────────────

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const yearArg = args.find(a => !a.startsWith('--') && /^\d+$/.test(a))
const targetYear = yearArg ? parseInt(yearArg, 10) : null

// ─────────────────────────────────────────────
// ユーティリティ
// ─────────────────────────────────────────────

const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const CYAN = '\x1b[36m'
const RESET = '\x1b[0m'
const GRAY = '\x1b[90m'

function ok(msg: string) { console.log(`${GREEN}✓${RESET} ${msg}`) }
function warn(msg: string) { console.log(`${YELLOW}⚠${RESET} ${msg}`) }
function err(msg: string) { console.log(`${RED}✗${RESET} ${msg}`) }
function info(msg: string) { console.log(`${CYAN}ℹ${RESET} ${msg}`) }
function gray(msg: string) { console.log(`${GRAY}${msg}${RESET}`) }
function log(msg: string) { console.log(msg) }

// ─────────────────────────────────────────────
// TypeScript テンプレート生成
// ─────────────────────────────────────────────

/**
 * 年度と問題配列から exam-{year}.ts の内容を生成する
 */
function buildExamTs(year: number, questions: Question[]): string {
  const questionsJson = JSON.stringify(questions, null, 2)
  return `// 第${year}回薬剤師国家試験 実問題データ
// 自動生成: scripts/json-to-exam-ts.ts（apply-corrections.ts の出力から再生成）
// 生成日時: ${new Date().toISOString()}

import type { Question } from '../../types/question'

export const EXAM_${year}_QUESTIONS: Question[] = ${questionsJson}
`
}

// ─────────────────────────────────────────────
// 単一年度の処理
// ─────────────────────────────────────────────

function processYear(year: number): boolean {
  const reportsDir = path.join(PROJECT_ROOT, 'reports')
  const jsonPath = path.join(reportsDir, `corrected-${year}.json`)
  const outPath = path.join(PROJECT_ROOT, 'src', 'data', 'real-questions', `exam-${year}.ts`)

  // JSON ファイルの存在確認
  if (!existsSync(jsonPath)) {
    err(`reports/corrected-${year}.json が見つかりません`)
    return false
  }

  // JSON 読み込み
  let questions: Question[]
  try {
    questions = JSON.parse(readFileSync(jsonPath, 'utf-8')) as Question[]
  } catch (e) {
    err(`corrected-${year}.json のパースに失敗: ${e}`)
    return false
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    err(`corrected-${year}.json が空または不正なフォーマットです`)
    return false
  }

  // 出力先の存在確認（警告のみ）
  if (!existsSync(outPath)) {
    warn(`exam-${year}.ts が存在しません（新規作成します）: ${outPath}`)
  }

  // TypeScript 生成
  const tsContent = buildExamTs(year, questions)

  if (dryRun) {
    info(`[DRY-RUN] 第${year}回: ${questions.length}問 → ${outPath}`)
    gray(`  先頭50文字: ${tsContent.slice(0, 50).replace(/\n/g, '\\n')}...`)
    return true
  }

  // ファイル書き出し
  writeFileSync(outPath, tsContent, 'utf-8')
  ok(`第${year}回: ${questions.length}問 → src/data/real-questions/exam-${year}.ts`)
  return true
}

// ─────────────────────────────────────────────
// メイン処理
// ─────────────────────────────────────────────

function main() {
  log('')
  log(`${CYAN}=== json-to-exam-ts.ts ===${RESET}`)
  if (dryRun) {
    log(`${YELLOW}[DRY-RUN モード] ファイルへの書き込みは行いません${RESET}`)
  }
  log('')

  const reportsDir = path.join(PROJECT_ROOT, 'reports')

  // 処理対象年度を決定
  let yearsToProcess: number[] = []

  if (targetYear !== null) {
    // 指定年度のみ
    yearsToProcess = [targetYear]
    info(`指定年度: 第${targetYear}回のみ処理`)
  } else {
    // reports/ の corrected-*.json を自動検出
    if (!existsSync(reportsDir)) {
      err(`reports/ ディレクトリが見つかりません: ${reportsDir}`)
      err('先に apply-corrections.ts を実行してください')
      process.exit(1)
    }

    const jsonFiles = readdirSync(reportsDir)
      .filter(f => /^corrected-\d+\.json$/.test(f))
      .sort()

    if (jsonFiles.length === 0) {
      warn('reports/ に corrected-*.json が見つかりません')
      warn('先に apply-corrections.ts を実行してください')
      process.exit(0)
    }

    yearsToProcess = jsonFiles.map(f => parseInt(f.replace('corrected-', '').replace('.json', ''), 10))
    info(`自動検出した年度: ${yearsToProcess.join(', ')}`)
  }

  log('')

  // 各年度を処理
  let successCount = 0
  let failCount = 0

  for (const year of yearsToProcess) {
    const success = processYear(year)
    if (success) successCount++
    else failCount++
  }

  log('')

  if (failCount > 0) {
    err(`${failCount}件の処理に失敗しました`)
  }

  if (successCount > 0) {
    if (dryRun) {
      ok(`[DRY-RUN] ${successCount}件の処理をプレビュー`)
      info('実際に書き出すには --dry-run を外して再実行してください')
    } else {
      ok(`${successCount}件の TypeScript ファイルを再生成しました`)
      log('')
      info('次のステップ:')
      log('  1. npx tsc --noEmit  ← 型チェック')
      log('  2. npm run build     ← ビルド確認')
      log('  3. npm run validate  ← データ品質確認')
      log('  4. git add src/data/real-questions/exam-*.ts && git commit -m "fix: apply corrections"')
    }
  }

  log('')

  if (failCount > 0) process.exit(1)
}

main()
