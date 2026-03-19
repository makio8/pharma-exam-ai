// 科目別マスター進捗バーコンポーネント
// 各科目の単元（中項目）習熟状況を色分けバーで表示する

import { Typography } from 'antd'
import type { QuestionSubject } from '../types/question'

const { Text } = Typography

export interface TopicMasteryBarProps {
  /** 科目名 */
  subject: QuestionSubject
  /** 科目の習熟サマリー */
  summary: {
    mastered: number
    learning: number
    notStarted: number
    total: number
  }
  /** クリック時のコールバック（ドリルダウン用） */
  onClick?: () => void
}

/** 進捗バーの色定義 */
const MASTERY_COLORS = {
  mastered: '#52c41a',   // 緑: マスター済み
  learning: '#faad14',   // 黄: 学習中（learning + almost）
  notStarted: '#d9d9d9', // グレー: 未着手
} as const

export function TopicMasteryBar({ subject, summary, onClick }: TopicMasteryBarProps) {
  const { mastered, learning, notStarted, total } = summary
  if (total === 0) return null

  // 各区間の幅をパーセントで計算
  const masteredPct = (mastered / total) * 100
  const learningPct = (learning / total) * 100
  // notStarted は背景色で自動表示されるため幅計算不要

  return (
    <div
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        padding: '8px 0',
      }}
    >
      {/* ラベル行: 科目名 + マスター数/全体 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text strong style={{ fontSize: 13 }}>{subject}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {mastered}/{total} 単元
        </Text>
      </div>

      {/* 進捗バー */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: 12,
          borderRadius: 6,
          overflow: 'hidden',
          backgroundColor: MASTERY_COLORS.notStarted,
        }}
      >
        {masteredPct > 0 && (
          <div
            style={{
              width: `${masteredPct}%`,
              backgroundColor: MASTERY_COLORS.mastered,
              transition: 'width 0.3s ease',
            }}
          />
        )}
        {learningPct > 0 && (
          <div
            style={{
              width: `${learningPct}%`,
              backgroundColor: MASTERY_COLORS.learning,
              transition: 'width 0.3s ease',
            }}
          />
        )}
        {/* notStarted は背景色で自動的に表示される */}
      </div>

      {/* 凡例（コンパクト） */}
      <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11, color: '#999' }}>
        {mastered > 0 && (
          <span>
            <span style={{ color: MASTERY_COLORS.mastered }}>●</span> マスター {mastered}
          </span>
        )}
        {learning > 0 && (
          <span>
            <span style={{ color: MASTERY_COLORS.learning }}>●</span> 学習中 {learning}
          </span>
        )}
        {notStarted > 0 && (
          <span>
            <span style={{ color: MASTERY_COLORS.notStarted }}>●</span> 未着手 {notStarted}
          </span>
        )}
      </div>
    </div>
  )
}
