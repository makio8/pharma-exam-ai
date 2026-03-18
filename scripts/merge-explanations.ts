/**
 * 解説データを exam-{year}.ts にマージするスクリプト
 *
 * explanations-{year}.json の構造化解説テキストを
 * exam-{year}.ts の各問題の explanation フィールドに統合する。
 *
 * ルール:
 *   - 解説テキストが既存の explanation より長い場合のみ上書き
 *   - TypeScript ファイルのヘッダー・フッターを維持
 *   - 110回は最後に処理（並行書き込みの可能性を考慮）
 *
 * 実行: npx tsx scripts/merge-explanations.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '..', 'src', 'data', 'real-questions')

// 100-110回すべて処理（110回は最後に処理）
const years = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110]

interface QuestionObj {
  id: string
  explanation: string
  [key: string]: unknown
}

let grandTotalUpdated = 0
let grandTotalSkipped = 0
let grandTotalNotFound = 0

for (const year of years) {
  console.log(`\n=== 第${year}回 ===`)

  // 1. explanations-{year}.json を読み込み
  const explanationsPath = path.join(dataDir, `explanations-${year}.json`)
  if (!fs.existsSync(explanationsPath)) {
    console.log(`  ⚠ explanations-${year}.json が見つかりません。スキップします。`)
    continue
  }
  const explanations: Record<string, string> = JSON.parse(
    fs.readFileSync(explanationsPath, 'utf-8')
  )
  const explanationKeys = Object.keys(explanations)
  console.log(`  解説JSON: ${explanationKeys.length}件`)

  // 2. exam-{year}.ts を読み込み
  const tsPath = path.join(dataDir, `exam-${year}.ts`)
  const tsContent = fs.readFileSync(tsPath, 'utf-8')

  // ヘッダー部分を抽出（export const ... = の行まで）
  // JSON配列は [ で始まる
  const arrayStartIndex = tsContent.indexOf('[\n')
  if (arrayStartIndex === -1) {
    console.log(`  ⚠ exam-${year}.ts でJSON配列の開始位置が見つかりません。スキップします。`)
    continue
  }

  const header = tsContent.substring(0, arrayStartIndex)

  // JSON配列部分を抽出（最後の ] まで）
  const arrayContent = tsContent.substring(arrayStartIndex).trimEnd()

  // JSON配列をパース
  let questions: QuestionObj[]
  try {
    questions = JSON.parse(arrayContent)
  } catch (e) {
    console.log(`  ⚠ exam-${year}.ts のJSON配列のパースに失敗しました: ${e}`)
    continue
  }

  console.log(`  問題数: ${questions.length}件`)

  // 3. id でインデックスを作成
  const questionMap = new Map<string, QuestionObj>()
  for (const q of questions) {
    questionMap.set(q.id, q)
  }

  // 4. 解説をマージ
  let updated = 0
  let skipped = 0
  let notFound = 0

  for (const [key, explanationText] of Object.entries(explanations)) {
    const question = questionMap.get(key)
    if (!question) {
      notFound++
      continue
    }

    const existing = question.explanation || ''
    const explText = typeof explanationText === 'string' ? explanationText : ''
    if (!explText) { skipped++; continue }
    const isTemplateNew = explText.includes('【ポイント】')
    const isTemplateExisting = existing.includes('【ポイント】')

    // テンプレート構造化解説を常に優先
    // 1. 新がテンプレート & 既存がテンプレートでない → 上書き
    // 2. 両方テンプレート → 長い方を採用
    // 3. 両方テンプレートでない → 長い方を採用
    // 4. 既存がテンプレート & 新がテンプレートでない → スキップ
    if (isTemplateNew && !isTemplateExisting) {
      question.explanation = explText
      updated++
    } else if (isTemplateNew && isTemplateExisting) {
      if (explText.length > existing.length) {
        question.explanation = explText
        updated++
      } else {
        skipped++
      }
    } else if (!isTemplateNew && !isTemplateExisting) {
      if (explText.length > existing.length) {
        question.explanation = explText
        updated++
      } else {
        skipped++
      }
    } else {
      skipped++ // 既存がテンプレート、新がテンプレートでない → スキップ
    }
  }

  console.log(`  更新: ${updated}件`)
  console.log(`  スキップ（既存が長い）: ${skipped}件`)
  if (notFound > 0) {
    console.log(`  マッチしない問題ID: ${notFound}件`)
  }

  grandTotalUpdated += updated
  grandTotalSkipped += skipped
  grandTotalNotFound += notFound

  // 5. exam-{year}.ts を書き戻し
  const newTsContent = header + JSON.stringify(questions, null, 2) + '\n'
  fs.writeFileSync(tsPath, newTsContent, 'utf-8')
  console.log(`  ✓ exam-${year}.ts を書き出しました`)
}

console.log(`\n=== 全体サマリー ===`)
console.log(`更新: ${grandTotalUpdated}件`)
console.log(`スキップ（既存が長い）: ${grandTotalSkipped}件`)
console.log(`マッチしない問題ID: ${grandTotalNotFound}件`)
