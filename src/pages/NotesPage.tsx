// 付箋一覧ページ — Agent B 実装
import { useMemo, useState } from 'react'
import {
  Card,
  Col,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Tabs,
  Typography,
  Button,
  message,
} from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { NoteType, NoteVisibility, StickyNote } from '../types/note.ts'
import { NOTE_TYPE_CONFIG } from '../types/note.ts'
import { ALL_QUESTIONS } from '../data/all-questions'
import { useStickyNotes } from '../hooks/useStickyNotes.ts'
import { StickyNoteCard } from '../components/common/StickyNoteCard.tsx'
import { StickyNoteDetail } from '../components/common/StickyNoteDetail.tsx'

const { Title } = Typography

// ---------- フィルター / ソート 型 ----------

type SortKey = 'created_at' | 'tags' | 'note_type'

interface Filters {
  noteType: NoteType[]
  tags: string[]
  visibility: NoteVisibility[]
  keyword: string
  sort: SortKey
}

const INITIAL_FILTERS: Filters = {
  noteType: [],
  tags: [],
  visibility: [],
  keyword: '',
  sort: 'created_at',
}

// ---------- ヘルパー ----------

/** question_id から「第◯◯回 問◯」形式のタイトルを生成 */
function questionTitle(questionId: string): string | undefined {
  const q = ALL_QUESTIONS.find(d => d.id === questionId)
  if (!q) return undefined
  return `第${q.year}回 問${q.question_number}`
}

/** 全付箋からユニークなタグ一覧を取得 */
function collectTags(notes: StickyNote[]): string[] {
  const set = new Set<string>()
  for (const n of notes) {
    for (const t of n.tags) set.add(t)
  }
  return [...set].sort()
}

// ---------- コンポーネント ----------

export function NotesPage() {
  const { notes } = useStickyNotes()
  const navigate = useNavigate()

  // タブ: 「自分の付箋」「保存済み」
  const [activeTab, setActiveTab] = useState<'mine' | 'saved'>('mine')

  // フィルター
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS)

  // 詳細モーダル
  const [selectedNote, setSelectedNote] = useState<StickyNote | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // ---- 全タグ一覧（Select のオプション用）----
  const allTags = useMemo(() => collectTags(notes), [notes])

  // ---- フィルタリング & ソート ----
  const filtered = useMemo(() => {
    // MVP: 「保存済み」タブは空（Supabase 未接続）
    if (activeTab === 'saved') return []

    let result = [...notes]

    // 種別フィルター
    if (filters.noteType.length > 0) {
      result = result.filter(n => filters.noteType.includes(n.note_type))
    }
    // タグフィルター（OR）
    if (filters.tags.length > 0) {
      result = result.filter(n => n.tags.some(t => filters.tags.includes(t)))
    }
    // 公開範囲
    if (filters.visibility.length > 0) {
      result = result.filter(n => filters.visibility.includes(n.visibility))
    }
    // キーワード
    if (filters.keyword.trim()) {
      const kw = filters.keyword.trim().toLowerCase()
      result = result.filter(
        n =>
          n.title.toLowerCase().includes(kw) ||
          n.body.toLowerCase().includes(kw) ||
          n.tags.some(t => t.toLowerCase().includes(kw)),
      )
    }

    // ソート
    switch (filters.sort) {
      case 'created_at':
        result.sort((a, b) => b.created_at.localeCompare(a.created_at))
        break
      case 'tags':
        result.sort((a, b) => (a.tags[0] ?? '').localeCompare(b.tags[0] ?? ''))
        break
      case 'note_type':
        result.sort((a, b) => a.note_type.localeCompare(b.note_type))
        break
    }

    return result
  }, [notes, filters, activeTab])

  // ---- ハンドラー ----
  function openDetail(note: StickyNote) {
    setSelectedNote(note)
    setDetailOpen(true)
  }

  function goToQuestion(questionId: string) {
    navigate(`/practice/${questionId}`)
  }

  function handleCreateClick() {
    void message.info('付箋は問題の演習画面から作成できます。まず演習を始めましょう！')
    navigate('/practice')
  }

  // ---------- UI ----------
  return (
    <>
      <Title level={3}>付箋ノート</Title>

      {/* タブ切り替え */}
      <Tabs
        activeKey={activeTab}
        onChange={key => setActiveTab(key as 'mine' | 'saved')}
        items={[
          { key: 'mine', label: `自分の付箋（${notes.length}）` },
          { key: 'saved', label: '保存済み付箋' },
        ]}
        style={{ marginBottom: 16 }}
      />

      {/* フィルターバー */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap size={[8, 8]}>
          <Input
            placeholder="キーワード検索"
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 200 }}
            value={filters.keyword}
            onChange={e => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
          />

          <Select
            mode="multiple"
            allowClear
            placeholder="種別"
            style={{ minWidth: 140 }}
            value={filters.noteType}
            onChange={v => setFilters(prev => ({ ...prev, noteType: v }))}
            options={Object.entries(NOTE_TYPE_CONFIG).map(([key, cfg]) => ({
              label: `${cfg.emoji} ${cfg.label}`,
              value: key,
            }))}
          />

          <Select
            mode="multiple"
            allowClear
            placeholder="タグ"
            style={{ minWidth: 140 }}
            value={filters.tags}
            onChange={v => setFilters(prev => ({ ...prev, tags: v }))}
            options={allTags.map(t => ({ label: t, value: t }))}
          />

          <Select
            mode="multiple"
            allowClear
            placeholder="公開範囲"
            style={{ minWidth: 130 }}
            value={filters.visibility}
            onChange={v => setFilters(prev => ({ ...prev, visibility: v }))}
            options={[
              { label: '自分だけ', value: 'private' },
              { label: '限定公開', value: 'limited' },
              { label: '全体公開', value: 'public' },
            ]}
          />

          <Select
            value={filters.sort}
            onChange={v => setFilters(prev => ({ ...prev, sort: v }))}
            style={{ width: 130 }}
            options={[
              { label: '作成日時順', value: 'created_at' },
              { label: 'タグ順', value: 'tags' },
              { label: '種別順', value: 'note_type' },
            ]}
          />
        </Space>
      </Card>

      {/* 新規作成ボタン */}
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button icon={<PlusOutlined />} onClick={handleCreateClick}>
          新しい付箋を作成
        </Button>
      </div>

      {/* 付箋一覧 or 空状態 */}
      {filtered.length === 0 ? (
        <Empty
          description={
            activeTab === 'saved'
              ? '保存済み付箋はまだありません（Supabase連携後に利用可能）'
              : notes.length === 0
                ? 'まず問題を解いて付箋を作ってみましょう！'
                : '条件に一致する付箋がありません'
          }
          style={{ marginTop: 48 }}
        >
          {notes.length === 0 && (
            <Button type="primary" onClick={() => navigate('/practice')}>
              演習を始める
            </Button>
          )}
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {filtered.map(note => (
            <Col key={note.id} xs={24} sm={12}>
              <StickyNoteCard
                note={note}
                questionTitle={questionTitle(note.question_id)}
                onDetail={() => openDetail(note)}
                onGoToQuestion={() => goToQuestion(note.question_id)}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* 詳細モーダル */}
      <StickyNoteDetail
        note={selectedNote}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onGoToQuestion={
          selectedNote
            ? () => goToQuestion(selectedNote.question_id)
            : undefined
        }
      />
    </>
  )
}
