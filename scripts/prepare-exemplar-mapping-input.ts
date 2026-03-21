/**
 * 例示マッピングAI分類 — 入力データ準備スクリプト
 *
 * 各年度ごとに、エージェントが読めるJSON入力ファイルを生成する。
 * 出力: /tmp/exemplar-input-{year}.json
 *
 * 各ファイルには以下を含む:
 * - questions: 問題ID、問題文、選択肢テキスト、解説、科目
 * - exemplars: 科目でフィルタ済みの例示候補（フル階層付き）
 */

import * as fs from 'fs'
import * as path from 'path'

const projectRoot = path.resolve(import.meta.dirname || '.', '..')
const years = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110]

// --- 科目の問題番号→科目マッピング（公式配分） ---
function getSubjectFromNumber(qNum: number): string {
  // 必須 (1-90)
  if (qNum >= 1 && qNum <= 5) return '物理'
  if (qNum >= 6 && qNum <= 10) return '化学'
  if (qNum >= 11 && qNum <= 15) return '生物'
  if (qNum >= 16 && qNum <= 25) return '衛生'
  if (qNum >= 26 && qNum <= 40) return '薬理'
  if (qNum >= 41 && qNum <= 55) return '薬剤'
  if (qNum >= 56 && qNum <= 70) return '病態・薬物治療'
  if (qNum >= 71 && qNum <= 80) return '法規・制度・倫理'
  if (qNum >= 81 && qNum <= 90) return '実務'
  // 理論 (91-195)
  if (qNum >= 91 && qNum <= 100) return '物理'
  if (qNum >= 101 && qNum <= 110) return '化学'
  if (qNum >= 111 && qNum <= 120) return '生物'
  if (qNum >= 121 && qNum <= 140) return '衛生'
  if (qNum >= 141 && qNum <= 155) return '薬理'
  if (qNum >= 156 && qNum <= 170) return '薬剤'
  if (qNum >= 171 && qNum <= 185) return '病態・薬物治療'
  if (qNum >= 186 && qNum <= 195) return '法規・制度・倫理'
  // 実践 (196-345) — 科目範囲+実務
  if (qNum >= 196 && qNum <= 205) return '物理'
  if (qNum >= 206 && qNum <= 215) return '化学'
  if (qNum >= 216 && qNum <= 225) return '生物'
  if (qNum >= 226 && qNum <= 245) return '衛生'
  if (qNum >= 246 && qNum <= 265) return '薬理'
  if (qNum >= 266 && qNum <= 285) return '薬剤'
  if (qNum >= 286 && qNum <= 305) return '病態・薬物治療'
  if (qNum >= 306 && qNum <= 325) return '法規・制度・倫理'
  if (qNum >= 326 && qNum <= 345) return '実務'
  return '不明'
}

function isPracticeSection(qNum: number): boolean {
  return qNum >= 196 && qNum <= 345
}

// --- 例示データ読み込み ---
interface ExemplarData {
  id: string
  minorCategory: string
  middleCategoryId: string
  subject: string
  text: string
}

const exemplarsPath = path.join(projectRoot, 'src/data/exemplars.ts')
const exemplarsContent = fs.readFileSync(exemplarsPath, 'utf-8')

// TypeScriptファイルからJSONデータを抽出
const exemplars: ExemplarData[] = []
const exemplarRegex = /\{\s*id:\s*'([^']+)',\s*minorCategory:\s*'([^']*)',\s*middleCategoryId:\s*'([^']+)',\s*subject:\s*'([^']+)',\s*text:\s*'([^']+)'\s*\}/g
let match
while ((match = exemplarRegex.exec(exemplarsContent)) !== null) {
  exemplars.push({
    id: match[1],
    minorCategory: match[2],
    middleCategoryId: match[3],
    subject: match[4],
    text: match[5],
  })
}
console.log(`例示数: ${exemplars.length}`)

// 科目別にグループ化
const exemplarsBySubject = new Map<string, ExemplarData[]>()
for (const e of exemplars) {
  const list = exemplarsBySubject.get(e.subject) || []
  list.push(e)
  exemplarsBySubject.set(e.subject, list)
}

// 中項目データ読み込み（階層情報追加用）
const blueprintPath = path.join(projectRoot, 'src/data/exam-blueprint.ts')
const blueprintContent = fs.readFileSync(blueprintPath, 'utf-8')

// 中項目ID→名前のマッピング
const middleCategoryNames = new Map<string, string>()
const mcRegex = /id:\s*'([^']+)',\s*name:\s*'([^']+)'/g
while ((match = mcRegex.exec(blueprintContent)) !== null) {
  middleCategoryNames.set(match[1], match[2])
}

// --- 問題データ読み込み + 解説データ ---
for (const year of years) {
  const examPath = path.join(projectRoot, `src/data/real-questions/exam-${year}.ts`)
  const examContent = fs.readFileSync(examPath, 'utf-8')

  // 解説JSON読み込み
  const explPath = path.join(projectRoot, `src/data/real-questions/explanations-${year}.json`)
  let explanations: Record<string, string> = {}
  if (fs.existsSync(explPath)) {
    const explData = JSON.parse(fs.readFileSync(explPath, 'utf-8'))
    if (Array.isArray(explData)) {
      for (const e of explData) {
        if (e.question_id && e.explanation) {
          explanations[e.question_id] = e.explanation
        }
      }
    }
  }

  // 問題データをパース（正規表現で構造化）
  interface QuestionInput {
    id: string
    question_number: number
    subject: string // 公式配分ベース
    section: string
    question_text: string
    choices_text: string // 選択肢テキスト結合
    explanation: string
    is_practice: boolean
  }

  const questions: QuestionInput[] = []

  // 各問題ブロックを抽出
  const questionBlocks = examContent.split(/\n  \{[\s\n]*"id":/).slice(1)

  for (const block of questionBlocks) {
    const fullBlock = '{"id":' + block
    try {
      // IDを抽出
      const idMatch = fullBlock.match(/"id":\s*"(r\d+-\d+)"/)
      if (!idMatch) continue
      const id = idMatch[1]

      // question_number
      const qnMatch = fullBlock.match(/"question_number":\s*(\d+)/)
      const qNum = qnMatch ? parseInt(qnMatch[1]) : 0

      // section
      const secMatch = fullBlock.match(/"section":\s*"([^"]*)"/)
      const section = secMatch ? secMatch[1] : ''

      // question_text
      const qtMatch = fullBlock.match(/"question_text":\s*"((?:[^"\\]|\\.)*)"/)
      const questionText = qtMatch ? qtMatch[1].replace(/\\n/g, ' ').replace(/\\"/g, '"') : ''

      // choices テキスト結合
      const choicesTexts: string[] = []
      const choiceRegex = /"text":\s*"((?:[^"\\]|\\.)*)"/g
      let cm
      while ((cm = choiceRegex.exec(fullBlock)) !== null) {
        const t = cm[1].replace(/\\n/g, ' ').replace(/\\"/g, '"')
        if (t.length > 0) choicesTexts.push(t)
      }

      // 解説（ファイル内 or JSONから）
      const explMatch = fullBlock.match(/"explanation":\s*"((?:[^"\\]|\\.)*)"/)
      let explanation = ''
      if (explanations[id]) {
        explanation = explanations[id]
      } else if (explMatch) {
        explanation = explMatch[1].replace(/\\n/g, ' ').replace(/\\"/g, '"')
      }

      const subject = getSubjectFromNumber(qNum)
      const isPractice = isPracticeSection(qNum)

      questions.push({
        id,
        question_number: qNum,
        subject,
        section,
        question_text: questionText.substring(0, 500), // トークン節約
        choices_text: choicesTexts.join(' / ').substring(0, 300),
        explanation: explanation.substring(0, 400),
        is_practice: isPractice,
      })
    } catch {
      // パースエラーはスキップ
    }
  }

  // 例示候補の準備（科目→例示リスト）
  // 各問題の科目に対応する例示 + 実践問題は実務の例示も追加
  const subjectsNeeded = new Set<string>()
  for (const q of questions) {
    subjectsNeeded.add(q.subject)
    if (q.is_practice) {
      subjectsNeeded.add('実務')
    }
  }

  const exemplarCandidates: Record<string, Array<{
    id: string
    text: string
    minorCategory: string
    middleCategory: string
    middleCategoryId: string
  }>> = {}

  for (const subj of subjectsNeeded) {
    const exList = exemplarsBySubject.get(subj) || []
    exemplarCandidates[subj] = exList.map(e => ({
      id: e.id,
      text: e.text,
      minorCategory: e.minorCategory,
      middleCategory: middleCategoryNames.get(e.middleCategoryId) || e.middleCategoryId,
      middleCategoryId: e.middleCategoryId,
    }))
  }

  // 出力
  const output = {
    year,
    questionCount: questions.length,
    questions,
    exemplarCandidates,
  }

  const outputPath = `/tmp/exemplar-input-${year}.json`
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))
  console.log(`第${year}回: ${questions.length}問, 科目${subjectsNeeded.size}科目 → ${outputPath}`)
}

console.log('\n✅ 全年度の入力ファイル生成完了')
