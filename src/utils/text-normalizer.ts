/**
 * 表示用テキスト正規化（元データは変更しない）
 * question_textをそのまま表示するとPDF抽出由来の崩れがあるため、
 * 表示時のみ正規化する。
 */
export function normalizeForDisplay(text: string): string {
  return text
    .replace(/\\n/g, '\n')           // リテラル\nを実際の改行に
    .replace(/\n{3,}/g, '\n\n')      // 3つ以上の連続改行を2つに
    .replace(/[ 　]{3,}/g, ' ')      // 3文字以上の連続空白を1つに（半角・全角両対応）
    .trim()
}

/**
 * 問題にビジュアルコンテンツ（数式・構造式・グラフ等）が含まれるか判定
 */
export function hasVisualContent(question: { visual_content_type?: string; image_url?: string }): boolean {
  if (!question.visual_content_type) return false
  return question.visual_content_type !== 'text_only'
}
