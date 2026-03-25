import { useState, useRef, useCallback, useEffect } from 'react'
import type { RefObject } from 'react'
import type { PdfCropRect } from '../types'
import styles from './PdfCropper.module.css'

interface DragState {
  startX: number
  startY: number
  currentX: number
  currentY: number
  isDragging: boolean
}

interface CropRect {
  x: number
  y: number
  w: number
  h: number
}

interface PdfCropperProps {
  canvasRef: RefObject<HTMLCanvasElement | null>
  pdfFile: string
  pdfPage: number
  viewportWidth: number
  viewportHeight: number
  scale: number
  onSave: (crop: PdfCropRect) => void
  onCancel: () => void
}

function normalizeRect(drag: DragState): CropRect {
  const x = Math.min(drag.startX, drag.currentX)
  const y = Math.min(drag.startY, drag.currentY)
  const w = Math.abs(drag.currentX - drag.startX)
  const h = Math.abs(drag.currentY - drag.startY)
  return { x, y, w, h }
}

export function PdfCropper({
  canvasRef,
  pdfFile,
  pdfPage,
  viewportWidth,
  viewportHeight,
  scale,
  onSave,
  onCancel,
}: PdfCropperProps) {
  const overlayRef = useRef<SVGSVGElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [finalRect, setFinalRect] = useState<CropRect | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // オーバーレイはキャンバスの上に絶対配置するため、位置を追跡
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateRect = () => {
      setCanvasRect(canvas.getBoundingClientRect())
    }
    updateRect()

    const ro = new ResizeObserver(updateRect)
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [canvasRef])

  // マウス座標 → Canvas相対座標（CSS px）
  function toCanvasCoords(e: React.MouseEvent): { x: number; y: number } | null {
    if (!canvasRect) return null
    return {
      x: Math.max(0, Math.min(canvasRect.width, e.clientX - canvasRect.left)),
      y: Math.max(0, Math.min(canvasRect.height, e.clientY - canvasRect.top)),
    }
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const coords = toCanvasCoords(e)
    if (!coords) return
    e.preventDefault()
    setFinalRect(null)
    setPreviewUrl(null)
    setDrag({
      startX: coords.x,
      startY: coords.y,
      currentX: coords.x,
      currentY: coords.y,
      isDragging: true,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRect])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag?.isDragging) return
    const coords = toCanvasCoords(e)
    if (!coords) return
    setDrag(prev => prev ? { ...prev, currentX: coords.x, currentY: coords.y } : null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, canvasRect])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!drag?.isDragging) return
    const coords = toCanvasCoords(e)
    if (!coords) return
    const updated = { ...drag, currentX: coords.x, currentY: coords.y, isDragging: false }
    const rect = normalizeRect(updated)
    if (rect.w > 4 && rect.h > 4 && canvasRect) {
      setFinalRect(rect)
      // ドラッグ完了時に自動保存（プレビュー/保存ボタン不要に）
      const crop: PdfCropRect = {
        x: rect.x / canvasRect.width,
        y: rect.y / canvasRect.height,
        w: rect.w / canvasRect.width,
        h: rect.h / canvasRect.height,
        viewportWidth,
        viewportHeight,
        scale,
        rotation: 0,
      }
      onSave(crop)
    }
    setDrag(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, canvasRect, viewportWidth, viewportHeight, scale, onSave])

  // プレビュー: 選択範囲をCanvas内でクロップ
  function handlePreview() {
    if (!finalRect || !canvasRef.current || !canvasRect) return

    const canvas = canvasRef.current
    // CSS px → Canvas実ピクセル比率
    const scaleX = canvas.width / canvasRect.width
    const scaleY = canvas.height / canvasRect.height

    const px = finalRect.x * scaleX
    const py = finalRect.y * scaleY
    const pw = finalRect.w * scaleX
    const ph = finalRect.h * scaleY

    const previewCanvas = document.createElement('canvas')
    previewCanvas.width = pw
    previewCanvas.height = ph
    const ctx = previewCanvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(canvas, px, py, pw, ph, 0, 0, pw, ph)
    const url = previewCanvas.toDataURL('image/png')
    setPreviewUrl(url)
  }

  // 保存: 相対座標に変換して PdfCropRect を生成
  function handleSave() {
    if (!finalRect || !canvasRect) return

    // CSS px → 0.0-1.0 相対座標（canvas表示サイズ基準）
    const relX = finalRect.x / canvasRect.width
    const relY = finalRect.y / canvasRect.height
    const relW = finalRect.w / canvasRect.width
    const relH = finalRect.h / canvasRect.height

    const crop: PdfCropRect = {
      x: relX,
      y: relY,
      w: relW,
      h: relH,
      viewportWidth,
      viewportHeight,
      scale,
      rotation: 0,
    }
    onSave(crop)
  }

  // 現在のドラッグ or 確定済み矩形
  const displayRect = drag ? normalizeRect(drag) : finalRect

  if (!canvasRect) return null

  return (
    <div className={styles.wrapper}>
      {/* SVGオーバーレイ（キャンバスの上に重ねる） */}
      <svg
        ref={overlayRef}
        className={styles.overlay}
        style={{
          position: 'fixed',
          left: canvasRect.left,
          top: canvasRect.top,
          width: canvasRect.width,
          height: canvasRect.height,
          zIndex: 9999,
          cursor: 'crosshair',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 暗いオーバーレイ */}
        <rect
          x={0}
          y={0}
          width={canvasRect.width}
          height={canvasRect.height}
          fill="rgba(0,0,0,0.35)"
        />

        {/* 選択範囲（半透明青） */}
        {displayRect && displayRect.w > 0 && displayRect.h > 0 && (
          <>
            {/* クリアマスク（選択範囲を明るくする） */}
            <rect
              x={displayRect.x}
              y={displayRect.y}
              width={displayRect.w}
              height={displayRect.h}
              fill="rgba(255,255,255,0.15)"
              stroke="#2196F3"
              strokeWidth={2}
              strokeDasharray={finalRect ? 'none' : '4 2'}
            />
          </>
        )}

        {/* 使い方テキスト（未選択時） */}
        {!displayRect && (
          <text
            x={canvasRect.width / 2}
            y={canvasRect.height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.85)"
            fontSize="14"
            fontFamily="inherit"
          >
            ドラッグしてクロップ範囲を選択
          </text>
        )}
      </svg>

      {/* コントロールパネル */}
      <div className={styles.controls}>
        <span className={styles.controlsTitle}>クロップモード</span>

        <span className={styles.fileInfo}>
          {pdfFile} p.{pdfPage}
        </span>

        {finalRect && (
          <span className={styles.rectInfo}>
            ({Math.round(finalRect.x)}, {Math.round(finalRect.y)}) {Math.round(finalRect.w)}×{Math.round(finalRect.h)}px
          </span>
        )}

        <button
          className={styles.previewBtn}
          onClick={handlePreview}
          disabled={!finalRect}
          type="button"
        >
          プレビュー
        </button>

        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={!finalRect}
          type="button"
        >
          保存
        </button>

        <button
          className={styles.cancelBtn}
          onClick={onCancel}
          type="button"
        >
          キャンセル
        </button>
      </div>

      {/* プレビュー画像 */}
      {previewUrl && (
        <div className={styles.previewArea}>
          <p className={styles.previewLabel}>クロップ結果プレビュー</p>
          <img
            src={previewUrl}
            alt="クロッププレビュー"
            className={styles.previewImg}
          />
        </div>
      )}
    </div>
  )
}
