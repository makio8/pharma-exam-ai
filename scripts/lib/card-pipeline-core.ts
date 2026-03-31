/**
 * カード生成パイプライン コアロジック
 *
 * exemplar のフィルタリング・集約・プロンプト整形を行う純粋関数群。
 * 外部副作用なし — テスト容易性を最優先に設計。
 */

import type { ExemplarStats, Exemplar, QuestionExemplarMapping } from '../../src/types/blueprint'
import type { Question } from '../../src/types/question'
import type { OfficialNote } from '../../src/types/official-note'
import type {
  FrequencyTier,
  ExemplarContext,
  QuestionSummary,
  NoteSummary,
} from './card-pipeline-types'
import { TIER_CONFIG } from './card-pipeline-types'

// ──────────────────────────────────────────────
// 型（filterTargetExemplars の戻り値）
// ──────────────────────────────────────────────

/** フィルタ結果の1行 */
export interface FilteredExemplar {
  exemplarId: string
  subject: string
  yearsAppeared: number
  tier: FrequencyTier
  maxAtoms: number
}

// ──────────────────────────────────────────────
// classifyTier
// ──────────────────────────────────────────────

/**
 * 出題年度数からティア（頻度グループ）を判定する。
 * 0-1年は対象外（null）。
 */
export function classifyTier(yearsAppeared: number): FrequencyTier | null {
  for (const [tier, config] of Object.entries(TIER_CONFIG) as [FrequencyTier, typeof TIER_CONFIG[FrequencyTier]][]) {
    if (yearsAppeared >= config.minYears && yearsAppeared <= config.maxYears) {
      return tier
    }
  }
  return null
}

// ──────────────────────────────────────────────
// filterTargetExemplars
// ──────────────────────────────────────────────

interface FilterOptions {
  minYears?: number
}

/**
 * ExemplarStats 配列から、指定年度数以上の exemplar をフィルタし、
 * tier と maxAtoms を付与して返す。
 *
 * @param stats - 全 exemplar の出題統計
 * @param options - minYears: 最低出題年度数（デフォルト 4）
 */
export function filterTargetExemplars(
  stats: ExemplarStats[],
  options?: FilterOptions,
): FilteredExemplar[] {
  const minYears = options?.minYears ?? 4

  const results: FilteredExemplar[] = []

  for (const s of stats) {
    if (s.yearsAppeared < minYears) continue

    const tier = classifyTier(s.yearsAppeared)
    if (!tier) continue

    const config = TIER_CONFIG[tier]
    results.push({
      exemplarId: s.exemplarId,
      subject: s.subject,
      yearsAppeared: s.yearsAppeared,
      tier,
      maxAtoms: config.maxAtoms,
    })
  }

  return results
}

// ──────────────────────────────────────────────
// buildExemplarContext
// ──────────────────────────────────────────────

/**
 * 1 つの exemplar に紐づく過去問・付箋を集約し、
 * Claude API に送信するコンテキストを構築する。
 */
export function buildExemplarContext(
  exemplarId: string,
  tier: FrequencyTier,
  maxAtoms: number,
  exemplars: Exemplar[],
  mappings: QuestionExemplarMapping[],
  questions: Question[],
  notes: OfficialNote[],
): ExemplarContext {
  // exemplar 本体を探す
  const exemplar = exemplars.find(e => e.id === exemplarId)
  if (!exemplar) {
    throw new Error(`Exemplar not found: ${exemplarId}`)
  }
  const exemplarText = exemplar.text
  const subject = exemplar.subject

  // マッピング経由で問題を収集
  const questionMap = new Map<string, Question>()
  for (const q of questions) {
    questionMap.set(q.id, q)
  }

  const relatedMappings = mappings.filter(m => m.exemplarId === exemplarId)

  const questionSummaries: QuestionSummary[] = []
  for (const m of relatedMappings) {
    const q = questionMap.get(m.questionId)
    if (!q) continue
    questionSummaries.push({
      id: q.id,
      year: q.year,
      questionText: q.question_text,
      choices: q.choices.map(c => `${c.key}. ${c.text}`),
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
      isPrimary: m.isPrimary,
    })
  }

  // 年度順にソート
  questionSummaries.sort((a, b) => a.year - b.year)

  // 付箋を収集（primaryExemplarIds または secondaryExemplarIds に含まれるもの）
  const noteSummaries: NoteSummary[] = []
  for (const note of notes) {
    const isPrimary = note.primaryExemplarIds.includes(exemplarId)
    const isSecondary = note.secondaryExemplarIds.includes(exemplarId)
    if (!isPrimary && !isSecondary) continue

    noteSummaries.push({
      id: note.id,
      title: note.title,
      textSummary: note.textSummary,
      noteType: note.noteType,
    })
  }

  return {
    exemplarId,
    subject,
    exemplarText,
    tier,
    maxAtoms,
    questions: questionSummaries,
    notes: noteSummaries,
  }
}

// ──────────────────────────────────────────────
// formatContextForPrompt
// ──────────────────────────────────────────────

/**
 * ExemplarContext をマークダウン形式に整形する。
 * Claude API のプロンプトに埋め込む用途。
 */
export function formatContextForPrompt(ctx: ExemplarContext): string {
  const lines: string[] = []

  // ヘッダー
  lines.push(`## Exemplar: ${ctx.exemplarId}`)
  lines.push(`- 科目: ${ctx.subject}`)
  lines.push(`- ティア: ${ctx.tier}`)
  lines.push(`- 最大アトム数: ${ctx.maxAtoms}`)
  lines.push(`- テキスト: ${ctx.exemplarText}`)
  lines.push('')

  // 過去問セクション（0件ならスキップ）
  if (ctx.questions.length > 0) {
    lines.push('### 過去問')
    lines.push('')
    for (const q of ctx.questions) {
      lines.push(`#### 第${q.year}回 (${q.id})${q.isPrimary ? '' : ' [secondary]'}`)
      lines.push(q.questionText)
      lines.push('')
      for (const c of q.choices) {
        lines.push(c)
      }
      lines.push('')
      lines.push(`正解: ${Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}`)
      lines.push(`解説: ${q.explanation}`)
      lines.push('')
    }
  }

  // 付箋セクション（0件ならスキップ）
  if (ctx.notes.length > 0) {
    lines.push('### 付箋メモ')
    lines.push('')
    for (const n of ctx.notes) {
      lines.push(`- **${n.title}**: ${n.textSummary}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
