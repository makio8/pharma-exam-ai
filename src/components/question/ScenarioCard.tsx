// 連問の共通シナリオ表示コンポーネント
import { QuestionBody } from './QuestionBody'
import { normalizeForDisplay } from '../../utils/text-normalizer'
import styles from './ScenarioCard.module.css'

interface Props {
  scenario: string
  totalQuestions: number
  scenarioImageUrls?: string[]
}

export function ScenarioCard({ scenario, totalQuestions, scenarioImageUrls }: Props) {
  return (
    <div className={styles.card}>
      <p className={styles.label}>
        📋 連問（{totalQuestions}問セット）
      </p>
      {scenario && (
        <QuestionBody
          bodyText={normalizeForDisplay(scenario)}
          inlineImageUrls={scenarioImageUrls}
          displayMode="text"
        />
      )}
    </div>
  )
}
