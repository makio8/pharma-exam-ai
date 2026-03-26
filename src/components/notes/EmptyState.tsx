import { useNavigate } from 'react-router-dom'
import styles from './EmptyState.module.css'

export function EmptyState() {
  const navigate = useNavigate()
  return (
    <div className={styles.container}>
      <div className={styles.icon}>🔖</div>
      <p className={styles.message}>まだ付箋を保存していません</p>
      <p className={styles.hint}>
        演習で問題を解くと、関連する付箋が表示されます。<br />
        ★ をタップして保存しよう！
      </p>
      <button className={styles.cta} onClick={() => navigate('/practice')}>
        演習を始める
      </button>
    </div>
  )
}
