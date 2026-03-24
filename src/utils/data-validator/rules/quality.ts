import type { Question } from '../../../types/question'
import type { ValidationContext, ValidationIssue } from '../types'

// ─────────────────────────────────────────────
// 定数・ユーティリティ
// ─────────────────────────────────────────────

// テキスト系 choice_type（これ以外はテキスト欠如を許容）
const TEXT_CHOICE_TYPES = new Set([
  'text',
  'text_pair',
  'numeric',
  undefined,
])

// 全角数字 → 半角数字変換
function toHalfWidth(str: string): string {
  return str.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
}

// 漢数字 → 数値変換マップ
const KANJI_NUM_MAP: Record<string, number> = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5 }

// 「Nつ選べ」からNを抽出
function extractSelectCount(text: string): number | null {
  const normalizedText = toHalfWidth(text)
  const kanjiMatch = text.match(/([一二三四五])つ選べ/)
  if (kanjiMatch) {
    return KANJI_NUM_MAP[kanjiMatch[1]] ?? null
  }
  const arabicMatch = normalizedText.match(/([0-9])つ選べ/)
  if (arabicMatch) {
    return parseInt(arabicMatch[1], 10)
  }
  return null
}

// ─────────────────────────────────────────────
// メイン関数
// ─────────────────────────────────────────────

export function qualityRules(
  questions: Question[],
  _context: ValidationContext,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // ルール 30 用: 問題文 → id[] の集計
  const textToIds = new Map<string, string[]>()
  for (const q of questions) {
    const ids = textToIds.get(q.question_text) ?? []
    ids.push(q.id)
    textToIds.set(q.question_text, ids)
  }

  for (const q of questions) {
    // ─── ルール 24: question-text-length ───
    const textLen = q.question_text.length
    if (textLen < 10 || textLen > 2000) {
      issues.push({
        questionId: q.id,
        rule: 'question-text-length',
        severity: 'warning',
        message: `問題文の長さが範囲外です: ${textLen}文字（10〜2000文字が正常）`,
        field: 'question_text',
        expected: '10〜2000文字',
        actual: textLen,
      })
    }

    // ─── ルール 25: explanation-length ───
    if (q.explanation && q.explanation.length > 0 && q.explanation.length < 20) {
      issues.push({
        questionId: q.id,
        rule: 'explanation-length',
        severity: 'warning',
        message: `解説が短すぎます: ${q.explanation.length}文字（20文字以上推奨）`,
        field: 'explanation',
        expected: '20文字以上',
        actual: q.explanation.length,
      })
    }

    // ─── ルール 26: correct-rate-range ───
    if (q.correct_rate !== undefined) {
      if (q.correct_rate < 0 || q.correct_rate > 1) {
        issues.push({
          questionId: q.id,
          rule: 'correct-rate-range',
          severity: 'error',
          message: `correct_rate が範囲外です: ${q.correct_rate}（0〜1）`,
          field: 'correct_rate',
          expected: '0〜1',
          actual: q.correct_rate,
        })
      }
    }

    // ─── ルール 27: image-visual-type ───
    if (q.image_url && !q.visual_content_type) {
      issues.push({
        questionId: q.id,
        rule: 'image-visual-type',
        severity: 'info',
        message: 'image_url が設定されていますが visual_content_type が未設定です',
        field: 'visual_content_type',
        expected: 'visual_content_type の設定',
        actual: undefined,
      })
    }

    // ─── ルール 28: text-contamination ───
    if (/問\s*\d{1,3}\s*[（(]/.test(q.question_text)) {
      issues.push({
        questionId: q.id,
        rule: 'text-contamination',
        severity: 'warning',
        message: '問題文に「問XXX（」等のパターンが混入しています',
        field: 'question_text',
        expected: '混入なし',
        actual: q.question_text.slice(0, 100),
      })
    }

    // ─── ルール 29: choice-text-empty ───
    for (const choice of q.choices) {
      if (TEXT_CHOICE_TYPES.has(choice.choice_type) && choice.text.trim() === '') {
        issues.push({
          questionId: q.id,
          rule: 'choice-text-empty',
          severity: 'error',
          message: `選択肢 key=${choice.key} のテキストが空です`,
          field: 'choices',
          expected: '非空テキスト',
          actual: choice.text,
        })
      }
    }

    // ─── ルール 31: choice-text-truncated ───
    for (const choice of q.choices) {
      if (TEXT_CHOICE_TYPES.has(choice.choice_type) && choice.text.length > 0 && choice.text.length <= 2) {
        issues.push({
          questionId: q.id,
          rule: 'choice-text-truncated',
          severity: 'warning',
          message: `選択肢 key=${choice.key} のテキストが短すぎます（${choice.text.length}文字）: "${choice.text}"`,
          field: 'choices',
          expected: '3文字以上',
          actual: choice.text,
        })
      }
    }

    // ─── ルール 32: choice-text-duplicate ───
    // 空テキスト（画像選択肢等）は除外。空文字の重複は choice-text-empty ルールで検出
    const choiceTextSet = new Set<string>()
    let hasDuplicate = false
    for (const choice of q.choices) {
      if (choice.text.trim() === '') continue
      if (choiceTextSet.has(choice.text)) {
        hasDuplicate = true
        break
      }
      choiceTextSet.add(choice.text)
    }
    if (hasDuplicate) {
      issues.push({
        questionId: q.id,
        rule: 'choice-text-duplicate',
        severity: 'error',
        message: '同一問題内で選択肢テキストが重複しています',
        field: 'choices',
        expected: '重複なし',
        actual: q.choices.map(c => c.text),
      })
    }

    // ─── ルール 33: question-text-table-leak ───
    {
      const lines = q.question_text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
      const lineCount = new Map<string, number>()
      for (const line of lines) {
        lineCount.set(line, (lineCount.get(line) ?? 0) + 1)
      }
      const hasTableLeak = [...lineCount.values()].some(count => count >= 3)
      if (hasTableLeak) {
        issues.push({
          questionId: q.id,
          rule: 'question-text-table-leak',
          severity: 'warning',
          message: '問題文に繰り返しパターン（テーブルデータ漏洩）が検出されました',
          field: 'question_text',
          expected: '繰り返しなし',
          actual: q.question_text.slice(0, 100),
        })
      }
    }

    // ─── ルール 34: question-text-choice-leak ───
    {
      const tail = q.question_text.slice(-200)
      for (const choice of q.choices) {
        if (choice.text.length >= 4 && tail.includes(choice.text)) {
          issues.push({
            questionId: q.id,
            rule: 'question-text-choice-leak',
            severity: 'warning',
            message: `問題文末尾に選択肢テキストが混入している可能性があります: "${choice.text.slice(0, 30)}"`,
            field: 'question_text',
            expected: '選択肢混入なし',
            actual: choice.text.slice(0, 30),
          })
          break // 1問につき1件のみ
        }
      }
    }

    // ─── ルール 35: select-count-missing ───
    if (q.question_text.includes('つ選べ')) {
      const normalizedText = toHalfWidth(q.question_text)
      // 数字（半角・全角変換後）、漢数字のいずれかが直前にあるか
      const hasNumber = /[0-9一二三四五]つ選べ/.test(normalizedText) || /[一二三四五]つ選べ/.test(q.question_text)
      if (!hasNumber) {
        issues.push({
          questionId: q.id,
          rule: 'select-count-missing',
          severity: 'warning',
          message: '「つ選べ」の前に数字・漢数字がありません',
          field: 'question_text',
          expected: '「Nつ選べ」形式',
          actual: q.question_text.slice(0, 100),
        })
      }
    }

    // ─── ルール 36: image-only-choices ───
    if (!q.display_mode_override && q.choices.length > 0) {
      const allNumberOnly = q.choices.every(c => /^\d+\.?$/.test(c.text))
      if (allNumberOnly) {
        issues.push({
          questionId: q.id,
          rule: 'image-only-choices',
          severity: 'info',
          message: '全選択肢が番号のみですが display_mode_override が未設定です',
          field: 'display_mode_override',
          expected: 'display_mode_override の設定',
          actual: undefined,
        })
      }
    }

    // ─── ルール 37: choice-count-mismatch ───
    {
      const selectCount = extractSelectCount(q.question_text)
      const isArray = Array.isArray(q.correct_answer)

      if (selectCount !== null) {
        if (selectCount === 1) {
          // 「1つ選べ」→ scalarであるべき
          if (isArray) {
            issues.push({
              questionId: q.id,
              rule: 'choice-count-mismatch',
              severity: 'error',
              message: '「1つ選べ」なのに correct_answer が配列です',
              field: 'correct_answer',
              expected: 'scalar',
              actual: q.correct_answer,
            })
          }
        } else {
          // 「Nつ選べ」(N>=2) → 配列かつ長さ===N
          if (!isArray) {
            issues.push({
              questionId: q.id,
              rule: 'choice-count-mismatch',
              severity: 'error',
              message: `「${selectCount}つ選べ」なのに correct_answer がスカラーです`,
              field: 'correct_answer',
              expected: `長さ ${selectCount} の配列`,
              actual: q.correct_answer,
            })
          } else {
            const arr = q.correct_answer as number[]
            if (arr.length !== selectCount) {
              issues.push({
                questionId: q.id,
                rule: 'choice-count-mismatch',
                severity: 'error',
                message: `「${selectCount}つ選べ」なのに correct_answer の要素数が ${arr.length} です`,
                field: 'correct_answer',
                expected: `長さ ${selectCount} の配列`,
                actual: arr,
              })
            }
          }
        }
      }
    }

    // ─── ルール 38: display-mode-consistency ───
    if (q.display_mode_override === 'text' && q.image_url) {
      issues.push({
        questionId: q.id,
        rule: 'display-mode-consistency',
        severity: 'info',
        message: 'display_mode_override=text なのに image_url が設定されています',
        field: 'display_mode_override',
        expected: 'image_url なし',
        actual: q.image_url,
      })
    } else if (q.display_mode_override === 'image' && !q.image_url) {
      issues.push({
        questionId: q.id,
        rule: 'display-mode-consistency',
        severity: 'info',
        message: 'display_mode_override=image なのに image_url が未設定です',
        field: 'image_url',
        expected: 'image_url の設定',
        actual: undefined,
      })
    }
  }

  // ─── ルール 30: duplicate-question-text ───
  // （全問集計後に処理）
  for (const [, ids] of textToIds) {
    if (ids.length >= 2) {
      // 最初の1件のみにissueを付ける
      issues.push({
        questionId: ids[0],
        rule: 'duplicate-question-text',
        severity: 'warning',
        message: `同一問題文が ${ids.length} 件あります: [${ids.join(', ')}]`,
        field: 'question_text',
        expected: '一意な問題文',
        actual: ids,
      })
    }
  }

  return issues
}
