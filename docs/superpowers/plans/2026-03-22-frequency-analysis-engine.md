# 頻出度分析エンジン実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 例示（Exemplar）単位の出題頻度統計を計算し、粗い例示の分割・マッピング漏れ検出・ヒートマップデータ生成までを完了する。

**Architecture:** スクリプト群（`npx tsx`で実行）がデータファイルを読み込み、CSV探索用データとTS定数を生成する。共通バリデータで整合性を保証。計算ロジックは純粋関数として切り出し、Vitestでテスト可能にする。

**Tech Stack:** TypeScript, tsx (script runner), Vitest (新規追加), CSV出力 (手書き/papaparse不要)

**Spec:** `docs/superpowers/specs/2026-03-22-frequency-analysis-engine-design.md`

> **注意: 例示件数について** — `exemplars.ts` のコメントは「951件」だが、実データは **966件**（H1追加分15件含む）。コメントが古いだけなので、プラン全体で966件を前提とする。実行時に件数が異なった場合は実データに合わせること。

---

## ファイル構成

### 新規作成

| ファイル | 責務 |
|---------|------|
| `scripts/lib/exemplar-stats-core.ts` | ExemplarStats計算の純粋関数（テスト対象） |
| `scripts/lib/keyword-matcher.ts` | キーワード抽出・類似度計算の純粋関数（テスト対象） |
| `scripts/lib/__tests__/exemplar-stats-core.test.ts` | Stats計算のユニットテスト |
| `scripts/lib/__tests__/keyword-matcher.test.ts` | キーワードマッチのユニットテスト |
| `scripts/validate-data-integrity.ts` | 共通データ整合性チェッカー |
| `scripts/compute-exemplar-stats.ts` | セクション1: Stats計算スクリプト |
| `scripts/analyze-split-candidates.ts` | セクション2: 分割候補分析スクリプト |
| `scripts/detect-mapping-gaps.ts` | セクション3: マッピング漏れ検出スクリプト |
| `scripts/generate-heatmap-data.ts` | セクション4: ヒートマップ生成スクリプト |
| `src/data/exemplar-stats.ts` | アプリ用TS定数（Stats） |
| `src/data/heatmap-data.ts` | アプリ用TS定数（ヒートマップ） |
| `vitest.config.ts` | Vitest設定（新規） |

### 変更

| ファイル | 変更内容 |
|---------|---------|
| `src/types/blueprint.ts` | `ExemplarStats` 型を拡張（primary/secondary, linkedGroupCount, avgQuestionsPerYear追加） |
| `package.json` | vitest追加、testスクリプト追加 |
| `src/data/exemplars.ts` | セクション2で分割後のサブ例示追加・旧ID削除（レビューゲート後） |
| `src/data/question-exemplar-map.ts` | セクション2,3でマッピング更新（レビューゲート後） |

---

## Task 0: テスト環境セットアップ

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Vitest をインストール**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
npm install -D vitest
```

- [ ] **Step 2: vitest.config.ts を作成**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['scripts/lib/__tests__/**/*.test.ts'],
    globals: true,
  },
})
```

- [ ] **Step 3: package.json に test スクリプトを追加**

`package.json` の `scripts` に追加:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: 動作確認用のダミーテストを作成して実行**

`scripts/lib/__tests__/setup.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'

describe('テスト環境', () => {
  it('Vitest が動作する', () => {
    expect(1 + 1).toBe(2)
  })
})
```

Run: `npm test`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add vitest.config.ts package.json package-lock.json scripts/lib/__tests__/setup.test.ts
git commit -m "chore: Vitest テスト環境を追加"
```

---

## Task 1: ExemplarStats 型の拡張

**Files:**
- Modify: `src/types/blueprint.ts:46-51`

- [ ] **Step 1: ExemplarStats 型を拡張**

`src/types/blueprint.ts` の `ExemplarStats` を以下に置き換え:

```typescript
/** 例示の出題統計（集約ビュー） */
export interface ExemplarStats {
  exemplarId: string
  subject: QuestionSubject
  // 全体（マッピング件数ベース）
  yearsAppeared: number          // 出題年度数（0-12）
  totalQuestions: number         // マッピング件数の合計（primary + secondary）
  yearDetails: { year: number; count: number }[]
  // primary/secondary 内訳（マッピング件数ベース）
  primaryQuestions: number       // isPrimary=true のマッピング件数
  secondaryQuestions: number     // isPrimary=false のマッピング件数
  primaryYearsAppeared: number   // primary で出題された年度数
  // 連問補正指標
  linkedGroupCount: number       // linked_group でユニークなシナリオ数
  // 派生指標
  avgQuestionsPerYear: number    // totalQuestions / yearsAppeared（0除算は0）
}
```

- [ ] **Step 2: ビルド確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsc -b --noEmit`
Expected: エラーなし（ExemplarStats を直接使用している箇所がなければ）

- [ ] **Step 3: コミット**

```bash
git add src/types/blueprint.ts
git commit -m "feat: ExemplarStats 型を拡張（primary/secondary, linkedGroupCount）"
```

---

## Task 2: Stats計算コアロジック + テスト

**Files:**
- Create: `scripts/lib/exemplar-stats-core.ts`
- Create: `scripts/lib/__tests__/exemplar-stats-core.test.ts`

- [ ] **Step 1: テストを書く**

`scripts/lib/__tests__/exemplar-stats-core.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { computeExemplarStats } from '../exemplar-stats-core'
import type { QuestionExemplarMapping } from '../../../src/types/blueprint'
import type { Question } from '../../../src/types/question'

// テスト用の最小データ
const mockExemplars = [
  { id: 'ex-test-001', minorCategory: 'テスト', middleCategoryId: 'test-cat', subject: '物理' as const, text: 'テスト例示1' },
  { id: 'ex-test-002', minorCategory: 'テスト', middleCategoryId: 'test-cat', subject: '物理' as const, text: 'テスト例示2' },
  { id: 'ex-test-003', minorCategory: 'テスト', middleCategoryId: 'test-cat', subject: '化学' as const, text: '未使用例示' },
]

const mockMappings: QuestionExemplarMapping[] = [
  { questionId: 'r100-001', exemplarId: 'ex-test-001', isPrimary: true },
  { questionId: 'r100-002', exemplarId: 'ex-test-001', isPrimary: true },
  { questionId: 'r100-002', exemplarId: 'ex-test-002', isPrimary: false },
  { questionId: 'r101-001', exemplarId: 'ex-test-001', isPrimary: true },
  { questionId: 'r101-001', exemplarId: 'ex-test-002', isPrimary: false },
]

const mockQuestions: Pick<Question, 'id' | 'year' | 'linked_group'>[] = [
  { id: 'r100-001', year: 100, linked_group: undefined },
  { id: 'r100-002', year: 100, linked_group: 'group-A' },
  { id: 'r101-001', year: 101, linked_group: 'group-A' },
]

describe('computeExemplarStats', () => {
  const results = computeExemplarStats(mockExemplars, mockMappings, mockQuestions)

  it('全例示分の結果を返す（未使用含む）', () => {
    expect(results).toHaveLength(3)
  })

  it('totalQuestions はマッピング件数ベース', () => {
    const stat1 = results.find(s => s.exemplarId === 'ex-test-001')!
    expect(stat1.totalQuestions).toBe(3) // 3件のマッピング
    expect(stat1.primaryQuestions).toBe(3)
    expect(stat1.secondaryQuestions).toBe(0)
  })

  it('yearsAppeared は出題年度のユニーク数', () => {
    const stat1 = results.find(s => s.exemplarId === 'ex-test-001')!
    expect(stat1.yearsAppeared).toBe(2) // Y100, Y101
    expect(stat1.yearDetails).toEqual([
      { year: 100, count: 2 },
      { year: 101, count: 1 },
    ])
  })

  it('secondary のみの例示も正しく集計', () => {
    const stat2 = results.find(s => s.exemplarId === 'ex-test-002')!
    expect(stat2.totalQuestions).toBe(2)
    expect(stat2.primaryQuestions).toBe(0)
    expect(stat2.secondaryQuestions).toBe(2)
    expect(stat2.primaryYearsAppeared).toBe(0)
  })

  it('未使用例示は totalQuestions=0', () => {
    const stat3 = results.find(s => s.exemplarId === 'ex-test-003')!
    expect(stat3.totalQuestions).toBe(0)
    expect(stat3.yearsAppeared).toBe(0)
    expect(stat3.avgQuestionsPerYear).toBe(0)
    expect(stat3.linkedGroupCount).toBe(0)
  })

  it('avgQuestionsPerYear が正しい', () => {
    const stat1 = results.find(s => s.exemplarId === 'ex-test-001')!
    expect(stat1.avgQuestionsPerYear).toBe(1.5) // 3 / 2
  })

  it('linkedGroupCount は連問を1ケースとして数える', () => {
    const stat1 = results.find(s => s.exemplarId === 'ex-test-001')!
    // r100-001(no group=1), r100-002(group-A), r101-001(group-A) → group-Aは年度別なので2 + 1 = 3...
    // ただし linked_group が同じでも年度が違えば別ケース
    // r100-001: no group → 1件, r100-002: group-A(Y100) → 1件, r101-001: group-A(Y101) → 1件 = 3件
    expect(stat1.linkedGroupCount).toBe(3)
  })

  it('subject がセットされる', () => {
    const stat1 = results.find(s => s.exemplarId === 'ex-test-001')!
    expect(stat1.subject).toBe('物理')
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test`
Expected: FAIL（`exemplar-stats-core` が存在しない）

- [ ] **Step 3: コアロジックを実装**

`scripts/lib/exemplar-stats-core.ts`:

```typescript
import type { Exemplar, QuestionExemplarMapping, ExemplarStats } from '../../src/types/blueprint'
import type { Question } from '../../src/types/question'

type QuestionLike = Pick<Question, 'id' | 'year' | 'linked_group'>

/**
 * 全例示の出題統計を計算する（純粋関数）
 * - マッピングを1パスでMapに構築
 * - 連問(linked_group)をユニークケースとしてカウント
 */
export function computeExemplarStats(
  exemplars: Exemplar[],
  mappings: QuestionExemplarMapping[],
  questions: QuestionLike[],
): ExemplarStats[] {
  // 1. questionId → Question のMap
  const questionMap = new Map<string, QuestionLike>()
  for (const q of questions) {
    questionMap.set(q.id, q)
  }

  // 2. exemplarId → mappings[] のMap（1パス）
  const mappingsByExemplar = new Map<string, QuestionExemplarMapping[]>()
  for (const m of mappings) {
    const list = mappingsByExemplar.get(m.exemplarId)
    if (list) {
      list.push(m)
    } else {
      mappingsByExemplar.set(m.exemplarId, [m])
    }
  }

  // 3. 各例示の統計を計算
  return exemplars.map((exemplar) => {
    const myMappings = mappingsByExemplar.get(exemplar.id) || []

    if (myMappings.length === 0) {
      return {
        exemplarId: exemplar.id,
        subject: exemplar.subject,
        yearsAppeared: 0,
        totalQuestions: 0,
        yearDetails: [],
        primaryQuestions: 0,
        secondaryQuestions: 0,
        primaryYearsAppeared: 0,
        linkedGroupCount: 0,
        avgQuestionsPerYear: 0,
      }
    }

    // primary/secondary カウント
    let primaryQuestions = 0
    let secondaryQuestions = 0
    const primaryYears = new Set<number>()
    const yearCounts = new Map<number, number>()
    // 連問カウント用: "year-group" のユニークセット
    const linkedKeys = new Set<string>()

    for (const m of myMappings) {
      if (m.isPrimary) {
        primaryQuestions++
      } else {
        secondaryQuestions++
      }

      const q = questionMap.get(m.questionId)
      if (!q) continue

      // 年度別集計
      yearCounts.set(q.year, (yearCounts.get(q.year) || 0) + 1)

      if (m.isPrimary) {
        primaryYears.add(q.year)
      }

      // 連問カウント: linked_group があれば "year-group"、なければ questionId をキーに
      const linkedKey = q.linked_group
        ? `${q.year}-${q.linked_group}`
        : q.id
      linkedKeys.add(linkedKey)
    }

    const yearDetails = Array.from(yearCounts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year)

    const totalQuestions = primaryQuestions + secondaryQuestions
    const yearsAppeared = yearCounts.size

    return {
      exemplarId: exemplar.id,
      subject: exemplar.subject,
      yearsAppeared,
      totalQuestions,
      yearDetails,
      primaryQuestions,
      secondaryQuestions,
      primaryYearsAppeared: primaryYears.size,
      linkedGroupCount: linkedKeys.size,
      avgQuestionsPerYear: yearsAppeared > 0 ? Math.round((totalQuestions / yearsAppeared) * 100) / 100 : 0,
    }
  })
}
```

- [ ] **Step 4: テストを実行**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 5: コミット**

```bash
git add scripts/lib/exemplar-stats-core.ts scripts/lib/__tests__/exemplar-stats-core.test.ts
git commit -m "feat: ExemplarStats 計算コアロジック + テスト"
```

---

## Task 3: データ整合性バリデータ

**Files:**
- Create: `scripts/validate-data-integrity.ts`

- [ ] **Step 1: バリデータスクリプトを実装**

`scripts/validate-data-integrity.ts`:

```typescript
/**
 * データ整合性チェッカー
 * 全スクリプト実行前に呼ぶ。1つでも失敗したらprocess.exit(1)
 *
 * Usage: npx tsx scripts/validate-data-integrity.ts
 */
import { EXEMPLARS } from '../src/data/exemplars'
import { QUESTION_EXEMPLAR_MAP } from '../src/data/question-exemplar-map'

interface ValidationResult {
  name: string
  passed: boolean
  message: string
}

function validate(): ValidationResult[] {
  const results: ValidationResult[] = []
  const exemplarIds = new Set(EXEMPLARS.map(e => e.id))

  // Check 1: 各 questionId に primary がちょうど1件
  const primaryByQuestion = new Map<string, number>()
  for (const m of QUESTION_EXEMPLAR_MAP) {
    if (m.isPrimary) {
      primaryByQuestion.set(m.questionId, (primaryByQuestion.get(m.questionId) || 0) + 1)
    }
  }
  const multiPrimary = [...primaryByQuestion.entries()].filter(([, count]) => count !== 1)
  results.push({
    name: 'primary唯一性',
    passed: multiPrimary.length === 0,
    message: multiPrimary.length === 0
      ? `全問題でprimaryが1件ずつ`
      : `${multiPrimary.length}問でprimary数が異常: ${multiPrimary.slice(0, 5).map(([q, c]) => `${q}=${c}`).join(', ')}`,
  })

  // Check 2: 参照先 exemplarId が存在する
  const missingExemplars = [...new Set(QUESTION_EXEMPLAR_MAP.map(m => m.exemplarId))].filter(id => !exemplarIds.has(id))
  results.push({
    name: 'exemplar参照整合性',
    passed: missingExemplars.length === 0,
    message: missingExemplars.length === 0
      ? `全マッピングの参照先が存在`
      : `${missingExemplars.length}件の不明exemplar: ${missingExemplars.slice(0, 5).join(', ')}`,
  })

  // Check 3: (questionId, exemplarId) の重複なし
  const pairSet = new Set<string>()
  let duplicates = 0
  for (const m of QUESTION_EXEMPLAR_MAP) {
    const key = `${m.questionId}|${m.exemplarId}`
    if (pairSet.has(key)) duplicates++
    pairSet.add(key)
  }
  results.push({
    name: 'マッピング重複なし',
    passed: duplicates === 0,
    message: duplicates === 0
      ? `重複なし（${QUESTION_EXEMPLAR_MAP.length}件）`
      : `${duplicates}件の重複あり`,
  })

  // Check 4: 基本数量レポート
  // TODO: 2回目以降は前回の数量と比較し ±10% 以内であることを検証する
  //       scripts/output/.last-validation.json に前回値を保存する方式を検討
  const usedExemplars = new Set(QUESTION_EXEMPLAR_MAP.map(m => m.exemplarId))
  const unusedCount = EXEMPLARS.length - usedExemplars.size
  results.push({
    name: '数量レポート',
    passed: true,
    message: `例示${EXEMPLARS.length}件, マッピング${QUESTION_EXEMPLAR_MAP.length}件, 未使用${unusedCount}件`,
  })

  return results
}

// メイン実行
const results = validate()
let hasError = false

for (const r of results) {
  const icon = r.passed ? '✅' : '❌'
  console.log(`${icon} ${r.name}: ${r.message}`)
  if (!r.passed) hasError = true
}

if (hasError) {
  console.error('\n❌ データ整合性チェックに失敗しました')
  process.exit(1)
} else {
  console.log('\n✅ 全チェック通過')
}
```

- [ ] **Step 2: 実行して現在のデータの整合性を確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsx scripts/validate-data-integrity.ts`
Expected: 全チェック通過（現在のデータは正常なはず）

- [ ] **Step 3: コミット**

```bash
git add scripts/validate-data-integrity.ts
git commit -m "feat: データ整合性バリデータを追加"
```

---

## Task 4: Stats計算スクリプト（セクション1）

**Files:**
- Create: `scripts/compute-exemplar-stats.ts`
- Create: `src/data/exemplar-stats.ts`

- [ ] **Step 1: Stats計算スクリプトを実装**

`scripts/compute-exemplar-stats.ts`:

```typescript
/**
 * ExemplarStats 計算スクリプト（セクション1）
 * - 966例示の出題統計を計算
 * - CSV（コンソール出力）とTS定数ファイルを生成
 *
 * Usage: npx tsx scripts/compute-exemplar-stats.ts
 * Options: --csv-only  TS定数を生成せずCSVのみ出力
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { EXEMPLARS } from '../src/data/exemplars'
import { QUESTION_EXEMPLAR_MAP } from '../src/data/question-exemplar-map'
import { ALL_QUESTIONS } from '../src/data/all-questions'
import { computeExemplarStats } from './lib/exemplar-stats-core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// バリデーション（簡易版）
const exemplarIds = new Set(EXEMPLARS.map(e => e.id))
const badRefs = QUESTION_EXEMPLAR_MAP.filter(m => !exemplarIds.has(m.exemplarId))
if (badRefs.length > 0) {
  console.error(`❌ ${badRefs.length}件の不正参照があります。先にvalidate-data-integrity.tsを実行してください。`)
  process.exit(1)
}

// 計算
const stats = computeExemplarStats(EXEMPLARS, QUESTION_EXEMPLAR_MAP, ALL_QUESTIONS)

// ソート: totalQuestions降順
stats.sort((a, b) => b.totalQuestions - a.totalQuestions)

// CSV出力
const csvHeader = 'exemplarId,subject,totalQuestions,primaryQuestions,secondaryQuestions,yearsAppeared,primaryYearsAppeared,linkedGroupCount,avgQuestionsPerYear,yearDetails'
const csvRows = stats.map(s => {
  const yd = s.yearDetails.map(d => `Y${d.year}:${d.count}`).join('|')
  return `${s.exemplarId},${s.subject},${s.totalQuestions},${s.primaryQuestions},${s.secondaryQuestions},${s.yearsAppeared},${s.primaryYearsAppeared},${s.linkedGroupCount},${s.avgQuestionsPerYear},${yd}`
})

// CSV をファイルに出力
const outputDir = path.join(__dirname, 'output')
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
const csvPath = path.join(outputDir, 'exemplar-stats.csv')
fs.writeFileSync(csvPath, [csvHeader, ...csvRows].join('\n'), 'utf-8')
console.log(`📊 CSV出力: ${csvPath}`)

// サマリー
const used = stats.filter(s => s.totalQuestions > 0)
const unused = stats.filter(s => s.totalQuestions === 0)
console.log(`\n📈 サマリー:`)
console.log(`  使用済み例示: ${used.length}件`)
console.log(`  未使用例示: ${unused.length}件`)
console.log(`  TOP5:`)
for (const s of stats.slice(0, 5)) {
  console.log(`    ${s.exemplarId} (${s.subject}): ${s.totalQuestions}問, ${s.yearsAppeared}年度, linked=${s.linkedGroupCount}`)
}

// TS定数生成（--csv-only でなければ）
if (!process.argv.includes('--csv-only')) {
  const tsContent = `// 例示別出題統計（自動生成: compute-exemplar-stats.ts）
// 生成日: ${new Date().toISOString().split('T')[0]}

import type { ExemplarStats } from '../types/blueprint'

export const EXEMPLAR_STATS: ExemplarStats[] = ${JSON.stringify(stats, null, 2)}
`
  const tsPath = path.join(__dirname, '..', 'src', 'data', 'exemplar-stats.ts')
  fs.writeFileSync(tsPath, tsContent, 'utf-8')
  console.log(`\n📝 TS定数出力: ${tsPath}`)
}
```

- [ ] **Step 2: バリデータ→Stats計算を実行**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
npx tsx scripts/validate-data-integrity.ts && npx tsx scripts/compute-exemplar-stats.ts
```

Expected: CSV と TS定数が生成される。サマリーに使用済み ~767件、未使用 ~199件が表示される。

- [ ] **Step 3: 生成された CSV を目視確認**

`scripts/output/exemplar-stats.csv` を開いて:
- TOP5が ex-practice-043 (137), ex-practice-045 (48), ... の順になっているか
- linkedGroupCount が totalQuestions 以下になっているか
- 未使用例示が末尾に totalQuestions=0 で並んでいるか

- [ ] **Step 4: ビルド確認**

Run: `npx tsc -b --noEmit`
Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add scripts/compute-exemplar-stats.ts src/data/exemplar-stats.ts scripts/output/exemplar-stats.csv
git commit -m "feat: ExemplarStats 計算スクリプト + TS定数生成（セクション1）"
```

---

## Task 5: 分割候補分析スクリプト（セクション2）

**Files:**
- Create: `scripts/analyze-split-candidates.ts`
- Create: `scripts/output/split-candidates/` (出力ディレクトリ)

- [ ] **Step 1: 分割候補分析スクリプトを実装**

`scripts/analyze-split-candidates.ts`:

```typescript
/**
 * 粗い例示の分割候補分析（セクション2）
 * - 30問以上の例示6件を対象
 * - 問題文+解説+conceptsからキーワードを抽出してクラスタ案を生成
 * - 例示ごとにCSV出力（人間レビュー用）
 *
 * Usage: npx tsx scripts/analyze-split-candidates.ts
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { EXEMPLARS } from '../src/data/exemplars'
import { QUESTION_EXEMPLAR_MAP } from '../src/data/question-exemplar-map'
import { ALL_QUESTIONS } from '../src/data/all-questions'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 分割対象（30問以上）
const SPLIT_THRESHOLD = 30
const SPLIT_TARGETS = [
  'ex-practice-043',
  'ex-practice-045',
  'ex-practice-087',
  'ex-pharmacology-067',
  'ex-practice-074',
  'ex-practice-082',
]

const questionMap = new Map(ALL_QUESTIONS.map(q => [q.id, q]))
const outputDir = path.join(__dirname, 'output', 'split-candidates')
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

for (const targetId of SPLIT_TARGETS) {
  const exemplar = EXEMPLARS.find(e => e.id === targetId)
  if (!exemplar) {
    console.error(`❌ ${targetId} が見つかりません`)
    continue
  }

  // この例示にマッピングされた問題を取得
  const mappings = QUESTION_EXEMPLAR_MAP.filter(m => m.exemplarId === targetId)
  const questions = mappings
    .map(m => {
      const q = questionMap.get(m.questionId)
      return q ? { ...q, isPrimary: m.isPrimary } : null
    })
    .filter((q): q is NonNullable<typeof q> => q !== null)
    .sort((a, b) => a.year - b.year || a.question_number - b.question_number)

  // CSV出力: questionId, year, section, question_text(先頭100文字), concepts, explanation(先頭100文字)
  const csvHeader = 'questionId,year,section,isPrimary,question_text,question_concepts,explanation_excerpt'
  const csvRows = questions.map(q => {
    const text = (q.question_text || '').replace(/,/g, '，').replace(/\n/g, ' ').slice(0, 100)
    const concepts = (q.question_concepts || []).join(';')
    const explanation = (q.explanation || '').replace(/,/g, '，').replace(/\n/g, ' ').slice(0, 100)
    return `${q.id},${q.year},${q.section},${q.isPrimary},${text},${concepts},${explanation}`
  })

  const csvPath = path.join(outputDir, `${targetId}.csv`)
  fs.writeFileSync(csvPath, [csvHeader, ...csvRows].join('\n'), 'utf-8')

  // キーワード頻度分析
  const keywordCounts = new Map<string, number>()
  for (const q of questions) {
    const concepts = q.question_concepts || []
    for (const c of concepts) {
      keywordCounts.set(c, (keywordCounts.get(c) || 0) + 1)
    }
  }
  const topKeywords = [...keywordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)

  console.log(`\n📋 ${targetId} (${exemplar.text.slice(0, 40)}...)`)
  console.log(`   問題数: ${questions.length}`)
  console.log(`   CSV: ${csvPath}`)
  console.log(`   TOP キーワード:`)
  for (const [kw, count] of topKeywords.slice(0, 10)) {
    console.log(`     ${kw}: ${count}回`)
  }
}

console.log(`\n✅ 分割候補分析完了。${outputDir} のCSVを確認してください。`)
console.log(`   レビュー後に分割提案を作成します。`)
```

- [ ] **Step 2: 実行して分析結果を確認**

```bash
npx tsx scripts/analyze-split-candidates.ts
```

Expected: 6件のCSVが `scripts/output/split-candidates/` に生成される。各例示のキーワード頻度が表示される。

- [ ] **Step 3: コミット**

```bash
git add scripts/analyze-split-candidates.ts
git commit -m "feat: 分割候補分析スクリプト（セクション2）"
```

> **🔴 レビューゲート**: ここでCSVを確認し、分割案を作成→ユーザー承認を取る。
> 承認後に `exemplars.ts` と `question-exemplar-map.ts` を更新する。
> この更新は対話的に行うため、プランでは具体的な変更内容を事前に定義しない。
>
> **分割後のバリデーション（必須）**: データ更新後に以下を自動チェック:
> 1. 新IDが既存の全 exemplar ID と衝突しないこと
> 2. 旧IDへのマッピング参照が0件になること（取り残しなし）
> 3. 全新IDが `exemplars.ts` に存在すること
> 4. 分割前後で総マッピング件数が一致すること
> 5. `npx tsx scripts/validate-data-integrity.ts` が全チェック通過すること

---

## Task 6: キーワードマッチャー + テスト

**Files:**
- Create: `scripts/lib/keyword-matcher.ts`
- Create: `scripts/lib/__tests__/keyword-matcher.test.ts`

- [ ] **Step 1: テストを書く**

`scripts/lib/__tests__/keyword-matcher.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { extractKeywords, calculateSimilarity } from '../keyword-matcher'

describe('extractKeywords', () => {
  it('定型フレーズを除去してキーワードを抽出する', () => {
    const text = 'エンドサイトーシスとエキソサイトーシスについて説明できる。'
    const keywords = extractKeywords(text)
    expect(keywords).toContain('エンドサイトーシス')
    expect(keywords).toContain('エキソサイトーシス')
    expect(keywords).not.toContain('説明できる')
    expect(keywords).not.toContain('について')
  })

  it('短すぎるテキスト（10文字未満）は空配列を返す', () => {
    expect(extractKeywords('短い文')).toEqual([])
  })
})

describe('calculateSimilarity', () => {
  it('完全一致で1.0を返す', () => {
    const exemplarKeywords = ['エンドサイトーシス', 'エキソサイトーシス']
    const questionText = 'エンドサイトーシスとエキソサイトーシスの違いを述べよ'
    const concepts = ['エンドサイトーシス', 'エキソサイトーシス']
    const result = calculateSimilarity(exemplarKeywords, questionText, '', concepts, [])
    expect(result.score).toBeLessThanOrEqual(1.0)
    expect(result.score).toBeGreaterThan(0.5)
    expect(result.matchedKeywords).toContain('エンドサイトーシス')
  })

  it('一致なしで0を返す', () => {
    const exemplarKeywords = ['エンドサイトーシス']
    const result = calculateSimilarity(exemplarKeywords, '全く関係ないテキスト', '', [], [])
    expect(result.score).toBe(0)
    expect(result.matchedKeywords).toHaveLength(0)
  })

  it('question_concepts の一致は2倍の重み', () => {
    const exemplarKeywords = ['エンドサイトーシス', 'エキソサイトーシス']
    // concepts経由のみで一致（1/2キーワード × 2倍 = score 1.0）
    const r1 = calculateSimilarity(exemplarKeywords, '', '', ['エンドサイトーシス'], [])
    // question_text経由のみで一致（1/2キーワード × 1倍 = score 0.5）
    const r2 = calculateSimilarity(exemplarKeywords, 'エンドサイトーシス', '', [], [])
    expect(r1.score).toBeGreaterThan(r2.score)
  })

  it('スコアは1.0を超えない（concepts 2倍加算でもクリップ）', () => {
    const exemplarKeywords = ['糖尿病']
    // concepts一致で2倍 → rawScore=2.0 → Math.min で1.0にクリップ
    const result = calculateSimilarity(
      exemplarKeywords,
      '糖尿病の治療',
      '糖尿病の解説',
      ['糖尿病', '糖尿病合併症'],
      ['糖尿病薬'],
    )
    expect(result.score).toBe(1.0)
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test`
Expected: FAIL

- [ ] **Step 3: キーワードマッチャーを実装**

`scripts/lib/keyword-matcher.ts`:

```typescript
/**
 * キーワード抽出・類似度計算（セクション3: マッピング漏れ検出用）
 */

// 除去する定型フレーズ（例示テキストに頻出するパターン）
const STOP_PHRASES = [
  '説明できる', '列挙できる', '理解できる', '記述できる',
  '分類できる', '定義することができる', '識別することができる',
  '概要を', '概説できる', '例を挙げて',
  'について', 'に関して', 'における', 'に対する',
  'の種類', 'の役割', 'の関係', 'の概要',
  'および', '及び', 'ならびに', 'また',
  'と', 'の', 'を', 'が', 'に', 'は', 'で', 'から', 'まで', 'へ',
]

/**
 * テキストからキーワードを抽出する
 * - 10文字未満のテキストは壊れデータとして空配列を返す
 * - 定型フレーズと助詞を除去
 * - 句読点で分割後、残った語をキーワードとする
 */
export function extractKeywords(text: string): string[] {
  if (text.length < 10) return []

  let cleaned = text
  // 定型フレーズを除去（長い順に処理して部分一致を避ける）
  const sortedPhrases = [...STOP_PHRASES].sort((a, b) => b.length - a.length)
  for (const phrase of sortedPhrases) {
    cleaned = cleaned.replaceAll(phrase, ' ')
  }

  // 句読点・括弧で分割
  const tokens = cleaned
    .split(/[。、．，（）()「」\s]+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2) // 1文字の断片を除去

  return [...new Set(tokens)]
}

interface SimilarityResult {
  score: number
  matchedKeywords: string[]
}

/**
 * 例示キーワードと問題テキストの類似度を計算する
 * - question_concepts の一致は2倍の重み
 * - 重複除外（同じキーワードが複数フィールドで一致しても1回）
 * - スコアは Math.min(score, 1.0) でクリップ
 */
export function calculateSimilarity(
  exemplarKeywords: string[],
  questionText: string,
  explanation: string,
  questionConcepts: string[],
  semanticLabels: string[],
): SimilarityResult {
  if (exemplarKeywords.length === 0) return { score: 0, matchedKeywords: [] }

  const matchedKeywords: string[] = []
  let weightedScore = 0

  // テキストフィールドを結合（concepts以外）
  const textFields = [questionText, explanation, ...semanticLabels].join(' ')

  for (const keyword of exemplarKeywords) {
    let matched = false
    let conceptMatch = false

    // question_concepts でのマッチ（2倍重み）
    if (questionConcepts.some(c => c.includes(keyword) || keyword.includes(c))) {
      conceptMatch = true
      matched = true
    }

    // テキストフィールドでのマッチ（1倍重み）
    if (textFields.includes(keyword)) {
      matched = true
    }

    if (matched) {
      matchedKeywords.push(keyword)
      weightedScore += conceptMatch ? 2 : 1
    }
  }

  // 分母はキーワード総数（スペック通り）。concepts 2倍加算で1.0を超えうるので Math.min でクリップ
  const rawScore = weightedScore / exemplarKeywords.length
  const score = Math.min(Math.round(rawScore * 100) / 100, 1.0)

  return { score, matchedKeywords }
}
```

- [ ] **Step 4: テストを実行**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 5: コミット**

```bash
git add scripts/lib/keyword-matcher.ts scripts/lib/__tests__/keyword-matcher.test.ts
git commit -m "feat: キーワードマッチャー + テスト（セクション3準備）"
```

---

## Task 7: マッピング漏れ検出スクリプト（セクション3）

**Files:**
- Create: `scripts/detect-mapping-gaps.ts`

- [ ] **Step 1: 漏れ検出スクリプトを実装**

`scripts/detect-mapping-gaps.ts`:

```typescript
/**
 * 未使用例示のマッピング漏れ検出（セクション3）
 * - 未使用例示のテキストからキーワード抽出
 * - 全問題と照合して類似度スコアを計算
 * - スコア0.3以上の候補ペアをCSV出力
 *
 * Usage: npx tsx scripts/detect-mapping-gaps.ts
 * Options: --threshold 0.3  スコア閾値を変更
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { EXEMPLARS } from '../src/data/exemplars'
import { QUESTION_EXEMPLAR_MAP } from '../src/data/question-exemplar-map'
import { ALL_QUESTIONS } from '../src/data/all-questions'
import { extractKeywords, calculateSimilarity } from './lib/keyword-matcher'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const threshold = parseFloat(process.argv.find(a => a.startsWith('--threshold='))?.split('=')[1] || '0.3')

// 未使用例示を特定
const usedExemplarIds = new Set(QUESTION_EXEMPLAR_MAP.map(m => m.exemplarId))
const unusedExemplars = EXEMPLARS.filter(e => !usedExemplarIds.has(e.id))

console.log(`🔍 未使用例示: ${unusedExemplars.length}件`)
console.log(`🎯 閾値: ${threshold}`)

// 壊れデータのフラグ
const brokenExemplars: string[] = []
for (const e of unusedExemplars) {
  if (e.text.length < 10) {
    brokenExemplars.push(`${e.id}: "${e.text}"`)
  }
  if (e.minorCategory.length < 3 || /[すいうけ]$/.test(e.minorCategory)) {
    brokenExemplars.push(`${e.id}: minorCategory="${e.minorCategory}"（途切れ?）`)
  }
}
if (brokenExemplars.length > 0) {
  console.log(`\n⚠️ 壊れデータの可能性: ${brokenExemplars.length}件`)
  for (const b of brokenExemplars.slice(0, 10)) {
    console.log(`   ${b}`)
  }
}

// 候補ペアを検出
interface CandidatePair {
  exemplarId: string
  exemplarText: string
  questionId: string
  questionText: string
  score: number
  matchedKeywords: string[]
}

const candidates: CandidatePair[] = []

for (const exemplar of unusedExemplars) {
  const keywords = extractKeywords(exemplar.text)
  if (keywords.length === 0) continue

  for (const question of ALL_QUESTIONS) {
    const concepts = question.question_concepts || []
    const semanticLabels = (question.choices || [])
      .flatMap(c => c.semantic_labels || [])

    const result = calculateSimilarity(
      keywords,
      question.question_text || '',
      question.explanation || '',
      concepts,
      semanticLabels,
    )

    if (result.score >= threshold) {
      candidates.push({
        exemplarId: exemplar.id,
        exemplarText: exemplar.text.slice(0, 60),
        questionId: question.id,
        questionText: (question.question_text || '').slice(0, 60),
        score: result.score,
        matchedKeywords: result.matchedKeywords,
      })
    }
  }
}

// スコア降順ソート
candidates.sort((a, b) => b.score - a.score)

// CSV出力
const outputDir = path.join(__dirname, 'output')
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

const csvHeader = 'exemplarId,exemplarText,questionId,questionText,score,matchedKeywords'
const csvRows = candidates.map(c => {
  const eText = c.exemplarText.replace(/,/g, '，')
  const qText = c.questionText.replace(/,/g, '，')
  const keywords = c.matchedKeywords.join(';')
  return `${c.exemplarId},${eText},${c.questionId},${qText},${c.score},${keywords}`
})

const csvPath = path.join(outputDir, 'mapping-gap-candidates.csv')
fs.writeFileSync(csvPath, [csvHeader, ...csvRows].join('\n'), 'utf-8')

console.log(`\n📊 候補ペア: ${candidates.length}件（閾値${threshold}以上）`)
console.log(`📝 CSV出力: ${csvPath}`)

// 例示別サマリー
const byExemplar = new Map<string, number>()
for (const c of candidates) {
  byExemplar.set(c.exemplarId, (byExemplar.get(c.exemplarId) || 0) + 1)
}
console.log(`\n📋 例示別候補数 TOP10:`)
const topExemplars = [...byExemplar.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
for (const [id, count] of topExemplars) {
  console.log(`   ${id}: ${count}件`)
}
```

- [ ] **Step 2: 実行**

```bash
npx tsx scripts/detect-mapping-gaps.ts
```

Expected: `scripts/output/mapping-gap-candidates.csv` が生成される。

- [ ] **Step 3: コミット**

```bash
git add scripts/detect-mapping-gaps.ts
git commit -m "feat: マッピング漏れ検出スクリプト（セクション3）"
```

> **🔴 レビューゲート**: CSV候補を確認し、ユーザーが承認したペアを `question-exemplar-map.ts` に追加。

---

## Task 8: Stats再計算（セクション1再実行）

> セクション2の分割 + セクション3のマッピング追加が完了した後に実行する。

- [ ] **Step 1: バリデータ→Stats再計算**

```bash
npx tsx scripts/validate-data-integrity.ts && npx tsx scripts/compute-exemplar-stats.ts
```

Expected: 更新されたマッピングで統計が再計算される。分割後のサブ例示が含まれる。

- [ ] **Step 2: CSV差分を確認**

旧CSVとの差分を確認（分割例示のIDが変わっている、未使用例示が減っている等）

- [ ] **Step 3: コミット**

```bash
git add src/data/exemplar-stats.ts scripts/output/exemplar-stats.csv
git commit -m "feat: ExemplarStats 再計算（分割+漏れ修正反映）"
```

---

## Task 9: ヒートマップデータ生成（セクション4）

**Files:**
- Create: `scripts/generate-heatmap-data.ts`
- Create: `src/data/heatmap-data.ts`

- [ ] **Step 1: ヒートマップ生成スクリプトを実装**

`scripts/generate-heatmap-data.ts`:

```typescript
/**
 * ヒートマップデータ生成（セクション4）
 * - 科目×例示×年度の3次元データ
 * - CSV（探索用）とTS定数（アプリ用）を出力
 *
 * Usage: npx tsx scripts/generate-heatmap-data.ts
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { EXEMPLARS } from '../src/data/exemplars'
import { QUESTION_EXEMPLAR_MAP } from '../src/data/question-exemplar-map'
import { ALL_QUESTIONS } from '../src/data/all-questions'
import type { QuestionSubject } from '../src/types/question'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface HeatmapCell {
  subject: QuestionSubject
  exemplarId: string
  year: number
  count: number
  primaryCount: number
}

// questionId → year のMap
const questionYearMap = new Map<string, number>()
for (const q of ALL_QUESTIONS) {
  questionYearMap.set(q.id, q.year)
}

const exemplarMap = new Map(EXEMPLARS.map(e => [e.id, e]))
const years = [...new Set(ALL_QUESTIONS.map(q => q.year))].sort()

// 集計: exemplarId-year → { count, primaryCount }
const cellMap = new Map<string, { count: number; primaryCount: number }>()

for (const m of QUESTION_EXEMPLAR_MAP) {
  const year = questionYearMap.get(m.questionId)
  if (year === undefined) continue

  const key = `${m.exemplarId}|${year}`
  const cell = cellMap.get(key) || { count: 0, primaryCount: 0 }
  cell.count++
  if (m.isPrimary) cell.primaryCount++
  cellMap.set(key, cell)
}

// HeatmapCell[] に変換
const cells: HeatmapCell[] = []
for (const [key, val] of cellMap) {
  const [exemplarId, yearStr] = key.split('|')
  const exemplar = exemplarMap.get(exemplarId)
  if (!exemplar) continue
  cells.push({
    subject: exemplar.subject,
    exemplarId,
    year: parseInt(yearStr),
    count: val.count,
    primaryCount: val.primaryCount,
  })
}

// CSV 1: 科目×年度
const outputDir = path.join(__dirname, 'output')
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

const subjects = [...new Set(EXEMPLARS.map(e => e.subject))].sort()
const subjectYearHeader = ['subject', ...years.map(y => `Y${y}`)].join(',')
const subjectYearRows = subjects.map(s => {
  const counts = years.map(y => {
    return cells.filter(c => c.subject === s && c.year === y).reduce((sum, c) => sum + c.count, 0)
  })
  return [s, ...counts].join(',')
})
fs.writeFileSync(
  path.join(outputDir, 'heatmap-subject-year.csv'),
  [subjectYearHeader, ...subjectYearRows].join('\n'),
  'utf-8',
)

// CSV 2: 例示×年度
const exemplarYearHeader = ['exemplarId', 'subject', 'text', ...years.map(y => `Y${y}`), 'total'].join(',')
const exemplarYearRows = EXEMPLARS.map(e => {
  const counts = years.map(y => {
    const cell = cells.find(c => c.exemplarId === e.id && c.year === y)
    return cell ? cell.count : 0
  })
  const total = counts.reduce((a, b) => a + b, 0)
  const text = e.text.replace(/,/g, '，').slice(0, 40)
  return [e.id, e.subject, text, ...counts, total].join(',')
})
fs.writeFileSync(
  path.join(outputDir, 'heatmap-exemplar-year.csv'),
  [exemplarYearHeader, ...exemplarYearRows].join('\n'),
  'utf-8',
)

// TS定数
const tsContent = `// ヒートマップデータ（自動生成: generate-heatmap-data.ts）
// 生成日: ${new Date().toISOString().split('T')[0]}
// cells のみ永続化。bySubjectYear / byExemplarYear はランタイムで計算する。

import type { QuestionSubject } from '../types/question'

export interface HeatmapCell {
  subject: QuestionSubject
  exemplarId: string
  year: number
  count: number
  primaryCount: number
}

export const HEATMAP_CELLS: HeatmapCell[] = ${JSON.stringify(cells, null, 2)}
`
const tsPath = path.join(__dirname, '..', 'src', 'data', 'heatmap-data.ts')
fs.writeFileSync(tsPath, tsContent, 'utf-8')

console.log(`📊 ヒートマップデータ生成完了`)
console.log(`   科目×年度CSV: scripts/output/heatmap-subject-year.csv`)
console.log(`   例示×年度CSV: scripts/output/heatmap-exemplar-year.csv`)
console.log(`   TS定数: src/data/heatmap-data.ts`)
console.log(`   セル数: ${cells.length}`)
```

- [ ] **Step 2: 実行**

```bash
npx tsx scripts/generate-heatmap-data.ts
```

Expected: 2つのCSVと1つのTS定数が生成される。

- [ ] **Step 3: ビルド確認**

Run: `npx tsc -b --noEmit`
Expected: エラーなし

- [ ] **Step 4: CSV を目視確認**

`heatmap-subject-year.csv`: 9科目×12年度のクロス集計が正しいか
`heatmap-exemplar-year.csv`: 上位例示の年度別出題数が ExemplarStats と一致するか

- [ ] **Step 5: コミット**

```bash
git add scripts/generate-heatmap-data.ts src/data/heatmap-data.ts scripts/output/heatmap-subject-year.csv scripts/output/heatmap-exemplar-year.csv
git commit -m "feat: ヒートマップデータ生成スクリプト（セクション4）"
```

---

## Task 10: 最終検証 + Codex レビュー

- [ ] **Step 1: 全テスト実行**

```bash
npm test
```

Expected: ALL PASS

- [ ] **Step 2: バリデータ実行**

```bash
npx tsx scripts/validate-data-integrity.ts
```

Expected: 全チェック通過

- [ ] **Step 3: ビルド確認**

```bash
npx tsc -b --noEmit
```

Expected: エラーなし

- [ ] **Step 4: Codex CLI でコードレビュー**

```bash
codex review --base <task0のコミットSHA>
```

Expected: GPT-5.4 によるレビュー結果。critical/major があれば対応。

- [ ] **Step 5: ダミーテスト（setup.test.ts）を削除**

```bash
rm scripts/lib/__tests__/setup.test.ts
git add -u && git commit -m "chore: ダミーテストを削除"
```
