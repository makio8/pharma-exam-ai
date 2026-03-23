import { useMemo } from 'react'
import { getMajorCategoriesForSubject } from '../../utils/blueprint-helpers'
import type { QuestionSubject } from '../../types/question'
import styles from './SubFieldChips.module.css'

interface SubFieldChipsProps {
  subject: QuestionSubject
  selectedMajors: string[]
  onToggle: (majorName: string) => void
}

export function SubFieldChips({ subject, selectedMajors, onToggle }: SubFieldChipsProps) {
  const majors = useMemo(
    () => getMajorCategoriesForSubject(subject),
    [subject]
  )

  if (majors.length === 0) return null

  return (
    <div className={styles.section}>
      <div className={styles.label}>📂 {subject}の分野</div>
      <div className={styles.row}>
        {majors.map(m => (
          <button
            key={m.name}
            type="button"
            className={`${styles.chip} ${selectedMajors.includes(m.name) ? styles.active : ''}`}
            onClick={() => onToggle(m.name)}
          >
            {m.name}
          </button>
        ))}
      </div>
    </div>
  )
}
