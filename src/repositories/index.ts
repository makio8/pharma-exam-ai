// リポジトリファクトリ: 環境変数でlocalStorage / Supabaseを自動切替
// 認証済み → Supabase、未認証 → localStorage にフォールバック
import type { IAnswerHistoryRepo, IStickyNoteRepo } from './interfaces'
import { LocalAnswerHistoryRepo } from './localStorage/answerHistoryRepo'
import { LocalStickyNoteRepo } from './localStorage/stickyNoteRepo'
import { SupabaseAnswerHistoryRepo } from './supabase/answerHistoryRepo'
import { SupabaseStickyNoteRepo } from './supabase/stickyNoteRepo'
import { isSupabaseConfigured } from '../lib/supabase'

function createAnswerHistoryRepo(): IAnswerHistoryRepo {
  if (isSupabaseConfigured) {
    return new SupabaseAnswerHistoryRepo()
  }
  return new LocalAnswerHistoryRepo()
}

function createStickyNoteRepo(): IStickyNoteRepo {
  if (isSupabaseConfigured) {
    return new SupabaseStickyNoteRepo()
  }
  return new LocalStickyNoteRepo()
}

export const answerHistoryRepo = createAnswerHistoryRepo()
export const stickyNoteRepo = createStickyNoteRepo()

export type { IAnswerHistoryRepo, IStickyNoteRepo, NewNoteInput } from './interfaces'
