// Supabase実装スタブ（未実装）
// .env.local に VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY を設定後に実装予定

import type { AnswerHistory } from '../../types/question'
import type { StickyNote } from '../../types/note'
import type { IAnswerHistoryRepo, IStickyNoteRepo, NewNoteInput } from '../interfaces'

export class SupabaseAnswerHistoryRepo implements IAnswerHistoryRepo {
  async getAll(): Promise<AnswerHistory[]> {
    throw new Error('Supabase not implemented yet')
  }
  async save(_answer: Omit<AnswerHistory, 'id'>): Promise<AnswerHistory> {
    throw new Error('Supabase not implemented yet')
  }
  async getLatestByQuestionId(_questionId: string): Promise<AnswerHistory | undefined> {
    throw new Error('Supabase not implemented yet')
  }
}

export class SupabaseStickyNoteRepo implements IStickyNoteRepo {
  async getAll(): Promise<StickyNote[]> {
    throw new Error('Supabase not implemented yet')
  }
  async add(_input: NewNoteInput): Promise<StickyNote> {
    throw new Error('Supabase not implemented yet')
  }
  async update(_id: string, _updates: Partial<StickyNote>): Promise<void> {
    throw new Error('Supabase not implemented yet')
  }
  async delete(_id: string): Promise<void> {
    throw new Error('Supabase not implemented yet')
  }
  async getByQuestionId(_questionId: string): Promise<StickyNote[]> {
    throw new Error('Supabase not implemented yet')
  }
}
