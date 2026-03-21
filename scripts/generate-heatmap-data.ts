/**
 * ヒートマップデータ生成（セクション4）
 * - 科目×例示×年度の3次元データ
 * - CSV（探索用）とTS定数（アプリ用）を出力
 *
 * Usage: npx tsx scripts/generate-heatmap-data.ts
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { EXEMPLARS } from '../src/data/exemplars'
import { QUESTION_EXEMPLAR_MAP } from '../src/data/question-exemplar-map'
import { ALL_QUESTIONS } from '../src/data/all-questions'
import type { QuestionSubject } from '../src/types/question'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface HeatmapCell {
  subject: QuestionSubject
  exemplarId: string
  year: number
  count: number
  primaryCount: number
}

// questionId → year のMap
const questionYearMap = new Map<string, number>()
for (const q of ALL_QUESTIONS) {
  questionYearMap.set(q.id, q.year)
}

const exemplarMap = new Map(EXEMPLARS.map(e => [e.id, e]))
const years = [...new Set(ALL_QUESTIONS.map(q => q.year))].sort()

// 集計: exemplarId-year → { count, primaryCount }
const cellMap = new Map<string, { count: number; primaryCount: number }>()

for (const m of QUESTION_EXEMPLAR_MAP) {
  const year = questionYearMap.get(m.questionId)
  if (year === undefined) continue

  const key = `${m.exemplarId}|${year}`
  const cell = cellMap.get(key) || { count: 0, primaryCount: 0 }
  cell.count++
  if (m.isPrimary) cell.primaryCount++
  cellMap.set(key, cell)
}

// HeatmapCell[] に変換
const cells: HeatmapCell[] = []
for (const [key, val] of cellMap) {
  const [exemplarId, yearStr] = key.split('|')
  const exemplar = exemplarMap.get(exemplarId)
  if (!exemplar) continue
  cells.push({
    subject: exemplar.subject,
    exemplarId,
    year: parseInt(yearStr),
    count: val.count,
    primaryCount: val.primaryCount,
  })
}

// CSV 1: 科目×年度
const outputDir = path.join(__dirname, 'output')
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

const subjects = [...new Set(EXEMPLARS.map(e => e.subject))].sort()
const subjectYearHeader = ['subject', ...years.map(y => `Y${y}`)].join(',')
const subjectYearRows = subjects.map(s => {
  const counts = years.map(y => {
    return cells.filter(c => c.subject === s && c.year === y).reduce((sum, c) => sum + c.count, 0)
  })
  return [s, ...counts].join(',')
})
fs.writeFileSync(
  path.join(outputDir, 'heatmap-subject-year.csv'),
  [subjectYearHeader, ...subjectYearRows].join('\n'),
  'utf-8',
)

// CSV 2: 例示×年度
const exemplarYearHeader = ['exemplarId', 'subject', 'text', ...years.map(y => `Y${y}`), 'total'].join(',')
const exemplarYearRows = EXEMPLARS.map(e => {
  const counts = years.map(y => {
    const cell = cells.find(c => c.exemplarId === e.id && c.year === y)
    return cell ? cell.count : 0
  })
  const total = counts.reduce((a, b) => a + b, 0)
  const text = e.text.replace(/,/g, '，').slice(0, 40)
  return [e.id, e.subject, text, ...counts, total].join(',')
})
fs.writeFileSync(
  path.join(outputDir, 'heatmap-exemplar-year.csv'),
  [exemplarYearHeader, ...exemplarYearRows].join('\n'),
  'utf-8',
)

// TS定数
const tsContent = `// ヒートマップデータ（自動生成: generate-heatmap-data.ts）
// 生成日: ${new Date().toISOString().split('T')[0]}
// cells のみ永続化。bySubjectYear / byExemplarYear はランタイムで計算する。

import type { QuestionSubject } from '../types/question'

export interface HeatmapCell {
  subject: QuestionSubject
  exemplarId: string
  year: number
  count: number
  primaryCount: number
}

export const HEATMAP_CELLS: HeatmapCell[] = ${JSON.stringify(cells, null, 2)}
`
const tsPath = path.join(__dirname, '..', 'src', 'data', 'heatmap-data.ts')
fs.writeFileSync(tsPath, tsContent, 'utf-8')

console.log(`📊 ヒートマップデータ生成完了`)
console.log(`   科目×年度CSV: scripts/output/heatmap-subject-year.csv`)
console.log(`   例示×年度CSV: scripts/output/heatmap-exemplar-year.csv`)
console.log(`   TS定数: src/data/heatmap-data.ts`)
console.log(`   セル数: ${cells.length}`)
