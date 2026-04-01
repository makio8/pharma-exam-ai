// src/hooks/useUnifiedTemplates.ts
// 構造式カード（同期 730枚）とテキストカード（非同期 3,516枚）を統合する単一フック

import { useState, useEffect, useMemo, useCallback } from 'react'
import { FLASHCARD_TEMPLATES } from '../data/flashcard-templates'
import { loadAllCardTemplates } from '../data/generated-cards/index'
import type { FlashCardTemplate } from '../types/flashcard-template'

// モジュールレベルキャッシュ: 2回目以降は即返却
let textCardsCache: FlashCardTemplate[] | null = null

/** テストや HMR でキャッシュをリセットする（先頭アンダースコアで内部用）*/
export function _resetCacheForTesting(): void {
  textCardsCache = null
}

export function useUnifiedTemplates(): {
  allTemplates: FlashCardTemplate[]
  loading: boolean
  error: string | null
  getTemplate: (id: string) => FlashCardTemplate | undefined
  templatesById: Map<string, FlashCardTemplate>
  retry: () => void
} {
  // loading 中は FLASHCARD_TEMPLATES（730枚）のみ。完了後に統合リストへ切り替え
  const [allTemplates, setAllTemplates] = useState<FlashCardTemplate[]>(FLASHCARD_TEMPLATES)
  const [loading, setLoading] = useState<boolean>(textCardsCache === null)
  const [error, setError] = useState<string | null>(null)
  // retryKey を変えることで useEffect を再実行してキャッシュクリア→再読み込みを実現
  const [retryKey, setRetryKey] = useState<number>(0)

  useEffect(() => {
    // キャッシュ済みなら即マージして終了
    if (textCardsCache !== null) {
      setAllTemplates([...FLASHCARD_TEMPLATES, ...textCardsCache])
      setLoading(false)
      return
    }

    let cancelled = false

    setLoading(true)
    setError(null)

    loadAllCardTemplates()
      .then((textCards) => {
        if (cancelled) return
        textCardsCache = textCards
        setAllTemplates([...FLASHCARD_TEMPLATES, ...textCards])
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : 'テキストカードの読み込みに失敗しました'
        setError(message)
        // 構造式 730 枚だけで続行可能
        setAllTemplates(FLASHCARD_TEMPLATES)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [retryKey])

  // allTemplates が変わるたびに Map を再構築
  const templatesById = useMemo<Map<string, FlashCardTemplate>>(() => {
    const map = new Map<string, FlashCardTemplate>()
    for (const t of allTemplates) {
      map.set(t.id, t)
    }
    return map
  }, [allTemplates])

  const getTemplate = useCallback(
    (id: string): FlashCardTemplate | undefined => templatesById.get(id),
    [templatesById],
  )

  const retry = useCallback(() => {
    textCardsCache = null
    setRetryKey((k) => k + 1)
  }, [])

  return { allTemplates, loading, error, getTemplate, templatesById, retry }
}
