// src/components/flashcard/TemplatePractice.tsx
// テンプレートベースのカード練習UI（PracticeContext 対応）

import { useMemo, useState } from 'react'
import { Button, Progress, Result, Space, Typography } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { FlashCardPracticeContext, ReviewResult } from '../../types/card-progress'
import type { FlashCardTemplate } from '../../types/flashcard-template'
import { CARD_FORMAT_CONFIG } from '../../types/flashcard-template'
import { useFlashCardTemplates } from '../../hooks/useFlashCardTemplates'
import { useCardProgress } from '../../hooks/useCardProgress'

const { Title, Text, Paragraph } = Typography

const REVIEW_BUTTONS: { result: ReviewResult; label: string; color: string }[] = [
  { result: 'again', label: 'もう一回', color: '#f5222d' },
  { result: 'hard', label: '難しい', color: '#fa8c16' },
  { result: 'good', label: 'OK', color: '#52c41a' },
  { result: 'easy', label: '簡単', color: '#1890ff' },
]

interface Props {
  context: FlashCardPracticeContext
}

export function TemplatePractice({ context }: Props) {
  const navigate = useNavigate()
  const { templates } = useFlashCardTemplates()
  const { reviewCard } = useCardProgress()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)

  const practiceCards = useMemo(
    () =>
      context.cardIds
        .map((id) => templates.find((t) => t.id === id))
        .filter((t): t is FlashCardTemplate => t !== undefined),
    [context.cardIds, templates],
  )

  const handleReview = async (result: ReviewResult) => {
    const card = practiceCards[currentIndex]
    await reviewCard(card.id, result)
    setFlipped(false)
    setReviewedCount((prev) => prev + 1)
    setCurrentIndex((prev) => prev + 1)
  }

  const totalCount = practiceCards.length

  // 完了画面
  if (totalCount === 0 || currentIndex >= totalCount) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 8px' }}>
        <Result
          status="success"
          title="練習完了！"
          subTitle={
            reviewedCount > 0
              ? `${reviewedCount}枚のカードを練習しました`
              : '練習するカードはありません'
          }
          extra={
            <Button type="primary" onClick={() => navigate(context.returnTo)}>
              戻る
            </Button>
          }
        />
      </div>
    )
  }

  const card = practiceCards[currentIndex]
  const formatConfig = CARD_FORMAT_CONFIG[card.format]

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 8px' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          type="text"
          onClick={() => navigate(context.returnTo)}
        />
        <Title level={4} style={{ margin: 0, flex: 1, textAlign: 'center' }}>
          練習
        </Title>
        <div style={{ width: 32 }} />
      </div>

      {/* 進捗 */}
      <div style={{ marginBottom: 16, textAlign: 'center' }}>
        <Text type="secondary">
          {currentIndex + 1} / {totalCount} カード
        </Text>
        <Progress
          percent={Math.round((currentIndex / totalCount) * 100)}
          showInfo={false}
          size="small"
          style={{ marginTop: 4 }}
        />
      </div>

      {/* フォーマットラベル */}
      <div style={{ marginBottom: 8, textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {formatConfig.emoji} {formatConfig.label}
        </Text>
      </div>

      {/* カード本体 */}
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

      {/* 復習ボタン */}
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
                handleReview(btn.result)
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
