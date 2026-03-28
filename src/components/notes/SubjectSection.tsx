import { FusenThumbnail } from './FusenThumbnail'
import type { OfficialNote } from '../../types/official-note'
import styles from './SubjectSection.module.css'

interface Props {
  subject: string
  fusens: OfficialNote[]
  bookmarkedIds: Set<string>
  /** 初期状態で開くか（マイ付箋タブ=true、全付箋タブ=false） */
  defaultOpen?: boolean
}

export function SubjectSection({ subject, fusens, bookmarkedIds, defaultOpen = false }: Props) {
  return (
    <details className={styles.section} open={defaultOpen || undefined}>
      <summary className={styles.header}>
        <span className={styles.title}>{subject}</span>
        <span className={styles.count}>{fusens.length}枚</span>
        <span className={styles.chevron} aria-hidden="true" />
      </summary>
      <div className={styles.grid} role="list">
        {fusens.map(note => (
          <div key={note.id} role="listitem">
            <FusenThumbnail
              note={note}
              isBookmarked={bookmarkedIds.has(note.id)}
            />
          </div>
        ))}
      </div>
    </details>
  )
}
