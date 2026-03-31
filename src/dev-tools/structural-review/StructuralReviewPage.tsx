// src/dev-tools/structural-review/StructuralReviewPage.tsx
// 構造式カード 薬剤師レビューUI

import { useState, useMemo, useCallback, useEffect } from 'react'
import { STRUCTURAL_FLASHCARD_TEMPLATES } from '../../data/structural-flashcard-templates'
import { COMPOUND_META } from './compound-meta'
import type { FlashCardTemplate } from '../../types/flashcard-template'
import styles from './StructuralReviewPage.module.css'

// ========== 定数 ==========

const CATEGORIES = [
  { key: 'all',                label: '全て' },
  { key: 'heterocycle',        label: '複素環' },
  { key: 'vitamin',            label: 'ビタミン' },
  { key: 'amino_acid',         label: 'アミノ酸' },
  { key: 'prodrug',            label: 'プロドラッグ' },
  { key: 'carcinogen',         label: '発がん物質' },
  { key: 'sweetener',          label: '甘味料' },
  { key: 'preservative',       label: '保存料' },
  { key: 'antioxidant',        label: '酸化防止剤' },
  { key: 'antifungal',         label: '防カビ剤' },
  { key: 'pesticide',          label: '農薬' },
  { key: 'endocrine_disruptor',label: '内分泌撹乱' },
  { key: 'antidote',           label: '解毒薬' },
  { key: 'foshu',              label: 'トクホ' },
  { key: 'pharmacology',       label: '薬理' },
]

const STORAGE_KEY = 'structural-review-v1'

// ========== 型 ==========

export type JudgmentStatus = 'ok' | 'needs-fix' | 'ng'

interface ReviewState {
  version: 1
  judgments: Record<string, JudgmentStatus>
  notes: Record<string, string>
  lastPosition: string | null
}

interface CompoundGroup {
  sourceId: string
  name_ja: string
  name_en: string
  category: string
  mediaUrl: string | null
  cards: FlashCardTemplate[]
}

// ========== ストレージ ==========

function loadState(): ReviewState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as ReviewState
      if (parsed.version === 1) return parsed
    }
  } catch {
    // ignore
  }
  return { version: 1, judgments: {}, notes: {}, lastPosition: null }
}

function saveState(state: ReviewState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

// ========== グループ化 ==========

function buildCompoundGroups(): CompoundGroup[] {
  const map = new Map<string, FlashCardTemplate[]>()
  for (const card of STRUCTURAL_FLASHCARD_TEMPLATES) {
    if (!map.has(card.source_id)) map.set(card.source_id, [])
    map.get(card.source_id)!.push(card)
  }

  const groups: CompoundGroup[] = []
  for (const [sourceId, cards] of map) {
    const meta = COMPOUND_META[sourceId]
    const mediaUrl = cards[0]?.media_url ?? null
    groups.push({
      sourceId,
      name_ja: meta?.name_ja ?? sourceId,
      name_en: meta?.name_en ?? '',
      category: meta?.category ?? 'other',
      mediaUrl,
      cards: cards.sort((a, b) => {
        const lvl = (id: string) => {
          if (id.endsWith('-L0a')) return 0
          if (id.endsWith('-L0b')) return 1
          if (id.endsWith('-L1')) return 2
          if (id.endsWith('-L2')) return 3
          if (id.endsWith('-L3')) return 4
          return 5
        }
        return lvl(a.id) - lvl(b.id)
      }),
    })
  }
  return groups
}

const ALL_GROUPS = buildCompoundGroups()

// ========== メインコンポーネント ==========

export default function StructuralReviewPage() {
  const [state, setState] = useState<ReviewState>(loadState)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // フィルタ済みグループ
  const filteredGroups = useMemo(() => {
    if (selectedCategory === 'all') return ALL_GROUPS
    return ALL_GROUPS.filter(g => g.category === selectedCategory)
  }, [selectedCategory])

  // 初期位置: lastPositionを復元
  useEffect(() => {
    const pos = state.lastPosition
    if (!pos) return
    const idx = filteredGroups.findIndex(g => g.sourceId === pos)
    if (idx >= 0) setCurrentIndex(idx)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 初回のみ

  const safeIndex = Math.min(currentIndex, Math.max(0, filteredGroups.length - 1))
  const current = filteredGroups[safeIndex] ?? null

  // 統計
  const stats = useMemo(() => {
    const ok  = filteredGroups.filter(g => state.judgments[g.sourceId] === 'ok').length
    const fix = filteredGroups.filter(g => state.judgments[g.sourceId] === 'needs-fix').length
    const ng  = filteredGroups.filter(g => state.judgments[g.sourceId] === 'ng').length
    return { ok, fix, ng, pending: filteredGroups.length - ok - fix - ng }
  }, [state.judgments, filteredGroups])

  const progressPct = filteredGroups.length === 0
    ? 0
    : ((stats.ok + stats.fix + stats.ng) / filteredGroups.length) * 100

  // 判定
  const handleJudge = useCallback((status: JudgmentStatus) => {
    if (!current) return
    setState(prev => {
      const next = {
        ...prev,
        judgments: { ...prev.judgments, [current.sourceId]: status },
        lastPosition: current.sourceId,
      }
      saveState(next)
      return next
    })
  }, [current])

  // ナビゲーション
  const navigate = useCallback((delta: number) => {
    setCurrentIndex(prev => {
      const next = Math.max(0, Math.min(filteredGroups.length - 1, prev + delta))
      const g = filteredGroups[next]
      if (g) {
        setState(s => {
          const updated = { ...s, lastPosition: g.sourceId }
          saveState(updated)
          return updated
        })
      }
      return next
    })
  }, [filteredGroups])

  const jumpToNextUnreviewed = useCallback(() => {
    const start = safeIndex + 1
    const search = (from: number, to: number) => {
      for (let i = from; i < to; i++) {
        if (!state.judgments[filteredGroups[i].sourceId]) {
          setCurrentIndex(i)
          const g = filteredGroups[i]
          setState(s => { const u = { ...s, lastPosition: g.sourceId }; saveState(u); return u })
          return true
        }
      }
      return false
    }
    if (!search(start, filteredGroups.length)) search(0, start)
  }, [safeIndex, filteredGroups, state.judgments])

  // カテゴリ切替でインデックスリセット
  const handleCategoryChange = useCallback((key: string) => {
    setSelectedCategory(key)
    setCurrentIndex(0)
  }, [])

  // キーボードナビ
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof Element &&
          e.target.closest('button, input, textarea, select, summary, [contenteditable]')) return
      switch (e.key) {
        case 'ArrowLeft':  e.preventDefault(); navigate(-1); break
        case 'ArrowRight': e.preventDefault(); navigate(1);  break
        case '1': handleJudge('ok');         break
        case '2': handleJudge('needs-fix');  break
        case '3': handleJudge('ng');         break
        case 'n': case 'N': jumpToNextUnreviewed(); break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate, handleJudge, jumpToNextUnreviewed])

  if (filteredGroups.length === 0) {
    return <div className={styles.page}><div className={styles.empty}>対象の化合物がありません</div></div>
  }

  const currentJudgment = current ? state.judgments[current.sourceId] : undefined

  return (
    <div className={styles.page}>
      {/* ===== ヘッダー ===== */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerTitle}>構造式カードレビュー</div>
        </div>
        <div className={styles.stats}>
          <span className={styles.statOk}>✅ {stats.ok}</span>
          <span className={styles.statFix}>✏️ {stats.fix}</span>
          <span className={styles.statNg}>🗑️ {stats.ng}</span>
          <span className={styles.statPending}>⏳ {stats.pending}</span>
        </div>
      </div>

      {/* ===== プログレスバー ===== */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
      </div>

      {/* ===== カテゴリフィルタ ===== */}
      <div className={styles.chipBar}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={`${styles.chip} ${selectedCategory === cat.key ? styles.chipActive : ''}`}
            onClick={() => handleCategoryChange(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ===== カウンター ===== */}
      <div className={styles.counter}>
        {safeIndex + 1} / {filteredGroups.length}
        {current && <span style={{ marginLeft: 8, color: '#555' }}>{current.category}</span>}
      </div>

      {/* ===== 判定バナー ===== */}
      {currentJudgment && (
        <div className={
          currentJudgment === 'ok'         ? `${styles.judgmentBanner} ${styles.judgmentBannerOk}` :
          currentJudgment === 'needs-fix'  ? `${styles.judgmentBanner} ${styles.judgmentBannerFix}` :
                                             `${styles.judgmentBanner} ${styles.judgmentBannerNg}`
        }>
          {currentJudgment === 'ok' ? '✅ OK' : currentJudgment === 'needs-fix' ? '✏️ 要修正' : '🗑️ NG'}
        </div>
      )}

      {/* ===== メインコンテンツ ===== */}
      {current && (
        <div className={styles.content}>
          {/* 左: SVG + 化合物名 */}
          <div>
            <div className={styles.svgArea}>
              {current.mediaUrl ? (
                <img
                  src={current.mediaUrl}
                  alt={current.name_ja}
                  className={styles.svgImage}
                />
              ) : (
                <div className={styles.svgPlaceholder}>SVGなし</div>
              )}
            </div>
            <div className={styles.compoundName}>{current.name_ja}</div>
            <div className={styles.compoundNameEn}>{current.name_en}</div>
          </div>

          {/* 右: L1/L2/L3カード */}
          <div className={styles.cardList}>
            {current.cards.map((card, i) => {
              const level = card.id.endsWith('-L0a') ? 'L0a 名前→構造' :
                            card.id.endsWith('-L0b') ? 'L0b 構造→名前' :
                            card.id.endsWith('-L1') ? 'L1 構造→物質名(詳細)' :
                            card.id.endsWith('-L2') ? 'L2 物質名→特徴' :
                            card.id.endsWith('-L3') ? 'L3 部分構造→分類' : `Card ${i + 1}`
              return (
                <div key={card.id} className={styles.cardItem}>
                  <div className={styles.cardLabel}>{level} — {card.format}</div>
                  <div className={styles.frontText}>{card.front}</div>
                  <div className={styles.backText}>{card.back}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ===== 判定ボタン ===== */}
      <div className={styles.actions}>
        <button
          className={`${styles.btnOk} ${currentJudgment === 'ok' ? styles.btnActive : ''}`}
          onClick={() => handleJudge('ok')}
        >
          1: OK
        </button>
        <button
          className={`${styles.btnFix} ${currentJudgment === 'needs-fix' ? styles.btnActive : ''}`}
          onClick={() => handleJudge('needs-fix')}
        >
          2: 要修正
        </button>
        <button
          className={`${styles.btnNg} ${currentJudgment === 'ng' ? styles.btnActive : ''}`}
          onClick={() => handleJudge('ng')}
        >
          3: NG
        </button>
      </div>

      {/* ===== ナビゲーション ===== */}
      <div className={styles.navBar}>
        <button
          className={styles.navBtn}
          onClick={() => navigate(-1)}
          disabled={safeIndex <= 0}
        >
          ← 前へ
        </button>
        <button
          className={`${styles.navBtn} ${styles.navBtnPrimary}`}
          onClick={jumpToNextUnreviewed}
        >
          n: 次の未レビュー
        </button>
        <button
          className={styles.navBtn}
          onClick={() => navigate(1)}
          disabled={safeIndex >= filteredGroups.length - 1}
        >
          次へ →
        </button>
      </div>

      <div className={styles.helpHint}>← → ナビ | 1=OK 2=要修正 3=NG | n=次の未レビュー</div>
    </div>
  )
}
