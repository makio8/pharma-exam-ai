/**
 * linked_scenario の OCR アーティファクトを除去するスクリプト
 *
 * PDF 抽出由来の問題:
 * - 下付き文字（₀-₉）→ 通常の数字（0-9）
 * - 上付き文字（⁰-⁹）→ 通常の数字（0-9）
 * - 過剰な空白・改行を整理
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SUBSCRIPT_MAP: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
}

const SUPERSCRIPT_MAP: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
}

const SUB_RE = /[₀₁₂₃₄₅₆₇₈₉]/g
const SUP_RE = /[⁰¹²³⁴⁵⁶⁷⁸⁹]/g

function cleanScenario(text: string): string {
  return text
    .replace(SUB_RE, (c) => SUBSCRIPT_MAP[c] ?? c)
    .replace(SUP_RE, (c) => SUPERSCRIPT_MAP[c] ?? c)
    // 3つ以上連続する空白文字を1つのスペースに
    .replace(/\s{3,}/g, ' ')
    .trim()
}

const dataDir = path.resolve(__dirname, '../src/data/real-questions')
const files = fs.readdirSync(dataDir).filter(f => /^exam-\d+\.ts$/.test(f))

let totalCleaned = 0
let totalFiles = 0

for (const file of files.sort()) {
  const filePath = path.join(dataDir, file)
  let content = fs.readFileSync(filePath, 'utf-8')

  // linked_scenario の値を正規表現で検出して置換
  // JSON-like な "linked_scenario": "..." を探す
  const re = /"linked_scenario":\s*"((?:[^"\\]|\\.)*)"/g
  let count = 0
  const newContent = content.replace(re, (match, value: string) => {
    // エスケープされた文字列をデコードして確認
    if (SUB_RE.test(value) || SUP_RE.test(value) || /\s{3,}/.test(value)) {
      const cleaned = cleanScenario(value)
      if (cleaned !== value) {
        count++
        return `"linked_scenario": "${cleaned}"`
      }
    }
    return match
  })

  if (count > 0) {
    fs.writeFileSync(filePath, newContent, 'utf-8')
    console.log(`${file}: ${count} scenarios cleaned`)
    totalCleaned += count
    totalFiles++
  }
}

console.log(`\nTotal: ${totalCleaned} scenarios cleaned across ${totalFiles} files`)
