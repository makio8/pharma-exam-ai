import type { Question, QuestionSection } from '../../types/question'
import styles from './QuestionCard.module.css'

interface QuestionCardProps {
  question: Question
  status: 'correct' | 'incorrect' | 'unanswered'
  fieldName?: string
  frequency?: number
  onClick?: () => void
}

const sectionBadge: Record<QuestionSection, { class: string; label: string }> = {
  '必須': { class: styles.badgeBlue, label: '必須' },
  '理論': { class: styles.badgeOrange, label: '理論' },
  '実践': { class: styles.badgeGreen, label: '実践' },
}

const statusIcon = { correct: '✅', incorrect: '❌', unanswered: '—' }

export function QuestionCard({ question, status, fieldName, frequency, onClick }: QuestionCardProps) {
  const badge = sectionBadge[question.section]
  return (
    <div className={styles.card} onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className={styles.top}>
        <span className={`${styles.badge} ${badge.class}`}>{badge.label}</span>
        <span className={styles.number}>第{question.year}回 問{question.question_number}</span>
        <span className={styles.subject}>{question.subject}</span>
        {fieldName && <span className={styles.field}>{fieldName}</span>}
        <span className={styles.status}>{statusIcon[status]}</span>
      </div>
      <div className={styles.text}>{question.question_text}</div>
      <div className={styles.meta}>
        {frequency && frequency >= 3 && (
          <span className={styles.freq}>🔥 頻出（{frequency}回出題）</span>
        )}
      </div>
    </div>
  )
}
