import { useState, useMemo, useRef, useCallback } from 'react'
import { useValidationReport } from './hooks/useValidationReport'
import { useReviewState } from './hooks/useReviewState'
import { usePdfNavigation } from './hooks/usePdfNavigation'
import { useKeyboardNav } from './hooks/useKeyboardNav'
import { ReviewHeader } from './components/ReviewHeader'
import { ReviewCard } from './components/ReviewCard'
import { PdfViewer } from './components/PdfViewer'
import type { PdfViewerHandle } from './components/PdfViewer'
import { CorrectionPanel } from './components/CorrectionPanel'
import { PdfCropper } from './components/PdfCropper'
import { KeyboardHelp } from './components/KeyboardHelp'
import { ALL_QUESTIONS } from '../../data/all-questions'
import { replaceCorrections } from './utils/correction-utils'
import type { ValidationIssue } from '../../utils/data-validator/types'
import type { FilterConfig, Correction, CorrectionsFile, CropTarget, PendingCropResult, PdfCropRect } from './types'
import type { Question } from '../../types/question'
import type { QuestionSection } from '../../types/question'
import styles from './ReviewPage.module.css'

// デフォルトフィルタ: error+warning ON / 全年度 / 全区分 / 未判定
const DEFAULT_FILTERS: FilterConfig = {
  severities: ['error', 'warning'],
  years: Array.from({ length: 12 }, (_, i) => 100 + i), // 100-111
  sections: ['必須', '理論', '実践'],
  judgmentStatus: 'pending',
  rules: [],
}

const SEC_ORDER: Record<string, number> = { '必須': 0, '理論': 1, '実践': 2 }

// ===== ハッシュ関数 =====
function generateDataHash(q: Question): string {
  const str = q.question_text + JSON.stringify(q.choices) + JSON.stringify(q.correct_answer)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(36)
}

// PDF スケール（PdfViewer と同じ固定値）
const PDF_SCALE = 1.5

export default function ReviewPage() {
  const { report, loading, error } = useValidationReport()
  const reviewState = useReviewState()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [filters, setFilters] = useState<FilterConfig>(DEFAULT_FILTERS)
  const [cropMode, setCropMode] = useState(false)
  const [manualPage, setManualPage] = useState<number | null>(null)
  const [currentPdfFile, setCurrentPdfFile] = useState<string | null>(null)
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 1130 })
  const [showHelp, setShowHelp] = useState(false)

  // Multi-image crop state
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null)
  const [pendingCropResult, setPendingCropResult] = useState<PendingCropResult | null>(null)
  const [previews, setPreviews] = useState<Map<string, string>>(() => new Map())

  // PdfViewer の Canvas 参照（PdfCropper に渡す）
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // PdfViewer の命令的操作ハンドル（キーボードからのPDFページ操作用）
  const pdfViewerRef = useRef<PdfViewerHandle>(null)

  // 問題をソート: 年度→区分→問番
  const sortedQuestions = useMemo(
    () =>
      [...ALL_QUESTIONS].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        if (a.section !== b.section)
          return (SEC_ORDER[a.section] ?? 0) - (SEC_ORDER[b.section] ?? 0)
        return a.question_number - b.question_number
      }),
    []
  )

  // フィルタ適用（report が null のときは空配列）
  const filteredQuestions = useMemo(() => {
    if (!report) return []

    // showAll = true なら issue 有無を問わず全問表示
    const issueQuestionIds = filters.showAll ? null : new Set(
      report.issues
        .filter((i: ValidationIssue) => filters.severities.includes(i.severity))
        .map((i: ValidationIssue) => i.questionId)
    )

    return sortedQuestions.filter(q => {
      if (issueQuestionIds && !issueQuestionIds.has(q.id)) return false
      if (!filters.years.includes(q.year)) return false
      if (!filters.sections.includes(q.section as QuestionSection)) return false
      const j = reviewState.state.judgments[q.id]
      if (filters.judgmentStatus === 'pending') return j == null
      if (filters.judgmentStatus === 'all') return true
      return j === filters.judgmentStatus
    })
  }, [sortedQuestions, report, filters, reviewState.state.judgments])

  const safeIndex = Math.min(currentIndex, Math.max(0, filteredQuestions.length - 1))
  const currentQuestion = filteredQuestions[safeIndex]

  // PDF ナビゲーション
  const { estimate, pdfFiles } = usePdfNavigation(
    currentQuestion?.id ?? '',
    currentQuestion?.question_number ?? 1,
    currentQuestion?.year ?? 110,
    (currentQuestion?.section ?? '必須') as QuestionSection,
    reviewState.state.confirmedPdfPages
  )

  const activePage = manualPage ?? estimate.page
  const activePdfFile = currentPdfFile ?? estimate.pdfFile

  // E キーハンドラーを最新の handleExport に同期するための ref
  const handleExportRef = useRef<() => void>(() => {})

  // ===== 各ハンドラー =====
  function navigate(next: number) {
    const clamped = Math.max(0, Math.min(filteredQuestions.length - 1, next))
    setCurrentIndex(clamped)
    reviewState.setLastPosition(filteredQuestions[clamped]?.id ?? '')
    setManualPage(null)
    setCurrentPdfFile(null)
    setCropMode(false)
    setCropTarget(null)
    setPendingCropResult(null)
  }

  function handleFiltersChange(next: FilterConfig) {
    setFilters(next)
    setCurrentIndex(0)
    setManualPage(null)
    setCurrentPdfFile(null)
  }

  const handleReplaceCorrections = useCallback((newCorrections: Correction[]) => {
    if (!currentQuestion) return
    const existing = reviewState.state.corrections[currentQuestion.id] ?? []
    const merged = replaceCorrections(existing, newCorrections)
    reviewState.save({
      ...reviewState.state,
      corrections: {
        ...reviewState.state.corrections,
        [currentQuestion.id]: merged,
      },
    })
  }, [currentQuestion, reviewState])

  const handleRemoveCorrection = useCallback((index: number) => {
    if (!currentQuestion) return
    const existing = reviewState.state.corrections[currentQuestion.id] ?? []
    const next = existing.filter((_, i) => i !== index)
    reviewState.save({
      ...reviewState.state,
      corrections: {
        ...reviewState.state.corrections,
        [currentQuestion.id]: next,
      },
    })
  }, [currentQuestion, reviewState])

  const handleAddScenarioCorrection = useCallback((newCorrections: Correction[]): number => {
    if (!currentQuestion) return 0
    const linkedGroup = currentQuestion.linked_group
    if (!linkedGroup) {
      // No linked group — apply to current question only
      handleReplaceCorrections(newCorrections)
      return 1
    }

    // Find all questions in the same linked_group
    const groupQuestions = ALL_QUESTIONS.filter(q => q.linked_group === linkedGroup)
    let count = 0

    const nextCorrections = { ...reviewState.state.corrections }
    for (const q of groupQuestions) {
      const existing = nextCorrections[q.id] ?? []
      nextCorrections[q.id] = replaceCorrections(existing, newCorrections)
      count++
    }

    reviewState.save({
      ...reviewState.state,
      corrections: nextCorrections,
    })

    return count
  }, [currentQuestion, reviewState, handleReplaceCorrections])

  const handleStartCrop = useCallback((target: CropTarget) => {
    setCropTarget(target)
    setCropMode(true)
    syncViewportSize()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCropSave = useCallback((crop: PdfCropRect, previewDataUrl: string) => {
    if (!currentQuestion) return
    setPendingCropResult({
      target: cropTarget ?? 'question',
      crop,
      pdfFile: activePdfFile,
      pdfPage: activePage,
      preview: previewDataUrl,
    })
    setCropMode(false)
  }, [currentQuestion, cropTarget, activePdfFile, activePage])

  const handleConsumeCropResult = useCallback(() => {
    setPendingCropResult(null)
  }, [])

  const handleUpdatePreviews = useCallback((key: string, dataUrl: string) => {
    setPreviews(prev => {
      const next = new Map(prev)
      next.set(key, dataUrl)
      return next
    })
  }, [])

  const handleExport = useCallback(() => {
    if (!report) return

    // Multi-image-crop warning
    const hasMultiImageCrop = Object.values(reviewState.state.corrections).some(
      corrs => corrs.some(c => c.type === 'multi-image-crop')
    )
    if (hasMultiImageCrop) {
      const proceed = window.confirm(
        'multi-image-crop 修正が含まれています。エクスポートに含めますか？\n' +
        '（apply-corrections.ts はまだ multi-image-crop 未対応のため、手動処理が必要です）'
      )
      if (!proceed) return
    }

    const file: CorrectionsFile = {
      version: hasMultiImageCrop ? '1.1.0' : '1.0.0',
      timestamp: new Date().toISOString(),
      baseGitCommit: report.gitCommit,
      reportTimestamp: report.timestamp,
      corrections: Object.fromEntries(
        Object.entries(reviewState.state.corrections)
          .filter(([, items]) => items.length > 0)
          .map(([qId, items]) => {
            const q = ALL_QUESTIONS.find(q => q.id === qId)
            return [qId, {
              dataHash: q ? generateDataHash(q) : '',
              items,
            }]
          })
      ),
    }
    const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `corrections-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [report, reviewState.state.corrections])

  // E キーハンドラーを最新の handleExport に更新
  handleExportRef.current = handleExport

  // ===== フィルタトグル =====
  const handleToggleFilter = useCallback(() => {
    const isOpen = (filters as FilterConfig & { _open?: boolean })._open ?? false
    setFilters(prev => ({ ...prev, _open: !isOpen } as FilterConfig))
  }, [filters])

  // ===== スキップ（判定せず次へ） =====
  const handleSkip = useCallback(() => {
    navigate(safeIndex + 1)
  }, [safeIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  // ===== 次の未解決 issue へジャンプ =====
  const handleJumpToNextUnresolved = useCallback(() => {
    if (!report) return
    const start = safeIndex + 1
    for (let i = 0; i < filteredQuestions.length; i++) {
      const idx = (start + i) % filteredQuestions.length
      const q = filteredQuestions[idx]
      if (!reviewState.state.judgments[q.id]) {
        navigate(idx)
        return
      }
    }
  }, [safeIndex, filteredQuestions, reviewState.state.judgments, report]) // eslint-disable-line react-hooks/exhaustive-deps

  // ===== 検索（/ キー） =====
  const handleSearch = useCallback(() => {
    const id = window.prompt('問題IDを入力してください (例: r110-1-1)')
    if (!id) return
    const idx = filteredQuestions.findIndex(q => q.id === id)
    if (idx >= 0) {
      navigate(idx)
    } else {
      window.alert(`問題 "${id}" は現在のフィルタ結果に存在しません`)
    }
  }, [filteredQuestions]) // eslint-disable-line react-hooks/exhaustive-deps

  // ===== キーボードナビゲーション（全ショートカット統合） =====
  useKeyboardNav({
    onNext: () => navigate(safeIndex + 1),
    onPrev: () => navigate(safeIndex - 1),
    onJudge: (status) => { if (currentQuestion) reviewState.setJudgment(currentQuestion.id, status) },
    onResetJudgment: () => {
      if (!currentQuestion) return
      const next = { ...reviewState.state.judgments }
      delete next[currentQuestion.id]
      reviewState.save({ ...reviewState.state, judgments: next })
    },
    onToggleFilter: handleToggleFilter,
    onToggleCorrection: () => {},  // 修正パネルは常時表示（トグル廃止）
    onSkip: handleSkip,
    onJumpToNextUnresolved: handleJumpToNextUnresolved,
    onExport: () => handleExportRef.current(),
    onPdfPrev: () => pdfViewerRef.current?.goToPrev(),
    onPdfNext: () => pdfViewerRef.current?.goToNext(),
    onSearch: handleSearch,
    onToggleHelp: () => setShowHelp(prev => !prev),
  })

  function syncViewportSize() {
    const canvas = canvasRef.current
    if (canvas && canvas.width > 0) {
      setViewportSize({ width: canvas.width, height: canvas.height })
    }
  }

  const currentCorrections = currentQuestion
    ? (reviewState.state.corrections[currentQuestion.id] ?? [])
    : []

  const correctionCount = Object.values(reviewState.state.corrections).reduce(
    (sum, arr) => sum + arr.length, 0
  )

  const filtersWithOpen = filters as FilterConfig & { _open?: boolean }

  if (loading) return <div className={styles.loading}>レポート読み込み中...</div>
  if (error) return <div className={styles.error}>{error}</div>
  if (!report) return null

  return (
    <div className={styles.container}>
      {showHelp && <KeyboardHelp onClose={() => setShowHelp(false)} />}

      <ReviewHeader
        report={report}
        judgments={reviewState.state.judgments}
        totalFiltered={filteredQuestions.length}
        currentIndex={safeIndex}
        filters={filtersWithOpen}
        onFiltersChange={handleFiltersChange}
        onExport={handleExport}
        correctionCount={correctionCount}
      />

      <div className={styles.main}>
        {/* PDFパネル */}
        <div className={styles.pdfPanel}>
          <PdfViewer
            ref={pdfViewerRef}
            canvasRef={canvasRef}
            pdfFile={activePdfFile}
            page={activePage}
            confidence={estimate.confidence}
            onPageChange={(p) => setManualPage(p)}
            onConfirmPage={(file, page) => {
              reviewState.confirmPdfPage(currentQuestion?.id ?? '', file, page)
              setManualPage(null)
            }}
            pdfFiles={pdfFiles}
            onPdfFileChange={(file) => {
              setCurrentPdfFile(file)
              setManualPage(1)
            }}
            onCanvasReady={syncViewportSize}
          />

          {/* クロップモード時にオーバーレイ */}
          {cropMode && activePdfFile && (
            <PdfCropper
              canvasRef={canvasRef}
              pdfFile={activePdfFile}
              pdfPage={activePage}
              viewportWidth={viewportSize.width}
              viewportHeight={viewportSize.height}
              scale={PDF_SCALE}
              onSave={handleCropSave}
              onCancel={() => setCropMode(false)}
            />
          )}
        </div>

        {/* レビューカードパネル（中央） */}
        <div className={styles.reviewPanel}>
          {currentQuestion ? (
            <>
              <ReviewCard
                question={currentQuestion}
                issues={report.issues.filter(
                  (i: ValidationIssue) => i.questionId === currentQuestion.id
                )}
                judgment={reviewState.state.judgments[currentQuestion.id]}
                onJudge={(status) => reviewState.setJudgment(currentQuestion.id, status)}
                onResetJudgment={() => {
                  const next = { ...reviewState.state.judgments }
                  delete next[currentQuestion.id]
                  reviewState.save({ ...reviewState.state, judgments: next })
                }}
                currentIndex={safeIndex}
                total={filteredQuestions.length}
                onPrev={() => navigate(safeIndex - 1)}
                onNext={() => navigate(safeIndex + 1)}
                corrections={currentCorrections}
                previews={previews}
              />

              {/* メモ欄（修正理由・画像切れ等を記録） */}
              <div className={styles.noteArea}>
                <textarea
                  className={styles.noteInput}
                  value={reviewState.state.notes?.[currentQuestion.id] ?? ''}
                  onChange={(e) => reviewState.setNote(currentQuestion.id, e.target.value)}
                  placeholder="メモ（修正理由・画像切れ等）"
                  rows={2}
                />
              </div>
            </>
          ) : (
            <div className={styles.empty}>
              フィルタ条件に一致する問題がありません
            </div>
          )}
        </div>

        {/* 修正入力パネル（右） */}
        {currentQuestion && (
          <div className={styles.correctionPanel}>
            <CorrectionPanel
              question={currentQuestion}
              corrections={currentCorrections}
              onReplaceCorrections={handleReplaceCorrections}
              onRemoveCorrection={handleRemoveCorrection}
              onAddScenarioCorrection={handleAddScenarioCorrection}
              onStartCrop={handleStartCrop}
              pendingCropResult={pendingCropResult}
              onConsumeCropResult={handleConsumeCropResult}
              previews={previews}
              onUpdatePreviews={handleUpdatePreviews}
            />
          </div>
        )}
      </div>
    </div>
  )
}
