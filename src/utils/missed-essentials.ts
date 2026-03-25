// src/utils/missed-essentials.ts
import type { Question, AnswerHistory } from '../types/question'

/**
 * 「必須問題なのに最新回答が不正解」の問題を抽出
 * - section === '必須' の問題のみ対象
 * - 同一問題に複数回答がある場合、最新の回答で判定
 * - 問番号昇順でソート、最大20件
 */
export function computeMissedEssentials(
  history: AnswerHistory[],
  allQuestions: Question[],
): (Question & { incorrectCount: number })[] {
  // 回答を日時降順（新しい順）にソート
  const sorted = [...history].sort(
    (a, b) => new Date(b.answered_at).getTime() - new Date(a.answered_at).getTime(),
  )

  // 各問題の最新回答だけを保持する Map
  const latestByQuestion = new Map<string, AnswerHistory>()
  for (const h of sorted) {
    if (!latestByQuestion.has(h.question_id)) {
      latestByQuestion.set(h.question_id, h)
    }
  }

  return allQuestions
    .filter((q) => {
      if (q.section !== '必須') return false
      const latest = latestByQuestion.get(q.id)
      return latest != null && !latest.is_correct
    })
    .sort((a, b) => a.question_number - b.question_number)
    .slice(0, 20)
    .map((q) => ({ ...q, incorrectCount: 1 }))
}
