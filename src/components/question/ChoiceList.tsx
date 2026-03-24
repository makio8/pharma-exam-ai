import type { Question } from '../../types/question'
import { isCorrectKey } from '../../utils/question-helpers'
import { ChoiceCard } from './ChoiceCard'
import type { ChoiceState } from './ChoiceCard'
import styles from './Choice.module.css'

interface AnswerState {
  selectedAnswer: number | null
  selectedAnswers: number[]
  isAnswered: boolean
  isCorrect: boolean
  isSkipped: boolean
  isMulti: boolean
  requiredCount: number
}

interface ChoiceListProps {
  question: Question
  answerState: AnswerState
  onSelect: (key: number) => void
  onMultiSelect: (keys: number[]) => void
}

function getSingleState(
  key: number,
  answerState: AnswerState,
  correctAnswer: number | number[]
): ChoiceState {
  const { selectedAnswer, isAnswered } = answerState
  if (!isAnswered) {
    return selectedAnswer === key ? 'selected' : 'default'
  }
  // After answering
  if (isCorrectKey(correctAnswer, key)) return 'correct'
  if (selectedAnswer === key) return 'incorrect'
  return 'dimmed'
}

function getMultiState(
  key: number,
  answerState: AnswerState,
  correctAnswer: number | number[]
): ChoiceState {
  const { selectedAnswers, isAnswered } = answerState
  const isSelected = selectedAnswers.includes(key)
  if (!isAnswered) {
    return isSelected ? 'selected' : 'default'
  }
  // After answering
  const isCorrectChoice = isCorrectKey(correctAnswer, key)
  if (isCorrectChoice && isSelected) return 'correct'
  if (isCorrectChoice && !isSelected) return 'correct'  // missed correct
  if (!isCorrectChoice && isSelected) return 'incorrect'  // wrongly selected
  return 'dimmed'
}

export function ChoiceList({
  question,
  answerState,
  onSelect,
  onMultiSelect,
}: ChoiceListProps) {
  const { selectedAnswers, isAnswered, isMulti, requiredCount } = answerState
  const isNumeric = question.choices.length === 0

  function handleMultiClick(key: number) {
    if (isAnswered) return
    const current = answerState.selectedAnswers
    if (current.includes(key)) {
      onMultiSelect(current.filter((k) => k !== key))
    } else {
      onMultiSelect([...current, key])
    }
  }

  // Numeric input (1–9 grid)
  if (isNumeric) {
    const selectedNum = answerState.selectedAnswer
    return (
      <div
        className={styles.numericGrid}
        role="radiogroup"
        aria-label="数値を選択"
      >
        {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            type="button"
            className={`${styles.numericBtn} ${selectedNum === num ? styles.numericBtnSelected : ''}`}
            disabled={isAnswered}
            onClick={() => onSelect(num)}
            aria-label={`${num}`}
            aria-pressed={selectedNum === num}
          >
            {num}
          </button>
        ))}
      </div>
    )
  }

  if (isMulti) {
    const selectedCount = selectedAnswers.length
    return (
      <div>
        <p className={styles.multiHint}>
          {requiredCount}個選んでください（{selectedCount}/{requiredCount}）
        </p>
        <div
          className={styles.group}
          role="group"
          aria-label={`${requiredCount}個選択`}
        >
          {question.choices.map((choice) => (
            <ChoiceCard
              key={choice.key}
              choiceKey={choice.key}
              text={choice.text}
              state={getMultiState(choice.key, answerState, question.correct_answer)}
              isMulti={true}
              disabled={isAnswered}
              onClick={() => handleMultiClick(choice.key)}
            />
          ))}
        </div>
      </div>
    )
  }

  // Single choice
  return (
    <div
      className={styles.group}
      role="radiogroup"
      aria-label="選択肢"
    >
      {question.choices.map((choice) => (
        <ChoiceCard
          key={choice.key}
          choiceKey={choice.key}
          text={choice.text}
          state={getSingleState(choice.key, answerState, question.correct_answer)}
          isMulti={false}
          disabled={isAnswered}
          onClick={() => onSelect(choice.key)}
        />
      ))}
    </div>
  )
}
