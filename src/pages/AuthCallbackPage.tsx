// OAuth コールバック処理ページ
// Supabase Auth がセッションを自動処理した後、
// LINE Login の場合は line_accounts テーブルに保存し、オンボーディング判定を行う。
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { extractLineMetadata, saveLineAccount, updateFriendshipStatus } from '../lib/line-account'
import styles from './LoginPage.module.css'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const { user, loading, needsOnboarding, refreshProfile } = useAuth()
  const [processing, setProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return

    if (!user) {
      // 認証失敗 → ログイン画面に戻す
      navigate('/login', { replace: true })
      return
    }

    const handleCallback = async () => {
      try {
        // LINE Login の場合: line_accounts に保存
        const lineMetadata = extractLineMetadata(
          user.user_metadata as Record<string, unknown> | undefined
        )
        if (lineMetadata) {
          await saveLineAccount(user.id, lineMetadata)

          // 友だち追加状態をURLパラメータから取得
          const params = new URLSearchParams(window.location.search)
          const friendshipChanged = params.get('friendship_status_changed')
          if (friendshipChanged === 'true') {
            await updateFriendshipStatus(user.id, true)
          }
        }

        // プロフィール再取得（オンボーディング判定）
        await refreshProfile()

        // 遷移先決定
        if (needsOnboarding) {
          navigate('/onboarding', { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      } catch {
        setError('ログイン処理中にエラーが発生しました')
      } finally {
        setProcessing(false)
      }
    }

    handleCallback()
  }, [user, loading, needsOnboarding, navigate, refreshProfile])

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.error}>{error}</div>
          <button
            className={styles.lineButton}
            onClick={() => navigate('/login', { replace: true })}
            type="button"
            style={{ background: 'var(--accent)' }}
          >
            ログイン画面に戻る
          </button>
        </div>
      </div>
    )
  }

  if (loading || processing) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logo}>💊</div>
          <p style={{ color: 'var(--text-2)', fontFamily: 'var(--font)' }}>
            ログイン処理中...
          </p>
        </div>
      </div>
    )
  }

  return null
}
