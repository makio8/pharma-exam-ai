// src/types/card-progress.ts
// カード復習進捗（ユーザー個人データ — localStorage/Supabase に保存）

/** 復習結果（SM-2アルゴリズムへの入力） */
export type ReviewResult = 'again' | 'hard' | 'good' | 'easy'

/** カード復習進捗（SM-2 の状態） */
export interface CardProgress {
  template_id: string           // FlashCardTemplate.id
  user_id: string               // Phase 1 では 'local' 固定
  ease_factor: number           // SM-2 係数（デフォルト 2.5）
  interval_days: number         // 次回復習までの日数
  next_review_at: string        // ISO8601 次回復習日
  review_count: number          // 復習回数
  correct_streak: number        // 連続正答数
  last_reviewed_at: string      // ISO8601 最終復習日
}

/** カード練習の文脈（どこから来て、何の練習か） */
export interface FlashCardPracticeContext {
  mode: 'review_queue' | 'exemplar' | 'note'
  exemplarId?: string           // Exemplar集中モード時
  noteId?: string               // 付箋集中モード時
  cardIds: string[]             // 練習するカードのID一覧
  returnTo: string              // 練習後の戻り先URL
}
