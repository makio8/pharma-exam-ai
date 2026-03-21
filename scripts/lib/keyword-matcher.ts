/**
 * キーワード抽出・類似度計算（セクション3: マッピング漏れ検出用）
 */

const STOP_PHRASES = [
  '説明できる', '列挙できる', '理解できる', '記述できる',
  '分類できる', '定義することができる', '識別することができる',
  '概要を', '概説できる', '例を挙げて',
  'について', 'に関して', 'における', 'に対する',
  'の種類', 'の役割', 'の関係', 'の概要',
  'および', '及び', 'ならびに', 'また',
  'と', 'の', 'を', 'が', 'に', 'は', 'で', 'から', 'まで', 'へ',
]

export function extractKeywords(text: string): string[] {
  if (text.length < 10) return []

  let cleaned = text
  const sortedPhrases = [...STOP_PHRASES].sort((a, b) => b.length - a.length)
  for (const phrase of sortedPhrases) {
    cleaned = cleaned.replaceAll(phrase, ' ')
  }

  const tokens = cleaned
    .split(/[。、．，（）()「」\s]+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2)

  return [...new Set(tokens)]
}

interface SimilarityResult {
  score: number
  matchedKeywords: string[]
}

export function calculateSimilarity(
  exemplarKeywords: string[],
  questionText: string,
  explanation: string,
  questionConcepts: string[],
  semanticLabels: string[],
): SimilarityResult {
  if (exemplarKeywords.length === 0) return { score: 0, matchedKeywords: [] }

  const matchedKeywords: string[] = []
  let weightedScore = 0

  const textFields = [questionText, explanation, ...semanticLabels].join(' ')

  for (const keyword of exemplarKeywords) {
    let matched = false
    let conceptMatch = false

    if (questionConcepts.some(c => c.includes(keyword) || keyword.includes(c))) {
      conceptMatch = true
      matched = true
    }

    if (textFields.includes(keyword)) {
      matched = true
    }

    if (matched) {
      matchedKeywords.push(keyword)
      weightedScore += conceptMatch ? 2 : 1
    }
  }

  // 分母はキーワード総数（スペック通り）。concepts 2倍加算で1.0を超えうるので Math.min でクリップ
  const rawScore = weightedScore / exemplarKeywords.length
  const score = Math.min(Math.round(rawScore * 100) / 100, 1.0)

  return { score, matchedKeywords }
}
