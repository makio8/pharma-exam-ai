// src/dev-tools/fusen-annotate/utils/__tests__/AnnotationStateManager.test.ts
import { AnnotationStateManager } from '../AnnotationStateManager'
import type { NormalizedBbox, AnnotationState } from '../../types'

const createMockStorage = () => {
  const store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val },
    removeItem: (key: string) => { delete store[key] },
    store,
  }
}

describe('AnnotationStateManager', () => {
  describe('初期化', () => {
    it('空のlocalStorageから初期状態を作成する', () => {
      const storage = createMockStorage()
      const mgr = new AnnotationStateManager('makio', storage)
      const state = mgr.getState()
      expect(state.version).toBe(1)
      expect(state.source).toBe('makio')
      expect(Object.keys(state.pages)).toHaveLength(0)
      expect(state.lastPosition).toBe('')
    })

    it('既存のlocalStorageから復元する', () => {
      const storage = createMockStorage()
      const saved: AnnotationState = {
        version: 1,
        source: 'makio',
        pages: { 'page-001-left': { status: 'done', bboxes: [[100, 100, 400, 400]] } },
        lastPosition: 'page-001-left',
        updatedAt: '2026-03-25T00:00:00Z',
      }
      storage.setItem('fusen-annotate-v1', JSON.stringify(saved))
      const mgr = new AnnotationStateManager('makio', storage)
      expect(mgr.getState().pages['page-001-left'].status).toBe('done')
    })
  })

  describe('bbox操作', () => {
    it('addBboxでin-progress状態にしてbboxを追加する', () => {
      const storage = createMockStorage()
      const mgr = new AnnotationStateManager('makio', storage)
      const bbox: NormalizedBbox = [100, 100, 400, 400]
      mgr.addBbox('page-001-left', bbox)
      const page = mgr.getState().pages['page-001-left']
      expect(page.status).toBe('in-progress')
      expect(page.bboxes).toHaveLength(1)
      expect(page.bboxes[0]).toEqual(bbox)
    })

    it('removeBboxでbboxを削除する', () => {
      const storage = createMockStorage()
      const mgr = new AnnotationStateManager('makio', storage)
      mgr.addBbox('page-001-left', [100, 100, 200, 200])
      mgr.addBbox('page-001-left', [300, 300, 500, 500])
      mgr.removeBbox('page-001-left', 0)
      const page = mgr.getState().pages['page-001-left']
      expect(page.bboxes).toHaveLength(1)
      expect(page.bboxes[0]).toEqual([300, 300, 500, 500])
    })

    it('updateBboxでbboxを更新する（移動用）', () => {
      const storage = createMockStorage()
      const mgr = new AnnotationStateManager('makio', storage)
      mgr.addBbox('page-001-left', [100, 100, 200, 200])
      mgr.updateBbox('page-001-left', 0, [150, 150, 250, 250])
      expect(mgr.getState().pages['page-001-left'].bboxes[0]).toEqual([150, 150, 250, 250])
    })
  })

  describe('ページ状態', () => {
    it('confirmPageでdone状態にする', () => {
      const storage = createMockStorage()
      const mgr = new AnnotationStateManager('makio', storage)
      mgr.addBbox('page-001-left', [100, 100, 400, 400])
      mgr.confirmPage('page-001-left')
      expect(mgr.getState().pages['page-001-left'].status).toBe('done')
    })

    it('skipPageでskipped状態にしてbboxesをクリアする', () => {
      const storage = createMockStorage()
      const mgr = new AnnotationStateManager('makio', storage)
      mgr.addBbox('page-001-left', [100, 100, 400, 400])
      mgr.skipPage('page-001-left')
      const page = mgr.getState().pages['page-001-left']
      expect(page.status).toBe('skipped')
      expect(page.bboxes).toHaveLength(0)
    })

    it('doneページを再訪問してbbox追加するとin-progressに戻る', () => {
      const storage = createMockStorage()
      const mgr = new AnnotationStateManager('makio', storage)
      mgr.addBbox('page-001-left', [100, 100, 400, 400])
      mgr.confirmPage('page-001-left')
      mgr.addBbox('page-001-left', [500, 500, 600, 600])
      expect(mgr.getState().pages['page-001-left'].status).toBe('in-progress')
    })
  })

  describe('エクスポート', () => {
    it('done/skippedページのみエクスポートされる', () => {
      const storage = createMockStorage()
      const mgr = new AnnotationStateManager('makio', storage)
      mgr.addBbox('page-001-left', [100, 100, 400, 400])
      mgr.confirmPage('page-001-left')
      mgr.skipPage('page-001-right')
      mgr.addBbox('page-002-left', [200, 200, 300, 300]) // in-progress → 除外

      const json = mgr.exportJson(258)
      expect(json.pages).toHaveLength(2)
      expect(json.summary.annotatedPages).toBe(1)
      expect(json.summary.skippedPages).toBe(1)
      expect(json.summary.totalBboxes).toBe(1)
    })

    it('spreadPageとsideが正しく分解される', () => {
      const storage = createMockStorage()
      const mgr = new AnnotationStateManager('makio', storage)
      mgr.addBbox('page-003-left', [100, 100, 400, 400])
      mgr.confirmPage('page-003-left')
      const json = mgr.exportJson(258)
      expect(json.pages[0].spreadPage).toBe(3)
      expect(json.pages[0].side).toBe('left')
    })

    it('bboxesにnoteIndexが付与される', () => {
      const storage = createMockStorage()
      const mgr = new AnnotationStateManager('makio', storage)
      mgr.addBbox('page-001-left', [100, 100, 200, 200])
      mgr.addBbox('page-001-left', [300, 300, 500, 500])
      mgr.confirmPage('page-001-left')
      const json = mgr.exportJson(258)
      expect(json.pages[0].bboxes[0].noteIndex).toBe(0)
      expect(json.pages[0].bboxes[1].noteIndex).toBe(1)
    })
  })

  describe('永続化', () => {
    it('flushでlocalStorageに保存される', () => {
      const storage = createMockStorage()
      const mgr = new AnnotationStateManager('makio', storage)
      mgr.addBbox('page-001-left', [100, 100, 400, 400])
      mgr.flush()
      const saved = JSON.parse(storage.store['fusen-annotate-v1'])
      expect(saved.pages['page-001-left'].bboxes).toHaveLength(1)
    })

    it('setLastPositionで最終位置を保存する', () => {
      const storage = createMockStorage()
      const mgr = new AnnotationStateManager('makio', storage)
      mgr.setLastPosition('page-005-right')
      mgr.flush()
      expect(mgr.getState().lastPosition).toBe('page-005-right')
    })
  })

  describe('parsePageId', () => {
    it('page-001-leftを正しく分解する', () => {
      const result = AnnotationStateManager.parsePageId('page-001-left')
      expect(result).toEqual({ spreadPage: 1, side: 'left' })
    })

    it('page-065-rightを正しく分解する', () => {
      const result = AnnotationStateManager.parsePageId('page-065-right')
      expect(result).toEqual({ spreadPage: 65, side: 'right' })
    })

    it('不正なpageIdでエラーを投げる', () => {
      expect(() => AnnotationStateManager.parsePageId('invalid')).toThrow()
    })
  })

  describe('統計', () => {
    it('getStatsで進捗を取得する', () => {
      const storage = createMockStorage()
      const mgr = new AnnotationStateManager('makio', storage)
      mgr.addBbox('page-001-left', [100, 100, 400, 400])
      mgr.confirmPage('page-001-left')
      mgr.skipPage('page-001-right')
      const stats = mgr.getStats(258)
      expect(stats.done).toBe(1)
      expect(stats.skipped).toBe(1)
      expect(stats.remaining).toBe(256)
    })
  })
})
