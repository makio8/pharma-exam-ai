import { BottomSheet } from '../ui/BottomSheet'
import styles from './NoteImageViewer.module.css'

interface Props {
  imageUrl: string
  title: string
  open: boolean
  onClose: () => void
}

export function NoteImageViewer({ imageUrl, title, open, onClose }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className={styles.imageWrapper}>
        <img
          src={imageUrl}
          alt={title}
          className={styles.image}
        />
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
    </BottomSheet>
  )
}
