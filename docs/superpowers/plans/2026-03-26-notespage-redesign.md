# NotesPage リデザイン実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** NotesPage を Soft Companion デザインで新規構築。公式付箋ライブラリ（2列画像グリッド）+ マイブックマーク の2タブ + 付箋詳細ページ。

**Architecture:** ロジック層を `FusenLibraryCore` クラスに分離し純粋関数テスト。ページコンポーネントはフック経由でコアロジックを使用。既存 `useBookmarks`/`NoteImageViewer`/`Chip`/`FloatingNav` を再利用。

**Tech Stack:** React 19, TypeScript 5.9, Vite 8, CSS Modules, vitest

**Spec:** `docs/superpowers/specs/2026-03-26-notespage-redesign-design.md` v1.3

---

## ファイルマップ

| アクション | ファイル | 責務 |
|-----------|---------|------|
| 修正 | `src/types/official-note.ts` | `linkedCardIds` 削除、`exemplarIds?` / `noteType?` 追加 |
| 修正 | `src/data/official-notes.ts` | 既存23件から `linkedCardIds` フィールド削除 |
| 作成 | `src/utils/fusen-library-core.ts` | グルーピング、ソート、getRelatedQuestionIds — 純粋関数 |
| 作成 | `src/utils/__tests__/fusen-library-core.test.ts` | コアロジックのテスト |
| 作成 | `src/hooks/useFusenLibrary.ts` | 全付箋データ + グルーピング フック |
| 作成 | `src/hooks/useFusenDetail.ts` | 付箋詳細 + 関連問題 フック |
| 修正 | `src/components/layout/AppLayout.tsx:28` | REDESIGNED_EXACT に '/notes' 追加 |
| 修正 | `src/routes.tsx` | `/notes/:fusenId` ルート追加 |
| 書換 | `src/pages/NotesPage.tsx` | Ant Design → Soft Companion フル書き換え |
| 作成 | `src/pages/NotesPage.module.css` | ページスタイル |
| 作成 | `src/pages/FusenDetailPage.tsx` | 付箋詳細ページ |
| 作成 | `src/pages/FusenDetailPage.module.css` | 詳細ページスタイル |
| 作成 | `src/components/notes/FusenGrid.tsx` | 2列グリッドコンテナ |
| 作成 | `src/components/notes/FusenGrid.module.css` | グリッドスタイル |
| 作成 | `src/components/notes/SubjectSection.tsx` | 科目セクション（ヘッダー+グリッド） |
| 作成 | `src/components/notes/SubjectSection.module.css` | セクションスタイル |
| 作成 | `src/components/notes/FusenThumbnail.tsx` | サムネイルカード |
| 作成 | `src/components/notes/FusenThumbnail.module.css` | サムネイルスタイル |
| 作成 | `src/components/notes/EmptyState.tsx` | マイ付箋0件CTA |
| 作成 | `src/components/notes/EmptyState.module.css` | 空状態スタイル |
| 作成 | `src/components/notes/RelatedQuestionList.tsx` | 関連問題リスト（回答状況付き） |
| 作成 | `src/components/notes/RelatedQuestionList.module.css` | 問題リストスタイル |
| 作成 | `src/components/notes/FusenBreadcrumb.tsx` | パンくずリスト |
| 作成 | `src/components/notes/FlashCardSection.tsx` | 暗記カード「準備中」プレースホルダー |

---

### Task 1: OfficialNote 型変更

**Files:**
- Modify: `src/types/official-note.ts`
- Modify: `src/data/official-notes.ts`

**参照:** spec §5.1（循環設計セッション反映）

- [ ] **Step 1: `official-note.ts` の型を更新**

```typescript
// src/types/official-note.ts
// 変更点:
// 1. linkedCardIds 削除
// 2. exemplarIds?: string[] 追加
// 3. noteType?: NoteType 追加

export type NoteType = 'mnemonic' | 'knowledge' | 'related' | 'caution' | 'solution'

export interface OfficialNote {
  id: string
  title: string
  imageUrl: string
  textSummary: string
  subject: QuestionSubject
  topicId: string
  tags: string[]
  linkedQuestionIds: string[]
  exemplarIds?: string[]        // optional: AI マッチング結果。未設定時は [] 扱い
  importance: number
  tier: 'free' | 'premium'
  noteType?: NoteType           // optional: 未設定時は 'knowledge'
}
// BookmarkedNote はそのまま
```

- [ ] **Step 2: `official-notes.ts` から `linkedCardIds` を全件削除**

各エントリの `linkedCardIds: [],` 行を削除する（23箇所）。

- [ ] **Step 3: 型チェック実行**

Run: `npx tsc --noEmit`
Expected: PASS（`linkedCardIds` を参照している箇所があればエラーになるので修正）

- [ ] **Step 4: 既存テスト実行**

Run: `npx vitest run`
Expected: 全件パス（既存テストが `linkedCardIds` を参照していれば修正）

- [ ] **Step 5: コミット**

```bash
git add src/types/official-note.ts src/data/official-notes.ts
git commit -m "feat(notes): OfficialNote 型変更 — linkedCardIds 廃止、exemplarIds/noteType 追加"
```

---

### Task 2: FusenLibraryCore — コアロジック（テスト→実装）

**Files:**
- Create: `src/utils/fusen-library-core.ts`
- Create: `src/utils/__tests__/fusen-library-core.test.ts`

**参照:** spec §5.1.1, §5.3, §6.1

- [ ] **Step 1: テストファイル作成 — グルーピングテスト**

```typescript
// src/utils/__tests__/fusen-library-core.test.ts
import { describe, it, expect } from 'vitest'
import { FusenLibraryCore } from '../fusen-library-core'
import type { OfficialNote } from '../../types/official-note'

function makeNote(overrides: Partial<OfficialNote>): OfficialNote {
  return {
    id: 'test-001',
    title: 'テスト付箋',
    imageUrl: '/images/fusens/test.png',
    textSummary: 'テスト要約',
    subject: '物理',
    topicId: 'physics-material-structure',
    tags: [],
    linkedQuestionIds: [],
    importance: 0,
    tier: 'free',
    ...overrides,
  }
}

describe('FusenLibraryCore', () => {
  describe('groupBySubject', () => {
    it('科目ごとにグルーピングされる', () => {
      const notes = [
        makeNote({ id: 'n1', subject: '物理', topicId: 'physics-a' }),
        makeNote({ id: 'n2', subject: '化学', topicId: 'chemistry-a' }),
        makeNote({ id: 'n3', subject: '物理', topicId: 'physics-b' }),
      ]
      const core = new FusenLibraryCore(notes)
      const groups = core.groupBySubject()
      expect(groups).toHaveLength(2)
      expect(groups[0].subject).toBe('物理')
      expect(groups[0].fusens).toHaveLength(2)
      expect(groups[1].subject).toBe('化学')
      expect(groups[1].fusens).toHaveLength(1)
    })

    it('空配列の場合は空グループ', () => {
      const core = new FusenLibraryCore([])
      expect(core.groupBySubject()).toHaveLength(0)
    })
  })

  describe('filterBookmarked', () => {
    it('ブックマーク済みの付箋のみ返す', () => {
      const notes = [
        makeNote({ id: 'n1' }),
        makeNote({ id: 'n2' }),
        makeNote({ id: 'n3' }),
      ]
      const core = new FusenLibraryCore(notes)
      const result = core.filterBookmarked(new Set(['n1', 'n3']))
      expect(result).toHaveLength(2)
      expect(result.map(n => n.id)).toEqual(['n1', 'n3'])
    })

    it('ブックマークなしの場合は空配列', () => {
      const core = new FusenLibraryCore([makeNote({ id: 'n1' })])
      expect(core.filterBookmarked(new Set())).toHaveLength(0)
    })
  })

  describe('getRelatedQuestionIds', () => {
    it('linkedQuestionIds をフォールバックとして返す（exemplarIds なし）', () => {
      const note = makeNote({ linkedQuestionIds: ['r100-001', 'r101-002'] })
      const result = FusenLibraryCore.getRelatedQuestionIds(note)
      expect(result).toEqual(['r100-001', 'r101-002'])
    })

    it('exemplarIds が空配列の場合も linkedQuestionIds にフォールバック', () => {
      const note = makeNote({ exemplarIds: [], linkedQuestionIds: ['r100-001'] })
      const result = FusenLibraryCore.getRelatedQuestionIds(note)
      expect(result).toEqual(['r100-001'])
    })
  })

  describe('getImportanceBadge', () => {
    it('10問以上は 🔥', () => {
      expect(FusenLibraryCore.getImportanceBadge(12)).toEqual({ emoji: '🔥', count: 12 })
    })
    it('5問以上は 📊', () => {
      expect(FusenLibraryCore.getImportanceBadge(7)).toEqual({ emoji: '📊', count: 7 })
    })
    it('1-4問は 📝', () => {
      expect(FusenLibraryCore.getImportanceBadge(3)).toEqual({ emoji: '📝', count: 3 })
    })
    it('0問は null', () => {
      expect(FusenLibraryCore.getImportanceBadge(0)).toBeNull()
    })
  })

  describe('sortByImportance', () => {
    it('importance 降順でソート', () => {
      const notes = [
        makeNote({ id: 'low', importance: 1 }),
        makeNote({ id: 'high', importance: 10 }),
        makeNote({ id: 'mid', importance: 5 }),
      ]
      const core = new FusenLibraryCore(notes)
      const sorted = core.sortByImportance()
      expect(sorted.map(n => n.id)).toEqual(['high', 'mid', 'low'])
    })
  })
})
```

- [ ] **Step 2: テスト実行 — 失敗を確認**

Run: `npx vitest run src/utils/__tests__/fusen-library-core.test.ts`
Expected: FAIL（`fusen-library-core.ts` が存在しない）

- [ ] **Step 3: FusenLibraryCore 実装**

```typescript
// src/utils/fusen-library-core.ts
import type { OfficialNote } from '../types/official-note'

export interface FusenGroup {
  subject: string
  fusens: OfficialNote[]
}

export interface ImportanceBadge {
  emoji: string
  count: number
}

export class FusenLibraryCore {
  private notes: OfficialNote[]

  constructor(notes: OfficialNote[]) {
    this.notes = notes
  }

  /** 科目ごとにグルーピング（科目の出現順を維持） */
  groupBySubject(): FusenGroup[] {
    const map = new Map<string, OfficialNote[]>()
    for (const note of this.notes) {
      const list = map.get(note.subject)
      if (list) {
        list.push(note)
      } else {
        map.set(note.subject, [note])
      }
    }
    return Array.from(map.entries()).map(([subject, fusens]) => ({ subject, fusens }))
  }

  /** ブックマーク済みの付箋のみフィルター */
  filterBookmarked(bookmarkedIds: Set<string>): OfficialNote[] {
    return this.notes.filter(n => bookmarkedIds.has(n.id))
  }

  /** importance 降順でソート（全付箋タブ用） */
  sortByImportance(): OfficialNote[] {
    return [...this.notes].sort((a, b) => b.importance - a.importance)
  }

  /** 関連問題IDを取得（exemplarIds 優先 → linkedQuestionIds フォールバック） */
  static getRelatedQuestionIds(note: OfficialNote): string[] {
    if (note.exemplarIds && note.exemplarIds.length > 0) {
      // Phase 2: exemplar → question-exemplar-map 経由で解決
      // 現時点では exemplarIds が投入されていないのでこのパスは未到達
      return note.linkedQuestionIds // TODO: resolveQuestionsFromExemplars 実装後に切替
    }
    return note.linkedQuestionIds
  }

  /** 重要度バッジを計算 */
  static getImportanceBadge(questionCount: number): ImportanceBadge | null {
    if (questionCount >= 10) return { emoji: '🔥', count: questionCount }
    if (questionCount >= 5) return { emoji: '📊', count: questionCount }
    if (questionCount >= 1) return { emoji: '📝', count: questionCount }
    return null
  }

  /** IDで付箋を検索 */
  getFusenById(id: string): OfficialNote | undefined {
    return this.notes.find(n => n.id === id)
  }
}
```

- [ ] **Step 4: テスト実行 — パスを確認**

Run: `npx vitest run src/utils/__tests__/fusen-library-core.test.ts`
Expected: 全件 PASS

- [ ] **Step 5: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/utils/fusen-library-core.ts src/utils/__tests__/fusen-library-core.test.ts
git commit -m "feat(notes): FusenLibraryCore — グルーピング・フィルター・ソート・バッジ計算"
```

---

### Task 3: フック作成 — useFusenLibrary + useFusenDetail

**Files:**
- Create: `src/hooks/useFusenLibrary.ts`
- Create: `src/hooks/useFusenDetail.ts`

**参照:** spec §6.1, §6.2

- [ ] **Step 1: useFusenLibrary フック作成**

```typescript
// src/hooks/useFusenLibrary.ts
import { useMemo } from 'react'
import { OFFICIAL_NOTES } from '../data/official-notes'
import { FusenLibraryCore } from '../utils/fusen-library-core'
import type { FusenGroup } from '../utils/fusen-library-core'
import type { OfficialNote } from '../types/official-note'
import { useBookmarks } from './useBookmarks'

export function useFusenLibrary(): {
  allFusens: OfficialNote[]
  bookmarkedFusens: OfficialNote[]
  allGrouped: FusenGroup[]
  bookmarkedGrouped: FusenGroup[]
  getFusenById: (id: string) => OfficialNote | undefined
} {
  const { bookmarks, isBookmarked } = useBookmarks()

  const core = useMemo(() => new FusenLibraryCore(OFFICIAL_NOTES), [])

  const bookmarkedIds = useMemo(
    () => new Set(bookmarks.map(b => b.note_id)),
    [bookmarks],
  )

  const bookmarkedFusens = useMemo(
    () => core.filterBookmarked(bookmarkedIds),
    [core, bookmarkedIds],
  )

  const allGrouped = useMemo(() => {
    const sorted = core.sortByImportance()
    return new FusenLibraryCore(sorted).groupBySubject()
  }, [core])

  const bookmarkedGrouped = useMemo(
    () => new FusenLibraryCore(bookmarkedFusens).groupBySubject(),
    [bookmarkedFusens],
  )

  const getFusenById = useMemo(
    () => (id: string) => core.getFusenById(id),
    [core],
  )

  return {
    allFusens: OFFICIAL_NOTES,
    bookmarkedFusens,
    allGrouped,
    bookmarkedGrouped,
    getFusenById,
  }
}
```

- [ ] **Step 2: useFusenDetail フック作成**

```typescript
// src/hooks/useFusenDetail.ts
import { useMemo } from 'react'
import { OFFICIAL_NOTES } from '../data/official-notes'
import { FusenLibraryCore } from '../utils/fusen-library-core'
import { EXAM_BLUEPRINT } from '../data/exam-blueprint'
import { useBookmarks } from './useBookmarks'
import { useAnswerHistory } from './useAnswerHistory'
import type { OfficialNote } from '../types/official-note'

export interface RelatedQuestionItem {
  questionId: string
  displayLabel: string
  userStatus: 'correct' | 'incorrect' | 'unanswered'
}

export interface FusenBreadcrumb {
  subject: string
  major: string
  middle: string
}

export function useFusenDetail(fusenId: string): {
  fusen: OfficialNote | undefined
  relatedQuestions: RelatedQuestionItem[]
  breadcrumb: FusenBreadcrumb
  isBookmarked: boolean
  toggleBookmark: () => void
} {
  const { isBookmarked: checkBookmarked, toggleBookmark: toggle } = useBookmarks()
  const { getQuestionResult } = useAnswerHistory()

  const fusen = useMemo(
    () => OFFICIAL_NOTES.find(n => n.id === fusenId),
    [fusenId],
  )

  const relatedQuestions = useMemo((): RelatedQuestionItem[] => {
    if (!fusen) return []
    const questionIds = FusenLibraryCore.getRelatedQuestionIds(fusen)

    return questionIds
      .map(qId => {
        const match = qId.match(/^r(\d+)-(\d+)$/)
        const displayLabel = match ? `${match[1]}回-問${parseInt(match[2], 10)}` : qId
        const result = getQuestionResult(qId)
        let userStatus: 'correct' | 'incorrect' | 'unanswered' = 'unanswered'
        if (result?.is_correct === true) userStatus = 'correct'
        else if (result?.is_correct === false) userStatus = 'incorrect'
        return { questionId: qId, displayLabel, userStatus }
      })
      .sort((a, b) => {
        const order = { unanswered: 0, incorrect: 1, correct: 2 }
        return order[a.userStatus] - order[b.userStatus]
      })
  }, [fusen, getQuestionResult])

  const breadcrumb = useMemo((): FusenBreadcrumb => {
    if (!fusen) return { subject: '', major: '', middle: '' }
    for (const subject of EXAM_BLUEPRINT) {
      for (const major of subject.majorCategories) {
        for (const middle of major.middleCategories) {
          if (middle.id === fusen.topicId) {
            return {
              subject: subject.subject,
              major: major.name,
              middle: middle.name,
            }
          }
        }
      }
    }
    return { subject: fusen.subject, major: '', middle: '' }
  }, [fusen])

  return {
    fusen,
    relatedQuestions,
    breadcrumb,
    isBookmarked: fusen ? checkBookmarked(fusen.id) : false,
    toggleBookmark: () => { if (fusen) toggle(fusen.id) },
  }
}
```

- [ ] **Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: コミット**

```bash
git add src/hooks/useFusenLibrary.ts src/hooks/useFusenDetail.ts
git commit -m "feat(notes): useFusenLibrary + useFusenDetail フック追加"
```

---

### Task 4: ルーティング + AppLayout 変更

**Files:**
- Modify: `src/routes.tsx`
- Modify: `src/components/layout/AppLayout.tsx`

**参照:** spec §8.1, §8.2

- [ ] **Step 1: AppLayout に '/notes' 追加**

`src/components/layout/AppLayout.tsx` の `REDESIGNED_EXACT` 配列に `'/notes'` を追加。
また `matchPath('/notes/:fusenId', location.pathname)` を追加。

- [ ] **Step 2: routes.tsx に FusenDetailPage ルート追加**

既存の `/notes` ルートはそのまま。新たに `/notes/:fusenId` を追加:

```typescript
{
  path: '/notes/:fusenId',
  element: <AppLayout><Suspense fallback={<Loading />}><FusenDetailPage /></Suspense></AppLayout>,
},
```

上部に `import` 追加:
```typescript
import FusenDetailPage from './pages/FusenDetailPage'
```

※ `FusenDetailPage` が存在しないとビルドエラーになるため、Task 6 で作成後に追加してもよい。
その場合はこの Step をスキップし Task 6 完了後に実施する。

- [ ] **Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS（FusenDetailPage 未作成の場合はスキップ）

- [ ] **Step 4: コミット**

```bash
git add src/components/layout/AppLayout.tsx src/routes.tsx
git commit -m "feat(notes): ルーティング — /notes AppLayout対応、/notes/:fusenId 追加"
```

---

### Task 5: NotesPage コンポーネント群（メイン画面）

**Files:**
- Rewrite: `src/pages/NotesPage.tsx`
- Create: `src/pages/NotesPage.module.css`
- Create: `src/components/notes/FusenGrid.tsx`
- Create: `src/components/notes/FusenGrid.module.css`
- Create: `src/components/notes/SubjectSection.tsx`
- Create: `src/components/notes/SubjectSection.module.css`
- Create: `src/components/notes/FusenThumbnail.tsx`
- Create: `src/components/notes/FusenThumbnail.module.css`
- Create: `src/components/notes/EmptyState.tsx`
- Create: `src/components/notes/EmptyState.module.css`

**参照:** spec §3.1-3.4, §7.1-7.2, §10.1-10.3, §11

- [ ] **Step 1: `src/components/notes/` ディレクトリ作成**

Run: `mkdir -p src/components/notes`

- [ ] **Step 2: FusenThumbnail コンポーネント作成**

```typescript
// src/components/notes/FusenThumbnail.tsx
import { useNavigate } from 'react-router-dom'
import { FusenLibraryCore } from '../../utils/fusen-library-core'
import type { OfficialNote } from '../../types/official-note'
import type { KeyboardEvent } from 'react'
import styles from './FusenThumbnail.module.css'

interface Props {
  note: OfficialNote
  isBookmarked: boolean
}

export function FusenThumbnail({ note, isBookmarked }: Props) {
  const navigate = useNavigate()
  const badge = FusenLibraryCore.getImportanceBadge(note.linkedQuestionIds.length)

  const handleClick = () => navigate(`/notes/${note.id}`)
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleClick()
  }

  return (
    <div
      className={styles.thumbnail}
      role="link"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <img
        src={note.imageUrl}
        alt={note.title}
        className={styles.image}
        loading="lazy"
      />
      <div className={styles.info}>
        <div className={styles.title}>{note.title}</div>
        <div className={styles.meta}>
          {isBookmarked && <span className={styles.bookmarked}>★</span>}
          {badge && <span className={styles.badge}>{badge.emoji} {badge.count}問</span>}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: FusenThumbnail CSS 作成**

```css
/* src/components/notes/FusenThumbnail.module.css */
.thumbnail {
  background: var(--card);
  border-radius: var(--r);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s;
}
.thumbnail:active {
  transform: scale(0.97);
}
.image {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  background: var(--bg);
  display: block;
}
.info {
  padding: 8px 10px;
}
.title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-sub);
}
.bookmarked {
  color: var(--accent);
}
.badge {
  color: var(--text-sub);
}
```

- [ ] **Step 4: SubjectSection コンポーネント作成**

```typescript
// src/components/notes/SubjectSection.tsx
import { FusenThumbnail } from './FusenThumbnail'
import type { OfficialNote } from '../../types/official-note'
import styles from './SubjectSection.module.css'

interface Props {
  subject: string
  fusens: OfficialNote[]
  bookmarkedIds: Set<string>
}

export function SubjectSection({ subject, fusens, bookmarkedIds }: Props) {
  return (
    <section>
      <div className={styles.header}>
        <h2 className={styles.title}>{subject}</h2>
        <span className={styles.count}>{fusens.length}枚</span>
      </div>
      <div className={styles.grid} role="list">
        {fusens.map(note => (
          <div key={note.id} role="listitem">
            <FusenThumbnail
              note={note}
              isBookmarked={bookmarkedIds.has(note.id)}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: SubjectSection CSS 作成**

```css
/* src/components/notes/SubjectSection.module.css */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0 8px;
}
.title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}
.count {
  font-size: 13px;
  color: var(--text-sub);
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
```

- [ ] **Step 6: FusenGrid コンポーネント作成**

```typescript
// src/components/notes/FusenGrid.tsx
import { SubjectSection } from './SubjectSection'
import type { FusenGroup } from '../../utils/fusen-library-core'

interface Props {
  groups: FusenGroup[]
  bookmarkedIds: Set<string>
}

export function FusenGrid({ groups, bookmarkedIds }: Props) {
  return (
    <div>
      {groups.map(group => (
        <SubjectSection
          key={group.subject}
          subject={group.subject}
          fusens={group.fusens}
          bookmarkedIds={bookmarkedIds}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 7: EmptyState コンポーネント作成**

```typescript
// src/components/notes/EmptyState.tsx
import { useNavigate } from 'react-router-dom'
import styles from './EmptyState.module.css'

export function EmptyState() {
  const navigate = useNavigate()
  return (
    <div className={styles.container}>
      <div className={styles.icon}>🔖</div>
      <p className={styles.message}>まだ付箋を保存していません</p>
      <p className={styles.hint}>
        演習で問題を解くと、関連する付箋が表示されます。<br />
        ★ をタップして保存しよう！
      </p>
      <button className={styles.cta} onClick={() => navigate('/practice')}>
        演習を始める
      </button>
    </div>
  )
}
```

- [ ] **Step 8: EmptyState CSS 作成**

```css
/* src/components/notes/EmptyState.module.css */
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px;
}
.icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.message {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 8px;
}
.hint {
  font-size: 14px;
  color: var(--text-sub);
  margin: 0 0 24px;
  line-height: 1.6;
}
.cta {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--r-chip);
  padding: 12px 32px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
```

- [ ] **Step 9: NotesPage 本体を書き換え**

```typescript
// src/pages/NotesPage.tsx — Soft Companion フル書き換え
import { useState, useMemo } from 'react'
import { useFusenLibrary } from '../hooks/useFusenLibrary'
import { useBookmarks } from '../hooks/useBookmarks'
import { Chip } from '../components/ui/Chip'
import { FloatingNav } from '../components/ui/FloatingNav'
import { FusenGrid } from '../components/notes/FusenGrid'
import { EmptyState } from '../components/notes/EmptyState'
import styles from './NotesPage.module.css'

type Tab = 'my' | 'all'

export default function NotesPage() {
  const [tab, setTab] = useState<Tab>('my')
  const { allGrouped, bookmarkedGrouped, bookmarkedFusens } = useFusenLibrary()
  const { bookmarks } = useBookmarks()

  const bookmarkedIds = useMemo(
    () => new Set(bookmarks.map(b => b.note_id)),
    [bookmarks],
  )

  const groups = tab === 'my' ? bookmarkedGrouped : allGrouped
  const showEmpty = tab === 'my' && bookmarkedFusens.length === 0

  return (
    <div className="sc-page">
      <div className={styles.page}>
        <h1 className={styles.pageTitle}>ノート</h1>

        <div className={styles.tabs}>
          <Chip label="マイ付箋" active={tab === 'my'} onClick={() => setTab('my')} />
          <Chip label="全付箋" active={tab === 'all'} onClick={() => setTab('all')} />
        </div>

        {showEmpty ? (
          <EmptyState />
        ) : (
          <FusenGrid groups={groups} bookmarkedIds={bookmarkedIds} />
        )}
      </div>
      <FloatingNav />
    </div>
  )
}
```

- [ ] **Step 10: NotesPage CSS 作成**

```css
/* src/pages/NotesPage.module.css */
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.pageTitle {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}
.tabs {
  display: flex;
  gap: 8px;
}
```

- [ ] **Step 11: 型チェック + テスト**

Run: `npx tsc --noEmit && npx vitest run`
Expected: PASS

- [ ] **Step 12: コミット**

```bash
git add src/pages/NotesPage.tsx src/pages/NotesPage.module.css \
  src/components/notes/
git commit -m "feat(notes): NotesPage Soft Companion リデザイン — 2列グリッド + タブ切替"
```

---

### Task 6: FusenDetailPage + 付箋詳細コンポーネント群

**Files:**
- Create: `src/pages/FusenDetailPage.tsx`
- Create: `src/pages/FusenDetailPage.module.css`
- Create: `src/components/notes/RelatedQuestionList.tsx`
- Create: `src/components/notes/RelatedQuestionList.module.css`
- Create: `src/components/notes/FusenBreadcrumb.tsx`
- Create: `src/components/notes/FlashCardSection.tsx`
- Modify: `src/routes.tsx`（Task 4 で未実施の場合）

**参照:** spec §4.1-4.3, §7.1

- [ ] **Step 1: FusenBreadcrumb コンポーネント作成**

```typescript
// src/components/notes/FusenBreadcrumb.tsx
import type { FusenBreadcrumb as BreadcrumbType } from '../../hooks/useFusenDetail'

interface Props {
  breadcrumb: BreadcrumbType
}

export function FusenBreadcrumb({ breadcrumb }: Props) {
  const parts = [breadcrumb.subject, breadcrumb.major, breadcrumb.middle].filter(Boolean)
  return (
    <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>
      {parts.join(' > ')}
    </span>
  )
}
```

- [ ] **Step 2: RelatedQuestionList コンポーネント作成**

```typescript
// src/components/notes/RelatedQuestionList.tsx
import { useNavigate } from 'react-router-dom'
import type { RelatedQuestionItem } from '../../hooks/useFusenDetail'
import styles from './RelatedQuestionList.module.css'

interface Props {
  questions: RelatedQuestionItem[]
}

const STATUS_LABEL = { correct: '✅ 済', incorrect: '❌ 済', unanswered: '未' } as const

export function RelatedQuestionList({ questions }: Props) {
  const navigate = useNavigate()

  if (questions.length === 0) return null

  return (
    <section>
      <h3 className={styles.heading}>この知識を使う問題（{questions.length}問）</h3>
      <div className={styles.list}>
        {questions.map(q => (
          <button
            key={q.questionId}
            className={styles.item}
            onClick={() => navigate(`/practice/${q.questionId}`)}
          >
            <span className={styles.label}>{q.displayLabel}</span>
            <span className={styles.status}>{STATUS_LABEL[q.userStatus]}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: RelatedQuestionList CSS 作成**

```css
/* src/components/notes/RelatedQuestionList.module.css */
.heading {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 8px;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--card);
  border-radius: var(--r);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border: none;
  background: var(--card);
  cursor: pointer;
  font-size: 14px;
  color: var(--text);
  text-align: left;
  width: 100%;
}
.item:not(:last-child) {
  border-bottom: 1px solid var(--border);
}
.item:active {
  background: var(--accent-light);
}
.label {
  font-weight: 500;
}
.status {
  font-size: 13px;
  color: var(--text-sub);
}
```

- [ ] **Step 4: FlashCardSection プレースホルダー作成**

```typescript
// src/components/notes/FlashCardSection.tsx
export function FlashCardSection() {
  return (
    <section>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>
        暗記カード
      </h3>
      <div style={{
        padding: '16px',
        background: 'var(--card)',
        borderRadius: 'var(--r)',
        textAlign: 'center',
        color: 'var(--text-sub)',
        fontSize: 14,
      }}>
        🔒 準備中
      </div>
    </section>
  )
}
```

- [ ] **Step 5: FusenDetailPage 本体作成**

```typescript
// src/pages/FusenDetailPage.tsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useFusenDetail } from '../hooks/useFusenDetail'
import { FusenLibraryCore } from '../utils/fusen-library-core'
import { NoteImageViewer } from '../components/question/NoteImageViewer'
import { FusenBreadcrumb } from '../components/notes/FusenBreadcrumb'
import { RelatedQuestionList } from '../components/notes/RelatedQuestionList'
import { FlashCardSection } from '../components/notes/FlashCardSection'
import { FloatingNav } from '../components/ui/FloatingNav'
import styles from './FusenDetailPage.module.css'

export default function FusenDetailPage() {
  const { fusenId } = useParams<{ fusenId: string }>()
  const navigate = useNavigate()
  const { fusen, relatedQuestions, breadcrumb, isBookmarked, toggleBookmark } =
    useFusenDetail(fusenId ?? '')
  const [imageOpen, setImageOpen] = useState(false)

  if (!fusen) {
    return (
      <div className="sc-page">
        <p>付箋が見つかりません</p>
        <FloatingNav />
      </div>
    )
  }

  const badge = FusenLibraryCore.getImportanceBadge(fusen.linkedQuestionIds.length)
  const unanswered = relatedQuestions.filter(q => q.userStatus === 'unanswered')

  return (
    <div className="sc-page">
      <div className={styles.page}>
        {/* ① ヘッダー */}
        <header className={styles.header}>
          <button className={styles.back} onClick={() => navigate('/notes')}>← 戻る</button>
          <h1 className={styles.title}>{fusen.title}</h1>
          <button
            className={styles.bookmark}
            onClick={toggleBookmark}
            aria-label={isBookmarked ? 'ブックマーク解除' : 'ブックマーク追加'}
            aria-pressed={isBookmarked}
          >
            {isBookmarked ? '★' : '☆'}
          </button>
        </header>

        {/* ② 画像 */}
        <img
          src={fusen.imageUrl}
          alt={fusen.title}
          className={styles.image}
          onClick={() => setImageOpen(true)}
        />

        {/* ③ パンくず + ④ バッジ */}
        <div className={styles.meta}>
          <FusenBreadcrumb breadcrumb={breadcrumb} />
          {badge && (
            <span className={styles.badge}>{badge.emoji} {badge.count}問で使う知識</span>
          )}
        </div>

        {/* ⑤ AI要約 */}
        <section>
          <h3 className={styles.sectionTitle}>AI要約</h3>
          <p className={styles.summary}>{fusen.textSummary}</p>
        </section>

        {/* ⑥ 関連問題 */}
        <RelatedQuestionList questions={relatedQuestions} />

        {/* ⑦ 暗記カード */}
        <FlashCardSection />

        {/* ⑧ CTA */}
        {unanswered.length > 0 && (
          <button
            className={styles.cta}
            onClick={() => navigate(`/practice/${unanswered[0].questionId}`)}
          >
            この知識の問題を解く
          </button>
        )}
      </div>

      {/* 画像拡大 */}
      <NoteImageViewer
        imageUrl={fusen.imageUrl}
        title={fusen.title}
        open={imageOpen}
        onClose={() => setImageOpen(false)}
      />

      <FloatingNav />
    </div>
  )
}
```

- [ ] **Step 6: FusenDetailPage CSS 作成**

```css
/* src/pages/FusenDetailPage.module.css */
.page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.back {
  background: none;
  border: none;
  font-size: 15px;
  color: var(--accent);
  cursor: pointer;
  padding: 4px 0;
  flex-shrink: 0;
}
.title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bookmark {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  color: var(--accent);
  flex-shrink: 0;
}
.image {
  width: 100%;
  border-radius: var(--r);
  cursor: pointer;
}
.meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.badge {
  font-size: 13px;
  color: var(--text-sub);
}
.sectionTitle {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 8px;
}
.summary {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text);
  margin: 0;
  white-space: pre-wrap;
}
.cta {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--r-chip);
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  text-align: center;
}
```

- [ ] **Step 7: routes.tsx にルート追加（Task 4 で未実施の場合）**

`src/routes.tsx` に FusenDetailPage のルートを追加。

- [ ] **Step 8: 型チェック + テスト**

Run: `npx tsc --noEmit && npx vitest run`
Expected: PASS

- [ ] **Step 9: コミット**

```bash
git add src/pages/FusenDetailPage.tsx src/pages/FusenDetailPage.module.css \
  src/components/notes/RelatedQuestionList.tsx src/components/notes/RelatedQuestionList.module.css \
  src/components/notes/FusenBreadcrumb.tsx src/components/notes/FlashCardSection.tsx \
  src/routes.tsx
git commit -m "feat(notes): FusenDetailPage — 付箋詳細ページ（画像+要約+関連問題+CTA）"
```

---

### Task 7: ブラウザ動作確認 + 修正

**Files:** 全ファイル（必要に応じて修正）

- [ ] **Step 1: dev サーバー起動**

Run: `npm run dev`

- [ ] **Step 2: NotesPage 動作確認**

ブラウザで `http://localhost:5173/notes` を開く。確認項目:
- [ ] マイ付箋 / 全付箋 タブ切替が動作する
- [ ] 全付箋タブ: 23件が科目ごとにグリッド表示される
- [ ] マイ付箋タブ: ブックマーク済みの付箋のみ表示（0件なら EmptyState）
- [ ] 画像が正しく表示される
- [ ] サムネイルタップで `/notes/:fusenId` に遷移する

- [ ] **Step 3: FusenDetailPage 動作確認**

任意の付箋をタップして詳細画面を確認:
- [ ] 画像が大きく表示される
- [ ] パンくずリスト（科目>大項目>中項目）が表示される
- [ ] AI要約テキストが表示される
- [ ] 関連問題リストが表示される
- [ ] ★ブックマークトグルが動作する
- [ ] 「← 戻る」で NotesPage に戻る
- [ ] 画像タップで NoteImageViewer（全画面 BottomSheet）が開く

- [ ] **Step 4: 不具合修正（あれば）**

発見した問題を修正。

- [ ] **Step 5: 全テスト実行**

Run: `npx vitest run`
Expected: 全件 PASS

- [ ] **Step 6: ビルド確認**

Run: `npm run build`
Expected: PASS（noUnusedLocals: true で未使用 import エラーがないことを確認）

- [ ] **Step 7: コミット（修正があれば）**

```bash
git add -A
git commit -m "fix(notes): ブラウザ動作確認で発見した不具合を修正"
```

---

## 完了条件

- [ ] OfficialNote 型: `linkedCardIds` 削除済み、`exemplarIds?` / `noteType?` 追加済み
- [ ] FusenLibraryCore: テスト全件パス
- [ ] NotesPage: Ant Design 依存ゼロ、Soft Companion 準拠
- [ ] FusenDetailPage: 画像+要約+関連問題+CTA が動作
- [ ] ルーティング: `/notes` + `/notes/:fusenId` が AppLayout 対応済み
- [ ] `npm run build` パス
- [ ] `npx vitest run` 全件パス
