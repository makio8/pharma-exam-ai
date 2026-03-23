/**
 * 壊れた例示テキスト修復スクリプト v2
 *
 * Pattern A: minorCategory にテキストの前半が入り、text フィールドに後半の断片が残っている
 *   修復ルール: fullText = minorCategory + text で完全文を再構成
 *   新 minorCategory = fullText から最初の意味のある短いラベルを抽出（最大20文字）
 *
 * Usage: npx tsx scripts/fix-broken-exemplars-v2.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const EXEMPLARS_PATH = path.join(__dirname, '../src/data/exemplars.ts')

// fullText から minorCategory 用の短いラベルを抽出する
// 最初の「（」「について」「に関する」「、」の前まで、最大20文字
function extractMinorCategory(fullText: string): string {
  let label = fullText

  // 「（」より前を取る
  const parenIdx = label.indexOf('（')
  if (parenIdx > 0 && parenIdx <= 20) {
    label = label.substring(0, parenIdx)
  }

  // 「について」より前を取る
  const aboutIdx = label.indexOf('について')
  if (aboutIdx > 0 && aboutIdx <= 20) {
    label = label.substring(0, aboutIdx)
  }

  // 「に関する」より前を取る
  const reIdx = label.indexOf('に関する')
  if (reIdx > 0 && reIdx <= 20) {
    label = label.substring(0, reIdx)
  }

  // 「、」より前を取る（ただし5文字以上ある場合のみ）
  const commaIdx = label.indexOf('、')
  if (commaIdx >= 5 && commaIdx <= 20) {
    label = label.substring(0, commaIdx)
  }

  // 最大20文字に制限
  if (label.length > 20) {
    label = label.substring(0, 20)
  }

  return label.trim()
}

// Pattern A の判定:
// text が断片（ひらがな・助詞・「）」から始まる、または短い）で
// かつ minorCategory が長い（本来の text の前半が入っている）
function isPatternA(minorCategory: string, text: string): boolean {
  if (text.length > 30) return false  // text が長ければ断片ではない

  // text が「）」で始まる（閉じ括弧→前半が minorCategory に入っている）
  if (text.startsWith('）')) return true

  // text がひらがなで始まる（継続助詞・動詞）かつ短い
  const cp = text.codePointAt(0)
  if (cp !== undefined && cp >= 0x3040 && cp <= 0x309f && text.length <= 20) return true

  // minorCategory が長い（30文字超）かつ text が 15 文字以下
  if (minorCategory.length > 30 && text.length <= 15) return true

  return false
}

// エントリの正規表現パターン
const ENTRY_PATTERN = /^(  \{ id: '(ex-[^']+)', minorCategory: '([^']+)', middleCategoryId: '([^']+)', subject: '([^']+)', text: ')([^']+)(' \},)$/

function main() {
  console.log('=== 壊れた例示テキスト修復スクリプト v2 ===\n')

  const content = fs.readFileSync(EXEMPLARS_PATH, 'utf-8')
  const lines = content.split('\n')

  let fixedCount = 0
  const fixedLines: string[] = []
  const report: Array<{
    id: string
    before: { minorCategory: string; text: string }
    after: { minorCategory: string; text: string }
  }> = []

  for (const line of lines) {
    const match = line.match(ENTRY_PATTERN)
    if (!match) {
      fixedLines.push(line)
      continue
    }

    const [, , id, minorCategory, middleCategoryId, subject, text] = match

    if (!isPatternA(minorCategory, text)) {
      fixedLines.push(line)
      continue
    }

    // 修復: fullText = minorCategory + text
    const fullText = minorCategory + text
    const newMinorCategory = extractMinorCategory(fullText)

    const before = { minorCategory, text }
    const after = { minorCategory: newMinorCategory, text: fullText }

    report.push({ id, before, after })
    fixedCount++

    // 新しい行を構築
    const newLine = `  { id: '${id}', minorCategory: '${newMinorCategory}', middleCategoryId: '${middleCategoryId}', subject: '${subject}', text: '${fullText}' },`
    fixedLines.push(newLine)
  }

  // Before/after レポートを表示
  if (fixedCount === 0) {
    console.log('Pattern A の壊れたエントリは見つかりませんでした。')
    return
  }

  console.log(`修復対象: ${fixedCount} 件\n`)
  console.log('--- Before / After ---\n')
  for (const entry of report) {
    console.log(`[${entry.id}]`)
    console.log(`  BEFORE minorCategory: "${entry.before.minorCategory}"`)
    console.log(`  BEFORE text:          "${entry.before.text}"`)
    console.log(`  AFTER  minorCategory: "${entry.after.minorCategory}"`)
    console.log(`  AFTER  text:          "${entry.after.text}"`)
    console.log()
  }

  // ファイルに書き戻す
  const newContent = fixedLines.join('\n')
  fs.writeFileSync(EXEMPLARS_PATH, newContent, 'utf-8')
  console.log(`✓ ${EXEMPLARS_PATH} を更新しました（${fixedCount} 件修復）`)
}

main()
