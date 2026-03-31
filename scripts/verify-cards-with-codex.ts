#!/usr/bin/env npx tsx
/**
 * verify-cards-with-codex.ts
 *
 * 低confidence（自信度）カードをバッチでCodex（GPT-5.4）に検証依頼するための
 * レビュープロンプトを生成するCLIツール。
 *
 * 入力: scripts/output/text-cards/*.json (GenerationResult形式、.error.jsonはスキップ)
 * 出力: scripts/output/text-cards/codex-reviews/batch-NNN.prompt.txt
 *
 * Usage:
 *   npx tsx scripts/verify-cards-with-codex.ts                    # バッチプロンプト生成
 *   npx tsx scripts/verify-cards-with-codex.ts --threshold 0.9   # 閾値変更
 *   npx tsx scripts/verify-cards-with-codex.ts --stats            # 統計のみ
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import type { GenerationResult } from './lib/card-pipeline-types'
import type { KnowledgeAtom } from '../src/types/knowledge-atom'

// --- 型定義 ---

interface LowConfidenceCard {
  atomId: string
  exemplarId: string
  recallDirection: string
  front: string
  back: string
  confidenceScore: number
  knowledgeType: string
}

// --- パス設定 ---

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const INPUT_DIR = path.join(__dirname, 'output', 'text-cards')
const OUTPUT_DIR = path.join(__dirname, 'output', 'text-cards', 'codex-reviews')

// --- 定数 ---

const DEFAULT_THRESHOLD = 0.8
const BATCH_SIZE = 20

// --- CLIフラグ解析 ---

const args = process.argv.slice(2)
const statsOnly = args.includes('--stats')

let threshold = DEFAULT_THRESHOLD
const thresholdIdx = args.indexOf('--threshold')
if (thresholdIdx !== -1 && args[thresholdIdx + 1]) {
  const parsed = parseFloat(args[thresholdIdx + 1])
  if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
    threshold = parsed
  } else {
    console.error(`無効な閾値: ${args[thresholdIdx + 1]}（0〜1の範囲で指定してください）`)
    process.exit(1)
  }
}

// --- メイン処理 ---

function loadResultFiles(): GenerationResult[] {
  if (!fs.existsSync(INPUT_DIR)) {
    console.log('結果ファイルなし（ディレクトリが存在しません）')
    process.exit(0)
  }

  const files = fs.readdirSync(INPUT_DIR).filter(f =>
    f.endsWith('.json') && !f.endsWith('.error.json')
  )

  if (files.length === 0) {
    console.log('結果ファイルなし')
    process.exit(0)
  }

  const results: GenerationResult[] = []
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(INPUT_DIR, file), 'utf-8')
      const data = JSON.parse(raw) as GenerationResult
      if (data.atoms && Array.isArray(data.atoms)) {
        results.push(data)
      }
    } catch {
      // パースエラーは無視（不正なJSONファイルをスキップ）
    }
  }

  return results
}

function collectLowConfidenceCards(results: GenerationResult[], thresh: number): LowConfidenceCard[] {
  const cards: LowConfidenceCard[] = []

  for (const result of results) {
    for (const atom of result.atoms) {
      for (const card of atom.cards) {
        if (card.confidence_score < thresh) {
          cards.push({
            atomId: atom.id,
            exemplarId: atom.exemplar_id,
            recallDirection: card.recall_direction,
            front: card.front,
            back: card.back,
            confidenceScore: card.confidence_score,
            knowledgeType: atom.knowledge_type,
          })
        }
      }
    }
  }

  // 自信度が低い順にソート（最も検証が必要なものを先に）
  cards.sort((a, b) => a.confidenceScore - b.confidenceScore)
  return cards
}

function collectAllConfidenceScores(results: GenerationResult[]): number[] {
  const scores: number[] = []
  for (const result of results) {
    for (const atom of result.atoms) {
      for (const card of atom.cards) {
        scores.push(card.confidence_score)
      }
    }
  }
  return scores
}

function showStats(results: GenerationResult[], thresh: number): void {
  const allScores = collectAllConfidenceScores(results)

  if (allScores.length === 0) {
    console.log('カード0枚（生成結果にカードが含まれていません）')
    return
  }

  // 分布計算
  const buckets: Record<string, number> = {
    '0.0-0.5': 0,
    '0.5-0.6': 0,
    '0.6-0.7': 0,
    '0.7-0.8': 0,
    '0.8-0.9': 0,
    '0.9-1.0': 0,
  }

  for (const score of allScores) {
    if (score < 0.5) buckets['0.0-0.5']++
    else if (score < 0.6) buckets['0.5-0.6']++
    else if (score < 0.7) buckets['0.6-0.7']++
    else if (score < 0.8) buckets['0.7-0.8']++
    else if (score < 0.9) buckets['0.8-0.9']++
    else buckets['0.9-1.0']++
  }

  const lowCount = allScores.filter(s => s < thresh).length

  console.log('=== Confidence Score 分布 ===')
  console.log(`全カード数: ${allScores.length}`)
  console.log(`閾値: ${thresh}`)
  console.log(`低confidence（< ${thresh}）: ${lowCount}枚 (${((lowCount / allScores.length) * 100).toFixed(1)}%)`)
  console.log('')
  console.log('範囲        | 枚数  | 割合')
  console.log('------------|-------|------')
  for (const [range, count] of Object.entries(buckets)) {
    const pct = ((count / allScores.length) * 100).toFixed(1)
    const bar = '█'.repeat(Math.round(count / allScores.length * 30))
    console.log(`${range.padEnd(12)}| ${String(count).padStart(5)} | ${pct.padStart(5)}% ${bar}`)
  }

  const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length
  const min = Math.min(...allScores)
  const max = Math.max(...allScores)
  console.log('')
  console.log(`平均: ${avg.toFixed(3)}  最小: ${min.toFixed(3)}  最大: ${max.toFixed(3)}`)
}

function generateBatchPrompt(cards: LowConfidenceCard[], batchIndex: number): string {
  const count = cards.length
  let prompt = `以下の暗記カード${count}枚は薬剤師国家試験対策用に自動生成されたものです。
各カードの医学的・薬学的正確性を検証し、問題があれば修正案を出してください。

`

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]
    prompt += `### カード ${i + 1}
- Atom: ${card.atomId}
- 種別: ${card.knowledgeType}
- 方向: ${card.recallDirection}
- 表面: ${card.front}
- 裏面: ${card.back}
- 自信度: ${card.confidenceScore}

`
  }

  prompt += `各カードについて以下を回答してください:
1. 正確か？ (OK / 要修正 / 要削除)
2. 修正がある場合、修正後のfront/back
3. 理由（簡潔に）

JSON形式で出力:
\`\`\`json
{
  "reviews": [
    { "index": 1, "verdict": "OK" | "fix" | "delete", "front?": "...", "back?": "...", "reason": "..." }
  ]
}
\`\`\`
`

  return prompt
}

function writeBatches(cards: LowConfidenceCard[]): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const totalBatches = Math.ceil(cards.length / BATCH_SIZE)

  for (let i = 0; i < totalBatches; i++) {
    const batch = cards.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)
    const batchNum = String(i + 1).padStart(3, '0')
    const filename = `batch-${batchNum}.prompt.txt`
    const prompt = generateBatchPrompt(batch, i + 1)
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), prompt, 'utf-8')
  }

  console.log(`${totalBatches}バッチのプロンプトを生成しました → ${OUTPUT_DIR}`)
  for (let i = 0; i < totalBatches; i++) {
    const batchNum = String(i + 1).padStart(3, '0')
    const batchCards = cards.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE)
    console.log(`  batch-${batchNum}.prompt.txt (${batchCards.length}枚)`)
  }
}

// --- 実行 ---

function main(): void {
  console.log(`Codex相互検証スクリプト（閾値: ${threshold}）`)
  console.log('')

  const results = loadResultFiles()

  if (statsOnly) {
    showStats(results, threshold)
    return
  }

  // 統計表示（常に）
  showStats(results, threshold)
  console.log('')

  // 低confidenceカード収集
  const lowCards = collectLowConfidenceCards(results, threshold)

  if (lowCards.length === 0) {
    console.log(`低confidenceカードなし（全カードが閾値 ${threshold} 以上）`)
    return
  }

  // バッチプロンプト生成
  writeBatches(lowCards)
}

main()
