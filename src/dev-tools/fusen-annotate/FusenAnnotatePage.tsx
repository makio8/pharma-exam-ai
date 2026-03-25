import { useState, useCallback, useMemo } from 'react'
import { useAnnotationState } from './hooks/useAnnotationState'
import { useAnnotateKeyboard } from './hooks/useAnnotateKeyboard'
import { AnnotateCanvas } from './components/AnnotateCanvas'
import { AnnotateHeader } from './components/AnnotateHeader'
import { AnnotateToolbar } from './components/AnnotateToolbar'
import type { NormalizedBbox } from './types'
import styles from './FusenAnnotatePage.module.css'

const SOURCE = 'makio'
const TOTAL_SPREADS = 129

function generatePageIds(totalSpreads: number): string[] {
  const ids: string[] = []
  for (let i = 1; i <= totalSpreads; i++) {
    const num = String(i).padStart(3, '0')
    ids.push(`page-${num}-left`, `page-${num}-right`)
  }
  return ids
}

export default function FusenAnnotatePage() {
  const pageIds = useMemo(() => generatePageIds(TOTAL_SPREADS), [])
  const totalPages = pageIds.length

  const {
    state, stats, addBbox, removeBbox, updateBbox,
    confirmPage, skipPage, setLastPosition, getPageBboxes, exportJson,
  } = useAnnotationState(SOURCE)

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (state.lastPosition) {
      const idx = pageIds.indexOf(state.lastPosition)
      if (idx >= 0) return idx
    }
    return 0
  })

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const currentPageId = pageIds[currentIndex]
  const currentBboxes = getPageBboxes(currentPageId)
  const imageUrl = `/images/fusens/sources/${SOURCE}/${currentPageId}.png`

  const navigate = useCallback((idx: number) => {
    if (idx < 0 || idx >= totalPages) return
    setCurrentIndex(idx)
    setSelectedIndex(null)
    setLastPosition(pageIds[idx])
  }, [totalPages, pageIds, setLastPosition])

  const handleConfirm = useCallback(() => {
    confirmPage(currentPageId)
    navigate(currentIndex + 1)
  }, [confirmPage, currentPageId, navigate, currentIndex])

  const handleSkip = useCallback(() => {
    skipPage(currentPageId)
    navigate(currentIndex + 1)
  }, [skipPage, currentPageId, navigate, currentIndex])

  const handleUndo = useCallback(() => {
    if (currentBboxes.length > 0) {
      removeBbox(currentPageId, currentBboxes.length - 1)
      setSelectedIndex(null)
    }
  }, [currentBboxes, removeBbox, currentPageId])

  const handleDeleteSelected = useCallback(() => {
    if (selectedIndex !== null) {
      removeBbox(currentPageId, selectedIndex)
      setSelectedIndex(null)
    }
  }, [selectedIndex, removeBbox, currentPageId])

  const handleJumpToUnfinished = useCallback(() => {
    for (let i = 0; i < pageIds.length; i++) {
      const status = state.pages[pageIds[i]]?.status
      if (!status || status === 'in-progress') {
        navigate(i)
        return
      }
    }
  }, [pageIds, state.pages, navigate])

  const handleExport = useCallback(() => {
    const json = exportJson(totalPages)
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fusen-annotations-${SOURCE}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [exportJson, totalPages])

  const handleAddBbox = useCallback((bbox: NormalizedBbox) => {
    addBbox(currentPageId, bbox)
  }, [addBbox, currentPageId])

  const handleUpdateBbox = useCallback((index: number, bbox: NormalizedBbox) => {
    updateBbox(currentPageId, index, bbox)
  }, [updateBbox, currentPageId])

  useAnnotateKeyboard({
    prevPage: () => navigate(currentIndex - 1),
    nextPage: () => navigate(currentIndex + 1),
    confirm: handleConfirm,
    skip: handleSkip,
    undo: handleUndo,
    deleteBbox: handleDeleteSelected,
    jumpToUnfinished: handleJumpToUnfinished,
    exportData: handleExport,
    toggleHelp: () => setShowHelp(v => !v),
  }, isDrawing)

  return (
    <div className={styles.page}>
      <AnnotateHeader
        pageId={currentPageId}
        currentIndex={currentIndex}
        totalPages={totalPages}
        stats={stats}
        onPrev={() => navigate(currentIndex - 1)}
        onNext={() => navigate(currentIndex + 1)}
      />

      <AnnotateCanvas
        imageUrl={imageUrl}
        bboxes={currentBboxes}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        onAddBbox={handleAddBbox}
        onUpdateBbox={handleUpdateBbox}
        onDrawingChange={setIsDrawing}
      />

      <AnnotateToolbar
        bboxCount={currentBboxes.length}
        hasSelection={selectedIndex !== null}
        onUndo={handleUndo}
        onDelete={handleDeleteSelected}
        onSkip={handleSkip}
        onConfirm={handleConfirm}
        onExport={handleExport}
      />

      {showHelp && (
        <div className={styles.helpOverlay} onClick={() => setShowHelp(false)}>
          <div className={styles.helpBox} onClick={e => e.stopPropagation()}>
            <h3>キーボードショートカット</h3>
            <table>
              <tbody>
                <tr><td>ドラッグ</td><td>bbox描画</td></tr>
                <tr><td>クリック</td><td>bbox選択</td></tr>
                <tr><td>選択+ドラッグ</td><td>bbox移動</td></tr>
                <tr><td>Delete</td><td>選択bbox削除</td></tr>
                <tr><td>Ctrl+Z</td><td>取消（直前1操作）</td></tr>
                <tr><td>← →</td><td>ページ送り</td></tr>
                <tr><td>Enter</td><td>確定→次へ</td></tr>
                <tr><td>s</td><td>付箋なし（スキップ）</td></tr>
                <tr><td>g</td><td>未完了ページへジャンプ</td></tr>
                <tr><td>e</td><td>エクスポート</td></tr>
                <tr><td>?</td><td>このヘルプ</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
