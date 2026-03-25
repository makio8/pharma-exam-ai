import { useEffect, useRef } from 'react'

interface KeyboardActions {
  prevPage: () => void
  nextPage: () => void
  confirm: () => void
  skip: () => void
  jumpToUnfinished: () => void
  undo: () => void
  deleteBbox: () => void
  exportData: () => void
  toggleHelp: () => void
}

export function useAnnotateKeyboard(
  actions: KeyboardActions,
  isDrawing: boolean,
) {
  const actionsRef = useRef(actions)
  actionsRef.current = actions

  const isDrawingRef = useRef(isDrawing)
  isDrawingRef.current = isDrawing

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isDrawingRef.current) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const a = actionsRef.current
      switch (e.key) {
        case 'ArrowLeft': a.prevPage(); break
        case 'ArrowRight': a.nextPage(); break
        case 'Enter': a.confirm(); e.preventDefault(); break
        case 's': case 'S': a.skip(); break
        case 'g': case 'G': a.jumpToUnfinished(); break
        case 'e': case 'E': a.exportData(); break
        case '?': a.toggleHelp(); break
        case 'Delete': case 'Backspace': a.deleteBbox(); e.preventDefault(); break
        case 'z':
          if (e.ctrlKey || e.metaKey) { a.undo(); e.preventDefault() }
          break
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])
}
