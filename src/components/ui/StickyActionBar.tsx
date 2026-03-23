import styles from './StickyActionBar.module.css'

interface StickyActionBarProps {
  count: number
  onStart: () => void
  onSettings?: () => void
  disabled?: boolean
}

export function StickyActionBar({ count, onStart, onSettings, disabled }: StickyActionBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.barInner}>
        <button
          type="button"
          className={styles.startBtn}
          onClick={onStart}
          disabled={disabled || count === 0}
        >
          ▶ 演習開始（{count}問）
        </button>
        {onSettings && (
          <button type="button" className={styles.settingsBtn} onClick={onSettings}>
            ⚙
          </button>
        )}
      </div>
    </div>
  )
}
