import { useState, useEffect } from 'react'
import type { Question } from '../../../types/question'
import type { ValidationIssue } from '../../../utils/data-validator/types'
import type { JudgmentStatus } from '../types'
import styles from './ReviewCard.module.css'

const IMAGE_CHOICE_TYPES = new Set([
  'structural_formula', 'graph', 'equation', 'image', 'image_other',
  'chemical_structure', 'formula', 'diagram', 'image_region',
  'image_with_label', 'image_and_text', 'graph_line', 'diagram_region',
  'diagram_label', 'structural_formula_region', 'reaction_scheme',
  'reaction_mechanism', 'image_label', 'structural_formula_pair',
])

const QUESTION_TEXT_TRUNCATE = 300

interface ReviewCardProps {
  question: Question
  issues: ValidationIssue[]
  judgment?: JudgmentStatus
  onJudge: (status: JudgmentStatus) => void
  onResetJudgment: () => void
  currentIndex: number
  total: number
  onPrev: () => void
  onNext: () => void
}

export function ReviewCard({
  question,
  issues,
  judgment,
  onJudge,
  onResetJudgment,
  currentIndex,
  total,
  onPrev,
  onNext,
}: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false)

  // 問題が切り替わったら折りたたみリセット
  useEffect(() => {
    setExpanded(false)
  }, [question.id])

  // 選択肢ハイライト対象（issue の field が 'choices' のもの）
  const choiceIssueKeys = new Set<number>()
  for (const issue of issues) {
    // field が "choices[1]" 等のパターンにも対応
    if (issue.field?.startsWith('choices')) {
      const match = issue.field.match(/\[(\d+)\]/)
      if (match) {
        choiceIssueKeys.add(Number(match[1]))
      } else {
        // choices 全体に問題がある場合は全選択肢をマーク
        question.choices?.forEach(c => choiceIssueKeys.add(c.key))
      }
    }
  }

  // 問題文の表示（300文字トランケート）
  const questionText = question.question_text ?? ''
  const isTruncatable = questionText.length > QUESTION_TEXT_TRUNCATE
  const displayText = expanded || !isTruncatable
    ? questionText
    : questionText.slice(0, QUESTION_TEXT_TRUNCATE) + '…'

  // 正答の表示
  const correctAnswerDisplay = Array.isArray(question.correct_answer)
    ? question.correct_answer.join(', ')
    : String(question.correct_answer)

  return (
    <div className={styles.card}>
      {/* ===== バッジ行 ===== */}
      <div className={styles.badgeRow}>
        <span className={styles.badge + ' ' + styles.badgeYear}>第{question.year}回</span>
        <span className={styles.badge + ' ' + styles.badgeQNum}>問{question.question_number}</span>
        <span className={styles.badge + ' ' + styles.badgeSubject}>{question.subject}</span>
        <span className={styles.badge + ' ' + styles.badgeSection}>{question.section}</span>
        <span className={styles.badge + ' ' + styles.badgeId}>{question.id}</span>
        <span className={styles.correctAnswer}>正答: {correctAnswerDisplay}</span>
      </div>

      {/* ===== 連問シナリオ ===== */}
      {question.linked_scenario && (
        <div className={styles.scenarioArea}>
          <h3 className={styles.sectionTitle}>
            📋 連問シナリオ
            {question.linked_group && (
              <span className={styles.linkedGroupTag}>{question.linked_group}</span>
            )}
          </h3>
          <p className={styles.scenarioText}>{question.linked_scenario}</p>
        </div>
      )}

      {/* ===== 問題画像 ===== */}
      {question.image_url && (
        <div className={styles.imageArea}>
          <img
            src={question.image_url}
            alt={`問題${question.question_number}の図`}
            className={styles.questionImage}
          />
        </div>
      )}

      {/* ===== バリデーション issue ===== */}
      {issues.length > 0 && (
        <div>
          <h3 className={styles.sectionTitle}>検出された問題 ({issues.length}件)</h3>
          <div className={styles.issues}>
            {issues.map((issue, idx) => (
              <div
                key={idx}
                className={
                  styles.issueItem + ' ' + (
                    issue.severity === 'error' ? styles.issueError :
                    issue.severity === 'warning' ? styles.issueWarning :
                    styles.issueInfo
                  )
                }
              >
                <span className={styles.issueRule}>[{issue.rule}]</span>
                {issue.message}
                {issue.field && (
                  <span className={styles.issueField}>— {issue.field}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== 問題文 ===== */}
      <div className={styles.questionTextArea}>
        <h3 className={styles.sectionTitle}>問題文</h3>
        <p className={styles.questionText}>{displayText}</p>
        {isTruncatable && (
          <button
            className={styles.expandBtn}
            onClick={() => setExpanded(prev => !prev)}
          >
            {expanded ? '▲ 折りたたむ' : '▼ 全文表示'}
          </button>
        )}
      </div>

      {/* ===== 選択肢 ===== */}
      {question.choices && question.choices.length > 0 && (
        <div>
          <h3 className={styles.sectionTitle}>選択肢</h3>
          <div className={styles.choices}>
            {question.choices.map(c => {
              const isHighlight = choiceIssueKeys.has(c.key)
              const isImageType = c.choice_type && IMAGE_CHOICE_TYPES.has(c.choice_type)
              return (
                <div
                  key={c.key}
                  className={styles.choice + (isHighlight ? ' ' + styles.choiceHighlight : '')}
                >
                  <span className={styles.choiceKey}>{c.key}</span>
                  <span>{c.text || '(空)'}</span>
                  {isImageType && (
                    <span className={styles.choiceImageTag}>(画像: {c.choice_type})</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ===== 判定ボタン ===== */}
      <div className={styles.judgmentSection}>
        <span className={styles.judgmentLabel}>判定</span>
        <div className={styles.judgmentBtns}>
          <button
            className={
              styles.judgmentBtn + ' ' + styles.judgmentBtnOk +
              (judgment === 'ok' ? ' ' + styles.judgmentBtnActive : '')
            }
            onClick={() => onJudge('ok')}
          >
            ✅ OK
            <span className={styles.keyHint}>キー [1]</span>
          </button>
          <button
            className={
              styles.judgmentBtn + ' ' + styles.judgmentBtnFix +
              (judgment === 'needs-fix' ? ' ' + styles.judgmentBtnActive : '')
            }
            onClick={() => onJudge('needs-fix')}
          >
            ⚠️ 要修正
            <span className={styles.keyHint}>キー [2]</span>
          </button>
          <button
            className={
              styles.judgmentBtn + ' ' + styles.judgmentBtnNg +
              (judgment === 'ng' ? ' ' + styles.judgmentBtnActive : '')
            }
            onClick={() => onJudge('ng')}
          >
            ❌ NG
            <span className={styles.keyHint}>キー [3]</span>
          </button>
          <button
            className={styles.judgmentBtn + ' ' + styles.judgmentBtnReset}
            onClick={onResetJudgment}
            title="判定をリセット (キー 0)"
          >
            🔄 リセット
            <span className={styles.keyHint}>キー [0]</span>
          </button>
        </div>
      </div>

      {/* ===== ナビゲーション ===== */}
      <div className={styles.actions}>
        <button
          className={styles.navBtn}
          onClick={onPrev}
          disabled={currentIndex === 0}
        >
          ← 前へ
        </button>
        <span className={styles.navCount}>{currentIndex + 1} / {total}</span>
        <button
          className={styles.navBtn}
          onClick={onNext}
          disabled={currentIndex >= total - 1}
        >
          次へ →
        </button>
      </div>
    </div>
  )
}
