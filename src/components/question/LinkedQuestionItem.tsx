// src/components/question/LinkedQuestionItem.tsx
import { useRef, useEffect } from 'react'
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
          </>
        )}
      </div>
    </div>
  )
}
