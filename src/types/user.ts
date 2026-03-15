// ユーザープロフィール型

export type UserRole = 'student' | 'graduate' | 'lecturer'

export interface UserProfile {
  id: string
  display_name: string
  grade?: number          // 学年 (1〜6)
  exam_year?: number      // 受験予定年（例: 2027）
  role: UserRole
  pass_year?: number      // 合格年（任意）
  created_at: string
}
