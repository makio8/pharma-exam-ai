import { useState } from 'react'
import { useValidationReport } from './hooks/useValidationReport'
import { useReviewState } from './hooks/useReviewState'
import { ALL_QUESTIONS } from '../../data/all-questions'
import type { ValidationIssue } from '../../utils/data-validator/types'
import styles from './ReviewPage.module.css'

export default function ReviewPage() {
  const { report, loading, error } = useValidationReport()
  const reviewState = useReviewState()
  const [currentIndex, setCurrentIndex] = useState(0)

  if (loading) return <div className={styles.loading}>レポート読み込み中...</div>
  if (error) return <div className={styles.error}>{error}</div>
  if (!report) return null

  // 問題をソート: 年度→区分→問番
  const secOrder: Record<string, number> = { '必須': 0, '理論': 1, '実践': 2 }
  const sortedQuestions = [...ALL_QUESTIONS].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    if (a.section !== b.section) return (secOrder[a.section] ?? 0) - (secOrder[b.section] ?? 0)
    return a.question_number - b.question_number
  })

  // error / warning のある問題だけ表示（デフォルト）
  const issueQuestionIds = new Set(
    report.issues
      .filter((i: ValidationIssue) => i.severity === 'error' || i.severity === 'warning')
      .map((i: ValidationIssue) => i.questionId)
  )
  const filteredQuestions = sortedQuestions.filter(q => issueQuestionIds.has(q.id))
  const currentQuestion = filteredQuestions[currentIndex]

  const judgmentCounts = {
    ok: Object.values(reviewState.state.judgments).filter(v => v === 'ok').length,
    needsFix: Object.values(reviewState.state.judgments).filter(v => v === 'needs-fix').length,
    ng: Object.values(reviewState.state.judgments).filter(v => v === 'ng').length,
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>データ品質レビュー</h1>
        <div className={styles.stats}>
          <span className={styles.statOk}>OK {report.passCount}</span>
          <span className={styles.statError}>エラー {report.summary.error}</span>
          <span className={styles.statWarning}>警告 {report.summary.warning}</span>
          <span className={styles.statInfo}>情報 {report.summary.info ?? 0}</span>
        </div>
        <div className={styles.reviewProgress}>
          <span>レビュー済: {judgmentCounts.ok + judgmentCounts.needsFix + judgmentCounts.ng} / {filteredQuestions.length}</span>
        </div>
        <div className={styles.navIndicator}>
          問 {filteredQuestions.length > 0 ? currentIndex + 1 : 0} / {filteredQuestions.length}
        </div>
      </header>

      <div className={styles.main}>
        <div className={styles.pdfPanel}>
          <div className={styles.placeholder}>
            PDFビューア（Task 11 で実装）
          </div>
        </div>

        <div className={styles.reviewPanel}>
          {currentQuestion ? (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.questionId}>{currentQuestion.id}</h2>
                <span className={styles.meta}>
                  {currentQuestion.subject} / {currentQuestion.section} / 第{currentQuestion.year}回 問{currentQuestion.question_number}
                </span>
                <div className={styles.judgment}>
                  <button
                    className={`${styles.judgmentBtn} ${reviewState.state.judgments[currentQuestion.id] === 'ok' ? styles.judgmentBtnActive : ''}`}
                    onClick={() => reviewState.setJudgment(currentQuestion.id, 'ok')}
                  >
                    OK
                  </button>
                  <button
                    className={`${styles.judgmentBtn} ${reviewState.state.judgments[currentQuestion.id] === 'needs-fix' ? styles.judgmentBtnActive : ''}`}
                    onClick={() => reviewState.setJudgment(currentQuestion.id, 'needs-fix')}
                  >
                    要修正
                  </button>
                  <button
                    className={`${styles.judgmentBtn} ${reviewState.state.judgments[currentQuestion.id] === 'ng' ? styles.judgmentBtnActive : ''}`}
                    onClick={() => reviewState.setJudgment(currentQuestion.id, 'ng')}
                  >
                    NG
                  </button>
                </div>
              </div>

              <div className={styles.issues}>
                <h3>検出された問題</h3>
                {report.issues
                  .filter((i: ValidationIssue) => i.questionId === currentQuestion.id)
                  .map((issue: ValidationIssue, idx: number) => (
                    <div key={idx} className={styles[issue.severity]}>
                      [{issue.rule}] {issue.message}
                      {issue.field && <span className={styles.issueField}> — {issue.field}</span>}
                    </div>
                  ))}
              </div>

              <div className={styles.questionText}>
                <h3>問題文</h3>
                <p>{currentQuestion.question_text?.slice(0, 300)}{(currentQuestion.question_text?.length ?? 0) > 300 ? '...' : ''}</p>
              </div>

              <div className={styles.choices}>
                <h3>選択肢</h3>
                {currentQuestion.choices?.map(c => (
                  <div key={c.key} className={styles.choice}>
                    <span className={styles.choiceKey}>{c.key}</span>
                    <span>{c.text || '(空)'}</span>
                  </div>
                ))}
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.navBtn}
                  onClick={() => {
                    const next = Math.max(0, currentIndex - 1)
                    setCurrentIndex(next)
                    reviewState.setLastPosition(filteredQuestions[next]?.id ?? '')
                  }}
                  disabled={currentIndex === 0}
                >
                  前へ
                </button>
                <span className={styles.navCount}>{currentIndex + 1} / {filteredQuestions.length}</span>
                <button
                  className={styles.navBtn}
                  onClick={() => {
                    const next = Math.min(filteredQuestions.length - 1, currentIndex + 1)
                    setCurrentIndex(next)
                    reviewState.setLastPosition(filteredQuestions[next]?.id ?? '')
                  }}
                  disabled={currentIndex === filteredQuestions.length - 1}
                >
                  次へ
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.empty}>問題が見つかりません</div>
          )}
        </div>
      </div>
    </div>
  )
}
