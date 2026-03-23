import styles from './StatCircle.module.css'

interface Stat {
  value: number
  label: string
  color: 'blue' | 'yellow' | 'orange'
}

interface StatCirclesProps {
  stats: Stat[]
}

export function StatCircles({ stats }: StatCirclesProps) {
  return (
    <div className={styles.container}>
      {stats.map(s => (
        <div key={s.label} className={`${styles.circle} ${styles[s.color]}`}>
          <span className={styles.num}>{s.value}</span>
          <span className={styles.label}>{s.label}</span>
        </div>
      ))}
    </div>
  )
}
