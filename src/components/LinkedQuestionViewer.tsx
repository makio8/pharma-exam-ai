import { useState, useCallback } from 'react'
import { Card, Tag, Typography, Space, Image, Radio, Button, Alert, Divider } from 'antd'
import { LinkOutlined, CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons'
import type { LinkedGroup } from '../hooks/useLinkedQuestions'
import type { Question, ConfidenceLevel } from '../types/question'
import { useAnswerHistory } from '../hooks/useAnswerHistory'

const { Text, Paragraph } = Typography

interface Props {
  group: LinkedGroup
  currentQuestionId: string
}

interface QuestionState {
  selectedAnswer: number | null
  isAnswered: boolean
  isCorrect: boolean
}

/**
 * 連問グループを1ページで縦スクロール表示（エメリー方式）
 * - 共通シナリオを1回だけ表示
 * - 各問題を縦に並べて表示（回答可能）
 */
export function LinkedQuestionViewer({ group, currentQuestionId }: Props) {
  const scenarioImage = group.questions.find((q) => q.image_url)?.image_url
  const { saveAnswer, getQuestionResult } = useAnswerHistory()

  // 各問題の回答状態を管理
  const [states, setStates] = useState<Record<string, QuestionState>>(() => {
    const init: Record<string, QuestionState> = {}
    for (const q of group.questions) {
      const existing = getQuestionResult(q.id)
      init[q.id] = {
        selectedAnswer: existing?.selected_answer ?? null,
        isAnswered: !!existing,
        isCorrect: existing?.is_correct ?? false,
      }
    }
    return init
  })

  const handleSelect = useCallback((questionId: string, answer: number) => {
    setStates((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], selectedAnswer: answer },
    }))
  }, [])

  const handleSubmit = useCallback((question: Question) => {
    const state = states[question.id]
    if (state.selectedAnswer === null) return
    const correct = state.selectedAnswer === question.correct_answer
    setStates((prev) => ({
      ...prev,
      [question.id]: { ...prev[question.id], isAnswered: true, isCorrect: correct },
    }))
    saveAnswer({
      user_id: 'local_user',
      question_id: question.id,
      selected_answer: state.selectedAnswer,
      is_correct: correct,
      answered_at: new Date().toISOString(),
      confidence_level: 'medium' as ConfidenceLevel,
      time_spent_seconds: 0,
    })
  }, [states, saveAnswer])

  /** 選択肢の背景色 */
  const choiceStyle = (question: Question, key: number, state: QuestionState) => {
    if (!state.isAnswered) return {}
    if (key === question.correct_answer) {
      return { background: '#f6ffed', borderColor: '#b7eb8f' }
    }
    if (key === state.selectedAnswer && !state.isCorrect) {
      return { background: '#fff2f0', borderColor: '#ffccc7' }
    }
    return {}
  }

  // シナリオテキストを question_text から抽出（最初の問題から共通部分を取得）
  // linked_scenario があればそれを使う、なければ最初の問題文の冒頭
  const scenario = group.scenario

  return (
    <div>
      {/* 連問ヘッダー + シナリオ（1回だけ） */}
      <Card
        size="small"
        style={{ marginBottom: 16, borderColor: '#d3adf7', background: '#f9f0ff' }}
      >
        <Space style={{ marginBottom: 8 }}>
          <LinkOutlined style={{ color: '#722ed1' }} />
          <Text strong style={{ color: '#722ed1' }}>
            連問（{group.questions.length}問セット）
          </Text>
        </Space>

        {scenario && (
          <Paragraph
            style={{
              fontSize: 15,
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap',
              marginBottom: 12,
              padding: '8px 12px',
              background: 'white',
              borderRadius: 6,
            }}
          >
            {scenario}
          </Paragraph>
        )}

        {scenarioImage && (
          <div style={{ marginBottom: 8, textAlign: 'center' }}>
            <Image
              src={scenarioImage}
              alt="連問の共通資料"
              style={{ maxHeight: '50vh', objectFit: 'contain' }}
              width="100%"
            />
          </div>
        )}
      </Card>

      {/* 各問題を縦並び */}
      {group.questions.map((q, idx) => {
        const state = states[q.id] ?? { selectedAnswer: null, isAnswered: false, isCorrect: false }

        return (
          <Card
            key={q.id}
            size="small"
            style={{
              marginBottom: 20,
              borderLeft: '4px solid #722ed1',
              borderColor: '#d3adf7',
              background: '#fafafa',
            }}
            id={`linked-q-${q.id}`}
          >
            {/* 問題ヘッダー */}
            <div style={{
              background: '#f0e6ff',
              margin: '-12px -12px 12px -12px',
              padding: '8px 12px',
              borderBottom: '1px solid #d3adf7',
            }}>
              <Space wrap>
                <Tag color="purple" style={{ fontSize: 14, padding: '2px 8px' }}>問{q.question_number}</Tag>
                <Tag>{q.subject}</Tag>
              {state.isAnswered && (
                state.isCorrect
                  ? <Tag color="success">正解</Tag>
                  : <Tag color="error">不正解</Tag>
              )}
              </Space>
            </div>

            {/* 問題文（シナリオ部分を除去して表示） */}
            <Paragraph style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 12 }}>
              {q.question_text}
            </Paragraph>

            {/* 問題個別の画像 */}
            {q.image_url && (
              <div style={{ marginBottom: 12, textAlign: 'center' }}>
                <Image
                  src={q.image_url}
                  alt={`問${q.question_number} の図`}
                  style={{ maxHeight: '50vh', objectFit: 'contain' }}
                  width="100%"
                />
              </div>
            )}

            {/* 選択肢 */}
            {q.choices.length > 0 ? (
              <Radio.Group
                value={state.selectedAnswer}
                onChange={(e) => {
                  if (!state.isAnswered) handleSelect(q.id, e.target.value as number)
                }}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {q.choices.map((choice) => (
                    <Card
                      key={choice.key}
                      size="small"
                      hoverable={!state.isAnswered}
                      style={{
                        cursor: state.isAnswered ? 'default' : 'pointer',
                        ...choiceStyle(q, choice.key, state),
                      }}
                      onClick={() => {
                        if (!state.isAnswered) handleSelect(q.id, choice.key)
                      }}
                    >
                      <Radio value={choice.key} disabled={state.isAnswered}>
                        <Text style={{ fontSize: 15 }}>
                          {choice.key}. {choice.text}
                        </Text>
                        {state.isAnswered && choice.key === q.correct_answer && (
                          <CheckCircleFilled style={{ color: '#52c41a', marginLeft: 8 }} />
                        )}
                        {state.isAnswered && choice.key === state.selectedAnswer && !state.isCorrect && choice.key !== q.correct_answer && (
                          <CloseCircleFilled style={{ color: '#f5222d', marginLeft: 8 }} />
                        )}
                      </Radio>
                    </Card>
                  ))}
                </Space>
              </Radio.Group>
            ) : (
              /* 番号ボタンUI（choices空 = 画像問題） */
              q.correct_answer === 0 ? (
                <Text type="secondary">この問題はデータ準備中です</Text>
              ) : (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {Array.from({ length: Math.max(5, q.correct_answer) }, (_, i) => i + 1).map((num) => {
                    let btnStyle: React.CSSProperties = {
                      flex: 1, minWidth: 48, height: 48, fontSize: 18, fontWeight: 'bold',
                      border: '2px solid #d9d9d9', borderRadius: 8, background: 'white',
                      cursor: state.isAnswered ? 'default' : 'pointer', transition: 'all 0.2s',
                    }
                    if (!state.isAnswered && state.selectedAnswer === num) {
                      btnStyle = { ...btnStyle, borderColor: '#1890ff', background: '#e6f7ff', color: '#1890ff' }
                    } else if (state.isAnswered && num === q.correct_answer) {
                      btnStyle = { ...btnStyle, borderColor: '#52c41a', background: '#f6ffed', color: '#52c41a' }
                    } else if (state.isAnswered && num === state.selectedAnswer && !state.isCorrect) {
                      btnStyle = { ...btnStyle, borderColor: '#ff4d4f', background: '#fff2f0', color: '#ff4d4f' }
                    }
                    return (
                      <button key={num} type="button" style={btnStyle}
                        onClick={() => { if (!state.isAnswered) handleSelect(q.id, num) }}
                        disabled={state.isAnswered}
                      >
                        {num}
                        {state.isAnswered && num === q.correct_answer && ' ✓'}
                        {state.isAnswered && num === state.selectedAnswer && !state.isCorrect && num !== q.correct_answer && ' ✗'}
                      </button>
                    )
                  })}
                </div>
              )
            )}

            {/* 回答ボタン */}
            {!state.isAnswered && (
              <Button
                type="primary"
                block
                disabled={state.selectedAnswer === null}
                onClick={() => handleSubmit(q)}
                style={{ marginTop: 12 }}
              >
                回答する
              </Button>
            )}

            {/* 正誤 + 解説 */}
            {state.isAnswered && (
              <>
                <Alert
                  type={state.isCorrect ? 'success' : 'error'}
                  message={state.isCorrect ? '正解！' : '不正解'}
                  showIcon
                  style={{ marginTop: 12, marginBottom: 8 }}
                />
                {q.explanation && (
                  <Card size="small" style={{ borderColor: state.isCorrect ? '#b7eb8f' : '#ffccc7' }}>
                    <Paragraph style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                      {q.explanation}
                    </Paragraph>
                  </Card>
                )}
              </>
            )}

            {/* カード間の余白は marginBottom: 20 で確保 */}
          </Card>
        )
      })}
    </div>
  )
}
