import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
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

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null

async function initPdfJs() {
  if (pdfjsPromise) return pdfjsPromise
  pdfjsPromise = (async () => {
    const pdfjs = await import('pdfjs-dist')
    // pdfjs-dist v5: workerSrc にモジュールURLを指定
    // Vite が node_modules 内のファイルを /@fs/ 経由で配信してくれる
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs',
        import.meta.url
      ).href
    }
    return pdfjs
  })()
  return pdfjsPromise
}

// vite.config.ts の define で注入される絶対パス
declare const __PDF_ROOT__: string

function getPdfUrl(filename: string): string {
  // Vite dev server: /@fs + 絶対パスでアクセス（__PDF_ROOT__は/で始まるので/@fs/は不要）
  const url = `/@fs${__PDF_ROOT__}/${filename}`
  console.log('[PdfViewer] PDF URL:', url)
  return url
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
  // 常に内部refを使用。外部refはコールバックで同期する
  const canvasRef = internalCanvasRef
  // 外部refと同期（PdfCropper用）
  useEffect(() => {
    if (externalCanvasRef && 'current' in externalCanvasRef) {
      (externalCanvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = internalCanvasRef.current
    }
  })

  // pdfDoc を state で管理することで、レンダリング useEffect の依存配列に入れられる
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
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
      setPdfDoc(null)

      try {
        console.log('[PdfViewer] initPdfJs...')
        const pdfjs = await initPdfJs()
        console.log('[PdfViewer] pdfjs loaded, workerSrc:', pdfjs.GlobalWorkerOptions.workerSrc?.slice(0, 80))
        const url = getPdfUrl(pdfFile)
        console.log('[PdfViewer] Loading document:', url)
        const loadingTask = pdfjs.getDocument(url)
        const doc = await loadingTask.promise
        console.log('[PdfViewer] Document loaded, pages:', doc.numPages)

        if (cancelled) {
          doc.destroy()
          return
        }

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
        setPdfDoc(doc)
        setLoadState('loaded')
      } catch (err) {
        if (cancelled) return
        console.error('[PdfViewer] Load error:', err)
        const msg = err instanceof Error ? err.message : String(err)
        setErrorMsg(msg)
        setLoadState('error')
      }
    }

    loadDocument()
    return () => {
      cancelled = true
    }
  }, [pdfFile])

  // pageプロップが変わったら内部ページも追随（外部から変更された場合）
  useEffect(() => {
    setCurrentPage(page)
    setPageInputValue(String(page))
  }, [page])

  // ドキュメントロード完了後 or ページ変更時にレンダリング
  // pdfDoc を依存配列に入れることで、非同期ロード完了後に確実にレンダリングされる
  useEffect(() => {
    if (!pdfDoc) return
    const canvas = canvasRef.current
    if (!canvas) {
      console.log('[PdfViewer] skip render: canvas=', !!canvas)
      return
    }

    // 進行中のレンダリングをキャンセル
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel()
      renderTaskRef.current = null
    }

    const clamped = Math.max(1, Math.min(pdfDoc.numPages, currentPage))

    const doRender = async () => {
      try {
        console.log('[PdfViewer] rendering page:', clamped)
        const pdfPage = await pdfDoc.getPage(clamped)
        const viewport = pdfPage.getViewport({ scale: SCALE })

        canvas.width = viewport.width
        canvas.height = viewport.height

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const task = pdfPage.render({ canvasContext: ctx, viewport, canvas })
        renderTaskRef.current = task

        await task.promise
        renderTaskRef.current = null
        console.log('[PdfViewer] render done:', viewport.width, 'x', viewport.height)

        onCanvasReadyRef.current?.()
      } catch (err) {
        if (err instanceof Error && err.name === 'RenderingCancelledException') return
        console.error('[PdfViewer] render error:', err)
      }
    }

    doRender()
  }, [pdfDoc, currentPage])

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
    setPdfDoc(null)
    setLoadState('loading')
    const loadDoc = async () => {
      try {
        const pdfjs = await initPdfJs()
        const url = getPdfUrl(pdfFile)
        const doc = await pdfjs.getDocument(url).promise
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
        setPdfDoc(doc)
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

      {/* デバッグ情報 */}
      <div style={{ padding: '4px 8px', fontSize: '11px', fontFamily: 'monospace', background: '#f0f0f0', borderBottom: '1px solid #ddd', wordBreak: 'break-all' }}>
        <div>状態: <b>{loadState}</b> | ファイル: {pdfFile || '(なし)'} | ページ: {currentPage}/{totalPages}</div>
        <div>URL: {pdfFile ? getPdfUrl(pdfFile) : '(なし)'}</div>
        {errorMsg && <div style={{ color: 'red' }}>エラー: {errorMsg}</div>}
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
            <span style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{errorMsg}</span>
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
          style={{
            visibility: loadState === 'loaded' ? 'visible' : 'hidden',
            border: '2px solid red', /* デバッグ用 */
            minHeight: '200px', /* デバッグ用 */
            background: '#fff', /* デバッグ用 */
          }}
          aria-label={`PDF ${pdfFile} ページ ${currentPage}`}
        />
      </div>
    </div>
  )
})
