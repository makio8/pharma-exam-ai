import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTopicMastery } from '../../hooks/useTopicMastery'
import { EXAM_BLUEPRINT } from '../../data/exam-blueprint'
import { ProgressBar } from './ProgressBar'
import type { QuestionSubject } from '../../types/question'
import styles from './SubjectMastery.module.css'

const ALL_SUBJECTS: QuestionSubject[] = [
  '物理', '化学', '生物', '衛生', '薬理', '薬剤', '病態・薬物治療', '法規・制度・倫理', '実務',
]

function statusColor(pct: number): string {
  if (pct === 0) return 'var(--text-3)'
  if (pct >= 70) return 'var(--ok)'
  if (pct >= 30) return 'var(--warn)'
  return 'var(--ng)'
}

function statusIcon(pct: number): string {
  if (pct >= 70) return '✅'
  if (pct >= 30) return '📘'
  if (pct > 0) return '⚠️'
  return '🔲'
}

interface MajorGroup {
  name: string
  avgCorrectRate: number
}

export function SubjectMastery() {
  const navigate = useNavigate()
  const { topicsBySubject, getSubjectSummary } = useTopicMastery()
  const [expandedSubject, setExpandedSubject] = useState<QuestionSubject | null>(null)

  // Group topics by MajorCategory for expanded view
  const getMajorGroups = (subject: QuestionSubject): MajorGroup[] => {
    const blueprint = EXAM_BLUEPRINT.find(b => b.subject === subject)
    if (!blueprint) return []

    const topics = topicsBySubject[subject] ?? []
    return blueprint.majorCategories.map(major => {
      const middleIds = new Set(major.middleCategories.map(mc => mc.id))
      const groupTopics = topics.filter(t => middleIds.has(t.topicId))
      const answered = groupTopics.filter(t => t.answeredQuestions > 0)
      const avgRate = answered.length > 0
        ? answered.reduce((sum, t) => sum + t.correctRate, 0) / answered.length
        : 0
      return { name: major.name, avgCorrectRate: Math.round(avgRate * 100) }
    })
  }

  return (
    <div className={styles.card}>
      {ALL_SUBJECTS.map(subject => {
        const summary = getSubjectSummary(subject)
        const pct = summary.total > 0
          ? Math.round(((summary.mastered + summary.almost * 0.7) / summary.total) * 100)
          : 0
        const isExpanded = expandedSubject === subject

        return (
          <div key={subject} className={styles.row}>
            <div
              className={styles.header}
              onClick={() => setExpandedSubject(isExpanded ? null : subject)}
            >
              <span className={styles.name}>
                {isExpanded ? '▼' : '▶'} {subject}
              </span>
              <span className={styles.pct} style={{ color: statusColor(pct) }}>
                {pct}%
              </span>
            </div>
            <ProgressBar percent={pct} />

            {isExpanded && (
              <div className={styles.subFields}>
                {getMajorGroups(subject).map(group => (
                  <div key={group.name} className={styles.subField}>
                    <span className={styles.sfName}>{group.name}</span>
                    <div className={styles.sfBar}>
                      <div
                        className={styles.sfFill}
                        style={{
                          width: `${group.avgCorrectRate}%`,
                          background: statusColor(group.avgCorrectRate),
                        }}
                      />
                    </div>
                    <span className={styles.sfPct} style={{ color: statusColor(group.avgCorrectRate) }}>
                      {group.avgCorrectRate}%
                    </span>
                    <span>{statusIcon(group.avgCorrectRate)}</span>
                    {group.avgCorrectRate < 70 && (
                      <button
                        className={styles.sfLink}
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate('/practice') // TODO: pass field filter as state
                        }}
                      >
                        演習→
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
