// ユーザー関連の型定義（DB設計spec v1.1 §3.2 準拠）

// --- users テーブル ---
export type UserStatus = 'active' | 'disabled' | 'pending_deletion'
export type UserRole = 'student' | 'graduate' | 'lecturer' | 'admin'

export interface DbUser {
  id: string
  status: UserStatus
  role: UserRole
  created_at: string
  updated_at: string
  deletion_requested_at: string | null
  scheduled_purge_at: string | null
  purged_at: string | null
}

// --- user_profiles テーブル ---
export interface UserProfile {
  user_id: string
  display_name: string | null
  target_exam_year: number | null
  university: string | null
  study_start_date: string | null
  target_score: number | null
  onboarding_completed_at: string | null
  last_active_at: string | null
  created_at: string
  updated_at: string
}

// --- line_accounts テーブル ---
export interface LineAccount {
  user_id: string
  line_user_id: string
  display_name: string | null
  picture_url: string | null
  is_friend: boolean
  friend_added_at: string | null
  created_at: string
  updated_at: string
}
