/**
 * 個別切り抜き付箋のOCRコアロジック（テスト可能な純粋関数群）
 *
 * crop-manifest.json を入力に、個別画像をGemini Vision APIで読み取り
 * bbox検出不要（すでに人間がアノテーション済み）→ テキスト読み取りに集中
 */
import type { CropNote } from './crop-annotation-core'

// --- Types ---

/** Gemini APIから返るJSON（1枚の付箋分） */
export interface GeminiNoteResult {
  title: string
  body: string
  subject: string
  note_type: string
  tags: string[]
}

/** OCR結果1件（CropNote + Gemini読み取り結果） */
export interface CropOcrNote {
  pageId: string
  spreadPage: number
  side: 'left' | 'right'
  noteIndex: number
  bbox: [number, number, number, number]
  imageFile: string
  // OCR結果
  title: string
  body: string
  subject: string
  noteType: string
  tags: string[]
}

/** crop-ocr-results.json 全体 */
export interface CropOcrOutput {
  version: '1.0.0'
  source: string
  ocrModel: string
  processedAt: string
  totalNotes: number
  results: CropOcrNote[]
}

// --- Prompt ---

/** 個別付箋画像用のOCRプロンプト（bbox不要、テキスト読み取り特化） */
export const SINGLE_NOTE_PROMPT = `あなたは薬学の専門家です。この画像は薬剤師国家試験の学習ノートから切り出した1枚の手書き付箋です。

内容を正確に読み取り、以下のJSON形式で出力してください。

■ note_type の分類基準:
- "knowledge": 知識の整理・定義・分類（「〇〇とは」「〇〇の定義」）
- "mnemonic": 語呂合わせ・覚え方・暗記法・単位換算の早見表
- "solution": 解法・計算手順・考え方のフロー
- "caution": 注意点・ひっかけ・間違いやすいポイント
- "related": 比較表・まとめ・対比

■ タイトルのルール:
- 赤字の見出しがあればそれをタイトルにする
- なければ内容を10文字以内で要約

■ 分類の追加ルール（迷ったらこちらを優先）:
- 「〇〇 = △△」変換・換算 → "mnemonic"
- 「ゴロ」「語呂」→ "mnemonic"
- 対数や数値の暗記 → "mnemonic"
- 「〇〇の定義」「〇〇とは」→ "knowledge"
- ①②③の番号リストで複数項目整理 → "related"
- 計算過程・フローチャート → "solution"
- 「注意」「間違いやすい」「禁忌」→ "caution"

出力形式（JSONのみ、説明文不要）:
{"title":"タイトル","body":"本文（改行は\\nで）","subject":"物理|化学|生物|薬理|薬剤|病態・薬物治療|法規・制度・倫理|実務|衛生","note_type":"knowledge|mnemonic|solution|caution|related","tags":["タグ1","タグ2"]}

注意:
- 手書き文字を可能な限り正確に読み取る
- 薬学・化学の専門用語は正確に
- 読み取れない部分は [不明] と記載
- JSONのみ出力`

// --- Functions ---

/**
 * Gemini APIレスポンスのテキストからJSONをパース
 * @returns パース結果 or null（失敗時）
 */
export function parseGeminiResponse(text: string): GeminiNoteResult | null {
  if (!text) return null
  try {
    // {} で囲まれたJSON部分を抽出（配列ではなくオブジェクト）
    const objMatch = text.match(/\{[\s\S]*\}/)
    if (objMatch) return JSON.parse(objMatch[0])
    return null
  } catch {
    return null
  }
}

/**
 * CropNote + GeminiNoteResult → CropOcrNote に合成
 */
export function mergeNoteResult(
  crop: CropNote,
  ocr: GeminiNoteResult,
): CropOcrNote {
  return {
    pageId: crop.pageId,
    spreadPage: crop.spreadPage,
    side: crop.side,
    noteIndex: crop.noteIndex,
    bbox: crop.bbox,
    imageFile: crop.imageFile,
    title: ocr.title || '(無題)',
    body: ocr.body || '',
    subject: ocr.subject || '物理',
    noteType: ocr.note_type || 'knowledge',
    tags: ocr.tags || [],
  }
}

/**
 * 未処理のnoteをフィルタ（resume用）
 */
export function filterUnprocessed(
  manifest: CropNote[],
  existing: CropOcrNote[],
): CropNote[] {
  const processed = new Set(
    existing.map(r => `${r.pageId}:${r.noteIndex}`)
  )
  return manifest.filter(n => !processed.has(`${n.pageId}:${n.noteIndex}`))
}
