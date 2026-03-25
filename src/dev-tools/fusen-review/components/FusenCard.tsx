import type { FusenData } from '../hooks/useFusenData'
import type { JudgmentStatus } from '../types'
import styles from './FusenCard.module.css'

interface Props {
  fusen: FusenData
  judgment: JudgmentStatus | undefined
  currentIndex: number
  totalCount: number
  onJudge: (status: JudgmentStatus) => void
  onResetJudgment: () => void
  onNext: () => void
  onPrev: () => void
}

export function FusenCard({
  fusen, judgment, currentIndex, totalCount,
  onJudge, onResetJudgment, onNext, onPrev,
}: Props) {
  const imgSrc = fusen.imageFile ? `/images/fusens/${fusen.imageFile}` : undefined

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={`${styles.badge} ${styles.badgeId}`}>{fusen.id}</span>
        <span className={`${styles.badge} ${styles.badgeSubject}`}>{fusen.subject}</span>
        <span className={`${styles.badge} ${styles.badgeType}`}>{fusen.noteType}</span>
        <span className={`${styles.badge} ${styles.badgeStatus}`}>{fusen.status}</span>
      </div>
      {imgSrc && <img src={imgSrc} alt={fusen.title} className={styles.imagePreview} />}
      <div className={styles.title}>{fusen.title}</div>
      <div className={styles.body}>{fusen.body}</div>
      <div className={styles.tags}>
        {fusen.tags.map((tag, i) => (
          <span key={i} className={styles.tag}>{tag}</span>
        ))}
      </div>
      <div className={styles.judgmentBar}>
        <button className={`${styles.judgmentBtn} ${styles.btnOk} ${judgment === 'ok' ? styles.judgmentBtnActive : ''}`} onClick={() => onJudge('ok')}>OK [1]</button>
        <button className={`${styles.judgmentBtn} ${styles.btnFix} ${judgment === 'needs-fix' ? styles.judgmentBtnActive : ''}`} onClick={() => onJudge('needs-fix')}>Fix [2]</button>
        <button className={`${styles.judgmentBtn} ${styles.btnNg} ${judgment === 'ng' ? styles.judgmentBtnActive : ''}`} onClick={() => onJudge('ng')}>NG [3]</button>
        <button className={`${styles.judgmentBtn} ${styles.btnReset}`} onClick={onResetJudgment}>Reset [0]</button>
      </div>
      <div className={styles.navBar}>
        <button className={styles.navBtn} onClick={onPrev} disabled={currentIndex === 0}>← Prev [k]</button>
        <span className={styles.position}>{currentIndex + 1} / {totalCount}</span>
        <button className={styles.navBtn} onClick={onNext} disabled={currentIndex >= totalCount - 1}>Next [j] →</button>
      </div>
    </div>
  )
}
