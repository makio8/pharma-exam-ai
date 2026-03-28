import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FusenLibraryCore } from '../../utils/fusen-library-core'
import type { OfficialNote } from '../../types/official-note'
import type { KeyboardEvent } from 'react'
import styles from './FusenThumbnail.module.css'

interface Props {
  note: OfficialNote
  isBookmarked: boolean
}

export const FusenThumbnail = memo(function FusenThumbnail({ note, isBookmarked }: Props) {
  const navigate = useNavigate()
  const badge = FusenLibraryCore.getImportanceBadge(note.importance)

  const handleClick = () => navigate(`/notes/${note.id}`)
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleClick()
  }

  return (
    <div
      className={styles.thumbnail}
      role="link"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <img
        src={note.imageUrl}
        alt={note.title}
        className={styles.image}
        loading="lazy"
      />
      <div className={styles.info}>
        <div className={styles.title}>{note.title}</div>
        <div className={styles.meta}>
          {isBookmarked && <span className={styles.bookmarked}>★</span>}
          {badge && <span className={styles.badge}>{badge.emoji} {badge.label}</span>}
        </div>
      </div>
    </div>
  )
})
