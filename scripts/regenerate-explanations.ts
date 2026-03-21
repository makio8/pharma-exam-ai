/**
 * プレースホルダー解説の再生成スクリプト
 *
 * 「親問題の解説を参照」「連問のため前問の解説も参照」「問題の選択肢と正答に基づく解説」
 * などのテンプレート的な解説を、Claude APIで個別に生成し直す。
 *
 * Usage:
 *   npx tsx scripts/regenerate-explanations.ts --dry-run          # 対象を数えるだけ
 *   npx tsx scripts/regenerate-explanations.ts --year 100 --batch 3  # 第100回のみ、3問ずつ
 *   npx tsx scripts/regenerate-explanations.ts --batch 5            # 全年度、5問ずつ
 */

import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const EXAM_DIR = path.join(__dirname, '..', 'src', 'data', 'real-questions')
const PROGRESS_FILE = path.join(__dirname, '..', '.regenerate-progress.json')

// CLI引数パース
const args = process.argv.slice(2)
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`)
  return idx >= 0 ? args[idx + 1] : undefined
}
const DRY_RUN = args.includes('--dry-run')
const TARGET_YEAR = getArg('year') ? parseInt(getArg('year')!) : undefined
const BATCH_SIZE = parseInt(getArg('batch') || '5')

// プレースホルダー検出パターン
const PLACEHOLDER_PATTERNS = [
  /連問のため.*参照/,
  /親問題.*解説.*参照/,
  /親問題.*参照/,
  /前後の連問を通して理解する/,
  /問題の選択肢と正答に基づく解説/,
  /関連する薬学知識を参照/,
  /関連する薬理・病態知識を参照/,
  /関連する実務知識を参照/,
  /連問のため前問の解説も参照/,
]

function isPlaceholder(explanation: string): boolean {
  return PLACEHOLDER_PATTERNS.some(p => p.test(explanation))
}

const SYSTEM_PROMPT = `あなたは薬剤師国家試験の予備校講師です。
受験生が「なぜ間違えたか」を理解し「次に同じタイプの問題が出たら解ける」ようになることがゴールです。

以下の厳密な形式で解説を作成してください。余計な前置きは不要です。

【ポイント】この問題を一言で言うと何を問われているか（1行）
【正答の根拠】なぜ正答が正しいか（2-3文、教科書的に正確に）
【他の選択肢】
1. ✗（理由を1文で。なぜ間違いかを明確に）
2. ✗（同上）
...全選択肢について記載（正答の選択肢には○をつけ、正しい理由を1文で）
【覚え方💡】語呂合わせ・比較表・判定法のヒント（先輩ノート風のカジュアルなトーンで。実用的な覚え方を1-3個）
【関連知識】この問題と一緒に覚えるべきこと（1-2行）

注意:
- 医学・薬学的に正確な情報のみ記載
- 不確かな情報は書かない
- 正答番号は既に与えられているので、それに基づいて解説する
- 連問（複数問セット）の場合はシナリオも参考にして、この問題単独で理解できる解説にする
- 日本語で回答`

interface QuestionData {
  id: string
  year: number
  question_number: number
  section: string
  subject: string
  question_text: string
  choices: { key: number; text: string }[]
  correct_answer: number | number[]
  explanation: string
  linked_scenario?: string
  linked_group?: string
}

interface QuestionToRegenerate {
  file: string
  id: string
  year: number
  questionNumber: number
  questionText: string
  choices: { key: number; text: string }[]
  correctAnswer: number | number[]
  linkedScenario: string
  subject: string
  currentExplanation: string
}

function loadProgress(): Set<string> {
  try {
    const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
    return new Set(data.completed || [])
  } catch {
    return new Set()
  }
}

function saveProgress(completed: Set<string>) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ completed: [...completed] }, null, 2))
}

function findPlaceholderQuestions(): QuestionToRegenerate[] {
  const results: QuestionToRegenerate[] = []
  const years = TARGET_YEAR ? [TARGET_YEAR] : Array.from({ length: 12 }, (_, i) => 100 + i)

  for (const year of years) {
    const filePath = path.join(EXAM_DIR, `exam-${year}.ts`)
    if (!fs.existsSync(filePath)) continue

    const content = fs.readFileSync(filePath, 'utf-8')
    const jsonMatch = content.match(/export const EXAM_\d+_QUESTIONS: Question\[\] = (\[[\s\S]*\])/)
    if (!jsonMatch) continue

    let questions: QuestionData[]
    try {
      questions = JSON.parse(jsonMatch[1])
    } catch (e) {
      console.error(`JSON parse error in exam-${year}.ts: ${e}`)
      continue
    }

    for (const q of questions) {
      if (isPlaceholder(q.explanation)) {
        results.push({
          file: filePath,
          id: q.id,
          year: q.year,
          questionNumber: q.question_number,
          questionText: q.question_text,
          choices: q.choices,
          correctAnswer: q.correct_answer,
          linkedScenario: q.linked_scenario || '',
          subject: q.subject,
          currentExplanation: q.explanation,
        })
      }
    }
  }

  return results
}

function buildPrompt(q: QuestionToRegenerate): string {
  const choicesText = q.choices.map(c => `${c.key}. ${c.text}`).join('\n')
  const correctStr = Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : String(q.correctAnswer)

  let prompt = `第${q.year}回 薬剤師国家試験 問${q.questionNumber}（${q.subject}）\n`

  if (q.linkedScenario) {
    prompt += `\n【連問シナリオ】\n${q.linkedScenario}\n`
  }

  prompt += `\n【問題文】\n${q.questionText}\n\n【選択肢】\n${choicesText}\n\n【正答】${correctStr}\n`
  prompt += '\n上記の問題について、指定された形式で解説を作成してください。'

  return prompt
}

function escapeForTsString(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .replace(/\t/g, '\\t')
}

async function callWithRetry(
  client: Anthropic,
  prompt: string,
  retries = 3,
): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      })

      return response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('')
    } catch (e: any) {
      if (attempt < retries - 1) {
        const waitMs = 1000 * Math.pow(2, attempt) // 1s, 2s, 4s
        console.error(`  API error (attempt ${attempt + 1}/${retries}): ${e.message}. Retrying in ${waitMs}ms...`)
        await sleep(waitMs)
      } else {
        throw e
      }
    }
  }
  throw new Error('Unreachable')
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function replaceExplanationInFile(filePath: string, questionId: string, newExplanation: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8')
  const escaped = escapeForTsString(newExplanation)

  // Find the question block by ID and replace its explanation
  // Pattern: "id": "r100-197" ... "explanation": "..."
  // We need to find the specific explanation for this question ID

  // Strategy: find the question ID, then find the next "explanation": "..." after it
  const idPattern = `"id": "${questionId}"`
  const idIndex = content.indexOf(idPattern)
  if (idIndex < 0) {
    console.error(`  Could not find question ${questionId} in file`)
    return false
  }

  // Find the "explanation": "..." after this ID
  const afterId = content.substring(idIndex)
  const explMatch = afterId.match(/"explanation": "((?:[^"\\]|\\.)*)"/)
  if (!explMatch) {
    console.error(`  Could not find explanation for ${questionId}`)
    return false
  }

  const oldExplanation = explMatch[0] // full match: "explanation": "..."
  const replaceFrom = idIndex + afterId.indexOf(oldExplanation)
  const replaceTo = replaceFrom + oldExplanation.length
  const newContent =
    content.substring(0, replaceFrom) +
    `"explanation": "${escaped}"` +
    content.substring(replaceTo)

  fs.writeFileSync(filePath, newContent, 'utf-8')
  return true
}

async function main() {
  console.log('=== プレースホルダー解説の再生成 ===\n')

  // 対象の検出
  const targets = findPlaceholderQuestions()
  console.log(`検出: ${targets.length} 問のプレースホルダー解説\n`)

  if (targets.length === 0) {
    console.log('対象なし。終了します。')
    return
  }

  // 年度別集計
  const byYear = new Map<number, number>()
  for (const t of targets) {
    byYear.set(t.year, (byYear.get(t.year) || 0) + 1)
  }
  for (const [year, count] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`  第${year}回: ${count}問`)
  }
  console.log()

  if (DRY_RUN) {
    console.log('--dry-run モード: 検出のみで終了します。')
    // 各問題のIDを表示
    for (const t of targets) {
      console.log(`  ${t.id} (問${t.questionNumber}) - ${t.subject}`)
    }
    return
  }

  // APIキー確認
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY が設定されていません')
    console.error('export ANTHROPIC_API_KEY=sk-ant-... を実行してください')
    process.exit(1)
  }

  const client = new Anthropic()

  // 進捗の読み込み（再実行時のスキップ用）
  const completed = loadProgress()
  const remaining = targets.filter(t => !completed.has(t.id))

  if (remaining.length < targets.length) {
    console.log(`前回の進捗: ${targets.length - remaining.length}問完了済み、${remaining.length}問残り\n`)
  }

  if (remaining.length === 0) {
    console.log('全問完了済みです。進捗をリセットするには .regenerate-progress.json を削除してください。')
    return
  }

  let success = 0
  let failures: string[] = []

  for (let i = 0; i < remaining.length; i++) {
    const q = remaining[i]
    const startTime = Date.now()

    process.stdout.write(`[${i + 1}/${remaining.length}] ${q.id} (問${q.questionNumber}, ${q.subject}) ... `)

    try {
      const prompt = buildPrompt(q)
      const explanation = await callWithRetry(client, prompt)

      // ファイルに書き戻す
      const ok = replaceExplanationInFile(q.file, q.id, explanation)
      if (!ok) {
        throw new Error('ファイル書き込み失敗')
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`done (${elapsed}s)`)

      completed.add(q.id)
      success++

      // バッチごとに進捗保存
      if (success % BATCH_SIZE === 0) {
        saveProgress(completed)
      }

      // レート制限対策: 500ms待機
      if (i < remaining.length - 1) {
        await sleep(500)
      }
    } catch (e: any) {
      console.log(`FAILED: ${e.message}`)
      failures.push(`${q.id}: ${e.message}`)
    }
  }

  // 最終進捗保存
  saveProgress(completed)

  console.log(`\n=== 完了 ===`)
  console.log(`成功: ${success}問`)
  if (failures.length > 0) {
    console.log(`失敗: ${failures.length}問`)
    for (const f of failures) {
      console.log(`  - ${f}`)
    }
  }
}

main().catch(e => {
  console.error('Fatal error:', e)
  process.exit(1)
})
