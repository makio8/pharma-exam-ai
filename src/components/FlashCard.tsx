// 暗記カード表示コンポーネント（表裏切替 + 復習ボタン）
import { useState } from 'react'
import { Button, Space, Tag, Typography } from 'antd'
import type { FlashCard as FlashCardType, ReviewResult } from '../types/flashcard'
import { CARD_FORMAT_CONFIG } from '../types/flashcard'

const { Text, Paragraph } = Typography

interface FlashCardProps {
  card: FlashCardType
  onReview: (id: string, result: ReviewResult) => void
}

const REVIEW_BUTTONS: { result: ReviewResult; label: string; color: string }[] = [
  { result: 'again', label: 'もう一回', color: '#f5222d' },
  { result: 'hard', label: '難しい', color: '#fa8c16' },
  { result: 'good', label: 'OK', color: '#52c41a' },
  { result: 'easy', label: '簡単', color: '#1890ff' },
]

export function FlashCard({ card, onReview }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false)
  const formatConfig = CARD_FORMAT_CONFIG[card.format]

  return (
    <div style={{ perspective: 1000, marginBottom: 16 }}>
      {/* フォーマット表示 */}
      <div style={{ marginBottom: 8, textAlign: 'center' }}>
        <Tag>
          {formatConfig.emoji} {formatConfig.label}
        </Tag>
        <Text type="secondary" style={{ fontSize: 12 }}>
          復習 {card.review_count}回 / 連続正答 {card.correct_streak}回
        </Text>
      </div>

      {/* カード本体（クリックで裏返す） */}
      <div
        onClick={() => setFlipped(!flipped)}
        style={{
          cursor: 'pointer',
          position: 'relative',
          width: '100%',
          minHeight: 200,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* 表面 */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            minHeight: 200,
            backfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: '#fafafa',
            borderRadius: 12,
            border: '1px solid #d9d9d9',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Text type="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
            {formatConfig.frontLabel}
          </Text>
          <Paragraph
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {card.front}
          </Paragraph>
          <Text type="secondary" style={{ fontSize: 11, marginTop: 16 }}>
            タップして裏面を見る
          </Text>
        </div>

        {/* 裏面 */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            minHeight: 200,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: '#e6f7ff',
            borderRadius: 12,
            border: '1px solid #91d5ff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Text type="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
            {formatConfig.backLabel}
          </Text>
          <Paragraph
            style={{
              fontSize: 16,
              textAlign: 'center',
              marginBottom: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {card.back}
          </Paragraph>
        </div>
      </div>

      {/* 復習ボタン（裏面表示中のみ） */}
      {flipped && (
        <Space
          style={{
            width: '100%',
            justifyContent: 'center',
            marginTop: 16,
            display: 'flex',
          }}
        >
          {REVIEW_BUTTONS.map((btn) => (
            <Button
              key={btn.result}
              style={{ borderColor: btn.color, color: btn.color }}
              onClick={(e) => {
                e.stopPropagation()
                setFlipped(false)
                onReview(card.id, btn.result)
              }}
            >
              {btn.label}
            </Button>
          ))}
        </Space>
      )}
    </div>
  )
}
