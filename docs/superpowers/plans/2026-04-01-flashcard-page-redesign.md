# FlashCardPage リデザイン実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 暗記カード4,246枚（構造式730+テキスト3,516）のスワイプ練習UI + カードタブリデザイン。Soft Companion準拠、Ant Design完全排除。

**Architecture:** 3フェーズ構成。(A) SwipePractice練習画面のコア（clozeパーサー、スワイプジェスチャー、2層カード）、(B) FlashCardListPage カードタブ（UnifiedTemplateProvider、サブカテゴリ、進捗3状態）、(C) 統合（ページ切替、オンボーディング、導線確認）。

**Tech Stack:** React 19 + TypeScript 5.9 + Vite 8 + CSS Modules。純粋関数テスト（vitest）。

**Spec:** `docs/superpowers/specs/2026-03-31-flashcard-page-redesign-design.md` (v1.3)

---

## ファイル構成

### 新規作成

| ファイル | 役割 |
|---------|------|
| `src/utils/cloze-parser.ts` | `{{c1::答え}}` パース。表面用/裏面用のテキスト生成 |
| `src/utils/__tests__/cloze-parser.test.ts` | clozeパーサーのユニットテスト（8+ケース） |
| `src/utils/swipe-gesture.ts` | スワイプジェスチャーの純粋ロジック（閾値判定、progress計算） |
| `src/utils/__tests__/swipe-gesture.test.ts` | スワイプロジック テスト |
| `src/components/flashcard/SwipeCard.tsx` | 2層構造カード（outer=スワイプ、inner=フリップ） |
| `src/components/flashcard/SwipeCard.module.css` | スワイプカードのスタイル |
| `src/components/flashcard/SwipePractice.tsx` | スワイプ練習全体（旧TemplatePractice置換） |
| `src/components/flashcard/SwipePractice.module.css` | 練習画面スタイル |
| `src/components/flashcard/PracticeComplete.tsx` | 完了画面（結果+次アクション+ストリーク） |
| `src/components/flashcard/PracticeComplete.module.css` | 完了画面スタイル |
| `src/hooks/useUnifiedTemplates.ts` | 構造式+テキスト統合テンプレート提供 |
| `src/utils/practice-complete-logic.ts` | 完了画面の次アクション提案ロジック（純粋関数） |
| `src/utils/__tests__/practice-complete-logic.test.ts` | 完了ロジック テスト |
| `src/data/onboarding-cards.ts` | チュートリアル固定6枚 |
| `src/pages/FlashCardListPage.module.css` | カードタブ Soft Companion スタイル |
| `src/pages/FlashCardPage.module.css` | 練習ページ スタイル |

### 変更

| ファイル | 変更内容 |
|---------|---------|
| `src/pages/FlashCardListPage.tsx` | 全面リデザイン（Ant Design → Soft Companion + サブカテゴリ） |
| `src/pages/FlashCardPage.tsx` | TemplatePractice → SwipePractice 切替 |
| `src/hooks/useLearningLinks.ts` | FLASHCARD_TEMPLATES → useUnifiedTemplates 統合 |
| `src/routes.tsx` | 変更なし（既存ルートをそのまま利用） |

### 削除（Phase C完了後）

| ファイル | 理由 |
|---------|------|
| `src/components/flashcard/TemplatePractice.tsx` | SwipePractice.tsx に置換 |

---

## Phase A: SwipePractice（練習画面のコア）

### Task 1: Clozeパーサー

**Files:**
- Create: `src/utils/cloze-parser.ts`
- Test: `src/utils/__tests__/cloze-parser.test.ts`

- [ ] **Step 1: テストを書く**

```typescript
// src/utils/__tests__/cloze-parser.test.ts
import { describe, it, expect } from 'vitest'
import { parseCloze } from '../cloze-parser'

describe('parseCloze', () => {
  it('basic cloze', () => {
    const result = parseCloze('タンパク質の{{c1::一次構造}}とは、アミノ酸の配列順序のことである。')
    expect(result.frontHtml).toBe('タンパク質の[____]とは、アミノ酸の配列順序のことである。')
    expect(result.backHtml).toContain('一次構造')
    expect(result.blanks).toEqual([{ index: 1, answer: '一次構造' }])
    expect(result.hasError).toBe(false)
  })

  it('chemical formula: HCO3-', () => {
    const result = parseCloze('重炭酸イオンは{{c1::HCO3-}}である。')
    expect(result.blanks[0].answer).toBe('HCO3-')
    expect(result.hasError).toBe(false)
  })

  it('ion: Ca2+', () => {
    const result = parseCloze('{{c1::Ca2+}}は二価カチオンである。')
    expect(result.blanks[0].answer).toBe('Ca2+')
  })

  it('enzyme: Na+/K+-ATPase', () => {
    const result = parseCloze('{{c1::Na+/K+-ATPase}}はナトリウムポンプである。')
    expect(result.blanks[0].answer).toBe('Na+/K+-ATPase')
  })

  it('greek letter: β-ラクタム', () => {
    const result = parseCloze('{{c1::β-ラクタム}}環を含む。')
    expect(result.blanks[0].answer).toBe('β-ラクタム')
  })

  it('multiple cloze: c1 is blank, c2 is shown', () => {
    const result = parseCloze('{{c1::A}}と{{c2::B}}は異なる。')
    expect(result.frontHtml).toBe('[____]とBは異なる。')
    expect(result.blanks).toEqual([{ index: 1, answer: 'A' }])
  })

  it('empty cloze: fallback to raw text', () => {
    const result = parseCloze('{{c1::}}は空である。')
    expect(result.hasError).toBe(true)
    expect(result.frontHtml).toBe('{{c1::}}は空である。')
  })

  it('no cloze: pass through', () => {
    const result = parseCloze('普通のテキスト。')
    expect(result.frontHtml).toBe('普通のテキスト。')
    expect(result.blanks).toEqual([])
    expect(result.hasError).toBe(false)
  })

  it('nested cloze: fallback', () => {
    const result = parseCloze('{{c1::A{{c2::B}}}}の構造。')
    expect(result.hasError).toBe(true)
  })
})
```

- [ ] **Step 2: テスト実行 → 失敗確認**

Run: `npx vitest run src/utils/__tests__/cloze-parser.test.ts`
Expected: FAIL（cloze-parser.ts が存在しない）

- [ ] **Step 3: 実装**

```typescript
// src/utils/cloze-parser.ts

export interface ClozeBlank {
  index: number
  answer: string
}

export interface ClozeResult {
  frontHtml: string   // 穴あきテキスト（表面用）
  backHtml: string    // 答えハイライト（裏面用）
  blanks: ClozeBlank[]
  hasError: boolean
}

const CLOZE_REGEX = /\{\{c(\d+)::((?:(?!\{\{).)+?)\}\}/g

export function parseCloze(text: string): ClozeResult {
  // ネスト検出: {{ が2回以上連続
  if (/\{\{c\d+::.*\{\{c\d+::/.test(text)) {
    return { frontHtml: text, backHtml: text, blanks: [], hasError: true }
  }

  const blanks: ClozeBlank[] = []
  let hasError = false

  // 全clozeトークンを収集
  const matches = [...text.matchAll(CLOZE_REGEX)]
  if (matches.length === 0) {
    return { frontHtml: text, backHtml: text, blanks: [], hasError: false }
  }

  // 空cloze検出
  for (const m of matches) {
    if (!m[2] || m[2].trim() === '') {
      return { frontHtml: text, backHtml: text, blanks: [], hasError: true }
    }
  }

  // 表面: c1のみ [____] に置換、c2以降はテキスト表示
  const frontHtml = text.replace(CLOZE_REGEX, (_match, numStr, answer) => {
    const num = parseInt(numStr, 10)
    if (num === 1) {
      blanks.push({ index: num, answer })
      return '[____]'
    }
    return answer  // c2以降はテキスト表示
  })

  // 裏面: c1を太字マーカーで囲む、c2以降はテキスト表示
  const backHtml = text.replace(CLOZE_REGEX, (_match, numStr, answer) => {
    const num = parseInt(numStr, 10)
    if (num === 1) {
      return `**${answer}**`
    }
    return answer
  })

  return { frontHtml, backHtml, blanks, hasError }
}
```

- [ ] **Step 4: テスト実行 → パス確認**

Run: `npx vitest run src/utils/__tests__/cloze-parser.test.ts`
Expected: 9 tests PASS

- [ ] **Step 5: コミット**

```bash
git add src/utils/cloze-parser.ts src/utils/__tests__/cloze-parser.test.ts
git commit -m "feat: add cloze parser with chemical formula support and 9 test cases"
```

---

### Task 2: スワイプジェスチャーロジック

**Files:**
- Create: `src/utils/swipe-gesture.ts`
- Test: `src/utils/__tests__/swipe-gesture.test.ts`

- [ ] **Step 1: テストを書く**

```typescript
// src/utils/__tests__/swipe-gesture.test.ts
import { describe, it, expect } from 'vitest'
import { evaluateSwipe, calculateSwipeProgress } from '../swipe-gesture'

describe('evaluateSwipe', () => {
  const containerWidth = 375  // iPhone SE width

  it('right swipe over threshold = ok', () => {
    expect(evaluateSwipe(150, containerWidth)).toBe('right')  // 150/375 = 40% > 30%
  })

  it('left swipe over threshold = again', () => {
    expect(evaluateSwipe(-150, containerWidth)).toBe('left')
  })

  it('within threshold = none (snap back)', () => {
    expect(evaluateSwipe(50, containerWidth)).toBe('none')  // 50/375 = 13% < 30%
  })

  it('zero offset = none', () => {
    expect(evaluateSwipe(0, containerWidth)).toBe('none')
  })
})

describe('calculateSwipeProgress', () => {
  it('returns 0-1 progress toward threshold', () => {
    expect(calculateSwipeProgress(0, 375)).toBe(0)
    expect(calculateSwipeProgress(56, 375)).toBeCloseTo(0.5, 1)  // 56/(375*0.3) ≈ 0.5
    expect(calculateSwipeProgress(112.5, 375)).toBeCloseTo(1, 1) // at threshold
    expect(calculateSwipeProgress(200, 375)).toBe(1)  // capped at 1
  })

  it('works with negative offset (absolute value)', () => {
    expect(calculateSwipeProgress(-112.5, 375)).toBeCloseTo(1, 1)
  })
})

describe('isDiagonalSwipe', () => {
  // Import from swipe-gesture
  it('horizontal dominant = false (is a swipe)', () => {
    const { isDiagonalSwipe } = require('../swipe-gesture')
    expect(isDiagonalSwipe(100, 30)).toBe(false)  // |dx| > |dy| * 2
  })

  it('diagonal = true (is a scroll)', () => {
    const { isDiagonalSwipe } = require('../swipe-gesture')
    expect(isDiagonalSwipe(50, 40)).toBe(true)  // |dx| < |dy| * 2
  })
})
```

- [ ] **Step 2: テスト失敗確認**

Run: `npx vitest run src/utils/__tests__/swipe-gesture.test.ts`

- [ ] **Step 3: 実装**

```typescript
// src/utils/swipe-gesture.ts

const SWIPE_THRESHOLD = 0.3  // 画面幅の30%

export type SwipeDirection = 'left' | 'right' | 'none'

/** スワイプ方向を判定。offsetX > 0 = right, < 0 = left */
export function evaluateSwipe(offsetX: number, containerWidth: number): SwipeDirection {
  const threshold = containerWidth * SWIPE_THRESHOLD
  if (offsetX > threshold) return 'right'
  if (offsetX < -threshold) return 'left'
  return 'none'
}

/** 閾値に対する進捗（0-1）。UIのフィードバック強度に使う */
export function calculateSwipeProgress(offsetX: number, containerWidth: number): number {
  const threshold = containerWidth * SWIPE_THRESHOLD
  if (threshold === 0) return 0
  return Math.min(1, Math.abs(offsetX) / threshold)
}

/** 斜めスワイプ判定。true = スクロール意図（スワイプとして扱わない） */
export function isDiagonalSwipe(deltaX: number, deltaY: number): boolean {
  return Math.abs(deltaX) < Math.abs(deltaY) * 2
}

/** カードの回転角度（0-15°）。ドラッグ量に比例 */
export function calculateRotation(offsetX: number, containerWidth: number): number {
  const progress = calculateSwipeProgress(offsetX, containerWidth)
  const direction = offsetX >= 0 ? 1 : -1
  return direction * progress * 15
}
```

- [ ] **Step 4: テスト実行 → パス確認**

Run: `npx vitest run src/utils/__tests__/swipe-gesture.test.ts`
Expected: 7 tests PASS

- [ ] **Step 5: コミット**

```bash
git add src/utils/swipe-gesture.ts src/utils/__tests__/swipe-gesture.test.ts
git commit -m "feat: add swipe gesture logic with threshold, progress, diagonal detection"
```

---

### Task 3: SwipeCard コンポーネント（2層構造）

**Files:**
- Create: `src/components/flashcard/SwipeCard.tsx`
- Create: `src/components/flashcard/SwipeCard.module.css`

- [ ] **Step 1: CSS Module作成**

```css
/* src/components/flashcard/SwipeCard.module.css */

.swipeLayer {
  position: relative;
  width: 100%;
  min-height: 280px;
  touch-action: none;
  user-select: none;
  transition: transform 0.15s ease;
}

.swipeLayer.dragging {
  transition: none; /* ドラッグ中はアニメーション無効 */
}

.swipeLayer.exiting {
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0;
}

.flipContainer {
  position: relative;
  width: 100%;
  min-height: 280px;
  perspective: 1000px;
}

.flipInner {
  position: relative;
  width: 100%;
  min-height: 280px;
  transition: transform 0.5s ease;
  transform-style: preserve-3d;
}

.flipInner.flipped {
  transform: rotateY(180deg);
}

.face {
  position: absolute;
  width: 100%;
  min-height: 280px;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 20px;
  border-radius: var(--r, 14px);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.06));
}

.front {
  background: var(--card, #ffffff);
  color: var(--text, #3d2c1e);
}

.back {
  background: #f0f5ff;
  color: var(--text, #3d2c1e);
  transform: rotateY(180deg);
}

.formatLabel {
  font-size: 11px;
  color: var(--text-2, #8b7355);
  margin-bottom: 8px;
}

.frontText {
  font-size: 17px;
  font-weight: 600;
  text-align: center;
  white-space: pre-wrap;
  line-height: 1.6;
}

.backText {
  font-size: 15px;
  text-align: center;
  white-space: pre-wrap;
  line-height: 1.6;
}

.svgImage {
  max-width: 100%;
  max-height: 180px;
  margin-bottom: 12px;
}

.microCopy {
  font-size: 11px;
  color: var(--text-3, #9ca3af);
  margin-top: 16px;
}

.clozeBlank {
  display: inline-block;
  min-width: 60px;
  border-bottom: 2px solid var(--accent, #aa3bff);
  text-align: center;
  margin: 0 2px;
}

.clozeAnswer {
  font-weight: 700;
  color: var(--accent, #aa3bff);
}

/* スワイプフィードバック背景 */
.bgFeedback {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.1s ease;
}

.bgRight {
  right: 0;
  background: linear-gradient(to right, transparent, rgba(16,185,129,0.1));
  border-radius: 0 var(--r, 14px) var(--r, 14px) 0;
}

.bgLeft {
  left: 0;
  background: linear-gradient(to left, transparent, rgba(245,158,11,0.1));
  border-radius: var(--r, 14px) 0 0 var(--r, 14px);
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .flipInner {
    transition: none;
  }
  .swipeLayer {
    transition: none;
  }
  .swipeLayer.exiting {
    transition: opacity 0.15s ease;
  }
}
```

- [ ] **Step 2: SwipeCard コンポーネント実装**

```typescript
// src/components/flashcard/SwipeCard.tsx
import { useRef, useCallback, useEffect, useState } from 'react'
import type { FlashCardTemplate } from '../../types/flashcard-template'
import { CARD_FORMAT_CONFIG } from '../../types/flashcard-template'
import { parseCloze } from '../../utils/cloze-parser'
import { evaluateSwipe, calculateSwipeProgress, calculateRotation, isDiagonalSwipe } from '../../utils/swipe-gesture'
import styles from './SwipeCard.module.css'

type CardState = 'frontIdle' | 'flipping' | 'backIdle' | 'dragging' | 'resolved'

interface Props {
  card: FlashCardTemplate
  onSwipeRight: () => void   // OK
  onSwipeLeft: () => void    // もう1回
  showGhostHint: boolean     // ゴーストヒント表示
  sessionCardIndex: number   // セッション内の何枚目か
}

export function SwipeCard({ card, onSwipeRight, onSwipeLeft, showGhostHint, sessionCardIndex }: Props) {
  const [cardState, setCardState] = useState<CardState>('frontIdle')
  const swipeLayerRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const isDraggingRef = useRef(false)
  const rafRef = useRef<number | null>(null)

  const isStructural = card.format.startsWith('structural_')
  const isCloze = card.format === 'cloze'
  const formatConfig = CARD_FORMAT_CONFIG[card.format]

  // clozeパース
  const clozeResult = isCloze ? parseCloze(card.front) : null

  // フリップ
  const handleFlip = useCallback(() => {
    if (cardState !== 'frontIdle') return
    setCardState('flipping')
    setTimeout(() => setCardState('backIdle'), 500) // アニメーション完了後
  }, [cardState])

  // --- タッチ/マウスハンドラ ---
  const updateDragVisual = useCallback(() => {
    const el = swipeLayerRef.current
    if (!el) return
    const offset = offsetRef.current
    const rotation = calculateRotation(offset, el.offsetWidth)
    el.style.transform = `translateX(${offset}px) rotate(${rotation}deg)`
  }, [])

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    if (cardState !== 'backIdle') return
    startXRef.current = clientX
    startYRef.current = clientY
    isDraggingRef.current = false
  }, [cardState])

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (cardState !== 'backIdle' && cardState !== 'dragging') return

    const deltaX = clientX - startXRef.current
    const deltaY = clientY - startYRef.current

    // 初回判定: 斜めならスワイプ無視
    if (!isDraggingRef.current) {
      if (Math.abs(deltaX) < 10) return // 微小移動は無視
      if (isDiagonalSwipe(deltaX, deltaY)) return
      isDraggingRef.current = true
      setCardState('dragging')
    }

    offsetRef.current = deltaX
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(updateDragVisual)
  }, [cardState, updateDragVisual])

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false

    const el = swipeLayerRef.current
    if (!el) return

    const direction = evaluateSwipe(offsetRef.current, el.offsetWidth)
    if (direction === 'none') {
      // スナップバック
      offsetRef.current = 0
      el.style.transform = ''
      setCardState('backIdle')
      return
    }

    // 解決: exit animation
    setCardState('resolved')
    const exitX = direction === 'right' ? el.offsetWidth * 1.5 : -el.offsetWidth * 1.5
    el.style.transform = `translateX(${exitX}px) rotate(${direction === 'right' ? 30 : -30}deg)`
    el.style.opacity = '0'

    setTimeout(() => {
      if (direction === 'right') onSwipeRight()
      else onSwipeLeft()
    }, 300)
  }, [onSwipeRight, onSwipeLeft])

  // タッチイベント
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX, e.touches[0].clientY)
  }, [handleDragStart])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX, e.touches[0].clientY)
  }, [handleDragMove])

  const onTouchEnd = useCallback(() => {
    handleDragEnd()
  }, [handleDragEnd])

  // マウスイベント（デスクトップ）
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    handleDragStart(e.clientX, e.clientY)
    const moveHandler = (me: MouseEvent) => handleDragMove(me.clientX, me.clientY)
    const upHandler = () => {
      handleDragEnd()
      document.removeEventListener('mousemove', moveHandler)
      document.removeEventListener('mouseup', upHandler)
    }
    document.addEventListener('mousemove', moveHandler)
    document.addEventListener('mouseup', upHandler)
  }, [handleDragStart, handleDragMove, handleDragEnd])

  // キーボード
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('button, input, textarea')) return
      if ((e.key === ' ' || e.key === 'Enter') && cardState === 'frontIdle') {
        e.preventDefault()
        handleFlip()
      }
      if (e.key === 'ArrowRight' && cardState === 'backIdle') {
        onSwipeRight()
      }
      if (e.key === 'ArrowLeft' && cardState === 'backIdle') {
        onSwipeLeft()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cardState, handleFlip, onSwipeRight, onSwipeLeft])

  // カード切替時にリセット
  useEffect(() => {
    setCardState('frontIdle')
    offsetRef.current = 0
    if (swipeLayerRef.current) {
      swipeLayerRef.current.style.transform = ''
      swipeLayerRef.current.style.opacity = ''
    }
  }, [card.id])

  // --- 表面/裏面コンテンツ ---
  const renderFront = () => {
    const showSvg = (card.format === 'structural_image_to_name' || card.format === 'structural_identification') && card.media_url
    return (
      <>
        <div className={styles.formatLabel}>{formatConfig.emoji} {formatConfig.frontLabel}</div>
        {showSvg && <img src={card.media_url} alt="構造式" className={styles.svgImage} />}
        {isCloze && clozeResult ? (
          <div className={styles.frontText} dangerouslySetInnerHTML={{
            __html: clozeResult.frontHtml.replace(/\[____\]/g, `<span class="${styles.clozeBlank}">&nbsp;</span>`)
          }} />
        ) : (
          <div className={styles.frontText}>{card.front}</div>
        )}
        {isCloze && sessionCardIndex < 10 && (
          <div className={styles.microCopy}>答えを思い出してからタップ 👆</div>
        )}
        {!isCloze && cardState === 'frontIdle' && (
          <div className={styles.microCopy}>タップして裏面を見る</div>
        )}
      </>
    )
  }

  const renderBack = () => {
    const showSvg = isStructural && card.media_url
    const isComparison = card.format === 'comparison'
    return (
      <>
        <div className={styles.formatLabel}>{formatConfig.emoji} {formatConfig.backLabel}</div>
        {showSvg && <img src={card.media_url} alt="構造式" className={styles.svgImage} />}
        {isCloze && clozeResult ? (
          <div className={styles.backText} dangerouslySetInnerHTML={{
            __html: clozeResult.backHtml.replace(/\*\*(.*?)\*\*/g, `<span class="${styles.clozeAnswer}">$1</span>`)
          }} />
        ) : (
          <div className={styles.backText}>{card.back}</div>
        )}
        {isComparison && (
          <div className={styles.microCopy}>主要な違いを2つ以上言えたら → OK</div>
        )}
      </>
    )
  }

  const progress = calculateSwipeProgress(offsetRef.current, swipeLayerRef.current?.offsetWidth ?? 375)
  const swipeDir = offsetRef.current > 0 ? 'right' : offsetRef.current < 0 ? 'left' : null

  return (
    <div
      ref={swipeLayerRef}
      className={`${styles.swipeLayer} ${cardState === 'dragging' ? styles.dragging : ''} ${cardState === 'resolved' ? styles.exiting : ''}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      role="article"
      aria-label={`暗記カード ${sessionCardIndex + 1}`}
    >
      {/* スワイプフィードバック背景 */}
      <div className={`${styles.bgFeedback} ${styles.bgRight}`} style={{ opacity: swipeDir === 'right' ? progress * 0.8 : 0 }} />
      <div className={`${styles.bgFeedback} ${styles.bgLeft}`} style={{ opacity: swipeDir === 'left' ? progress * 0.8 : 0 }} />

      {/* ゴーストヒント */}
      {showGhostHint && cardState === 'dragging' && (
        <>
          {swipeDir === 'right' && (
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', opacity: progress * 0.8, color: '#10b981', fontWeight: 'bold', fontSize: 14 }}>
              OK 👍
            </div>
          )}
          {swipeDir === 'left' && (
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: progress * 0.8, color: '#f59e0b', fontWeight: 'bold', fontSize: 14 }}>
              🔄 もう1回
            </div>
          )}
        </>
      )}

      {/* フリップコンテナ（内側） */}
      <div className={styles.flipContainer} onClick={cardState === 'frontIdle' ? handleFlip : undefined}>
        <div className={`${styles.flipInner} ${cardState !== 'frontIdle' ? styles.flipped : ''}`}>
          <div className={`${styles.face} ${styles.front}`}>{renderFront()}</div>
          <div className={`${styles.face} ${styles.back}`}>{renderBack()}</div>
        </div>
      </div>

      {/* ボタンフォールバック（a11y） */}
      {cardState === 'backIdle' && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12 }}>
          <button onClick={onSwipeLeft} style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid #f59e0b', color: '#f59e0b', background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            もう1回
          </button>
          <button onClick={onSwipeRight} style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid #10b981', color: '#10b981', background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            OK
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/components/flashcard/SwipeCard.tsx src/components/flashcard/SwipeCard.module.css
git commit -m "feat: add SwipeCard with 2-layer architecture (swipe outer + flip inner)

- Cloze rendering with blank/highlight display
- Touch + mouse + keyboard support
- Ghost hint overlay for first 5 cards
- Button fallback for accessibility
- Reduced motion support
- Min-height 280px for layout stability"
```

---

### Task 4: SwipePractice コンポーネント

**Files:**
- Create: `src/components/flashcard/SwipePractice.tsx`
- Create: `src/components/flashcard/SwipePractice.module.css`

- [ ] **Step 1: CSS作成**

```css
/* src/components/flashcard/SwipePractice.module.css */
.page {
  max-width: 480px;
  margin: 0 auto;
  padding: 16px 16px 120px;
  background: var(--bg, #fef7ed);
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.backBtn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px 8px;
  color: var(--text-2, #8b7355);
}

.title {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  color: var(--text, #3d2c1e);
}

.counter {
  font-size: 13px;
  color: var(--text-2, #8b7355);
}

.progressBar {
  height: 3px;
  background: #e5e7eb;
  border-radius: 2px;
  margin-bottom: 20px;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent, #aa3bff), #8b5cf6);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.undoBtn {
  position: fixed;
  bottom: 80px;
  right: 20px;
  background: var(--card, #ffffff);
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 12px;
  color: var(--accent, #aa3bff);
  cursor: pointer;
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04));
  z-index: 10;
}
```

- [ ] **Step 2: SwipePractice 実装**

```typescript
// src/components/flashcard/SwipePractice.tsx
import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FlashCardPracticeContext, ReviewResult } from '../../types/card-progress'
import type { FlashCardTemplate } from '../../types/flashcard-template'
import { useCardProgress } from '../../hooks/useCardProgress'
import { SwipeCard } from './SwipeCard'
import { PracticeComplete } from './PracticeComplete'
import styles from './SwipePractice.module.css'

interface Props {
  context: FlashCardPracticeContext
  getTemplate: (id: string) => FlashCardTemplate | undefined
}

export function SwipePractice({ context, getTemplate }: Props) {
  const navigate = useNavigate()
  const { reviewCard } = useCardProgress()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<{ cardId: string; result: ReviewResult }[]>([])
  const [undoStack, setUndoStack] = useState<{ index: number; cardId: string }[]>([])

  const practiceCards = useMemo(
    () => context.cardIds
      .map(id => getTemplate(id))
      .filter((t): t is FlashCardTemplate => t !== undefined),
    [context.cardIds, getTemplate],
  )

  const totalCount = practiceCards.length
  const isComplete = currentIndex >= totalCount
  const card = practiceCards[currentIndex]

  // ゴーストヒント: 初回セッションは5枚、2回目以降は非表示
  const hintSeen = localStorage.getItem('swipe-hint-seen') === 'true'
  const showGhostHint = !hintSeen && currentIndex < 5

  const handleReview = useCallback(async (result: ReviewResult) => {
    if (!card) return
    await reviewCard(card.id, result)
    setResults(prev => [...prev, { cardId: card.id, result }])
    setUndoStack(prev => [...prev.slice(-1), { index: currentIndex, cardId: card.id }]) // 直前1手
    setCurrentIndex(prev => prev + 1)

    // ゴーストヒント完了マーク
    if (currentIndex === 4 && !hintSeen) {
      localStorage.setItem('swipe-hint-seen', 'true')
    }
  }, [card, currentIndex, reviewCard, hintSeen])

  const handleSwipeRight = useCallback(() => handleReview('good'), [handleReview])
  const handleSwipeLeft = useCallback(() => handleReview('again'), [handleReview])

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return
    const last = undoStack[undoStack.length - 1]
    setUndoStack(prev => prev.slice(0, -1))
    setResults(prev => prev.slice(0, -1))
    setCurrentIndex(last.index)
    // Note: SM-2の巻き戻しは行わない（再スワイプで上書きされる）
  }, [undoStack])

  // 完了画面
  if (isComplete) {
    return (
      <PracticeComplete
        results={results}
        practiceCards={practiceCards}
        context={context}
      />
    )
  }

  const progressPct = totalCount > 0 ? (currentIndex / totalCount) * 100 : 0

  return (
    <div className={styles.page}>
      {/* ヘッダー */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(context.returnTo)}>←</button>
        <div className={styles.title}>練習</div>
        <div className={styles.counter}>{currentIndex + 1}/{totalCount}</div>
      </div>

      {/* プログレスバー */}
      <div className={styles.progressBar} role="progressbar" aria-valuenow={currentIndex} aria-valuemax={totalCount}>
        <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
      </div>

      {/* カード */}
      {card && (
        <SwipeCard
          key={card.id}
          card={card}
          onSwipeRight={handleSwipeRight}
          onSwipeLeft={handleSwipeLeft}
          showGhostHint={showGhostHint}
          sessionCardIndex={currentIndex}
        />
      )}

      {/* アンドゥ */}
      {undoStack.length > 0 && (
        <button className={styles.undoBtn} onClick={handleUndo} aria-label="直前のカードに戻る">
          ↩ 戻す
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: 型チェック + テスト**

Run: `npx tsc --noEmit && npx vitest run`
Expected: 型エラーなし、全テストパス

- [ ] **Step 4: コミット**

```bash
git add src/components/flashcard/SwipePractice.tsx src/components/flashcard/SwipePractice.module.css
git commit -m "feat: add SwipePractice with swipe review, undo, ghost hints, progress bar"
```

---

### Task 5: PracticeComplete 完了画面

**Files:**
- Create: `src/utils/practice-complete-logic.ts`
- Test: `src/utils/__tests__/practice-complete-logic.test.ts`
- Create: `src/components/flashcard/PracticeComplete.tsx`
- Create: `src/components/flashcard/PracticeComplete.module.css`

- [ ] **Step 1: 完了ロジックのテスト**

```typescript
// src/utils/__tests__/practice-complete-logic.test.ts
import { describe, it, expect } from 'vitest'
import { buildNextActions } from '../practice-complete-logic'

describe('buildNextActions', () => {
  it('suggests related questions when again cards have linked questions', () => {
    const actions = buildNextActions(
      [{ cardId: 'sfct-caffeine-L1', result: 'again' }],
      [{ id: 'sfct-caffeine-L1', primary_exemplar_id: 'ex-chemistry-080' }] as any,
      { getQuestionsForExemplar: (id: string) => id === 'ex-chemistry-080' ? ['r100-005'] : [] } as any,
    )
    expect(actions.some(a => a.type === 'related_questions')).toBe(true)
  })

  it('does not suggest related questions when no linked questions exist', () => {
    const actions = buildNextActions(
      [{ cardId: 'sfct-caffeine-L1', result: 'again' }],
      [{ id: 'sfct-caffeine-L1', primary_exemplar_id: 'ex-chemistry-080' }] as any,
      { getQuestionsForExemplar: () => [] } as any,
    )
    expect(actions.some(a => a.type === 'related_questions')).toBe(false)
  })

  it('suggests more practice when all good', () => {
    const actions = buildNextActions(
      [{ cardId: 'sfct-caffeine-L1', result: 'good' }],
      [{ id: 'sfct-caffeine-L1', primary_exemplar_id: 'ex-chemistry-080' }] as any,
      { getQuestionsForExemplar: () => [] } as any,
    )
    expect(actions.some(a => a.type === 'more_practice')).toBe(true)
  })

  it('always includes go_home', () => {
    const actions = buildNextActions([], [], { getQuestionsForExemplar: () => [] } as any)
    expect(actions.some(a => a.type === 'go_home')).toBe(true)
  })
})
```

- [ ] **Step 2: ロジック実装**

```typescript
// src/utils/practice-complete-logic.ts
import type { FlashCardTemplate } from '../types/flashcard-template'
import type { ReviewResult } from '../types/card-progress'
import type { LearningLinkService } from './learning-link-service'

export interface NextAction {
  type: 'related_questions' | 'more_practice' | 'go_home'
  label: string
  emoji: string
  questionIds?: string[]
}

export function buildNextActions(
  results: { cardId: string; result: ReviewResult }[],
  cards: FlashCardTemplate[],
  linkService: Pick<LearningLinkService, 'getQuestionsForExemplar'>,
): NextAction[] {
  const actions: NextAction[] = []

  // 「もう1回」のカードから関連問題を収集
  const againCards = results.filter(r => r.result === 'again')
  if (againCards.length > 0) {
    const questionIds = new Set<string>()
    for (const r of againCards) {
      const card = cards.find(c => c.id === r.cardId)
      if (!card?.primary_exemplar_id) continue
      const qs = linkService.getQuestionsForExemplar(card.primary_exemplar_id)
      for (const q of qs) questionIds.add(q)
    }
    if (questionIds.size > 0) {
      actions.push({
        type: 'related_questions',
        label: `苦手だった${againCards.length}枚の関連問題を解く`,
        emoji: '📝',
        questionIds: [...questionIds].slice(0, 10),
      })
    }
  }

  // 追加練習
  actions.push({
    type: 'more_practice',
    label: againCards.length === 0 ? '同じカテゴリをもう10枚' : 'もう10枚練習する',
    emoji: '🔬',
  })

  // ホーム
  actions.push({ type: 'go_home', label: 'ホームに戻る', emoji: '🏠' })

  return actions
}

export function calculateStats(results: { result: ReviewResult }[]) {
  const ok = results.filter(r => r.result === 'good' || r.result === 'easy').length
  const again = results.filter(r => r.result === 'again' || r.result === 'hard').length
  const isPerfect = again === 0 && results.length > 0
  return { ok, again, total: results.length, isPerfect }
}
```

- [ ] **Step 3: テスト実行**

Run: `npx vitest run src/utils/__tests__/practice-complete-logic.test.ts`
Expected: 4 tests PASS

- [ ] **Step 4: PracticeComplete コンポーネント + CSS**

```css
/* src/components/flashcard/PracticeComplete.module.css */
.page {
  max-width: 480px;
  margin: 0 auto;
  padding: 40px 16px 120px;
  background: var(--bg, #fef7ed);
  min-height: 100vh;
  text-align: center;
}

.emoji {
  font-size: 48px;
  animation: bounce 0.5s ease;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text, #3d2c1e);
  margin: 12px 0;
}

.statsRow {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin: 16px 0;
}

.statBox {
  padding: 12px 24px;
  border-radius: var(--r-sm, 10px);
  font-weight: 700;
  font-size: 20px;
}

.statOk {
  background: #ecfdf5;
  color: #10b981;
}

.statAgain {
  background: #fffbeb;
  color: #f59e0b;
}

.statLabel {
  font-size: 11px;
  font-weight: 400;
  display: block;
  margin-top: 2px;
}

.streak {
  background: linear-gradient(135deg, rgba(170,59,255,0.08), rgba(139,92,246,0.08));
  border: 1px solid rgba(170,59,255,0.2);
  border-radius: 12px;
  padding: 10px 16px;
  margin: 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text, #3d2c1e);
}

.perfect {
  color: var(--accent, #aa3bff);
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.actionsTitle {
  font-size: 13px;
  font-weight: 700;
  color: var(--text, #3d2c1e);
  text-align: left;
  margin: 24px 0 8px;
}

.actionBtn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 14px 16px;
  background: var(--card, #ffffff);
  border: 1px solid #e5e7eb;
  border-radius: var(--r-sm, 10px);
  margin-bottom: 8px;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
  color: var(--text, #3d2c1e);
  transition: border-color 0.15s;
}

.actionBtn:hover {
  border-color: var(--accent, #aa3bff);
}

.actionArrow {
  margin-left: auto;
  color: var(--accent, #aa3bff);
}

@media (prefers-reduced-motion: reduce) {
  .emoji { animation: none; }
}
```

```typescript
// src/components/flashcard/PracticeComplete.tsx
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FlashCardPracticeContext, ReviewResult } from '../../types/card-progress'
import type { FlashCardTemplate } from '../../types/flashcard-template'
import { useLearningLinks } from '../../hooks/useLearningLinks'
import { buildNextActions, calculateStats } from '../../utils/practice-complete-logic'
import styles from './PracticeComplete.module.css'

interface Props {
  results: { cardId: string; result: ReviewResult }[]
  practiceCards: FlashCardTemplate[]
  context: FlashCardPracticeContext
}

export function PracticeComplete({ results, practiceCards, context }: Props) {
  const navigate = useNavigate()
  const linkService = useLearningLinks()

  const stats = useMemo(() => calculateStats(results), [results])
  const actions = useMemo(
    () => buildNextActions(results, practiceCards, linkService),
    [results, practiceCards, linkService],
  )

  const handleAction = (action: ReturnType<typeof buildNextActions>[number]) => {
    switch (action.type) {
      case 'related_questions':
        if (action.questionIds && action.questionIds.length > 0) {
          navigate(`/practice/${action.questionIds[0]}`)
        }
        break
      case 'more_practice':
        navigate(context.returnTo)
        break
      case 'go_home':
        navigate('/')
        break
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.emoji}>{stats.isPerfect ? '🎉' : '✅'}</div>
      <div className={styles.title}>{stats.total}枚の練習が完了！</div>

      {stats.isPerfect && <div className={styles.perfect}>パーフェクト！</div>}

      <div className={styles.statsRow}>
        <div className={`${styles.statBox} ${styles.statOk}`}>
          {stats.ok}
          <span className={styles.statLabel}>OK</span>
        </div>
        <div className={`${styles.statBox} ${styles.statAgain}`}>
          {stats.again}
          <span className={styles.statLabel}>もう1回</span>
        </div>
      </div>

      <div className={styles.actionsTitle}>次のアクション</div>
      {actions.map((action, i) => (
        <button key={i} className={styles.actionBtn} onClick={() => handleAction(action)}>
          <span>{action.emoji}</span>
          <span>{action.label}</span>
          <span className={styles.actionArrow}>→</span>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: 型チェック + テスト**

Run: `npx tsc --noEmit && npx vitest run`

- [ ] **Step 6: コミット**

```bash
git add src/utils/practice-complete-logic.ts src/utils/__tests__/practice-complete-logic.test.ts src/components/flashcard/PracticeComplete.tsx src/components/flashcard/PracticeComplete.module.css
git commit -m "feat: add PracticeComplete with next-action suggestions and learning cycle connection"
```

---

## Phase B: FlashCardListPage（カードタブ）

### Task 6: UnifiedTemplateProvider

**Files:**
- Create: `src/hooks/useUnifiedTemplates.ts`

- [ ] **Step 1: 実装**

```typescript
// src/hooks/useUnifiedTemplates.ts
import { useState, useEffect, useMemo, useCallback } from 'react'
import type { FlashCardTemplate } from '../types/flashcard-template'
import { FLASHCARD_TEMPLATES } from '../data/flashcard-templates'

// モジュールレベルキャッシュ（2回目以降即座に返す）
let textCardsCache: FlashCardTemplate[] | null = null
let loadError: string | null = null

async function loadTextCards(): Promise<FlashCardTemplate[]> {
  if (textCardsCache) return textCardsCache
  try {
    const { loadAllCardTemplates } = await import('../data/generated-cards/index')
    textCardsCache = await loadAllCardTemplates()
    loadError = null
    return textCardsCache
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'テキストカードの読み込みに失敗しました'
    return []
  }
}

export function useUnifiedTemplates() {
  const [textCards, setTextCards] = useState<FlashCardTemplate[]>(textCardsCache ?? [])
  const [loading, setLoading] = useState(textCardsCache === null)
  const [error, setError] = useState<string | null>(loadError)

  useEffect(() => {
    if (textCardsCache) {
      setTextCards(textCardsCache)
      setLoading(false)
      return
    }
    let cancelled = false
    loadTextCards().then(cards => {
      if (cancelled) return
      setTextCards(cards)
      setLoading(false)
      setError(loadError)
    })
    return () => { cancelled = true }
  }, [])

  const allTemplates = useMemo(
    () => [...FLASHCARD_TEMPLATES, ...textCards],
    [textCards],
  )

  const templatesById = useMemo(() => {
    const map = new Map<string, FlashCardTemplate>()
    for (const t of allTemplates) map.set(t.id, t)
    return map
  }, [allTemplates])

  const getTemplate = useCallback(
    (id: string) => templatesById.get(id),
    [templatesById],
  )

  const retry = useCallback(() => {
    textCardsCache = null
    loadError = null
    setLoading(true)
    setError(null)
    loadTextCards().then(cards => {
      setTextCards(cards)
      setLoading(false)
      setError(loadError)
    })
  }, [])

  return { allTemplates, loading, error, getTemplate, templatesById, retry } as const
}
```

- [ ] **Step 2: 型チェック**

Run: `npx tsc --noEmit`

- [ ] **Step 3: コミット**

```bash
git add src/hooks/useUnifiedTemplates.ts
git commit -m "feat: add useUnifiedTemplates hook (unified provider for 4,246 cards)"
```

---

### Task 7: FlashCardListPage Soft Companionリデザイン

**Files:**
- Modify: `src/pages/FlashCardListPage.tsx`（全面書き換え）
- Create: `src/pages/FlashCardListPage.module.css`

- [ ] **Step 1: CSS作成**

```css
/* src/pages/FlashCardListPage.module.css */
.page {
  max-width: 480px;
  margin: 0 auto;
  padding: 20px 16px 160px;
  background: var(--bg, #fef7ed);
  min-height: 100vh;
  color: var(--text, #3d2c1e);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.headerTitle {
  font-size: 20px;
  font-weight: 700;
}

.headerCount {
  font-size: 13px;
  color: var(--text-2, #8b7355);
}

.reviewCta {
  background: linear-gradient(135deg, #aa3bff, #8b5cf6);
  border-radius: 14px;
  padding: 16px;
  color: white;
  margin-bottom: 20px;
  cursor: pointer;
  border: none;
  width: 100%;
  text-align: left;
  box-shadow: 0 4px 16px rgba(170,59,255,0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reviewCtaDisabled {
  opacity: 0.5;
  cursor: default;
  box-shadow: none;
}

.reviewCtaTitle {
  font-size: 15px;
  font-weight: 600;
}

.reviewCtaCount {
  font-size: 24px;
  font-weight: 700;
}

.reviewCtaSub {
  font-size: 11px;
  opacity: 0.8;
}

.reviewCtaArrow {
  font-size: 16px;
  font-weight: 700;
}

.sectionTitle {
  font-size: 14px;
  font-weight: 700;
  margin: 16px 0 8px;
}

.chipBar {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.subCategoryList {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.subCategoryRow {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--card, #ffffff);
  border-radius: var(--r-sm, 10px);
  padding: 10px 12px;
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04));
  cursor: pointer;
  border: none;
  width: 100%;
  text-align: left;
  font-size: 13px;
  transition: border-color 0.15s;
  border: 1px solid transparent;
}

.subCategoryRow:hover {
  border-color: var(--accent-border, rgba(170,59,255,0.25));
}

.subCategoryIcon {
  width: 32px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.subCategoryInfo {
  flex: 1;
}

.subCategoryName {
  font-weight: 500;
  color: var(--text, #3d2c1e);
}

.subCategoryCount {
  font-size: 10px;
  color: var(--text-2, #8b7355);
}

.dueBadge {
  background: #fef2f2;
  color: #ef4444;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 600;
}

.expandBtn {
  background: none;
  border: none;
  color: var(--accent, #aa3bff);
  font-size: 12px;
  cursor: pointer;
  padding: 8px;
  width: 100%;
  text-align: center;
}

.progressMini {
  height: 3px;
  background: #e5e7eb;
  border-radius: 2px;
  margin-top: 4px;
  overflow: hidden;
}

.progressMiniFill {
  height: 100%;
  background: var(--ok, #10b981);
  border-radius: 2px;
}

.errorBanner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--r-sm, 10px);
  padding: 12px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #991b1b;
}

.retryBtn {
  background: white;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  color: #991b1b;
}

.emptyState {
  text-align: center;
  padding: 40px 16px;
  color: var(--text-2, #8b7355);
  font-size: 14px;
}
```

- [ ] **Step 2: FlashCardListPage 全面書き換え**

このファイルは大きいため、サブエージェントに以下の指示で実装を委任:

- `useUnifiedTemplates()` でデータ取得（loading/error/allTemplates/getTemplate）
- `useCardProgress()` で進捗データ（allProgress, dueProgress）
- テキストカード: subject でグループ → 枚数順ソート
- 構造式カード: COMPOUND_META の category でグループ
- 進捗3状態計算: 未学習/復習待ち/マスター をCardProgressベースで算出
- Chipフィルタ: 全て/未学習/復習待ち/マスター済み
- 折りたたみ: 初期5件表示、「+他Nカテゴリ」ボタン
- 復習CTA: dueProgress.lengthが0のときdisabled
- PracticeContext生成 → navigate('/cards/review', { state })
- Ant Design import を完全排除

- [ ] **Step 3: 型チェック + テスト**

Run: `npx tsc --noEmit && npx vitest run`

- [ ] **Step 4: コミット**

```bash
git add src/pages/FlashCardListPage.tsx src/pages/FlashCardListPage.module.css
git commit -m "feat: redesign FlashCardListPage with Soft Companion + subcategory + progress 3-state

- Ant Design completely removed
- Text cards (3,516) by subject + structural (720) by category
- Progress: 未学習/復習待ち/マスター per subcategory
- Review CTA with due count + time estimate
- Chip filter: 全て/未学習/復習待ち/マスター
- Accordion expand/collapse for 15+ categories
- Error banner with retry for dynamic import failure"
```

---

### Task 8: オンボーディング チュートリアル

**Files:**
- Create: `src/data/onboarding-cards.ts`

- [ ] **Step 1: チュートリアルカード定義**

```typescript
// src/data/onboarding-cards.ts
import type { FlashCardTemplate } from '../types/flashcard-template'

/** チュートリアル固定6枚（テキスト3+構造式2+cloze1） */
export const ONBOARDING_CARDS: FlashCardTemplate[] = [
  {
    id: 'onboarding-01-flip',
    source_type: 'fusen',
    source_id: 'onboarding',
    primary_exemplar_id: '',
    subject: '物理',
    front: '👆 タップして裏面を見てみよう！\n\nこれは暗記カードの表面です。',
    back: '🎉 裏面が見えました！\n\nこのカードは「用語→定義」形式です。\n表面の問いに答えてから裏面で確認しましょう。',
    format: 'term_definition',
    tags: ['チュートリアル'],
  },
  {
    id: 'onboarding-02-swipe',
    source_type: 'fusen',
    source_id: 'onboarding',
    primary_exemplar_id: '',
    subject: '物理',
    front: '覚えたら右にスワイプ →\n← 忘れたら左にスワイプ\n\nまず裏面を見てから試してみよう！',
    back: '✅ OK → 右にスワイプ\n🔄 もう1回 → 左にスワイプ\n\nどちらかにスワイプしてみよう！\n（下のボタンでもOK）',
    format: 'question_answer',
    tags: ['チュートリアル'],
  },
  {
    id: 'onboarding-03-cloze',
    source_type: 'knowledge_atom',
    source_id: 'onboarding',
    primary_exemplar_id: '',
    subject: '生物',
    front: 'タンパク質の{{c1::一次構造}}とは、アミノ酸の配列順序のことである。\n\n💡 穴埋めカード: [____]の答えを考えてからタップ！',
    back: 'タンパク質の{{c1::一次構造}}とは、アミノ酸の配列順序のことである。\n\n答え: 一次構造（アミノ酸配列のこと）',
    format: 'cloze',
    tags: ['チュートリアル'],
  },
  {
    id: 'onboarding-04-structural',
    source_type: 'structure_db',
    source_id: 'struct-caffeine',
    primary_exemplar_id: '',
    subject: '化学',
    front: 'この構造式の物質名は？',
    back: 'カフェイン（Caffeine）。プリン環（キサンチン骨格）。中枢興奮作用を持つ。',
    format: 'structural_image_to_name',
    tags: ['チュートリアル'],
    media_url: '/images/structures/caffeine.svg',
  },
  {
    id: 'onboarding-05-name-to-struct',
    source_type: 'structure_db',
    source_id: 'struct-ascorbic-acid',
    primary_exemplar_id: '',
    subject: '衛生',
    front: 'アスコルビン酸（ビタミンC）',
    back: 'Ascorbic acid。ラクトン環。C2・C3位のエンジオール基が還元作用の本体。',
    format: 'structural_name_to_image',
    tags: ['チュートリアル'],
    media_url: '/images/structures/ascorbic-acid.svg',
  },
  {
    id: 'onboarding-06-done',
    source_type: 'fusen',
    source_id: 'onboarding',
    primary_exemplar_id: '',
    subject: '物理',
    front: '🎓 おつかれさま！\n\n暗記カードの使い方をマスターしました。',
    back: '✅ スワイプで高速復習\n✅ 穴埋めで想起練習\n✅ 構造式で視覚暗記\n\nカードタブから自由に練習しよう！',
    format: 'question_answer',
    tags: ['チュートリアル'],
  },
]
```

- [ ] **Step 2: 型チェック**

Run: `npx tsc --noEmit`

- [ ] **Step 3: コミット**

```bash
git add src/data/onboarding-cards.ts
git commit -m "feat: add 6 onboarding tutorial cards (text + cloze + structural)"
```

---

## Phase C: 統合

### Task 9: FlashCardPage 切替

**Files:**
- Modify: `src/pages/FlashCardPage.tsx`
- Create: `src/pages/FlashCardPage.module.css`

- [ ] **Step 1: FlashCardPage書き換え**

TemplatePractice → SwipePractice に切替。useUnifiedTemplates の getTemplate を渡す。オンボーディング判定。レガシーモード維持（PracticeContextなし時）。

- [ ] **Step 2: 型チェック + テスト**

Run: `npx tsc --noEmit && npx vitest run`

- [ ] **Step 3: コミット**

```bash
git add src/pages/FlashCardPage.tsx src/pages/FlashCardPage.module.css
git commit -m "feat: switch FlashCardPage to SwipePractice with unified template provider"
```

---

### Task 10: useLearningLinks 統合更新

**Files:**
- Modify: `src/hooks/useLearningLinks.ts`

- [ ] **Step 1: FLASHCARD_TEMPLATES → allTemplates に変更**

現在は同期の `FLASHCARD_TEMPLATES` を渡しているが、テキストカード3,516枚も含めるために `useUnifiedTemplates` の結果を使う必要がある。ただし `useLearningLinks` は `useMemo` で即座に構築する設計なので、loading中は空配列で初期化し、allTemplates ready後に再構築する。

注意: これにより `useLearningLinks` フックの呼び出し元（QuestionPage, NotesPage等）にも影響。allTemplates のloading中はリンクが不完全になるが、構造式730枚は即座に利用可能なので実用上の問題は軽微。

- [ ] **Step 2: 型チェック + テスト**

Run: `npx tsc --noEmit && npx vitest run`

- [ ] **Step 3: コミット**

```bash
git add src/hooks/useLearningLinks.ts
git commit -m "feat: integrate text cards into LearningLinkService via useUnifiedTemplates"
```

---

### Task 11: 最終統合テスト + TemplatePractice削除

**Files:**
- Delete: `src/components/flashcard/TemplatePractice.tsx`

- [ ] **Step 1: TemplatePractice の参照が残っていないか確認**

Run: `grep -r "TemplatePractice" src/ --include="*.ts" --include="*.tsx"`
Expected: 0件（FlashCardPage.tsxで既にSwipePracticeに切替済み）

- [ ] **Step 2: TemplatePractice削除**

```bash
rm src/components/flashcard/TemplatePractice.tsx
```

- [ ] **Step 3: 型チェック + 全テスト**

Run: `npx tsc --noEmit && npx vitest run`
Expected: 型エラーなし、全テストパス

- [ ] **Step 4: コミット**

```bash
git add -A
git commit -m "chore: remove deprecated TemplatePractice (replaced by SwipePractice)"
```

---

## 依存関係

```
Task 1 (cloze) ─────────────┐
Task 2 (swipe gesture) ─────┤
                             ├→ Task 3 (SwipeCard) → Task 4 (SwipePractice) → Task 5 (Complete)
                             │                                                       │
Task 6 (UnifiedTemplates) ──┤→ Task 7 (ListPage) → Task 8 (Onboarding)             │
                             │                                                       │
                             └→ Task 9 (FlashCardPage切替) ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
                                     │
                                     ├→ Task 10 (LearningLinks統合)
                                     └→ Task 11 (TemplatePractice削除)
```

- Task 1, 2, 6 は並列実行可能
- Task 3 は Task 1, 2 に依存
- Task 7 は Task 6 に依存
- Task 9 は Task 4, 5, 6 に依存
- Task 10, 11 は Task 9 に依存
