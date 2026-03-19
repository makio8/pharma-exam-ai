/**
 * Gemini Vision API を使ったクロップフォールバック（スタブ）
 *
 * 注意: GEMINI_API_KEY が設定されていないため、このスクリプトは動作しません。
 * 代わりに fix-failed-images.ts を使用してください。
 *
 * npx tsx scripts/gemini-crop-fallback.ts
 */

import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.error('エラー: GEMINI_API_KEY が設定されていません。')
    console.error()
    console.error('このスクリプトは Gemini Vision API を使って失敗した問題画像を')
    console.error('自動修正することを意図していましたが、APIキーが未設定のため動作しません。')
    console.error()
    console.error('代わりに以下のスクリプトを使用してください:')
    console.error('  npx tsx scripts/fix-failed-images.ts')
    console.error()
    console.error('fix-failed-images.ts は2種類の失敗に対応しています:')
    console.error('  - cover_page: PDFの全ページをスキャンして正しいページを見つける')
    console.error('  - q_not_in_crop: より広いマージンで再クロップする')
    process.exit(1)
  }

  console.log('GEMINI_API_KEY は設定されていますが、このスクリプトはまだ実装されていません。')
  console.log('fix-failed-images.ts を使用してください。')
  process.exit(1)
}

main().catch(console.error)
