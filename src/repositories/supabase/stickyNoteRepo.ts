// Supabase実装: 付箋リポジトリ
import type { StickyNote } from '../../types/note'
import type { IStickyNoteRepo, NewNoteInput } from '../interfaces'
import { supabase } from '../../lib/supabase'

const db = supabase as any

export class SupabaseStickyNoteRepo implements IStickyNoteRepo {
  async getAll(): Promise<StickyNote[]> {
    if (!db) return []
    const { data, error } = await db
      .from('sticky_notes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[SupabaseStickyNoteRepo] getAll error:', error.message)
      return []
    }
    return (data || []).map(this.mapRow)
  }

  async add(input: NewNoteInput): Promise<StickyNote> {
    if (!db) throw new Error('Supabase not configured')

    const { data: { user } } = await db.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await db
      .from('sticky_notes')
      .insert({
        user_id: user.id,
        question_id: input.question_id,
        title: input.title,
        body: input.body,
        note_type: input.note_type,
        tags: input.tags,
        visibility: input.visibility,
      })
      .select()
      .single()

    if (error) {
      console.error('[SupabaseStickyNoteRepo] add error:', error.message)
      throw error
    }
    return this.mapRow(data)
  }

  async update(id: string, updates: Partial<StickyNote>): Promise<void> {
    if (!db) throw new Error('Supabase not configured')

    const { error } = await db
      .from('sticky_notes')
      .update({
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.body !== undefined && { body: updates.body }),
        ...(updates.note_type !== undefined && { note_type: updates.note_type }),
        ...(updates.tags !== undefined && { tags: updates.tags }),
        ...(updates.visibility !== undefined && { visibility: updates.visibility }),
      })
      .eq('id', id)

    if (error) {
      console.error('[SupabaseStickyNoteRepo] update error:', error.message)
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    if (!db) throw new Error('Supabase not configured')

    const { error } = await db
      .from('sticky_notes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[SupabaseStickyNoteRepo] delete error:', error.message)
      throw error
    }
  }

  async getByQuestionId(questionId: string): Promise<StickyNote[]> {
    if (!db) return []
    const { data, error } = await db
      .from('sticky_notes')
      .select('*')
      .eq('question_id', questionId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[SupabaseStickyNoteRepo] getByQuestionId error:', error.message)
      return []
    }
    return (data || []).map(this.mapRow)
  }

  private mapRow(row: Record<string, unknown>): StickyNote {
    return {
      id: row.id as string,
      user_id: row.user_id as string,
      question_id: row.question_id as string,
      title: row.title as string,
      body: row.body as string,
      note_type: row.note_type as StickyNote['note_type'],
      tags: (row.tags as string[]) || [],
      visibility: row.visibility as StickyNote['visibility'],
      saves_count: (row.saves_count as number) || 0,
      likes_count: (row.likes_count as number) || 0,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    }
  }
}
