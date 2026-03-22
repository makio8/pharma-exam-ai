/**
 * add-mapping-gaps.ts
 * 高信頼マッピング漏れ候補をquestion-exemplar-map.tsに追加するスクリプト
 *
 * フィルタ条件:
 *   - score >= 0.8
 *   - exemplarId が承認済みリストに含まれる
 *   - exemplarText が10文字以上（broken textを除外）
 *   - matchedKeywords に有効なキーワードが含まれる（ノイズ除外・3文字以上）
 *   - 既存マッピングに存在しないペア
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ノイズキーワード（除外対象）
const NOISE_KEYWORDS = new Set([
  '医薬品', 'リスク', '薬物', '相互作用', '薬局', '治療', '病態',
  '薬物治療', '副作用', '薬理', '薬理作用', '機序', '主な副作用',
  '重要性', '比較して', '研究', '有害事象', '予防', '疾病', '疫学'
])

// 承認済み例示IDリスト（24例示）
const APPROVED_EXEMPLAR_IDS = new Set([
  'ex-physics-030', 'ex-physics-009', 'ex-physics-045', 'ex-physics-088', 'ex-physics-034',
  'ex-physics-066', 'ex-physics-087', 'ex-physics-097',
  'ex-chemistry-106', 'ex-chemistry-109', 'ex-chemistry-041', 'ex-chemistry-046', 'ex-chemistry-019',
  'ex-biology-002', 'ex-biology-013', 'ex-biology-025',
  'ex-pharmaceutics-021', 'ex-pharmaceutics-068',
  'ex-pathology-058', 'ex-pathology-040',
  'ex-practice-128', 'ex-practice-126', 'ex-practice-120', 'ex-practice-123'
])

const MIN_SCORE = 0.8
const MIN_KEYWORD_LEN = 3
const MIN_EXEMPLAR_TEXT_LEN = 10

interface CandidateRow {
  exemplarId: string
  exemplarText: string
  questionId: string
  score: number
  matchedKeywords: string
}

// CSV行をパース（クォートされたフィールドを考慮）
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function readCSV(filePath: string): CandidateRow[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter(l => l.trim())
  const header = parseCSVLine(lines[0])
  console.log('CSV ヘッダー:', header)

  const idxExemplarId = header.indexOf('exemplarId')
  const idxExemplarText = header.indexOf('exemplarText')
  const idxQuestionId = header.indexOf('questionId')
  const idxScore = header.indexOf('score')
  const idxMatchedKeywords = header.indexOf('matchedKeywords')

  const rows: CandidateRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i])
    if (cols.length < 5) continue
    const row: CandidateRow = {
      exemplarId: cols[idxExemplarId]?.trim() ?? '',
      exemplarText: cols[idxExemplarText]?.trim() ?? '',
      questionId: cols[idxQuestionId]?.trim() ?? '',
      score: parseFloat(cols[idxScore] ?? '0'),
      matchedKeywords: cols[idxMatchedKeywords]?.trim() ?? ''
    }
    if (row.exemplarId && row.questionId) {
      rows.push(row)
    }
  }
  return rows
}

function hasValidKeywords(matchedKeywords: string): boolean {
  const keywords = matchedKeywords.split(/[,、]/).map(k => k.trim()).filter(k => k.length > 0)
  return keywords.some(kw => kw.length >= MIN_KEYWORD_LEN && !NOISE_KEYWORDS.has(kw))
}

// 既存マッピングを読み込む（(questionId, exemplarId) ペアのSet）
function readExistingMappings(filePath: string): Set<string> {
  const content = fs.readFileSync(filePath, 'utf-8')
  const existing = new Set<string>()
  const re = /\{\s*questionId:\s*"([^"]+)",\s*exemplarId:\s*"([^"]+)"/g
  let m
  while ((m = re.exec(content)) !== null) {
    existing.add(`${m[1]}|${m[2]}`)
  }
  return existing
}

function main() {
  const csvPath = path.resolve(__dirname, 'output/mapping-gap-candidates.csv')
  const mapPath = path.resolve(__dirname, '../src/data/question-exemplar-map.ts')

  console.log('CSVを読み込み中...')
  const rows = readCSV(csvPath)
  console.log(`CSV 総行数: ${rows.length}`)

  console.log('\n既存マッピングを読み込み中...')
  const existingPairs = readExistingMappings(mapPath)
  console.log(`既存エントリ数: ${existingPairs.size}`)

  // フィルタリング
  const filtered = rows.filter(row => {
    if (row.score < MIN_SCORE) return false
    if (!APPROVED_EXEMPLAR_IDS.has(row.exemplarId)) return false
    if (row.exemplarText.length < MIN_EXEMPLAR_TEXT_LEN) return false
    if (!hasValidKeywords(row.matchedKeywords)) return false
    if (existingPairs.has(`${row.questionId}|${row.exemplarId}`)) return false
    return true
  })

  console.log(`\nフィルタ後の候補数: ${filtered.length}`)

  if (filtered.length === 0) {
    console.log('追加すべき候補がありません。')
    return
  }

  // 重複除去（同一ペアが複数行ある場合は最初の1件のみ）
  const seen = new Set<string>()
  const deduped = filtered.filter(row => {
    const key = `${row.questionId}|${row.exemplarId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`\n重複除去後の追加候補数: ${deduped.length}`)
  for (const row of deduped) {
    console.log(`  + ${row.questionId} -> ${row.exemplarId} (score=${row.score}, keywords="${row.matchedKeywords}")`)
  }

  // question-exemplar-map.ts を読み込む
  let content = fs.readFileSync(mapPath, 'utf-8')

  // 新しいエントリを生成
  const newLines = deduped.map(row =>
    `  { questionId: "${row.questionId}", exemplarId: "${row.exemplarId}", isPrimary: false },`
  ).join('\n')

  // 配列の閉じ `]` の直前（`]\n\nexport function` の前）に挿入
  const insertMarker = ']\n\nexport function getExemplarsForQuestion'
  const insertPos = content.indexOf(insertMarker)
  if (insertPos === -1) {
    console.error('\nエラー: 挿入位置が見つかりませんでした。ファイル構造を確認してください。')
    process.exit(1)
  }

  let before = content.slice(0, insertPos)
  const after = content.slice(insertPos)

  // 最後のエントリがカンマなしで終わっている場合（trailing comma がない場合）、カンマを追加
  // 末尾の空白を除いた before の最後の文字が '}' なら ',' を追加
  const trimmedBefore = before.trimEnd()
  if (trimmedBefore.endsWith('}')) {
    before = trimmedBefore + ',\n'
  }

  const updated = before + newLines + '\n' + after

  // バックアップ作成
  fs.writeFileSync(mapPath + '.bak', content, 'utf-8')
  console.log(`\nバックアップ作成: ${mapPath}.bak`)

  // ファイル書き込み
  fs.writeFileSync(mapPath, updated, 'utf-8')
  console.log(`ファイル更新完了: ${mapPath}`)
  console.log(`追加エントリ数: ${deduped.length}`)
}

main()
