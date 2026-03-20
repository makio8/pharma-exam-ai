import { Card, Tag, Typography, Space, Image } from 'antd'
import { LinkOutlined } from '@ant-design/icons'
import type { LinkedGroup } from '../hooks/useLinkedQuestions'

const { Text, Paragraph } = Typography

interface Props {
  group: LinkedGroup
  currentQuestionId: string
  onNavigate: (questionId: string) => void
}

export function LinkedQuestionViewer({ group, currentQuestionId, onNavigate }: Props) {
  const scenarioImage = group.questions.find((q) => q.image_url)?.image_url

  return (
    <Card
      size="small"
      style={{ marginBottom: 16, borderColor: '#d3adf7', background: '#f9f0ff' }}
    >
      <Space style={{ marginBottom: 8 }}>
        <LinkOutlined style={{ color: '#722ed1' }} />
        <Text strong style={{ color: '#722ed1' }}>
          連問（{group.questions.length}問セット）
        </Text>
      </Space>

      {group.scenario && (
        <Paragraph
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            marginBottom: 12,
            padding: '8px 12px',
            background: 'white',
            borderRadius: 6,
          }}
        >
          {group.scenario}
        </Paragraph>
      )}

      {scenarioImage && (
        <div style={{ marginBottom: 12, textAlign: 'center' }}>
          <Image
            src={scenarioImage}
            alt="連問の共通資料"
            style={{ maxHeight: '50vh', objectFit: 'contain' }}
            width="100%"
          />
        </div>
      )}

      <Space size={4} wrap>
        {group.questions.map((q) => (
          <Tag
            key={q.id}
            color={q.id === currentQuestionId ? 'purple' : 'default'}
            style={{
              cursor: 'pointer',
              fontWeight: q.id === currentQuestionId ? 'bold' : 'normal',
            }}
            onClick={() => onNavigate(q.id)}
          >
            問{q.question_number}（{q.subject}）
          </Tag>
        ))}
      </Space>
    </Card>
  )
}
