/**
 * 見開き画像を左右分割
 *
 * Usage:
 *   npx tsx scripts/split-pages.ts --source makio --input /tmp/claude/fusens/pages/
 *   npx tsx scripts/split-pages.ts --source makio --input /tmp/claude/fusens/pages/ --force
 */
import * as fs from 'fs'
import * as path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { parsePageFiles } from './lib/split-pages-core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const args = process.argv.slice(2)
const sourceIdx = args.indexOf('--source')
const inputIdx = args.indexOf('--input')
const force = args.includes('--force')

if (sourceIdx === -1 || inputIdx === -1) {
  console.log('Usage: npx tsx scripts/split-pages.ts --source <name> --input <dir> [--force]')
  process.exit(1)
}

const source = args[sourceIdx + 1]
const inputDir = args[inputIdx + 1]
const outputDir = path.resolve(__dirname, '..', 'public', 'images', 'fusens', 'sources', source)

async function main() {
  fs.mkdirSync(outputDir, { recursive: true })

  const allFiles = fs.readdirSync(inputDir)
  const spreadFiles = parsePageFiles(allFiles)
  console.log(`Found ${spreadFiles.length} spread images`)

  let created = 0
  let skipped = 0

  for (const file of spreadFiles) {
    const num = file.match(/page-(\d+)\.png/)![1]
    const leftName = `page-${num}-left.png`
    const rightName = `page-${num}-right.png`
    const leftPath = path.join(outputDir, leftName)
    const rightPath = path.join(outputDir, rightName)

    if (!force && fs.existsSync(leftPath) && fs.existsSync(rightPath)) {
      skipped++
      continue
    }

    const imgPath = path.join(inputDir, file)
    const meta = await sharp(imgPath).metadata()
    const width = meta.width!
    const height = meta.height!
    const halfWidth = Math.floor(width / 2)

    await sharp(imgPath)
      .extract({ left: 0, top: 0, width: halfWidth, height })
      .toFile(leftPath)

    await sharp(imgPath)
      .extract({ left: halfWidth, top: 0, width: width - halfWidth, height })
      .toFile(rightPath)

    created++
    if (created % 10 === 0) console.log(`  ${created} spreads split...`)
  }

  const metaJson = {
    name: source,
    pdf: `fusen-note-${source}.pdf`,
    totalPages: spreadFiles.length,
    splitImages: spreadFiles.length * 2,
    createdAt: new Date().toISOString(),
  }
  fs.writeFileSync(path.join(outputDir, 'meta.json'), JSON.stringify(metaJson, null, 2))

  console.log(`Done: ${created} split, ${skipped} skipped. Output: ${outputDir}`)
  // TODO: --pdf モード（pdftoppm で PDF→PNG→分割）は残り38ページ分のPNG生成時に追加
}

main().catch(e => { console.error(e); process.exit(1) })
