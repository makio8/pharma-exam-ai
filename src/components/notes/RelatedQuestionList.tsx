import { useNavigate } from 'react-router-dom'
import type { RelatedQuestionItem } from '../../hooks/useFusenDetail'
import styles from './RelatedQuestionList.module.css'

interface Props {
  questions: RelatedQuestionItem[]
}

const STATUS_LABEL = { correct: '✅ 済', incorrect: '❌ 済', unanswered: '未' } as const

export function RelatedQuestionList({ questions }: Props) {
  const navigate = useNavigate()

  if (questions.length === 0) return null

  return (
    <section>
      <h3 className={styles.heading}>この知識を使う問題（{questions.length}問）</h3>
      <div className={styles.list}>
        {questions.map(q => (
          <button
            key={q.questionId}
            className={styles.item}
            onClick={() => navigate(`/practice/${q.questionId}`)}
          >
            <span className={styles.label}>{q.displayLabel}</span>
            <span className={styles.status}>{STATUS_LABEL[q.userStatus]}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
