import type { OfficialNote } from '../../types/official-note'
import { NoteImageViewer } from './NoteImageViewer'
import { useState } from 'react'
import styles from './OfficialNoteCard.module.css'

interface Props {
  note: OfficialNote
  isBookmarked: boolean
  onToggleBookmark: () => void
  onFlashCard: () => void
  flashCardCount?: number
  onImageTap: () => void
}

function ImportanceBadge({ count }: { count: number }) {
  if (count >= 10) {
    return (
      <span className={`${styles.badge} ${styles.badgeHigh}`}>
        🔥 {count}問で使う知識
      </span>
    )
  }
  if (count >= 5) {
    return (
      <span className={`${styles.badge} ${styles.badgeMid}`}>
        📊 {count}問で使う知識
      </span>
    )
  }
  return (
    <span className={`${styles.badge} ${styles.badgeLow}`}>
      📝 {count}問で使う知識
    </span>
  )
}

export function OfficialNoteCard({
  note,
  isBookmarked,
  onToggleBookmark,
  onFlashCard,
  flashCardCount,
  onImageTap,
}: Props) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const isPremium = note.tier === 'premium'

  function handleImageClick() {
    if (!isPremium) {
      setViewerOpen(true)
    }
    onImageTap()
  }

  return (
    <div className={styles.wrapper}>
      <p className={styles.sectionTitle}>📌 この問題の公式付箋</p>
      <div className={styles.card}>
        {/* Image area */}
        <button
          type="button"
          className={styles.imageArea}
          onClick={handleImageClick}
          aria-label="付箋画像を拡大表示"
        >
          <img
            src={note.imageUrl}
            alt={note.title}
            className={`${styles.image} ${isPremium ? styles.imageBlurred : ''}`}
          />
          {isPremium && (
            <div className={styles.lockOverlay}>
              <span className={styles.lockIcon}>🔒</span>
            </div>
          )}
        </button>

        {/* Content area */}
        <div className={styles.content}>
          <p className={styles.title}>{note.title}</p>
          <p className={styles.summary}>{note.textSummary}</p>
          <ImportanceBadge count={note.linkedQuestionIds.length} />

          {isPremium ? (
            <p className={styles.premiumCta}>付箋パックで全付箋を解放</p>
          ) : (
            <div className={styles.actions}>
              <button
                type="button"
                className={`${styles.btn} ${isBookmarked ? styles.btnBookmarked : styles.btnOutline}`}
                onClick={onToggleBookmark}
              >
                {isBookmarked ? '★ 保存済み' : '☆ 保存'}
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnOutline}`}
                onClick={onFlashCard}
                disabled={flashCardCount === 0}
              >
                🃏 暗記カード{flashCardCount !== undefined && flashCardCount > 0 ? ` (${flashCardCount}枚)` : ''}
              </button>
            </div>
          )}
        </div>
      </div>

      <NoteImageViewer
        imageUrl={note.imageUrl}
        title={note.title}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  )
}
