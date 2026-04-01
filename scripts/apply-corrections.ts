#!/usr/bin/env npx tsx
/**
 * Review UI の corrections.json を実データへ反映する。
 *
 * 対応:
 * - v1.0.0: corrections 配列
 * - v1.1.0: corrections オブジェクト（Review UI export）
 *
 * 画像系 correction は PDF から PNG を生成し、実データへ反映する。
 *
 * Usage:
 *   npx tsx scripts/apply-corrections.ts /path/to/corrections.json
 *   npx tsx scripts/apply-corrections.ts --dry-run /path/to/corrections.json
 *   npx tsx scripts/apply-corrections.ts --force-hash-mismatch /path/to/corrections.json
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import * as os from 'os'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import type { Question } from '../src/types/question.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..')
const REPORTS_DIR = path.join(PROJECT_ROOT, 'reports')
const PDF_DIR = path.join(PROJECT_ROOT, 'data', 'pdfs')
const PUBLIC_IMAGE_DIR = path.join(PROJECT_ROOT, 'public', 'images', 'questions')
const REAL_QUESTIONS_DIR = path.join(PROJECT_ROOT, 'src', 'data', 'real-questions')

type CorrectionType =
  | 'text'
  | 'choices'
  | 'answer'
  | 'image-remove'
  | 'image-crop'
  | 'multi-image-crop'
  | 'set-section'
  | 'set-subject'
  | 'set-category'
  | 'set-explanation'
  | 'set-tags'
  | 'set-linked-group'
  | 'set-linked-scenario'
  | 'set-visual-content-type'
  | 'set-display-mode'

interface PdfCropRect {
  x: number
  y: number
  w: number
  h: number
  viewportWidth: number
  viewportHeight: number
  scale: number
  rotation: 0 | 90 | 180 | 270
}

interface CropImage {
  id: number
  crop: PdfCropRect
  pdfFile: string
  pdfPage: number
  label?: string
}

type CorrectionItem =
  | { type: 'text'; field: 'question_text' | 'explanation' | 'category' | 'linked_scenario'; value: string }
  | { type: 'choices'; value: Question['choices'] }
  | { type: 'answer'; value: number | number[] }
  | { type: 'image-remove' }
  | { type: 'image-crop'; crop: PdfCropRect; pdfFile: string; pdfPage: number }
  | { type: 'multi-image-crop'; target: 'question' | 'scenario'; images: CropImage[] }
  | { type: 'set-section'; value: Question['section'] }
  | { type: 'set-subject'; value: Question['subject'] }
  | { type: 'set-category'; value: string }
  | { type: 'set-explanation'; value: string }
  | { type: 'set-tags'; value: string[] }
  | { type: 'set-linked-group'; value: string }
  | { type: 'set-linked-scenario'; value: string }
  | { type: 'set-visual-content-type'; value: NonNullable<Question['visual_content_type']> }
  | { type: 'set-display-mode'; value: NonNullable<Question['display_mode_override']> }

interface CorrectionTask {
  questionId: string
  dataHash: string
  items: CorrectionItem[]
}

interface CorrectionsFileV10 {
  version?: '1.0.0'
  reportTimestamp: string
  baseGitCommit: string
  corrections: Array<{
    questionId: string
    type: CorrectionType
    field?: string
    value?: unknown
    dataHash: string
    reason?: string
  }>
}

interface CorrectionsFileV11 {
  version?: '1.1.0'
  timestamp?: string
  reportTimestamp: string
  baseGitCommit: string
  corrections: Record<string, { dataHash: string; items: CorrectionItem[] }>
}

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const forceHashMismatch = args.includes('--force-hash-mismatch')
const correctionsPath = args.find(a => !a.startsWith('--'))
  ?? path.join(PROJECT_ROOT, 'corrections.json')

const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const CYAN = '\x1b[36m'
const RESET = '\x1b[0m'
const GRAY = '\x1b[90m'

function log(msg: string) { console.log(msg) }
function ok(msg: string) { console.log(`${GREEN}✓${RESET} ${msg}`) }
function warn(msg: string) { console.log(`${YELLOW}⚠${RESET} ${msg}`) }
function err(msg: string) { console.log(`${RED}✗${RESET} ${msg}`) }
function info(msg: string) { console.log(`${CYAN}ℹ${RESET} ${msg}`) }
function gray(msg: string) { console.log(`${GRAY}${msg}${RESET}`) }

function computeDataHash(q: Question): string {
  const str = q.question_text + JSON.stringify(q.choices) + JSON.stringify(q.correct_answer)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(36)
}

function inferVisualContentType(q: Question): NonNullable<Question['visual_content_type']> {
  if (q.visual_content_type) return q.visual_content_type
  const text = `${q.question_text}\n${q.choices.map(c => c.text).join('\n')}`
  if (/構造式|インドール|反応式|化合物/.test(text)) return 'structural_formula'
  if (/グラフ|曲線|分布|スペクトル/.test(text)) return 'graph'
  if (/処方|処方箋|検査値|持参薬|Rp/.test(text)) return 'prescription'
  return 'mixed'
}

function buildExamTs(year: number, questions: Question[]): string {
  return `// 第${year}回薬剤師国家試験 実問題データ
// 自動生成: scripts/apply-corrections.ts
// 生成日時: ${new Date().toISOString()}

import type { Question } from '../../types/question'

export const EXAM_${year}_QUESTIONS: Question[] = ${JSON.stringify(questions, null, 2)}
`
}

function normalizeCorrections(
  raw: CorrectionsFileV10 | CorrectionsFileV11,
): { reportTimestamp: string; baseGitCommit: string; version: string; tasks: CorrectionTask[] } {
  const version = raw.version ?? '1.0.0'

  if (Array.isArray(raw.corrections)) {
    const grouped = new Map<string, CorrectionTask>()
    for (const correction of raw.corrections) {
      if (!grouped.has(correction.questionId)) {
        grouped.set(correction.questionId, {
          questionId: correction.questionId,
          dataHash: correction.dataHash,
          items: [],
        })
      }
      const item: CorrectionItem = correction.type === 'text'
        ? { type: 'text', field: correction.field as 'question_text' | 'explanation' | 'category' | 'linked_scenario', value: String(correction.value ?? '') }
        : correction.type === 'choices'
          ? { type: 'choices', value: correction.value as Question['choices'] }
          : correction.type === 'answer'
            ? { type: 'answer', value: correction.value as number | number[] }
            : correction.type === 'image-remove'
              ? { type: 'image-remove' }
              : correction.type === 'image-crop'
                ? { type: 'image-crop', crop: correction.value as PdfCropRect, pdfFile: '', pdfPage: 1 }
                : correction.type === 'set-section'
                  ? { type: 'set-section', value: correction.value as Question['section'] }
                  : correction.type === 'set-subject'
                    ? { type: 'set-subject', value: correction.value as Question['subject'] }
                    : correction.type === 'set-category'
                      ? { type: 'set-category', value: String(correction.value ?? '') }
                      : correction.type === 'set-explanation'
                        ? { type: 'set-explanation', value: String(correction.value ?? '') }
                        : correction.type === 'set-tags'
                          ? { type: 'set-tags', value: correction.value as string[] }
                          : correction.type === 'set-linked-group'
                            ? { type: 'set-linked-group', value: String(correction.value ?? '') }
                            : correction.type === 'set-linked-scenario'
                              ? { type: 'set-linked-scenario', value: String(correction.value ?? '') }
                              : { type: 'image-remove' }
      grouped.get(correction.questionId)!.items.push(item)
    }
    return {
      reportTimestamp: raw.reportTimestamp,
      baseGitCommit: raw.baseGitCommit,
      version,
      tasks: [...grouped.values()],
    }
  }

  return {
    reportTimestamp: raw.reportTimestamp,
    baseGitCommit: raw.baseGitCommit,
    version,
    tasks: Object.entries(raw.corrections).map(([questionId, value]) => ({
      questionId,
      dataHash: value.dataHash,
      items: value.items,
    })),
  }
}

function ensureYearImageDir(year: number): string {
  const dir = path.join(PUBLIC_IMAGE_DIR, String(year), 'review')
  mkdirSync(dir, { recursive: true })
  return dir
}

function ensurePdfExists(pdfFile: string): string {
  const pdfPath = path.join(PDF_DIR, pdfFile)
  if (!existsSync(pdfPath)) {
    throw new Error(`PDF が見つかりません: ${pdfPath}`)
  }
  return pdfPath
}

const renderedPageCache = new Map<string, string>()
const pdfPageCountCache = new Map<string, number>()
const tempRoot = path.join(os.tmpdir(), 'pharma-exam-ai-review-crops')

function getPdfPageCount(pdfFile: string): number {
  const cached = pdfPageCountCache.get(pdfFile)
  if (cached !== undefined) return cached

  const pdfPath = ensurePdfExists(pdfFile)
  const infoText = execSync(`pdfinfo "${pdfPath}"`, {
    cwd: PROJECT_ROOT,
    encoding: 'utf-8',
    stdio: 'pipe',
  })
  const match = infoText.match(/Pages:\s+(\d+)/)
  const pageCount = match ? Number(match[1]) : 0
  pdfPageCountCache.set(pdfFile, pageCount)
  return pageCount
}

function renderPdfPage(pdfFile: string, pdfPage: number): string {
  const pageCount = getPdfPageCount(pdfFile)
  const safePage = pageCount > 0 ? Math.min(Math.max(pdfPage, 1), pageCount) : Math.max(pdfPage, 1)
  if (safePage !== pdfPage) {
    warn(`${pdfFile}: page ${pdfPage} は範囲外のため page ${safePage} に補正します`)
  }

  const key = `${pdfFile}#${safePage}`
  const cached = renderedPageCache.get(key)
  if (cached && existsSync(cached)) return cached

  mkdirSync(tempRoot, { recursive: true })
  const pdfPath = ensurePdfExists(pdfFile)
  const safeBase = key.replace(/[^a-zA-Z0-9_-]/g, '_')
  const prefix = path.join(tempRoot, safeBase)
  const outPath = `${prefix}.png`

  execSync(
    `pdftoppm -singlefile -png -r 200 -f ${safePage} -l ${safePage} "${pdfPath}" "${prefix}"`,
    { cwd: PROJECT_ROOT, stdio: 'pipe' },
  )

  renderedPageCache.set(key, outPath)
  return outPath
}

async function cropFromRenderedPage(
  renderedPagePath: string,
  crop: PdfCropRect,
  outPath: string,
): Promise<void> {
  const meta = await sharp(renderedPagePath).metadata()
  const width = meta.width ?? 0
  const height = meta.height ?? 0
  if (width === 0 || height === 0) {
    throw new Error(`PNG metadata 読み込み失敗: ${renderedPagePath}`)
  }

  const left = Math.max(0, Math.floor(crop.x * width))
  const top = Math.max(0, Math.floor(crop.y * height))
  const extractWidth = Math.min(width - left, Math.max(1, Math.ceil(crop.w * width)))
  const extractHeight = Math.min(height - top, Math.max(1, Math.ceil(crop.h * height)))

  await sharp(renderedPagePath)
    .extract({ left, top, width: extractWidth, height: extractHeight })
    .png()
    .toFile(outPath)
}

async function materializeSingleCrop(
  q: Question,
  crop: PdfCropRect,
  pdfFile: string,
  pdfPage: number,
): Promise<string> {
  const yearDir = ensureYearImageDir(q.year)
  const outPath = path.join(yearDir, `${q.id}-question.png`)
  if (!dryRun) {
    const renderedPagePath = renderPdfPage(pdfFile, pdfPage)
    await cropFromRenderedPage(renderedPagePath, crop, outPath)
  }
  return `/images/questions/${q.year}/review/${q.id}-question.png`
}

async function materializeQuestionCrops(
  q: Question,
  crops: Array<{ crop: PdfCropRect; pdfFile: string; pdfPage: number }>,
): Promise<string[]> {
  const yearDir = ensureYearImageDir(q.year)
  const urls: string[] = []

  if (!dryRun) {
    const sorted = [...crops].sort((a, b) => {
      if (a.pdfFile !== b.pdfFile) return a.pdfFile.localeCompare(b.pdfFile)
      if (a.pdfPage !== b.pdfPage) return a.pdfPage - b.pdfPage
      return a.crop.y - b.crop.y
    })
    let index = 1

    for (const item of sorted) {
      const renderedPagePath = renderPdfPage(item.pdfFile, item.pdfPage)
      const meta = await sharp(renderedPagePath).metadata()
      const width = meta.width ?? 0
      const height = meta.height ?? 0
      if (width === 0 || height === 0) {
        throw new Error(`PNG metadata 読み込み失敗: ${renderedPagePath}`)
      }

      const left = Math.max(0, Math.floor(item.crop.x * width))
      const top = Math.max(0, Math.floor(item.crop.y * height))
      const extractWidth = Math.min(width - left, Math.max(1, Math.ceil(item.crop.w * width)))
      const extractHeight = Math.min(height - top, Math.max(1, Math.ceil(item.crop.h * height)))
      const fileName = `${q.id}-question-${String(index).padStart(2, '0')}.png`
      const outPath = path.join(yearDir, fileName)

      await sharp(renderedPagePath)
        .extract({ left, top, width: extractWidth, height: extractHeight })
        .png()
        .toFile(outPath)

      urls.push(`/images/questions/${q.year}/review/${fileName}`)
      index += 1
    }
  } else {
    crops.forEach((_, idx) => {
      urls.push(`/images/questions/${q.year}/review/${q.id}-question-${String(idx + 1).padStart(2, '0')}.png`)
    })
  }

  return urls
}

function withQuestionPlaceholders(questionText: string, imageCount: number): string {
  if (imageCount <= 0) return questionText
  if (/\{\{image:\d+\}\}/.test(questionText)) return questionText

  const placeholders = Array.from({ length: imageCount }, (_, idx) => `{{image:${idx + 1}}}`).join('\n')
  const trimmed = questionText.trimEnd()
  return trimmed.length > 0 ? `${trimmed}\n${placeholders}` : placeholders
}

async function materializeMultiCrop(
  q: Question,
  target: 'question' | 'scenario',
  images: CropImage[],
): Promise<string[]> {
  const yearDir = ensureYearImageDir(q.year)
  const urls: string[] = []

  for (const image of [...images].sort((a, b) => a.id - b.id)) {
    const fileName = `${q.id}-${target}-${String(image.id).padStart(2, '0')}.png`
    const outPath = path.join(yearDir, fileName)
    if (!dryRun) {
      const renderedPagePath = renderPdfPage(image.pdfFile, image.pdfPage)
      await cropFromRenderedPage(renderedPagePath, image.crop, outPath)
    }
    urls.push(`/images/questions/${q.year}/review/${fileName}`)
  }

  return urls
}

async function applyItem(q: Question, item: CorrectionItem): Promise<Question> {
  const next: Question = { ...q }

  switch (item.type) {
    case 'text':
      if (item.field === 'question_text') {
        next.question_text_original = next.question_text
        next.question_text = item.value
      } else {
        ;(next as Record<string, unknown>)[item.field] = item.value
      }
      return next

    case 'choices':
      next.choices = item.value
      return next

    case 'answer':
      next.correct_answer = item.value
      return next

    case 'image-remove':
      delete next.image_url
      delete next._flag_image_review
      return next

    case 'image-crop':
      next.image_url = await materializeSingleCrop(next, item.crop, item.pdfFile, item.pdfPage)
      next.visual_content_type = inferVisualContentType(next)
      delete next._flag_image_review
      return next

    case 'multi-image-crop': {
      const urls = await materializeMultiCrop(next, item.target, item.images)
      if (item.target === 'question') {
        next.question_image_urls = urls
      } else {
        next.scenario_image_urls = urls
      }
      return next
    }

    case 'set-section':
      next.section = item.value
      return next

    case 'set-subject':
      next.subject = item.value
      return next

    case 'set-category':
      next.category = item.value
      return next

    case 'set-explanation':
      next.explanation = item.value
      return next

    case 'set-tags':
      next.tags = item.value
      return next

    case 'set-linked-group':
      next.linked_group = item.value
      return next

    case 'set-linked-scenario':
      next.linked_scenario = item.value
      return next

    case 'set-visual-content-type':
      next.visual_content_type = item.value
      return next

    case 'set-display-mode':
      next.display_mode_override = item.value
      return next

    default:
      return next
  }
}

async function main() {
  log('')
  log(`${CYAN}=== apply-corrections.ts ===${RESET}`)
  if (dryRun) log(`${YELLOW}[DRY-RUN] 実ファイルは更新しません${RESET}`)
  if (forceHashMismatch) log(`${YELLOW}[FORCE] dataHash 不一致でも適用します${RESET}`)
  log('')

  if (!existsSync(correctionsPath)) {
    err(`corrections.json が見つかりません: ${correctionsPath}`)
    process.exit(1)
  }

  const raw = JSON.parse(readFileSync(correctionsPath, 'utf-8')) as CorrectionsFileV10 | CorrectionsFileV11
  const normalized = normalizeCorrections(raw)

  ok(`corrections 読み込み: ${normalized.tasks.length}問`)
  gray(`  version: ${normalized.version}`)
  gray(`  reportTimestamp: ${normalized.reportTimestamp}`)
  gray(`  baseGitCommit: ${normalized.baseGitCommit}`)
  log('')

  info('問題データを読み込み中...')
  const mod = await import(path.join(PROJECT_ROOT, 'src/data/all-questions.ts'))
  const allQuestions = (mod.ALL_QUESTIONS ?? mod.default) as Question[]
  ok(`全問題数: ${allQuestions.length}件`)
  log('')

  const questionMap = new Map(allQuestions.map(q => [q.id, q]))
  const byYear = new Map<number, CorrectionTask[]>()
  let skippedNotFound = 0
  let skippedHash = 0

  for (const task of normalized.tasks) {
    const question = questionMap.get(task.questionId)
    if (!question) {
      warn(`問題が見つかりません: ${task.questionId}`)
      skippedNotFound++
      continue
    }

    const currentHash = computeDataHash(question)
    if (currentHash !== task.dataHash) {
      const msg = `${task.questionId}: hash不一致 (期待 ${task.dataHash}, 現在 ${currentHash})`
      if (!forceHashMismatch) {
        warn(`${msg} → スキップ`)
        skippedHash++
        continue
      }
      warn(`${msg} → 強制適用`)
    }

    if (!byYear.has(question.year)) byYear.set(question.year, [])
    byYear.get(question.year)!.push(task)
  }

  info(`対象年度: ${[...byYear.keys()].sort((a, b) => a - b).join(', ') || 'なし'}`)
  info(`スキップ: 未発見 ${skippedNotFound}件 / hash不一致 ${skippedHash}件`)
  log('')

  if (byYear.size === 0) {
    warn('適用対象がありません。終了します。')
    return
  }

  mkdirSync(REPORTS_DIR, { recursive: true })
  let generatedImages = 0

  for (const [year, tasks] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
    info(`第${year}回を処理中...`)
    const sourcePath = path.join(REAL_QUESTIONS_DIR, `exam-${year}.ts`)
    const backupPath = `${sourcePath}.bak.review-2026-04-01`
    const correctedJsonPath = path.join(REPORTS_DIR, `corrected-${year}.json`)

    const yearQuestions = allQuestions
      .filter(q => q.year === year)
      .sort((a, b) => a.question_number - b.question_number)
      .map(q => ({ ...q }))

    const indexMap = new Map(yearQuestions.map((q, index) => [q.id, index]))

    if (!dryRun && existsSync(sourcePath) && !existsSync(backupPath)) {
      writeFileSync(backupPath, readFileSync(sourcePath, 'utf-8'), 'utf-8')
      ok(`  バックアップ作成: ${path.basename(backupPath)}`)
    }

    for (const task of tasks) {
      const index = indexMap.get(task.questionId)
      if (index === undefined) continue

      let current = yearQuestions[index]
      const imageCropItems = task.items.filter((item): item is Extract<CorrectionItem, { type: 'image-crop' }> => item.type === 'image-crop')
      const otherItems = task.items.filter(item => item.type !== 'image-crop')

      for (const item of otherItems) {
        current = await applyItem(current, item)
        if (item.type === 'multi-image-crop') generatedImages += item.images.length
      }

      if (imageCropItems.length === 1) {
        const item = imageCropItems[0]
        current = await applyItem(current, item)
        generatedImages += 1
      } else if (imageCropItems.length > 1) {
        const questionImageUrls = await materializeQuestionCrops(current, imageCropItems)
        current = {
          ...current,
          question_image_urls: questionImageUrls,
          question_text_original: current.question_text_original ?? current.question_text,
          question_text: withQuestionPlaceholders(current.question_text, questionImageUrls.length),
          visual_content_type: inferVisualContentType(current),
        }
        delete current.image_url
        generatedImages += imageCropItems.length
      }

      yearQuestions[index] = current
      ok(`  ${task.questionId}: ${task.items.map(item => item.type).join(', ')}`)
    }

    if (!dryRun) {
      writeFileSync(correctedJsonPath, JSON.stringify(yearQuestions, null, 2), 'utf-8')
      writeFileSync(sourcePath, buildExamTs(year, yearQuestions), 'utf-8')
      ok(`  更新: reports/corrected-${year}.json`)
      ok(`  更新: src/data/real-questions/exam-${year}.ts`)
    } else {
      info(`  [DRY-RUN] ${yearQuestions.length}問を更新予定`)
    }
    log('')
  }

  if (!dryRun && existsSync(tempRoot)) {
    rmSync(tempRoot, { recursive: true, force: true })
  }

  const logLines = [
    'apply-corrections.ts 実行ログ',
    `実行日時: ${new Date().toISOString()}`,
    `correctionsPath: ${correctionsPath}`,
    `version: ${normalized.version}`,
    `dryRun: ${dryRun}`,
    `forceHashMismatch: ${forceHashMismatch}`,
    `generatedImages: ${generatedImages}`,
  ]
  if (!dryRun) {
    writeFileSync(path.join(REPORTS_DIR, 'corrections-applied.log'), logLines.join('\n'), 'utf-8')
    ok(`画像出力: ${generatedImages}枚`)
  }

  log('')
  ok('完了')
  if (dryRun) {
    info('実適用するには --dry-run を外してください')
  } else {
    info('次に npm run validate を実行すると review UI に反映されます')
  }
  log('')
}

main().catch(error => {
  err(`予期しないエラー: ${error instanceof Error ? error.stack ?? error.message : String(error)}`)
  process.exit(1)
})
