// 分析画面 - Agent C 実装
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Progress,
  Button,
  Tag,
  Space,
  Table,
  Empty,
  Divider,
  List,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  BarChartOutlined,
  WarningOutlined,
  BookOutlined,
  HistoryOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  RocketOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAnalytics } from '../hooks/useAnalytics'
import { NOTE_TYPE_CONFIG } from '../types/note'
import type { SubjectAccuracy, Question } from '../types/question'
import { DUMMY_QUESTIONS } from '../data/dummy-questions'
import type { NoteType } from '../types/note'

const { Title, Text } = Typography

export function AnalysisPage() {
  const navigate = useNavigate()
  const {
    subjectAccuracies,
    weakQuestions,
    recentHistory,
    totalAnswered,
    totalQuestions,
    noteStats,
    isEmpty,
  } = useAnalytics()

  // --- データが空 ---
  if (isEmpty) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 16px' }}>
        <Empty
          description={
            <Space direction="vertical">
              <Title level={4}>まずは問題を解いてみましょう！</Title>
              <Text type="secondary">
                回答データが蓄積されると、科目別の正答率や苦手分析が表示されます。
              </Text>
            </Space>
          }
        >
          <Button
            type="primary"
            icon={<RocketOutlined />}
            onClick={() => navigate('/practice')}
          >
            演習を始める
          </Button>
        </Empty>
      </div>
    )
  }

  // --- 科目別正答率テーブル ---
  const subjectColumns: ColumnsType<SubjectAccuracy> = [
    {
      title: '科目',
      dataIndex: 'subject',
      key: 'subject',
      width: 140,
    },
    {
      title: '回答数',
      dataIndex: 'total',
      key: 'total',
      width: 80,
      align: 'center',
    },
    {
      title: '正解数',
      dataIndex: 'correct',
      key: 'correct',
      width: 80,
      align: 'center',
    },
    {
      title: '正答率',
      key: 'accuracy',
      width: 200,
      render: (_: unknown, record: SubjectAccuracy) => {
        if (record.total === 0) {
          return <Text type="secondary">-</Text>
        }
        const pct = Math.round(record.accuracy * 100)
        const color =
          pct >= 70 ? '#52c41a' : pct >= 40 ? '#faad14' : '#ff4d4f'
        return (
          <Space>
            <Progress
              percent={pct}
              size="small"
              strokeColor={color}
              style={{ width: 100 }}
            />
            <Text strong style={{ color }}>
              {pct}%
            </Text>
          </Space>
        )
      },
    },
  ]

  // --- 苦手問題テーブル ---
  type WeakQuestion = Question & { incorrectCount: number }
  const weakColumns: ColumnsType<WeakQuestion> = [
    {
      title: '問題',
      key: 'question',
      render: (_: unknown, record: WeakQuestion) => (
        <Space direction="vertical" size={0}>
          <Space size={4}>
            <Tag color="blue">{record.subject}</Tag>
            <Tag>{record.category}</Tag>
          </Space>
          <Text
            style={{ fontSize: 12 }}
            ellipsis={{ tooltip: record.question_text }}
          >
            第{record.year}回 問{record.question_number}
          </Text>
        </Space>
      ),
    },
    {
      title: '不正解',
      dataIndex: 'incorrectCount',
      key: 'incorrectCount',
      width: 70,
      align: 'center',
      render: (count: number) => (
        <Text type="danger" strong>
          {count}回
        </Text>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 80,
      render: (_: unknown, record: WeakQuestion) => (
        <Button
          type="primary"
          size="small"
          danger
          onClick={() => navigate(`/practice/${record.id}`)}
        >
          復習
        </Button>
      ),
    },
  ]

  // --- 回答履歴用のquestionマップ ---
  // DUMMY_QUESTIONSからidで引ける形にする
  const questionMap = new Map<string, Question>()
  for (const q of DUMMY_QUESTIONS) {
    questionMap.set(q.id, q)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* === サマリー === */}
      <Card>
        <Title level={4}>
          <BarChartOutlined style={{ marginRight: 8 }} />
          学習サマリー
        </Title>
        <Row gutter={[16, 16]}>
          <Col xs={8}>
            <Statistic
              title="総回答数"
              value={totalAnswered}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={8}>
            <Statistic
              title="全問題数"
              value={totalQuestions}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
          <Col xs={8}>
            <Statistic
              title="消化率"
              value={Math.round((totalAnswered / Math.max(totalQuestions, 1)) * 100)}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
        </Row>
      </Card>

      {/* === 科目別正答率 === */}
      <Card>
        <Title level={4}>
          <BarChartOutlined style={{ marginRight: 8 }} />
          科目別正答率
        </Title>
        <Table<SubjectAccuracy>
          dataSource={subjectAccuracies.filter((s) => s.total > 0)}
          columns={subjectColumns}
          rowKey="subject"
          pagination={false}
          size="small"
          locale={{ emptyText: 'まだ回答データがありません' }}
        />

        {/* 全科目バー表示 */}
        <Divider style={{ margin: '16px 0 8px' }} />
        <Title level={5}>全科目一覧</Title>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {subjectAccuracies.map((sa) => {
            const pct = sa.total > 0 ? Math.round(sa.accuracy * 100) : 0
            const color =
              pct >= 70 ? '#52c41a' : pct >= 40 ? '#faad14' : '#ff4d4f'
            return (
              <Row key={sa.subject} align="middle" gutter={8}>
                <Col span={7}>
                  <Text style={{ fontSize: 13 }}>{sa.subject}</Text>
                </Col>
                <Col span={13}>
                  <Progress
                    percent={sa.total > 0 ? pct : 0}
                    strokeColor={sa.total > 0 ? color : '#d9d9d9'}
                    size="small"
                    showInfo={false}
                  />
                </Col>
                <Col span={4} style={{ textAlign: 'right' }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: sa.total > 0 ? color : '#bfbfbf',
                    }}
                  >
                    {sa.total > 0 ? `${pct}%` : '-'}
                  </Text>
                </Col>
              </Row>
            )
          })}
        </Space>
      </Card>

      {/* === 苦手問題リスト === */}
      <Card>
        <Title level={4}>
          <WarningOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
          苦手問題（2回以上不正解）
        </Title>
        {weakQuestions.length === 0 ? (
          <Empty
            description="苦手問題はまだありません"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table<WeakQuestion>
            dataSource={weakQuestions}
            columns={weakColumns}
            rowKey="id"
            pagination={false}
            size="small"
          />
        )}
      </Card>

      {/* === 付箋統計 === */}
      <Card>
        <Title level={4}>
          <BookOutlined style={{ marginRight: 8 }} />
          付箋統計
        </Title>
        <Row gutter={[16, 16]}>
          <Col xs={8}>
            <Statistic title="総付箋数" value={noteStats.total} suffix="枚" />
          </Col>
        </Row>
        {noteStats.total > 0 && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <Space size={[8, 8]} wrap>
              {(Object.entries(noteStats.byType) as [NoteType, number][])
                .filter(([, count]) => count > 0)
                .map(([type, count]) => {
                  const config = NOTE_TYPE_CONFIG[type]
                  return (
                    <Tag key={type} color={config.color}>
                      {config.label}: {count}枚
                    </Tag>
                  )
                })}
            </Space>
          </>
        )}
      </Card>

      {/* === 回答履歴タイムライン === */}
      <Card>
        <Title level={4}>
          <HistoryOutlined style={{ marginRight: 8 }} />
          直近の回答履歴
        </Title>
        {recentHistory.length === 0 ? (
          <Empty
            description="回答履歴がありません"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            size="small"
            dataSource={recentHistory.slice(0, 10)}
            renderItem={(item) => {
              const q = questionMap.get(item.question_id)
              const date = new Date(item.answered_at)
              const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
              return (
                <List.Item>
                  <Space style={{ width: '100%' }} size="small">
                    {item.is_correct ? (
                      <CheckCircleFilled style={{ color: '#52c41a' }} />
                    ) : (
                      <CloseCircleFilled style={{ color: '#ff4d4f' }} />
                    )}
                    <Text type="secondary" style={{ fontSize: 12, minWidth: 70 }}>
                      {dateStr}
                    </Text>
                    {q && (
                      <Text
                        style={{ fontSize: 13 }}
                        ellipsis={{ tooltip: q.question_text }}
                      >
                        {q.subject} - 第{q.year}回 問{q.question_number}
                      </Text>
                    )}
                    {!q && (
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        (問題ID: {item.question_id})
                      </Text>
                    )}
                  </Space>
                </List.Item>
              )
            }}
          />
        )}
      </Card>
    </Space>
  )
}
