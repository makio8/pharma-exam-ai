// リポジトリファクトリ: 環境変数でlocalStorage / Supabaseを自動切替
// Phase 1: 常に localStorage を使用（Supabase統合は Phase 2 で対応）
import type { IAnswerHistoryRepo, IStickyNoteRepo, IFlashCardRepo, IFlashCardTemplateRepo, ICardProgressRepo } from './interfaces'
import { LocalAnswerHistoryRepo } from './localStorage/answerHistoryRepo'
import { LocalStickyNoteRepo } from './localStorage/stickyNoteRepo'
import { LocalFlashCardRepo } from './localStorage/flashCardRepo'
import { LocalFlashCardTemplateRepo } from './localStorage/flashCardTemplateRepo'
import { LocalCardProgressRepo } from './localStorage/cardProgressRepo'
import { SupabaseStickyNoteRepo } from './supabase/stickyNoteRepo'
import { isSupabaseConfigured } from '../lib/supabase'

function createAnswerHistoryRepo(): IAnswerHistoryRepo {
  // Phase 1: 常に localStorage を使用
  // Supabase 設定済みでも未認証時のフォールバックが複雑なため、
  // Phase 2（ログイン機能本格化）まで localStorage を強制使用
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

function createFlashCardTemplateRepo(): IFlashCardTemplateRepo {
  return new LocalFlashCardTemplateRepo()
}

function createCardProgressRepo(): ICardProgressRepo {
  return new LocalCardProgressRepo()
}

export const answerHistoryRepo = createAnswerHistoryRepo()
export const stickyNoteRepo = createStickyNoteRepo()
export const flashCardRepo = createFlashCardRepo()
export const flashCardTemplateRepo = createFlashCardTemplateRepo()
export const cardProgressRepo = createCardProgressRepo()

export type { IAnswerHistoryRepo, IStickyNoteRepo, IFlashCardRepo, IFlashCardTemplateRepo, ICardProgressRepo, NewNoteInput, NewFlashCardInput } from './interfaces'
