# v3 画像パイプライン：リッチ抽出 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 867問の画像問題から、余白トリム・choices復元・意味ラベル・問題概念を抽出し、下流分析（苦手分野解析・類似問題生成・問題分類）に使えるリッチデータを構築する。

**Architecture:** 3段階パイプライン。(1) sharp.trim() で画像余白除去、(2) Claude Code が画像を Read して VisionExtraction JSON を生成、(3) 結果を Question 型にマージ。すべて Node.js TypeScript スクリプト。

**Tech Stack:** TypeScript, sharp (画像処理), Claude Code Read/Write (Vision抽出), tsx (スクリプト実行)

**Spec:** `docs/superpowers/specs/2026-03-20-v3-rich-extraction-design.md`

---

## ファイル構成

| ファイル | 責務 | 操作 |
|---|---|---|
| `src/types/question.ts` | Question, Choice 型にリッチフィールド追加 | 修正 |
| `scripts/trim-image-whitespace.ts` | 画像余白トリム（sharp.trim + ページ番号カット） | 新規 |
| `scripts/build-vision-task-list.ts` | 867問→ページ画像マッピング → タスクリスト JSON 生成 | 新規 |
| `scripts/vision-extract-prompt.md` | Claude Code Agent 用の抽出プロンプト | 新規 |
| `scripts/merge-vision-results.ts` | JSONL結果 → exam-{year}.ts にマージ | 新規 |
| `scripts/output/vision-tasks.json` | タスクリスト（問題ID→画像パス） | 生成物 |
| `scripts/output/vision-extractions.jsonl` | 抽出結果（1行1問） | 生成物 |

---

## Task 1: Question/Choice 型の拡張

**Files:**
- Modify: `src/types/question.ts`

- [ ] **Step 1: Choice 型にリッチフィールドを追加**

```typescript
// src/types/question.ts の Choice インターフェースを拡張

/** 選択肢の表現形式 */
export type ChoiceType =
  | 'text'                // プレーンテキスト
  | 'text_pair'           // 組合せ表（A──B）
  | 'structural_formula'  // 構造式
  | 'graph'               // グラフ
  | 'equation'            // 数式・化学反応式
  | 'image_other'         // その他画像

/** 問題の選択肢 */
export interface Choice {
  key: number
  text: string
  semantic_labels?: string[]   // 意味ラベル（化合物名、概念名）
  choice_type?: ChoiceType     // 選択肢の表現形式
}
```

- [ ] **Step 2: Question 型にリッチフィールドを追加**

```typescript
// Question インターフェースに追加するフィールド

/** 画像内容の分類 */
export type VisualContentType =
  | 'structural_formula'  // 構造式・化学式
  | 'graph'               // グラフ・チャート
  | 'table'               // 表
  | 'diagram'             // フロー図・模式図
  | 'prescription'        // 処方箋・検査値表
  | 'text_only'           // テキストのみ（画像不要だった問題）
  | 'mixed'               // 複合

// Question インターフェース内に追加:
  visual_content_type?: VisualContentType
  question_concepts?: string[]      // 問題が扱う概念キーワード（2-5個）
  linked_group?: string             // 連問グループID（例: "r100-232-233"）
  linked_scenario?: string          // 連問の共通シナリオテキスト
```

- [ ] **Step 3: VisionExtraction 型を定義**（スクリプト用、別ファイル）

```typescript
// scripts/lib/vision-types.ts（新規作成）

import type { ChoiceType, VisualContentType } from '../../src/types/question'

/** Vision抽出結果（1問ごと） */
export interface VisionExtraction {
  question_id: string
  question_text_clean: string
  question_concepts: string[]
  visual_content_type: VisualContentType
  choices_extractable: boolean
  choices: VisionChoice[]
  linked_group?: string
  linked_scenario?: string
  confidence: number       // 0-1
  notes?: string
}

export interface VisionChoice {
  key: number
  text: string | null
  semantic_labels: string[]
  choice_type: ChoiceType
}
```

- [ ] **Step 4: ビルド確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsc --noEmit`
Expected: エラーなし（新フィールドはすべてオプショナル `?` なので既存コードに影響なし）

- [ ] **Step 5: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add src/types/question.ts scripts/lib/vision-types.ts
git commit -m "feat: Choice/Question型にリッチメタデータフィールドを追加

semantic_labels, choice_type, visual_content_type, question_concepts,
linked_group, linked_scenario を追加。全フィールドoptionalで後方互換性維持。"
```

---

## Task 2: 画像余白トリム

**Files:**
- Create: `scripts/trim-image-whitespace.ts`

- [ ] **Step 1: スクリプト作成**

```typescript
// scripts/trim-image-whitespace.ts
/**
 * クロップ済み画像の余白をトリムする
 * - sharp.trim() で白い余白を自動除去
 * - ページ番号領域（「− N −」パターン、下端80px）をカット
 *
 * npx tsx scripts/trim-image-whitespace.ts
 * npx tsx scripts/trim-image-whitespace.ts --year 100
 * npx tsx scripts/trim-image-whitespace.ts --dry-run    # 変更せずレポートのみ
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

  // Step 2: 下端カット → trim で余白除去
  const trimmed = sharp(imgPath)
    .extract({ left: 0, top: 0, width: origW, height: contentHeight })
    .trim({ threshold: TRIM_THRESHOLD })

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
    savedBytes: 0,  // ファイルサイズは実測が面倒なのでピクセル差で代替
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
```

- [ ] **Step 2: dry-run で動作確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsx scripts/trim-image-whitespace.ts --dry-run --year 100`
Expected: 各画像のトリム前後サイズが表示される。エラーなし。

- [ ] **Step 3: 1年分で本番実行して画像を目視確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsx scripts/trim-image-whitespace.ts --year 103`
Then: `open public/images/questions/103/q091.png` で余白が除去されていることを確認

- [ ] **Step 4: 全年度実行**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsx scripts/trim-image-whitespace.ts`
Expected: 909枚処理、多くの画像でトリムが実施される

- [ ] **Step 5: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add scripts/trim-image-whitespace.ts
git commit -m "feat: 画像余白トリムスクリプト — sharp.trim()でページ番号・余白を除去"
```

画像ファイル自体（public/images/questions/）は .gitignore の設定次第。大きすぎればコミット対象外。

---

## Task 3: Vision タスクリスト生成

**Files:**
- Create: `scripts/build-vision-task-list.ts`
- Create: `scripts/output/` (ディレクトリ)

- [ ] **Step 1: タスクリスト生成スクリプト作成**

```typescript
// scripts/build-vision-task-list.ts
/**
 * choices空の867問から、Vision抽出用のタスクリストを生成する
 * 各問題に対応するページ画像パスをマッピングして出力
 *
 * npx tsx scripts/build-vision-task-list.ts
 * 出力: scripts/output/vision-tasks.json
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

import { parseBboxPage, findQuestionPositions, isCoverPage } from './lib/bbox-parser.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface VisionTask {
  question_id: string          // "r100-233"
  year: number
  question_number: number
  page_image_path: string      // "/tmp/claude/exam-pages/100/q100-jissen1-32.png"
  page_questions: number[]     // 同じページにある他の問題番号（コンテキスト用）
}

interface PdfConfig {
  file: string
  prefix: string
  qRange: [number, number]
}

function getPdfConfigs(year: number): PdfConfig[] {
  return [
    { file: `q${year}-hissu.pdf`, prefix: `q${year}-hissu`, qRange: [1, 90] },
    { file: `q${year}-riron1.pdf`, prefix: `q${year}-riron1`, qRange: [91, 150] },
    { file: `q${year}-riron2.pdf`, prefix: `q${year}-riron2`, qRange: [151, 195] },
    { file: `q${year}-jissen1.pdf`, prefix: `q${year}-jissen1`, qRange: [196, 245] },
    { file: `q${year}-jissen2.pdf`, prefix: `q${year}-jissen2`, qRange: [246, 285] },
    { file: `q${year}-jissen3.pdf`, prefix: `q${year}-jissen3`, qRange: [286, 345] },
  ]
}

function getPdfPageCount(pdfPath: string): number {
  try {
    const info = execSync(`pdfinfo "${pdfPath}" 2>/dev/null`, { encoding: 'utf-8' })
    const m = info.match(/Pages:\s+(\d+)/)
    return m ? parseInt(m[1]) : 0
  } catch { return 0 }
}

function getBboxHtml(pdfPath: string, page: number): string {
  try {
    return execSync(`pdftotext -bbox -f ${page} -l ${page} "${pdfPath}" -`, {
      encoding: 'utf-8', timeout: 10000,
    })
  } catch { return '' }
}

function findPageImage(pagesDir: string, prefix: string, page: number): string | null {
  const pad2 = path.join(pagesDir, `${prefix}-${String(page).padStart(2, '0')}.png`)
  if (fs.existsSync(pad2)) return pad2
  const pad3 = path.join(pagesDir, `${prefix}-${String(page).padStart(3, '0')}.png`)
  if (fs.existsSync(pad3)) return pad3
  return null
}

function loadEmptyChoicesQuestions(year: number): Set<number> {
  const tsPath = path.join(__dirname, '..', 'src', 'data', 'real-questions', `exam-${year}.ts`)
  if (!fs.existsSync(tsPath)) return new Set()
  const content = fs.readFileSync(tsPath, 'utf-8')
  const arrayStart = content.indexOf('[\n')
  if (arrayStart === -1) return new Set()
  const jsonPart = content.substring(arrayStart).trimEnd()
  try {
    const questions = JSON.parse(jsonPart)
    const emptySet = new Set<number>()
    for (const q of questions) {
      if (!q.choices || q.choices.length === 0) emptySet.add(q.question_number)
    }
    return emptySet
  } catch { return new Set() }
}

async function main() {
  const outputDir = path.join(__dirname, 'output')
  fs.mkdirSync(outputDir, { recursive: true })

  const years = Array.from({ length: 11 }, (_, i) => 100 + i)
  const tasks: VisionTask[] = []

  for (const year of years) {
    const targetSet = loadEmptyChoicesQuestions(year)
    if (targetSet.size === 0) continue
    console.log(`第${year}回: choices空 ${targetSet.size}問`)

    const pagesDir = `/tmp/claude/exam-pages/${year}`
    const pdfs = getPdfConfigs(year)

    for (const pdf of pdfs) {
      const pdfPath = `/tmp/claude/${pdf.file}`
      if (!fs.existsSync(pdfPath)) continue

      const relevantTargets = [...targetSet].filter(
        n => n >= pdf.qRange[0] && n <= pdf.qRange[1]
      )
      if (relevantTargets.length === 0) continue

      const totalPages = getPdfPageCount(pdfPath)

      for (let p = 1; p <= totalPages; p++) {
        const html = getBboxHtml(pdfPath, p)
        if (!html) continue

        const pageInfo = parseBboxPage(html)
        if (isCoverPage(pageInfo)) continue

        const positions = findQuestionPositions(pageInfo)
        if (positions.length === 0) continue

        const pageQNums = positions.map(pos => pos.questionNumber)
        const targetPositions = positions.filter(pos => targetSet.has(pos.questionNumber))
        if (targetPositions.length === 0) continue

        const imgPath = findPageImage(pagesDir, pdf.prefix, p)
        if (!imgPath) continue

        for (const tPos of targetPositions) {
          tasks.push({
            question_id: `r${year}-${String(tPos.questionNumber).padStart(3, '0')}`,
            year,
            question_number: tPos.questionNumber,
            page_image_path: imgPath,
            page_questions: pageQNums,
          })
        }
      }
    }
  }

  // 重複排除（同じ問題が複数ページにマッチする可能性）
  const seen = new Set<string>()
  const uniqueTasks = tasks.filter(t => {
    if (seen.has(t.question_id)) return false
    seen.add(t.question_id)
    return true
  })

  const outputPath = path.join(outputDir, 'vision-tasks.json')
  fs.writeFileSync(outputPath, JSON.stringify(uniqueTasks, null, 2))

  console.log(`\n=== サマリー ===`)
  console.log(`タスク生成: ${uniqueTasks.length}問`)
  console.log(`出力: ${outputPath}`)

  // 年度別の内訳
  const byYear = new Map<number, number>()
  for (const t of uniqueTasks) {
    byYear.set(t.year, (byYear.get(t.year) ?? 0) + 1)
  }
  for (const [y, c] of [...byYear].sort((a, b) => a[0] - b[0])) {
    console.log(`  第${y}回: ${c}問`)
  }
}

main().catch(console.error)
```

- [ ] **Step 2: 実行してタスクリスト生成**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsx scripts/build-vision-task-list.ts`
Expected: `scripts/output/vision-tasks.json` に 800-867 件のタスクが出力される

- [ ] **Step 3: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add scripts/build-vision-task-list.ts
git commit -m "feat: Vision抽出タスクリスト生成 — 867問→ページ画像マッピング"
```

---

## Task 4: Vision 抽出プロンプト作成

**Files:**
- Create: `scripts/vision-extract-prompt.md`

- [ ] **Step 1: プロンプトファイル作成**

```markdown
# scripts/vision-extract-prompt.md

この薬剤師国家試験の問題画像を分析し、以下のJSON形式で情報を抽出してください。

## 対象問題

この画像には問題番号 {QUESTION_NUMBERS} が含まれています。
そのうち {TARGET_QUESTIONS} の情報を抽出してください。

## 抽出ルール

### question_text_clean
- 問題文を正確に書き起こす
- 「問 N」の番号は除外し、問い文のみ記載
- OCRゴミ（グラフラベル・表データの断片）は除外
- 下付き・上付きの数字は通常の数字に正規化（「₁₇歳」→「17歳」）

### question_concepts
- この問題が問う薬学概念を2-5個のキーワードで
- 具体的な物質名ではなく、分野・テーマレベル
- 例: ["メソ化合物", "立体化学", "対称性"]

### visual_content_type
- structural_formula: 構造式・化学式が主体
- graph: グラフ・チャート
- table: 表形式（組合せ表含む）
- diagram: フロー図・模式図・反応経路図
- prescription: 処方箋・検査値表
- text_only: テキストのみ（画像がなくても解ける問題）
- mixed: 複合（表+構造式など）

### choices
- **テキスト化可能な選択肢**:
  - text にテキストを記載
  - choice_type を "text"（通常テキスト）または "text_pair"（A──B の組合せ）に
- **画像でしか表現できない選択肢**（構造式・グラフなど）:
  - text を null に
  - choice_type を "structural_formula", "graph", "equation", "image_other" のいずれかに
- choices_extractable: 選択肢の過半数がテキスト化可能なら true

### semantic_labels（最重要）
- 各選択肢が何を表しているかを1-3個のラベルで記述
- テキスト選択肢でも必ず付与する
- 構造式: 化合物名、官能基、特徴（例: ["2,3-ジブロモブタン", "Br置換", "メソ体候補"]）
- テキスト: キーワード（例: ["ツキヨタケ", "イルジンS", "キノコ毒"]）
- 数式: 式の意味（例: ["一次反応速度式", "k=0.01/min"]）

### 連問検出
- 「問 N-M」「問 N〜M」パターン → linked_group: "r{year}-{N}-{M}"
- 共通シナリオ（患者情報・症例）→ linked_scenario にテキスト記載

### confidence
- 0.9-1.0: 明確に読み取れた
- 0.7-0.9: 概ね正確だが一部推定
- 0.5-0.7: 推定が多い（手動レビュー推奨）

## 出力形式

JSON配列で出力。説明文は不要、JSONのみ。

[
  {
    "question_id": "r100-233",
    "question_text_clean": "...",
    "question_concepts": ["...", "..."],
    "visual_content_type": "table",
    "choices_extractable": true,
    "choices": [
      {"key": 1, "text": "...", "semantic_labels": ["...", "..."], "choice_type": "text_pair"},
      ...
    ],
    "linked_group": "r100-232-233",
    "linked_scenario": "...",
    "confidence": 0.95
  }
]
```

- [ ] **Step 2: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add scripts/vision-extract-prompt.md
git commit -m "docs: Vision抽出プロンプト — リッチメタデータ抽出用テンプレート"
```

---

## Task 5: Vision 抽出バッチ実行（Claude Code Agent 方式）

**Files:**
- Create: `scripts/run-vision-extraction.ts` (Agent ディスパッチ用のガイドスクリプト)

**注意:** このタスクは Claude Code セッション内で Agent を使って実行する。スクリプトは「何を処理すべきか」を表示するガイド役。実際の画像読み取りは Agent が Read ツールで行う。

- [ ] **Step 1: バッチ実行ガイドスクリプト作成**

```typescript
// scripts/run-vision-extraction.ts
/**
 * Vision抽出のバッチ実行ガイド
 * vision-tasks.json を読み、年度ごとのバッチに分割して表示する
 * 実際の抽出は Claude Code Agent が画像を Read して実行する
 *
 * npx tsx scripts/run-vision-extraction.ts                # 全体の状況表示
 * npx tsx scripts/run-vision-extraction.ts --year 100     # 特定年度のタスク表示
 * npx tsx scripts/run-vision-extraction.ts --status       # 進捗確認
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface VisionTask {
  question_id: string
  year: number
  question_number: number
  page_image_path: string
  page_questions: number[]
}

function main() {
  const tasksPath = path.join(__dirname, 'output', 'vision-tasks.json')
  const resultsPath = path.join(__dirname, 'output', 'vision-extractions.jsonl')

  if (!fs.existsSync(tasksPath)) {
    console.error('エラー: vision-tasks.json が見つかりません')
    console.error('先に実行: npx tsx scripts/build-vision-task-list.ts')
    process.exit(1)
  }

  const tasks: VisionTask[] = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'))

  // 完了済みの問題IDを取得
  const completedIds = new Set<string>()
  if (fs.existsSync(resultsPath)) {
    const lines = fs.readFileSync(resultsPath, 'utf-8').trim().split('\n')
    for (const line of lines) {
      if (!line) continue
      try {
        const obj = JSON.parse(line)
        completedIds.add(obj.question_id)
      } catch {}
    }
  }

  const yearArg = process.argv.find((_, i) => process.argv[i - 1] === '--year')
  const showStatus = process.argv.includes('--status')

  // 年度別に集計
  const byYear = new Map<number, VisionTask[]>()
  for (const t of tasks) {
    if (!byYear.has(t.year)) byYear.set(t.year, [])
    byYear.get(t.year)!.push(t)
  }

  if (showStatus) {
    console.log('=== Vision抽出 進捗 ===')
    console.log(`完了: ${completedIds.size} / ${tasks.length}問`)
    console.log('')
    for (const [year, yearTasks] of [...byYear].sort((a, b) => a[0] - b[0])) {
      const done = yearTasks.filter(t => completedIds.has(t.question_id)).length
      const bar = '█'.repeat(Math.round(done / yearTasks.length * 20)).padEnd(20, '░')
      console.log(`  第${year}回: ${bar} ${done}/${yearTasks.length}`)
    }
    return
  }

  if (yearArg) {
    const year = Number(yearArg)
    const yearTasks = byYear.get(year) ?? []
    const remaining = yearTasks.filter(t => !completedIds.has(t.question_id))
    console.log(`第${year}回: 残り${remaining.length}問（完了${yearTasks.length - remaining.length}）`)

    // ページ画像でグループ化（同じページの問題はまとめて処理）
    const byPage = new Map<string, VisionTask[]>()
    for (const t of remaining) {
      if (!byPage.has(t.page_image_path)) byPage.set(t.page_image_path, [])
      byPage.get(t.page_image_path)!.push(t)
    }

    console.log(`\nページ画像: ${byPage.size}枚`)
    for (const [imgPath, pageTasks] of byPage) {
      const qNums = pageTasks.map(t => `問${t.question_number}`).join(', ')
      console.log(`  ${path.basename(imgPath)}: ${qNums}`)
    }
    return
  }

  // デフォルト: 全体サマリー
  console.log('=== Vision抽出 タスク一覧 ===')
  console.log(`全体: ${tasks.length}問 / 完了: ${completedIds.size} / 残り: ${tasks.length - completedIds.size}`)
  console.log('')
  for (const [year, yearTasks] of [...byYear].sort((a, b) => a[0] - b[0])) {
    const done = yearTasks.filter(t => completedIds.has(t.question_id)).length
    console.log(`  第${year}回: ${yearTasks.length}問（完了${done}）`)
  }
  console.log('')
  console.log('使い方:')
  console.log('  npx tsx scripts/run-vision-extraction.ts --year 100   # 年度別タスク確認')
  console.log('  npx tsx scripts/run-vision-extraction.ts --status     # 進捗バー表示')
}

main()
```

- [ ] **Step 2: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add scripts/run-vision-extraction.ts
git commit -m "feat: Vision抽出バッチ実行ガイド — 進捗管理とタスク表示"
```

- [ ] **Step 3: Agent 並列で実際に抽出を実行**

実行方法: Claude Code セッション内で以下のパターンで Agent を起動する。
各 Agent は年度ごとに独立して動作し、画像を Read → 解析 → JSONL に追記。

```
Agent prompt（年度ごとに1つ）:

「scripts/output/vision-tasks.json から第{YEAR}回の問題を処理してください。

手順:
1. vision-tasks.json から year={YEAR} のタスクを読む
2. ページ画像ごとにグループ化する（同じページの問題はまとめて処理）
3. 各ページ画像を Read ツールで読み取る
4. scripts/vision-extract-prompt.md のルールに従い、VisionExtraction JSON を生成
5. 結果を scripts/output/vision-extractions.jsonl に1行1問で追記（Write ツール使用）

注意:
- 既に vision-extractions.jsonl に存在する question_id はスキップする
- 1ページに複数問ある場合はまとめて処理する（画像の Read 回数を最小化）
- confidence が 0.7 未満の場合は notes に理由を記載する」
```

年度を3-5グループに分けて並列実行:
- Group A: 100-101（166問）
- Group B: 102-103（150問）
- Group C: 104-105（144問）
- Group D: 106-107（157問）
- Group E: 108-110（250問）

Expected: 各 Agent が 30-60分で完了。合計2-3時間。

---

## Task 6: 結果マージ

**Files:**
- Create: `scripts/merge-vision-results.ts`

- [ ] **Step 1: マージスクリプト作成**

```typescript
// scripts/merge-vision-results.ts
/**
 * Vision抽出結果を exam-{year}.ts にマージする
 *
 * npx tsx scripts/merge-vision-results.ts --dry-run    # 変更内容を確認
 * npx tsx scripts/merge-vision-results.ts              # 実行
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface VisionExtraction {
  question_id: string
  question_text_clean: string
  question_concepts: string[]
  visual_content_type: string
  choices_extractable: boolean
  choices: {
    key: number
    text: string | null
    semantic_labels: string[]
    choice_type: string
  }[]
  linked_group?: string
  linked_scenario?: string
  confidence: number
  notes?: string
}

function loadExtractions(): VisionExtraction[] {
  const resultsPath = path.join(__dirname, 'output', 'vision-extractions.jsonl')
  if (!fs.existsSync(resultsPath)) {
    console.error('エラー: vision-extractions.jsonl が見つかりません')
    process.exit(1)
  }
  const lines = fs.readFileSync(resultsPath, 'utf-8').trim().split('\n')
  const results: VisionExtraction[] = []
  for (const line of lines) {
    if (!line) continue
    try {
      results.push(JSON.parse(line))
    } catch (e) {
      console.error(`JSON パースエラー: ${line.substring(0, 50)}...`)
    }
  }
  return results
}

function main() {
  const dryRun = process.argv.includes('--dry-run')
  const extractions = loadExtractions()
  console.log(`${dryRun ? '[DRY RUN] ' : ''}読み込み: ${extractions.length}問の抽出結果`)

  // year ごとにグループ化
  const byYear = new Map<number, VisionExtraction[]>()
  for (const ext of extractions) {
    const year = parseInt(ext.question_id.split('-')[0].replace('r', ''))
    if (!byYear.has(year)) byYear.set(year, [])
    byYear.get(year)!.push(ext)
  }

  let totalChoicesRestored = 0
  let totalConceptsAdded = 0
  let totalLowConfidence = 0

  for (const [year, yearExts] of [...byYear].sort((a, b) => a[0] - b[0])) {
    const tsPath = path.join(__dirname, '..', 'src', 'data', 'real-questions', `exam-${year}.ts`)
    if (!fs.existsSync(tsPath)) {
      console.log(`  第${year}回: ファイルなし — スキップ`)
      continue
    }

    const content = fs.readFileSync(tsPath, 'utf-8')
    const arrayStart = content.indexOf('[\n')
    if (arrayStart === -1) continue

    const header = content.substring(0, arrayStart)
    const jsonPart = content.substring(arrayStart).trimEnd()
    let questions: any[]
    try {
      questions = JSON.parse(jsonPart)
    } catch { continue }

    const extMap = new Map(yearExts.map(e => [e.question_id, e]))
    let yearChoicesRestored = 0

    for (const q of questions) {
      const ext = extMap.get(q.id)
      if (!ext) continue

      // confidence チェック
      if (ext.confidence < 0.7) {
        totalLowConfidence++
      }

      // question_text の更新（confidence >= 0.7 のみ）
      if (ext.confidence >= 0.7 && ext.question_text_clean) {
        q.question_text = ext.question_text_clean
      }

      // question_concepts の追加
      if (ext.question_concepts && ext.question_concepts.length > 0) {
        q.question_concepts = ext.question_concepts
        totalConceptsAdded++
      }

      // visual_content_type の追加
      if (ext.visual_content_type) {
        q.visual_content_type = ext.visual_content_type
      }

      // choices の復元（extractable かつ confidence >= 0.7）
      if (ext.choices_extractable && ext.confidence >= 0.7 && ext.choices.length > 0) {
        q.choices = ext.choices.map(c => ({
          key: c.key,
          text: c.text ?? '',  // null → 空文字（型互換のため）
          semantic_labels: c.semantic_labels,
          choice_type: c.choice_type,
        }))
        yearChoicesRestored++
        totalChoicesRestored++
      } else {
        // 画像問題のまま — semantic_labels だけ付与
        if (ext.choices.length > 0) {
          q.choices = ext.choices.map(c => ({
            key: c.key,
            text: c.text ?? '',
            semantic_labels: c.semantic_labels,
            choice_type: c.choice_type,
          }))
        }
      }

      // 連問情報
      if (ext.linked_group) q.linked_group = ext.linked_group
      if (ext.linked_scenario) q.linked_scenario = ext.linked_scenario
    }

    console.log(`  第${year}回: ${yearExts.length}問マージ（choices復元: ${yearChoicesRestored}）`)

    if (!dryRun) {
      const newContent = header + JSON.stringify(questions, null, 2) + '\n'
      fs.writeFileSync(tsPath, newContent)
    }
  }

  console.log(`\n=== サマリー ===`)
  console.log(`choices復元: ${totalChoicesRestored}問`)
  console.log(`concepts追加: ${totalConceptsAdded}問`)
  console.log(`低confidence (< 0.7): ${totalLowConfidence}問（要手動レビュー）`)
}

main()
```

- [ ] **Step 2: dry-run で確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsx scripts/merge-vision-results.ts --dry-run`
Expected: 各年度のマージ件数とchoices復元数が表示される

- [ ] **Step 3: 本番実行**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsx scripts/merge-vision-results.ts`
Expected: exam-{year}.ts が更新される

- [ ] **Step 4: ビルド確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsc --noEmit`
Expected: 型エラーなし

- [ ] **Step 5: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add scripts/merge-vision-results.ts src/data/real-questions/
git commit -m "feat: Vision抽出結果マージ — choices復元・概念・意味ラベル追加"
```

---

## Task 7: 品質検証

- [ ] **Step 1: サンプル検証**

引き継ぎ資料の8問で品質を確認:
- 100回 問233: choices復元されているか、semantic_labelsが正確か
- 100回 問8: structural_formula として分類、semantic_labelsに化合物名があるか
- 100回 問239: テキスト選択肢が正確に復元されているか
- 107回 問197: 連問として linked_group が設定されているか

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && node -e "
const data = require('./src/data/real-questions/exam-100.ts');
// 問233, 問239, 問8 を確認
for (const q of data.EXAM_100_QUESTIONS) {
  if ([8, 233, 239].includes(q.question_number)) {
    console.log(JSON.stringify(q, null, 2));
  }
}
"`

- [ ] **Step 2: 統計レポート**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
node -e "
const fs = require('fs');
const lines = fs.readFileSync('scripts/output/vision-extractions.jsonl', 'utf-8').trim().split('\n');
const data = lines.map(l => JSON.parse(l));
console.log('=== 抽出結果統計 ===');
console.log('総数:', data.length);
console.log('choices復元可能:', data.filter(d => d.choices_extractable).length);
console.log('confidence >= 0.9:', data.filter(d => d.confidence >= 0.9).length);
console.log('confidence < 0.7:', data.filter(d => d.confidence < 0.7).length);
const types = {};
data.forEach(d => { types[d.visual_content_type] = (types[d.visual_content_type] || 0) + 1; });
console.log('visual_content_type 分布:', types);
"
```

- [ ] **Step 3: 最終コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add -A
git commit -m "feat: v3画像パイプライン完了 — リッチメタデータ抽出・choices復元・余白トリム"
```
