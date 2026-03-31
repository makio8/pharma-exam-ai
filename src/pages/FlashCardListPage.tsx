// 暗記カードデッキ一覧画面 — テンプレートカード（公式）+ ユーザー作成カード
import { useMemo, useState } from 'react'
import { Badge, Button, Card, Collapse, Empty, List, Popconfirm, Tag, Typography } from 'antd'
import { DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useFlashCards } from '../hooks/useFlashCards'
import { useFlashCardTemplates } from '../hooks/useFlashCardTemplates'
import { useCardProgress } from '../hooks/useCardProgress'
import { CARD_FORMAT_CONFIG } from '../types/flashcard'
import { CARD_FORMAT_CONFIG as TEMPLATE_FORMAT_CONFIG } from '../types/flashcard-template'
import type { FlashCard } from '../types/flashcard'
import type { FlashCardTemplate } from '../types/flashcard-template'
import type { FlashCardPracticeContext } from '../types/card-progress'
import type { QuestionSubject } from '../types/question'

const { Title, Text } = Typography

/** テンプレートカードのカテゴリ定義 */
const TEMPLATE_CATEGORIES = [
  { key: 'structural', label: '構造式', emoji: '🔬', filter: (t: FlashCardTemplate) => t.source_type === 'structure_db' },
  { key: 'text', label: 'テキスト', emoji: '📖', filter: (t: FlashCardTemplate) => t.source_type !== 'structure_db' },
] as const

/** 構造式カードのサブカテゴリ */
const STRUCTURE_SUBCATEGORIES = [
  { key: 'all', label: '全て' },
  { key: 'L0', label: '基礎（名前↔構造）', filter: (t: FlashCardTemplate) => t.id.endsWith('-L0a') || t.id.endsWith('-L0b') },
  { key: 'L1-L3', label: '応用（特徴・分類）', filter: (t: FlashCardTemplate) => t.id.endsWith('-L1') || t.id.endsWith('-L2') || t.id.endsWith('-L3') },
] as const

export function FlashCardListPage() {
  const navigate = useNavigate()
  const { cards, loading, dueCards, deleteCard } = useFlashCards()
  const { templates } = useFlashCardTemplates()
  const { dueProgress } = useCardProgress()
  const [structureFilter, setStructureFilter] = useState('all')

  // テンプレートカード: 科目別グループ
  const templateGroups = useMemo(() => {
    const structuralTemplates = templates.filter(t => t.source_type === 'structure_db')

    // サブカテゴリフィルタ適用
    const filtered = structureFilter === 'all'
      ? structuralTemplates
      : STRUCTURE_SUBCATEGORIES.find(c => c.key === structureFilter)?.filter
        ? structuralTemplates.filter(STRUCTURE_SUBCATEGORIES.find(c => c.key === structureFilter)!.filter!)
        : structuralTemplates

    // source_id でグループ化（同じ化合物のカードをまとめる）
    const bySource = new Map<string, FlashCardTemplate[]>()
    for (const t of filtered) {
      if (!bySource.has(t.source_id)) bySource.set(t.source_id, [])
      bySource.get(t.source_id)!.push(t)
    }

    // 科目別
    const groups: Record<string, { sourceId: string; name: string; cards: FlashCardTemplate[]; mediaUrl?: string }[]> = {}
    for (const [sourceId, cards] of bySource) {
      const subject = cards[0].subject
      if (!groups[subject]) groups[subject] = []
      const l0b = cards.find(c => c.id.endsWith('-L0b'))
      const name = l0b ? l0b.back.split('（')[0].split('。')[0] : sourceId.replace('struct-', '')
      groups[subject].push({ sourceId, name, cards, mediaUrl: cards[0].media_url })
    }
    return groups
  }, [templates, structureFilter])

  const templateSubjects = Object.keys(templateGroups) as QuestionSubject[]
  const totalTemplateCards = templates.filter(t => t.source_type === 'structure_db').length
  const dueTemplateCount = dueProgress.length

  // レガシーカード: 科目別グループ
  const groupedCards = useMemo(() => {
    const groups: Record<string, FlashCard[]> = {}
    for (const card of cards) {
      if (!groups[card.subject]) groups[card.subject] = []
      groups[card.subject].push(card)
    }
    return groups
  }, [cards])
  const subjects = Object.keys(groupedCards) as QuestionSubject[]

  const formatNextReview = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / 86400000)
    if (diffDays <= 0) return '今日'
    if (diffDays === 1) return '明日'
    return `${diffDays}日後`
  }

  /** 科目の構造式カードを練習開始 */
  const startStructuralPractice = (subject: QuestionSubject) => {
    const group = templateGroups[subject]
    if (!group) return
    const cardIds = group.flatMap(g => g.cards.map(c => c.id))
    const context: FlashCardPracticeContext = {
      mode: 'exemplar',
      cardIds,
      returnTo: '/cards',
    }
    navigate('/cards/review', { state: { practiceContext: context } })
  }

  /** 全構造式カードを練習開始 */
  const startAllStructuralPractice = () => {
    const cardIds = Object.values(templateGroups).flatMap(group =>
      group.flatMap(g => g.cards.map(c => c.id))
    )
    const context: FlashCardPracticeContext = {
      mode: 'exemplar',
      cardIds,
      returnTo: '/cards',
    }
    navigate('/cards/review', { state: { practiceContext: context } })
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>読み込み中...</div>
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 8px' }}>
      <Title level={3}>暗記カード</Title>

      {/* ===== 構造式カード セクション ===== */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text strong style={{ fontSize: 16 }}>🔬 構造式カード</Text>
          <Text type="secondary">{totalTemplateCards}枚</Text>
        </div>

        {/* サブカテゴリフィルタ */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {STRUCTURE_SUBCATEGORIES.map(cat => (
            <Button
              key={cat.key}
              size="small"
              type={structureFilter === cat.key ? 'primary' : 'default'}
              onClick={() => setStructureFilter(cat.key)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* 全体練習ボタン */}
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={startAllStructuralPractice}
          style={{ marginBottom: 16, width: '100%' }}
        >
          構造式カードを練習する
        </Button>

        {/* 科目別 */}
        {templateSubjects.length > 0 && (
          <Collapse
            size="small"
            items={templateSubjects.map(subject => ({
              key: subject,
              label: (
                <span>
                  {subject}
                  <Tag style={{ marginLeft: 8 }}>{templateGroups[subject].length}化合物</Tag>
                </span>
              ),
              children: (
                <div>
                  <Button
                    size="small"
                    type="link"
                    icon={<PlayCircleOutlined />}
                    onClick={() => startStructuralPractice(subject)}
                    style={{ marginBottom: 8 }}
                  >
                    {subject}の構造式を練習
                  </Button>
                  <List
                    size="small"
                    dataSource={templateGroups[subject]}
                    renderItem={(group) => (
                      <List.Item style={{ padding: '4px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                          {group.mediaUrl && (
                            <img src={group.mediaUrl} alt="" style={{ width: 40, height: 30, objectFit: 'contain' }} />
                          )}
                          <div style={{ flex: 1 }}>
                            <Text>{group.name}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 11 }}>{group.cards.length}枚</Text>
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />
                </div>
              ),
            }))}
          />
        )}
      </Card>

      {/* ===== レガシーカード セクション ===== */}
      {(cards.length > 0 || dueCards.length > 0) && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text strong style={{ fontSize: 16 }}>📝 自分のカード</Text>
            <Text type="secondary">{cards.length}枚</Text>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Badge count={dueCards.length} offset={[10, 0]}>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                disabled={dueCards.length === 0}
                onClick={() => navigate('/cards/review')}
              >
                今日の復習（{dueCards.length}枚）
              </Button>
            </Badge>
          </div>

          {subjects.length > 0 && (
            <Collapse
              size="small"
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
                    size="small"
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
                              <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                            </Popconfirm>,
                          ]}
                        >
                          <List.Item.Meta
                            title={<span>{formatConfig.emoji} {card.front}</span>}
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
        </Card>
      )}

      {cards.length === 0 && totalTemplateCards === 0 && (
        <Empty description="カードがまだありません" />
      )}
    </div>
  )
}
