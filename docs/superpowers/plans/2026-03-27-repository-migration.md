# Repository層移行（localStorage → Supabase）実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 全データ保存層をlocalStorageからSupabaseに移行し、オフライン同期対応のSyncRepository層を構築する

**Architecture:** 既存Repositoryパターンを拡張。SyncRepo層をLocal/Supabase Repoの間に挟み、ローカル即保存+非同期リモート送信を実現。認証状態に応じてLocal(未認証)/Sync(認証済み)を自動切替。

**Tech Stack:** Supabase JS Client / IndexedDB (idb-keyval) / TypeScript

**Depends on:** Plan 1（スキーマ: `2026-03-27-supabase-schema-setup.md`）+ Plan 2（認証）完了

---

## 引き継ぎコンテキスト

### 現在の状態
- Repository層は `src/repositories/` に配置。`interfaces.ts` でインターフェース定義、`localStorage/` と `supabase/` にそれぞれの実装
- `index.ts` のファクトリが環境変数で切替するが、**Phase 1 では `answerHistoryRepo` を常に `LocalAnswerHistoryRepo` に強制**（Supabase未認証で save が黙って失敗するバグの暫定対応）
- `stickyNoteRepo` は Supabase 切替がまだ残っており（同じバグの可能性あり）、要修正
- `SupabaseAnswerHistoryRepo` は部分実装。`db = supabase as any` で型安全性をバイパス中。DB設計 v1.1 の新カラム（`client_event_id`, `synced_at`, `time_spent_ms`, `time_spent_capped`）未対応
- FlashCard型は `FlashCardTemplate`（公式コンテンツ） + `CardProgress`（ユーザーデータ）に分離済み。旧 `FlashCard` 型は deprecated
- `ICardProgressRepo` は `interfaces.ts` に定義済み、`LocalCardProgressRepo` も実装済み。Supabase版は未実装
- `IBookmarkRepo` は未定義。`useBookmarks` フックが直接 localStorage を読み書き（リポジトリ層を経由していない）
- `useAnalytics` と `useTopicMastery` は `loadFromStorage('answer_history')` で直接 localStorage を読む（リポジトリ層をバイパス）。Phase 2 で async 化してリポジトリ統一が必要

### 既知の技術制約
- `erasableSyntaxOnly: true` → `constructor(private x: T)` パラメータプロパティ不可。フィールド宣言 + constructor 内代入
- `@testing-library/react` / jsdom 未導入。フックのテストはロジックをクラスに分離して純粋関数テスト（Vitest）
- `jsx: react-jsx` 設定 → `React.KeyboardEvent` 等の名前空間型は使えない
- `src/` 配下の `__tests__/` は `tsconfig.app.json` の `exclude` で除外済み
- ESMスクリプトでは `__dirname` 未定義 → `fileURLToPath(import.meta.url)` + `path.dirname()`
- `import * as fs from 'fs'`（`import fs from 'fs'` はプロジェクト規約外）

### DB設計spec参照先
- `docs/superpowers/specs/2026-03-27-db-design-spec.md`（v1.1）
- 特に重要なセクション:
  - §3.3 学習データ DDL（answer_history, card_progress, card_review_history, bookmarks）
  - §7 オフライン同期設計（SyncQueue, テーブル別戦略, merge_card_progress RPC）
  - §8 localStorage → Supabase 移行戦略（既存TS型→DB型マッピング, べき等性保証）

### 既存ファイル一覧

| ファイル | 現状 | この計画での変更 |
|---------|------|----------------|
| `src/repositories/interfaces.ts` | IAnswerHistoryRepo, IStickyNoteRepo, IFlashCardRepo, IFlashCardTemplateRepo, ICardProgressRepo | IAnswerHistoryRepo 更新 + IBookmarkRepo, ICardReviewHistoryRepo 新規追加 |
| `src/repositories/index.ts` | ファクトリ。Local強制 | 認証状態で Local/Sync 切替 |
| `src/repositories/localStorage/answerHistoryRepo.ts` | 実装済み | 新カラム対応 |
| `src/repositories/localStorage/cardProgressRepo.ts` | 実装済み | 変更なし |
| `src/repositories/supabase/answerHistoryRepo.ts` | 部分実装、as any | 全面書き直し |
| `src/repositories/supabase/stickyNoteRepo.ts` | 部分実装 | スコープ外（Phase 3） |
| `src/hooks/useAnswerHistory.ts` | リポジトリ経由 | 変更なし（ファクトリが切替を吸収） |
| `src/hooks/useBookmarks.ts` | localStorage直接 | リポジトリ経由に修正 |
| `src/hooks/useAnalytics.ts` | localStorage直接読み | リポジトリ経由に修正（async化） |
| `src/hooks/useTopicMastery.ts` | localStorage直接読み | リポジトリ経由に修正（async化） |
| `src/hooks/useFlashCards.ts` | リポジトリ経由（旧FlashCardRepo） | スコープ外（FlashCard UIリデザインと同時対応） |
| `src/types/question.ts` | AnswerHistory 型 | 新カラム追加（client_event_id, synced_at, time_spent_ms） |
| `src/types/card-progress.ts` | CardProgress 型 | 新カラム追加（client_updated_at, sync_version） |
| `src/types/official-note.ts` | BookmarkedNote 型 | 変更なし |
| `src/lib/supabase.ts` | クライアント生成 + 型定義 | Database型更新 |

---

## ファイル構成

### 新規作成

| ファイル | 責務 |
|---------|------|
| `src/repositories/interfaces.ts` | IBookmarkRepo, ICardReviewHistoryRepo 追加（既存ファイル変更） |
| `src/repositories/supabase/answerHistoryRepo.ts` | Supabase版 answer_history CRUD（全面書き直し） |
| `src/repositories/supabase/cardProgressRepo.ts` | Supabase版 card_progress CRUD |
| `src/repositories/supabase/cardReviewHistoryRepo.ts` | Supabase版 card_review_history CRUD |
| `src/repositories/supabase/bookmarkRepo.ts` | Supabase版 bookmarks CRUD |
| `src/repositories/localStorage/bookmarkRepo.ts` | localStorage版 bookmarks（useBookmarksから抽出） |
| `src/repositories/localStorage/cardReviewHistoryRepo.ts` | localStorage版 card_review_history |
| `src/repositories/sync/SyncQueue.ts` | IndexedDB同期キュー（idb-keyval使用） |
| `src/repositories/sync/SyncAnswerHistoryRepo.ts` | answer_history用 SyncRepo |
| `src/repositories/sync/SyncCardProgressRepo.ts` | card_progress用 SyncRepo |
| `src/repositories/sync/SyncBookmarkRepo.ts` | bookmarks用 SyncRepo |
| `src/repositories/sync/__tests__/SyncQueue.test.ts` | SyncQueue テスト |
| `src/repositories/sync/__tests__/SyncAnswerHistoryRepo.test.ts` | SyncAnswerHistoryRepo テスト |
| `src/repositories/sync/__tests__/SyncCardProgressRepo.test.ts` | SyncCardProgressRepo テスト |
| `src/repositories/sync/__tests__/SyncBookmarkRepo.test.ts` | SyncBookmarkRepo テスト |
| `src/repositories/supabase/__tests__/answerHistoryRepo.test.ts` | Supabase AnswerHistory テスト |
| `src/repositories/supabase/__tests__/cardProgressRepo.test.ts` | Supabase CardProgress テスト |
| `src/repositories/supabase/__tests__/bookmarkRepo.test.ts` | Supabase Bookmark テスト |
| `src/repositories/migration/LocalToSupabaseMigrator.ts` | localStorage→Supabase一括移行 |
| `src/repositories/migration/__tests__/LocalToSupabaseMigrator.test.ts` | 移行スクリプト テスト |
| `src/hooks/useAuth.ts` | 認証状態管理（SyncRepo切替トリガー） |

### 変更

| ファイル | 変更内容 |
|---------|---------|
| `src/types/question.ts` | AnswerHistory に client_event_id, synced_at, time_spent_ms 追加 |
| `src/types/card-progress.ts` | CardProgress に client_updated_at, sync_version 追加 |
| `src/repositories/interfaces.ts` | IAnswerHistoryRepo更新、IBookmarkRepo・ICardReviewHistoryRepo追加 |
| `src/repositories/index.ts` | 認証状態による Local/Sync 切替ロジック |
| `src/repositories/localStorage/answerHistoryRepo.ts` | 新カラムの後方互換対応 |
| `src/hooks/useBookmarks.ts` | リポジトリ経由に修正 |
| `src/hooks/useAnalytics.ts` | リポジトリ経由 + async化 |
| `src/hooks/useTopicMastery.ts` | リポジトリ経由 + async化 |
| `src/lib/supabase.ts` | Database型を新DDLに合わせて更新 |

---

## Task 1: AnswerHistory型 + インターフェース更新

**Files:**
- Change: `src/types/question.ts`
- Change: `src/types/card-progress.ts`
- Change: `src/repositories/interfaces.ts`

- [ ] **Step 1: AnswerHistory 型に新カラムを追加**

```typescript
// src/types/question.ts — AnswerHistory を更新

/** 回答履歴 */
export interface AnswerHistory {
  id: string
  user_id: string
  question_id: string
  selected_answer: number | number[] | null  // null: スキップ時
  is_correct: boolean | null                 // ★変更: null=スキップ時（正否不明）
  answered_at: string       // ISO8601
  confidence_level?: ConfidenceLevel
  // ★ time_spent_seconds → time_spent_ms に移行（旧フィールドは後方互換で残す）
  time_spent_seconds?: number        // @deprecated DB移行後に削除
  time_spent_ms?: number | null      // ★新規: ミリ秒。30分(1,800,000ms)上限
  time_spent_capped?: boolean        // ★新規: time_spent_ms がclampされたか
  skipped?: boolean
  // ★ オフライン同期用
  client_event_id?: string           // ★新規: クライアント生成UUID
  synced_at?: string | null          // ★新規: サーバー同期日時
}
```

注意: `is_correct` を `boolean | null` に変更。既存コードで `h.is_correct` を truthy チェックしている箇所は影響なし（`null` は falsy）。ただし `=== true` / `=== false` の箇所は要確認。

- [ ] **Step 2: CardProgress 型に新カラムを追加**

```typescript
// src/types/card-progress.ts — CardProgress を更新

export interface CardProgress {
  template_id: string
  user_id: string
  ease_factor: number
  interval_days: number
  next_review_at: string
  review_count: number
  correct_streak: number
  last_reviewed_at: string
  // ★ オフライン同期用
  client_updated_at?: string         // ★新規: クライアント側の最終更新時刻
  sync_version?: number              // ★新規: サーバー側バージョン番号
}
```

- [ ] **Step 3: IBookmarkRepo, ICardReviewHistoryRepo を追加、IAnswerHistoryRepo を更新**

```typescript
// src/repositories/interfaces.ts に追加

import type { BookmarkedNote } from '../types/official-note'
import type { ReviewResult } from '../types/card-progress'

/** 回答履歴リポジトリ（更新） */
export interface IAnswerHistoryRepo {
  getAll(): Promise<AnswerHistory[]>
  save(answer: Omit<AnswerHistory, 'id'>): Promise<AnswerHistory>
  getLatestByQuestionId(questionId: string): Promise<AnswerHistory | undefined>
  /** 問題IDの一覧で回答履歴をフィルタ取得（useAnalytics/useTopicMastery用） */
  getByQuestionIds?(questionIds: string[]): Promise<AnswerHistory[]>
}

/** ブックマークリポジトリ */
export interface IBookmarkRepo {
  getAll(): Promise<BookmarkedNote[]>
  isBookmarked(noteId: string): Promise<boolean>
  add(noteId: string): Promise<BookmarkedNote>
  remove(noteId: string): Promise<void>
  toggle(noteId: string): Promise<boolean>  // 戻り値: toggle後の状態（true=追加）
}

/** カード復習履歴リポジトリ（append-only） */
export interface ICardReviewHistoryRepo {
  save(entry: {
    template_id: string
    result: ReviewResult
    ease_factor_before: number
    ease_factor_after: number
    reviewed_at: string
    client_event_id: string
  }): Promise<void>
  getByTemplateId(templateId: string): Promise<Array<{
    template_id: string
    result: ReviewResult
    reviewed_at: string
  }>>
}
```

- [ ] **Step 4: コンパイル確認**

```bash
npx tsc --noEmit
```

`is_correct: boolean | null` の変更で型エラーが出る箇所を洗い出し、必要に応じて修正する。

- [ ] **Step 5: コミット**

```bash
git add src/types/question.ts src/types/card-progress.ts src/repositories/interfaces.ts
git commit -m "feat(repo): AnswerHistory/CardProgress型に同期カラム追加、IBookmarkRepo/ICardReviewHistoryRepo定義"
```

---

## Task 2: LocalBookmarkRepo 抽出 + useBookmarks リポジトリ化 — テスト先行

**Files:**
- Create: `src/repositories/localStorage/bookmarkRepo.ts`
- Create: `src/repositories/localStorage/__tests__/bookmarkRepo.test.ts`
- Change: `src/hooks/useBookmarks.ts`
- Change: `src/repositories/index.ts`

- [ ] **Step 1: LocalBookmarkRepo テストを作成**

```typescript
// src/repositories/localStorage/__tests__/bookmarkRepo.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LocalBookmarkRepo } from '../bookmarkRepo'

// localStorage モック
const storageMap = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => { storageMap.set(key, value) },
  removeItem: (key: string) => { storageMap.delete(key) },
})

describe('LocalBookmarkRepo', () => {
  beforeEach(() => { storageMap.clear() })

  it('初期状態では空配列を返す', async () => {
    const repo = new LocalBookmarkRepo()
    expect(await repo.getAll()).toEqual([])
  })

  it('add でブックマークを追加できる', async () => {
    const repo = new LocalBookmarkRepo()
    const result = await repo.add('fusen-0001')
    expect(result.note_id).toBe('fusen-0001')
    expect(result.user_id).toBe('local')
    const all = await repo.getAll()
    expect(all).toHaveLength(1)
  })

  it('remove でブックマークを削除できる', async () => {
    const repo = new LocalBookmarkRepo()
    await repo.add('fusen-0001')
    await repo.remove('fusen-0001')
    expect(await repo.getAll()).toHaveLength(0)
  })

  it('isBookmarked が正しく判定する', async () => {
    const repo = new LocalBookmarkRepo()
    expect(await repo.isBookmarked('fusen-0001')).toBe(false)
    await repo.add('fusen-0001')
    expect(await repo.isBookmarked('fusen-0001')).toBe(true)
  })

  it('toggle で追加/削除を切り替える', async () => {
    const repo = new LocalBookmarkRepo()
    const added = await repo.toggle('fusen-0001')
    expect(added).toBe(true)
    const removed = await repo.toggle('fusen-0001')
    expect(removed).toBe(false)
    expect(await repo.getAll()).toHaveLength(0)
  })

  it('旧 on-NNN IDを fusen-NNNN に自動移行する', async () => {
    // on-001 形式の旧データを直接セット
    storageMap.set('bookmarked_notes', JSON.stringify([
      { id: 'x', user_id: 'local', note_id: 'on-001', bookmarked_at: '2026-01-01T00:00:00Z', review_count: 0 },
    ]))
    const repo = new LocalBookmarkRepo()
    const all = await repo.getAll()
    expect(all[0].note_id).toBe('fusen-0001')
  })
})
```

- [ ] **Step 2: LocalBookmarkRepo を実装**

`useBookmarks.ts` の localStorage操作 + IDマイグレーションロジックをクラスに抽出する。

- [ ] **Step 3: useBookmarks をリポジトリ経由に修正**

```typescript
// src/hooks/useBookmarks.ts（修正後の概要）
import { useState, useCallback, useEffect } from 'react'
import type { BookmarkedNote } from '../types/official-note'
import { bookmarkRepo } from '../repositories'

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkedNote[]>([])

  useEffect(() => {
    bookmarkRepo.getAll().then(setBookmarks)
  }, [])

  const isBookmarked = useCallback(
    (noteId: string): boolean => bookmarks.some((b) => b.note_id === noteId),
    [bookmarks],
  )

  const toggleBookmark = useCallback((noteId: string): void => {
    bookmarkRepo.toggle(noteId).then((added) => {
      if (added) {
        bookmarkRepo.getAll().then(setBookmarks)
      } else {
        setBookmarks((prev) => prev.filter((b) => b.note_id !== noteId))
      }
    })
  }, [])

  return { bookmarks, isBookmarked, toggleBookmark }
}
```

- [ ] **Step 4: ファクトリに bookmarkRepo を追加**

```typescript
// src/repositories/index.ts に追加
import { LocalBookmarkRepo } from './localStorage/bookmarkRepo'

function createBookmarkRepo(): IBookmarkRepo {
  return new LocalBookmarkRepo()
}

export const bookmarkRepo = createBookmarkRepo()
```

- [ ] **Step 5: テスト実行 + コンパイル確認**

```bash
npx vitest run src/repositories/localStorage/__tests__/bookmarkRepo.test.ts
npx tsc --noEmit
```

- [ ] **Step 6: コミット**

```bash
git add src/repositories/localStorage/bookmarkRepo.ts \
  src/repositories/localStorage/__tests__/bookmarkRepo.test.ts \
  src/hooks/useBookmarks.ts src/repositories/index.ts src/repositories/interfaces.ts
git commit -m "refactor(repo): useBookmarks を LocalBookmarkRepo 経由に移行"
```

---

## Task 3: LocalCardReviewHistoryRepo 実装 — テスト先行

**Files:**
- Create: `src/repositories/localStorage/cardReviewHistoryRepo.ts`
- Create: `src/repositories/localStorage/__tests__/cardReviewHistoryRepo.test.ts`
- Change: `src/repositories/index.ts`

- [ ] **Step 1: テスト作成**

```typescript
// localStorage/__tests__/cardReviewHistoryRepo.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LocalCardReviewHistoryRepo } from '../cardReviewHistoryRepo'

describe('LocalCardReviewHistoryRepo', () => {
  it('save でイベントを追記する', async () => { /* ... */ })
  it('getByTemplateId でフィルタ取得する', async () => { /* ... */ })
  it('append-only: save は既存データを上書きしない', async () => { /* ... */ })
})
```

- [ ] **Step 2: LocalCardReviewHistoryRepo 実装**

パターンは `LocalCardProgressRepo` と同じ load/persist 方式。`STORAGE_KEY = 'card_review_history'`。

- [ ] **Step 3: ファクトリに追加**

- [ ] **Step 4: テスト実行 + コミット**

```bash
npx vitest run src/repositories/localStorage/__tests__/cardReviewHistoryRepo.test.ts
git commit -m "feat(repo): LocalCardReviewHistoryRepo 追加（append-only復習イベント記録）"
```

---

## Task 4: SupabaseAnswerHistoryRepo 全面書き直し — テスト先行

**Files:**
- Create: `src/repositories/supabase/__tests__/answerHistoryRepo.test.ts`
- Change: `src/repositories/supabase/answerHistoryRepo.ts`
- Change: `src/lib/supabase.ts`（Database型更新）

- [ ] **Step 1: Database型を新DDLに合わせて更新**

`src/lib/supabase.ts` の `Database` 型を DB設計spec §3.3 に合わせて更新。特に `answer_history.Row` を新カラム対応にする。

- [ ] **Step 2: テスト作成（Supabase client をモック）**

```typescript
// supabase/__tests__/answerHistoryRepo.test.ts
// Supabase client のモック: from().select() / insert() / eq() 等のチェーンをスタブ化
// テスト項目:
//   - getAll: select + order 呼び出し確認、mapRow変換
//   - save: insert に正しいカラムが渡る（client_event_id, time_spent_ms, is_correct nullable）
//   - save: user_id は auth.getUser() から取得
//   - save: question_id は text型そのまま（UUID変換なし）
//   - getLatestByQuestionId: eq + order + limit 確認
//   - mapRow: DB行 → AnswerHistory型の変換（time_spent_ms→number, selected_answer→int[]対応）
```

- [ ] **Step 3: SupabaseAnswerHistoryRepo 書き直し**

変更点:
- `as any` バイパス廃止 → 正しいDatabase型を使用
- `question_id: text` 対応（UUID変換不要）
- `time_spent_seconds` → `time_spent_ms` 移行
- `client_event_id` を save 時に生成（`crypto.randomUUID()`）
- `selected_answer` を `int[]` 形式で保存
- `is_correct: boolean | null` 対応
- `synced_at` を save 成功時に設定
- mapRow で DB行 → TS型の正確な変換

```typescript
// 主要な変更: save メソッド
async save(answer: Omit<AnswerHistory, 'id'>): Promise<AnswerHistory> {
  const user = await this.getAuthUser()
  const clientEventId = answer.client_event_id ?? crypto.randomUUID()

  const { data, error } = await supabase
    .from('answer_history')
    .insert({
      user_id: user.id,
      question_id: answer.question_id,
      selected_answer: this.normalizeSelectedAnswer(answer.selected_answer),
      is_correct: answer.is_correct ?? null,
      time_spent_ms: answer.time_spent_ms ?? (answer.time_spent_seconds ? answer.time_spent_seconds * 1000 : null),
      skipped: answer.skipped ?? false,
      client_event_id: clientEventId,
      answered_at: answer.answered_at,
    })
    .select()
    .single()

  if (error) throw new Error(`[SupabaseAnswerHistoryRepo] save: ${error.message}`)
  return this.mapRow(data)
}
```

- [ ] **Step 4: テスト実行 + コンパイル確認**

```bash
npx vitest run src/repositories/supabase/__tests__/answerHistoryRepo.test.ts
npx tsc --noEmit
```

- [ ] **Step 5: コミット**

```bash
git commit -m "feat(repo): SupabaseAnswerHistoryRepo 全面書き直し（text question_id, 新カラム対応）"
```

---

## Task 5: SupabaseCardProgressRepo + SupabaseBookmarkRepo 新規実装 — テスト先行

**Files:**
- Create: `src/repositories/supabase/cardProgressRepo.ts`
- Create: `src/repositories/supabase/bookmarkRepo.ts`
- Create: `src/repositories/supabase/cardReviewHistoryRepo.ts`
- Create: `src/repositories/supabase/__tests__/cardProgressRepo.test.ts`
- Create: `src/repositories/supabase/__tests__/bookmarkRepo.test.ts`

- [ ] **Step 1: SupabaseCardProgressRepo テスト作成**

```typescript
// テスト項目:
//   - getAll: user_id フィルタ確認
//   - getByTemplateId: eq(template_id) + eq(user_id) 確認
//   - save: upsert（user_id + template_id で ON CONFLICT UPDATE）
//   - getDueCards: next_review_at <= now フィルタ確認
```

- [ ] **Step 2: SupabaseCardProgressRepo 実装**

DB設計spec §3.3 の `card_progress` テーブルに対応。`UNIQUE(user_id, template_id)` を活用した upsert。

- [ ] **Step 3: SupabaseBookmarkRepo テスト作成**

```typescript
// テスト項目:
//   - getAll: user_id フィルタ + order(created_at DESC) 確認
//   - add: insert(user_id, note_id)
//   - remove: delete().eq(user_id).eq(note_id)
//   - toggle: isBookmarked → add/remove 分岐
//   - isBookmarked: select().eq().maybeSingle() で存在チェック
```

- [ ] **Step 4: SupabaseBookmarkRepo 実装**

DB設計spec §3.3 の `bookmarks` テーブルに対応。PK は `(user_id, note_id)` の複合キー。

- [ ] **Step 5: SupabaseCardReviewHistoryRepo 実装**

append-only INSERT。`client_event_id` で冪等性保証（`ON CONFLICT DO NOTHING`）。

- [ ] **Step 6: テスト全通し + コンパイル確認**

```bash
npx vitest run src/repositories/supabase/__tests__/
npx tsc --noEmit
```

- [ ] **Step 7: コミット**

```bash
git commit -m "feat(repo): SupabaseCardProgressRepo + SupabaseBookmarkRepo + SupabaseCardReviewHistoryRepo 新規実装"
```

---

## Task 6: SyncQueue（IndexedDB同期キュー）— テスト先行

**Files:**
- Create: `src/repositories/sync/SyncQueue.ts`
- Create: `src/repositories/sync/__tests__/SyncQueue.test.ts`

- [ ] **Step 1: SyncQueue テスト作成**

```typescript
// src/repositories/sync/__tests__/SyncQueue.test.ts
// idb-keyval をモック（in-memory Map でスタブ化）
// テスト項目:
//   - enqueue: アイテムを追加、上限1,000件でFIFO溢れ
//   - dequeue(batchSize): 先頭N件を取得（削除はしない）
//   - ack(ids): 処理済みアイテムを削除
//   - size: 現在のキューサイズ
//   - clear: 全件削除
//   - テーブル別キュー: 'answer_history' / 'card_progress' / 'bookmarks' を分離
```

- [ ] **Step 2: SyncQueue 実装**

```typescript
// src/repositories/sync/SyncQueue.ts
// IndexedDB（idb-keyval）を使用。localStorage とは別空間にすることでSW干渉を回避
// 構造: { id: string, table: string, operation: 'insert'|'upsert'|'delete', payload: unknown, createdAt: string }
// 上限: 1,000件。FIFO溢れ時は古いものを自動削除
// バッチ取得: dequeue(100) で最大100件を返却（処理済みなら ack で削除）
```

依存: `idb-keyval` パッケージ（軽量 IndexedDB ラッパー、バンドルサイズ ~600B gzip）

- [ ] **Step 3: npm install + テスト実行**

```bash
npm install idb-keyval
npx vitest run src/repositories/sync/__tests__/SyncQueue.test.ts
```

- [ ] **Step 4: コミット**

```bash
git commit -m "feat(sync): SyncQueue — IndexedDB同期キュー（上限1,000件、100件/バッチ）"
```

---

## Task 7: SyncAnswerHistoryRepo — テスト先行

**Files:**
- Create: `src/repositories/sync/SyncAnswerHistoryRepo.ts`
- Create: `src/repositories/sync/__tests__/SyncAnswerHistoryRepo.test.ts`

- [ ] **Step 1: テスト作成**

```typescript
// テスト項目:
//   - save: LocalRepo.save() を呼び、SyncQueue.enqueue() も呼ぶ
//   - save: client_event_id が未設定なら自動生成
//   - getAll: LocalRepo.getAll() を呼ぶ（読み取りはローカルのみ）
//   - getLatestByQuestionId: LocalRepo を呼ぶ
//   - flush: SyncQueue.dequeue() → SupabaseRepo にバッチ送信 → 成功分を ack
//   - flush: ネットワークエラー時はキューに残す（リトライ可能）
//   - flush: ON CONFLICT(client_event_id) DO NOTHING で冪等
```

- [ ] **Step 2: SyncAnswerHistoryRepo 実装**

```typescript
// src/repositories/sync/SyncAnswerHistoryRepo.ts
// 設計:
//   - IAnswerHistoryRepo を実装
//   - constructor: localRepo, supabaseRepo, syncQueue を受け取る
//     ※ erasableSyntaxOnly: true → フィールド宣言 + constructor 内代入
//   - save(): localRepo.save() → syncQueue.enqueue('answer_history', 'insert', payload)
//   - getAll() / getLatestByQuestionId(): localRepo に委譲
//   - flush(): syncQueue.dequeue(100) → supabaseRepo に一括 insert
//     → 成功した id を syncQueue.ack()
//   - startAutoFlush(): visibilitychange('hidden') + 定期タイマー(60秒) で flush
//     ※ pagehide もフォールバックとして登録（モバイルエンジニアレビュー指摘）
```

- [ ] **Step 3: テスト実行 + コミット**

```bash
npx vitest run src/repositories/sync/__tests__/SyncAnswerHistoryRepo.test.ts
git commit -m "feat(sync): SyncAnswerHistoryRepo — ローカル即保存+非同期リモート送信"
```

---

## Task 8: SyncCardProgressRepo + SyncBookmarkRepo — テスト先行

**Files:**
- Create: `src/repositories/sync/SyncCardProgressRepo.ts`
- Create: `src/repositories/sync/SyncBookmarkRepo.ts`
- Create: `src/repositories/sync/__tests__/SyncCardProgressRepo.test.ts`
- Create: `src/repositories/sync/__tests__/SyncBookmarkRepo.test.ts`

- [ ] **Step 1: SyncCardProgressRepo テスト作成**

```typescript
// テスト項目:
//   - save: LocalRepo.save() + SyncQueue.enqueue('card_progress', 'upsert')
//   - flush: merge_card_progress RPC 呼び出し確認
//   - flush: 同一 template_id のイベントをまとめてRPCに渡す
//   - getAll / getByTemplateId / getDueCards: localRepo 委譲
```

- [ ] **Step 2: SyncCardProgressRepo 実装**

card_progress はサーバー側マージ関数（`merge_card_progress` RPC）を使用。単純 upsert ではなくイベントをまとめて送信。

- [ ] **Step 3: SyncBookmarkRepo テスト作成**

```typescript
// テスト項目:
//   - add: LocalRepo.add() + SyncQueue.enqueue('bookmarks', 'insert')
//   - remove: LocalRepo.remove() + SyncQueue.enqueue('bookmarks', 'delete')
//   - toggle: add/remove を呼び分け
//   - flush: insert → ON CONFLICT DO NOTHING, delete → DELETE
```

- [ ] **Step 4: SyncBookmarkRepo 実装**

bookmarks は toggle 方式。insert → `ON CONFLICT(user_id, note_id) DO NOTHING`、delete → `DELETE WHERE user_id AND note_id`。

- [ ] **Step 5: テスト全通し + コミット**

```bash
npx vitest run src/repositories/sync/__tests__/
git commit -m "feat(sync): SyncCardProgressRepo + SyncBookmarkRepo"
```

---

## Task 9: リポジトリファクトリ更新（認証状態切替）

**Files:**
- Change: `src/repositories/index.ts`
- Create: `src/hooks/useAuth.ts`（簡易版。認証フック本体は Plan 2 で実装）

- [ ] **Step 1: useAuth 簡易版を作成**

```typescript
// src/hooks/useAuth.ts
// Plan 2（認証実装）の前に、ファクトリが参照するための最小限の認証状態管理
// Phase 1 では常に { user: null, isAuthenticated: false } を返す
// Plan 2 で Supabase Auth のセッション監視に置き換え

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
  })

  useEffect(() => {
    if (!supabase) {
      setState({ user: null, isAuthenticated: false, loading: false })
      return
    }

    // 現在のセッション確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        isAuthenticated: !!session?.user,
        loading: false,
      })
    })

    // セッション変更の監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        isAuthenticated: !!session?.user,
        loading: false,
      })
    })

    return () => subscription.unsubscribe()
  }, [])

  return state
}
```

- [ ] **Step 2: ファクトリを認証状態切替に更新**

```typescript
// src/repositories/index.ts（更新後の概要）
// Phase 1: 常に Local を返す（useAuth が null を返すため）
// Phase 2: 認証済みなら SyncRepo、未認証なら Local を返す

import { SyncAnswerHistoryRepo } from './sync/SyncAnswerHistoryRepo'
import { SyncBookmarkRepo } from './sync/SyncBookmarkRepo'
import { SyncCardProgressRepo } from './sync/SyncCardProgressRepo'
import { SyncQueue } from './sync/SyncQueue'

let currentUserId: string | null = null
let cachedSyncQueue: SyncQueue | null = null

// 認証状態変更時にファクトリを再構築
export function initRepositories(userId: string | null) {
  currentUserId = userId
  if (userId && !cachedSyncQueue) {
    cachedSyncQueue = new SyncQueue()
  }
  // シングルトンの再生成
  _answerHistoryRepo = createAnswerHistoryRepo()
  _bookmarkRepo = createBookmarkRepo()
  _cardProgressRepo = createCardProgressRepo()
}

function createAnswerHistoryRepo(): IAnswerHistoryRepo {
  if (currentUserId && isSupabaseConfigured) {
    return new SyncAnswerHistoryRepo(
      new LocalAnswerHistoryRepo(),
      new SupabaseAnswerHistoryRepo(),
      cachedSyncQueue!,
    )
  }
  return new LocalAnswerHistoryRepo()
}

// ... 他のレポジトリも同様
```

注意: `stickyNoteRepo` の Supabase 分岐も Local 強制に修正する（既知のバグ対応）。

- [ ] **Step 3: コンパイル確認 + 既存テスト全通し**

```bash
npx tsc --noEmit
npx vitest run
```

- [ ] **Step 4: コミット**

```bash
git commit -m "feat(repo): ファクトリを認証状態切替に更新（Phase 1 では常にLocal）"
```

---

## Task 10: useAnalytics + useTopicMastery のリポジトリ統合

**Files:**
- Change: `src/hooks/useAnalytics.ts`
- Change: `src/hooks/useTopicMastery.ts`

- [ ] **Step 1: useAnalytics を async 対応に修正**

現状の問題:
- `loadFromStorage<AnswerHistory>('answer_history')` で直接 localStorage を読んでいる
- リポジトリ層をバイパスしているため、SyncRepo に切り替わっても反映されない

修正方針:
- `useMemo` → `useState` + `useEffect` に変更
- `answerHistoryRepo.getAll()` で回答履歴を取得
- 付箋（sticky_notes）の読み取りは、NotesPage リデザイン時に対応（ここでは localStorage 直接のまま許容）

```typescript
// src/hooks/useAnalytics.ts（修正後の骨格）
import { useState, useEffect, useMemo } from 'react'
import { answerHistoryRepo } from '../repositories'
// ... 他の import

export function useAnalytics(): UseAnalyticsReturn & { loading: boolean } {
  const [allHistory, setAllHistory] = useState<AnswerHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    answerHistoryRepo.getAll().then((data) => {
      setAllHistory(data)
      setLoading(false)
    })
  }, [])

  // 集計ロジックは useMemo で allHistory が変わったときだけ再計算
  return useMemo(() => {
    // ... 既存の集計ロジック（allHistory を使用）
    // loadFromStorage を呼ばず、引数の allHistory を使う
  }, [allHistory])
}
```

注意: `UseAnalyticsReturn` に `loading: boolean` を追加。既存の利用箇所で loading 状態を考慮する必要がある。HomePage, AnalysisPage で loading 中の表示を確認すること。

- [ ] **Step 2: useTopicMastery を async 対応に修正**

同じパターンで `loadFromStorage` → `answerHistoryRepo.getAll()` に置き換え。

```typescript
export function useTopicMastery(): UseTopicMasteryReturn & { loading: boolean } {
  const [allHistory, setAllHistory] = useState<AnswerHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    answerHistoryRepo.getAll().then((data) => {
      setAllHistory(data)
      setLoading(false)
    })
  }, [])

  return useMemo(() => {
    // ... 既存の集計ロジック
  }, [allHistory])
}
```

- [ ] **Step 3: 利用箇所の loading 対応確認**

`useAnalytics()` / `useTopicMastery()` を使用しているコンポーネントで、`loading` 状態の間に不正な初期値（空配列）が表示されないか確認。必要に応じて loading スケルトンを追加。

- [ ] **Step 4: コンパイル確認 + 既存テスト全通し**

```bash
npx tsc --noEmit
npx vitest run
```

- [ ] **Step 5: コミット**

```bash
git commit -m "refactor(hooks): useAnalytics/useTopicMastery を answerHistoryRepo 経由に統合"
```

---

## Task 11: localStorage → Supabase 初回移行スクリプト — テスト先行

**Files:**
- Create: `src/repositories/migration/LocalToSupabaseMigrator.ts`
- Create: `src/repositories/migration/__tests__/LocalToSupabaseMigrator.test.ts`

- [ ] **Step 1: テスト作成**

```typescript
// migration/__tests__/LocalToSupabaseMigrator.test.ts
// テスト項目:
//   - migrate: localStorage から answer_history を読み出し、Supabase にバッチ送信
//   - migrate: client_event_id を決定的に生成（'migration_' + 既存id）
//   - migrate: selected_answer を int[] に正規化（number → [number]）
//   - migrate: time_spent_seconds → time_spent_ms 変換（× 1000）
//   - migrate: user_id を 'local' → auth.uid() に置換
//   - migrate: 100件ずつバッチ INSERT
//   - migrate: ON CONFLICT(client_event_id) DO NOTHING で冪等
//   - migrate: 完了後に localStorage にフラグ設定
//   - migrate: フラグが存在する場合はスキップ
//   - migrateBookmarks: BookmarkedNote を bookmarks テーブルに移行
//   - migrateCardProgress: CardProgress を card_progress テーブルに移行
//   - migrateAll: 全データを一括移行（answer_history + bookmarks + card_progress）
//   - rollback: 移行失敗時はフラグを設定しない（次回再試行可能）
```

- [ ] **Step 2: LocalToSupabaseMigrator 実装**

```typescript
// src/repositories/migration/LocalToSupabaseMigrator.ts
// DB設計spec §8 に準拠
// 設計:
//   - constructor: supabase client, userId を受け取る
//   - migrateAll(): answer_history → bookmarks → card_progress の順に移行
//   - 各テーブル: localStorage読み出し → 型変換 → バッチ upsert → フラグ設定
//   - べき等性: client_event_id / (user_id, note_id) / (user_id, template_id) で ON CONFLICT

export class LocalToSupabaseMigrator {
  private supabase: SupabaseClient
  private userId: string

  constructor(supabase: SupabaseClient, userId: string) {
    this.supabase = supabase
    this.userId = userId
  }

  async migrateAll(): Promise<{ success: boolean; counts: Record<string, number> }> {
    const migrationKey = 'supabase_migration_completed'
    if (localStorage.getItem(migrationKey)) {
      return { success: true, counts: {} }
    }

    try {
      const counts: Record<string, number> = {}
      counts.answer_history = await this.migrateAnswerHistory()
      counts.bookmarks = await this.migrateBookmarks()
      counts.card_progress = await this.migrateCardProgress()

      localStorage.setItem(migrationKey, new Date().toISOString())
      return { success: true, counts }
    } catch (error) {
      console.error('[Migration] Failed:', error)
      // フラグを設定しない → 次回再試行
      return { success: false, counts: {} }
    }
  }

  // ... 各テーブルの移行メソッド
}
```

- [ ] **Step 3: テスト実行 + コミット**

```bash
npx vitest run src/repositories/migration/__tests__/LocalToSupabaseMigrator.test.ts
git commit -m "feat(migration): LocalToSupabaseMigrator — localStorage→Supabase初回一括移行"
```

---

## Task 12: 統合テスト + stickyNoteRepo バグ修正 + 全体通し

**Files:**
- Change: `src/repositories/index.ts`（stickyNoteRepo Local強制）
- Change: 必要に応じて型エラー箇所

- [ ] **Step 1: stickyNoteRepo の Supabase 分岐を Local 強制に修正**

```typescript
// src/repositories/index.ts
function createStickyNoteRepo(): IStickyNoteRepo {
  // Phase 1: 常に localStorage を使用
  // SupabaseStickyNoteRepo は answerHistoryRepo と同じバグ（未認証時にsaveが失敗）の可能性あり
  return new LocalStickyNoteRepo()
}
```

- [ ] **Step 2: 全テスト実行**

```bash
npx vitest run
```

- [ ] **Step 3: コンパイル確認**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: `npm run build` で本番ビルド確認**

```bash
npm run build
```

ビルドに含まれる Supabase / idb-keyval のバンドルサイズを確認。Supabase JS Client は既に依存に入っている。idb-keyval は ~600B gzip なので影響軽微。

- [ ] **Step 5: 動作確認チェックリスト**

```
[ ] npm run dev で起動し、演習ページで問題を解いて回答が保存される
[ ] ブックマーク追加/削除が正常に動作する
[ ] AnalysisPage の統計が表示される（loading状態 → データ表示）
[ ] HomePage のストリーク・今日の統計が表示される
[ ] 暗記カードの復習が正常に動作する
[ ] ブラウザのlocalStorageに従来通りデータが保存されている
```

- [ ] **Step 6: コミット**

```bash
git commit -m "fix(repo): stickyNoteRepo を Local 強制に修正 + 統合テスト全通し"
```

---

## 全体テスト戦略

| レイヤー | テスト対象 | テスト方式 |
|---------|-----------|-----------|
| 型 | AnswerHistory, CardProgress 新カラム | tsc --noEmit |
| LocalRepo | LocalBookmarkRepo, LocalCardReviewHistoryRepo | vitest + localStorage モック |
| SupabaseRepo | SupabaseAnswerHistoryRepo, SupabaseCardProgressRepo, SupabaseBookmarkRepo | vitest + Supabase client モック |
| SyncQueue | IndexedDB キュー操作 | vitest + idb-keyval モック（in-memory Map） |
| SyncRepo | SyncAnswerHistoryRepo, SyncCardProgressRepo, SyncBookmarkRepo | vitest + LocalRepo/SupabaseRepo/SyncQueue モック |
| Migration | LocalToSupabaseMigrator | vitest + localStorage + Supabase モック |
| Hooks | useAnalytics, useTopicMastery（async化後） | コンパイル確認 + 手動動作確認 |
| 統合 | ファクトリ切替、全フロー | npm run build + 手動動作確認 |

---

## リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| `is_correct: boolean \| null` 変更で既存コードが壊れる | 中 | Task 1 Step 4 で tsc --noEmit を実行、`=== true` / `=== false` の箇所を全検索して修正 |
| useAnalytics async化で loading 中に空データが表示される | 中 | 各ページの loading 状態ハンドリングを確認。useMemo → useState+useEffect の移行で初回レンダーが変わる |
| SyncQueue の IndexedDB が Service Worker と競合する | 低 | idb-keyval はシンプルなkey-valueストア。SW の precache とは別DB名で競合しない |
| idb-keyval の新規依存追加 | 低 | ~600B gzip。Supabase JS Client（~50KB）に比べれば軽微 |
| Phase 1 で Sync 層が動作しない（認証未実装） | なし | ファクトリが常に Local を返すため、Sync 層のコードは呼ばれない。テストのみで品質担保 |
| bookmark の旧ID(on-NNN)マイグレーションがリポジトリ移行で壊れる | 低 | LocalBookmarkRepo にマイグレーションロジックを移植。テストで検証 |
