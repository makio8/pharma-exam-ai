// localStorage実装: 回答履歴リポジトリ
import type { AnswerHistory } from '../../types/question'
import type { IAnswerHistoryRepo } from '../interfaces'

const STORAGE_KEY = 'answer_history'

function load(): AnswerHistory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as AnswerHistory[]
  } catch {
    return []
  }
}

function persist(history: AnswerHistory[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

export class LocalAnswerHistoryRepo implements IAnswerHistoryRepo {
  async getAll(): Promise<AnswerHistory[]> {
    return load()
  }

  async save(answer: Omit<AnswerHistory, 'id'>): Promise<AnswerHistory> {
    const newEntry: AnswerHistory = { ...answer, id: crypto.randomUUID() }
    const history = load()
    history.push(newEntry)
    persist(history)
    return newEntry
  }

  async getLatestByQuestionId(questionId: string): Promise<AnswerHistory | undefined> {
    const history = load()
    const filtered = history.filter((h) => h.question_id === questionId)
    return filtered.length > 0 ? filtered[filtered.length - 1] : undefined
  }
}
