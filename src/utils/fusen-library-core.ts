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
  label: string
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

  /** 重要度バッジを計算（importance フィールドベース） */
  static getImportanceBadge(importance: number): ImportanceBadge | null {
    if (importance >= 4) return { emoji: '🔥', label: '重要' }
    if (importance >= 3) return { emoji: '📊', label: '頻出' }
    if (importance >= 2) return { emoji: '📝', label: '基本' }
    return null
  }

  /** IDで付箋を検索 */
  getFusenById(id: string): OfficialNote | undefined {
    return this.notes.find(n => n.id === id)
  }
}
