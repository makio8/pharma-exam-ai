// scripts/lib/card-validator.ts
// 生成カードバリデーター — KnowledgeAtom / KnowledgeAtomCard の品質チェック13ルール

import type { KnowledgeAtom, KnowledgeAtomCard } from '../../src/types/knowledge-atom'

// --- 型定義 ---

export interface ValidationError {
  code: string
  message: string
  atomId: string
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

// --- カードレベルのバリデーション ---

export function validateCard(card: KnowledgeAtomCard, atomId: string): ValidationError[] {
  const errors: ValidationError[] = []

  // EMPTY_FRONT
  if (!card.front || card.front.trim() === '') {
    errors.push({
      code: 'EMPTY_FRONT',
      message: 'カードの表面(front)が空です',
      atomId,
      severity: 'error',
    })
  }

  // EMPTY_BACK
  if (!card.back || card.back.trim() === '') {
    errors.push({
      code: 'EMPTY_BACK',
      message: 'カードの裏面(back)が空です',
      atomId,
      severity: 'error',
    })
  }

  // FRONT_TOO_LONG
  if (card.front && card.front.length > FRONT_MAX_LENGTH) {
    errors.push({
      code: 'FRONT_TOO_LONG',
      message: `表面が${card.front.length}文字（上限${FRONT_MAX_LENGTH}）`,
      atomId,
      severity: 'warning',
    })
  }

  // BACK_TOO_LONG
  if (card.back && card.back.length > BACK_MAX_LENGTH) {
    errors.push({
      code: 'BACK_TOO_LONG',
      message: `裏面が${card.back.length}文字（上限${BACK_MAX_LENGTH}）`,
      atomId,
      severity: 'warning',
    })
  }

  // INVALID_CONFIDENCE
  if (card.confidence_score < 0 || card.confidence_score > 1) {
    errors.push({
      code: 'INVALID_CONFIDENCE',
      message: `confidence_score=${card.confidence_score}（0〜1の範囲外）`,
      atomId,
      severity: 'error',
    })
  }

  // CLOZE_MISSING_PLACEHOLDER
  if (card.format === 'cloze' && !CLOZE_PATTERN.test(card.front)) {
    errors.push({
      code: 'CLOZE_MISSING_PLACEHOLDER',
      message: 'cloze形式ですが {{c1::テキスト}} パターンがありません',
      atomId,
      severity: 'error',
    })
  }

  // EMPTY_RECALL_DIRECTION
  if (!card.recall_direction || card.recall_direction.trim() === '') {
    errors.push({
      code: 'EMPTY_RECALL_DIRECTION',
      message: 'recall_directionが空です',
      atomId,
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

  // NO_SOURCE_QUESTIONS
  if (!atom.source_question_ids || atom.source_question_ids.length === 0) {
    errors.push({
      code: 'NO_SOURCE_QUESTIONS',
      message: 'source_question_idsが空です',
      atomId,
      severity: 'error',
    })
  }

  // NO_CARDS
  if (!atom.cards || atom.cards.length === 0) {
    errors.push({
      code: 'NO_CARDS',
      message: 'cardsが空です',
      atomId,
      severity: 'error',
    })
  }

  // DUPLICATE_RECALL_DIRECTION
  if (atom.cards && atom.cards.length > 0) {
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

    // 各カードのバリデーション
    for (const card of atom.cards) {
      errors.push(...validateCard(card, atomId))
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
