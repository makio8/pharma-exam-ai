import styles from './ProgressBar.module.css'

type BarColor = 'green' | 'yellow' | 'red' | 'gray' | 'accent'

interface ProgressBarProps {
  percent: number
  color?: BarColor
  size?: 'default' | 'small'
}

function autoColor(percent: number): BarColor {
  if (percent === 0) return 'gray'
  if (percent >= 70) return 'green'
  if (percent >= 30) return 'yellow'
  return 'red'
}

export function ProgressBar({ percent, color, size = 'default' }: ProgressBarProps) {
  const c = color ?? autoColor(percent)
  return (
    <div className={`${styles.bar} ${size === 'small' ? styles.small : ''}`}>
      <div
        className={`${styles.fill} ${styles[c]}`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  )
}
