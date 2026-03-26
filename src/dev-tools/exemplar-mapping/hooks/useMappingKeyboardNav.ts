import { useEffect, useRef } from 'react'

export interface MappingKeyboardNavActions {
  onNext: () => void
  onPrev: () => void
  onApprove: () => void
  onModified: () => void
  onReject: () => void
  onReset: () => void
  onJumpToNextUnresolved: () => void
  onExport: () => void
  onToggleHelp: () => void
}

export function useMappingKeyboardNav(actions: MappingKeyboardNavActions) {
  const actionsRef = useRef(actions)
  actionsRef.current = actions

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const interactive = (e.target as HTMLElement).closest(
        'button, summary, [contenteditable], input, textarea, select'
      )
      if (interactive) return

      const a = actionsRef.current

      switch (e.key) {
        case 'j': case 'J': case 'ArrowRight':
          e.preventDefault(); a.onNext(); break
        case 'k': case 'K': case 'ArrowLeft':
          e.preventDefault(); a.onPrev(); break
        case '1': a.onApprove(); break
        case '2': a.onModified(); break
        case '3': a.onReject(); break
        case '0': a.onReset(); break
        case 'g': case 'G': a.onJumpToNextUnresolved(); break
        case 'e': case 'E': a.onExport(); break
        case '?': a.onToggleHelp(); break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
