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
  Space,
  Row,
  Col,
  Switch,
  Pagination,
  Divider,
} from 'antd'
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
  FileImageOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { ALL_QUESTIONS } from '../data/all-questions'
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
const YEARS = [...new Set(ALL_QUESTIONS.map((q) => q.year))].sort((a, b) => a - b)

/** 正誤ステータス */
type CorrectStatus = 'all' | 'correct' | 'incorrect' | 'unanswered'

/** セッション問題数 */
type SessionCount = 10 | 20 | 0 // 0 = 全問

const PAGE_SIZE = 10

export function PracticePage() {
  const navigate = useNavigate()
  const { getQuestionResult } = useAnswerHistory()

  // --- ページネーション ---
  const [currentPage, setCurrentPage] = useState(1)

  // --- フィルター状態 ---
  const [selectedSubjects, setSelectedSubjects] = useState<QuestionSubject[]>([])
  const [selectedYears, setSelectedYears] = useState<number[]>([])
  const [selectedSections, setSelectedSections] = useState<QuestionSection[]>([])
  const [correctStatus, setCorrectStatus] = useState<CorrectStatus>('all')
  const [keyword, setKeyword] = useState('')

  // --- 正答率フィルター（デフォルトON: 60%以上のみ） ---
  const [easyOnly, setEasyOnly] = useState(true)

  // --- 画像問題フィルター ---
  const [imageOnly, setImageOnly] = useState(false)

  // --- セッション設定 ---
  const [sessionCount, setSessionCount] = useState<SessionCount>(10)
  const [randomOrder, setRandomOrder] = useState(false)

  // --- フィルタリング ---
  const filteredQuestions = useMemo(() => {
    let result = [...ALL_QUESTIONS]

    // 正答率60%以上フィルター
    if (easyOnly) {
      result = result.filter((q) => (q.correct_rate ?? 1) >= 0.6)
    }

    // 画像問題のみフィルター
    if (imageOnly) {
      result = result.filter((q) => !!q.image_url)
    }

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

    setCurrentPage(1)
    return result
  }, [easyOnly, imageOnly, selectedSubjects, selectedYears, selectedSections, correctStatus, keyword, getQuestionResult])

  // --- 連問をセット単位で表示するための問題リスト ---
  const displayQuestions = useMemo(() => {
    const seen = new Set<string>()
    return filteredQuestions.filter(q => {
      if (!q.linked_group) return true
      if (seen.has(q.linked_group)) return false
      seen.add(q.linked_group)
      return true
    })
  }, [filteredQuestions])

  // --- セッション開始 ---
  const handleStartSession = () => {
    let questions = [...filteredQuestions]

    // Ensure complete linked sets
    const questionIds = new Set(questions.map(q => q.id))
    const addedIds = new Set<string>()
    for (const q of questions) {
      if (!q.linked_group) continue
      const match = q.linked_group.match(/^r(\d+)-(\d+)-(\d+)$/)
      if (!match) continue
      const [, year, startStr, endStr] = match
      const start = parseInt(startStr, 10)
      const end = parseInt(endStr, 10)
      for (let n = start; n <= end; n++) {
        const id = `r${year}-${n}`
        if (!questionIds.has(id) && !addedIds.has(id)) {
          const linkedQ = ALL_QUESTIONS.find(aq => aq.id === id)
          if (linkedQ) {
            questions.push(linkedQ)
            addedIds.add(id)
          }
        }
      }
    }

    questions.sort((a, b) => a.year - b.year || a.question_number - b.question_number)

    if (randomOrder) {
      // Set-based shuffle
      const chunks: typeof questions[] = []
      let i = 0
      while (i < questions.length) {
        const q = questions[i]
        if (q.linked_group) {
          const chunk = [q]
          while (i + 1 < questions.length && questions[i + 1].linked_group === q.linked_group) {
            chunk.push(questions[++i])
          }
          chunks.push(chunk)
        } else {
          chunks.push([q])
        }
        i++
      }
      for (let i = chunks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chunks[i], chunks[j]] = [chunks[j], chunks[i]]
      }
      questions = chunks.flat()
    }

    // Set-boundary-aware slicing
    if (sessionCount > 0) {
      const sliced: typeof questions = []
      const seen = new Set<string>()
      for (const q of questions) {
        if (sliced.length >= sessionCount && !q.linked_group) break
        if (q.linked_group && seen.has(q.linked_group)) {
          sliced.push(q)
          continue
        }
        if (sliced.length >= sessionCount) break
        sliced.push(q)
        if (q.linked_group) seen.add(q.linked_group)
      }
      questions = sliced
    }

    if (questions.length > 0) {
      localStorage.setItem('practice_session', JSON.stringify(questions.map(q => q.id)))
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
          <Col xs={24} sm={12}>
            <Space>
              <Text type="secondary">正答率60%以上のみ:</Text>
              <Switch
                checked={easyOnly}
                onChange={setEasyOnly}
                size="small"
                checkedChildren="ON"
                unCheckedChildren="OFF"
              />
              {easyOnly && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  （難問を除外中）
                </Text>
              )}
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space>
              <Text type="secondary">画像問題のみ:</Text>
              <Switch
                checked={imageOnly}
                onChange={setImageOnly}
                size="small"
                checkedChildren="ON"
                unCheckedChildren="OFF"
              />
              {imageOnly && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  （{filteredQuestions.length}問）
                </Text>
              )}
            </Space>
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
      <Badge.Ribbon text={`${displayQuestions.length}問`} color="blue">
        <Card size="small">
          {displayQuestions
            .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
            .map((q, idx) => (
              <div key={q.id}>
                {idx > 0 && <Divider style={{ margin: '8px 0' }} />}
                <Row justify="space-between" align="middle" wrap={false}>
                  <Col flex="1" style={{ minWidth: 0 }}>
                    <Space size={4} wrap>
                      <Tag color={sectionColor(q.section)}>{q.section}</Tag>
                      <Text strong>第{q.year}回</Text>
                      <Text type="secondary">問{q.question_number}</Text>
                      {q.image_url && <FileImageOutlined style={{ color: '#1890ff', fontSize: 14 }} />}
                      {q.linked_group && (() => {
                        const match = q.linked_group.match(/^r(\d+)-(\d+)-(\d+)$/)
                        if (!match) return null
                        const [, , start, end] = match
                        return <Tag color="purple">連問 {start}-{end}</Tag>
                      })()}
                      <Text type="secondary">|</Text>
                      <Text>{q.subject}</Text>
                    </Space>
                    <div style={{ marginTop: 4 }}>
                      <Space size={4} wrap>
                        {q.tags.slice(0, 2).map((tag) => (
                          <Tag key={tag} style={{ fontSize: 11 }}>{tag}</Tag>
                        ))}
                        <Text
                          type="secondary"
                          style={{ fontSize: 13 }}
                          ellipsis
                        >
                          {q.question_text.length > 40
                            ? q.question_text.slice(0, 40) + '...'
                            : q.question_text}
                        </Text>
                      </Space>
                    </div>
                  </Col>
                  <Col style={{ marginLeft: 8, flexShrink: 0 }}>
                    <Space>
                      {renderStatusBadge(q)}
                      <Button
                        type="link"
                        size="small"
                        onClick={() => {
                          localStorage.setItem(
                            'practice_session',
                            JSON.stringify(filteredQuestions.map((fq) => fq.id)),
                          )
                          const targetId = q.linked_group
                            ? (() => {
                                const match = q.linked_group.match(/^r(\d+)-(\d+)-(\d+)$/)
                                return match ? `r${match[1]}-${match[2]}` : q.id
                              })()
                            : q.id
                          navigate(`/practice/${targetId}`)
                        }}
                      >
                        解く
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </div>
            ))}
          {displayQuestions.length === 0 && (
            <Text type="secondary">条件に一致する問題がありません</Text>
          )}
          {displayQuestions.length > PAGE_SIZE && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Pagination
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={displayQuestions.length}
                onChange={setCurrentPage}
                size="small"
                showSizeChanger={false}
              />
            </div>
          )}
        </Card>
      </Badge.Ribbon>
    </div>
  )
}
