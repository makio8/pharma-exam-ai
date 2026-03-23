import styles from './Chip.module.css'

type ChipVariant = 'default' | 'blue' | 'green'

interface ChipProps {
  label: string
  active?: boolean
  variant?: ChipVariant
  onClick?: () => void
}

const variantClass: Record<ChipVariant, string> = {
  default: styles.active,
  blue: styles.activeBlue,
  green: styles.activeGreen,
}

export function Chip({ label, active = false, variant = 'default', onClick }: ChipProps) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${active ? variantClass[variant] : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
