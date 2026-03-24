import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { Question } from '../../types/question'
import { Chip } from '../ui/Chip'
import styles from './MetaAccordion.module.css'

interface Props {
  question: Question
  topicName?: string
}

interface MetaRowProps {
  label: string
  value: string
}

function MetaRow({ label, value }: MetaRowProps) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{value}</span>
    </div>
  )
}

export function MetaAccordion({ question, topicName }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsOpen((prev) => !prev)
    }
  }

  const correctRateText =
    question.correct_rate !== undefined
      ? `${Math.round(question.correct_rate * 100)}%`
      : '—'

  return (
    <div className={styles.container}>
      <div
        className={styles.header}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
      >
        <span className={styles.headerText}>
          {isOpen ? '▾ 問題の詳細情報' : '▸ 問題の詳細情報'}
        </span>
      </div>

      <div
        className={`${styles.body} ${isOpen ? styles.bodyOpen : ''}`}
        aria-hidden={!isOpen}
      >
        <div className={styles.content}>
          <MetaRow label="回次" value={`第${question.year}回`} />
          <MetaRow label="区分" value={question.section} />
          <MetaRow label="科目" value={question.subject} />
          {topicName && <MetaRow label="分野" value={topicName} />}
          <MetaRow label="正答率" value={correctRateText} />

          {question.tags.length > 0 && (
            <div className={styles.tagsRow}>
              <span className={styles.rowLabel}>タグ</span>
              <div className={styles.chips}>
                {question.tags.map((tag) => (
                  <Chip key={tag} label={tag} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
