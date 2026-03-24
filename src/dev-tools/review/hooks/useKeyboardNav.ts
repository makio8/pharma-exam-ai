import { useEffect } from 'react'
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

export function useKeyboardNav(actions: KeyboardNavActions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      switch (e.key) {
        // ナビゲーション
        case 'j':
        case 'J':
        case 'ArrowRight':
          e.preventDefault()
          actions.onNext()
          break
        case 'k':
        case 'K':
        case 'ArrowLeft':
          e.preventDefault()
          actions.onPrev()
          break

        // 判定
        case '1':
          actions.onJudge('ok')
          break
        case '2':
          actions.onJudge('needs-fix')
          break
        case '3':
          actions.onJudge('ng')
          break
        case '0':
          actions.onResetJudgment()
          break

        // パネル開閉
        case 'f':
        case 'F':
          actions.onToggleFilter()
          break
        case 'c':
        case 'C':
          actions.onToggleCorrection()
          break

        // スキップ / ジャンプ
        case 's':
        case 'S':
          actions.onSkip()
          break
        case 'g':
        case 'G':
          actions.onJumpToNextUnresolved()
          break

        // エクスポート
        case 'e':
        case 'E':
          actions.onExport()
          break

        // PDF ページ
        case 'p':
        case 'P':
          e.preventDefault()
          actions.onPdfPrev()
          break
        case 'n':
        case 'N':
          e.preventDefault()
          actions.onPdfNext()
          break

        // 検索 / ヘルプ
        case '/':
          e.preventDefault()
          actions.onSearch()
          break
        case '?':
          actions.onToggleHelp()
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [actions])
}
