/**
 * 未使用例示のマッピング漏れ検出（セクション3）
 * Usage: npx tsx scripts/detect-mapping-gaps.ts
 * Options: --threshold=0.3  スコア閾値を変更
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { EXEMPLARS } from '../src/data/exemplars'
import { QUESTION_EXEMPLAR_MAP } from '../src/data/question-exemplar-map'
import { ALL_QUESTIONS } from '../src/data/all-questions'
import { extractKeywords, calculateSimilarity } from './lib/keyword-matcher'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const threshold = parseFloat(process.argv.find(a => a.startsWith('--threshold='))?.split('=')[1] || '0.3')

// 未使用例示を特定
const usedExemplarIds = new Set(QUESTION_EXEMPLAR_MAP.map(m => m.exemplarId))
const unusedExemplars = EXEMPLARS.filter(e => !usedExemplarIds.has(e.id))

console.log(`🔍 未使用例示: ${unusedExemplars.length}件`)
console.log(`🎯 閾値: ${threshold}`)

// 壊れデータのフラグ
const brokenExemplars: string[] = []
for (const e of unusedExemplars) {
  if (e.text.length < 10) {
    brokenExemplars.push(`${e.id}: "${e.text}"`)
  }
  if (e.minorCategory.length < 3 || /[すいうけ]$/.test(e.minorCategory)) {
    brokenExemplars.push(`${e.id}: minorCategory="${e.minorCategory}"（途切れ?）`)
  }
}
if (brokenExemplars.length > 0) {
  console.log(`\n⚠️ 壊れデータの可能性: ${brokenExemplars.length}件`)
  for (const b of brokenExemplars.slice(0, 10)) {
    console.log(`   ${b}`)
  }
}

// 候補ペアを検出
interface CandidatePair {
  exemplarId: string
  exemplarText: string
  questionId: string
  questionText: string
  score: number
  matchedKeywords: string[]
}

const candidates: CandidatePair[] = []

for (const exemplar of unusedExemplars) {
  const keywords = extractKeywords(exemplar.text)
  if (keywords.length === 0) continue

  for (const question of ALL_QUESTIONS) {
    const concepts = question.question_concepts || []
    const semanticLabels = (question.choices || [])
      .flatMap(c => c.semantic_labels || [])

    const result = calculateSimilarity(
      keywords,
      question.question_text || '',
      question.explanation || '',
      concepts,
      semanticLabels,
    )

    if (result.score >= threshold) {
      candidates.push({
        exemplarId: exemplar.id,
        exemplarText: exemplar.text.slice(0, 60),
        questionId: question.id,
        questionText: (question.question_text || '').slice(0, 60),
        score: result.score,
        matchedKeywords: result.matchedKeywords,
      })
    }
  }
}

// スコア降順ソート
candidates.sort((a, b) => b.score - a.score)

// CSV出力
const outputDir = path.join(__dirname, 'output')
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

const csvHeader = 'exemplarId,exemplarText,questionId,questionText,score,matchedKeywords'
const csvRows = candidates.map(c => {
  const eText = c.exemplarText.replace(/,/g, '，')
  const qText = c.questionText.replace(/,/g, '，')
  const keywords = c.matchedKeywords.join(';')
  return `${c.exemplarId},${eText},${c.questionId},${qText},${c.score},${keywords}`
})

const csvPath = path.join(outputDir, 'mapping-gap-candidates.csv')
fs.writeFileSync(csvPath, [csvHeader, ...csvRows].join('\n'), 'utf-8')

console.log(`\n📊 候補ペア: ${candidates.length}件（閾値${threshold}以上）`)
console.log(`📝 CSV出力: ${csvPath}`)

// 例示別サマリー
const byExemplar = new Map<string, number>()
for (const c of candidates) {
  byExemplar.set(c.exemplarId, (byExemplar.get(c.exemplarId) || 0) + 1)
}
console.log(`\n📋 例示別候補数 TOP10:`)
const topExemplars = [...byExemplar.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
for (const [id, count] of topExemplars) {
  console.log(`   ${id}: ${count}件`)
}
