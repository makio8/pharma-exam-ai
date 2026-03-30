// 公式付箋スコアリングコア
// FusenLibraryCore / SM2Scheduler と同じ純粋クラスパターン
import type { OfficialNote } from '../types/official-note'
import type { Question } from '../types/question'

export const SCORING_WEIGHTS = {
  primaryExemplar: 2,    // questionのprimary exemplarとnoteのprimaryExemplarIdsが一致
  secondaryExemplar: 1,  // それ以外のexemplar一致（note/questionいずれかがsecondary）
  textMatch: 0.5,        // note.tagsの語がquestion_textに含まれる（1件あたり）
  importance: 0.01,      // タイブレーク（importance最大4 × 0.01 = 0.04）
} as const

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

    // タイブレーク
    s += Math.min(note.importance, 10) * SCORING_WEIGHTS.importance

    return s
  }

  /**
   * 付箋リストをスコアリングして上位limit件を返す
   * score > SCORING_WEIGHTS.importance * 1 の場合のみ（= importanceのみは除外）
   * 全件除外の場合は importance 降順フォールバック
   */
  topNotes(notes: OfficialNote[], question: Question, limit: number): OfficialNote[] {
    if (limit <= 0) return []

    const scored = notes
      .map((note) => ({ note, score: this.score(note, question) }))
      .filter(({ score }) => score > SCORING_WEIGHTS.importance) // importance=1のみはフォールバック候補
      .sort((a, b) => b.score - a.score)
      .map(({ note }) => note)

    if (scored.length > 0) return scored.slice(0, limit)

    // フォールバック: importance降順
    return [...notes]
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit)
  }
}
