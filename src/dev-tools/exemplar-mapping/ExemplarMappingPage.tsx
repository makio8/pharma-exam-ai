// src/dev-tools/exemplar-mapping/ExemplarMappingPage.tsx
import { useState, useMemo, useCallback } from 'react'
import { useMappingData } from './hooks/useMappingData'
import { useMappingReviewState } from './hooks/useMappingReviewState'
import { useMappingKeyboardNav } from './hooks/useMappingKeyboardNav'
import { MappingCard } from './components/MappingCard'
import type { NoteExemplarMappingsFile, NoteExemplarMatch } from '../../types/note-exemplar-mapping'
import type { EntryReviewStatus } from './types'
import styles from './ExemplarMappingPage.module.css'

export default function ExemplarMappingPage() {
  const { entries, loading, error } = useMappingData()
  const reviewState = useMappingReviewState()
  const { state, setMatchStatus, togglePrimary, setEntryStatus, setLastPosition, approveAll, rejectAll, resetEntry } = reviewState
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [showHelp, setShowHelp] = useState(false)

  const initializedIndex = useMemo(() => {
    if (entries.length === 0) return 0
    if (state.lastPosition) {
      const idx = entries.findIndex(e => e.noteId === state.lastPosition)
      if (idx >= 0) return idx
    }
    return 0
  }, [entries, state.lastPosition])

  const safeIndex = currentIndex ?? initializedIndex
  const currentEntry = entries[safeIndex]

  const stats = useMemo(() => {
    let approved = 0, modified = 0, rejected = 0
    for (const entry of entries) {
      const s = state.entryStatuses[entry.noteId]
      if (s === 'approved') approved++
      else if (s === 'modified') modified++
      else if (s === 'rejected') rejected++
    }
    return { approved, modified, rejected, pending: entries.length - approved - modified - rejected }
  }, [entries, state.entryStatuses])

  const navigate = useCallback((delta: number) => {
    setCurrentIndex(prev => {
      const next = Math.max(0, Math.min(entries.length - 1, (prev ?? initializedIndex) + delta))
      const entry = entries[next]
      if (entry) setLastPosition(entry.noteId)
      return next
    })
  }, [entries, initializedIndex, setLastPosition])

  const handleApproveAll = useCallback(() => {
    if (!currentEntry) return
    approveAll(currentEntry.noteId, currentEntry.matches.map(m => m.exemplarId))
  }, [currentEntry, approveAll])

  const handleModified = useCallback(() => {
    if (!currentEntry) return
    setEntryStatus(currentEntry.noteId, 'modified')
  }, [currentEntry, setEntryStatus])

  const handleRejectAll = useCallback(() => {
    if (!currentEntry) return
    rejectAll(currentEntry.noteId, currentEntry.matches.map(m => m.exemplarId))
  }, [currentEntry, rejectAll])

  const handleReset = useCallback(() => {
    if (!currentEntry) return
    resetEntry(currentEntry.noteId, currentEntry.matches.map(m => m.exemplarId))
  }, [currentEntry, resetEntry])

  const handleJumpToNextUnresolved = useCallback(() => {
    const start = (currentIndex ?? initializedIndex) + 1
    for (let i = start; i < entries.length; i++) {
      if (!state.entryStatuses[entries[i].noteId]) {
        setCurrentIndex(i)
        setLastPosition(entries[i].noteId)
        return
      }
    }
    for (let i = 0; i < start; i++) {
      if (!state.entryStatuses[entries[i].noteId]) {
        setCurrentIndex(i)
        setLastPosition(entries[i].noteId)
        return
      }
    }
  }, [currentIndex, initializedIndex, entries, state.entryStatuses, setLastPosition])

  const handleExport = useCallback(() => {
    if (entries.length === 0) return
    const exported: NoteExemplarMappingsFile = {
      version: 1,
      generatedAt: new Date().toISOString(),
      generatedBy: 'claude-session',
      noteCount: entries.length,
      mappings: entries.map(entry => {
        const entryStatus = state.entryStatuses[entry.noteId] ?? entry.reviewStatus
        const mergedMatches: NoteExemplarMatch[] = entry.matches.map(m => {
          const key = `${entry.noteId}:${m.exemplarId}`
          return {
            ...m,
            status: state.matchStatuses[key] ?? m.status,
            isPrimary: state.primaryOverrides[key] ?? m.isPrimary,
          }
        })
        return {
          noteId: entry.noteId,
          noteTitle: entry.noteTitle,
          subject: entry.subject,
          topicId: entry.topicId,
          matches: mergedMatches,
          reviewStatus: entryStatus as EntryReviewStatus,
          reviewedAt: entryStatus !== 'pending' ? new Date().toISOString() : undefined,
        }
      }),
    }
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'note-exemplar-mappings-reviewed.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [entries, state])

  useMappingKeyboardNav({
    onNext: () => navigate(1),
    onPrev: () => navigate(-1),
    onApprove: handleApproveAll,
    onModified: handleModified,
    onReject: handleRejectAll,
    onReset: handleReset,
    onJumpToNextUnresolved: handleJumpToNextUnresolved,
    onExport: handleExport,
    onToggleHelp: () => setShowHelp(v => !v),
  })

  if (loading) return <div className={styles.loading}>読み込み中...</div>
  if (error) return <div className={styles.page}><div className={styles.error}>{error}</div></div>
  if (entries.length === 0) return <div className={styles.page}><div className={styles.empty}>マッピングデータがありません</div></div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>Exemplar Mapping Review</div>
        <div className={styles.stats}>
          <span className={styles.statApproved}>✅ {stats.approved}</span>
          <span className={styles.statModified}>✏️ {stats.modified}</span>
          <span className={styles.statRejected}>❌ {stats.rejected}</span>
          <span className={styles.statPending}>⏳ {stats.pending}</span>
        </div>
      </div>
      <div className={styles.content}>
        {currentEntry && (
          <MappingCard
            entry={currentEntry}
            reviewState={state}
            currentIndex={safeIndex}
            totalCount={entries.length}
            onSetMatchStatus={setMatchStatus}
            onTogglePrimary={togglePrimary}
            onApproveAll={handleApproveAll}
            onModified={handleModified}
            onRejectAll={handleRejectAll}
            onReset={handleReset}
            onNext={() => navigate(1)}
            onPrev={() => navigate(-1)}
          />
        )}
      </div>
      <div className={styles.footer}>
        <button className={styles.exportBtn} onClick={handleExport}>
          📥 Export JSON [e]
        </button>
        <span className={styles.helpHint}>? でショートカット一覧</span>
      </div>
      {showHelp && (
        <div className={styles.helpOverlay} onClick={() => setShowHelp(false)}>
          <div className={styles.helpModal}>
            <h3>キーボードショートカット</h3>
            <table>
              <tbody>
                <tr><td>j / →</td><td>次の付箋</td></tr>
                <tr><td>k / ←</td><td>前の付箋</td></tr>
                <tr><td>1</td><td>Approve（全候補承認）</td></tr>
                <tr><td>2</td><td>Modified（変更あり）</td></tr>
                <tr><td>3</td><td>Reject（全候補却下）</td></tr>
                <tr><td>0</td><td>Reset</td></tr>
                <tr><td>g</td><td>次の未レビューへ</td></tr>
                <tr><td>e</td><td>Export JSON</td></tr>
                <tr><td>?</td><td>このヘルプ</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
