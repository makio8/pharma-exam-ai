// リポジトリファクトリ: 環境変数でlocalStorage / Supabaseを自動切替
import type { IAnswerHistoryRepo, IStickyNoteRepo } from './interfaces'
import { LocalAnswerHistoryRepo } from './localStorage/answerHistoryRepo'
import { LocalStickyNoteRepo } from './localStorage/stickyNoteRepo'

const useSupabase =
  !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY

function createAnswerHistoryRepo(): IAnswerHistoryRepo {
  if (useSupabase) {
    // 将来: SupabaseAnswerHistoryRepo を返す
    // import { SupabaseAnswerHistoryRepo } from './supabase/stub'
    // return new SupabaseAnswerHistoryRepo()
    console.warn('Supabase repo not yet implemented, falling back to localStorage')
  }
  return new LocalAnswerHistoryRepo()
}

function createStickyNoteRepo(): IStickyNoteRepo {
  if (useSupabase) {
    console.warn('Supabase repo not yet implemented, falling back to localStorage')
  }
  return new LocalStickyNoteRepo()
}

export const answerHistoryRepo = createAnswerHistoryRepo()
export const stickyNoteRepo = createStickyNoteRepo()

export type { IAnswerHistoryRepo, IStickyNoteRepo, NewNoteInput } from './interfaces'
