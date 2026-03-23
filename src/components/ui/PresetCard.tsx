import styles from './PresetCard.module.css'

export interface PresetConfig {
  id: string
  icon: string
  title: string
  description: string
  badge?: string
}

interface PresetCardGridProps {
  presets: PresetConfig[]
  activeId: string | null
  onSelect: (id: string) => void
}

export function PresetCardGrid({ presets, activeId, onSelect }: PresetCardGridProps) {
  return (
    <div className={styles.grid}>
      {presets.map(p => (
        <button
          key={p.id}
          type="button"
          className={`${styles.card} ${activeId === p.id ? styles.active : ''}`}
          onClick={() => onSelect(p.id)}
        >
          {p.badge && <span className={styles.badge}>{p.badge}</span>}
          <div className={styles.emoji}>{p.icon}</div>
          <div className={styles.title}>{p.title}</div>
          <div className={styles.desc}>{p.description}</div>
        </button>
      ))}
    </div>
  )
}
