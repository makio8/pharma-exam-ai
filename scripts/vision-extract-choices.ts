/**
 * 手法C: PDFページ画像から選択肢テキストを抽出する
 * Claude Code の Read ツールは画像を読めるが、スクリプトからは直接使えないため
 * このスクリプトは「どの問題のどのページ画像を読むべきか」のリストを生成する
 *
 * 実際の Vision 読み取りは merge-all-sources-v2.ts 内で
 * ページ画像パスを image_url として保持し、アプリ上で表示する
 *
 * npx tsx scripts/vision-extract-choices.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', 'src', 'data', 'real-questions')
const imgBaseDir = '/tmp/claude/exam-pages'
const pubImgDir = path.join(__dirname, '..', 'public', 'images', 'questions')

// PDFファイルとセクションのマッピング
const PDF_FILES: Record<number, { file: string; section: string; qRange: [number, number] }[]> = {
  107: [
    { file: 'q107-hissu.pdf', section: '必須', qRange: [1, 90] },
    { file: 'q107-riron1.pdf', section: '理論', qRange: [91, 150] },
    { file: 'q107-riron2.pdf', section: '理論', qRange: [151, 195] },
    { file: 'q107-jissen1.pdf', section: '実践', qRange: [196, 245] },
    { file: 'q107-jissen2.pdf', section: '実践', qRange: [246, 285] },
    { file: 'q107-jissen3.pdf', section: '実践', qRange: [286, 345] },
  ],
  108: [
    { file: 'q108-hissu.pdf', section: '必須', qRange: [1, 90] },
    { file: 'q108-riron1.pdf', section: '理論', qRange: [91, 150] },
    { file: 'q108-riron2.pdf', section: '理論', qRange: [151, 195] },
    { file: 'q108-jissen1.pdf', section: '実践', qRange: [196, 245] },
    { file: 'q108-jissen2.pdf', section: '実践', qRange: [246, 285] },
    { file: 'q108-jissen3.pdf', section: '実践', qRange: [286, 345] },
  ],
  109: [
    { file: 'q109-hissu.pdf', section: '必須', qRange: [1, 90] },
    { file: 'q109-riron1.pdf', section: '理論', qRange: [91, 150] },
    { file: 'q109-riron2.pdf', section: '理論', qRange: [151, 195] },
    { file: 'q109-jissen1.pdf', section: '実践', qRange: [196, 245] },
    { file: 'q109-jissen2.pdf', section: '実践', qRange: [246, 285] },
    { file: 'q109-jissen3.pdf', section: '実践', qRange: [286, 345] },
  ],
  110: [
    { file: 'q110-hissu.pdf', section: '必須', qRange: [1, 90] },
    { file: 'q110-riron1.pdf', section: '理論', qRange: [91, 150] },
    { file: 'q110-riron2.pdf', section: '理論', qRange: [151, 195] },
    { file: 'q110-jissen1.pdf', section: '実践', qRange: [196, 245] },
    { file: 'q110-jissen2.pdf', section: '実践', qRange: [246, 285] },
    { file: 'q110-jissen3.pdf', section: '実践', qRange: [286, 345] },
  ],
}

function findQuestionPage(pdfPath: string, qNum: number): number {
  // pdftotext で各ページを検索
  const info = execSync(`pdfinfo "${pdfPath}" 2>/dev/null`, { encoding: 'utf-8' })
  const pagesMatch = info.match(/Pages:\s+(\d+)/)
  const totalPages = pagesMatch ? parseInt(pagesMatch[1]) : 0

  for (let p = 1; p <= totalPages; p++) {
    const text = execSync(`pdftotext -f ${p} -l ${p} -layout "${pdfPath}" - 2>/dev/null`, { encoding: 'utf-8' })
    // 問N or 問N−N パターン
    if (text.match(new RegExp(`問\\s*${qNum}[^0-9]`))) {
      return p
    }
  }
  return 0
}

async function main() {
  const years = [107, 108, 109, 110]

  for (const year of years) {
    console.log(`\n=== 第${year}回 画像準備 ===`)

    // 現在の統合データで選択肢不足の問題を特定
    let currentData: any[] = []
    try {
      const tsPath = path.join(dataDir, `exam-${year}.ts`)
      // TSファイルから問題番号を取得（JSONの方がパースしやすい）
      // merge後のJSONを参照
    } catch {}

    // PDFデータから選択肢不足の問題を特定
    const pdfData: any[] = JSON.parse(fs.readFileSync(path.join(dataDir, `exam-${year}-pdf.json`), 'utf-8'))
    const webData: any[] = (() => {
      try { return JSON.parse(fs.readFileSync(path.join(dataDir, `exam-${year}.json`), 'utf-8')) }
      catch { return [] }
    })()
    const webMap = new Map(webData.map((q: any) => [q.question_number, q]))

    // 選択肢不足の問題リスト
    const needsImage: number[] = []
    for (const q of pdfData) {
      const web = webMap.get(q.question_number) as any
      const hasGoodChoices = (web?.choices?.length === 5) || (q.choices?.length === 5)
      if (!hasGoodChoices) {
        needsImage.push(q.question_number)
      }
    }

    console.log(`選択肢不足: ${needsImage.length}問`)

    // 各問題のページ画像を生成・コピー
    const yearImgDir = path.join(pubImgDir, String(year))
    fs.mkdirSync(yearImgDir, { recursive: true })

    const pageImgDir = path.join(imgBaseDir, String(year))
    fs.mkdirSync(pageImgDir, { recursive: true })

    // PDFファイルごとにページ画像を生成
    for (const pdfInfo of PDF_FILES[year]) {
      const pdfPath = `/tmp/claude/${pdfInfo.file}`
      if (!fs.existsSync(pdfPath)) {
        console.log(`  ⚠️ ${pdfInfo.file} not found, skipping`)
        continue
      }

      const prefix = pdfInfo.file.replace('.pdf', '')
      const existingImages = fs.readdirSync(pageImgDir).filter(f => f.startsWith(prefix))

      if (existingImages.length === 0) {
        console.log(`  画像化: ${pdfInfo.file}`)
        execSync(`pdftoppm -png -r 200 "${pdfPath}" "${path.join(pageImgDir, prefix)}" 2>/dev/null`, { timeout: 60000 })
      }

      // 選択肢不足の問題のうち、このPDFの範囲に含まれるもの
      const relevant = needsImage.filter(n => n >= pdfInfo.qRange[0] && n <= pdfInfo.qRange[1])
      if (relevant.length === 0) continue

      console.log(`  ${pdfInfo.file}: ${relevant.length}問が画像必要`)

      // 問題番号→ページ番号の紐付け
      for (const qNum of relevant) {
        const page = findQuestionPage(pdfPath, qNum)
        if (page > 0) {
          const paddedPage = String(page).padStart(2, '0')
          const srcImg = path.join(pageImgDir, `${prefix}-${paddedPage}.png`)
          const destImg = path.join(yearImgDir, `q${String(qNum).padStart(3, '0')}.png`)

          if (fs.existsSync(srcImg) && !fs.existsSync(destImg)) {
            fs.copyFileSync(srcImg, destImg)
          }
        }
      }
    }

    // 画像URLマップ更新
    const imageUrlMap: Record<string, string> = {}
    try {
      const existing = JSON.parse(fs.readFileSync(path.join(dataDir, `image-urls-${year}.json`), 'utf-8'))
      Object.assign(imageUrlMap, existing)
    } catch {}

    const imgs = fs.readdirSync(yearImgDir).filter(f => f.endsWith('.png'))
    for (const img of imgs) {
      const match = img.match(/q(\d+)\.png/)
      if (match) {
        const id = `r${year}-${match[1]}`
        imageUrlMap[id] = `/images/questions/${year}/${img}`
      }
    }

    fs.writeFileSync(path.join(dataDir, `image-urls-${year}.json`), JSON.stringify(imageUrlMap, null, 2), 'utf-8')
    console.log(`  画像URLマップ: ${Object.keys(imageUrlMap).length}件`)
  }

  console.log('\n✅ 全回の画像準備完了')
}

main().catch(console.error)
