// ホーム画面 - Agent C 実装
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
  Empty,
  Divider,
} from 'antd'
import {
  CheckCircleOutlined,
  FireOutlined,
  BookOutlined,
  RocketOutlined,
  TrophyOutlined,
  RightOutlined,
  ReadOutlined,
} from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useAnalytics } from '../hooks/useAnalytics'
import { NOTE_TYPE_CONFIG } from '../types/note'

const { Title, Text } = Typography

export function HomePage() {
  const navigate = useNavigate()
  const {
    todayStats,
    totalAnswered,
    totalQuestions,
    recommendedQuestions,
    recentNotes,
    weeklyData,
    isEmpty,
  } = useAnalytics()

  // --- 初回起動：ウェルカム画面 ---
  if (isEmpty) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 16px' }}>
        <Title level={2}>
          ようこそ！国試ノートへ
        </Title>
        <Text
          type="secondary"
          style={{ fontSize: 16, display: 'block', marginBottom: 32 }}
        >
          薬剤師国家試験の過去問を解いて、苦手を見える化しましょう。
          <br />
          まずは1問から始めてみましょう！
        </Text>
        <Button
          type="primary"
          size="large"
          icon={<RocketOutlined />}
          onClick={() => navigate('/practice')}
        >
          最初の問題を解く
        </Button>
      </div>
    )
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* === 今日の進捗サマリー === */}
      <Card>
        <Title level={4}>
          <FireOutlined style={{ marginRight: 8 }} />
          今日の進捗
        </Title>
        <Row gutter={[16, 16]}>
          <Col xs={8}>
            <Statistic
              title="解いた問題"
              value={todayStats.answered}
              suffix="問"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={8}>
            <Statistic
              title="正答率"
              value={
                todayStats.answered > 0
                  ? Math.round(todayStats.accuracy * 100)
                  : '-'
              }
              suffix={todayStats.answered > 0 ? '%' : ''}
              valueStyle={{
                color:
                  todayStats.accuracy >= 0.7
                    ? '#52c41a'
                    : todayStats.accuracy >= 0.4
                      ? '#faad14'
                      : '#ff4d4f',
              }}
              prefix={
                todayStats.answered > 0 ? <CheckCircleOutlined /> : undefined
              }
            />
          </Col>
          <Col xs={8}>
            <Statistic
              title="総回答 / 全問"
              value={totalAnswered}
              suffix={`/ ${totalQuestions}`}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>
      </Card>

      {/* === 今日のおすすめ問題 === */}
      <Card>
        <Title level={4}>
          <TrophyOutlined style={{ marginRight: 8 }} />
          今日のおすすめ問題
        </Title>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {recommendedQuestions.map((q) => (
            <Card
              key={q.id}
              size="small"
              hoverable
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/practice/${q.id}`)}
            >
              <Row justify="space-between" align="middle">
                <Col flex="1">
                  <Space size={[4, 4]} wrap>
                    <Tag color="blue">{q.subject}</Tag>
                    <Tag>{`第${q.year}回`}</Tag>
                    <Tag color="default">{q.category}</Tag>
                  </Space>
                  <Text
                    style={{
                      display: 'block',
                      marginTop: 4,
                      fontSize: 13,
                    }}
                    ellipsis={{ tooltip: q.question_text }}
                  >
                    {q.question_text}
                  </Text>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    size="small"
                    icon={<RightOutlined />}
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/practice/${q.id}`)
                    }}
                  >
                    解く
                  </Button>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>
      </Card>

      {/* === 最近作成した付箋 === */}
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <BookOutlined style={{ marginRight: 8 }} />
              最近の付箋
            </Title>
          </Col>
          <Col>
            <Link to="/notes">
              <Button type="link" size="small">
                すべて見る <RightOutlined />
              </Button>
            </Link>
          </Col>
        </Row>
        {recentNotes.length === 0 ? (
          <Empty
            description="まだ付箋がありません"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {recentNotes.map((note) => {
              const config = NOTE_TYPE_CONFIG[note.note_type]
              return (
                <Card
                  key={note.id}
                  size="small"
                  hoverable
                  onClick={() => navigate('/notes')}
                  style={{ cursor: 'pointer' }}
                >
                  <Space>
                    <Tag color={config.color}>{config.label}</Tag>
                    <Text strong>{note.title}</Text>
                  </Space>
                </Card>
              )
            })}
          </Space>
        )}
      </Card>

      {/* === 今週の進捗ミニグラフ === */}
      <Card>
        <Title level={4}>
          <ReadOutlined style={{ marginRight: 8 }} />
          今週の進捗
        </Title>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            height: 120,
            padding: '0 4px',
          }}
        >
          {weeklyData.labels.map((label, i) => {
            const count = weeklyData.counts[i]
            const pct =
              weeklyData.maxCount > 0
                ? Math.round((count / weeklyData.maxCount) * 100)
                : 0
            return (
              <div
                key={label + i}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Text style={{ fontSize: 11 }}>{count > 0 ? count : ''}</Text>
                <div
                  style={{
                    width: '100%',
                    maxWidth: 36,
                    background: count > 0 ? '#1890ff' : '#f0f0f0',
                    borderRadius: 4,
                    height: `${Math.max(pct, 8)}%`,
                    minHeight: 6,
                    transition: 'height 0.3s',
                  }}
                />
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {label}
                </Text>
              </div>
            )
          })}
        </div>
        <Divider style={{ margin: '12px 0 8px' }} />
        <Row justify="center">
          <Col>
            <Progress
              type="circle"
              size={64}
              percent={Math.round(
                (weeklyData.counts.reduce((a, b) => a + b, 0) /
                  Math.max(totalQuestions, 1)) *
                  100
              )}
              format={(pct) => `${pct}%`}
            />
            <Text
              type="secondary"
              style={{ display: 'block', textAlign: 'center', marginTop: 4, fontSize: 12 }}
            >
              今週の消化率
            </Text>
          </Col>
        </Row>
      </Card>
    </Space>
  )
}
