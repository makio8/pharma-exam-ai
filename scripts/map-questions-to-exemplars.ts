/**
 * 問題→例示（最小粒度）マッピングスクリプト
 *
 * 各問題を951個の例示に多対多でマッピングする。
 * subject（修正済み）で例示を絞り込み、キーワードマッチでスコアリング。
 * primary（メイン）1つ + sub（サブ）0-2つを割り当て。
 */

import * as fs from 'fs'
import * as path from 'path'

// --- データ読み込み ---

interface ExemplarParsed {
  subject: string
  major: string
  middle: string
  minor: string
  exemplar: string
  exemplar_id: string
}

interface QuestionSummary {
  id: string
  subject: string
  category: string
  tags: string
  text: string
}

interface MappingEntry {
  questionId: string
  exemplarId: string
  isPrimary: boolean
}

// 例示データ読み込み
const exemplarsPath = '/tmp/exemplars-parsed.json'
const exemplars: ExemplarParsed[] = JSON.parse(fs.readFileSync(exemplarsPath, 'utf-8'))
console.log(`例示数: ${exemplars.length}`)

// 科目別に例示をグループ化
const exemplarsBySubject = new Map<string, ExemplarParsed[]>()
for (const e of exemplars) {
  const list = exemplarsBySubject.get(e.subject) || []
  list.push(e)
  exemplarsBySubject.set(e.subject, list)
}

// 問題データ読み込み
const years = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110]
const allQuestions: QuestionSummary[] = []

for (const year of years) {
  const summaryPath = `/tmp/exam-${year}-summary.txt`
  const lines = fs.readFileSync(summaryPath, 'utf-8').trim().split('\n')
  for (const line of lines) {
    const [id, subject, category, tags, ...textParts] = line.split('|')
    allQuestions.push({
      id: id.trim(),
      subject: subject.trim(),
      category: category.trim(),
      tags: tags.trim(),
      text: textParts.join('|').trim(),
    })
  }
}
console.log(`問題数: ${allQuestions.length}`)

// --- 問題のsubjectを修正済みデータから取得 ---
// exam-{year}.ts の修正済みsubjectを使う
const projectRoot = path.resolve(import.meta.dirname || '.', '..')
const correctedSubjects = new Map<string, string>()

for (const year of years) {
  const examPath = path.join(projectRoot, `src/data/real-questions/exam-${year}.ts`)
  const content = fs.readFileSync(examPath, 'utf-8')
  const idRegex = /"id":\s*"(r\d+-\d+)"/g
  let match
  while ((match = idRegex.exec(content)) !== null) {
    const qid = match[1]
    const startIdx = content.lastIndexOf('{', match.index)
    const chunk = content.substring(startIdx, startIdx + 500)
    const subjectMatch = chunk.match(/"subject":\s*"([^"]+)"/)
    if (subjectMatch) {
      correctedSubjects.set(qid, subjectMatch[1])
    }
  }
}
console.log(`修正済みsubject: ${correctedSubjects.size}問`)

// --- キーワード抽出 ---

function extractKeywords(text: string): string[] {
  // 日本語テキストからキーワードを抽出
  // 助詞や一般的な語を除外
  const stopWords = new Set([
    'の', 'に', 'は', 'を', 'が', 'と', 'で', 'て', 'た', 'する', 'される', 'いる',
    'ある', 'れる', 'こと', 'もの', 'よう', 'ため', 'など', 'から', 'まで', 'より',
    'について', 'における', 'として', 'による', 'に関する', 'のうち', 'どれか',
    '正しい', '選べ', '１つ', '２つ', '以下', '次の', '問題', '必須', '理論', '実践',
    'できる', '説明', '概要', '列挙', '記述', '述べる', '例を挙げて',
  ])

  // 専門用語を維持しつつ分割
  const words: string[] = []

  // 長い専門用語パターンを先に抽出
  const technicalPatterns = [
    /[A-Za-z][A-Za-z0-9\-]{2,}/g,  // 英語の専門用語 (DNA, RNA, CYP3A4, etc.)
    /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]{2,}/g,  // 日本語2文字以上の連続
  ]

  for (const pattern of technicalPatterns) {
    let m
    while ((m = pattern.exec(text)) !== null) {
      const word = m[0]
      if (word.length >= 2 && !stopWords.has(word)) {
        words.push(word.toLowerCase())
      }
    }
  }

  return [...new Set(words)]
}

// --- 例示のキーワードインデックス構築 ---

interface ExemplarIndex {
  exemplar: ExemplarParsed
  keywords: string[]
  minorKeywords: string[]  // 小項目名のキーワード
}

const exemplarIndices = new Map<string, ExemplarIndex[]>()

for (const [subject, exList] of exemplarsBySubject) {
  const indices: ExemplarIndex[] = exList.map(e => ({
    exemplar: e,
    keywords: extractKeywords(e.exemplar),
    minorKeywords: extractKeywords(e.minor),
  }))
  exemplarIndices.set(subject, indices)
}

// --- スコアリング ---

function scoreMatch(questionKeywords: string[], exemplarIndex: ExemplarIndex): number {
  let score = 0
  const exKeywords = exemplarIndex.keywords
  const minorKeywords = exemplarIndex.minorKeywords

  for (const qk of questionKeywords) {
    // 例示テキストとの完全一致（高スコア）
    for (const ek of exKeywords) {
      if (qk === ek) {
        score += 3
      } else if (qk.length >= 3 && ek.includes(qk)) {
        score += 2
      } else if (ek.length >= 3 && qk.includes(ek)) {
        score += 1.5
      }
    }

    // 小項目名との一致（中スコア）
    for (const mk of minorKeywords) {
      if (qk === mk) {
        score += 2
      } else if (qk.length >= 3 && mk.includes(qk)) {
        score += 1
      }
    }
  }

  return score
}

// --- メインマッピング ---

const results: MappingEntry[] = []
let primaryCount = 0
let subCount = 0
let noMatchCount = 0

for (const q of allQuestions) {
  // 修正済みsubjectを使用
  const subject = correctedSubjects.get(q.id) || q.subject
  const indices = exemplarIndices.get(subject)

  if (!indices || indices.length === 0) {
    // subjectに対応する例示がない場合
    noMatchCount++
    continue
  }

  // 問題のキーワードを抽出
  const qKeywords = extractKeywords(q.text + ' ' + q.tags + ' ' + q.category)

  // 全例示とのスコアを計算
  const scores = indices.map(idx => ({
    exemplarId: idx.exemplar.exemplar_id,
    score: scoreMatch(qKeywords, idx),
  }))

  // スコア降順ソート
  scores.sort((a, b) => b.score - a.score)

  // Primary: 最高スコアの例示
  if (scores[0] && scores[0].score > 0) {
    results.push({
      questionId: q.id,
      exemplarId: scores[0].exemplarId,
      isPrimary: true,
    })
    primaryCount++

    // Sub: 2番目以降でスコアが一定以上のもの（最大2つ）
    const threshold = scores[0].score * 0.5  // primaryの50%以上
    let subAdded = 0
    for (let i = 1; i < scores.length && subAdded < 2; i++) {
      if (scores[i].score >= threshold && scores[i].score >= 3) {
        results.push({
          questionId: q.id,
          exemplarId: scores[i].exemplarId,
          isPrimary: false,
        })
        subCount++
        subAdded++
      }
    }
  } else {
    // スコア0の場合、その科目の最初の例示をfallbackで割り当て
    results.push({
      questionId: q.id,
      exemplarId: indices[0].exemplar.exemplar_id,
      isPrimary: true,
    })
    primaryCount++
    noMatchCount++
  }
}

// --- 統計出力 ---

console.log('\n=== マッピング結果 ===')
console.log(`Primary: ${primaryCount}問`)
console.log(`Sub: ${subCount}エントリ`)
console.log(`合計エントリ: ${results.length}`)
console.log(`マッチなし（fallback）: ${noMatchCount}問`)
console.log(`平均エントリ/問: ${(results.length / primaryCount).toFixed(2)}`)

// 例示別の問題数分布
const exemplarDist: Record<string, number> = {}
for (const r of results) {
  if (r.isPrimary) {
    exemplarDist[r.exemplarId] = (exemplarDist[r.exemplarId] || 0) + 1
  }
}
const sorted = Object.entries(exemplarDist).sort((a, b) => b[1] - a[1])
console.log('\n例示別問題数（上位20）:')
sorted.slice(0, 20).forEach(([id, count]) => {
  const ex = exemplars.find(e => e.exemplar_id === id)
  console.log(`  ${id}: ${count}問 — ${ex?.exemplar.substring(0, 50)}`)
})

// 0問の例示
const zeroExemplars = exemplars.filter(e => !exemplarDist[e.exemplar_id])
console.log(`\n0問の例示: ${zeroExemplars.length}個 / ${exemplars.length}個`)

// 頻出度プレビュー（例示×年度）
console.log('\n=== 頻出度分析プレビュー（上位10例示） ===')
for (const [exId] of sorted.slice(0, 10)) {
  const ex = exemplars.find(e => e.exemplar_id === exId)
  const questionIds = results.filter(r => r.exemplarId === exId && r.isPrimary).map(r => r.questionId)
  const yearsSet = new Set(questionIds.map(qid => parseInt(qid.match(/r(\d+)/)?.[1] || '0')))
  console.log(`  ${exId}: ${yearsSet.size}/11年度出題, ${questionIds.length}問 — ${ex?.exemplar.substring(0, 40)}`)
}

// --- ファイル出力 ---

// JSON出力
fs.writeFileSync('/tmp/exemplar-mapping-all.json', JSON.stringify(results, null, 2))
console.log('\n出力: /tmp/exemplar-mapping-all.json')

// TypeScript出力
const tsLines = results.map(r =>
  `  { questionId: "${r.questionId}", exemplarId: "${r.exemplarId}", isPrimary: ${r.isPrimary} }`
).join(',\n')

const tsContent = `import type { QuestionExemplarMapping } from '../types/blueprint'

// 問題→例示の多対多マッピング
// 3,749問を951例示にキーワードマッチで分類
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

fs.writeFileSync(
  path.join(projectRoot, 'src/data/question-exemplar-map.ts'),
  tsContent
)
console.log('出力: src/data/question-exemplar-map.ts')
