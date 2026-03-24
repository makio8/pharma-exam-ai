import styles from './ProgressHeader.module.css'

interface Props {
  subject: string
  currentIndex: number  // 0-based
  totalCount: number
  canGoPrev: boolean
  canGoNext: boolean
  onPrev?: () => void
  onNext?: () => void
}

export function ProgressHeader({
  subject,
  currentIndex,
  totalCount,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
}: Props) {
  return (
    <div className={styles.header}>
      <span className={styles.subject}>{subject}</span>
      <span className={styles.progress}>
        問 {currentIndex + 1}/{totalCount}
      </span>
      <div className={styles.navGroup}>
        <button
          type="button"
          className={styles.navBtn}
          disabled={!canGoPrev}
          onClick={onPrev}
          aria-label="前の問題"
        >
          ←
        </button>
        <button
          type="button"
          className={styles.navBtn}
          disabled={!canGoNext}
          onClick={onNext}
          aria-label="次の問題"
        >
          →
        </button>
      </div>
    </div>
  )
}
