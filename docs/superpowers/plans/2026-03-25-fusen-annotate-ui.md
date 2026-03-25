# 付箋アノテーションUI（Phase 2a）実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ページ画像上で付箋のbbox矩形を人間が描画するアノテーションUIを構築する

**Architecture:** split-pages.ts で見開き画像を左右分割 → `/dev-tools/fusen-annotate` でCanvas上にbbox描画 → エクスポートJSONで座標出力。ビジネスロジックはクラスに分離してテスト（CanvasDrawManager, AnnotationStateManager）。既存 fusen-review パターンを踏襲。

**Tech Stack:** React 19 / TypeScript 5.9 / Vite 8 / CSS Modules / HTML Canvas API / sharp（スクリプト用）/ Vitest

**Spec:** `docs/superpowers/specs/2026-03-25-fusen-annotate-ui-design.md`

---

## ファイル構成

### 新規作成

| ファイル | 責務 |
|---------|------|
| `src/dev-tools/fusen-annotate/types.ts` | 型定義（NormalizedBbox, AnnotationState, PageAnnotation, ExportBbox, SourceMeta） |
| `src/dev-tools/fusen-annotate/utils/CanvasDrawManager.ts` | bbox描画・選択・移動のロジック（純粋クラス、Canvas非依存） |
| `src/dev-tools/fusen-annotate/utils/AnnotationStateManager.ts` | localStorage永続化 + デバウンス + エクスポートJSON生成 |
| `src/dev-tools/fusen-annotate/utils/drawBboxes.ts` | Canvas描画ユーティリティ（枠線・番号バッジ・選択ハイライト） |
| `src/dev-tools/fusen-annotate/utils/__tests__/CanvasDrawManager.test.ts` | CanvasDrawManagerのテスト |
| `src/dev-tools/fusen-annotate/utils/__tests__/AnnotationStateManager.test.ts` | AnnotationStateManagerのテスト |
| `src/dev-tools/fusen-annotate/hooks/useCanvasDraw.ts` | CanvasDrawManagerのReactラッパー |
| `src/dev-tools/fusen-annotate/hooks/useAnnotationState.ts` | AnnotationStateManagerのReactラッパー |
| `src/dev-tools/fusen-annotate/hooks/useAnnotateKeyboard.ts` | キーボードショートカット（isDrawingガード付き） |
| `src/dev-tools/fusen-annotate/components/AnnotateCanvas.tsx` | 画像表示 + bbox描画Canvas |
| `src/dev-tools/fusen-annotate/components/AnnotateCanvas.module.css` | Canvas styles |
| `src/dev-tools/fusen-annotate/components/AnnotateToolbar.tsx` | 下部アクションバー |
| `src/dev-tools/fusen-annotate/components/AnnotateToolbar.module.css` | Toolbar styles |
| `src/dev-tools/fusen-annotate/components/AnnotateHeader.tsx` | ページ送り・進捗 |
| `src/dev-tools/fusen-annotate/components/AnnotateHeader.module.css` | Header styles |
| `src/dev-tools/fusen-annotate/FusenAnnotatePage.tsx` | メインオーケストレーター |
| `src/dev-tools/fusen-annotate/FusenAnnotatePage.module.css` | Page styles |
| `scripts/split-pages.ts` | 見開き画像→左右分割スクリプト |
| `scripts/lib/split-pages-core.ts` | split-pagesコアロジック（テスト可能な純粋関数） |
| `scripts/lib/__tests__/split-pages.test.ts` | split-pages のテスト |

### 変更

| ファイル | 変更内容 |
|---------|---------|
| `src/routes.tsx` | `/dev-tools/fusen-annotate` の dev-only ルート追加 |

---

## Task 1: 型定義

**Files:**
- Create: `src/dev-tools/fusen-annotate/types.ts`

- [ ] **Step 1: 型定義ファイルを作成**

```typescript
// src/dev-tools/fusen-annotate/types.ts

// [y1, x1, y2, x2] — 0〜1000正規化、top-left原点
// 既存 FusenSource.bbox / ocr-fusens.ts と同じスケール
export type NormalizedBbox = [number, number, number, number]

export type PageStatus = 'in-progress' | 'done' | 'skipped'

export interface PageAnnotation {
  status: PageStatus
  bboxes: NormalizedBbox[]
}

export interface AnnotationState {
  version: 1
  source: string
  pages: Record<string, PageAnnotation>
  lastPosition: string
  updatedAt: string
}

// エクスポート用（noteIndex 明示）
export interface ExportBbox {
  noteIndex: number
  bbox: NormalizedBbox
}

export interface ExportPage {
  pageId: string
  spreadPage: number
  side: 'left' | 'right'
  status: 'done' | 'skipped'
  bboxes: ExportBbox[]
}

export interface ExportJson {
  version: '1.0.0'
  source: string
  exportedAt: string
  summary: {
    totalPages: number
    annotatedPages: number
    skippedPages: number
    totalBboxes: number
  }
  pages: ExportPage[]
}

export interface SourceMeta {
  name: string
  pdf: string
  totalPages: number
  splitImages: number
  createdAt: string
}
```

- [ ] **Step 2: コミット**

```bash
git add src/dev-tools/fusen-annotate/types.ts
git commit -m "feat: 付箋アノテーションUI型定義を追加"
```

---

## Task 2: CanvasDrawManager — テスト

**Files:**
- Create: `src/dev-tools/fusen-annotate/utils/__tests__/CanvasDrawManager.test.ts`

- [ ] **Step 1: テストファイルを作成**

```typescript
// src/dev-tools/fusen-annotate/utils/__tests__/CanvasDrawManager.test.ts
import { CanvasDrawManager } from '../CanvasDrawManager'
import type { NormalizedBbox } from '../../types'

describe('CanvasDrawManager', () => {
  const canvasSize = { width: 500, height: 700 }

  describe('normalizeCoords', () => {
    it('ピクセル座標を0-1000正規化に変換する', () => {
      const mgr = new CanvasDrawManager(canvasSize)
      // x=250 (center), y=350 (center) → 500, 500
      const result = mgr.normalizeCoords(250, 350)
      expect(result).toEqual([500, 500])
    })

    it('座標が0-1000の範囲にクランプされる', () => {
      const mgr = new CanvasDrawManager(canvasSize)
      const result = mgr.normalizeCoords(-10, 800)
      expect(result[0]).toBe(0)    // x clamped to 0
      expect(result[1]).toBe(1000) // y clamped to 1000
    })
  })

  describe('createBbox', () => {
    it('ドラッグ開始/終了からNormalizedBboxを生成する', () => {
      const mgr = new CanvasDrawManager(canvasSize)
      // ドラッグ: (50,70) → (200,280) ピクセル
      const bbox = mgr.createBbox(50, 70, 200, 280)
      // y1=70/700*1000=100, x1=50/500*1000=100, y2=280/700*1000=400, x2=200/500*1000=400
      expect(bbox).toEqual([100, 100, 400, 400])
    })

    it('逆方向ドラッグでもy1<y2, x1<x2が保証される', () => {
      const mgr = new CanvasDrawManager(canvasSize)
      const bbox = mgr.createBbox(200, 280, 50, 70)
      expect(bbox![0]).toBeLessThan(bbox![2]) // y1 < y2
      expect(bbox![1]).toBeLessThan(bbox![3]) // x1 < x2
    })

    it('最小サイズ未満はnullを返す', () => {
      const mgr = new CanvasDrawManager(canvasSize)
      const bbox = mgr.createBbox(100, 100, 105, 105) // 5x5px → too small
      expect(bbox).toBeNull()
    })
  })

  describe('hitTest', () => {
    it('座標がbbox内ならインデックスを返す', () => {
      const mgr = new CanvasDrawManager(canvasSize)
      const bboxes: NormalizedBbox[] = [[100, 100, 400, 400]]
      // ピクセル (150, 175) → normalized (300, 250) → bbox [100,100,400,400] 内
      const idx = mgr.hitTest(150, 175, bboxes)
      expect(idx).toBe(0)
    })

    it('bbox外ならnullを返す', () => {
      const mgr = new CanvasDrawManager(canvasSize)
      const bboxes: NormalizedBbox[] = [[100, 100, 400, 400]]
      const idx = mgr.hitTest(5, 5, bboxes) // 左上隅 → 外
      expect(idx).toBeNull()
    })

    it('複数bboxが重なる場合、後に描画された方（大きいindex）を返す', () => {
      const mgr = new CanvasDrawManager(canvasSize)
      const bboxes: NormalizedBbox[] = [
        [0, 0, 500, 500],
        [100, 100, 400, 400],
      ]
      const idx = mgr.hitTest(150, 175, bboxes) // 両方に含まれる
      expect(idx).toBe(1)
    })
  })

  describe('moveBbox', () => {
    it('bboxをdx, dyピクセル分移動する', () => {
      const mgr = new CanvasDrawManager(canvasSize)
      const bbox: NormalizedBbox = [100, 100, 400, 400]
      // 50px右、70px下に移動
      const moved = mgr.moveBbox(bbox, 50, 70)
      // dx: 50/500*1000=100, dy: 70/700*1000=100
      expect(moved).toEqual([200, 200, 500, 500])
    })

    it('画面外にはみ出さないようクランプする', () => {
      const mgr = new CanvasDrawManager(canvasSize)
      const bbox: NormalizedBbox = [800, 800, 900, 900]
      const moved = mgr.moveBbox(bbox, 250, 350)
      expect(moved[2]).toBeLessThanOrEqual(1000)
      expect(moved[3]).toBeLessThanOrEqual(1000)
    })
  })

  describe('toDisplayCoords', () => {
    it('正規化座標をピクセル座標に変換する', () => {
      const mgr = new CanvasDrawManager(canvasSize)
      const display = mgr.toDisplayCoords([100, 200, 400, 600])
      expect(display).toEqual({
        x: 200 / 1000 * 500,  // x1
        y: 100 / 1000 * 700,  // y1
        width: (600 - 200) / 1000 * 500,
        height: (400 - 100) / 1000 * 700,
      })
    })
  })
})
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx vitest run src/dev-tools/fusen-annotate/utils/__tests__/CanvasDrawManager.test.ts`
Expected: FAIL — `Cannot find module '../CanvasDrawManager'`

- [ ] **Step 3: コミット（テストのみ）**

```bash
git add src/dev-tools/fusen-annotate/utils/__tests__/CanvasDrawManager.test.ts
git commit -m "test: CanvasDrawManager のテスト追加（RED）"
```

---

## Task 3: CanvasDrawManager — 実装

**Files:**
- Create: `src/dev-tools/fusen-annotate/utils/CanvasDrawManager.ts`

- [ ] **Step 1: クラスを実装**

```typescript
// src/dev-tools/fusen-annotate/utils/CanvasDrawManager.ts
import type { NormalizedBbox } from '../types'

const MIN_DRAG_PX = 20

interface CanvasSize {
  width: number
  height: number
}

interface DisplayRect {
  x: number
  y: number
  width: number
  height: number
}

export class CanvasDrawManager {
  constructor(private canvasSize: CanvasSize) {}

  updateSize(size: CanvasSize): void {
    this.canvasSize = size
  }

  /** ピクセル座標 → 0-1000正規化 [x_norm, y_norm] */
  normalizeCoords(px: number, py: number): [number, number] {
    const nx = Math.round(Math.max(0, Math.min(1000, px / this.canvasSize.width * 1000)))
    const ny = Math.round(Math.max(0, Math.min(1000, py / this.canvasSize.height * 1000)))
    return [nx, ny]
  }

  /** ドラッグ開始/終了ピクセル → NormalizedBbox。最小サイズ未満はnull */
  createBbox(
    startX: number, startY: number,
    endX: number, endY: number,
  ): NormalizedBbox | null {
    const pxWidth = Math.abs(endX - startX)
    const pxHeight = Math.abs(endY - startY)
    if (pxWidth < MIN_DRAG_PX || pxHeight < MIN_DRAG_PX) return null

    const [nx1, ny1] = this.normalizeCoords(Math.min(startX, endX), Math.min(startY, endY))
    const [nx2, ny2] = this.normalizeCoords(Math.max(startX, endX), Math.max(startY, endY))
    return [ny1, nx1, ny2, nx2] // [y1, x1, y2, x2] row-major
  }

  /** ピクセル座標がどのbboxに含まれるか。後方優先。見つからなければnull */
  hitTest(px: number, py: number, bboxes: NormalizedBbox[]): number | null {
    const [nx, ny] = this.normalizeCoords(px, py)
    for (let i = bboxes.length - 1; i >= 0; i--) {
      const [y1, x1, y2, x2] = bboxes[i]
      if (nx >= x1 && nx <= x2 && ny >= y1 && ny <= y2) return i
    }
    return null
  }

  /** bboxをピクセルdx,dy分移動。クランプ付き */
  moveBbox(bbox: NormalizedBbox, dxPx: number, dyPx: number): NormalizedBbox {
    const [y1, x1, y2, x2] = bbox
    const dnx = Math.round(dxPx / this.canvasSize.width * 1000)
    const dny = Math.round(dyPx / this.canvasSize.height * 1000)

    let newX1 = x1 + dnx
    let newY1 = y1 + dny
    let newX2 = x2 + dnx
    let newY2 = y2 + dny

    // クランプ: はみ出し分をシフト
    if (newX1 < 0) { newX2 -= newX1; newX1 = 0 }
    if (newY1 < 0) { newY2 -= newY1; newY1 = 0 }
    if (newX2 > 1000) { newX1 -= (newX2 - 1000); newX2 = 1000 }
    if (newY2 > 1000) { newY1 -= (newY2 - 1000); newY2 = 1000 }

    return [newY1, newX1, newY2, newX2]
  }

  /** NormalizedBbox → Canvas表示用ピクセル座標 */
  toDisplayCoords(bbox: NormalizedBbox): DisplayRect {
    const [y1, x1, y2, x2] = bbox
    return {
      x: x1 / 1000 * this.canvasSize.width,
      y: y1 / 1000 * this.canvasSize.height,
      width: (x2 - x1) / 1000 * this.canvasSize.width,
      height: (y2 - y1) / 1000 * this.canvasSize.height,
    }
  }
}
```

- [ ] **Step 2: テストを実行してパスを確認**

Run: `npx vitest run src/dev-tools/fusen-annotate/utils/__tests__/CanvasDrawManager.test.ts`
Expected: ALL PASS

- [ ] **Step 3: コミット**

```bash
git add src/dev-tools/fusen-annotate/utils/CanvasDrawManager.ts
git commit -m "feat: CanvasDrawManager実装（bbox描画・選択・移動ロジック）"
```

---

## Task 4: AnnotationStateManager — テスト

**Files:**
- Create: `src/dev-tools/fusen-annotate/utils/__tests__/AnnotationStateManager.test.ts`

- [ ] **Step 1: テストファイルを作成**

```typescript
// src/dev-tools/fusen-annotate/utils/__tests__/AnnotationStateManager.test.ts
import { AnnotationStateManager } from '../AnnotationStateManager'
import type { NormalizedBbox, AnnotationState } from '../../types'

// localStorageモック
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
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `npx vitest run src/dev-tools/fusen-annotate/utils/__tests__/AnnotationStateManager.test.ts`
Expected: FAIL — `Cannot find module '../AnnotationStateManager'`

- [ ] **Step 3: コミット（テストのみ）**

```bash
git add src/dev-tools/fusen-annotate/utils/__tests__/AnnotationStateManager.test.ts
git commit -m "test: AnnotationStateManager のテスト追加（RED）"
```

---

## Task 5: AnnotationStateManager — 実装

**Files:**
- Create: `src/dev-tools/fusen-annotate/utils/AnnotationStateManager.ts`

- [ ] **Step 1: クラスを実装**

```typescript
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

  /** localStorageに即座に保存 */
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

  /** pageIdからspreadPageとsideを分解: "page-003-left" → { spreadPage: 3, side: "left" } */
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

    // pageId順にソート（page-001-left, page-001-right, page-002-left, ...）
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
```

- [ ] **Step 2: テストを実行してパスを確認**

Run: `npx vitest run src/dev-tools/fusen-annotate/utils/__tests__/AnnotationStateManager.test.ts`
Expected: ALL PASS

- [ ] **Step 3: コミット**

```bash
git add src/dev-tools/fusen-annotate/utils/AnnotationStateManager.ts
git commit -m "feat: AnnotationStateManager実装（永続化・エクスポート・統計）"
```

---

## Task 6: drawBboxes ユーティリティ

**Files:**
- Create: `src/dev-tools/fusen-annotate/utils/drawBboxes.ts`

- [ ] **Step 1: 描画ユーティリティを実装**

```typescript
// src/dev-tools/fusen-annotate/utils/drawBboxes.ts
import type { NormalizedBbox } from '../types'

interface DrawBboxesOptions {
  ctx: CanvasRenderingContext2D
  bboxes: NormalizedBbox[]
  canvasWidth: number
  canvasHeight: number
  selectedIndex: number | null
}

/** 正規化bbox → ピクセル座標 */
function toPixel(bbox: NormalizedBbox, w: number, h: number) {
  const [y1, x1, y2, x2] = bbox
  return {
    x: x1 / 1000 * w,
    y: y1 / 1000 * h,
    width: (x2 - x1) / 1000 * w,
    height: (y2 - y1) / 1000 * h,
  }
}

/** Canvas上にbbox一覧を描画する */
export function drawBboxes(opts: DrawBboxesOptions): void {
  const { ctx, bboxes, canvasWidth, canvasHeight, selectedIndex } = opts

  for (let i = 0; i < bboxes.length; i++) {
    const { x, y, width, height } = toPixel(bboxes[i], canvasWidth, canvasHeight)
    const isSelected = i === selectedIndex

    // 枠線
    ctx.strokeStyle = isSelected ? '#f97316' : '#3b82f6' // orange / blue
    ctx.lineWidth = isSelected ? 3 : 2
    ctx.strokeRect(x, y, width, height)

    // 半透明フィル
    ctx.fillStyle = isSelected ? 'rgba(249,115,22,0.15)' : 'rgba(59,130,246,0.1)'
    ctx.fillRect(x, y, width, height)

    // 番号バッジ
    const badgeSize = 20
    ctx.fillStyle = isSelected ? '#f97316' : '#3b82f6'
    ctx.fillRect(x, y, badgeSize, badgeSize)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(i + 1), x + badgeSize / 2, y + badgeSize / 2)
  }
}

/** ドラッグ中のプレビュー矩形を描画する */
export function drawPreviewRect(
  ctx: CanvasRenderingContext2D,
  startX: number, startY: number,
  currentX: number, currentY: number,
): void {
  const x = Math.min(startX, currentX)
  const y = Math.min(startY, currentY)
  const w = Math.abs(currentX - startX)
  const h = Math.abs(currentY - startY)

  ctx.setLineDash([6, 3])
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, w, h)
  ctx.fillStyle = 'rgba(59,130,246,0.1)'
  ctx.fillRect(x, y, w, h)
  ctx.setLineDash([])
}
```

- [ ] **Step 2: コミット**

```bash
git add src/dev-tools/fusen-annotate/utils/drawBboxes.ts
git commit -m "feat: drawBboxes Canvas描画ユーティリティ"
```

---

## Task 7: React Hooks（useCanvasDraw, useAnnotationState, useAnnotateKeyboard）

**Files:**
- Create: `src/dev-tools/fusen-annotate/hooks/useCanvasDraw.ts`
- Create: `src/dev-tools/fusen-annotate/hooks/useAnnotationState.ts`
- Create: `src/dev-tools/fusen-annotate/hooks/useAnnotateKeyboard.ts`

- [ ] **Step 1: useAnnotationState フック**

```typescript
// src/dev-tools/fusen-annotate/hooks/useAnnotationState.ts
import { useState, useCallback, useRef, useEffect } from 'react'
import { AnnotationStateManager } from '../utils/AnnotationStateManager'
import type { NormalizedBbox, ExportJson } from '../types'

export function useAnnotationState(source: string) {
  const mgrRef = useRef<AnnotationStateManager>(new AnnotationStateManager(source))
  const [, forceUpdate] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerUpdate = useCallback(() => {
    forceUpdate(n => n + 1)
    // 500msデバウンスでlocalStorage保存
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => mgrRef.current.flush(), 500)
  }, [])

  // アンマウント時にフラッシュ
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
    mgrRef.current.flush() // 確定時は即保存
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
    stats: mgrRef.current.getStats(258), // 後でpropsから渡す想定だが、まずハードコード
    addBbox, removeBbox, updateBbox,
    confirmPage, skipPage, setLastPosition,
    getPageBboxes, getPageStatus, exportJson,
  }
}
```

- [ ] **Step 2: useCanvasDraw フック**

```typescript
// src/dev-tools/fusen-annotate/hooks/useCanvasDraw.ts
import { useRef, useCallback, useState } from 'react'
import { CanvasDrawManager } from '../utils/CanvasDrawManager'
import type { NormalizedBbox } from '../types'

interface UseCanvasDrawOptions {
  bboxes: NormalizedBbox[]
  onAddBbox: (bbox: NormalizedBbox) => void
  onUpdateBbox: (index: number, bbox: NormalizedBbox) => void
  selectedIndex: number | null
  onSelect: (index: number | null) => void
}

export function useCanvasDraw(opts: UseCanvasDrawOptions) {
  const { bboxes, onAddBbox, onUpdateBbox, selectedIndex, onSelect } = opts
  const mgrRef = useRef(new CanvasDrawManager({ width: 1, height: 1 }))
  const [isDrawing, setIsDrawing] = useState(false)
  const dragRef = useRef<{
    mode: 'draw' | 'move'
    startX: number
    startY: number
    currentX: number
    currentY: number
    moveIndex?: number
    originalBbox?: NormalizedBbox
  } | null>(null)

  const updateCanvasSize = useCallback((width: number, height: number) => {
    mgrRef.current.updateSize({ width, height })
  }, [])

  const getCanvasCoords = useCallback((e: MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const handleMouseDown = useCallback((e: MouseEvent, canvas: HTMLCanvasElement) => {
    const { x, y } = getCanvasCoords(e, canvas)
    const hitIdx = mgrRef.current.hitTest(x, y, bboxes)

    if (hitIdx !== null && hitIdx === selectedIndex) {
      // 選択中のbboxをドラッグ → 移動モード
      dragRef.current = {
        mode: 'move', startX: x, startY: y, currentX: x, currentY: y,
        moveIndex: hitIdx, originalBbox: [...bboxes[hitIdx]] as NormalizedBbox,
      }
    } else if (hitIdx !== null) {
      // 別のbboxをクリック → 選択のみ
      onSelect(hitIdx)
      return
    } else {
      // 空き領域 → 描画モード
      onSelect(null)
      dragRef.current = { mode: 'draw', startX: x, startY: y, currentX: x, currentY: y }
    }
    setIsDrawing(true)
  }, [bboxes, selectedIndex, onSelect, getCanvasCoords])

  const handleMouseMove = useCallback((e: MouseEvent, canvas: HTMLCanvasElement) => {
    if (!dragRef.current) return
    const { x, y } = getCanvasCoords(e, canvas)
    dragRef.current.currentX = x
    dragRef.current.currentY = y
    // 移動中は dragRef の座標更新のみ（Canvas再描画は requestAnimationFrame で行う）
    // → 状態更新（onUpdateBbox）は mouseup 時にのみ実行（jank防止）
  }, [getCanvasCoords])

  /** 移動プレビュー用: 現在のドラッグ状態からbboxの仮位置を計算 */
  const getMovingBbox = useCallback((): NormalizedBbox | null => {
    const drag = dragRef.current
    if (!drag || drag.mode !== 'move' || !drag.originalBbox) return null
    const dx = drag.currentX - drag.startX
    const dy = drag.currentY - drag.startY
    return mgrRef.current.moveBbox(drag.originalBbox, dx, dy)
  }, [])

  const handleMouseUp = useCallback(() => {
    if (!dragRef.current) return
    if (dragRef.current.mode === 'draw') {
      const bbox = mgrRef.current.createBbox(
        dragRef.current.startX, dragRef.current.startY,
        dragRef.current.currentX, dragRef.current.currentY,
      )
      if (bbox) onAddBbox(bbox)
    } else if (dragRef.current.mode === 'move' && dragRef.current.originalBbox != null) {
      // 移動確定: mouseup時にのみ状態更新
      const dx = dragRef.current.currentX - dragRef.current.startX
      const dy = dragRef.current.currentY - dragRef.current.startY
      const moved = mgrRef.current.moveBbox(dragRef.current.originalBbox, dx, dy)
      onUpdateBbox(dragRef.current.moveIndex!, moved)
    }
    dragRef.current = null
    setIsDrawing(false)
  }, [onAddBbox, onUpdateBbox])

  return {
    isDrawing,
    dragState: dragRef,
    getMovingBbox,
    updateCanvasSize,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  }
}
```

- [ ] **Step 3: useAnnotateKeyboard フック**

```typescript
// src/dev-tools/fusen-annotate/hooks/useAnnotateKeyboard.ts
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
      // ドラッグ中は全ショートカット無効
      if (isDrawingRef.current) return
      // input要素にフォーカス中は無視
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
```

- [ ] **Step 4: テスト実行（全テスト）**

Run: `npx vitest run`
Expected: 既存テスト + 新規テスト ALL PASS（hooksは直接テスト不要、クラステストでカバー）

- [ ] **Step 5: コミット**

```bash
git add src/dev-tools/fusen-annotate/hooks/
git commit -m "feat: React hooks追加（useCanvasDraw, useAnnotationState, useAnnotateKeyboard）"
```

---

## Task 8: AnnotateCanvas コンポーネント

**Files:**
- Create: `src/dev-tools/fusen-annotate/components/AnnotateCanvas.tsx`
- Create: `src/dev-tools/fusen-annotate/components/AnnotateCanvas.module.css`

- [ ] **Step 1: CSS作成**

```css
/* src/dev-tools/fusen-annotate/components/AnnotateCanvas.module.css */
.canvasContainer {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  min-height: 0;
  padding: 8px;
  overflow: hidden;
}

.canvas {
  max-width: 100%;
  max-height: 100%;
  cursor: crosshair;
  border: 1px solid var(--text-secondary, #666);
  border-radius: 4px;
}

.canvas.moving {
  cursor: grab;
}

.spinner {
  position: absolute;
  color: var(--text-secondary, #999);
  font-size: 1rem;
}

.errorMsg {
  position: absolute;
  color: var(--text-secondary, #999);
  text-align: center;
  padding: 2rem;
}
```

- [ ] **Step 2: コンポーネント作成**

```typescript
// src/dev-tools/fusen-annotate/components/AnnotateCanvas.tsx
import { useRef, useEffect, useCallback, useState } from 'react'
import { useCanvasDraw } from '../hooks/useCanvasDraw'
import { drawBboxes, drawPreviewRect } from '../utils/drawBboxes'
import type { NormalizedBbox } from '../types'
import styles from './AnnotateCanvas.module.css'

interface Props {
  imageUrl: string
  bboxes: NormalizedBbox[]
  selectedIndex: number | null
  onSelect: (index: number | null) => void
  onAddBbox: (bbox: NormalizedBbox) => void
  onUpdateBbox: (index: number, bbox: NormalizedBbox) => void
  onDrawingChange: (isDrawing: boolean) => void
}

export function AnnotateCanvas({
  imageUrl, bboxes, selectedIndex, onSelect, onAddBbox, onUpdateBbox, onDrawingChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    isDrawing, dragState, updateCanvasSize,
    handleMouseDown, handleMouseMove, handleMouseUp,
  } = useCanvasDraw({ bboxes, onAddBbox, onUpdateBbox, selectedIndex, onSelect })

  // 画像読み込み
  useEffect(() => {
    setLoading(true)
    setError(null)
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setLoading(false)
    }
    img.onerror = () => {
      setError('画像が見つかりません')
      setLoading(false)
    }
    img.src = imageUrl
  }, [imageUrl])

  // Canvas描画
  const render = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return

    const container = canvas.parentElement
    if (!container) return

    // Canvas サイズ = 画像アスペクト比を維持してコンテナにfit
    const containerW = container.clientWidth - 16
    const containerH = container.clientHeight - 16
    const scale = Math.min(containerW / img.width, containerH / img.height)
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)

    canvas.width = w
    canvas.height = h
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    updateCanvasSize(w, h)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 背景画像
    ctx.drawImage(img, 0, 0, w, h)

    // 既存bbox
    drawBboxes({ ctx, bboxes, canvasWidth: w, canvasHeight: h, selectedIndex })

    // ドラッグプレビュー
    const drag = dragState.current
    if (drag && drag.mode === 'draw') {
      drawPreviewRect(ctx, drag.startX, drag.startY, drag.currentX, drag.currentY)
    }
  }, [bboxes, selectedIndex, updateCanvasSize, dragState])

  // 描画トリガー
  useEffect(() => {
    if (!loading && !error) {
      const rafId = requestAnimationFrame(render)
      return () => cancelAnimationFrame(rafId)
    }
  }, [loading, error, render, isDrawing, bboxes, selectedIndex])

  // マウスイベント
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    handleMouseDown(e.nativeEvent, canvasRef.current!)
  }, [handleMouseDown])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    handleMouseMove(e.nativeEvent, canvasRef.current!)
    // ドラッグ中は再描画
    if (dragState.current) requestAnimationFrame(render)
  }, [handleMouseMove, dragState, render])

  const onMouseUp = useCallback(() => {
    handleMouseUp()
  }, [handleMouseUp])

  if (loading) return <div className={styles.canvasContainer}><span className={styles.spinner}>読み込み中...</span></div>
  if (error) return <div className={styles.canvasContainer}><span className={styles.errorMsg}>{error}</span></div>

  return (
    <div className={styles.canvasContainer}>
      <canvas
        ref={canvasRef}
        className={`${styles.canvas} ${selectedIndex !== null && isDrawing ? styles.moving : ''}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />
    </div>
  )
}
```

- [ ] **Step 3: ビルド確認**

Run: `npx tsc --noEmit`
Expected: 型エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/dev-tools/fusen-annotate/components/AnnotateCanvas.tsx src/dev-tools/fusen-annotate/components/AnnotateCanvas.module.css
git commit -m "feat: AnnotateCanvas コンポーネント（画像表示+bbox描画）"
```

---

## Task 9: AnnotateToolbar / AnnotateHeader コンポーネント

**Files:**
- Create: `src/dev-tools/fusen-annotate/components/AnnotateToolbar.tsx`
- Create: `src/dev-tools/fusen-annotate/components/AnnotateToolbar.module.css`
- Create: `src/dev-tools/fusen-annotate/components/AnnotateHeader.tsx`
- Create: `src/dev-tools/fusen-annotate/components/AnnotateHeader.module.css`

- [ ] **Step 1: AnnotateHeader**

```typescript
// src/dev-tools/fusen-annotate/components/AnnotateHeader.tsx
import styles from './AnnotateHeader.module.css'

interface Props {
  pageId: string
  currentIndex: number
  totalPages: number
  stats: { done: number; skipped: number; remaining: number }
  onPrev: () => void
  onNext: () => void
}

export function AnnotateHeader({ pageId, currentIndex, totalPages, stats, onPrev, onNext }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.nav}>
        <span className={styles.source}>makio</span>
        <button className={styles.navBtn} onClick={onPrev} disabled={currentIndex <= 0}>◀</button>
        <span className={styles.pageInfo}>{pageId} ({currentIndex + 1}/{totalPages})</span>
        <button className={styles.navBtn} onClick={onNext} disabled={currentIndex >= totalPages - 1}>▶</button>
      </div>
      <div className={styles.stats}>
        <span className={styles.statDone}>✅ {stats.done}完了</span>
        <span className={styles.statSkip}>⏭ {stats.skipped}スキップ</span>
        <span className={styles.statRemain}>⏳ {stats.remaining}残り</span>
      </div>
    </header>
  )
}
```

```css
/* src/dev-tools/fusen-annotate/components/AnnotateHeader.module.css */
.header { padding: 12px 16px; border-bottom: 1px solid var(--text-secondary, #333); }
.nav { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
.source { font-weight: bold; color: var(--accent, #7c5cbf); }
.navBtn { background: var(--card, #1e1e2e); border: 1px solid var(--text-secondary, #555); color: var(--text-primary, #e0e0e0); border-radius: 4px; padding: 4px 10px; cursor: pointer; }
.navBtn:disabled { opacity: 0.3; cursor: not-allowed; }
.pageInfo { font-size: 0.9rem; color: var(--text-primary, #e0e0e0); }
.stats { display: flex; gap: 16px; font-size: 0.85rem; }
.statDone { color: #22c55e; }
.statSkip { color: #f59e0b; }
.statRemain { color: var(--text-secondary, #999); }
```

- [ ] **Step 2: AnnotateToolbar**

```typescript
// src/dev-tools/fusen-annotate/components/AnnotateToolbar.tsx
import styles from './AnnotateToolbar.module.css'

interface Props {
  bboxCount: number
  hasSelection: boolean
  onUndo: () => void
  onDelete: () => void
  onSkip: () => void
  onConfirm: () => void
  onExport: () => void
}

export function AnnotateToolbar({
  bboxCount, hasSelection, onUndo, onDelete, onSkip, onConfirm, onExport,
}: Props) {
  return (
    <footer className={styles.toolbar}>
      <div className={styles.row}>
        <span className={styles.count}>bbox: {bboxCount}枚</span>
        <button className={styles.btn} onClick={onUndo} disabled={bboxCount === 0}>↩ 取消</button>
        <button className={styles.btn} onClick={onDelete} disabled={!hasSelection}>🗑 削除</button>
        <button className={styles.btnExport} onClick={onExport}>📥 Export</button>
      </div>
      <div className={styles.row}>
        <button className={styles.btnSkip} onClick={onSkip}>⏭ 付箋なし</button>
        <button className={styles.btnConfirm} onClick={onConfirm}>✅ 確定 → 次へ</button>
      </div>
    </footer>
  )
}
```

```css
/* src/dev-tools/fusen-annotate/components/AnnotateToolbar.module.css */
.toolbar { padding: 12px 16px; border-top: 1px solid var(--text-secondary, #333); }
.row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.row:last-child { margin-bottom: 0; }
.count { font-size: 0.9rem; color: var(--text-primary, #e0e0e0); margin-right: auto; }
.btn { background: var(--card, #1e1e2e); border: 1px solid var(--text-secondary, #555); color: var(--text-primary, #e0e0e0); border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 0.85rem; }
.btn:disabled { opacity: 0.3; cursor: not-allowed; }
.btnSkip { background: transparent; border: 1px solid #f59e0b; color: #f59e0b; border-radius: 6px; padding: 8px 16px; cursor: pointer; }
.btnConfirm { background: #22c55e; border: none; color: #fff; border-radius: 6px; padding: 8px 20px; cursor: pointer; font-weight: bold; margin-left: auto; }
.btnExport { background: var(--card, #1e1e2e); border: 1px solid var(--accent, #7c5cbf); color: var(--accent, #7c5cbf); border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 0.85rem; }
```

- [ ] **Step 3: ビルド確認**

Run: `npx tsc --noEmit`
Expected: 型エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/dev-tools/fusen-annotate/components/
git commit -m "feat: AnnotateHeader + AnnotateToolbar コンポーネント"
```

---

## Task 10: FusenAnnotatePage + ルート登録

**Files:**
- Create: `src/dev-tools/fusen-annotate/FusenAnnotatePage.tsx`
- Create: `src/dev-tools/fusen-annotate/FusenAnnotatePage.module.css`
- Modify: `src/routes.tsx`

- [ ] **Step 1: ページリスト生成ユーティリティ**

`FusenAnnotatePage.tsx` 内にページID一覧を生成するヘルパーを含める:

```typescript
// src/dev-tools/fusen-annotate/FusenAnnotatePage.tsx
import { useState, useCallback, useMemo } from 'react'
import { useAnnotationState } from './hooks/useAnnotationState'
import { useAnnotateKeyboard } from './hooks/useAnnotateKeyboard'
import { AnnotateCanvas } from './components/AnnotateCanvas'
import { AnnotateHeader } from './components/AnnotateHeader'
import { AnnotateToolbar } from './components/AnnotateToolbar'
import type { NormalizedBbox } from './types'
import styles from './FusenAnnotatePage.module.css'

const SOURCE = 'makio'
const TOTAL_SPREADS = 129

/** page-001-left, page-001-right, page-002-left, ... を生成 */
function generatePageIds(totalSpreads: number): string[] {
  const ids: string[] = []
  for (let i = 1; i <= totalSpreads; i++) {
    const num = String(i).padStart(3, '0')
    ids.push(`page-${num}-left`, `page-${num}-right`)
  }
  return ids
}

export default function FusenAnnotatePage() {
  const pageIds = useMemo(() => generatePageIds(TOTAL_SPREADS), [])
  const totalPages = pageIds.length

  const {
    state, stats, addBbox, removeBbox, updateBbox,
    confirmPage, skipPage, setLastPosition, getPageBboxes, exportJson,
  } = useAnnotationState(SOURCE)

  // 初期位置復元
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (state.lastPosition) {
      const idx = pageIds.indexOf(state.lastPosition)
      if (idx >= 0) return idx
    }
    return 0
  })

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const currentPageId = pageIds[currentIndex]
  const currentBboxes = getPageBboxes(currentPageId)
  const imageUrl = `/images/fusens/sources/${SOURCE}/${currentPageId}.png`

  const navigate = useCallback((idx: number) => {
    if (idx < 0 || idx >= totalPages) return
    setCurrentIndex(idx)
    setSelectedIndex(null)
    setLastPosition(pageIds[idx])
  }, [totalPages, pageIds, setLastPosition])

  const handleConfirm = useCallback(() => {
    confirmPage(currentPageId)
    navigate(currentIndex + 1)
  }, [confirmPage, currentPageId, navigate, currentIndex])

  const handleSkip = useCallback(() => {
    skipPage(currentPageId)
    navigate(currentIndex + 1)
  }, [skipPage, currentPageId, navigate, currentIndex])

  const handleUndo = useCallback(() => {
    if (currentBboxes.length > 0) {
      removeBbox(currentPageId, currentBboxes.length - 1)
      setSelectedIndex(null)
    }
  }, [currentBboxes, removeBbox, currentPageId])

  const handleDeleteSelected = useCallback(() => {
    if (selectedIndex !== null) {
      removeBbox(currentPageId, selectedIndex)
      setSelectedIndex(null)
    }
  }, [selectedIndex, removeBbox, currentPageId])

  const handleJumpToUnfinished = useCallback(() => {
    for (let i = 0; i < pageIds.length; i++) {
      const status = state.pages[pageIds[i]]?.status
      if (!status || status === 'in-progress') {
        navigate(i)
        return
      }
    }
  }, [pageIds, state.pages, navigate])

  const handleExport = useCallback(() => {
    const json = exportJson(totalPages)
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fusen-annotations-${SOURCE}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [exportJson, totalPages])

  const handleAddBbox = useCallback((bbox: NormalizedBbox) => {
    addBbox(currentPageId, bbox)
  }, [addBbox, currentPageId])

  const handleUpdateBbox = useCallback((index: number, bbox: NormalizedBbox) => {
    updateBbox(currentPageId, index, bbox)
  }, [updateBbox, currentPageId])

  useAnnotateKeyboard({
    prevPage: () => navigate(currentIndex - 1),
    nextPage: () => navigate(currentIndex + 1),
    confirm: handleConfirm,
    skip: handleSkip,
    undo: handleUndo,
    deleteBbox: handleDeleteSelected,
    jumpToUnfinished: handleJumpToUnfinished,
    exportData: handleExport,
    toggleHelp: () => setShowHelp(v => !v),
  }, isDrawing) // AnnotateCanvasから onDrawingChange で受け取る

  return (
    <div className={styles.page}>
      <AnnotateHeader
        pageId={currentPageId}
        currentIndex={currentIndex}
        totalPages={totalPages}
        stats={stats}
        onPrev={() => navigate(currentIndex - 1)}
        onNext={() => navigate(currentIndex + 1)}
      />

      <AnnotateCanvas
        imageUrl={imageUrl}
        bboxes={currentBboxes}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        onAddBbox={handleAddBbox}
        onUpdateBbox={handleUpdateBbox}
        onDrawingChange={setIsDrawing}
      />

      <AnnotateToolbar
        bboxCount={currentBboxes.length}
        hasSelection={selectedIndex !== null}
        onUndo={handleUndo}
        onDelete={handleDeleteSelected}
        onSkip={handleSkip}
        onConfirm={handleConfirm}
        onExport={handleExport}
      />

      {showHelp && (
        <div className={styles.helpOverlay} onClick={() => setShowHelp(false)}>
          <div className={styles.helpBox}>
            <h3>キーボードショートカット</h3>
            <table>
              <tbody>
                <tr><td>ドラッグ</td><td>bbox描画</td></tr>
                <tr><td>クリック</td><td>bbox選択</td></tr>
                <tr><td>選択+ドラッグ</td><td>bbox移動</td></tr>
                <tr><td>Delete</td><td>選択bbox削除</td></tr>
                <tr><td>Ctrl+Z</td><td>取消（直前1操作）</td></tr>
                <tr><td>← →</td><td>ページ送り</td></tr>
                <tr><td>Enter</td><td>確定→次へ</td></tr>
                <tr><td>s</td><td>付箋なし（スキップ）</td></tr>
                <tr><td>g</td><td>未完了ページへジャンプ</td></tr>
                <tr><td>e</td><td>エクスポート</td></tr>
                <tr><td>?</td><td>このヘルプ</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
```

```css
/* src/dev-tools/fusen-annotate/FusenAnnotatePage.module.css */
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg, #0a0a1a);
  color: var(--text-primary, #e0e0e0);
}

.helpOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.helpBox {
  background: var(--card, #1e1e2e);
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
}

.helpBox h3 {
  margin: 0 0 16px 0;
  color: var(--accent, #7c5cbf);
}

.helpBox table {
  width: 100%;
  border-collapse: collapse;
}

.helpBox td {
  padding: 6px 12px;
  border-bottom: 1px solid var(--text-secondary, #333);
  font-size: 0.9rem;
}

.helpBox td:first-child {
  font-weight: bold;
  color: var(--accent, #7c5cbf);
  white-space: nowrap;
}
```

- [ ] **Step 2: ルート登録**

`src/routes.tsx` に追加。既存の `FusenReview` と同じパターン:

```typescript
// 以下を追加（既存の FusenReview 定義の近くに）
const FusenAnnotate = import.meta.env.DEV
  ? React.lazy(() => import('./dev-tools/fusen-annotate/FusenAnnotatePage'))
  : null

// router の routes 配列内に追加（既存の fusen-review ルートの近くに）
...(import.meta.env.DEV && FusenAnnotate ? [{
  path: '/dev-tools/fusen-annotate',
  element: <Suspense fallback={<div>Loading...</div>}><FusenAnnotate /></Suspense>,
}] : []),
```

- [ ] **Step 3: ビルド確認 + テスト**

Run: `npx tsc --noEmit && npx vitest run`
Expected: 型エラーなし、テスト ALL PASS

- [ ] **Step 4: コミット**

```bash
git add src/dev-tools/fusen-annotate/FusenAnnotatePage.tsx src/dev-tools/fusen-annotate/FusenAnnotatePage.module.css src/routes.tsx
git commit -m "feat: FusenAnnotatePage + ルート登録（/dev-tools/fusen-annotate）"
```

---

## Task 11: split-pages.ts スクリプト

**Files:**
- Create: `scripts/split-pages.ts`
- Create: `scripts/lib/__tests__/split-pages.test.ts`

- [ ] **Step 1: テスト作成**

```typescript
// scripts/lib/__tests__/split-pages.test.ts
import { parsePageFiles, generatePageIds } from '../split-pages-core'

describe('split-pages-core', () => {
  describe('parsePageFiles', () => {
    it('page-NNN.pngのみを抽出する（left/right/api/smallは除外）', () => {
      const files = [
        'page-001.png', 'page-001-left.png', 'page-001-right.png',
        'page-001-api.png', 'page-001-left-small.png',
        'page-002.png', 'page-003.png',
      ]
      const result = parsePageFiles(files)
      expect(result).toEqual(['page-001.png', 'page-002.png', 'page-003.png'])
    })
  })

  describe('generatePageIds', () => {
    it('spreadPage数からleft/rightのページIDリストを生成する', () => {
      const ids = generatePageIds(2)
      expect(ids).toEqual([
        'page-001-left', 'page-001-right',
        'page-002-left', 'page-002-right',
      ])
    })
  })
})
```

- [ ] **Step 2: コアロジック分離**

```typescript
// scripts/lib/split-pages-core.ts

/** page-NNN.png のみを抽出（left/right/api/small を除外） */
export function parsePageFiles(files: string[]): string[] {
  return files.filter(f => /^page-\d+\.png$/.test(f)).sort()
}

/** ページIDリストを生成: page-001-left, page-001-right, ... */
export function generatePageIds(totalSpreads: number): string[] {
  const ids: string[] = []
  for (let i = 1; i <= totalSpreads; i++) {
    const num = String(i).padStart(3, '0')
    ids.push(`page-${num}-left`, `page-${num}-right`)
  }
  return ids
}
```

- [ ] **Step 3: テスト実行**

Run: `npx vitest run scripts/lib/__tests__/split-pages.test.ts`
Expected: ALL PASS

- [ ] **Step 4: メインスクリプト**

```typescript
// scripts/split-pages.ts
/**
 * 見開き画像を左右分割
 *
 * Usage:
 *   npx tsx scripts/split-pages.ts --source makio --input /tmp/claude/fusens/pages/
 *   npx tsx scripts/split-pages.ts --source makio --input /tmp/claude/fusens/pages/ --force
 */
import * as fs from 'fs'
import * as path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { parsePageFiles } from './lib/split-pages-core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const args = process.argv.slice(2)
const sourceIdx = args.indexOf('--source')
const inputIdx = args.indexOf('--input')
const force = args.includes('--force')

if (sourceIdx === -1 || inputIdx === -1) {
  console.log('Usage: npx tsx scripts/split-pages.ts --source <name> --input <dir> [--force]')
  process.exit(1)
}

const source = args[sourceIdx + 1]
const inputDir = args[inputIdx + 1]
const outputDir = path.resolve(__dirname, '..', 'public', 'images', 'fusens', 'sources', source)

async function main() {
  // 出力ディレクトリ作成
  fs.mkdirSync(outputDir, { recursive: true })

  // 入力ファイル一覧
  const allFiles = fs.readdirSync(inputDir)
  const spreadFiles = parsePageFiles(allFiles)
  console.log(`Found ${spreadFiles.length} spread images`)

  let created = 0
  let skipped = 0

  for (const file of spreadFiles) {
    const num = file.match(/page-(\d+)\.png/)![1]
    const leftName = `page-${num}-left.png`
    const rightName = `page-${num}-right.png`
    const leftPath = path.join(outputDir, leftName)
    const rightPath = path.join(outputDir, rightName)

    // スキップ判定
    if (!force && fs.existsSync(leftPath) && fs.existsSync(rightPath)) {
      skipped++
      continue
    }

    const imgPath = path.join(inputDir, file)
    const meta = await sharp(imgPath).metadata()
    const width = meta.width!
    const height = meta.height!
    const halfWidth = Math.floor(width / 2)

    // 左半分
    await sharp(imgPath)
      .extract({ left: 0, top: 0, width: halfWidth, height })
      .toFile(leftPath)

    // 右半分
    await sharp(imgPath)
      .extract({ left: halfWidth, top: 0, width: width - halfWidth, height })
      .toFile(rightPath)

    created++
    if (created % 10 === 0) console.log(`  ${created} spreads split...`)
  }

  // meta.json
  const meta = {
    name: source,
    pdf: `fusen-note-${source}.pdf`,
    totalPages: spreadFiles.length,
    splitImages: spreadFiles.length * 2,
    createdAt: new Date().toISOString(),
  }
  fs.writeFileSync(path.join(outputDir, 'meta.json'), JSON.stringify(meta, null, 2))

  console.log(`Done: ${created} split, ${skipped} skipped. Output: ${outputDir}`)
  // TODO: --pdf モード（pdftoppm で PDF→PNG→分割）は残り38ページ分のPNG生成時に追加
  // 現時点では既存の91枚のPNGで十分（--input モードで対応）
}

main().catch(e => { console.error(e); process.exit(1) })
```

- [ ] **Step 5: テスト全体 + ビルド確認**

Run: `npx vitest run && npx tsc --noEmit`
Expected: ALL PASS

- [ ] **Step 6: コミット**

```bash
git add scripts/split-pages.ts scripts/lib/split-pages-core.ts scripts/lib/__tests__/split-pages.test.ts
git commit -m "feat: split-pages.ts（見開き画像→左右分割スクリプト）"
```

---

## Task 12: 動作確認 + 最終コミット

- [ ] **Step 1: split-pagesを実行して画像生成**

```bash
npx tsx scripts/split-pages.ts --source makio --input /tmp/claude/fusens/pages/
```

Expected: `public/images/fusens/sources/makio/` に左右分割画像が生成される

- [ ] **Step 2: dev server起動して動作確認**

```bash
npm run dev
# ブラウザで http://localhost:5173/dev-tools/fusen-annotate にアクセス
```

確認項目:
- [ ] ページ画像が表示される
- [ ] マウスドラッグでbbox描画できる
- [ ] bboxをクリックで選択、Delete で削除
- [ ] 選択bboxをドラッグで移動
- [ ] Ctrl+Z で Undo
- [ ] ← → でページ送り
- [ ] 「✅ 確定 → 次へ」で次ページ遷移
- [ ] 「⏭ 付箋なし」でスキップ
- [ ] `e` キーでJSONエクスポート
- [ ] `?` でヘルプ表示
- [ ] ブラウザリロード後にデータが復元される

- [ ] **Step 3: 全テスト + ビルド**

```bash
npx vitest run && npm run build
```

Expected: テスト ALL PASS、ビルド成功

- [ ] **Step 4: 最終コミット（必要な修正があれば）**

```bash
git add -A
git commit -m "fix: 動作確認での修正"
```
