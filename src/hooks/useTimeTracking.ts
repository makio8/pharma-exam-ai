import { useRef, useEffect } from 'react'

// ---------------------------------------------------------------------------
// Pure helpers — exported for unit testing
// ---------------------------------------------------------------------------

/**
 * startTime（ms）から now（ms）までの経過秒数を整数（切り捨て）で返す。
 */
export function calcElapsedSeconds(startTime: number, now: number): number {
  return Math.floor((now - startTime) / 1000)
}

/**
 * 可視時間だけを累積する計測クラス。
 * - start()  : 計測開始（またはリセット後の再開）
 * - pause()  : 一時停止（Page Visibility: hidden）
 * - resume() : 再開（Page Visibility: visible）
 * - reset()  : 累積時間と状態を完全リセット
 * - getElapsedSeconds() : 現在までの累積秒数（整数）
 */
export class TimeTracker {
  /** 現在の計測セグメントの開始時刻（null = 計測していない） */
  private segmentStart: number | null = null
  /** 過去セグメントの累積ミリ秒 */
  private accumulated = 0

  start(): void {
    if (this.segmentStart !== null) return // 二重 start 防止
    this.segmentStart = Date.now()
  }

  pause(): void {
    if (this.segmentStart === null) return
    this.accumulated += Date.now() - this.segmentStart
    this.segmentStart = null
  }

  resume(): void {
    if (this.segmentStart !== null) return // 既に計測中
    this.segmentStart = Date.now()
  }

  reset(): void {
    this.segmentStart = null
    this.accumulated = 0
  }

  getElapsedSeconds(): number {
    const running =
      this.segmentStart !== null ? Date.now() - this.segmentStart : 0
    return Math.floor((this.accumulated + running) / 1000)
  }
}

// ---------------------------------------------------------------------------
// React フック
// ---------------------------------------------------------------------------

export interface UseTimeTrackingResult {
  /** 現在の問題に費やした可視時間（秒）を返す */
  getElapsedSeconds: () => number
}

/**
 * 解答時間を計測するフック。
 *
 * - questionId が変わると自動でリセット＆再計測開始
 * - Page Visibility API でタブ離脱中は時間をカウントしない
 * - ref を外部に一切露出しない（§7.1 完全隠蔽）
 */
export function useTimeTracking(questionId: string): UseTimeTrackingResult {
  const trackerRef = useRef<TimeTracker>(new TimeTracker())

  // questionId が変わるたびにリセットして計測開始
  useEffect(() => {
    const tracker = trackerRef.current
    tracker.reset()
    tracker.start()
  }, [questionId])

  // Page Visibility API: タブが非表示になったら pause、戻ったら resume
  useEffect(() => {
    const tracker = trackerRef.current

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        tracker.pause()
      } else {
        tracker.resume()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, []) // マウント時に一度だけ登録

  return {
    getElapsedSeconds: () => trackerRef.current.getElapsedSeconds(),
  }
}
