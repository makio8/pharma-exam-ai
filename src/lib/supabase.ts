import { createClient } from '@supabase/supabase-js'
import type { StickyNote, SavedNote } from '../types/note'
import type { Question, AnswerHistory } from '../types/question'
import type { UserProfile } from '../types/user'

// 環境変数（.env.local に設定）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[supabase] 環境変数が未設定です。.env.local を確認してください')
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

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// 認証ヘルパー
export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const signInWithEmail = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password })
}

export const signUpWithEmail = async (email: string, password: string) => {
  return supabase.auth.signUp({ email, password })
}

export const signOut = async () => {
  return supabase.auth.signOut()
}
