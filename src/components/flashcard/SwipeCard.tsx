// src/components/flashcard/SwipeCard.tsx
// 2層アーキテクチャのスワイプカード
// 外層: translateX + rotate（スワイプ変形）
// 内層: rotateY（フリップ変形）
// ドラッグ中のDOM更新は rAF で直接操作し React re-render を抑制

import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { FlashCardTemplate } from '../../types/flashcard-template'
import { CARD_FORMAT_CONFIG } from '../../types/flashcard-template'
import { parseCloze } from '../../utils/cloze-parser'
import {
  evaluateSwipe,
  calculateSwipeProgress,
  calculateRotation,
  isDiagonalSwipe,
} from '../../utils/swipe-gesture'
import styles from './SwipeCard.module.css'

// ---------- 型 ----------

type CardState =
  | 'frontIdle'
  | 'flipping'
  | 'backIdle'
  | 'dragging'
  | 'resolved'
  | 'advancing'

interface Props {
  card: FlashCardTemplate
  onSwipeRight: () => void
  onSwipeLeft: () => void
  showGhostHint: boolean
  sessionCardIndex: number
}

// ---------- コンポーネント ----------

export function SwipeCard({
  card,
  onSwipeRight,
  onSwipeLeft,
  showGhostHint,
  sessionCardIndex,
}: Props) {
  // ===== state =====
  const [cardState, setCardState] = useState<CardState>('frontIdle')
  const [isFlipped, setIsFlipped] = useState(false)

  // ===== ref =====
  const swipeLayerRef = useRef<HTMLDivElement>(null)
  const flipInnerRef = useRef<HTMLDivElement>(null)
  const bgRightRef = useRef<HTMLDivElement>(null)
  const bgLeftRef = useRef<HTMLDivElement>(null)
  const ghostRightRef = useRef<HTMLDivElement>(null)
  const ghostLeftRef = useRef<HTMLDivElement>(null)

  // ドラッグ状態（ref: rAF内から最新値を参照）
  const dragStartXRef = useRef(0)
  const dragStartYRef = useRef(0)
  const isDiagonalRef = useRef(false)
  const rafIdRef = useRef<number | null>(null)
  const currentOffsetRef = useRef(0)

  // cardState の最新値を rAF 内で参照するための ref
  const cardStateRef = useRef<CardState>('frontIdle')
  useEffect(() => {
    cardStateRef.current = cardState
  }, [cardState])

  // reduced-motion フラグ
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  // ===== カード切替時リセット =====
  useEffect(() => {
    // card.id が変わったら状態を初期化
    setCardState('frontIdle')
    setIsFlipped(false)
    // swipeLayer の transform をクリア
    if (swipeLayerRef.current) {
      swipeLayerRef.current.style.transform = ''
      swipeLayerRef.current.style.opacity = ''
    }
    if (bgRightRef.current) bgRightRef.current.style.opacity = '0'
    if (bgLeftRef.current) bgLeftRef.current.style.opacity = '0'
    if (ghostRightRef.current) ghostRightRef.current.style.opacity = '0'
    if (ghostLeftRef.current) ghostLeftRef.current.style.opacity = '0'
  }, [card.id])

  // ===== フリップ処理 =====
  const handleFlip = useCallback(() => {
    if (cardStateRef.current !== 'frontIdle') return
    setCardState('flipping')
    setIsFlipped(true)
    const flipDuration = prefersReducedMotion.current ? 50 : 500
    setTimeout(() => {
      setCardState('backIdle')
    }, flipDuration)
  }, [])

  // ===== ドラッグ開始 =====
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    if (cardStateRef.current !== 'backIdle') return
    dragStartXRef.current = clientX
    dragStartYRef.current = clientY
    isDiagonalRef.current = false
    currentOffsetRef.current = 0
    setCardState('dragging')
  }, [])

  // ===== ドラッグ移動（rAFでDOM直接操作） =====
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (cardStateRef.current !== 'dragging') return
    const deltaX = clientX - dragStartXRef.current
    const deltaY = clientY - dragStartYRef.current

    // 斜めスワイプ判定（最初のmoveのみ）
    if (Math.abs(deltaX) < 5 && Math.abs(deltaY) < 5) return
    if (Math.abs(deltaX) < 12 && !isDiagonalRef.current) {
      isDiagonalRef.current = isDiagonalSwipe(deltaX, deltaY)
    }
    if (isDiagonalRef.current) return

    currentOffsetRef.current = deltaX

    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current)
    rafIdRef.current = requestAnimationFrame(() => {
      const el = swipeLayerRef.current
      if (!el) return
      const width = el.offsetWidth || 320
      const offset = currentOffsetRef.current
      const rotation = calculateRotation(offset, width)
      el.style.transform = `translateX(${offset}px) rotate(${rotation}deg)`

      // フィードバック背景
      const progress = calculateSwipeProgress(offset, width)
      if (bgRightRef.current) {
        bgRightRef.current.style.opacity = offset > 0 ? String(progress * 0.8) : '0'
      }
      if (bgLeftRef.current) {
        bgLeftRef.current.style.opacity = offset < 0 ? String(progress * 0.8) : '0'
      }

      // ゴーストヒント
      if (showGhostHint && cardStateRef.current === 'dragging') {
        const show = progress > 0.4
        if (ghostRightRef.current) {
          ghostRightRef.current.style.opacity = offset > 0 && show ? '1' : '0'
        }
        if (ghostLeftRef.current) {
          ghostLeftRef.current.style.opacity = offset < 0 && show ? '1' : '0'
        }
      }
      rafIdRef.current = null
    })
  }, [showGhostHint])

  // ===== ドラッグ終了 =====
  const handleDragEnd = useCallback(() => {
    if (cardStateRef.current !== 'dragging') return
    const el = swipeLayerRef.current
    if (!el) return
    const width = el.offsetWidth || 320
    const direction = evaluateSwipe(currentOffsetRef.current, width)

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    // ゴーストヒント非表示
    if (ghostRightRef.current) ghostRightRef.current.style.opacity = '0'
    if (ghostLeftRef.current) ghostLeftRef.current.style.opacity = '0'

    if (direction !== 'none') {
      // --- 確定: 飛ばすアニメーション ---
      setCardState('resolved')
      const flyX = direction === 'right' ? width * 1.5 : -width * 1.5
      const flyRot = direction === 'right' ? 30 : -30
      el.style.transition = 'transform 0.3s ease-in, opacity 0.3s ease-in'
      el.style.transform = `translateX(${flyX}px) rotate(${flyRot}deg)`
      el.style.opacity = '0'
      setCardState('advancing')
      setTimeout(() => {
        el.style.transition = ''
        el.style.transform = ''
        el.style.opacity = ''
        if (bgRightRef.current) bgRightRef.current.style.opacity = '0'
        if (bgLeftRef.current) bgLeftRef.current.style.opacity = '0'
        if (direction === 'right') onSwipeRight()
        else onSwipeLeft()
      }, 320)
    } else {
      // --- 戻す: スナップバック ---
      el.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      el.style.transform = 'translateX(0px) rotate(0deg)'
      if (bgRightRef.current) bgRightRef.current.style.opacity = '0'
      if (bgLeftRef.current) bgLeftRef.current.style.opacity = '0'
      const onEnd = () => {
        el.style.transition = ''
        el.removeEventListener('transitionend', onEnd)
      }
      el.addEventListener('transitionend', onEnd)
      setCardState('backIdle')
    }
    currentOffsetRef.current = 0
  }, [onSwipeRight, onSwipeLeft])

  // ===== マウスstale closure対策: refに格納 =====
  const dragMoveRef = useRef(handleDragMove)
  const dragEndRef = useRef(handleDragEnd)
  useEffect(() => { dragMoveRef.current = handleDragMove }, [handleDragMove])
  useEffect(() => { dragEndRef.current = handleDragEnd }, [handleDragEnd])

  // ===== マウスイベント =====
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (cardStateRef.current !== 'backIdle') return
      e.preventDefault()
      handleDragStart(e.clientX, e.clientY)
      const move = (me: MouseEvent) => dragMoveRef.current(me.clientX, me.clientY)
      const up = () => {
        dragEndRef.current()
        document.removeEventListener('mousemove', move)
        document.removeEventListener('mouseup', up)
      }
      document.addEventListener('mousemove', move)
      document.addEventListener('mouseup', up)
    },
    [handleDragStart],
  )

  // ===== タッチイベント =====
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const state = cardStateRef.current
      if (state === 'frontIdle') {
        handleFlip()
        return
      }
      if (state !== 'backIdle') return
      const t = e.touches[0]
      handleDragStart(t.clientX, t.clientY)
    },
    [handleFlip, handleDragStart],
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (cardStateRef.current !== 'dragging') return
      const t = e.touches[0]
      handleDragMove(t.clientX, t.clientY)
    },
    [handleDragMove],
  )

  const onTouchEnd = useCallback(() => {
    handleDragEnd()
  }, [handleDragEnd])

  // ===== キーボード（a11y） =====
  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const state = cardStateRef.current
      if (e.key === ' ' || e.key === 'Enter') {
        if (state === 'frontIdle') {
          e.preventDefault()
          handleFlip()
        }
      }
      if (e.key === 'ArrowRight' && state === 'backIdle') {
        e.preventDefault()
        onSwipeRight()
      }
      if (e.key === 'ArrowLeft' && state === 'backIdle') {
        e.preventDefault()
        onSwipeLeft()
      }
    },
    [handleFlip, onSwipeRight, onSwipeLeft],
  )

  // ===== フロントタップ（マウスclick） =====
  const onFrontClick = useCallback(() => {
    if (cardStateRef.current === 'frontIdle') {
      handleFlip()
    }
  }, [handleFlip])

  // ===== Clozeレンダリング =====
  const isCloze = card.format === 'cloze'
  const clozeResult = isCloze ? parseCloze(card.front) : null

  const frontHtml = isCloze && clozeResult
    ? clozeResult.frontHtml.replace(
        /\[____\]/g,
        `<span class="${styles.clozeBlank}"></span>`,
      )
    : null

  const backHtml = isCloze && clozeResult
    ? clozeResult.backHtml.replace(
        /\*\*(.*?)\*\*/g,
        `<span class="${styles.clozeAnswer}">$1</span>`,
      )
    : null

  // ===== フォーマット設定 =====
  const formatConfig = CARD_FORMAT_CONFIG[card.format]
  const isStructural = card.format.startsWith('structural_')
  const showSvgFront =
    (card.format === 'structural_image_to_name' ||
      card.format === 'structural_identification') &&
    card.media_url
  const showSvgBack = isStructural && card.media_url

  // ===== 表示制御 =====
  const showFallbackButtons = cardState === 'backIdle'

  // ===== レンダー =====
  return (
    <div style={{ width: '100%' }}>
      {/* === スワイプレイヤー（外層） === */}
      <div
        ref={swipeLayerRef}
        className={styles.swipeLayer}
        role="button"
        tabIndex={0}
        aria-label={`暗記カード ${sessionCardIndex + 1}: ${
          cardState === 'frontIdle'
            ? 'タップして裏返す'
            : '左右にスワイプして評価'
        }`}
        onMouseDown={cardState === 'backIdle' ? onMouseDown : undefined}
        onClick={cardState === 'frontIdle' ? onFrontClick : undefined}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onKeyDown={onKeyDown}
      >
        {/* フィードバック背景 */}
        <div ref={bgRightRef} className={`${styles.bgFeedback} ${styles.bgRight}`} />
        <div ref={bgLeftRef} className={`${styles.bgFeedback} ${styles.bgLeft}`} />

        {/* ゴーストヒント */}
        <div ref={ghostRightRef} className={styles.ghostHintRight}>
          OK 👍
        </div>
        <div ref={ghostLeftRef} className={styles.ghostHintLeft}>
          🔄 もう1回
        </div>

        {/* === フリップコンテナ（内層） === */}
        <div className={styles.flipContainer}>
          <div
            ref={flipInnerRef}
            className={`${styles.flipInner}${isFlipped ? ` ${styles.flipped}` : ''}`}
          >
            {/* ---- 表面 ---- */}
            <div className={`${styles.face} ${styles.front}`}>
              <p className={styles.formatLabel}>
                {formatConfig.emoji} {formatConfig.frontLabel}
              </p>

              {isCloze && clozeResult?.hasError && (
                <span className={styles.errorBadge}>⚠ Cloze解析エラー</span>
              )}

              {showSvgFront && card.media_url && (
                <img
                  src={card.media_url}
                  alt="構造式"
                  className={styles.structureImg}
                />
              )}

              {isCloze && frontHtml ? (
                <p
                  className={`${styles.cardText}${showSvgFront ? ` ${styles.cardTextSmall}` : ''}`}
                  // parseCloze内部でHTMLエスケープ済み（XSS対策済み）
                  dangerouslySetInnerHTML={{ __html: frontHtml }}
                />
              ) : (
                <p
                  className={`${styles.cardText}${showSvgFront ? ` ${styles.cardTextSmall}` : ''}`}
                >
                  {card.front}
                </p>
              )}

              <p className={styles.tapHint}>タップして裏面を見る</p>
            </div>

            {/* ---- 裏面 ---- */}
            <div className={`${styles.face} ${styles.back}`}>
              <p className={styles.formatLabel}>
                {formatConfig.emoji} {formatConfig.backLabel}
              </p>

              {showSvgBack && card.media_url && (
                <img
                  src={card.media_url}
                  alt="構造式"
                  className={styles.structureImg}
                />
              )}

              {isCloze && backHtml ? (
                <p
                  className={`${styles.cardText}${showSvgBack ? ` ${styles.cardTextSmall}` : ''}`}
                  // parseCloze内部でHTMLエスケープ済み（XSS対策済み）
                  dangerouslySetInnerHTML={{ __html: backHtml }}
                />
              ) : (
                <p
                  className={`${styles.cardText}${showSvgBack ? ` ${styles.cardTextSmall}` : ''}`}
                >
                  {card.back}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== ボタンフォールバック（a11y、スワイプできない環境向け） ===== */}
      {showFallbackButtons && (
        <div className={styles.fallbackButtons} role="group" aria-label="評価ボタン">
          <button
            type="button"
            className={styles.btnAgain}
            onClick={onSwipeLeft}
            aria-label="もう1回"
          >
            🔄 もう1回
          </button>
          <button
            type="button"
            className={styles.btnOk}
            onClick={onSwipeRight}
            aria-label="OK"
          >
            OK 👍
          </button>
        </div>
      )}
    </div>
  )
}
