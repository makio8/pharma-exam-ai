# テキストカード生成パイプライン 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** exemplar-stats.ts から出題4回以上のexemplarをフィルタし、過去問+付箋を集約してClaude Opus 4.6でknowledge atomを抽出、FlashCardTemplate[] JSONとして出力する

**Architecture:** 3層構成 — (1) 純粋関数のフィルタ+集約コア（テスト可能）、(2) Claude API呼び出しのバッチ生成スクリプト、(3) 自動バリデーション+Codex相互検証。既存の `src/data/` と `scripts/lib/` パターンを踏襲

**Tech Stack:** TypeScript 5.9, Anthropic SDK 0.79.0, Vitest, tsx (scripts runner)

**設計spec:** `docs/superpowers/specs/2026-03-31-flashcard-design-spec.md`

---

## ファイル構成

```
src/types/
  flashcard-template.ts        # 修正: KnowledgeType追加、CardFormat拡張、FlashCardTemplate拡張
  knowledge-atom.ts            # 新規: KnowledgeAtom型（中間表現）

scripts/lib/
  card-pipeline-core.ts        # 新規: フィルタ+集約の純粋関数
  card-pipeline-types.ts       # 新規: パイプライン内部型（ExemplarContext等）
  card-generation-prompt.ts    # 新規: Claude APIプロンプトテンプレート
  card-validator.ts            # 新規: 生成カードの自動バリデーション
  __tests__/
    card-pipeline-core.test.ts # 新規: フィルタ+集約テスト
    card-validator.test.ts     # 新規: バリデーションテスト

scripts/
  generate-text-cards.ts       # 新規: メインパイプラインスクリプト（CLI）

src/data/
  generated-cards/             # 新規: 科目別JSON出力ディレクトリ
    pharmacology.json          # 薬理
    hygiene.json               # 衛生
    ...（9科目）
  generated-cards.ts           # 新規: 科目別JSONのローダー（dynamic import）
```

---

### Task 1: 型拡張（KnowledgeType + CardFormat + FlashCardTemplate）

**Files:**
- Modify: `src/types/flashcard-template.ts`
- Create: `src/types/knowledge-atom.ts`

- [ ] **Step 1: KnowledgeType と CardFormat を flashcard-template.ts に追加**

```typescript
// src/types/flashcard-template.ts の先頭（import の後）に追加

/** 知識の種別（knowledge atomの分類） */
export type KnowledgeType =
  | 'mechanism'        // 作用機序
  | 'classification'   // 分類
  | 'adverse_effect'   // 副作用
  | 'pharmacokinetics' // 薬物動態
  | 'interaction'      // 相互作用
  | 'indication'       // 適応
  | 'contraindication' // 禁忌
  | 'structure'        // 構造式
  | 'calculation'      // 計算
  | 'regulation'       // 法規
  | 'mnemonic'         // 語呂合わせ

/** 難易度ティア */
export type DifficultyTier = 'basic' | 'applied' | 'integrated'

/** カードのコンテンツ種別 */
export type ContentType = 'text' | 'image' | 'image_text'
```

既存の `CardFormat` 型を拡張:

```typescript
// 既存の CardFormat を置き換え
export type CardFormat =
  | 'term_definition'
  | 'question_answer'
  | 'mnemonic'
  | 'cloze'
  | 'comparison'
  | 'structural_identification'
  | 'structural_features'
  | 'structural_pattern'
  | 'structure_activity'
  | 'structural_comparison'
```

`CARD_FORMAT_CONFIG` に新フォーマットを追加:

```typescript
export const CARD_FORMAT_CONFIG: Record<CardFormat, { label: string; emoji: string; frontLabel: string; backLabel: string }> = {
  term_definition: { label: '用語↔定義', emoji: '📖', frontLabel: '用語', backLabel: '定義' },
  question_answer: { label: '問い↔答え', emoji: '❓', frontLabel: '問い', backLabel: '答え' },
  mnemonic: { label: '語呂↔対象', emoji: '🎵', frontLabel: '語呂合わせ', backLabel: '覚える内容' },
  cloze: { label: '穴埋め', emoji: '🔲', frontLabel: '文（穴あき）', backLabel: '答え' },
  comparison: { label: '比較・弁別', emoji: '⚖️', frontLabel: '比較問い', backLabel: '違い' },
  structural_identification: { label: '構造式→名前', emoji: '🔬', frontLabel: '構造式', backLabel: '物質名' },
  structural_features: { label: '名前→構造特徴', emoji: '🧬', frontLabel: '物質名', backLabel: '構造的特徴' },
  structural_pattern: { label: '部分構造→分類', emoji: '🧩', frontLabel: '部分構造', backLabel: '分類' },
  structure_activity: { label: '構造→薬理作用', emoji: '💊', frontLabel: '構造', backLabel: '薬理作用' },
  structural_comparison: { label: '構造比較', emoji: '🔄', frontLabel: '2つの構造', backLabel: '違い' },
}
```

- [ ] **Step 2: FlashCardTemplate に新規フィールドを追加（optional）**

既存の `FlashCardTemplate` interface を以下に置き換え:

```typescript
/** 暗記カードテンプレート（公式コンテンツ） */
export interface FlashCardTemplate {
  // 既存（必須）
  id: string                      // 'fct-001' or 'ex-pharmacology-067d-mechanism-drug_to_mech'
  source_type: 'fusen' | 'explanation' | 'knowledge_atom'
  source_id: string               // 付箋ID or 問題ID or knowledge_atom_id
  primary_exemplar_id: string     // Exemplarハブへの接続点
  subject: QuestionSubject
  front: string                   // 表面（問い）
  back: string                    // 裏面（答え）
  format: CardFormat
  tags: string[]

  // 新規（AI生成カード用、既存サンプルにはないのでoptional）
  knowledge_atom_id?: string
  knowledge_type?: KnowledgeType
  recall_direction?: string       // 'drug_to_mech', 'mech_to_drug' 等
  reverse_of_id?: string          // 逆カードのID
  difficulty_tier?: DifficultyTier
  content_type?: ContentType
  media_url?: string
  smiles?: string
  generation_model?: string       // 'claude-opus-4-6' 等
  confidence_score?: number       // 0.0-1.0
  source_question_ids?: string[]  // 根拠となる過去問ID群
  source_note_ids?: string[]      // 根拠となる付箋ID群
}
```

- [ ] **Step 3: KnowledgeAtom 中間型を作成**

```typescript
// src/types/knowledge-atom.ts
import type { KnowledgeType, DifficultyTier, CardFormat } from './flashcard-template'
import type { QuestionSubject } from './question'

/** Knowledge Atom（知識原子）— exemplarから抽出された最小知識単位 */
export interface KnowledgeAtom {
  id: string                      // 'ex-pharmacology-067d-mechanism-001'
  exemplar_id: string
  subject: QuestionSubject
  knowledge_type: KnowledgeType
  difficulty_tier: DifficultyTier
  description: string             // atomの説明（人間が読むサマリー）
  source_question_ids: string[]   // このatomの根拠となる過去問
  source_note_ids: string[]       // 関連する付箋
  cards: KnowledgeAtomCard[]      // このatomから生成するカード群
}

/** KnowledgeAtomから生成する個別カード */
export interface KnowledgeAtomCard {
  recall_direction: string        // 'drug_to_mech', 'definition_to_term' 等
  format: CardFormat
  front: string
  back: string
  confidence_score: number        // AIの自信度 0.0-1.0
}
```

- [ ] **Step 4: 型チェックを実行**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsc --noEmit`
Expected: PASS（既存コードはoptionalフィールドの影響を受けない）

- [ ] **Step 5: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add src/types/flashcard-template.ts src/types/knowledge-atom.ts
git commit -m "feat: FlashCardTemplate型拡張 — KnowledgeType, CardFormat追加, AI生成カード用フィールド"
```

---

### Task 2: パイプライン内部型の定義

**Files:**
- Create: `scripts/lib/card-pipeline-types.ts`

- [ ] **Step 1: パイプライン内部型を定義**

```typescript
// scripts/lib/card-pipeline-types.ts
import type { QuestionSubject } from '../../src/types/question'
import type { ExemplarStats } from '../../src/types/blueprint'
import type { KnowledgeAtom } from '../../src/types/knowledge-atom'

/** フィルタリングティア（出題頻度グループ） */
export type FrequencyTier = 'frequent' | 'regular' | 'selective'

/** ティアごとの設定 */
export const TIER_CONFIG: Record<FrequencyTier, { minYears: number; maxYears: number; maxAtoms: number }> = {
  frequent:  { minYears: 6, maxYears: Infinity, maxAtoms: 15 },
  regular:   { minYears: 4, maxYears: 5,        maxAtoms: 8 },
  selective: { minYears: 2, maxYears: 3,        maxAtoms: 3 },
}

/** exemplarに紐づく過去問+付箋のコンテキスト */
export interface ExemplarContext {
  exemplarId: string
  subject: QuestionSubject
  exemplarText: string            // exemplarの説明文
  tier: FrequencyTier
  maxAtoms: number
  questions: QuestionSummary[]    // 紐づく過去問
  notes: NoteSummary[]            // 紐づく付箋
}

/** 過去問の要約（Claude送信用） */
export interface QuestionSummary {
  id: string
  year: number
  questionText: string
  choices: string[]               // '1. テキスト' 形式
  correctAnswer: number | number[]
  explanation: string
  isPrimary: boolean
}

/** 付箋の要約（Claude送信用） */
export interface NoteSummary {
  id: string
  title: string
  textSummary: string
  noteType?: string
}

/** Claude APIからの生成結果（1 exemplar分） */
export interface GenerationResult {
  exemplarId: string
  atoms: KnowledgeAtom[]
  rawResponse: string             // デバッグ用の生レスポンス
  tokenUsage: { input: number; output: number }
}

/** パイプライン全体の進捗 */
export interface PipelineProgress {
  total: number
  completed: number
  failed: string[]                // 失敗したexemplarId
  skipped: string[]               // 既存カードでスキップ
}
```

- [ ] **Step 2: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add scripts/lib/card-pipeline-types.ts
git commit -m "feat: テキストカードパイプライン内部型定義"
```

---

### Task 3: フィルタ+集約コアロジック（純粋関数）

**Files:**
- Create: `scripts/lib/card-pipeline-core.ts`
- Create: `scripts/lib/__tests__/card-pipeline-core.test.ts`

- [ ] **Step 1: テストを先に書く**

```typescript
// scripts/lib/__tests__/card-pipeline-core.test.ts
import { describe, it, expect } from 'vitest'
import {
  filterTargetExemplars,
  classifyTier,
  buildExemplarContext,
} from '../card-pipeline-core'
import type { ExemplarStats, Exemplar, QuestionExemplarMapping } from '../../../src/types/blueprint'
import type { Question } from '../../../src/types/question'
import type { OfficialNote } from '../../../src/types/official-note'

// --- テストデータ ---

const makeStats = (id: string, years: number): ExemplarStats => ({
  exemplarId: id,
  subject: '薬理',
  yearsAppeared: years,
  totalQuestions: years * 3,
  yearDetails: Array.from({ length: years }, (_, i) => ({ year: 100 + i, count: 3 })),
  primaryQuestions: years * 2,
  secondaryQuestions: years,
  primaryYearsAppeared: years,
  linkedGroupCount: years * 2,
  avgQuestionsPerYear: 3,
})

const allStats: ExemplarStats[] = [
  makeStats('ex-pharm-001', 8),   // frequent (6+)
  makeStats('ex-pharm-002', 5),   // regular (4-5)
  makeStats('ex-pharm-003', 4),   // regular (4-5)
  makeStats('ex-pharm-004', 3),   // selective (2-3)
  makeStats('ex-pharm-005', 1),   // excluded
  makeStats('ex-pharm-006', 0),   // excluded
]

// --- classifyTier ---

describe('classifyTier', () => {
  it('6回以上 → frequent', () => {
    expect(classifyTier(8)).toBe('frequent')
    expect(classifyTier(6)).toBe('frequent')
  })
  it('4-5回 → regular', () => {
    expect(classifyTier(5)).toBe('regular')
    expect(classifyTier(4)).toBe('regular')
  })
  it('2-3回 → selective', () => {
    expect(classifyTier(3)).toBe('selective')
    expect(classifyTier(2)).toBe('selective')
  })
  it('0-1回 → null（対象外）', () => {
    expect(classifyTier(1)).toBeNull()
    expect(classifyTier(0)).toBeNull()
  })
})

// --- filterTargetExemplars ---

describe('filterTargetExemplars', () => {
  it('4回以上のexemplarのみ返す（デフォルト: minYears=4）', () => {
    const result = filterTargetExemplars(allStats)
    expect(result).toHaveLength(3)
    expect(result.map(r => r.exemplarId)).toEqual([
      'ex-pharm-001', 'ex-pharm-002', 'ex-pharm-003',
    ])
  })

  it('minYears=2 で2回以上を含める', () => {
    const result = filterTargetExemplars(allStats, { minYears: 2 })
    expect(result).toHaveLength(4)
  })

  it('結果にtierとmaxAtomsが付与される', () => {
    const result = filterTargetExemplars(allStats)
    const frequent = result.find(r => r.exemplarId === 'ex-pharm-001')!
    expect(frequent.tier).toBe('frequent')
    expect(frequent.maxAtoms).toBe(15)

    const regular = result.find(r => r.exemplarId === 'ex-pharm-002')!
    expect(regular.tier).toBe('regular')
    expect(regular.maxAtoms).toBe(8)
  })
})

// --- buildExemplarContext ---

describe('buildExemplarContext', () => {
  const exemplars: Exemplar[] = [
    { id: 'ex-pharm-001', minorCategory: 'テスト', middleCategoryId: 'topic-1', subject: '薬理', text: 'テスト説明文' },
  ]

  const mappings: QuestionExemplarMapping[] = [
    { questionId: 'r100-026', exemplarId: 'ex-pharm-001', isPrimary: true },
    { questionId: 'r101-030', exemplarId: 'ex-pharm-001', isPrimary: false },
  ]

  const questions: Question[] = [
    {
      id: 'r100-026', year: 100, question_number: 26, section: '必須',
      subject: '薬理', category: 'テスト', question_text: '問題文A',
      choices: [{ key: 1, text: '選択肢1' }, { key: 2, text: '選択肢2' }],
      correct_answer: 1, explanation: '解説A', tags: [],
    },
    {
      id: 'r101-030', year: 101, question_number: 30, section: '理論',
      subject: '薬理', category: 'テスト', question_text: '問題文B',
      choices: [{ key: 1, text: '選択肢X' }],
      correct_answer: 1, explanation: '解説B', tags: [],
    },
  ]

  const notes: OfficialNote[] = [
    {
      id: 'fusen-0100', title: 'テスト付箋', imageUrl: '/img.png',
      textSummary: 'サマリーテキスト', subject: '薬理', topicId: 'topic-1',
      tags: [], primaryExemplarIds: ['ex-pharm-001'], secondaryExemplarIds: [],
      importance: 3, tier: 'premium',
    },
  ]

  it('exemplarに紐づく過去問と付箋をまとめる', () => {
    const ctx = buildExemplarContext(
      'ex-pharm-001', 'frequent', 15,
      exemplars, mappings, questions, notes,
    )
    expect(ctx.exemplarId).toBe('ex-pharm-001')
    expect(ctx.subject).toBe('薬理')
    expect(ctx.exemplarText).toBe('テスト説明文')
    expect(ctx.questions).toHaveLength(2)
    expect(ctx.questions[0].id).toBe('r100-026')
    expect(ctx.questions[0].isPrimary).toBe(true)
    expect(ctx.questions[1].isPrimary).toBe(false)
    expect(ctx.notes).toHaveLength(1)
    expect(ctx.notes[0].id).toBe('fusen-0100')
  })

  it('紐づく過去問がないexemplarでも空配列で返す', () => {
    const ctx = buildExemplarContext(
      'ex-pharm-999', 'regular', 8,
      exemplars, [], questions, notes,
    )
    expect(ctx.questions).toHaveLength(0)
  })
})
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx vitest run scripts/lib/__tests__/card-pipeline-core.test.ts`
Expected: FAIL（モジュールが存在しない）

- [ ] **Step 3: コアロジックを実装**

```typescript
// scripts/lib/card-pipeline-core.ts
import type { ExemplarStats, Exemplar, QuestionExemplarMapping } from '../../src/types/blueprint'
import type { Question } from '../../src/types/question'
import type { OfficialNote } from '../../src/types/official-note'
import type {
  FrequencyTier,
  ExemplarContext,
  QuestionSummary,
  NoteSummary,
} from './card-pipeline-types'
import { TIER_CONFIG } from './card-pipeline-types'

/** 出題年数からティアを判定。1回以下はnull（対象外） */
export function classifyTier(yearsAppeared: number): FrequencyTier | null {
  if (yearsAppeared >= 6) return 'frequent'
  if (yearsAppeared >= 4) return 'regular'
  if (yearsAppeared >= 2) return 'selective'
  return null
}

/** フィルタ結果の型 */
export interface FilteredExemplar {
  exemplarId: string
  subject: string
  yearsAppeared: number
  tier: FrequencyTier
  maxAtoms: number
}

/** exemplar-statsから対象をフィルタ */
export function filterTargetExemplars(
  stats: ExemplarStats[],
  options: { minYears?: number } = {},
): FilteredExemplar[] {
  const minYears = options.minYears ?? 4

  return stats
    .filter(s => s.yearsAppeared >= minYears)
    .map(s => {
      const tier = classifyTier(s.yearsAppeared)!
      return {
        exemplarId: s.exemplarId,
        subject: s.subject,
        yearsAppeared: s.yearsAppeared,
        tier,
        maxAtoms: TIER_CONFIG[tier].maxAtoms,
      }
    })
}

/** 1つのexemplarに紐づく過去問+付箋をまとめてコンテキスト化 */
export function buildExemplarContext(
  exemplarId: string,
  tier: FrequencyTier,
  maxAtoms: number,
  exemplars: Exemplar[],
  mappings: QuestionExemplarMapping[],
  questions: Question[],
  notes: OfficialNote[],
): ExemplarContext {
  const exemplar = exemplars.find(e => e.id === exemplarId)
  const questionMap = new Map(questions.map(q => [q.id, q]))

  // このexemplarに紐づく過去問を取得
  const relatedMappings = mappings.filter(m => m.exemplarId === exemplarId)
  const questionSummaries: QuestionSummary[] = relatedMappings
    .map(m => {
      const q = questionMap.get(m.questionId)
      if (!q) return null
      return {
        id: q.id,
        year: q.year,
        questionText: q.question_text,
        choices: q.choices.map(c => `${c.key}. ${c.text}`),
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        isPrimary: m.isPrimary,
      }
    })
    .filter((s): s is QuestionSummary => s !== null)
    .sort((a, b) => a.year - b.year)

  // このexemplarに紐づく付箋を取得
  const noteSummaries: NoteSummary[] = notes
    .filter(n =>
      n.primaryExemplarIds.includes(exemplarId) ||
      n.secondaryExemplarIds.includes(exemplarId),
    )
    .map(n => ({
      id: n.id,
      title: n.title,
      textSummary: n.textSummary,
      noteType: n.noteType,
    }))

  return {
    exemplarId,
    subject: exemplar?.subject ?? '薬理',
    exemplarText: exemplar?.text ?? '',
    tier,
    maxAtoms,
    questions: questionSummaries,
    notes: noteSummaries,
  }
}

/** ExemplarContextをClaudeに送るドキュメント文字列に変換 */
export function formatContextForPrompt(ctx: ExemplarContext): string {
  const lines: string[] = []

  lines.push(`## Exemplar: ${ctx.exemplarId}`)
  lines.push(`科目: ${ctx.subject}`)
  lines.push(`出題基準: ${ctx.exemplarText}`)
  lines.push(`出題頻度ティア: ${ctx.tier}（最大${ctx.maxAtoms}個のknowledge atom）`)
  lines.push('')

  if (ctx.questions.length > 0) {
    lines.push(`### 過去問（${ctx.questions.length}問）`)
    for (const q of ctx.questions) {
      lines.push(`#### ${q.id}（第${q.year}回）${q.isPrimary ? '[Primary]' : '[Secondary]'}`)
      lines.push(q.questionText)
      lines.push(q.choices.join('\n'))
      lines.push(`正答: ${Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}`)
      lines.push(`解説: ${q.explanation}`)
      lines.push('')
    }
  }

  if (ctx.notes.length > 0) {
    lines.push(`### 付箋メモ（${ctx.notes.length}枚）`)
    for (const n of ctx.notes) {
      lines.push(`- [${n.id}] ${n.title}: ${n.textSummary}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx vitest run scripts/lib/__tests__/card-pipeline-core.test.ts`
Expected: PASS（全テスト通過）

- [ ] **Step 5: formatContextForPrompt のテストを追加**

```typescript
// card-pipeline-core.test.ts に追記

describe('formatContextForPrompt', () => {
  it('exemplar情報+過去問+付箋をテキスト化', () => {
    const ctx: ExemplarContext = {
      exemplarId: 'ex-pharm-001',
      subject: '薬理',
      exemplarText: 'β遮断薬の薬理作用を説明できる。',
      tier: 'frequent',
      maxAtoms: 15,
      questions: [
        {
          id: 'r100-026', year: 100, questionText: 'β遮断薬について正しいのは？',
          choices: ['1. 気管支拡張', '2. 心拍数低下'],
          correctAnswer: 2, explanation: '解説テキスト', isPrimary: true,
        },
      ],
      notes: [
        { id: 'fusen-0100', title: 'β遮断薬まとめ', textSummary: 'プロプラノロール...' },
      ],
    }

    const text = formatContextForPrompt(ctx)
    expect(text).toContain('ex-pharm-001')
    expect(text).toContain('β遮断薬の薬理作用')
    expect(text).toContain('r100-026')
    expect(text).toContain('[Primary]')
    expect(text).toContain('fusen-0100')
    expect(text).toContain('最大15個')
  })

  it('過去問0件でもエラーにならない', () => {
    const ctx: ExemplarContext = {
      exemplarId: 'ex-pharm-002', subject: '薬理', exemplarText: 'テスト',
      tier: 'regular', maxAtoms: 8, questions: [], notes: [],
    }
    const text = formatContextForPrompt(ctx)
    expect(text).toContain('ex-pharm-002')
    expect(text).not.toContain('### 過去問')
  })
})
```

- [ ] **Step 6: テスト実行**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx vitest run scripts/lib/__tests__/card-pipeline-core.test.ts`
Expected: PASS

- [ ] **Step 7: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add scripts/lib/card-pipeline-core.ts scripts/lib/__tests__/card-pipeline-core.test.ts
git commit -m "feat: カードパイプライン コアロジック — exemplarフィルタ+過去問集約"
```

---

### Task 4: Claude APIプロンプトテンプレート

**Files:**
- Create: `scripts/lib/card-generation-prompt.ts`

- [ ] **Step 1: プロンプトテンプレートを作成**

```typescript
// scripts/lib/card-generation-prompt.ts

import type { ExemplarContext } from './card-pipeline-types'
import { formatContextForPrompt } from './card-pipeline-core'

/** Claude APIに送るシステムプロンプト */
export const SYSTEM_PROMPT = `あなたは薬剤師国家試験の学習カード（フラッシュカード）を生成する専門家です。

## 役割
与えられた「出題基準（exemplar）」と「過去問+解説+付箋」から、暗記カード用のknowledge atom（知識原子）を抽出してください。

## Knowledge Atomの原則
1. 1 atom = 1つの「想起テスト」（1枚のカードで問う最小知識単位）
2. 過去問で実際に問われた角度でatomを切る（過去問で問われていない知識はatom化しない）
3. 「これを覚えたら、この過去問が解ける」を明確にする
4. 各atomにsource_question_ids（根拠となる過去問ID）を紐づける

## Knowledge Type（分類）
mechanism（作用機序）, classification（分類）, adverse_effect（副作用）, pharmacokinetics（薬物動態）, interaction（相互作用）, indication（適応）, contraindication（禁忌）, structure（構造式）, calculation（計算）, regulation（法規）, mnemonic（語呂合わせ）

## カードフォーマット（Phase 1 で使えるもの）
- cloze: 穴埋め形式。「アムロジピンは{{c1::L型Caチャネル}}を遮断する」
- question_answer: 因果Q&A。「ワルファリンの抗凝固機序は？」→「ビタミンK依存性凝固因子の合成阻害」
- term_definition: 用語↔定義。基礎用語向け
- comparison: 弁別（比較）。「ACE阻害薬 vs ARB：空咳が起きるのは？」→「ACE阻害薬（ブラジキニン分解抑制）」

## 難易度ティア
- basic: 基礎（1つの事実を想起）
- applied: 応用（因果関係や比較を含む）
- integrated: 統合（複数知識の組み合わせ）

## カード生成ルール
1. 1つのatomから**正方向**と**逆方向**の2枚のカードを作ることを推奨（例: 薬→機序 / 機序→薬）
2. recall_directionは一意にする（例: drug_to_mech / mech_to_drug）
3. confidence_scoreは0.0-1.0で自分の確信度を付ける（不確実な知識は0.5以下）
4. 選択肢形式（○×）は使わない（再認＜再生のため）
5. cloze形式では{{c1::答え}}のように穴を示す

## 出力フォーマット（JSON）
\`\`\`json
{
  "atoms": [
    {
      "id": "<exemplar_id>-<knowledge_type>-<連番3桁>",
      "knowledge_type": "mechanism",
      "difficulty_tier": "basic",
      "description": "このatomの説明（日本語、1行）",
      "source_question_ids": ["r100-026", "r105-030"],
      "source_note_ids": ["fusen-0100"],
      "cards": [
        {
          "recall_direction": "drug_to_mech",
          "format": "question_answer",
          "front": "プロプラノロールの主な作用機序は？",
          "back": "β1/β2受容体の非選択的遮断 → 心拍数低下・気管支収縮",
          "confidence_score": 0.95
        },
        {
          "recall_direction": "mech_to_drug",
          "format": "question_answer",
          "front": "β1/β2受容体を非選択的に遮断する代表薬は？",
          "back": "プロプラノロール",
          "confidence_score": 0.95
        }
      ]
    }
  ]
}
\`\`\`

## 注意事項
- 指定された最大atom数を超えないこと
- 医薬品名・用量は正確に（不確かな場合はconfidence_scoreを下げる）
- 禁忌・用量カードはconfidence_score 0.7以下にして人間レビュー対象にする
- 語呂合わせは付箋に含まれている場合のみ（自作しない）
`

/** 1 exemplar分のユーザープロンプトを生成 */
export function buildUserPrompt(ctx: ExemplarContext): string {
  const contextText = formatContextForPrompt(ctx)

  return `以下のexemplarからknowledge atomを抽出し、暗記カードを生成してください。

${contextText}

最大atom数: ${ctx.maxAtoms}個
JSONのみを出力してください（説明文不要）。`
}
```

- [ ] **Step 2: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add scripts/lib/card-generation-prompt.ts
git commit -m "feat: カード生成Claudeプロンプトテンプレート"
```

---

### Task 5: 生成カードバリデーター

**Files:**
- Create: `scripts/lib/card-validator.ts`
- Create: `scripts/lib/__tests__/card-validator.test.ts`

- [ ] **Step 1: テストを先に書く**

```typescript
// scripts/lib/__tests__/card-validator.test.ts
import { describe, it, expect } from 'vitest'
import { validateAtom, validateCard, type ValidationError } from '../card-validator'
import type { KnowledgeAtom, KnowledgeAtomCard } from '../../../src/types/knowledge-atom'

const validCard: KnowledgeAtomCard = {
  recall_direction: 'drug_to_mech',
  format: 'question_answer',
  front: 'プロプラノロールの作用機序は？',
  back: 'β1/β2受容体の非選択的遮断',
  confidence_score: 0.9,
}

const validAtom: KnowledgeAtom = {
  id: 'ex-pharm-001-mechanism-001',
  exemplar_id: 'ex-pharm-001',
  subject: '薬理',
  knowledge_type: 'mechanism',
  difficulty_tier: 'basic',
  description: 'β遮断薬の作用機序',
  source_question_ids: ['r100-026'],
  source_note_ids: [],
  cards: [validCard],
}

describe('validateCard', () => {
  it('正常なカードはエラーなし', () => {
    expect(validateCard(validCard, 'ex-pharm-001-mechanism-001')).toEqual([])
  })

  it('frontが空', () => {
    const card = { ...validCard, front: '' }
    const errors = validateCard(card, 'test')
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('EMPTY_FRONT')
  })

  it('backが空', () => {
    const card = { ...validCard, back: '' }
    const errors = validateCard(card, 'test')
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('EMPTY_BACK')
  })

  it('frontが長すぎる（200字超）', () => {
    const card = { ...validCard, front: 'あ'.repeat(201) }
    const errors = validateCard(card, 'test')
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('FRONT_TOO_LONG')
  })

  it('backが長すぎる（500字超）', () => {
    const card = { ...validCard, back: 'あ'.repeat(501) }
    const errors = validateCard(card, 'test')
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('BACK_TOO_LONG')
  })

  it('confidence_scoreが範囲外', () => {
    const card = { ...validCard, confidence_score: 1.5 }
    const errors = validateCard(card, 'test')
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('INVALID_CONFIDENCE')
  })

  it('cloze形式なのに{{c1::}}がない', () => {
    const card = { ...validCard, format: 'cloze' as const, front: '穴がない文' }
    const errors = validateCard(card, 'test')
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('CLOZE_MISSING_PLACEHOLDER')
  })

  it('cloze形式で{{c1::}}がある → OK', () => {
    const card = { ...validCard, format: 'cloze' as const, front: 'アムロジピンは{{c1::L型Caチャネル}}を遮断' }
    expect(validateCard(card, 'test')).toEqual([])
  })

  it('recall_directionが空', () => {
    const card = { ...validCard, recall_direction: '' }
    const errors = validateCard(card, 'test')
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('EMPTY_RECALL_DIRECTION')
  })
})

describe('validateAtom', () => {
  it('正常なatomはエラーなし', () => {
    expect(validateAtom(validAtom)).toEqual([])
  })

  it('source_question_idsが空', () => {
    const atom = { ...validAtom, source_question_ids: [] }
    const errors = validateAtom(atom)
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('NO_SOURCE_QUESTIONS')
  })

  it('cardsが空', () => {
    const atom = { ...validAtom, cards: [] }
    const errors = validateAtom(atom)
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('NO_CARDS')
  })

  it('IDフォーマット不正', () => {
    const atom = { ...validAtom, id: 'bad-id' }
    const errors = validateAtom(atom)
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('INVALID_ATOM_ID')
  })

  it('同一atom内でrecall_direction重複', () => {
    const atom = {
      ...validAtom,
      cards: [validCard, { ...validCard }],
    }
    const errors = validateAtom(atom)
    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('DUPLICATE_RECALL_DIRECTION')
  })
})
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx vitest run scripts/lib/__tests__/card-validator.test.ts`
Expected: FAIL

- [ ] **Step 3: バリデーターを実装**

```typescript
// scripts/lib/card-validator.ts
import type { KnowledgeAtom, KnowledgeAtomCard } from '../../src/types/knowledge-atom'

export interface ValidationError {
  code: string
  message: string
  atomId: string
  severity: 'error' | 'warning'
}

const FRONT_MAX_LENGTH = 200
const BACK_MAX_LENGTH = 500
const CLOZE_PATTERN = /\{\{c\d+::[^}]+\}\}/

/** 1枚のカードをバリデーション */
export function validateCard(card: KnowledgeAtomCard, atomId: string): ValidationError[] {
  const errors: ValidationError[] = []

  if (!card.front || card.front.trim() === '') {
    errors.push({ code: 'EMPTY_FRONT', message: 'frontが空', atomId, severity: 'error' })
  }

  if (!card.back || card.back.trim() === '') {
    errors.push({ code: 'EMPTY_BACK', message: 'backが空', atomId, severity: 'error' })
  }

  if (card.front && card.front.length > FRONT_MAX_LENGTH) {
    errors.push({ code: 'FRONT_TOO_LONG', message: `front ${card.front.length}字 > ${FRONT_MAX_LENGTH}字`, atomId, severity: 'warning' })
  }

  if (card.back && card.back.length > BACK_MAX_LENGTH) {
    errors.push({ code: 'BACK_TOO_LONG', message: `back ${card.back.length}字 > ${BACK_MAX_LENGTH}字`, atomId, severity: 'warning' })
  }

  if (card.confidence_score < 0 || card.confidence_score > 1) {
    errors.push({ code: 'INVALID_CONFIDENCE', message: `confidence ${card.confidence_score} は0-1の範囲外`, atomId, severity: 'error' })
  }

  if (card.format === 'cloze' && card.front && !CLOZE_PATTERN.test(card.front)) {
    errors.push({ code: 'CLOZE_MISSING_PLACEHOLDER', message: 'cloze形式に{{c1::...}}がない', atomId, severity: 'error' })
  }

  if (!card.recall_direction || card.recall_direction.trim() === '') {
    errors.push({ code: 'EMPTY_RECALL_DIRECTION', message: 'recall_directionが空', atomId, severity: 'error' })
  }

  return errors
}

/** 1つのatomをバリデーション */
export function validateAtom(atom: KnowledgeAtom): ValidationError[] {
  const errors: ValidationError[] = []

  // IDフォーマット: exemplar_id-knowledge_type-連番
  const idPattern = /^ex-.+-[a-z_]+-\d{3}$/
  if (!idPattern.test(atom.id)) {
    errors.push({ code: 'INVALID_ATOM_ID', message: `ID "${atom.id}" がフォーマット不正`, atomId: atom.id, severity: 'error' })
  }

  if (atom.source_question_ids.length === 0) {
    errors.push({ code: 'NO_SOURCE_QUESTIONS', message: '根拠となる過去問IDがない', atomId: atom.id, severity: 'error' })
  }

  if (atom.cards.length === 0) {
    errors.push({ code: 'NO_CARDS', message: 'カードが1枚もない', atomId: atom.id, severity: 'error' })
  }

  // 同一atom内のrecall_direction重複チェック
  const directions = atom.cards.map(c => c.recall_direction)
  const uniqueDirections = new Set(directions)
  if (directions.length !== uniqueDirections.size) {
    errors.push({ code: 'DUPLICATE_RECALL_DIRECTION', message: 'recall_directionが重複', atomId: atom.id, severity: 'error' })
  }

  // 各カードのバリデーション
  for (const card of atom.cards) {
    errors.push(...validateCard(card, atom.id))
  }

  return errors
}

/** 全atomをバリデーション（サマリー付き） */
export function validateAllAtoms(atoms: KnowledgeAtom[]): {
  errors: ValidationError[]
  summary: { total: number; withErrors: number; errorCount: number; warningCount: number }
} {
  const allErrors: ValidationError[] = []
  const atomsWithErrors = new Set<string>()

  for (const atom of atoms) {
    const errors = validateAtom(atom)
    if (errors.length > 0) {
      atomsWithErrors.add(atom.id)
      allErrors.push(...errors)
    }
  }

  return {
    errors: allErrors,
    summary: {
      total: atoms.length,
      withErrors: atomsWithErrors.size,
      errorCount: allErrors.filter(e => e.severity === 'error').length,
      warningCount: allErrors.filter(e => e.severity === 'warning').length,
    },
  }
}
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx vitest run scripts/lib/__tests__/card-validator.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add scripts/lib/card-validator.ts scripts/lib/__tests__/card-validator.test.ts
git commit -m "feat: カード生成バリデーター — atom/card品質チェック13ルール"
```

---

### Task 6: メインパイプラインスクリプト（Claude API統合）

**Files:**
- Create: `scripts/generate-text-cards.ts`

- [ ] **Step 1: メインスクリプトを作成**

```typescript
// scripts/generate-text-cards.ts
//
// テキストカード生成パイプライン
// 使い方:
//   npx tsx scripts/generate-text-cards.ts                    # 全対象（~430 exemplar）
//   npx tsx scripts/generate-text-cards.ts --limit 5          # 最初の5件だけ
//   npx tsx scripts/generate-text-cards.ts --exemplar ex-pharmacology-067d  # 1件だけ
//   npx tsx scripts/generate-text-cards.ts --subject 薬理     # 科目フィルタ
//   npx tsx scripts/generate-text-cards.ts --dry-run          # API呼び出しなし（コンテキスト確認）
//   npx tsx scripts/generate-text-cards.ts --resume           # 中断再開（既存JSONをスキップ）
//   npx tsx scripts/generate-text-cards.ts --status           # 進捗確認のみ

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import Anthropic from '@anthropic-ai/sdk'

import { EXEMPLAR_STATS } from '../src/data/exemplar-stats'
import { EXEMPLARS } from '../src/data/exemplars'
import { QUESTION_EXEMPLAR_MAP } from '../src/data/question-exemplar-map'
import { ALL_QUESTIONS } from '../src/data/all-questions'
import { OFFICIAL_NOTES } from '../src/data/official-notes'

import { filterTargetExemplars, buildExemplarContext } from './lib/card-pipeline-core'
import { SYSTEM_PROMPT, buildUserPrompt } from './lib/card-generation-prompt'
import { validateAllAtoms } from './lib/card-validator'
import type { GenerationResult } from './lib/card-pipeline-types'
import type { KnowledgeAtom } from '../src/types/knowledge-atom'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const OUTPUT_DIR = path.join(__dirname, '..', 'scripts', 'output', 'text-cards')
const RATE_LIMIT_MS = 500   // API呼び出し間隔
const MODEL = 'claude-opus-4-6'

// --- CLI引数パース ---
const args = process.argv.slice(2)
const getArg = (name: string): string | undefined => {
  const idx = args.indexOf(`--${name}`)
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined
}
const hasFlag = (name: string): boolean => args.includes(`--${name}`)

const limitArg = getArg('limit')
const exemplarArg = getArg('exemplar')
const subjectArg = getArg('subject')
const dryRun = hasFlag('dry-run')
const resume = hasFlag('resume')
const statusOnly = hasFlag('status')

// --- メイン ---
async function main() {
  // 出力ディレクトリ準備
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  // Step 1: フィルタ
  let targets = filterTargetExemplars(EXEMPLAR_STATS)
  console.log(`対象exemplar: ${targets.length}件（全${EXEMPLAR_STATS.length}件中）`)

  // CLIフィルタ適用
  if (exemplarArg) {
    targets = targets.filter(t => t.exemplarId === exemplarArg)
    if (targets.length === 0) {
      console.error(`exemplar "${exemplarArg}" が対象に含まれません`)
      process.exit(1)
    }
  }
  if (subjectArg) {
    targets = targets.filter(t => t.subject === subjectArg)
    console.log(`科目フィルタ "${subjectArg}": ${targets.length}件`)
  }
  if (limitArg) {
    targets = targets.slice(0, parseInt(limitArg, 10))
    console.log(`limit: ${targets.length}件に制限`)
  }

  // resume: 既存結果をスキップ
  if (resume) {
    const existingIds = new Set(
      fs.readdirSync(OUTPUT_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', '')),
    )
    const before = targets.length
    targets = targets.filter(t => !existingIds.has(t.exemplarId))
    console.log(`resume: ${before - targets.length}件スキップ、残り${targets.length}件`)
  }

  // status: 進捗表示のみ
  if (statusOnly) {
    const existingFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json'))
    const allTargets = filterTargetExemplars(EXEMPLAR_STATS)
    console.log(`完了: ${existingFiles.length} / ${allTargets.length}件`)
    const failedFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.error.json'))
    if (failedFiles.length > 0) {
      console.log(`失敗: ${failedFiles.length}件`)
    }
    return
  }

  if (targets.length === 0) {
    console.log('処理対象なし')
    return
  }

  // Step 2: コンテキスト構築 + API呼び出し
  const client = dryRun ? null : new Anthropic()
  let completed = 0
  let failed = 0

  for (const target of targets) {
    const ctx = buildExemplarContext(
      target.exemplarId,
      target.tier,
      target.maxAtoms,
      EXEMPLARS,
      QUESTION_EXEMPLAR_MAP,
      ALL_QUESTIONS,
      OFFICIAL_NOTES,
    )

    console.log(`[${completed + failed + 1}/${targets.length}] ${target.exemplarId} (${ctx.subject}, ${ctx.questions.length}問, ${ctx.notes.length}付箋)`)

    if (dryRun) {
      // dry-run: プロンプトを出力して終了
      const prompt = buildUserPrompt(ctx)
      const outPath = path.join(OUTPUT_DIR, `${target.exemplarId}.prompt.txt`)
      fs.writeFileSync(outPath, `SYSTEM:\n${SYSTEM_PROMPT}\n\nUSER:\n${prompt}`)
      console.log(`  → プロンプト保存: ${outPath} (${prompt.length}字)`)
      completed++
      continue
    }

    try {
      const userPrompt = buildUserPrompt(ctx)
      const response = await client!.messages.create({
        model: MODEL,
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      })

      const text = response.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('')

      // JSONパース（```json ... ``` を除去）
      const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(jsonText) as { atoms: KnowledgeAtom[] }

      // exemplar_id と subject を補完
      for (const atom of parsed.atoms) {
        atom.exemplar_id = target.exemplarId
        atom.subject = ctx.subject
      }

      // バリデーション
      const validation = validateAllAtoms(parsed.atoms)
      if (validation.summary.errorCount > 0) {
        console.log(`  ⚠️ ${validation.summary.errorCount}件のエラー`)
        for (const err of validation.errors.filter(e => e.severity === 'error')) {
          console.log(`    - [${err.code}] ${err.message}`)
        }
      }

      // 結果保存
      const result: GenerationResult = {
        exemplarId: target.exemplarId,
        atoms: parsed.atoms,
        rawResponse: text,
        tokenUsage: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
      }

      const outPath = path.join(OUTPUT_DIR, `${target.exemplarId}.json`)
      fs.writeFileSync(outPath, JSON.stringify(result, null, 2))

      const cardCount = parsed.atoms.reduce((sum, a) => sum + a.cards.length, 0)
      console.log(`  ✅ ${parsed.atoms.length} atoms, ${cardCount} cards (in:${response.usage.input_tokens} out:${response.usage.output_tokens})`)
      completed++
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error(`  ❌ ${errorMessage}`)
      // エラー記録
      const errorPath = path.join(OUTPUT_DIR, `${target.exemplarId}.error.json`)
      fs.writeFileSync(errorPath, JSON.stringify({ exemplarId: target.exemplarId, error: errorMessage, timestamp: new Date().toISOString() }, null, 2))
      failed++
    }

    // レートリミット
    if (completed + failed < targets.length) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS))
    }
  }

  // サマリー
  console.log('\n=== 完了 ===')
  console.log(`成功: ${completed}件`)
  if (failed > 0) console.log(`失敗: ${failed}件`)
  if (dryRun) console.log('(dry-runモード: API呼び出しなし)')
}

main().catch(err => {
  console.error('致命的エラー:', err)
  process.exit(1)
})
```

- [ ] **Step 2: dry-runで動作確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsx scripts/generate-text-cards.ts --dry-run --limit 3`
Expected: 3件のプロンプトファイルが `scripts/output/text-cards/` に出力される。エラーなし

- [ ] **Step 3: プロンプト品質を目視確認**

Run: `head -100 scripts/output/text-cards/*.prompt.txt` でプロンプト内容を確認
Expected: exemplar情報、過去問テキスト、付箋が正しく集約されている

- [ ] **Step 4: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add scripts/generate-text-cards.ts
git commit -m "feat: テキストカード生成パイプライン — Claude API統合、resume対応"
```

---

### Task 7: 実際のAPI呼び出しテスト（1件）

**Files:**
- None (実行のみ)

- [ ] **Step 1: 1件だけ生成テスト**

最も出題頻度が高いexemplarを1件だけ生成してみる:

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsx scripts/generate-text-cards.ts --exemplar ex-practice-043j --limit 1`
Expected: `scripts/output/text-cards/ex-practice-043j.json` が生成される

- [ ] **Step 2: 生成結果を確認**

Run: 生成されたJSONを読んで、atoms構造・カード品質・confidence_scoreを確認
Expected: 
- atomのIDがフォーマット通り
- source_question_idsに実在の問題IDが入っている
- frontとbackが薬学的に妥当
- confidence_scoreが0.0-1.0の範囲

- [ ] **Step 3: 問題があればプロンプトを調整**

出力品質に問題がある場合:
- `scripts/lib/card-generation-prompt.ts` のSYSTEM_PROMPTを修正
- 再実行して品質改善を確認

- [ ] **Step 4: 5件でバッチテスト**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsx scripts/generate-text-cards.ts --limit 5`
Expected: 5件全て成功、バリデーションエラーが少ない

- [ ] **Step 5: コミット（プロンプト調整があった場合）**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add scripts/lib/card-generation-prompt.ts
git commit -m "fix: カード生成プロンプト品質調整"
```

---

### Task 8: atom→FlashCardTemplate変換 + 科目別JSON出力

**Files:**
- Create: `scripts/lib/atom-to-template.ts`
- Create: `scripts/lib/__tests__/atom-to-template.test.ts`
- Create: `scripts/assemble-card-templates.ts`

- [ ] **Step 1: テストを先に書く**

```typescript
// scripts/lib/__tests__/atom-to-template.test.ts
import { describe, it, expect } from 'vitest'
import { atomToTemplates, generateCardId } from '../atom-to-template'
import type { KnowledgeAtom } from '../../../src/types/knowledge-atom'

const sampleAtom: KnowledgeAtom = {
  id: 'ex-pharm-001-mechanism-001',
  exemplar_id: 'ex-pharm-001',
  subject: '薬理',
  knowledge_type: 'mechanism',
  difficulty_tier: 'basic',
  description: 'β遮断薬の作用機序',
  source_question_ids: ['r100-026'],
  source_note_ids: ['fusen-0100'],
  cards: [
    {
      recall_direction: 'drug_to_mech',
      format: 'question_answer',
      front: 'プロプラノロールの作用機序は？',
      back: 'β1/β2受容体の非選択的遮断',
      confidence_score: 0.95,
    },
    {
      recall_direction: 'mech_to_drug',
      format: 'question_answer',
      front: 'β1/β2受容体を非選択的に遮断する代表薬は？',
      back: 'プロプラノロール',
      confidence_score: 0.9,
    },
  ],
}

describe('generateCardId', () => {
  it('exemplar_id × knowledge_type × recall_direction', () => {
    expect(generateCardId('ex-pharm-001', 'mechanism', 'drug_to_mech'))
      .toBe('ex-pharm-001-mechanism-drug_to_mech')
  })
})

describe('atomToTemplates', () => {
  it('1つのatomから複数のFlashCardTemplateを生成', () => {
    const templates = atomToTemplates(sampleAtom)
    expect(templates).toHaveLength(2)
  })

  it('各テンプレートにID・knowledge_type・recall_directionが設定される', () => {
    const templates = atomToTemplates(sampleAtom)
    const t0 = templates[0]
    expect(t0.id).toBe('ex-pharm-001-mechanism-drug_to_mech')
    expect(t0.knowledge_type).toBe('mechanism')
    expect(t0.recall_direction).toBe('drug_to_mech')
    expect(t0.source_type).toBe('knowledge_atom')
    expect(t0.source_id).toBe('ex-pharm-001-mechanism-001')
    expect(t0.primary_exemplar_id).toBe('ex-pharm-001')
    expect(t0.subject).toBe('薬理')
    expect(t0.generation_model).toBe('claude-opus-4-6')
    expect(t0.source_question_ids).toEqual(['r100-026'])
    expect(t0.source_note_ids).toEqual(['fusen-0100'])
  })

  it('逆カード同士にreverse_of_idが設定される', () => {
    const templates = atomToTemplates(sampleAtom)
    expect(templates[0].reverse_of_id).toBe('ex-pharm-001-mechanism-mech_to_drug')
    expect(templates[1].reverse_of_id).toBe('ex-pharm-001-mechanism-drug_to_mech')
  })

  it('カードが1枚のatomではreverse_of_idはundefined', () => {
    const singleAtom: KnowledgeAtom = {
      ...sampleAtom,
      cards: [sampleAtom.cards[0]],
    }
    const templates = atomToTemplates(singleAtom)
    expect(templates).toHaveLength(1)
    expect(templates[0].reverse_of_id).toBeUndefined()
  })
})
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx vitest run scripts/lib/__tests__/atom-to-template.test.ts`
Expected: FAIL

- [ ] **Step 3: 変換ロジックを実装**

```typescript
// scripts/lib/atom-to-template.ts
import type { FlashCardTemplate, KnowledgeType } from '../../src/types/flashcard-template'
import type { KnowledgeAtom } from '../../src/types/knowledge-atom'

/** カードIDを生成: exemplar_id × knowledge_type × recall_direction */
export function generateCardId(exemplarId: string, knowledgeType: string, recallDirection: string): string {
  return `${exemplarId}-${knowledgeType}-${recallDirection}`
}

/** 1つのKnowledgeAtomからFlashCardTemplate[]に変換 */
export function atomToTemplates(atom: KnowledgeAtom): FlashCardTemplate[] {
  // まずカードIDを全て生成
  const cardIds = atom.cards.map(card =>
    generateCardId(atom.exemplar_id, atom.knowledge_type, card.recall_direction),
  )

  return atom.cards.map((card, idx) => {
    // 逆カードのID（2枚の場合のみ設定）
    let reverseOfId: string | undefined
    if (atom.cards.length === 2) {
      reverseOfId = cardIds[idx === 0 ? 1 : 0]
    }

    return {
      id: cardIds[idx],
      source_type: 'knowledge_atom' as const,
      source_id: atom.id,
      primary_exemplar_id: atom.exemplar_id,
      subject: atom.subject,
      front: card.front,
      back: card.back,
      format: card.format,
      tags: [atom.knowledge_type, atom.difficulty_tier],

      // 新規フィールド
      knowledge_atom_id: atom.id,
      knowledge_type: atom.knowledge_type,
      recall_direction: card.recall_direction,
      reverse_of_id: reverseOfId,
      difficulty_tier: atom.difficulty_tier,
      content_type: 'text' as const,
      generation_model: 'claude-opus-4-6',
      confidence_score: card.confidence_score,
      source_question_ids: atom.source_question_ids,
      source_note_ids: atom.source_note_ids,
    }
  })
}
```

- [ ] **Step 4: テストを実行して成功を確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx vitest run scripts/lib/__tests__/atom-to-template.test.ts`
Expected: PASS

- [ ] **Step 5: アセンブルスクリプトを作成**

```typescript
// scripts/assemble-card-templates.ts
//
// 生成済みJSONファイルをFlashCardTemplate[]に変換し、科目別JSONに出力
// 使い方:
//   npx tsx scripts/assemble-card-templates.ts
//   npx tsx scripts/assemble-card-templates.ts --stats   # 統計のみ

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { atomToTemplates } from './lib/atom-to-template'
import { validateAllAtoms } from './lib/card-validator'
import type { GenerationResult } from './lib/card-pipeline-types'
import type { KnowledgeAtom } from '../src/types/knowledge-atom'
import type { FlashCardTemplate } from '../src/types/flashcard-template'
import type { QuestionSubject } from '../src/types/question'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const INPUT_DIR = path.join(__dirname, 'output', 'text-cards')
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data', 'generated-cards')

const SUBJECT_FILE_MAP: Record<QuestionSubject, string> = {
  '物理': 'physics',
  '化学': 'chemistry',
  '生物': 'biology',
  '衛生': 'hygiene',
  '薬理': 'pharmacology',
  '薬剤': 'pharmaceutics',
  '病態・薬物治療': 'pathology',
  '法規・制度・倫理': 'regulation',
  '実務': 'practice',
}

const statsOnly = process.argv.includes('--stats')

async function main() {
  // 生成済みJSONを読み込み
  const jsonFiles = fs.readdirSync(INPUT_DIR)
    .filter(f => f.endsWith('.json') && !f.endsWith('.error.json') && !f.endsWith('.prompt.txt'))

  console.log(`入力ファイル: ${jsonFiles.length}件`)

  // 全atomを収集
  const allAtoms: KnowledgeAtom[] = []
  let totalTokens = { input: 0, output: 0 }

  for (const file of jsonFiles) {
    const content = fs.readFileSync(path.join(INPUT_DIR, file), 'utf-8')
    const result = JSON.parse(content) as GenerationResult
    allAtoms.push(...result.atoms)
    totalTokens.input += result.tokenUsage.input
    totalTokens.output += result.tokenUsage.output
  }

  // バリデーション
  const validation = validateAllAtoms(allAtoms)
  console.log(`\n=== バリデーション ===`)
  console.log(`atoms: ${validation.summary.total}件`)
  console.log(`エラーあり: ${validation.summary.withErrors}件`)
  console.log(`エラー: ${validation.summary.errorCount}件、警告: ${validation.summary.warningCount}件`)

  if (validation.summary.errorCount > 0) {
    console.log('\nエラー詳細:')
    for (const err of validation.errors.filter(e => e.severity === 'error').slice(0, 20)) {
      console.log(`  [${err.code}] ${err.atomId}: ${err.message}`)
    }
  }

  // FlashCardTemplateに変換
  const allTemplates: FlashCardTemplate[] = allAtoms.flatMap(atom => atomToTemplates(atom))

  // 重複チェック（同一IDのカード）
  const idCounts = new Map<string, number>()
  for (const t of allTemplates) {
    idCounts.set(t.id, (idCounts.get(t.id) ?? 0) + 1)
  }
  const duplicates = [...idCounts.entries()].filter(([, count]) => count > 1)
  if (duplicates.length > 0) {
    console.log(`\n⚠️ 重複ID: ${duplicates.length}件`)
    for (const [id, count] of duplicates.slice(0, 10)) {
      console.log(`  ${id}: ${count}回`)
    }
  }

  // 重複を除去（先勝ち）
  const uniqueTemplates: FlashCardTemplate[] = []
  const seenIds = new Set<string>()
  for (const t of allTemplates) {
    if (!seenIds.has(t.id)) {
      seenIds.add(t.id)
      uniqueTemplates.push(t)
    }
  }

  // 科目別集計
  const bySubject = new Map<QuestionSubject, FlashCardTemplate[]>()
  for (const t of uniqueTemplates) {
    const list = bySubject.get(t.subject) ?? []
    list.push(t)
    bySubject.set(t.subject, list)
  }

  console.log(`\n=== 科目別枚数 ===`)
  for (const [subject, templates] of [...bySubject.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${subject}: ${templates.length}枚`)
  }
  console.log(`  合計: ${uniqueTemplates.length}枚`)
  console.log(`\nトークン使用量: in=${totalTokens.input.toLocaleString()} out=${totalTokens.output.toLocaleString()}`)

  if (statsOnly) return

  // 科目別JSONに出力
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  for (const [subject, templates] of bySubject) {
    const filename = SUBJECT_FILE_MAP[subject] ?? 'unknown'
    const outPath = path.join(OUTPUT_DIR, `${filename}.json`)
    fs.writeFileSync(outPath, JSON.stringify(templates, null, 2))
    console.log(`  → ${outPath} (${templates.length}枚)`)
  }

  // インデックスファイル生成
  const indexContent = `// src/data/generated-cards/index.ts
// 自動生成: scripts/assemble-card-templates.ts
// 生成日: ${new Date().toISOString()}

import type { FlashCardTemplate } from '../../types/flashcard-template'
import type { QuestionSubject } from '../../types/question'

const SUBJECT_FILES: Record<QuestionSubject, string> = {
  '物理': 'physics',
  '化学': 'chemistry',
  '生物': 'biology',
  '衛生': 'hygiene',
  '薬理': 'pharmacology',
  '薬剤': 'pharmaceutics',
  '病態・薬物治療': 'pathology',
  '法規・制度・倫理': 'regulation',
  '実務': 'practice',
}

/** 科目別にカードテンプレートを遅延ロード */
export async function loadCardTemplates(subject: QuestionSubject): Promise<FlashCardTemplate[]> {
  const file = SUBJECT_FILES[subject]
  if (!file) return []
  try {
    const mod = await import(\`./${file}.json\`)
    return mod.default as FlashCardTemplate[]
  } catch {
    return []
  }
}

/** 全科目のカードテンプレートを一括ロード */
export async function loadAllCardTemplates(): Promise<FlashCardTemplate[]> {
  const subjects = Object.keys(SUBJECT_FILES) as QuestionSubject[]
  const results = await Promise.all(subjects.map(s => loadCardTemplates(s)))
  return results.flat()
}
`

  const indexPath = path.join(OUTPUT_DIR, 'index.ts')
  fs.writeFileSync(indexPath, indexContent)
  console.log(`  → ${indexPath}`)

  console.log('\n✅ 完了')
}

main().catch(err => {
  console.error('致命的エラー:', err)
  process.exit(1)
})
```

- [ ] **Step 6: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add scripts/lib/atom-to-template.ts scripts/lib/__tests__/atom-to-template.test.ts scripts/assemble-card-templates.ts
git commit -m "feat: atom→FlashCardTemplate変換 + 科目別JSON出力スクリプト"
```

---

### Task 9: Codex相互検証スクリプト

**Files:**
- Create: `scripts/verify-cards-with-codex.ts`

- [ ] **Step 1: 低confidence カード検証スクリプトを作成**

```typescript
// scripts/verify-cards-with-codex.ts
//
// confidence_score < 0.8 のカードをGPT-5.4 (Codex) で相互検証
// 使い方:
//   npx tsx scripts/verify-cards-with-codex.ts
//   npx tsx scripts/verify-cards-with-codex.ts --threshold 0.9   # 閾値変更
//   npx tsx scripts/verify-cards-with-codex.ts --stats            # 統計のみ

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

import type { GenerationResult } from './lib/card-pipeline-types'
import type { KnowledgeAtom, KnowledgeAtomCard } from '../src/types/knowledge-atom'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const INPUT_DIR = path.join(__dirname, 'output', 'text-cards')
const OUTPUT_DIR = path.join(__dirname, 'output', 'text-cards', 'codex-reviews')

const args = process.argv.slice(2)
const thresholdArg = args.indexOf('--threshold') !== -1
  ? parseFloat(args[args.indexOf('--threshold') + 1])
  : 0.8
const statsOnly = args.includes('--stats')

interface LowConfidenceCard {
  atomId: string
  exemplarId: string
  recallDirection: string
  front: string
  back: string
  confidenceScore: number
  knowledgeType: string
}

async function main() {
  // 生成済みJSONを読み込み
  const jsonFiles = fs.readdirSync(INPUT_DIR)
    .filter(f => f.endsWith('.json') && !f.endsWith('.error.json'))

  const lowConfidenceCards: LowConfidenceCard[] = []

  for (const file of jsonFiles) {
    const content = fs.readFileSync(path.join(INPUT_DIR, file), 'utf-8')
    const result = JSON.parse(content) as GenerationResult

    for (const atom of result.atoms) {
      for (const card of atom.cards) {
        if (card.confidence_score < thresholdArg) {
          lowConfidenceCards.push({
            atomId: atom.id,
            exemplarId: result.exemplarId,
            recallDirection: card.recall_direction,
            front: card.front,
            back: card.back,
            confidenceScore: card.confidence_score,
            knowledgeType: atom.knowledge_type,
          })
        }
      }
    }
  }

  console.log(`低confidence カード: ${lowConfidenceCards.length}枚（閾値: ${thresholdArg}）`)

  if (statsOnly || lowConfidenceCards.length === 0) {
    // 分布表示
    const buckets = [0, 0.2, 0.4, 0.6, 0.8]
    for (const b of buckets) {
      const count = lowConfidenceCards.filter(c =>
        c.confidenceScore >= b && c.confidenceScore < b + 0.2,
      ).length
      console.log(`  ${b.toFixed(1)}-${(b + 0.2).toFixed(1)}: ${count}枚`)
    }
    return
  }

  // Codex検証用のプロンプトを生成（MCPプラグイン経由で手動実行）
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const reviewBatches: LowConfidenceCard[][] = []
  const BATCH_SIZE = 20
  for (let i = 0; i < lowConfidenceCards.length; i += BATCH_SIZE) {
    reviewBatches.push(lowConfidenceCards.slice(i, i + BATCH_SIZE))
  }

  for (let i = 0; i < reviewBatches.length; i++) {
    const batch = reviewBatches[i]
    const prompt = `以下の暗記カード${batch.length}枚は薬剤師国家試験対策用に自動生成されたものです。
各カードの医学的・薬学的正確性を検証し、問題があれば修正案を出してください。

${batch.map((c, idx) => `### カード ${idx + 1}
- Atom: ${c.atomId}
- 種別: ${c.knowledgeType}
- 方向: ${c.recallDirection}
- 表面: ${c.front}
- 裏面: ${c.back}
- 自信度: ${c.confidenceScore}
`).join('\n')}

各カードについて以下を回答してください:
1. 正確か？ (OK / 要修正 / 要削除)
2. 修正がある場合、修正後のfront/back
3. 理由（簡潔に）

JSON形式で出力:
\`\`\`json
{
  "reviews": [
    { "index": 1, "verdict": "OK" | "fix" | "delete", "front?": "...", "back?": "...", "reason": "..." }
  ]
}
\`\`\``

    const outPath = path.join(OUTPUT_DIR, `batch-${String(i + 1).padStart(3, '0')}.prompt.txt`)
    fs.writeFileSync(outPath, prompt)
    console.log(`  → ${outPath} (${batch.length}枚)`)
  }

  console.log(`\n${reviewBatches.length}バッチ生成完了`)
  console.log('mcp__codex__codex ツールでバッチごとに検証してください')
}

main().catch(err => {
  console.error('致命的エラー:', err)
  process.exit(1)
})
```

- [ ] **Step 2: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add scripts/verify-cards-with-codex.ts
git commit -m "feat: Codex相互検証 — 低confidenceカードのバッチ検証プロンプト生成"
```

---

### Task 10: 全テスト通過確認 + CLAUDE.md更新

**Files:**
- Modify: `CLAUDE.md`（コマンドセクションに追記）

- [ ] **Step 1: 全テスト実行**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx vitest run`
Expected: 全テストPASS（既存520件 + 新規テスト）

- [ ] **Step 2: 型チェック**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: CLAUDE.md にコマンドとアーキテクチャ情報を追記**

`CLAUDE.md` のコマンドセクションに追加:

```markdown
- `npx tsx scripts/generate-text-cards.ts --dry-run --limit 5` — テキストカード生成（dry-run、API呼び出しなし）
- `npx tsx scripts/generate-text-cards.ts --limit 10` — テキストカード生成（10件限定）
- `npx tsx scripts/generate-text-cards.ts --resume` — テキストカード生成（中断再開）
- `npx tsx scripts/generate-text-cards.ts --status` — テキストカード生成進捗確認
- `npx tsx scripts/assemble-card-templates.ts` — 生成済みatom→科目別JSON変換
- `npx tsx scripts/assemble-card-templates.ts --stats` — 生成済みカード統計
- `npx tsx scripts/verify-cards-with-codex.ts --stats` — 低confidenceカード統計
```

アーキテクチャセクションに追加:

```markdown
- テキストカードパイプライン: exemplar-stats→フィルタ→過去問集約→Claude Opus atom抽出→バリデーション→科目別JSON
- パイプラインコア: `scripts/lib/card-pipeline-core.ts`（フィルタ+集約の純粋関数）
- パイプライン型: `scripts/lib/card-pipeline-types.ts`（ExemplarContext等の内部型）
- カード生成プロンプト: `scripts/lib/card-generation-prompt.ts`（Claude API用システムプロンプト+ユーザープロンプト生成）
- カードバリデーター: `scripts/lib/card-validator.ts`（atom/card品質チェック13ルール）
- atom→テンプレート変換: `scripts/lib/atom-to-template.ts`（KnowledgeAtom→FlashCardTemplate[]）
- 生成済みカード: `scripts/output/text-cards/`（exemplarごとのJSON、中間成果物）
- 科目別カードJSON: `src/data/generated-cards/`（科目別JSONファイル+dynamic importローダー）
```

- [ ] **Step 4: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add CLAUDE.md
git commit -m "docs: テキストカードパイプラインのコマンドとアーキテクチャをCLAUDE.mdに追記"
```

---

### Task 11: バッチ生成実行（全430件）

**Files:**
- None (実行のみ)

この Task は前タスク全完了後に実行する。時間がかかるため（推定30-60分）、バックグラウンドで実行。

- [ ] **Step 1: まず科目別に少数テスト**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
npx tsx scripts/generate-text-cards.ts --subject 薬理 --limit 10
npx tsx scripts/generate-text-cards.ts --subject 衛生 --limit 5
npx tsx scripts/generate-text-cards.ts --subject 実務 --limit 5
```

Expected: 各科目で品質が安定していること

- [ ] **Step 2: 全件実行**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
npx tsx scripts/generate-text-cards.ts --resume
```

Expected: ~430件全て完了（エラー件数は少数）

- [ ] **Step 3: 失敗分のリトライ**

```bash
# エラーファイルを確認
ls scripts/output/text-cards/*.error.json

# エラーファイルを削除してresume
rm scripts/output/text-cards/*.error.json
npx tsx scripts/generate-text-cards.ts --resume
```

- [ ] **Step 4: アセンブル実行**

```bash
npx tsx scripts/assemble-card-templates.ts
```

Expected: `src/data/generated-cards/` に9科目のJSONが生成される

- [ ] **Step 5: Codex検証**

```bash
npx tsx scripts/verify-cards-with-codex.ts
```

低confidenceカードのバッチプロンプトが生成される。mcp__codex__codex で順次検証。

- [ ] **Step 6: 最終コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add src/data/generated-cards/ scripts/output/text-cards/
git commit -m "feat: テキストカード ~3,100枚生成 — 科目別JSON出力完了"
```
