# 連問データ修復 + UI改善 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全11年度の連問データ(linked_group/linked_scenario)を修復し、演習UIをセット単位表示+ナビゲーションに改善する

**Architecture:** 修復スクリプトで category→linked_group 一括設定 + シナリオ抽出 + 選択肢分離 → UIは既存LinkedQuestionViewerをベースにナビゲーションとPracticePage表示を改善

**Tech Stack:** TypeScript (Node.js scripts) + React 19 + Ant Design 5

**Spec:** `docs/superpowers/specs/2026-03-21-linked-questions-repair-design.md`

---

## ファイル構成

| ファイル | 役割 |
|----------|------|
| `scripts/repair-linked-groups.ts` | 新規: linked_group + linked_scenario + choices修復の一括スクリプト |
| `src/data/real-questions/exam-{100..110}.ts` | 修復スクリプトで更新される対象 |
| `src/hooks/useLinkedQuestions.ts` | 既存: 推定ロジック削除→シンプル化 |
| `src/components/LinkedQuestionViewer.tsx` | 既存: 変更不要（既にシナリオ全文表示+問題直後に選択肢配置のレイアウト実装済み。key によるstateリセットはQuestionPage側で対応） |
| `src/pages/QuestionPage.tsx` | 既存: ナビゲーションをセット単位に変更 |
| `src/pages/PracticePage.tsx` | 既存: 連問セット単位表示に変更 |

---

## Task 1: 修復スクリプト作成（repair-linked-groups.ts）

**Files:**
- Create: `scripts/repair-linked-groups.ts`

- [ ] **Step 1: スクリプトの骨格を作成**

```typescript
// scripts/repair-linked-groups.ts
// Usage: npx tsx scripts/repair-linked-groups.ts [--dry-run]
//
// 処理内容:
// 1. category フィールドから連問グループを検出
// 2. linked_group を全問に設定（既存も新形式に書き換え）
// 3. linked_scenario にシナリオ全文を設定
// 4. 先頭問題の結合選択肢を修復（15個→5個等）
// 5. question_text から共通シナリオ部分を除去

import { readFileSync, writeFileSync, readdirSync } from 'fs'

const DRY_RUN = process.argv.includes('--dry-run')
const dir = 'src/data/real-questions'

interface ParsedQuestion {
  id: string
  year: number
  questionNumber: number
  category: string
  questionText: string
  questionTextOriginal: string | null
  linkedGroup: string | null
  linkedScenario: string | null
  choicesCount: number
  // ファイル内での位置情報（文字列置換用）
}

interface LinkedGroupInfo {
  year: number
  numbers: number[]  // [196, 197, 198, 199]
  groupId: string    // "r100-196-199"
}

// Phase 1: category からグループを検出
function detectGroups(questions: ParsedQuestion[]): LinkedGroupInfo[] {
  const groups: LinkedGroupInfo[] = []
  for (const q of questions) {
    // "一般 実践問題 - 問 196,197,198,199" or "一般 理論問題 - 問 119,120"
    const match = q.category.match(/問\s+([\d,]+)/)
    if (!match) continue
    const numbers = match[1].split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n))
    if (numbers.length < 2) continue
    const first = Math.min(...numbers)
    const last = Math.max(...numbers)
    groups.push({
      year: q.year,
      numbers,
      groupId: `r${q.year}-${first}-${last}`,
    })
  }
  return groups
}

// Phase 2: 既存 linked_group から未カバーグループを補完
function supplementFromExisting(questions: ParsedQuestion[], groups: LinkedGroupInfo[]): LinkedGroupInfo[] {
  const covered = new Set<string>()
  for (const g of groups) {
    for (const n of g.numbers) covered.add(`${g.year}-${n}`)
  }

  // 既存linked_groupがあるが、categoryベースのグループに含まれない問題
  for (const q of questions) {
    if (!q.linkedGroup) continue
    const key = `${q.year}-${q.questionNumber}`
    if (covered.has(key)) continue

    const match = q.linkedGroup.match(/^r(\d+)-(\d+)-(\d+)$/)
    if (!match) continue
    const [, , startStr, endStr] = match
    const start = parseInt(startStr, 10)
    const end = parseInt(endStr, 10)
    const numbers = Array.from({ length: end - start + 1 }, (_, i) => start + i)

    // categoryベースのグループが既にこの範囲をカバーしてないか確認
    const alreadyCovered = numbers.some(n => covered.has(`${q.year}-${n}`))
    if (!alreadyCovered) {
      groups.push({ year: q.year, numbers, groupId: `r${q.year}-${numbers[0]}-${numbers[numbers.length - 1]}` })
      for (const n of numbers) covered.add(`${q.year}-${n}`)
    }
  }

  return groups
}

// Main
const files = readdirSync(dir).filter(f => /^exam-\d+\.ts$/.test(f)).sort()
let totalGroupsFixed = 0
let totalScenarioFixed = 0
let totalChoicesFixed = 0

for (const file of files) {
  // ... per-file processing (see subsequent steps)
}

console.log(`\nSummary:`)
console.log(`  Groups fixed: ${totalGroupsFixed}`)
console.log(`  Scenarios fixed: ${totalScenarioFixed}`)
console.log(`  Choices fixed: ${totalChoicesFixed}`)
if (DRY_RUN) console.log('(dry run - no files changed)')
```

- [ ] **Step 2: ファイルパースと質問データ抽出を実装**

各 exam-{year}.ts をパースして、全問のデータを構造化配列に変換する。JSON.parseは使えない（TSファイルなので）→ 正規表現でフィールドを抽出する。

```typescript
function parseExamFile(content: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []
  // 各問題オブジェクトを正規表現で抽出
  const qRegex = /\{[\s\S]*?"id":\s*"(r\d+-\d+)"[\s\S]*?"year":\s*(\d+)[\s\S]*?"question_number":\s*(\d+)[\s\S]*?"category":\s*"([^"]*)"[\s\S]*?"question_text":\s*"((?:[^"\\]|\\.)*)"[\s\S]*?"choices":\s*\[([\s\S]*?)\][\s\S]*?"correct_answer"/g
  // ... パース処理
  return questions
}
```

ただし、正規表現だけでは限界あり。各問題ブロックを `"id":` で分割し、ブロックごとにフィールドを抽出する方式が安全。

- [ ] **Step 3: linked_group の書き換え処理を実装**

検出したグループ情報に基づき、ファイル内の各問題に linked_group を設定/更新する。

```typescript
function applyLinkedGroups(content: string, groups: LinkedGroupInfo[], year: number): { content: string; count: number } {
  let modified = content
  let count = 0

  for (const group of groups.filter(g => g.year === year)) {
    for (const qNum of group.numbers) {
      const id = `r${year}-${String(qNum).padStart(3, '0')}`
      // パターン1: linked_group が既にある → 書き換え
      // パターン2: linked_group がない → tags の後に追加
      // ... 文字列置換
      count++
    }
  }

  return { content: modified, count }
}
```

**注意点:**
- id のフォーマット: 実データは3桁ゼロ埋め（`r100-001`, `r100-196`）。`r${year}-${qNum}` で問196以上は自然に3桁になる
- linked_group がない問題に追加する場合の挿入位置: `"tags": [...]` の後の行
- **既存の旧形式 linked_group（例: `"r100-197-199"`）を新形式（`"r100-196-199"`）に必ず上書きする。** category で検出した正しい範囲に置換

- [ ] **Step 3.5: question_text のクリーニング処理を実装**

`split-linked-question-text.ts` と同じロジックで、各問の question_text から共通シナリオ部分を除去する。

```typescript
function cleanQuestionTexts(content: string, group: LinkedGroupInfo, scenario: string): { content: string; count: number } {
  // 各問の question_text を確認
  // シナリオ部分が含まれていたら除去（その問固有の部分のみ残す）
  // 「問XXX（科目）」マーカーで分割し、該当問のテキストだけを残す
  // 既に分割済み（マーカーなし or 短いテキスト）の場合はスキップ
  return { content: modified, count }
}
```

既に `split-linked-question-text.ts` で157問分を処理済みだが、残りの未処理問題にも同じロジックを適用する。処理済みの問題は変更なし（冪等性を保つ）。

- [ ] **Step 4: linked_scenario の抽出・設定処理を実装**

各グループの先頭問題から共通シナリオを抽出。

```typescript
function extractScenario(content: string, group: LinkedGroupInfo): string | null {
  // 1. question_text_original があればそこから抽出
  // 2. なければ question_text から抽出
  // 3. 「問XXX（科目）」マーカーより前の部分がシナリオ
  // 4. 既存 linked_scenario があればフォールバックとして使う
  return scenario
}
```

- [ ] **Step 5: 先頭問題の選択肢修復処理を実装**

先頭問題に結合されている選択肢（15個→5個等）を修復。

```typescript
function fixMergedChoices(content: string, group: LinkedGroupInfo): { content: string; count: number } {
  // 先頭問題のchoicesを確認
  // choices の数が 5 を超える場合 → 先頭5個のみ残す
  // ただし子問題が choices: [] の場合は対応する選択肢を移動
  return { content: modified, count }
}
```

**判定基準:** 先頭問題の choices 数が `5 * グループ内問題数` に近い場合に結合と判定。

- [ ] **Step 6: dry-run モードでテスト実行**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsx scripts/repair-linked-groups.ts --dry-run`

Expected output:
```
exam-100.ts: X groups detected, Y linked_groups set, Z scenarios extracted
exam-101.ts: ...
...
Summary:
  Groups fixed: ~500+
  Scenarios fixed: ~200+
  Choices fixed: ~50+
(dry run - no files changed)
```

検証ポイント:
- 問196-325 の全問に linked_group が設定される
- 各グループの問題数が 2-4 の範囲
- 問326-345 は影響を受けない
- 理論問題の連問も検出される

- [ ] **Step 7: 本実行 + 差分確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsx scripts/repair-linked-groups.ts`

実行後の検証:
Run: `cd /Users/ai/projects/personal/pharma-exam-ai && grep -c '"linked_group"' src/data/real-questions/exam-100.ts`
Expected: 130前後（問196-325の全問）

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npm run build`
Expected: ビルド成功

- [ ] **Step 8: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add scripts/repair-linked-groups.ts src/data/real-questions/
git commit -m "feat: 連問データ一括修復 — linked_group全問設定+シナリオ抽出+選択肢分離"
```

---

## Task 2: useLinkedQuestions フック簡素化

**Files:**
- Modify: `src/hooks/useLinkedQuestions.ts`

- [ ] **Step 1: 推定ロジックを削除し、linked_group のみで判定するシンプル実装に書き換え**

```typescript
import { useMemo } from 'react'
import { ALL_QUESTIONS } from '../data/all-questions'
import type { Question } from '../types/question'

export interface LinkedGroup {
  groupId: string
  scenario: string
  questions: Question[]
}

export function useLinkedQuestions(questionId: string | undefined): LinkedGroup | null {
  return useMemo(() => {
    if (!questionId) return null
    const current = ALL_QUESTIONS.find((q) => q.id === questionId)
    if (!current || !current.linked_group) return null

    return buildGroup(current.linked_group)
  }, [questionId])
}

function buildGroup(groupId: string): LinkedGroup | null {
  const match = groupId.match(/^r(\d+)-(\d+)-(\d+)$/)
  if (!match) return null

  const [, yearStr, startStr, endStr] = match
  const year = parseInt(yearStr, 10)
  const start = parseInt(startStr, 10)
  const end = parseInt(endStr, 10)

  const groupQuestions = ALL_QUESTIONS
    .filter(
      (q) => q.year === year && q.question_number >= start && q.question_number <= end
    )
    .sort((a, b) => a.question_number - b.question_number)

  if (groupQuestions.length <= 1) return null

  const scenario = groupQuestions.find((q) => q.linked_scenario)?.linked_scenario ?? ''

  return { groupId, scenario, questions: groupQuestions }
}
```

- [ ] **Step 2: ビルド確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npm run build`
Expected: ビルド成功

- [ ] **Step 3: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add src/hooks/useLinkedQuestions.ts
git commit -m "refactor: useLinkedQuestions を簡素化 — 推定ロジック削除、linked_groupのみで判定"
```

---

## Task 3: ナビゲーションをセット単位に変更

**Files:**
- Modify: `src/pages/QuestionPage.tsx` (lines 68-96, 470-494)

- [ ] **Step 1: セット単位ナビゲーションのロジックを実装**

`QuestionPage.tsx` の prevId/nextId 計算を変更。連問セットの場合はセットの先頭IDに飛ぶ。

```typescript
// 現在のコード（lines 92-96）を置き換え:

// --- セット単位ナビゲーション ---
const { prevId, nextId } = useMemo(() => {
  if (!questionId) return { prevId: null, nextId: null }

  const currentQ = ALL_QUESTIONS.find(q => q.id === questionId)
  if (!currentQ) return { prevId: null, nextId: null }

  // 連問セットの先頭問題IDを取得するヘルパー
  const getGroupStartId = (q: Question): string => {
    if (!q.linked_group) return q.id
    const match = q.linked_group.match(/^r(\d+)-(\d+)-(\d+)$/)
    if (!match) return q.id
    const [, year, start] = match
    return `r${year}-${start}`
  }

  // 現在のセットの先頭と末尾を特定
  let currentGroupEnd = currentQ.question_number
  if (currentQ.linked_group) {
    const match = currentQ.linked_group.match(/^r(\d+)-(\d+)-(\d+)$/)
    if (match) currentGroupEnd = parseInt(match[3], 10)
  }

  // effectiveIds 内で、現在のセット末尾の次の問題を探す
  const nextQuestion = effectiveIds
    .map(id => ALL_QUESTIONS.find(q => q.id === id))
    .filter((q): q is Question => !!q)
    .find(q => q.year === currentQ.year && q.question_number > currentGroupEnd
           || q.year > currentQ.year)

  // effectiveIds 内で、現在のセット先頭の前の問題を探す
  let currentGroupStart = currentQ.question_number
  if (currentQ.linked_group) {
    const match = currentQ.linked_group.match(/^r(\d+)-(\d+)-(\d+)$/)
    if (match) currentGroupStart = parseInt(match[2], 10)
  }

  const prevQuestion = [...effectiveIds]
    .reverse()
    .map(id => ALL_QUESTIONS.find(q => q.id === id))
    .filter((q): q is Question => !!q)
    .find(q => q.year === currentQ.year && q.question_number < currentGroupStart
           || q.year < currentQ.year)

  return {
    prevId: prevQuestion ? getGroupStartId(prevQuestion) : null,
    nextId: nextQuestion ? getGroupStartId(nextQuestion) : null,
  }
}, [questionId, effectiveIds])
```

- [ ] **Step 2: LinkedQuestionViewer に key={groupId} を設定**

`QuestionPage.tsx` の LinkedQuestionViewer レンダリングを変更:

```typescript
{linkedGroup && (
  <LinkedQuestionViewer
    key={linkedGroup.groupId}  // ← 追加: セット切替時にstateリセット
    group={linkedGroup}
    currentQuestionId={questionId ?? ''}
  />
)}
```

- [ ] **Step 3: ビルド確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npm run build`
Expected: ビルド成功

- [ ] **Step 4: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add src/pages/QuestionPage.tsx
git commit -m "feat: ナビゲーションをセット単位に変更 + LinkedQuestionViewer key追加"
```

---

## Task 4: PracticePage で連問をセット単位表示

**Files:**
- Modify: `src/pages/PracticePage.tsx` (lines 128-149, 316-368)

- [ ] **Step 1: セッション生成時に連問セット全体を含める**

`handleStartSession` を修正。フィルタで連問の一部だけ選ばれた場合、セット全体を含める。

```typescript
const handleStartSession = () => {
  let questions = [...filteredQuestions]

  // 連問セットの欠けを補完: セット内の1問でも含まれていたらセット全体を含める
  const questionIds = new Set(questions.map(q => q.id))
  const addedIds = new Set<string>()
  for (const q of questions) {
    if (!q.linked_group) continue
    const match = q.linked_group.match(/^r(\d+)-(\d+)-(\d+)$/)
    if (!match) continue
    const [, year, startStr, endStr] = match
    const start = parseInt(startStr, 10)
    const end = parseInt(endStr, 10)
    for (let n = start; n <= end; n++) {
      const id = `r${year}-${n}`
      if (!questionIds.has(id) && !addedIds.has(id)) {
        const linkedQ = ALL_QUESTIONS.find(aq => aq.id === id)
        if (linkedQ) {
          questions.push(linkedQ)
          addedIds.add(id)
        }
      }
    }
  }

  // 問題番号順にソート（シャッフル前に）
  questions.sort((a, b) => a.year - b.year || a.question_number - b.question_number)

  if (randomOrder) {
    // セット単位でシャッフル: 連問はセットごとまとめて移動
    // 1. 問題をセット単位のチャンクに分割
    const chunks: Question[][] = []
    let i = 0
    while (i < questions.length) {
      const q = questions[i]
      if (q.linked_group) {
        // 同じ linked_group の連続する問題をまとめる
        const chunk: Question[] = [q]
        while (i + 1 < questions.length && questions[i + 1].linked_group === q.linked_group) {
          chunk.push(questions[++i])
        }
        chunks.push(chunk)
      } else {
        chunks.push([q])
      }
      i++
    }
    // 2. チャンク単位でFisher-Yatesシャッフル
    for (let i = chunks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chunks[i], chunks[j]] = [chunks[j], chunks[i]]
    }
    // 3. フラットに展開
    questions = chunks.flat()
  }

  // セット境界を壊さずにスライス
  if (sessionCount > 0) {
    const sliced: Question[] = []
    const seen = new Set<string>()
    for (const q of questions) {
      if (sliced.length >= sessionCount && !q.linked_group) break
      // 連問セットの途中ならセット全体を含める
      if (q.linked_group && seen.has(q.linked_group)) {
        sliced.push(q)
        continue
      }
      if (sliced.length >= sessionCount) break
      sliced.push(q)
      if (q.linked_group) seen.add(q.linked_group)
    }
    questions = sliced
  }

  if (questions.length > 0) {
    localStorage.setItem('practice_session', JSON.stringify(questions.map(q => q.id)))
    navigate(`/practice/${questions[0].id}`)
  }
}
```

- [ ] **Step 2: 問題一覧で連問をセット単位表示に変更**

問題一覧のレンダリングを変更。連問は先頭問題のみ表示し、「問196-199」のように範囲表示。

```typescript
// filteredQuestions から表示用リストを生成（連問は先頭のみ）
const displayQuestions = useMemo(() => {
  const seen = new Set<string>()  // seen linked_group IDs
  return filteredQuestions.filter(q => {
    if (!q.linked_group) return true  // スタンドアロン → 表示
    if (seen.has(q.linked_group)) return false  // 既出の連問 → 非表示
    seen.add(q.linked_group)
    return true  // 連問の先頭 → 表示
  })
}, [filteredQuestions])
```

一覧の各行で、連問の場合はセット情報を表示:

```typescript
// 連問の場合の表示
{q.linked_group && (() => {
  const match = q.linked_group.match(/^r(\d+)-(\d+)-(\d+)$/)
  if (!match) return null
  const [, , start, end] = match
  return <Tag color="purple">問{start}-{end}</Tag>
})()}
```

- [ ] **Step 3: ページネーションを displayQuestions ベースに変更**

```typescript
// 既存: filteredQuestions.slice(...)
// 変更: displayQuestions.slice(...)
{displayQuestions
  .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  .map((q, idx) => (
    // ...
  ))}
```

total も displayQuestions.length に変更。

- [ ] **Step 4: 「解く」ボタンのクリック時、連問先頭IDに遷移**

```typescript
onClick={() => {
  localStorage.setItem(
    'practice_session',
    JSON.stringify(filteredQuestions.map((fq) => fq.id)),
  )
  // 連問の場合は先頭問題に遷移
  const targetId = q.linked_group
    ? (() => {
        const match = q.linked_group.match(/^r(\d+)-(\d+)-(\d+)$/)
        return match ? `r${match[1]}-${match[2]}` : q.id
      })()
    : q.id
  navigate(`/practice/${targetId}`)
}}
```

- [ ] **Step 5: ビルド確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npm run build`
Expected: ビルド成功

- [ ] **Step 6: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add src/pages/PracticePage.tsx
git commit -m "feat: PracticePage 連問セット単位表示 + セッション生成でセット全体含める"
```

---

## Task 5: 統合テスト + 実機確認

**Files:**
- 全変更ファイルの統合動作確認

- [ ] **Step 1: ビルド + dev サーバー起動**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npm run build && npm run dev`
Expected: ビルド成功、dev サーバー起動

- [ ] **Step 2: データ品質検証**

修復スクリプトにバリデーションモードを追加して実行:

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsx scripts/repair-linked-groups.ts --validate`

Expected output:
```
=== Validation ===
Questions 196-325 without linked_group: 0 (per year)
Groups with size outside 2-4: 0
Groups without linked_scenario: 0
Questions 326-345 with linked_group: 0 (should be standalone)
Old format linked_group remaining: 0
=== All checks passed ===
```

- [ ] **Step 3: ブラウザで動作確認（3セット以上）**

確認ポイント:
1. 第100回 問196 にアクセス → 4問セット（196-199）が表示されること
2. 共通シナリオ全文が読めること（アルプロスタジル...の臨床情報）
3. 各問の直後に選択肢があること
4. 「次の問題」→ 問200のセットに飛ぶこと
5. 「前の問題」→ 問195以前（理論の最後）に飛ぶこと
6. 問326以降はスタンドアロンで1問ずつ移動すること
7. PracticePageで連問がセット単位表示されること

- [ ] **Step 4: 既存E2Eテスト実行**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx playwright test`
Expected: 全テストPASS

- [ ] **Step 5: 最終コミット + push**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git push origin main
```
