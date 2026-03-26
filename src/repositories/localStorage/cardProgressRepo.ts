// カード復習進捗リポジトリ（localStorage 実装）

import type { CardProgress } from '../../types/card-progress'
import type { ICardProgressRepo } from '../interfaces'

const STORAGE_KEY = 'card_progress'

function load(): CardProgress[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CardProgress[]
  } catch {
    return []
  }
}

function persist(items: CardProgress[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export class LocalCardProgressRepo implements ICardProgressRepo {
  async getAll(): Promise<CardProgress[]> {
    return load()
  }

  async getByTemplateId(templateId: string): Promise<CardProgress | undefined> {
    return load().find(p => p.template_id === templateId)
  }

  async save(progress: CardProgress): Promise<void> {
    const items = load()
    const index = items.findIndex(p => p.template_id === progress.template_id)
    if (index >= 0) {
      items[index] = progress
    } else {
      items.unshift(progress)
    }
    persist(items)
  }

  async getDueCards(): Promise<CardProgress[]> {
    const now = new Date().toISOString()
    return load().filter(p => p.next_review_at <= now)
  }
}
