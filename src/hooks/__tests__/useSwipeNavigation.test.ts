/**
 * useSwipeNavigation のロジック単体テスト
 *
 * @testing-library/react と jsdom が未導入のため、
 * フックが内部で使う SwipeNavigator クラスを直接テストする。
 * React 部分（useRef / useNavigate）は統合テストに委ねる。
 */
import { describe, it, expect } from 'vitest'
import { SwipeNavigator } from '../useSwipeNavigation'

// ---------- テスト用ヘルパー ----------

/** 通常の問題のミニマル Question モック */
function makeQuestion(id: string, year: number, questionNumber: number, linkedGroup?: string) {
  return { id, year, question_number: questionNumber, linked_group: linkedGroup }
}

// ---------- SwipeNavigator: 基本ナビゲーション ----------

describe('SwipeNavigator: 基本ナビゲーション', () => {
  it('currentId="b" → prevId="a", nextId="c", currentIndex=1, totalCount=3', () => {
    const questions = [
      makeQuestion('a', 108, 1),
      makeQuestion('b', 108, 2),
      makeQuestion('c', 108, 3),
    ]
    const nav = new SwipeNavigator(['a', 'b', 'c'], 'b', questions)

    expect(nav.prevId).toBe('a')
    expect(nav.nextId).toBe('c')
    expect(nav.currentIndex).toBe(1)
    expect(nav.totalCount).toBe(3)
  })

  it('currentId="a" → canGoPrev=false, canGoNext=true', () => {
    const questions = [
      makeQuestion('a', 108, 1),
      makeQuestion('b', 108, 2),
      makeQuestion('c', 108, 3),
    ]
    const nav = new SwipeNavigator(['a', 'b', 'c'], 'a', questions)

    expect(nav.prevId).toBeNull()
    expect(nav.canGoPrev).toBe(false)
    expect(nav.nextId).toBe('b')
    expect(nav.canGoNext).toBe(true)
    expect(nav.currentIndex).toBe(0)
  })

  it('currentId="c" → canGoPrev=true, canGoNext=false', () => {
    const questions = [
      makeQuestion('a', 108, 1),
      makeQuestion('b', 108, 2),
      makeQuestion('c', 108, 3),
    ]
    const nav = new SwipeNavigator(['a', 'b', 'c'], 'c', questions)

    expect(nav.prevId).toBe('b')
    expect(nav.canGoPrev).toBe(true)
    expect(nav.nextId).toBeNull()
    expect(nav.canGoNext).toBe(false)
    expect(nav.currentIndex).toBe(2)
  })

  it('sessionIds が空の場合 → currentIndex=0, totalCount=0, canGoPrev=false, canGoNext=false', () => {
    const nav = new SwipeNavigator([], 'a', [])

    expect(nav.prevId).toBeNull()
    expect(nav.nextId).toBeNull()
    expect(nav.canGoPrev).toBe(false)
    expect(nav.canGoNext).toBe(false)
    expect(nav.currentIndex).toBe(0)
    expect(nav.totalCount).toBe(0)
  })
})

// ---------- SwipeNavigator: 連問グループスキップ ----------

describe('SwipeNavigator: 連問グループスキップ', () => {
  /**
   * セッション: [q105, q106-linked-195-197, q107-linked-195-197, q108, q109]
   * linked_group = "r108-195-197"（第108回 195〜197 問）
   *
   * q106 と q107 は同じグループ。
   * q105 の nextId は、グループの先頭 q106 になるべき。
   * q108 の prevId は、グループの先頭 q106 になるべき（グループ内のどこでも同じ先頭に飛ぶ）。
   */
  it('nextId: グループ後の問題から見ると、グループ先頭へのIDを返す', () => {
    const linkedGroup = 'r108-195-197'
    const questions = [
      makeQuestion('q105', 108, 194),
      makeQuestion('q106', 108, 195, linkedGroup),
      makeQuestion('q107', 108, 196, linkedGroup),
      makeQuestion('q108', 108, 197, linkedGroup),
      makeQuestion('q109', 108, 198),
    ]
    const sessionIds = ['q105', 'q106', 'q107', 'q108', 'q109']
    const nav = new SwipeNavigator(sessionIds, 'q105', questions)

    // q105 の次 = グループ先頭の q106
    expect(nav.nextId).toBe('q106')
  })

  it('prevId: グループ後の問題からは、グループ先頭を返す', () => {
    const linkedGroup = 'r108-195-197'
    const questions = [
      makeQuestion('q105', 108, 194),
      makeQuestion('q106', 108, 195, linkedGroup),
      makeQuestion('q107', 108, 196, linkedGroup),
      makeQuestion('q108', 108, 197, linkedGroup),
      makeQuestion('q109', 108, 198),
    ]
    const sessionIds = ['q105', 'q106', 'q107', 'q108', 'q109']
    const nav = new SwipeNavigator(sessionIds, 'q109', questions)

    // q109 の prev = グループ先頭の q106（グループの終端 q108 が「前」だが、先頭に飛ぶ）
    expect(nav.prevId).toBe('q106')
  })

  it('グループ先頭 (q106) の currentIndex はセッション内のインデックスを返す', () => {
    const linkedGroup = 'r108-195-197'
    const questions = [
      makeQuestion('q105', 108, 194),
      makeQuestion('q106', 108, 195, linkedGroup),
      makeQuestion('q107', 108, 196, linkedGroup),
      makeQuestion('q108', 108, 197, linkedGroup),
      makeQuestion('q109', 108, 198),
    ]
    const sessionIds = ['q105', 'q106', 'q107', 'q108', 'q109']
    const nav = new SwipeNavigator(sessionIds, 'q106', questions)

    // q106 はインデックス 1
    expect(nav.currentIndex).toBe(1)
    // prev: q105
    expect(nav.prevId).toBe('q105')
    // next: グループを飛び越えて q109
    expect(nav.nextId).toBe('q109')
  })

  it('getGroupStartId: グループ内の問題はすべて先頭IDを返す', () => {
    const linkedGroup = 'r108-195-197'
    const questions = [
      makeQuestion('q106', 108, 195, linkedGroup),
      makeQuestion('q107', 108, 196, linkedGroup),
      makeQuestion('q108', 108, 197, linkedGroup),
    ]
    const sessionIds = ['q106', 'q107', 'q108']
    const nav106 = new SwipeNavigator(sessionIds, 'q106', questions)
    const nav107 = new SwipeNavigator(sessionIds, 'q107', questions)
    const nav108 = new SwipeNavigator(sessionIds, 'q108', questions)

    // すべてグループ先頭 q106 に解決される
    expect(nav106.resolveGroupStartId('q106')).toBe('q106')
    expect(nav107.resolveGroupStartId('q107')).toBe('q106')
    expect(nav108.resolveGroupStartId('q108')).toBe('q106')
  })
})

// ---------- SwipeNavigator: スワイプ閾値 ----------

describe('SwipeNavigator: スワイプ閾値', () => {
  it('50px 以上の左スワイプ → shouldGoNext=true', () => {
    const nav = new SwipeNavigator(['a', 'b', 'c'], 'a', [
      makeQuestion('a', 108, 1),
      makeQuestion('b', 108, 2),
      makeQuestion('c', 108, 3),
    ])

    const result = nav.evaluateSwipe(100, -60) // startX=100, deltaX=-60 (左スワイプ)
    expect(result).toBe('next')
  })

  it('50px 以上の右スワイプ → shouldGoPrev=true', () => {
    const nav = new SwipeNavigator(['a', 'b', 'c'], 'c', [
      makeQuestion('a', 108, 1),
      makeQuestion('b', 108, 2),
      makeQuestion('c', 108, 3),
    ])

    const result = nav.evaluateSwipe(100, 70) // startX=100, deltaX=+70 (右スワイプ)
    expect(result).toBe('prev')
  })

  it('49px 以下のスワイプ → none (閾値未満)', () => {
    const nav = new SwipeNavigator(['a', 'b', 'c'], 'b', [
      makeQuestion('a', 108, 1),
      makeQuestion('b', 108, 2),
      makeQuestion('c', 108, 3),
    ])

    expect(nav.evaluateSwipe(100, 49)).toBe('none')
    expect(nav.evaluateSwipe(100, -49)).toBe('none')
  })

  it('左スワイプでも nextId=null なら none', () => {
    const nav = new SwipeNavigator(['a', 'b', 'c'], 'c', [
      makeQuestion('a', 108, 1),
      makeQuestion('b', 108, 2),
      makeQuestion('c', 108, 3),
    ])

    // c は末尾なので next がない
    const result = nav.evaluateSwipe(100, -60)
    expect(result).toBe('none')
  })

  it('右スワイプでも prevId=null なら none', () => {
    const nav = new SwipeNavigator(['a', 'b', 'c'], 'a', [
      makeQuestion('a', 108, 1),
      makeQuestion('b', 108, 2),
      makeQuestion('c', 108, 3),
    ])

    // a は先頭なので prev がない
    const result = nav.evaluateSwipe(100, 70)
    expect(result).toBe('none')
  })
})
