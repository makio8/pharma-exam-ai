import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXAM_DIR = path.join(__dirname, '../src/data/real-questions')

for (let year = 100; year <= 111; year++) {
  const filePath = path.join(EXAM_DIR, `exam-${year}.ts`)
  if (!fs.existsSync(filePath)) continue

  let content = fs.readFileSync(filePath, 'utf-8')
  const original = content

  // Fix "key": "1" → "key": 1 (string number to actual number)
  content = content.replace(/"key":\s*"(\d+)"/g, '"key": $1')

  if (content !== original) {
    const count = (original.match(/"key":\s*"\d+"/g) || []).length
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`exam-${year}.ts: ${count} string keys fixed`)
  } else {
    console.log(`exam-${year}.ts: no string keys found`)
  }
}
