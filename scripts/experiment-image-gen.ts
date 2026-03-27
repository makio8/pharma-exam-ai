/**
 * 過去問まとめ画像生成 実験スクリプト
 *
 * 問題文 + 選択肢 + 解説 → Nano Banana で1枚の解説カード画像を生成
 *
 * Usage:
 *   npx tsx scripts/experiment-image-gen.ts r100-001                        # Nano Banana 2 (AI Studio)
 *   npx tsx scripts/experiment-image-gen.ts r100-001 --model nano-banana    # 初代 (Vertex AI)
 *   npx tsx scripts/experiment-image-gen.ts r100-001 --model nano-banana-pro # Pro (AI Studio)
 *   npx tsx scripts/experiment-image-gen.ts r100-002                        # 画像あり問題
 *
 * エンドポイント:
 *   - AI Studio: GOOGLE_AI_API_KEY で認証（Nano Banana 2 / Pro 用）
 *   - Vertex AI: ADC で認証（初代 Nano Banana 用、GCPクレジット消費）
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { GoogleAuth } from 'google-auth-library'
import { ALL_QUESTIONS } from '../src/data/all-questions'
import type { Question, Choice } from '../src/types/question'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..')

// --- Config ---
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'scripts', 'output', 'image-gen')

// モデル定義（endpoint: どちらのAPIを使うか）
interface ModelDef {
  id: string
  endpoint: 'ai-studio' | 'vertex-ai'
  description: string
}

const MODELS: Record<string, ModelDef> = {
  'nano-banana-2': {
    id: 'gemini-3.1-flash-image-preview',
    endpoint: 'ai-studio',             // Vertex AI は allowlist 必要（2026-03時点）
    description: 'Nano Banana 2 — 日本語テキスト精度UP、コスパ最強（~$0.067/枚）',
  },
  'nano-banana-pro': {
    id: 'gemini-3-pro-image-preview',
    endpoint: 'ai-studio',
    description: 'Nano Banana Pro — 最高品質（~$0.134/枚）',
  },
  'nano-banana': {
    id: 'gemini-2.5-flash-image',
    endpoint: 'vertex-ai',             // Vertex AI で使える → GCPクレジット消費
    description: 'Nano Banana 初代 — GCPクレジット対応（~$0.039/枚）',
  },
}
const DEFAULT_MODEL = 'nano-banana-2'

// --- CLI ---
const args = process.argv.slice(2)
const questionId = args.find(a => !a.startsWith('--'))
const modelIdx = args.indexOf('--model')
const modelArg = modelIdx >= 0 ? args[modelIdx + 1] : DEFAULT_MODEL
const modelDef = MODELS[modelArg]
const MODEL_ID = modelDef?.id || modelArg
const ENDPOINT = modelDef?.endpoint || 'ai-studio'

// --- .env.local 読み取り ---
function readEnvVar(name: string): string {
  try {
    const envPath = path.join(PROJECT_ROOT, '.env.local')
    const content = fs.readFileSync(envPath, 'utf-8')
    const match = content.match(new RegExp(`${name}=(.+)`))
    return match ? match[1].trim().replace(/^["']|["']$/g, '') : ''
  } catch {
    return ''
  }
}

const GCP_PROJECT_ID = readEnvVar('GCP_PROJECT_ID')
const GCP_REGION = readEnvVar('GCP_REGION') || 'us-central1'
const AI_STUDIO_API_KEY = readEnvVar('GOOGLE_AI_API_KEY')

// --- Vertex AI Auth ---
const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
})

async function getAccessToken(): Promise<string> {
  const client = await auth.getClient()
  const tokenRes = await client.getAccessToken()
  return tokenRes.token || ''
}

// --- Prompt Builder ---

/** 選択肢をテキスト化（画像選択肢は semantic_labels を使う） */
function formatChoices(choices: Choice[], correctAnswer: number | number[]): string {
  const correctSet = new Set(Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer])
  return choices.map(c => {
    const mark = correctSet.has(c.key) ? '✅' : '❌'
    const text = c.text || (c.semantic_labels ? `[図: ${c.semantic_labels.join(', ')}]` : '[画像選択肢]')
    return `${mark} ${c.key}. ${text}`
  }).join('\n')
}

/** 解説から核心部分を抽出（長すぎるとトークン無駄） */
function extractKeyPoints(explanation: string): string {
  const sections: string[] = []
  const pointMatch = explanation.match(/【ポイント】([^\n【]+)/)
  if (pointMatch) sections.push(`ポイント: ${pointMatch[1].trim()}`)

  const reasonMatch = explanation.match(/【正答の根拠】([\s\S]*?)(?=【|$)/)
  if (reasonMatch) sections.push(`正答の根拠: ${reasonMatch[1].trim().substring(0, 200)}`)

  const mnemonicMatch = explanation.match(/【覚え方[💡]?】([\s\S]*?)(?=【|$)/)
  if (mnemonicMatch) sections.push(`覚え方: ${mnemonicMatch[1].trim()}`)

  return sections.length > 0 ? sections.join('\n') : explanation.substring(0, 300)
}

/** テキストのみ問題のプロンプト */
function buildTextOnlyPrompt(q: Question): string {
  const choices = formatChoices(q.choices, q.correct_answer)
  const keyPoints = extractKeyPoints(q.explanation)

  return `あなたは薬剤師国家試験の教育デザイナーです。以下の過去問の「1枚まとめ解説カード」を画像として生成してください。

## デザイン要件
- サイズ: スマホ画面に最適な縦長カード（9:16比率）
- 背景: 薄いグラデーション（科目で色分け: 物理=青系, 化学=緑系, 生物=オレンジ系, 薬理=紫系, 衛生=ティール系, 薬剤=ピンク系, 病態=赤系, 法規=グレー系, 実務=黄系）
- 構成:
  1. ヘッダー: 「第${q.year}回 問${q.question_number}」「${q.subject}」「${q.section}」
  2. 問題文エリア: 問題文を読みやすく配置
  3. 選択肢エリア: 正解に✅、不正解に❌マーク付き
  4. 解説エリア: 核心ポイントを図解・矢印・ハイライトで視覚化
  5. 覚え方があれば吹き出しで強調
- フォント: 日本語、読みやすいサイズ
- 全体的にSoft Companion（やさしい・親しみやすい）テイスト
- 日本語テキストは正確に描画すること（文字化けNG）

## 問題データ
【問題文】
${q.question_text}

【選択肢と正答】
${choices}

【解説の核心】
${keyPoints}

1枚の画像にまとめて生成してください。テキストは日本語で正確に。`
}

/** 画像あり問題のプロンプト */
function buildImageQuestionPrompt(q: Question): string {
  const choices = formatChoices(q.choices, q.correct_answer)
  const keyPoints = extractKeyPoints(q.explanation)
  const visualType = q.visual_content_type || 'mixed'

  return `あなたは薬剤師国家試験の教育デザイナーです。以下の過去問の「1枚まとめ解説カード」を画像として生成してください。

## この問題の特徴
- 視覚コンテンツタイプ: ${visualType}（${
    visualType === 'structural_formula' ? '構造式' :
    visualType === 'graph' ? 'グラフ' :
    visualType === 'table' ? '表' :
    visualType === 'diagram' ? '図解' :
    visualType === 'prescription' ? '処方箋' : 'その他'
  }を含む問題）
- 添付画像は元の問題画像です。この内容を解説カードに統合してください

## デザイン要件
- サイズ: スマホ画面に最適な縦長カード（9:16比率）
- 背景: 薄いグラデーション（科目: ${q.subject}）
- 構成:
  1. ヘッダー: 「第${q.year}回 問${q.question_number}」「${q.subject}」「${q.section}」
  2. 問題文エリア: 問題文 + 元画像の要素を整理して再構成
  3. 選択肢エリア: 正解に✅マーク、視覚選択肢はテキスト説明で補足
  4. 解説エリア: 核心ポイントを図解・矢印・ハイライトで視覚化
  5. なぜその答えかの「思考フロー」を矢印で示す
- フォント: 日本語、読みやすいサイズ
- 日本語テキストは正確に描画すること（文字化けNG）

## 問題データ
【問題文】
${q.question_text}

【選択肢と正答】
${choices}

【解説の核心】
${keyPoints}

元の問題画像を参考に、1枚の解説カードにまとめて生成してください。テキストは日本語で正確に。`
}

// --- API Call（AI Studio / Vertex AI 自動切替） ---
async function generateImage(
  prompt: string,
  questionImage?: string,
): Promise<{ imageBase64: string; text: string } | null> {
  // パーツ構成
  const parts: Array<Record<string, unknown>> = [{ text: prompt }]
  if (questionImage) {
    parts.push({
      inlineData: { mimeType: 'image/png', data: questionImage },
    })
  }

  const body = {
    generationConfig: {
      temperature: 0.8,
      responseModalities: ['TEXT', 'IMAGE'],
    },
    contents: [{
      role: 'user',
      parts,
    }],
  }

  // エンドポイント分岐
  let url: string
  let headers: Record<string, string>

  if (ENDPOINT === 'ai-studio') {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${AI_STUDIO_API_KEY}`
    headers = { 'Content-Type': 'application/json' }
    console.log(`  エンドポイント: AI Studio（API Key）`)
  } else {
    const token = await getAccessToken()
    url = `https://${GCP_REGION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT_ID}/locations/${GCP_REGION}/publishers/google/models/${MODEL_ID}:generateContent`
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
    console.log(`  エンドポイント: Vertex AI（GCPクレジット）`)
  }

  console.log(`\n🎨 API呼び出し中...`)
  console.log(`  モデル: ${MODEL_ID}`)
  console.log(`  プロンプト: ${prompt.length}文字`)
  if (questionImage) console.log(`  元画像: 添付あり`)

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errBody = await response.text()
    console.error(`❌ API error: ${response.status} ${response.statusText}`)
    console.error(`  詳細: ${errBody.substring(0, 800)}`)
    return null
  }

  // レスポンス解析
  const data = await response.json() as Record<string, unknown>
  const candidates = data.candidates as Array<Record<string, unknown>> | undefined
  const content = candidates?.[0]?.content as Record<string, unknown> | undefined
  const resParts = content?.parts as Array<Record<string, unknown>> | undefined

  if (!resParts) {
    console.error('❌ レスポンスにpartsがありません')
    console.error('  data:', JSON.stringify(data).substring(0, 500))
    return null
  }

  let imageBase64 = ''
  let text = ''

  for (const part of resParts) {
    if (part.text) {
      text += part.text as string
    }
    if (part.inlineData) {
      const inlineData = part.inlineData as Record<string, string>
      imageBase64 = inlineData.data || ''
    }
  }

  return { imageBase64, text }
}

// --- Main ---
async function main(): Promise<void> {
  if (!questionId) {
    console.log('使い方: npx tsx scripts/experiment-image-gen.ts <問題ID> [--model <名前>]')
    console.log('')
    console.log('例:')
    console.log('  npx tsx scripts/experiment-image-gen.ts r100-001                          # デフォルト: Nano Banana 2')
    console.log('  npx tsx scripts/experiment-image-gen.ts r100-001 --model nano-banana      # 初代（Vertex AI）')
    console.log('  npx tsx scripts/experiment-image-gen.ts r100-001 --model nano-banana-pro  # Pro（AI Studio）')
    console.log('  npx tsx scripts/experiment-image-gen.ts r100-002                          # 画像あり問題')
    console.log('')
    console.log('利用可能モデル:')
    for (const [alias, def] of Object.entries(MODELS)) {
      const marker = alias === DEFAULT_MODEL ? ' ⭐デフォルト' : ''
      console.log(`  ${alias.padEnd(20)} [${def.endpoint}] ${def.description}${marker}`)
    }
    process.exit(0)
  }

  // 認証チェック
  if (ENDPOINT === 'ai-studio' && !AI_STUDIO_API_KEY) {
    console.error('GOOGLE_AI_API_KEY not found in .env.local')
    console.error('AI Studio モデルには GOOGLE_AI_API_KEY が必要です')
    process.exit(1)
  }
  if (ENDPOINT === 'vertex-ai' && !GCP_PROJECT_ID) {
    console.error('GCP_PROJECT_ID not found in .env.local')
    process.exit(1)
  }

  // 問題を検索
  const question = ALL_QUESTIONS.find(q => q.id === questionId)
  if (!question) {
    console.error(`問題が見つかりません: ${questionId}`)
    console.error(`形式: r{年度}-{問番号3桁}  例: r100-001`)
    process.exit(1)
  }

  console.log(`=== 過去問まとめ画像生成 実験 ===`)
  console.log(`問題: ${question.id} (第${question.year}回 問${question.question_number})`)
  console.log(`科目: ${question.subject} / ${question.section}`)
  console.log(`画像: ${question.image_url ? 'あり (' + question.visual_content_type + ')' : 'なし (text_only)'}`)
  console.log(`モデル: ${modelArg} → ${MODEL_ID} [${ENDPOINT}]`)

  // プロンプト構築
  const hasImage = !!question.image_url
  const prompt = hasImage
    ? buildImageQuestionPrompt(question)
    : buildTextOnlyPrompt(question)

  // 元画像をbase64で読み込み（ある場合）
  let questionImageB64: string | undefined
  if (hasImage && question.image_url) {
    const imgPath = path.join(PROJECT_ROOT, 'public', question.image_url)
    if (fs.existsSync(imgPath)) {
      questionImageB64 = fs.readFileSync(imgPath).toString('base64')
      console.log(`元画像: ${imgPath} (${Math.round(fs.statSync(imgPath).size / 1024)}KB)`)
    } else {
      console.warn(`⚠️ 元画像が見つかりません: ${imgPath}`)
    }
  }

  // API呼び出し
  const result = await generateImage(prompt, questionImageB64)

  if (!result) {
    console.error('\n❌ 画像生成に失敗しました')
    process.exit(1)
  }

  // 結果保存
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
  const baseName = `${question.id}_${modelArg}_${timestamp}`

  if (result.text) {
    const textPath = path.join(OUTPUT_DIR, `${baseName}.txt`)
    fs.writeFileSync(textPath, result.text, 'utf-8')
    console.log(`\n📝 テキスト応答: ${textPath}`)
    console.log(`  内容: ${result.text.substring(0, 200)}`)
  }

  if (result.imageBase64) {
    const imgPath = path.join(OUTPUT_DIR, `${baseName}.png`)
    fs.writeFileSync(imgPath, Buffer.from(result.imageBase64, 'base64'))
    const sizeKB = Math.round(fs.statSync(imgPath).size / 1024)
    console.log(`\n🖼️  生成画像: ${imgPath} (${sizeKB}KB)`)
    console.log(`\n✅ 成功！ open "${imgPath}" で確認できます`)
  } else {
    console.log('\n⚠️ 画像は生成されませんでした（テキスト応答のみ）')
  }

  const promptPath = path.join(OUTPUT_DIR, `${baseName}_prompt.txt`)
  fs.writeFileSync(promptPath, prompt, 'utf-8')
  console.log(`📋 プロンプト: ${promptPath}`)
}

main().catch(console.error)
