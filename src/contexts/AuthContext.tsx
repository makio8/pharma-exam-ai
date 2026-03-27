/**
 * 認証状態のグローバル管理（Context + Provider）
 *
 * 全コンポーネントが同じ認証状態を参照できるようにする。
 * Supabase Auth のセッション監視 + プロフィール取得 + オンボーディング判定。
 */
import { createContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { User, Session, Provider } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types/user'

export interface AuthState {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  needsOnboarding: boolean
}

export interface AuthActions {
  signInWithLine: () => Promise<void>
  signInWithApple: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export type AuthContextValue = AuthState & AuthActions

export const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  // プロフィール取得（オンボーディング完了判定に使用）
  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabase) return null
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    return data as UserProfile | null
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const p = await fetchProfile(user.id)
    setProfile(p)
    setNeedsOnboarding(!p?.onboarding_completed_at)
  }, [user, fetchProfile])

  // 初回セッション確認 + 認証状態監視
  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // 初回セッション確認
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        const p = await fetchProfile(s.user.id)
        setProfile(p)
        setNeedsOnboarding(!p?.onboarding_completed_at)
      }
      setLoading(false)
    })

    // 認証状態の変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s)
        setUser(s?.user ?? null)
        if (s?.user) {
          const p = await fetchProfile(s.user.id)
          setProfile(p)
          setNeedsOnboarding(!p?.onboarding_completed_at)
        } else {
          setProfile(null)
          setNeedsOnboarding(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signInWithLine = useCallback(async () => {
    if (!supabase) return
    // LINE は Supabase Dashboard で Custom OIDC プロバイダとして登録済み
    // Provider型に line が含まれていないため型アサーションが必要
    await supabase.auth.signInWithOAuth({
      provider: 'line' as Provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'profile openid email',
        queryParams: {
          // LINE Login v2.1: 友だち追加オプション
          // bot_prompt: 'aggressive' → ログイン画面に友だち追加チェックボックスを常時表示
          bot_prompt: 'aggressive',
        },
      },
    })
  }, [])

  const signInWithApple = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'name email',
      },
    })
  }, [])

  const handleSignOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    setNeedsOnboarding(false)
  }, [])

  const value: AuthContextValue = {
    user,
    session,
    profile,
    loading,
    needsOnboarding,
    signInWithLine,
    signInWithApple,
    signOut: handleSignOut,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
