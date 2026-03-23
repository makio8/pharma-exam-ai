import type { Exemplar, QuestionExemplarMapping, ExemplarStats } from '../../src/types/blueprint'
import type { Question } from '../../src/types/question'

type QuestionLike = Pick<Question, 'id' | 'year' | 'linked_group'>

/**
 * 全例示の出題統計を計算する（純粋関数）
 * - マッピングを1パスでMapに構築
 * - 連問(linked_group)をユニークケースとしてカウント
 */
export function computeExemplarStats(
  exemplars: Exemplar[],
  mappings: QuestionExemplarMapping[],
  questions: QuestionLike[],
): ExemplarStats[] {
  // 1. questionId → Question のMap
  const questionMap = new Map<string, QuestionLike>()
  for (const q of questions) {
    questionMap.set(q.id, q)
  }

  // 2. exemplarId → mappings[] のMap（1パス）
  const mappingsByExemplar = new Map<string, QuestionExemplarMapping[]>()
  for (const m of mappings) {
    const list = mappingsByExemplar.get(m.exemplarId)
    if (list) {
      list.push(m)
    } else {
      mappingsByExemplar.set(m.exemplarId, [m])
    }
  }

  // 3. 各例示の統計を計算
  return exemplars.map((exemplar) => {
    const myMappings = mappingsByExemplar.get(exemplar.id) || []

    if (myMappings.length === 0) {
      return {
        exemplarId: exemplar.id,
        subject: exemplar.subject,
        yearsAppeared: 0,
        totalQuestions: 0,
        yearDetails: [],
        primaryQuestions: 0,
        secondaryQuestions: 0,
        primaryYearsAppeared: 0,
        linkedGroupCount: 0,
        avgQuestionsPerYear: 0,
      }
    }

    let primaryQuestions = 0
    let secondaryQuestions = 0
    const primaryYears = new Set<number>()
    const yearCounts = new Map<number, number>()
    const linkedKeys = new Set<string>()
    let unresolvedCount = 0
    const unresolvedIds: string[] = []

    for (const m of myMappings) {
      if (m.isPrimary) {
        primaryQuestions++
      } else {
        secondaryQuestions++
      }

      const q = questionMap.get(m.questionId)
      if (!q) {
        unresolvedCount++
        if (unresolvedIds.length < 5) unresolvedIds.push(m.questionId)
        continue
      }

      yearCounts.set(q.year, (yearCounts.get(q.year) || 0) + 1)

      if (m.isPrimary) {
        primaryYears.add(q.year)
      }

      const linkedKey = q.linked_group
        ? `${q.year}-${q.linked_group}`
        : q.id
      linkedKeys.add(linkedKey)
    }

    if (unresolvedCount > 0) {
      console.warn(
        `⚠️ ${unresolvedCount}件のquestionIdが問題データに見つかりませんでした (exemplar: ${exemplar.id}): ${unresolvedIds.join(', ')}`,
      )
    }

    const yearDetails = Array.from(yearCounts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year)

    const totalQuestions = primaryQuestions + secondaryQuestions
    const yearsAppeared = yearCounts.size

    return {
      exemplarId: exemplar.id,
      subject: exemplar.subject,
      yearsAppeared,
      totalQuestions,
      yearDetails,
      primaryQuestions,
      secondaryQuestions,
      primaryYearsAppeared: primaryYears.size,
      linkedGroupCount: linkedKeys.size,
      avgQuestionsPerYear: yearsAppeared > 0 ? Math.round((totalQuestions / yearsAppeared) * 100) / 100 : 0,
    }
  })
}
