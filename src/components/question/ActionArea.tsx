import styles from './ActionArea.module.css'

interface Props {
  canSubmit: boolean
  onSubmit: () => void
  onSkip: () => void
  isAnswered: boolean
}

export function ActionArea({ canSubmit, onSubmit, onSkip, isAnswered }: Props) {
  if (isAnswered) return null

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.submitBtn}
        disabled={!canSubmit}
        aria-disabled={!canSubmit}
        aria-describedby={!canSubmit ? 'submit-hint' : undefined}
        onClick={canSubmit ? onSubmit : undefined}
      >
        解答する
      </button>
      {!canSubmit && (
        <span id="submit-hint" style={{ display: 'none' }}>
          選択肢を選んでから解答できます
        </span>
      )}
      <button
        type="button"
        className={styles.skipBtn}
        onClick={onSkip}
      >
        わからん
      </button>
    </div>
  )
}
