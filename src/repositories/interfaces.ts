// データアクセス層のインターフェース定義
// localStorage / Supabase を切り替え可能にする

import type { AnswerHistory } from '../types/question'
import type { StickyNote } from '../types/note'

/** 新規付箋作成時に省略可能なフィールド */
export type NewNoteInput = Omit<StickyNote, 'id' | 'saves_count' | 'likes_count' | 'created_at' | 'updated_at'>

/** 回答履歴リポジトリ */
export interface IAnswerHistoryRepo {
  getAll(): Promise<AnswerHistory[]>
  save(answer: Omit<AnswerHistory, 'id'>): Promise<AnswerHistory>
  getLatestByQuestionId(questionId: string): Promise<AnswerHistory | undefined>
}

/** 付箋リポジトリ */
export interface IStickyNoteRepo {
  getAll(): Promise<StickyNote[]>
  add(input: NewNoteInput): Promise<StickyNote>
  update(id: string, updates: Partial<StickyNote>): Promise<void>
  delete(id: string): Promise<void>
  getByQuestionId(questionId: string): Promise<StickyNote[]>
}
