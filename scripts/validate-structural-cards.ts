/**
 * 構造式フラッシュカード品質検証スクリプト
 *
 * チェック項目:
 * 1. SVGファイル存在確認（media_url → public/ のファイル）
 * 2. カードテキスト基本検証（front/back空でない）
 * 3. L1カードのbackにname_jaが含まれるか
 * 4. format値の正当性
 * 5. IDの一貫性（sfct-{name}-L1/L2/L3）
 * 6. レジストリとの整合（source_idがregistryに存在するか）
 * 7. SMILESフィールドの整合
 *
 * Usage: npx tsx scripts/validate-structural-cards.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import type { StructuralFormulaRegistry } from './lib/structural-registry-types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..')

const REGISTRY_PATH = path.join(PROJECT_ROOT, 'src', 'data', 'structural-formula-registry.json')
const CARDS_PATH = path.join(PROJECT_ROOT, 'src', 'data', 'structural-flashcard-templates.json')
const SVG_DIR = path.join(PROJECT_ROOT, 'public', 'images', 'structures')

interface CardEntry {
  id: string
  source_type: string
  source_id: string
  front: string
  back: string
  format: string
  media_url?: string
  smiles?: string
  tags: string[]
}

interface Issue {
  level: 'error' | 'warning'
  cardId: string
  message: string
}

function main() {
  const registry: StructuralFormulaRegistry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'))
  const cards: CardEntry[] = JSON.parse(fs.readFileSync(CARDS_PATH, 'utf-8'))

  const registryMap = new Map(registry.entries.map(e => [e.id, e]))
  const issues: Issue[] = []

  const VALID_FORMATS = new Set([
    'structural_identification', 'structural_features', 'structural_pattern',
  ])

  for (const card of cards) {
    // 1. format値の正当性
    if (!VALID_FORMATS.has(card.format)) {
      issues.push({ level: 'error', cardId: card.id, message: `Invalid format: ${card.format}` })
    }

    // 2. front/backが空でない
    if (!card.front || card.front.trim().length === 0) {
      issues.push({ level: 'error', cardId: card.id, message: 'Empty front text' })
    }
    if (!card.back || card.back.trim().length === 0) {
      issues.push({ level: 'error', cardId: card.id, message: 'Empty back text' })
    }

    // 3. SVGファイル存在確認
    if (card.media_url) {
      const svgPath = path.join(PROJECT_ROOT, 'public', card.media_url)
      if (!fs.existsSync(svgPath)) {
        issues.push({ level: 'error', cardId: card.id, message: `SVG not found: ${card.media_url}` })
      }
    } else {
      issues.push({ level: 'warning', cardId: card.id, message: 'No media_url (no SVG)' })
    }

    // 4. source_idがregistryに存在するか
    if (card.source_id && !registryMap.has(card.source_id)) {
      issues.push({ level: 'error', cardId: card.id, message: `source_id not in registry: ${card.source_id}` })
    }

    // 5. IDの一貫性
    const idMatch = card.id.match(/^sfct-(.+)-(L[123])$/)
    if (!idMatch) {
      issues.push({ level: 'warning', cardId: card.id, message: `ID doesn't match sfct-{name}-L{1|2|3} pattern` })
    } else {
      const expectedSourceId = `struct-${idMatch[1]}`
      if (card.source_id !== expectedSourceId) {
        issues.push({ level: 'warning', cardId: card.id, message: `source_id mismatch: expected ${expectedSourceId}, got ${card.source_id}` })
      }
    }

    // 6. L1カードのbackにname_jaが含まれるか
    if (card.format === 'structural_identification' && card.source_id) {
      const entry = registryMap.get(card.source_id)
      if (entry && !card.back.includes(entry.name_ja)) {
        issues.push({ level: 'warning', cardId: card.id, message: `L1 back doesn't contain name_ja: ${entry.name_ja}` })
      }
    }

    // 7. source_type
    if (card.source_type !== 'structure_db') {
      issues.push({ level: 'warning', cardId: card.id, message: `source_type is ${card.source_type}, expected structure_db` })
    }
  }

  // Summary
  const errors = issues.filter(i => i.level === 'error')
  const warnings = issues.filter(i => i.level === 'warning')

  console.log('=== 構造式カード品質検証 ===\n')
  console.log(`総カード数: ${cards.length}`)
  console.log(`レジストリ化合物数: ${registry.entries.length}`)
  console.log(`SVGファイル数: ${fs.readdirSync(SVG_DIR).filter(f => f.endsWith('.svg')).length}`)
  console.log(`\nエラー: ${errors.length}件`)
  console.log(`警告: ${warnings.length}件`)

  if (errors.length > 0) {
    console.log('\n--- エラー ---')
    for (const e of errors) {
      console.log(`  [ERROR] ${e.cardId}: ${e.message}`)
    }
  }

  if (warnings.length > 0) {
    console.log('\n--- 警告 ---')
    for (const w of warnings) {
      console.log(`  [WARN] ${w.cardId}: ${w.message}`)
    }
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n全カード検証OK!')
  }

  // Check completeness: every registry entry with SMILES should have 3 cards
  let missingCards = 0
  for (const entry of registry.entries) {
    if (!entry.smiles) continue
    const entryCards = cards.filter(c => c.source_id === entry.id)
    if (entryCards.length !== 3) {
      console.log(`  [WARN] ${entry.id}: expected 3 cards, got ${entryCards.length}`)
      missingCards++
    }
  }
  if (missingCards > 0) {
    console.log(`\n不足カードの化合物: ${missingCards}件`)
  }

  process.exit(errors.length > 0 ? 1 : 0)
}

main()
