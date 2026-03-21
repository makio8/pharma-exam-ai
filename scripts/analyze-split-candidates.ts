/**
 * 粗い例示の分割候補分析（セクション2）
 * - 30問以上の例示6件を対象
 * - 問題文+解説+conceptsからキーワードを抽出してクラスタ案を生成
 * - 例示ごとにCSV出力（人間レビュー用）
 *
 * Usage: npx tsx scripts/analyze-split-candidates.ts
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { EXEMPLARS } from '../src/data/exemplars'
import { QUESTION_EXEMPLAR_MAP } from '../src/data/question-exemplar-map'
import { ALL_QUESTIONS } from '../src/data/all-questions'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 分割対象（30問以上）
const SPLIT_TARGETS = [
  'ex-practice-043',
  'ex-practice-045',
  'ex-practice-087',
  'ex-pharmacology-067',
  'ex-practice-074',
  'ex-practice-082',
]

const questionMap = new Map(ALL_QUESTIONS.map(q => [q.id, q]))
const outputDir = path.join(__dirname, 'output', 'split-candidates')
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

for (const targetId of SPLIT_TARGETS) {
  const exemplar = EXEMPLARS.find(e => e.id === targetId)
  if (!exemplar) {
    console.error(`❌ ${targetId} が見つかりません`)
    continue
  }

  // この例示にマッピングされた問題を取得
  const mappings = QUESTION_EXEMPLAR_MAP.filter(m => m.exemplarId === targetId)
  const questions = mappings
    .map(m => {
      const q = questionMap.get(m.questionId)
      return q ? { ...q, isPrimary: m.isPrimary } : null
    })
    .filter((q): q is NonNullable<typeof q> => q !== null)
    .sort((a, b) => a.year - b.year || a.question_number - b.question_number)

  // CSV出力: questionId, year, section, question_text(先頭100文字), concepts, explanation(先頭100文字)
  const csvHeader = 'questionId,year,section,isPrimary,question_text,question_concepts,explanation_excerpt'
  const csvRows = questions.map(q => {
    const text = (q.question_text || '').replace(/,/g, '，').replace(/\n/g, ' ').slice(0, 100)
    const concepts = (q.question_concepts || []).join(';')
    const explanation = (q.explanation || '').replace(/,/g, '，').replace(/\n/g, ' ').slice(0, 100)
    return `${q.id},${q.year},${q.section},${q.isPrimary},${text},${concepts},${explanation}`
  })

  const csvPath = path.join(outputDir, `${targetId}.csv`)
  fs.writeFileSync(csvPath, [csvHeader, ...csvRows].join('\n'), 'utf-8')

  // キーワード頻度分析
  const keywordCounts = new Map<string, number>()
  for (const q of questions) {
    const concepts = q.question_concepts || []
    for (const c of concepts) {
      keywordCounts.set(c, (keywordCounts.get(c) || 0) + 1)
    }
  }
  const topKeywords = [...keywordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)

  console.log(`\n📋 ${targetId} (${exemplar.text.slice(0, 40)}...)`)
  console.log(`   問題数: ${questions.length}`)
  console.log(`   CSV: ${csvPath}`)
  console.log(`   TOP キーワード:`)
  for (const [kw, count] of topKeywords.slice(0, 10)) {
    console.log(`     ${kw}: ${count}回`)
  }
}

console.log(`\n✅ 分割候補分析完了。${outputDir} のCSVを確認してください。`)
console.log(`   レビュー後に分割提案を作成します。`)
