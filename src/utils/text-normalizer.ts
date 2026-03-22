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
  question_text?: string
  choices: { key: number; text: string }[]
  display_mode_override?: 'text' | 'image' | 'both'
}): 'text' | 'image' | 'both' {
  // 問題ごとの上書き設定（実機確認に基づく手動指定）が最優先
  if (question.display_mode_override) return question.display_mode_override

  // 画像がなければテキストのみ
  if (!question.image_url) return 'text'

  // choices空 or 全選択肢テキスト空の画像問題 → 画像のみ（数字ボタンUI）
  // ただしquestion_textに実質的な内容がある場合はbothにフォールバック（GPT-5.4指摘: 本文ロス防止）
  const choicesEmpty = question.choices.length === 0
    || question.choices.every(c => c.text.trim() === '')  // trim()でOCR由来の空白も検出
  if (choicesEmpty) {
    const hasSubstantialText = (question.question_text?.trim().length ?? 0) > 30
    return hasSubstantialText ? 'both' : 'image'
  }

  // visual_content_typeがtext_only → テキストのみ（画像は表示不要）
  if (question.visual_content_type === 'text_only') {
    return 'text'
  }

  // image_urlがあり、VCTが非テキスト or 未設定 → テキスト+画像の両方表示
  // （VCT未設定でもimage_urlがある以上、画像を表示すべき）
  return 'both'
}
