// ログイン画面 — Soft Companion デザイン
// LINE Login + Apple Login の OAuth 認証
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const { signInWithLine, signInWithApple, loading } = useAuth()
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleLineLogin = async () => {
    if (!agreed) {
      setError('利用規約への同意が必要です')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await signInWithLine()
      // OAuth リダイレクトが発生するため、ここには戻らない
    } catch {
      setError('LINEログインに失敗しました。もう一度お試しください。')
      setSubmitting(false)
    }
  }

  const handleAppleLogin = async () => {
    if (!agreed) {
      setError('利用規約への同意が必要です')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await signInWithApple()
      // OAuth リダイレクトが発生するため、ここには戻らない
    } catch {
      setError('Appleログインに失敗しました。もう一度お試しください。')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p style={{ color: 'var(--text-2)' }}>読み込み中...</p>
        </div>
      </div>
    )
  }

  const isDisabled = submitting || !agreed

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>💊</div>
        <h1 className={styles.title}>国試ノート</h1>
        <p className={styles.subtitle}>薬剤師国家試験対策</p>

        {error && <div className={styles.error}>{error}</div>}

        <label className={styles.agreement}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked)
              if (e.target.checked) setError(null)
            }}
          />
          <span className={styles.agreementText}>
            <a
              className={styles.agreementLink}
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
            >
              利用規約
            </a>
            {' と '}
            <a
              className={styles.agreementLink}
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              プライバシーポリシー
            </a>
            に同意する
          </span>
        </label>

        <div className={styles.buttonGroup}>
          <button
            className={styles.lineButton}
            onClick={handleLineLogin}
            disabled={isDisabled}
            type="button"
          >
            <svg className={styles.lineIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            LINEでログイン
          </button>

          <button
            className={styles.appleButton}
            onClick={handleAppleLogin}
            disabled={isDisabled}
            type="button"
          >
            <svg width="20" height="24" viewBox="0 0 17 20" fill="currentColor">
              <path d="M13.545 10.239c-.022-2.234 1.828-3.31 1.912-3.362-1.041-1.52-2.662-1.728-3.239-1.752-1.379-.139-2.692.811-3.392.811-.699 0-1.781-.791-2.926-.77-1.505.022-2.893.875-3.669 2.222-1.563 2.712-.4 6.729 1.124 8.932.744 1.076 1.634 2.284 2.801 2.241 1.123-.045 1.548-.727 2.906-.727 1.358 0 1.739.727 2.924.704 1.21-.022 1.98-1.096 2.72-2.174.857-1.248 1.21-2.455 1.231-2.518-.027-.012-2.362-.907-2.392-3.507zM11.321 3.508c.619-.75 1.036-1.79.922-2.828-.891.036-1.97.594-2.609 1.343-.573.663-1.074 1.722-.94 2.738.995.077 2.009-.505 2.627-1.253z" />
            </svg>
            Appleでログイン
          </button>
        </div>

        <p className={styles.footer}>
          ログインすると学習データがクラウドに保存されます
        </p>
      </div>
    </div>
  )
}
