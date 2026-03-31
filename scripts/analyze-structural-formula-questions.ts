/**
 * 構造式出題分析スクリプト
 *
 * 過去問4,094問から構造式関連問題を抽出し、以下を集計:
 * 1. 構造式が出題された問題一覧（choice_type/visual_content_type ベース）
 * 2. semantic_labels から物質名を抽出 → 出題頻度ランキング
 * 3. 問題文・解説からの物質名辞書マッチ（補助抽出）
 * 4. 科目別・年度別の出題傾向
 *
 * Usage:
 *   npx tsx scripts/analyze-structural-formula-questions.ts
 *   npx tsx scripts/analyze-structural-formula-questions.ts --json   # JSON出力
 *   npx tsx scripts/analyze-structural-formula-questions.ts --detail  # 問題詳細も出力
 *
 * Output:
 *   reports/structural-formula-analysis.json（--json時）
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import type { Question, Choice, QuestionSubject } from '../src/types/question'

// ESM __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============================
// 1. データ読み込み（動的import）
// ============================
async function loadAllQuestions(): Promise<Question[]> {
  const mod = await import('../src/data/all-questions')
  return mod.ALL_QUESTIONS
}

// ============================
// 2. 構造式関連の ChoiceType
// ============================
const STRUCTURAL_CHOICE_TYPES = new Set([
  'structural_formula',
  'structural_formula_region',
  'structural_formula_pair',
  'chemical_structure',
  'reaction_scheme',
  'reaction_mechanism',
])

// ============================
// 3. 構造式問題の判定
// ============================
interface StructuralQuestion {
  id: string
  year: number
  questionNumber: number
  section: string
  subject: QuestionSubject
  category: string
  questionText: string
  detectionMethod: ('choice_type' | 'visual_content_type' | 'text_pattern')[]
  compoundNames: string[]         // semantic_labels + テキスト抽出
  choiceTypes: string[]           // 検出されたchoice_type一覧
  explanationExcerpt: string      // 解説の先頭200文字
}

function isStructuralQuestion(q: Question): boolean {
  // Method 1: choice_type
  const hasStructuralChoice = q.choices.some(
    c => c.choice_type && STRUCTURAL_CHOICE_TYPES.has(c.choice_type)
  )
  // Method 2: visual_content_type
  const hasStructuralVisual = q.visual_content_type === 'structural_formula'
  // Method 3: question_text に構造式関連キーワード
  const textPatterns = /構造(式|を)|化学構造|化合物[はの]どれ|母核|骨格/
  const hasTextPattern = textPatterns.test(q.question_text)

  return hasStructuralChoice || hasStructuralVisual || hasTextPattern
}

function extractCompoundNames(q: Question): string[] {
  const names = new Set<string>()

  // semantic_labels から抽出（最も信頼性が高い）
  for (const choice of q.choices) {
    if (choice.semantic_labels) {
      for (const label of choice.semantic_labels) {
        names.add(label.trim())
      }
    }
  }

  return [...names]
}

function analyzeQuestion(q: Question): StructuralQuestion {
  const methods: StructuralQuestion['detectionMethod'] = []

  if (q.choices.some(c => c.choice_type && STRUCTURAL_CHOICE_TYPES.has(c.choice_type))) {
    methods.push('choice_type')
  }
  if (q.visual_content_type === 'structural_formula') {
    methods.push('visual_content_type')
  }
  if (/構造(式|を)|化学構造|化合物[はの]どれ|母核|骨格/.test(q.question_text)) {
    methods.push('text_pattern')
  }

  const choiceTypes = [...new Set(
    q.choices
      .filter(c => c.choice_type && STRUCTURAL_CHOICE_TYPES.has(c.choice_type))
      .map(c => c.choice_type!)
  )]

  return {
    id: q.id,
    year: q.year,
    questionNumber: q.question_number,
    section: q.section,
    subject: q.subject,
    category: q.category,
    questionText: q.question_text.substring(0, 150),
    detectionMethod: methods,
    compoundNames: extractCompoundNames(q),
    choiceTypes,
    explanationExcerpt: q.explanation.substring(0, 200),
  }
}

// ============================
// 4. 集計ロジック
// ============================
interface CompoundFrequency {
  name: string
  count: number                  // 出題回数（問題数）
  years: number[]                // 出題年度
  subjects: QuestionSubject[]    // 出題科目
  questionIds: string[]          // 問題ID一覧
}

function aggregateCompounds(questions: StructuralQuestion[]): CompoundFrequency[] {
  const map = new Map<string, CompoundFrequency>()

  for (const q of questions) {
    for (const name of q.compoundNames) {
      const existing = map.get(name)
      if (existing) {
        existing.count++
        if (!existing.years.includes(q.year)) existing.years.push(q.year)
        if (!existing.subjects.includes(q.subject)) existing.subjects.push(q.subject)
        existing.questionIds.push(q.id)
      } else {
        map.set(name, {
          name,
          count: 1,
          years: [q.year],
          subjects: [q.subject],
          questionIds: [q.id],
        })
      }
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count)
}

interface SubjectSummary {
  subject: QuestionSubject
  totalQuestions: number
  uniqueCompounds: number
  topCompounds: string[]
}

function aggregateBySubject(questions: StructuralQuestion[]): SubjectSummary[] {
  const subjectMap = new Map<QuestionSubject, StructuralQuestion[]>()
  for (const q of questions) {
    const list = subjectMap.get(q.subject) ?? []
    list.push(q)
    subjectMap.set(q.subject, list)
  }

  return [...subjectMap.entries()]
    .map(([subject, qs]) => {
      const compounds = aggregateCompounds(qs)
      return {
        subject,
        totalQuestions: qs.length,
        uniqueCompounds: compounds.length,
        topCompounds: compounds.slice(0, 5).map(c => `${c.name}(${c.count})`),
      }
    })
    .sort((a, b) => b.totalQuestions - a.totalQuestions)
}

interface YearSummary {
  year: number
  totalQuestions: number
  byChoiceType: number
  byVisualContent: number
  byTextPattern: number
}

function aggregateByYear(questions: StructuralQuestion[]): YearSummary[] {
  const yearMap = new Map<number, StructuralQuestion[]>()
  for (const q of questions) {
    const list = yearMap.get(q.year) ?? []
    list.push(q)
    yearMap.set(q.year, list)
  }

  return [...yearMap.entries()]
    .map(([year, qs]) => ({
      year,
      totalQuestions: qs.length,
      byChoiceType: qs.filter(q => q.detectionMethod.includes('choice_type')).length,
      byVisualContent: qs.filter(q => q.detectionMethod.includes('visual_content_type')).length,
      byTextPattern: qs.filter(q => q.detectionMethod.includes('text_pattern')).length,
    }))
    .sort((a, b) => a.year - b.year)
}

// ============================
// 5. レポート出力
// ============================
interface AnalysisReport {
  summary: {
    totalQuestions: number
    structuralQuestions: number
    percentage: string
    uniqueCompounds: number
    compoundsWithSemLabels: number
  }
  byYear: YearSummary[]
  bySubject: SubjectSummary[]
  compoundRanking: CompoundFrequency[]
  questions: StructuralQuestion[]
}

function printReport(report: AnalysisReport, showDetail: boolean): void {
  console.log('=== 構造式出題分析レポート ===\n')

  // サマリー
  const s = report.summary
  console.log(`全問題数: ${s.totalQuestions}`)
  console.log(`構造式関連問題: ${s.structuralQuestions} (${s.percentage})`)
  console.log(`ユニーク化合物名: ${s.uniqueCompounds}`)
  console.log(`semantic_labelsあり問題: ${s.compoundsWithSemLabels}`)

  // 年度別
  console.log('\n--- 年度別 ---')
  console.log('年度\t問題数\tchoice_type\tvisual\ttext_pattern')
  for (const y of report.byYear) {
    console.log(`${y.year}\t${y.totalQuestions}\t${y.byChoiceType}\t\t${y.byVisualContent}\t${y.byTextPattern}`)
  }

  // 科目別
  console.log('\n--- 科目別 ---')
  for (const s of report.bySubject) {
    console.log(`${s.subject}: ${s.totalQuestions}問, ${s.uniqueCompounds}化合物`)
    console.log(`  TOP: ${s.topCompounds.join(', ')}`)
  }

  // 化合物ランキング TOP50
  console.log('\n--- 化合物 出題頻度ランキング TOP50 ---')
  console.log('順位\t回数\t年度数\t化合物名\t\t\t科目')
  const top = report.compoundRanking.slice(0, 50)
  top.forEach((c, i) => {
    const nameCol = c.name.padEnd(20, '　')
    console.log(`${i + 1}\t${c.count}\t${c.years.length}年\t${nameCol}\t${c.subjects.join(',')}`)
  })

  // 出題2回以上の化合物数
  const freq2plus = report.compoundRanking.filter(c => c.count >= 2).length
  const freq3plus = report.compoundRanking.filter(c => c.count >= 3).length
  const freq5plus = report.compoundRanking.filter(c => c.count >= 5).length
  console.log(`\n出題2回以上: ${freq2plus}化合物`)
  console.log(`出題3回以上: ${freq3plus}化合物`)
  console.log(`出題5回以上: ${freq5plus}化合物`)

  // 詳細
  if (showDetail) {
    console.log('\n--- 全構造式問題一覧 ---')
    for (const q of report.questions) {
      console.log(`\n[${q.id}] ${q.subject} ${q.section}`)
      console.log(`  ${q.questionText}`)
      console.log(`  検出: ${q.detectionMethod.join(', ')}`)
      if (q.compoundNames.length > 0) {
        console.log(`  化合物: ${q.compoundNames.join(', ')}`)
      }
    }
  }
}

// ============================
// Main
// ============================
async function main() {
  const args = process.argv.slice(2)
  const jsonOutput = args.includes('--json')
  const showDetail = args.includes('--detail')

  console.log('Loading questions...')
  const allQuestions = await loadAllQuestions()
  console.log(`Loaded ${allQuestions.length} questions`)

  // 構造式問題の抽出
  const structuralQuestions = allQuestions
    .filter(isStructuralQuestion)
    .map(analyzeQuestion)

  // 集計
  const compoundRanking = aggregateCompounds(structuralQuestions)
  const bySubject = aggregateBySubject(structuralQuestions)
  const byYear = aggregateByYear(structuralQuestions)

  const questionsWithLabels = structuralQuestions.filter(q => q.compoundNames.length > 0)

  const report: AnalysisReport = {
    summary: {
      totalQuestions: allQuestions.length,
      structuralQuestions: structuralQuestions.length,
      percentage: `${((structuralQuestions.length / allQuestions.length) * 100).toFixed(1)}%`,
      uniqueCompounds: compoundRanking.length,
      compoundsWithSemLabels: questionsWithLabels.length,
    },
    byYear,
    bySubject,
    compoundRanking,
    questions: structuralQuestions,
  }

  // 出力
  if (jsonOutput) {
    const reportsDir = path.join(__dirname, '..', 'reports')
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true })
    const outPath = path.join(reportsDir, 'structural-formula-analysis.json')
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n')
    console.log(`JSON saved to: ${outPath}`)
  }

  printReport(report, showDetail)
}

main().catch(console.error)
