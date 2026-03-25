// src/dev-tools/fusen-annotate/utils/AnnotationStateManager.ts
import type {
  AnnotationState, NormalizedBbox, ExportJson, ExportPage,
} from '../types'

const STORAGE_KEY = 'fusen-annotate-v1'

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

const initialState = (source: string): AnnotationState => ({
  version: 1,
  source,
  pages: {},
  lastPosition: '',
  updatedAt: new Date().toISOString(),
})

export class AnnotationStateManager {
  private state: AnnotationState
  private storage: StorageLike

  constructor(source: string, storage?: StorageLike) {
    this.storage = storage ?? localStorage
    this.state = this.load(source)
  }

  private load(source: string): AnnotationState {
    try {
      const raw = this.storage.getItem(STORAGE_KEY)
      if (!raw) return initialState(source)
      const parsed = JSON.parse(raw) as AnnotationState
      if (parsed.version !== 1) return initialState(source)
      return parsed
    } catch {
      return initialState(source)
    }
  }

  getState(): Readonly<AnnotationState> {
    return this.state
  }

  flush(): void {
    this.state.updatedAt = new Date().toISOString()
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    } catch (e) {
      console.error('localStorage保存失敗:', e)
    }
  }

  private ensurePage(pageId: string) {
    if (!this.state.pages[pageId]) {
      this.state.pages[pageId] = { status: 'in-progress', bboxes: [] }
    }
  }

  addBbox(pageId: string, bbox: NormalizedBbox): void {
    this.ensurePage(pageId)
    this.state.pages[pageId].bboxes.push(bbox)
    this.state.pages[pageId].status = 'in-progress'
  }

  removeBbox(pageId: string, index: number): void {
    const page = this.state.pages[pageId]
    if (!page) return
    page.bboxes.splice(index, 1)
    page.status = 'in-progress'
  }

  updateBbox(pageId: string, index: number, bbox: NormalizedBbox): void {
    const page = this.state.pages[pageId]
    if (!page || index < 0 || index >= page.bboxes.length) return
    page.bboxes[index] = bbox
    page.status = 'in-progress'
  }

  confirmPage(pageId: string): void {
    this.ensurePage(pageId)
    this.state.pages[pageId].status = 'done'
  }

  skipPage(pageId: string): void {
    this.ensurePage(pageId)
    this.state.pages[pageId].status = 'skipped'
    this.state.pages[pageId].bboxes = []
  }

  setLastPosition(pageId: string): void {
    this.state.lastPosition = pageId
  }

  getStats(totalPages: number) {
    const pages = Object.values(this.state.pages)
    const done = pages.filter(p => p.status === 'done').length
    const skipped = pages.filter(p => p.status === 'skipped').length
    return { done, skipped, remaining: totalPages - done - skipped }
  }

  static parsePageId(pageId: string): { spreadPage: number; side: 'left' | 'right' } {
    const match = pageId.match(/^page-(\d+)-(left|right)$/)
    if (!match) throw new Error(`Invalid pageId: ${pageId}`)
    return { spreadPage: parseInt(match[1], 10), side: match[2] as 'left' | 'right' }
  }

  exportJson(totalPages: number): ExportJson {
    const exportPages: ExportPage[] = []
    let annotatedPages = 0
    let skippedPages = 0
    let totalBboxes = 0

    for (const [pageId, page] of Object.entries(this.state.pages)) {
      if (page.status === 'in-progress') continue
      const { spreadPage, side } = AnnotationStateManager.parsePageId(pageId)
      const bboxes = page.bboxes.map((bbox, i) => ({ noteIndex: i, bbox }))

      if (page.status === 'done') { annotatedPages++; totalBboxes += bboxes.length }
      if (page.status === 'skipped') skippedPages++

      exportPages.push({ pageId, spreadPage, side, status: page.status, bboxes })
    }

    exportPages.sort((a, b) => a.pageId.localeCompare(b.pageId))

    return {
      version: '1.0.0',
      source: this.state.source,
      exportedAt: new Date().toISOString(),
      summary: { totalPages, annotatedPages, skippedPages, totalBboxes },
      pages: exportPages,
    }
  }
}
