// src/components/question/LinkedQuestionItem.tsx
import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Question, AnswerHistory } from '../../types/question'
import { useQuestionAnswerState } from '../../hooks/useQuestionAnswerState'
import { useTimeTracking } from '../../hooks/useTimeTracking'
import { useScoredOfficialNotes } from '../../hooks/useScoredOfficialNotes'
import { useBookmarks } from '../../hooks/useBookmarks'
import { normalizeForDisplay, getDisplayMode } from '../../utils/text-normalizer'
import { extractQuestionBody } from '../../utils/extract-question-body'
import { isMultiAnswer, getRequiredSelections } from '../../utils/question-helpers'
import { QuestionBody } from './QuestionBody'
import { ChoiceList } from './ChoiceList'
import { ActionArea } from './ActionArea'
import { ResultBanner } from './ResultBanner'
import { ExplanationSection } from './ExplanationSection'
import { OfficialNoteCard } from './OfficialNoteCard'
import styles from './LinkedQuestionItem.module.css'

interface Props {
  question: Question
  questionIndex: number
  totalInGroup: number
  scenario: string
  externalHistory: {
    history: AnswerHistory[]
    saveAnswer: (answer: Omit<AnswerHistory, 'id'>) => void
    getQuestionResult: (questionId: string) => AnswerHistory | undefined
  }
}

export function LinkedQuestionItem({
  question,
  questionIndex,
  totalInGroup,
  scenario,
  externalHistory,
}: Props) {
  const navigate = useNavigate()

  const answerState = useQuestionAnswerState(question, {
    externalHistory,
    restoreExisting: true,
  })

  const { getElapsedSeconds } = useTimeTracking(question.id)
  const { notes } = useScoredOfficialNotes(question)
  const { isBookmarked, toggleBookmark } = useBookmarks()

  // 付箋アコーディオン: 不正解時デフォルト展開、正解/スキップ時は折りたたみ
  const [notesOpen, setNotesOpen] = useState(false)
  useEffect(() => {
    setNotesOpen(answerState.isAnswered && !answerState.isCorrect && !answerState.isSkipped)
  }, [question.id, answerState.isAnswered, answerState.isCorrect, answerState.isSkipped])

  const resultRef = useRef<HTMLDivElement>(null)

  // 回答後に ResultBanner へ自動スクロール
  useEffect(() => {
    if (answerState.isAnswered && !answerState.existingResult) {
      const timer = setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [answerState.isAnswered, answerState.existingResult])

  const handleSubmit = () => {
    answerState.submitAnswer(getElapsedSeconds())
  }

  const handleSkip = () => {
    answerState.skipQuestion(getElapsedSeconds())
  }

  const displayMode = getDisplayMode(question)
  const isMulti = isMultiAnswer(question)
  const requiredCount = isMulti ? getRequiredSelections(question.question_text, question.correct_answer) : 1
  const bodyText = extractQuestionBody(question.question_text, question.question_number, scenario)

  return (
    <div className={styles.card} id={`linked-q-${question.id}`}>
      {/* ヘッダー */}
      <div className={styles.header}>
        <span className={styles.questionNum}>
          問{question.question_number}（{questionIndex}/{totalInGroup}）
        </span>
        <span className={styles.subject}>{question.subject}</span>
        {isMulti && (
          <span className={styles.multiHint}>{requiredCount}つ選べ</span>
        )}
        {answerState.isAnswered && (
          <span
            className={`${styles.statusTag} ${
              answerState.isSkipped
                ? styles.statusSkipped
                : answerState.isCorrect
                  ? styles.statusCorrect
                  : styles.statusIncorrect
            }`}
          >
            {answerState.isSkipped ? 'スキップ' : answerState.isCorrect ? '正解' : '不正解'}
          </span>
        )}
      </div>

      {/* 本体 */}
      <div className={styles.body}>
        <QuestionBody
          bodyText={normalizeForDisplay(bodyText)}
          imageUrl={question.image_url}
          inlineImageUrls={question.question_image_urls}
          displayMode={displayMode}
        />

        <ChoiceList
          question={question}
          answerState={answerState}
          onSelect={answerState.selectAnswer}
          onMultiSelect={answerState.selectMultiAnswers}
        />

        {!answerState.isAnswered && (
          <ActionArea
            canSubmit={answerState.canSubmit}
            onSubmit={handleSubmit}
            onSkip={handleSkip}
            isAnswered={false}
          />
        )}

        {answerState.isAnswered && (
          <>
            <div ref={resultRef}>
              <ResultBanner
                isCorrect={answerState.isCorrect}
                isSkipped={answerState.isSkipped}
                correctAnswer={question.correct_answer}
                elapsedSeconds={getElapsedSeconds()}
              />
            </div>

            {question.explanation && (
              <ExplanationSection
                explanation={normalizeForDisplay(question.explanation)}
              />
            )}

            {/* 付箋アコーディオン: 付箋がある問題のみ表示 */}
            {notes.length > 0 && (
              <div style={{ margin: '4px 0' }}>
                <button
                  type="button"
                  aria-expanded={notesOpen}
                  onClick={() => setNotesOpen(o => !o)}
                  style={{
                    width: '100%', padding: '10px 16px', background: 'var(--card)',
                    border: '1px solid var(--border)', borderRadius: '10px',
                    color: 'var(--text-1)', fontSize: '0.9rem', textAlign: 'left',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <span>📌 関連付箋（{notes.length}枚）</span>
                  <span style={{ color: 'var(--accent)', transition: 'transform 0.2s', display: 'inline-block', transform: notesOpen ? 'rotate(90deg)' : 'none' }}>▶</span>
                </button>
                {notesOpen && (
                  <div style={{ marginTop: '8px' }}>
                    {notes.map((note) => (
                      <OfficialNoteCard
                        key={note.id}
                        note={note}
                        isBookmarked={isBookmarked(note.id)}
                        onToggleBookmark={() => toggleBookmark(note.id)}
                        onFlashCard={() => navigate('/cards')}
                        flashCardCount={0}
                        onImageTap={() => {}}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
