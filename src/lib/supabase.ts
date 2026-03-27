import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// 環境変数（.env.local に設定）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Supabase が利用可能かどうか */
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey

if (!isSupabaseConfigured) {
  console.warn('[supabase] 環境変数が未設定です。localStorageモードで動作します')
}

// 型エクスポート（他のファイルから Database 型を参照する場合）
export type { Database }

// 環境変数未設定時は null（localStorageモードで動作するため安全）
export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!)
  : null
