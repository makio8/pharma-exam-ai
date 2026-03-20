// scripts/run-vision-extraction.ts
/**
 * Vision抽出のバッチ実行ガイド
 * vision-tasks.json を読み、年度ごとのバッチに分割して表示する
 *
 * npx tsx scripts/run-vision-extraction.ts                # 全体サマリー
 * npx tsx scripts/run-vision-extraction.ts --year 100     # 特定年度のタスク表示
 * npx tsx scripts/run-vision-extraction.ts --status       # 進捗確認
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
  const tasksPath = path.join(__dirname, 'output', 'vision-tasks.json')
  const resultsPath = path.join(__dirname, 'output', 'vision-extractions.jsonl')

  if (!fs.existsSync(tasksPath)) {
    console.error('エラー: vision-tasks.json が見つかりません')
    console.error('先に実行: npx tsx scripts/build-vision-task-list.ts')
    process.exit(1)
  }

  const tasks: VisionTask[] = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'))

  // 完了済みの問題IDを取得
  const completedIds = new Set<string>()
  if (fs.existsSync(resultsPath)) {
    const lines = fs.readFileSync(resultsPath, 'utf-8').trim().split('\n')
    for (const line of lines) {
      if (!line) continue
      try {
        const obj = JSON.parse(line)
        completedIds.add(obj.question_id)
      } catch {}
    }
  }

  const yearArg = process.argv.find((_, i) => process.argv[i - 1] === '--year')
  const showStatus = process.argv.includes('--status')

  // 年度別に集計
  const byYear = new Map<number, VisionTask[]>()
  for (const t of tasks) {
    if (!byYear.has(t.year)) byYear.set(t.year, [])
    byYear.get(t.year)!.push(t)
  }

  if (showStatus) {
    console.log('=== Vision抽出 進捗 ===')
    console.log(`完了: ${completedIds.size} / ${tasks.length}問`)
    console.log('')
    for (const [year, yearTasks] of [...byYear].sort((a, b) => a[0] - b[0])) {
      const done = yearTasks.filter(t => completedIds.has(t.question_id)).length
      const bar = '█'.repeat(Math.round(done / yearTasks.length * 20)).padEnd(20, '░')
      console.log(`  第${year}回: ${bar} ${done}/${yearTasks.length}`)
    }
    return
  }

  if (yearArg) {
    const year = Number(yearArg)
    const yearTasks = byYear.get(year) ?? []
    const remaining = yearTasks.filter(t => !completedIds.has(t.question_id))
    console.log(`第${year}回: 残り${remaining.length}問（完了${yearTasks.length - remaining.length}）`)

    // ページ画像でグループ化
    const byPage = new Map<string, VisionTask[]>()
    for (const t of remaining) {
      if (!byPage.has(t.page_image_path)) byPage.set(t.page_image_path, [])
      byPage.get(t.page_image_path)!.push(t)
    }

    console.log(`\nページ画像: ${byPage.size}枚`)
    for (const [imgPath, pageTasks] of byPage) {
      const qNums = pageTasks.map(t => `問${t.question_number}`).join(', ')
      console.log(`  ${path.basename(imgPath)}: ${qNums}`)
    }
    return
  }

  // デフォルト: 全体サマリー
  console.log('=== Vision抽出 タスク一覧 ===')
  console.log(`全体: ${tasks.length}問 / 完了: ${completedIds.size} / 残り: ${tasks.length - completedIds.size}`)
  console.log('')
  for (const [year, yearTasks] of [...byYear].sort((a, b) => a[0] - b[0])) {
    const done = yearTasks.filter(t => completedIds.has(t.question_id)).length
    console.log(`  第${year}回: ${yearTasks.length}問（完了${done}）`)
  }
  console.log('')
  console.log('使い方:')
  console.log('  npx tsx scripts/run-vision-extraction.ts --year 100   # 年度別タスク確認')
  console.log('  npx tsx scripts/run-vision-extraction.ts --status     # 進捗バー表示')
}

main()
