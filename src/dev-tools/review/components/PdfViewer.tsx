import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import type { KeyboardEvent } from 'react'
import type { PageEstimate } from '../hooks/usePdfNavigation'
import styles from './PdfViewer.module.css'

/** 外部からPDFページ操作するためのハンドル */
export interface PdfViewerHandle {
  goToPrev: () => void
  goToNext: () => void
}

// pdfjs-dist の型
type PDFDocumentProxy = import('pdfjs-dist').PDFDocumentProxy

interface PdfViewerProps {
  pdfFile: string
  page: number
  confidence: PageEstimate['confidence']
  onPageChange: (page: number) => void
  onConfirmPage: (pdfFile: string, page: number) => void
  pdfFiles: string[]
  onPdfFileChange: (file: string) => void
  /** Canvas 参照を外部から受け取る（PdfCropper との共有用）*/
  canvasRef?: React.RefObject<HTMLCanvasElement | null>
  /** ページレンダリング完了時のコールバック（viewport サイズ取得用） */
  onCanvasReady?: () => void
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error'

const SCALE = 1.5

async function initPdfJs() {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).href
  return pdfjs
}

// vite.config.ts の define で注入される絶対パス
declare const __PDF_ROOT__: string

function getPdfUrl(filename: string): string {
  // Vite dev server: /@fs/ + 絶対パスでserver.fs.allow内のファイルにアクセス
  return `/@fs/${__PDF_ROOT__}/${filename}`
}

export const PdfViewer = forwardRef<PdfViewerHandle, PdfViewerProps>(function PdfViewer({
  pdfFile,
  page,
  confidence,
  onPageChange,
  onConfirmPage,
  pdfFiles,
  onPdfFileChange,
  canvasRef: externalCanvasRef,
  onCanvasReady,
}, ref) {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null)
  // 外部から canvasRef が渡されればそちらを使い、なければ内部 ref を使う
  const canvasRef = externalCanvasRef ?? internalCanvasRef

  const pdfDocRef = useRef<PDFDocumentProxy | null>(null)
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null)
  const onCanvasReadyRef = useRef(onCanvasReady)
  onCanvasReadyRef.current = onCanvasReady

  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(page)
  const [pageInputValue, setPageInputValue] = useState(String(page))

  // PDFファイルが変わったらドキュメントを読み込む
  useEffect(() => {
    if (!pdfFile) return

    let cancelled = false

    async function loadDocument() {
      setLoadState('loading')
      setErrorMsg('')
      pdfDocRef.current = null

      try {
        const pdfjs = await initPdfJs()
        const url = getPdfUrl(pdfFile)
        const loadingTask = pdfjs.getDocument(url)
        const doc = await loadingTask.promise

        if (cancelled) return

        pdfDocRef.current = doc
        const numPages = doc.numPages
        setTotalPages(numPages)
        // 推定ページが実ページ数を超えている場合はクランプ
        setCurrentPage(prev => {
          if (prev > numPages) {
            setPageInputValue(String(numPages))
            onPageChange(numPages)
            return numPages
          }
          return prev
        })
        setLoadState('loaded')
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : String(err)
        setErrorMsg(msg)
        setLoadState('error')
      }
    }

    loadDocument()
    return () => { cancelled = true }
  }, [pdfFile])

  // pageプロップが変わったら内部ページも追随（外部から変更された場合）
  useEffect(() => {
    setCurrentPage(page)
    setPageInputValue(String(page))
  }, [page])

  // ページをレンダリング
  const renderPage = useCallback(async (pageNum: number) => {
    const doc = pdfDocRef.current
    const canvas = canvasRef.current
    if (!doc || !canvas) return

    // 進行中のレンダリングをキャンセル
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel()
      renderTaskRef.current = null
    }

    const clamped = Math.max(1, Math.min(doc.numPages, pageNum))

    try {
      const pdfPage = await doc.getPage(clamped)
      const viewport = pdfPage.getViewport({ scale: SCALE })

      canvas.width = viewport.width
      canvas.height = viewport.height

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const task = pdfPage.render({ canvasContext: ctx, viewport, canvas })
      renderTaskRef.current = task

      await task.promise
      renderTaskRef.current = null

      // レンダリング完了通知
      onCanvasReadyRef.current?.()
    } catch (err) {
      // RenderingCancelledException は無視
      if (err instanceof Error && err.name === 'RenderingCancelledException') return
      console.error('[PdfViewer] render error:', err)
    }
  }, [canvasRef])

  // ドキュメントロード完了後 or ページ変更時にレンダリング
  useEffect(() => {
    if (loadState !== 'loaded') return
    renderPage(currentPage)
  }, [loadState, currentPage, renderPage])

  function goToPage(pageNum: number) {
    const clamped = Math.max(1, Math.min(totalPages || 1, pageNum))
    setCurrentPage(clamped)
    setPageInputValue(String(clamped))
    onPageChange(clamped)
  }

  // 外部からページ操作できるハンドルを公開
  useImperativeHandle(ref, () => ({
    goToPrev: () => goToPage(currentPage - 1),
    goToNext: () => goToPage(currentPage + 1),
  }))

  function handlePageInputChange(value: string) {
    setPageInputValue(value)
  }

  function handlePageInputCommit(e: KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) {
    const num = parseInt(pageInputValue, 10)
    if (!isNaN(num)) {
      goToPage(num)
    } else {
      setPageInputValue(String(currentPage))
    }
    // Enter キーの場合はフォーカスを外す
    if ('key' in e && e.key === 'Enter') {
      (e.target as HTMLInputElement).blur()
    }
  }

  function handleConfirm() {
    onConfirmPage(pdfFile, currentPage)
  }

  function handleRetry() {
    setLoadState('idle')
    // useEffect が pdfFile 依存で再実行されないので、一時的に状態変更後 idle→loading
    setTimeout(() => setLoadState('loading'), 0)
    pdfDocRef.current = null
    const loadDoc = async () => {
      try {
        const pdfjs = await initPdfJs()
        const url = getPdfUrl(pdfFile)
        const doc = await pdfjs.getDocument(url).promise
        pdfDocRef.current = doc
        const numPages = doc.numPages
        setTotalPages(numPages)
        setCurrentPage(prev => {
          if (prev > numPages) {
            setPageInputValue(String(numPages))
            onPageChange(numPages)
            return numPages
          }
          return prev
        })
        setLoadState('loaded')
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setErrorMsg(msg)
        setLoadState('error')
      }
    }
    loadDoc()
  }

  // confidence バッジのクラス
  const badgeClass =
    confidence === 'confirmed'
      ? styles.badgeConfirmed
      : confidence === 'interpolated'
        ? styles.badgeInterpolated
        : styles.badgeEstimated

  const badgeLabel =
    confidence === 'confirmed' ? '確定' : confidence === 'interpolated' ? '補間' : '推定'

  return (
    <div className={styles.root}>
      {/* PDFファイルタブ（分割PDF対応） */}
      {pdfFiles.length > 1 && (
        <div className={styles.fileTabs}>
          {pdfFiles.map((file) => (
            <button
              key={file}
              className={`${styles.fileTab} ${file === pdfFile ? styles.fileTabActive : ''}`}
              onClick={() => onPdfFileChange(file)}
              type="button"
            >
              {file}
            </button>
          ))}
        </div>
      )}

      {/* ツールバー */}
      <div className={styles.toolbar}>
        <div className={styles.navGroup}>
          <button
            className={styles.navBtn}
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || loadState !== 'loaded'}
            type="button"
            title="前のページ (P)"
            aria-label="前のページ"
          >
            ◀
          </button>

          <input
            className={styles.pageInput}
            type="number"
            min={1}
            max={totalPages || 1}
            value={pageInputValue}
            onChange={(e) => handlePageInputChange(e.target.value)}
            onBlur={handlePageInputCommit}
            onKeyDown={(e) => e.key === 'Enter' && handlePageInputCommit(e)}
            aria-label="ページ番号"
          />

          <span className={styles.pageTotal}>
            / {totalPages > 0 ? totalPages : '?'}
          </span>

          <button
            className={styles.navBtn}
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages || loadState !== 'loaded'}
            type="button"
            title="次のページ (N)"
            aria-label="次のページ"
          >
            ▶
          </button>
        </div>

        <span className={`${styles.badge} ${badgeClass}`}>{badgeLabel}</span>

        <span className={styles.keyHint}>P / N キー</span>

        <button
          className={styles.confirmBtn}
          onClick={handleConfirm}
          disabled={loadState !== 'loaded'}
          type="button"
        >
          ✓ このページで確定
        </button>
      </div>

      {/* キャンバス領域 */}
      <div className={styles.canvasArea}>
        {loadState === 'loading' && (
          <div className={styles.statusMsg}>
            <span className={styles.statusIcon}>⏳</span>
            <span>PDF 読み込み中...</span>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{pdfFile}</span>
          </div>
        )}

        {loadState === 'error' && (
          <div className={`${styles.statusMsg} ${styles.errorMsg}`}>
            <span className={styles.statusIcon}>⚠️</span>
            <span>PDF を読み込めませんでした</span>
            <span style={{ fontSize: '0.75rem' }}>{pdfFile}</span>
            <span style={{ fontSize: '0.75rem' }}>{errorMsg}</span>
            <button className={styles.retryBtn} onClick={handleRetry} type="button">
              再試行
            </button>
          </div>
        )}

        {(loadState === 'idle') && !pdfFile && (
          <div className={styles.statusMsg}>
            <span className={styles.statusIcon}>📄</span>
            <span>PDFファイルが指定されていません</span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className={styles.canvas}
          style={{ display: loadState === 'loaded' ? 'block' : 'none' }}
          aria-label={`PDF ${pdfFile} ページ ${currentPage}`}
        />
      </div>
    </div>
  )
})
