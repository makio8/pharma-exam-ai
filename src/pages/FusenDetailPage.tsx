import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useFusenDetail } from '../hooks/useFusenDetail'
import { FusenLibraryCore } from '../utils/fusen-library-core'
import { NoteImageViewer } from '../components/question/NoteImageViewer'
import { FusenBreadcrumb } from '../components/notes/FusenBreadcrumb'
import { RelatedQuestionList } from '../components/notes/RelatedQuestionList'
import { FlashCardSection } from '../components/notes/FlashCardSection'
import { FloatingNav } from '../components/ui/FloatingNav'
import styles from './FusenDetailPage.module.css'

export function FusenDetailPage() {
  const { fusenId } = useParams<{ fusenId: string }>()
  const navigate = useNavigate()
  const { fusen, relatedQuestions, breadcrumb, isBookmarked, toggleBookmark } =
    useFusenDetail(fusenId ?? '')
  const [imageOpen, setImageOpen] = useState(false)

  if (!fusen) {
    return (
      <div className="sc-page">
        <p>付箋が見つかりません</p>
        <FloatingNav />
      </div>
    )
  }

  const badge = FusenLibraryCore.getImportanceBadge(fusen.linkedQuestionIds.length)
  const unanswered = relatedQuestions.filter(q => q.userStatus === 'unanswered')

  return (
    <div className="sc-page">
      <div className={styles.page}>
        {/* ヘッダー */}
        <header className={styles.header}>
          <button className={styles.back} onClick={() => navigate('/notes')}>
            ← 戻る
          </button>
          <h1 className={styles.title}>{fusen.title}</h1>
          <button
            className={styles.bookmark}
            onClick={toggleBookmark}
            aria-label={isBookmarked ? 'ブックマーク解除' : 'ブックマーク追加'}
            aria-pressed={isBookmarked}
          >
            {isBookmarked ? '★' : '☆'}
          </button>
        </header>

        {/* 画像 */}
        <img
          src={fusen.imageUrl}
          alt={fusen.title}
          className={styles.image}
          onClick={() => setImageOpen(true)}
        />

        {/* パンくず + バッジ */}
        <div className={styles.meta}>
          <FusenBreadcrumb breadcrumb={breadcrumb} />
          {badge && (
            <span className={styles.badge}>{badge.emoji} {badge.count}問で使う知識</span>
          )}
        </div>

        {/* AI要約 */}
        <section>
          <h3 className={styles.sectionTitle}>AI要約</h3>
          <p className={styles.summary}>{fusen.textSummary}</p>
        </section>

        {/* 関連問題 */}
        <RelatedQuestionList questions={relatedQuestions} />

        {/* 暗記カード */}
        <FlashCardSection />

        {/* CTA */}
        {unanswered.length > 0 && (
          <button
            className={styles.cta}
            onClick={() => navigate(`/practice/${unanswered[0].questionId}`)}
          >
            この知識の問題を解く
          </button>
        )}
      </div>

      {/* 画像拡大 */}
      <NoteImageViewer
        imageUrl={fusen.imageUrl}
        title={fusen.title}
        open={imageOpen}
        onClose={() => setImageOpen(false)}
      />

      <FloatingNav />
    </div>
  )
}
