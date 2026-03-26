// src/dev-tools/exemplar-mapping/components/MappingCard.tsx
import { useMemo } from 'react'
import type { MappingDataEntry } from '../hooks/useMappingData'
import type { MappingReviewState } from '../types'
import type { NoteExemplarMatch } from '../../../types/note-exemplar-mapping'
import type { Exemplar } from '../../../types/blueprint'
import { ExemplarCandidate } from './ExemplarCandidate'
import { OFFICIAL_NOTES } from '../../../data/official-notes'
import { EXEMPLARS } from '../../../data/exemplars'
import styles from './MappingCard.module.css'

/** EXEMPLARS の全件 id→Exemplar 逆引き（手動追加分の lookup に使用） */
const exemplarById = new Map<string, Exemplar>(
  EXEMPLARS.map(e => [e.id, e])
)

/** 同 topicId の全 exemplar（module-level Map） */
const exemplarsByTopic = new Map<string, Exemplar[]>()
for (const ex of EXEMPLARS) {
  const list = exemplarsByTopic.get(ex.middleCategoryId) ?? []
  list.push(ex)
  exemplarsByTopic.set(ex.middleCategoryId, list)
}

interface Props {
  entry: MappingDataEntry
  effectiveMatches: NoteExemplarMatch[]
  reviewState: MappingReviewState
  currentIndex: number
  totalCount: number
  onSetMatchStatus: (noteId: string, exemplarId: string, status: 'approved' | 'rejected') => void
  onTogglePrimary: (noteId: string, exemplarId: string, currentIsPrimary: boolean, allExemplarIds: string[]) => void
  onApproveAll: () => void
  onModified: () => void
  onRejectAll: () => void
  onReset: () => void
  onNext: () => void
  onPrev: () => void
  onAddMatch: (exemplarId: string, isPrimary: boolean) => void
}

export function MappingCard({
  entry, effectiveMatches, reviewState, currentIndex, totalCount,
  onSetMatchStatus, onTogglePrimary,
  onApproveAll, onModified, onRejectAll, onReset,
  onNext, onPrev, onAddMatch,
}: Props) {
  const note = OFFICIAL_NOTES.find(n => n.id === entry.noteId)
  const entryStatus = reviewState.entryStatuses[entry.noteId] ?? entry.reviewStatus

  const allExemplarIds = useMemo(() => effectiveMatches.map(m => m.exemplarId), [effectiveMatches])

  // 同 topicId の全 exemplar
  const topicExemplars = exemplarsByTopic.get(entry.topicId) ?? []
  const candidateIdSet = useMemo(() => new Set(effectiveMatches.map(m => m.exemplarId)), [effectiveMatches])

  return (
    <div className={styles.card}>
      {/* ヘッダー: ID + 科目 + topicId */}
      <div className={styles.header}>
        <span className={`${styles.badge} ${styles.badgeId}`}>{entry.noteId}</span>
        <span className={`${styles.badge} ${styles.badgeSubject}`}>{entry.subject}</span>
        <span className={`${styles.badge} ${styles.badgeTopic}`}>{entry.topicId}</span>
        {effectiveMatches.length === 0 && (
          <span className={`${styles.badge} ${styles.badgeNeedsManual}`}>要手動</span>
        )}
      </div>

      {/* 付箋画像 */}
      {note?.imageUrl && (
        <img src={note.imageUrl} alt={entry.noteTitle} className={styles.imagePreview} />
      )}

      {/* タイトル + テキストサマリー */}
      <div className={styles.title}>{entry.noteTitle}</div>
      {note?.textSummary && <div className={styles.summary}>{note.textSummary}</div>}

      {/* タグ */}
      {note?.tags && (
        <div className={styles.tags}>
          {note.tags.map((tag, i) => (
            <span key={i} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}

      {/* Exemplar 候補セクション（effective list 基準） */}
      <div className={styles.sectionTitle}>
        Exemplar 候補 ({effectiveMatches.length}件)
      </div>

      {effectiveMatches.length === 0 ? (
        <div className={styles.noCandidates}>
          ⚠️ マッチする Exemplar がありません。下の一覧から手動で追加してください。
        </div>
      ) : (
        <div className={styles.candidates}>
          {effectiveMatches.map(match => {
            const key = `${entry.noteId}:${match.exemplarId}`
            return (
              <ExemplarCandidate
                key={match.exemplarId}
                match={match}
                exemplar={entry.exemplarMap.get(match.exemplarId) ?? exemplarById.get(match.exemplarId)}
                reviewedStatus={reviewState.matchStatuses[key]}
                primaryOverride={reviewState.primaryOverrides[key]}
                onApprove={() => onSetMatchStatus(entry.noteId, match.exemplarId, 'approved')}
                onReject={() => onSetMatchStatus(entry.noteId, match.exemplarId, 'rejected')}
                onTogglePrimary={(currentIsPrimary) => onTogglePrimary(entry.noteId, match.exemplarId, currentIsPrimary, allExemplarIds)}
              />
            )
          })}
        </div>
      )}

      {/* 同トピック全 Exemplar 一覧（折りたたみ） */}
      {topicExemplars.length > 0 ? (
        <details className={styles.topicExemplars}>
          <summary className={styles.topicExemplarsSummary}>
            同トピックの全 Exemplar ({topicExemplars.length}件)
          </summary>
          <div className={styles.topicExemplarsList}>
            {topicExemplars.map(ex => {
              const isCandidate = candidateIdSet.has(ex.id)
              return (
                <div key={ex.id} className={`${styles.topicExemplarRow} ${isCandidate ? styles.topicExemplarRowAdded : ''}`}>
                  <div className={styles.topicExemplarHeader}>
                    {isCandidate && <span className={styles.topicExemplarBadge}>✅</span>}
                    <span className={styles.topicExemplarId}>{ex.id}</span>
                  </div>
                  <div className={styles.topicExemplarText}>{ex.text}</div>
                  <div className={styles.topicExemplarCategory}>📁 {ex.minorCategory}</div>
                  {!isCandidate && (
                    <div className={styles.topicExemplarActions}>
                      <button
                        className={`${styles.addBtn} ${styles.addBtnPrimary}`}
                        onClick={() => onAddMatch(ex.id, true)}
                      >
                        🟢 Primary
                      </button>
                      <button
                        className={`${styles.addBtn} ${styles.addBtnSecondary}`}
                        onClick={() => onAddMatch(ex.id, false)}
                      >
                        🔵 Secondary
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </details>
      ) : (
        <div className={styles.noCandidates}>
          ⚠️ このトピックに Exemplar はありません
        </div>
      )}

      {/* 判定バー（effectiveMatches が 0 件なら非表示 — needs-manual 誤完了防止） */}
      {effectiveMatches.length > 0 && (
        <div className={styles.judgmentBar}>
          <button
            className={`${styles.judgmentBtn} ${styles.btnApprove} ${entryStatus === 'approved' ? styles.judgmentBtnActive : ''}`}
            onClick={onApproveAll}
          >Approve [1]</button>
          <button
            className={`${styles.judgmentBtn} ${styles.btnModified} ${entryStatus === 'modified' ? styles.judgmentBtnActive : ''}`}
            onClick={onModified}
          >Modified [2]</button>
          <button
            className={`${styles.judgmentBtn} ${styles.btnReject} ${entryStatus === 'rejected' ? styles.judgmentBtnActive : ''}`}
            onClick={onRejectAll}
          >Reject [3]</button>
          <button className={`${styles.judgmentBtn} ${styles.btnReset}`} onClick={onReset}>
            Reset [0]
          </button>
        </div>
      )}

      {/* ナビ */}
      <div className={styles.navBar}>
        <button className={styles.navBtn} onClick={onPrev} disabled={currentIndex === 0}>
          ← Prev [k]
        </button>
        <span className={styles.position}>{currentIndex + 1} / {totalCount}</span>
        <button className={styles.navBtn} onClick={onNext} disabled={currentIndex >= totalCount - 1}>
          Next [j] →
        </button>
      </div>
    </div>
  )
}
