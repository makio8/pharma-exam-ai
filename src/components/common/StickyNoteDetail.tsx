// 付箋詳細モーダル（Drawer を使用）
import { Button, Descriptions, Drawer, Space, Tag, Typography } from 'antd'
import { EyeOutlined, LockOutlined, TeamOutlined, PlayCircleOutlined } from '@ant-design/icons'
import type { StickyNote, NoteVisibility } from '../../types/note.ts'
import { NOTE_TYPE_CONFIG } from '../../types/note.ts'

const { Title, Paragraph } = Typography

export interface StickyNoteDetailProps {
  note: StickyNote | null
  open: boolean
  onClose: () => void
  onGoToQuestion?: () => void
}

const VISIBILITY_LABEL: Record<NoteVisibility, { icon: React.ReactNode; text: string }> = {
  private: { icon: <LockOutlined />, text: '自分だけ' },
  limited: { icon: <TeamOutlined />, text: '限定公開' },
  public: { icon: <EyeOutlined />, text: '全体公開' },
}

export function StickyNoteDetail({ note, open, onClose, onGoToQuestion }: StickyNoteDetailProps) {
  if (!note) return null

  const config = NOTE_TYPE_CONFIG[note.note_type]
  const vis = VISIBILITY_LABEL[note.visibility]

  return (
    <Drawer
      title={
        <Space>
          <span>{config.emoji}</span>
          <span>{note.title}</span>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={480}
      extra={
        onGoToQuestion && (
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={onGoToQuestion}>
            問題を解く
          </Button>
        )
      }
    >
      {/* 種別バッジ */}
      <div style={{ marginBottom: 16 }}>
        <Tag color={config.color}>{config.emoji} {config.label}</Tag>
        <Tag icon={vis.icon}>{vis.text}</Tag>
      </div>

      {/* 本文 */}
      <Title level={5}>メモ内容</Title>
      <Paragraph style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
        {note.body}
      </Paragraph>

      {/* タグ */}
      {note.tags.length > 0 && (
        <>
          <Title level={5}>タグ</Title>
          <div style={{ marginBottom: 16 }}>
            {note.tags.map(tag => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        </>
      )}

      {/* メタ情報 */}
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="作成日時">
          {new Date(note.created_at).toLocaleString('ja-JP')}
        </Descriptions.Item>
        <Descriptions.Item label="更新日時">
          {new Date(note.updated_at).toLocaleString('ja-JP')}
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
  )
}
