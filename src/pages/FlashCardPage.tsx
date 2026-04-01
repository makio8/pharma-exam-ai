// 暗記カード復習画面
// - オンボーディング未完了 → ONBOARDING_CARDS でチュートリアル（開始時点でフラグを立てる）
// - PracticeContext あり → SwipePractice
// - PracticeContext なし → dueProgress 全件で自動コンテキスト生成 → SwipePractice
// - due 0件 → 空状態UI
import { useLocation, useNavigate } from 'react-router-dom'
import { useUnifiedTemplates } from '../hooks/useUnifiedTemplates'
import { useCardProgress } from '../hooks/useCardProgress'
import { SwipePractice } from '../components/flashcard/SwipePractice'
import { ONBOARDING_CARDS } from '../data/onboarding-cards'
import type { FlashCardPracticeContext } from '../types/card-progress'

export function FlashCardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { getTemplate, loading } = useUnifiedTemplates()
  const { dueProgress } = useCardProgress()

  // オンボーディング判定
  const isOnboardingDone = localStorage.getItem('card-onboarding-done') === 'true'

  if (!isOnboardingDone) {
    // チュートリアルモード: 開始時点でフラグを立てる（途中離脱でも次回スキップ）
    localStorage.setItem('card-onboarding-done', 'true')

    const onboardingContext: FlashCardPracticeContext = {
      mode: 'exemplar',
      cardIds: ONBOARDING_CARDS.map((c) => c.id),
      returnTo: '/cards',
    }
    const getOnboardingTemplate = (id: string) => ONBOARDING_CARDS.find((c) => c.id === id)

    return (
      <SwipePractice
        context={onboardingContext}
        getTemplate={getOnboardingTemplate}
      />
    )
  }

  // PracticeContext が location.state にあれば使用
  const practiceContext = (location.state as { practiceContext?: FlashCardPracticeContext } | null)
    ?.practiceContext

  if (practiceContext && practiceContext.cardIds.length > 0) {
    return <SwipePractice context={practiceContext} getTemplate={getTemplate} />
  }

  // コンテキストなし → dueProgress で自動コンテキスト or 空状態
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#8b7355' }}>
        読み込み中...
      </div>
    )
  }

  if (dueProgress.length > 0) {
    const autoContext: FlashCardPracticeContext = {
      mode: 'review_queue',
      cardIds: dueProgress.map((p) => p.template_id),
      returnTo: '/cards',
    }
    return <SwipePractice context={autoContext} getTemplate={getTemplate} />
  }

  // due 0件
  return (
    <div
      style={{ padding: '2rem', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <div
        style={{ fontSize: 18, fontWeight: 700, color: '#3d2c1e', marginBottom: 8 }}
      >
        復習するカードはありません
      </div>
      <div style={{ fontSize: 14, color: '#8b7355', marginBottom: 24 }}>
        カードタブからカテゴリを選んで練習しよう！
      </div>
      <button
        onClick={() => navigate('/cards')}
        style={{
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #aa3bff, #8b5cf6)',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          fontSize: 15,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        カードタブに戻る
      </button>
    </div>
  )
}
