import { FusenThumbnail } from './FusenThumbnail'
import type { OfficialNote } from '../../types/official-note'
import styles from './SubjectSection.module.css'

interface Props {
  subject: string
  fusens: OfficialNote[]
  bookmarkedIds: Set<string>
}

export function SubjectSection({ subject, fusens, bookmarkedIds }: Props) {
  return (
    <section>
      <div className={styles.header}>
        <h2 className={styles.title}>{subject}</h2>
        <span className={styles.count}>{fusens.length}枚</span>
      </div>
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
    </section>
  )
}
