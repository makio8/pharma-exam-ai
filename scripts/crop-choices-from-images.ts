/**
 * both モード画像から選択肢テキスト領域を除去するスクリプト
 *
 * 理由: both モードでは選択肢がインタラクティブボタンで表示されるため、
 *       画像内の選択肢テキストは冗長。除去することでスクロール量を削減。
 *
 * 方法: question_text_original の選択肢開始位置を検出し、
 *       その比率で画像下部をクロップ。
 *
 * npx tsx scripts/crop-choices-from-images.ts --dry-run
 * npx tsx scripts/crop-choices-from-images.ts --year 100
 * npx tsx scripts/crop-choices-from-images.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'questions')
const DATA_DIR = path.join(__dirname, '..', 'src', 'data', 'real-questions')

// 選択肢の上に少し余白を残す（問題文の末尾が切れないように）
const SAFETY_MARGIN_RATIO = 0.05  // 画像高さの5%（安全マージン：問題文末尾・図の下端が切れないように）

interface Question {
  id: string
  year: number
  question_number: number
  question_text: string
  question_text_original?: string
  choices: { key: number; text: string }[]
  image_url?: string
  visual_content_type?: string
  display_mode_override?: string
}

/**
 * OCRテキストから選択肢の開始位置（行比率）を検出
 *
 * パターン:
 * - "1 テキスト" で始まる行（全角も半角も）
 * - "1　テキスト" （全角スペース区切り）
 * - 選択肢が横並び: "1  xxx  2  yyy  3  zzz"
 */
function findChoicesStartRatio(originalText: string): number | null {
  if (!originalText) return null

  const lines = originalText.split('\n')
  const totalLines = lines.length
  if (totalLines < 3) return null

  // 下から上にスキャンして、最初の選択肢番号 "1" を探す
  // 選択肢は通常 1, 2, 3, 4, 5 の順なので、"1 " を探す
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // 選択肢パターン: 行頭が "1 " or "1　" or "１ "
    // かつ後続行に "2 " "3 " がある
    if (/^[1１]\s/.test(line)) {
      // 次の数行に 2, 3 が続くか確認（選択肢の連番チェック）
      let hasFollowingChoices = false
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        if (/^[2-5２-５]\s/.test(lines[j].trim())) {
          hasFollowingChoices = true
          break
        }
      }

      // 横並びパターン: "1  xxx  2  yyy" の場合、同じ行に 2, 3 がある
      if (!hasFollowingChoices && /[2-5２-５]\s/.test(line)) {
        hasFollowingChoices = true
      }

      if (hasFollowingChoices) {
        // この行の位置を比率で返す
        return i / totalLines
      }
    }
  }

  return null
}

interface CropResult {
  file: string
  questionId: string
  originalHeight: number
  croppedHeight: number
  choicesRatio: number
  savedPercent: number
}

async function processQuestion(
  question: Question,
  dryRun: boolean
): Promise<CropResult | null> {
  if (!question.image_url) return null
  if (!question.question_text_original) return null

  // both モード かつ ビジュアルコンテンツがある問題のみ対象
  // （テキストのみの問題は text モードにすべきで、画像クロップの意味がない）
  const choicesEmpty = question.choices.length === 0
    || question.choices.every(c => c.text.trim() === '')
  if (choicesEmpty) return null  // image モード → 選択肢は画像内にしかない、クロップ不可

  const visualTypes = ['structural_formula', 'graph', 'table', 'diagram', 'prescription', 'mixed']
  if (!question.visual_content_type || !visualTypes.includes(question.visual_content_type)) {
    return null  // テキストのみ or VCT未設定 → 画像クロップ不要
  }

  // 選択肢開始位置を検出
  const choicesRatio = findChoicesStartRatio(question.question_text_original)
  if (choicesRatio === null) return null
  if (choicesRatio < 0.45) return null  // 45%未満はテーブル=選択肢のケースが多い → スキップ

  // 画像ファイルパス
  const imgPath = path.join(IMAGES_DIR, String(question.year), `q${String(question.question_number).padStart(3, '0')}.png`)
  if (!fs.existsSync(imgPath)) return null

  // 画像のメタデータ取得
  const meta = await sharp(imgPath).metadata()
  const origW = meta.width ?? 0
  const origH = meta.height ?? 0
  if (origW === 0 || origH === 0) return null

  // クロップ位置を計算（選択肢開始位置 - 安全マージン）
  const cropRatio = Math.min(choicesRatio, 0.95)  // 最大95%まで
  const cropHeight = Math.round(origH * (cropRatio - SAFETY_MARGIN_RATIO))
  if (cropHeight <= 100 || cropHeight >= origH - 20) return null  // 変化が小さすぎる or 大きすぎる

  if (cropHeight < 200) return null  // クロップ後200px未満 → テキストのみの画像の可能性大、スキップ

  const savedPercent = Math.round((1 - cropHeight / origH) * 100)
  if (savedPercent < 10) return null  // 10%未満の削減は効果薄 → スキップ

  const result: CropResult = {
    file: `q${String(question.question_number).padStart(3, '0')}.png`,
    questionId: question.id,
    originalHeight: origH,
    croppedHeight: cropHeight,
    choicesRatio,
    savedPercent,
  }

  if (!dryRun) {
    const tmpPath = imgPath + '.tmp.png'
    await sharp(imgPath)
      .extract({ left: 0, top: 0, width: origW, height: cropHeight })
      .toFile(tmpPath)
    fs.renameSync(tmpPath, imgPath)
  }

  return result
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

  console.log(`${dryRun ? '[DRY RUN] ' : ''}選択肢クロップ: 第${years[0]}〜${years[years.length - 1]}回`)
  console.log('対象: both モード問題（choices テキストあり + image_url あり）\n')

  let totalProcessed = 0
  let totalCropped = 0

  for (const year of years) {
    const dataFile = path.join(DATA_DIR, `exam-${year}.ts`)
    if (!fs.existsSync(dataFile)) {
      console.log(`  第${year}回: データなし — スキップ`)
      continue
    }

    // データファイルを動的インポート（export名: EXAM_100_QUESTIONS 等）
    const module = await import(dataFile)
    const examKey = Object.keys(module).find(k => k.startsWith('EXAM_'))
    if (!examKey) {
      console.log(`  第${year}回: export名が見つからない — スキップ`)
      continue
    }
    const questions: Question[] = module[examKey]

    console.log(`=== 第${year}回: ${questions.length}問 ===`)

    const results: CropResult[] = []
    for (const q of questions) {
      try {
        const result = await processQuestion(q, dryRun)
        if (result) {
          results.push(result)
          totalCropped++
        }
        totalProcessed++
      } catch (e) {
        console.error(`  ✗ ${q.id}: ${(e as Error).message}`)
      }
    }

    for (const r of results) {
      console.log(`  ✂ ${r.file} (${r.questionId}): ${r.originalHeight}px → ${r.croppedHeight}px (−${r.savedPercent}%, 選択肢@${Math.round(r.choicesRatio * 100)}%)`)
    }
    if (results.length === 0) {
      console.log('  （対象なし）')
    }
  }

  console.log(`\n=== サマリー ===`)
  console.log(`処理: ${totalProcessed}問 / クロップ実施: ${totalCropped}問`)
}

main().catch(console.error)
