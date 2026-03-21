/**
 * 複数選択問題かどうかを判定する
 * correct_answerが配列、または問題文に「2つ選べ」等を含む場合true
 */
export function isMultiAnswer(question: { question_text: string; correct_answer: number | number[] }): boolean {
  if (Array.isArray(question.correct_answer)) return true
  return /[2-9２-９二三四五][つ]選べ/.test(question.question_text)
}

/**
 * 「Nつ選べ」のNを取得する（デフォルト1）
 */
export function getRequiredSelections(questionText: string): number {
  const match = questionText.match(/([2-9２-９二三四五])[つ]選べ/)
  if (!match) return 1
  const num = match[1]
  const kanjiMap: Record<string, number> = { '二': 2, '三': 3, '四': 4, '五': 5 }
  if (kanjiMap[num]) return kanjiMap[num]
  const halfWidth = num.replace(/[２-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
  return parseInt(halfWidth) || 2
}

/**
 * 正解判定（単一選択・複数選択の両方に対応）
 */
export function isCorrectAnswer(
  correctAnswer: number | number[],
  selected: number | number[]
): boolean {
  if (Array.isArray(correctAnswer)) {
    if (!Array.isArray(selected)) return false
    const a = [...correctAnswer].sort()
    const b = [...selected].sort()
    return a.length === b.length && a.every((v, i) => v === b[i])
  }
  return correctAnswer === selected
}

/**
 * 正解を表示用文字列に変換
 */
export function formatCorrectAnswer(correctAnswer: number | number[]): string {
  if (Array.isArray(correctAnswer)) return correctAnswer.join(', ')
  return String(correctAnswer)
}

/**
 * correct_answerが配列の場合に特定のkeyが正解に含まれるかチェック
 */
export function isCorrectKey(correctAnswer: number | number[], key: number): boolean {
  if (Array.isArray(correctAnswer)) return correctAnswer.includes(key)
  return correctAnswer === key
}
