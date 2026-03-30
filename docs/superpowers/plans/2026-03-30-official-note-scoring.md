# 公式付箋レコメンドロジック改善 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 問題に最も関連性の高い公式付箋を上位5件に絞り込んで表示する。

**Architecture:** `OfficialNote` 型に primary/secondary exemplarId を分離して追加 → `generate-official-notes.ts` でJSON再生成 → `OfficialNoteScoringCore` 純粋クラスでスコアリング → `useScoredOfficialNotes` フックで QuestionPage / LinkedQuestionItem に差し込む。

**Tech Stack:** TypeScript 5.9 / React 19 / Vite / Vitest（テスト）/ tsx（スクリプト実行）

---

## ファイル構成

| ファイル | 変更種別 | 役割 |
|---------|---------|------|
| `src/types/official-note.ts` | 変更 | primaryExemplarIds/secondaryExemplarIds 追加 |
| `scripts/generate-official-notes.ts` | 変更 | isPrimary情報を分けて出力 |
| `src/data/official-notes.json` | 再生成 | 上記スクリプトで上書き |
| `src/utils/official-note-scoring-core.ts` | 新規 | スコアリング純粋クラス |
| `src/utils/__tests__/official-note-scoring-core.test.ts` | 新規 | スコアリングテスト（11件） |
| `src/hooks/useScoredOfficialNotes.ts` | 新規 | スコアリングフック（ラップのみ） |
| `src/pages/QuestionPage.tsx` | 変更 | フック切り替え |
| `src/components/question/LinkedQuestionItem.tsx` | 変更 | フック切り替え |

---

## Task 1: OfficialNote 型に primary/secondary を追加

**Files:**
- Modify: `src/types/official-note.ts`

- [ ] **Step 1: 型定義を更新する**

`src/types/official-note.ts` を以下に変更：

```ts
// 薬剤師国試：公式付箋の型定義

import type { QuestionSubject } from './question'

/** 公式付箋の種別 */
export type NoteType = 'mnemonic' | 'knowledge' | 'related' | 'caution' | 'solution'

/** 公式付箋（運営提供コンテンツ） */
export interface OfficialNote {
  id: string
  title: string
  imageUrl: string
  textSummary: string
  subject: QuestionSubject
  topicId: string
  tags: string[]
  primaryExemplarIds: string[]    // 主要な紐づき（isPrimary=true）
  secondaryExemplarIds: string[]  // 補助的な紐づき（isPrimary=false）
  /** @deprecated primaryExemplarIds / secondaryExemplarIds を使用すること */
  exemplarIds?: string[]
  noteType?: NoteType
  importance: number
  tier: 'free' | 'premium'
}

/** ユーザーのブックマーク（snake_case規約に統一） */
export interface BookmarkedNote {
  id: string
  user_id: string
  note_id: string
  bookmarked_at: string
  review_count: number
  last_reviewed_at?: string
}
```

- [ ] **Step 2: 型エラーがないか確認する**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: エラーが出る（`official-notes.json` がまだ旧形式のため）。Task 2・3 で解消する。

---

## Task 2: generate-official-notes.ts を修正して JSON を再生成

**Files:**
- Modify: `scripts/generate-official-notes.ts`
- Regenerate: `src/data/official-notes.json`

- [ ] **Step 1: スクリプトの出力部分を修正する**

`scripts/generate-official-notes.ts` の `notes.push(...)` ブロック（現在 `exemplarIds` を出力している部分）を以下に変更：

```ts
    // exemplarIds を primary / secondary に分けて出力
    const primaryExemplarIds = mapping
      ? mapping.matches.filter((m) => m.isPrimary).map((m) => m.exemplarId)
      : []
    const secondaryExemplarIds = mapping
      ? mapping.matches.filter((m) => !m.isPrimary).map((m) => m.exemplarId)
      : []

    // importance: primary + secondary の合計件数ベース
    const importance = computeImportance(primaryExemplarIds.length + secondaryExemplarIds.length)

    notes.push({
      id: entry.id,
      title: entry.title,
      imageUrl: `/images/fusens/${entry.imageFile}`,
      textSummary: generateTextSummary(entry),
      subject,
      topicId: entry.topicId,
      tags: entry.tags,
      primaryExemplarIds,
      secondaryExemplarIds,
      noteType,
      importance,
      tier,
    })
```

> 注: 旧 `exemplarIds` フィールドは出力しない（`@deprecated` なので新JSONには含めない）。

- [ ] **Step 2: JSON を再生成する**

```bash
npx tsx scripts/generate-official-notes.ts --stats
```

Expected:
```
📊 official-notes.ts 生成統計
  付箋数: 1642
  primaryExemplarIds 付き: 1642
  ...
```

- [ ] **Step 3: 再生成後に型エラーがないか確認する**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: エラーなし（0件）

- [ ] **Step 4: コミットする**

```bash
git add src/types/official-note.ts scripts/generate-official-notes.ts src/data/official-notes.json
git commit -m "feat: OfficialNote型にprimary/secondaryExemplarIds追加 + JSON再生成"
```

---

## Task 3: OfficialNoteScoringCore 純粋クラスをTDDで実装

**Files:**
- Create: `src/utils/official-note-scoring-core.ts`
- Create: `src/utils/__tests__/official-note-scoring-core.test.ts`

- [ ] **Step 1: テストファイルを作成する（まず失敗させる）**

`src/utils/__tests__/official-note-scoring-core.test.ts` を作成：

```ts
import { describe, it, expect } from 'vitest'
import { OfficialNoteScoringCore, SCORING_WEIGHTS } from '../official-note-scoring-core'
import type { OfficialNote } from '../../types/official-note'
import type { Question } from '../../types/question'

// --- テスト用ヘルパー ---

function makeNote(overrides: Partial<OfficialNote> = {}): OfficialNote {
  return {
    id: 'fusen-0001',
    title: 'テスト付箋',
    imageUrl: '/images/test.png',
    textSummary: 'テスト要約',
    subject: '衛生',
    topicId: 'hygiene-nutrition',
    tags: [],
    primaryExemplarIds: [],
    secondaryExemplarIds: [],
    importance: 2,
    tier: 'free',
    ...overrides,
  }
}

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'r100-001',
    year: 100,
    question_number: 1,
    section: '必須',
    subject: '衛生',
    category: 'テスト',
    question_text: 'テスト問題文',
    choices: [
      { key: 1, text: '選択肢1' },
      { key: 2, text: '選択肢2' },
    ],
    correct_answer: 1,
    explanation: 'テスト解説',
    tags: [],
    ...overrides,
  }
}

// QUESTION_EXEMPLAR_MAP をモックとして渡す
const mockQEM = [
  { questionId: 'r100-001', exemplarId: 'ex-hygiene-001', isPrimary: true },
  { questionId: 'r100-001', exemplarId: 'ex-hygiene-002', isPrimary: false },
]

describe('OfficialNoteScoringCore', () => {
  // T1: primary exemplar一致で+2
  it('T1: note.primaryExemplarIdsがquestionのprimary exemplarと一致すると+2点', () => {
    const note = makeNote({ primaryExemplarIds: ['ex-hygiene-001'], secondaryExemplarIds: [] })
    const question = makeQuestion()
    const core = new OfficialNoteScoringCore(mockQEM)
    const score = core.score(note, question)
    expect(score).toBeCloseTo(SCORING_WEIGHTS.primaryExemplar + 2 * 0.01)
  })

  // T2: secondary < primary
  it('T2: secondary一致(+1)はprimary一致(+2)より低スコア', () => {
    const notePrimary = makeNote({ primaryExemplarIds: ['ex-hygiene-001'] })
    const noteSecondary = makeNote({ primaryExemplarIds: [], secondaryExemplarIds: ['ex-hygiene-001'] })
    const question = makeQuestion()
    const core = new OfficialNoteScoringCore(mockQEM)
    expect(core.score(notePrimary, question)).toBeGreaterThan(core.score(noteSecondary, question))
  })

  // T3: textMatchスコア加算
  it('T3: note.tagsの語がquestion_textに含まれると+0.5/件', () => {
    const note = makeNote({ tags: ['コバラミン', 'ビタミンB12'] })
    const question = makeQuestion({ question_text: 'コバラミンとビタミンB12について' })
    const core = new OfficialNoteScoringCore([])
    const score = core.score(note, question)
    expect(score).toBeCloseTo(2 * SCORING_WEIGHTS.textMatch + 2 * 0.01)
  })

  // T4: question.tagsが空でもクラッシュしない
  it('T4: question.tagsが空配列でもクラッシュしない', () => {
    const note = makeNote()
    const question = makeQuestion({ tags: [] })
    const core = new OfficialNoteScoringCore(mockQEM)
    expect(() => core.score(note, question)).not.toThrow()
  })

  // T5: exemplarIds未定義はスコア0
  it('T5: primaryExemplarIdsが空の付箋はexemplarスコア0', () => {
    const note = makeNote({ primaryExemplarIds: [], secondaryExemplarIds: [] })
    const question = makeQuestion()
    const core = new OfficialNoteScoringCore(mockQEM)
    const score = core.score(note, question)
    // importanceスコアのみ
    expect(score).toBeCloseTo(2 * 0.01)
  })

  // T6: スコア全0のフォールバック
  it('T6: スコア全0のとき importance降順フォールバックを返す', () => {
    const notes = [
      makeNote({ id: 'n1', importance: 2 }),
      makeNote({ id: 'n2', importance: 4 }),
      makeNote({ id: 'n3', importance: 3 }),
    ]
    const question = makeQuestion({ id: 'no-exemplar-question' })
    const core = new OfficialNoteScoringCore([]) // exemplarなし
    const result = core.topNotes(notes, question, 5)
    // importanceスコアが全件 > 0 なのでフォールバックにはならないが
    // importance降順で並ぶことを確認
    expect(result[0].id).toBe('n2')
    expect(result[1].id).toBe('n3')
  })

  // T7: note.tagsが空のときtextMatch=0
  it('T7: note.tagsが空のときtextMatchスコアは0', () => {
    const note = makeNote({ tags: [] })
    const question = makeQuestion({ question_text: 'コバラミン' })
    const core = new OfficialNoteScoringCore([])
    const score = core.score(note, question)
    expect(score).toBeCloseTo(2 * 0.01) // importanceのみ
  })

  // T8: importanceタイブレークがexemplar不一致を逆転しない
  it('T8: importance=4でもexemplar不一致はexemplar一致(importance=2)に勝てない', () => {
    const noteWithExemplar = makeNote({ primaryExemplarIds: ['ex-hygiene-001'], importance: 2 })
    const noteHighImportance = makeNote({ primaryExemplarIds: [], importance: 4 })
    const question = makeQuestion()
    const core = new OfficialNoteScoringCore(mockQEM)
    expect(core.score(noteWithExemplar, question)).toBeGreaterThan(core.score(noteHighImportance, question))
  })

  // T9: limit引数で返却件数を変更できる
  it('T9: limit=3のとき3件だけ返る', () => {
    const notes = Array.from({ length: 10 }, (_, i) =>
      makeNote({ id: `n${i}`, primaryExemplarIds: ['ex-hygiene-001'] })
    )
    const question = makeQuestion()
    const core = new OfficialNoteScoringCore(mockQEM)
    expect(core.topNotes(notes, question, 3)).toHaveLength(3)
  })

  // T10: 同一exemplarIdの二重加算防止
  it('T10: questionの同一exemplarIdがprimary/secondary両方にあっても二重加算しない', () => {
    const dupQEM = [
      { questionId: 'r100-001', exemplarId: 'ex-hygiene-001', isPrimary: true },
      { questionId: 'r100-001', exemplarId: 'ex-hygiene-001', isPrimary: false }, // 重複
    ]
    const note = makeNote({ primaryExemplarIds: ['ex-hygiene-001'] })
    const question = makeQuestion()
    const core = new OfficialNoteScoringCore(dupQEM)
    const score = core.score(note, question)
    // primary一致の+2のみ（二重加算されると+3になる）
    expect(score).toBeCloseTo(SCORING_WEIGHTS.primaryExemplar + 2 * 0.01)
  })

  // T11: limit境界値
  it('T11: limit=0のとき空配列を返す', () => {
    const notes = [makeNote()]
    const question = makeQuestion()
    const core = new OfficialNoteScoringCore(mockQEM)
    expect(core.topNotes(notes, question, 0)).toHaveLength(0)
  })
})
```

- [ ] **Step 2: テストが失敗することを確認する**

```bash
npx vitest run src/utils/__tests__/official-note-scoring-core.test.ts 2>&1 | tail -10
```

Expected: `FAIL` （`official-note-scoring-core` が存在しないため）

- [ ] **Step 3: OfficialNoteScoringCore クラスを実装する**

`src/utils/official-note-scoring-core.ts` を作成：

```ts
// 公式付箋スコアリングコア
// FusenLibraryCore / SM2Scheduler と同じ純粋クラスパターン
// フックからのみ使用（useScoredOfficialNotes）

import type { OfficialNote } from '../types/official-note'
import type { Question } from '../types/question'
import type { QuestionExemplarMapping } from '../types/blueprint'

export const SCORING_WEIGHTS = {
  primaryExemplar: 2,    // questionのprimary exemplarとnoteのprimaryが一致
  secondaryExemplar: 1,  // それ以外のexemplar一致
  textMatch: 0.5,        // note.tagsの語がquestion_textに含まれる（1件あたり）
  importance: 0.01,      // タイブレーク（importance最大4 × 0.01 = 0.04）
} as const

type ExemplarEntry = { primary: Set<string>; all: Set<string> }

export class OfficialNoteScoringCore {
  private readonly qExemplarIndex: Map<string, ExemplarEntry>

  constructor(questionExemplarMap: QuestionExemplarMapping[]) {
    // questionId → { primary: Set, all: Set } のMapを構築（O(1)参照用）
    this.qExemplarIndex = new Map()
    for (const { questionId, exemplarId, isPrimary } of questionExemplarMap) {
      let entry = this.qExemplarIndex.get(questionId)
      if (!entry) {
        entry = { primary: new Set(), all: new Set() }
        this.qExemplarIndex.set(questionId, entry)
      }
      // 重複登録されても Set なので二重加算しない
      entry.all.add(exemplarId)
      if (isPrimary) entry.primary.add(exemplarId)
    }
  }

  /** 1枚の付箋のスコアを計算する */
  score(note: OfficialNote, question: Question): number {
    const entry = this.qExemplarIndex.get(question.id)
    let s = 0

    if (entry) {
      const primaryIds = note.primaryExemplarIds ?? []
      const secondaryIds = note.secondaryExemplarIds ?? []

      // primary exemplar一致: +2
      for (const id of primaryIds) {
        if (entry.primary.has(id)) {
          s += SCORING_WEIGHTS.primaryExemplar
          break // 1回のみ加算
        }
      }

      // secondary exemplar一致（primary未加算のもの）: +1
      const allNoteExemplars = [...primaryIds, ...secondaryIds]
      for (const id of allNoteExemplars) {
        if (entry.all.has(id) && !entry.primary.has(id)) {
          s += SCORING_WEIGHTS.secondaryExemplar
          break // 1回のみ加算
        }
      }
    }

    // textMatch: note.tagsの語がquestion_textに含まれる
    const text = question.question_text
    for (const tag of note.tags) {
      if (text.includes(tag)) s += SCORING_WEIGHTS.textMatch
    }

    // タイブレーク: importance（最大4 × 0.01 = 0.04）
    s += Math.min(note.importance, 10) * SCORING_WEIGHTS.importance

    return s
  }

  /**
   * 付箋リストをスコアリングして上位limit件を返す
   * スコア > 0 の付箋を優先。全件スコア = 0 なら importance 降順フォールバック。
   */
  topNotes(notes: OfficialNote[], question: Question, limit: number): OfficialNote[] {
    if (limit <= 0) return []

    const scored = notes
      .map((note) => ({ note, score: this.score(note, question) }))
      .filter(({ score }) => score > SCORING_WEIGHTS.importance) // importanceのみ(タイブレーク)は除外
      .sort((a, b) => b.score - a.score)
      .map(({ note }) => note)

    if (scored.length > 0) return scored.slice(0, limit)

    // フォールバック: importance降順
    return [...notes]
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit)
  }
}
```

- [ ] **Step 4: テストを実行して全件パスを確認する**

```bash
npx vitest run src/utils/__tests__/official-note-scoring-core.test.ts 2>&1 | tail -10
```

Expected:
```
Test Files  1 passed (1)
     Tests  11 passed (11)
```

- [ ] **Step 5: コミットする**

```bash
git add src/utils/official-note-scoring-core.ts src/utils/__tests__/official-note-scoring-core.test.ts
git commit -m "feat: OfficialNoteScoringCore 純粋クラス + テスト11件"
```

---

## Task 4: useScoredOfficialNotes フックを作成

**Files:**
- Create: `src/hooks/useScoredOfficialNotes.ts`

- [ ] **Step 1: フックを作成する**

`src/hooks/useScoredOfficialNotes.ts` を作成：

```ts
// 公式付箋スコアリングフック
// OfficialNoteScoringCore をラップするだけ（ロジックなし）
import { useMemo } from 'react'
import type { OfficialNote } from '../types/official-note'
import type { Question } from '../types/question'
import { OFFICIAL_NOTES } from '../data/official-notes'
import { QUESTION_TOPIC_MAP } from '../data/question-topic-map'
import { QUESTION_EXEMPLAR_MAP } from '../data/question-exemplar-map'
import { OfficialNoteScoringCore } from '../utils/official-note-scoring-core'

// モジュールスコープで事前構築（再マウントでも再計算しない）
const scoringCore = new OfficialNoteScoringCore(QUESTION_EXEMPLAR_MAP)

// topicId → OfficialNote[] のマップ（同じく事前構築）
const topicToNotes = new Map<string, OfficialNote[]>()
for (const note of OFFICIAL_NOTES) {
  const list = topicToNotes.get(note.topicId)
  if (list) list.push(note)
  else topicToNotes.set(note.topicId, [note])
}

/** questionに関連する公式付箋を上位limit件返す */
export function useScoredOfficialNotes(
  question: Question | undefined,
  limit = 5,
): { notes: OfficialNote[]; isLoading: boolean } {
  const notes = useMemo(() => {
    if (!question) return []

    const topicId = QUESTION_TOPIC_MAP[question.id]
    if (!topicId) return []

    const topicNotes = topicToNotes.get(topicId) ?? []
    return scoringCore.topNotes(topicNotes, question, limit)
  }, [question, limit])

  return { notes, isLoading: false }
}
```

- [ ] **Step 2: 型エラーがないか確認する**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: エラーなし

- [ ] **Step 3: 全テストが通ることを確認する**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: `32 passed` （既存31 + 新規1）

- [ ] **Step 4: コミットする**

```bash
git add src/hooks/useScoredOfficialNotes.ts
git commit -m "feat: useScoredOfficialNotes フック追加"
```

---

## Task 5: QuestionPage.tsx のフック切り替え

**Files:**
- Modify: `src/pages/QuestionPage.tsx`

- [ ] **Step 1: フックを切り替える**

`src/pages/QuestionPage.tsx` の以下を変更：

```ts
// 変更前（削除）
import { useOfficialNotes } from '../hooks/useOfficialNotes'

// 変更後（追加）
import { useScoredOfficialNotes } from '../hooks/useScoredOfficialNotes'
```

```ts
// 変更前（L68付近）
const { notes } = useOfficialNotes(questionId ?? '')

// 変更後
const { notes } = useScoredOfficialNotes(question)
```

> `question` は同ファイル L39〜42 で定義済み（`ALL_QUESTIONS.find(q => q.id === questionId)`）。`undefined` の場合はフック内で空配列を返す。

- [ ] **Step 2: 型エラーがないか確認する**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: エラーなし

- [ ] **Step 3: コミットする**

```bash
git add src/pages/QuestionPage.tsx
git commit -m "feat: QuestionPage を useScoredOfficialNotes に切り替え"
```

---

## Task 6: LinkedQuestionItem.tsx のフック切り替え

**Files:**
- Modify: `src/components/question/LinkedQuestionItem.tsx`

- [ ] **Step 1: フックを切り替える**

`src/components/question/LinkedQuestionItem.tsx` の以下を変更：

```ts
// 変更前（削除）
import { useOfficialNotes } from '../../hooks/useOfficialNotes'

// 変更後（追加）
import { useScoredOfficialNotes } from '../../hooks/useScoredOfficialNotes'
```

```ts
// 変更前（L47付近）
const { notes } = useOfficialNotes(question.id)

// 変更後
const { notes } = useScoredOfficialNotes(question)
```

- [ ] **Step 2: 型エラーと全テストを確認する**

```bash
npx tsc --noEmit 2>&1 | head -20 && npx vitest run 2>&1 | tail -5
```

Expected:
```
(型エラーなし)
Test Files  32 passed (32)
     Tests  536 passed (536)
```

- [ ] **Step 3: 最終コミットする**

```bash
git add src/components/question/LinkedQuestionItem.tsx
git commit -m "feat: LinkedQuestionItem を useScoredOfficialNotes に切り替え"
```

---

## 完了確認

全タスク完了後に以下を確認：

```bash
npx vitest run 2>&1 | tail -5
npx tsc --noEmit
npm run build 2>&1 | tail -10
```

Expected:
- テスト: 32ファイル、536件パス（既存525 + 新規11）
- 型エラー: 0件
- ビルド: エラーなし
