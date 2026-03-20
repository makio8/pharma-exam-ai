/**
 * Vision抽出用に画像をリサイズする（2000px制限回避）
 * 元画像: 1654x2339px → リサイズ後: ~1131x1600px
 *
 * npx tsx scripts/resize-for-vision.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TASKS_PATH = path.join(__dirname, 'output', 'vision-tasks.json')
const OUTPUT_DIR = '/tmp/claude/vision-resized'

async function main() {
  const tasks = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf-8'))
  const uniquePaths: string[] = [...new Set(tasks.map((t: any) => t.page_image_path))] as string[]
  console.log(`リサイズ対象: ${uniquePaths.length} ページ画像`)

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  let done = 0
  let skipped = 0
  let missing = 0

  for (const imgPath of uniquePaths) {
    const outPath = path.join(OUTPUT_DIR, path.basename(imgPath))

    if (fs.existsSync(outPath)) {
      skipped++
      continue
    }

    if (!fs.existsSync(imgPath)) {
      missing++
      continue
    }

    await sharp(imgPath)
      .resize({ height: 1600, withoutEnlargement: true })
      .toFile(outPath)
    done++

    if (done % 100 === 0) console.log(`  ${done} done...`)
  }

  console.log(`\n完了: ${done} リサイズ / ${skipped} スキップ / ${missing} 未発見`)
  console.log(`出力先: ${OUTPUT_DIR}`)

  // サンプル確認
  const sampleFiles = fs.readdirSync(OUTPUT_DIR).slice(0, 1)
  if (sampleFiles.length > 0) {
    const meta = await sharp(path.join(OUTPUT_DIR, sampleFiles[0])).metadata()
    console.log(`サンプル: ${meta.width}x${meta.height}px`)
  }
}

main().catch(console.error)
