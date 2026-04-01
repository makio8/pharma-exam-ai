// 認証必須ガードコンポーネント
// 未認証 → /login にリダイレクト
// オンボーディング未完了 → /onboarding にリダイレクト
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { isSupabaseConfigured } from '../../lib/supabase'

/** プロトタイプモード: VITE_PROTOTYPE_MODE=true で認証スキップ（トライアルユーザー向け） */
const isPrototypeMode = import.meta.env.VITE_PROTOTYPE_MODE === 'true'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, needsOnboarding } = useAuth()
  const location = useLocation()

  // プロトタイプモード or Supabase未設定 → 認証スキップ
  if (isPrototypeMode || !isSupabaseConfigured) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        fontFamily: 'var(--font)',
        color: 'var(--text-2)',
      }}>
        読み込み中...
      </div>
    )
  }

  if (!user) {
    // 現在のパスを state に保存（ログイン後にリダイレクト用）
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
