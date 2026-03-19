// 暗記カード復習画面 — 復習日のカードを1枚ずつ表示
import { useState } from 'react'
import { Button, Progress, Result, Typography } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useFlashCards } from '../hooks/useFlashCards'
import { FlashCard } from '../components/FlashCard'
import type { ReviewResult } from '../types/flashcard'

const { Title, Text } = Typography

export function FlashCardPage() {
  const navigate = useNavigate()
  const { dueCards, reviewCard } = useFlashCards()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [reviewedCount, setReviewedCount] = useState(0)
  const totalCount = dueCards.length

  const handleReview = (id: string, result: ReviewResult) => {
    reviewCard(id, result)
    setReviewedCount((prev) => prev + 1)
    // 次のカードへ（dueCardsは復習するとnext_review_atが更新されるので自動的に減る）
    setCurrentIndex((prev) => prev + 1)
  }

  // 全カード復習完了
  if (totalCount === 0 || currentIndex >= totalCount) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 8px' }}>
        <Result
          status="success"
          title="今日の復習完了！"
          subTitle={
            reviewedCount > 0
              ? `${reviewedCount}枚のカードを復習しました`
              : '復習するカードはありません'
          }
          extra={
            <Button type="primary" onClick={() => navigate('/cards')}>
              カード一覧に戻る
            </Button>
          }
        />
      </div>
    )
  }

  const currentCard = dueCards[currentIndex]

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 8px' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          type="text"
          onClick={() => navigate('/cards')}
        />
        <Title level={4} style={{ margin: 0, flex: 1, textAlign: 'center' }}>
          復習
        </Title>
        <div style={{ width: 32 }} /> {/* スペーサー */}
      </div>

      {/* 進捗 */}
      <div style={{ marginBottom: 16, textAlign: 'center' }}>
        <Text type="secondary">
          {currentIndex + 1} / {totalCount} カード
        </Text>
        <Progress
          percent={Math.round(((currentIndex) / totalCount) * 100)}
          showInfo={false}
          size="small"
          style={{ marginTop: 4 }}
        />
      </div>

      {/* カード */}
      <FlashCard card={currentCard} onReview={handleReview} />
    </div>
  )
}
