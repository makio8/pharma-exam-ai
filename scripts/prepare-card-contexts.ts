/**
 * カードコンテキスト準備スクリプト
 *
 * exemplar ごとに過去問・付箋を集約し、Claude サブエージェント用の
 * コンテキスト JSON ファイルを書き出す。Claude API は呼ばない。
 *
 * Usage:
 *   npx tsx scripts/prepare-card-contexts.ts                    # 全対象（~430 exemplar）
 *   npx tsx scripts/prepare-card-contexts.ts --limit 5          # 最初の5件だけ
 *   npx tsx scripts/prepare-card-contexts.ts --exemplar ex-pharmacology-067d  # 1件だけ
 *   npx tsx scripts/prepare-card-contexts.ts --subject 薬理     # 科目フィルタ
 *   npx tsx scripts/prepare-card-contexts.ts --status           # 進捗確認
 *   npx tsx scripts/prepare-card-contexts.ts --resume           # 既存結果JSONがあるものをスキップ
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { EXEMPLAR_STATS } from '../src/data/exemplar-stats.ts'
import { EXEMPLARS } from '../src/data/exemplars.ts'
import { QUESTION_EXEMPLAR_MAP } from '../src/data/question-exemplar-map.ts'
import { ALL_QUESTIONS } from '../src/data/all-questions.ts'
import { OFFICIAL_NOTES } from '../src/data/official-notes.ts'

import {
  filterTargetExemplars,
  buildExemplarContext,
  formatContextForPrompt,
} from './lib/card-pipeline-core.ts'
import type { FilteredExemplar } from './lib/card-pipeline-core.ts'
import type { QuestionExemplarMapping } from '../src/types/blueprint.ts'
import type { Question } from '../src/types/question.ts'

// ──────────────────────────────────────────────
// パス設定
// ──────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CONTEXT_DIR = path.join(__dirname, 'output', 'text-cards', 'contexts')
const RESULT_DIR = path.join(__dirname, 'output', 'text-cards')

// ──────────────────────────────────────────────
// コンテキスト JSON の型
// ──────────────────────────────────────────────

interface ContextFile {
  exemplarId: string
  subject: string
  tier: string
  maxAtoms: number
  questionCount: number
  noteCount: number
  promptText: string
  createdAt: string
}

// ──────────────────────────────────────────────
// CLI引数パース
// ──────────────────────────────────────────────

interface CliArgs {
  limit: number | null
  exemplar: string | null
  subject: string | null
  status: boolean
  resume: boolean
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const result: CliArgs = {
    limit: null,
    exemplar: null,
    subject: null,
    status: false,
    resume: false,
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--limit':
        result.limit = parseInt(args[++i], 10)
        break
      case '--exemplar':
        result.exemplar = args[++i]
        break
      case '--subject':
        result.subject = args[++i]
        break
      case '--status':
        result.status = true
        break
      case '--resume':
        result.resume = true
        break
      default:
        console.error(`不明なオプション: ${args[i]}`)
        process.exit(1)
    }
  }

  return result
}

// ──────────────────────────────────────────────
// ルックアップマップ構築（パフォーマンス最適化）
// ──────────────────────────────────────────────

function buildLookupMaps() {
  const questionMap = new Map<string, Question>(
    ALL_QUESTIONS.map(q => [q.id, q])
  )

  const mappingsByExemplar = new Map<string, QuestionExemplarMapping[]>()
  for (const m of QUESTION_EXEMPLAR_MAP) {
    const list = mappingsByExemplar.get(m.exemplarId) ?? []
    list.push(m)
    mappingsByExemplar.set(m.exemplarId, list)
  }

  return { questionMap, mappingsByExemplar }
}

// ──────────────────────────────────────────────
// フィルタ適用
// ──────────────────────────────────────────────

function applyFilters(
  targets: FilteredExemplar[],
  args: CliArgs,
): FilteredExemplar[] {
  let filtered = targets

  if (args.exemplar) {
    filtered = filtered.filter(t => t.exemplarId === args.exemplar)
  }

  if (args.subject) {
    filtered = filtered.filter(t => t.subject.includes(args.subject!))
  }

  if (args.limit !== null) {
    filtered = filtered.slice(0, args.limit)
  }

  return filtered
}

// ──────────────────────────────────────────────
// --status: 進捗表示
// ──────────────────────────────────────────────

function showStatus(allTargets: FilteredExemplar[]): void {
  const contextCount = countFilesInDir(CONTEXT_DIR)
  const resultCount = countFilesInDir(RESULT_DIR, true)

  console.log('=== コンテキスト準備 進捗 ===')
  console.log(`対象exemplar数: ${allTargets.length}件`)
  console.log(`コンテキストJSON: ${contextCount}件 (contexts/)`)
  console.log(`結果JSON: ${resultCount}件 (text-cards/)`)
  console.log(`未生成: ${allTargets.length - resultCount}件`)
}

function countFilesInDir(dir: string, excludeSubdirs = false): number {
  if (!fs.existsSync(dir)) return 0
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.filter(e => {
    if (excludeSubdirs && e.isDirectory()) return false
    return e.isFile() && e.name.endsWith('.json')
  }).length
}

// ──────────────────────────────────────────────
// メイン処理
// ──────────────────────────────────────────────

function main(): void {
  const args = parseArgs()

  // Step 1: 全対象 exemplar を抽出
  const allTargets = filterTargetExemplars(EXEMPLAR_STATS)

  // --status モード
  if (args.status) {
    showStatus(allTargets)
    return
  }

  // Step 2: CLIフィルタ適用
  let targets = applyFilters(allTargets, args)

  // Step 3: --resume: 既存結果JSONがある exemplar をスキップ
  let skipped = 0
  if (args.resume) {
    const before = targets.length
    targets = targets.filter(t => {
      const resultPath = path.join(RESULT_DIR, `${t.exemplarId}.json`)
      return !fs.existsSync(resultPath)
    })
    skipped = before - targets.length
  }

  if (targets.length === 0) {
    console.log('対象 exemplar がありません。')
    if (skipped > 0) {
      console.log(`（${skipped}件はスキップ済み）`)
    }
    return
  }

  // Step 4: ルックアップマップ構築（1回だけ）
  const { questionMap, mappingsByExemplar } = buildLookupMaps()

  // Step 5: 出力ディレクトリ作成
  fs.mkdirSync(CONTEXT_DIR, { recursive: true })

  // Step 6: 各 exemplar のコンテキスト生成 & 書き出し
  let written = 0
  let failed = 0
  let totalQuestions = 0
  let totalNotes = 0

  for (const target of targets) {
    try {
      // パフォーマンス最適化: 関連するマッピング・問題だけを渡す
      const relevantMappings = mappingsByExemplar.get(target.exemplarId) ?? []
      const relevantQuestionIds = new Set(relevantMappings.map(m => m.questionId))
      const relevantQuestions = [...relevantQuestionIds]
        .map(id => questionMap.get(id))
        .filter((q): q is Question => q !== undefined)

      const ctx = buildExemplarContext(
        target.exemplarId,
        target.tier,
        target.maxAtoms,
        EXEMPLARS,
        relevantMappings,
        relevantQuestions,
        OFFICIAL_NOTES,
      )

      const promptText = formatContextForPrompt(ctx)

      const contextFile: ContextFile = {
        exemplarId: ctx.exemplarId,
        subject: ctx.subject,
        tier: ctx.tier,
        maxAtoms: ctx.maxAtoms,
        questionCount: ctx.questions.length,
        noteCount: ctx.notes.length,
        promptText,
        createdAt: new Date().toISOString(),
      }

      const outPath = path.join(CONTEXT_DIR, `${ctx.exemplarId}.json`)
      fs.writeFileSync(outPath, JSON.stringify(contextFile, null, 2), 'utf-8')

      written++
      totalQuestions += ctx.questions.length
      totalNotes += ctx.notes.length
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  ❌ ${target.exemplarId}: ${msg}`)
      failed++
    }
  }

  // Step 7: サマリー表示
  const avgQuestions = written > 0 ? (totalQuestions / written).toFixed(1) : '0'
  const avgNotes = written > 0 ? (totalNotes / written).toFixed(1) : '0'

  console.log('')
  console.log('=== コンテキスト準備完了 ===')
  console.log(`対象: ${allTargets.length}件`)
  console.log(`書き出し: ${written}件`)
  console.log(`失敗: ${failed}件`)
  console.log(`スキップ: ${skipped}件`)
  console.log(`平均問題数: ${avgQuestions}問/exemplar`)
  console.log(`平均付箋数: ${avgNotes}枚/exemplar`)
  console.log('')
  console.log('次のステップ: メインセッションからサブエージェントをディスパッチしてカード生成')
}

main()
