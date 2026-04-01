export interface ClozeBlank { index: number; answer: string }
export interface ClozeResult {
  frontHtml: string   // 穴あきテキスト（表面用）。HTMLエスケープ済み
  backHtml: string    // 答えハイライト（裏面用）。HTMLエスケープ済み
  blanks: ClozeBlank[]
  hasError: boolean
}

const CLOZE_PATTERN = /\{\{c(\d+)::((?:(?!\{\{).)+?)\}\}/g

/**
 * HTMLエスケープ: XSSサニタイズ用
 * &, <, >, " をHTMLエンティティに変換
 */
export function sanitizeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * ネストされたcloze記法を検出する
 * 例: {{c1::A{{c2::B}}}} → true
 */
function hasNestedCloze(text: string): boolean {
  // {{cN:: が含まれる answer 部分があればネスト
  return /\{\{c\d+::[^}]*\{\{/.test(text)
}

/**
 * 空のclozeを検出する
 * 例: {{c1::}} → true
 */
function hasEmptyCloze(text: string): boolean {
  return /\{\{c\d+::\}\}/.test(text)
}

/**
 * Cloze記法テキストをパースする
 *
 * - c1のみ [____] に置換（表面）
 * - c2以降はテキスト表示（タグ除去）
 * - 裏面: c1を **答え** でマーク
 * - XSSサニタイズ必須（answer内の特殊文字をエスケープ）
 * - ネスト・空cloze → hasError=true, raw text返却
 */
export function parseCloze(text: string): ClozeResult {
  // ネストチェック
  if (hasNestedCloze(text)) {
    return {
      frontHtml: sanitizeHtml(text),
      backHtml: sanitizeHtml(text),
      blanks: [],
      hasError: true,
    }
  }

  // 空clozeチェック
  if (hasEmptyCloze(text)) {
    return {
      frontHtml: sanitizeHtml(text),
      backHtml: sanitizeHtml(text),
      blanks: [],
      hasError: true,
    }
  }

  // clozeが1つも無い場合
  if (!CLOZE_PATTERN.test(text)) {
    return {
      frontHtml: sanitizeHtml(text),
      backHtml: sanitizeHtml(text),
      blanks: [],
      hasError: false,
    }
  }

  // パターンをリセット（グローバルフラグのため）
  CLOZE_PATTERN.lastIndex = 0

  const blanks: ClozeBlank[] = []
  let frontHtml = ''
  let backHtml = ''
  let lastIndex = 0

  let match: RegExpExecArray | null
  while ((match = CLOZE_PATTERN.exec(text)) !== null) {
    const cIndex = parseInt(match[1], 10)
    const answer = match[2]
    const fullMatch = match[0]
    const matchStart = match.index

    // マッチ前のテキスト部分をエスケープして追加
    const before = sanitizeHtml(text.slice(lastIndex, matchStart))
    frontHtml += before
    backHtml += before

    const escapedAnswer = sanitizeHtml(answer)

    if (cIndex === 1) {
      blanks.push({ index: cIndex, answer: escapedAnswer })
      frontHtml += '[____]'
      backHtml += `**${escapedAnswer}**`
    } else {
      // c2以降: タグ除去してテキスト表示
      frontHtml += escapedAnswer
      backHtml += escapedAnswer
    }

    lastIndex = matchStart + fullMatch.length
  }

  // 残りのテキスト
  const tail = sanitizeHtml(text.slice(lastIndex))
  frontHtml += tail
  backHtml += tail

  return {
    frontHtml,
    backHtml,
    blanks,
    hasError: false,
  }
}
