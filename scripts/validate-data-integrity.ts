/**
 * データ整合性チェッカー
 * 全スクリプト実行前に呼ぶ。1つでも失敗したらprocess.exit(1)
 *
 * Usage: npx tsx scripts/validate-data-integrity.ts
 */
import { EXEMPLARS } from '../src/data/exemplars'
import { QUESTION_EXEMPLAR_MAP } from '../src/data/question-exemplar-map'
import { ALL_QUESTIONS } from '../src/data/all-questions'

interface ValidationResult {
  name: string
  passed: boolean
  message: string
}

function validate(): ValidationResult[] {
  const results: ValidationResult[] = []
  const exemplarIds = new Set(EXEMPLARS.map(e => e.id))

  // Check 1: 各 questionId に primary がちょうど1件
  const primaryByQuestion = new Map<string, number>()
  for (const m of QUESTION_EXEMPLAR_MAP) {
    if (m.isPrimary) {
      primaryByQuestion.set(m.questionId, (primaryByQuestion.get(m.questionId) || 0) + 1)
    }
  }
  const multiPrimary = [...primaryByQuestion.entries()].filter(([, count]) => count !== 1)
  results.push({
    name: 'primary唯一性',
    passed: multiPrimary.length === 0,
    message: multiPrimary.length === 0
      ? `全問題でprimaryが1件ずつ`
      : `${multiPrimary.length}問でprimary数が異常: ${multiPrimary.slice(0, 5).map(([q, c]) => `${q}=${c}`).join(', ')}`,
  })

  // Check 2: 参照先 exemplarId が存在する
  const missingExemplars = [...new Set(QUESTION_EXEMPLAR_MAP.map(m => m.exemplarId))].filter(id => !exemplarIds.has(id))
  results.push({
    name: 'exemplar参照整合性',
    passed: missingExemplars.length === 0,
    message: missingExemplars.length === 0
      ? `全マッピングの参照先が存在`
      : `${missingExemplars.length}件の不明exemplar: ${missingExemplars.slice(0, 5).join(', ')}`,
  })

  // Check 3: (questionId, exemplarId) の重複なし
  const pairSet = new Set<string>()
  let duplicates = 0
  for (const m of QUESTION_EXEMPLAR_MAP) {
    const key = `${m.questionId}|${m.exemplarId}`
    if (pairSet.has(key)) duplicates++
    pairSet.add(key)
  }
  results.push({
    name: 'マッピング重複なし',
    passed: duplicates === 0,
    message: duplicates === 0
      ? `重複なし（${QUESTION_EXEMPLAR_MAP.length}件）`
      : `${duplicates}件の重複あり`,
  })

  // Check 4: questionId が ALL_QUESTIONS に存在する
  const allQuestionIds = new Set(ALL_QUESTIONS.map(q => q.id))
  const missingQuestions = [...new Set(QUESTION_EXEMPLAR_MAP.map(m => m.questionId))].filter(id => !allQuestionIds.has(id))
  results.push({
    name: 'questionId参照整合性',
    passed: missingQuestions.length === 0,
    message: missingQuestions.length === 0
      ? `全マッピングのquestionIdが存在`
      : `${missingQuestions.length}件の不明questionId: ${missingQuestions.slice(0, 5).join(', ')}`,
  })

  // Check 5: 基本数量レポート
  // TODO: 2回目以降は前回の数量と比較し ±10% 以内であることを検証する
  //       scripts/output/.last-validation.json に前回値を保存する方式を検討
  const usedExemplars = new Set(QUESTION_EXEMPLAR_MAP.map(m => m.exemplarId))
  const unusedCount = EXEMPLARS.length - usedExemplars.size
  results.push({
    name: '数量レポート',
    passed: true,
    message: `例示${EXEMPLARS.length}件, マッピング${QUESTION_EXEMPLAR_MAP.length}件, 未使用${unusedCount}件`,
  })

  return results
}

// メイン実行
const results = validate()
let hasError = false

for (const r of results) {
  const icon = r.passed ? '✅' : '❌'
  console.log(`${icon} ${r.name}: ${r.message}`)
  if (!r.passed) hasError = true
}

if (hasError) {
  console.error('\n❌ データ整合性チェックに失敗しました')
  process.exit(1)
} else {
  console.log('\n✅ 全チェック通過')
}
