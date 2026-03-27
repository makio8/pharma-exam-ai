/**
 * LINE Account 保存ロジック
 *
 * LINE Login 後に LINE 固有情報（userId, display_name, picture_url, 友だち状態）を
 * line_accounts テーブルに保存する。
 */
import { supabase } from './supabase'
import type { LineAccount } from '../types/user'

/**
 * LINE Login で取得した情報の型。
 * Supabase Auth の user_metadata に LINE から渡されるフィールドを読み取る。
 */
export interface LineUserMetadata {
  /** LINE userId（sub claim） */
  sub: string
  /** LINE 表示名 */
  name?: string
  /** LINE プロフィール画像URL */
  picture?: string
  /** LINE メールアドレス（許可された場合） */
  email?: string
}

/**
 * auth.users.raw_user_meta_data から LINE 固有情報を抽出する。
 * LINE OIDC の ID Token に含まれる claim がここに格納される。
 */
export function extractLineMetadata(
  rawMetadata: Record<string, unknown> | undefined
): LineUserMetadata | null {
  if (!rawMetadata) return null

  const sub = rawMetadata.sub as string | undefined
  if (!sub) return null

  return {
    sub,
    name: (rawMetadata.name as string) ?? (rawMetadata.full_name as string) ?? undefined,
    picture: (rawMetadata.picture as string) ?? (rawMetadata.avatar_url as string) ?? undefined,
    email: rawMetadata.email as string | undefined,
  }
}

/**
 * LINE Login 後に line_accounts テーブルへ保存（UPSERT）。
 * 既存レコードがあれば display_name / picture_url を更新する。
 */
export async function saveLineAccount(
  userId: string,
  metadata: LineUserMetadata
): Promise<{ data: LineAccount | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: 'Supabase未設定' }
  }

  const { data, error } = await supabase
    .from('line_accounts')
    .upsert(
      {
        user_id: userId,
        line_user_id: metadata.sub,
        display_name: metadata.name ?? null,
        picture_url: metadata.picture ?? null,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }
  return { data: data as LineAccount, error: null }
}

/**
 * LINE 友だち追加状態を更新する。
 * LINE Login OAuth レスポンスの friendship_status_changed パラメータから判定。
 */
export async function updateFriendshipStatus(
  userId: string,
  isFriend: boolean
): Promise<void> {
  if (!supabase) return

  await supabase
    .from('line_accounts')
    .update({
      is_friend: isFriend,
      friend_added_at: isFriend ? new Date().toISOString() : null,
    })
    .eq('user_id', userId)
}
