/**
 * 複数選択問題のcorrect_answerを配列に移行するスクリプト
 *
 * 戦略:
 *   1. 第100〜106回: /tmp/claude/answers-{N}.json の公式正答データを使用（最も信頼性が高い）
 *   2. 第107〜111回: 解説テキストから正答を抽出
 *
 * 使い方:
 *   npx tsx scripts/migrate-multi-answers.ts --dry-run   # 変更内容を表示（実際には書き込まない）
 *   npx tsx scripts/migrate-multi-answers.ts             # 実際に書き込む
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '../src/data/real-questions')
const ANSWERS_DIR = '/tmp/claude'

const DRY_RUN = process.argv.includes('--dry-run')

// 「Nつ選べ」パターン（全角・半角両対応）
const MULTI_PATTERN = /([2-9２-９])[つ]選べ/

interface MigrationResult {
  id: string
  questionNumber: number
  file: string
  oldAnswer: number
  newAnswer: number[]
  source: 'official' | 'merged-json' | 'explanation' | 'skipped'
  reason?: string
}

/**
 * 公式正答JSONを読み込む（/tmp/claude/answers-{N}.json）
 */
function loadOfficialAnswers(examYear: number): Record<string, number | number[] | string> | null {
  const p = path.join(ANSWERS_DIR, `answers-${examYear}.json`)
  if (!fs.existsSync(p)) return null
  const data = JSON.parse(fs.readFileSync(p, 'utf-8'))
  return data.answers || {}
}

/**
 * マージ済みJSONから配列型の正答を読み込む（exam-{N}.json）
 * 公式正答がない回（107-111）のフォールバック
 */
function loadMergedJsonAnswers(examYear: number): Record<string, number[]> {
  const p = path.join(DATA_DIR, `exam-${examYear}.json`)
  if (!fs.existsSync(p)) return {}
  const data: Array<{ question_number: number; correct_answer: number | number[] }> =
    JSON.parse(fs.readFileSync(p, 'utf-8'))
  const result: Record<string, number[]> = {}
  for (const q of data) {
    if (Array.isArray(q.correct_answer)) {
      result[String(q.question_number)] = q.correct_answer
    }
  }
  return result
}

/**
 * 全角数字を半角に変換
 */
function toHalfWidth(ch: string): number {
  const code = ch.charCodeAt(0)
  if (code >= 0xFF10 && code <= 0xFF19) return code - 0xFF10
  return parseInt(ch)
}

/**
 * 問題テキストから必要な選択数を抽出
 */
function getRequiredSelections(questionText: string): number {
  const match = MULTI_PATTERN.exec(questionText)
  if (!match) return 1
  return toHalfWidth(match[1])
}

/**
 * 解説テキストから正答番号を抽出する
 *
 * パターン:
 *   - "N. ○" で正答をマーク
 *   - "N. ✗" で誤答をマーク
 *   - 「正答は1と3」「正解は1, 3」等の明示的な記述
 */
function extractAnswersFromExplanation(explanation: string, requiredCount: number): number[] | null {
  if (!explanation) return null

  // パターン1: "N. ○" or "N. ○ ..." (○マーカー)
  const correctByMarker: number[] = []
  const markerPattern = /(\d)\.\s*○/g
  let m: RegExpExecArray | null
  while ((m = markerPattern.exec(explanation)) !== null) {
    const num = parseInt(m[1])
    if (num >= 1 && num <= 5 && !correctByMarker.includes(num)) {
      correctByMarker.push(num)
    }
  }

  if (correctByMarker.length === requiredCount) {
    return correctByMarker.sort((a, b) => a - b)
  }

  // パターン2: "（正答の1つ）" or "（正答のひとつ）" でマークされた選択肢
  const correctByLabel: number[] = []
  const labelPattern = /(\d)\.\s*(?:○|✓).*?(?:正答|正解)/g
  while ((m = labelPattern.exec(explanation)) !== null) {
    const num = parseInt(m[1])
    if (num >= 1 && num <= 5 && !correctByLabel.includes(num)) {
      correctByLabel.push(num)
    }
  }
  if (correctByLabel.length === requiredCount) {
    return correctByLabel.sort((a, b) => a - b)
  }

  // パターン3: ✗でない選択肢を逆算（5択で3つ✗なら残り2つが正答）
  const incorrectByMarker: number[] = []
  const incorrectPattern = /(\d)\.\s*[✗×✕]/g
  while ((m = incorrectPattern.exec(explanation)) !== null) {
    const num = parseInt(m[1])
    if (num >= 1 && num <= 5 && !incorrectByMarker.includes(num)) {
      incorrectByMarker.push(num)
    }
  }

  // ○とは別に正答マーカーも含めて全選択肢をカバーしているか
  const allMarked = [...new Set([...correctByMarker, ...incorrectByMarker])].sort((a, b) => a - b)
  if (allMarked.length >= 4) { // ほぼ全選択肢がマークされている
    const allChoices = [1, 2, 3, 4, 5]
    const correctFromInverse = allChoices.filter(n => !incorrectByMarker.includes(n))
    if (correctFromInverse.length === requiredCount) {
      return correctFromInverse.sort((a, b) => a - b)
    }
  }

  // パターン4: 「①②」「①と③」のような正答記述（【正答の根拠】セクション内）
  const rootSection = explanation.match(/【正答の根拠】(.*?)(?:【|$)/s)
  if (rootSection) {
    const nums: number[] = []
    const circledPattern = /[①②③④⑤]/g
    const circledMap: Record<string, number> = { '①': 1, '②': 2, '③': 3, '④': 4, '⑤': 5 }
    while ((m = circledPattern.exec(rootSection[1])) !== null) {
      const num = circledMap[m[0]]
      if (num && !nums.includes(num)) nums.push(num)
    }
    if (nums.length === requiredCount) {
      return nums.sort((a, b) => a - b)
    }
  }

  return null
}

async function main() {
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => /^exam-\d+\.ts$/.test(f))
    .sort()

  const results: MigrationResult[] = []
  const skipped: MigrationResult[] = []
  let totalMultiSelect = 0
  let totalMigrated = 0
  let totalAlreadyArray = 0

  for (const file of files) {
    const examYearMatch = file.match(/exam-(\d+)\.ts/)
    if (!examYearMatch) continue
    const examYear = parseInt(examYearMatch[1])

    const filePath = path.join(DATA_DIR, file)
    let content = fs.readFileSync(filePath, 'utf-8')

    // 公式正答を読み込む（100〜106回のみ存在）
    const officialAnswers = loadOfficialAnswers(examYear)
    // マージ済みJSONの正答（107〜110回のフォールバック）
    const mergedAnswers = loadMergedJsonAnswers(examYear)

    // 正規表現でブロック単位に問題を検出
    // question_textとcorrect_answerとexplanationを同時に取る
    // 各問題ブロックは { で始まり } で終わる
    const questionBlockPattern = /\{\s*"id":\s*"([^"]+)"[\s\S]*?"question_number":\s*(\d+)[\s\S]*?"question_text":\s*"((?:[^"\\]|\\.)*)"/g
    const blocks: Array<{
      id: string
      questionNumber: number
      questionText: string
      matchIndex: number
    }> = []

    let bm: RegExpExecArray | null
    while ((bm = questionBlockPattern.exec(content)) !== null) {
      blocks.push({
        id: bm[1],
        questionNumber: parseInt(bm[2]),
        questionText: bm[3],
        matchIndex: bm.index,
      })
    }

    for (const block of blocks) {
      if (!MULTI_PATTERN.test(block.questionText)) continue
      totalMultiSelect++

      const requiredCount = getRequiredSelections(block.questionText)

      // correct_answerの位置を特定（ブロック開始から次のブロックまで）
      const blockEnd = blocks.indexOf(block) + 1 < blocks.length
        ? blocks[blocks.indexOf(block) + 1].matchIndex
        : content.length
      const blockContent = content.slice(block.matchIndex, blockEnd)

      // 既に配列の場合はスキップ
      const arrayCheck = blockContent.match(/"correct_answer":\s*\[/)
      if (arrayCheck) {
        totalAlreadyArray++
        continue
      }

      // 現在の単一数値を取得
      const currentMatch = blockContent.match(/"correct_answer":\s*(\d+)/)
      if (!currentMatch) continue
      const currentAnswer = parseInt(currentMatch[1])

      let newAnswer: number[] | null = null
      let source: 'official' | 'explanation' | 'skipped' = 'skipped'

      // 戦略1: 公式正答を使う
      if (officialAnswers) {
        const official = officialAnswers[String(block.questionNumber)]
        if (Array.isArray(official) && official.length === requiredCount) {
          newAnswer = official.sort((a, b) => a - b)
          source = 'official'
        }
      }

      // 戦略2: マージ済みJSON（exam-{N}.json）から取得
      if (!newAnswer) {
        const merged = mergedAnswers[String(block.questionNumber)]
        if (merged && merged.length === requiredCount) {
          newAnswer = merged.sort((a, b) => a - b)
          source = 'merged-json'
        }
      }

      // 戦略3: 解説テキストから抽出
      if (!newAnswer) {
        const explanationMatch = blockContent.match(/"explanation":\s*"((?:[^"\\]|\\.)*)"/)
        const explanation = explanationMatch ? explanationMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : ''
        const extracted = extractAnswersFromExplanation(explanation, requiredCount)
        if (extracted) {
          newAnswer = extracted
          source = 'explanation'
        }
      }

      if (!newAnswer) {
        skipped.push({
          id: block.id,
          questionNumber: block.questionNumber,
          file,
          oldAnswer: currentAnswer,
          newAnswer: [],
          source: 'skipped',
          reason: `${requiredCount}つ選べだが正答を特定できず`,
        })
        continue
      }

      // 置換を実行
      const oldStr = `"correct_answer": ${currentAnswer}`
      const newStr = `"correct_answer": [${newAnswer.join(', ')}]`

      // ブロック内の正確な位置で置換
      const correctAnswerIndex = content.indexOf(oldStr, block.matchIndex)
      if (correctAnswerIndex === -1 || correctAnswerIndex >= blockEnd) {
        skipped.push({
          id: block.id,
          questionNumber: block.questionNumber,
          file,
          oldAnswer: currentAnswer,
          newAnswer,
          source: 'skipped',
          reason: `"correct_answer": ${currentAnswer} がブロック内に見つからず`,
        })
        continue
      }

      content = content.slice(0, correctAnswerIndex) + newStr + content.slice(correctAnswerIndex + oldStr.length)

      // ブロックパターンのインデックスが変わるため、以降のブロックのインデックスを調整
      const lengthDiff = newStr.length - oldStr.length
      for (const b of blocks) {
        if (b.matchIndex > correctAnswerIndex) {
          b.matchIndex += lengthDiff
        }
      }

      results.push({
        id: block.id,
        questionNumber: block.questionNumber,
        file,
        oldAnswer: currentAnswer,
        newAnswer,
        source,
      })
      totalMigrated++
    }

    // ファイルごとの集計
    const fileResults = results.filter(r => r.file === file)
    const fileSkipped = skipped.filter(r => r.file === file)

    // ファイル書き込み（このファイルに移行があった場合のみ）
    if (!DRY_RUN && fileResults.length > 0) {
      fs.writeFileSync(filePath, content, 'utf-8')
    }

    if (fileResults.length > 0 || fileSkipped.length > 0) {
      console.log(`\n📄 ${file}: ${fileResults.length}問移行, ${fileSkipped.length}問スキップ`)
    }
  }

  // サマリー
  console.log('\n' + '='.repeat(60))
  console.log(`=== 移行結果サマリー ===`)
  console.log(`  複数選択問題（合計）: ${totalMultiSelect}問`)
  console.log(`  既に配列済み: ${totalAlreadyArray}問`)
  console.log(`  今回移行: ${totalMigrated}問`)
  console.log(`  スキップ: ${skipped.length}問`)
  if (DRY_RUN) {
    console.log(`  ⚠ DRY RUN モード: 実際のファイル変更は行っていません`)
  }

  // 移行結果の詳細
  if (results.length > 0) {
    console.log('\n=== 移行詳細 ===')
    const bySource = { official: 0, 'merged-json': 0, explanation: 0 }
    for (const r of results) {
      if (r.source === 'official') bySource.official++
      else if (r.source === 'merged-json') bySource['merged-json']++
      else if (r.source === 'explanation') bySource.explanation++
    }
    console.log(`  公式正答ベース: ${bySource.official}問`)
    console.log(`  マージ済みJSONベース: ${bySource['merged-json']}問`)
    console.log(`  解説テキストベース: ${bySource.explanation}問`)

    console.log('\n--- 移行された問題 ---')
    for (const r of results) {
      console.log(`  ${r.id} (問${r.questionNumber}): ${r.oldAnswer} → [${r.newAnswer.join(', ')}] (${r.source})`)
    }
  }

  // スキップ詳細
  if (skipped.length > 0) {
    console.log('\n=== スキップ詳細（要手動確認） ===')
    for (const r of skipped) {
      console.log(`  ${r.id} (問${r.questionNumber}): correct_answer=${r.oldAnswer}, reason=${r.reason}`)
    }
  }
}

main().catch(console.error)
