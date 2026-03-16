// localStorage実装: 付箋リポジトリ
import type { StickyNote } from '../../types/note'
import type { IStickyNoteRepo, NewNoteInput } from '../interfaces'

const STORAGE_KEY = 'sticky_notes'

function load(): StickyNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as StickyNote[]
  } catch {
    return []
  }
}

function persist(notes: StickyNote[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

export class LocalStickyNoteRepo implements IStickyNoteRepo {
  async getAll(): Promise<StickyNote[]> {
    return load()
  }

  async add(input: NewNoteInput): Promise<StickyNote> {
    const now = new Date().toISOString()
    const note: StickyNote = {
      ...input,
      id: crypto.randomUUID(),
      saves_count: 0,
      likes_count: 0,
      created_at: now,
      updated_at: now,
    }
    const notes = load()
    notes.unshift(note)
    persist(notes)
    return note
  }

  async update(id: string, updates: Partial<StickyNote>): Promise<void> {
    const notes = load()
    const next = notes.map((n) =>
      n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n,
    )
    persist(next)
  }

  async delete(id: string): Promise<void> {
    const notes = load()
    persist(notes.filter((n) => n.id !== id))
  }

  async getByQuestionId(questionId: string): Promise<StickyNote[]> {
    const notes = load()
    return notes.filter((n) => n.question_id === questionId)
  }
}
