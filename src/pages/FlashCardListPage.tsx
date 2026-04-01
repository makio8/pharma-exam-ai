// 暗記カード一覧ページ — Soft Companion リデザイン
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUnifiedTemplates } from '../hooks/useUnifiedTemplates'
import { useCardProgress } from '../hooks/useCardProgress'
import { Chip } from '../components/ui/Chip'
import { COMPOUND_META } from '../dev-tools/structural-review/compound-meta'
import type { FlashCardPracticeContext, CardProgress } from '../types/card-progress'
import type { FlashCardTemplate } from '../types/flashcard-template'
import type { QuestionSubject } from '../types/question'
import styles from './FlashCardListPage.module.css'

// ---- 進捗3状態 ----
type ProgressBucket = 'unlearned' | 'due' | 'mastered'

function getProgressBucket(progress: CardProgress | undefined): ProgressBucket {
  if (!progress) return 'unlearned'
  if (progress.next_review_at <= new Date().toISOString()) return 'due'
  if (progress.review_count >= 3 && progress.interval_days >= 21) return 'mastered'
  return 'unlearned'
}

// ---- 進捗フィルタ ----
type ProgressFilter = 'all' | 'unlearned' | 'due' | 'mastered'
const PROGRESS_FILTERS: { key: ProgressFilter; label: string }[] = [
  { key: 'all', label: '全て' },
  { key: 'unlearned', label: '未学習' },
  { key: 'due', label: '復習待ち' },
  { key: 'mastered', label: 'マスター済み' },
]

// ---- 構造式フィルタ ----
type StructFilter = 'all' | 'basic' | 'advanced'
const STRUCT_FILTERS: { key: StructFilter; label: string }[] = [
  { key: 'all', label: '全て' },
  { key: 'basic', label: '基礎' },
  { key: 'advanced', label: '応用' },
]

function isBasicCard(t: FlashCardTemplate) {
  return t.id.endsWith('-L0a') || t.id.endsWith('-L0b')
}
function isAdvancedCard(t: FlashCardTemplate) {
  return t.id.endsWith('-L1') || t.id.endsWith('-L2') || t.id.endsWith('-L3')
}

// ---- カテゴリ表示名 ----
const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  heterocycle:        { label: '複素環母核', emoji: '⬡' },
  vitamin:            { label: 'ビタミン', emoji: '💊' },
  amino_acid:         { label: 'アミノ酸', emoji: '🧬' },
  prodrug:            { label: 'プロドラッグ', emoji: '💉' },
  carcinogen:         { label: '発がん物質', emoji: '☢️' },
  sweetener:          { label: '甘味料', emoji: '🍬' },
  preservative:       { label: '保存料', emoji: '🧴' },
  antioxidant:        { label: '酸化防止剤', emoji: '🛡️' },
  antifungal:         { label: '防カビ剤', emoji: '🍊' },
  pesticide:          { label: '農薬', emoji: '🌾' },
  endocrine_disruptor:{ label: '内分泌撹乱', emoji: '⚠️' },
  antidote:           { label: '解毒薬', emoji: '💊' },
  foshu:              { label: 'トクホ', emoji: '🥗' },
  pharmacology:       { label: '薬理', emoji: '💊' },
}

// ---- 科目emoji ----
const SUBJECT_EMOJI: Record<string, string> = {
  '病態・薬物治療': '🏥',
  '実務': '💊',
  '薬理': '💉',
  '衛生': '🧪',
  '薬剤': '💊',
  '法規・制度・倫理': '📜',
  '物理': '⚛️',
  '生物': '🧬',
  '化学': '🔬',
}

// ---- 時間見積もり ----
function estimateMinutes(dueIds: string[], templates: Map<string, FlashCardTemplate>): number {
  let totalSec = 0
  for (const id of dueIds) {
    const t = templates.get(id)
    if (!t) { totalSec += 6; continue }
    if (t.id.endsWith('-L0a') || t.id.endsWith('-L0b')) totalSec += 4
    else if (t.id.endsWith('-L1') || t.id.endsWith('-L2') || t.id.endsWith('-L3')) totalSec += 8
    else totalSec += 6
  }
  return Math.max(1, Math.ceil(totalSec / 60))
}

// ---- 表示件数 ----
const COLLAPSED_COUNT = 5

export function FlashCardListPage() {
  const navigate = useNavigate()
  const { allTemplates, loading, error, templatesById, retry } = useUnifiedTemplates()
  const { allProgress, dueProgress } = useCardProgress()

  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('all')
  const [structFilter, setStructFilter] = useState<StructFilter>('all')
  const [textExpanded, setTextExpanded] = useState(false)
  const [structExpanded, setStructExpanded] = useState(false)

  // progress Map（template_id → CardProgress）
  const progressMap = useMemo(() => {
    const m = new Map<string, CardProgress>()
    for (const p of allProgress) m.set(p.template_id, p)
    return m
  }, [allProgress])

  // フィルタ適用ヘルパー
  const matchesProgressFilter = (tId: string) => {
    if (progressFilter === 'all') return true
    return getProgressBucket(progressMap.get(tId)) === progressFilter
  }

  // ---- テキストカード ----
  const textGroups = useMemo(() => {
    const textTemplates = allTemplates.filter(t => t.source_type !== 'structure_db')
    const filtered = textTemplates.filter(t => matchesProgressFilter(t.id))
    // subject でグループ化
    const bySubject = new Map<QuestionSubject, FlashCardTemplate[]>()
    for (const t of filtered) {
      if (!bySubject.has(t.subject)) bySubject.set(t.subject, [])
      bySubject.get(t.subject)!.push(t)
    }
    // 枚数順ソート
    return [...bySubject.entries()].sort((a, b) => b[1].length - a[1].length)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTemplates, progressFilter, allProgress])

  const totalTextCards = allTemplates.filter(t => t.source_type !== 'structure_db').length

  // ---- 構造式カード ----
  const structGroups = useMemo(() => {
    let structTemplates = allTemplates.filter(t => t.source_type === 'structure_db')
    // 構造式サブフィルタ
    if (structFilter === 'basic') structTemplates = structTemplates.filter(isBasicCard)
    else if (structFilter === 'advanced') structTemplates = structTemplates.filter(isAdvancedCard)
    // 進捗フィルタ
    const filtered = structTemplates.filter(t => matchesProgressFilter(t.id))
    // source_id → カテゴリ
    const byCat = new Map<string, { label: string; emoji: string; cards: FlashCardTemplate[] }>()
    for (const t of filtered) {
      const meta = COMPOUND_META[t.source_id]
      const catKey = meta?.category ?? 'other'
      const catInfo = CATEGORY_LABELS[catKey] ?? { label: catKey, emoji: '📦' }
      if (!byCat.has(catKey)) byCat.set(catKey, { ...catInfo, cards: [] })
      byCat.get(catKey)!.cards.push(t)
    }
    return [...byCat.entries()]
      .map(([key, val]) => ({ key, ...val }))
      .sort((a, b) => b.cards.length - a.cards.length)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTemplates, structFilter, progressFilter, allProgress])

  const totalStructCards = allTemplates.filter(t => t.source_type === 'structure_db').length
  const totalCards = allTemplates.length

  // 科目別進捗計算
  function getSubjectProgress(templates: FlashCardTemplate[]) {
    let learned = 0, due = 0
    for (const t of templates) {
      const b = getProgressBucket(progressMap.get(t.id))
      if (b === 'due') due++
      else if (b === 'mastered') learned++
      else if (progressMap.has(t.id)) learned++ // 学習中もlearned扱い
    }
    return { learned, due, total: templates.length }
  }

  // 復習CTA
  const dueCount = dueProgress.length
  const dueCardIds = dueProgress.map(p => p.template_id)
  const estimatedMin = dueCount > 0 ? estimateMinutes(dueCardIds, templatesById) : 0

  const handleReviewCta = () => {
    if (dueCount === 0) return
    const context: FlashCardPracticeContext = {
      mode: 'review_queue',
      cardIds: dueCardIds,
      returnTo: '/cards',
    }
    navigate('/cards/review', { state: { practiceContext: context } })
  }

  const handleCategoryTap = (cards: FlashCardTemplate[], mode: 'exemplar') => {
    const context: FlashCardPracticeContext = {
      mode,
      cardIds: cards.map(c => c.id),
      returnTo: '/cards',
    }
    navigate('/cards/review', { state: { practiceContext: context } })
  }

  const visibleTextGroups = textExpanded ? textGroups : textGroups.slice(0, COLLAPSED_COUNT)
  const hiddenTextCount = textGroups.length - COLLAPSED_COUNT
  const visibleStructGroups = structExpanded ? structGroups : structGroups.slice(0, COLLAPSED_COUNT)
  const hiddenStructCount = structGroups.length - COLLAPSED_COUNT

  return (
    <div className="sc-page">
      <div className={styles.page}>
        {/* ---- Header ---- */}
        <div className={styles.header}>
          <h1 className={styles.title}>暗記カード</h1>
          <span className={styles.totalCount}>{totalCards.toLocaleString()}枚</span>
        </div>

        {/* ---- Error Banner ---- */}
        {error && (
          <div className={styles.errorBanner}>
            <span className={styles.errorText}>テキストカードの読み込みに失敗しました</span>
            <button className={styles.retryBtn} onClick={retry}>リトライ</button>
          </div>
        )}

        {/* ---- Loading ---- */}
        {loading && (
          <div className={styles.loadingText}>カードを読み込み中...</div>
        )}

        {/* ---- Review CTA ---- */}
        <button
          className={`${styles.reviewCta} ${dueCount === 0 ? styles.reviewCtaDisabled : ''}`}
          onClick={handleReviewCta}
          disabled={dueCount === 0}
        >
          {dueCount > 0 ? (
            <>
              <div className={styles.ctaTop}>
                <span className={styles.ctaLabel}>復習タイミング</span>
                <span className={styles.ctaCount}>{dueCount}枚</span>
              </div>
              <div className={styles.ctaBottom}>
                <span className={styles.ctaTime}>約{estimatedMin}分</span>
                <span className={styles.ctaArrow}>練習する &rarr;</span>
              </div>
            </>
          ) : (
            <div className={styles.ctaTop}>
              <span className={styles.ctaLabel}>復習するカードはまだありません</span>
            </div>
          )}
        </button>

        {/* ---- Progress Filter ---- */}
        <div className={styles.chipRow}>
          {PROGRESS_FILTERS.map(f => (
            <Chip
              key={f.key}
              label={f.label}
              active={progressFilter === f.key}
              onClick={() => setProgressFilter(f.key)}
            />
          ))}
        </div>

        {/* ---- Text Cards Section ---- */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>📖 テキストカード</span>
            <span className={styles.sectionCount}>{totalTextCards.toLocaleString()}枚</span>
          </div>

          {visibleTextGroups.length > 0 ? (
            <div className={styles.categoryCard}>
              {visibleTextGroups.map(([subject, templates]) => {
                const prog = getSubjectProgress(templates)
                const learnedRatio = prog.total > 0 ? (prog.learned / prog.total) * 100 : 0
                return (
                  <div
                    key={subject}
                    className={styles.subCategoryRow}
                    onClick={() => handleCategoryTap(templates, 'exemplar')}
                  >
                    <div className={styles.subCategoryInfo}>
                      <div className={styles.subCategoryName}>
                        {SUBJECT_EMOJI[subject] ?? '📄'} {subject}
                      </div>
                      <span className={styles.subCategoryCount}>{templates.length}枚</span>
                    </div>
                    <div className={styles.progressMini}>
                      <div className={styles.progressMiniBar} style={{ width: `${learnedRatio}%` }} />
                    </div>
                    <div className={styles.progressStats}>
                      {prog.learned > 0 && <span className={styles.statLearned}>学習{prog.learned}</span>}
                      {prog.due > 0 && <span className={styles.statDue}>復{prog.due}</span>}
                    </div>
                  </div>
                )
              })}
              {!textExpanded && hiddenTextCount > 0 && (
                <button className={styles.expandBtn} onClick={() => setTextExpanded(true)}>
                  + 他{hiddenTextCount}科目
                </button>
              )}
            </div>
          ) : (
            <div className={styles.emptyState}>
              {loading ? 'カードを読み込み中...' : 'フィルタに一致するテキストカードがありません'}
            </div>
          )}
        </div>

        {/* ---- Structural Cards Section ---- */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>🔬 構造式カード</span>
            <span className={styles.sectionCount}>{totalStructCards}枚</span>
          </div>

          {/* 構造式Chipフィルタ */}
          <div className={styles.chipRow}>
            {STRUCT_FILTERS.map(f => (
              <Chip
                key={f.key}
                label={f.label}
                active={structFilter === f.key}
                onClick={() => setStructFilter(f.key)}
              />
            ))}
          </div>

          {visibleStructGroups.length > 0 ? (
            <div className={styles.categoryCard}>
              {visibleStructGroups.map(g => {
                const prog = getSubjectProgress(g.cards)
                const learnedRatio = prog.total > 0 ? (prog.learned / prog.total) * 100 : 0
                return (
                  <div
                    key={g.key}
                    className={styles.subCategoryRow}
                    onClick={() => handleCategoryTap(g.cards, 'exemplar')}
                  >
                    <div className={styles.subCategoryInfo}>
                      <div className={styles.subCategoryName}>
                        {g.emoji} {g.label}
                      </div>
                      <span className={styles.subCategoryCount}>{g.cards.length}枚</span>
                    </div>
                    <div className={styles.progressMini}>
                      <div className={styles.progressMiniBar} style={{ width: `${learnedRatio}%` }} />
                    </div>
                    <div className={styles.progressStats}>
                      {prog.learned > 0 && <span className={styles.statLearned}>学習{prog.learned}</span>}
                      {prog.due > 0 && <span className={styles.statDue}>復{prog.due}</span>}
                    </div>
                  </div>
                )
              })}
              {!structExpanded && hiddenStructCount > 0 && (
                <button className={styles.expandBtn} onClick={() => setStructExpanded(true)}>
                  + 他{hiddenStructCount}カテゴリ
                </button>
              )}
            </div>
          ) : (
            <div className={styles.emptyState}>
              フィルタに一致する構造式カードがありません
            </div>
          )}
        </div>

        {/* ---- Total Empty ---- */}
        {!loading && allTemplates.length === 0 && (
          <div className={styles.emptyState}>カードがまだありません</div>
        )}
      </div>
    </div>
  )
}
