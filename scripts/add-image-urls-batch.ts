/**
 * public/images/questions/{year}/ の実在画像をスキャンし、
 * exam-{year}.ts に image_url フィールドを追加
 *
 * image-urls-{year}.json は使わない（ファイルスキャン方式）
 *
 * npx tsx scripts/add-image-urls-batch.ts
 * npx tsx scripts/add-image-urls-batch.ts --dry-run
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '..', 'src', 'data', 'real-questions')
const publicDir = path.join(__dirname, '..', 'public', 'images', 'questions')

const years = Array.from({ length: 11 }, (_, i) => 100 + i) // 100-110
const dryRun = process.argv.includes('--dry-run')

let totalAdded = 0
let totalSkipped = 0
let totalWarned = 0

for (const year of years) {
  const tsPath = path.join(dataDir, `exam-${year}.ts`)
  if (!fs.existsSync(tsPath)) {
    console.log(`第${year}回: exam-${year}.ts なし。スキップ`)
    continue
  }

  const tsContent = fs.readFileSync(tsPath, 'utf-8')
  const arrayStart = tsContent.indexOf('[\n')
  if (arrayStart === -1) {
    console.log(`第${year}回: パースに失敗。スキップ`)
    continue
  }
  const header = tsContent.substring(0, arrayStart)
  const questions = JSON.parse(tsContent.substring(arrayStart).trimEnd())

  let added = 0
  let skippedExisting = 0
  let warned = 0

  for (const q of questions) {
    const qNum = String(q.question_number).padStart(3, '0')
    const expectedUrl = `/images/questions/${year}/q${qNum}.png`
    const imgPath = path.join(publicDir, String(year), `q${qNum}.png`)
    const imageExists = fs.existsSync(imgPath)

    // 既存 image_url がある場合
    if (q.image_url) {
      if (q.image_url !== expectedUrl && imageExists) {
        console.warn(`  ⚠ ${q.id}: 既存image_url="${q.image_url}" と生成値"${expectedUrl}"が不一致。スキップ`)
        warned++
      }
      skippedExisting++
      continue  // 上書きしない
    }

    // image_url 未設定 & 画像ファイルが存在する → 設定
    if (imageExists) {
      if (dryRun) {
        console.log(`  [dry-run] ${q.id}: ${expectedUrl}`)
      } else {
        q.image_url = expectedUrl
      }
      added++
    }
  }

  if (!dryRun && added > 0) {
    const newContent = header + JSON.stringify(questions, null, 2) + '\n'
    fs.writeFileSync(tsPath, newContent, 'utf-8')
  }

  console.log(`第${year}回: 新規${added}問 / 既存スキップ${skippedExisting}問 / 警告${warned}件`)
  totalAdded += added
  totalSkipped += skippedExisting
  totalWarned += warned
}

console.log(`\n合計: 新規${totalAdded}問 / 既存スキップ${totalSkipped}問 / 警告${totalWarned}件`)
if (dryRun) console.log('(dry-run: 実際の書き込みは行われていません)')
