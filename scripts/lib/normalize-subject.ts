// scripts/lib/normalize-subject.ts
import type { QuestionSubject } from '../../src/types/question'

const VALID_SUBJECTS: QuestionSubject[] = [
  '物理', '化学', '生物', '衛生', '薬理',
  '薬剤', '病態・薬物治療', '法規・制度・倫理', '実務',
]

/** OCRが返す科目文字列を有効なQuestionSubjectに正規化する */
export function normalizeSubject(raw: string): QuestionSubject {
  // パイプ区切りの場合は最初の科目を取る（例: "物理|化学" → "物理"）
  const first = raw.split('|')[0].trim()
  if (VALID_SUBJECTS.includes(first as QuestionSubject)) {
    return first as QuestionSubject
  }
  return '物理' // フォールバック
}
