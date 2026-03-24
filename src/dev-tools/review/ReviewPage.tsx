import { useState, useMemo } from 'react'
import { useValidationReport } from './hooks/useValidationReport'
import { useReviewState } from './hooks/useReviewState'
import { usePdfNavigation } from './hooks/usePdfNavigation'
import { ReviewHeader } from './components/ReviewHeader'
import { ReviewCard } from './components/ReviewCard'
import { PdfViewer } from './components/PdfViewer'
import { ALL_QUESTIONS } from '../../data/all-questions'
import type { ValidationIssue } from '../../utils/data-validator/types'
import type { FilterConfig } from './types'
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

export default function ReviewPage() {
  const { report, loading, error } = useValidationReport()
  const reviewState = useReviewState()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [filters, setFilters] = useState<FilterConfig>(DEFAULT_FILTERS)

  if (loading) return <div className={styles.loading}>レポート読み込み中...</div>
  if (error) return <div className={styles.error}>{error}</div>
  if (!report) return null

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

  // フィルタ適用
  const filteredQuestions = useMemo(() => {
    // 1. 深刻度フィルタに合うissueを持つ問題IDセット
    const issueQuestionIds = new Set(
      report.issues
        .filter((i: ValidationIssue) => filters.severities.includes(i.severity))
        .map((i: ValidationIssue) => i.questionId)
    )

    return sortedQuestions.filter(q => {
      // issue 有無
      if (!issueQuestionIds.has(q.id)) return false
      // 年度
      if (!filters.years.includes(q.year)) return false
      // 区分
      if (!filters.sections.includes(q.section as QuestionSection)) return false
      // 判定状態
      const j = reviewState.state.judgments[q.id]
      if (filters.judgmentStatus === 'pending') return j == null
      if (filters.judgmentStatus === 'all') return true
      return j === filters.judgmentStatus
    })
  }, [sortedQuestions, report.issues, filters, reviewState.state.judgments])

  const safeIndex = Math.min(currentIndex, Math.max(0, filteredQuestions.length - 1))
  const currentQuestion = filteredQuestions[safeIndex]

  // PDF ナビゲーション状態
  const [manualPage, setManualPage] = useState<number | null>(null)
  const [currentPdfFile, setCurrentPdfFile] = useState<string | null>(null)

  const { estimate, pdfFiles } = usePdfNavigation(
    currentQuestion?.id ?? '',
    currentQuestion?.question_number ?? 1,
    currentQuestion?.year ?? 110,
    (currentQuestion?.section ?? '必須') as QuestionSection,
    reviewState.state.confirmedPdfPages
  )

  // 手動ページ変更 or 推定ページをマージ
  const activePage = manualPage ?? estimate.page
  const activePdfFile = currentPdfFile ?? estimate.pdfFile

  function navigate(next: number) {
    const clamped = Math.max(0, Math.min(filteredQuestions.length - 1, next))
    setCurrentIndex(clamped)
    reviewState.setLastPosition(filteredQuestions[clamped]?.id ?? '')
    // 問題が変わったら手動ページ・ファイル選択をリセット
    setManualPage(null)
    setCurrentPdfFile(null)
  }

  function handleFiltersChange(next: FilterConfig) {
    setFilters(next)
    setCurrentIndex(0)
    setManualPage(null)
    setCurrentPdfFile(null)
  }

  // _open はフィルタパネル開閉フラグ（FilterConfig に型拡張して持たせている）
  const filtersWithOpen = filters as FilterConfig & { _open?: boolean }

  return (
    <div className={styles.container}>
      <ReviewHeader
        report={report}
        judgments={reviewState.state.judgments}
        totalFiltered={filteredQuestions.length}
        currentIndex={safeIndex}
        filters={filtersWithOpen}
        onFiltersChange={handleFiltersChange}
      />

      <div className={styles.main}>
        {/* PDFパネル */}
        <div className={styles.pdfPanel}>
          <PdfViewer
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
          />
        </div>

        {/* レビューカードパネル */}
        <div className={styles.reviewPanel}>
          {currentQuestion ? (
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
