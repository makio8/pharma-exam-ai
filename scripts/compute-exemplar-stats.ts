/**
 * ExemplarStats 計算スクリプト（セクション1）
 * Usage: npx tsx scripts/compute-exemplar-stats.ts
 * Options: --csv-only  TS定数を生成せずCSVのみ出力
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { EXEMPLARS } from '../src/data/exemplars'
import { QUESTION_EXEMPLAR_MAP } from '../src/data/question-exemplar-map'
import { ALL_QUESTIONS } from '../src/data/all-questions'
import { computeExemplarStats } from './lib/exemplar-stats-core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// バリデーション（簡易版）
const exemplarIds = new Set(EXEMPLARS.map(e => e.id))
const badRefs = QUESTION_EXEMPLAR_MAP.filter(m => !exemplarIds.has(m.exemplarId))
if (badRefs.length > 0) {
  console.error(`❌ ${badRefs.length}件の不正参照があります。先にvalidate-data-integrity.tsを実行してください。`)
  process.exit(1)
}

// 計算
const stats = computeExemplarStats(EXEMPLARS, QUESTION_EXEMPLAR_MAP, ALL_QUESTIONS)

// ソート: totalQuestions降順
stats.sort((a, b) => b.totalQuestions - a.totalQuestions)

// CSV出力
const csvHeader = 'exemplarId,subject,totalQuestions,primaryQuestions,secondaryQuestions,yearsAppeared,primaryYearsAppeared,linkedGroupCount,avgQuestionsPerYear,yearDetails'
const csvRows = stats.map(s => {
  const yd = s.yearDetails.map(d => `Y${d.year}:${d.count}`).join('|')
  return `${s.exemplarId},${s.subject},${s.totalQuestions},${s.primaryQuestions},${s.secondaryQuestions},${s.yearsAppeared},${s.primaryYearsAppeared},${s.linkedGroupCount},${s.avgQuestionsPerYear},${yd}`
})

// CSV をファイルに出力
const outputDir = path.join(__dirname, 'output')
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
const csvPath = path.join(outputDir, 'exemplar-stats.csv')
fs.writeFileSync(csvPath, [csvHeader, ...csvRows].join('\n'), 'utf-8')
console.log(`📊 CSV出力: ${csvPath}`)

// サマリー
const used = stats.filter(s => s.totalQuestions > 0)
const unused = stats.filter(s => s.totalQuestions === 0)
console.log(`\n📈 サマリー:`)
console.log(`  使用済み例示: ${used.length}件`)
console.log(`  未使用例示: ${unused.length}件`)
console.log(`  TOP5:`)
for (const s of stats.slice(0, 5)) {
  console.log(`    ${s.exemplarId} (${s.subject}): ${s.totalQuestions}問, ${s.yearsAppeared}年度, linked=${s.linkedGroupCount}`)
}

// TS定数生成（--csv-only でなければ）
if (!process.argv.includes('--csv-only')) {
  const tsContent = `// 例示別出題統計（自動生成: compute-exemplar-stats.ts）
// 生成日: ${new Date().toISOString().split('T')[0]}

import type { ExemplarStats } from '../types/blueprint'

export const EXEMPLAR_STATS: ExemplarStats[] = ${JSON.stringify(stats, null, 2)}
`
  const tsPath = path.join(__dirname, '..', 'src', 'data', 'exemplar-stats.ts')
  fs.writeFileSync(tsPath, tsContent, 'utf-8')
  console.log(`\n📝 TS定数出力: ${tsPath}`)
}
