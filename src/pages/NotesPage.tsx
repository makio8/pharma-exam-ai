// src/pages/NotesPage.tsx — Soft Companion フル書き換え
import { useState } from 'react'
import { useFusenLibrary } from '../hooks/useFusenLibrary'
import { Chip } from '../components/ui/Chip'
import { FloatingNav } from '../components/ui/FloatingNav'
import { FusenGrid } from '../components/notes/FusenGrid'
import { EmptyState } from '../components/notes/EmptyState'
import styles from './NotesPage.module.css'

type Tab = 'my' | 'all'

export function NotesPage() {
  const [tab, setTab] = useState<Tab>('my')
  const { allGrouped, bookmarkedGrouped, bookmarkedFusens, bookmarkedIds } = useFusenLibrary()

  const groups = tab === 'my' ? bookmarkedGrouped : allGrouped
  const showEmpty = tab === 'my' && bookmarkedFusens.length === 0

  return (
    <div className="sc-page">
      <div className={styles.page}>
        <h1 className={styles.pageTitle}>ノート</h1>

        <div className={styles.tabs}>
          <Chip label="マイ付箋" active={tab === 'my'} onClick={() => setTab('my')} />
          <Chip label="全付箋" active={tab === 'all'} onClick={() => setTab('all')} />
        </div>

        {showEmpty ? (
          <EmptyState />
        ) : (
          <FusenGrid groups={groups} bookmarkedIds={bookmarkedIds} />
        )}
      </div>
      <FloatingNav />
    </div>
  )
}
