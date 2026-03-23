import { Chip } from './Chip'
import styles from './ChipFilter.module.css'

type ChipVariant = 'default' | 'blue' | 'green'

interface ChipFilterProps<T extends string | number> {
  label: string
  items: { value: T; label: string; variant?: ChipVariant }[]
  selected: T[]
  onToggle: (value: T) => void
}

export function ChipFilter<T extends string | number>({
  label,
  items,
  selected,
  onToggle,
}: ChipFilterProps<T>) {
  return (
    <div className={styles.section}>
      <div className={styles.label}>{label}</div>
      <div className={styles.row}>
        {items.map(item => (
          <Chip
            key={String(item.value)}
            label={item.label}
            active={selected.includes(item.value)}
            variant={item.variant ?? 'default'}
            onClick={() => onToggle(item.value)}
          />
        ))}
      </div>
    </div>
  )
}
