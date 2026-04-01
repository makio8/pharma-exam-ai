import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalytics } from '../hooks/useAnalytics'
import { useTopicMastery } from '../hooks/useTopicMastery'
import { useCardProgress } from '../hooks/useCardProgress'
import { DecoWave } from '../components/ui/DecoWave'
import { StatCircles } from '../components/ui/StatCircle'
import { SubjectMastery } from '../components/ui/SubjectMastery'
import { FloatingNav } from '../components/ui/FloatingNav'
import { TodayMenu } from '../components/TodayMenu'
import styles from './HomePage.module.css'

export function HomePage() {
  const navigate = useNavigate()
  const { totalAnswered, isEmpty, streakDays, yesterdayMistakeCount } = useAnalytics()
  const { allTopics } = useTopicMastery()
  const { dueProgress } = useCardProgress()

  // Find weakest topic (learning with lowest correctRate, or first not_started)
  const weakestTopic = useMemo(() => {
    const notStarted = allTopics.find(t => t.status === 'not_started')
    if (notStarted) return notStarted
    const learning = allTopics
      .filter(t => t.status === 'learning')
      .sort((a, b) => a.correctRate - b.correctRate)
    return learning[0]
  }, [allTopics])

  // Find almost mastered topic
  const almostMasteredTopic = useMemo(() => {
    return allTopics
      .filter(t => t.status === 'almost')
      .sort((a, b) => b.correctRate - a.correctRate)[0]
  }, [allTopics])

  // Welcome screen for first-time users
  if (isEmpty) {
    return (
      <div className="sc-page">
        <DecoWave />
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💊</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            国試ノートへようこそ！
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 32, lineHeight: 1.6 }}>
            11年分・3,470問の過去問で<br />薬剤師国家試験対策を始めましょう
          </p>
          <button
            type="button"
            onClick={() => navigate('/practice')}
            style={{
              background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
              color: '#fff',
              border: 'none',
              padding: '14px 32px',
              borderRadius: 'var(--r)',
              fontSize: 16,
              fontWeight: 700,
              fontFamily: 'var(--font)',
              boxShadow: 'var(--shadow-cta)',
              cursor: 'pointer',
            }}
          >
            ▶ 最初の演習を始める
          </button>
        </div>
        <FloatingNav />
      </div>
    )
  }

  return (
    <div className="sc-page">
      <DecoWave />

      {/* Header */}
      <div className={styles.header}>
        <span className={styles.title}>💊 国試ノート</span>
        {streakDays > 0 && (
          <span className={styles.streak}>🔥 {streakDays}日連続</span>
        )}
      </div>
      <div className={styles.greeting}>こんにちは！今日も頑張りましょう 💪</div>

      {/* Today's Menu */}
      <div className="section-title">🎯 今日のメニュー</div>
      <TodayMenu
        weakestTopic={weakestTopic ? {
          topicId: weakestTopic.topicId,
          subject: weakestTopic.subject,
          middleCategory: weakestTopic.middleCategory,
          correctRate: weakestTopic.correctRate,
        } : undefined}
        dueCardsCount={dueProgress.length}
        almostMasteredTopic={almostMasteredTopic ? {
          topicId: almostMasteredTopic.topicId,
          subject: almostMasteredTopic.subject,
          middleCategory: almostMasteredTopic.middleCategory,
          correctRate: almostMasteredTopic.correctRate,
        } : undefined}
        yesterdayMistakeCount={yesterdayMistakeCount}
      />

      {/* Stats */}
      <div className="section-title">📈 がんばり記録</div>
      <StatCircles stats={[
        { value: totalAnswered, label: '解いた問題', color: 'blue' },
        { value: dueProgress.length, label: '復習カード', color: 'yellow' },
        { value: streakDays, label: '連続学習', color: 'orange' },
      ]} />

      {/* Subject Mastery */}
      <div className="section-title">📊 科目べつ進み具合</div>
      <SubjectMastery />

      {/* Quick Actions */}
      <div className="section-title">⚡ クイックアクション</div>
      <div className={styles.quickActions}>
        <button type="button" className={styles.qaBtn} onClick={() => navigate('/practice')}>
          <div className={styles.qaIcon}>📝</div>
          <div className={styles.qaLabel}>自分で選ぶ</div>
        </button>
        <button type="button" className={styles.qaBtn} onClick={() => navigate('/notes')}>
          <div className={styles.qaIcon}>📌</div>
          <div className={styles.qaLabel}>付箋</div>
        </button>
        <button type="button" className={styles.qaBtn} onClick={() => {
          // Quick random 10 — navigate to practice with random preset
          navigate('/practice')
        }}>
          <div className={styles.qaIcon}>🎲</div>
          <div className={styles.qaLabel}>ランダム10</div>
        </button>
      </div>

      <FloatingNav />
    </div>
  )
}
