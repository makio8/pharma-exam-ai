import styles from './Choice.module.css'

export type ChoiceState = 'default' | 'selected' | 'correct' | 'incorrect' | 'dimmed'

export interface ChoiceCardProps {
  choiceKey: number
  text: string
  state: ChoiceState
  isMulti: boolean
  disabled: boolean
  onClick: () => void
}

const stateClass: Record<ChoiceState, string> = {
  default: styles.default,
  selected: styles.selected,
  correct: styles.correct,
  incorrect: styles.incorrect,
  dimmed: styles.dimmed,
}

export function ChoiceCard({
  choiceKey,
  text,
  state,
  isMulti,
  disabled,
  onClick,
}: ChoiceCardProps) {
  const role = isMulti ? 'checkbox' : 'radio'
  const isChecked = state === 'selected' || state === 'correct' || state === 'incorrect'

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!disabled) onClick()
    }
  }

  return (
    <div
      className={`${styles.choice} ${stateClass[state]}`}
      role={role}
      aria-checked={isChecked}
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
    >
      <span className={styles.choiceNumber}>{choiceKey}</span>
      <span className={styles.choiceText}>{text}</span>
    </div>
  )
}
