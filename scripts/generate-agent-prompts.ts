/**
 * Vision抽出用のAgent プロンプトをバッチごとに生成する
 * npx tsx scripts/generate-agent-prompts.ts --year 101
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface VisionTask {
  question_id: string
  year: number
  question_number: number
  page_image_path: string
  page_questions: number[]
}

function main() {
  const yearArg = process.argv.find((_, i) => process.argv[i - 1] === '--year')
  if (!yearArg) {
    console.error('Usage: npx tsx scripts/generate-agent-prompts.ts --year 101')
    process.exit(1)
  }
  const year = Number(yearArg)

  const tasks: VisionTask[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'output', 'vision-tasks.json'), 'utf-8')
  )
  const yearTasks = tasks.filter(t => t.year === year)

  // Group by page
  const byPage = new Map<string, VisionTask[]>()
  for (const t of yearTasks) {
    if (!byPage.has(t.page_image_path)) byPage.set(t.page_image_path, [])
    byPage.get(t.page_image_path)!.push(t)
  }

  const pages = [...byPage.entries()]
  const batchSizeArg = process.argv.find((_, i) => process.argv[i - 1] === '--batch-size')
  const batchSize = batchSizeArg ? Number(batchSizeArg) : 15
  const numBatches = Math.ceil(pages.length / batchSize)

  const outputDir = path.join(__dirname, 'output', 'agent-prompts')
  fs.mkdirSync(outputDir, { recursive: true })

  for (let i = 0; i < numBatches; i++) {
    const batch = pages.slice(i * batchSize, (i + 1) * batchSize)
    const pageList = batch.map(([imgPath, tasks], idx) => {
      const qList = tasks.map(t => `問${t.question_number} (${t.question_id})`).join(', ')
      return `${idx + 1}. ${imgPath} → ${qList}`
    }).join('\n')

    const qCount = batch.reduce((s, [, ts]) => s + ts.length, 0)

    const prompt = `薬剤師国家試験の画像問題からメタデータを抽出してください。

## 重要: 画像は1枚ずつReadすること

## 処理対象（${batch.length}ページ、${qCount}問）

${pageList}

## JSON形式（1行1問）
{"question_id":"r${year}-XXX","question_text_clean":"問題文","question_concepts":["概念"],"visual_content_type":"type","choices_extractable":bool,"choices":[{"key":1,"text":"テキスト or 空文字","semantic_labels":["ラベル"],"choice_type":"type"}],"linked_group":null,"linked_scenario":null,"confidence":0.9,"notes":null}

### ルール
- question_text_clean: 「問 N」除外
- semantic_labels: 必ず1-3個。構造式→化合物名、テキスト→キーワード
- choices_extractable: テキスト化可能なら true
- visual_content_type: structural_formula/graph/table/diagram/prescription/text_only/mixed
- 連問: 「問 N-M」→linked_group:"r${year}-N-M"、シナリオ→linked_scenario

## 出力: /Users/ai/projects/personal/pharma-exam-ai/scripts/output/vision-extractions-${year}-b${i + 1}.jsonl`

    const promptPath = path.join(outputDir, `year${year}-batch${i + 1}.txt`)
    fs.writeFileSync(promptPath, prompt)
  }

  console.log(`${year}回: ${numBatches}バッチのプロンプトを生成`)
  console.log(`出力: ${outputDir}/year${year}-batch*.txt`)
}

main()
