import styles from './KeyboardHelp.module.css'

interface KeyboardHelpProps {
  onClose: () => void
}

interface ShortcutRow {
  keys: string[]
  label: string
}

interface ShortcutGroup {
  title: string
  shortcuts: ShortcutRow[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'ナビゲーション',
    shortcuts: [
      { keys: ['J', '→'], label: '次の問題' },
      { keys: ['K', '←'], label: '前の問題' },
      { keys: ['S'], label: 'スキップ（判定せず次へ）' },
      { keys: ['G'], label: '次の未解決 issue へ' },
      { keys: ['/'], label: '問題ID 検索' },
    ],
  },
  {
    title: '判定',
    shortcuts: [
      { keys: ['1'], label: 'OK' },
      { keys: ['2'], label: '要修正' },
      { keys: ['3'], label: 'NG' },
      { keys: ['0'], label: '判定リセット' },
    ],
  },
  {
    title: 'パネル操作',
    shortcuts: [
      { keys: ['F'], label: 'フィルタ 開閉' },
      { keys: ['C'], label: '修正パネル 開閉' },
      { keys: ['E'], label: 'エクスポート' },
    ],
  },
  {
    title: 'PDF',
    shortcuts: [
      { keys: ['P'], label: '前のページ' },
      { keys: ['N'], label: '次のページ' },
    ],
  },
]

export function KeyboardHelp({ onClose }: KeyboardHelpProps) {
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal aria-label="キーボードショートカット一覧">
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>キーボードショートカット</h2>
          <button className={styles.closeBtn} onClick={onClose} type="button">
            閉じる
          </button>
        </div>

        <div className={styles.grid}>
          {SHORTCUT_GROUPS.map(group => (
            <div key={group.title} className={styles.group}>
              <p className={styles.groupTitle}>{group.title}</p>
              {group.shortcuts.map(({ keys, label }) => (
                <div key={label} className={styles.row}>
                  {keys.map(k => (
                    <kbd key={k} className={styles.key}>{k}</kbd>
                  ))}
                  <span className={styles.label}>{label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <p className={styles.footer}>
          input / textarea にフォーカス中はショートカット無効 &nbsp;|&nbsp; ? キーで開閉
        </p>
      </div>
    </div>
  )
}
