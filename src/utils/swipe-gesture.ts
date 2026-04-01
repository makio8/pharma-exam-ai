// src/utils/swipe-gesture.ts

export type SwipeDirection = 'left' | 'right' | 'none'

const SWIPE_THRESHOLD_RATIO = 0.3
const MAX_ROTATION_DEG = 15

/**
 * 閾値30%でスワイプ方向を判定する純粋関数
 */
export function evaluateSwipe(offsetX: number, containerWidth: number): SwipeDirection {
  if (containerWidth === 0) return 'none'
  const ratio = offsetX / containerWidth
  if (ratio >= SWIPE_THRESHOLD_RATIO) return 'right'
  if (ratio <= -SWIPE_THRESHOLD_RATIO) return 'left'
  return 'none'
}

/**
 * 閾値に対するスワイプ進捗（0–1）を返す純粋関数。UI強度に使用
 */
export function calculateSwipeProgress(offsetX: number, containerWidth: number): number {
  if (containerWidth === 0) return 0
  const threshold = containerWidth * SWIPE_THRESHOLD_RATIO
  const progress = Math.abs(offsetX) / threshold
  return Math.min(progress, 1)
}

/**
 * 斜めスワイプ判定。true = スクロール意図（|deltaX| < |deltaY| * 2）
 */
export function isDiagonalSwipe(deltaX: number, deltaY: number): boolean {
  return Math.abs(deltaX) < Math.abs(deltaY) * 2
}

/**
 * offsetX に応じたカード回転角度（-15° ~ +15°）を返す純粋関数
 */
export function calculateRotation(offsetX: number, containerWidth: number): number {
  if (containerWidth === 0) return 0
  const ratio = offsetX / containerWidth
  const rotation = ratio * MAX_ROTATION_DEG
  return Math.max(-MAX_ROTATION_DEG, Math.min(MAX_ROTATION_DEG, rotation))
}
