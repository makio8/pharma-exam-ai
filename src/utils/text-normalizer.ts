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
