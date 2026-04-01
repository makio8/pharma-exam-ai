// src/components/flashcard/SwipePractice.tsx
// スワイプ練習画面
// - スワイプ評価: 右=good, 左=again（即保存）
// - アンドゥ: 直前1手のみ（SM-2巻き戻しなし。reviewCardはupsert。再スワイプで上書きされるため安全）
// - ゴーストヒント: 初回5枚のみ showGhostHint=true（localStorage 'swipe-hint-seen' で判定）
// - 完了画面: currentIndex >= totalCount → PracticeComplete

import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FlashCardPracticeContext, ReviewResult } from '../../types/card-progress'
import type { FlashCardTemplate } from '../../types/flashcard-template'
import { useCardProgress } from '../../hooks/useCardProgress'
import { SwipeCard } from './SwipeCard'
import { PracticeComplete } from './PracticeComplete'
import styles from './SwipePractice.module.css'

// ---------- 型 ----------

interface Props {
  context: FlashCardPracticeContext
  /** UnifiedTemplateProvider から渡される */
  getTemplate: (id: string) => FlashCardTemplate | undefined
}

interface UndoEntry {
  index: number
  cardId: string
}

// ---------- コンポーネント ----------

export function SwipePractice({ context, getTemplate }: Props) {
  const navigate = useNavigate()
  const { reviewCard } = useCardProgress()

  // ===== カードリスト（undefinedをスキップ） =====
  const validCards = useMemo<{ id: string; card: FlashCardTemplate }[]>(() => {
    return context.cardIds
      .map((id) => {
        const card = getTemplate(id)
        return card ? { id, card } : null
      })
      .filter((x): x is { id: string; card: FlashCardTemplate } => x !== null)
  }, [context.cardIds, getTemplate])

  const totalCount = validCards.length

  // ===== ゴーストヒント =====
  // localStorage 'swipe-hint-seen' が未設定なら初回とみなす
  const isFirstSession = useRef<boolean>(
    typeof localStorage !== 'undefined'
      ? !localStorage.getItem('swipe-hint-seen')
      : false,
  )

  // ===== 状態 =====
  const [currentIndex, setCurrentIndex] = useState(0)
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([])
  /** 完了画面に渡すための結果リスト */
  const [results, setResults] = useState<{ cardId: string; result: ReviewResult }[]>([])

  // ===== 現在のカード =====
  const currentEntry = currentIndex < totalCount ? validCards[currentIndex] : null

  // ===== showGhostHint: 初回 かつ 最初の5枚 =====
  const showGhostHint = isFirstSession.current && currentIndex < 5

  // ===== スワイプ確定ハンドラ =====
  const handleSwipe = useCallback(
    async (result: ReviewResult) => {
      if (!currentEntry) return

      // 即保存（awaitで確実に保存してから次へ）
      await reviewCard(currentEntry.id, result)

      setResults((prev) => [...prev, { cardId: currentEntry.id, result }])
      setUndoStack([{ index: currentIndex, cardId: currentEntry.id }])
      setCurrentIndex((prev) => prev + 1)

      // ヒント表示済みフラグをセット（最初のスワイプ時）
      if (isFirstSession.current && currentIndex === 0) {
        localStorage.setItem('swipe-hint-seen', '1')
        isFirstSession.current = false
      }
    },
    [currentEntry, currentIndex, reviewCard],
  )

  const handleSwipeRight = useCallback(() => handleSwipe('good'), [handleSwipe])
  const handleSwipeLeft = useCallback(() => handleSwipe('again'), [handleSwipe])

  // ===== アンドゥ =====
  // SM-2の巻き戻しは行わない。
  // reviewCardはupsert。再スワイプで上書きされるため安全。
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return
    const entry = undoStack[undoStack.length - 1]
    setCurrentIndex(entry.index)
    setResults((prev) => prev.slice(0, -1))
    setUndoStack([])
  }, [undoStack])

  // ===== 完了画面 =====
  if (currentIndex >= totalCount) {
    const practiceCards = validCards.map((v) => v.card)
    return (
      <PracticeComplete
        results={results}
        practiceCards={practiceCards}
        context={context}
      />
    )
  }

  // ===== プログレス =====
  const progressPct = totalCount > 0 ? (currentIndex / totalCount) * 100 : 0

  // ===== 戻るボタン =====
  const handleBack = () => {
    navigate(context.returnTo)
  }

  return (
    <div className={styles.page}>
      {/* ヘッダー */}
      <div className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={handleBack}
          aria-label="戻る"
        >
          ←
        </button>
        <span className={styles.title}>練習</span>
        <span className={styles.counter}>
          {currentIndex + 1}/{totalCount}
        </span>
      </div>

      {/* プログレスバー */}
      <div
        className={styles.progressBar}
        role="progressbar"
        aria-valuenow={currentIndex}
        aria-valuemax={totalCount}
      >
        <div
          className={styles.progressFill}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* スワイプカード */}
      {currentEntry && (
        <SwipeCard
          key={currentEntry.id}
          card={currentEntry.card}
          onSwipeRight={handleSwipeRight}
          onSwipeLeft={handleSwipeLeft}
          showGhostHint={showGhostHint}
          sessionCardIndex={currentIndex}
        />
      )}

      {/* アンドゥボタン（直前1手のみ） */}
      {undoStack.length > 0 && (
        <button
          type="button"
          className={styles.undoBtn}
          onClick={handleUndo}
          aria-label="直前のカードに戻る"
        >
          ↩ 戻す
        </button>
      )}
    </div>
  )
}
