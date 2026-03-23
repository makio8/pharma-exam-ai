import { useMemo } from 'react'
import { getMajorCategoriesForSubject } from '../../utils/blueprint-helpers'
import type { QuestionSubject } from '../../types/question'
import styles from './SubFieldChips.module.css'

interface SubFieldChipsProps {
  subject: QuestionSubject
  selectedMajors: string[]
  onToggleMajor: (majorName: string) => void
  selectedMiddles: string[]
  onToggleMiddle: (middleId: string) => void
}

export function SubFieldChips({
  subject,
  selectedMajors,
  onToggleMajor,
  selectedMiddles,
  onToggleMiddle,
}: SubFieldChipsProps) {
  const majors = useMemo(
    () => getMajorCategoriesForSubject(subject),
    [subject]
  )

  if (majors.length === 0) return null

  // 選択中の大項目の中項目を表示
  const expandedMajors = majors.filter(m => selectedMajors.includes(m.name))

  return (
    <div className={styles.section}>
      <div className={styles.label}>📂 {subject}の分野</div>
      <div className={styles.row}>
        {majors.map(m => (
          <button
            key={m.name}
            type="button"
            className={`${styles.chip} ${selectedMajors.includes(m.name) ? styles.active : ''}`}
            onClick={() => onToggleMajor(m.name)}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* 中項目（MiddleCategory）の展開 */}
      {expandedMajors.map(major => (
        <div key={major.name} className={styles.subSection}>
          <div className={styles.subLabel}>📎 {major.name}</div>
          <div className={styles.row}>
            {major.middleCategories.map(mc => (
              <button
                key={mc.id}
                type="button"
                className={`${styles.subChip} ${selectedMiddles.includes(mc.id) ? styles.subActive : ''}`}
                onClick={() => onToggleMiddle(mc.id)}
              >
                {mc.name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
