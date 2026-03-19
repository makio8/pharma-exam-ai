/** Protected line pattern — lines ending with these are NEVER removed */
function isProtectedLine(line: string): boolean {
  const trimmed = line.trim()
  return /(?:はどれか|を選べ|つ選べ|選びなさい)[。．.]?\s*$/.test(trimmed)
}

/** Chemical formula garbage: 5+ consecutive 1-2 char tokens on a line */
function isChemicalGarbage(line: string): boolean {
  const tokens = line.trim().split(/\s+/)
  if (tokens.length < 5) return false
  const shortTokens = tokens.filter(t => t.length <= 2)
  return shortTokens.length >= 5
}

/** Numeric table: line of 3+ space-separated numbers */
function isNumericTable(line: string): boolean {
  return /^\s*[\d.]+(\s+[\d.]+){2,}\s*$/.test(line)
}

/** Bare choice number (1-5) alone on a line */
function isBareChoiceNumber(line: string): boolean {
  return /^\s*[1-5]\s*$/.test(line)
}

/** Fraction pattern: "× 100" with surrounding numbers only */
function isFractionPattern(line: string): boolean {
  return /\d+\s*[×x]\s*100/.test(line) && /^\s*[\d\s.×x/]+\s*$/.test(line.trim())
}

export function cleanQuestionText(text: string): string {
  const lines = text.split('\n')
  const cleaned = lines.filter(line => {
    if (isProtectedLine(line)) return true
    if (isChemicalGarbage(line)) return false
    if (isNumericTable(line)) return false
    if (isBareChoiceNumber(line)) return false
    if (isFractionPattern(line)) return false
    return true
  })
  return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}
