import { useNavigate } from 'react-router-dom'
import type { QuestionSubject } from '../types/question'
import styles from './TodayMenu.module.css'

interface TodayMenuProps {
  weakestTopic?: {
    topicId: string
    subject: QuestionSubject
    middleCategory: string
    correctRate: number
  }
  dueCardsCount: number
  almostMasteredTopic?: {
    topicId: string
    subject: QuestionSubject
    middleCategory: string
    correctRate: number
  }
  yesterdayMistakeCount: number
}

export function TodayMenu({
  weakestTopic,
  dueCardsCount,
  almostMasteredTopic,
  yesterdayMistakeCount,
}: TodayMenuProps) {
  const navigate = useNavigate()

  const hasPriority = !!weakestTopic
  const hasReview = dueCardsCount > 0 || yesterdayMistakeCount > 0
  const hasChallenge = !!almostMasteredTopic

  if (!hasPriority && !hasReview && !hasChallenge) {
    return <div className={styles.fallback}>今日のメニューはまだありません。まず演習を始めてみましょう！</div>
  }

  return (
    <>
      {hasPriority && (
        <div
          className={`${styles.card} ${styles.priority}`}
          onClick={() => navigate(`/practice?subject=${encodeURIComponent(weakestTopic!.subject)}`)}
        >
          <span className={styles.icon}>🔴</span>
          <div className={styles.content}>
            <span className={`${styles.badge} ${styles.badgeRed}`}>優先</span>
            <div className={styles.title}>苦手克服：{weakestTopic!.subject} {weakestTopic!.middleCategory}</div>
            <div className={styles.desc}>正答率 {Math.round(weakestTopic!.correctRate * 100)}% → 復習しよう</div>
          </div>
          <span className={styles.arrow}>›</span>
        </div>
      )}

      {hasReview && (
        <div
          className={`${styles.card} ${styles.review}`}
          onClick={() => dueCardsCount > 0 ? navigate('/cards/review') : navigate('/practice')}
        >
          <span className={styles.icon}>🟡</span>
          <div className={styles.content}>
            <span className={`${styles.badge} ${styles.badgeYellow}`}>復習</span>
            <div className={styles.title}>
              {dueCardsCount > 0
                ? `復習カード ${dueCardsCount}枚`
                : `昨日の間違い ${yesterdayMistakeCount}問`
              }
            </div>
            <div className={styles.desc}>
              {dueCardsCount > 0
                ? `暗記カードの復習期限です（約${Math.max(1, Math.ceil(dueCardsCount * 6 / 60))}分）`
                : '昨日間違えた問題を復習しよう'
              }
            </div>
          </div>
          <span className={styles.arrow}>›</span>
        </div>
      )}

      {hasChallenge && (
        <div
          className={`${styles.card} ${styles.challenge}`}
          onClick={() => navigate(`/practice?subject=${encodeURIComponent(almostMasteredTopic!.subject)}`)}
        >
          <span className={styles.icon}>🟣</span>
          <div className={styles.content}>
            <span className={`${styles.badge} ${styles.badgePurple}`}>チャレンジ</span>
            <div className={styles.title}>頻出テーマ：{almostMasteredTopic!.middleCategory}</div>
            <div className={styles.desc}>もう少しでマスター！正答率 {Math.round(almostMasteredTopic!.correctRate * 100)}%</div>
          </div>
          <span className={styles.arrow}>›</span>
        </div>
      )}
    </>
  )
}
