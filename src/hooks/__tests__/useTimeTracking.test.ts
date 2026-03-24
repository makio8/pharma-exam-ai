/**
 * useTimeTracking のロジック単体テスト
 *
 * @testing-library/react と jsdom が未導入のため、
 * フックが内部で使う純粋関数（calcElapsedSeconds / TimeTracker クラス）を
 * 直接テストする。React 部分（useEffect / useRef）は統合テストに委ねる。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calcElapsedSeconds, TimeTracker } from '../useTimeTracking'

// ---------- calcElapsedSeconds ----------

describe('calcElapsedSeconds', () => {
  it('startTime から現在までの秒数を返す', () => {
    const now = Date.now()
    const startTime = now - 5000 // 5 秒前
    const result = calcElapsedSeconds(startTime, now)
    expect(result).toBe(5)
  })

  it('端数は切り捨てる', () => {
    const now = Date.now()
    const startTime = now - 7800 // 7.8 秒前
    const result = calcElapsedSeconds(startTime, now)
    expect(result).toBe(7)
  })

  it('0 秒の場合は 0 を返す', () => {
    const now = Date.now()
    expect(calcElapsedSeconds(now, now)).toBe(0)
  })
})

// ---------- TimeTracker ----------

describe('TimeTracker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('作成直後は elapsed が 0', () => {
    const tracker = new TimeTracker()
    expect(tracker.getElapsedSeconds()).toBe(0)
  })

  it('start() 後に時間が経過すると elapsed が増える', () => {
    const tracker = new TimeTracker()
    tracker.start()
    vi.advanceTimersByTime(3000) // 3 秒進める
    expect(tracker.getElapsedSeconds()).toBe(3)
  })

  it('pause() 中は時間が進まない', () => {
    const tracker = new TimeTracker()
    tracker.start()
    vi.advanceTimersByTime(2000) // 2 秒
    tracker.pause()
    vi.advanceTimersByTime(5000) // pause 中に 5 秒
    expect(tracker.getElapsedSeconds()).toBe(2) // pause 前の 2 秒のみ
  })

  it('pause() 後に resume() すると再び計測される', () => {
    const tracker = new TimeTracker()
    tracker.start()
    vi.advanceTimersByTime(2000)
    tracker.pause()
    vi.advanceTimersByTime(5000) // pause 中
    tracker.resume()
    vi.advanceTimersByTime(3000)
    expect(tracker.getElapsedSeconds()).toBe(5) // 2 + 3
  })

  it('reset() すると elapsed が 0 に戻る', () => {
    const tracker = new TimeTracker()
    tracker.start()
    vi.advanceTimersByTime(10000)
    tracker.reset()
    expect(tracker.getElapsedSeconds()).toBe(0)
  })

  it('reset() 後に start() すると新しい計測が始まる', () => {
    const tracker = new TimeTracker()
    tracker.start()
    vi.advanceTimersByTime(10000)
    tracker.reset()
    tracker.start()
    vi.advanceTimersByTime(4000)
    expect(tracker.getElapsedSeconds()).toBe(4)
  })

  it('questionId 変更を模倣: reset() → start() で前の時間が引き継がれない', () => {
    const tracker = new TimeTracker()
    // Q1 計測
    tracker.start()
    vi.advanceTimersByTime(8000)
    // Q2 に切り替え（reset → start）
    tracker.reset()
    tracker.start()
    vi.advanceTimersByTime(3000)
    expect(tracker.getElapsedSeconds()).toBe(3)
  })
})
