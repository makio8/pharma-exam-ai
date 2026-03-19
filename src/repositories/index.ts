// リポジトリファクトリ: 環境変数でlocalStorage / Supabaseを自動切替
// 認証済み → Supabase、未認証 → localStorage にフォールバック
import type { IAnswerHistoryRepo, IStickyNoteRepo, IFlashCardRepo } from './interfaces'
import { LocalAnswerHistoryRepo } from './localStorage/answerHistoryRepo'
import { LocalStickyNoteRepo } from './localStorage/stickyNoteRepo'
import { LocalFlashCardRepo } from './localStorage/flashCardRepo'
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

function createFlashCardRepo(): IFlashCardRepo {
  // FlashCard は現時点では localStorage のみ
  return new LocalFlashCardRepo()
}

export const answerHistoryRepo = createAnswerHistoryRepo()
export const stickyNoteRepo = createStickyNoteRepo()
export const flashCardRepo = createFlashCardRepo()

export type { IAnswerHistoryRepo, IStickyNoteRepo, IFlashCardRepo, NewNoteInput, NewFlashCardInput } from './interfaces'
