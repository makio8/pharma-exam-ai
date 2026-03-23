/**
 * 壊れた例示テキスト修復スクリプト
 *
 * 問題: minorCategory フィールドにテキストの前半が、text フィールドに後半が
 *       入ってしまっている（文字数制限で途中で切れた）エントリを修復する。
 *
 * 修復ルール:
 * - text が「ひらがな/助詞で始まる断片」（継続文字で始まる）エントリを対象とする
 * - fullText = minorCategory + text で完全文を再構成
 * - minorCategory は fullText の先頭から意味のある短いラベルを抽出する
 *
 * Usage: npx tsx scripts/fix-broken-exemplars.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const EXEMPLARS_PATH = path.join(__dirname, '../src/data/exemplars.ts')

// ひらがな範囲: U+3040-U+309F
function startsWithHiragana(s: string): boolean {
  if (!s) return false
  const cp = s.codePointAt(0)!
  return cp >= 0x3040 && cp <= 0x309f
}

// テキストが壊れているか判定:
// - text が15文字以下 かつ ひらがなで始まる（継続断片）
// - または text が8文字以下（ほぼ確実に断片）
function isBroken(text: string): boolean {
  if (text.length <= 8) return true
  if (text.length <= 15 && startsWithHiragana(text)) return true
  return false
}

// fullText から minorCategory 用の短いラベルを抽出する
// 最初の「（」「、」「について」「に関する」の前まで、最大20文字
function extractMinorCategory(fullText: string): string {
  // 終端（「できる。」「列挙できる。」等）を除いた内容部分から抽出
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

// エントリの正規表現パターン
// キャプチャグループ: 1=id, 2=minorCategory, 3=middleCategoryId, 4=subject, 5=text
const ENTRY_PATTERN = /^(  \{ id: '(ex-[^']+)', minorCategory: '([^']+)', middleCategoryId: '([^']+)', subject: '([^']+)', text: ')([^']+)(' \},)$/

function main() {
  console.log('=== 壊れた例示テキスト修復スクリプト ===\n')

  const content = fs.readFileSync(EXEMPLARS_PATH, 'utf-8')
  const lines = content.split('\n')

  let fixedCount = 0
  const fixedLines: string[] = []
  const report: Array<{ id: string; before: { minorCategory: string; text: string }; after: { minorCategory: string; text: string } }> = []

  for (const line of lines) {
    const match = line.match(ENTRY_PATTERN)
    if (!match) {
      fixedLines.push(line)
      continue
    }

    const [, prefix, id, minorCategory, middleCategoryId, subject, text, suffix] = match

    if (!isBroken(text)) {
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

  if (fixedCount === 0) {
    console.log('壊れたエントリは見つかりませんでした。')
    return
  }

  // Before/after レポートを表示
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
