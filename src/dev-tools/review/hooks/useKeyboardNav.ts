import { useEffect, useRef } from 'react'
import type { JudgmentStatus } from '../types'

export interface KeyboardNavActions {
  onNext: () => void
  onPrev: () => void
  onJudge: (status: JudgmentStatus) => void
  onResetJudgment: () => void
  onToggleFilter: () => void
  onToggleCorrection: () => void
  onSkip: () => void
  onJumpToNextUnresolved: () => void
  onExport: () => void
  onPdfPrev: () => void
  onPdfNext: () => void
  onSearch: () => void
  onToggleHelp: () => void
}

/**
 * レビューUIの全キーボードショートカットを統合管理するフック。
 * actions オブジェクトは毎レンダーで変わっても、ref 経由で常に最新値を呼び出すため
 * addEventListener の付け直しは発生しない。
 */
export function useKeyboardNav(actions: KeyboardNavActions) {
  // ref に最新の actions を同期（イベントリスナーは初回のみ登録）
  const actionsRef = useRef(actions)
  actionsRef.current = actions

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const a = actionsRef.current

      switch (e.key) {
        // ナビゲーション
        case 'j':
        case 'J':
        case 'ArrowRight':
          e.preventDefault()
          a.onNext()
          break
        case 'k':
        case 'K':
        case 'ArrowLeft':
          e.preventDefault()
          a.onPrev()
          break

        // 判定
        case '1':
          a.onJudge('ok')
          break
        case '2':
          a.onJudge('needs-fix')
          break
        case '3':
          a.onJudge('ng')
          break
        case '0':
          a.onResetJudgment()
          break

        // パネル開閉
        case 'f':
        case 'F':
          a.onToggleFilter()
          break
        case 'c':
        case 'C':
          a.onToggleCorrection()
          break

        // スキップ / ジャンプ
        case 's':
        case 'S':
          a.onSkip()
          break
        case 'g':
        case 'G':
          a.onJumpToNextUnresolved()
          break

        // エクスポート
        case 'e':
        case 'E':
          a.onExport()
          break

        // PDF ページ
        case 'p':
        case 'P':
          e.preventDefault()
          a.onPdfPrev()
          break
        case 'n':
        case 'N':
          e.preventDefault()
          a.onPdfNext()
          break

        // 検索 / ヘルプ
        case '/':
          e.preventDefault()
          a.onSearch()
          break
        case '?':
          a.onToggleHelp()
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, []) // マウント時のみ登録。最新 actions は actionsRef 経由で参照
}
