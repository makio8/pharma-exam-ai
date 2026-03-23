/**
 * v3レビュー結果に基づく一括修正
 * 🔴致命的15問 + 🟡改善の選択肢混入27問
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
const DATA_DIR = path.join(__dirname, '..', 'src', 'data', 'real-questions')

function findImg(dir: string, prefix: string, p: number): string | null {
  for (const pad of [2, 3]) {
    const f = path.join(dir, `${prefix}-${String(p).padStart(pad, '0')}.png`)
    if (fs.existsSync(f)) return f
  }
  return null
}

function getPdfSection(qnum: number): string {
  if (qnum <= 90) return 'hissu'
  if (qnum <= 150) return 'riron1'
  if (qnum <= 195) return 'riron2'
  if (qnum <= 245) return 'jissen1'
  if (qnum <= 285) return 'jissen2'
  return 'jissen3'
}

function findQuestionPage(pdfPath: string, qnum: number): number | null {
  try {
    const pageCount = parseInt(
      execSync(`pdfinfo "${pdfPath}" 2>/dev/null`, { encoding: 'utf-8' })
        .match(/Pages:\s+(\d+)/)?.[1] || '0'
    )
    for (let p = 1; p <= pageCount; p++) {
      const text = execSync(
        `pdftotext -f ${p} -l ${p} -layout "${pdfPath}" - 2>/dev/null`,
        { encoding: 'utf-8', timeout: 5000 }
      )
      const regex = new RegExp(`問\\s*${qnum}\\b`)
      if (regex.test(text)) return p
    }
  } catch { /* ignore */ }
  return null
}

/** 密度トリム: startPctから下をスキャン */
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
          return newH
        }
        return height
      }
    } else { gapStart = -1 }
  }
  return height
}

/** bboxで選択肢開始位置を検出 */
function findChoicesStartY(pdfPath: string, page: number): number | null {
  try {
    const bbox = execSync(
      `pdftotext -bbox -f ${page} -l ${page} "${pdfPath}" -`,
      { encoding: 'utf-8', timeout: 10000 }
    )
    // 選択肢パターン: 「1」で始まる行（yMin座標を取得）
    // 問題の選択肢は通常「1  テキスト」「2  テキスト」の形式
    const lines: { y: number; text: string }[] = []
    const wordRegex = /<word[^>]*yMin="([\d.]+)"[^>]*>(.*?)<\/word>/g
    let m
    while ((m = wordRegex.exec(bbox)) !== null) {
      lines.push({ y: parseFloat(m[1]), text: m[2] })
    }
    // 「1」で始まり、近くに「2」「3」が続くパターンを探す
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].text === '1' || lines[i].text === '１') {
        // 次の数行に2,3があるか確認
        const nearby = lines.slice(i + 1, i + 20)
        const has2 = nearby.some(l => l.text === '2' || l.text === '２')
        const has3 = nearby.some(l => l.text === '3' || l.text === '３')
        if (has2 && has3) {
          return Math.round(lines[i].y * (200 / 72)) // PDF→pixel変換
        }
      }
    }
  } catch { /* ignore */ }
  return null
}

/** exam-{year}.tsからimage_urlを除去 */
function removeImageUrl(id: string): void {
  const m = id.match(/r(\d+)-(\d+)/)
  if (!m) return
  const year = parseInt(m[1])
  const tsPath = path.join(DATA_DIR, `exam-${year}.ts`)
  const content = fs.readFileSync(tsPath, 'utf-8')
  const arrayStart = content.indexOf('[\n')
  const header = content.substring(0, arrayStart)
  const questions = JSON.parse(content.substring(arrayStart).trimEnd())
  const q = questions.find((q: any) => q.id === id)
  if (q && q.image_url) {
    delete q.image_url
    const newContent = header + JSON.stringify(questions, null, 2) + '\n'
    fs.writeFileSync(tsPath, newContent, 'utf-8')
    console.log(`    image_url除去完了`)
  }
}

async function main() {
  let fixed = 0, improved = 0, failed = 0

  // ========================================
  // 🔴 Category 1: 横軸凡例が見えない (6問)
  // ========================================
  console.log('\n=== 🔴 横軸凡例が見えない (6問) ===')
  const axisProblems = [
    { id: 'r101-091', year: 101, q: 91 },
    { id: 'r102-121', year: 102, q: 121 },
    { id: 'r104-173', year: 104, q: 173 },
    { id: 'r105-130', year: 105, q: 130 },
    { id: 'r106-178', year: 106, q: 178 },
    { id: 'r107-174', year: 107, q: 174 },
  ]
  for (const item of axisProblems) {
    console.log(`[${item.id}]`)
    const section = getPdfSection(item.q)
    const prefix = `q${item.year}-${section}`
    const pdfPath = path.join(PDF_DIR, prefix + '.pdf')
    const page = findQuestionPage(pdfPath, item.q)
    if (!page) { console.log('  ページ未検出'); failed++; continue }

    const dir = path.join(PAGES_DIR, String(item.year))
    const img = findImg(dir, prefix, page)
    if (!img) { console.log('  ページ画像なし'); failed++; continue }

    const meta = await sharp(img).metadata()
    // ヘッダ80px除去のみ、フッタは除去しない（凡例を保護）
    const dest = path.join(OUTPUT_DIR, String(item.year), `q${String(item.q).padStart(3, '0')}.png`)
    await sharp(img)
      .extract({ left: 0, top: 80, width: meta.width!, height: (meta.height ?? 0) - 80 })
      .toFile(dest + '.tmp')
    fs.renameSync(dest + '.tmp', dest)

    // 密度トリムだが60%から開始（凡例保護）
    const newH = await densityTrim(dest, 0.65)
    const fm = await sharp(dest).metadata()
    console.log(`  page=${page} → ${fm.width}x${fm.height}px (凡例保護クロップ) ✅`)
    fixed++
  }

  // ========================================
  // 🔴 Category 2: シナリオ画像誤配置 (6問) → image_url除去
  // ========================================
  console.log('\n=== 🔴 シナリオ画像誤配置 (6問) → image_url除去 ===')
  const scenarioMisplaced = ['r106-298', 'r107-238', 'r108-216', 'r109-266', 'r110-222', 'r110-254']
  for (const id of scenarioMisplaced) {
    console.log(`[${id}]`)
    removeImageUrl(id)
    fixed++
  }

  // ========================================
  // 🔴 Category 3: その他 (3問)
  // ========================================
  console.log('\n=== 🔴 その他 (3問) ===')

  // r102-218: 図が見えない+シナリオ重複 → image_url除去
  console.log('[r102-218] → image_url除去（シナリオが表示を担当）')
  removeImageUrl('r102-218')
  fixed++

  // r109-140: 図が見えない → 2ページ結合（単問、page46+47）
  console.log('[r109-140] → 2ページ結合')
  {
    const prefix = 'q109-riron1'
    const dir = path.join(PAGES_DIR, '109')
    const img1 = findImg(dir, prefix, 46)
    const img2 = findImg(dir, prefix, 47)
    if (img1 && img2) {
      const m1 = await sharp(img1).metadata()
      const m2 = await sharp(img2).metadata()
      const h1 = (m1.height ?? 0) - 160
      const h2 = (m2.height ?? 0) - 160
      const w = Math.min(m1.width ?? 0, m2.width ?? 0)
      const b1 = await sharp(img1).extract({ left: 0, top: 80, width: m1.width!, height: h1 }).resize(w).toBuffer()
      const b2 = await sharp(img2).extract({ left: 0, top: 80, width: m2.width!, height: h2 }).resize(w).toBuffer()
      const bm1 = await sharp(b1).metadata()
      const bm2 = await sharp(b2).metadata()
      const dest = path.join(OUTPUT_DIR, '109', 'q140.png')
      await sharp({
        create: { width: w, height: (bm1.height ?? 0) + (bm2.height ?? 0), channels: 3, background: { r: 255, g: 255, b: 255 } }
      }).composite([
        { input: b1, top: 0, left: 0 },
        { input: b2, top: bm1.height ?? 0, left: 0 }
      ]).png().toFile(dest + '.tmp')
      fs.renameSync(dest + '.tmp', dest)
      await densityTrim(dest, 0.5)
      const fm = await sharp(dest).metadata()
      console.log(`  ${fm.width}x${fm.height}px (2p結合+密度トリム) ✅`)
      fixed++
    }
  }

  // r109-220: シナリオ重複+図が見えない → page27（問題ページ）のみ使用
  console.log('[r109-220] → page27（問題ページ）のみ')
  {
    const dir = path.join(PAGES_DIR, '109')
    const img = findImg(dir, 'q109-jissen1', 27)
    if (img) {
      const meta = await sharp(img).metadata()
      const dest = path.join(OUTPUT_DIR, '109', 'q220.png')
      await sharp(img)
        .extract({ left: 0, top: 80, width: meta.width!, height: (meta.height ?? 0) - 160 })
        .toFile(dest + '.tmp')
      fs.renameSync(dest + '.tmp', dest)
      await densityTrim(dest, 0.5)
      const fm = await sharp(dest).metadata()
      console.log(`  ${fm.width}x${fm.height}px (page27のみ+密度トリム) ✅`)
      fixed++
    }
  }

  // ========================================
  // 🟡 選択肢テキスト混入 27問: bbox選択肢検出→上でクロップ
  // ========================================
  console.log('\n=== 🟡 選択肢テキスト混入 (27問) ===')
  const choicesInImage = [
    'r100-011','r100-031','r100-048','r100-124','r100-131','r100-145',
    'r101-002','r101-087','r101-111','r101-112','r101-148',
    'r102-049','r102-112',
    'r104-047','r104-058',
    'r105-114','r105-161',
    'r106-111','r106-128',
    'r107-041',
    'r108-017','r108-102',
    'r109-019','r109-025','r109-052','r109-106','r109-170',
  ]

  for (const id of choicesInImage) {
    const m = id.match(/r(\d+)-(\d+)/)
    if (!m) continue
    const year = parseInt(m[1]), qnum = parseInt(m[2])
    const section = getPdfSection(qnum)
    const prefix = `q${year}-${section}`
    const pdfPath = path.join(PDF_DIR, prefix + '.pdf')
    const imgPath = path.join(OUTPUT_DIR, String(year), `q${String(qnum).padStart(3, '0')}.png`)

    if (!fs.existsSync(imgPath)) { console.log(`[${id}] 画像なし`); continue }

    const page = findQuestionPage(pdfPath, qnum)
    if (!page) { console.log(`[${id}] ページ未検出 → スキップ`); continue }

    const choicesY = findChoicesStartY(pdfPath, page)
    if (choicesY) {
      const meta = await sharp(imgPath).metadata()
      // 選択肢開始位置の10px上でクロップ（画像の上端がページの80px目なので調整）
      const cropH = Math.max(200, choicesY - 80 - 10)
      if (cropH < (meta.height ?? 0) - 50) {
        const tmp = imgPath + '.tmp.png'
        await sharp(imgPath)
          .extract({ left: 0, top: 0, width: meta.width!, height: Math.min(cropH, meta.height!) })
          .toFile(tmp)
        fs.renameSync(tmp, imgPath)
        const fm = await sharp(imgPath).metadata()
        console.log(`[${id}] 選択肢除去: ${meta.height} → ${fm.height}px ✅`)
        improved++
      } else {
        console.log(`[${id}] 選択肢位置が画像外 → スキップ`)
      }
    } else {
      console.log(`[${id}] 選択肢位置未検出 → スキップ`)
    }
  }

  // ========================================
  // 🟡 選択肢途切れ 5問: 下端を拡張して再クロップ
  // ========================================
  console.log('\n=== 🟡 選択肢途切れ (5問) ===')
  const choicesCutoff = ['r102-111', 'r102-172', 'r106-092', 'r108-112', 'r108-113']
  for (const id of choicesCutoff) {
    const m = id.match(/r(\d+)-(\d+)/)
    if (!m) continue
    const year = parseInt(m[1]), qnum = parseInt(m[2])
    const section = getPdfSection(qnum)
    const prefix = `q${year}-${section}`
    const dir = path.join(PAGES_DIR, String(year))
    const pdfPath = path.join(PDF_DIR, prefix + '.pdf')
    const page = findQuestionPage(pdfPath, qnum)
    if (!page) { console.log(`[${id}] ページ未検出`); continue }

    const img = findImg(dir, prefix, page)
    if (!img) { console.log(`[${id}] ページ画像なし`); continue }

    const meta = await sharp(img).metadata()
    const dest = path.join(OUTPUT_DIR, String(year), `q${String(qnum).padStart(3, '0')}.png`)
    // 全ページ（ヘッダのみ除去）で再クロップ
    await sharp(img)
      .extract({ left: 0, top: 80, width: meta.width!, height: (meta.height ?? 0) - 80 })
      .toFile(dest + '.tmp')
    fs.renameSync(dest + '.tmp', dest)
    await densityTrim(dest, 0.5)
    const fm = await sharp(dest).metadata()
    console.log(`[${id}] 拡張再クロップ: ${fm.width}x${fm.height}px ✅`)
    improved++
  }

  console.log(`\n=== 完了 ===`)
  console.log(`🔴修正: ${fixed}問 / 🟡改善: ${improved}問 / 失敗: ${failed}問`)
}

main().catch(e => { console.error(e); process.exitCode = 1 })
