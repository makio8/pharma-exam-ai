# レビューUI シナリオ編集 & 複数画像クロップ 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** レビューUIにシナリオ専用タブを新設し、シナリオ・問題文ともにテキスト+複数画像クロップを1タブで完結できるようにする

**Architecture:** CorrectionPanel のタブ構成を再編（問題文タブ・シナリオタブを統合型に）。プレースホルダー `{{image:N}}` のパース・バリデーションは純粋関数ユーティリティに抽出してテスト。PdfCropper → ReviewPage → CorrectionPanel のクロップ結果は `pendingCropResult` props で宣言的に受け渡し。シナリオ修正は連問グループ全問に自動伝播。

**Tech Stack:** React 19 / TypeScript 5.9 / Vite 8 / CSS Modules / Vitest

**Design:** `docs/superpowers/specs/2026-03-27-review-ui-scenario-multicrop-design.md`

---

## ファイル構成

| ファイル | 役割 | 操作 |
|---------|------|------|
| `src/dev-tools/review/types.ts` | 型定義（CropTarget, CropImage, PendingCropResult, multi-image-crop） | 変更 |
| `src/dev-tools/review/utils/placeholder-utils.ts` | プレースホルダーのパース・挿入・削除・バリデーション（純粋関数） | 新規 |
| `src/dev-tools/review/utils/__tests__/placeholder-utils.test.ts` | 上記のテスト | 新規 |
| `src/dev-tools/review/components/PdfCropper.tsx` | onSave に preview data URL を追加 | 変更 |
| `src/dev-tools/review/components/TextWithImageTab.tsx` | 問題文タブ・シナリオタブ共通のテキスト+画像編集コンポーネント | 新規 |
| `src/dev-tools/review/components/TextWithImageTab.module.css` | 上記のスタイル | 新規 |
| `src/dev-tools/review/components/CorrectionPanel.tsx` | タブ再編、新props対応 | 変更 |
| `src/dev-tools/review/components/ReviewCard.tsx` | corrections/previews props追加、シナリオ画像プレビュー | 変更 |
| `src/dev-tools/review/components/ReviewCard.module.css` | シナリオ内画像プレビュースタイル | 変更 |
| `src/dev-tools/review/ReviewPage.tsx` | cropTarget/pendingCropResult state、シナリオ伝播ロジック | 変更 |
| `scripts/apply-corrections.ts` | バージョンチェック追加 | 変更 |

---

### Task 1: 型定義の追加（types.ts）

**Files:**
- Modify: `src/dev-tools/review/types.ts`

- [ ] **Step 1: CropTarget, CropImage, PendingCropResult 型と multi-image-crop Correction バリアントを追加**

```typescript
// types.ts の既存 Correction union の末尾に追加

export type CropTarget = 'question' | 'scenario'

export interface CropImage {
  id: number
  crop: PdfCropRect
  pdfFile: string
  pdfPage: number
  label?: string
}

export interface PendingCropResult {
  target: CropTarget
  crop: PdfCropRect
  pdfFile: string
  pdfPage: number
  preview: string
}

// Correction union に追加（既存の | { type: 'set-linked-scenario' ... } の後）
  | { type: 'multi-image-crop'; target: CropTarget; images: CropImage[] }
```

既存の `Correction` union は行7〜17。行17の `| { type: 'set-linked-scenario'; value: string }` の後に追加する。

- [ ] **Step 2: correctionLabel に multi-image-crop を追加確認のため tsc --noEmit**

`CorrectionPanel.tsx` の `correctionLabel` 関数で switch が exhaustive でないと型エラーになるので、後のタスクで対応する。ここでは型定義のみ。

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsc --noEmit 2>&1 | head -20`

Expected: `correctionLabel` で exhaustive check エラーが出る（multi-image-crop 未処理）。これは Task 5 で修正する。

- [ ] **Step 3: コミット**

```bash
git add src/dev-tools/review/types.ts
git commit -m "feat(review): add CropTarget, CropImage, PendingCropResult types and multi-image-crop Correction variant"
```

---

### Task 2: プレースホルダーユーティリティ（純粋関数 + テスト）

**Files:**
- Create: `src/dev-tools/review/utils/placeholder-utils.ts`
- Create: `src/dev-tools/review/utils/__tests__/placeholder-utils.test.ts`

- [ ] **Step 1: テストファイルを作成**

```typescript
// src/dev-tools/review/utils/__tests__/placeholder-utils.test.ts
import { describe, it, expect } from 'vitest'
import {
  parseTextWithImages,
  insertPlaceholder,
  removePlaceholder,
  validateImagePlaceholders,
  nextImageId,
} from '../placeholder-utils'
import type { CropImage, PdfCropRect } from '../../types'

const dummyCrop: PdfCropRect = {
  x: 0.1, y: 0.2, w: 0.3, h: 0.4,
  viewportWidth: 800, viewportHeight: 1130,
  scale: 1.5, rotation: 0,
}

function makeCropImage(id: number): CropImage {
  return { id, crop: dummyCrop, pdfFile: 'exam-108.pdf', pdfPage: 1 }
}

describe('parseTextWithImages', () => {
  it('テキストのみ（プレースホルダーなし）', () => {
    const result = parseTextWithImages('普通のテキスト', [])
    expect(result).toEqual([{ type: 'text', content: '普通のテキスト' }])
  })

  it('プレースホルダー1つ', () => {
    const images = [makeCropImage(1)]
    const result = parseTextWithImages('前文\n{{image:1}}\n後文', images)
    expect(result).toEqual([
      { type: 'text', content: '前文\n' },
      { type: 'image', imageId: 1 },
      { type: 'text', content: '\n後文' },
    ])
  })

  it('プレースホルダー複数', () => {
    const images = [makeCropImage(1), makeCropImage(2)]
    const result = parseTextWithImages('A{{image:1}}B{{image:2}}C', images)
    expect(result).toEqual([
      { type: 'text', content: 'A' },
      { type: 'image', imageId: 1 },
      { type: 'text', content: 'B' },
      { type: 'image', imageId: 2 },
      { type: 'text', content: 'C' },
    ])
  })

  it('存在しない画像IDのプレースホルダーはテキストとして扱う', () => {
    const result = parseTextWithImages('{{image:99}}', [])
    expect(result).toEqual([{ type: 'text', content: '{{image:99}}' }])
  })

  it('空文字列', () => {
    const result = parseTextWithImages('', [])
    expect(result).toEqual([])
  })
})

describe('insertPlaceholder', () => {
  it('カーソル位置にプレースホルダーを挿入', () => {
    const result = insertPlaceholder('ABCDEF', 3, 1)
    expect(result.text).toBe('ABC{{image:1}}DEF')
    expect(result.newCursorPos).toBe(3 + '{{image:1}}'.length)
  })

  it('末尾に挿入', () => {
    const result = insertPlaceholder('ABC', 3, 2)
    expect(result.text).toBe('ABC{{image:2}}')
  })

  it('先頭に挿入', () => {
    const result = insertPlaceholder('ABC', 0, 1)
    expect(result.text).toBe('{{image:1}}ABC')
  })
})

describe('removePlaceholder', () => {
  it('指定IDのプレースホルダーを除去', () => {
    expect(removePlaceholder('前{{image:1}}後', 1)).toBe('前後')
  })

  it('存在しないIDは変化なし', () => {
    expect(removePlaceholder('前{{image:1}}後', 2)).toBe('前{{image:1}}後')
  })

  it('前後の改行も1つ除去（連続改行防止）', () => {
    expect(removePlaceholder('前\n{{image:1}}\n後', 1)).toBe('前\n後')
  })
})

describe('validateImagePlaceholders', () => {
  it('整合性OK', () => {
    const images = [makeCropImage(1)]
    const result = validateImagePlaceholders('テキスト{{image:1}}', images)
    expect(result.orphanPlaceholders).toEqual([])
    expect(result.unreferencedImages).toEqual([])
  })

  it('orphanプレースホルダー検出', () => {
    const result = validateImagePlaceholders('{{image:3}}', [])
    expect(result.orphanPlaceholders).toEqual([3])
  })

  it('未参照画像検出', () => {
    const images = [makeCropImage(1), makeCropImage(2)]
    const result = validateImagePlaceholders('{{image:1}}', images)
    expect(result.unreferencedImages).toEqual([2])
  })
})

describe('nextImageId', () => {
  it('空リストなら1', () => {
    expect(nextImageId([])).toBe(1)
  })

  it('既存IDの最大+1', () => {
    expect(nextImageId([makeCropImage(1), makeCropImage(3)])).toBe(4)
  })
})
```

- [ ] **Step 2: テストが全て失敗することを確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx vitest run src/dev-tools/review/utils/__tests__/placeholder-utils.test.ts 2>&1 | tail -10`

Expected: FAIL（モジュールが存在しない）

- [ ] **Step 3: placeholder-utils.ts を実装**

```typescript
// src/dev-tools/review/utils/placeholder-utils.ts
import type { CropImage } from '../types'

/** {{image:N}} のパターン */
const PLACEHOLDER_RE = /\{\{image:(\d+)\}\}/g

export type ParsedBlock =
  | { type: 'text'; content: string }
  | { type: 'image'; imageId: number }

/**
 * テキスト内の {{image:N}} を分割してブロック配列に変換する。
 * 対応する CropImage が存在しないプレースホルダーはテキストとして扱う。
 */
export function parseTextWithImages(
  text: string,
  images: CropImage[],
): ParsedBlock[] {
  if (!text) return []
  const imageIds = new Set(images.map(i => i.id))
  const blocks: ParsedBlock[] = []
  let lastIndex = 0

  for (const match of text.matchAll(PLACEHOLDER_RE)) {
    const id = parseInt(match[1], 10)
    const matchStart = match.index!

    // 対応する画像がなければテキストとして扱う（スキップ）
    if (!imageIds.has(id)) continue

    // マッチ前のテキスト
    if (matchStart > lastIndex) {
      blocks.push({ type: 'text', content: text.slice(lastIndex, matchStart) })
    }
    blocks.push({ type: 'image', imageId: id })
    lastIndex = matchStart + match[0].length
  }

  // 残りのテキスト
  if (lastIndex < text.length) {
    blocks.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return blocks
}

/**
 * テキストの指定位置にプレースホルダーを挿入する。
 */
export function insertPlaceholder(
  text: string,
  cursorPos: number,
  imageId: number,
): { text: string; newCursorPos: number } {
  const placeholder = `{{image:${imageId}}}`
  const newText = text.slice(0, cursorPos) + placeholder + text.slice(cursorPos)
  return { text: newText, newCursorPos: cursorPos + placeholder.length }
}

/**
 * テキストから指定IDのプレースホルダーを除去する。
 * 前後に改行がある場合、片方を除去して連続改行を防ぐ。
 */
export function removePlaceholder(text: string, imageId: number): string {
  // まず改行付きパターンを試す（\n{{image:N}}\n → \n）
  const withNewlines = new RegExp(`\\n\\{\\{image:${imageId}\\}\\}\\n`)
  if (withNewlines.test(text)) {
    return text.replace(withNewlines, '\n')
  }
  // 改行なしの場合はそのまま除去
  const plain = new RegExp(`\\{\\{image:${imageId}\\}\\}`)
  return text.replace(plain, '')
}

/**
 * テキスト内のプレースホルダーと CropImage[] の整合性を検証する。
 */
export function validateImagePlaceholders(
  text: string,
  images: CropImage[],
): { orphanPlaceholders: number[]; unreferencedImages: number[] } {
  // テキスト内のプレースホルダーIDを収集
  const placeholderIds = new Set<number>()
  for (const match of text.matchAll(PLACEHOLDER_RE)) {
    placeholderIds.add(parseInt(match[1], 10))
  }

  const imageIds = new Set(images.map(i => i.id))

  // orphan: テキストにあるが画像にない
  const orphanPlaceholders = [...placeholderIds].filter(id => !imageIds.has(id))

  // unreferenced: 画像にあるがテキストにない
  const unreferencedImages = [...imageIds].filter(id => !placeholderIds.has(id))

  return { orphanPlaceholders, unreferencedImages }
}

/**
 * 次の画像IDを返す（既存リストの max + 1）。
 */
export function nextImageId(images: CropImage[]): number {
  if (images.length === 0) return 1
  return Math.max(...images.map(i => i.id)) + 1
}
```

- [ ] **Step 4: テストが全て通ることを確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx vitest run src/dev-tools/review/utils/__tests__/placeholder-utils.test.ts 2>&1 | tail -15`

Expected: 12 tests PASS

- [ ] **Step 5: コミット**

```bash
git add src/dev-tools/review/utils/placeholder-utils.ts src/dev-tools/review/utils/__tests__/placeholder-utils.test.ts
git commit -m "feat(review): add placeholder-utils with parse, insert, remove, validate functions (12 tests)"
```

---

### Task 3: PdfCropper — preview data URL を onSave に追加

**Files:**
- Modify: `src/dev-tools/review/components/PdfCropper.tsx`

- [ ] **Step 1: PdfCropperProps の onSave シグネチャを変更**

`src/dev-tools/review/components/PdfCropper.tsx` 行28:

```typescript
// 変更前
onSave: (crop: PdfCropRect) => void

// 変更後
onSave: (crop: PdfCropRect, previewDataUrl: string) => void
```

- [ ] **Step 2: handleMouseUp 内でプレビュー生成して onSave に渡す**

行105〜128 の `handleMouseUp` を変更。`onSave(crop)` の呼び出し前にプレビュー生成ロジックを追加する。既存の `handlePreview()` 関数（行131〜153）のロジックを流用:

```typescript
const handleMouseUp = useCallback((e: React.MouseEvent) => {
  if (!drag?.isDragging) return
  const coords = toCanvasCoords(e)
  if (!coords) return
  const updated = { ...drag, currentX: coords.x, currentY: coords.y, isDragging: false }
  const rect = normalizeRect(updated)
  if (rect.w > 4 && rect.h > 4 && canvasRect) {
    setFinalRect(rect)
    const crop: PdfCropRect = {
      x: rect.x / canvasRect.width,
      y: rect.y / canvasRect.height,
      w: rect.w / canvasRect.width,
      h: rect.h / canvasRect.height,
      viewportWidth,
      viewportHeight,
      scale,
      rotation: 0,
    }
    // プレビュー data URL を生成
    let previewDataUrl = ''
    const canvas = canvasRef.current
    if (canvas) {
      const scaleX = canvas.width / canvasRect.width
      const scaleY = canvas.height / canvasRect.height
      const previewCanvas = document.createElement('canvas')
      previewCanvas.width = rect.w * scaleX
      previewCanvas.height = rect.h * scaleY
      const ctx = previewCanvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(
          canvas,
          rect.x * scaleX, rect.y * scaleY,
          rect.w * scaleX, rect.h * scaleY,
          0, 0,
          previewCanvas.width, previewCanvas.height,
        )
        previewDataUrl = previewCanvas.toDataURL('image/png')
      }
    }
    onSave(crop, previewDataUrl)
  }
  setDrag(null)
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [drag, canvasRect, viewportWidth, viewportHeight, scale, onSave])
```

- [ ] **Step 3: handleSave も同様に変更（プレビューボタンからの保存パス）**

行156〜176 の `handleSave`:

```typescript
function handleSave() {
  if (!finalRect || !canvasRect) return
  const relX = finalRect.x / canvasRect.width
  const relY = finalRect.y / canvasRect.height
  const relW = finalRect.w / canvasRect.width
  const relH = finalRect.h / canvasRect.height
  const crop: PdfCropRect = {
    x: relX, y: relY, w: relW, h: relH,
    viewportWidth, viewportHeight, scale, rotation: 0,
  }
  onSave(crop, previewUrl ?? '')
}
```

- [ ] **Step 4: 型チェック**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsc --noEmit 2>&1 | head -20`

Expected: ReviewPage.tsx で `handleCropSave` の引数不一致エラー（Task 4 で修正）。PdfCropper 自体はエラーなし。

- [ ] **Step 5: コミット**

```bash
git add src/dev-tools/review/components/PdfCropper.tsx
git commit -m "feat(review): PdfCropper returns preview data URL with onSave"
```

---

### Task 4: ReviewPage — cropTarget, pendingCropResult, シナリオ伝播

**Files:**
- Modify: `src/dev-tools/review/ReviewPage.tsx`

- [ ] **Step 1: import に CropTarget, PendingCropResult を追加**

行15:

```typescript
// 変更前
import type { FilterConfig, Correction, CorrectionsFile, PdfCropRect } from './types'

// 変更後
import type { FilterConfig, Correction, CorrectionsFile, PdfCropRect, CropTarget, PendingCropResult } from './types'
```

- [ ] **Step 2: cropTarget, pendingCropResult, previews state を追加**

行50（`const [cropMode, setCropMode] = useState(false)` の後）に追加:

```typescript
const [cropTarget, setCropTarget] = useState<CropTarget | null>(null)
const [pendingCropResult, setPendingCropResult] = useState<PendingCropResult | null>(null)
const [previews, setPreviews] = useState<Map<string, string>>(() => new Map())
```

- [ ] **Step 3: handleCropSave を変更（preview受け取り + pendingCropResult にセット）**

行148〜157 の既存 `handleCropSave` を置換:

```typescript
const handleCropSave = useCallback((crop: PdfCropRect, previewDataUrl: string) => {
  if (!currentQuestion || !cropTarget) return
  setPendingCropResult({
    target: cropTarget,
    crop,
    pdfFile: activePdfFile,
    pdfPage: activePage,
    preview: previewDataUrl,
  })
  setCropMode(false)
}, [currentQuestion, cropTarget, activePdfFile, activePage])
```

- [ ] **Step 4: handleAddScenarioCorrection を追加（連問グループ伝播）**

`handleRemoveCorrection` の後に追加:

```typescript
const handleAddScenarioCorrection = useCallback((corrections: Correction[]) => {
  if (!currentQuestion) return
  if (!currentQuestion.linked_group) {
    // 連問でなければ通常追加
    corrections.forEach(c => reviewState.addCorrection(currentQuestion.id, c))
    return
  }
  // 同じ linked_group の全問に伝播
  const groupQuestions = sortedQuestions.filter(
    q => q.linked_group === currentQuestion.linked_group
  )
  for (const q of groupQuestions) {
    corrections.forEach(c => reviewState.addCorrection(q.id, c))
  }
}, [currentQuestion, reviewState, sortedQuestions])
```

- [ ] **Step 5: CorrectionPanel の JSX を変更（新props）**

行366〜376 の CorrectionPanel JSX を置換:

```tsx
<CorrectionPanel
  question={currentQuestion}
  corrections={currentCorrections}
  onAddCorrection={handleAddCorrection}
  onAddScenarioCorrection={handleAddScenarioCorrection}
  onRemoveCorrection={handleRemoveCorrection}
  onStartCrop={(target: CropTarget) => {
    setCropTarget(target)
    setCropMode(true)
    syncViewportSize()
  }}
  pendingCropResult={pendingCropResult}
  onConsumeCropResult={() => setPendingCropResult(null)}
  previews={previews}
  onUpdatePreviews={setPreviews}
/>
```

- [ ] **Step 6: ReviewCard に corrections と previews を渡す**

行327〜343 の ReviewCard JSX に props 追加:

```tsx
<ReviewCard
  question={currentQuestion}
  issues={report.issues.filter(
    (i: ValidationIssue) => i.questionId === currentQuestion.id
  )}
  judgment={reviewState.state.judgments[currentQuestion.id]}
  onJudge={(status) => reviewState.setJudgment(currentQuestion.id, status)}
  onResetJudgment={() => {
    const next = { ...reviewState.state.judgments }
    delete next[currentQuestion.id]
    reviewState.save({ ...reviewState.state, judgments: next })
  }}
  currentIndex={safeIndex}
  total={filteredQuestions.length}
  onPrev={() => navigate(safeIndex - 1)}
  onNext={() => navigate(safeIndex + 1)}
  corrections={currentCorrections}
  previews={previews}
/>
```

- [ ] **Step 7: handleExport のバージョンと警告を変更**

行159〜185 の `handleExport` 内:

```typescript
const handleExport = useCallback(() => {
  if (!report) return

  // multi-image-crop が含まれるか確認
  const hasMultiCrop = Object.values(reviewState.state.corrections).some(
    items => items.some(c => c.type === 'multi-image-crop')
  )
  if (hasMultiCrop) {
    const ok = window.confirm(
      '⚠️ 画像クロップ修正を含むエクスポートです。\n' +
      'apply-corrections.ts はまだ multi-image-crop に未対応のため、\n' +
      '画像関連の修正は適用されません。続行しますか？'
    )
    if (!ok) return
  }

  const file: CorrectionsFile = {
    version: '1.1.0',
    timestamp: new Date().toISOString(),
    baseGitCommit: report.gitCommit,
    reportTimestamp: report.timestamp,
    corrections: Object.fromEntries(
      Object.entries(reviewState.state.corrections)
        .filter(([, items]) => items.length > 0)
        .map(([qId, items]) => {
          const q = ALL_QUESTIONS.find(q => q.id === qId)
          return [qId, {
            dataHash: q ? generateDataHash(q) : '',
            items,
          }]
        })
    ),
  }
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `corrections-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}, [report, reviewState.state.corrections])
```

- [ ] **Step 8: 問題切替時に cropTarget/pendingCropResult をリセット**

行114〜121 の `navigate` 関数に追加:

```typescript
function navigate(next: number) {
  const clamped = Math.max(0, Math.min(filteredQuestions.length - 1, next))
  setCurrentIndex(clamped)
  reviewState.setLastPosition(filteredQuestions[clamped]?.id ?? '')
  setManualPage(null)
  setCurrentPdfFile(null)
  setCropMode(false)
  setCropTarget(null)
  setPendingCropResult(null)
}
```

- [ ] **Step 9: コミット**

```bash
git add src/dev-tools/review/ReviewPage.tsx
git commit -m "feat(review): add cropTarget, pendingCropResult, scenario group propagation to ReviewPage"
```

---

### Task 5: TextWithImageTab — 共通テキスト+画像編集コンポーネント

**Files:**
- Create: `src/dev-tools/review/components/TextWithImageTab.tsx`
- Create: `src/dev-tools/review/components/TextWithImageTab.module.css`

- [ ] **Step 1: TextWithImageTab コンポーネントを作成**

問題文タブとシナリオタブで共通使用する。テキストエリア + クロップボタン + 画像サムネイル一覧 + 適用ボタン。

```tsx
// src/dev-tools/review/components/TextWithImageTab.tsx
import { useState, useEffect, useRef } from 'react'
import type { CropImage, CropTarget, PendingCropResult } from '../types'
import {
  insertPlaceholder,
  removePlaceholder,
  validateImagePlaceholders,
  nextImageId,
} from '../utils/placeholder-utils'
import styles from './TextWithImageTab.module.css'

interface TextWithImageTabProps {
  target: CropTarget
  initialText: string
  cropImages: CropImage[]
  onApply: (text: string, images: CropImage[]) => void
  onStartCrop: (target: CropTarget) => void
  pendingCropResult: PendingCropResult | null
  onConsumeCropResult: () => void
  previews: Map<string, string>
  onUpdatePreviews: (updater: (prev: Map<string, string>) => Map<string, string>) => void
  disabled?: boolean
  disabledMessage?: string
}

export function TextWithImageTab({
  target,
  initialText,
  cropImages: initialCropImages,
  onApply,
  onStartCrop,
  pendingCropResult,
  onConsumeCropResult,
  previews,
  onUpdatePreviews,
  disabled,
  disabledMessage,
}: TextWithImageTabProps) {
  const [text, setText] = useState(initialText)
  const [images, setImages] = useState<CropImage[]>(initialCropImages)
  const [warnings, setWarnings] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cursorPosRef = useRef<number>(0)

  // initialText が変わったらリセット（問題切替時）
  useEffect(() => {
    setText(initialText)
    setImages(initialCropImages)
    setWarnings([])
  }, [initialText, initialCropImages])

  // カーソル位置を常に追跡
  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    cursorPosRef.current = e.target.selectionStart ?? 0
  }

  function handleSelect(e: React.SyntheticEvent<HTMLTextAreaElement>) {
    cursorPosRef.current = (e.target as HTMLTextAreaElement).selectionStart ?? 0
  }

  // pendingCropResult を消費してプレースホルダー挿入
  useEffect(() => {
    if (!pendingCropResult || pendingCropResult.target !== target) return

    const newId = nextImageId(images)
    const newImage: CropImage = {
      id: newId,
      crop: pendingCropResult.crop,
      pdfFile: pendingCropResult.pdfFile,
      pdfPage: pendingCropResult.pdfPage,
    }

    // テキストにプレースホルダー挿入
    const { text: newText, newCursorPos } = insertPlaceholder(
      text, cursorPosRef.current, newId,
    )
    setText(newText)
    setImages(prev => [...prev, newImage])
    cursorPosRef.current = newCursorPos

    // プレビューを in-memory Map に追加
    if (pendingCropResult.preview) {
      onUpdatePreviews(prev => {
        const next = new Map(prev)
        next.set(`${target}-${newId}`, pendingCropResult.preview)
        return next
      })
    }

    onConsumeCropResult()

    // テキストエリアにフォーカスを戻してカーソル位置を復元
    requestAnimationFrame(() => {
      const ta = textareaRef.current
      if (ta) {
        ta.focus()
        ta.setSelectionRange(newCursorPos, newCursorPos)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCropResult])

  // 画像削除
  function handleRemoveImage(imageId: number) {
    setImages(prev => prev.filter(i => i.id !== imageId))
    setText(prev => removePlaceholder(prev, imageId))
    onUpdatePreviews(prev => {
      const next = new Map(prev)
      next.delete(`${target}-${imageId}`)
      return next
    })
  }

  // 適用
  function handleApply() {
    // バリデーション
    const { orphanPlaceholders, unreferencedImages } = validateImagePlaceholders(text, images)
    const warns: string[] = []
    for (const id of orphanPlaceholders) {
      warns.push(`⚠️ {{image:${id}}} に対応する画像がありません`)
    }
    for (const id of unreferencedImages) {
      warns.push(`⚠️ 画像${id}がテキスト内で参照されていません`)
    }
    setWarnings(warns)

    // 警告があっても適用は可能（ユーザー判断）
    onApply(text.trim(), images)
  }

  const hasChanges = text.trim() !== initialText.trim() || images.length !== initialCropImages.length

  if (disabled) {
    return (
      <div className={styles.section}>
        <p className={styles.hint}>{disabledMessage ?? '編集できません'}</p>
      </div>
    )
  }

  return (
    <div className={styles.section}>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={text}
        onChange={handleTextChange}
        onSelect={handleSelect}
        onClick={handleSelect}
        rows={8}
      />

      <button
        className={styles.cropBtn}
        onClick={() => onStartCrop(target)}
        type="button"
      >
        📷 PDFからクロップ
      </button>

      {/* クロップ済み画像一覧 */}
      {images.length > 0 && (
        <div className={styles.imageList}>
          <span className={styles.imageListLabel}>クロップ済み画像:</span>
          <div className={styles.imageThumbs}>
            {images.map(img => {
              const previewKey = `${target}-${img.id}`
              const previewUrl = previews.get(previewKey)
              return (
                <div key={img.id} className={styles.imageThumb}>
                  {previewUrl ? (
                    <img src={previewUrl} alt={`image:${img.id}`} className={styles.thumbImg} />
                  ) : (
                    <div className={styles.thumbPlaceholder}>📷 {img.id}</div>
                  )}
                  <div className={styles.thumbFooter}>
                    <span className={styles.thumbId}>{img.id}</span>
                    <button
                      className={styles.thumbRemove}
                      onClick={() => handleRemoveImage(img.id)}
                      type="button"
                      title="この画像を削除"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* バリデーション警告 */}
      {warnings.length > 0 && (
        <div className={styles.warnings}>
          {warnings.map((w, i) => (
            <p key={i} className={styles.warning}>{w}</p>
          ))}
        </div>
      )}

      <button
        className={styles.applyBtn}
        onClick={handleApply}
        disabled={!hasChanges}
        type="button"
      >
        適用
      </button>
    </div>
  )
}
```

- [ ] **Step 2: TextWithImageTab.module.css を作成**

```css
/* src/dev-tools/review/components/TextWithImageTab.module.css */

.section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.textarea {
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--border, #e8e0d4);
  border-radius: 0.375rem;
  background: var(--bg, #faf8f5);
  color: var(--text-primary, #2d2a27);
  font-size: 0.8125rem;
  font-family: inherit;
  width: 100%;
  resize: vertical;
  min-height: 5rem;
  line-height: 1.55;
}

.textarea:focus {
  outline: none;
  border-color: var(--accent, #b8860b);
}

.cropBtn {
  padding: 0.4rem 1rem;
  border: 1.5px solid #1565c0;
  border-radius: 0.5rem;
  background: transparent;
  color: #1565c0;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.13s;
  align-self: flex-start;
}

.cropBtn:hover {
  background: #1565c0;
  color: #ffffff;
}

.applyBtn {
  padding: 0.4rem 1.25rem;
  border: 1.5px solid var(--accent, #b8860b);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--accent, #b8860b);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.13s;
  align-self: flex-start;
}

.applyBtn:hover:not(:disabled) {
  background: var(--accent, #b8860b);
  color: #ffffff;
}

.applyBtn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.hint {
  font-size: 0.8125rem;
  color: var(--text-secondary, #8c7e6e);
  margin: 0;
}

/* ========== 画像サムネイル ========== */
.imageList {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.imageListLabel {
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--text-secondary, #8c7e6e);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.imageThumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.imageThumb {
  width: 5rem;
  border: 1px solid var(--border, #e8e0d4);
  border-radius: 0.375rem;
  overflow: hidden;
  background: var(--bg, #faf8f5);
}

.thumbImg {
  width: 100%;
  height: 4rem;
  object-fit: cover;
  display: block;
}

.thumbPlaceholder {
  width: 100%;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  font-size: 0.75rem;
  color: var(--text-secondary, #8c7e6e);
}

.thumbFooter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.15rem 0.3rem;
}

.thumbId {
  font-size: 0.625rem;
  font-weight: 700;
  color: #1565c0;
}

.thumbRemove {
  border: none;
  background: transparent;
  color: var(--text-secondary, #8c7e6e);
  font-size: 0.625rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.thumbRemove:hover {
  color: var(--error, #d32f2f);
}

/* ========== 警告 ========== */
.warnings {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.warning {
  font-size: 0.75rem;
  color: #92400e;
  background: #fffbeb;
  border-left: 3px solid #f59e0b;
  padding: 0.25rem 0.5rem;
  margin: 0;
  border-radius: 0 0.25rem 0.25rem 0;
}
```

- [ ] **Step 3: コミット**

```bash
git add src/dev-tools/review/components/TextWithImageTab.tsx src/dev-tools/review/components/TextWithImageTab.module.css
git commit -m "feat(review): add TextWithImageTab component (shared text+image editing for question/scenario tabs)"
```

---

### Task 6: CorrectionPanel — タブ再編

**Files:**
- Modify: `src/dev-tools/review/components/CorrectionPanel.tsx`

- [ ] **Step 1: CorrectionPanel を全面書き換え**

タブ構成を変更し、新 props を受け取る。既存の選択肢・正答・画像削除タブはそのまま残す。テキストタブは解説・カテゴリのみに縮小。問題文タブとシナリオタブは TextWithImageTab を使う。

```tsx
// src/dev-tools/review/components/CorrectionPanel.tsx
import { useState, useEffect, useCallback } from 'react'
import type { Question } from '../../../types/question'
import type { Correction, CropTarget, CropImage, PendingCropResult } from '../types'
import { TextWithImageTab } from './TextWithImageTab'
import styles from './CorrectionPanel.module.css'

type CorrectionTab = 'question-text' | 'text' | 'choices' | 'answer' | 'scenario' | 'image-remove'

const TEXT_FIELDS = [
  { value: 'explanation', label: '解説' },
  { value: 'category', label: 'カテゴリ' },
] as const

interface CorrectionPanelProps {
  question: Question
  corrections: Correction[]
  onAddCorrection: (correction: Correction) => void
  onAddScenarioCorrection: (corrections: Correction[]) => void
  onRemoveCorrection: (index: number) => void
  onStartCrop: (target: CropTarget) => void
  pendingCropResult: PendingCropResult | null
  onConsumeCropResult: () => void
  previews: Map<string, string>
  onUpdatePreviews: (updater: (prev: Map<string, string>) => Map<string, string>) => void
}

export function CorrectionPanel({
  question,
  corrections,
  onAddCorrection,
  onAddScenarioCorrection,
  onRemoveCorrection,
  onStartCrop,
  pendingCropResult,
  onConsumeCropResult,
  previews,
  onUpdatePreviews,
}: CorrectionPanelProps) {
  const [activeTab, setActiveTab] = useState<CorrectionTab>('question-text')

  // テキスト修正（解説・カテゴリのみ）
  const [textField, setTextField] = useState<'explanation' | 'category'>('explanation')
  const [textValue, setTextValue] = useState('')

  // 選択肢修正
  const [editChoices, setEditChoices] = useState(
    () => (question.choices ?? []).map(c => ({ key: c.key, text: c.text, choice_type: c.choice_type }))
  )

  // 正答修正
  const [answerValue, setAnswerValue] = useState<string>(
    Array.isArray(question.correct_answer)
      ? question.correct_answer.join(', ')
      : String(question.correct_answer)
  )

  // 問題文の既存 multi-image-crop を復元
  const questionCropImages: CropImage[] = (() => {
    const existing = corrections.find(
      c => c.type === 'multi-image-crop' && c.target === 'question'
    )
    return existing?.type === 'multi-image-crop' ? existing.images : []
  })()

  // シナリオの既存 multi-image-crop を復元
  const scenarioCropImages: CropImage[] = (() => {
    const existing = corrections.find(
      c => c.type === 'multi-image-crop' && c.target === 'scenario'
    )
    return existing?.type === 'multi-image-crop' ? existing.images : []
  })()

  function getFieldValue(field: 'explanation' | 'category'): string {
    if (field === 'explanation') return question.explanation ?? ''
    return question.category ?? ''
  }

  // 問題が切り替わったらリセット
  useEffect(() => {
    setTextField('explanation')
    setTextValue(question.explanation ?? '')
    setEditChoices((question.choices ?? []).map(c => ({ key: c.key, text: c.text, choice_type: c.choice_type })))
    setAnswerValue(
      Array.isArray(question.correct_answer)
        ? question.correct_answer.join(', ')
        : String(question.correct_answer)
    )
    setActiveTab('question-text')
  }, [question.id, question.choices, question.correct_answer, question.question_text])

  function handleFieldChange(field: 'explanation' | 'category') {
    setTextField(field)
    setTextValue(getFieldValue(field))
  }

  function applyText() {
    if (!textValue.trim()) return
    if (textValue.trim() === getFieldValue(textField).trim()) return
    onAddCorrection({ type: 'text', field: textField, value: textValue.trim() })
  }

  function applyChoices() {
    const newChoices = editChoices.map(c => ({
      key: c.key,
      text: c.text,
      ...(c.choice_type ? { choice_type: c.choice_type } : {}),
    }))
    onAddCorrection({ type: 'choices', value: newChoices })
  }

  function applyAnswer() {
    const parts = answerValue.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
    if (parts.length === 0) return
    const value = parts.length === 1 ? parts[0] : parts
    onAddCorrection({ type: 'answer', value })
  }

  function handleImageRemove() {
    if (!window.confirm('画像URLを削除してテキストのみ問題に変更します。よろしいですか？')) return
    onAddCorrection({ type: 'image-remove' })
  }

  // 問題文タブの適用
  const handleApplyQuestionText = useCallback((text: string, images: CropImage[]) => {
    onAddCorrection({ type: 'text', field: 'question_text', value: text })
    if (images.length > 0) {
      onAddCorrection({ type: 'multi-image-crop', target: 'question', images })
    }
  }, [onAddCorrection])

  // シナリオタブの適用（連問グループ伝播）
  const handleApplyScenario = useCallback((text: string, images: CropImage[]) => {
    const corrs: Correction[] = [
      { type: 'text', field: 'linked_scenario', value: text },
    ]
    if (images.length > 0) {
      corrs.push({ type: 'multi-image-crop', target: 'scenario', images })
    }
    onAddScenarioCorrection(corrs)
  }, [onAddScenarioCorrection])

  function correctionLabel(c: Correction): string {
    switch (c.type) {
      case 'text': return `テキスト修正 [${c.field}]: ${c.value.slice(0, 40)}${c.value.length > 40 ? '…' : ''}`
      case 'choices': return `選択肢修正 (${c.value.length}件)`
      case 'answer': return `正答修正: ${Array.isArray(c.value) ? c.value.join(', ') : c.value}`
      case 'image-crop': return `画像クロップ (${c.pdfFile} p.${c.pdfPage})`
      case 'image-remove': return '画像削除'
      case 'set-section': return `区分設定: ${c.value}`
      case 'set-subject': return `科目設定: ${c.value}`
      case 'set-visual-content-type': return `ビジュアルタイプ: ${c.value}`
      case 'set-display-mode': return `表示モード: ${c.value}`
      case 'set-linked-group': return `連問グループ: ${c.value}`
      case 'set-linked-scenario': return `シナリオ: ${c.value}`
      case 'multi-image-crop': return `画像クロップ [${c.target}] (${c.images.length}枚)`
    }
  }

  const tabs: Array<{ id: CorrectionTab; label: string }> = [
    { id: 'question-text', label: '問題文' },
    { id: 'text', label: 'テキスト' },
    { id: 'choices', label: '選択肢' },
    { id: 'answer', label: '正答' },
    { id: 'scenario', label: 'シナリオ' },
    { id: 'image-remove', label: '画像削除' },
  ]

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>修正入力</span>
        {corrections.length > 0 && (
          <span className={styles.badge}>{corrections.length}件</span>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.tabs} role="tablist">
          {tabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>
          {/* 問題文タブ（テキスト+画像統合） */}
          {activeTab === 'question-text' && (
            <TextWithImageTab
              target="question"
              initialText={question.question_text ?? ''}
              cropImages={questionCropImages}
              onApply={handleApplyQuestionText}
              onStartCrop={onStartCrop}
              pendingCropResult={pendingCropResult}
              onConsumeCropResult={onConsumeCropResult}
              previews={previews}
              onUpdatePreviews={onUpdatePreviews}
            />
          )}

          {/* テキスト修正（解説・カテゴリのみ） */}
          {activeTab === 'text' && (
            <div className={styles.section}>
              <label className={styles.label}>フィールド</label>
              <select
                className={styles.select}
                value={textField}
                onChange={e => handleFieldChange(e.target.value as typeof textField)}
              >
                {TEXT_FIELDS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>

              <label className={styles.label}>修正後テキスト（不要部分を削除して適用）</label>
              <textarea
                className={styles.textarea}
                value={textValue}
                onChange={e => setTextValue(e.target.value)}
                rows={6}
              />

              <button
                className={styles.applyBtn}
                onClick={applyText}
                disabled={!textValue.trim() || textValue.trim() === getFieldValue(textField).trim()}
                type="button"
              >
                適用
              </button>
            </div>
          )}

          {/* 選択肢修正 */}
          {activeTab === 'choices' && (
            <div className={styles.section}>
              <div className={styles.choiceList}>
                {editChoices.map((c, idx) => (
                  <div key={c.key} className={styles.choiceRow}>
                    <span className={styles.choiceKeyLabel}>{c.key}</span>
                    <input
                      className={styles.choiceInput}
                      type="text"
                      value={c.text}
                      onChange={e => {
                        const next = [...editChoices]
                        next[idx] = { ...next[idx], text: e.target.value }
                        setEditChoices(next)
                      }}
                      placeholder={`選択肢 ${c.key}`}
                    />
                    <input
                      className={styles.choiceTypeInput}
                      type="text"
                      value={c.choice_type ?? ''}
                      onChange={e => {
                        const next = [...editChoices]
                        next[idx] = { ...next[idx], choice_type: e.target.value as typeof c.choice_type }
                        setEditChoices(next)
                      }}
                      placeholder="type (省略可)"
                    />
                  </div>
                ))}
              </div>

              <button
                className={styles.applyBtn}
                onClick={applyChoices}
                type="button"
              >
                選択肢を適用
              </button>
            </div>
          )}

          {/* 正答修正 */}
          {activeTab === 'answer' && (
            <div className={styles.section}>
              <label className={styles.label}>
                正答（複数の場合はカンマ区切り: 1, 3）
              </label>
              <input
                className={styles.input}
                type="text"
                value={answerValue}
                onChange={e => setAnswerValue(e.target.value)}
                placeholder="例: 2  または  1, 3"
              />
              <p className={styles.hint}>
                現在: {Array.isArray(question.correct_answer) ? question.correct_answer.join(', ') : question.correct_answer}
              </p>

              <button
                className={styles.applyBtn}
                onClick={applyAnswer}
                type="button"
              >
                適用
              </button>
            </div>
          )}

          {/* シナリオタブ（テキスト+画像統合） */}
          {activeTab === 'scenario' && (
            <TextWithImageTab
              target="scenario"
              initialText={question.linked_scenario ?? ''}
              cropImages={scenarioCropImages}
              onApply={handleApplyScenario}
              onStartCrop={onStartCrop}
              pendingCropResult={pendingCropResult}
              onConsumeCropResult={onConsumeCropResult}
              previews={previews}
              onUpdatePreviews={onUpdatePreviews}
              disabled={!question.linked_scenario}
              disabledMessage="この問題にシナリオはありません"
            />
          )}

          {/* 画像削除 */}
          {activeTab === 'image-remove' && (
            <div className={styles.section}>
              {question.image_url ? (
                <>
                  <p className={styles.description}>
                    現在の画像URL: <code className={styles.code}>{question.image_url}</code>
                  </p>
                  <button
                    className={styles.deleteBtn}
                    onClick={handleImageRemove}
                    type="button"
                  >
                    画像を削除
                  </button>
                </>
              ) : (
                <p className={styles.hint}>この問題には画像がありません。</p>
              )}
            </div>
          )}
        </div>

        {/* 適用済み修正リスト */}
        {corrections.length > 0 && (
          <div className={styles.correctionList}>
            <h4 className={styles.listTitle}>適用済み修正 ({corrections.length}件)</h4>
            {corrections.map((c, idx) => (
              <div key={idx} className={styles.correctionItem}>
                <span className={styles.correctionLabel}>{correctionLabel(c)}</span>
                <button
                  className={styles.removeBtn}
                  onClick={() => onRemoveCorrection(idx)}
                  type="button"
                  title="この修正を削除"
                  aria-label="修正を削除"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 型チェック**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsc --noEmit 2>&1 | head -20`

Expected: エラーなし（全ファイルの型が整合）

- [ ] **Step 3: コミット**

```bash
git add src/dev-tools/review/components/CorrectionPanel.tsx
git commit -m "feat(review): refactor CorrectionPanel with question-text/scenario tabs using TextWithImageTab"
```

---

### Task 7: ReviewCard — シナリオ画像プレビュー

**Files:**
- Modify: `src/dev-tools/review/components/ReviewCard.tsx`
- Modify: `src/dev-tools/review/components/ReviewCard.module.css`

- [ ] **Step 1: ReviewCard に corrections, previews props を追加し、シナリオ画像プレビューを表示**

`src/dev-tools/review/components/ReviewCard.tsx` を変更:

import に追加:
```typescript
import type { Correction, CropImage } from '../types'
import { parseTextWithImages } from '../utils/placeholder-utils'
```

ReviewCardProps に追加:
```typescript
interface ReviewCardProps {
  // ...既存
  corrections: Correction[]
  previews: Map<string, string>
}
```

関数パラメータに `corrections, previews` を追加。

シナリオ表示部分（行86〜97）を変更:

```tsx
{/* ===== 連問シナリオ ===== */}
{question.linked_scenario && (() => {
  // corrections から scenario の修正テキストと画像を取得
  const scenarioTextCorrection = corrections.find(
    c => c.type === 'text' && c.field === 'linked_scenario'
  )
  const scenarioText = scenarioTextCorrection?.type === 'text'
    ? scenarioTextCorrection.value
    : question.linked_scenario

  const scenarioCropCorrection = corrections.find(
    c => c.type === 'multi-image-crop' && c.target === 'scenario'
  )
  const scenarioImages: CropImage[] = scenarioCropCorrection?.type === 'multi-image-crop'
    ? scenarioCropCorrection.images
    : []

  const blocks = parseTextWithImages(scenarioText, scenarioImages)

  return (
    <div className={styles.scenarioArea}>
      <h3 className={styles.sectionTitle}>
        📋 連問シナリオ
        {question.linked_group && (
          <span className={styles.linkedGroupTag}>{question.linked_group}</span>
        )}
      </h3>
      {blocks.map((block, i) => {
        if (block.type === 'text') {
          return <p key={i} className={styles.scenarioText}>{block.content}</p>
        }
        const previewUrl = previews.get(`scenario-${block.imageId}`)
        if (previewUrl) {
          return (
            <img
              key={i}
              src={previewUrl}
              alt={`シナリオ画像 ${block.imageId}`}
              className={styles.scenarioImage}
            />
          )
        }
        return (
          <span key={i} className={styles.imageBadge}>
            📷 image:{block.imageId}
          </span>
        )
      })}
    </div>
  )
})()}
```

- [ ] **Step 2: ReviewCard.module.css にシナリオ画像スタイルを追加**

`.scenarioArea` の後（行66付近）に追加:

```css
.scenarioImage {
  max-height: 150px;
  border-radius: 0.5rem;
  border: 1px solid #bdd8f0;
  margin: 0.375rem 0;
  display: block;
  object-fit: contain;
}

.imageBadge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  background: #e0edf9;
  border: 1px solid #bdd8f0;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: #4a90d9;
  margin: 0.25rem 0;
}
```

- [ ] **Step 3: 型チェック**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsc --noEmit 2>&1 | head -10`

Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/dev-tools/review/components/ReviewCard.tsx src/dev-tools/review/components/ReviewCard.module.css
git commit -m "feat(review): add scenario image preview in ReviewCard using parseTextWithImages"
```

---

### Task 8: apply-corrections.ts — バージョンチェック追加

**Files:**
- Modify: `scripts/apply-corrections.ts`

- [ ] **Step 1: CorrectionsFile の型にオプショナルな version を追加し、バージョンチェック**

`scripts/apply-corrections.ts` の `CorrectionsFile` インターフェース（行57〜61）に `version?` を追加:

```typescript
interface CorrectionsFile {
  version?: string
  reportTimestamp: string
  baseGitCommit: string
  corrections: Correction[]
}
```

`main()` 関数内、corrections.json を読み込んだ直後（行199〜203の間）にバージョンチェックを追加:

```typescript
  // バージョンチェック（v1.1.0以降は未対応）
  if (correctionsFile.version && correctionsFile.version !== '1.0.0') {
    err(`未対応の corrections バージョン: ${correctionsFile.version}`)
    err('このスクリプトは v1.0.0 のみ対応しています。')
    process.exit(1)
  }
```

- [ ] **Step 2: CorrectionType に 'multi-image-crop' を追加（warn で処理）**

`CorrectionType` 型（行33〜45）に追加:

```typescript
type CorrectionType =
  | 'text'
  | 'choices'
  | 'answer'
  | 'image-remove'
  | 'image-crop'
  | 'multi-image-crop'
  | 'set-section'
  // ... 既存のまま
```

`applyCorrection` 関数の switch に case 追加:

```typescript
    case 'multi-image-crop':
      // 未実装（レビューUIで記録するが適用は将来対応）
      warn(`  multi-image-crop はまだ適用未対応です（スキップ）`)
      break
```

- [ ] **Step 3: コミット**

```bash
git add scripts/apply-corrections.ts
git commit -m "feat(review): add version check and multi-image-crop handling to apply-corrections.ts"
```

---

### Task 9: テスト全体実行 & ビルド確認

**Files:** なし（検証のみ）

- [ ] **Step 1: 全テスト実行**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx vitest run 2>&1 | tail -20`

Expected: 全テスト PASS（既存テスト + 新規 placeholder-utils テスト 12件）

- [ ] **Step 2: ビルド確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npm run build 2>&1 | tail -10`

Expected: ビルド成功（`noUnusedLocals: true` でエラーなし）

- [ ] **Step 3: 型チェック**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsc --noEmit 2>&1 | head -10`

Expected: エラーなし

---

### Task 10: ブラウザ動作確認

**Files:** なし（手動検証）

- [ ] **Step 1: dev サーバー起動**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npm run dev`

- [ ] **Step 2: 確認項目チェックリスト**

ブラウザで `localhost:5173/dev-tools/review` を開き、以下を確認:

1. タブが「問題文 / テキスト / 選択肢 / 正答 / シナリオ / 画像削除」の6つ表示される
2. 問題文タブ: テキストエリアに問題文が表示される。「PDFからクロップ」ボタンがある
3. シナリオタブ: 連問の場合はテキストエリアにシナリオが表示される。非連問は「シナリオはありません」
4. PDFからクロップ → ドラッグ完了 → テキストエリアに `{{image:1}}` が自動挿入される
5. クロップ済み画像のサムネイルが表示される
6. 「×削除」で画像とプレースホルダーが同時に消える
7. 「適用」ボタンで修正が適用済みリストに追加される
8. シナリオ適用時に連問グループ全問に伝播する（別の問題に移動して corrections を確認）
9. ReviewCard のシナリオエリアにクロップ画像が表示される
10. export（Eキー）で `multi-image-crop` 含む場合に警告ダイアログが出る

---

## GPT-5.4 レビュー対応（実装時に適用すること）

### レビュー結果サマリ

| # | 優先度 | 指摘 | 修正方針 |
|---|--------|------|----------|
| 1 | P1 | `pendingCropResult` を TextWithImageTab の useEffect で消費するが、タブ切替で unmount されると未消費になる | CorrectionPanel 側で常時消費する。TextWithImageTab には `draftCropImages` と `draftText` を props で渡すだけ |
| 2 | P1 | 既存 correction の復元がない。`initialText` が常に元データ固定。再適用で古い correction が残る | TextWithImageTab の initialText に既存 text correction の値を反映。適用時は `onReplaceCorrections` で同 type/field を置換 |
| 3 | P1 | 画像全削除時に `images.length > 0` チェックで `multi-image-crop` correction が残留する | `images.length === 0` のときは既存の `multi-image-crop` correction を明示的に除去する |
| 4 | P1 | `apply-corrections.ts` の CorrectionsFile 型が UI export と噛み合わない（フラット配列 vs Record） | Task 8 で `version` フィールド対応のみに絞る。schema 差異は既存問題であり本 scope 外 |
| 5 | P2 | `React.MouseEvent` 等の名前空間型が PdfCropper のコードに残っている | `import type { MouseEvent } from 'react'` に修正 |
| 6 | P2 | 設計書の「連問グループ N 問に適用しました」フィードバックが未実装 | `handleAddScenarioCorrection` の戻り値で適用件数を返し、CorrectionPanel でメッセージ表示 |
| 7 | P2 | `removePlaceholder` が最初の1個しか消さない | `replace` → `replaceAll` 相当にし、テスト追加 |
| 8 | P2 | テスト不足（correction 置換、export version 等） | correction-utils.ts を新設し、置換ロジックを純粋関数として抽出＋テスト |

### 具体的な修正内容

#### 修正1: pendingCropResult の消費を CorrectionPanel に移動

TextWithImageTab から `pendingCropResult` / `onConsumeCropResult` props を**削除**。代わりに CorrectionPanel が pendingCropResult を受け取り、useEffect で消費して各タブの draft state を更新する:

```typescript
// CorrectionPanel 内
const [questionDraftText, setQuestionDraftText] = useState(question.question_text ?? '')
const [questionDraftImages, setQuestionDraftImages] = useState<CropImage[]>(questionCropImages)
const [scenarioDraftText, setScenarioDraftText] = useState(question.linked_scenario ?? '')
const [scenarioDraftImages, setScenarioDraftImages] = useState<CropImage[]>(scenarioCropImages)

// pendingCropResult を常時消費（タブ状態に関係なく）
useEffect(() => {
  if (!pendingCropResult) return
  const { target } = pendingCropResult
  const newId = target === 'question'
    ? nextImageId(questionDraftImages)
    : nextImageId(scenarioDraftImages)

  const newImage: CropImage = {
    id: newId,
    crop: pendingCropResult.crop,
    pdfFile: pendingCropResult.pdfFile,
    pdfPage: pendingCropResult.pdfPage,
  }

  if (target === 'question') {
    const { text } = insertPlaceholder(questionDraftText, questionCursorPos.current, newId)
    setQuestionDraftText(text)
    setQuestionDraftImages(prev => [...prev, newImage])
  } else {
    const { text } = insertPlaceholder(scenarioDraftText, scenarioCursorPos.current, newId)
    setScenarioDraftText(text)
    setScenarioDraftImages(prev => [...prev, newImage])
  }

  // preview を in-memory Map に追加
  if (pendingCropResult.preview) {
    onUpdatePreviews(prev => {
      const next = new Map(prev)
      next.set(`${target}-${newId}`, pendingCropResult.preview)
      return next
    })
  }

  onConsumeCropResult()
  // タブを自動切替
  setActiveTab(target === 'question' ? 'question-text' : 'scenario')
}, [pendingCropResult])
```

TextWithImageTab は `text`, `images`, `onTextChange`, `onRemoveImage`, `onApply` を props として受け取る（状態を自分で持たない）。

#### 修正2: 既存 correction の復元 + 置換API

**correction-utils.ts** を新設:

```typescript
// src/dev-tools/review/utils/correction-utils.ts
import type { Correction, CropTarget } from '../types'

/** 同じ type+field/target の correction を置換する（なければ追加） */
export function replaceCorrections(
  existing: Correction[],
  newCorrections: Correction[],
): Correction[] {
  const result = [...existing]
  for (const nc of newCorrections) {
    const idx = result.findIndex(c => isSameKind(c, nc))
    if (idx >= 0) {
      result[idx] = nc
    } else {
      result.push(nc)
    }
  }
  return result
}

/** 指定 type+target の correction を除去 */
export function removeCorrection(
  existing: Correction[],
  type: string,
  target?: CropTarget,
): Correction[] {
  return existing.filter(c => {
    if (c.type !== type) return true
    if (target && 'target' in c && c.target !== target) return true
    return false
  })
}

function isSameKind(a: Correction, b: Correction): boolean {
  if (a.type !== b.type) return false
  if (a.type === 'text' && b.type === 'text') return a.field === b.field
  if (a.type === 'multi-image-crop' && b.type === 'multi-image-crop') return a.target === b.target
  return true
}

/** 既存 corrections から特定フィールドのテキスト修正値を取得（なければ元値） */
export function getEffectiveText(
  corrections: Correction[],
  field: string,
  originalValue: string,
): string {
  const found = corrections.find(c => c.type === 'text' && c.field === field)
  return found?.type === 'text' ? found.value : originalValue
}
```

ReviewPage の `onAddCorrection` を `onReplaceCorrections` に変更:

```typescript
const handleReplaceCorrections = useCallback((newCorrections: Correction[]) => {
  if (!currentQuestion) return
  const existing = reviewState.state.corrections[currentQuestion.id] ?? []
  const updated = replaceCorrections(existing, newCorrections)
  reviewState.save({
    ...reviewState.state,
    corrections: {
      ...reviewState.state.corrections,
      [currentQuestion.id]: updated,
    },
  })
}, [currentQuestion, reviewState])
```

TextWithImageTab の initialText には `getEffectiveText(corrections, field, originalValue)` を使う。

#### 修正3: 画像全削除時の correction 除去

```typescript
// CorrectionPanel の handleApplyQuestionText
function handleApplyQuestionText(text: string, images: CropImage[]) {
  const corrs: Correction[] = [
    { type: 'text', field: 'question_text', value: text },
  ]
  if (images.length > 0) {
    corrs.push({ type: 'multi-image-crop', target: 'question', images })
  }
  // 画像0枚の場合、既存の multi-image-crop を除去
  const existing = corrections.filter(c =>
    !(c.type === 'multi-image-crop' && c.target === 'question')
  )
  onReplaceCorrections(corrs)  // replaceCorrections が同 type を置換
}
```

`replaceCorrections` は `images.length > 0` のときは置換、`images.length === 0` のときは除去する分岐を `removeCorrection` + `replaceCorrections` で組み合わせる。

#### 修正5: React 名前空間型の修正

PdfCropper.tsx の Task 3 コード内:

```typescript
// 変更前
(e: React.MouseEvent)

// 変更後（import に追加）
import type { MouseEvent } from 'react'
// ...
(e: MouseEvent)
```

**注意**: PdfCropper.tsx の既存コードが既に `React.MouseEvent` を使っている。しかし既存コードの import は `import { useState, useRef, useCallback, useEffect } from 'react'` であり、`React` 名前空間は使っていない。既存の `(e: React.MouseEvent)` は実際にはプロジェクト規約違反だが動作している可能性がある。実装時に確認し、`import type { MouseEvent } from 'react'` に統一すること。

#### 修正6: 連問伝播フィードバック

CorrectionPanel にフィードバックメッセージ state を追加:

```typescript
const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

// handleApplyScenario の戻り値で件数を受け取る
// ReviewPage 側: handleAddScenarioCorrection が適用件数を返す
const handleAddScenarioCorrection = useCallback((corrections: Correction[]): number => {
  // ...伝播ロジック...
  return groupQuestions.length
}, [...])

// CorrectionPanel 側:
function handleScenarioApply(text: string, images: CropImage[]) {
  const corrs = [...]
  const count = onAddScenarioCorrection(corrs)
  if (count > 1) {
    setFeedbackMessage(`✅ 連問グループの ${count}問に適用しました`)
    setTimeout(() => setFeedbackMessage(null), 3000)
  }
}
```

#### 修正7: removePlaceholder のグローバル置換

```typescript
// 変更前
const plain = new RegExp(`\\{\\{image:${imageId}\\}\\}`)
return text.replace(plain, '')

// 変更後
const plain = new RegExp(`\\{\\{image:${imageId}\\}\\}`, 'g')
return text.replace(plain, '')
```

改行付きパターンも同様に `g` フラグ追加。テスト追加:

```typescript
it('同じIDのプレースホルダーが複数あれば全て除去', () => {
  expect(removePlaceholder('{{image:1}}中間{{image:1}}', 1)).toBe('中間')
})
```

#### 修正8: correction-utils のテスト

```typescript
// src/dev-tools/review/utils/__tests__/correction-utils.test.ts
import { describe, it, expect } from 'vitest'
import { replaceCorrections, removeCorrection, getEffectiveText } from '../correction-utils'
import type { Correction } from '../../types'

describe('replaceCorrections', () => {
  it('同じ type+field の text correction を置換する', () => {
    const existing: Correction[] = [
      { type: 'text', field: 'question_text', value: '旧テキスト' },
    ]
    const result = replaceCorrections(existing, [
      { type: 'text', field: 'question_text', value: '新テキスト' },
    ])
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ type: 'text', field: 'question_text', value: '新テキスト' })
  })

  it('異なる field は追加される', () => {
    const existing: Correction[] = [
      { type: 'text', field: 'question_text', value: 'テキスト' },
    ]
    const result = replaceCorrections(existing, [
      { type: 'text', field: 'explanation', value: '解説' },
    ])
    expect(result).toHaveLength(2)
  })

  it('multi-image-crop は target で置換を判定', () => {
    const crop = { x: 0, y: 0, w: 1, h: 1, viewportWidth: 800, viewportHeight: 1130, scale: 1.5, rotation: 0 as const }
    const existing: Correction[] = [
      { type: 'multi-image-crop', target: 'scenario', images: [{ id: 1, crop, pdfFile: 'a.pdf', pdfPage: 1 }] },
    ]
    const result = replaceCorrections(existing, [
      { type: 'multi-image-crop', target: 'scenario', images: [] },
    ])
    expect(result).toHaveLength(1)
    expect(result[0].type === 'multi-image-crop' && result[0].images).toEqual([])
  })
})

describe('getEffectiveText', () => {
  it('correction があればその値を返す', () => {
    const corrections: Correction[] = [
      { type: 'text', field: 'question_text', value: '修正後' },
    ]
    expect(getEffectiveText(corrections, 'question_text', '元テキスト')).toBe('修正後')
  })

  it('correction がなければ元値を返す', () => {
    expect(getEffectiveText([], 'question_text', '元テキスト')).toBe('元テキスト')
  })
})
```

### ファイル構成（追加分）

| ファイル | 役割 | 操作 |
|---------|------|------|
| `src/dev-tools/review/utils/correction-utils.ts` | correction の置換・除去・取得（純粋関数） | 新規 |
| `src/dev-tools/review/utils/__tests__/correction-utils.test.ts` | 上記のテスト | 新規 |
