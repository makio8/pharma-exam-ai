/**
 * データ品質バリデーター CLIスクリプト
 *
 * Usage: npm run validate
 *   or:  npx tsx scripts/validate-data.ts
 *
 * 出力:
 *   - ターミナル: 色付きサマリー（error/warning/info件数、年度別）
 *   - reports/validation-report.json: 全詳細レポート
 *
 * error > 0 の場合は process.exit(1) で終了
 */

import { execSync } from 'child_process'
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ALL_QUESTIONS } from '../src/data/all-questions'
import { QUESTION_TOPIC_MAP } from '../src/data/question-topic-map'
import { QUESTION_EXEMPLAR_MAP } from '../src/data/question-exemplar-map'
import { EXAM_BLUEPRINT } from '../src/data/exam-blueprint'
import { OFFICIAL_NOTES } from '../src/data/official-notes'
import { runAllRules } from '../src/utils/data-validator/index'
import type { ValidationContext } from '../src/utils/data-validator/types'

// ESM __dirname 相当
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ─────────────────────────────────────────────
// ValidationContext 構築
// ─────────────────────────────────────────────

const blueprintTopicIds = new Set<string>()
for (const bp of EXAM_BLUEPRINT) {
  for (const major of bp.majorCategories) {
    for (const mid of major.middleCategories) {
      blueprintTopicIds.add(mid.id)
    }
  }
}

const context: ValidationContext = {
  topicMap: QUESTION_TOPIC_MAP,
  blueprintTopicIds,
  exemplarQuestionIds: new Set(QUESTION_EXEMPLAR_MAP.map(m => m.questionId)),
  officialNotes: OFFICIAL_NOTES.map(n => ({
    id: n.id,
    linkedQuestionIds: n.linkedQuestionIds,
    topicId: n.topicId,
  })),
  questionIds: new Set(ALL_QUESTIONS.map(q => q.id)),
  imageDir: path.join(__dirname, '..', 'public'),
}

// ─────────────────────────────────────────────
// gitコミット取得
// ─────────────────────────────────────────────

let gitCommit = ''
try {
  gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
} catch {
  gitCommit = 'unknown'
}

// ─────────────────────────────────────────────
// バリデーション実行
// ─────────────────────────────────────────────

console.log('バリデーション実行中...\n')
const report = runAllRules(ALL_QUESTIONS, context)
report.gitCommit = gitCommit

// ─────────────────────────────────────────────
// ターミナル出力（ANSI カラー）
// ─────────────────────────────────────────────

const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const BLUE = '\x1b[34m'
const GREEN = '\x1b[32m'
const BOLD = '\x1b[1m'
const RESET = '\x1b[0m'

console.log(`${BOLD}=== データ品質バリデーション結果 ===${RESET}`)
console.log(`  実行日時: ${report.timestamp}`)
console.log(`  gitコミット: ${report.gitCommit}`)
console.log(`  総問題数: ${report.totalQuestions}`)
console.log(`  正常: ${GREEN}${report.passCount}${RESET}`)
console.log(`  問題あり: ${report.totalQuestions - report.passCount}`)
console.log()

console.log(`${BOLD}--- severity サマリー ---${RESET}`)
console.log(`  ${RED}error  : ${report.summary.error}${RESET}`)
console.log(`  ${YELLOW}warning: ${report.summary.warning}${RESET}`)
console.log(`  ${BLUE}info   : ${report.summary.info}${RESET}`)
console.log()

// ルール別 Top 10
const topRules = Object.entries(report.byRule)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 10)

if (topRules.length > 0) {
  console.log(`${BOLD}--- ルール別件数（Top 10）---${RESET}`)
  for (const [rule, count] of topRules) {
    console.log(`  ${rule.padEnd(35)} ${count}`)
  }
  console.log()
}

// 年度別サマリー
const years = Object.keys(report.byYear)
  .map(Number)
  .sort((a, b) => a - b)

console.log(`${BOLD}--- 年度別サマリー ---${RESET}`)
for (const year of years) {
  const { total, issues } = report.byYear[year]
  const ratio = total > 0 ? ((issues / total) * 100).toFixed(1) : '0.0'
  const color = issues === 0 ? GREEN : issues > 10 ? RED : YELLOW
  console.log(`  第${year}回: 総${total}問  問題あり: ${color}${issues}${RESET} (${ratio}%)`)
}
console.log()

// ─────────────────────────────────────────────
// JSON レポート出力
// ─────────────────────────────────────────────

const reportsDir = path.join(__dirname, '..', 'reports')
mkdirSync(reportsDir, { recursive: true })
const outputPath = path.join(reportsDir, 'validation-report.json')
writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8')
console.log(`レポートを保存しました: ${outputPath}`)
console.log()

// ─────────────────────────────────────────────
// 終了コード
// ─────────────────────────────────────────────

if (report.summary.error > 0) {
  console.log(`${RED}${BOLD}ERROR: ${report.summary.error}件のエラーがあります。${RESET}`)
  process.exit(1)
} else {
  console.log(`${GREEN}${BOLD}すべてのエラーチェックをパスしました。${RESET}`)
}
