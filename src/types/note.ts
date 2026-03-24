// 薬剤師国試：付箋の型定義

export type { OfficialNote, BookmarkedNote } from './official-note'

/** 付箋の種別 */
export type NoteType =
  | 'knowledge'    // 知識整理
  | 'solution'     // 解法
  | 'mnemonic'     // 語呂合わせ
  | 'caution'      // ひっかけ注意
  | 'related'      // 類題リンク
  | 'intuition'    // 直感メモ

/** 公開範囲 */
export type NoteVisibility = 'private' | 'limited' | 'public'

/** 付箋 */
export interface StickyNote {
  id: string
  user_id: string
  question_id: string
  title: string
  body: string
  note_type: NoteType
  tags: string[]
  visibility: NoteVisibility
  saves_count: number
  likes_count: number
  created_at: string   // ISO8601
  updated_at: string

  // JOIN時に付加される情報
  author?: NoteAuthor
  is_saved?: boolean   // 自分が保存済みか
  is_liked?: boolean   // 自分がいいね済みか
}

/** 付箋作成者の公開情報 */
export interface NoteAuthor {
  id: string
  display_name: string
  role?: 'student' | 'graduate' | 'lecturer'  // バッジ表示用
  pass_year?: number   // 合格年（任意公開）
}

/** 付箋保存 */
export interface SavedNote {
  id: string
  user_id: string
  note_id: string
  saved_at: string
}

/** 付箋作成・編集フォーム */
export interface NoteFormValues {
  title: string
  body: string
  note_type: NoteType
  tags: string[]
  visibility: NoteVisibility
}

/** 付箋フィルター */
export interface NoteFilter {
  note_type?: NoteType[]
  visibility?: NoteVisibility[]
  tags?: string[]
  keyword?: string
  sort?: 'created_at_desc' | 'saves_count_desc' | 'likes_count_desc'
}

/** 付箋種別の表示ラベル・色 */
export const NOTE_TYPE_CONFIG: Record<NoteType, { label: string; color: string; emoji: string }> = {
  knowledge: { label: '知識整理', color: 'blue', emoji: '📚' },
  solution:  { label: '解法',     color: 'green', emoji: '💡' },
  mnemonic:  { label: '語呂',     color: 'purple', emoji: '🎵' },
  caution:   { label: '注意',     color: 'red', emoji: '⚠️' },
  related:   { label: '類題',     color: 'orange', emoji: '🔗' },
  intuition: { label: '直感',     color: 'cyan', emoji: '✨' },
}
