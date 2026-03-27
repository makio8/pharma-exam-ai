/**
 * generate-official-notes.ts
 *
 * fusens-master.json + note-exemplar-mappings.json + question-topic-map.ts
 * → src/data/official-notes.json（1,642件）+ src/data/official-notes.ts（薄いラッパー）を自動生成
 *
 * TS リテラルで1,642件を定義すると TS2590（union too complex）エラーになるため、
 * データは JSON、型付けは薄い TS ラッパーで行う方式を採用。
 *
 * Usage:
 *   npx tsx scripts/generate-official-notes.ts          # 生成して上書き
 *   npx tsx scripts/generate-official-notes.ts --dry-run # 統計だけ表示
 *   npx tsx scripts/generate-official-notes.ts --stats   # 科目別サマリー
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

// ESM で __dirname を使う
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

// ---------- 型定義 ----------

interface FusenMasterEntry {
  id: string
  title: string
  body: string // OCRテキスト
  imageFile: string // "page-001-left/note-01.png"
  subject: string
  noteType: string
  tags: string[]
  topicId: string
  linkedQuestionIds: string[]
  importance: number
  tier: string
  status: string
  source: {
    pdf: string
    page: number
    pageId: string
    side: string
    noteIndex: number
    bbox: number[]
  }
  reviewedAt: string | null
  notes: string
}

interface FusenMasterFile {
  version: number
  generatedAt: string
  fusens: Record<string, FusenMasterEntry>
}

interface ExemplarMatch {
  exemplarId: string
  isPrimary: boolean
  confidence: number
  reasoning: string
  status: string
}

interface MappingEntry {
  noteId: string
  noteTitle: string
  subject: string
  topicId: string
  matches: ExemplarMatch[]
  reviewStatus: string
}

interface MappingsFile {
  version: number
  generatedAt: string
  generatedBy: string
  noteCount: number
  mappings: MappingEntry[]
}

// ---------- topicId → subject の逆引き ----------
// CLAUDE.md 記載: subject フィールドは OCR 由来で不正確。topicId から逆算が正

const TOPIC_PREFIX_TO_SUBJECT: Record<string, string> = {
  physics: '物理',
  chemistry: '化学',
  biology: '生物',
  hygiene: '衛生',
  pharmacology: '薬理',
  pharmaceutics: '薬剤',
  pathology: '病態・薬物治療',
  law: '法規・制度・倫理',
  practice: '実務',
}

function resolveSubject(topicId: string): string {
  const prefix = topicId.split('-')[0]
  const subject = TOPIC_PREFIX_TO_SUBJECT[prefix]
  if (!subject) {
    throw new Error(
      `未知の topicId prefix: "${prefix}" (topicId="${topicId}")。TOPIC_PREFIX_TO_SUBJECT に追加してください`,
    )
  }
  return subject
}

// ---------- textSummary 生成（OCR body から簡潔な要約を作る） ----------

function generateTextSummary(entry: FusenMasterEntry): string {
  const body = entry.body.trim()
  if (!body) return entry.title

  // OCR テキストをそのまま使う（最大200文字に切り詰め）
  // 改行を句点区切りに変換し、読みやすくする
  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  const joined = lines.join('。')

  if (joined.length <= 200) return joined
  return joined.slice(0, 197) + '...'
}

// ---------- importance 計算 ----------
// exemplarIds の件数ベース: 0件→1, 1件→2, 2件→3, 3+件→4

function computeImportance(exemplarCount: number): number {
  if (exemplarCount >= 3) return 4
  if (exemplarCount >= 2) return 3
  if (exemplarCount >= 1) return 2
  return 1
}

// ---------- メイン ----------

function main() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')
  const isStats = args.includes('--stats')

  // 1. fusens-master.json 読み込み
  const masterPath = path.join(ROOT, 'src/data/fusens/fusens-master.json')
  const masterData: FusenMasterFile = JSON.parse(
    fs.readFileSync(masterPath, 'utf-8'),
  )
  const fusens = masterData.fusens

  // 2. note-exemplar-mappings.json 読み込み
  const mappingsPath = path.join(
    ROOT,
    'src/data/fusens/note-exemplar-mappings.json',
  )
  const mappingsData: MappingsFile = JSON.parse(
    fs.readFileSync(mappingsPath, 'utf-8'),
  )
  // noteId → MappingEntry のルックアップ
  const mappingByNoteId = new Map<string, MappingEntry>()
  for (const m of mappingsData.mappings) {
    mappingByNoteId.set(m.noteId, m)
  }

  // 3. linkedQuestionIds は JSON に含めない（4チームレビューで P1 指摘）
  //    - topicId 単位だと 1 トピック = 数十〜1,005問で膨大すぎて UX 崩壊
  //    - JSON の 61%（1.18MB）が linkedQuestionIds の重複データだった
  //    - ランタイムで topicId → QUESTION_TOPIC_MAP 逆引きに切替

  // 4. 全 fusen を OfficialNote に変換
  const sortedIds = Object.keys(fusens).sort() // fusen-0001 ~ fusen-1642
  const notes: Array<{
    id: string
    title: string
    imageUrl: string
    textSummary: string
    subject: string
    topicId: string
    tags: string[]
    exemplarIds: string[]
    noteType: string
    importance: number
    tier: string
  }> = []

  const subjectCounts: Record<string, number> = {}

  // P2修正: noteType / tier の許可値（GPT-5.4指摘）
  const VALID_NOTE_TYPES = new Set([
    'mnemonic',
    'knowledge',
    'related',
    'caution',
    'solution',
  ])
  const VALID_TIERS = new Set(['free', 'premium'])

  for (const fusenId of sortedIds) {
    const entry = fusens[fusenId]
    if (!entry) continue

    // P2修正: record key と entry.id の整合チェック（GPT-5.4指摘）
    if (fusenId !== entry.id) {
      throw new Error(
        `ID不整合: record key="${fusenId}" !== entry.id="${entry.id}"`,
      )
    }

    // subject は topicId から逆算（OCR由来の subject は不正確）
    const subject = resolveSubject(entry.topicId)
    subjectCounts[subject] = (subjectCounts[subject] ?? 0) + 1

    // exemplarIds: マッピングから取得
    const mapping = mappingByNoteId.get(fusenId)
    const exemplarIds: string[] = []
    if (mapping) {
      // isPrimary を先、secondary を後に
      const primary = mapping.matches
        .filter((m) => m.isPrimary)
        .map((m) => m.exemplarId)
      const secondary = mapping.matches
        .filter((m) => !m.isPrimary)
        .map((m) => m.exemplarId)
      exemplarIds.push(...primary, ...secondary)
    }

    // importance: exemplarIds の件数ベース（4チームレビュー P2 修正）
    // 旧: linkedQuestionIds.length ベース → 95.7% が importance=4 で無意味
    // 新: exemplarIds.length ベース → 1-4件で意味のある分布に
    const importance = computeImportance(exemplarIds.length)

    // P2修正: noteType / tier のバリデーション（GPT-5.4指摘）
    const noteType = entry.noteType || 'knowledge'
    if (!VALID_NOTE_TYPES.has(noteType)) {
      throw new Error(
        `不正な noteType: "${noteType}" (fusen=${fusenId})。許可値: ${[...VALID_NOTE_TYPES].join(', ')}`,
      )
    }
    const tier = entry.tier || 'free'
    if (!VALID_TIERS.has(tier)) {
      throw new Error(
        `不正な tier: "${tier}" (fusen=${fusenId})。許可値: ${[...VALID_TIERS].join(', ')}`,
      )
    }

    notes.push({
      id: entry.id,
      title: entry.title,
      imageUrl: `/images/fusens/${entry.imageFile}`,
      textSummary: generateTextSummary(entry),
      subject,
      topicId: entry.topicId,
      tags: entry.tags,
      exemplarIds,
      noteType,
      importance,
      tier,
    })
  }

  // ---------- 統計表示 ----------
  console.log(`\n📊 official-notes.ts 生成統計`)
  console.log(`  付箋数: ${notes.length}`)
  console.log(
    `  exemplarIds 付き: ${notes.filter((n) => n.exemplarIds.length > 0).length}`,
  )
  console.log(
    `  exemplarIds 合計: ${notes.reduce((s, n) => s + n.exemplarIds.length, 0)}`,
  )
  console.log(
    `  linkedQuestionIds: JSON から除外（ランタイムで topicId 逆引き）`,
  )

  if (isStats || isDryRun) {
    console.log(`\n  科目別:`)
    const subjectOrder = [
      '物理',
      '化学',
      '生物',
      '衛生',
      '薬理',
      '薬剤',
      '病態・薬物治療',
      '法規・制度・倫理',
      '実務',
    ]
    for (const s of subjectOrder) {
      const count = subjectCounts[s] ?? 0
      const bar = '█'.repeat(Math.ceil(count / 10))
      console.log(`    ${s.padEnd(12)} ${String(count).padStart(4)} ${bar}`)
    }

    // importance 分布
    const impCounts = [0, 0, 0, 0, 0]
    for (const n of notes) impCounts[n.importance]++
    console.log(`\n  importance 分布:`)
    for (let i = 1; i <= 4; i++) {
      console.log(`    ${i}: ${impCounts[i]}`)
    }
  }

  if (isDryRun) {
    console.log(`\n  --dry-run: ファイル書き出しスキップ`)
    return
  }

  // ---------- JSON データファイル生成 ----------
  // TS リテラルだと1,642件で TS2590 エラーになるため JSON + TS ラッパー方式
  const jsonPath = path.join(ROOT, 'src/data/official-notes.json')
  const tsPath = path.join(ROOT, 'src/data/official-notes.ts')

  const jsonData = JSON.stringify(notes, null, 2)
  fs.writeFileSync(jsonPath, jsonData, 'utf-8')

  // ---------- 薄い TS ラッパー生成 ----------
  const tsContent = [
    '// 公式付箋データ（自動生成: scripts/generate-official-notes.ts）',
    '// ソース: fusens-master.json + note-exemplar-mappings.json + question-topic-map.ts',
    '//',
    '// データは official-notes.json に格納（TS リテラル 1,642件だと TS2590 エラーのため）',
    '// topicId は exam-blueprint.ts の ALL_TOPICS.id に準拠',
    '// linkedQuestionIds は question-topic-map.ts からtopicIdベースで自動逆引き',
    '// exemplarIds は Claude 推論によるセマンティックマッチング結果',
    "import type { OfficialNote } from '../types/official-note'",
    "import data from './official-notes.json'",
    '',
    'export const OFFICIAL_NOTES: OfficialNote[] = data as OfficialNote[]',
    '',
  ].join('\n')
  fs.writeFileSync(tsPath, tsContent, 'utf-8')

  console.log(`\n✅ 生成完了（${notes.length} 件）`)
  console.log(
    `   JSON: ${jsonPath} (${(Buffer.byteLength(jsonData) / 1024).toFixed(0)} KB)`,
  )
  console.log(`   TS:   ${tsPath}`)
}

main()
