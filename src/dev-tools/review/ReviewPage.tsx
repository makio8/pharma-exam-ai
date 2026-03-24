import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
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
import type { ValidationIssue } from '../../utils/data-validator/types'
import type { FilterConfig, Correction, CorrectionsFile, PdfCropRect } from './types'
import type { Question } from '../../types/question'
import type { QuestionSection } from '../../types/question'
import styles from './ReviewPage.module.css'

// デフォルトフィルタ: error+warning ON / 全年度 / 全区分 / 未判定
const DEFAULT_FILTERS: FilterConfig = {
  severities: ['error', 'warning'],
  years: Array.from({ length: 12 }, (_, i) => 100 + i),
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
  const [correctionPanelOpen, setCorrectionPanelOpen] = useState(false)
  const [cropMode, setCropMode] = useState(false)
  const [manualPage, setManualPage] = useState<number | null>(null)
  const [currentPdfFile, setCurrentPdfFile] = useState<string | null>(null)
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 1130 })
  const [showHelp, setShowHelp] = useState(false)

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

    const issueQuestionIds = new Set(
      report.issues
        .filter((i: ValidationIssue) => filters.severities.includes(i.severity))
        .map((i: ValidationIssue) => i.questionId)
    )

    return sortedQuestions.filter(q => {
      if (!issueQuestionIds.has(q.id)) return false
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
    setCorrectionPanelOpen(false)
    setCropMode(false)
  }

  function handleFiltersChange(next: FilterConfig) {
    setFilters(next)
    setCurrentIndex(0)
    setManualPage(null)
    setCurrentPdfFile(null)
  }

  const handleAddCorrection = useCallback((correction: Correction) => {
    if (!currentQuestion) return
    reviewState.addCorrection(currentQuestion.id, correction)
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

  const handleCropSave = useCallback((crop: PdfCropRect) => {
    if (!currentQuestion) return
    reviewState.addCorrection(currentQuestion.id, {
      type: 'image-crop',
      crop,
      pdfFile: activePdfFile,
      pdfPage: activePage,
    })
    setCropMode(false)
  }, [currentQuestion, reviewState, activePdfFile, activePage])

  const handleExport = useCallback(() => {
    if (!report) return
    const file: CorrectionsFile = {
      version: '1.0.0',
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

        {/* レビューカードパネル */}
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
              />

              <CorrectionPanel
                question={currentQuestion}
                corrections={currentCorrections}
                onAddCorrection={handleAddCorrection}
                onRemoveCorrection={handleRemoveCorrection}
                isOpen={correctionPanelOpen}
                onToggle={() => setCorrectionPanelOpen(prev => !prev)}
                onStartCrop={() => {
                  setCropMode(true)
                  syncViewportSize()
                }}
              />
            </>
          ) : (
            <div className={styles.empty}>
              フィルタ条件に一致する問題がありません
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
