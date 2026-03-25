import { useState, useMemo, useCallback } from 'react'
import { useFusenData } from './hooks/useFusenData'
import { useFusenReviewState } from './hooks/useFusenReviewState'
import { useFusenKeyboardNav } from './hooks/useFusenKeyboardNav'
import { FusenCard } from './components/FusenCard'
import type { JudgmentStatus } from './types'
import styles from './FusenReviewPage.module.css'

export default function FusenReviewPage() {
  const { fusens, loading, error } = useFusenData()
  const { state, setJudgment, setLastPosition } = useFusenReviewState()
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)

  const initializedIndex = useMemo(() => {
    if (fusens.length === 0) return 0
    if (state.lastPosition) {
      const idx = fusens.findIndex(f => f.id === state.lastPosition)
      if (idx >= 0) return idx
    }
    return 0
  }, [fusens, state.lastPosition])

  const safeIndex = currentIndex ?? initializedIndex
  const currentFusen = fusens[safeIndex]

  const stats = useMemo(() => {
    const ok = Object.values(state.judgments).filter(j => j === 'ok').length
    const fix = Object.values(state.judgments).filter(j => j === 'needs-fix').length
    const ng = Object.values(state.judgments).filter(j => j === 'ng').length
    return { ok, fix, ng, pending: fusens.length - ok - fix - ng }
  }, [state.judgments, fusens.length])

  const navigate = useCallback((delta: number) => {
    setCurrentIndex(prev => {
      const next = Math.max(0, Math.min(fusens.length - 1, (prev ?? initializedIndex) + delta))
      const fusen = fusens[next]
      if (fusen) setLastPosition(fusen.id)
      return next
    })
  }, [fusens, initializedIndex, setLastPosition])

  const handleJudge = useCallback((status: JudgmentStatus) => {
    if (!currentFusen) return
    setJudgment(currentFusen.id, status)
  }, [currentFusen, setJudgment])

  const handleResetJudgment = useCallback(() => {
    if (!currentFusen) return
    const { [currentFusen.id]: _, ...rest } = state.judgments
    localStorage.setItem('fusen-review-v1', JSON.stringify({
      ...state, judgments: rest, updatedAt: new Date().toISOString(),
    }))
    window.location.reload()
  }, [currentFusen, state])

  const handleJumpToNextUnresolved = useCallback(() => {
    const start = (currentIndex ?? initializedIndex) + 1
    for (let i = start; i < fusens.length; i++) {
      if (!state.judgments[fusens[i].id]) {
        setCurrentIndex(i)
        setLastPosition(fusens[i].id)
        return
      }
    }
    for (let i = 0; i < start; i++) {
      if (!state.judgments[fusens[i].id]) {
        setCurrentIndex(i)
        setLastPosition(fusens[i].id)
        return
      }
    }
  }, [currentIndex, initializedIndex, fusens, state.judgments, setLastPosition])

  useFusenKeyboardNav({
    onNext: () => navigate(1),
    onPrev: () => navigate(-1),
    onJudge: handleJudge,
    onResetJudgment: handleResetJudgment,
    onJumpToNextUnresolved: handleJumpToNextUnresolved,
    onToggleHelp: () => {},
  })

  if (loading) return <div className={styles.loading}>読み込み中...</div>
  if (error) return <div className={styles.page}><div className={styles.error}>{error}</div></div>
  if (fusens.length === 0) return <div className={styles.page}><div className={styles.empty}>レビュー対象の付箋がありません</div></div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>付箋レビュー</div>
        <div className={styles.stats}>
          <span className={styles.statOk}>✅ {stats.ok}</span>
          <span className={styles.statFix}>✏️ {stats.fix}</span>
          <span className={styles.statNg}>🗑️ {stats.ng}</span>
          <span className={styles.statPending}>⏳ {stats.pending}</span>
        </div>
      </div>
      <div className={styles.content}>
        {currentFusen && (
          <FusenCard
            fusen={currentFusen}
            judgment={state.judgments[currentFusen.id]}
            currentIndex={safeIndex}
            totalCount={fusens.length}
            onJudge={handleJudge}
            onResetJudgment={handleResetJudgment}
            onNext={() => navigate(1)}
            onPrev={() => navigate(-1)}
          />
        )}
      </div>
      <div className={styles.helpHint}>? でショートカット一覧</div>
    </div>
  )
}
