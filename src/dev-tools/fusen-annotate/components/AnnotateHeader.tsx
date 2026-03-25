import styles from './AnnotateHeader.module.css'

interface Props {
  pageId: string
  currentIndex: number
  totalPages: number
  stats: { done: number; skipped: number; remaining: number }
  onPrev: () => void
  onNext: () => void
}

export function AnnotateHeader({ pageId, currentIndex, totalPages, stats, onPrev, onNext }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.nav}>
        <span className={styles.source}>makio</span>
        <button className={styles.navBtn} onClick={onPrev} disabled={currentIndex <= 0}>◀</button>
        <span className={styles.pageInfo}>{pageId} ({currentIndex + 1}/{totalPages})</span>
        <button className={styles.navBtn} onClick={onNext} disabled={currentIndex >= totalPages - 1}>▶</button>
      </div>
      <div className={styles.stats}>
        <span className={styles.statDone}>✅ {stats.done}完了</span>
        <span className={styles.statSkip}>⏭ {stats.skipped}スキップ</span>
        <span className={styles.statRemain}>⏳ {stats.remaining}残り</span>
      </div>
    </header>
  )
}
