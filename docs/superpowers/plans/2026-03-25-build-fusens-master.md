# build-fusens-master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** OCR生データ（ocr-results.json）を付箋マスターJSON（fusens-master.json）に変換するスクリプトを実装する。

**Architecture:** ocr-results.json（ページ単位）を読み込み、各noteに安定IDを採番し、subjectを正規化して、fusens-master.json（付箋単位のRecord）に出力する。source fingerprintベースのマージと`--stats`/`--unreviewed`のCLIコマンドも提供する。

**Tech Stack:** TypeScript (tsx), Node.js fs, vitest

**Spec:** `docs/superpowers/specs/2026-03-24-fusens-master-layer-design.md`

---

## File Structure

| File | Role |
|------|------|
| `scripts/build-fusens-master.ts` | **Create** — メインスクリプト |
| `scripts/lib/fusens-master-types.ts` | **Create** — Fusen/FusenMaster 型定義 |
| `scripts/lib/normalize-subject.ts` | **Create** — subject正規化ロジック |
| `scripts/__tests__/build-fusens-master.test.ts` | **Create** — テスト |

---

### Task 1: 型定義ファイル

**Files:**
- Create: `scripts/lib/fusens-master-types.ts`

- [ ] **Step 1: 型定義を作成**

```typescript
// scripts/lib/fusens-master-types.ts
import type { QuestionSubject } from '../../src/types/question'

export type FusenNoteType = 'knowledge' | 'mnemonic' | 'solution' | 'caution' | 'related'
export type FusenStatus = 'active' | 'draft' | 'archived' | 'duplicate'

export interface FusenSource {
  pdf: string
  page: number
  noteIndex: number
  bbox: [number, number, number, number]
}

export interface Fusen {
  id: string
  title: string
  body: string
  imageFile: string
  subject: QuestionSubject
  noteType: FusenNoteType
  tags: string[]
  source: FusenSource
  topicId: string | null
  linkedQuestionIds: string[]
  importance: number
  tier: 'free' | 'premium'
  status: FusenStatus
  reviewedAt: string | null
  notes: string
}

export interface FusenMaster {
  version: number
  generatedAt: string
  fusens: Record<string, Fusen>
}

/** ocr-results.json のnote 1件 */
export interface OcrNote {
  title: string
  body: string
  subject: string
  note_type: string
  tags: string[]
  bbox?: [number, number, number, number]
  imageFile?: string
}

/** ocr-results.json の1ページ */
export interface OcrPageResult {
  page: number
  notes: OcrNote[]
}
```

- [ ] **Step 2: コミット**

```bash
git add scripts/lib/fusens-master-types.ts
git commit -m "feat: add Fusen/FusenMaster type definitions"
```

---

### Task 2: subject正規化

**Files:**
- Create: `scripts/lib/normalize-subject.ts`
- Create: `scripts/__tests__/build-fusens-master.test.ts`

- [ ] **Step 1: テストを書く**

```typescript
// scripts/__tests__/build-fusens-master.test.ts
import { describe, it, expect } from 'vitest'
import { normalizeSubject } from '../lib/normalize-subject'

describe('normalizeSubject', () => {
  it('returns valid subject as-is', () => {
    expect(normalizeSubject('薬理')).toBe('薬理')
    expect(normalizeSubject('病態・薬物治療')).toBe('病態・薬物治療')
  })

  it('takes first subject from pipe-separated', () => {
    expect(normalizeSubject('物理|化学')).toBe('物理')
    expect(normalizeSubject('物理|薬剤')).toBe('物理')
  })

  it('falls back to 物理 for invalid subject', () => {
    expect(normalizeSubject('unknown')).toBe('物理')
    expect(normalizeSubject('')).toBe('物理')
  })
})
```

- [ ] **Step 2: テスト実行して失敗を確認**

```bash
npx vitest run scripts/__tests__/build-fusens-master.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: 実装**

```typescript
// scripts/lib/normalize-subject.ts
import type { QuestionSubject } from '../../src/types/question'

const VALID_SUBJECTS: QuestionSubject[] = [
  '物理', '化学', '生物', '衛生', '薬理',
  '薬剤', '病態・薬物治療', '法規・制度・倫理', '実務',
]

export function normalizeSubject(raw: string): QuestionSubject {
  // パイプ区切りの場合は最初の科目を取る
  const first = raw.split('|')[0].trim()
  if (VALID_SUBJECTS.includes(first as QuestionSubject)) {
    return first as QuestionSubject
  }
  return '物理' // フォールバック
}
```

- [ ] **Step 4: テスト実行してパスを確認**

```bash
npx vitest run scripts/__tests__/build-fusens-master.test.ts
```

Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add scripts/lib/normalize-subject.ts scripts/__tests__/build-fusens-master.test.ts
git commit -m "feat: add normalizeSubject with tests"
```

---

### Task 3: OCR→Master変換ロジック（コア）

**Files:**
- Modify: `scripts/__tests__/build-fusens-master.test.ts`

- [ ] **Step 1: 変換ロジックのテストを追加**

```typescript
// scripts/__tests__/build-fusens-master.test.ts に追加
import { ocrToMaster, generateFingerprint, getNextId } from '../lib/fusens-master-core'
import type { OcrPageResult, FusenMaster } from '../lib/fusens-master-types'

describe('generateFingerprint', () => {
  it('creates consistent fingerprint from source fields', () => {
    expect(generateFingerprint('test.pdf', 1, 0)).toBe('test.pdf:1:0')
    expect(generateFingerprint('test.pdf', 10, 3)).toBe('test.pdf:10:3')
  })
})

describe('getNextId', () => {
  it('returns fusen-001 for empty master', () => {
    expect(getNextId({})).toBe('fusen-001')
  })
  it('increments from highest existing ID', () => {
    expect(getNextId({ 'fusen-003': {} as any, 'fusen-001': {} as any })).toBe('fusen-004')
  })
  it('handles IDs over 999', () => {
    expect(getNextId({ 'fusen-999': {} as any })).toBe('fusen-1000')
  })
})

describe('ocrToMaster', () => {
  const sampleOcr: OcrPageResult[] = [
    {
      page: 1,
      notes: [
        {
          title: 'SI基本単位',
          body: 'Cd n A K s mol kg',
          subject: '物理',
          note_type: 'mnemonic',
          tags: ['SI単位'],
          bbox: [88, 56, 200, 305],
          imageFile: 'page-001/note-01.png',
        },
        {
          title: 'ppm換算',
          body: 'ppm = mg/L',
          subject: '物理|薬剤',
          note_type: 'knowledge',
          tags: ['ppm'],
          bbox: [210, 320, 320, 580],
          imageFile: 'page-001/note-02.png',
        },
      ],
    },
    { page: 2, notes: [] }, // 空ページ → スキップ
  ]

  it('converts OCR pages to master with stable IDs', () => {
    const master = ocrToMaster(sampleOcr, 'test.pdf')
    const fusens = Object.values(master.fusens)
    expect(fusens).toHaveLength(2)
    expect(fusens[0].id).toBe('fusen-001')
    expect(fusens[1].id).toBe('fusen-002')
  })

  it('normalizes pipe-separated subject', () => {
    const master = ocrToMaster(sampleOcr, 'test.pdf')
    expect(master.fusens['fusen-002'].subject).toBe('物理')
  })

  it('sets source fingerprint correctly', () => {
    const master = ocrToMaster(sampleOcr, 'test.pdf')
    const f = master.fusens['fusen-001']
    expect(f.source.pdf).toBe('test.pdf')
    expect(f.source.page).toBe(1)
    expect(f.source.noteIndex).toBe(0)
  })

  it('skips empty pages', () => {
    const master = ocrToMaster(sampleOcr, 'test.pdf')
    expect(Object.keys(master.fusens)).toHaveLength(2)
  })

  it('defaults topicId to null and status to draft', () => {
    const master = ocrToMaster(sampleOcr, 'test.pdf')
    const f = master.fusens['fusen-001']
    expect(f.topicId).toBeNull()
    expect(f.status).toBe('draft')
    expect(f.importance).toBe(0)
    expect(f.tier).toBe('free')
  })

  it('maps note_type to noteType', () => {
    const master = ocrToMaster(sampleOcr, 'test.pdf')
    expect(master.fusens['fusen-001'].noteType).toBe('mnemonic')
    expect(master.fusens['fusen-002'].noteType).toBe('knowledge')
  })
})
```

- [ ] **Step 2: テスト実行して失敗を確認**

```bash
npx vitest run scripts/__tests__/build-fusens-master.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: コアロジックを実装**

```typescript
// scripts/lib/fusens-master-core.ts
import type {
  Fusen, FusenMaster, FusenNoteType, OcrPageResult,
} from './fusens-master-types'
import { normalizeSubject } from './normalize-subject'

const VALID_NOTE_TYPES: FusenNoteType[] = [
  'knowledge', 'mnemonic', 'solution', 'caution', 'related',
]

function normalizeNoteType(raw: string): FusenNoteType {
  if (VALID_NOTE_TYPES.includes(raw as FusenNoteType)) return raw as FusenNoteType
  return 'knowledge'
}

export function generateFingerprint(pdf: string, page: number, noteIndex: number): string {
  return `${pdf}:${page}:${noteIndex}`
}

export function getNextId(fusens: Record<string, Fusen>): string {
  const ids = Object.keys(fusens)
  if (ids.length === 0) return 'fusen-001'
  const maxNum = Math.max(...ids.map(id => parseInt(id.replace('fusen-', ''), 10)))
  const next = maxNum + 1
  return `fusen-${String(next).padStart(3, '0')}`
}

function formatId(num: number): string {
  return `fusen-${String(num).padStart(3, '0')}`
}

export function ocrToMaster(
  ocrPages: OcrPageResult[],
  pdfName: string,
  existingMaster?: FusenMaster,
): FusenMaster {
  const fusens: Record<string, Fusen> = existingMaster
    ? { ...existingMaster.fusens }
    : {}

  // 既存fingerprint集合（マージ時の重複スキップ用）
  const existingFingerprints = new Set(
    Object.values(fusens).map(f =>
      generateFingerprint(f.source.pdf, f.source.page, f.source.noteIndex)
    )
  )

  // 次のID番号を算出
  let nextNum = Object.keys(fusens).length === 0
    ? 1
    : Math.max(...Object.keys(fusens).map(id => parseInt(id.replace('fusen-', ''), 10))) + 1

  for (const page of ocrPages) {
    if (page.notes.length === 0) continue

    for (let i = 0; i < page.notes.length; i++) {
      const note = page.notes[i]
      const fp = generateFingerprint(pdfName, page.page, i)

      // マージ時: 既にインポート済みならスキップ
      if (existingFingerprints.has(fp)) continue

      const id = formatId(nextNum++)
      const fusen: Fusen = {
        id,
        title: note.title || '(無題)',
        body: note.body || '',
        imageFile: note.imageFile || '',
        subject: normalizeSubject(note.subject),
        noteType: normalizeNoteType(note.note_type),
        tags: note.tags || [],
        source: {
          pdf: pdfName,
          page: page.page,
          noteIndex: i,
          bbox: note.bbox || [0, 0, 0, 0],
        },
        topicId: null,
        linkedQuestionIds: [],
        importance: 0,
        tier: 'free',
        status: 'draft',
        reviewedAt: null,
        notes: '',
      }
      fusens[id] = fusen
    }
  }

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    fusens,
  }
}
```

- [ ] **Step 4: テスト実行してパスを確認**

```bash
npx vitest run scripts/__tests__/build-fusens-master.test.ts
```

Expected: ALL PASS

- [ ] **Step 5: コミット**

```bash
git add scripts/lib/fusens-master-core.ts scripts/__tests__/build-fusens-master.test.ts
git commit -m "feat: add ocrToMaster core logic with tests"
```

---

### Task 4: マージテスト

**Files:**
- Modify: `scripts/__tests__/build-fusens-master.test.ts`

- [ ] **Step 1: マージのテストを追加**

```typescript
describe('ocrToMaster merge', () => {
  const page1: OcrPageResult[] = [
    { page: 1, notes: [
      { title: 'A', body: 'body-a', subject: '物理', note_type: 'knowledge', tags: [], bbox: [0,0,100,100], imageFile: 'p1/n1.png' },
    ]},
  ]
  const page2: OcrPageResult[] = [
    { page: 1, notes: [
      { title: 'A', body: 'body-a', subject: '物理', note_type: 'knowledge', tags: [], bbox: [0,0,100,100], imageFile: 'p1/n1.png' },
    ]},
    { page: 2, notes: [
      { title: 'B', body: 'body-b', subject: '化学', note_type: 'mnemonic', tags: [], bbox: [0,0,100,100], imageFile: 'p2/n1.png' },
    ]},
  ]

  it('skips already-imported notes on merge (same fingerprint)', () => {
    const initial = ocrToMaster(page1, 'test.pdf')
    expect(Object.keys(initial.fusens)).toHaveLength(1)

    const merged = ocrToMaster(page2, 'test.pdf', initial)
    expect(Object.keys(merged.fusens)).toHaveLength(2)
    // fusen-001 は再追加されない、fusen-002 が新規
    expect(merged.fusens['fusen-001'].title).toBe('A')
    expect(merged.fusens['fusen-002'].title).toBe('B')
  })

  it('does not overwrite existing fusens', () => {
    const initial = ocrToMaster(page1, 'test.pdf')
    // 手動でtitleを修正
    initial.fusens['fusen-001'].title = 'Modified'
    const merged = ocrToMaster(page2, 'test.pdf', initial)
    expect(merged.fusens['fusen-001'].title).toBe('Modified')
  })
})
```

- [ ] **Step 2: テスト実行してパスを確認**

```bash
npx vitest run scripts/__tests__/build-fusens-master.test.ts
```

Expected: ALL PASS

- [ ] **Step 3: コミット**

```bash
git add scripts/__tests__/build-fusens-master.test.ts
git commit -m "test: add merge tests for ocrToMaster"
```

---

### Task 5: CLIスクリプト本体

**Files:**
- Create: `scripts/build-fusens-master.ts`

- [ ] **Step 1: CLIスクリプトを実装**

```typescript
// scripts/build-fusens-master.ts
/**
 * 付箋マスター生成: OCR結果 → fusens-master.json
 *
 * Usage:
 *   npx tsx scripts/build-fusens-master.ts              # 初回生成 or マージ
 *   npx tsx scripts/build-fusens-master.ts --stats       # 統計表示
 *   npx tsx scripts/build-fusens-master.ts --unreviewed  # 未レビュー一覧
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { ocrToMaster } from './lib/fusens-master-core'
import type { FusenMaster, OcrPageResult } from './lib/fusens-master-types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const OCR_PATH = path.join(__dirname, '..', 'src', 'data', 'fusens', 'ocr-results.json')
const MASTER_PATH = path.join(__dirname, '..', 'src', 'data', 'fusens', 'fusens-master.json')
const PDF_NAME = 'fusen-note-makio.pdf'

const args = process.argv.slice(2)
const isStats = args.includes('--stats')
const isUnreviewed = args.includes('--unreviewed')

function loadMaster(): FusenMaster | null {
  try {
    return JSON.parse(fs.readFileSync(MASTER_PATH, 'utf-8'))
  } catch {
    return null
  }
}

function saveMaster(master: FusenMaster): void {
  const tmpPath = MASTER_PATH + '.tmp'
  fs.writeFileSync(tmpPath, JSON.stringify(master, null, 2), 'utf-8')
  fs.renameSync(tmpPath, MASTER_PATH)
}

function showStats(): void {
  const master = loadMaster()
  if (!master) { console.log('fusens-master.json がありません'); return }

  const fusens = Object.values(master.fusens)
  const active = fusens.filter(f => f.status === 'active')
  const draft = fusens.filter(f => f.status === 'draft')
  const archived = fusens.filter(f => f.status === 'archived')
  const duplicate = fusens.filter(f => f.status === 'duplicate')

  console.log(`=== 付箋マスター統計 ===`)
  console.log(`総数: ${fusens.length}`)
  console.log(`  active: ${active.length}  draft: ${draft.length}  archived: ${archived.length}  duplicate: ${duplicate.length}`)

  const bySubject: Record<string, number> = {}
  const byType: Record<string, number> = {}
  const withTopic = fusens.filter(f => f.topicId).length
  const reviewed = fusens.filter(f => f.reviewedAt).length

  for (const f of fusens) {
    bySubject[f.subject] = (bySubject[f.subject] || 0) + 1
    byType[f.noteType] = (byType[f.noteType] || 0) + 1
  }

  console.log(`\n科目別:`)
  for (const [s, c] of Object.entries(bySubject).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${s}: ${c}`)
  }
  console.log(`\n分類別:`)
  for (const [t, c] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t}: ${c}`)
  }
  console.log(`\ntopicId設定済み: ${withTopic} / ${fusens.length}`)
  console.log(`レビュー済み: ${reviewed} / ${fusens.length}`)
}

function showUnreviewed(): void {
  const master = loadMaster()
  if (!master) { console.log('fusens-master.json がありません'); return }

  const unreviewed = Object.values(master.fusens)
    .filter(f => !f.reviewedAt && f.status !== 'archived' && f.status !== 'duplicate')
    .sort((a, b) => a.id.localeCompare(b.id))

  console.log(`未レビュー: ${unreviewed.length}件\n`)
  for (const f of unreviewed.slice(0, 30)) {
    const topic = f.topicId ? `✅ ${f.topicId}` : '❌ topicId未設定'
    console.log(`${f.id} | ${f.subject} | ${f.noteType} | ${f.title} | ${topic}`)
  }
  if (unreviewed.length > 30) {
    console.log(`  ... 他${unreviewed.length - 30}件`)
  }
}

function main(): void {
  if (isStats) { showStats(); return }
  if (isUnreviewed) { showUnreviewed(); return }

  // OCR読み込み
  if (!fs.existsSync(OCR_PATH)) {
    console.error(`OCRデータなし: ${OCR_PATH}`)
    process.exit(1)
  }
  const ocrData: OcrPageResult[] = JSON.parse(fs.readFileSync(OCR_PATH, 'utf-8'))
  const totalNotes = ocrData.reduce((s, p) => s + p.notes.length, 0)
  console.log(`OCRデータ: ${ocrData.length}ページ / ${totalNotes}件のnote`)

  // 既存マスター読み込み（あればマージ）
  const existing = loadMaster()
  if (existing) {
    const existingCount = Object.keys(existing.fusens).length
    console.log(`既存マスター: ${existingCount}件 → マージモード`)
  } else {
    console.log('既存マスターなし → 新規生成')
  }

  // 変換
  const master = ocrToMaster(ocrData, PDF_NAME, existing ?? undefined)
  const newCount = Object.keys(master.fusens).length - (existing ? Object.keys(existing.fusens).length : 0)

  // 保存
  saveMaster(master)
  console.log(`\n=== 完了 ===`)
  console.log(`新規追加: ${newCount}件`)
  console.log(`累計: ${Object.keys(master.fusens).length}件`)
  console.log(`保存: ${MASTER_PATH}`)
}

main()
```

- [ ] **Step 2: 現在の46ページ分のOCRデータでテスト実行**

```bash
npx tsx scripts/build-fusens-master.ts
```

Expected:
- `OCRデータ: 47ページ / 154件のnote`
- `新規追加: 154件`
- `fusens-master.json` が生成される

- [ ] **Step 3: 統計確認**

```bash
npx tsx scripts/build-fusens-master.ts --stats
```

Expected: 科目別・分類別の集計が表示

- [ ] **Step 4: マージの冪等性（べきとうせい）確認（同じデータで再実行）**

```bash
npx tsx scripts/build-fusens-master.ts
```

Expected: `新規追加: 0件`（同じデータなら何も追加されない）

- [ ] **Step 5: コミット**

```bash
git add scripts/build-fusens-master.ts src/data/fusens/fusens-master.json
git commit -m "feat: build-fusens-master.ts with merge support"
```

---

### Task 6: 全テスト & ビルド確認

- [ ] **Step 1: 全テスト実行**

```bash
npx vitest run
```

Expected: 既存テスト + 新規テスト全てPASS

- [ ] **Step 2: ビルド確認（未使用import等のチェック）**

```bash
npm run build
```

Expected: エラーなし（scripts/ はビルド対象外だが、src/types/ を参照しているので型チェックは通る必要あり）

- [ ] **Step 3: コミット（修正があれば）**

```bash
git add -A
git commit -m "fix: address test/build issues"
```
