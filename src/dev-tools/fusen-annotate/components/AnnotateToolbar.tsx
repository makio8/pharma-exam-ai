import styles from './AnnotateToolbar.module.css'

interface Props {
  bboxCount: number
  hasSelection: boolean
  onUndo: () => void
  onDelete: () => void
  onSkip: () => void
  onConfirm: () => void
  onExport: () => void
}

export function AnnotateToolbar({
  bboxCount, hasSelection, onUndo, onDelete, onSkip, onConfirm, onExport,
}: Props) {
  return (
    <footer className={styles.toolbar}>
      <div className={styles.row}>
        <span className={styles.count}>bbox: {bboxCount}枚</span>
        <button className={styles.btn} onClick={onUndo} disabled={bboxCount === 0}>↩ 取消</button>
        <button className={styles.btn} onClick={onDelete} disabled={!hasSelection}>🗑 削除</button>
        <button className={styles.btnExport} onClick={onExport}>📥 Export</button>
      </div>
      <div className={styles.row}>
        <button className={styles.btnSkip} onClick={onSkip}>⏭ 付箋なし</button>
        <button className={styles.btnConfirm} onClick={onConfirm}>✅ 確定 → 次へ</button>
      </div>
    </footer>
  )
}
