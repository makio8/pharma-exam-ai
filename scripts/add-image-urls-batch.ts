/**
 * image-urls-{year}.json のマッピングを exam-{year}.ts に反映
 * 各問題に image_url フィールドを追加
 *
 * npx tsx scripts/add-image-urls-batch.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '..', 'src', 'data', 'real-questions')

const years = [100, 101, 102, 103, 104, 105, 106]

let totalAdded = 0

for (const year of years) {
  const mapPath = path.join(dataDir, `image-urls-${year}.json`)
  if (!fs.existsSync(mapPath)) {
    console.log(`第${year}回: image-urls-${year}.json なし。スキップ`)
    continue
  }

  const imageUrls: Record<string, string> = JSON.parse(fs.readFileSync(mapPath, 'utf-8'))
  const tsPath = path.join(dataDir, `exam-${year}.ts`)
  const tsContent = fs.readFileSync(tsPath, 'utf-8')
  const arrayStart = tsContent.indexOf('[\n')
  const header = tsContent.substring(0, arrayStart)
  const questions = JSON.parse(tsContent.substring(arrayStart).trimEnd())

  let added = 0
  for (const q of questions) {
    const url = imageUrls[q.id]
    if (url) {
      q.image_url = url
      added++
    }
  }

  const newContent = header + JSON.stringify(questions, null, 2) + '\n'
  fs.writeFileSync(tsPath, newContent, 'utf-8')
  console.log(`第${year}回: ${added}問に image_url を追加`)
  totalAdded += added
}

console.log(`\n合計: ${totalAdded}問に image_url を追加`)
