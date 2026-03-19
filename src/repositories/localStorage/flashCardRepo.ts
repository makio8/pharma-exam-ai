// localStorage実装: 暗記カードリポジトリ
import type { FlashCard } from '../../types/flashcard'
import type { IFlashCardRepo, NewFlashCardInput } from '../interfaces'

const STORAGE_KEY = 'flash_cards'

function load(): FlashCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as FlashCard[]
  } catch {
    return []
  }
}

function persist(cards: FlashCard[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
}

export class LocalFlashCardRepo implements IFlashCardRepo {
  async getAll(): Promise<FlashCard[]> {
    return load()
  }

  async add(input: NewFlashCardInput): Promise<FlashCard> {
    const now = new Date().toISOString()
    const card: FlashCard = {
      ...input,
      id: crypto.randomUUID(),
      ease_factor: 2.5,
      interval_days: 1,
      next_review_at: now, // 即復習可能
      review_count: 0,
      correct_streak: 0,
      created_at: now,
      updated_at: now,
    }
    const cards = load()
    cards.unshift(card)
    persist(cards)
    return card
  }

  async update(id: string, updates: Partial<FlashCard>): Promise<void> {
    const cards = load()
    const next = cards.map((c) =>
      c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c,
    )
    persist(next)
  }

  async delete(id: string): Promise<void> {
    const cards = load()
    persist(cards.filter((c) => c.id !== id))
  }

  async getByQuestionId(questionId: string): Promise<FlashCard[]> {
    const cards = load()
    return cards.filter((c) => c.question_id === questionId)
  }
}
