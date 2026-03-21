/**
 * 例示マッピング結果マージスクリプト
 *
 * 11エージェントの出力（/tmp/exemplar-mapping-{year}.json）を統合し、
 * 品質検証 + question-exemplar-map.ts を生成する。
 */

import * as fs from 'fs'
import * as path from 'path'

const projectRoot = path.resolve(import.meta.dirname || '.', '..')
const years = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110]

interface MappingEntry {
  questionId: string
  exemplarId: string
  isPrimary: boolean
}

// --- 例示IDの有効性チェック用 ---
const exemplarsPath = path.join(projectRoot, 'src/data/exemplars.ts')
const exemplarsContent = fs.readFileSync(exemplarsPath, 'utf-8')
const validExemplarIds = new Set<string>()
const exIdRegex = /id:\s*'(ex-[^']+)'/g
let m
while ((m = exIdRegex.exec(exemplarsContent)) !== null) {
  validExemplarIds.add(m[1])
}
console.log(`有効な例示ID: ${validExemplarIds.size}個`)

// --- 各年度のマッピング結果を読み込み ---
const allMappings: MappingEntry[] = []
const yearStats: { year: number; total: number; primary: number; sub: number; invalid: number; missing: number }[] = []

for (const year of years) {
  const filePath = `/tmp/exemplar-mapping-${year}.json`

  if (!fs.existsSync(filePath)) {
    console.error(`❌ 第${year}回: ファイルなし — ${filePath}`)
    yearStats.push({ year, total: 0, primary: 0, sub: 0, invalid: 0, missing: 0 })
    continue
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const data: MappingEntry[] = JSON.parse(raw)

    let primary = 0
    let sub = 0
    let invalid = 0

    // 問題IDの期待セット（入力ファイルから）
    const inputPath = `/tmp/exemplar-input-${year}.json`
    const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'))
    const expectedIds = new Set<string>(inputData.questions.map((q: { id: string }) => q.id))
    const seenPrimary = new Set<string>()

    for (const entry of data) {
      // exemplarId の存在チェック
      if (!validExemplarIds.has(entry.exemplarId)) {
        invalid++
        continue
      }

      // questionIdフォーマットチェック
      if (!entry.questionId.match(/^r\d+-\d+$/)) {
        invalid++
        continue
      }

      if (entry.isPrimary) {
        primary++
        seenPrimary.add(entry.questionId)
      } else {
        sub++
      }

      allMappings.push(entry)
    }

    // primaryがない問題の数
    const missing = [...expectedIds].filter(id => !seenPrimary.has(id)).length

    yearStats.push({ year, total: data.length, primary, sub, invalid, missing })
    console.log(`✅ 第${year}回: ${primary}問(primary) + ${sub}(sub) = ${primary + sub}エントリ${invalid > 0 ? ` [無効${invalid}]` : ''}${missing > 0 ? ` [未マッピング${missing}問]` : ''}`)
  } catch (err) {
    console.error(`❌ 第${year}回: パースエラー — ${err}`)
    yearStats.push({ year, total: 0, primary: 0, sub: 0, invalid: 0, missing: 0 })
  }
}

// --- 統計レポート ---
console.log('\n=== 統計レポート ===')
const totalPrimary = yearStats.reduce((s, y) => s + y.primary, 0)
const totalSub = yearStats.reduce((s, y) => s + y.sub, 0)
const totalInvalid = yearStats.reduce((s, y) => s + y.invalid, 0)
const totalMissing = yearStats.reduce((s, y) => s + y.missing, 0)
console.log(`Primary: ${totalPrimary}問`)
console.log(`Sub: ${totalSub}エントリ`)
console.log(`合計エントリ: ${allMappings.length}`)
console.log(`無効エントリ（除外済み）: ${totalInvalid}`)
console.log(`未マッピング問題: ${totalMissing}`)
console.log(`平均エントリ/問: ${(allMappings.length / totalPrimary).toFixed(2)}`)

// 例示別の問題数分布
const exemplarDist: Record<string, number> = {}
for (const r of allMappings) {
  if (r.isPrimary) {
    exemplarDist[r.exemplarId] = (exemplarDist[r.exemplarId] || 0) + 1
  }
}
const sorted = Object.entries(exemplarDist).sort((a, b) => b[1] - a[1])

console.log('\n例示別問題数（上位20）:')
// 例示テキストも表示
const exTextRegex = /id:\s*'([^']+)'[^}]*text:\s*'([^']+)'/g
const exTexts = new Map<string, string>()
let em
while ((em = exTextRegex.exec(exemplarsContent)) !== null) {
  exTexts.set(em[1], em[2])
}
sorted.slice(0, 20).forEach(([id, count]) => {
  console.log(`  ${id}: ${count}問 — ${exTexts.get(id)?.substring(0, 50) || '?'}`)
})

// 0問の例示
const usedExemplars = new Set(Object.keys(exemplarDist))
const unusedCount = validExemplarIds.size - usedExemplars.size
console.log(`\n使用された例示: ${usedExemplars.size} / ${validExemplarIds.size}`)
console.log(`未使用の例示: ${unusedCount}`)

// 頻出度プレビュー（例示×年度）
console.log('\n=== 頻出度分析（上位10例示） ===')
for (const [exId] of sorted.slice(0, 10)) {
  const questionIds = allMappings.filter(r => r.exemplarId === exId && r.isPrimary).map(r => r.questionId)
  const yearsSet = new Set(questionIds.map(qid => parseInt(qid.match(/r(\d+)/)?.[1] || '0')))
  console.log(`  ${exId}: ${yearsSet.size}/11年度, ${questionIds.length}問 — ${exTexts.get(exId)?.substring(0, 40) || '?'}`)
}

// --- questionId でソート ---
allMappings.sort((a, b) => {
  if (a.questionId !== b.questionId) return a.questionId.localeCompare(b.questionId)
  // primary を先に
  if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1
  return a.exemplarId.localeCompare(b.exemplarId)
})

// --- TypeScript出力 ---
const tsLines = allMappings.map(r =>
  `  { questionId: "${r.questionId}", exemplarId: "${r.exemplarId}", isPrimary: ${r.isPrimary} }`
).join(',\n')

const tsContent = `import type { QuestionExemplarMapping } from '../types/blueprint'

// 問題→例示の多対多マッピング（AI分類版）
// ${totalPrimary}問を951例示にAI判断で分類（${new Date().toISOString().split('T')[0]}生成）
export const QUESTION_EXEMPLAR_MAP: QuestionExemplarMapping[] = [
${tsLines}
]

// ヘルパー: 問題IDから例示リストを取得
export function getExemplarsForQuestion(questionId: string): QuestionExemplarMapping[] {
  return QUESTION_EXEMPLAR_MAP.filter(m => m.questionId === questionId)
}

// ヘルパー: 例示IDから問題リストを取得
export function getQuestionsForExemplar(exemplarId: string): QuestionExemplarMapping[] {
  return QUESTION_EXEMPLAR_MAP.filter(m => m.exemplarId === exemplarId)
}
`

const outputTsPath = path.join(projectRoot, 'src/data/question-exemplar-map.ts')
fs.writeFileSync(outputTsPath, tsContent)
console.log(`\n📝 出力: ${outputTsPath}`)
console.log(`   エントリ数: ${allMappings.length}`)

// JSON バックアップ
fs.writeFileSync('/tmp/exemplar-mapping-all-ai.json', JSON.stringify(allMappings, null, 2))
console.log('📝 バックアップ: /tmp/exemplar-mapping-all-ai.json')
