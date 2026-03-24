// 連問グループを1ページで縦スクロール表示
import { useMemo } from 'react'
import type { LinkedGroup } from '../hooks/useLinkedQuestions'
import { useAnswerHistory } from '../hooks/useAnswerHistory'
import { ScenarioCard, LinkedQuestionItem } from './question'

interface Props {
  group: LinkedGroup
}

/**
 * 連問グループを1ページで縦スクロール表示
 * - 共通シナリオを ScenarioCard で1回だけ表示
 * - 各問題を LinkedQuestionItem で独立管理
 * - useAnswerHistory は親で1回だけ呼び、子に props で渡す（N回ロード防止）
 */
export function LinkedQuestionViewer({ group }: Props) {
  const { history, saveAnswer, getQuestionResult } = useAnswerHistory()

  // useMemo で参照安定化（子コンポーネントの不要な再レンダリング防止）
  const externalHistory = useMemo(
    () => ({ history, saveAnswer, getQuestionResult }),
    [history, saveAnswer, getQuestionResult],
  )

  return (
    <div>
      <ScenarioCard
        scenario={group.scenario}
        totalQuestions={group.questions.length}
      />
      {group.questions.map((q, i) => (
        <LinkedQuestionItem
          key={q.id}
          question={q}
          questionIndex={i + 1}
          totalInGroup={group.questions.length}
          scenario={group.scenario}
          externalHistory={externalHistory}
        />
      ))}
    </div>
  )
}
