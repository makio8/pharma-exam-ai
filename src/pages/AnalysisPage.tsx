// src/pages/AnalysisPage.tsx — Soft Companion リデザイン
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalytics } from '../hooks/useAnalytics'
import { ALL_QUESTIONS } from '../data/all-questions'
import { computeMissedEssentials } from '../utils/missed-essentials'
import { Chip } from '../components/ui/Chip'
import { DecoWave } from '../components/ui/DecoWave'
import { FloatingNav } from '../components/ui/FloatingNav'
import { WeakQuestionCard } from '../components/analysis/WeakQuestionCard'
import { HistoryItem } from '../components/analysis/HistoryItem'
import type { Question } from '../types/question'
import styles from './AnalysisPage.module.css'

export function AnalysisPage() {
  const navigate = useNavigate()
  const { weakQuestions, recentHistory, allHistory, isEmpty } = useAnalytics()
  const [mode, setMode] = useState<'weak' | 'missed'>('weak')

  const displayQuestions = useMemo(() => {
    if (mode === 'weak') return weakQuestions
    return computeMissedEssentials(allHistory, ALL_QUESTIONS)
  }, [mode, weakQuestions, allHistory])

  // 回答履歴の問題逆引きマップ
  const questionMap = useMemo(() => {
    const map = new Map<string, Question>()
    for (const q of ALL_QUESTIONS) map.set(q.id, q)
    return map
  }, [])

  if (isEmpty) {
    return (
      <div className="sc-page">
        <DecoWave />
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📊</div>
          <p className={styles.emptyTitle}>分析を始めましょう！</p>
          <p className={styles.emptySub}>
            問題を解くと、苦手分析や回答履歴が<br />ここに表示されます
          </p>
          <button type="button" className={styles.ctaBtn} onClick={() => navigate('/practice')}>
            ▶ 演習を始める
          </button>
          {/* DEBUG: localStorage直接書き込みテスト */}
          <button
            type="button"
            style={{ marginTop: 16, padding: '8px 16px', fontSize: 12, background: '#eee', border: '1px solid #ccc', borderRadius: 8 }}
            onClick={() => {
              const testEntry = {
                id: crypto.randomUUID(),
                user_id: 'local_user',
                question_id: 'r111-001',
                selected_answer: 3,
                is_correct: true,
                answered_at: new Date().toISOString(),
                time_spent_seconds: 15,
              }
              const existing = JSON.parse(localStorage.getItem('answer_history') || '[]')
              existing.push(testEntry)
              localStorage.setItem('answer_history', JSON.stringify(existing))
              alert(`書き込み完了！ LS件数: ${existing.length}件\nページをリロードして確認`)
            }}
          >
            🧪 テストデータ書込
          </button>
        </div>
        <FloatingNav />
      </div>
    )
  }

  return (
    <div className="sc-page">
      <DecoWave />
      <div className={styles.header}>📊 分析</div>

      {/* --- 苦手問題 --- */}
      <div className="section-title">🔍 苦手問題</div>
      <div className={styles.chipRow}>
        <Chip label="🔥 自分の苦手" active={mode === 'weak'} onClick={() => setMode('weak')} />
        <Chip label="⚠️ 必須の取りこぼし" active={mode === 'missed'} onClick={() => setMode('missed')} />
      </div>

      {displayQuestions.length === 0 ? (
        <p className={styles.sectionEmpty}>
          {mode === 'weak' ? '💪 苦手問題はまだありません' : '✨ 必須問題の取りこぼしなし！'}
        </p>
      ) : (
        displayQuestions.map((q) => (
          <WeakQuestionCard
            key={q.id}
            question={q}
            incorrectCount={mode === 'weak' ? q.incorrectCount : undefined}
            isMissedEssential={mode === 'missed'}
            onReview={() => navigate(`/practice/${q.id}`)}
          />
        ))
      )}

      {/* --- 回答履歴 --- */}
      <div className="section-title" style={{ marginTop: 24 }}>🕐 回答履歴</div>

      {recentHistory.length === 0 ? (
        <p className={styles.sectionEmpty}>📝 回答履歴がありません</p>
      ) : (
        recentHistory.map((item) => {
          const q = questionMap.get(item.question_id)
          if (!q) {
            return (
              <HistoryItem
                key={item.id}
                isCorrect={item.is_correct}
                isSkipped={item.skipped === true}
                answeredAt={item.answered_at}
                subject="不明"
                year={0}
                questionNumber={0}
                timeSpentSeconds={item.time_spent_seconds}
                onTap={() => navigate(`/practice/${item.question_id}`)}
              />
            )
          }
          return (
            <HistoryItem
              key={item.id}
              isCorrect={item.is_correct}
              isSkipped={item.skipped === true}
              answeredAt={item.answered_at}
              subject={q.subject}
              year={q.year}
              questionNumber={q.question_number}
              timeSpentSeconds={item.time_spent_seconds}
              onTap={() => navigate(`/practice/${item.question_id}`)}
            />
          )
        })
      )}
      <FloatingNav />
    </div>
  )
}
