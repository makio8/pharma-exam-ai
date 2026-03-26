// src/components/notes/FlashCardSection.tsx
// 付箋詳細ページの暗記カードセクション — カードプレビューリスト

import { useState } from 'react'
import type { FlashCardTemplate } from '../../types/flashcard-template'
import { CARD_FORMAT_CONFIG } from '../../types/flashcard-template'
import styles from './FlashCardSection.module.css'

interface Props {
  cards: FlashCardTemplate[]
}

export function FlashCardSection({ cards }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (cards.length === 0) {
    return (
      <section>
        <h3 className={styles.title}>暗記カード</h3>
        <div className={styles.empty}>関連カードはまだありません</div>
      </section>
    )
  }

  return (
    <section>
      <h3 className={styles.title}>暗記カード ({cards.length}枚)</h3>
      <div className={styles.list}>
        {cards.map((card) => {
          const config = CARD_FORMAT_CONFIG[card.format]
          const isOpen = expandedId === card.id
          return (
            <button
              key={card.id}
              type="button"
              className={styles.card}
              onClick={() => setExpandedId(isOpen ? null : card.id)}
              aria-expanded={isOpen}
            >
              <div className={styles.cardFront}>
                <span className={styles.emoji}>{config.emoji}</span>
                <span className={styles.frontText}>{card.front}</span>
                <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
                  ▶
                </span>
              </div>
              {isOpen && (
                <div className={styles.cardBack}>{card.back}</div>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
