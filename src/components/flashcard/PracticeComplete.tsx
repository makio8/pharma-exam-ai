// src/components/flashcard/PracticeComplete.tsx
// 練習完了画面 — Soft Companion デザイン

import { useNavigate } from 'react-router-dom'
import type { FlashCardPracticeContext, ReviewResult } from '../../types/card-progress'
import type { FlashCardTemplate } from '../../types/flashcard-template'
import { useLearningLinks } from '../../hooks/useLearningLinks'
import { buildNextActions, calculateStats } from '../../utils/practice-complete-logic'
import styles from './PracticeComplete.module.css'

interface Props {
  results: { cardId: string; result: ReviewResult }[]
  practiceCards: FlashCardTemplate[]
  context: FlashCardPracticeContext
}

export function PracticeComplete({ results, practiceCards, context }: Props) {
  const navigate = useNavigate()
  const linkService = useLearningLinks()

  const stats = calculateStats(results)
  const actions = buildNextActions(results, practiceCards, linkService)

  const completionEmoji = stats.isPerfect ? '🎉' : '✅'

  const handleAction = (type: string, questionIds?: string[]) => {
    if (type === 'go_home') {
      navigate('/')
      return
    }
    if (type === 'more_practice') {
      navigate(context.returnTo)
      return
    }
    if (type === 'related_questions' && questionIds && questionIds.length > 0) {
      // 関連問題の最初の問題へ遷移
      navigate(`/practice/${questionIds[0]}`)
      return
    }
  }

  return (
    <div className={styles.page}>
      {/* ヘッダー */}
      <div className={styles.header}>
        <span className={styles.emoji} role="img" aria-label="完了">
          {completionEmoji}
        </span>
        <p className={styles.title}>練習完了！</p>
        {stats.isPerfect && (
          <span className={styles.perfectBadge}>パーフェクト！</span>
        )}
      </div>

      {/* 統計 */}
      {stats.total > 0 && (
        <div className={styles.statsRow}>
          <div className={`${styles.statBox} ${styles.statOk}`}>
            <span className={styles.statNumber}>{stats.ok}</span>
            <span className={styles.statLabel}>OK</span>
          </div>
          <div className={`${styles.statBox} ${styles.statAgain}`}>
            <span className={styles.statNumber}>{stats.again}</span>
            <span className={styles.statLabel}>もう1回</span>
          </div>
        </div>
      )}

      {/* 次アクション */}
      <div className={styles.actionsSection}>
        <p className={styles.actionsTitle}>次は何をしますか？</p>
        {actions.map(action => (
          <button
            key={action.type}
            className={styles.actionBtn}
            onClick={() => handleAction(action.type, action.questionIds)}
          >
            <span className={styles.actionBtnEmoji} role="img" aria-hidden>
              {action.emoji}
            </span>
            <span className={styles.actionBtnLabel}>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
