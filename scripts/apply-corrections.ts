#!/usr/bin/env npx tsx
/**
 * 修正反映スクリプト（中間JSON方式）
 *
 * exam-{year}.ts を直接書き換えず、安全な中間JSON方式で修正を適用する。
 * 1. corrections.json を読み込む
 * 2. ALL_QUESTIONS から対象問題を取得
 * 3. dataHash で改ざん検知
 * 4. 修正を適用
 * 5. reports/corrected-{year}.json に書き出す（--dry-run なら書き出しなし）
 *
 * Usage:
 *   npx tsx scripts/apply-corrections.ts              # 実適用
 *   npx tsx scripts/apply-corrections.ts --dry-run    # プレビューのみ
 *   npx tsx scripts/apply-corrections.ts path/to/corrections.json
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Question } from '../src/types/question.js'

// ESM __dirname 相当
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..')

// ─────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────

type CorrectionType =
  | 'text'
  | 'choices'
  | 'answer'
  | 'image-remove'
  | 'image-crop'
  | 'set-section'
  | 'set-subject'
  | 'set-category'
  | 'set-explanation'
  | 'set-tags'
  | 'set-linked-group'
  | 'set-linked-scenario'

interface Correction {
  questionId: string
  type: CorrectionType
  field?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any
  reason?: string
  dataHash: string
}

interface CorrectionsFile {
  reportTimestamp: string
  baseGitCommit: string
  corrections: Correction[]
}

// ─────────────────────────────────────────────
// CLIオプション解析
// ─────────────────────────────────────────────

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const correctionsPath = args.find(a => !a.startsWith('--'))
  ?? path.join(PROJECT_ROOT, 'corrections.json')

// ─────────────────────────────────────────────
// ユーティリティ
// ─────────────────────────────────────────────

const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const CYAN = '\x1b[36m'
const RESET = '\x1b[0m'
const GRAY = '\x1b[90m'

function log(msg: string) { console.log(msg) }
function ok(msg: string) { console.log(`${GREEN}✓${RESET} ${msg}`) }
function warn(msg: string) { console.log(`${YELLOW}⚠${RESET} ${msg}`) }
function err(msg: string) { console.log(`${RED}✗${RESET} ${msg}`) }
function info(msg: string) { console.log(`${CYAN}ℹ${RESET} ${msg}`) }
function gray(msg: string) { console.log(`${GRAY}${msg}${RESET}`) }

/**
 * dataHash 計算 — corrections.json の各エントリと同じアルゴリズム
 */
function computeDataHash(q: Question): string {
  const str = q.question_text + JSON.stringify(q.choices) + JSON.stringify(q.correct_answer)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(36)
}

/**
 * 修正を1件適用する
 */
function applyCorrection(question: Question, correction: Correction): Question {
  const q: Question = { ...question }

  switch (correction.type) {
    case 'text':
      if (correction.field === 'question_text') {
        q.question_text_original = q.question_text  // ロールバック用
        q.question_text = correction.value as string
      } else if (correction.field) {
        // その他のテキストフィールド
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(q as any)[correction.field] = correction.value
      }
      break

    case 'choices':
      q.choices = correction.value as Question['choices']
      break

    case 'answer':
      q.correct_answer = correction.value as number | number[]
      break

    case 'image-remove':
      delete q.image_url
      break

    case 'image-crop':
      // 今回は未実装（PDFクロップは複雑なので将来対応）
      // この分岐には到達しない（事前チェックでスキップ）
      break

    case 'set-section':
      q.section = correction.value as Question['section']
      break

    case 'set-subject':
      q.subject = correction.value as Question['subject']
      break

    case 'set-category':
      q.category = correction.value as string
      break

    case 'set-explanation':
      q.explanation = correction.value as string
      break

    case 'set-tags':
      q.tags = correction.value as string[]
      break

    case 'set-linked-group':
      q.linked_group = correction.value as string
      break

    case 'set-linked-scenario':
      q.linked_scenario = correction.value as string
      break

    default:
      warn(`  未知のcorrection type: ${(correction as Correction).type}`)
  }

  return q
}

// ─────────────────────────────────────────────
// メイン処理
// ─────────────────────────────────────────────

async function main() {
  log('')
  log(`${CYAN}=== apply-corrections.ts ===${RESET}`)
  if (dryRun) {
    log(`${YELLOW}[DRY-RUN モード] ファイルへの書き込みは行いません${RESET}`)
  }
  log('')

  // 1. corrections.json 読み込み
  if (!existsSync(correctionsPath)) {
    err(`corrections.json が見つかりません: ${correctionsPath}`)
    process.exit(1)
  }

  let correctionsFile: CorrectionsFile
  try {
    correctionsFile = JSON.parse(readFileSync(correctionsPath, 'utf-8')) as CorrectionsFile
  } catch (e) {
    err(`corrections.json のパースに失敗: ${e}`)
    process.exit(1)
  }

  const { reportTimestamp, baseGitCommit, corrections } = correctionsFile
  ok(`corrections.json 読み込み: ${corrections.length}件`)
  gray(`  reportTimestamp: ${reportTimestamp}`)
  gray(`  baseGitCommit: ${baseGitCommit}`)
  log('')

  // 2. reportTimestamp の鮮度チェック（30日以上前は警告）
  const reportDate = new Date(reportTimestamp)
  const daysSinceReport = (Date.now() - reportDate.getTime()) / (1000 * 60 * 60 * 24)
  if (isNaN(daysSinceReport)) {
    warn(`reportTimestamp が無効な日付です: ${reportTimestamp}`)
  } else if (daysSinceReport > 30) {
    warn(`corrections.json が古い可能性があります（${Math.floor(daysSinceReport)}日前）`)
  } else {
    ok(`reportTimestamp: ${Math.floor(daysSinceReport)}日前（鮮度OK）`)
  }

  // 3. baseGitCommit の祖先チェック
  try {
    execSync(`git merge-base --is-ancestor ${baseGitCommit} HEAD`, {
      cwd: PROJECT_ROOT,
      stdio: 'ignore',
    })
    ok(`baseGitCommit (${baseGitCommit.slice(0, 8)}) は現在のHEADの祖先です`)
  } catch {
    warn(`baseGitCommit (${baseGitCommit.slice(0, 8)}) が現在のHEADの祖先ではありません`)
    warn('  データが更新されている可能性があります。続行しますが、hashチェックに注意してください。')
  }
  log('')

  // 4. ALL_QUESTIONS を動的 import
  info('問題データを読み込み中...')
  let allQuestions: Question[]
  try {
    const mod = await import(path.join(PROJECT_ROOT, 'src/data/all-questions.ts'))
    allQuestions = (mod.ALL_QUESTIONS ?? mod.default) as Question[]
    ok(`全問題数: ${allQuestions.length}件`)
  } catch (e) {
    err(`all-questions.ts の import に失敗: ${e}`)
    process.exit(1)
  }
  log('')

  // questionId → Question のマップを構築
  const questionMap = new Map<string, Question>(allQuestions.map(q => [q.id, q]))

  // 5. image-crop の事前スキップ確認
  const imageCropItems = corrections.filter(c => c.type === 'image-crop')
  if (imageCropItems.length > 0) {
    warn(`image-crop タイプの修正 ${imageCropItems.length}件 は未実装のためスキップします（将来対応）`)
    for (const c of imageCropItems) {
      gray(`  スキップ: ${c.questionId} (image-crop)`)
    }
    log('')
  }

  // 6. 各問題の dataHash 確認 + 修正適用
  const targetCorrections = corrections.filter(c => c.type !== 'image-crop')

  // 年度別にグループ化
  const byYear = new Map<number, { question: Question; correction: Correction }[]>()

  let hashMismatches = 0
  let notFound = 0
  let applied = 0
  const applyLog: string[] = []

  for (const correction of targetCorrections) {
    const question = questionMap.get(correction.questionId)

    if (!question) {
      err(`問題が見つかりません: ${correction.questionId}`)
      notFound++
      applyLog.push(`NOT_FOUND: ${correction.questionId}`)
      continue
    }

    // dataHash 一致確認
    const currentHash = computeDataHash(question)
    if (currentHash !== correction.dataHash) {
      warn(`dataHash 不一致: ${correction.questionId} (期待: ${correction.dataHash}, 実際: ${currentHash})`)
      warn('  問題データが変更されている可能性があります。この修正をスキップします。')
      hashMismatches++
      applyLog.push(`HASH_MISMATCH: ${correction.questionId} expected=${correction.dataHash} actual=${currentHash}`)
      continue
    }

    // 年度グループに追加
    const year = question.year
    if (!byYear.has(year)) byYear.set(year, [])
    byYear.get(year)!.push({ question, correction })
    applied++
  }

  log('')
  info(`適用対象: ${applied}件 / スキップ(未発見): ${notFound}件 / スキップ(hash不一致): ${hashMismatches}件`)
  log('')

  if (applied === 0) {
    warn('適用対象の修正がありません。終了します。')
    return
  }

  // 7. バックアップ（--dry-run でない場合）
  if (!dryRun) {
    info('バックアップ用 git commit を作成中...')
    try {
      execSync('git add -A && git diff --cached --quiet || git commit -m "wip: pre-correction backup"', {
        cwd: PROJECT_ROOT,
        stdio: 'pipe',
      })
      ok('バックアップ commit 完了')
    } catch {
      gray('  変更なし or git commit 済み（スキップ）')
    }
    log('')
  }

  // 8. 年度別に修正を適用して書き出し
  const reportsDir = path.join(PROJECT_ROOT, 'reports')
  if (!dryRun) {
    mkdirSync(reportsDir, { recursive: true })
  }

  for (const [year, items] of byYear) {
    info(`第${year}回: ${items.length}件の修正を適用中...`)

    // この年度の全問題を取得（修正前の状態）
    const yearQuestions = allQuestions
      .filter(q => q.year === year)
      .map(q => ({ ...q }))  // shallow copy

    // questionId → index マップ
    const indexMap = new Map<string, number>(yearQuestions.map((q, i) => [q.id, i]))

    // 修正を順番に適用
    for (const { question, correction } of items) {
      const idx = indexMap.get(correction.questionId)
      if (idx === undefined) continue

      const before = yearQuestions[idx]
      const after = applyCorrection(before, correction)
      yearQuestions[idx] = after

      const reasonStr = correction.reason ? ` (${correction.reason})` : ''
      if (dryRun) {
        log(`  [DRY-RUN] ${correction.questionId}: ${correction.type}${reasonStr}`)
        if (correction.type === 'text' || correction.type === 'answer') {
          gray(`    Before: ${JSON.stringify(correction.type === 'text' ? before.question_text?.slice(0, 60) : before.correct_answer)}`)
          gray(`    After:  ${JSON.stringify(correction.type === 'text' ? String(correction.value).slice(0, 60) : correction.value)}`)
        }
      } else {
        ok(`  ${correction.questionId}: ${correction.type}${reasonStr}`)
      }
      applyLog.push(`APPLIED: ${correction.questionId} type=${correction.type}${reasonStr}`)
    }

    // 修正後データを JSON で書き出し
    const outPath = path.join(reportsDir, `corrected-${year}.json`)
    if (!dryRun) {
      writeFileSync(outPath, JSON.stringify(yearQuestions, null, 2), 'utf-8')
      ok(`  → reports/corrected-${year}.json に書き出し（${yearQuestions.length}問）`)
    } else {
      info(`  [DRY-RUN] → reports/corrected-${year}.json に書き出すはずの問題数: ${yearQuestions.length}`)
    }
    log('')
  }

  // 9. 適用ログ出力
  const logPath = path.join(reportsDir, 'corrections-applied.log')
  if (!dryRun) {
    mkdirSync(reportsDir, { recursive: true })
    const logContent = [
      `apply-corrections.ts 実行ログ`,
      `実行日時: ${new Date().toISOString()}`,
      `corrections.json: ${correctionsPath}`,
      `dryRun: false`,
      '',
      ...applyLog,
    ].join('\n')
    writeFileSync(logPath, logContent, 'utf-8')
    ok(`適用ログ: reports/corrections-applied.log`)
    log('')
  }

  // 10. npm run validate を自動実行
  if (!dryRun) {
    info('npm run validate を実行中...')
    log('')
    try {
      execSync('npm run validate', {
        cwd: PROJECT_ROOT,
        stdio: 'inherit',
      })
    } catch {
      warn('validate でエラーが検出されました。reports/validation-report.json を確認してください。')
    }
  }

  log('')
  if (dryRun) {
    info(`[DRY-RUN 完了] 実際に適用するには --dry-run を外して再実行してください`)
    info(`  npx tsx scripts/apply-corrections.ts ${correctionsPath !== path.join(PROJECT_ROOT, 'corrections.json') ? correctionsPath : ''}`)
  } else {
    ok(`完了! 次のステップ:`)
    log(`  1. reports/corrected-{year}.json を確認`)
    log(`  2. npx tsx scripts/json-to-exam-ts.ts でTSファイルを再生成`)
    log(`  3. npm run build で型チェック`)
  }
  log('')
}

main().catch(e => {
  err(`予期しないエラー: ${e}`)
  process.exit(1)
})
