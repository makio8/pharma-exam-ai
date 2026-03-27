// オンボーディングページ — 初回ログイン時に表示
// 受験年度、目標点数、大学名（任意）を設定する
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import styles from './OnboardingPage.module.css'

/** 受験年度の選択肢を生成（現在年〜+2年） */
function getExamYearOptions(): number[] {
  const currentYear = new Date().getFullYear()
  return [currentYear, currentYear + 1, currentYear + 2]
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const [targetExamYear, setTargetExamYear] = useState<number | ''>('')
  const [targetScore, setTargetScore] = useState<number | ''>('')
  const [university, setUniversity] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!user || !supabase) return
    if (!targetExamYear) {
      setError('受験年度を選択してください')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          target_exam_year: targetExamYear || null,
          target_score: targetScore || null,
          university: university.trim() || null,
          onboarding_completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (upsertError) {
        setError(`保存に失敗しました: ${upsertError.message}`)
        return
      }

      await refreshProfile()
      navigate('/', { replace: true })
    } catch {
      setError('保存中にエラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = async () => {
    if (!user || !supabase) return
    setSubmitting(true)

    try {
      // スキップ時もオンボーディング完了として記録
      await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          onboarding_completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      await refreshProfile()
      navigate('/', { replace: true })
    } catch {
      navigate('/', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  const examYears = getExamYearOptions()

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>はじめまして!</h1>
        <p className={styles.subtitle}>
          あなたに合った学習プランのために教えてください
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="examYear">
            受験年度
          </label>
          <select
            id="examYear"
            className={styles.select}
            value={targetExamYear}
            onChange={(e) => setTargetExamYear(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">選択してください</option>
            {examYears.map(year => (
              <option key={year} value={year}>
                {year}年（第{year - 1916}回）
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="targetScore">
            目標点数
            <span className={styles.optional}>任意</span>
          </label>
          <input
            id="targetScore"
            type="number"
            className={styles.input}
            value={targetScore}
            onChange={(e) => {
              const v = e.target.value
              setTargetScore(v === '' ? '' : Math.min(345, Math.max(0, Number(v))))
            }}
            placeholder="例: 260"
            min={0}
            max={345}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="university">
            大学名
            <span className={styles.optional}>任意</span>
          </label>
          <input
            id="university"
            type="text"
            className={styles.input}
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="例: 東京薬科大学"
          />
        </div>

        <button
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={submitting}
          type="button"
        >
          はじめる
        </button>

        <button
          className={styles.skipButton}
          onClick={handleSkip}
          disabled={submitting}
          type="button"
        >
          あとで設定する
        </button>
      </div>
    </div>
  )
}
