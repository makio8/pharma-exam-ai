/**
 * 画像参照キーワードを含むが image_url が未設定の問題IDリストを生成（確定版）
 * npx tsx scripts/generate-missing-image-ids.ts
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '..', 'src', 'data', 'real-questions')

const IMAGE_KEYWORDS = /下図|この図|次の図|図[1-9１-９]|構造式[をがはの]|下の構造|模式図|グラフ[をがはの]|以下の図|図に示|スキーム|下表|処方[箋せん]/

interface MissingEntry {
  id: string
  year: number
  question_number: number
  tier: 1 | 2 | 3
  keyword_match: string
}

function classifyTier(text: string): 1 | 2 | 3 {
  if (/下図|この図|次の図/.test(text)) return 1
  if (/構造式|模式図|グラフ|スキーム|以下の図|図に示|図[1-9１-９]/.test(text)) return 2
  return 3
}

const results: MissingEntry[] = []

for (let year = 100; year <= 110; year++) {
  const tsPath = path.join(dataDir, `exam-${year}.ts`)
  if (!fs.existsSync(tsPath)) continue
  const content = fs.readFileSync(tsPath, 'utf-8')
  const arrayStart = content.indexOf('[\n')
  if (arrayStart === -1) continue
  const questions = JSON.parse(content.substring(arrayStart).trimEnd())

  for (const q of questions) {
    if (q.image_url) continue
    const match = (q.question_text || '').match(IMAGE_KEYWORDS)
    if (match) {
      results.push({
        id: q.id,
        year: q.year ?? year,
        question_number: q.question_number,
        tier: classifyTier(q.question_text),
        keyword_match: match[0],
      })
    }
  }
}

const output = {
  description: '画像参照キーワードを含むが image_url 未設定の問題IDリスト（凍結版）',
  generated: new Date().toISOString().split('T')[0],
  frozen: true,
  total: results.length,
  tier1: results.filter(r => r.tier === 1).length,
  tier2: results.filter(r => r.tier === 2).length,
  tier3: results.filter(r => r.tier === 3).length,
  ids: results.map(r => r.id),
  details: results,
}

const outPath = path.join(dataDir, 'missing-image-ids.json')
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8')
console.log(`✅ ${results.length}問のIDを ${outPath} に書き出しました`)
console.log(`  Tier 1 (回答不能): ${output.tier1}問`)
console.log(`  Tier 2 (画像推奨): ${output.tier2}問`)
console.log(`  Tier 3 (テキスト代替可能): ${output.tier3}問`)
console.log(`  frozen: true（このリストは変更しない確定版）`)
