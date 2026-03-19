// 今日のメニュー提案コンポーネント
// 優先度順に3つの学習メニューを提示する「コーチ型」ナビゲーション

import { Typography, Space } from 'antd'
import {
  WarningOutlined,
  SyncOutlined,
  TrophyOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { QuestionSubject } from '../types/question'

const { Text } = Typography

export interface TodayMenuProps {
  /** 最も苦手なトピック（正答率が最低 or 未着手優先） */
  weakestTopic?: {
    topicId: string
    subject: QuestionSubject
    middleCategory: string
    correctRate: number
  }
  /** 復習期限のカード数 */
  dueCardsCount: number
  /** マスターに最も近いトピック（almost ステータス） */
  almostMasteredTopic?: {
    topicId: string
    subject: QuestionSubject
    middleCategory: string
    correctRate: number
  }
  /** 昨日の不正解数 */
  yesterdayMistakeCount: number
}

/** メニュー項目1つ分のスタイル付きカード */
function MenuItem({
  color,
  badge,
  icon,
  title,
  subtitle,
  onClick,
}: {
  color: string
  badge: string
  icon: React.ReactNode
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderLeft: `4px solid ${color}`,
        borderRadius: 8,
        background: '#fafafa',
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#f0f0f0'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#fafafa'
      }}
    >
      <div style={{ fontSize: 24, color, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#fff',
              background: color,
              borderRadius: 4,
              padding: '1px 6px',
            }}
          >
            {badge}
          </span>
          <Text strong style={{ fontSize: 14 }} ellipsis>
            {title}
          </Text>
        </div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {subtitle}
        </Text>
      </div>
      <div style={{ color: '#bfbfbf', fontSize: 16, flexShrink: 0 }}>›</div>
    </div>
  )
}

export function TodayMenu({
  weakestTopic,
  dueCardsCount,
  almostMasteredTopic,
  yesterdayMistakeCount,
}: TodayMenuProps) {
  const navigate = useNavigate()

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      {/* 1. 優先: 苦手トピック */}
      {weakestTopic && (
        <MenuItem
          color="#ff4d4f"
          badge="優先"
          icon={<WarningOutlined />}
          title={`${weakestTopic.subject}「${weakestTopic.middleCategory}」`}
          subtitle={
            weakestTopic.correctRate > 0
              ? `正答率 ${Math.round(weakestTopic.correctRate * 100)}% → まずはここから！`
              : 'まだ未着手。最初の一歩を踏み出そう！'
          }
          onClick={() =>
            navigate(`/practice?subject=${encodeURIComponent(weakestTopic.subject)}`)
          }
        />
      )}

      {/* 2. 復習: カード or 昨日の間違い */}
      {(dueCardsCount > 0 || yesterdayMistakeCount > 0) && (
        <MenuItem
          color="#faad14"
          badge="復習"
          icon={<SyncOutlined />}
          title={
            dueCardsCount > 0
              ? `復習カード ${dueCardsCount}枚`
              : `昨日の間違い ${yesterdayMistakeCount}問`
          }
          subtitle={
            dueCardsCount > 0
              ? '忘れる前に復習すると定着率UP！'
              : '間違えた問題をもう一度解いてみよう'
          }
          onClick={() =>
            dueCardsCount > 0 ? navigate('/cards') : navigate('/practice')
          }
        />
      )}

      {/* 3. チャレンジ: もう少しでマスター */}
      {almostMasteredTopic && (
        <MenuItem
          color="#722ed1"
          badge="チャレンジ"
          icon={<TrophyOutlined />}
          title={`${almostMasteredTopic.subject}「${almostMasteredTopic.middleCategory}」`}
          subtitle={`正答率 ${Math.round(almostMasteredTopic.correctRate * 100)}% — あと少しでマスター！`}
          onClick={() =>
            navigate(
              `/practice?subject=${encodeURIComponent(almostMasteredTopic.subject)}`
            )
          }
        />
      )}

      {/* 全部なかった場合のフォールバック */}
      {!weakestTopic && dueCardsCount === 0 && yesterdayMistakeCount === 0 && !almostMasteredTopic && (
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#8c8c8c' }}>
          <Text type="secondary">問題を解くとメニューが表示されます</Text>
        </div>
      )}
    </Space>
  )
}
