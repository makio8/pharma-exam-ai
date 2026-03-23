/**
 * 🔴致命的NG 13問の精密修復 v2
 * - PDF調査結果に基づき、問題ごとに最適なクロップ/結合を実行
 * - ページ結合時: bboxで次の問題の開始Y座標を特定し、正確にクロップ
 * - 全件に密度トリムを適用（余分な空白を除去）
 */
import * as fs from 'fs'
import * as path from 'path'
import sharp from 'sharp'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PAGES_DIR = path.join(__dirname, '..', 'data', 'exam-pages')
const PDF_DIR = path.join(__dirname, '..', 'data', 'pdfs')
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'questions')

function findImg(dir: string, prefix: string, p: number): string | null {
  for (const pad of [2, 3]) {
    const f = path.join(dir, `${prefix}-${String(p).padStart(pad, '0')}.png`)
    if (fs.existsSync(f)) return f
  }
  return null
}

/** bboxでY座標を取得: 「問 N」の開始位置（PDF座標→ピクセル変換済み） */
function findQuestionYPixel(pdfPath: string, page: number, qNum: number): number | null {
  try {
    const bbox = execSync(`pdftotext -bbox -f ${page} -l ${page} "${pdfPath}" -`, {
      encoding: 'utf-8', timeout: 10000
    })
    // 「問」word の後に数字が来るパターン
    const wordRegex = /<word[^>]*yMin="([\d.]+)"[^>]*>問<\/word>\s*<word[^>]*yMin="([\d.]+)"[^>]*>(\d+)<\/word>/g
    let m
    while ((m = wordRegex.exec(bbox)) !== null) {
      if (parseInt(m[3]) === qNum) {
        const yPdf = parseFloat(m[1])
        return Math.round(yPdf * (200 / 72))  // PDF→pixel変換
      }
    }
    // 結合トークン「問N」パターンも試す
    const combinedRegex = /<word[^>]*yMin="([\d.]+)"[^>]*>問(\d+)<\/word>/g
    while ((m = combinedRegex.exec(bbox)) !== null) {
      if (parseInt(m[2]) === qNum) {
        return Math.round(parseFloat(m[1]) * (200 / 72))
      }
    }
  } catch { /* ignore */ }
  return null
}

/** 密度ベーストリム: コンテンツ末端を検出して下部の空白を除去 */
async function densityTrim(imgPath: string): Promise<void> {
  const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const GAP_ROWS = 30
  const DENSITY_THRESHOLD = 0.005
  const PADDING = 40

  let gapStart = -1
  const startY = Math.floor(height * 0.4)

  for (let y = startY; y < height; y++) {
    let nonWhite = 0
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels
      if (data[idx] < 240 || data[idx + 1] < 240 || data[idx + 2] < 240) nonWhite++
    }
    if (nonWhite / width < DENSITY_THRESHOLD) {
      if (gapStart === -1) gapStart = y
      if (y - gapStart >= GAP_ROWS) {
        const newH = gapStart + PADDING
        if (newH < height - 50) {
          const meta = await sharp(imgPath).metadata()
          const tmp = imgPath + '.tmp.png'
          await sharp(imgPath).extract({ left: 0, top: 0, width: meta.width!, height: newH }).toFile(tmp)
          fs.renameSync(tmp, imgPath)
          console.log(`    密度トリム: ${height} → ${newH}px`)
        }
        return
      }
    } else {
      gapStart = -1
    }
  }
}

interface FixConfig {
  id: string
  year: number
  q: number
  type: 'merge' | 'full-page' | 'crop-fix'
  pdf: string
  pages: number[]
  nextQ?: number  // 同ページの次の問題（クロップ境界用）
}

const fixes: FixConfig[] = [
  // ページまたぎ9問（調査で r106-093 と r109-140 も2ページと判明）
  { id: 'r104-220', year: 104, q: 220, type: 'merge', pdf: 'q104-jissen1', pages: [23, 24], nextQ: 221 },
  { id: 'r106-093', year: 106, q: 93,  type: 'merge', pdf: 'q106-riron1',  pages: [4, 5],   nextQ: 94 },
  { id: 'r106-288', year: 106, q: 288, type: 'merge', pdf: 'q106-jissen3', pages: [3, 4],   nextQ: 289 },
  { id: 'r107-238', year: 107, q: 238, type: 'merge', pdf: 'q107-jissen1', pages: [44, 45],  nextQ: 239 },
  { id: 'r108-216', year: 108, q: 216, type: 'merge', pdf: 'q108-jissen1', pages: [22, 23],  nextQ: 217 },
  { id: 'r109-140', year: 109, q: 140, type: 'merge', pdf: 'q109-riron1',  pages: [46, 47],  nextQ: 141 },
  { id: 'r109-220', year: 109, q: 220, type: 'merge', pdf: 'q109-jissen1', pages: [26, 27],  nextQ: 221 },
  { id: 'r110-222', year: 110, q: 222, type: 'merge', pdf: 'q110-jissen1', pages: [28, 29],  nextQ: 223 },
  { id: 'r110-254', year: 110, q: 254, type: 'merge', pdf: 'q110-jissen2', pages: [8, 9],    nextQ: 255 },
  // 単一ページクロップ修正4問
  { id: 'r100-178', year: 100, q: 178, type: 'crop-fix', pdf: 'q100-riron2',  pages: [14], nextQ: 179 },
  { id: 'r102-218', year: 102, q: 218, type: 'full-page', pdf: 'q102-jissen1', pages: [22] },
  { id: 'r106-298', year: 106, q: 298, type: 'full-page', pdf: 'q106-jissen3', pages: [11] },
  { id: 'r109-266', year: 109, q: 266, type: 'crop-fix', pdf: 'q109-jissen2', pages: [21], nextQ: 267 },
]

async function mergePages(fix: FixConfig) {
  const dir = path.join(PAGES_DIR, String(fix.year))
  const pdfPath = path.join(PDF_DIR, fix.pdf + '.pdf')
  const img1 = findImg(dir, fix.pdf, fix.pages[0])
  const img2 = findImg(dir, fix.pdf, fix.pages[1])
  if (!img1 || !img2) { console.log(`  ${fix.id}: ページ画像なし`); return }

  const m1 = await sharp(img1).metadata()
  const m2 = await sharp(img2).metadata()

  // ページ1: ヘッダ(80px)除去、フッタ(80px)除去
  const h1 = (m1.height ?? 0) - 160

  // ページ2: ヘッダ(80px)除去、次の問題のY座標でクロップ
  let h2: number
  if (fix.nextQ) {
    const nextY = findQuestionYPixel(pdfPath, fix.pages[1], fix.nextQ)
    if (nextY) {
      h2 = nextY - 80 - 30  // ヘッダ分引いて、30pxマージン
      console.log(`    ページ2: 問${fix.nextQ}のY=${nextY}px → クロップ高さ=${h2}px`)
    } else {
      h2 = Math.floor((m2.height ?? 0) * 0.5)
      console.log(`    ページ2: bbox検出失敗 → 上半分使用`)
    }
  } else {
    h2 = Math.floor((m2.height ?? 0) * 0.5)
  }
  h2 = Math.max(100, Math.min(h2, (m2.height ?? 0) - 160))

  const w = Math.min(m1.width ?? 0, m2.width ?? 0)
  const b1 = await sharp(img1).extract({ left: 0, top: 80, width: m1.width!, height: h1 }).resize(w).toBuffer()
  const b2 = await sharp(img2).extract({ left: 0, top: 80, width: m2.width!, height: h2 }).resize(w).toBuffer()
  const bm1 = await sharp(b1).metadata()
  const bm2 = await sharp(b2).metadata()

  const dest = path.join(OUTPUT_DIR, String(fix.year), `q${String(fix.q).padStart(3, '0')}.png`)
  await sharp({
    create: { width: w, height: (bm1.height ?? 0) + (bm2.height ?? 0), channels: 3, background: { r: 255, g: 255, b: 255 } }
  })
    .composite([
      { input: b1, top: 0, left: 0 },
      { input: b2, top: bm1.height ?? 0, left: 0 }
    ])
    .png().toFile(dest + '.tmp')
  fs.renameSync(dest + '.tmp', dest)

  // 密度トリムで余分な空白を除去
  await densityTrim(dest)

  const fm = await sharp(dest).metadata()
  console.log(`  ${fix.id}: ${fm.width}x${fm.height}px (2p精密結合) ✅`)
}

async function cropWithBbox(fix: FixConfig) {
  const dir = path.join(PAGES_DIR, String(fix.year))
  const pdfPath = path.join(PDF_DIR, fix.pdf + '.pdf')
  const img = findImg(dir, fix.pdf, fix.pages[0])
  if (!img) { console.log(`  ${fix.id}: ページ画像なし`); return }

  const meta = await sharp(img).metadata()
  let cropBottom: number

  if (fix.nextQ) {
    const nextY = findQuestionYPixel(pdfPath, fix.pages[0], fix.nextQ)
    if (nextY) {
      cropBottom = nextY - 30  // 次の問題の30px上まで
      console.log(`    問${fix.nextQ}のY=${nextY}px → クロップ下端=${cropBottom}px`)
    } else {
      cropBottom = (meta.height ?? 0) - 80
      console.log(`    bbox検出失敗 → フッタ除去のみ`)
    }
  } else {
    cropBottom = (meta.height ?? 0) - 80
  }

  // 問題の開始Y座標も取得（上端のクロップ）
  const startY = findQuestionYPixel(pdfPath, fix.pages[0], fix.q)
  const cropTop = startY ? Math.max(0, startY - 20) : 80

  const h = cropBottom - cropTop
  const dest = path.join(OUTPUT_DIR, String(fix.year), `q${String(fix.q).padStart(3, '0')}.png`)
  await sharp(img)
    .extract({ left: 0, top: cropTop, width: meta.width!, height: Math.max(100, h) })
    .toFile(dest + '.tmp')
  fs.renameSync(dest + '.tmp', dest)

  await densityTrim(dest)

  const fm = await sharp(dest).metadata()
  console.log(`  ${fix.id}: ${fm.width}x${fm.height}px (bbox精密クロップ) ✅`)
}

async function fullPageReplace(fix: FixConfig) {
  const dir = path.join(PAGES_DIR, String(fix.year))
  const img = findImg(dir, fix.pdf, fix.pages[0])
  if (!img) { console.log(`  ${fix.id}: ページ画像なし`); return }

  const meta = await sharp(img).metadata()
  const h = (meta.height ?? 0) - 160  // ヘッダ+フッタ除去
  const dest = path.join(OUTPUT_DIR, String(fix.year), `q${String(fix.q).padStart(3, '0')}.png`)
  await sharp(img)
    .extract({ left: 0, top: 80, width: meta.width!, height: h })
    .toFile(dest + '.tmp')
  fs.renameSync(dest + '.tmp', dest)

  await densityTrim(dest)

  const fm = await sharp(dest).metadata()
  console.log(`  ${fix.id}: ${fm.width}x${fm.height}px (全ページ+密度トリム) ✅`)
}

async function main() {
  console.log('=== 🔴致命的NG 13問 精密修復 v2 ===\n')

  for (const fix of fixes) {
    console.log(`[${fix.id}] type=${fix.type}`)
    switch (fix.type) {
      case 'merge':
        await mergePages(fix)
        break
      case 'crop-fix':
        await cropWithBbox(fix)
        break
      case 'full-page':
        await fullPageReplace(fix)
        break
    }
  }

  console.log('\n✅ 全13問の精密修復完了')
}

main().catch(e => { console.error(e); process.exitCode = 1 })
