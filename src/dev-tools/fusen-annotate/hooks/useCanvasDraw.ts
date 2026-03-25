import { useRef, useCallback, useState } from 'react'
import { CanvasDrawManager } from '../utils/CanvasDrawManager'
import type { NormalizedBbox } from '../types'

interface UseCanvasDrawOptions {
  bboxes: NormalizedBbox[]
  onAddBbox: (bbox: NormalizedBbox) => void
  onUpdateBbox: (index: number, bbox: NormalizedBbox) => void
  selectedIndex: number | null
  onSelect: (index: number | null) => void
}

export function useCanvasDraw(opts: UseCanvasDrawOptions) {
  const { bboxes, onAddBbox, onUpdateBbox, selectedIndex, onSelect } = opts
  const mgrRef = useRef(new CanvasDrawManager({ width: 1, height: 1 }))
  const [isDrawing, setIsDrawing] = useState(false)
  const dragRef = useRef<{
    mode: 'draw' | 'move'
    startX: number
    startY: number
    currentX: number
    currentY: number
    moveIndex?: number
    originalBbox?: NormalizedBbox
  } | null>(null)

  const updateCanvasSize = useCallback((width: number, height: number) => {
    mgrRef.current.updateSize({ width, height })
  }, [])

  const getCanvasCoords = useCallback((e: MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const handleMouseDown = useCallback((e: MouseEvent, canvas: HTMLCanvasElement) => {
    const { x, y } = getCanvasCoords(e, canvas)
    const hitIdx = mgrRef.current.hitTest(x, y, bboxes)

    if (hitIdx !== null && hitIdx === selectedIndex) {
      dragRef.current = {
        mode: 'move', startX: x, startY: y, currentX: x, currentY: y,
        moveIndex: hitIdx, originalBbox: [...bboxes[hitIdx]] as NormalizedBbox,
      }
    } else if (hitIdx !== null) {
      onSelect(hitIdx)
      return
    } else {
      onSelect(null)
      dragRef.current = { mode: 'draw', startX: x, startY: y, currentX: x, currentY: y }
    }
    setIsDrawing(true)
  }, [bboxes, selectedIndex, onSelect, getCanvasCoords])

  const handleMouseMove = useCallback((e: MouseEvent, canvas: HTMLCanvasElement) => {
    if (!dragRef.current) return
    const { x, y } = getCanvasCoords(e, canvas)
    dragRef.current.currentX = x
    dragRef.current.currentY = y
  }, [getCanvasCoords])

  const getMovingBbox = useCallback((): NormalizedBbox | null => {
    const drag = dragRef.current
    if (!drag || drag.mode !== 'move' || !drag.originalBbox) return null
    const dx = drag.currentX - drag.startX
    const dy = drag.currentY - drag.startY
    return mgrRef.current.moveBbox(drag.originalBbox, dx, dy)
  }, [])

  const handleMouseUp = useCallback(() => {
    if (!dragRef.current) return
    if (dragRef.current.mode === 'draw') {
      const bbox = mgrRef.current.createBbox(
        dragRef.current.startX, dragRef.current.startY,
        dragRef.current.currentX, dragRef.current.currentY,
      )
      if (bbox) onAddBbox(bbox)
    } else if (dragRef.current.mode === 'move' && dragRef.current.originalBbox != null) {
      const dx = dragRef.current.currentX - dragRef.current.startX
      const dy = dragRef.current.currentY - dragRef.current.startY
      const moved = mgrRef.current.moveBbox(dragRef.current.originalBbox, dx, dy)
      onUpdateBbox(dragRef.current.moveIndex!, moved)
    }
    dragRef.current = null
    setIsDrawing(false)
  }, [onAddBbox, onUpdateBbox])

  return {
    isDrawing,
    dragState: dragRef,
    getMovingBbox,
    updateCanvasSize,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  }
}
