// 問題演習画面 - 4択・正誤判定・解説・付箋作成
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
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
import type { ConfidenceLevel } from '../types/question'

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
      if (!raw) return []
      return JSON.parse(raw) as string[]
    } catch {
      return []
    }
  }, [])

  const currentIndex = sessionIds.indexOf(questionId ?? '')
  const prevId = currentIndex > 0 ? sessionIds[currentIndex - 1] : null
  const nextId = currentIndex >= 0 && currentIndex < sessionIds.length - 1
    ? sessionIds[currentIndex + 1]
    : null

  // --- 回答状態 ---
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [confidence, setConfidence] = useState<ConfidenceLevel>('medium')
  const startTimeRef = useRef(Date.now())

  // questionId が変わったら startTime をリセット
  useEffect(() => {
    startTimeRef.current = Date.now()
  }, [questionId])

  // --- 付箋モーダル ---
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [form] = Form.useForm()

  // 既存の回答があるか確認
  const existingResult = useMemo(
    () => (questionId ? getQuestionResult(questionId) : undefined),
    [questionId, getQuestionResult],
  )

  /** 回答する */
  const handleSubmitAnswer = useCallback(() => {
    if (selectedAnswer === null || !question) return
    const correct = selectedAnswer === question.correct_answer
    setIsCorrect(correct)
    setIsAnswered(true)

    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000)
    saveAnswer({
      user_id: 'local_user',
      question_id: question.id,
      selected_answer: selectedAnswer,
      is_correct: correct,
      answered_at: new Date().toISOString(),
      confidence_level: confidence,
      time_spent_seconds: timeSpent,
    })
  }, [selectedAnswer, question, confidence, startTimeRef, saveAnswer])

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

  /** 次の問題へ遷移（状態リセットのためページリロード的にnavigateする） */
  const goToQuestion = (id: string) => {
    // Reactの状態をリセットするためkeyを変えるかページ遷移
    setSelectedAnswer(null)
    setIsAnswered(false)
    setIsCorrect(false)
    setConfidence('medium')
    navigate(`/practice/${id}`)
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
    if (key === question.correct_answer) {
      return { background: '#f6ffed', borderColor: '#b7eb8f' }
    }
    if (key === selectedAnswer && !isCorrect) {
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
      </Space>

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

      {/* 問題画像（image_url がある場合のみ表示） */}
      {question.image_url && (
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
      <Card size="small" style={{ marginBottom: 16 }}>
        <Radio.Group
          value={selectedAnswer}
          onChange={(e) => {
            if (!isAnswered) setSelectedAnswer(e.target.value as number)
          }}
          style={{ width: '100%' }}
        >
          <Space orientation="vertical" style={{ width: '100%' }}>
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
                  {isAnswered && choice.key === question.correct_answer && (
                    <CheckCircleFilled style={{ color: '#52c41a', marginLeft: 8 }} />
                  )}
                  {isAnswered && choice.key === selectedAnswer && !isCorrect && choice.key !== question.correct_answer && (
                    <CloseCircleFilled style={{ color: '#f5222d', marginLeft: 8 }} />
                  )}
                </Radio>
              </Card>
            ))}
          </Space>
        </Radio.Group>
      </Card>

      {/* 回答ボタン */}
      {!isAnswered && (
        <Button
          type="primary"
          size="large"
          block
          disabled={selectedAnswer === null}
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

          {/* 付箋作成ボタン */}
          <Button
            icon={<FormOutlined />}
            onClick={() => setNoteModalOpen(true)}
            style={{ marginBottom: 16 }}
          >
            付箋を作成
          </Button>

          <Divider />
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
    </div>
  )
}
