/**
 * 表示用テキスト正規化（元データは変更しない）
 * question_textをそのまま表示するとPDF抽出由来の崩れがあるため、
 * 表示時のみ正規化する。
 */
export function normalizeForDisplay(text: string): string {
  return text
    .replace(/\\n/g, '\n')           // リテラル\nを実際の改行に
    .replace(/\n{3,}/g, '\n\n')      // 3つ以上の連続改行を2つに
    // 注意: 空白の圧縮は行わない（テーブル・グラフ・数式のレイアウトスペースを保持するため）
    .trim()
}

/**
 * 問題にビジュアルコンテンツ（数式・構造式・グラフ等）が含まれるか判定
 */
export function hasVisualContent(question: { visual_content_type?: string; image_url?: string }): boolean {
  if (!question.visual_content_type) return false
  return question.visual_content_type !== 'text_only'
}

/**
 * 問題の表示モードを判定
 * - 'text': テキストのみ表示（通常の問題）
 * - 'image': 画像のみ表示（数式・構造式・グラフ等）
 * - 'both': テキスト+画像の両方表示（テキストはきれいだが画像で補完）
 */
export function getDisplayMode(question: {
  visual_content_type?: string
  image_url?: string
  choices: { key: number; text: string }[]
}): 'text' | 'image' | 'both' {
  // 画像がなければテキストのみ
  if (!question.image_url) return 'text'

  // choices空の画像問題 → 画像のみ（数字ボタンUI）
  if (question.choices.length === 0) return 'image'

  // visual_content_typeが非テキスト → テキスト+画像の両方表示
  // （テキストに問いかけ文があり、画像は図表・構造式等の補足）
  if (question.visual_content_type && question.visual_content_type !== 'text_only') {
    return 'both'
  }

  // それ以外 → テキストのみ（画像はあるが表示不要）
  return 'text'
}
