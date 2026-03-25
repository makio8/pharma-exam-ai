// src/dev-tools/fusen-annotate/utils/drawBboxes.ts
import type { NormalizedBbox } from '../types'

interface DrawBboxesOptions {
  ctx: CanvasRenderingContext2D
  bboxes: NormalizedBbox[]
  canvasWidth: number
  canvasHeight: number
  selectedIndex: number | null
}

function toPixel(bbox: NormalizedBbox, w: number, h: number) {
  const [y1, x1, y2, x2] = bbox
  return {
    x: x1 / 1000 * w,
    y: y1 / 1000 * h,
    width: (x2 - x1) / 1000 * w,
    height: (y2 - y1) / 1000 * h,
  }
}

export function drawBboxes(opts: DrawBboxesOptions): void {
  const { ctx, bboxes, canvasWidth, canvasHeight, selectedIndex } = opts

  for (let i = 0; i < bboxes.length; i++) {
    const { x, y, width, height } = toPixel(bboxes[i], canvasWidth, canvasHeight)
    const isSelected = i === selectedIndex

    ctx.save()

    ctx.strokeStyle = isSelected ? '#f97316' : '#3b82f6'
    ctx.lineWidth = isSelected ? 3 : 2
    ctx.strokeRect(x, y, width, height)

    ctx.fillStyle = isSelected ? 'rgba(249,115,22,0.15)' : 'rgba(59,130,246,0.1)'
    ctx.fillRect(x, y, width, height)

    const badgeSize = 20
    ctx.fillStyle = isSelected ? '#f97316' : '#3b82f6'
    ctx.fillRect(x, y, badgeSize, badgeSize)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(i + 1), x + badgeSize / 2, y + badgeSize / 2)

    ctx.restore()
  }
}

export function drawPreviewRect(
  ctx: CanvasRenderingContext2D,
  startX: number, startY: number,
  currentX: number, currentY: number,
): void {
  const x = Math.min(startX, currentX)
  const y = Math.min(startY, currentY)
  const w = Math.abs(currentX - startX)
  const h = Math.abs(currentY - startY)

  ctx.save()
  ctx.setLineDash([6, 3])
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, w, h)
  ctx.fillStyle = 'rgba(59,130,246,0.1)'
  ctx.fillRect(x, y, w, h)
  ctx.restore()
}
