// src/components/analysis/HistoryItem.tsx
import styles from './HistoryItem.module.css'

interface Props {
  isCorrect: boolean
  isSkipped: boolean
  answeredAt: string
  subject: string
  year: number
  questionNumber: number
  timeSpentSeconds?: number
  onTap: () => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const mo = d.getMonth() + 1
  const day = d.getDate()
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${mo}/${day} ${h}:${m}`
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function HistoryItem({
  isCorrect,
  isSkipped,
  answeredAt,
  subject,
  year,
  questionNumber,
  timeSpentSeconds,
  onTap,
}: Props) {
  const icon = isSkipped ? '🤷' : isCorrect ? '✅' : '❌'
  const showTime = timeSpentSeconds != null && timeSpentSeconds > 0

  return (
    <div
      className={styles.row}
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap() } }}
      aria-label={`${subject} 第${year}回 問${questionNumber} ${isSkipped ? 'スキップ' : isCorrect ? '正解' : '不正解'}`}
    >
      <span className={styles.icon}>{icon}</span>
      <span className={styles.date}>{formatDate(answeredAt)}</span>
      <span className={styles.label}>
        {subject} - 第{year}回 問{questionNumber}
      </span>
      {showTime && (
        <span className={styles.time}>⏱ {formatTime(timeSpentSeconds!)}</span>
      )}
    </div>
  )
}
