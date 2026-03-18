/**
 * AI構造化解説 自動生成パイプライン
 *
 * 入力: 問題文 + 選択肢 + 正答 + 既存解説（e-REC/yakugakulab）
 * 出力: 構造化された解説テキスト
 *
 * プロンプト設計:
 *   - 予備校講師ペルソナ
 *   - 結論は教科書的に正確、覚え方は先輩ノート風
 *   - 全選択肢の検討 + 覚え方 + 関連知識
 *
 * npx tsx scripts/generate-explanations.ts [--year 110] [--start 1] [--end 90]
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import Anthropic from '@anthropic-ai/sdk'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '..', 'src', 'data', 'real-questions')

// CLI引数
const args = process.argv.slice(2)
const yearArg = args.find(a => a.startsWith('--year'))
const startArg = args.find(a => a.startsWith('--start'))
const endArg = args.find(a => a.startsWith('--end'))
const targetYear = yearArg ? parseInt(args[args.indexOf(yearArg) + 1]) : 110
const startQ = startArg ? parseInt(args[args.indexOf(startArg) + 1]) : 1
const endQ = endArg ? parseInt(args[args.indexOf(endArg) + 1]) : 345

const SYSTEM_PROMPT = `あなたは薬剤師国家試験の予備校講師です。
受験生が「なぜ間違えたか」を理解し「次に同じタイプの問題が出たら解ける」ようになることがゴールです。

以下の厳密な形式で解説を作成してください。余計な前置きは不要です。

【ポイント】この問題を一言で言うと何を問われているか（1行）
【正答の根拠】なぜ正答が正しいか（2-3文、教科書的に正確に）
【他の選択肢】
1. ✗（理由を1文で。なぜ間違いかを明確に）
2. ✗（同上）
...全選択肢について記載
【覚え方💡】語呂合わせ・比較表・判定法のヒント（先輩ノート風のカジュアルなトーンで。実用的な覚え方を1-3個）
【関連知識】この問題と一緒に覚えるべきこと（1-2行）

注意:
- 医学・薬学的に正確な情報のみ記載
- 不確かな情報は書かない
- 正答番号は既に与えられているので、それに基づいて解説する
- 日本語で回答`

interface QuestionData {
  id: string
  year: number
  question_number: number
  section: string
  subject: string
  question_text: string
  choices: { key: number; text: string }[]
  correct_answer: number
  explanation: string
}

function buildUserPrompt(q: QuestionData, existingExpl: string): string {
  const choicesText = q.choices.map(c => `${c.key}. ${c.text}`).join('\n')

  let prompt = `第${q.year}回 薬剤師国家試験 問${q.question_number}（${q.subject}）

【問題文】
${q.question_text}

【選択肢】
${choicesText}

【正答】${q.correct_answer}
`

  if (existingExpl && existingExpl.length > 20) {
    prompt += `\n【参考: 既存解説】\n${existingExpl.substring(0, 500)}\n`
  }

  prompt += '\n上記の問題について、指定された形式で解説を作成してください。'

  return prompt
}

async function generateExplanation(
  client: Anthropic,
  q: QuestionData,
  existingExpl: string,
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: buildUserPrompt(q, existingExpl) },
    ],
  })

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('')

  return text
}

async function main() {
  // Anthropic APIキーの確認
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY が設定されていません')
    console.error('export ANTHROPIC_API_KEY=sk-ant-... を実行してください')
    process.exit(1)
  }

  const client = new Anthropic({ apiKey })

  console.log(`=== 解説生成: 第${targetYear}回 問${startQ}〜問${endQ} ===\n`)

  // 問題データ読み込み
  const tsPath = path.join(dataDir, `exam-${targetYear}.ts`)
  // TSファイルではなくJSONを使う（パース容易）
  // improve-confidence.ts が生成したTSからデータを取得
  // 代わりにexam-{year}.jsonとerec.jsonから既存解説を取得
  let questions: QuestionData[] = []
  try {
    // TSファイルの中のJSON部分を抽出
    const tsContent = fs.readFileSync(tsPath, 'utf-8')
    const jsonMatch = tsContent.match(/export const EXAM_\d+_QUESTIONS: Question\[\] = (\[[\s\S]*\])/)
    if (jsonMatch) {
      questions = JSON.parse(jsonMatch[1])
    }
  } catch (e) {
    console.error(`データ読み込み失敗: ${e}`)
    process.exit(1)
  }

  // 既存解説ソース
  let erecData: any[] = []
  try {
    erecData = JSON.parse(fs.readFileSync(path.join(dataDir, `exam-${targetYear}-erec.json`), 'utf-8'))
  } catch {}
  const erecMap = new Map(erecData.map((q: any) => [q.question_number, q]))

  // 対象問題をフィルタ
  const targets = questions.filter(q =>
    q.question_number >= startQ &&
    q.question_number <= endQ &&
    q.choices.length >= 5 &&
    q.correct_answer > 0
  )

  console.log(`対象: ${targets.length}問\n`)

  // 出力ファイル（追記モード）
  const outputPath = path.join(dataDir, `explanations-${targetYear}.json`)
  let existing: Record<string, string> = {}
  try {
    existing = JSON.parse(fs.readFileSync(outputPath, 'utf-8'))
  } catch {}

  let generated = 0
  let skipped = 0

  for (const q of targets) {
    const key = `r${targetYear}-${String(q.question_number).padStart(3, '0')}`

    // 既に生成済みならスキップ
    if (existing[key] && existing[key].length > 50) {
      skipped++
      continue
    }

    try {
      process.stdout.write(`問${q.question_number} [${q.subject}]...`)

      // 既存解説を参考情報として渡す
      const erec = erecMap.get(q.question_number) as any
      const existingExpl = erec?.explanation || q.explanation || ''

      const explanation = await generateExplanation(client, q, existingExpl)

      existing[key] = explanation
      generated++

      // 10問ごとに保存
      if (generated % 10 === 0) {
        fs.writeFileSync(outputPath, JSON.stringify(existing, null, 2), 'utf-8')
      }

      process.stdout.write(` ✅ (${explanation.length}文字)\n`)

      // レート制限対策: 1秒待機
      await new Promise(r => setTimeout(r, 1000))
    } catch (e: any) {
      process.stdout.write(` ❌ ${e.message}\n`)
      // レート制限エラーの場合は待機
      if (e.status === 429) {
        console.log('  レート制限 → 30秒待機...')
        await new Promise(r => setTimeout(r, 30000))
      }
    }
  }

  // 最終保存
  fs.writeFileSync(outputPath, JSON.stringify(existing, null, 2), 'utf-8')

  console.log(`\n=== 結果 ===`)
  console.log(`生成: ${generated}問`)
  console.log(`スキップ（生成済み）: ${skipped}問`)
  console.log(`合計: ${Object.keys(existing).length}問`)
  console.log(`保存: ${outputPath}`)
}

main().catch(console.error)
