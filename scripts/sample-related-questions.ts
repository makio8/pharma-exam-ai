// 10問ランダムサンプリング + 類似問題ロジック品質検証
import { ALL_QUESTIONS } from '../src/data/all-questions'
import { QUESTION_EXEMPLAR_MAP } from '../src/data/question-exemplar-map'
import { OFFICIAL_NOTES } from '../src/data/official-notes'
import { FLASHCARD_TEMPLATES } from '../src/data/flashcard-templates'
import { QUESTION_TOPIC_MAP } from '../src/data/question-topic-map'
import { LearningLinkService } from '../src/utils/learning-link-service'

const service = new LearningLinkService(QUESTION_EXEMPLAR_MAP, OFFICIAL_NOTES, FLASHCARD_TEMPLATES)

// 再現可能なシード乱数
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

const rand = seededRandom(20260331)
const shuffled = [...ALL_QUESTIONS].sort(() => rand() - 0.5)
const sampled = shuffled.slice(0, 10)

const getYear = (qId: string) => parseInt(qId.match(/^r(\d+)/)?.[1] ?? '0', 10)

function computeRelated(qId: string) {
  const topicId = QUESTION_TOPIC_MAP[qId]
  const topicFallback = topicId
    ? Object.entries(QUESTION_TOPIC_MAP)
        .filter(([id, tid]) => tid === topicId && id !== qId)
        .map(([id]) => id)
        .sort((a, b) => getYear(b) - getYear(a))
    : []
  const exemplarMatched = service.getRelatedQuestions(qId, [], 10)
  const seen = new Set([qId, ...exemplarMatched])
  const remaining = Math.max(0, 10 - exemplarMatched.length)
  const fallback = topicFallback.filter(id => !seen.has(id)).slice(0, remaining)
  return { topicId, exemplarMatched, fallback, topicFallback }
}

console.log('=== 類似問題ロジック品質レビュー（10問サンプル）===\n')

for (const q of sampled) {
  const { topicId, exemplarMatched, fallback, topicFallback } = computeRelated(q.id)
  const fallbackYears = fallback.slice(0, 3).map(getYear)
  const isDesc = fallbackYears.every((y, i, arr) => i === 0 || arr[i-1] >= y)

  console.log(`【${q.id}】${q.subject} ${q.section} — ${q.question_text.slice(0, 40)}…`)
  console.log(`  topicId: ${topicId ?? '(なし)'}`)
  console.log(`  exemplar一致: ${exemplarMatched.length}問 → [${exemplarMatched.slice(0, 4).join(', ')}${exemplarMatched.length > 4 ? '...' : ''}]`)
  console.log(`  topic補完:    ${fallback.length}問 → [${fallback.slice(0, 4).join(', ')}${fallback.length > 4 ? '...' : ''}]`)
  console.log(`  補完年度TOP3: [${fallback.slice(0, 3).map(id => `${id}(${getYear(id)}回)`).join(', ')}] ${fallback.length > 0 ? (isDesc ? '✅降順OK' : '❌降順NG') : ''}`)
  console.log()
}

// 全問統計（500問）
let exemplarOnly = 0, fallbackOnly = 0, mixed = 0, empty = 0, yearViolations = 0
for (const q of ALL_QUESTIONS.slice(0, 500)) {
  const { exemplarMatched, fallback } = computeRelated(q.id)
  const total = exemplarMatched.length + fallback.length
  if (total === 0) empty++
  else if (exemplarMatched.length === 0) fallbackOnly++
  else if (fallback.length === 0) exemplarOnly++
  else mixed++
  const years = fallback.map(getYear)
  for (let i = 1; i < years.length; i++) {
    if (years[i] > years[i-1]) { yearViolations++; break }
  }
}
console.log('=== 500問の統計サマリー ===')
console.log(`  exemplar一致のみ: ${exemplarOnly}問`)
console.log(`  topic補完のみ:    ${fallbackOnly}問`)
console.log(`  混在（両方あり）: ${mixed}問`)
console.log(`  類似問題なし:     ${empty}問`)
console.log(`  補完年度降順違反: ${yearViolations}問`)
