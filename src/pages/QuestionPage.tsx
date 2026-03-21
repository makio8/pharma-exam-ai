// 問題演習画面 - 4択・正誤判定・解説・付箋作成
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  Card,
  Typography,
  Radio,
  Button,
  Tag,
  Space,
  Divider,
  Modal,
  Form,
  Input,
  Select,
  Result,
  Alert,
  Image,
  Checkbox,
} from 'antd'
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  UnorderedListOutlined,
  FormOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { ALL_QUESTIONS } from '../data/all-questions'
import { useAnswerHistory } from '../hooks/useAnswerHistory'
import { NOTE_TYPE_CONFIG } from '../types/note'
import type { NoteType, NoteVisibility, StickyNote } from '../types/note'
import type { ConfidenceLevel, Question } from '../types/question'
import type { CardFormat } from '../types/flashcard'
import { CARD_FORMAT_CONFIG } from '../types/flashcard'
import { useFlashCards } from '../hooks/useFlashCards'
import { useLinkedQuestions } from '../hooks/useLinkedQuestions'
import { LinkedQuestionViewer } from '../components/LinkedQuestionViewer'
import { isMultiAnswer, hasMultiSelectInstruction, isCorrectAnswer, isCorrectKey, getRequiredSelections } from '../utils/question-helpers'

const { Text, Paragraph } = Typography
const { TextArea } = Input

/** 付箋種別の選択肢 */
const NOTE_TYPE_OPTIONS = (Object.entries(NOTE_TYPE_CONFIG) as [NoteType, typeof NOTE_TYPE_CONFIG[NoteType]][]).map(
  ([value, config]) => ({
    label: `${config.emoji} ${config.label}`,
    value,
  }),
)

/** 公開範囲の選択肢 */
const VISIBILITY_OPTIONS: { label: string; value: NoteVisibility }[] = [
  { label: '自分だけ', value: 'private' },
  { label: '公開', value: 'public' },
]

export function QuestionPage() {
  const { questionId } = useParams<{ questionId: string }>()
  const navigate = useNavigate()
  const { saveAnswer, getQuestionResult } = useAnswerHistory()

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
        if (ids.length > 0) return ids
      }
    } catch {
      // パースエラーは無視
    }
    // フォールバック: 全問題のIDリスト（年度→問題番号順）
    return ALL_QUESTIONS.map((q) => q.id)
  }, [])

  const linkedGroup = useLinkedQuestions(questionId)

  // 連問タブ等でセッション外の問題に遷移した場合のフォールバック
  const effectiveIds = useMemo(() => {
    if (questionId && !sessionIds.includes(questionId)) {
      return ALL_QUESTIONS.map((q) => q.id)
    }
    return sessionIds
  }, [sessionIds, questionId])

  const { prevId, nextId } = useMemo(() => {
    if (!questionId) return { prevId: null, nextId: null }

    const currentQ = ALL_QUESTIONS.find(q => q.id === questionId)
    if (!currentQ) return { prevId: null, nextId: null }

    // Helper to get linked group's first question ID
    const getGroupStartId = (q: typeof currentQ): string => {
      if (!q.linked_group) return q.id
      const match = q.linked_group.match(/^r(\d+)-(\d+)-(\d+)$/)
      if (!match) return q.id
      return `r${match[1]}-${match[2]}`
    }

    // Find current group boundaries
    let currentGroupStart = currentQ.question_number
    let currentGroupEnd = currentQ.question_number
    if (currentQ.linked_group) {
      const match = currentQ.linked_group.match(/^r(\d+)-(\d+)-(\d+)$/)
      if (match) {
        currentGroupStart = parseInt(match[2], 10)
        currentGroupEnd = parseInt(match[3], 10)
      }
    }

    // Build a Map for O(1) lookup
    const questionMap = new Map(ALL_QUESTIONS.map(q => [q.id, q]))
    const effectiveQuestions = effectiveIds.map(id => questionMap.get(id)).filter((q): q is Question => !!q)

    // Find next: first question in effectiveIds after current group end
    const nextQuestion = effectiveQuestions.find(q =>
      (q.year === currentQ.year && q.question_number > currentGroupEnd) ||
      q.year > currentQ.year
    )

    // Find prev: last question in effectiveIds before current group start
    const prevQuestion = [...effectiveQuestions].reverse().find(q =>
      (q.year === currentQ.year && q.question_number < currentGroupStart) ||
      q.year < currentQ.year
    )

    return {
      prevId: prevQuestion ? getGroupStartId(prevQuestion) : null,
      nextId: nextQuestion ? getGroupStartId(nextQuestion) : null,
    }
  }, [questionId, effectiveIds])

  // --- 回答状態 ---
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [confidence, setConfidence] = useState<ConfidenceLevel>('medium')
  const startTimeRef = useRef(Date.now())

  // 複数選択判定
  const multiAnswer = question ? isMultiAnswer(question) : false
  const requiredCount = question ? getRequiredSelections(question.question_text, question.correct_answer) : 1

  // questionId が変わったら startTime をリセット
  useEffect(() => {
    startTimeRef.current = Date.now()
  }, [questionId])

  // --- 付箋モーダル ---
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [form] = Form.useForm()

  // --- 暗記カードモーダル ---
  const [cardModalOpen, setCardModalOpen] = useState(false)
  const [cardForm] = Form.useForm()
  const { addCard } = useFlashCards()

  // 既存の回答があるか確認
  const existingResult = useMemo(
    () => (questionId ? getQuestionResult(questionId) : undefined),
    [questionId, getQuestionResult],
  )

  /** 回答する */
  const handleSubmitAnswer = useCallback(() => {
    if (!question) return
    const multi = isMultiAnswer(question)
    const selected = multi ? selectedAnswers : selectedAnswer
    if (multi && selectedAnswers.length === 0) return
    if (!multi && selectedAnswer === null) return
    const correct = isCorrectAnswer(question.correct_answer, selected as number | number[])
    setIsCorrect(correct)
    setIsAnswered(true)

    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000)
    // TODO: Supabase schema needs migration: answer_history.selected_answer int → jsonb
    // Currently only localStorage supports array values
    saveAnswer({
      user_id: 'local_user',
      question_id: question.id,
      selected_answer: selected as number | number[],
      is_correct: correct,
      answered_at: new Date().toISOString(),
      confidence_level: confidence,
      time_spent_seconds: timeSpent,
    })
  }, [selectedAnswer, selectedAnswers, question, confidence, startTimeRef, saveAnswer])

  /** 付箋を保存 */
  const handleSaveNote = useCallback(() => {
    form
      .validateFields()
      .then((values: { title: string; body: string; note_type: NoteType; tags: string[]; visibility: NoteVisibility }) => {
        const note: StickyNote = {
          id: crypto.randomUUID(),
          user_id: 'local_user',
          question_id: question?.id ?? '',
          title: values.title,
          body: values.body,
          note_type: values.note_type,
          tags: values.tags ?? [],
          visibility: values.visibility,
          saves_count: 0,
          likes_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // localStorageに追加
        const existing = JSON.parse(localStorage.getItem('sticky_notes') ?? '[]') as StickyNote[]
        existing.push(note)
        localStorage.setItem('sticky_notes', JSON.stringify(existing))

        setNoteModalOpen(false)
        form.resetFields()
      })
      .catch(() => {
        // バリデーションエラー — フォームが表示するので何もしない
      })
  }, [form, question])

  /** 暗記カードを保存 */
  const handleSaveCard = useCallback(() => {
    cardForm
      .validateFields()
      .then((values: { front: string; back: string; format: CardFormat; tags: string[] }) => {
        addCard({
          user_id: 'local_user',
          question_id: question?.id ?? '',
          topic_id: question?.category ?? '',
          subject: question?.subject ?? '薬理',
          front: values.front,
          back: values.back,
          format: values.format,
          tags: values.tags ?? [],
        })
        setCardModalOpen(false)
        cardForm.resetFields()
      })
      .catch(() => {
        // バリデーションエラー — フォームが表示するので何もしない
      })
  }, [cardForm, question, addCard])

  /** 次の問題へ遷移（状態リセットのためページリロード的にnavigateする） */
  const goToQuestion = (id: string) => {
    // Reactの状態をリセットするためkeyを変えるかページ遷移
    setSelectedAnswer(null)
    setSelectedAnswers([])
    setIsAnswered(false)
    setIsCorrect(false)
    setConfidence('medium')
    navigate(`/practice/${id}`)
    window.scrollTo(0, 0)
  }

  // --- 問題が見つからない場合 ---
  if (!question) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 8px' }}>
        <Result
          status="404"
          title="問題が見つかりません"
          subTitle={`ID: ${questionId ?? '(なし)'}`}
          extra={
            <Button type="primary" onClick={() => navigate('/practice')}>
              問題一覧に戻る
            </Button>
          }
        />
      </div>
    )
  }

  // --- 選択肢の背景色（回答後） ---
  const choiceStyle = (key: number) => {
    if (!isAnswered) return {}
    if (isCorrectKey(question.correct_answer, key)) {
      return { background: '#f6ffed', borderColor: '#b7eb8f' }
    }
    const wasSelected = multiAnswer
      ? selectedAnswers.includes(key)
      : key === selectedAnswer
    if (wasSelected && !isCorrect) {
      return { background: '#fff2f0', borderColor: '#ffccc7' }
    }
    return {}
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 8px' }}>
      {/* ヘッダー情報 */}
      <Space wrap style={{ marginBottom: 8 }}>
        <Tag color="blue">{question.section}</Tag>
        <Text strong>第{question.year}回</Text>
        <Text type="secondary">問{question.question_number}</Text>
        <Tag>{question.subject}</Tag>
        <Tag color="default">{question.category}</Tag>
        {(hasMultiSelectInstruction(question.question_text) || isMultiAnswer(question)) && <Tag color="orange">{getRequiredSelections(question.question_text, question.correct_answer)}つ選べ</Tag>}
      </Space>

      {/* 連問グループ表示（エメリー方式: 1ページに全問縦並び） */}
      {linkedGroup && (
        <LinkedQuestionViewer
          key={linkedGroup.groupId}
          group={linkedGroup}
        />
      )}

      {/* 連問の場合は以下の個別表示をスキップ（LinkedQuestionViewerが全問表示する） */}
      {linkedGroup ? null : (
      <>

      {/* 既存回答があれば表示 */}
      {existingResult && !isAnswered && (
        <Alert
          type={existingResult.is_correct ? 'success' : 'error'}
          message={`前回: ${existingResult.is_correct ? '正解' : '不正解'}（${new Date(existingResult.answered_at).toLocaleDateString()}）`}
          style={{ marginBottom: 12 }}
          showIcon
        />
      )}

      {/* 問題文 */}
      <Card style={{ marginBottom: 16 }}>
        <Paragraph style={{ fontSize: 16, lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 0 }}>
          {question.question_text}
        </Paragraph>
      </Card>

      {/* 問題画像（choices空の画像問題のみ表示。選択肢テキストがある場合は冗長なので非表示） */}
      {question.image_url && question.choices.length === 0 && (
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <Image
            src={question.image_url}
            alt={`第${question.year}回 問${question.question_number} の図`}
            style={{ maxHeight: '60vh', objectFit: 'contain' }}
            width="100%"
            fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7nlLvlg4/jgpLoqq3jgb/ovrzjgoHjgb7jgZvjgpM8L3RleHQ+PC9zdmc+"
            placeholder={
              <div style={{ background: '#f5f5f5', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                読み込み中...
              </div>
            }
          />
        </div>
      )}

      {/* 自信度（回答前） */}
      {!isAnswered && (
        <Space style={{ marginBottom: 12 }}>
          <Text type="secondary">自信度:</Text>
          <Radio.Group
            value={confidence}
            onChange={(e) => setConfidence(e.target.value as ConfidenceLevel)}
            optionType="button"
            size="small"
          >
            <Radio.Button value="high">高</Radio.Button>
            <Radio.Button value="medium">中</Radio.Button>
            <Radio.Button value="low">低</Radio.Button>
            <Radio.Button value="guess">勘</Radio.Button>
          </Radio.Group>
        </Space>
      )}

      {/* 選択肢 */}
      {question.choices.length === 0 ? (
        /* 番号ボタンUI（choices空 = 画像問題） */
        (Array.isArray(question.correct_answer) ? false : question.correct_answer === 0) ? (
          <Card size="small" style={{ marginBottom: 16, textAlign: 'center' }}>
            <Text type="secondary">この問題はデータ準備中です</Text>
          </Card>
        ) : (
          <Card size="small" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {Array.from({ length: Math.max(5, Array.isArray(question.correct_answer) ? Math.max(...question.correct_answer) : question.correct_answer) }, (_, i) => i + 1).map((num) => {
                let btnStyle: React.CSSProperties = {
                  flex: 1,
                  minWidth: 48,
                  height: 48,
                  fontSize: 18,
                  fontWeight: 'bold',
                  border: '2px solid #d9d9d9',
                  borderRadius: 8,
                  background: 'white',
                  cursor: isAnswered ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                }

                if (!isAnswered && selectedAnswer === num) {
                  btnStyle = { ...btnStyle, borderColor: '#1890ff', background: '#e6f7ff', color: '#1890ff' }
                } else if (isAnswered && isCorrectKey(question.correct_answer, num)) {
                  btnStyle = { ...btnStyle, borderColor: '#52c41a', background: '#f6ffed', color: '#52c41a' }
                } else if (isAnswered && num === selectedAnswer && !isCorrect) {
                  btnStyle = { ...btnStyle, borderColor: '#ff4d4f', background: '#fff2f0', color: '#ff4d4f' }
                }

                return (
                  <button
                    key={num}
                    type="button"
                    style={btnStyle}
                    onClick={() => { if (!isAnswered) setSelectedAnswer(num) }}
                    disabled={isAnswered}
                  >
                    {num}
                    {isAnswered && isCorrectKey(question.correct_answer, num) && ' ✓'}
                    {isAnswered && num === selectedAnswer && !isCorrect && !isCorrectKey(question.correct_answer, num) && ' ✗'}
                  </button>
                )
              })}
            </div>
          </Card>
        )
      ) : multiAnswer ? (
        /* 複数選択UI（Checkbox.Group） */
        <Card size="small" style={{ marginBottom: 16 }}>
          <Checkbox.Group
            value={selectedAnswers}
            onChange={(values) => {
              if (!isAnswered) setSelectedAnswers(values as number[])
            }}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {question.choices.map((choice) => (
                <Card
                  key={choice.key}
                  size="small"
                  hoverable={!isAnswered}
                  style={{
                    cursor: isAnswered ? 'default' : 'pointer',
                    ...choiceStyle(choice.key),
                  }}
                >
                  <Checkbox value={choice.key} disabled={isAnswered}>
                    <Text style={{ fontSize: 15 }}>
                      {choice.key}. {choice.text}
                    </Text>
                    {isAnswered && isCorrectKey(question.correct_answer, choice.key) && (
                      <CheckCircleFilled style={{ color: '#52c41a', marginLeft: 8 }} />
                    )}
                    {isAnswered && selectedAnswers.includes(choice.key) && !isCorrect && !isCorrectKey(question.correct_answer, choice.key) && (
                      <CloseCircleFilled style={{ color: '#f5222d', marginLeft: 8 }} />
                    )}
                  </Checkbox>
                </Card>
              ))}
            </Space>
          </Checkbox.Group>
        </Card>
      ) : (
        /* 通常の選択肢UI（単一選択 Radio.Group） */
        <Card size="small" style={{ marginBottom: 16 }}>
          <Radio.Group
            value={selectedAnswer}
            onChange={(e) => {
              if (!isAnswered) setSelectedAnswer(e.target.value as number)
            }}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {question.choices.map((choice) => (
                <Card
                  key={choice.key}
                  size="small"
                  hoverable={!isAnswered}
                  style={{
                    cursor: isAnswered ? 'default' : 'pointer',
                    ...choiceStyle(choice.key),
                  }}
                  onClick={() => {
                    if (!isAnswered) setSelectedAnswer(choice.key)
                  }}
                >
                  <Radio value={choice.key} disabled={isAnswered}>
                    <Text style={{ fontSize: 15 }}>
                      {choice.key}. {choice.text}
                    </Text>
                    {isAnswered && isCorrectKey(question.correct_answer, choice.key) && (
                      <CheckCircleFilled style={{ color: '#52c41a', marginLeft: 8 }} />
                    )}
                    {isAnswered && choice.key === selectedAnswer && !isCorrect && !isCorrectKey(question.correct_answer, choice.key) && (
                      <CloseCircleFilled style={{ color: '#f5222d', marginLeft: 8 }} />
                    )}
                  </Radio>
                </Card>
              ))}
            </Space>
          </Radio.Group>
        </Card>
      )}

      {/* 回答ボタン */}
      {!isAnswered && (
        <Button
          type="primary"
          size="large"
          block
          disabled={
            multiAnswer
              ? selectedAnswers.length !== requiredCount || (Array.isArray(question.correct_answer) ? false : question.correct_answer === 0)
              : selectedAnswer === null || (Array.isArray(question.correct_answer) ? false : question.correct_answer === 0)
          }
          onClick={handleSubmitAnswer}
          style={{ marginBottom: 16 }}
        >
          回答する
        </Button>
      )}

      {/* 正誤結果 + 解説（回答後のみ） */}
      {isAnswered && (
        <>
          <Alert
            type={isCorrect ? 'success' : 'error'}
            message={isCorrect ? '正解！' : '不正解'}
            showIcon
            style={{ marginBottom: 12 }}
          />

          <Card
            title="解説"
            size="small"
            style={{ marginBottom: 16, borderColor: isCorrect ? '#b7eb8f' : '#ffccc7' }}
          >
            <Paragraph style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 0 }}>
              {question.explanation}
            </Paragraph>
            <Divider style={{ margin: '12px 0' }} />
            <Space wrap>
              {question.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
          </Card>

          {/* 付箋作成・カード作成ボタン */}
          <Space style={{ marginBottom: 16 }}>
            <Button
              icon={<FormOutlined />}
              onClick={() => setNoteModalOpen(true)}
            >
              付箋を作成
            </Button>
            <Button
              onClick={() => setCardModalOpen(true)}
            >
              暗記カードを作る
            </Button>
          </Space>

          <Divider />
        </>
      )}

      </>
      )}

      {/* ナビゲーション */}
      <Space style={{ width: '100%', justifyContent: 'space-between', display: 'flex' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          disabled={!prevId}
          onClick={() => prevId && goToQuestion(prevId)}
        >
          前の問題
        </Button>

        <Button
          icon={<UnorderedListOutlined />}
          onClick={() => navigate('/practice')}
        >
          一覧に戻る
        </Button>

        <Button
          type={isAnswered ? 'primary' : 'default'}
          disabled={!nextId}
          onClick={() => nextId && goToQuestion(nextId)}
        >
          次の問題 <ArrowRightOutlined />
        </Button>
      </Space>

      {/* 付箋作成モーダル */}
      <Modal
        title="付箋を作成"
        open={noteModalOpen}
        onOk={handleSaveNote}
        onCancel={() => {
          setNoteModalOpen(false)
          form.resetFields()
        }}
        okText="保存"
        cancelText="キャンセル"
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            note_type: 'knowledge' as NoteType,
            visibility: 'private' as NoteVisibility,
            tags: [],
          }}
        >
          <Form.Item
            name="title"
            label="タイトル"
            rules={[{ required: true, message: 'タイトルを入力してください' }]}
          >
            <Input placeholder="例: β1受容体の覚え方" />
          </Form.Item>

          <Form.Item
            name="body"
            label="本文"
            rules={[{ required: true, message: '本文を入力してください' }]}
          >
            <TextArea rows={4} placeholder="メモを入力..." />
          </Form.Item>

          <Form.Item name="note_type" label="種別">
            <Select options={NOTE_TYPE_OPTIONS} />
          </Form.Item>

          <Form.Item name="tags" label="タグ">
            <Select
              mode="tags"
              placeholder="タグを入力してEnter"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="visibility" label="公開範囲">
            <Radio.Group options={VISIBILITY_OPTIONS} optionType="button" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 暗記カード作成モーダル */}
      <Modal
        title="暗記カードを作る"
        open={cardModalOpen}
        onOk={handleSaveCard}
        onCancel={() => {
          setCardModalOpen(false)
          cardForm.resetFields()
        }}
        okText="保存"
        cancelText="キャンセル"
        destroyOnHidden
      >
        <Form
          form={cardForm}
          layout="vertical"
          initialValues={{
            format: 'question_answer' as CardFormat,
            tags: [],
            front: '',
            back: '',
          }}
        >
          <Form.Item name="format" label="フォーマット">
            <Select
              options={(Object.entries(CARD_FORMAT_CONFIG) as [CardFormat, typeof CARD_FORMAT_CONFIG[CardFormat]][]).map(
                ([value, config]) => ({
                  label: `${config.emoji} ${config.label}`,
                  value,
                }),
              )}
            />
          </Form.Item>

          <Form.Item
            name="front"
            label="表面（問い/用語）"
            rules={[{ required: true, message: '表面を入力してください' }]}
          >
            <TextArea rows={3} placeholder="覚えたい問いや用語を入力..." />
          </Form.Item>

          <Form.Item
            name="back"
            label="裏面（答え/定義）"
            rules={[{ required: true, message: '裏面を入力してください' }]}
          >
            <TextArea rows={3} placeholder="答えや定義を入力..." />
          </Form.Item>

          <Form.Item name="tags" label="タグ">
            <Select
              mode="tags"
              placeholder="タグを入力してEnter"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
