import { useEffect, useRef } from 'react'
import type { JudgmentStatus } from '../types'

export interface FusenKeyboardNavActions {
  onNext: () => void
  onPrev: () => void
  onJudge: (status: JudgmentStatus) => void
  onResetJudgment: () => void
  onJumpToNextUnresolved: () => void
  onToggleHelp: () => void
}

export function useFusenKeyboardNav(actions: FusenKeyboardNavActions) {
  const actionsRef = useRef(actions)
  actionsRef.current = actions

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const a = actionsRef.current

      switch (e.key) {
        case 'j': case 'J': case 'ArrowRight':
          e.preventDefault(); a.onNext(); break
        case 'k': case 'K': case 'ArrowLeft':
          e.preventDefault(); a.onPrev(); break
        case '1': a.onJudge('ok'); break
        case '2': a.onJudge('needs-fix'); break
        case '3': a.onJudge('ng'); break
        case '0': a.onResetJudgment(); break
        case 'g': case 'G': a.onJumpToNextUnresolved(); break
        case '?': a.onToggleHelp(); break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
