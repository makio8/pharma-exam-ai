// 問題演習ページ - 問題一覧・フィルター・セッションモード
import { useState, useMemo } from 'react'
import {
  Card,
  Typography,
  Select,
  Radio,
  Input,
  Button,
  Tag,
  Badge,
  List,
  Space,
  Row,
  Col,
  Switch,
} from 'antd'
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { DUMMY_QUESTIONS } from '../data/dummy-questions'
import { useAnswerHistory } from '../hooks/useAnswerHistory'
import type { QuestionSection, QuestionSubject, Question } from '../types/question'

const { Title, Text } = Typography

/** 科目一覧 */
const SUBJECTS: QuestionSubject[] = [
  '物理', '化学', '生物', '薬理', '薬剤',
  '病態・薬物治療', '法規・制度・倫理', '実務',
]

/** 区分一覧 */
const SECTIONS: QuestionSection[] = ['必須', '理論', '実践']

/** 年度一覧（ダミーデータから抽出） */
const YEARS = [...new Set(DUMMY_QUESTIONS.map((q) => q.year))].sort((a, b) => a - b)

/** 正誤ステータス */
type CorrectStatus = 'all' | 'correct' | 'incorrect' | 'unanswered'

/** セッション問題数 */
type SessionCount = 10 | 20 | 0 // 0 = 全問

export function PracticePage() {
  const navigate = useNavigate()
  const { getQuestionResult } = useAnswerHistory()

  // --- フィルター状態 ---
  const [selectedSubjects, setSelectedSubjects] = useState<QuestionSubject[]>([])
  const [selectedYears, setSelectedYears] = useState<number[]>([])
  const [selectedSections, setSelectedSections] = useState<QuestionSection[]>([])
  const [correctStatus, setCorrectStatus] = useState<CorrectStatus>('all')
  const [keyword, setKeyword] = useState('')

  // --- セッション設定 ---
  const [sessionCount, setSessionCount] = useState<SessionCount>(10)
  const [randomOrder, setRandomOrder] = useState(false)

  // --- フィルタリング ---
  const filteredQuestions = useMemo(() => {
    let result = [...DUMMY_QUESTIONS]

    if (selectedSubjects.length > 0) {
      result = result.filter((q) => selectedSubjects.includes(q.subject))
    }
    if (selectedYears.length > 0) {
      result = result.filter((q) => selectedYears.includes(q.year))
    }
    if (selectedSections.length > 0) {
      result = result.filter((q) => selectedSections.includes(q.section))
    }
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      result = result.filter(
        (q) =>
          q.question_text.toLowerCase().includes(kw) ||
          q.tags.some((t) => t.toLowerCase().includes(kw)) ||
          q.category.toLowerCase().includes(kw),
      )
    }
    if (correctStatus !== 'all') {
      result = result.filter((q) => {
        const record = getQuestionResult(q.id)
        switch (correctStatus) {
          case 'correct':
            return record?.is_correct === true
          case 'incorrect':
            return record?.is_correct === false
          case 'unanswered':
            return !record
        }
      })
    }

    return result
  }, [selectedSubjects, selectedYears, selectedSections, correctStatus, keyword, getQuestionResult])

  // --- セッション開始 ---
  const handleStartSession = () => {
    let questions = [...filteredQuestions]

    if (randomOrder) {
      // Fisher-Yates シャッフル
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]]
      }
    }

    const count = sessionCount === 0 ? questions.length : sessionCount
    questions = questions.slice(0, count)

    if (questions.length > 0) {
      // セッションの問題IDリストをlocalStorageに保存
      localStorage.setItem(
        'practice_session',
        JSON.stringify(questions.map((q) => q.id)),
      )
      navigate(`/practice/${questions[0].id}`)
    }
  }

  /** 正誤バッジの表示 */
  const renderStatusBadge = (question: Question) => {
    const record = getQuestionResult(question.id)
    if (!record) {
      return <MinusCircleOutlined style={{ color: '#999', fontSize: 18 }} />
    }
    if (record.is_correct) {
      return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
    }
    return <CloseCircleOutlined style={{ color: '#f5222d', fontSize: 18 }} />
  }

  /** 区分の色 */
  const sectionColor = (section: QuestionSection) => {
    switch (section) {
      case '必須': return 'blue'
      case '理論': return 'orange'
      case '実践': return 'green'
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 8px' }}>
      <Title level={3}>演習モード</Title>

      {/* フィルターエリア */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Title level={5} style={{ marginTop: 0 }}>フィルター</Title>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12}>
            <Text type="secondary">科目</Text>
            <Select
              mode="multiple"
              allowClear
              placeholder="科目を選択"
              style={{ width: '100%' }}
              value={selectedSubjects}
              onChange={setSelectedSubjects}
              options={SUBJECTS.map((s) => ({ label: s, value: s }))}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary">年度（回）</Text>
            <Select
              mode="multiple"
              allowClear
              placeholder="年度を選択"
              style={{ width: '100%' }}
              value={selectedYears}
              onChange={setSelectedYears}
              options={YEARS.map((y) => ({ label: `第${y}回`, value: y }))}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary">区分</Text>
            <Select
              mode="multiple"
              allowClear
              placeholder="区分を選択"
              style={{ width: '100%' }}
              value={selectedSections}
              onChange={setSelectedSections}
              options={SECTIONS.map((s) => ({ label: s, value: s }))}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary">正誤ステータス</Text>
            <br />
            <Radio.Group
              value={correctStatus}
              onChange={(e) => setCorrectStatus(e.target.value as CorrectStatus)}
              optionType="button"
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="all">全て</Radio.Button>
              <Radio.Button value="correct">正解</Radio.Button>
              <Radio.Button value="incorrect">不正解</Radio.Button>
              <Radio.Button value="unanswered">未回答</Radio.Button>
            </Radio.Group>
          </Col>
          <Col xs={24}>
            <Input.Search
              placeholder="キーワードで検索（問題文・タグ・単元）"
              allowClear
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </Col>
        </Row>
      </Card>

      {/* セッション設定 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row align="middle" gutter={[16, 8]}>
          <Col>
            <Text type="secondary">問題数:</Text>{' '}
            <Radio.Group
              value={sessionCount}
              onChange={(e) => setSessionCount(e.target.value as SessionCount)}
              optionType="button"
              size="small"
            >
              <Radio.Button value={10}>10問</Radio.Button>
              <Radio.Button value={20}>20問</Radio.Button>
              <Radio.Button value={0}>全問</Radio.Button>
            </Radio.Group>
          </Col>
          <Col>
            <Space>
              <Text type="secondary">ランダム順:</Text>
              <Switch checked={randomOrder} onChange={setRandomOrder} size="small" />
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleStartSession}
              disabled={filteredQuestions.length === 0}
            >
              演習開始（{sessionCount === 0 ? filteredQuestions.length : Math.min(sessionCount, filteredQuestions.length)}問）
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 問題一覧 */}
      <Badge.Ribbon text={`${filteredQuestions.length}問`} color="blue">
        <Card size="small">
          <List
            dataSource={filteredQuestions}
            pagination={{ pageSize: 10, size: 'small', showSizeChanger: false }}
            renderItem={(q) => (
              <List.Item
                key={q.id}
                actions={[
                  renderStatusBadge(q),
                  <Button
                    key="go"
                    type="link"
                    size="small"
                    onClick={() => navigate(`/practice/${q.id}`)}
                  >
                    解く
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space size={4} wrap>
                      <Tag color={sectionColor(q.section)}>{q.section}</Tag>
                      <Text strong>第{q.year}回</Text>
                      <Text type="secondary">問{q.question_number}</Text>
                      <Text type="secondary">|</Text>
                      <Text>{q.subject}</Text>
                    </Space>
                  }
                  description={
                    <Space size={4} wrap>
                      {q.tags.slice(0, 2).map((tag) => (
                        <Tag key={tag} style={{ fontSize: 11 }}>{tag}</Tag>
                      ))}
                      <Text
                        type="secondary"
                        style={{ fontSize: 13 }}
                        ellipsis={{ tooltip: q.question_text }}
                      >
                        {q.question_text.length > 40
                          ? q.question_text.slice(0, 40) + '...'
                          : q.question_text}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </Badge.Ribbon>
    </div>
  )
}
