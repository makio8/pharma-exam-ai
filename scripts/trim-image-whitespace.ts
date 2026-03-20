// scripts/trim-image-whitespace.ts
/**
 * クロップ済み画像の余白をトリムする
 * - sharp.trim() で白い余白を自動除去
 * - ページ番号領域（「− N −」パターン、下端80px）をカット
 *
 * npx tsx scripts/trim-image-whitespace.ts
 * npx tsx scripts/trim-image-whitespace.ts --year 100
 * npx tsx scripts/trim-image-whitespace.ts --dry-run
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'questions')
const PAGE_NUMBER_STRIP_HEIGHT = 80  // px: ページ番号領域の高さ
const TRIM_THRESHOLD = 20           // 余白と見なす色差しきい値

interface TrimResult {
  file: string
  originalSize: { width: number; height: number }
  trimmedSize: { width: number; height: number }
  savedBytes: number
}

async function trimImage(imgPath: string, dryRun: boolean): Promise<TrimResult | null> {
  const originalMeta = await sharp(imgPath).metadata()
  const origW = originalMeta.width ?? 0
  const origH = originalMeta.height ?? 0
  if (origW === 0 || origH === 0) return null

  // Step 1: ページ番号領域をカット（下端80px）
  const contentHeight = Math.max(100, origH - PAGE_NUMBER_STRIP_HEIGHT)

  // Step 2: 下端カット → バッファ経由で trim（chaining だと sharp v0.34 で extract_area エラーになるため）
  const extractedBuf = await sharp(imgPath)
    .extract({ left: 0, top: 0, width: origW, height: contentHeight })
    .toBuffer()
  const trimmed = sharp(extractedBuf).trim({ threshold: TRIM_THRESHOLD })

  if (dryRun) {
    const info = await trimmed.toBuffer({ resolveWithObject: true })
    return {
      file: path.basename(imgPath),
      originalSize: { width: origW, height: origH },
      trimmedSize: { width: info.info.width, height: info.info.height },
      savedBytes: (origW * origH) - (info.info.width * info.info.height),
    }
  }

  // 上書き保存（tmpに書いてからmv）
  const tmpPath = imgPath + '.tmp.png'
  await trimmed.toFile(tmpPath)
  fs.renameSync(tmpPath, imgPath)

  const newMeta = await sharp(imgPath).metadata()
  return {
    file: path.basename(imgPath),
    originalSize: { width: origW, height: origH },
    trimmedSize: { width: newMeta.width ?? 0, height: newMeta.height ?? 0 },
    savedBytes: 0,
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const yearArg = process.argv.find((_, i) => process.argv[i - 1] === '--year')

  let years: number[]
  if (yearArg) {
    years = [Number(yearArg)]
  } else {
    years = Array.from({ length: 11 }, (_, i) => 100 + i)
  }

  console.log(`${dryRun ? '[DRY RUN] ' : ''}画像余白トリム: 第${years[0]}〜${years[years.length - 1]}回`)

  let totalProcessed = 0
  let totalTrimmed = 0

  for (const year of years) {
    const yearDir = path.join(IMAGES_DIR, String(year))
    if (!fs.existsSync(yearDir)) {
      console.log(`  第${year}回: ディレクトリなし — スキップ`)
      continue
    }

    const files = fs.readdirSync(yearDir).filter(f => f.endsWith('.png')).sort()
    console.log(`\n=== 第${year}回: ${files.length}枚 ===`)

    for (const file of files) {
      const imgPath = path.join(yearDir, file)
      try {
        const result = await trimImage(imgPath, dryRun)
        if (result) {
          totalProcessed++
          const hDiff = result.originalSize.height - result.trimmedSize.height
          if (hDiff > 10) {
            totalTrimmed++
            console.log(`  ✂ ${file}: ${result.originalSize.height}px → ${result.trimmedSize.height}px (−${hDiff}px)`)
          }
        }
      } catch (e) {
        console.error(`  ✗ ${file}: ${(e as Error).message}`)
      }
    }
  }

  console.log(`\n=== サマリー ===`)
  console.log(`処理: ${totalProcessed}枚 / トリム実施: ${totalTrimmed}枚`)
}

main().catch(console.error)
