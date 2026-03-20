/**
 * choices: [] の問題（画像問題）から、問題文のみを抽出する
 * OCRで混入したグラフラベル・表データ・化学式フラグメントを除去する
 *
 * npx tsx scripts/extract-question-sentence.ts --dry-run --year 100      # 単年・ドライラン
 * npx tsx scripts/extract-question-sentence.ts --year 100-110            # 範囲指定
 * npx tsx scripts/extract-question-sentence.ts                           # デフォルト: 100-110
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface Question {
  id: string
  year: number
  question_number: number
  section?: string
  subject?: string
  category?: string
  question_text: string
  question_text_original?: string
  choices: unknown[]
  correct_answer?: unknown
  explanation?: string
  tags?: unknown[]
  [key: string]: unknown
}

interface YearResult {
  year: number
  processed: number
  modified: number
  charsRemoved: number
}

function parseExamFile(filePath: string): { prefix: string; questions: Question[] } | null {
  if (!fs.existsSync(filePath)) {
    console.log(`  警告: ${filePath} が見つかりません`)
    return null
  }

  const content = fs.readFileSync(filePath, 'utf-8')

  const arrayStart = content.indexOf('[\n')
  if (arrayStart === -1) {
    console.log(`  警告: ${filePath} のJSONパースに失敗（配列が見つかりません）`)
    return null
  }

  const prefix = content.substring(0, arrayStart)
  const jsonPart = content.substring(arrayStart).trimEnd()

  try {
    const questions = JSON.parse(jsonPart) as Question[]
    return { prefix, questions }
  } catch (e) {
    console.log(`  警告: ${filePath} のJSONパースエラー: ${(e as Error).message}`)
    return null
  }
}

/**
 * 問題文から「問題の文章」のみを抽出する
 * グラフラベル、表データ、選択肢番号などのOCRゴミを除去する
 */
function extractQuestionSentence(text: string): string {
  // 短すぎるテキストはスキップ
  if (text.length < 30) return text

  // 問題の終了パターン（「〜はどれか」「〜を選べ」「〜つ選べ」「〜選びなさい」）
  // OCRで数字や空白が挟まることがあるため、柔軟にマッチ
  const endingPatterns = [
    /[はどれか。]/,
    /[はどれか]/,
    /[をを]\s*選べ[。]?/,
    /つ選べ[。]?/,
    /選びなさい[。]?/,
    /選べ[。]?/,
  ]

  // 終了パターンの後に続く「ただし」「なお」「ここで」条件文も含める
  // これらは問題文の一部（条件提示）

  // 戦略：
  // 1. 終了パターン（はどれか/選べ等）の最後の出現位置を見つける
  // 2. その後の「ただし」「なお」「ここで」で始まる条件文も含める
  // 3. 条件文の終わり（。で終わる文）まで含める
  // 4. それ以降のテキスト（グラフ/表データ）を除去する

  // まず、全ての終了パターンの位置を収集
  const endPositions: { index: number; matchEnd: number }[] = []

  // 「はどれか」パターン
  const pattern1 = /はどれか/g
  let match: RegExpExecArray | null
  while ((match = pattern1.exec(text)) !== null) {
    endPositions.push({ index: match.index, matchEnd: match.index + match[0].length })
  }

  // 「つ選べ」パターン（「1つ選べ」「2つ選べ」「１つ選べ」等）
  const pattern2 = /つ選べ/g
  while ((match = pattern2.exec(text)) !== null) {
    endPositions.push({ index: match.index, matchEnd: match.index + match[0].length })
  }

  // 「を選べ」パターン
  const pattern3 = /を選べ/g
  while ((match = pattern3.exec(text)) !== null) {
    endPositions.push({ index: match.index, matchEnd: match.index + match[0].length })
  }

  // 「選びなさい」パターン
  const pattern4 = /選びなさい/g
  while ((match = pattern4.exec(text)) !== null) {
    endPositions.push({ index: match.index, matchEnd: match.index + match[0].length })
  }

  if (endPositions.length === 0) {
    // 終了パターンが見つからない場合はそのまま返す
    return text
  }

  // 最後の出現位置を使う（連問で前の方にもパターンが出る場合があるため）
  endPositions.sort((a, b) => b.index - a.index)
  const lastEnd = endPositions[0]

  // 終了パターンの後の「。」も含める
  let cutPosition = lastEnd.matchEnd
  if (cutPosition < text.length && text[cutPosition] === '。') {
    cutPosition++
  }

  // 終了パターン後のテキストをチェック
  // 「ただし」「なお」「ここで」で始まる条件文を含める
  const afterEnding = text.substring(cutPosition)

  // 条件文パターン：改行や空白の後に「ただし」「なお」「ここで」が来る
  const conditionPattern = /^[\s\n]*(?:ただし|なお|ここで)/
  if (conditionPattern.test(afterEnding)) {
    // 条件文の終わりを探す
    // 条件文は通常「。」で終わる文が1〜複数続く
    // グラフ/表データに入る前の最後の「。」を探す

    // 条件文のテキストを行ごとに見て、条件文の範囲を特定
    const lines = afterEnding.split('\n')
    let conditionEnd = 0
    let inCondition = false
    let accumulatedLen = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmedLine = line.trim()

      if (i === 0 && trimmedLine === '') {
        // 最初の空行はスキップ（改行のみ）
        accumulatedLen += line.length + 1 // +1 for \n
        continue
      }

      if (!inCondition && /^(?:ただし|なお|ここで)/.test(trimmedLine)) {
        inCondition = true
      }

      if (inCondition) {
        // 既に条件文が「。」で終わった後に、新しい行が来た場合
        // → その行が条件文の続き（ただし/なお/ここで始まる新しい条件）でなければ終了
        if (conditionEnd > 0 && i > 0) {
          // 新しい条件文（「ただし」等）の開始でなければ終了
          if (!/^(?:ただし|なお|ここで)/.test(trimmedLine)) {
            break
          }
        }

        accumulatedLen += line.length + 1

        // この行が「。」で終わっていれば、条件文の候補終了位置
        if (trimmedLine.endsWith('。')) {
          conditionEnd = accumulatedLen
        }

        // 空行が来たら条件文は終了
        if (trimmedLine === '' && conditionEnd > 0) {
          break
        }
      } else {
        // 条件文でない行に到達
        break
      }
    }

    if (conditionEnd > 0) {
      cutPosition += conditionEnd
      // 末尾の余分な改行を除去
      while (cutPosition > 0 && text[cutPosition - 1] === '\n') {
        cutPosition--
      }
    }
  }

  const result = text.substring(0, cutPosition).trim()

  // 結果が元のテキストより短くなっていることを確認
  if (result.length >= text.length) {
    return text
  }

  return result
}

/**
 * 行がグラフ/表のデータっぽいかどうかを判定
 */
function isGarbageLine(line: string): boolean {
  if (line === '') return false

  // 数値のみの行
  if (/^[\d\s.．,，]+$/.test(line)) return true

  // 非常に短い行（1-2文字）で、漢字やカタカナ1文字のみ（グラフラベル等）
  if (line.length <= 2 && /^[A-ZＡ-Ｚa-zａ-ｚ０-９0-9]$/.test(line)) return true

  // 選択肢番号のみの行
  if (/^[1-5１-５]\s*$/.test(line)) return true

  return false
}

function processYear(year: number, dryRun: boolean): YearResult {
  console.log(`\n=== 第${year}回 ===`)

  const tsPath = path.join(__dirname, '..', 'src', 'data', 'real-questions', `exam-${year}.ts`)
  const parsed = parseExamFile(tsPath)

  if (!parsed) {
    return { year, processed: 0, modified: 0, charsRemoved: 0 }
  }

  const { prefix, questions } = parsed

  // choices が空の問題のみ対象
  const targetQuestions = questions.filter(q => !q.choices || q.choices.length === 0)
  console.log(`  対象問題（choices空）: ${targetQuestions.length}問`)

  let modified = 0
  let totalCharsRemoved = 0

  for (const q of targetQuestions) {
    const original = q.question_text
    const extracted = extractQuestionSentence(original)

    if (extracted === original) continue

    const charsRemoved = original.length - extracted.length
    if (charsRemoved <= 0) continue

    totalCharsRemoved += charsRemoved
    modified++

    if (dryRun) {
      const origPreview = original.replace(/\n/g, '\\n').substring(0, 80)
      const extractedPreview = extracted.replace(/\n/g, '\\n').substring(0, 80)
      console.log(`  ${q.id}: ${original.length} chars → ${extracted.length} chars (removed ${charsRemoved} chars)`)
      console.log(`    BEFORE: ${origPreview}...`)
      console.log(`    AFTER:  ${extractedPreview}...`)
    }

    if (!dryRun) {
      // question_text_original は既にあるはずなので上書きしない
      // まだ無い場合のみセットする
      if (!q.question_text_original) {
        q.question_text_original = original
      }
      q.question_text = extracted
    }
  }

  if (!dryRun && modified > 0) {
    const jsonContent = JSON.stringify(questions, null, 2)
    fs.writeFileSync(tsPath, prefix + jsonContent + '\n', 'utf-8')
    console.log(`  書き込み完了: ${modified}問を更新`)
  } else if (dryRun) {
    console.log(`  [DRY-RUN] 変更予定: ${modified}問 / ${totalCharsRemoved}文字削除`)
  } else {
    console.log(`  変更なし`)
  }

  return { year, processed: targetQuestions.length, modified, charsRemoved: totalCharsRemoved }
}

function main() {
  const dryRun = process.argv.includes('--dry-run')
  const yearArg = process.argv.find((_, i) => process.argv[i - 1] === '--year')

  let years: number[]
  if (yearArg && yearArg.includes('-')) {
    const [start, end] = yearArg.split('-').map(Number)
    years = Array.from({ length: end - start + 1 }, (_, i) => start + i)
  } else if (yearArg) {
    years = [Number(yearArg)]
  } else {
    years = Array.from({ length: 11 }, (_, i) => 100 + i) // 100-110
  }

  if (dryRun) {
    console.log('[DRY-RUN モード] ファイルへの書き込みはしません')
  }
  console.log(`処理対象: 第${years[0]}回〜第${years[years.length - 1]}回`)

  const results: YearResult[] = []
  for (const year of years) {
    results.push(processYear(year, dryRun))
  }

  // サマリー
  console.log('\n=== サマリー ===')
  let totalProcessed = 0
  let totalModified = 0
  let totalCharsRemoved = 0

  for (const r of results) {
    if (r.processed > 0) {
      console.log(
        `第${r.year}回: 処理${r.processed}問 → 変更${r.modified}問 / ${r.charsRemoved}文字削除`
      )
    }
    totalProcessed += r.processed
    totalModified += r.modified
    totalCharsRemoved += r.charsRemoved
  }

  console.log(`\n合計: 処理${totalProcessed}問 → 変更${totalModified}問 / ${totalCharsRemoved}文字削除`)

  if (dryRun) {
    console.log('\n[DRY-RUN] 実際に適用するには --dry-run を外して実行してください')
  }
}

main()
