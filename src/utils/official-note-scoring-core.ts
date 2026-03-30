// 公式付箋スコアリングコア
// FusenLibraryCore / SM2Scheduler と同じ純粋クラスパターン
import type { OfficialNote } from '../types/official-note'
import type { Question } from '../types/question'

export const SCORING_WEIGHTS = {
  primaryExemplar: 2,       // questionのprimary exemplarとnoteのprimaryExemplarIdsが一致
  secondaryExemplar: 1,     // それ以外のexemplar一致（note/questionいずれかがsecondary）
  textMatch: 0.5,           // note.tagsの語がquestion_textに含まれる（1件あたり）
  correctAnswerMatch: 1.5,  // note.tagsが正解選択肢テキストと一致（B12問題→B12付箋を上位に）
  importance: 0.01,         // タイブレーク（importance最大4 × 0.01 = 0.04）
} as const

/** 意味のある関連があるとみなすスコア最低ライン（textMatch 1件分 = 0.5） */
export const MEANINGFUL_SCORE_THRESHOLD = 0.5

type ExemplarEntry = {
  primary: Set<string>  // isPrimary=true のexemplarId群
  all: Set<string>      // isPrimary問わず全exemplarId群
}

type QEMEntry = { questionId: string; exemplarId: string; isPrimary: boolean }

export class OfficialNoteScoringCore {
  private readonly qExemplarIndex: Map<string, ExemplarEntry>

  constructor(questionExemplarMap: QEMEntry[]) {
    // questionId → { primary: Set, all: Set } のMapを構築（O(1)参照用）
    this.qExemplarIndex = new Map()
    for (const { questionId, exemplarId, isPrimary } of questionExemplarMap) {
      let entry = this.qExemplarIndex.get(questionId)
      if (!entry) {
        entry = { primary: new Set(), all: new Set() }
        this.qExemplarIndex.set(questionId, entry)
      }
      entry.all.add(exemplarId)
      if (isPrimary) entry.primary.add(exemplarId)
    }
  }

  /** 1枚の付箋のスコアを計算する */
  score(note: OfficialNote, question: Question): number {
    const entry = this.qExemplarIndex.get(question.id)
    let s = 0

    if (entry) {
      const primaryIds = note.primaryExemplarIds ?? []
      const secondaryIds = note.secondaryExemplarIds ?? []

      // note.primaryExemplarIds が question の primary exemplar と一致: +2
      for (const id of primaryIds) {
        if (entry.primary.has(id)) {
          s += SCORING_WEIGHTS.primaryExemplar
          break // 1回のみ加算
        }
      }

      // note の全exemplarId（primary/secondary両方）が question の secondary exemplar と一致: +1
      const allNoteExemplars = [...primaryIds, ...secondaryIds]
      for (const id of allNoteExemplars) {
        // questionのall（primary+secondary）にある && questionのprimaryではない → secondary一致
        if (entry.all.has(id) && !entry.primary.has(id)) {
          s += SCORING_WEIGHTS.secondaryExemplar
          break // 1回のみ加算
        }
      }
    }

    // textMatch: note.tagsの語がquestion_textに含まれる
    const text = question.question_text
    for (const tag of note.tags) {
      if (text.includes(tag)) s += SCORING_WEIGHTS.textMatch
    }

    // correctAnswerMatch: note.tagsが正解選択肢テキストと一致
    // 例: 正解「ビタミンB12」→ tags に「ビタミンB12」を持つ付箋が上位に
    // ルール: tag が正解テキストを含む（tag.includes(ct)）
    //   ※ 逆方向（ct.includes(tag)）は「ビタミンB1」が「ビタミンB12」に誤マッチするため使用しない
    // correct_answerは number | number[] の両方に対応（複数選択問題も含む）
    // 複数正解でも一回のみ加算（break で二重加算防止）
    if (question.choices) {
      const ca = question.correct_answer
      const caArr = Array.isArray(ca) ? ca.filter(k => k > 0) : (typeof ca === 'number' && ca > 0 ? [ca] : [])
      for (const key of caArr) {
        const correctChoice = question.choices.find(c => c.key === key)
        if (correctChoice?.text && correctChoice.text.length >= 3) {
          const ct = correctChoice.text
          const hasMatch = note.tags.some(tag => tag.includes(ct))
          if (hasMatch) {
            s += SCORING_WEIGHTS.correctAnswerMatch
            break // 複数正解でも1回のみ加算
          }
        }
      }
    }

    // タイブレーク
    s += Math.min(note.importance, 10) * SCORING_WEIGHTS.importance

    return s
  }

  /**
   * 付箋リストをスコアリングして上位limit件を返す
   * score >= MEANINGFUL_SCORE_THRESHOLD（0.5 = textMatch1件分）の付箋のみ対象
   * 全件除外の場合は空配列を返す（呼び出し側で「関連付箋なし」UIを表示）
   */
  topNotes(notes: OfficialNote[], question: Question, limit: number): OfficialNote[] {
    if (limit <= 0) return []

    const scored = notes
      .map((note) => ({ note, score: this.score(note, question) }))
      .filter(({ score }) => score >= MEANINGFUL_SCORE_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .map(({ note }) => note)

    return scored.slice(0, limit)
  }
}
