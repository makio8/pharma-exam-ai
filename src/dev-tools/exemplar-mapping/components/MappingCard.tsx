// src/dev-tools/exemplar-mapping/components/MappingCard.tsx
import type { MappingDataEntry } from '../hooks/useMappingData'
import type { MappingReviewState } from '../types'
import { ExemplarCandidate } from './ExemplarCandidate'
import { OFFICIAL_NOTES } from '../../../data/official-notes'
import styles from './MappingCard.module.css'

interface Props {
  entry: MappingDataEntry
  reviewState: MappingReviewState
  currentIndex: number
  totalCount: number
  onSetMatchStatus: (noteId: string, exemplarId: string, status: 'approved' | 'rejected') => void
  onTogglePrimary: (noteId: string, exemplarId: string, currentIsPrimary: boolean) => void
  onApproveAll: () => void
  onModified: () => void
  onRejectAll: () => void
  onReset: () => void
  onNext: () => void
  onPrev: () => void
}

export function MappingCard({
  entry, reviewState, currentIndex, totalCount,
  onSetMatchStatus, onTogglePrimary,
  onApproveAll, onModified, onRejectAll, onReset,
  onNext, onPrev,
}: Props) {
  const note = OFFICIAL_NOTES.find(n => n.id === entry.noteId)
  const entryStatus = reviewState.entryStatuses[entry.noteId] ?? entry.reviewStatus

  return (
    <div className={styles.card}>
      {/* ヘッダー: ID + 科目 + topicId */}
      <div className={styles.header}>
        <span className={`${styles.badge} ${styles.badgeId}`}>{entry.noteId}</span>
        <span className={`${styles.badge} ${styles.badgeSubject}`}>{entry.subject}</span>
        <span className={`${styles.badge} ${styles.badgeTopic}`}>{entry.topicId}</span>
        {entry.matches.length === 0 && (
          <span className={`${styles.badge} ${styles.badgeNeedsManual}`}>要手動</span>
        )}
      </div>

      {/* 付箋画像 */}
      {note?.imageUrl && (
        <img src={note.imageUrl} alt={entry.noteTitle} className={styles.imagePreview} />
      )}

      {/* タイトル + テキストサマリー */}
      <div className={styles.title}>{entry.noteTitle}</div>
      {note?.textSummary && <div className={styles.summary}>{note.textSummary}</div>}

      {/* タグ */}
      {note?.tags && (
        <div className={styles.tags}>
          {note.tags.map((tag, i) => (
            <span key={i} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}

      {/* Exemplar 候補セクション */}
      <div className={styles.sectionTitle}>
        Exemplar 候補 ({entry.matches.length}件)
      </div>

      {entry.matches.length === 0 ? (
        <div className={styles.noCandidates}>
          ⚠️ マッチする Exemplar がありません。手動で追加が必要です。
        </div>
      ) : (
        <div className={styles.candidates}>
          {entry.matches.map(match => {
            const key = `${entry.noteId}:${match.exemplarId}`
            return (
              <ExemplarCandidate
                key={match.exemplarId}
                match={match}
                exemplar={entry.exemplarMap.get(match.exemplarId)}
                reviewedStatus={reviewState.matchStatuses[key]}
                primaryOverride={reviewState.primaryOverrides[key]}
                onApprove={() => onSetMatchStatus(entry.noteId, match.exemplarId, 'approved')}
                onReject={() => onSetMatchStatus(entry.noteId, match.exemplarId, 'rejected')}
                onTogglePrimary={(currentIsPrimary) => onTogglePrimary(entry.noteId, match.exemplarId, currentIsPrimary)}
              />
            )
          })}
        </div>
      )}

      {/* 判定バー（needs-manual は approve/modified 不可） */}
      {entry.matches.length > 0 ? (
        <div className={styles.judgmentBar}>
          <button
            className={`${styles.judgmentBtn} ${styles.btnApprove} ${entryStatus === 'approved' ? styles.judgmentBtnActive : ''}`}
            onClick={onApproveAll}
          >Approve [1]</button>
          <button
            className={`${styles.judgmentBtn} ${styles.btnModified} ${entryStatus === 'modified' ? styles.judgmentBtnActive : ''}`}
            onClick={onModified}
          >Modified [2]</button>
          <button
            className={`${styles.judgmentBtn} ${styles.btnReject} ${entryStatus === 'rejected' ? styles.judgmentBtnActive : ''}`}
            onClick={onRejectAll}
          >Reject [3]</button>
          <button className={`${styles.judgmentBtn} ${styles.btnReset}`} onClick={onReset}>
            Reset [0]
          </button>
        </div>
      ) : (
        <div className={styles.noCandidates}>
          手動追加は Claude Code セッションで実行してください
        </div>
      )}

      {/* ナビ */}
      <div className={styles.navBar}>
        <button className={styles.navBtn} onClick={onPrev} disabled={currentIndex === 0}>
          ← Prev [k]
        </button>
        <span className={styles.position}>{currentIndex + 1} / {totalCount}</span>
        <button className={styles.navBtn} onClick={onNext} disabled={currentIndex >= totalCount - 1}>
          Next [j] →
        </button>
      </div>
    </div>
  )
}
