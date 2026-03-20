/**
 * Gemini Flash vs Claude Code 品質比較テスト
 * 同じ画像に同じプロンプトを投げて、choices抽出精度を比較する
 *
 * npx tsx scripts/test-gemini-vision.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { GoogleGenerativeAI } from '@google/generative-ai'

const PROMPT = `この薬剤師国家試験の問題画像から、各問題の選択肢をJSON形式で抽出してください。

ルール:
- 画像内のすべての問題を抽出する
- 選択肢がテキスト化可能な場合（文字・表形式）: extractable: true
- 構造式・図・グラフの場合: extractable: false
- 表形式の場合は「項目A ── 項目B」のように結合する

出力形式（JSON配列）:
[
  {
    "question_number": 233,
    "question_text": "問題文...",
    "extractable": true,
    "choices": [
      {"key": 1, "text": "選択肢1"},
      {"key": 2, "text": "選択肢2"}
    ]
  }
]

JSONのみ出力してください。説明は不要です。`

const TEST_IMAGES = [
  {
    label: '100回 問233（表形式選択肢）',
    path: '/tmp/claude/exam-pages/100/q100-jissen1-32.png',
  },
  {
    label: '100回 問239（テキスト選択肢）',
    path: '/tmp/claude/exam-pages/100/q100-jissen1-36.png',
  },
]

async function main() {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    console.error('エラー: GOOGLE_AI_API_KEY が設定されていません')
    console.error('.env.local に設定済みの場合: source .env.local してから実行')
    process.exit(1)
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  for (const img of TEST_IMAGES) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📷 ${img.label}`)
    console.log(`   ファイル: ${img.path}`)
    console.log('='.repeat(60))

    if (!fs.existsSync(img.path)) {
      console.error(`   ❌ ファイルが見つかりません`)
      continue
    }

    const imageData = fs.readFileSync(img.path)
    const base64 = imageData.toString('base64')

    const start = Date.now()

    try {
      const result = await model.generateContent([
        PROMPT,
        {
          inlineData: {
            mimeType: 'image/png',
            data: base64,
          },
        },
      ])

      const elapsed = Date.now() - start
      const text = result.response.text()

      console.log(`   ⏱️  処理時間: ${elapsed}ms`)
      console.log(`   📝 レスポンス:`)
      console.log(text)
    } catch (err: any) {
      console.error(`   ❌ エラー: ${err.message}`)
    }
  }
}

main()
