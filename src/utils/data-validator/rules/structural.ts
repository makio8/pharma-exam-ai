import type { Question, QuestionSection, QuestionSubject } from '../../../types/question'
import type { ValidationContext, ValidationIssue } from '../types'

// ─────────────────────────────────────────────
// 定数
// ─────────────────────────────────────────────

const VALID_SECTIONS: QuestionSection[] = ['必須', '理論', '実践']

const VALID_SUBJECTS: QuestionSubject[] = [
  '物理', '化学', '生物', '衛生', '薬理', '薬剤',
  '病態・薬物治療', '法規・制度・倫理', '実務',
]

const ID_FORMAT_RE = /^r(\d{3})-(\d{3})$/

// 全角数字 → 半角数字変換
function toHalfWidth(str: string): string {
  return str.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
}

// ─────────────────────────────────────────────
// メイン関数
// ─────────────────────────────────────────────

export function structuralRules(
  questions: Question[],
  _context: ValidationContext,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // ルール10, 11 のための事前集計
  const idCount = new Map<string, number>()
  const yearQnumKey = new Map<string, number>()

  for (const q of questions) {
    idCount.set(q.id, (idCount.get(q.id) ?? 0) + 1)
    const key = `${q.year}-${q.question_number}`
    yearQnumKey.set(key, (yearQnumKey.get(key) ?? 0) + 1)
  }

  for (const q of questions) {
    // ─── ルール 1: id-format ───
    const idMatch = ID_FORMAT_RE.exec(q.id)
    if (!idMatch) {
      issues.push({
        questionId: q.id,
        rule: 'id-format',
        severity: 'error',
        message: `IDが r{3桁}-{3桁} 形式ではありません: "${q.id}"`,
        field: 'id',
        expected: 'r{3桁}-{3桁}',
        actual: q.id,
      })
      // id-format 不正の問題は id-year-match / id-qnum-match をスキップ
      // その他のルールは引き続きチェック
    } else {
      // ─── ルール 2: id-year-match ───
      const idYear = parseInt(idMatch[1], 10)
      if (idYear !== q.year) {
        issues.push({
          questionId: q.id,
          rule: 'id-year-match',
          severity: 'error',
          message: `IDの年度部分 (${idYear}) と year フィールド (${q.year}) が一致しません`,
          field: 'year',
          expected: idYear,
          actual: q.year,
        })
      }

      // ─── ルール 3: id-qnum-match ───
      const idQnum = parseInt(idMatch[2], 10)
      if (idQnum !== q.question_number) {
        issues.push({
          questionId: q.id,
          rule: 'id-qnum-match',
          severity: 'error',
          message: `IDの問番部分 (${idQnum}) と question_number (${q.question_number}) が一致しません`,
          field: 'question_number',
          expected: idQnum,
          actual: q.question_number,
        })
      }
    }

    // ─── ルール 4: year-range ───
    if (q.year < 100 || q.year > 111) {
      issues.push({
        questionId: q.id,
        rule: 'year-range',
        severity: 'error',
        message: `year が有効範囲 (100〜111) 外です: ${q.year}`,
        field: 'year',
        expected: '100〜111',
        actual: q.year,
      })
    }

    // ─── ルール 5: required-fields ───
    const requiredChecks: Array<{ field: string; value: unknown }> = [
      { field: 'question_text', value: q.question_text },
      { field: 'choices', value: q.choices },
      { field: 'correct_answer', value: q.correct_answer },
      { field: 'section', value: q.section },
      { field: 'subject', value: q.subject },
    ]
    for (const { field, value } of requiredChecks) {
      // null / undefined / 空文字 をエラーとする（choices の空配列はルール6で扱う）
      const isEmpty =
        value === null ||
        value === undefined ||
        (typeof value === 'string' && value.trim() === '')
      if (isEmpty) {
        issues.push({
          questionId: q.id,
          rule: 'required-fields',
          severity: 'error',
          message: `必須フィールド "${field}" が空です`,
          field,
          expected: '非空値',
          actual: value,
        })
      }
    }

    // ─── ルール 6: choices-valid ───
    if (Array.isArray(q.choices)) {
      if (q.choices.length === 0) {
        issues.push({
          questionId: q.id,
          rule: 'choices-valid',
          severity: 'error',
          message: '選択肢が空配列です（1〜5個必要）',
          field: 'choices',
          expected: '1〜5個',
          actual: 0,
        })
      } else if (q.choices.length > 5) {
        issues.push({
          questionId: q.id,
          rule: 'choices-valid',
          severity: 'error',
          message: `選択肢が多すぎます: ${q.choices.length}個（最大5個）`,
          field: 'choices',
          expected: '1〜5個',
          actual: q.choices.length,
        })
      } else {
        // key の範囲チェック (1〜5)
        const outOfRange = q.choices.filter(c => c.key < 1 || c.key > 5)
        if (outOfRange.length > 0) {
          issues.push({
            questionId: q.id,
            rule: 'choices-valid',
            severity: 'error',
            message: `選択肢のkeyが範囲外(1〜5)です: [${outOfRange.map(c => c.key).join(', ')}]`,
            field: 'choices',
            expected: '1〜5',
            actual: outOfRange.map(c => c.key),
          })
        } else {
          // key の重複チェック
          const keys = q.choices.map(c => c.key)
          const uniqueKeys = new Set(keys)
          if (uniqueKeys.size !== keys.length) {
            issues.push({
              questionId: q.id,
              rule: 'choices-valid',
              severity: 'error',
              message: `選択肢のkeyに重複があります: [${keys.join(', ')}]`,
              field: 'choices',
              expected: '重複なし',
              actual: keys,
            })
          }
        }
      }
    }

    // ─── ルール 7: answer-in-choices ───
    if (Array.isArray(q.choices) && q.choices.length > 0 && q.correct_answer !== undefined && q.correct_answer !== null) {
      const choiceKeys = new Set(q.choices.map(c => c.key))
      const answers = Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer]
      const missing = answers.filter(a => !choiceKeys.has(a))
      if (missing.length > 0) {
        issues.push({
          questionId: q.id,
          rule: 'answer-in-choices',
          severity: 'error',
          message: `correct_answer に選択肢に存在しない値が含まれます: [${missing.join(', ')}]`,
          field: 'correct_answer',
          expected: `選択肢のkey: [${[...choiceKeys].join(', ')}]`,
          actual: missing,
        })
      }
    }

    // ─── ルール 8: section-enum ───
    if (!VALID_SECTIONS.includes(q.section)) {
      issues.push({
        questionId: q.id,
        rule: 'section-enum',
        severity: 'error',
        message: `section が有効値ではありません: "${q.section}"`,
        field: 'section',
        expected: VALID_SECTIONS,
        actual: q.section,
      })
    }

    // ─── ルール 9: subject-enum ───
    if (!VALID_SUBJECTS.includes(q.subject)) {
      issues.push({
        questionId: q.id,
        rule: 'subject-enum',
        severity: 'error',
        message: `subject が有効値ではありません: "${q.subject}"`,
        field: 'subject',
        expected: VALID_SUBJECTS,
        actual: q.subject,
      })
    }

    // ─── ルール 10: id-unique ───
    const idOccurrences = idCount.get(q.id) ?? 0
    if (idOccurrences > 1) {
      issues.push({
        questionId: q.id,
        rule: 'id-unique',
        severity: 'error',
        message: `IDが重複しています: "${q.id}" (${idOccurrences}件)`,
        field: 'id',
        expected: '一意',
        actual: q.id,
      })
    }

    // ─── ルール 11: qnum-unique-in-year ───
    const ynKey = `${q.year}-${q.question_number}`
    const ynCount = yearQnumKey.get(ynKey) ?? 0
    if (ynCount > 1) {
      issues.push({
        questionId: q.id,
        rule: 'qnum-unique-in-year',
        severity: 'error',
        message: `同一年度(${q.year})内でquestion_number(${q.question_number})が重複しています`,
        field: 'question_number',
        expected: '年度内一意',
        actual: q.question_number,
      })
    }

    // ─── ルール 12: answer-format ───
    if (q.question_text !== undefined && q.question_text !== null && q.correct_answer !== undefined && q.correct_answer !== null) {
      const normalizedText = toHalfWidth(q.question_text)
      const selectCountMatch = normalizedText.match(/([0-9])つ選べ/)
      const isMultiSelect = selectCountMatch !== null
      const selectCount = isMultiSelect ? parseInt(selectCountMatch[1], 10) : null
      const isArray = Array.isArray(q.correct_answer)

      if (!isMultiSelect || selectCount === 1) {
        // 「1つ選べ」or「つ選べ」不在 → scalarが正しい
        if (isArray) {
          issues.push({
            questionId: q.id,
            rule: 'answer-format',
            severity: 'error',
            message: `単一選択問題なのにcorrect_answerが配列です`,
            field: 'correct_answer',
            expected: 'scalar (number)',
            actual: q.correct_answer,
          })
        }
      } else {
        // Nつ選べ (N >= 2) → 昇順配列が正しい
        if (!isArray) {
          issues.push({
            questionId: q.id,
            rule: 'answer-format',
            severity: 'error',
            message: `複数選択問題(${selectCount}つ選べ)なのにcorrect_answerがscalarです`,
            field: 'correct_answer',
            expected: '昇順配列',
            actual: q.correct_answer,
          })
        } else {
          // 昇順チェック
          const arr = q.correct_answer as number[]
          const isSorted = arr.every((v, i) => i === 0 || arr[i - 1] < v)
          if (!isSorted) {
            issues.push({
              questionId: q.id,
              rule: 'answer-format',
              severity: 'error',
              message: `複数選択問題のcorrect_answerが昇順になっていません: [${arr.join(', ')}]`,
              field: 'correct_answer',
              expected: '昇順配列',
              actual: arr,
            })
          }
        }
      }
    }

    // ─── ルール 13: answer-no-duplicate ───
    if (Array.isArray(q.correct_answer)) {
      const arr = q.correct_answer as number[]
      const uniqueAnswers = new Set(arr)
      if (uniqueAnswers.size !== arr.length) {
        issues.push({
          questionId: q.id,
          rule: 'answer-no-duplicate',
          severity: 'error',
          message: `correct_answer 配列内に重複があります: [${arr.join(', ')}]`,
          field: 'correct_answer',
          expected: '重複なし',
          actual: arr,
        })
      }
    }
  }

  return issues
}
