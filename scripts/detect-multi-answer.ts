/**
 * 「2つ選べ」「3つ選べ」等の複数選択問題を検出するスクリプト
 *
 * 使い方: npx tsx scripts/detect-multi-answer.ts
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '../src/data/real-questions')

// 「Nつ選べ」パターン
const MULTI_PATTERN = /([2-9２-９二三四五])[つ]選べ/

interface DetectedQuestion {
  file: string
  id: string
  questionNumber: number
  currentCorrectAnswer: number | number[]
  requiredSelections: string
  snippet: string
}

async function main() {
  const files = fs.readdirSync(DATA_DIR).filter(f => /^exam-\d+\.ts$/.test(f)).sort()

  const results: DetectedQuestion[] = []

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file)
    const content = fs.readFileSync(filePath, 'utf-8')

    // 各問題オブジェクトをパースするために動的importする
    // TSファイルなのでJSON的に直接パースは難しい。代わりにテキストベースで検出する
    // question_text行から「Nつ選べ」を検出

    // 正規表現でブロック単位に近い抽出を試みる
    // "id": "rXXX-YYY" と "question_text": "..." と "correct_answer": N を取る
    const idPattern = /"id":\s*"([^"]+)"/g
    const qnumPattern = /"question_number":\s*(\d+)/g
    const qtextPattern = /"question_text":\s*"((?:[^"\\]|\\.)*)"/g
    const correctPattern = /"correct_answer":\s*(\d+)/g

    const ids: string[] = []
    const qnums: number[] = []
    const qtexts: string[] = []
    const corrects: number[] = []

    let m: RegExpExecArray | null
    while ((m = idPattern.exec(content)) !== null) ids.push(m[1])
    while ((m = qnumPattern.exec(content)) !== null) qnums.push(parseInt(m[1]))
    while ((m = qtextPattern.exec(content)) !== null) qtexts.push(m[1])
    while ((m = correctPattern.exec(content)) !== null) corrects.push(parseInt(m[1]))

    for (let i = 0; i < ids.length; i++) {
      const text = qtexts[i] || ''
      const match = MULTI_PATTERN.exec(text)
      if (match) {
        results.push({
          file,
          id: ids[i],
          questionNumber: qnums[i] ?? 0,
          currentCorrectAnswer: corrects[i] ?? 0,
          requiredSelections: match[1],
          snippet: text.slice(Math.max(0, match.index - 20), match.index + match[0].length + 10).replace(/\\n/g, ' '),
        })
      }
    }
  }

  // レポート出力
  console.log('=== 複数選択問題（「Nつ選べ」）検出結果 ===\n')
  console.log(`検出数: ${results.length}問\n`)

  if (results.length === 0) {
    console.log('複数選択問題は見つかりませんでした。')
    return
  }

  console.log('ファイル | 問題ID | 問番号 | 現在のcorrect_answer | 必要選択数 | テキスト抜粋')
  console.log('--- | --- | --- | --- | --- | ---')

  for (const r of results) {
    console.log(`${r.file} | ${r.id} | 問${r.questionNumber} | ${r.currentCorrectAnswer} | ${r.requiredSelections}つ | ...${r.snippet}...`)
  }

  // ファイル別集計
  console.log('\n=== ファイル別集計 ===')
  const byFile = new Map<string, number>()
  for (const r of results) {
    byFile.set(r.file, (byFile.get(r.file) || 0) + 1)
  }
  for (const [file, count] of byFile) {
    console.log(`  ${file}: ${count}問`)
  }
}

main().catch(console.error)
