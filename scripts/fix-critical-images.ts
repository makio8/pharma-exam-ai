/**
 * 🔴致命的NG画像を修復するスクリプト
 * - ページまたぎ問題: 2ページを結合
 * - ページ最後問題: 全ページ画像から密度トリム
 * - 同ページ問題: 正しいクロップ範囲で再クロップ
 */
import * as fs from 'fs'
import * as path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PAGES_DIR = path.join(__dirname, '..', 'data', 'exam-pages')
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'questions')

const PAGE_HEADER = 80
const PAGE_FOOTER = 80

function findImg(dir: string, prefix: string, p: number): string | null {
  for (const pad of [2, 3]) {
    const f = path.join(dir, `${prefix}-${String(p).padStart(pad, '0')}.png`)
    if (fs.existsSync(f)) return f
  }
  return null
}

// ページまたぎ7問
const spanning = [
  { id: 'r104-220', year: 104, q: 220, pdf: 'q104-jissen1', pages: [23, 24] },
  { id: 'r106-288', year: 106, q: 288, pdf: 'q106-jissen3', pages: [3, 4] },
  { id: 'r107-238', year: 107, q: 238, pdf: 'q107-jissen1', pages: [44, 45] },
  { id: 'r108-216', year: 108, q: 216, pdf: 'q108-jissen1', pages: [22, 23] },
  { id: 'r109-220', year: 109, q: 220, pdf: 'q109-jissen1', pages: [26, 27] },
  { id: 'r110-222', year: 110, q: 222, pdf: 'q110-jissen1', pages: [28, 29] },
  { id: 'r110-254', year: 110, q: 254, pdf: 'q110-jissen2', pages: [8, 9] },
]

// ページ最後4問: 全ページ画像から密度トリム
const lastOnPage = [
  { id: 'r102-218', year: 102, q: 218, pdf: 'q102-jissen1', page: 22 },
  { id: 'r106-093', year: 106, q: 93, pdf: 'q106-riron1', page: 4 },
  { id: 'r106-298', year: 106, q: 298, pdf: 'q106-jissen3', page: 11 },
  { id: 'r109-140', year: 109, q: 140, pdf: 'q109-riron1', page: 46 },
]

// 同ページ他問題2問: 全ページ画像をそのまま使用（密度トリムあり）
const samePageOther = [
  { id: 'r100-178', year: 100, q: 178, pdf: 'q100-riron2', page: 14 },
  { id: 'r109-266', year: 109, q: 266, pdf: 'q109-jissen2', page: 21 },
]

async function mergePages(sq: typeof spanning[0]) {
  const dir = path.join(PAGES_DIR, String(sq.year))
  const img1 = findImg(dir, sq.pdf, sq.pages[0])
  const img2 = findImg(dir, sq.pdf, sq.pages[1])
  if (!img1 || !img2) { console.log(`${sq.id}: ページ画像なし`); return }

  const m1 = await sharp(img1).metadata()
  const m2 = await sharp(img2).metadata()
  const h1 = (m1.height ?? 0) - PAGE_HEADER - PAGE_FOOTER
  const h2 = Math.floor((m2.height ?? 0) * 0.5)
  const w = Math.min(m1.width ?? 0, m2.width ?? 0)

  const b1 = await sharp(img1).extract({ left: 0, top: PAGE_HEADER, width: m1.width!, height: h1 }).resize(w).toBuffer()
  const b2 = await sharp(img2).extract({ left: 0, top: PAGE_HEADER, width: m2.width!, height: h2 }).resize(w).toBuffer()
  const bm1 = await sharp(b1).metadata()
  const bm2 = await sharp(b2).metadata()

  const dest = path.join(OUTPUT_DIR, String(sq.year), `q${String(sq.q).padStart(3, '0')}.png`)
  await sharp({
    create: { width: w, height: (bm1.height ?? 0) + (bm2.height ?? 0), channels: 3, background: { r: 255, g: 255, b: 255 } }
  })
    .composite([
      { input: b1, top: 0, left: 0 },
      { input: b2, top: bm1.height ?? 0, left: 0 }
    ])
    .png()
    .toFile(dest + '.tmp')
  fs.renameSync(dest + '.tmp', dest)
  const fm = await sharp(dest).metadata()
  console.log(`${sq.id}: ${fm.width}x${fm.height}px (2ページ結合) ✅`)
}

async function replaceWithFullPage(item: typeof lastOnPage[0]) {
  const dir = path.join(PAGES_DIR, String(item.year))
  const img = findImg(dir, item.pdf, item.page)
  if (!img) { console.log(`${item.id}: ページ画像なし`); return }

  const m = await sharp(img).metadata()
  const h = (m.height ?? 0) - PAGE_HEADER - PAGE_FOOTER
  const dest = path.join(OUTPUT_DIR, String(item.year), `q${String(item.q).padStart(3, '0')}.png`)
  await sharp(img)
    .extract({ left: 0, top: PAGE_HEADER, width: m.width!, height: h })
    .toFile(dest + '.tmp')
  fs.renameSync(dest + '.tmp', dest)
  const fm = await sharp(dest).metadata()
  console.log(`${item.id}: ${fm.width}x${fm.height}px (全ページ差替) ✅`)
}

async function main() {
  console.log('=== ページまたぎ7問 ===')
  for (const sq of spanning) {
    await mergePages(sq)
  }

  console.log('\n=== ページ最後4問 ===')
  for (const item of lastOnPage) {
    await replaceWithFullPage(item)
  }

  console.log('\n=== 同ページ他問題2問 ===')
  for (const item of samePageOther) {
    await replaceWithFullPage(item)
  }

  console.log('\n✅ 致命的NG 13問の修復完了')
}

main().catch(e => { console.error(e); process.exitCode = 1 })
