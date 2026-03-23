import { Link, useLocation } from 'react-router-dom'
import styles from './FloatingNav.module.css'

const NAV_ITEMS = [
  { path: '/', icon: '🏠', label: 'ホーム' },
  { path: '/practice', icon: '📝', label: '演習' },
  { path: '/notes', icon: '📌', label: 'ノート' },
  { path: '/analysis', icon: '📊', label: '分析' },
] as const

export function FloatingNav() {
  const { pathname } = useLocation()

  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`${styles.item} ${pathname === item.path ? styles.active : ''}`}
        >
          <span className={styles.icon}>{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
