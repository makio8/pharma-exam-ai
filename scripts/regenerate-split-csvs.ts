/**
 * 分割候補CSVの再生成（改善版）
 * - 質問文から「実際の問い」部分を抽出（シナリオ文を除外）
 * - linked_scenario を別カラムで表示
 * - explanation から医療用語キーワードを抽出
 *
 * Usage: npx tsx scripts/regenerate-split-csvs.ts
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { EXEMPLARS } from '../src/data/exemplars'
import { QUESTION_EXEMPLAR_MAP } from '../src/data/question-exemplar-map'
import { ALL_QUESTIONS } from '../src/data/all-questions'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 分割対象（30問以上の例示）
const SPLIT_TARGETS = [
  'ex-practice-043',
  'ex-practice-045',
  'ex-practice-087',
  'ex-pharmacology-067',
  'ex-practice-074',
  'ex-practice-082',
]

// 質問マーカー（実際の問い部分を示すキーワード）
const QUESTION_MARKERS = [
  'どれか',
  '選べ',
  '正しいの',
  '適切なの',
  '誤っている',
  '理由',
  '記述のうち',
  '正しくないの',
  '不適切なの',
  '正しいものはどれ',
  '間違っている',
  '当てはまる',
  'いくつあるか',
  '組み合わせ',
]

/**
 * 問題文から実際の問い部分を抽出する
 * シナリオ（患者情報など）を除いた「〜はどれか」等の核心部分を返す
 */
function extractQuestionCore(questionText: string, linkedScenario?: string): string {
  if (!questionText) return ''

  // linked_scenario がある場合は、それを除いた部分から抽出する
  let text = questionText.trim()

  // linked_scenario の内容が question_text に含まれていれば除去
  if (linkedScenario) {
    const scenarioTrimmed = linkedScenario.trim().slice(0, 80)
    if (text.startsWith(scenarioTrimmed.slice(0, 30))) {
      // シナリオ部分をスキップ
      const afterScenario = text.slice(linkedScenario.trim().length).trim()
      if (afterScenario.length > 10) {
        text = afterScenario
      }
    }
  }

  // \n\n で段落分割を試みる
  const paragraphs = text.split(/\n\n+/)
  if (paragraphs.length > 1) {
    // 質問マーカーを含む段落を後ろから探す
    for (let i = paragraphs.length - 1; i >= 0; i--) {
      const para = paragraphs[i].trim()
      if (QUESTION_MARKERS.some(marker => para.includes(marker))) {
        return para.slice(0, 120)
      }
    }
  }

  // \n で行分割を試みる
  const lines = text.split(/\n/)
  if (lines.length > 1) {
    // 質問マーカーを含む行を後ろから探す
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim()
      if (line.length > 5 && QUESTION_MARKERS.some(marker => line.includes(marker))) {
        return line.slice(0, 120)
      }
    }
  }

  // マーカーが見つからない場合は先頭120文字を返す
  return text.slice(0, 120)
}

/**
 * explanation から医療用語キーワードを抽出する
 * 【】で囲まれたセクションや重要な医療用語を抽出
 */
function extractExplanationKeywords(explanation: string): string {
  if (!explanation) return ''

  const text = explanation.slice(0, 200)
  const keywords: string[] = []

  // 【ポイント】や【正答の根拠】などのセクションからキーワードを抽出
  const pointMatch = text.match(/【ポイント】([^【]*)/u)
  if (pointMatch) {
    const pointText = pointMatch[1].trim()
    // 括弧内の用語や重要そうな日本語単語を抽出（薬品名・疾患名など）
    const terms = pointText.match(/[ぁ-ん一-龥ァ-ン]{3,10}(?:[ぁ-ん一-龥ァ-ン]|[a-zA-Z]){0,}/g) || []
    keywords.push(...terms.slice(0, 4))
  }

  // 薬剤名・疾患名らしき語（カタカナ5文字以上、または重要そうな漢字語）
  const drugTerms = text.match(/[ァ-ヶー]{4,}/g) || []
  const diseaseTerms = text.match(/[一-龥]{2,6}(?:症|炎|薬|剤|療法|阻害|作用|機能)/g) || []

  keywords.push(...drugTerms.slice(0, 3))
  keywords.push(...diseaseTerms.slice(0, 3))

  // 重複を除いて返す
  const unique = [...new Set(keywords)].slice(0, 6)
  return unique.join(';')
}

/**
 * CSV用に文字列をエスケープする
 * カンマ・改行・ダブルクォートを含む場合はクォートで囲む
 */
function csvEscape(value: string): string {
  if (!value) return ''
  const escaped = value.replace(/"/g, '""')
  if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
    return `"${escaped}"`
  }
  return escaped
}

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

  // CSV出力（改善版カラム）
  const csvHeader = 'questionId,year,section,isPrimary,linked_scenario_excerpt,question_core,question_concepts,explanation_keywords'

  const csvRows = questions.map(q => {
    // linked_scenario の先頭60文字
    const scenarioExcerpt = q.linked_scenario
      ? q.linked_scenario.trim().replace(/\n/g, ' ').slice(0, 60)
      : ''

    // 実際の問い部分を抽出（シナリオを除く、最大120文字）
    const questionCore = extractQuestionCore(q.question_text || '', q.linked_scenario)
      .replace(/\n/g, ' ')

    // question_concepts を ; で結合
    const concepts = (q.question_concepts || []).join(';')

    // explanation から医療用語キーワードを抽出
    const explanationKeywords = extractExplanationKeywords(q.explanation || '')

    return [
      csvEscape(q.id),
      csvEscape(String(q.year)),
      csvEscape(q.section),
      csvEscape(String(q.isPrimary)),
      csvEscape(scenarioExcerpt),
      csvEscape(questionCore),
      csvEscape(concepts),
      csvEscape(explanationKeywords),
    ].join(',')
  })

  const csvPath = path.join(outputDir, `${targetId}.csv`)
  fs.writeFileSync(csvPath, [csvHeader, ...csvRows].join('\n'), 'utf-8')

  // キーワード頻度分析（ログ用）
  const keywordCounts = new Map<string, number>()
  for (const q of questions) {
    const concepts = q.question_concepts || []
    for (const c of concepts) {
      keywordCounts.set(c, (keywordCounts.get(c) || 0) + 1)
    }
  }
  const topKeywords = [...keywordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  console.log(`\n📋 ${targetId} (${exemplar.text.slice(0, 40)}...)`)
  console.log(`   問題数: ${questions.length}`)
  console.log(`   CSV: ${csvPath}`)
  console.log(`   TOP キーワード:`)
  for (const [kw, count] of topKeywords.slice(0, 5)) {
    console.log(`     ${kw}: ${count}回`)
  }

  // サンプル出力（最初の3問）
  console.log(`   サンプル（先頭3問）:`)
  for (const q of questions.slice(0, 3)) {
    const core = extractQuestionCore(q.question_text || '', q.linked_scenario)
    console.log(`     [${q.id}] ${core.slice(0, 60)}...`)
  }
}

console.log(`\n✅ 分割候補CSV（改善版）の再生成完了。`)
console.log(`   出力先: ${outputDir}`)
console.log(`   改善点: シナリオ分離・質問核心部抽出・120文字・医療用語キーワード`)
