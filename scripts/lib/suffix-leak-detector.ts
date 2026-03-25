/**
 * suffix-leak-detector: 問題文末尾に漏れ出した選択肢サフィックスを検出・修復する
 *
 * 系統的バグの例:
 *   壊れた状態: question_text = "...１つ選べ。\nチャネル活性化\nチャネル遮断"
 *                choices = [{text:"K＋"}, {text:"Na＋"}]
 *   正しい状態: question_text = "...１つ選べ。"
 *                choices = [{text:"K＋チャネル活性化"}, {text:"Na＋チャネル遮断"}]
 */

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export interface Choice {
  key: number
  text: string
  choice_type?: string
}

export type Confidence = 'AUTO_HIGH' | 'AUTO_MEDIUM' | 'REVIEW'

export interface LeakDetectionResult {
  questionId: string
  confidence: Confidence
  cleanedText: string
  mergedChoices: Choice[]
  leakedLines: string[]
}

interface ExtractResult {
  leakedLines: string[]
  cleanedText: string
}

interface MergeResult {
  confidence: Confidence
  mergedChoices: Choice[]
}

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────

/** 問題文の終了を示すターミネータパターン（「〜はどれか。」「〜選べ。」等） */
const TERMINATOR_PATTERN =
  /(?:はどれか|を選べ|つ選べ|選びなさい|正しい組合せ|誤っている(?:の|もの)はどれか)[。．.]*\s*$/

/** リーク行ではない（問題文の続き）と判定する行頭パターン */
const SAFE_LINE_STARTS = /^(?:ただし|なお、|ここで|図|下図|表|次の|以下|問\d+|注)/

/** 連問の小問ヘッダーパターン（例: 問232（薬理） or 問233 次の〜） */
const SUB_QUESTION_HEADER = /^問\d+[\s（(]/

/** 結合後に二重になると REVIEW にダウングレードする語句 */
const DOUBLE_SUFFIX_WORDS = [
  '受容体',
  'チャネル',
  'ATPase',
  '共輸送体',
  '逆輸送体',
  '阻害',
  '遮断',
  '刺激',
  '活性化',
]

/** リーク行として許容する最大文字数 */
const MAX_LEAKED_LINE_LENGTH = 40

/** 全角数字で始まる行（表の行やフル選択肢テキスト） */
const FULLWIDTH_CHOICE_NUMBER = /^[１２３４５６]/

/** 連続するスペース（全角/半角）が含まれる行（表のフォーマット） */
const TABLE_SPACING = /[\s　]{2,}/

/** 句点「。」で終わる行（完全な文 = suffix断片ではない） */
const SENTENCE_ENDING = /。$/

// ────────────────────────────────────────────────────────────
// extractLeakedLines
// ────────────────────────────────────────────────────────────

/**
 * question_text からターミネータ以降に漏れ出した行を抽出する。
 * ターミネータが見つからない場合、またはリーク行がない場合は null を返す。
 */
export function extractLeakedLines(questionText: string): ExtractResult | null {
  // 改行で行に分割
  const lines = questionText.split('\n')

  // ターミネータを含む最後の行を後方から検索
  let terminatorIndex = -1
  for (let i = lines.length - 1; i >= 0; i--) {
    if (TERMINATOR_PATTERN.test(lines[i].trim())) {
      terminatorIndex = i
      break
    }
  }

  if (terminatorIndex === -1) return null

  // 連問チェック: ターミネータが複数存在する場合は、テキスト途中の
  // サブ問題のターミネータを拾っている可能性があるので null を返す
  let terminatorCount = 0
  for (let i = 0; i < lines.length; i++) {
    if (TERMINATOR_PATTERN.test(lines[i].trim())) {
      terminatorCount++
    }
  }
  if (terminatorCount > 1) return null

  // ターミネータ以降の行を取得
  const afterTerminator = lines.slice(terminatorIndex + 1)

  // 空行を除去し、タブ文字をストリップ
  const candidates = afterTerminator
    .map(line => line.replace(/\t/g, '').trim())
    .filter(line => line.length > 0)

  if (candidates.length === 0) return null

  // safe line チェック: 最初の候補がsafe lineならリークではない
  if (SAFE_LINE_STARTS.test(candidates[0])) return null

  // 連問チェック: 候補行に小問ヘッダー（問232（薬理）等）が含まれていたら
  // リークではなく連問テキストの一部 → null を返す
  if (candidates.some(line => SUB_QUESTION_HEADER.test(line))) return null

  const cleanedText = lines.slice(0, terminatorIndex + 1).join('\n')

  return {
    leakedLines: candidates,
    cleanedText,
  }
}

// ────────────────────────────────────────────────────────────
// tryMerge
// ────────────────────────────────────────────────────────────

/**
 * 二重サフィックスを検出する。
 * 結合後のテキストに同じサフィックスワードが2回以上含まれていたら true。
 */
function hasDoubleSuffix(mergedText: string): boolean {
  for (const word of DOUBLE_SUFFIX_WORDS) {
    const firstIdx = mergedText.indexOf(word)
    if (firstIdx !== -1) {
      const secondIdx = mergedText.indexOf(word, firstIdx + word.length)
      if (secondIdx !== -1) return true
    }
  }
  return false
}

/**
 * リーク行と選択肢を結合し、信頼度を分類する。
 */
export function tryMerge(leakedLines: string[], choices: Choice[]): MergeResult {
  const lineCount = leakedLines.length
  const choiceCount = choices.length

  // 行数チェック: EXACT or N-1 or mismatch
  const isExact = lineCount === choiceCount
  const isMinusOne = lineCount === choiceCount - 1

  if (!isExact && !isMinusOne) {
    return {
      confidence: 'REVIEW',
      mergedChoices: choices.map(c => ({ ...c })),
    }
  }

  // 行長チェック
  if (leakedLines.some(line => line.length > MAX_LEAKED_LINE_LENGTH)) {
    return {
      confidence: 'REVIEW',
      mergedChoices: choices.map(c => ({ ...c })),
    }
  }

  // 非suffix行チェック: 表の行・完全文など suffix 断片でない行が含まれていたら REVIEW
  const hasNonSuffixLine = leakedLines.some(
    line =>
      FULLWIDTH_CHOICE_NUMBER.test(line) ||
      TABLE_SPACING.test(line) ||
      SENTENCE_ENDING.test(line)
  )
  if (hasNonSuffixLine) {
    return {
      confidence: 'REVIEW',
      mergedChoices: choices.map(c => ({ ...c })),
    }
  }

  // 結合実行
  const mergedChoices: Choice[] = choices.map((choice, i) => {
    if (i < lineCount) {
      return { ...choice, text: choice.text + leakedLines[i] }
    }
    return { ...choice }
  })

  // 二重サフィックスチェック
  const anyDouble = mergedChoices.some((c, i) =>
    i < lineCount && hasDoubleSuffix(c.text)
  )
  if (anyDouble) {
    return {
      confidence: 'REVIEW',
      mergedChoices: choices.map(c => ({ ...c })),
    }
  }

  return {
    confidence: isExact ? 'AUTO_HIGH' : 'AUTO_MEDIUM',
    mergedChoices,
  }
}

// ────────────────────────────────────────────────────────────
// detectSuffixLeak (メインエントリーポイント)
// ────────────────────────────────────────────────────────────

interface QuestionInput {
  id: string
  question_text: string
  choices: Choice[]
}

/**
 * 問題のサフィックスリークを検出し、修復結果を返す。
 * リークが検出されない場合は null を返す。
 */
export function detectSuffixLeak(question: QuestionInput): LeakDetectionResult | null {
  if (question.choices.length === 0) return null

  const extracted = extractLeakedLines(question.question_text)
  if (!extracted) return null

  const merged = tryMerge(extracted.leakedLines, question.choices)

  return {
    questionId: question.id,
    confidence: merged.confidence,
    cleanedText: extracted.cleanedText,
    mergedChoices: merged.mergedChoices,
    leakedLines: extracted.leakedLines,
  }
}
