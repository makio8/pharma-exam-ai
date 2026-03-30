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
| `src/utils/__tests__/fusen-library-core.test.ts` | 変更 | makeNote ヘルパーに新フィールド追加 |
| `src/utils/__tests__/learning-link-service.test.ts` | 変更 | makeNote ヘルパーに新フィールド追加 |
| `src/utils/learning-link-service.ts` | 変更 | exemplarIds フォールバック対応 |
| `src/utils/data-validator/rules/note-validation.ts` | 変更 | primaryExemplarIds ベースに更新 |
| `scripts/generate-official-notes.ts` | 変更 | isPrimary情報を分けて出力 |
| `src/data/official-notes.json` | 再生成 | 上記スクリプトで上書き |
| `src/utils/official-note-scoring-core.ts` | 新規 | スコアリング純粋クラス |
| `src/utils/__tests__/official-note-scoring-core.test.ts` | 新規 | スコアリングテスト（12件） |
| `src/hooks/useScoredOfficialNotes.ts` | 新規 | スコアリングフック（ラップのみ） |
| `src/pages/QuestionPage.tsx` | 変更 | フック切り替え |
| `src/components/question/LinkedQuestionItem.tsx` | 変更 | フック切り替え |

---

## 事前確認: テスト基準件数を記録する

- [ ] **実装前に現在のテスト件数を確認する**

```bash
npx vitest run 2>&1 | tail -5
```

出力された `Tests X passed` の数値をメモしておく（この計画では525件を想定）。

---

## Task 1: OfficialNote 型に primary/secondary を追加 + 既存テスト修正

**Files:**
- Modify: `src/types/official-note.ts`
- Modify: `src/utils/__tests__/fusen-library-core.test.ts`
- Modify: `src/utils/__tests__/learning-link-service.test.ts`
- Modify: `src/utils/learning-link-service.ts`

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
  /** @deprecated primaryExemplarIds / secondaryExemplarIds を使用すること。新JSONには含まれない */
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

- [ ] **Step 2: fusen-library-core.test.ts の makeNote を修正する**

`src/utils/__tests__/fusen-library-core.test.ts` の `makeNote` 関数のデフォルトオブジェクトに追加：

```ts
// 変更前
function makeNote(overrides: Partial<OfficialNote>): OfficialNote {
  return {
    id: 'test-001',
    title: 'テスト付箋',
    imageUrl: '/images/fusens/test.png',
    textSummary: 'テスト要約',
    subject: '物理',
    topicId: 'physics-material-structure',
    tags: [],
    importance: 2,
    tier: 'free',
    ...overrides,
  }
}

// 変更後（primaryExemplarIds / secondaryExemplarIds を追加）
function makeNote(overrides: Partial<OfficialNote>): OfficialNote {
  return {
    id: 'test-001',
    title: 'テスト付箋',
    imageUrl: '/images/fusens/test.png',
    textSummary: 'テスト要約',
    subject: '物理',
    topicId: 'physics-material-structure',
    tags: [],
    primaryExemplarIds: [],
    secondaryExemplarIds: [],
    importance: 2,
    tier: 'free',
    ...overrides,
  }
}
```

- [ ] **Step 3: learning-link-service.test.ts の makeNote を修正する**

`src/utils/__tests__/learning-link-service.test.ts` の `makeNote` 関数にも同様に追加：

```ts
// 変更前のデフォルトオブジェクトに以下2行を追加
primaryExemplarIds: [],
secondaryExemplarIds: [],
```

- [ ] **Step 4: LearningLinkService の exemplarIds フォールバックを追加する**

`src/utils/learning-link-service.ts` の exemplarIds 参照箇所を確認し、`primaryExemplarIds ?? exemplarIds ?? []` にフォールバックする。該当箇所：

```ts
// 変更前（exemplarIdsのみ参照）
for (const exemplarId of note.exemplarIds ?? []) {

// 変更後（primaryExemplarIds優先、fallback）
const allExemplarIds = [
  ...(note.primaryExemplarIds ?? []),
  ...(note.secondaryExemplarIds ?? []),
  ...(note.exemplarIds ?? []),
].filter((id, i, arr) => arr.indexOf(id) === i) // 重複除去
for (const exemplarId of allExemplarIds) {
```

- [ ] **Step 5: 既存テストが通ることを確認する**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: 事前確認で記録した件数と同じ（型エラーによる件数減少がないこと）

- [ ] **Step 6: コミットする**

```bash
git add src/types/official-note.ts \
  src/utils/__tests__/fusen-library-core.test.ts \
  src/utils/__tests__/learning-link-service.test.ts \
  src/utils/learning-link-service.ts
git commit -m "feat: OfficialNote型にprimary/secondaryExemplarIds追加 + 既存テスト修正"
```

---

## Task 2: generate-official-notes.ts を修正して JSON を再生成

**Files:**
- Modify: `scripts/generate-official-notes.ts`
- Regenerate: `src/data/official-notes.json`

- [ ] **Step 1: スクリプトの notes 配列型定義を修正する**

`scripts/generate-official-notes.ts` の `notes` 配列の型定義（L204付近）の `exemplarIds: string[]` を削除し `primaryExemplarIds`/`secondaryExemplarIds` に置換：

```ts
// 変更前
const notes: Array<{
  id: string
  // ...
  exemplarIds: string[]
  // ...
}> = []

// 変更後
const notes: Array<{
  id: string
  title: string
  imageUrl: string
  textSummary: string
  subject: string
  topicId: string
  tags: string[]
  primaryExemplarIds: string[]
  secondaryExemplarIds: string[]
  noteType: string
  importance: number
  tier: string
}> = []
```

- [ ] **Step 2: notes.push() ブロックを修正する**

同ファイルの `notes.push(...)` ブロックを以下に変更：

```ts
    const primaryExemplarIds = mapping
      ? mapping.matches.filter((m) => m.isPrimary).map((m) => m.exemplarId)
      : []
    const secondaryExemplarIds = mapping
      ? mapping.matches.filter((m) => !m.isPrimary).map((m) => m.exemplarId)
      : []

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

- [ ] **Step 3: 統計出力コードを修正する**

同ファイルの統計出力部分（L294付近）の `exemplarIds` 参照を更新：

```ts
// 変更前
console.log(`  exemplarIds 付き: ${notes.filter((n) => n.exemplarIds.length > 0).length}`)
console.log(`  exemplarIds 合計: ${notes.reduce((s, n) => s + n.exemplarIds.length, 0)}`)

// 変更後
console.log(`  primaryExemplarIds 付き: ${notes.filter((n) => n.primaryExemplarIds.length > 0).length}`)
console.log(`  secondaryExemplarIds 付き: ${notes.filter((n) => n.secondaryExemplarIds.length > 0).length}`)
console.log(`  primary合計: ${notes.reduce((s, n) => s + n.primaryExemplarIds.length, 0)}`)
console.log(`  secondary合計: ${notes.reduce((s, n) => s + n.secondaryExemplarIds.length, 0)}`)
```

- [ ] **Step 4: JSON を再生成する**

```bash
npx tsx scripts/generate-official-notes.ts --stats
```

Expected:
```
📊 official-notes.ts 生成統計
  付箋数: 1642
  primaryExemplarIds 付き: 1642
  secondaryExemplarIds 付き: 819以上
```

- [ ] **Step 5: JSON に primaryExemplarIds フィールドが存在することを確認する**

```bash
node -e "const d=require('./src/data/official-notes.json'); const f=d[0]; console.log('primaryExemplarIds' in f, 'secondaryExemplarIds' in f, 'exemplarIds' in f)"
```

Expected: `true true false`（exemplarIds が含まれないこと）

- [ ] **Step 6: 型エラーがないか確認する**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: エラーなし

- [ ] **Step 7: note-validation.ts を primaryExemplarIds ベースに更新する**

`src/utils/data-validator/rules/note-validation.ts` で `exemplarIds` を参照している箇所を `primaryExemplarIds` に変更：

```bash
grep -n "exemplarIds" src/utils/data-validator/rules/note-validation.ts
```

該当行を `note.primaryExemplarIds` または `[...(note.primaryExemplarIds ?? []), ...(note.secondaryExemplarIds ?? [])]` に修正する。

- [ ] **Step 8: 全テストが通ることを確認する**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: 事前確認と同じ件数でパス

- [ ] **Step 9: コミットする**

```bash
git add scripts/generate-official-notes.ts src/data/official-notes.json \
  src/utils/data-validator/rules/note-validation.ts
git commit -m "feat: generate-official-notes primary/secondary分離 + JSON再生成"
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

// mockQEM: ex-hygiene-001=primary, ex-hygiene-002=secondary
const mockQEM = [
  { questionId: 'r100-001', exemplarId: 'ex-hygiene-001', isPrimary: true },
  { questionId: 'r100-001', exemplarId: 'ex-hygiene-002', isPrimary: false },
]

describe('OfficialNoteScoringCore', () => {
  // T1: primary exemplar一致で+2
  it('T1: note.primaryExemplarIdsがquestionのprimary exemplarと一致すると+2点', () => {
    const note = makeNote({ primaryExemplarIds: ['ex-hygiene-001'] })
    const question = makeQuestion()
    const core = new OfficialNoteScoringCore(mockQEM)
    const score = core.score(note, question)
    expect(score).toBeCloseTo(
      SCORING_WEIGHTS.primaryExemplar + 2 * SCORING_WEIGHTS.importance
    )
  })

  // T2: secondary < primary（ex-hygiene-002はsecondary）
  it('T2: secondary一致(+1)はprimary一致(+2)より低スコア', () => {
    const notePrimary = makeNote({ primaryExemplarIds: ['ex-hygiene-001'] })
    // ex-hygiene-002 は mockQEM で isPrimary: false → +1 が実際に加算される
    const noteSecondary = makeNote({ secondaryExemplarIds: ['ex-hygiene-002'] })
    const question = makeQuestion()
    const core = new OfficialNoteScoringCore(mockQEM)
    const scorePrimary = core.score(notePrimary, question)
    const scoreSecondary = core.score(noteSecondary, question)
    expect(scorePrimary).toBeGreaterThan(scoreSecondary)
    // secondary は +1 が実際に加算されていることを確認
    expect(scoreSecondary).toBeCloseTo(
      SCORING_WEIGHTS.secondaryExemplar + 2 * SCORING_WEIGHTS.importance
    )
  })

  // T3: textMatchスコア加算
  it('T3: note.tagsの語がquestion_textに含まれると+0.5/件', () => {
    const note = makeNote({ tags: ['コバラミン', 'ビタミンB12'] })
    const question = makeQuestion({ question_text: 'コバラミンとビタミンB12について' })
    const core = new OfficialNoteScoringCore([])
    const score = core.score(note, question)
    expect(score).toBeCloseTo(
      2 * SCORING_WEIGHTS.textMatch + 2 * SCORING_WEIGHTS.importance
    )
  })

  // T4: question.tagsが空でもクラッシュしない
  it('T4: question.tagsが空配列でもクラッシュしない', () => {
    const note = makeNote()
    const question = makeQuestion({ tags: [] })
    const core = new OfficialNoteScoringCore(mockQEM)
    expect(() => core.score(note, question)).not.toThrow()
  })

  // T5: primaryExemplarIds空の付箋はexemplarスコア0（importanceスコアのみ）
  it('T5: primaryExemplarIdsが空の付箋はexemplarスコア0でimportanceスコアのみ', () => {
    const note = makeNote({ primaryExemplarIds: [], secondaryExemplarIds: [] })
    const question = makeQuestion()
    const core = new OfficialNoteScoringCore(mockQEM)
    const score = core.score(note, question)
    expect(score).toBeCloseTo(2 * SCORING_WEIGHTS.importance)
  })

  // T6: importance降順ソート確認（exemplarなし環境）
  it('T6: exemplarマッチなしのとき importance降順で返る', () => {
    const notes = [
      makeNote({ id: 'n1', importance: 2 }),
      makeNote({ id: 'n2', importance: 4 }),
      makeNote({ id: 'n3', importance: 3 }),
    ]
    const question = makeQuestion({ id: 'no-exemplar-question' })
    const core = new OfficialNoteScoringCore([]) // exemplarなし
    const result = core.topNotes(notes, question, 5)
    expect(result[0].id).toBe('n2') // importance=4が1位
    expect(result[1].id).toBe('n3') // importance=3が2位
  })

  // T6b: フォールバック実際の発動確認（importance=1でfilterを抜けない）
  it('T6b: 全件importance=1のときフォールバックが発動しimportance降順を返す', () => {
    const notes = [
      makeNote({ id: 'n1', importance: 1 }),
      makeNote({ id: 'n2', importance: 1 }),
    ]
    // importance=1 → score=0.01, threshold=0.01 → 0.01>0.01=false → フォールバック発動
    const question = makeQuestion({ id: 'no-match-question' })
    const core = new OfficialNoteScoringCore([])
    const result = core.topNotes(notes, question, 5)
    expect(result).toHaveLength(2) // フォールバックは全件返す
  })

  // T7: note.tagsが空のときtextMatch=0
  it('T7: note.tagsが空のときtextMatchスコアは0', () => {
    const note = makeNote({ tags: [] })
    const question = makeQuestion({ question_text: 'コバラミン' })
    const core = new OfficialNoteScoringCore([])
    const score = core.score(note, question)
    expect(score).toBeCloseTo(2 * SCORING_WEIGHTS.importance)
  })

  // T8: importanceタイブレークがexemplar不一致を逆転しない
  it('T8: importance=4でもexemplar不一致はexemplar一致(importance=2)に勝てない', () => {
    const noteWithExemplar = makeNote({ primaryExemplarIds: ['ex-hygiene-001'], importance: 2 })
    const noteHighImportance = makeNote({ primaryExemplarIds: [], importance: 4 })
    const question = makeQuestion()
    const core = new OfficialNoteScoringCore(mockQEM)
    expect(core.score(noteWithExemplar, question)).toBeGreaterThan(
      core.score(noteHighImportance, question)
    )
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
      { questionId: 'r100-001', exemplarId: 'ex-hygiene-001', isPrimary: false },
    ]
    const note = makeNote({ primaryExemplarIds: ['ex-hygiene-001'] })
    const question = makeQuestion()
    const core = new OfficialNoteScoringCore(dupQEM)
    const score = core.score(note, question)
    // primary一致の+2のみ（二重加算されると+3になる）
    expect(score).toBeCloseTo(
      SCORING_WEIGHTS.primaryExemplar + 2 * SCORING_WEIGHTS.importance
    )
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

Expected: `FAIL`（`official-note-scoring-core` が存在しないため Cannot find module エラー）

- [ ] **Step 3: OfficialNoteScoringCore クラスを実装する**

`src/utils/official-note-scoring-core.ts` を作成：

```ts
// 公式付箋スコアリングコア
// FusenLibraryCore / SM2Scheduler と同じ純粋クラスパターン
import type { OfficialNote } from '../types/official-note'
import type { Question } from '../types/question'
import type { QuestionExemplarMapping } from '../types/blueprint'

export const SCORING_WEIGHTS = {
  primaryExemplar: 2,    // questionのprimary exemplarとnoteのprimaryExemplarIdsが一致
  secondaryExemplar: 1,  // それ以外のexemplar一致（note/questionいずれかがsecondary）
  textMatch: 0.5,        // note.tagsの語がquestion_textに含まれる（1件あたり）
  importance: 0.01,      // タイブレーク（importance最大4 × 0.01 = 0.04）
} as const

type ExemplarEntry = {
  primary: Set<string>  // isPrimary=true のexemplarId群
  all: Set<string>      // isPrimary問わず全exemplarId群
}

export class OfficialNoteScoringCore {
  private readonly qExemplarIndex: Map<string, ExemplarEntry>

  constructor(questionExemplarMap: QuestionExemplarMapping[]) {
    // questionId → { primary: Set, all: Set } のMapを構築（O(1)参照用）
    // Setを使うため重複登録があっても二重加算しない
    this.qExemplarIndex = new Map()
    for (const { questionId, exemplarId, isPrimary } of questionExemplarMap) {
      let entry = this.qExemplarIndex.get(questionId)
      if (!entry) {
        entry = { primary: new Set(), all: new Set() }
        this.qExemplarIndex.set(questionId, entry)
      }
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

      // note.primaryExemplarIds が question の primary exemplar と一致: +2
      for (const id of primaryIds) {
        if (entry.primary.has(id)) {
          s += SCORING_WEIGHTS.primaryExemplar
          break // 1回のみ加算
        }
      }

      // note の全exemplarId（primary/secondary両方）が question の secondary exemplar と一致: +1
      // ただし上記で既にprimary加算済みの場合はスキップされる（breakで抜けているため）
      const allNoteExemplars = [...primaryIds, ...secondaryIds]
      for (const id of allNoteExemplars) {
        // questionのall（primary+secondary）にある && questionのprimaryではない → secondary一致
        if (entry.all.has(id) && !entry.primary.has(id)) {
          s += SCORING_WEIGHTS.secondaryExemplar
          break // 1回のみ加算
        }
      }
    }

    // textMatch: note.tagsの語がquestion_textに含まれる（大文字小文字区別あり）
    const text = question.question_text
    for (const tag of note.tags) {
      if (text.includes(tag)) s += SCORING_WEIGHTS.textMatch
    }

    // タイブレーク（importance最大4 × 0.01 = 0.04、exemplarスコアを逆転しない）
    s += Math.min(note.importance, 10) * SCORING_WEIGHTS.importance

    return s
  }

  /**
   * 付箋リストをスコアリングして上位limit件を返す
   * score > SCORING_WEIGHTS.importance（= importanceのみの場合は除外）
   * 全件除外（全てimportance=1）の場合は importance 降順フォールバック
   */
  topNotes(notes: OfficialNote[], question: Question, limit: number): OfficialNote[] {
    if (limit <= 0) return []

    const scored = notes
      .map((note) => ({ note, score: this.score(note, question) }))
      .filter(({ score }) => score > SCORING_WEIGHTS.importance) // importance=1のみはフォールバック候補
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
     Tests  12 passed (12)
```

- [ ] **Step 5: 全テストが通ることを確認する**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: 事前確認件数 + 12件

- [ ] **Step 6: コミットする**

```bash
git add src/utils/official-note-scoring-core.ts \
  src/utils/__tests__/official-note-scoring-core.test.ts
git commit -m "feat: OfficialNoteScoringCore 純粋クラス + テスト12件"
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
// TODO: 将来的に useOfficialNotes.ts の topicToNotes と統合して重複を排除する
const scoringCore = new OfficialNoteScoringCore(QUESTION_EXEMPLAR_MAP)

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

- [ ] **Step 3: コミットする**

```bash
git add src/hooks/useScoredOfficialNotes.ts
git commit -m "feat: useScoredOfficialNotes フック追加"
```

---

## Task 5: QuestionPage.tsx・LinkedQuestionItem.tsx のフック切り替え

**Files:**
- Modify: `src/pages/QuestionPage.tsx`
- Modify: `src/components/question/LinkedQuestionItem.tsx`

- [ ] **Step 1: useOfficialNotes の呼び出し元を全件確認する**

```bash
grep -rn "useOfficialNotes" src/
```

Expected: `QuestionPage.tsx` と `LinkedQuestionItem.tsx` の2箇所のみ。他にあれば同様に切り替えること。

- [ ] **Step 2: QuestionPage.tsx を切り替える**

`src/pages/QuestionPage.tsx` を変更：

```ts
// 削除
import { useOfficialNotes } from '../hooks/useOfficialNotes'

// 追加
import { useScoredOfficialNotes } from '../hooks/useScoredOfficialNotes'
```

```ts
// 変更前（L68付近）
const { notes } = useOfficialNotes(questionId ?? '')

// 変更後
const { notes } = useScoredOfficialNotes(question)
```

- [ ] **Step 3: LinkedQuestionItem.tsx を切り替える**

`src/components/question/LinkedQuestionItem.tsx` を変更：

```ts
// 削除
import { useOfficialNotes } from '../../hooks/useOfficialNotes'

// 追加
import { useScoredOfficialNotes } from '../../hooks/useScoredOfficialNotes'
```

```ts
// 変更前（L47付近）
const { notes } = useOfficialNotes(question.id)

// 変更後
const { notes } = useScoredOfficialNotes(question)
```

- [ ] **Step 4: 型エラーと全テストを確認する**

```bash
npx tsc --noEmit 2>&1 | head -20 && npx vitest run 2>&1 | tail -5
```

Expected:
```
(型エラーなし)
Test Files  32 passed (32)
     Tests  537 passed (537)
```

- [ ] **Step 5: ビルドが通ることを確認する**

```bash
npm run build 2>&1 | tail -10
```

Expected: `built in X.Xs`（エラーなし）

- [ ] **Step 6: 最終コミットする**

```bash
git add src/pages/QuestionPage.tsx \
  src/components/question/LinkedQuestionItem.tsx
git commit -m "feat: QuestionPage・LinkedQuestionItem を useScoredOfficialNotes に切り替え"
```

---

## 完了確認

```bash
npx vitest run 2>&1 | tail -5
npx tsc --noEmit
npm run build 2>&1 | tail -5
```

Expected:
- テスト: 32ファイル、537件パス（既存525 + 新規12）
- 型エラー: 0件
- ビルド: エラーなし
