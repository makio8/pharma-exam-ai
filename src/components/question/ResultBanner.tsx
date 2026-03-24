import styles from './ResultBanner.module.css'

interface Props {
  isCorrect: boolean
  isSkipped: boolean
  correctAnswer: number | number[]
  elapsedSeconds: number
}

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}秒`
  }
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatAnswer(answer: number | number[]): string {
  if (Array.isArray(answer)) {
    return answer.join(', ')
  }
  return String(answer)
}

export function ResultBanner({ isCorrect, isSkipped, correctAnswer, elapsedSeconds }: Props) {
  const bannerClass = isSkipped
    ? styles.skipped
    : isCorrect
      ? styles.correct
      : styles.incorrect

  return (
    <div
      className={`${styles.banner} ${bannerClass}`}
      aria-live="polite"
      role="status"
    >
      <div className={styles.iconRow}>
        <span className={styles.icon}>
          {isSkipped ? '🤷' : isCorrect ? '✅' : '❌'}
        </span>
        <span className={styles.label}>
          {isSkipped
            ? `スキップ — 正解は ${formatAnswer(correctAnswer)}`
            : isCorrect
              ? '正解！'
              : `不正解 — 正解は ${formatAnswer(correctAnswer)}`}
        </span>
      </div>
      <span className={styles.time}>{formatTime(elapsedSeconds)}</span>
    </div>
  )
}
