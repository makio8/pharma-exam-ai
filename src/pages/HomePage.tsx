// ホーム画面 — コーチ型ダッシュボード
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Progress,
  Button,
  Space,
  Divider,
} from 'antd'
import {
  FireOutlined,
  RocketOutlined,
  RightOutlined,
  EditOutlined,
  PushpinOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAnalytics } from '../hooks/useAnalytics'
import { useTopicMastery } from '../hooks/useTopicMastery'
import { useFlashCards } from '../hooks/useFlashCards'
import { TopicMasteryBar } from '../components/TopicMasteryBar'
import { TodayMenu } from '../components/TodayMenu'
import type { QuestionSubject } from '../types/question'

const { Title, Text } = Typography

/** 全科目リスト（表示順） */
const ALL_SUBJECTS: QuestionSubject[] = [
  '物理', '化学', '生物', '衛生', '薬理', '薬剤',
  '病態・薬物治療', '法規・制度・倫理', '実務',
]

export function HomePage() {
  const navigate = useNavigate()
  const {
    totalAnswered,
    isEmpty,
    streakDays,
    yesterdayMistakeCount,
  } = useAnalytics()
  const {
    allTopics,
    masteredCount,
    totalTopics,
    getSubjectSummary,
  } = useTopicMastery()
  const { dueCards } = useFlashCards()

  // --- マスター率の算出 ---
  const masteredPct = totalTopics > 0 ? Math.round((masteredCount / totalTopics) * 100) : 0
  const learningCount = allTopics.filter((t) => t.status === 'learning' || t.status === 'almost').length
  const notStartedCount = allTopics.filter((t) => t.status === 'not_started').length
  const learningPct = totalTopics > 0 ? Math.round((learningCount / totalTopics) * 100) : 0
  const notStartedPct = totalTopics > 0 ? Math.round((notStartedCount / totalTopics) * 100) : 0

  // --- TodayMenu 用データ ---
  // 苦手トピック: not_started 優先 → 次に correctRate が最低
  const weakestTopic = (() => {
    const notStarted = allTopics.filter((t) => t.status === 'not_started' && t.totalQuestions > 0)
    if (notStarted.length > 0) {
      const t = notStarted[0]
      return { topicId: t.topicId, subject: t.subject, middleCategory: t.middleCategory, correctRate: t.correctRate }
    }
    const learning = allTopics
      .filter((t) => t.status === 'learning')
      .sort((a, b) => a.correctRate - b.correctRate)
    if (learning.length > 0) {
      const t = learning[0]
      return { topicId: t.topicId, subject: t.subject, middleCategory: t.middleCategory, correctRate: t.correctRate }
    }
    return undefined
  })()

  // almost（もう少しでマスター）
  const almostMasteredTopic = (() => {
    const almost = allTopics
      .filter((t) => t.status === 'almost')
      .sort((a, b) => b.correctRate - a.correctRate) // 正答率高い方が近い
    if (almost.length > 0) {
      const t = almost[0]
      return { topicId: t.topicId, subject: t.subject, middleCategory: t.middleCategory, correctRate: t.correctRate }
    }
    return undefined
  })()

  // --- 初回起動：ウェルカム画面 ---
  if (isEmpty) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 16px' }}>
        <Title level={2}>ようこそ！国試ノートへ</Title>
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
      {/* === 1. ヘッダー: アプリ名 + 連続日数 === */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>国試ノート</Title>
        {streakDays > 0 && (
          <Text strong style={{ fontSize: 16, color: '#fa8c16' }}>
            <FireOutlined /> {streakDays}日連続
          </Text>
        )}
      </div>

      {/* === 2. メインKPI: 単元マスター数 === */}
      <Card>
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>単元マスター</Text>
          <div style={{ fontSize: 32, fontWeight: 700, margin: '4px 0' }}>
            <span style={{ color: '#52c41a' }}>{masteredCount}</span>
            <span style={{ fontSize: 18, color: '#8c8c8c' }}> / {totalTopics} 単元</span>
          </div>
          <Progress
            percent={masteredPct + learningPct}
            success={{ percent: masteredPct, strokeColor: '#52c41a' }}
            strokeColor="#faad14"
            trailColor="#f0f0f0"
            showInfo={false}
            style={{ marginBottom: 8 }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            マスター済み {masteredPct}%{'  '}・{'  '}学習中 {learningPct}%{'  '}・{'  '}未着手 {notStartedPct}%
          </Text>
        </div>
      </Card>

      {/* === 3. サブ統計 3列 === */}
      <Row gutter={12}>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="解いた問題"
              value={totalAnswered}
              suffix="問"
              valueStyle={{ fontSize: 20, color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="復習カード"
              value={dueCards.length}
              suffix="枚"
              valueStyle={{
                fontSize: 20,
                color: dueCards.length > 0 ? '#faad14' : '#52c41a',
              }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title="連続学習"
              value={streakDays}
              suffix="日"
              valueStyle={{ fontSize: 20, color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* === 4. 科目別マスターバー === */}
      <Card
        title="科目別マスター進捗"
        extra={
          <Button type="link" size="small" onClick={() => navigate('/analysis')}>
            詳細 <RightOutlined />
          </Button>
        }
      >
        {ALL_SUBJECTS.map((subject) => {
          const summary = getSubjectSummary(subject)
          return (
            <TopicMasteryBar
              key={subject}
              subject={subject}
              summary={{
                mastered: summary.mastered,
                learning: summary.learning + summary.almost,
                notStarted: summary.notStarted,
                total: summary.total,
              }}
              onClick={() => navigate('/analysis')}
            />
          )
        })}
      </Card>

      {/* === 5. 今日のメニュー === */}
      <Divider style={{ margin: '4px 0' }}>🎯 今日のメニュー</Divider>
      <TodayMenu
        weakestTopic={weakestTopic}
        dueCardsCount={dueCards.length}
        almostMasteredTopic={almostMasteredTopic}
        yesterdayMistakeCount={yesterdayMistakeCount}
      />

      {/* === 6. クイックアクセス 3ボタン === */}
      <Row gutter={12}>
        <Col span={8}>
          <Button
            block
            size="large"
            icon={<EditOutlined />}
            onClick={() => navigate('/practice')}
            style={{ height: 56, fontSize: 13 }}
          >
            自分で選ぶ
          </Button>
        </Col>
        <Col span={8}>
          <Button
            block
            size="large"
            icon={<PushpinOutlined />}
            onClick={() => navigate('/notes')}
            style={{ height: 56, fontSize: 13 }}
          >
            付箋
          </Button>
        </Col>
        <Col span={8}>
          <Button
            block
            size="large"
            icon={<ThunderboltOutlined />}
            onClick={() => navigate('/practice?random=10')}
            style={{ height: 56, fontSize: 13 }}
          >
            ランダム10
          </Button>
        </Col>
      </Row>
    </Space>
  )
}
