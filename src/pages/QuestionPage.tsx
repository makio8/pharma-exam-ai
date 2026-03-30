// 問題演習画面 — Soft Companion リデザイン
import { useMemo, useRef, useEffect } from 'react'
import type { RefObject } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ALL_QUESTIONS } from '../data/all-questions'
import { QUESTION_TOPIC_MAP } from '../data/question-topic-map'
import { ALL_TOPICS } from '../data/exam-blueprint'
import { useQuestionAnswerState } from '../hooks/useQuestionAnswerState'
import { useTimeTracking } from '../hooks/useTimeTracking'
import { useSwipeNavigation } from '../hooks/useSwipeNavigation'
import { useScoredOfficialNotes } from '../hooks/useScoredOfficialNotes'
import { useBookmarks } from '../hooks/useBookmarks'
import { useLinkedQuestions } from '../hooks/useLinkedQuestions'
import {
  ProgressHeader,
  QuestionBody,
  ChoiceList,
  ActionArea,
  ResultBanner,
  ExplanationSection,
  OfficialNoteCard,
  MetaAccordion,
} from '../components/question'
import { FloatingNav } from '../components/ui/FloatingNav'
import { LinkedQuestionViewer } from '../components/LinkedQuestionViewer'
import { normalizeForDisplay, getDisplayMode } from '../utils/text-normalizer'
import { useLearningLinks } from '../hooks/useLearningLinks'
import type { FlashCardPracticeContext } from '../types/card-progress'
import type { OfficialNote } from '../types/official-note'
import type { Question } from '../types/question'
import type { UseSwipeNavigationResult } from '../hooks/useSwipeNavigation'
import styles from './QuestionPage.module.css'

export function QuestionPage() {
  const { questionId } = useParams<{ questionId: string }>()
  const navigate = useNavigate()

  // --- 問題のロード ---
  const question = useMemo(
    () => ALL_QUESTIONS.find((q) => q.id === questionId),
    [questionId],
  )

  // --- セッションの問題リスト ---
  const sessionIds = useMemo<string[]>(() => {
    try {
      const raw = localStorage.getItem('practice_session')
      if (raw) {
        const ids = JSON.parse(raw) as string[]
        if (ids.length > 0 && questionId && ids.includes(questionId)) return ids
      }
    } catch {
      // パースエラーは無視
    }
    return ALL_QUESTIONS.map((q) => q.id)
  }, [questionId])

  // --- 連問グループ判定 ---
  const linkedGroup = useLinkedQuestions(questionId)

  // --- スワイプナビゲーション ---
  const swipe = useSwipeNavigation(sessionIds, questionId ?? '')

  // --- 時間計測 ---
  const { getElapsedSeconds } = useTimeTracking(questionId ?? '')

  // --- 公式付箋 ---
  const { notes } = useScoredOfficialNotes(question)

  // --- ブックマーク ---
  const { isBookmarked, toggleBookmark } = useBookmarks()

  // --- 結果バナーへの自動スクロール ref ---
  const resultRef = useRef<HTMLDivElement>(null)

  // --- 問題が見つからない場合 ---
  if (!question) {
    return (
      <div className="sc-page">
        <div className={styles.notFound}>
          <p className={styles.notFoundTitle}>問題が見つかりません</p>
          <p className={styles.notFoundSub}>ID: {questionId ?? '(なし)'}</p>
          <button
            type="button"
            className={styles.notFoundBtn}
            onClick={() => navigate('/practice')}
          >
            問題一覧に戻る
          </button>
        </div>
        <FloatingNav />
      </div>
    )
  }

  // --- 連問グループの場合: LinkedQuestionViewer を表示 ---
  if (linkedGroup) {
    return (
      <div
        className="sc-page"
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
      >
        <ProgressHeader
          subject={question.subject}
          currentIndex={swipe.currentIndex}
          totalCount={swipe.totalCount}
          canGoPrev={swipe.canGoPrev}
          canGoNext={swipe.canGoNext}
          onPrev={swipe.goPrev}
          onNext={swipe.goNext}
        />
        <LinkedQuestionViewer
          key={linkedGroup.groupId}
          group={linkedGroup}
        />
        <FloatingNav />
      </div>
    )
  }

  // --- 通常の問題表示 ---
  return (
    <QuestionPageContent
      question={question}
      questionId={questionId!}
      swipe={swipe}
      getElapsedSeconds={getElapsedSeconds}
      notes={notes}
      isBookmarked={isBookmarked}
      toggleBookmark={toggleBookmark}
      resultRef={resultRef}
      navigate={navigate}
    />
  )
}

// ---------------------------------------------------------------------------
// 内部コンポーネント: フックを条件分岐の後で使うための分離
// ---------------------------------------------------------------------------

interface ContentProps {
  question: Question
  questionId: string
  swipe: UseSwipeNavigationResult
  getElapsedSeconds: () => number
  notes: OfficialNote[]
  isBookmarked: (noteId: string) => boolean
  toggleBookmark: (noteId: string) => void
  resultRef: RefObject<HTMLDivElement | null>
  navigate: ReturnType<typeof useNavigate>
}

function QuestionPageContent({
  question,
  questionId,
  swipe,
  getElapsedSeconds,
  notes,
  isBookmarked,
  toggleBookmark,
  resultRef,
  navigate,
}: ContentProps) {
  const location = useLocation()
  const linkService = useLearningLinks()
  const answerState = useQuestionAnswerState(question)

  // トピック名の取得
  const topicName = useMemo(() => {
    const topicId = QUESTION_TOPIC_MAP[questionId]
    if (!topicId) return undefined
    const topic = ALL_TOPICS.find((t) => t.id === topicId)
    return topic ? `${topic.major} > ${topic.middle}` : undefined
  }, [questionId])

  // 回答後に ResultBanner へ自動スクロール
  useEffect(() => {
    if (answerState.isAnswered) {
      // 少し遅延を入れてDOMレンダリング後にスクロール
      const timer = setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [answerState.isAnswered, resultRef])

  const handleSubmit = () => {
    answerState.submitAnswer(getElapsedSeconds())
  }

  const handleSkip = () => {
    answerState.skipQuestion(getElapsedSeconds())
  }

  const displayMode = getDisplayMode(question)

  return (
    <div
      className="sc-page"
      onTouchStart={swipe.onTouchStart}
      onTouchMove={swipe.onTouchMove}
      onTouchEnd={swipe.onTouchEnd}
    >
      <div className={styles.page}>
        <ProgressHeader
          subject={question.subject}
          currentIndex={swipe.currentIndex}
          totalCount={swipe.totalCount}
          canGoPrev={swipe.canGoPrev}
          canGoNext={swipe.canGoNext}
          onPrev={swipe.goPrev}
          onNext={swipe.goNext}
        />

        {/* 前回の回答結果（未回答時のみ表示） */}
        {answerState.existingResult && !answerState.isAnswered && (
          <div
            className={`${styles.previousResult} ${
              answerState.existingResult.is_correct
                ? styles.previousResultCorrect
                : styles.previousResultIncorrect
            }`}
          >
            {answerState.existingResult.is_correct ? '✅' : '❌'}
            前回: {answerState.existingResult.is_correct ? '正解' : '不正解'}
            （{new Date(answerState.existingResult.answered_at).toLocaleDateString()}）
          </div>
        )}

        <QuestionBody
          bodyText={normalizeForDisplay(question.question_text)}
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
                onFlashCard={() => {
                  const cards = linkService.getSourceCards(note.id)
                  if (cards.length > 0) {
                    const ctx: FlashCardPracticeContext = {
                      mode: 'note',
                      noteId: note.id,
                      cardIds: cards.map(c => c.id),
                      returnTo: location.pathname,
                    }
                    navigate('/cards/review', { state: ctx })
                  } else {
                    navigate('/cards')
                  }
                }}
                flashCardCount={linkService.getSourceCards(note.id).length}
                onImageTap={() => {}}
              />
            ))}

            <MetaAccordion question={question} topicName={topicName} />
          </>
        )}
      </div>

      <FloatingNav />
    </div>
  )
}
