# FlashCard Data Layer & Learning Cycle Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** FlashCard型を FlashCardTemplate（公式コンテンツ）+ CardProgress（ユーザー進捗）に分離し、LearningLinkService で演習・付箋・暗記カードを循環接続する。

**Architecture:** 公式カードテンプレートは TS ファイルに焼き込み（付箋と同パターン）、復習進捗のみ localStorage に保存。LearningLinkService が6種の逆引き Map を起動時に構築し、画面表示時は Map 参照のみで高速。SM-2 アルゴリズムは純粋クラスに抽出してテスト容易に。FlashCardPage は PracticeContext を受け取り、テンプレートベース練習と旧レガシー復習を共存させる。

**Tech Stack:** TypeScript 5.9 / React 19 / Vite 8 / CSS Modules / Vitest

**Spec:** `docs/superpowers/specs/2026-03-26-learning-cycle-architecture-design.md` §3-5

**スコープ外（次の計画で対応）:**
- FlashCardPage / FlashCardListPage の Soft Companion ビジュアルリデザイン
- Ant Design 排除（データ層のみ先行、UI リデザインは別計画）
- Supabase 統合（Phase 2）
- カード生成 AI パイプライン実行（本計画ではスクリプト骨格のみ）
- HomePage「今日のカード」連携（HomePage 改修が必要）
- OfficialNote.exemplarIds 投入（AI マッチングパイプライン — 別タスク）

**Spec からの意図的な設計変更:**

| Spec 定義 | 本計画 | 理由 |
|-----------|--------|------|
| `ICardProgressRepo.upsert(templateId, result)` | `ICardProgressRepo.save(progress)` | SM-2 計算責務をフック側に分離。既存 `useFlashCards.ts` パターン準拠。repo は純粋な persist 層 |
| `IFlashCardTemplateRepo.getAll(): FlashCardTemplate[]` (sync) | 同左 | テンプレートは TS 静的 import のため sync で問題なし |

---

## File Structure

```
src/types/
  flashcard-template.ts         # NEW: FlashCardTemplate, CardFormat, CARD_FORMAT_CONFIG
  card-progress.ts              # NEW: CardProgress, ReviewResult, FlashCardPracticeContext
  flashcard.ts                  # MODIFY: 旧型に @deprecated マーカー、新型から re-export

src/data/
  flashcard-templates.ts        # NEW: サンプルテンプレート10枚（3付箋+3問題解説ベース）

src/utils/
  sm2-scheduler.ts              # NEW: SM-2 アルゴリズム純粋クラス
  learning-link-service.ts      # NEW: 6種 Map 逆引きサービス
  __tests__/
    sm2-scheduler.test.ts       # NEW: SM-2 テスト（~15件）
    learning-link-service.test.ts # NEW: LearningLinkService テスト（~15件）

src/repositories/
  interfaces.ts                 # MODIFY: IFlashCardTemplateRepo + ICardProgressRepo 追加
  index.ts                      # MODIFY: 新リポジトリ export 追加
  localStorage/
    flashCardTemplateRepo.ts    # NEW: テンプレート読み取り専用
    cardProgressRepo.ts         # NEW: 進捗 localStorage CRUD

src/hooks/
  useFlashCardTemplates.ts      # NEW: テンプレートデータアクセス
  useCardProgress.ts            # NEW: SM-2 進捗管理
  useLearningLinks.ts           # NEW: LearningLinkService React ラッパー

src/components/
  notes/
    FlashCardSection.tsx        # MODIFY: プレースホルダー → カードプレビューリスト
    FlashCardSection.module.css # NEW: スタイル
  flashcard/
    TemplatePractice.tsx        # NEW: テンプレートベース練習 UI（Ant Design）

src/pages/
  FusenDetailPage.tsx           # MODIFY: FlashCardSection にカードデータ渡す
  FlashCardPage.tsx             # MODIFY: PracticeContext 対応（条件分岐）
  QuestionPage.tsx              # MODIFY: onFlashCard → PracticeContext 付き遷移
```

---

### Task 1: FlashCardTemplate + CardProgress + PracticeContext 型定義

**Files:**
- Create: `src/types/flashcard-template.ts`
- Create: `src/types/card-progress.ts`
- Modify: `src/types/flashcard.ts`

- [ ] **Step 1: FlashCardTemplate 型を作成**

`src/types/flashcard-template.ts` を新規作成。旧 `flashcard.ts` から `CardFormat` と `CARD_FORMAT_CONFIG` を移動する。

```typescript
// src/types/flashcard-template.ts
// 暗記カードテンプレート（公式コンテンツ — 全ユーザー共通、TSファイルに焼き込み）

import type { QuestionSubject } from './question'

/** カードのフォーマット（表示形式） */
export type CardFormat = 'term_definition' | 'question_answer' | 'mnemonic'

/** カードフォーマットの表示設定 */
export const CARD_FORMAT_CONFIG: Record<CardFormat, { label: string; emoji: string; frontLabel: string; backLabel: string }> = {
  term_definition: { label: '用語↔定義', emoji: '📖', frontLabel: '用語', backLabel: '定義' },
  question_answer: { label: '問い↔答え', emoji: '❓', frontLabel: '問い', backLabel: '答え' },
  mnemonic: { label: '語呂↔対象', emoji: '🎵', frontLabel: '語呂合わせ', backLabel: '覚える内容' },
}

/** 暗記カードテンプレート（公式コンテンツ） */
export interface FlashCardTemplate {
  id: string                      // 'fct-001'
  source_type: 'fusen' | 'explanation'  // 生成元: 付箋ベース or 問題解説ベース
  source_id: string               // 付箋ID or 問題ID
  primary_exemplar_id: string     // Exemplarハブへの接続点
  subject: QuestionSubject
  front: string                   // 表面（問い）
  back: string                    // 裏面（答え）
  format: CardFormat
  tags: string[]
}
```

- [ ] **Step 2: CardProgress + ReviewResult + PracticeContext 型を作成**

`src/types/card-progress.ts` を新規作成。旧 `flashcard.ts` から `ReviewResult` を移動する。

```typescript
// src/types/card-progress.ts
// カード復習進捗（ユーザー個人データ — localStorage/Supabase に保存）

/** 復習結果（SM-2アルゴリズムへの入力） */
export type ReviewResult = 'again' | 'hard' | 'good' | 'easy'

/** カード復習進捗（SM-2 の状態） */
export interface CardProgress {
  template_id: string           // FlashCardTemplate.id
  user_id: string               // Phase 1 では 'local' 固定
  ease_factor: number           // SM-2 係数（デフォルト 2.5）
  interval_days: number         // 次回復習までの日数
  next_review_at: string        // ISO8601 次回復習日
  review_count: number          // 復習回数
  correct_streak: number        // 連続正答数
  last_reviewed_at: string      // ISO8601 最終復習日
}

/** カード練習の文脈（どこから来て、何の練習か） */
export interface FlashCardPracticeContext {
  mode: 'review_queue' | 'exemplar' | 'note'
  exemplarId?: string           // Exemplar集中モード時
  noteId?: string               // 付箋集中モード時
  cardIds: string[]             // 練習するカードのID一覧
  returnTo: string              // 練習後の戻り先URL
}
```

- [ ] **Step 3: 旧 flashcard.ts を後方互換で更新**

旧 `flashcard.ts` に `@deprecated` マーカーを追加し、新型から re-export する。既存の import (`from '../types/flashcard'`) を壊さない。

```typescript
// src/types/flashcard.ts
// 薬剤師国試：暗記カード（フラッシュカード）の型定義
// ⚠️ DEPRECATED: 新コードは flashcard-template.ts + card-progress.ts を使用すること
// 後方互換のため re-export を維持

import type { QuestionSubject } from './question'

// 新型から re-export（既存 import を壊さない）
export type { CardFormat } from './flashcard-template'
export { CARD_FORMAT_CONFIG } from './flashcard-template'
export type { ReviewResult } from './card-progress'

/**
 * @deprecated FlashCardTemplate + CardProgress に分離済み。
 * 旧ユーザー作成カード用。新コードでは使わないこと。
 */
export interface FlashCard {
  id: string
  user_id: string
  question_id: string
  topic_id: string
  subject: QuestionSubject
  front: string
  back: string
  format: 'term_definition' | 'question_answer' | 'mnemonic'
  tags: string[]
  ease_factor: number
  interval_days: number
  next_review_at: string
  review_count: number
  correct_streak: number
  created_at: string
  updated_at: string
}

/** @deprecated 新コードでは FlashCardTemplate + source_type/source_id を使用 */
export interface FlashCardFormValues {
  front: string
  back: string
  format: 'term_definition' | 'question_answer' | 'mnemonic'
  tags: string[]
}
```

- [ ] **Step 4: ビルド確認**

Run: `npx tsc --noEmit`

Expected: エラーなし（re-export により既存コードの import が維持される）

- [ ] **Step 5: コミット**

```bash
git add src/types/flashcard-template.ts src/types/card-progress.ts src/types/flashcard.ts
git commit -m "feat: FlashCardTemplate + CardProgress 型定義を追加

FlashCard型をテンプレート（公式コンテンツ）と進捗（ユーザーデータ）に分離。
旧flashcard.tsは後方互換re-exportを維持。"
```

---

### Task 2: SM-2 Scheduler 純粋クラス + テスト

SM-2（間隔反復アルゴリズム）を `useFlashCards.ts` から抽出し、テスト可能な純粋クラスにする。

**Files:**
- Create: `src/utils/sm2-scheduler.ts`
- Create: `src/utils/__tests__/sm2-scheduler.test.ts`

- [ ] **Step 1: テストを先に書く**

```typescript
// src/utils/__tests__/sm2-scheduler.test.ts
import { describe, it, expect } from 'vitest'
import { SM2Scheduler } from '../sm2-scheduler'
import type { CardProgress } from '../../types/card-progress'

/** テスト用ヘルパー: デフォルト進捗を生成 */
function makeProgress(overrides: Partial<CardProgress> = {}): CardProgress {
  return {
    template_id: 'fct-test',
    user_id: 'local',
    ease_factor: 2.5,
    interval_days: 1,
    next_review_at: '2026-03-26T00:00:00.000Z',
    review_count: 3,
    correct_streak: 2,
    last_reviewed_at: '2026-03-25T00:00:00.000Z',
    ...overrides,
  }
}

const NOW = new Date('2026-03-26T12:00:00.000Z').getTime()

describe('SM2Scheduler', () => {
  describe('calculate', () => {
    it('again: interval=1, ease-0.2, streak=0', () => {
      const progress = makeProgress({ ease_factor: 2.5, interval_days: 10, correct_streak: 3 })
      const result = SM2Scheduler.calculate(progress, 'again', NOW)
      expect(result.interval_days).toBe(1)
      expect(result.ease_factor).toBeCloseTo(2.3)
      expect(result.correct_streak).toBe(0)
      expect(result.review_count).toBe(4) // 3 + 1
    })

    it('again: ease_factor の下限は 1.3', () => {
      const progress = makeProgress({ ease_factor: 1.4 })
      const result = SM2Scheduler.calculate(progress, 'again', NOW)
      expect(result.ease_factor).toBeCloseTo(1.3)
    })

    it('hard: interval×1.2, ease-0.15, streak=0', () => {
      const progress = makeProgress({ interval_days: 10, ease_factor: 2.5, correct_streak: 2 })
      const result = SM2Scheduler.calculate(progress, 'hard', NOW)
      expect(result.interval_days).toBe(12) // round(10 * 1.2)
      expect(result.ease_factor).toBeCloseTo(2.35)
      expect(result.correct_streak).toBe(0)
    })

    it('hard: interval 最小値は 1', () => {
      const progress = makeProgress({ interval_days: 0 })
      const result = SM2Scheduler.calculate(progress, 'hard', NOW)
      expect(result.interval_days).toBe(1)
    })

    it('good (streak=0): interval=1', () => {
      const progress = makeProgress({ correct_streak: 0, interval_days: 5, ease_factor: 2.5 })
      const result = SM2Scheduler.calculate(progress, 'good', NOW)
      expect(result.interval_days).toBe(1)
      expect(result.correct_streak).toBe(1)
      expect(result.ease_factor).toBeCloseTo(2.5) // 変化なし
    })

    it('good (streak>0): interval×ease_factor', () => {
      const progress = makeProgress({ correct_streak: 2, interval_days: 5, ease_factor: 2.5 })
      const result = SM2Scheduler.calculate(progress, 'good', NOW)
      expect(result.interval_days).toBe(13) // round(5 * 2.5)
      expect(result.correct_streak).toBe(3)
    })

    it('easy: interval×ease×1.3, ease+0.15', () => {
      const progress = makeProgress({ interval_days: 5, ease_factor: 2.5, correct_streak: 1 })
      const result = SM2Scheduler.calculate(progress, 'easy', NOW)
      expect(result.interval_days).toBe(16) // round(5 * 2.5 * 1.3)
      expect(result.ease_factor).toBeCloseTo(2.65)
      expect(result.correct_streak).toBe(2)
    })

    it('next_review_at は now + interval_days 日後', () => {
      const progress = makeProgress({ interval_days: 1 })
      const result = SM2Scheduler.calculate(progress, 'good', NOW)
      const expected = new Date(NOW + 1 * 86400000).toISOString()
      expect(result.next_review_at).toBe(expected)
    })

    it('review_count は +1 される', () => {
      const progress = makeProgress({ review_count: 0 })
      const result = SM2Scheduler.calculate(progress, 'good', NOW)
      expect(result.review_count).toBe(1)
    })
  })

  describe('createInitialProgress', () => {
    it('デフォルト値で進捗を生成', () => {
      const progress = SM2Scheduler.createInitialProgress('fct-001', 'local', NOW)
      expect(progress.template_id).toBe('fct-001')
      expect(progress.user_id).toBe('local')
      expect(progress.ease_factor).toBe(2.5)
      expect(progress.interval_days).toBe(0)
      expect(progress.review_count).toBe(0)
      expect(progress.correct_streak).toBe(0)
      expect(progress.last_reviewed_at).toBe('')
    })

    it('next_review_at は now（即復習可能）', () => {
      const progress = SM2Scheduler.createInitialProgress('fct-001', 'local', NOW)
      expect(progress.next_review_at).toBe(new Date(NOW).toISOString())
    })

    it('user_id 省略時は "local"', () => {
      const progress = SM2Scheduler.createInitialProgress('fct-001')
      expect(progress.user_id).toBe('local')
    })
  })
})
```

- [ ] **Step 2: テスト実行 — 失敗を確認**

Run: `npx vitest run src/utils/__tests__/sm2-scheduler.test.ts`

Expected: FAIL — `Cannot find module '../sm2-scheduler'`

- [ ] **Step 3: SM2Scheduler 実装**

```typescript
// src/utils/sm2-scheduler.ts
// SM-2 間隔反復アルゴリズム（純粋クラス、副作用なし）
// 既存 useFlashCards.ts の calculateNextReview を抽出・テスト可能にしたもの

import type { CardProgress, ReviewResult } from '../types/card-progress'

/** SM-2 計算結果（CardProgress の部分更新） */
export interface ScheduleResult {
  ease_factor: number
  interval_days: number
  next_review_at: string
  review_count: number
  correct_streak: number
}

export class SM2Scheduler {
  /**
   * 復習結果から次回スケジュールを計算する。
   * @param progress - 現在の進捗
   * @param result - 復習結果（again/hard/good/easy）
   * @param now - 現在時刻（ミリ秒）。テスト時に固定値を渡せる
   */
  static calculate(progress: CardProgress, result: ReviewResult, now: number = Date.now()): ScheduleResult {
    let { ease_factor, interval_days, correct_streak } = progress

    switch (result) {
      case 'again':
        interval_days = 1
        ease_factor = Math.max(1.3, ease_factor - 0.2)
        correct_streak = 0
        break
      case 'hard':
        interval_days = Math.max(1, Math.round(interval_days * 1.2))
        ease_factor = Math.max(1.3, ease_factor - 0.15)
        correct_streak = 0
        break
      case 'good':
        interval_days = correct_streak === 0 ? 1 : Math.round(interval_days * ease_factor)
        correct_streak += 1
        break
      case 'easy':
        interval_days = Math.round(interval_days * ease_factor * 1.3)
        ease_factor += 0.15
        correct_streak += 1
        break
    }

    const next_review_at = new Date(now + interval_days * 86400000).toISOString()
    return {
      ease_factor,
      interval_days,
      next_review_at,
      review_count: progress.review_count + 1,
      correct_streak,
    }
  }

  /**
   * 新規カードの初期進捗を生成する。
   * @param templateId - FlashCardTemplate.id
   * @param userId - ユーザーID（Phase 1 は 'local'）
   * @param now - 現在時刻（ミリ秒）
   */
  static createInitialProgress(templateId: string, userId: string = 'local', now: number = Date.now()): CardProgress {
    return {
      template_id: templateId,
      user_id: userId,
      ease_factor: 2.5,
      interval_days: 0,
      next_review_at: new Date(now).toISOString(),
      review_count: 0,
      correct_streak: 0,
      last_reviewed_at: '',
    }
  }
}
```

- [ ] **Step 4: テスト実行 — 全パス確認**

Run: `npx vitest run src/utils/__tests__/sm2-scheduler.test.ts`

Expected: 12 tests PASS

- [ ] **Step 5: コミット**

```bash
git add src/utils/sm2-scheduler.ts src/utils/__tests__/sm2-scheduler.test.ts
git commit -m "feat: SM2Scheduler 純粋クラスを追加（12テスト）

useFlashCards.ts から SM-2 アルゴリズムを抽出。
now パラメータでテスト時の時刻固定が可能。"
```

---

### Task 3: LearningLinkService 純粋クラス + テスト

演習問題・付箋・暗記カードを Exemplar ハブ経由で相互接続する逆引きサービス。6種の Map をコンストラクタで構築し、参照メソッドは O(1) ルックアップ。

**Files:**
- Create: `src/utils/learning-link-service.ts`
- Create: `src/utils/__tests__/learning-link-service.test.ts`

- [ ] **Step 1: テストを先に書く**

```typescript
// src/utils/__tests__/learning-link-service.test.ts
import { describe, it, expect } from 'vitest'
import { LearningLinkService } from '../learning-link-service'
import type { QuestionExemplarMapping } from '../../types/blueprint'
import type { OfficialNote } from '../../types/official-note'
import type { FlashCardTemplate } from '../../types/flashcard-template'

function makeNote(overrides: Partial<OfficialNote>): OfficialNote {
  return {
    id: 'n-test',
    title: 'テスト付箋',
    imageUrl: '/test.png',
    textSummary: 'テスト',
    subject: '物理',
    topicId: 'physics-test',
    tags: [],
    linkedQuestionIds: [],
    importance: 0,
    tier: 'free',
    ...overrides,
  }
}

function makeTemplate(overrides: Partial<FlashCardTemplate>): FlashCardTemplate {
  return {
    id: 'fct-test',
    source_type: 'fusen',
    source_id: 'n-test',
    primary_exemplar_id: 'ex-test',
    subject: '物理',
    front: 'Q',
    back: 'A',
    format: 'term_definition',
    tags: [],
    ...overrides,
  }
}

// テスト用データセット
const mappings: QuestionExemplarMapping[] = [
  { questionId: 'q1', exemplarId: 'ex1', isPrimary: true },
  { questionId: 'q2', exemplarId: 'ex1', isPrimary: true },
  { questionId: 'q2', exemplarId: 'ex2', isPrimary: false },
  { questionId: 'q3', exemplarId: 'ex3', isPrimary: true },
]

const notes: OfficialNote[] = [
  makeNote({ id: 'n1', exemplarIds: ['ex1'] }),
  makeNote({ id: 'n2', exemplarIds: ['ex2'] }),
  makeNote({ id: 'n3' }), // exemplarIds なし（フォールバック用）
]

const templates: FlashCardTemplate[] = [
  makeTemplate({ id: 'fct-1', source_type: 'fusen', source_id: 'n1', primary_exemplar_id: 'ex1' }),
  makeTemplate({ id: 'fct-2', source_type: 'explanation', source_id: 'q1', primary_exemplar_id: 'ex1' }),
  makeTemplate({ id: 'fct-3', source_type: 'fusen', source_id: 'n2', primary_exemplar_id: 'ex2' }),
]

describe('LearningLinkService', () => {
  const service = new LearningLinkService(mappings, notes, templates)

  describe('getNotesForQuestion', () => {
    it('問題→exemplar→付箋 を辿って関連付箋を返す', () => {
      const result = service.getNotesForQuestion('q1')
      expect(result.map(n => n.id)).toEqual(['n1'])
    })

    it('複数 exemplar を持つ問題は複数付箋を返す', () => {
      const result = service.getNotesForQuestion('q2')
      expect(result.map(n => n.id).sort()).toEqual(['n1', 'n2'])
    })

    it('付箋なしの exemplar は空配列', () => {
      const result = service.getNotesForQuestion('q3')
      expect(result).toEqual([])
    })

    it('存在しない問題IDは空配列', () => {
      expect(service.getNotesForQuestion('nonexistent')).toEqual([])
    })
  })

  describe('getCardsForQuestion', () => {
    it('問題→exemplar→カード を辿って関連カードを返す', () => {
      const result = service.getCardsForQuestion('q1')
      expect(result.map(t => t.id).sort()).toEqual(['fct-1', 'fct-2'])
    })

    it('存在しない問題IDは空配列', () => {
      expect(service.getCardsForQuestion('nonexistent')).toEqual([])
    })
  })

  describe('getSourceCards', () => {
    it('付箋から直接生成されたカードのみ返す', () => {
      const result = service.getSourceCards('n1')
      expect(result.map(t => t.id)).toEqual(['fct-1'])
    })

    it('explanation 由来のカードは含まない', () => {
      const result = service.getSourceCards('n1')
      expect(result.every(t => t.source_type === 'fusen')).toBe(true)
    })

    it('カードなしの付箋は空配列', () => {
      expect(service.getSourceCards('n3')).toEqual([])
    })
  })

  describe('getExemplarCards', () => {
    it('同 exemplar の全カードを返す（source_type 問わず）', () => {
      const result = service.getExemplarCards('n1')
      expect(result.map(t => t.id).sort()).toEqual(['fct-1', 'fct-2'])
    })

    it('exemplarIds なしの付箋は空配列', () => {
      expect(service.getExemplarCards('n3')).toEqual([])
    })
  })

  describe('getQuestionsForNote', () => {
    it('付箋→exemplar→問題 を辿って関連問題IDを返す', () => {
      const result = service.getQuestionsForNote('n1')
      expect(result.sort()).toEqual(['q1', 'q2'])
    })

    it('exemplarIds なしの付箋は空配列', () => {
      expect(service.getQuestionsForNote('n3')).toEqual([])
    })
  })

  describe('getRelatedNote', () => {
    it('fusen 由来: source_id で直接取得', () => {
      const card = templates[0] // fct-1, source_type='fusen', source_id='n1'
      const result = service.getRelatedNote(card)
      expect(result?.id).toBe('n1')
    })

    it('explanation 由来: primary_exemplar_id 経由でフォールバック', () => {
      const card = templates[1] // fct-2, source_type='explanation', primary_exemplar_id='ex1'
      const result = service.getRelatedNote(card)
      expect(result?.id).toBe('n1') // ex1 → n1
    })

    it('関連付箋なしは undefined', () => {
      const card = makeTemplate({ source_type: 'explanation', source_id: 'q99', primary_exemplar_id: 'ex99' })
      const svc = new LearningLinkService(mappings, notes, [card])
      expect(svc.getRelatedNote(card)).toBeUndefined()
    })
  })

  describe('getQuestionsForCard', () => {
    it('primary_exemplar_id 経由で関連問題IDを返す', () => {
      const result = service.getQuestionsForCard(templates[0]) // ex1 → q1, q2
      expect(result.sort()).toEqual(['q1', 'q2'])
    })
  })
})
```

- [ ] **Step 2: テスト実行 — 失敗を確認**

Run: `npx vitest run src/utils/__tests__/learning-link-service.test.ts`

Expected: FAIL — `Cannot find module '../learning-link-service'`

- [ ] **Step 3: LearningLinkService 実装**

```typescript
// src/utils/learning-link-service.ts
// 演習・付箋・暗記カードを Exemplar ハブ経由で相互接続する逆引きサービス。
// コンストラクタで6種の Map を構築し、参照メソッドは O(1) ルックアップ。

import type { FlashCardTemplate } from '../types/flashcard-template'
import type { OfficialNote } from '../types/official-note'
import type { QuestionExemplarMapping } from '../types/blueprint'

export class LearningLinkService {
  // 6種の逆引き Map
  private questionToExemplars: Map<string, string[]>
  private exemplarToQuestions: Map<string, string[]>
  private exemplarToNotes: Map<string, string[]>
  private noteToExemplars: Map<string, string[]>
  private exemplarToCards: Map<string, string[]>
  private cardToExemplar: Map<string, string>

  // ID→エンティティの逆引き
  private notesById: Map<string, OfficialNote>
  private templatesById: Map<string, FlashCardTemplate>

  constructor(
    questionExemplarMap: QuestionExemplarMapping[],
    notes: OfficialNote[],
    templates: FlashCardTemplate[],
  ) {
    this.questionToExemplars = new Map()
    this.exemplarToQuestions = new Map()
    this.exemplarToNotes = new Map()
    this.noteToExemplars = new Map()
    this.exemplarToCards = new Map()
    this.cardToExemplar = new Map()
    this.notesById = new Map()
    this.templatesById = new Map()

    // question ↔ exemplar
    for (const m of questionExemplarMap) {
      this.pushToMap(this.questionToExemplars, m.questionId, m.exemplarId)
      this.pushToMap(this.exemplarToQuestions, m.exemplarId, m.questionId)
    }

    // note ↔ exemplar
    for (const note of notes) {
      this.notesById.set(note.id, note)
      if (note.exemplarIds && note.exemplarIds.length > 0) {
        this.noteToExemplars.set(note.id, note.exemplarIds)
        for (const exId of note.exemplarIds) {
          this.pushToMap(this.exemplarToNotes, exId, note.id)
        }
      }
    }

    // card → exemplar
    for (const tpl of templates) {
      this.templatesById.set(tpl.id, tpl)
      this.cardToExemplar.set(tpl.id, tpl.primary_exemplar_id)
      this.pushToMap(this.exemplarToCards, tpl.primary_exemplar_id, tpl.id)
    }
  }

  /** 問題起点: この問題に関連する付箋を取得 */
  getNotesForQuestion(questionId: string): OfficialNote[] {
    const exemplarIds = this.questionToExemplars.get(questionId) ?? []
    const noteIds = new Set<string>()
    for (const exId of exemplarIds) {
      for (const nId of this.exemplarToNotes.get(exId) ?? []) {
        noteIds.add(nId)
      }
    }
    return this.resolveNotes(noteIds)
  }

  /** 問題起点: この問題に関連するカードテンプレートを取得 */
  getCardsForQuestion(questionId: string): FlashCardTemplate[] {
    const exemplarIds = this.questionToExemplars.get(questionId) ?? []
    const cardIds = new Set<string>()
    for (const exId of exemplarIds) {
      for (const cId of this.exemplarToCards.get(exId) ?? []) {
        cardIds.add(cId)
      }
    }
    return this.resolveTemplates(cardIds)
  }

  /** 付箋起点: この付箋から直接生成されたカードのみ返す */
  getSourceCards(noteId: string): FlashCardTemplate[] {
    return [...this.templatesById.values()].filter(
      t => t.source_type === 'fusen' && t.source_id === noteId,
    )
  }

  /** 付箋起点: 同 exemplar の全カードを返す */
  getExemplarCards(noteId: string): FlashCardTemplate[] {
    const exemplarIds = this.noteToExemplars.get(noteId) ?? []
    const cardIds = new Set<string>()
    for (const exId of exemplarIds) {
      for (const cId of this.exemplarToCards.get(exId) ?? []) {
        cardIds.add(cId)
      }
    }
    return this.resolveTemplates(cardIds)
  }

  /** 付箋起点: 関連する問題IDを取得 */
  getQuestionsForNote(noteId: string): string[] {
    const exemplarIds = this.noteToExemplars.get(noteId) ?? []
    const qIds = new Set<string>()
    for (const exId of exemplarIds) {
      for (const qId of this.exemplarToQuestions.get(exId) ?? []) {
        qIds.add(qId)
      }
    }
    return [...qIds]
  }

  /** カード起点: 関連する付箋を取得 */
  getRelatedNote(card: FlashCardTemplate): OfficialNote | undefined {
    // fusen 由来: source_id で直接取得
    if (card.source_type === 'fusen') {
      return this.notesById.get(card.source_id)
    }
    // explanation 由来: primary_exemplar_id 経由でフォールバック
    const noteIds = this.exemplarToNotes.get(card.primary_exemplar_id) ?? []
    return noteIds.length > 0 ? this.notesById.get(noteIds[0]) : undefined
  }

  /** カード起点: 関連する問題IDを取得 */
  getQuestionsForCard(card: FlashCardTemplate): string[] {
    return this.exemplarToQuestions.get(card.primary_exemplar_id) ?? []
  }

  // --- private helpers ---

  private pushToMap(map: Map<string, string[]>, key: string, value: string): void {
    const existing = map.get(key)
    if (existing) {
      existing.push(value)
    } else {
      map.set(key, [value])
    }
  }

  private resolveNotes(ids: Set<string>): OfficialNote[] {
    return [...ids]
      .map(id => this.notesById.get(id))
      .filter((n): n is OfficialNote => n !== undefined)
  }

  private resolveTemplates(ids: Set<string>): FlashCardTemplate[] {
    return [...ids]
      .map(id => this.templatesById.get(id))
      .filter((t): t is FlashCardTemplate => t !== undefined)
  }
}
```

- [ ] **Step 4: テスト実行 — 全パス確認**

Run: `npx vitest run src/utils/__tests__/learning-link-service.test.ts`

Expected: 14 tests PASS

- [ ] **Step 5: コミット**

```bash
git add src/utils/learning-link-service.ts src/utils/__tests__/learning-link-service.test.ts
git commit -m "feat: LearningLinkService 逆引きサービスを追加（14テスト）

6種 Map で演習・付箋・暗記カードを Exemplar 経由で接続。
コンストラクタで Map 構築、参照メソッドは O(1) ルックアップ。"
```

---

### Task 4: サンプル FlashCardTemplate データ

開発・デモ用に10枚のサンプルテンプレートを作成。付箋ベース7枚 + 問題解説ベース3枚。
既存 `official-notes.ts` の on-001〜on-005 に紐づけて、LearningLinkService の動作を確認できるデータセット。

**Files:**
- Create: `src/data/flashcard-templates.ts`

- [ ] **Step 1: サンプルテンプレートデータを作成**

```typescript
// src/data/flashcard-templates.ts
// サンプル暗記カードテンプレート（Phase 1: 手動作成10枚）
// 本格データは scripts/generate-flashcard-templates.ts で AI バッチ生成予定
//
// primary_exemplar_id は question-exemplar-map.ts の実データと整合
// source_id は official-notes.ts の付箋ID / 問題ID と整合

import type { FlashCardTemplate } from '../types/flashcard-template'

export const FLASHCARD_TEMPLATES: FlashCardTemplate[] = [
  // ========================================
  // 付箋ベース: on-001（SI基本単位）
  // r100-001→ex-physics-058, r109-001→ex-physics-006
  // ========================================
  {
    id: 'fct-001',
    source_type: 'fusen',
    source_id: 'on-001',
    primary_exemplar_id: 'ex-physics-006',
    subject: '物理',
    front: 'SI基本単位7つは？',
    back: 'm（長さ）, kg（質量）, s（時間）, A（電流）, K（温度）, mol（物質量）, cd（光度）',
    format: 'term_definition',
    tags: ['SI基本単位', '物理基礎'],
  },
  {
    id: 'fct-002',
    source_type: 'fusen',
    source_id: 'on-001',
    primary_exemplar_id: 'ex-physics-006',
    subject: '物理',
    front: 'SI基本単位の語呂合わせ「カドのマスク」の中身は？',
    back: 'Cd m A K s mol kg →「カドのマスク スモールキング」',
    format: 'mnemonic',
    tags: ['SI基本単位', '語呂合わせ'],
  },
  {
    id: 'fct-003',
    source_type: 'fusen',
    source_id: 'on-001',
    primary_exemplar_id: 'ex-physics-006',
    subject: '物理',
    front: '光度のSI単位は？',
    back: 'cd（カンデラ）',
    format: 'question_answer',
    tags: ['SI基本単位', '光度'],
  },

  // ========================================
  // 付箋ベース: on-002（物理量の単位まとめ）
  // r100-002→ex-physics-054
  // ========================================
  {
    id: 'fct-004',
    source_type: 'fusen',
    source_id: 'on-002',
    primary_exemplar_id: 'ex-physics-054',
    subject: '物理',
    front: 'エネルギーのSI単位をkg, m, sで表すと？',
    back: 'J = kg・m²・s⁻²',
    format: 'term_definition',
    tags: ['単位換算', 'エネルギー'],
  },
  {
    id: 'fct-005',
    source_type: 'fusen',
    source_id: 'on-002',
    primary_exemplar_id: 'ex-physics-054',
    subject: '物理',
    front: '圧力のSI単位をkg, m, sで表すと？',
    back: 'Pa = kg・m⁻¹・s⁻²',
    format: 'term_definition',
    tags: ['単位換算', '圧力'],
  },

  // ========================================
  // 付箋ベース: on-003（圧力とエネルギーの定義）
  // r104-001→ex-physics-017
  // ========================================
  {
    id: 'fct-006',
    source_type: 'fusen',
    source_id: 'on-003',
    primary_exemplar_id: 'ex-physics-017',
    subject: '物理',
    front: '1 Pa（パスカル）の定義は？',
    back: '1m²あたりに働く1Nの力（Pa = N/m²）',
    format: 'question_answer',
    tags: ['圧力', '定義'],
  },
  {
    id: 'fct-007',
    source_type: 'fusen',
    source_id: 'on-003',
    primary_exemplar_id: 'ex-physics-017',
    subject: '物理',
    front: '1 J（ジュール）の定義は？',
    back: '1Nの力で物体を1m動かす仕事（J = N・m）',
    format: 'question_answer',
    tags: ['エネルギー', '定義'],
  },

  // ========================================
  // 問題解説ベース
  // ========================================
  {
    id: 'fct-008',
    source_type: 'explanation',
    source_id: 'r100-001',
    primary_exemplar_id: 'ex-physics-058',
    subject: '物理',
    front: 'SI基本単位でないのはどれか？ Pa, kg, mol, cd, s',
    back: 'Pa（パスカル）— 組立単位（Pa = kg・m⁻¹・s⁻²）',
    format: 'question_answer',
    tags: ['SI基本単位', '組立単位'],
  },
  {
    id: 'fct-009',
    source_type: 'explanation',
    source_id: 'r109-001',
    primary_exemplar_id: 'ex-physics-006',
    subject: '物理',
    front: '電流のSI単位は？ヒント: 7つの基本単位の1つ',
    back: 'A（アンペア）',
    format: 'question_answer',
    tags: ['SI基本単位', '電流'],
  },
  {
    id: 'fct-010',
    source_type: 'explanation',
    source_id: 'r100-002',
    primary_exemplar_id: 'ex-physics-054',
    subject: '物理',
    front: '仕事の定義から、J（ジュール）をSI基本単位で表せ',
    back: 'J = N・m = kg・m²・s⁻²',
    format: 'question_answer',
    tags: ['単位換算', '仕事'],
  },
]
```

- [ ] **Step 2: ビルド確認**

Run: `npx tsc --noEmit`

Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/data/flashcard-templates.ts
git commit -m "feat: サンプル FlashCardTemplate データ10枚を追加

付箋ベース7枚（on-001〜on-003）+ 問題解説ベース3枚。
real exemplar ID と紐付け済み。本格データは AI バッチ生成で追加予定。"
```

---

### Task 5: リポジトリインターフェース更新

既存 `interfaces.ts` に `IFlashCardTemplateRepo`（読み取り専用）と `ICardProgressRepo`（ユーザーデータ CRUD）を追加。

**Files:**
- Modify: `src/repositories/interfaces.ts`

- [ ] **Step 1: 新インターフェースを追加**

`src/repositories/interfaces.ts` の末尾に追加:

```typescript
// --- 以下を末尾に追加 ---

import type { FlashCardTemplate } from '../types/flashcard-template'
import type { CardProgress } from '../types/card-progress'

/** カードテンプレートリポジトリ（読み取り専用、TSファイルから） */
export interface IFlashCardTemplateRepo {
  getAll(): FlashCardTemplate[]
  getByExemplarId(exemplarId: string): FlashCardTemplate[]
  getBySourceId(sourceId: string): FlashCardTemplate[]
}

/** カード復習進捗リポジトリ（ユーザーデータ、localStorage/Supabase） */
export interface ICardProgressRepo {
  getAll(): Promise<CardProgress[]>
  getByTemplateId(templateId: string): Promise<CardProgress | undefined>
  save(progress: CardProgress): Promise<void>
  getDueCards(): Promise<CardProgress[]>
}
```

ファイル先頭の import セクションも更新が必要:

既存の import ブロック:
```typescript
import type { AnswerHistory } from '../types/question'
import type { StickyNote } from '../types/note'
import type { FlashCard } from '../types/flashcard'
```

に以下を追加:
```typescript
import type { FlashCardTemplate } from '../types/flashcard-template'
import type { CardProgress } from '../types/card-progress'
```

- [ ] **Step 2: ビルド確認**

Run: `npx tsc --noEmit`

Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/repositories/interfaces.ts
git commit -m "feat: IFlashCardTemplateRepo + ICardProgressRepo インターフェース追加"
```

---

### Task 6: FlashCardTemplateRepo + CardProgressRepo 実装

**Files:**
- Create: `src/repositories/localStorage/flashCardTemplateRepo.ts`
- Create: `src/repositories/localStorage/cardProgressRepo.ts`

- [ ] **Step 1: FlashCardTemplateRepo 実装**

テンプレートは TS ファイルから同期読み取り。フィルタリングのみ。

```typescript
// src/repositories/localStorage/flashCardTemplateRepo.ts
// カードテンプレートリポジトリ（読み取り専用、静的データから取得）

import { FLASHCARD_TEMPLATES } from '../../data/flashcard-templates'
import type { FlashCardTemplate } from '../../types/flashcard-template'
import type { IFlashCardTemplateRepo } from '../interfaces'

export class LocalFlashCardTemplateRepo implements IFlashCardTemplateRepo {
  getAll(): FlashCardTemplate[] {
    return FLASHCARD_TEMPLATES
  }

  getByExemplarId(exemplarId: string): FlashCardTemplate[] {
    return FLASHCARD_TEMPLATES.filter(t => t.primary_exemplar_id === exemplarId)
  }

  getBySourceId(sourceId: string): FlashCardTemplate[] {
    return FLASHCARD_TEMPLATES.filter(t => t.source_id === sourceId)
  }
}
```

- [ ] **Step 2: CardProgressRepo 実装**

復習進捗は localStorage に保存。SM-2 計算はフック側で行い、repo は純粋な CRUD。

```typescript
// src/repositories/localStorage/cardProgressRepo.ts
// カード復習進捗リポジトリ（localStorage 実装）

import type { CardProgress } from '../../types/card-progress'
import type { ICardProgressRepo } from '../interfaces'

const STORAGE_KEY = 'card_progress'

function load(): CardProgress[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CardProgress[]
  } catch {
    return []
  }
}

function persist(items: CardProgress[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export class LocalCardProgressRepo implements ICardProgressRepo {
  async getAll(): Promise<CardProgress[]> {
    return load()
  }

  async getByTemplateId(templateId: string): Promise<CardProgress | undefined> {
    return load().find(p => p.template_id === templateId)
  }

  async save(progress: CardProgress): Promise<void> {
    const items = load()
    const index = items.findIndex(p => p.template_id === progress.template_id)
    if (index >= 0) {
      items[index] = progress
    } else {
      items.unshift(progress)
    }
    persist(items)
  }

  async getDueCards(): Promise<CardProgress[]> {
    const now = new Date().toISOString()
    return load().filter(p => p.next_review_at <= now)
  }
}
```

- [ ] **Step 3: ビルド確認**

Run: `npx tsc --noEmit`

Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/repositories/localStorage/flashCardTemplateRepo.ts src/repositories/localStorage/cardProgressRepo.ts
git commit -m "feat: FlashCardTemplateRepo + CardProgressRepo localStorage 実装"
```

---

### Task 7: リポジトリファクトリ更新 + export

既存の `src/repositories/index.ts` に新リポジトリの生成・export を追加。

**Files:**
- Modify: `src/repositories/index.ts`

- [ ] **Step 1: ファクトリ関数と export を追加**

`src/repositories/index.ts` を以下のように更新。既存コードはそのまま維持し、末尾に追加:

import セクションに追加:
```typescript
import type { IFlashCardTemplateRepo, ICardProgressRepo } from './interfaces'
import { LocalFlashCardTemplateRepo } from './localStorage/flashCardTemplateRepo'
import { LocalCardProgressRepo } from './localStorage/cardProgressRepo'
```

ファクトリ関数を追加（既存の `createFlashCardRepo()` の下に）:
```typescript
function createFlashCardTemplateRepo(): IFlashCardTemplateRepo {
  return new LocalFlashCardTemplateRepo()
}

function createCardProgressRepo(): ICardProgressRepo {
  return new LocalCardProgressRepo()
}
```

export を追加（既存の export の下に）:
```typescript
export const flashCardTemplateRepo = createFlashCardTemplateRepo()
export const cardProgressRepo = createCardProgressRepo()
```

最終行の re-export も更新:
```typescript
export type { IAnswerHistoryRepo, IStickyNoteRepo, IFlashCardRepo, IFlashCardTemplateRepo, ICardProgressRepo, NewNoteInput, NewFlashCardInput } from './interfaces'
```

- [ ] **Step 2: ビルド確認**

Run: `npx tsc --noEmit`

Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/repositories/index.ts
git commit -m "feat: flashCardTemplateRepo + cardProgressRepo をファクトリに追加"
```

---

### Task 8: useFlashCardTemplates + useCardProgress + useLearningLinks フック

React コンポーネントから新データ層にアクセスするフック3つ。

**Files:**
- Create: `src/hooks/useFlashCardTemplates.ts`
- Create: `src/hooks/useCardProgress.ts`
- Create: `src/hooks/useLearningLinks.ts`

- [ ] **Step 1: useFlashCardTemplates フック**

テンプレートは同期データなので、`useMemo` でキャッシュするだけのシンプルなフック。

```typescript
// src/hooks/useFlashCardTemplates.ts
// カードテンプレート（公式コンテンツ）へのアクセスフック

import { useMemo } from 'react'
import { flashCardTemplateRepo } from '../repositories'
import type { FlashCardTemplate } from '../types/flashcard-template'

export function useFlashCardTemplates() {
  const templates = useMemo(() => flashCardTemplateRepo.getAll(), [])

  const getByExemplarId = useMemo(
    () => (exemplarId: string): FlashCardTemplate[] =>
      flashCardTemplateRepo.getByExemplarId(exemplarId),
    [],
  )

  const getBySourceId = useMemo(
    () => (sourceId: string): FlashCardTemplate[] =>
      flashCardTemplateRepo.getBySourceId(sourceId),
    [],
  )

  return { templates, getByExemplarId, getBySourceId } as const
}
```

- [ ] **Step 2: useCardProgress フック**

SM-2 進捗管理。`useFlashCards.ts` のパターンを踏襲（非同期 load + cross-tab sync）。

```typescript
// src/hooks/useCardProgress.ts
// カード復習進捗（SM-2）の管理フック

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CardProgress, ReviewResult } from '../types/card-progress'
import { cardProgressRepo } from '../repositories'
import { SM2Scheduler } from '../utils/sm2-scheduler'

export function useCardProgress() {
  const [allProgress, setAllProgress] = useState<CardProgress[]>([])
  const [loading, setLoading] = useState(true)

  // 初回ロード
  useEffect(() => {
    cardProgressRepo.getAll().then((data) => {
      setAllProgress(data)
      setLoading(false)
    })
  }, [])

  // 他タブでの localStorage 変更を反映
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === 'card_progress') {
        cardProgressRepo.getAll().then(setAllProgress)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  /** 今日が復習日のカード進捗 */
  const dueProgress = useMemo(() => {
    const now = new Date().toISOString()
    return allProgress.filter((p) => p.next_review_at <= now)
  }, [allProgress])

  /** 復習結果を反映し、SM-2 で次回スケジュールを計算 */
  const reviewCard = useCallback(
    async (templateId: string, result: ReviewResult) => {
      const existing = allProgress.find((p) => p.template_id === templateId)
      const current = existing ?? SM2Scheduler.createInitialProgress(templateId)
      const updates = SM2Scheduler.calculate(current, result)
      const updated: CardProgress = {
        ...current,
        ...updates,
        last_reviewed_at: new Date().toISOString(),
      }
      await cardProgressRepo.save(updated)
      setAllProgress((prev) => {
        const idx = prev.findIndex((p) => p.template_id === templateId)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = updated
          return next
        }
        return [updated, ...prev]
      })
      return updated
    },
    [allProgress],
  )

  /** 特定テンプレートの進捗を取得 */
  const getProgressForTemplate = useCallback(
    (templateId: string): CardProgress | undefined =>
      allProgress.find((p) => p.template_id === templateId),
    [allProgress],
  )

  return { allProgress, loading, dueProgress, reviewCard, getProgressForTemplate } as const
}
```

- [ ] **Step 3: useLearningLinks フック**

LearningLinkService のインスタンスを `useMemo` でキャッシュ。データソースは静的 import なので依存配列は空。

```typescript
// src/hooks/useLearningLinks.ts
// LearningLinkService（逆引き表）の React ラッパー

import { useMemo } from 'react'
import { LearningLinkService } from '../utils/learning-link-service'
import { QUESTION_EXEMPLAR_MAP } from '../data/question-exemplar-map'
import { OFFICIAL_NOTES } from '../data/official-notes'
import { FLASHCARD_TEMPLATES } from '../data/flashcard-templates'

export function useLearningLinks(): LearningLinkService {
  return useMemo(
    () => new LearningLinkService(QUESTION_EXEMPLAR_MAP, OFFICIAL_NOTES, FLASHCARD_TEMPLATES),
    [],
  )
}
```

- [ ] **Step 4: ビルド確認**

Run: `npx tsc --noEmit`

Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/hooks/useFlashCardTemplates.ts src/hooks/useCardProgress.ts src/hooks/useLearningLinks.ts
git commit -m "feat: useFlashCardTemplates + useCardProgress + useLearningLinks フック追加

テンプレート（同期）、SM-2進捗（非同期+cross-tab sync）、逆引きサービス（memo化）の3フック。"
```

---

### Task 9: FlashCardSection 機能化 + CSS

FusenDetailPage の「準備中」プレースホルダーを、実際のカードプレビューリストに置き換え。
タップで表裏を切り替えるアコーディオン形式。

**Files:**
- Modify: `src/components/notes/FlashCardSection.tsx`
- Create: `src/components/notes/FlashCardSection.module.css`

- [ ] **Step 1: FlashCardSection.module.css を作成**

```css
/* src/components/notes/FlashCardSection.module.css */

.title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 8px;
}

.empty {
  padding: 16px;
  background: var(--card);
  border-radius: var(--r);
  text-align: center;
  color: var(--text-2);
  font-size: 14px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card {
  width: 100%;
  text-align: left;
  padding: 12px;
  background: var(--card);
  border-radius: var(--r);
  border: 1px solid var(--border, #e5e5e5);
  cursor: pointer;
  font: inherit;
  transition: background 0.15s;
}

.card:active {
  background: var(--bg);
}

.cardFront {
  display: flex;
  align-items: center;
  gap: 8px;
}

.emoji {
  font-size: 16px;
  flex-shrink: 0;
}

.frontText {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  flex: 1;
}

.chevron {
  font-size: 12px;
  color: var(--text-2);
  transition: transform 0.2s;
}

.chevronOpen {
  transform: rotate(90deg);
}

.cardBack {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border, #e5e5e5);
  font-size: 13px;
  color: var(--text-2);
  white-space: pre-wrap;
  line-height: 1.6;
}
```

- [ ] **Step 2: FlashCardSection コンポーネントを更新**

```typescript
// src/components/notes/FlashCardSection.tsx
// 付箋詳細ページの暗記カードセクション — カードプレビューリスト

import { useState } from 'react'
import type { FlashCardTemplate } from '../../types/flashcard-template'
import { CARD_FORMAT_CONFIG } from '../../types/flashcard-template'
import styles from './FlashCardSection.module.css'

interface Props {
  cards: FlashCardTemplate[]
}

export function FlashCardSection({ cards }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (cards.length === 0) {
    return (
      <section>
        <h3 className={styles.title}>暗記カード</h3>
        <div className={styles.empty}>関連カードはまだありません</div>
      </section>
    )
  }

  return (
    <section>
      <h3 className={styles.title}>暗記カード ({cards.length}枚)</h3>
      <div className={styles.list}>
        {cards.map((card) => {
          const config = CARD_FORMAT_CONFIG[card.format]
          const isOpen = expandedId === card.id
          return (
            <button
              key={card.id}
              type="button"
              className={styles.card}
              onClick={() => setExpandedId(isOpen ? null : card.id)}
              aria-expanded={isOpen}
            >
              <div className={styles.cardFront}>
                <span className={styles.emoji}>{config.emoji}</span>
                <span className={styles.frontText}>{card.front}</span>
                <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
                  ▶
                </span>
              </div>
              {isOpen && (
                <div className={styles.cardBack}>{card.back}</div>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: ビルド確認**

Run: `npx tsc --noEmit`

Expected: エラー — `FlashCardSection` が Props なしで使われている箇所（FusenDetailPage.tsx:76）で型エラー。Task 10 で修正する。

- [ ] **Step 4: コミット**

```bash
git add src/components/notes/FlashCardSection.tsx src/components/notes/FlashCardSection.module.css
git commit -m "feat: FlashCardSection をカードプレビューリストに更新

「準備中」プレースホルダー → タップ展開式カードリスト。
Props で FlashCardTemplate[] を受け取る。"
```

---

### Task 10: FusenDetailPage ワイヤリング

FlashCardSection にカードデータを渡す。LearningLinkService の `getSourceCards` で付箋から直接生成されたカードを取得。

**Files:**
- Modify: `src/pages/FusenDetailPage.tsx`

- [ ] **Step 1: FusenDetailPage に useLearningLinks を接続**

`src/pages/FusenDetailPage.tsx` を更新:

import に追加:
```typescript
import { useMemo } from 'react'
import { useLearningLinks } from '../hooks/useLearningLinks'
```

注意: 既存の `import { useState } from 'react'` を `import { useState, useMemo } from 'react'` に変更。

コンポーネント内に追加（`const [imageOpen, setImageOpen] = useState(false)` の下に）:
```typescript
  const linkService = useLearningLinks()
  const relatedCards = useMemo(
    () => fusen ? linkService.getSourceCards(fusen.id) : [],
    [fusen, linkService],
  )
```

FlashCardSection の呼び出しを更新:

変更前:
```tsx
        <FlashCardSection />
```

変更後:
```tsx
        <FlashCardSection cards={relatedCards} />
```

- [ ] **Step 2: ビルド確認**

Run: `npx tsc --noEmit`

Expected: エラーなし

- [ ] **Step 3: 全テスト実行**

Run: `npx vitest run`

Expected: 全テストパス（既存404件 + 新規 SM-2 12件 + LearningLinkService 14件 = ~430件）

- [ ] **Step 4: コミット**

```bash
git add src/pages/FusenDetailPage.tsx
git commit -m "feat: FusenDetailPage に暗記カード連携を接続

useLearningLinks → getSourceCards で付箋から生成されたカードを
FlashCardSection に渡す。"
```

---

### Task 11: TemplatePractice コンポーネント

テンプレートベースのカード練習 UI。FlashCardPracticeContext を受け取り、カードを1枚ずつ表示 → フリップ → 復習ボタンの流れ。Ant Design スタイル（ビジュアルリデザインは別計画）。

**Files:**
- Create: `src/components/flashcard/TemplatePractice.tsx`

- [ ] **Step 1: TemplatePractice コンポーネントを作成**

```typescript
// src/components/flashcard/TemplatePractice.tsx
// テンプレートベースのカード練習UI（PracticeContext 対応）

import { useMemo, useState } from 'react'
import { Button, Progress, Result, Space, Typography } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { FlashCardPracticeContext, ReviewResult } from '../../types/card-progress'
import type { FlashCardTemplate } from '../../types/flashcard-template'
import { CARD_FORMAT_CONFIG } from '../../types/flashcard-template'
import { useFlashCardTemplates } from '../../hooks/useFlashCardTemplates'
import { useCardProgress } from '../../hooks/useCardProgress'

const { Title, Text, Paragraph } = Typography

const REVIEW_BUTTONS: { result: ReviewResult; label: string; color: string }[] = [
  { result: 'again', label: 'もう一回', color: '#f5222d' },
  { result: 'hard', label: '難しい', color: '#fa8c16' },
  { result: 'good', label: 'OK', color: '#52c41a' },
  { result: 'easy', label: '簡単', color: '#1890ff' },
]

interface Props {
  context: FlashCardPracticeContext
}

export function TemplatePractice({ context }: Props) {
  const navigate = useNavigate()
  const { templates } = useFlashCardTemplates()
  const { reviewCard } = useCardProgress()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)

  const practiceCards = useMemo(
    () =>
      context.cardIds
        .map((id) => templates.find((t) => t.id === id))
        .filter((t): t is FlashCardTemplate => t !== undefined),
    [context.cardIds, templates],
  )

  const handleReview = async (result: ReviewResult) => {
    const card = practiceCards[currentIndex]
    await reviewCard(card.id, result)
    setFlipped(false)
    setReviewedCount((prev) => prev + 1)
    setCurrentIndex((prev) => prev + 1)
  }

  const totalCount = practiceCards.length

  // 完了画面
  if (totalCount === 0 || currentIndex >= totalCount) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 8px' }}>
        <Result
          status="success"
          title="練習完了！"
          subTitle={
            reviewedCount > 0
              ? `${reviewedCount}枚のカードを練習しました`
              : '練習するカードはありません'
          }
          extra={
            <Button type="primary" onClick={() => navigate(context.returnTo)}>
              戻る
            </Button>
          }
        />
      </div>
    )
  }

  const card = practiceCards[currentIndex]
  const formatConfig = CARD_FORMAT_CONFIG[card.format]

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 8px' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          type="text"
          onClick={() => navigate(context.returnTo)}
        />
        <Title level={4} style={{ margin: 0, flex: 1, textAlign: 'center' }}>
          練習
        </Title>
        <div style={{ width: 32 }} />
      </div>

      {/* 進捗 */}
      <div style={{ marginBottom: 16, textAlign: 'center' }}>
        <Text type="secondary">
          {currentIndex + 1} / {totalCount} カード
        </Text>
        <Progress
          percent={Math.round((currentIndex / totalCount) * 100)}
          showInfo={false}
          size="small"
          style={{ marginTop: 4 }}
        />
      </div>

      {/* フォーマットラベル */}
      <div style={{ marginBottom: 8, textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {formatConfig.emoji} {formatConfig.label}
        </Text>
      </div>

      {/* カード本体 */}
      <div
        onClick={() => setFlipped(!flipped)}
        style={{
          cursor: 'pointer',
          position: 'relative',
          width: '100%',
          minHeight: 200,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.5s',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* 表面 */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            minHeight: 200,
            backfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: '#fafafa',
            borderRadius: 12,
            border: '1px solid #d9d9d9',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Text type="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
            {formatConfig.frontLabel}
          </Text>
          <Paragraph
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {card.front}
          </Paragraph>
          <Text type="secondary" style={{ fontSize: 11, marginTop: 16 }}>
            タップして裏面を見る
          </Text>
        </div>

        {/* 裏面 */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            minHeight: 200,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: '#e6f7ff',
            borderRadius: 12,
            border: '1px solid #91d5ff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Text type="secondary" style={{ fontSize: 12, marginBottom: 8 }}>
            {formatConfig.backLabel}
          </Text>
          <Paragraph
            style={{
              fontSize: 16,
              textAlign: 'center',
              marginBottom: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {card.back}
          </Paragraph>
        </div>
      </div>

      {/* 復習ボタン */}
      {flipped && (
        <Space
          style={{
            width: '100%',
            justifyContent: 'center',
            marginTop: 16,
            display: 'flex',
          }}
        >
          {REVIEW_BUTTONS.map((btn) => (
            <Button
              key={btn.result}
              style={{ borderColor: btn.color, color: btn.color }}
              onClick={(e) => {
                e.stopPropagation()
                handleReview(btn.result)
              }}
            >
              {btn.label}
            </Button>
          ))}
        </Space>
      )}
    </div>
  )
}
```

- [ ] **Step 2: ビルド確認**

Run: `npx tsc --noEmit`

Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/components/flashcard/TemplatePractice.tsx
git commit -m "feat: TemplatePractice コンポーネント追加

PracticeContext でカード一覧を受け取り、フリップ+SM-2復習ボタンの練習フローを提供。
Ant Designスタイル（ビジュアルリデザインは別計画）。"
```

---

### Task 12: FlashCardPage PracticeContext 対応

FlashCardPage に PracticeContext 分岐を追加。ルートの state に PracticeContext があればテンプレート練習、なければ旧レガシー復習。

**Files:**
- Modify: `src/pages/FlashCardPage.tsx`

- [ ] **Step 1: FlashCardPage を PracticeContext 対応に更新**

`src/pages/FlashCardPage.tsx` を以下の内容で **全体を書き換え**:

```typescript
// 暗記カード復習画面
// - PracticeContext あり → テンプレートベース練習（TemplatePractice）
// - PracticeContext なし → 旧レガシー復習（LegacyDueCardReview）
import { useState } from 'react'
import { Button, Progress, Result, Typography } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { useFlashCards } from '../hooks/useFlashCards'
import { FlashCard } from '../components/FlashCard'
import type { ReviewResult } from '../types/card-progress'
import type { FlashCardPracticeContext } from '../types/card-progress'
import { TemplatePractice } from '../components/flashcard/TemplatePractice'

const { Title, Text } = Typography

/** 旧レガシー復習（ユーザー作成カードの due cards） */
function LegacyDueCardReview() {
  const navigate = useNavigate()
  const { dueCards, reviewCard } = useFlashCards()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [reviewedCount, setReviewedCount] = useState(0)
  const totalCount = dueCards.length

  const handleReview = (id: string, result: ReviewResult) => {
    reviewCard(id, result)
    setReviewedCount((prev) => prev + 1)
    setCurrentIndex((prev) => prev + 1)
  }

  if (totalCount === 0 || currentIndex >= totalCount) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 8px' }}>
        <Result
          status="success"
          title="今日の復習完了！"
          subTitle={
            reviewedCount > 0
              ? `${reviewedCount}枚のカードを復習しました`
              : '復習するカードはありません'
          }
          extra={
            <Button type="primary" onClick={() => navigate('/cards')}>
              カード一覧に戻る
            </Button>
          }
        />
      </div>
    )
  }

  const currentCard = dueCards[currentIndex]

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          type="text"
          onClick={() => navigate('/cards')}
        />
        <Title level={4} style={{ margin: 0, flex: 1, textAlign: 'center' }}>
          復習
        </Title>
        <div style={{ width: 32 }} />
      </div>

      <div style={{ marginBottom: 16, textAlign: 'center' }}>
        <Text type="secondary">
          {currentIndex + 1} / {totalCount} カード
        </Text>
        <Progress
          percent={Math.round((currentIndex / totalCount) * 100)}
          showInfo={false}
          size="small"
          style={{ marginTop: 4 }}
        />
      </div>

      <FlashCard card={currentCard} onReview={handleReview} />
    </div>
  )
}

export function FlashCardPage() {
  const location = useLocation()
  const context = location.state as FlashCardPracticeContext | null

  if (context && context.cardIds && context.cardIds.length > 0) {
    return <TemplatePractice context={context} />
  }

  return <LegacyDueCardReview />
}
```

- [ ] **Step 2: ビルド確認**

Run: `npx tsc --noEmit`

Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/pages/FlashCardPage.tsx
git commit -m "feat: FlashCardPage に PracticeContext 対応を追加

state に PracticeContext があればテンプレート練習、なければ旧レガシー復習。
2つのフローが共存し、既存動作を壊さない。"
```

---

### Task 13: QuestionPage + OfficialNoteCard ナビゲーション更新

問題解答後の「暗記カード」ボタンを PracticeContext 付き遷移に更新。LearningLinkService で関連カードを取得し、あれば `/cards/review` に state 付きで遷移。

**Files:**
- Modify: `src/components/question/OfficialNoteCard.tsx`
- Modify: `src/pages/QuestionPage.tsx`
- Modify: `src/components/question/LinkedQuestionItem.tsx`

- [ ] **Step 1: OfficialNoteCard の Props を拡張**

`src/components/question/OfficialNoteCard.tsx` の Props 型 `onFlashCard` を変更:

変更前（10行目付近）:
```typescript
  onFlashCard: () => void
```

変更後:
```typescript
  onFlashCard: () => void
  flashCardCount?: number
```

ボタン表示を更新。変更前（93-99行目付近）:
```tsx
              <button
                type="button"
                className={`${styles.btn} ${styles.btnOutline}`}
                onClick={onFlashCard}
              >
                {/* TODO: linkedCardIds によるフィルタリングは FlashCardPage リデザイン時に対応 */}
                🃏 暗記カード
              </button>
```

変更後:
```tsx
              <button
                type="button"
                className={`${styles.btn} ${styles.btnOutline}`}
                onClick={onFlashCard}
                disabled={flashCardCount === 0}
              >
                🃏 暗記カード{flashCardCount !== undefined && flashCardCount > 0 ? ` (${flashCardCount}枚)` : ''}
              </button>
```

関数シグネチャにも `flashCardCount` を追加:

変更前:
```typescript
  onFlashCard,
  onImageTap,
}: Props) {
```

変更後:
```typescript
  onFlashCard,
  flashCardCount,
  onImageTap,
}: Props) {
```

- [ ] **Step 2: QuestionPage の onFlashCard を PracticeContext 付き遷移に更新**

`src/pages/QuestionPage.tsx` に import 追加:
```typescript
import { useLearningLinks } from '../hooks/useLearningLinks'
import type { FlashCardPracticeContext } from '../types/card-progress'
```

コンポーネント内に追加:
```typescript
  const linkService = useLearningLinks()
```

OfficialNoteCard の呼び出しを更新（270-275行目付近）。

変更前:
```tsx
                onFlashCard={() => navigate('/cards')}
```

変更後:
```tsx
                onFlashCard={() => {
                  const cards = linkService.getSourceCards(note.id)
                  if (cards.length > 0) {
                    const ctx: FlashCardPracticeContext = {
                      mode: 'note',
                      noteId: note.id,
                      cardIds: cards.map(c => c.id),
                      returnTo: location.pathname,
                    }
                    navigate('/cards/review', { state: ctx })
                  } else {
                    navigate('/cards')
                  }
                }}
                flashCardCount={linkService.getSourceCards(note.id).length}
```

`location` は既存の `useLocation()` から取得済みのはず。なければ追加:
```typescript
const location = useLocation()
```

- [ ] **Step 3: LinkedQuestionItem の onFlashCard も同様に更新**

`src/components/question/LinkedQuestionItem.tsx` の148行目付近:

変更前:
```tsx
                onFlashCard={() => navigate('/cards')}
```

変更後:
```tsx
                onFlashCard={() => navigate('/cards')}
                flashCardCount={0}
```

注意: LinkedQuestionItem は独自の LearningLinkService を持たないため、暫定で count=0。本格対応は FlashCard UI リデザイン計画で行う。

- [ ] **Step 4: ビルド確認**

Run: `npx tsc --noEmit`

Expected: エラーなし

- [ ] **Step 5: 全テスト実行**

Run: `npx vitest run`

Expected: 全テストパス

- [ ] **Step 6: コミット**

```bash
git add src/components/question/OfficialNoteCard.tsx src/pages/QuestionPage.tsx src/components/question/LinkedQuestionItem.tsx
git commit -m "feat: QuestionPage → 暗記カード遷移を PracticeContext 対応に

OfficialNoteCard に flashCardCount Props 追加。
付箋から生成されたカードがあれば PracticeContext 付きで /cards/review に遷移。
なければ従来通り /cards に遷移。"
```

---

### Task 14: クリーンアップ — NotesPage spec 更新 + カード生成スクリプト骨格

**Files:**
- Modify: `docs/superpowers/specs/2026-03-26-notespage-redesign-design.md`
- Create: `scripts/generate-flashcard-templates.ts`

- [ ] **Step 1: NotesPage spec §4.1 の暗記カードセクション更新**

`docs/superpowers/specs/2026-03-26-notespage-redesign-design.md` の §4.1 レイアウト図内にある以下を更新:

変更前:
```
│ ── 暗記カード ──                 │  ← ⑦ 暗記カードセクション（将来）
│ 🔒 準備中                        │
```

変更後:
```
│ ── 暗記カード (3枚) ──           │  ← ⑦ 暗記カードセクション
│ 📖 SI基本単位7つは？        ▶   │     タップで裏面展開
│ 🎵 カドのマスクの中身は？   ▶   │
│ ❓ 光度のSI単位は？         ▶   │
```

§4.2 の表も更新:

変更前:
```
| ⑦ | 暗記カード | 「準備中」プレースホルダー。将来の暗記カード連携用 |
```

変更後:
```
| ⑦ | 暗記カード | FlashCardSection: LearningLinkService.getSourceCards() でこの付箋から生成されたカードを表示。タップで表裏展開。カードなしの場合は「関連カードはまだありません」 |
```

- [ ] **Step 2: カード生成バッチスクリプト骨格を作成**

```typescript
// scripts/generate-flashcard-templates.ts
// 暗記カードテンプレートの AI バッチ生成スクリプト（骨格）
//
// 使い方（将来実装時）:
//   npx tsx scripts/generate-flashcard-templates.ts --source fusen --limit 10
//   npx tsx scripts/generate-flashcard-templates.ts --source explanation --dry-run
//
// 生成フロー:
//   1. 付箋ベース: OfficialNote → Claude API → FlashCardTemplate[] (1付箋→1~3枚)
//   2. 問題解説ベース: Question → Claude API → FlashCardTemplate[] (1問→1~5枚)
//
// 出力: src/data/flashcard-templates.ts を上書き

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// --- 型定義（scripts/ から src/ の型は import できないのでインライン定義） ---

interface GeneratedTemplate {
  source_type: 'fusen' | 'explanation'
  source_id: string
  primary_exemplar_id: string
  subject: string
  front: string
  back: string
  format: 'term_definition' | 'question_answer' | 'mnemonic'
  tags: string[]
}

// --- 設定 ---

const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'flashcard-templates.ts')

// --- メイン ---

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')
  const source = args.find((_, i, arr) => arr[i - 1] === '--source') ?? 'fusen'

  console.log(`=== FlashCard Template Generator ===`)
  console.log(`Source: ${source}`)
  console.log(`Dry run: ${isDryRun}`)
  console.log()

  // TODO: Phase 2 で実装
  // 1. source === 'fusen' の場合:
  //    - official-notes.ts から付箋データを読み込み
  //    - 各付箋の imageUrl + textSummary + tags を Claude API に送信
  //    - 「この付箋から1〜3枚の一問一答を作って」プロンプト
  //    - primary_exemplar_id は note.exemplarIds の最初（未設定時はスキップ）
  //
  // 2. source === 'explanation' の場合:
  //    - all-questions.ts から問題データを読み込み
  //    - question_text + choices + explanation を Claude API に送信
  //    - 「この問題から覚えるべき知識を1〜5枚のカードにして」プロンプト
  //    - primary_exemplar_id は question-exemplar-map の primary
  //
  // 3. 生成結果を FlashCardTemplate[] に変換
  // 4. 既存テンプレートとマージ（ID重複チェック）
  // 5. OUTPUT_PATH に書き出し

  const templates: GeneratedTemplate[] = []

  console.log(`Generated: ${templates.length} templates`)

  if (isDryRun) {
    console.log('(dry run — ファイル書き出しスキップ)')
    return
  }

  if (templates.length === 0) {
    console.log('テンプレートが0件のため書き出しスキップ')
    return
  }

  // TODO: テンプレートを TS ファイルとして書き出し
  console.log(`Output: ${OUTPUT_PATH}`)
}

main().catch(console.error)
```

- [ ] **Step 3: コミット**

```bash
git add docs/superpowers/specs/2026-03-26-notespage-redesign-design.md scripts/generate-flashcard-templates.ts
git commit -m "docs: NotesPage spec 暗記カードセクション更新 + カード生成スクリプト骨格

§4.1「準備中」→ FlashCardSection 仕様に更新。
scripts/generate-flashcard-templates.ts は Phase 2 の AI バッチ生成用骨格。"
```

- [ ] **Step 4: 最終ビルド + テスト**

Run: `npx tsc --noEmit && npx vitest run`

Expected: ビルドエラーなし、全テストパス

- [ ] **Step 5: CLAUDE.md 更新**

`CLAUDE.md` の開発状況セクションに以下を追加:

```
- **FlashCard データ層リファクタリング（2026-03-26）**
  - FlashCard → FlashCardTemplate（公式コンテンツ）+ CardProgress（ユーザー進捗）に分離
  - SM2Scheduler 純粋クラス抽出（12テスト）
  - LearningLinkService: 6種Map逆引きサービス（14テスト）
  - サンプルテンプレート10枚（on-001〜on-003 + 問題解説3枚）
  - IFlashCardTemplateRepo（読み取り専用）+ ICardProgressRepo（localStorage CRUD）
  - useFlashCardTemplates / useCardProgress / useLearningLinks フック
  - FlashCardSection: プレースホルダー → カードプレビューリスト
  - FlashCardPage: PracticeContext 対応（テンプレート練習 + 旧レガシー復習共存）
  - QuestionPage: onFlashCard → PracticeContext 付き遷移
  - 旧 FlashCard 型に @deprecated マーカー
  - カード生成スクリプト骨格: scripts/generate-flashcard-templates.ts
  - **次: FlashCardPage/FlashCardListPage Soft Companion ビジュアルリデザイン**
```

コマンドセクションに追加:
```
- `npx tsx scripts/generate-flashcard-templates.ts --source fusen --dry-run` — カードテンプレート生成（将来実装、現在は骨格のみ）
```

アーキテクチャセクションに追加:
```
- カードテンプレート: `src/data/flashcard-templates.ts`（サンプル10枚）、型: `src/types/flashcard-template.ts`
- カード進捗: localStorage `card_progress` キー、型: `src/types/card-progress.ts`
- SM-2 スケジューラ: `src/utils/sm2-scheduler.ts`（純粋クラス、テスト12件）
- 学習循環サービス: `src/utils/learning-link-service.ts`（6種Map逆引き、テスト14件）
- テンプレート練習UI: `src/components/flashcard/TemplatePractice.tsx`（PracticeContext対応）
```

---

## スコープ外事項（次の計画で対応）

| 項目 | 理由 | 次のアクション |
|------|------|--------------|
| FlashCardPage Soft Companion リデザイン | UI リデザイン spec が未作成 | spec 策定 → 別計画 |
| FlashCardListPage Soft Companion リデザイン | 同上 | 同上 |
| Tinder スワイプ UX | UI リデザイン時に useSwipeNavigation を統合 | 別計画 |
| SM-2 復習キューモード（ホーム「今日のカード」） | HomePage 改修が必要 | HomePage リデザイン時 |
| カード生成 AI バッチ実行 | Claude API 統合が必要 | scripts/generate-flashcard-templates.ts の実装 |
| exemplarIds 投入（AI マッチング） | 付箋→例示リンキングが別タスク | AI マッチングパイプライン |
| 旧 FlashCard 型の完全削除 | FlashCardListPage がまだ依存 | UI リデザイン完了後 |
