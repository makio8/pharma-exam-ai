import { useState, useCallback } from 'react'
import { Card, Tag, Typography, Space, Image, Radio, Button, Alert, Checkbox } from 'antd'
import { LinkOutlined, CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons'
import type { LinkedGroup } from '../hooks/useLinkedQuestions'
import type { Question, ConfidenceLevel } from '../types/question'
import { useAnswerHistory } from '../hooks/useAnswerHistory'
import { isMultiAnswer, hasMultiSelectInstruction, isCorrectAnswer, isCorrectKey, getRequiredSelections } from '../utils/question-helpers'

const { Text, Paragraph } = Typography

interface Props {
  group: LinkedGroup
}

interface QuestionState {
  selectedAnswer: number | null
  selectedAnswers: number[]
  isAnswered: boolean
  isCorrect: boolean
}

/**
 * 連問グループを1ページで縦スクロール表示（エメリー方式）
 * - 共通シナリオを1回だけ表示
 * - 各問題を縦に並べて表示（回答可能）
 */
export function LinkedQuestionViewer({ group }: Props) {
  const scenarioImage = group.questions.find((q) => q.image_url)?.image_url
  const { saveAnswer, getQuestionResult } = useAnswerHistory()

  // 各問題の回答状態を管理
  const [states, setStates] = useState<Record<string, QuestionState>>(() => {
    const init: Record<string, QuestionState> = {}
    for (const q of group.questions) {
      const existing = getQuestionResult(q.id)
      const existingAnswer = existing?.selected_answer ?? null
      init[q.id] = {
        selectedAnswer: Array.isArray(existingAnswer) ? null : existingAnswer,
        selectedAnswers: Array.isArray(existingAnswer) ? existingAnswer : [],
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

  const handleMultiSelect = useCallback((questionId: string, values: number[]) => {
    setStates((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], selectedAnswers: values },
    }))
  }, [])

  const handleSubmit = useCallback((question: Question) => {
    const state = states[question.id]
    const multi = isMultiAnswer(question)
    const selected = multi ? state.selectedAnswers : state.selectedAnswer
    if (multi && state.selectedAnswers.length === 0) return
    if (!multi && state.selectedAnswer === null) return
    const correct = isCorrectAnswer(question.correct_answer, selected as number | number[])
    setStates((prev) => ({
      ...prev,
      [question.id]: { ...prev[question.id], isAnswered: true, isCorrect: correct },
    }))
    saveAnswer({
      user_id: 'local_user',
      question_id: question.id,
      selected_answer: selected as number | number[],
      is_correct: correct,
      answered_at: new Date().toISOString(),
      confidence_level: 'medium' as ConfidenceLevel,
      time_spent_seconds: 0,
    })
  }, [states, saveAnswer])

  /** 選択肢の背景色 */
  const choiceStyle = (question: Question, key: number, state: QuestionState) => {
    if (!state.isAnswered) return {}
    const multi = isMultiAnswer(question)
    if (isCorrectKey(question.correct_answer, key)) {
      return { background: '#f6ffed', borderColor: '#b7eb8f' }
    }
    const wasSelected = multi
      ? state.selectedAnswers.includes(key)
      : key === state.selectedAnswer
    if (wasSelected && !state.isCorrect) {
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
            {scenario.replace(/\\n/g, '\n')}
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
      {group.questions.map((q, _idx) => {
        const state = states[q.id] ?? { selectedAnswer: null, selectedAnswers: [], isAnswered: false, isCorrect: false }
        const multi = isMultiAnswer(q)
        const requiredCount = multi ? getRequiredSelections(q.question_text, q.correct_answer) : 1

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
                {(hasMultiSelectInstruction(q.question_text) || multi) && <Tag color="orange">{getRequiredSelections(q.question_text, q.correct_answer)}つ選べ</Tag>}
              {state.isAnswered && (
                state.isCorrect
                  ? <Tag color="success">正解</Tag>
                  : <Tag color="error">不正解</Tag>
              )}
              </Space>
            </div>

            {/* 問題文（シナリオ・他問のテキストを除去し、この問題の本文だけ表示） */}
            <Paragraph style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 12 }}>
              {extractQuestionBody(q.question_text, q.question_number, scenario)}
            </Paragraph>

            {/* 問題個別の画像（choices空の問題のみ表示。選択肢テキストがある場合は冗長なので非表示） */}
            {q.image_url && q.choices.length === 0 && (
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
              multi ? (
                /* 複数選択（Checkbox.Group） */
                <Checkbox.Group
                  value={state.selectedAnswers}
                  onChange={(values) => {
                    if (!state.isAnswered) handleMultiSelect(q.id, values as number[])
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
                      >
                        <Checkbox value={choice.key} disabled={state.isAnswered}>
                          <Text style={{ fontSize: 15 }}>
                            {choice.key}. {choice.text}
                          </Text>
                          {state.isAnswered && isCorrectKey(q.correct_answer, choice.key) && (
                            <CheckCircleFilled style={{ color: '#52c41a', marginLeft: 8 }} />
                          )}
                          {state.isAnswered && state.selectedAnswers.includes(choice.key) && !state.isCorrect && !isCorrectKey(q.correct_answer, choice.key) && (
                            <CloseCircleFilled style={{ color: '#f5222d', marginLeft: 8 }} />
                          )}
                        </Checkbox>
                      </Card>
                    ))}
                  </Space>
                </Checkbox.Group>
              ) : (
                /* 単一選択（Radio.Group） */
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
                          {state.isAnswered && isCorrectKey(q.correct_answer, choice.key) && (
                            <CheckCircleFilled style={{ color: '#52c41a', marginLeft: 8 }} />
                          )}
                          {state.isAnswered && choice.key === state.selectedAnswer && !state.isCorrect && !isCorrectKey(q.correct_answer, choice.key) && (
                            <CloseCircleFilled style={{ color: '#f5222d', marginLeft: 8 }} />
                          )}
                        </Radio>
                      </Card>
                    ))}
                  </Space>
                </Radio.Group>
              )
            ) : (
              /* 番号ボタンUI（choices空 = 画像問題） */
              (Array.isArray(q.correct_answer) ? false : q.correct_answer === 0) ? (
                <Text type="secondary">この問題はデータ準備中です</Text>
              ) : (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {Array.from({ length: Math.max(5, Array.isArray(q.correct_answer) ? Math.max(...q.correct_answer) : q.correct_answer) }, (_, i) => i + 1).map((num) => {
                    let btnStyle: React.CSSProperties = {
                      flex: 1, minWidth: 48, height: 48, fontSize: 18, fontWeight: 'bold',
                      border: '2px solid #d9d9d9', borderRadius: 8, background: 'white',
                      cursor: state.isAnswered ? 'default' : 'pointer', transition: 'all 0.2s',
                    }
                    if (!state.isAnswered && state.selectedAnswer === num) {
                      btnStyle = { ...btnStyle, borderColor: '#1890ff', background: '#e6f7ff', color: '#1890ff' }
                    } else if (state.isAnswered && isCorrectKey(q.correct_answer, num)) {
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
                        {state.isAnswered && isCorrectKey(q.correct_answer, num) && ' ✓'}
                        {state.isAnswered && num === state.selectedAnswer && !state.isCorrect && !isCorrectKey(q.correct_answer, num) && ' ✗'}
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
                disabled={multi ? state.selectedAnswers.length !== requiredCount : state.selectedAnswer === null}
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
                      {q.explanation.replace(/\\n/g, '\n')}
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

/**
 * question_text から該当問題の本文だけを抽出
 *
 * 連問では1つの question_text に複数問分のテキストが結合されていることがある:
 *   "シナリオ...\n問196（実務）\n質問文196...\n問197（実務）\n質問文197..."
 *
 * この関数は questionNumber に該当する部分だけを抽出する
 */
function extractQuestionBody(questionText: string, questionNumber: number, scenario: string): string {
  // まずシナリオ部分を除去
  let text = questionText
  if (scenario && text.startsWith(scenario)) {
    text = text.slice(scenario.length).trim()
  }

  // 「問XXX」マーカーで分割
  const questionPattern = /問(\d+)\s*[（(]([^）)]*)[）)]\s*\n?/g
  const markers: { num: number; start: number; end: number }[] = []
  let m: RegExpExecArray | null
  while ((m = questionPattern.exec(text)) !== null) {
    markers.push({ num: parseInt(m[1], 10), start: m.index, end: m.index + m[0].length })
  }

  if (markers.length === 0) {
    // マーカーがない場合：問番号ヘッダーだけ除去して返す
    return text.replace(/^問\d+\s*[（(][^）)]*[）)]\s*\n*/g, '')
      .replace(/^問\d+\s*\n+/g, '')
      .trim() || questionText
  }

  // 該当する問番号のマーカーを探す
  const myMarker = markers.find((mk) => mk.num === questionNumber)
  if (!myMarker) {
    // 自分の番号がない場合（最初の問題にマーカーがないケース等）
    // → 最初のマーカーの手前のテキストを使う
    if (markers[0].start > 0) {
      const beforeFirst = text.slice(0, markers[0].start).trim()
      if (beforeFirst.length > 10) return beforeFirst
    }
    return text.replace(/^問\d+\s*[（(][^）)]*[）)]\s*\n*/g, '').trim() || questionText
  }

  // 自分のマーカーから次のマーカーまでを抽出
  const myIndex = markers.indexOf(myMarker)
  const nextMarker = markers[myIndex + 1]
  const bodyStart = myMarker.end
  const bodyEnd = nextMarker ? nextMarker.start : text.length
  const body = text.slice(bodyStart, bodyEnd).trim()

  return body || questionText
}
