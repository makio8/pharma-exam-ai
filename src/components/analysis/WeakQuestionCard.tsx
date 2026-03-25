// src/components/analysis/WeakQuestionCard.tsx
import type { Question } from '../../types/question'
import styles from './WeakQuestionCard.module.css'

interface Props {
  question: Question
  incorrectCount?: number
  isMissedEssential?: boolean
  onReview: () => void
}

export function WeakQuestionCard({ question, incorrectCount, isMissedEssential, onReview }: Props) {
  return (
    <div
      className={styles.card}
      role="button"
      tabIndex={0}
      onClick={onReview}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onReview() } }}
    >
      <div className={styles.left}>
        <div className={styles.meta}>
          <span className={styles.subject}>{question.subject}</span>
          {isMissedEssential && <span className={styles.essentialTag}>必須</span>}
        </div>
        <span className={styles.questionLabel}>
          第{question.year}回 問{question.question_number}
        </span>
      </div>
      <div className={styles.right}>
        {incorrectCount != null && incorrectCount > 0 && (
          <span className={styles.incorrectBadge}>❌ {incorrectCount}回</span>
        )}
        <button type="button" className={styles.reviewBtn} onClick={(e) => { e.stopPropagation(); onReview() }}>
          復習 →
        </button>
      </div>
    </div>
  )
}
