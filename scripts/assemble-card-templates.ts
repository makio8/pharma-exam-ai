#!/usr/bin/env npx tsx
/**
 * assemble-card-templates.ts
 *
 * 生成済みのKnowledgeAtom JSONファイルを読み込み、
 * FlashCardTemplateに変換して科目別JSONファイルとして出力する。
 *
 * 入力: scripts/output/text-cards/{exemplarId}.json (GenerationResult形式)
 * 出力: src/data/generated-cards/{subject}.json + index.ts
 *
 * Usage:
 *   npx tsx scripts/assemble-card-templates.ts          # 変換+書き出し
 *   npx tsx scripts/assemble-card-templates.ts --stats   # 統計のみ（書き出しなし）
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import type { FlashCardTemplate } from '../src/types/flashcard-template'
import type { QuestionSubject } from '../src/types/question'
import type { GenerationResult } from './lib/card-pipeline-types'
import { validateAllAtoms } from './lib/card-validator'
import { atomToTemplates } from './lib/atom-to-template'
import type { KnowledgeAtom } from '../src/types/knowledge-atom'

// --- パス設定 ---

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..')

const INPUT_DIR = path.join(__dirname, 'output', 'text-cards')
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'src', 'data', 'generated-cards')

// --- 科目→ファイル名マップ ---

const SUBJECT_FILE_MAP: Record<string, string> = {
  '物理': 'physics',
  '化学': 'chemistry',
  '生物': 'biology',
  '衛生': 'hygiene',
  '薬理': 'pharmacology',
  '薬剤': 'pharmaceutics',
  '病態・薬物治療': 'pathology',
  '法規・制度・倫理': 'regulation',
  '実務': 'practice',
}

// --- CLIフラグ ---

const statsOnly = process.argv.includes('--stats')

// --- メイン処理 ---

function main(): void {
  // 1. 入力ファイル一覧取得
  if (!fs.existsSync(INPUT_DIR)) {
    console.log('📂 入力ディレクトリが存在しません:', INPUT_DIR)
    console.log('   生成結果が0件です。終了します。')
    return
  }

  const files = fs.readdirSync(INPUT_DIR)
    .filter(f => f.endsWith('.json') && !f.endsWith('.error.json'))

  if (files.length === 0) {
    console.log('📂 生成結果JSONが0件です。終了します。')
    return
  }

  console.log(`📂 入力ファイル: ${files.length}件`)

  // 2. 全atomを収集
  const allAtoms: KnowledgeAtom[] = []
  let parseErrors = 0

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(INPUT_DIR, file), 'utf-8')
      const result: GenerationResult = JSON.parse(raw)
      if (result.atoms && Array.isArray(result.atoms)) {
        allAtoms.push(...result.atoms)
      }
    } catch {
      parseErrors++
      console.warn(`  ⚠️ パースエラー: ${file}`)
    }
  }

  console.log(`🧬 収集したatom: ${allAtoms.length}件 (パースエラー: ${parseErrors}件)`)

  // 3. バリデーション
  const validation = validateAllAtoms(allAtoms)
  console.log(`\n✅ バリデーション結果:`)
  console.log(`   合計: ${validation.summary.total}件`)
  console.log(`   エラー有: ${validation.summary.withErrors}件`)
  console.log(`   エラー数: ${validation.summary.errorCount}件`)
  console.log(`   警告数: ${validation.summary.warningCount}件`)

  if (validation.summary.errorCount > 0) {
    console.log('\n  エラー詳細（先頭10件）:')
    for (const e of validation.errors.filter(e => e.severity === 'error').slice(0, 10)) {
      console.log(`    [${e.code}] ${e.atomId}: ${e.message}`)
    }
  }

  // 4. atom → FlashCardTemplate 変換
  const allTemplates: FlashCardTemplate[] = []
  for (const atom of allAtoms) {
    allTemplates.push(...atomToTemplates(atom))
  }

  // 5. ID重複排除（先勝ち）
  const seen = new Set<string>()
  const deduped: FlashCardTemplate[] = []
  let duplicateCount = 0

  for (const t of allTemplates) {
    if (seen.has(t.id)) {
      duplicateCount++
      continue
    }
    seen.add(t.id)
    deduped.push(t)
  }

  console.log(`\n🃏 テンプレート: ${deduped.length}枚 (重複排除: ${duplicateCount}件)`)

  // 6. 科目別グループ化
  const bySubject = new Map<string, FlashCardTemplate[]>()
  for (const t of deduped) {
    const existing = bySubject.get(t.subject) ?? []
    existing.push(t)
    bySubject.set(t.subject, existing)
  }

  console.log('\n📊 科目別内訳:')
  for (const [subject, templates] of bySubject) {
    const fileName = SUBJECT_FILE_MAP[subject] ?? 'unknown'
    console.log(`   ${subject} (${fileName}): ${templates.length}枚`)
  }

  // --stats モードなら書き出さずに終了
  if (statsOnly) {
    console.log('\n📝 --stats モード: ファイル書き出しをスキップしました')
    return
  }

  // 7. ファイル出力
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const writtenFiles: string[] = []

  for (const [subject, templates] of bySubject) {
    const fileName = SUBJECT_FILE_MAP[subject]
    if (!fileName) {
      console.warn(`  ⚠️ 未知の科目: ${subject} — スキップ`)
      continue
    }
    const outPath = path.join(OUTPUT_DIR, `${fileName}.json`)
    fs.writeFileSync(outPath, JSON.stringify(templates, null, 2), 'utf-8')
    writtenFiles.push(fileName)
    console.log(`  ✏️ ${outPath} (${templates.length}枚)`)
  }

  // 8. index.ts 生成
  const indexContent = generateIndexTs()
  const indexPath = path.join(OUTPUT_DIR, 'index.ts')
  fs.writeFileSync(indexPath, indexContent, 'utf-8')
  console.log(`  ✏️ ${indexPath}`)

  console.log(`\n🎉 完了: ${writtenFiles.length}科目, ${deduped.length}枚のテンプレートを出力しました`)
}

function generateIndexTs(): string {
  // SUBJECT_FILES エントリを生成
  const entries = Object.entries(SUBJECT_FILE_MAP)
    .map(([subject, file]) => `  '${subject}': '${file}'`)
    .join(',\n')

  return `// このファイルは assemble-card-templates.ts により自動生成されます
// 手動で編集しないでください

import type { FlashCardTemplate } from '../../types/flashcard-template'
import type { QuestionSubject } from '../../types/question'

const SUBJECT_FILES: Record<QuestionSubject, string> = {
${entries},
}

export async function loadCardTemplates(subject: QuestionSubject): Promise<FlashCardTemplate[]> {
  const file = SUBJECT_FILES[subject]
  if (!file) return []
  try {
    const mod = await import(\`./\${file}.json\`)
    return mod.default as FlashCardTemplate[]
  } catch {
    return []
  }
}

export async function loadAllCardTemplates(): Promise<FlashCardTemplate[]> {
  const subjects = Object.keys(SUBJECT_FILES) as QuestionSubject[]
  const results = await Promise.all(subjects.map(s => loadCardTemplates(s)))
  return results.flat()
}
`
}

main()
