/**
 * v3レビュー 🔴致命的NG 15問の修正
 *
 * Category 1: 横軸凡例が見えない（6問）→ ヘッダ80px除去 + 密度トリム(startPct=0.6)
 * Category 2: シナリオ画像を問題に誤配置（6問）→ image_url除去
 * Category 3: その他（3問）→ 個別対応
 *
 * npx tsx scripts/fix-critical-images-v3.ts
 */
import * as fs from 'fs'
import * as path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PAGES_DIR = path.join(__dirname, '..', 'data', 'exam-pages')
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'questions')
const DATA_DIR = path.join(__dirname, '..', 'src', 'data', 'real-questions')

// ============================================================
// 密度ベーストリム（startPct=0.6 で凡例を保持）
// ============================================================
async function densityTrim(imgPath: string, startPct = 0.6): Promise<number> {
  const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  let gapStart = -1
  const startY = Math.floor(height * startPct)

  for (let y = startY; y < height; y++) {
    let nonWhite = 0
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels
      if (data[idx] < 240 || data[idx + 1] < 240 || data[idx + 2] < 240) nonWhite++
    }
    if (nonWhite / width < 0.005) {
      if (gapStart === -1) gapStart = y
      if (y - gapStart >= 30) {
        const newH = gapStart + 40
        if (newH < height - 50) {
          const meta = await sharp(imgPath).metadata()
          const tmp = imgPath + '.tmp.png'
          await sharp(imgPath).extract({ left: 0, top: 0, width: meta.width!, height: newH }).toFile(tmp)
          fs.renameSync(tmp, imgPath)
          console.log(`    密度トリム: ${height} → ${newH}px`)
          return newH
        }
        return height
      }
    } else {
      gapStart = -1
    }
  }
  return height
}

// ============================================================
// Category 1: 横軸凡例が見えない → ヘッダ80px除去のみ、密度トリム(0.6)
// ============================================================
interface ReCropConfig {
  id: string
  year: number
  q: number
  pageImg: string  // e.g. "q101-riron1-02"
}

const category1: ReCropConfig[] = [
  { id: 'r101-091', year: 101, q: 91,  pageImg: 'q101-riron1-02' },
  { id: 'r102-121', year: 102, q: 121, pageImg: 'q102-riron1-24' },
  { id: 'r104-173', year: 104, q: 173, pageImg: 'q104-riron2-17' },
  { id: 'r105-130', year: 105, q: 130, pageImg: 'q105-riron1-39' },
  { id: 'r106-178', year: 106, q: 178, pageImg: 'q106-riron2-21' },
  { id: 'r107-174', year: 107, q: 174, pageImg: 'q107-riron2-17' },
]

async function fixCategory1(cfg: ReCropConfig) {
  const src = path.join(PAGES_DIR, String(cfg.year), cfg.pageImg + '.png')
  if (!fs.existsSync(src)) {
    console.log(`  ${cfg.id}: ソース画像なし (${src})`)
    return
  }

  const meta = await sharp(src).metadata()
  const w = meta.width!
  const h = meta.height!

  // ヘッダ80px除去のみ（フッタは密度トリムに任せる）
  const cropTop = 80
  const cropH = h - cropTop

  const dest = path.join(OUTPUT_DIR, String(cfg.year), `q${String(cfg.q).padStart(3, '0')}.png`)
  await sharp(src)
    .extract({ left: 0, top: cropTop, width: w, height: cropH })
    .toFile(dest + '.tmp')
  fs.renameSync(dest + '.tmp', dest)

  // 密度トリム: startPct=0.6 で横軸凡例を保持
  const finalH = await densityTrim(dest, 0.6)
  const fm = await sharp(dest).metadata()
  console.log(`  ${cfg.id}: ${fm.width}x${fm.height}px (ヘッダ除去+密度トリム0.6) ✅`)
}

// ============================================================
// Category 2: シナリオ画像を問題に誤配置 → image_url除去
// ============================================================
interface RemoveImageConfig {
  id: string
  year: number
  q: number
}

const category2: RemoveImageConfig[] = [
  { id: 'r106-298', year: 106, q: 298 },
  { id: 'r107-238', year: 107, q: 238 },
  { id: 'r108-216', year: 108, q: 216 },
  { id: 'r109-266', year: 109, q: 266 },
  { id: 'r110-222', year: 110, q: 222 },
  { id: 'r110-254', year: 110, q: 254 },
  // Category 3 の r102-218 も image_url 除去
  { id: 'r102-218', year: 102, q: 218 },
]

function removeImageUrl(cfg: RemoveImageConfig) {
  const tsFile = path.join(DATA_DIR, `exam-${cfg.year}.ts`)
  let content = fs.readFileSync(tsFile, 'utf-8')

  // image_url の行を探して削除
  // パターン: "image_url": "/images/questions/{year}/q{NNN}.png" の行（前のカンマ含む）
  const qPad = String(cfg.q).padStart(3, '0')
  const imgPath = `/images/questions/${cfg.year}/q${qPad}.png`

  // 前行のカンマ + 改行 + image_url行 を削除するパターン
  // Case 1: 直前行にカンマがあり、image_url が最後のプロパティ
  const pattern1 = new RegExp(
    `,\\n(\\s*)"image_url":\\s*"${imgPath.replace(/\//g, '\\/')}"`,
    'g'
  )
  // Case 2: image_url行の後にカンマがある場合（image_urlが最後でない場合）
  const pattern2 = new RegExp(
    `\\n(\\s*)"image_url":\\s*"${imgPath.replace(/\//g, '\\/')}"\\s*,`,
    'g'
  )

  const before = content.length
  content = content.replace(pattern1, '')
  if (content.length === before) {
    content = content.replace(pattern2, '')
  }

  if (content.length === before) {
    console.log(`  ${cfg.id}: image_url が見つかりません`)
    return false
  }

  fs.writeFileSync(tsFile, content, 'utf-8')
  console.log(`  ${cfg.id}: image_url 除去 ✅`)

  // 画像ファイルも削除
  const imgFile = path.join(OUTPUT_DIR, String(cfg.year), `q${qPad}.png`)
  if (fs.existsSync(imgFile)) {
    fs.unlinkSync(imgFile)
    console.log(`    画像ファイル削除: q${qPad}.png`)
  }

  return true
}

// ============================================================
// Category 3: r109-140 (2ページ結合) + r109-220 (ページ27使用)
// ============================================================

/** r109-140: 2ページ結合 (page 46 + page 47の上部)
 *  page 46: 装置A/B/Cの図（問題の視覚コンテンツ）
 *  page 47: 表1 測定結果 + 選択肢（表データは解答に必須）
 *  密度トリムはページ1の空白で誤カットするため、ページ別に処理
 */
async function fixR109_140() {
  const dir = path.join(PAGES_DIR, '109')
  const img1 = path.join(dir, 'q109-riron1-46.png')
  const img2 = path.join(dir, 'q109-riron1-47.png')

  if (!fs.existsSync(img1) || !fs.existsSync(img2)) {
    console.log('  r109-140: ページ画像なし')
    return
  }

  const m1 = await sharp(img1).metadata()
  const m2 = await sharp(img2).metadata()

  // ページ1: ヘッダ80px除去のみ → 密度トリムで装置図の下の空白を除去
  const tmpP1 = path.join(OUTPUT_DIR, '109', 'q140_p1.tmp.png')
  await sharp(img1)
    .extract({ left: 0, top: 80, width: m1.width!, height: (m1.height ?? 0) - 160 })
    .toFile(tmpP1)
  await densityTrim(tmpP1, 0.5)

  // ページ2: ヘッダ80px除去 → 密度トリムで選択肢下の空白を除去
  // startPct=0.5 で選択肢（1〜5）をすべて保持
  const tmpP2 = path.join(OUTPUT_DIR, '109', 'q140_p2.tmp.png')
  await sharp(img2)
    .extract({ left: 0, top: 80, width: m2.width!, height: (m2.height ?? 0) - 160 })
    .toFile(tmpP2)
  await densityTrim(tmpP2, 0.5)

  // 2ページを結合
  const bm1 = await sharp(tmpP1).metadata()
  const bm2 = await sharp(tmpP2).metadata()
  const w = Math.min(bm1.width ?? 0, bm2.width ?? 0)
  const b1 = await sharp(tmpP1).resize(w).toBuffer()
  const b2 = await sharp(tmpP2).resize(w).toBuffer()
  const rb1 = await sharp(b1).metadata()
  const rb2 = await sharp(b2).metadata()

  const dest = path.join(OUTPUT_DIR, '109', 'q140.png')
  await sharp({
    create: { width: w, height: (rb1.height ?? 0) + (rb2.height ?? 0), channels: 3, background: { r: 255, g: 255, b: 255 } }
  })
    .composite([
      { input: b1, top: 0, left: 0 },
      { input: b2, top: rb1.height ?? 0, left: 0 }
    ])
    .png().toFile(dest + '.tmp')
  fs.renameSync(dest + '.tmp', dest)

  // 一時ファイル削除
  fs.unlinkSync(tmpP1)
  fs.unlinkSync(tmpP2)

  const fm = await sharp(dest).metadata()
  console.log(`  r109-140: ${fm.width}x${fm.height}px (2p個別トリム+結合) ✅`)
}

/** r109-220: page 27 を使用（問題の図がpage 27にある） */
async function fixR109_220() {
  const src = path.join(PAGES_DIR, '109', 'q109-jissen1-27.png')
  if (!fs.existsSync(src)) {
    console.log('  r109-220: ページ画像なし')
    return
  }

  const meta = await sharp(src).metadata()
  const w = meta.width!
  const h = meta.height!

  // ヘッダ80px除去
  const cropTop = 80
  const cropH = h - cropTop

  const dest = path.join(OUTPUT_DIR, '109', 'q220.png')
  await sharp(src)
    .extract({ left: 0, top: cropTop, width: w, height: cropH })
    .toFile(dest + '.tmp')
  fs.renameSync(dest + '.tmp', dest)

  await densityTrim(dest, 0.6)
  const fm = await sharp(dest).metadata()
  console.log(`  r109-220: ${fm.width}x${fm.height}px (page27+密度トリム) ✅`)
}

// ============================================================
// Main
// ============================================================
async function main() {
  console.log('=== v3レビュー 🔴致命的15問の修正 ===\n')

  // Step 1: Category 2 + r102-218 — image_url 除去（7問）
  console.log('[Category 2 + r102-218] シナリオ画像の誤配置 → image_url 除去')
  for (const cfg of category2) {
    removeImageUrl(cfg)
  }

  // Step 2: Category 1 — 横軸凡例が見えない → 再クロップ（6問）
  console.log('\n[Category 1] 横軸凡例が見えない → ヘッダ除去+密度トリム(0.6)')
  for (const cfg of category1) {
    await fixCategory1(cfg)
  }

  // Step 3: Category 3 — r109-140, r109-220
  console.log('\n[Category 3] その他')
  await fixR109_140()
  await fixR109_220()

  console.log('\n✅ 全15問の修正完了')
}

main().catch(e => { console.error(e); process.exitCode = 1 })
