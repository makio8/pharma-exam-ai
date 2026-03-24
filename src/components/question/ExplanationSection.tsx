import styles from './ExplanationSection.module.css'

interface Props {
  explanation: string
}

export function ExplanationSection({ explanation }: Props) {
  return (
    <div className={styles.card}>
      <p className={styles.title}>💡 解説</p>
      <p className={styles.body}>{explanation}</p>
    </div>
  )
}
