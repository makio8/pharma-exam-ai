import { CanvasDrawManager } from '../CanvasDrawManager'
import type { NormalizedBbox } from '../../types'

describe('CanvasDrawManager', () => {
  const canvasSize = { width: 500, height: 700 }

  describe('normalizeCoords', () => {
    it('ピクセル座標を0-1000正規化に変換する', () => {
      const mgr = new CanvasDrawManager(canvasSize)
      const result = mgr.normalizeCoords(250, 350)
      expect(result).toEqual([500, 500])
    })

    it('座標が0-1000の範囲にクランプされる', () => {
      const mgr = new CanvasDrawManager(canvasSize)
      const result = mgr.normalizeCoords(-10, 800)
      expect(result[0]).toBe(0)
      expect(result[1]).toBe(1000)
    })
  })

  describe('createBbox', () => {
    it('ドラッグ開始/終了からNormalizedBboxを生成する', () => {
      const mgr = new CanvasDrawManager(canvasSize)
      const bbox = mgr.createBbox(50, 70, 200, 280)
      expect(bbox).toEqual([100, 100, 400, 400])
    })

    it('逆方向ドラッグでもy1<y2, x1<x2が保証される', () => {
      const mgr = new CanvasDrawManager(canvasSize)
      const bbox = mgr.createBbox(200, 280, 50, 70)
      expect(bbox![0]).toBeLessThan(bbox![2])
      expect(bbox![1]).toBeLessThan(bbox![3])
    })

    it('最小サイズ未満はnullを返す', () => {
      const mgr = new CanvasDrawManager(canvasSize)
      const bbox = mgr.createBbox(100, 100, 105, 105)
      expect(bbox).toBeNull()
    })
  })

  describe('hitTest', () => {
    it('座標がbbox内ならインデックスを返す', () => {
      const mgr = new CanvasDrawManager(canvasSize)
      const bboxes: NormalizedBbox[] = [[100, 100, 400, 400]]
      const idx = mgr.hitTest(150, 175, bboxes)
      expect(idx).toBe(0)
    })

    it('bbox外ならnullを返す', () => {
      const mgr = new CanvasDrawManager(canvasSize)
      const bboxes: NormalizedBbox[] = [[100, 100, 400, 400]]
      const idx = mgr.hitTest(5, 5, bboxes)
      expect(idx).toBeNull()
    })

    it('複数bboxが重なる場合、後に描画された方を返す', () => {
      const mgr = new CanvasDrawManager(canvasSize)
      const bboxes: NormalizedBbox[] = [
        [0, 0, 500, 500],
        [100, 100, 400, 400],
      ]
      const idx = mgr.hitTest(150, 175, bboxes)
      expect(idx).toBe(1)
    })
  })

  describe('moveBbox', () => {
    it('bboxをdx, dyピクセル分移動する', () => {
      const mgr = new CanvasDrawManager(canvasSize)
      const bbox: NormalizedBbox = [100, 100, 400, 400]
      const moved = mgr.moveBbox(bbox, 50, 70)
      expect(moved).toEqual([200, 200, 500, 500])
    })

    it('画面外にはみ出さないようクランプする', () => {
      const mgr = new CanvasDrawManager(canvasSize)
      const bbox: NormalizedBbox = [800, 800, 900, 900]
      const moved = mgr.moveBbox(bbox, 250, 350)
      expect(moved[2]).toBeLessThanOrEqual(1000)
      expect(moved[3]).toBeLessThanOrEqual(1000)
    })
  })

  describe('toDisplayCoords', () => {
    it('正規化座標をピクセル座標に変換する', () => {
      const mgr = new CanvasDrawManager(canvasSize)
      const display = mgr.toDisplayCoords([100, 200, 400, 600])
      expect(display).toEqual({
        x: 200 / 1000 * 500,
        y: 100 / 1000 * 700,
        width: (600 - 200) / 1000 * 500,
        height: (400 - 100) / 1000 * 700,
      })
    })
  })
})
