import type { NormalizedBbox } from '../types'

const MIN_DRAG_PX = 20

interface CanvasSize {
  width: number
  height: number
}

interface DisplayRect {
  x: number
  y: number
  width: number
  height: number
}

export class CanvasDrawManager {
  constructor(private canvasSize: CanvasSize) {}

  updateSize(size: CanvasSize): void {
    this.canvasSize = size
  }

  normalizeCoords(px: number, py: number): [number, number] {
    const nx = Math.round(Math.max(0, Math.min(1000, px / this.canvasSize.width * 1000)))
    const ny = Math.round(Math.max(0, Math.min(1000, py / this.canvasSize.height * 1000)))
    return [nx, ny]
  }

  createBbox(startX: number, startY: number, endX: number, endY: number): NormalizedBbox | null {
    const pxWidth = Math.abs(endX - startX)
    const pxHeight = Math.abs(endY - startY)
    if (pxWidth < MIN_DRAG_PX || pxHeight < MIN_DRAG_PX) return null

    const [nx1, ny1] = this.normalizeCoords(Math.min(startX, endX), Math.min(startY, endY))
    const [nx2, ny2] = this.normalizeCoords(Math.max(startX, endX), Math.max(startY, endY))
    return [ny1, nx1, ny2, nx2]
  }

  hitTest(px: number, py: number, bboxes: NormalizedBbox[]): number | null {
    const [nx, ny] = this.normalizeCoords(px, py)
    for (let i = bboxes.length - 1; i >= 0; i--) {
      const [y1, x1, y2, x2] = bboxes[i]
      if (nx >= x1 && nx <= x2 && ny >= y1 && ny <= y2) return i
    }
    return null
  }

  moveBbox(bbox: NormalizedBbox, dxPx: number, dyPx: number): NormalizedBbox {
    const [y1, x1, y2, x2] = bbox
    const dnx = Math.round(dxPx / this.canvasSize.width * 1000)
    const dny = Math.round(dyPx / this.canvasSize.height * 1000)

    let newX1 = x1 + dnx
    let newY1 = y1 + dny
    let newX2 = x2 + dnx
    let newY2 = y2 + dny

    if (newX1 < 0) { newX2 -= newX1; newX1 = 0 }
    if (newY1 < 0) { newY2 -= newY1; newY1 = 0 }
    if (newX2 > 1000) { newX1 -= (newX2 - 1000); newX2 = 1000 }
    if (newY2 > 1000) { newY1 -= (newY2 - 1000); newY2 = 1000 }

    return [newY1, newX1, newY2, newX2]
  }

  toDisplayCoords(bbox: NormalizedBbox): DisplayRect {
    const [y1, x1, y2, x2] = bbox
    return {
      x: x1 / 1000 * this.canvasSize.width,
      y: y1 / 1000 * this.canvasSize.height,
      width: (x2 - x1) / 1000 * this.canvasSize.width,
      height: (y2 - y1) / 1000 * this.canvasSize.height,
    }
  }
}
