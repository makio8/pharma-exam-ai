import { createClient } from '@supabase/supabase-js'
import type { StickyNote, SavedNote } from '../types/note'
import type { Question, AnswerHistory } from '../types/question'
import type { UserProfile } from '../types/user'

// 環境変数（.env.local に設定）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Supabase が利用可能かどうか */
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey

if (!isSupabaseConfigured) {
  console.warn('[supabase] 環境変数が未設定です。localStorageモードで動作します')
}

// DB テーブルの型マップ（Supabase型安全のため）
export interface Database {
  public: {
    Tables: {
      questions: {
        Row: Question
        Insert: Omit<Question, 'id'>
        Update: Partial<Question>
      }
      profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'created_at'>
        Update: Partial<UserProfile>
      }
      answer_history: {
        Row: AnswerHistory
        Insert: Omit<AnswerHistory, 'id'>
        Update: Partial<AnswerHistory>
      }
      sticky_notes: {
        Row: StickyNote
        Insert: Omit<StickyNote, 'id' | 'saves_count' | 'likes_count' | 'created_at' | 'updated_at'>
        Update: Partial<StickyNote>
      }
      saved_notes: {
        Row: SavedNote
        Insert: Omit<SavedNote, 'id'>
        Update: never
      }
    }
  }
}

// 環境変数未設定時は null（localStorageモードで動作するため安全）
export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!)
  : null

// 認証ヘルパー（supabase未設定時は null/エラーを返す）
export const getUser = async () => {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const signInWithEmail = async (email: string, password: string) => {
  if (!supabase) return { data: null, error: { message: 'Supabase未設定' } }
  return supabase.auth.signInWithPassword({ email, password })
}

export const signUpWithEmail = async (email: string, password: string) => {
  if (!supabase) return { data: null, error: { message: 'Supabase未設定' } }
  return supabase.auth.signUp({ email, password })
}

export const signOut = async () => {
  if (!supabase) return { error: null }
  return supabase.auth.signOut()
}
