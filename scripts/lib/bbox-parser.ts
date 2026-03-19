export interface WordBox {
  text: string
  xMin: number
  yMin: number
  xMax: number
  yMax: number
}

export interface PageInfo {
  width: number
  height: number
  words: WordBox[]
}

export interface QuestionPosition {
  questionNumber: number
  yMin: number  // PDF coordinates (points)
}

export const COVER_KEYWORDS = ['注意事項', '指示があるまで開いてはいけません', '解答方法は次のとおり']

/** Parse pdftotext -bbox HTML output to extract word elements */
export function parseBboxPage(html: string): PageInfo {
  // <page width="595.276" height="841.890">
  const pageMatch = html.match(/<page\s+width="([\d.]+)"\s+height="([\d.]+)"/)
  const width = pageMatch ? parseFloat(pageMatch[1]) : 595.276
  const height = pageMatch ? parseFloat(pageMatch[2]) : 841.890

  // <word xMin="62.717" yMin="132.998" xMax="74.764" yMax="145.322">問</word>
  const wordRegex = /<word\s+xMin="([\d.]+)"\s+yMin="([\d.]+)"\s+xMax="([\d.]+)"\s+yMax="([\d.]+)">(.*?)<\/word>/g
  const words: WordBox[] = []
  let m: RegExpExecArray | null
  while ((m = wordRegex.exec(html)) !== null) {
    words.push({
      xMin: parseFloat(m[1]),
      yMin: parseFloat(m[2]),
      xMax: parseFloat(m[3]),
      yMax: parseFloat(m[4]),
      text: m[5],
    })
  }
  return { width, height, words }
}

/** Detect question start positions in a page */
export function findQuestionPositions(page: PageInfo): QuestionPosition[] {
  const positions: QuestionPosition[] = []
  for (let i = 0; i < page.words.length; i++) {
    const w = page.words[i]
    if (w.text !== '問') continue
    // Next word should be a number (1-345) on the same line
    const next = page.words[i + 1]
    if (!next) continue
    const num = parseInt(next.text)
    if (isNaN(num) || num < 1 || num > 345) continue
    if (Math.abs(next.yMin - w.yMin) > 5) continue  // Same line check
    positions.push({ questionNumber: num, yMin: w.yMin })
  }
  return positions
}

/** Check if page is a cover/instruction page */
export function isCoverPage(page: PageInfo): boolean {
  const fullText = page.words.map(w => w.text).join('')
  if (COVER_KEYWORDS.some(kw => fullText.includes(kw))) return true
  const positions = findQuestionPositions(page)
  if (positions.length >= 10) return true
  return false
}
