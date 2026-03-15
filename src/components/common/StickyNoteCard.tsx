// 付箋カードコンポーネント — 一覧表示用の個別カード
import { Badge, Button, Card, Space, Tag, Typography } from 'antd'
import { EyeOutlined, LockOutlined, TeamOutlined, RightOutlined } from '@ant-design/icons'
import type { StickyNote, NoteVisibility } from '../../types/note.ts'
import { NOTE_TYPE_CONFIG } from '../../types/note.ts'

const { Text, Paragraph } = Typography

export interface StickyNoteCardProps {
  note: StickyNote
  questionTitle?: string
  onDetail?: () => void
  onGoToQuestion?: () => void
}

/** 公開範囲に応じたアイコンを返す */
function VisibilityIcon({ visibility }: { visibility: NoteVisibility }) {
  switch (visibility) {
    case 'private':
      return <LockOutlined title="自分だけ" />
    case 'limited':
      return <TeamOutlined title="限定公開" />
    case 'public':
      return <EyeOutlined title="全体公開" />
  }
}

export function StickyNoteCard({ note, questionTitle, onDetail, onGoToQuestion }: StickyNoteCardProps) {
  const config = NOTE_TYPE_CONFIG[note.note_type]

  return (
    <Badge.Ribbon text={config.label} color={config.color}>
      <Card
        hoverable
        onClick={onDetail}
        style={{ cursor: onDetail ? 'pointer' : 'default' }}
        styles={{ body: { padding: '16px 16px 12px' } }}
      >
        {/* ヘッダー: emoji + タイトル + 公開範囲 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>{config.emoji}</span>
          <Text strong ellipsis style={{ flex: 1, fontSize: 15 }}>
            {note.title}
          </Text>
          <VisibilityIcon visibility={note.visibility} />
        </div>

        {/* 本文（3行省略） */}
        <Paragraph
          type="secondary"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            margin: '0 0 8px',
            fontSize: 13,
            lineHeight: '1.6',
          }}
        >
          {note.body}
        </Paragraph>

        {/* タグ */}
        {note.tags.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            {note.tags.map(tag => (
              <Tag key={tag} style={{ marginBottom: 4 }}>{tag}</Tag>
            ))}
          </div>
        )}

        {/* フッター: 紐づく問題 */}
        {questionTitle && (
          <Space size={4}>
            <Button
              type="link"
              size="small"
              onClick={e => {
                e.stopPropagation()
                onGoToQuestion?.()
              }}
              style={{ padding: 0, fontSize: 12 }}
            >
              {questionTitle} <RightOutlined />
            </Button>
          </Space>
        )}
      </Card>
    </Badge.Ribbon>
  )
}
