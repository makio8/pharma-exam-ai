// scripts/lib/card-validator.ts
// 生成カードバリデーター — KnowledgeAtom / KnowledgeAtomCard の品質チェック13ルール

import type { KnowledgeAtom, KnowledgeAtomCard } from '../../src/types/knowledge-atom'

// --- 型定義 ---

export interface ValidationError {
  code: string
  message: string
  atomId: string
  cardIndex?: number  // カードレベルのエラー時のみ設定
  severity: 'error' | 'warning'
}

export interface ValidationSummary {
  total: number
  withErrors: number
  errorCount: number
  warningCount: number
}

export interface ValidationResult {
  errors: ValidationError[]
  summary: ValidationSummary
}

// --- 定数 ---

/** atom ID パターン: ex-{何か}-{knowledge_type}-{3桁数字} */
const ATOM_ID_PATTERN = /^ex-.+-[a-z_]+-\d{3}$/

/** cloze プレースホルダーパターン: {{c1::テキスト}} */
const CLOZE_PATTERN = /\{\{c\d+::[^}]+\}\}/

const FRONT_MAX_LENGTH = 200
const BACK_MAX_LENGTH = 500

/** 有効な knowledge_type 値 */
const VALID_KNOWLEDGE_TYPES = ['mechanism', 'classification', 'adverse_effect', 'pharmacokinetics', 'interaction', 'indication', 'contraindication', 'structure', 'calculation', 'regulation', 'mnemonic'] as const

/** 有効な CardFormat 値 */
const VALID_CARD_FORMATS = ['term_definition', 'question_answer', 'mnemonic', 'cloze', 'comparison', 'structural_identification', 'structural_features', 'structural_pattern', 'structure_activity', 'structural_comparison'] as const

/** 有効な difficulty_tier 値 */
const VALID_DIFFICULTY_TIERS = ['basic', 'applied', 'integrated'] as const

// --- カードレベルのバリデーション ---

export function validateCard(card: KnowledgeAtomCard, atomId: string, cardIndex?: number): ValidationError[] {
  const errors: ValidationError[] = []

  const base = { atomId, cardIndex }

  // INVALID_FRONT_TYPE / EMPTY_FRONT
  if (typeof card.front !== 'string') {
    errors.push({
      ...base,
      code: 'INVALID_FRONT_TYPE',
      message: `frontが文字列でない: ${typeof card.front}`,
      severity: 'error',
    })
  } else if (!card.front || card.front.trim() === '') {
    errors.push({
      ...base,
      code: 'EMPTY_FRONT',
      message: 'カードの表面(front)が空です',
      severity: 'error',
    })
  }

  // INVALID_BACK_TYPE / EMPTY_BACK
  if (typeof card.back !== 'string') {
    errors.push({
      ...base,
      code: 'INVALID_BACK_TYPE',
      message: `backが文字列でない: ${typeof card.back}`,
      severity: 'error',
    })
  } else if (!card.back || card.back.trim() === '') {
    errors.push({
      ...base,
      code: 'EMPTY_BACK',
      message: 'カードの裏面(back)が空です',
      severity: 'error',
    })
  }

  // FRONT_TOO_LONG
  if (card.front && card.front.length > FRONT_MAX_LENGTH) {
    errors.push({
      ...base,
      code: 'FRONT_TOO_LONG',
      message: `表面が${card.front.length}文字（上限${FRONT_MAX_LENGTH}）`,
      severity: 'warning',
    })
  }

  // BACK_TOO_LONG
  if (card.back && card.back.length > BACK_MAX_LENGTH) {
    errors.push({
      ...base,
      code: 'BACK_TOO_LONG',
      message: `裏面が${card.back.length}文字（上限${BACK_MAX_LENGTH}）`,
      severity: 'warning',
    })
  }

  // INVALID_CONFIDENCE（型チェック強化: NaN, null, undefined, 文字列も弾く）
  if (typeof card.confidence_score !== 'number' || isNaN(card.confidence_score) || card.confidence_score < 0 || card.confidence_score > 1) {
    errors.push({
      ...base,
      code: 'INVALID_CONFIDENCE',
      message: `confidence_score=${card.confidence_score}（0〜1の数値でない）`,
      severity: 'error',
    })
  }

  // INVALID_FORMAT（enum値バリデーション）
  if (!(VALID_CARD_FORMATS as readonly string[]).includes(card.format)) {
    errors.push({
      ...base,
      code: 'INVALID_FORMAT',
      message: `format "${card.format}" は無効な値です`,
      severity: 'error',
    })
  }

  // CLOZE_MISSING_PLACEHOLDER
  if (card.format === 'cloze' && !CLOZE_PATTERN.test(card.front)) {
    errors.push({
      ...base,
      code: 'CLOZE_MISSING_PLACEHOLDER',
      message: 'cloze形式ですが {{c1::テキスト}} パターンがありません',
      severity: 'error',
    })
  }

  // INVALID_RECALL_DIRECTION_TYPE / EMPTY_RECALL_DIRECTION
  if (typeof card.recall_direction !== 'string') {
    errors.push({
      ...base,
      code: 'INVALID_RECALL_DIRECTION_TYPE',
      message: `recall_directionが文字列でない: ${typeof card.recall_direction}`,
      severity: 'error',
    })
  } else if (!card.recall_direction || card.recall_direction.trim() === '') {
    errors.push({
      ...base,
      code: 'EMPTY_RECALL_DIRECTION',
      message: 'recall_directionが空です',
      severity: 'error',
    })
  }

  return errors
}

// --- Atomレベルのバリデーション ---

export function validateAtom(atom: KnowledgeAtom): ValidationError[] {
  const errors: ValidationError[] = []
  const atomId = atom.id

  // INVALID_ATOM_ID
  if (!ATOM_ID_PATTERN.test(atomId)) {
    errors.push({
      code: 'INVALID_ATOM_ID',
      message: `ID "${atomId}" がパターン ex-*-<type>-<3桁> に合致しません`,
      atomId,
      severity: 'error',
    })
  }

  // ATOM_ID_TYPE_MISMATCH（IDに含まれるknowledge_typeとの整合性チェック）
  if (ATOM_ID_PATTERN.test(atomId)) {
    const idParts = atomId.split('-')
    // 末尾から: 3桁数字の直前のパートがknowledge_type
    // ただしknowledge_typeにハイフンが含まれない前提（adverse_effectなどアンダースコア区切り）
    const secondLastPart = idParts[idParts.length - 2]
    if (secondLastPart && secondLastPart !== atom.knowledge_type) {
      errors.push({
        code: 'ATOM_ID_TYPE_MISMATCH',
        message: `ID内のtype "${secondLastPart}" ≠ atom.knowledge_type "${atom.knowledge_type}"`,
        atomId,
        severity: 'error',
      })
    }
  }

  // INVALID_KNOWLEDGE_TYPE（enum値バリデーション）
  if (!(VALID_KNOWLEDGE_TYPES as readonly string[]).includes(atom.knowledge_type)) {
    errors.push({
      code: 'INVALID_KNOWLEDGE_TYPE',
      message: `knowledge_type "${atom.knowledge_type}" は無効な値です`,
      atomId,
      severity: 'error',
    })
  }

  // INVALID_DIFFICULTY_TIER（enum値バリデーション）
  if (!(VALID_DIFFICULTY_TIERS as readonly string[]).includes(atom.difficulty_tier)) {
    errors.push({
      code: 'INVALID_DIFFICULTY_TIER',
      message: `difficulty_tier "${atom.difficulty_tier}" は無効な値です`,
      atomId,
      severity: 'error',
    })
  }

  // INVALID_SOURCE_QUESTIONS_TYPE / NO_SOURCE_QUESTIONS
  if (!Array.isArray(atom.source_question_ids)) {
    errors.push({
      code: 'INVALID_SOURCE_QUESTIONS_TYPE',
      message: 'source_question_idsが配列でない',
      atomId,
      severity: 'error',
    })
  } else if (atom.source_question_ids.length === 0) {
    errors.push({
      code: 'NO_SOURCE_QUESTIONS',
      message: 'source_question_idsが空です',
      atomId,
      severity: 'error',
    })
  }

  // INVALID_CARDS_TYPE / NO_CARDS
  if (!Array.isArray(atom.cards)) {
    errors.push({
      code: 'INVALID_CARDS_TYPE',
      message: 'cardsが配列でない',
      atomId,
      severity: 'error',
    })
  } else if (atom.cards.length === 0) {
    errors.push({
      code: 'NO_CARDS',
      message: 'cardsが空です',
      atomId,
      severity: 'error',
    })
  }

  // DUPLICATE_RECALL_DIRECTION
  if (Array.isArray(atom.cards) && atom.cards.length > 0) {
    const directions = atom.cards.map(c => c.recall_direction)
    const seen = new Set<string>()
    const duplicates = new Set<string>()
    for (const d of directions) {
      if (d && seen.has(d)) {
        duplicates.add(d)
      }
      seen.add(d)
    }
    for (const dup of duplicates) {
      errors.push({
        code: 'DUPLICATE_RECALL_DIRECTION',
        message: `recall_direction "${dup}" が同一atom内で重複しています`,
        atomId,
        severity: 'error',
      })
    }

    // 各カードのバリデーション（cardIndex付き）
    for (let i = 0; i < atom.cards.length; i++) {
      errors.push(...validateCard(atom.cards[i], atomId, i))
    }
  }

  return errors
}

// --- 全atom一括バリデーション ---

export function validateAllAtoms(atoms: KnowledgeAtom[]): ValidationResult {
  const allErrors: ValidationError[] = []
  let withErrors = 0

  for (const atom of atoms) {
    const atomErrors = validateAtom(atom)
    allErrors.push(...atomErrors)
    // withErrors は severity=error を持つ atom のみカウント
    if (atomErrors.some(e => e.severity === 'error')) {
      withErrors++
    }
  }

  const errorCount = allErrors.filter(e => e.severity === 'error').length
  const warningCount = allErrors.filter(e => e.severity === 'warning').length

  return {
    errors: allErrors,
    summary: {
      total: atoms.length,
      withErrors,
      errorCount,
      warningCount,
    },
  }
}
