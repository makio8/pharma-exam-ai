// scripts/merge-vision-results.ts
/**
 * Vision抽出結果を exam-{year}.ts にマージする
 *
 * npx tsx scripts/merge-vision-results.ts --dry-run
 * npx tsx scripts/merge-vision-results.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface VisionExtraction {
  question_id: string
  question_text_clean: string
  question_concepts: string[]
  visual_content_type: string
  choices_extractable: boolean
  choices: {
    key: number
    text: string
    semantic_labels: string[]
    choice_type: string
  }[]
  linked_group?: string
  linked_scenario?: string
  confidence: number
  notes?: string
}

function loadExtractions(): VisionExtraction[] {
  // 年度別dedup済みJSONLファイルを全て読み込む
  const outputDir = path.join(__dirname, 'output')
  const allLines: string[] = []
  for (let y = 100; y <= 110; y++) {
    const dedupPath = path.join(outputDir, `vision-extractions-year${y}-dedup.jsonl`)
    if (fs.existsSync(dedupPath)) {
      const yearLines = fs.readFileSync(dedupPath, 'utf-8').trim().split('\n')
      allLines.push(...yearLines)
    }
  }
  if (allLines.length === 0) {
    console.error('エラー: vision-extractions-year*-dedup.jsonl が見つかりません')
    process.exit(1)
  }
  const lines = allLines
  const results: VisionExtraction[] = []
  for (const line of lines) {
    if (!line) continue
    try {
      results.push(JSON.parse(line))
    } catch (e) {
      console.error(`JSON パースエラー: ${line.substring(0, 50)}...`)
    }
  }
  return results
}

function main() {
  const dryRun = process.argv.includes('--dry-run')
  const extractions = loadExtractions()
  console.log(`${dryRun ? '[DRY RUN] ' : ''}読み込み: ${extractions.length}問の抽出結果`)

  // year ごとにグループ化
  const byYear = new Map<number, VisionExtraction[]>()
  for (const ext of extractions) {
    const year = parseInt(ext.question_id.split('-')[0].replace('r', ''))
    if (!byYear.has(year)) byYear.set(year, [])
    byYear.get(year)!.push(ext)
  }

  let totalChoicesRestored = 0
  let totalConceptsAdded = 0
  let totalLowConfidence = 0

  for (const [year, yearExts] of [...byYear].sort((a, b) => a[0] - b[0])) {
    const tsPath = path.join(__dirname, '..', 'src', 'data', 'real-questions', `exam-${year}.ts`)
    if (!fs.existsSync(tsPath)) {
      console.log(`  第${year}回: ファイルなし — スキップ`)
      continue
    }

    const content = fs.readFileSync(tsPath, 'utf-8')
    const arrayStart = content.indexOf('[\n')
    if (arrayStart === -1) continue

    const header = content.substring(0, arrayStart)
    const jsonPart = content.substring(arrayStart).trimEnd()
    let questions: any[]
    try {
      questions = JSON.parse(jsonPart)
    } catch { continue }

    const extMap = new Map(yearExts.map(e => [e.question_id, e]))
    let yearChoicesRestored = 0

    for (const q of questions) {
      const ext = extMap.get(q.id)
      if (!ext) continue

      if (ext.confidence < 0.7) {
        totalLowConfidence++
      }

      // question_text の更新（confidence >= 0.7 のみ）
      if (ext.confidence >= 0.7 && ext.question_text_clean) {
        q.question_text = ext.question_text_clean
      }

      // question_concepts の追加
      if (ext.question_concepts && ext.question_concepts.length > 0) {
        q.question_concepts = ext.question_concepts
        totalConceptsAdded++
      }

      // visual_content_type の追加
      if (ext.visual_content_type) {
        q.visual_content_type = ext.visual_content_type
      }

      // choices の復元（extractable かつ confidence >= 0.7）
      if (ext.choices_extractable && ext.confidence >= 0.7 && ext.choices.length > 0) {
        q.choices = ext.choices.map(c => ({
          key: c.key,
          text: c.text || '',
          semantic_labels: c.semantic_labels,
          choice_type: c.choice_type,
        }))
        yearChoicesRestored++
        totalChoicesRestored++
      } else {
        // 画像問題のまま — semantic_labels だけ付与
        if (ext.choices.length > 0) {
          q.choices = ext.choices.map(c => ({
            key: c.key,
            text: c.text || '',
            semantic_labels: c.semantic_labels,
            choice_type: c.choice_type,
          }))
        }
      }

      // 連問情報
      if (ext.linked_group) q.linked_group = ext.linked_group
      if (ext.linked_scenario) q.linked_scenario = ext.linked_scenario
    }

    console.log(`  第${year}回: ${yearExts.length}問マージ（choices復元: ${yearChoicesRestored}）`)

    if (!dryRun) {
      const newContent = header + JSON.stringify(questions, null, 2) + '\n'
      fs.writeFileSync(tsPath, newContent)
    }
  }

  console.log(`\n=== サマリー ===`)
  console.log(`choices復元: ${totalChoicesRestored}問`)
  console.log(`concepts追加: ${totalConceptsAdded}問`)
  console.log(`低confidence (< 0.7): ${totalLowConfidence}問（要手動レビュー）`)
}

main()
