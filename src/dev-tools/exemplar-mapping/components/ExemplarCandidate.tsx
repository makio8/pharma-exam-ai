// src/dev-tools/exemplar-mapping/components/ExemplarCandidate.tsx
import type { NoteExemplarMatch } from '../../../types/note-exemplar-mapping'
import type { Exemplar } from '../../../types/blueprint'
import type { MatchStatus } from '../types'
import styles from './ExemplarCandidate.module.css'

interface Props {
  match: NoteExemplarMatch
  exemplar: Exemplar | undefined
  /** localStorage から読み取った承認状態（未設定なら match.status を使用） */
  reviewedStatus: MatchStatus | undefined
  /** localStorage から読み取った primary 変更（未設定なら match.isPrimary を使用） */
  primaryOverride: boolean | undefined
  onApprove: () => void
  onReject: () => void
  onTogglePrimary: (currentIsPrimary: boolean) => void
}

export function ExemplarCandidate({
  match, exemplar, reviewedStatus, primaryOverride,
  onApprove, onReject, onTogglePrimary,
}: Props) {
  const status = reviewedStatus ?? match.status
  const isPrimary = primaryOverride ?? match.isPrimary

  const statusIcon = status === 'approved' ? '✅'
    : status === 'rejected' ? '❌'
    : '⏳'

  const candidateClass = [
    styles.candidate,
    isPrimary ? styles.candidatePrimary : styles.candidateSecondary,
    status === 'rejected' ? styles.candidateRejected : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={candidateClass}>
      <div className={styles.topRow}>
        <span className={styles.statusIcon}>{statusIcon}</span>
        <span className={`${styles.roleBadge} ${isPrimary ? styles.rolePrimary : styles.roleSecondary}`}>
          {isPrimary ? 'Primary' : 'Secondary'}
        </span>
        <span className={styles.confidence}>{(match.confidence * 100).toFixed(0)}%</span>
      </div>
      <div className={styles.exemplarId}>{match.exemplarId}</div>
      <div className={styles.exemplarText}>
        {exemplar?.text ?? '（Exemplar が見つかりません）'}
      </div>
      {exemplar && (
        <div className={styles.category}>
          📁 {exemplar.minorCategory} &gt; {exemplar.middleCategoryId}
        </div>
      )}
      <div className={styles.reasoning}>💬 {match.reasoning}</div>
      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${status === 'approved' ? styles.actionBtnApproved : ''}`}
          onClick={onApprove}
        >
          ✅ 承認
        </button>
        <button
          className={`${styles.actionBtn} ${status === 'rejected' ? styles.actionBtnRejected : ''}`}
          onClick={onReject}
        >
          ❌ 却下
        </button>
        <button className={styles.actionBtn} onClick={() => onTogglePrimary(isPrimary)}>
          🔄 {isPrimary ? 'Secondary に' : 'Primary に'}
        </button>
      </div>
    </div>
  )
}
