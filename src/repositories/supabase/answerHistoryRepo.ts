// Supabase実装: 回答履歴リポジトリ
import type { AnswerHistory } from '../../types/question'
import type { IAnswerHistoryRepo } from '../interfaces'
import { supabase } from '../../lib/supabase'

// Supabase クライアントの型安全性を一時的にバイパス
// Database型とアプリの型が完全一致するまでの暫定対応
const db = supabase as any

export class SupabaseAnswerHistoryRepo implements IAnswerHistoryRepo {
  async getAll(): Promise<AnswerHistory[]> {
    if (!db) return []
    const { data, error } = await db
      .from('answer_history')
      .select('*')
      .order('answered_at', { ascending: false })

    if (error) {
      console.error('[SupabaseAnswerHistoryRepo] getAll error:', error.message)
      return []
    }
    return (data || []).map(this.mapRow)
  }

  async save(answer: Omit<AnswerHistory, 'id'>): Promise<AnswerHistory> {
    if (!db) throw new Error('Supabase not configured')

    const { data: { user } } = await db.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // MVP: question_id はローカルID(r110-001等)をそのまま保存
    // 将来: questionsテーブルのUUIDに紐付け
    const { data, error } = await db
      .from('answer_history')
      .insert({
        user_id: user.id,
        question_id: answer.question_id as unknown as string, // ローカルIDをそのまま
        selected_answer: answer.selected_answer,
        is_correct: answer.is_correct,
        confidence_level: answer.confidence_level,
        time_spent_seconds: answer.time_spent_seconds || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[SupabaseAnswerHistoryRepo] save error:', error.message)
      throw error
    }
    return this.mapRow(data)
  }

  async getLatestByQuestionId(questionId: string): Promise<AnswerHistory | undefined> {
    if (!supabase) return undefined
    const { data, error } = await supabase
      .from('answer_history')
      .select('*')
      .eq('question_id', questionId)
      .order('answered_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[SupabaseAnswerHistoryRepo] getLatestByQuestionId error:', error.message)
      return undefined
    }
    return data ? this.mapRow(data) : undefined
  }

  private mapRow(row: Record<string, unknown>): AnswerHistory {
    return {
      id: row.id as string,
      user_id: row.user_id as string,
      question_id: row.question_id as string,
      selected_answer: row.selected_answer as number | number[],
      is_correct: row.is_correct as boolean,
      answered_at: row.answered_at as string,
      confidence_level: row.confidence_level as AnswerHistory['confidence_level'],
      time_spent_seconds: row.time_spent_seconds as number | undefined,
    }
  }
}
