import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ALL_QUESTIONS } from '../data/all-questions'
import { QUESTION_TOPIC_MAP } from '../data/question-topic-map'
import { ALL_TOPICS } from '../data/exam-blueprint'
import { useAnswerHistory } from '../hooks/useAnswerHistory'
import {
  getMajorCategoriesForSubject,
  getQuestionIdsForMajorCategory,
  getFrequentExemplarQuestionIds,
} from '../utils/blueprint-helpers'
import type { QuestionSection, QuestionSubject, Question } from '../types/question'
import { ChipFilter } from '../components/ui/ChipFilter'
import { SubFieldChips } from '../components/ui/SubFieldChips'
import { PresetCardGrid } from '../components/ui/PresetCard'
import type { PresetConfig } from '../components/ui/PresetCard'
import { QuestionCard } from '../components/ui/QuestionCard'
import { BottomSheet } from '../components/ui/BottomSheet'
import { StickyActionBar } from '../components/ui/StickyActionBar'
import { FloatingNav } from '../components/ui/FloatingNav'
import styles from './PracticePage.module.css'

const SUBJECTS: QuestionSubject[] = [
  '物理', '化学', '生物', '衛生', '薬理', '薬剤', '病態・薬物治療', '法規・制度・倫理', '実務',
]
const YEARS = Array.from({ length: 12 }, (_, i) => 100 + i) // 100-111
const SECTIONS: { value: QuestionSection; label: string; variant: 'default' | 'blue' | 'green' }[] = [
  { value: '必須', label: '必須', variant: 'blue' },
  { value: '理論', label: '理論', variant: 'default' },
  { value: '実践', label: '実践', variant: 'green' },
]

type CorrectStatus = 'all' | 'correct' | 'incorrect' | 'unanswered'

const PRESETS: PresetConfig[] = [
  { id: 'weak', icon: '🎯', title: '苦手克服', description: '間違えた問題を優先', badge: 'おすすめ' },
  { id: 'frequent', icon: '📋', title: '頻出テーマ', description: 'よく出るテーマの未回答' },
  { id: 'unanswered', icon: '⭐', title: '未回答を潰す', description: 'まだ解いてない問題' },
  { id: 'random', icon: '🔄', title: 'ランダム演習', description: 'フィルター結果からシャッフル' },
]

// TopicId → 分野名（MajorCategory.name）のルックアップ
const TOPIC_TO_MAJOR = new Map<string, string>()
const TOPIC_TO_MIDDLE = new Map<string, string>()
for (const t of ALL_TOPICS) {
  TOPIC_TO_MAJOR.set(t.id, t.major)
  TOPIC_TO_MIDDLE.set(t.id, t.middle)
}

export function PracticePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { history } = useAnswerHistory()

  // Filter state
  const [selectedSubjects, setSelectedSubjects] = useState<QuestionSubject[]>([])
  const [selectedMajors, setSelectedMajors] = useState<Record<string, string[]>>({}) // subject → majorName[]
  const [selectedMiddles, setSelectedMiddles] = useState<string[]>([]) // middleCategory ids
  const [selectedYears, setSelectedYears] = useState<number[]>([])
  const [selectedSections, setSelectedSections] = useState<QuestionSection[]>([])
  const [correctStatus, setCorrectStatus] = useState<CorrectStatus>('all')
  const [keyword, setKeyword] = useState('')
  const [imageOnly, setImageOnly] = useState(false)
  const [randomOrder, setRandomOrder] = useState(false)
  const [sessionCount, setSessionCount] = useState<10 | 20 | 0>(10)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)

  // URL パラメータから科目を初期設定（TodayMenu等からのディープリンク対応）
  useEffect(() => {
    const subjectParam = searchParams.get('subject')
    if (subjectParam && SUBJECTS.includes(subjectParam as QuestionSubject)) {
      setSelectedSubjects([subjectParam as QuestionSubject])
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Answer history lookup
  const answerMap = useMemo(() => {
    const map = new Map<string, boolean>()
    for (const a of history) {
      map.set(a.question_id, a.is_correct)
    }
    return map
  }, [history])

  const answeredIds = useMemo(() => new Set(history.map(a => a.question_id)), [history])

  // Frequent exemplar question IDs (for 頻出テーマ preset)
  const frequentQuestionIds = useMemo(() => new Set(getFrequentExemplarQuestionIds(3)), [])

  // Toggle helpers
  const toggleArrayItem = useCallback(<T,>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item],
  [])

  const handleSubjectToggle = useCallback((subject: QuestionSubject) => {
    setSelectedSubjects(prev => {
      const next = toggleArrayItem(prev, subject)
      // 科目を解除したら、その科目のmajor/middleフィルターもクリア
      if (!next.includes(subject)) {
        setSelectedMajors(prevMajors => {
          const { [subject]: _, ...rest } = prevMajors
          return rest
        })
        // その科目に属するmiddleカテゴリもクリア
        const majorsForSubject = getMajorCategoriesForSubject(subject)
        const middleIdsToRemove = new Set(
          majorsForSubject.flatMap(m => m.middleCategories.map(mc => mc.id))
        )
        setSelectedMiddles(prev => prev.filter(id => !middleIdsToRemove.has(id)))
      }
      return next
    })
    setActivePreset(null)
  }, [toggleArrayItem])

  const handleMajorToggle = useCallback((subject: string, majorName: string) => {
    setSelectedMajors(prev => ({
      ...prev,
      [subject]: toggleArrayItem(prev[subject] ?? [], majorName),
    }))
    setActivePreset(null)
  }, [toggleArrayItem])

  const handleMiddleToggle = useCallback((middleId: string) => {
    setSelectedMiddles(prev => toggleArrayItem(prev, middleId))
    setActivePreset(null)
  }, [toggleArrayItem])

  // Preset handler
  const handlePresetSelect = useCallback((presetId: string) => {
    setActivePreset(presetId)
    switch (presetId) {
      case 'weak':
        setCorrectStatus('incorrect')
        setRandomOrder(true)
        setSessionCount(10)
        break
      case 'frequent':
        setCorrectStatus('unanswered')
        setRandomOrder(false)
        setSessionCount(10)
        break
      case 'unanswered':
        setCorrectStatus('unanswered')
        setRandomOrder(false)
        setSessionCount(10)
        break
      case 'random':
        setRandomOrder(true)
        setSessionCount(10)
        break
    }
  }, [])

  // Filtering
  const filteredQuestions = useMemo(() => {
    let qs = [...ALL_QUESTIONS]

    // Subject filter
    if (selectedSubjects.length > 0) {
      qs = qs.filter(q => selectedSubjects.includes(q.subject))
    }

    // Middle category filter (最優先: 中項目が選択されていればそれで絞る)
    if (selectedMiddles.length > 0) {
      const middleSet = new Set(selectedMiddles)
      qs = qs.filter(q => {
        const topicId = QUESTION_TOPIC_MAP[q.id]
        return topicId ? middleSet.has(topicId) : false
      })
    } else {
      // Major category filter (中項目未選択時のみ大項目で絞る)
      const activeMajorIds = new Set<string>()
      for (const [subject, majors] of Object.entries(selectedMajors)) {
        for (const majorName of majors) {
          const ids = getQuestionIdsForMajorCategory(majorName, subject as QuestionSubject)
          ids.forEach(id => activeMajorIds.add(id))
        }
      }
      if (activeMajorIds.size > 0) {
        qs = qs.filter(q => activeMajorIds.has(q.id))
      }
    }

    // Year filter
    if (selectedYears.length > 0) {
      qs = qs.filter(q => selectedYears.includes(q.year))
    }

    // Section filter
    if (selectedSections.length > 0) {
      qs = qs.filter(q => selectedSections.includes(q.section))
    }

    // 頻出テーマ preset
    if (activePreset === 'frequent') {
      qs = qs.filter(q => frequentQuestionIds.has(q.id))
    }

    // Correct status
    if (correctStatus === 'correct') {
      qs = qs.filter(q => answerMap.get(q.id) === true)
    } else if (correctStatus === 'incorrect') {
      qs = qs.filter(q => answerMap.get(q.id) === false)
    } else if (correctStatus === 'unanswered') {
      qs = qs.filter(q => !answeredIds.has(q.id))
    }

    // Image only
    if (imageOnly) {
      qs = qs.filter(q => !!q.image_url)
    }

    // Keyword
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      qs = qs.filter(q =>
        q.question_text.toLowerCase().includes(kw) ||
        q.tags?.some(t => t.toLowerCase().includes(kw))
      )
    }

    return qs
  }, [selectedSubjects, selectedMajors, selectedMiddles, selectedYears, selectedSections,
      correctStatus, imageOnly, keyword, activePreset, answerMap, answeredIds, frequentQuestionIds])

  // Display order: apply randomOrder to the visible list
  const displayQuestions = useMemo(() => {
    if (!randomOrder) return filteredQuestions
    // Deterministic-ish shuffle seeded on filter result length (re-shuffles when filters change)
    const shuffled = [...filteredQuestions]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [filteredQuestions, randomOrder])

  // Get question status helper
  const getStatus = (q: Question): 'correct' | 'incorrect' | 'unanswered' => {
    if (!answeredIds.has(q.id)) return 'unanswered'
    return answerMap.get(q.id) ? 'correct' : 'incorrect'
  }

  // Get field name for question
  const getFieldName = (q: Question): string | undefined => {
    const topicId = QUESTION_TOPIC_MAP[q.id]
    return topicId ? TOPIC_TO_MIDDLE.get(topicId) : undefined
  }

  // Start session (preserve linked_group logic from original)
  const handleStartSession = () => {
    let questions = [...filteredQuestions]

    // Ensure complete linked sets: add missing siblings
    const questionIds = new Set(questions.map(q => q.id))
    const addedIds = new Set<string>()
    for (const q of questions) {
      if (!q.linked_group) continue
      const match = q.linked_group.match(/^r(\d+)-(\d+)-(\d+)$/)
      if (!match) continue
      const [, year, startStr, endStr] = match
      const start = parseInt(startStr, 10)
      const end = parseInt(endStr, 10)
      for (let n = start; n <= end; n++) {
        const id = `r${year}-${n}`
        if (!questionIds.has(id) && !addedIds.has(id)) {
          const linkedQ = ALL_QUESTIONS.find(aq => aq.id === id)
          if (linkedQ) {
            questions.push(linkedQ)
            addedIds.add(id)
          }
        }
      }
    }
    questions.sort((a, b) => a.year - b.year || a.question_number - b.question_number)

    if (randomOrder) {
      // Shuffle preserving linked_group sets
      const groups = new Map<string, Question[]>()
      const singles: Question[] = []
      for (const q of questions) {
        if (q.linked_group) {
          const group = groups.get(q.linked_group) ?? []
          group.push(q)
          groups.set(q.linked_group, group)
        } else {
          singles.push(q)
        }
      }
      const units: Question[][] = [
        ...singles.map(q => [q]),
        ...Array.from(groups.values()),
      ]
      for (let i = units.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [units[i], units[j]] = [units[j], units[i]]
      }
      questions = units.flat()
    }

    // Apply session count limit (respect linked_group boundaries)
    if (sessionCount > 0) {
      const limited: Question[] = []
      for (const q of questions) {
        if (limited.length >= sessionCount && !q.linked_group) break
        if (limited.length >= sessionCount && q.linked_group) {
          const lastQ = limited[limited.length - 1]
          if (lastQ?.linked_group !== q.linked_group) break
        }
        limited.push(q)
      }
      questions = limited
    }

    if (questions.length === 0) return

    // NOTE: QuestionPage reads 'practice_session' as string[] (plain ID array)
    localStorage.setItem('practice_session', JSON.stringify(questions.map(q => q.id)))
    navigate(`/practice/${questions[0].id}`)
  }

  return (
    <div className="sc-page">
      {/* Header */}
      <div className={styles.header}>
        <h1>💊 演習モード</h1>
        <p>{ALL_QUESTIONS.length.toLocaleString()}問から出題・11年分の過去問</p>
      </div>

      {/* Smart Presets */}
      <PresetCardGrid
        presets={PRESETS}
        activeId={activePreset}
        onSelect={handlePresetSelect}
      />

      {/* Subject chips */}
      <ChipFilter
        label="科目"
        items={SUBJECTS.map(s => ({ value: s, label: s }))}
        selected={selectedSubjects}
        onToggle={handleSubjectToggle}
      />

      {/* Sub-field chips (dynamic: 大項目 → 中項目の2階層) */}
      {selectedSubjects.map(subject => (
        <SubFieldChips
          key={subject}
          subject={subject}
          selectedMajors={selectedMajors[subject] ?? []}
          onToggleMajor={(majorName) => handleMajorToggle(subject, majorName)}
          selectedMiddles={selectedMiddles}
          onToggleMiddle={handleMiddleToggle}
        />
      ))}

      {/* Year chips */}
      <ChipFilter
        label="年度（回）"
        items={YEARS.map(y => ({ value: y, label: `第${y}回` }))}
        selected={selectedYears}
        onToggle={(y) => { setSelectedYears(prev => toggleArrayItem(prev, y)); setActivePreset(null) }}
      />

      {/* Section chips */}
      <ChipFilter
        label="区分"
        items={SECTIONS}
        selected={selectedSections}
        onToggle={(s) => { setSelectedSections(prev => toggleArrayItem(prev, s)); setActivePreset(null) }}
      />

      {/* Detail filter button */}
      <button
        type="button"
        className={styles.detailBtn}
        onClick={() => setBottomSheetOpen(true)}
      >
        🔍 詳細フィルター（正誤・キーワード・画像問題）
      </button>

      {/* Result bar */}
      <div className={styles.resultBar}>
        <div className={styles.resultCount}>
          <span>{filteredQuestions.length}</span> 問ヒット
        </div>
        <button
          type="button"
          className={styles.sortBtn}
          onClick={() => setRandomOrder(prev => !prev)}
        >
          {randomOrder ? '🔀 ランダム' : '▼ 年度順'}
        </button>
      </div>

      {/* Question cards (show first 20, respecting display order) */}
      {displayQuestions.slice(0, 20).map(q => (
        <QuestionCard
          key={q.id}
          question={q}
          status={getStatus(q)}
          fieldName={getFieldName(q)}
          onClick={() => {
            // Save full filtered list so QuestionPage can navigate prev/next
            localStorage.setItem('practice_session', JSON.stringify(displayQuestions.map(qq => qq.id)))
            navigate(`/practice/${q.id}`)
          }}
        />
      ))}

      {displayQuestions.length > 20 && (
        <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 12, margin: '16px 0' }}>
          他 {displayQuestions.length - 20} 問...「演習開始」で出題されます
        </p>
      )}

      {/* Bottom Sheet */}
      <BottomSheet
        open={bottomSheetOpen}
        onClose={() => setBottomSheetOpen(false)}
        title="詳細フィルター"
      >
        <div className={styles.filterGroup}>
          <div className={styles.filterLabel}>正誤ステータス</div>
          <div className={styles.statusBtns}>
            {([
              { value: 'all', label: '全て' },
              { value: 'correct', label: '○' },
              { value: 'incorrect', label: '✕' },
              { value: 'unanswered', label: '—' },
            ] as const).map(s => (
              <button
                key={s.value}
                type="button"
                className={`${styles.statusBtn} ${correctStatus === s.value ? styles.selected : ''}`}
                onClick={() => { setCorrectStatus(s.value); setActivePreset(null) }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.toggleRow}>
          <span className={styles.toggleLabel}>画像問題のみ</span>
          <button
            type="button"
            className={`${styles.toggle} ${imageOnly ? styles.on : ''}`}
            onClick={() => setImageOnly(prev => !prev)}
          />
        </div>

        <div className={styles.toggleRow}>
          <span className={styles.toggleLabel}>ランダム順</span>
          <button
            type="button"
            className={`${styles.toggle} ${randomOrder ? styles.on : ''}`}
            onClick={() => setRandomOrder(prev => !prev)}
          />
        </div>

        <div className={styles.filterGroup} style={{ marginTop: 16 }}>
          <div className={styles.filterLabel}>キーワード検索</div>
          <input
            type="text"
            className={styles.keywordInput}
            placeholder="問題文やタグで検索..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.filterLabel}>問題数</div>
          <div className={styles.statusBtns}>
            {([10, 20, 0] as const).map(n => (
              <button
                key={n}
                type="button"
                className={`${styles.statusBtn} ${sessionCount === n ? styles.selected : ''}`}
                onClick={() => setSessionCount(n)}
              >
                {n === 0 ? '全問' : `${n}問`}
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>

      {/* Sticky Action Bar */}
      <StickyActionBar
        count={sessionCount === 0 ? filteredQuestions.length : Math.min(sessionCount, filteredQuestions.length)}
        onStart={handleStartSession}
        onSettings={() => setBottomSheetOpen(true)}
      />

      <FloatingNav />
    </div>
  )
}
