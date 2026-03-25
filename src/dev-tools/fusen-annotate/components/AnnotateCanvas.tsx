import { useRef, useEffect, useCallback, useState } from 'react'
import { useCanvasDraw } from '../hooks/useCanvasDraw'
import { drawBboxes, drawPreviewRect } from '../utils/drawBboxes'
import type { NormalizedBbox } from '../types'
import styles from './AnnotateCanvas.module.css'

interface Props {
  imageUrl: string
  bboxes: NormalizedBbox[]
  selectedIndex: number | null
  onSelect: (index: number | null) => void
  onAddBbox: (bbox: NormalizedBbox) => void
  onUpdateBbox: (index: number, bbox: NormalizedBbox) => void
  onDrawingChange: (isDrawing: boolean) => void
}

export function AnnotateCanvas({
  imageUrl, bboxes, selectedIndex, onSelect, onAddBbox, onUpdateBbox, onDrawingChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    isDrawing, dragState, getMovingBbox, updateCanvasSize,
    handleMouseDown, handleMouseMove, handleMouseUp,
  } = useCanvasDraw({ bboxes, onAddBbox, onUpdateBbox, selectedIndex, onSelect })

  // Propagate isDrawing to parent
  useEffect(() => {
    onDrawingChange(isDrawing)
  }, [isDrawing, onDrawingChange])

  // Image loading
  useEffect(() => {
    setLoading(true)
    setError(null)
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setLoading(false)
    }
    img.onerror = () => {
      setError('画像が見つかりません')
      setLoading(false)
    }
    img.src = imageUrl
  }, [imageUrl])

  // Canvas rendering
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return

    const container = canvas.parentElement
    if (!container) return

    const containerW = container.clientWidth - 16
    const containerH = container.clientHeight - 16
    const scale = Math.min(containerW / img.width, containerH / img.height)
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)

    canvas.width = w
    canvas.height = h
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    updateCanvasSize(w, h)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(img, 0, 0, w, h)

    // For move preview: temporarily replace the moving bbox with its preview position
    const movingBbox = getMovingBbox()
    const displayBboxes = movingBbox && dragState.current?.moveIndex != null
      ? bboxes.map((b, i) => i === dragState.current!.moveIndex ? movingBbox : b)
      : bboxes

    drawBboxes({ ctx, bboxes: displayBboxes, canvasWidth: w, canvasHeight: h, selectedIndex })

    const drag = dragState.current
    if (drag && drag.mode === 'draw') {
      drawPreviewRect(ctx, drag.startX, drag.startY, drag.currentX, drag.currentY)
    }
  }, [bboxes, selectedIndex, updateCanvasSize, dragState, getMovingBbox])

  // Render trigger
  useEffect(() => {
    if (!loading && !error) {
      const rafId = requestAnimationFrame(render)
      return () => cancelAnimationFrame(rafId)
    }
  }, [loading, error, render, isDrawing, bboxes, selectedIndex])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (canvasRef.current) handleMouseDown(e.nativeEvent, canvasRef.current)
  }, [handleMouseDown])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (canvasRef.current) handleMouseMove(e.nativeEvent, canvasRef.current)
    if (dragState.current) requestAnimationFrame(render)
  }, [handleMouseMove, dragState, render])

  const onMouseUp = useCallback(() => {
    handleMouseUp()
  }, [handleMouseUp])

  if (loading) return <div className={styles.canvasContainer}><span className={styles.spinner}>読み込み中...</span></div>
  if (error) return <div className={styles.canvasContainer}><span className={styles.errorMsg}>{error}</span></div>

  return (
    <div className={styles.canvasContainer}>
      <canvas
        ref={canvasRef}
        className={`${styles.canvas} ${selectedIndex !== null && isDrawing ? styles.moving : ''}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />
    </div>
  )
}
