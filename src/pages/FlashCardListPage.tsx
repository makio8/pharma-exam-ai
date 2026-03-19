// 暗記カードデッキ一覧画面 — 科目別にカードを表示
import { useMemo } from 'react'
import { Badge, Button, Card, Collapse, Empty, List, Popconfirm, Tag, Typography } from 'antd'
import { DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useFlashCards } from '../hooks/useFlashCards'
import { CARD_FORMAT_CONFIG } from '../types/flashcard'
import type { FlashCard } from '../types/flashcard'
import type { QuestionSubject } from '../types/question'

const { Title, Text } = Typography

export function FlashCardListPage() {
  const navigate = useNavigate()
  const { cards, loading, dueCards, deleteCard } = useFlashCards()

  // 科目別にグループ化
  const groupedCards = useMemo(() => {
    const groups: Record<string, FlashCard[]> = {}
    for (const card of cards) {
      const key = card.subject
      if (!groups[key]) groups[key] = []
      groups[key].push(card)
    }
    return groups
  }, [cards])

  const subjects = Object.keys(groupedCards) as QuestionSubject[]

  /** 次回復習日の表示 */
  const formatNextReview = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / 86400000)
    if (diffDays <= 0) return '今日'
    if (diffDays === 1) return '明日'
    return `${diffDays}日後`
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>読み込み中...</div>
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 8px' }}>
      <Title level={3}>暗記カード</Title>

      {/* 今日の復習ボタン */}
      <Card style={{ marginBottom: 24, textAlign: 'center' }}>
        <Badge count={dueCards.length} offset={[10, 0]}>
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            disabled={dueCards.length === 0}
            onClick={() => navigate('/cards/review')}
          >
            今日の復習を始める
          </Button>
        </Badge>
        <div style={{ marginTop: 8 }}>
          <Text type="secondary">
            全{cards.length}枚 / 今日の復習: {dueCards.length}枚
          </Text>
        </div>
      </Card>

      {/* カード一覧 */}
      {subjects.length === 0 ? (
        <Empty description="カードがまだありません。問題を解いてカードを作りましょう！" />
      ) : (
        <Collapse
          defaultActiveKey={subjects}
          items={subjects.map((subject) => ({
            key: subject,
            label: (
              <span>
                {subject}
                <Tag style={{ marginLeft: 8 }}>{groupedCards[subject].length}枚</Tag>
              </span>
            ),
            children: (
              <List
                dataSource={groupedCards[subject]}
                renderItem={(card) => {
                  const formatConfig = CARD_FORMAT_CONFIG[card.format]
                  return (
                    <List.Item
                      actions={[
                        <Popconfirm
                          key="delete"
                          title="このカードを削除しますか？"
                          onConfirm={() => deleteCard(card.id)}
                          okText="削除"
                          cancelText="キャンセル"
                        >
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                          />
                        </Popconfirm>,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <span>
                            <span style={{ marginRight: 8 }}>{formatConfig.emoji}</span>
                            {card.front}
                          </span>
                        }
                        description={
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            次回: {formatNextReview(card.next_review_at)} / 復習{card.review_count}回
                          </Text>
                        }
                      />
                    </List.Item>
                  )
                }}
              />
            ),
          }))}
        />
      )}
    </div>
  )
}
