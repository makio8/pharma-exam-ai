import { useState, useCallback, useRef, useEffect } from 'react'
import { AnnotationStateManager } from '../utils/AnnotationStateManager'
import type { NormalizedBbox, ExportJson } from '../types'

export function useAnnotationState(source: string, totalPages = 258) {
  const mgrRef = useRef<AnnotationStateManager>(new AnnotationStateManager(source))
  const [, forceUpdate] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerUpdate = useCallback(() => {
    forceUpdate(n => n + 1)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => mgrRef.current.flush(), 500)
  }, [])

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    mgrRef.current.flush()
  }, [])

  const addBbox = useCallback((pageId: string, bbox: NormalizedBbox) => {
    mgrRef.current.addBbox(pageId, bbox)
    triggerUpdate()
  }, [triggerUpdate])

  const removeBbox = useCallback((pageId: string, index: number) => {
    mgrRef.current.removeBbox(pageId, index)
    triggerUpdate()
  }, [triggerUpdate])

  const updateBbox = useCallback((pageId: string, index: number, bbox: NormalizedBbox) => {
    mgrRef.current.updateBbox(pageId, index, bbox)
    triggerUpdate()
  }, [triggerUpdate])

  const confirmPage = useCallback((pageId: string) => {
    mgrRef.current.confirmPage(pageId)
    mgrRef.current.flush()
    forceUpdate(n => n + 1)
  }, [])

  const skipPage = useCallback((pageId: string) => {
    mgrRef.current.skipPage(pageId)
    mgrRef.current.flush()
    forceUpdate(n => n + 1)
  }, [])

  const setLastPosition = useCallback((pageId: string) => {
    mgrRef.current.setLastPosition(pageId)
    mgrRef.current.flush()
  }, [])

  const getPageBboxes = useCallback((pageId: string): NormalizedBbox[] => {
    return mgrRef.current.getState().pages[pageId]?.bboxes ?? []
  }, [])

  const getPageStatus = useCallback((pageId: string) => {
    return mgrRef.current.getState().pages[pageId]?.status ?? null
  }, [])

  const exportJson = useCallback((totalPages: number): ExportJson => {
    return mgrRef.current.exportJson(totalPages)
  }, [])

  return {
    state: mgrRef.current.getState(),
    stats: mgrRef.current.getStats(totalPages),
    flushError: mgrRef.current.lastFlushError,
    addBbox, removeBbox, updateBbox,
    confirmPage, skipPage, setLastPosition,
    getPageBboxes, getPageStatus, exportJson,
  }
}
