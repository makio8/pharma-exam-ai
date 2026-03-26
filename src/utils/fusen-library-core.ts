import type { OfficialNote } from '../types/official-note'

/**
 * Day 1 では科目単位のフラットグルーピングで十分（付箋23件）。
 * TODO Phase 2: 科目 > 大項目 > 中項目 の階層グルーピングに拡張
 */
export interface FusenGroup {
  subject: string
  fusens: OfficialNote[]
}

export interface ImportanceBadge {
  emoji: string
  count: number
}

export class FusenLibraryCore {
  private notes: OfficialNote[]

  constructor(notes: OfficialNote[]) {
    this.notes = notes
  }

  /** 科目ごとにグルーピング（科目の出現順を維持） */
  groupBySubject(): FusenGroup[] {
    const map = new Map<string, OfficialNote[]>()
    for (const note of this.notes) {
      const list = map.get(note.subject)
      if (list) {
        list.push(note)
      } else {
        map.set(note.subject, [note])
      }
    }
    return Array.from(map.entries()).map(([subject, fusens]) => ({ subject, fusens }))
  }

  /** ブックマーク済みの付箋のみフィルター */
  filterBookmarked(bookmarkedIds: Set<string>): OfficialNote[] {
    return this.notes.filter(n => bookmarkedIds.has(n.id))
  }

  /** importance 降順でソート（全付箋タブ用） */
  sortByImportance(): OfficialNote[] {
    return [...this.notes].sort((a, b) => b.importance - a.importance)
  }

  /** 関連問題IDを取得（exemplarIds 優先 → linkedQuestionIds フォールバック） */
  static getRelatedQuestionIds(note: OfficialNote): string[] {
    if (note.exemplarIds && note.exemplarIds.length > 0) {
      // Phase 2: exemplar → question-exemplar-map 経由で解決
      return note.linkedQuestionIds // TODO: resolveQuestionsFromExemplars 実装後に切替
    }
    return note.linkedQuestionIds
  }

  /** 重要度バッジを計算 */
  static getImportanceBadge(questionCount: number): ImportanceBadge | null {
    if (questionCount >= 10) return { emoji: '🔥', count: questionCount }
    if (questionCount >= 5) return { emoji: '📊', count: questionCount }
    if (questionCount >= 1) return { emoji: '📝', count: questionCount }
    return null
  }

  /** IDで付箋を検索 */
  getFusenById(id: string): OfficialNote | undefined {
    return this.notes.find(n => n.id === id)
  }
}
