# データ品質バリデーター 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全4,140問の問題データを38ルールで自動チェックし、PDF原本と並べてレビュー・修正できるシステムを構築する。

**Architecture:** バリデーションルールを `src/utils/data-validator/` に集約し、CLIスクリプト（`scripts/validate-data.ts`）とVitest（`src/utils/data-validator/__tests__/`）の両方から利用する。レビューUIはVite dev server統合型で `src/dev-tools/review/` に配置し、`import.meta.env.DEV` で本番除外する。

**Tech Stack:** TypeScript 5.9, Vitest 4, React 19, pdf.js (devDependencies), Vite 8

**Spec:** `docs/superpowers/specs/2026-03-24-data-quality-validator-design.md`

**マルチモデル戦略:** 各タスク完了時に `codex review --commit <SHA>` でGPT-5.4レビューを実行し、指摘を修正してから次のタスクへ進む。

**GPT-5.4レビュー分類:**
- **必須レビュー**: Task 2(構造ルール), Task 5(CLIスクリプト), Task 11(PdfViewer), Task 12(CorrectionPanel), Task 14(apply-corrections), Task 15(最終統合)
- **任意レビュー**: その他のタスク（開発者の判断で実行）

---

## GPT-5.4レビュー対応記録（2026-03-24）

以下の指摘11件を反映済み:

| ID | 重要度 | 内容 | 反映箇所 |
|----|--------|------|----------|
| H1 | High | validation-report.json の配信経路: server.fs.allow に reports/ 追加、fetchパスを /@fs/ 経由に | Task 7 Step 1, Task 8 Step 1 |
| H2 | High | answer-format の単一選択チェック追加 | Task 2 Step 1, Step 3 |
| H3 | High | choices-valid テストの矛盾解消: 空配列チェックを choices-valid に統合 | Task 2 Step 1, Step 3 |
| H4 | High | reportTimestamp を corrections.json に含める | Task 12 Step 3 |
| H5 | High | apply-corrections.ts を中間JSON方式に全面書き換え | Task 14 |
| M1 | Medium | 設計書更新ノートセクション追加 | 末尾に新セクション |
| M2 | Medium | PWA除外: navigateFallbackDenylist 追加 | Task 7 Step 1 |
| M3 | Medium | TDDの粒度注記追加 | Task 2, 3, 4 |
| M4 | Medium | 品質ルール判定方針の補足追加 | Task 4 Step 3 |
| M5 | Medium | confirmedPdfPages の型修正 | Task 8 Step 2, Task 11 Step 1 |
| L1 | Low | GPT-5.4レビューポイントを必須/任意に分類 | マルチモデル戦略セクション + 各タスク |

---

## ファイル構成

### 新規作成ファイル

```
src/utils/data-validator/
  types.ts                  ← Severity, ValidationIssue, ValidationReport 型
  index.ts                  ← runAllRules() エントリポイント
  rules/
    structural.ts           ← レベル① 構造チェック（13ルール）
    consistency.ts          ← レベル② 整合性チェック（10ルール）
    quality.ts              ← レベル③ 品質チェック（15ルール）
  __tests__/
    structural.test.ts      ← 構造ルールのテスト
    consistency.test.ts     ← 整合性ルールのテスト
    quality.test.ts         ← 品質ルールのテスト

scripts/
  validate-data.ts          ← CLI エントリ（npm run validate）

src/dev-tools/
  review/
    ReviewPage.tsx           ← メインページ
    ReviewPage.module.css    ← スタイル
    components/
      ReviewHeader.tsx       ← フィルタ・進捗バー
      ReviewCard.tsx         ← 問題レビューカード（右パネル）
      PdfViewer.tsx          ← PDF表示（左パネル）
      CorrectionPanel.tsx    ← 修正入力パネル
      PdfCropper.tsx         ← PDF上のドラッグクロップ
      KeyboardHelp.tsx       ← ショートカットヘルプモーダル
    hooks/
      useValidationReport.ts ← レポートJSON読み込み
      useReviewState.ts      ← 判定状態管理（localStorage）
      useKeyboardNav.ts      ← キーボードショートカット
      usePdfNavigation.ts    ← PDF年度・ページ管理
    types.ts                 ← ReviewState, Correction 等の型
    pdf-file-map.ts          ← 年度×区分→PDFファイルのマスタ

reports/                     ← バリデーションレポート出力先（.gitignore追加）
```

### 変更するファイル

```
src/routes.tsx              ← dev-tools ルート追加（DEV条件分岐）
vite.config.ts              ← server.fs.allow に data/pdfs + reports/ を追加、PWA navigateFallbackDenylist 追加
package.json                ← scripts.validate 追加、pdfjs-dist を devDependencies に追加
.gitignore                  ← reports/ を追加
```

---

## Phase 1: バリデーター本体（🅰）

### Task 1: 型定義とプロジェクト設定

**Files:**
- Create: `src/utils/data-validator/types.ts`
- Modify: `package.json` — scripts に `validate` 追加
- Modify: `.gitignore` — `reports/` 追加

- [ ] **Step 1: types.ts を作成**

```typescript
// src/utils/data-validator/types.ts
import type { Question } from '@/types/question'

export type Severity = 'error' | 'warning' | 'info'

export interface ValidationIssue {
  questionId: string
  rule: string
  severity: Severity
  message: string
  field?: string
  expected?: unknown
  actual?: unknown
}

export type ValidationRule = (questions: Question[], context: ValidationContext) => ValidationIssue[]

export interface ValidationContext {
  topicMap: Record<string, string>
  blueprintTopicIds: Set<string>
  exemplarQuestionIds: Set<string>
  officialNotes: Array<{ id: string; linkedQuestionIds: string[]; topicId: string }>
  questionIds: Set<string>
  imageDir: string
}

export interface ValidationReport {
  timestamp: string
  gitCommit: string
  totalQuestions: number
  passCount: number
  issues: ValidationIssue[]
  summary: Record<Severity, number>
  byYear: Record<number, { total: number; issues: number }>
  byRule: Record<string, number>
}
```

- [ ] **Step 2: package.json に validate スクリプト追加**

`package.json` の `scripts` に追加:
```json
"validate": "tsx scripts/validate-data.ts"
```

- [ ] **Step 3: .gitignore に reports/ 追加**

`.gitignore` に追加:
```
reports/
```

- [ ] **Step 4: コミット**

```bash
git add src/utils/data-validator/types.ts package.json .gitignore
git commit -m "feat: データバリデーター型定義 + プロジェクト設定"
```

---

### Task 2: 構造チェックルール（13ルール）— テスト先行

**Files:**
- Create: `src/utils/data-validator/rules/structural.ts`
- Create: `src/utils/data-validator/__tests__/structural.test.ts`

- [ ] **Step 1: テストファイルを作成**

```typescript
// src/utils/data-validator/__tests__/structural.test.ts
import { describe, it, expect } from 'vitest'
import { structuralRules } from '../rules/structural'
import type { Question } from '@/types/question'
import type { ValidationContext } from '../types'

// テスト用のダミーコンテキスト
const dummyContext: ValidationContext = {
  topicMap: {},
  blueprintTopicIds: new Set(),
  exemplarQuestionIds: new Set(),
  officialNotes: [],
  questionIds: new Set(),
  imageDir: '',
}

// 正常な問題データのファクトリ
function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'r110-001',
    year: 110,
    question_number: 1,
    section: '必須',
    subject: '物理',
    category: '必須問題 - 問 1',
    question_text: 'テスト問題文。１つ選べ。',
    choices: [
      { key: 1, text: '選択肢1' },
      { key: 2, text: '選択肢2' },
      { key: 3, text: '選択肢3' },
      { key: 4, text: '選択肢4' },
      { key: 5, text: '選択肢5' },
    ],
    correct_answer: 3,
    explanation: '【ポイント】正答は3。理由は...',
    tags: [],
    ...overrides,
  }
}

describe('構造チェックルール', () => {
  // ルール1: id-format
  describe('id-format', () => {
    it('正常なIDはエラーなし', () => {
      const issues = structuralRules([makeQuestion()], dummyContext)
      expect(issues.filter(i => i.rule === 'id-format')).toHaveLength(0)
    })
    it('不正ID "r10-1" はエラー', () => {
      const issues = structuralRules([makeQuestion({ id: 'r10-1' })], dummyContext)
      expect(issues.filter(i => i.rule === 'id-format')).toHaveLength(1)
    })
    it('不正ID "abc" はエラー', () => {
      const issues = structuralRules([makeQuestion({ id: 'abc' })], dummyContext)
      expect(issues.filter(i => i.rule === 'id-format')).toHaveLength(1)
    })
  })

  // ルール2: id-year-match
  describe('id-year-match', () => {
    it('IDとyearが一致していればエラーなし', () => {
      const issues = structuralRules([makeQuestion({ id: 'r110-001', year: 110 })], dummyContext)
      expect(issues.filter(i => i.rule === 'id-year-match')).toHaveLength(0)
    })
    it('IDとyearが不一致ならエラー', () => {
      const issues = structuralRules([makeQuestion({ id: 'r110-001', year: 100 })], dummyContext)
      expect(issues.filter(i => i.rule === 'id-year-match')).toHaveLength(1)
    })
  })

  // ルール3: id-qnum-match
  describe('id-qnum-match', () => {
    it('IDとquestion_numberが一致していればエラーなし', () => {
      const issues = structuralRules([makeQuestion({ id: 'r110-001', question_number: 1 })], dummyContext)
      expect(issues.filter(i => i.rule === 'id-qnum-match')).toHaveLength(0)
    })
    it('IDとquestion_numberが不一致ならエラー', () => {
      const issues = structuralRules([makeQuestion({ id: 'r110-001', question_number: 99 })], dummyContext)
      expect(issues.filter(i => i.rule === 'id-qnum-match')).toHaveLength(1)
    })
  })

  // ルール4: year-range
  describe('year-range', () => {
    it('yearが100-111ならエラーなし', () => {
      const issues = structuralRules([makeQuestion({ year: 100 })], dummyContext)
      expect(issues.filter(i => i.rule === 'year-range')).toHaveLength(0)
    })
    it('yearが99ならエラー', () => {
      const issues = structuralRules([makeQuestion({ year: 99, id: 'r099-001' })], dummyContext)
      expect(issues.filter(i => i.rule === 'year-range')).toHaveLength(1)
    })
  })

  // ルール6: choices-valid（H3: 空配列もchoices-validでチェック）
  describe('choices-valid', () => {
    it('正常な選択肢はエラーなし', () => {
      const issues = structuralRules([makeQuestion()], dummyContext)
      expect(issues.filter(i => i.rule === 'choices-valid')).toHaveLength(0)
    })
    it('空の選択肢配列はchoices-validエラー', () => {
      const issues = structuralRules([makeQuestion({ choices: [] })], dummyContext)
      expect(issues.filter(i => i.rule === 'choices-valid')).toHaveLength(1)
    })
    it('keyが重複している選択肢はエラー', () => {
      const issues = structuralRules([makeQuestion({
        choices: [{ key: 1, text: 'A' }, { key: 1, text: 'B' }],
        correct_answer: 1,
      })], dummyContext)
      expect(issues.filter(i => i.rule === 'choices-valid')).toHaveLength(1)
    })
  })

  // ルール7: answer-in-choices
  describe('answer-in-choices', () => {
    it('正答が選択肢に含まれていればエラーなし', () => {
      const issues = structuralRules([makeQuestion({ correct_answer: 3 })], dummyContext)
      expect(issues.filter(i => i.rule === 'answer-in-choices')).toHaveLength(0)
    })
    it('正答が選択肢に含まれていなければエラー', () => {
      const issues = structuralRules([makeQuestion({ correct_answer: 9 })], dummyContext)
      expect(issues.filter(i => i.rule === 'answer-in-choices')).toHaveLength(1)
    })
    it('複数選択で全答が選択肢に含まれていればエラーなし', () => {
      const issues = structuralRules([makeQuestion({ correct_answer: [1, 3] })], dummyContext)
      expect(issues.filter(i => i.rule === 'answer-in-choices')).toHaveLength(0)
    })
  })

  // ルール10: id-unique
  describe('id-unique', () => {
    it('ID重複なしならエラーなし', () => {
      const q1 = makeQuestion({ id: 'r110-001' })
      const q2 = makeQuestion({ id: 'r110-002', question_number: 2 })
      const issues = structuralRules([q1, q2], dummyContext)
      expect(issues.filter(i => i.rule === 'id-unique')).toHaveLength(0)
    })
    it('ID重複ありならエラー', () => {
      const q1 = makeQuestion({ id: 'r110-001' })
      const q2 = makeQuestion({ id: 'r110-001' })
      const issues = structuralRules([q1, q2], dummyContext)
      expect(issues.filter(i => i.rule === 'id-unique').length).toBeGreaterThan(0)
    })
  })

  // ルール12: answer-format
  describe('answer-format', () => {
    it('単一選択でscalarならエラーなし', () => {
      const issues = structuralRules([makeQuestion({ correct_answer: 3 })], dummyContext)
      expect(issues.filter(i => i.rule === 'answer-format')).toHaveLength(0)
    })
    it('複数選択で昇順配列ならエラーなし', () => {
      const issues = structuralRules([makeQuestion({
        correct_answer: [1, 3],
        question_text: 'テスト。２つ選べ。',
      })], dummyContext)
      expect(issues.filter(i => i.rule === 'answer-format')).toHaveLength(0)
    })
    it('複数選択で降順配列ならエラー', () => {
      const issues = structuralRules([makeQuestion({
        correct_answer: [3, 1],
        question_text: 'テスト。２つ選べ。',
      })], dummyContext)
      expect(issues.filter(i => i.rule === 'answer-format')).toHaveLength(1)
    })
    // H2: 単一選択なのに配列のケース
    it('「１つ選べ」なのにcorrect_answerが配列ならエラー', () => {
      const issues = structuralRules([makeQuestion({
        correct_answer: [1, 3],
        question_text: 'テスト。１つ選べ。',
      })], dummyContext)
      expect(issues.filter(i => i.rule === 'answer-format')).toHaveLength(1)
    })
    it('「つ選べ」が不在でcorrect_answerが配列ならエラー', () => {
      const issues = structuralRules([makeQuestion({
        correct_answer: [1, 3],
        question_text: 'テスト問題文。',
      })], dummyContext)
      expect(issues.filter(i => i.rule === 'answer-format')).toHaveLength(1)
    })
  })

  // ルール13: answer-no-duplicate
  describe('answer-no-duplicate', () => {
    it('配列に重複がなければエラーなし', () => {
      const issues = structuralRules([makeQuestion({ correct_answer: [1, 3] })], dummyContext)
      expect(issues.filter(i => i.rule === 'answer-no-duplicate')).toHaveLength(0)
    })
    it('配列に重複があればエラー', () => {
      const issues = structuralRules([makeQuestion({ correct_answer: [1, 1] })], dummyContext)
      expect(issues.filter(i => i.rule === 'answer-no-duplicate')).toHaveLength(1)
    })
  })
})
```

- [ ] **Step 2: テスト実行 → 全件FAILを確認**

```bash
npx vitest run src/utils/data-validator/__tests__/structural.test.ts
```
Expected: FAIL（`structuralRules` が存在しない）

- [ ] **Step 3: structural.ts を実装**

```typescript
// src/utils/data-validator/rules/structural.ts
import type { Question } from '@/types/question'
import type { ValidationIssue, ValidationContext } from '../types'

const ID_PATTERN = /^r(\d{3})-(\d{3})$/

export function structuralRules(questions: Question[], _context: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // ルール10: id-unique（全問横断）
  const idCounts = new Map<string, number>()
  for (const q of questions) {
    idCounts.set(q.id, (idCounts.get(q.id) ?? 0) + 1)
  }
  for (const [id, count] of idCounts) {
    if (count > 1) {
      issues.push({ questionId: id, rule: 'id-unique', severity: 'error', message: `IDが${count}回重複`, field: 'id' })
    }
  }

  // ルール11: qnum-unique-in-year（年度内）
  const yearQnumMap = new Map<string, string[]>()
  for (const q of questions) {
    const key = `${q.year}-${q.question_number}`
    const ids = yearQnumMap.get(key) ?? []
    ids.push(q.id)
    yearQnumMap.set(key, ids)
  }
  for (const [key, ids] of yearQnumMap) {
    if (ids.length > 1) {
      for (const id of ids) {
        issues.push({ questionId: id, rule: 'qnum-unique-in-year', severity: 'error', message: `同一年度内でquestion_number重複: ${key}`, field: 'question_number' })
      }
    }
  }

  for (const q of questions) {
    // ルール1: id-format
    const idMatch = q.id.match(ID_PATTERN)
    if (!idMatch) {
      issues.push({ questionId: q.id, rule: 'id-format', severity: 'error', message: `ID形式不正: "${q.id}"（期待: r{3桁}-{3桁}）`, field: 'id', expected: 'r{3桁}-{3桁}', actual: q.id })
      continue // ID不正ならid-year-match等はスキップ
    }

    const idYear = parseInt(idMatch[1], 10)
    const idQnum = parseInt(idMatch[2], 10)

    // ルール2: id-year-match
    if (idYear !== q.year) {
      issues.push({ questionId: q.id, rule: 'id-year-match', severity: 'error', message: `ID年度(${idYear})とyear(${q.year})が不一致`, field: 'year', expected: idYear, actual: q.year })
    }

    // ルール3: id-qnum-match
    if (idQnum !== q.question_number) {
      issues.push({ questionId: q.id, rule: 'id-qnum-match', severity: 'error', message: `ID問番(${idQnum})とquestion_number(${q.question_number})が不一致`, field: 'question_number', expected: idQnum, actual: q.question_number })
    }

    // ルール4: year-range
    if (q.year < 100 || q.year > 111) {
      issues.push({ questionId: q.id, rule: 'year-range', severity: 'error', message: `yearが範囲外: ${q.year}（期待: 100-111）`, field: 'year', expected: '100-111', actual: q.year })
    }

    // ルール5: required-fields
    if (!q.question_text?.trim()) {
      issues.push({ questionId: q.id, rule: 'required-fields', severity: 'error', message: 'question_textが空', field: 'question_text' })
    }
    if (!q.choices || q.choices.length === 0) {
      issues.push({ questionId: q.id, rule: 'required-fields', severity: 'error', message: 'choicesが空', field: 'choices' })
    }
    if (q.correct_answer === undefined || q.correct_answer === null) {
      issues.push({ questionId: q.id, rule: 'required-fields', severity: 'error', message: 'correct_answerが未設定', field: 'correct_answer' })
    }
    if (!q.section) {
      issues.push({ questionId: q.id, rule: 'required-fields', severity: 'error', message: 'sectionが空', field: 'section' })
    }
    if (!q.subject) {
      issues.push({ questionId: q.id, rule: 'required-fields', severity: 'error', message: 'subjectが空', field: 'subject' })
    }

    // ルール6: choices-valid（H3: 空配列もchoices-validでチェック）
    if (q.choices) {
      if (q.choices.length === 0) {
        issues.push({ questionId: q.id, rule: 'choices-valid', severity: 'error', message: '選択肢が空配列', field: 'choices' })
      } else {
        if (q.choices.length > 5) {
          issues.push({ questionId: q.id, rule: 'choices-valid', severity: 'error', message: `選択肢が${q.choices.length}個（最大5）`, field: 'choices' })
        }
        const keys = q.choices.map(c => c.key)
        const uniqueKeys = new Set(keys)
        if (uniqueKeys.size !== keys.length) {
          issues.push({ questionId: q.id, rule: 'choices-valid', severity: 'error', message: 'key重複あり', field: 'choices', actual: keys })
        }
        for (const c of q.choices) {
          if (c.key < 1 || c.key > 5) {
            issues.push({ questionId: q.id, rule: 'choices-valid', severity: 'error', message: `key値が範囲外: ${c.key}`, field: 'choices' })
          }
        }
      }
    }

    // ルール7: answer-in-choices
    if (q.choices && q.choices.length > 0 && q.correct_answer !== undefined) {
      const choiceKeys = new Set(q.choices.map(c => c.key))
      const answers = Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer]
      for (const a of answers) {
        if (!choiceKeys.has(a)) {
          issues.push({ questionId: q.id, rule: 'answer-in-choices', severity: 'error', message: `正答 ${a} が選択肢に含まれない`, field: 'correct_answer', expected: [...choiceKeys], actual: a })
        }
      }
    }

    // ルール8: section-enum
    const validSections = ['必須', '理論', '実践']
    if (!validSections.includes(q.section)) {
      issues.push({ questionId: q.id, rule: 'section-enum', severity: 'error', message: `section不正: "${q.section}"`, field: 'section', expected: validSections, actual: q.section })
    }

    // ルール9: subject-enum
    const validSubjects = ['物理', '化学', '生物', '衛生', '薬理', '薬剤', '病態・薬物治療', '法規・制度・倫理', '実務']
    if (!validSubjects.includes(q.subject)) {
      issues.push({ questionId: q.id, rule: 'subject-enum', severity: 'error', message: `subject不正: "${q.subject}"`, field: 'subject', expected: validSubjects, actual: q.subject })
    }

    // ルール12: answer-format
    if (q.correct_answer !== undefined) {
      if (Array.isArray(q.correct_answer)) {
        // H2: 「つ選べ」が1または不在なのに配列の場合はerror
        const selectCountMatch = q.question_text?.match(/[０-９0-9]つ選べ/)
        const selectCountStr = selectCountMatch?.[0]?.charAt(0) ?? null
        const selectCount = selectCountStr
          ? parseInt(selectCountStr.replace(/[０-９]/g, (c) => String('０１２３４５６７８９'.indexOf(c))), 10)
          : null // 「つ選べ」不在
        if (selectCount === null || selectCount === 1) {
          issues.push({ questionId: q.id, rule: 'answer-format', severity: 'error', message: `単一選択（${selectCount === null ? '「つ選べ」不在' : '1つ選べ'}）なのにcorrect_answerが配列`, field: 'correct_answer', expected: 'scalar', actual: q.correct_answer })
        }
        // 昇順チェック
        const sorted = [...q.correct_answer].sort((a, b) => a - b)
        if (JSON.stringify(q.correct_answer) !== JSON.stringify(sorted)) {
          issues.push({ questionId: q.id, rule: 'answer-format', severity: 'error', message: '複数選択の正答が昇順でない', field: 'correct_answer', expected: sorted, actual: q.correct_answer })
        }
      }
    }

    // ルール13: answer-no-duplicate
    if (Array.isArray(q.correct_answer)) {
      const uniqueAnswers = new Set(q.correct_answer)
      if (uniqueAnswers.size !== q.correct_answer.length) {
        issues.push({ questionId: q.id, rule: 'answer-no-duplicate', severity: 'error', message: '正答配列に重複あり', field: 'correct_answer', actual: q.correct_answer })
      }
    }
  }

  return issues
}
```

- [ ] **Step 4: テスト実行 → 全件PASS確認**

```bash
npx vitest run src/utils/data-validator/__tests__/structural.test.ts
```
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/utils/data-validator/rules/structural.ts src/utils/data-validator/__tests__/structural.test.ts
git commit -m "feat: 構造チェック13ルール + テスト（TDD）"
```

- [ ] **Step 6: GPT-5.4レビュー（必須）**

```bash
codex review --commit HEAD
```
指摘があれば修正 → 再コミット

> **M3: TDD粒度の注記:** 上記テストは代表例。全13ルールに対して「正常系・異常系・誤検知防止」の3テストを必ず書くこと。残りのルール（year-range, required-fields, section-enum, subject-enum, qnum-unique-in-year 等）も同じパターンで全て網羅する。

---

### Task 3: 整合性チェックルール（10ルール）— テスト先行

**Files:**
- Create: `src/utils/data-validator/rules/consistency.ts`
- Create: `src/utils/data-validator/__tests__/consistency.test.ts`

- [ ] **Step 1: テストファイルを作成**

テスト内容:
- `topic-map-exists`: QUESTION_TOPIC_MAPにエントリがない問題を検出
- `topic-id-valid`: 存在しないトピックIDを検出
- `exemplar-map-exists`: QUESTION_EXEMPLAR_MAPにエントリがない問題を検出
- `linked-group-format`: 不正形式の linked_group を検出
- `linked-group-complete`: linked_group 内の歯抜けを検出
- `linked-group-same-year`: linked_group 内で異なる年度/区分を検出
- `linked-scenario-shared`: linked_group 内でシナリオ不一致を検出
- `note-question-exists`: 付箋が参照する不在questionIdを検出
- `note-topic-valid`: 付箋の不在topicIdを検出
- `image-file-exists`: image_url設定済みだが実ファイル不在を検出

各ルールに正常系・異常系・誤検知防止テストを用意。
テストでは `dummyContext` を拡張して `topicMap`, `blueprintTopicIds` 等を設定。

- [ ] **Step 2: テスト実行 → FAIL確認**
- [ ] **Step 3: consistency.ts を実装**

整合性ルールは `ValidationContext` のデータを使って参照チェックする。
linked_group のチェックは: まず全問から linked_group を持つ問題を集め、group ごとにまとめてからチェック。

- [ ] **Step 4: テスト実行 → PASS確認**
- [ ] **Step 5: コミット**

```bash
git commit -m "feat: 整合性チェック10ルール + テスト（TDD）"
```

- [ ] **Step 6: GPT-5.4レビュー（任意）**

> **M3: TDD粒度の注記:** 上記ルール一覧は代表例。全10ルールに対して「正常系・異常系・誤検知防止」の3テストを必ず書くこと。特に linked-group 系ルールは誤検知防止テスト（単問でlinked_groupがnullの場合は無視される等）を重点的に。

---

### Task 4: 品質チェックルール（15ルール）— テスト先行

**Files:**
- Create: `src/utils/data-validator/rules/quality.ts`
- Create: `src/utils/data-validator/__tests__/quality.test.ts`

- [ ] **Step 1: テストファイルを作成**

**特に重要な誤検知防止テスト:**
```typescript
// choice-text-empty: 画像選択肢は除外
it('choice_type="image" で text="" はエラーにならないこと', () => {
  const q = makeQuestion({
    choices: [
      { key: 1, text: '', choice_type: 'image' },
      { key: 2, text: '', choice_type: 'structural_formula' },
    ],
    correct_answer: 1,
  })
  const issues = qualityRules([q], dummyContext)
  expect(issues.filter(i => i.rule === 'choice-text-empty')).toHaveLength(0)
})

// choice-text-truncated: 画像選択肢は除外
it('choice_type="graph" で text="1" はwarningにならないこと', () => { ... })

// choice-text-duplicate: 画像選択肢「1.」「2.」の重複は除外しない（これは実際の問題）
it('同じtext "K+" が2個あればerror', () => { ... })
```

**回帰テスト:** tier1-review で発見済みの問題パターンを再現:
```typescript
describe('回帰テスト: tier1-review既知問題', () => {
  it('問題文への表データ混入パターンを検出', () => {
    const q = makeQuestion({
      question_text: 'テトラカインの局所麻酔作用。\nチャネル活性化\nチャネル遮断\nチャネル活性化\nチャネル遮断\nチャネル活性化',
    })
    const issues = qualityRules([q], dummyContext)
    expect(issues.some(i => i.rule === 'question-text-table-leak')).toBe(true)
  })
})
```

- [ ] **Step 2: テスト実行 → FAIL確認**
- [ ] **Step 3: quality.ts を実装**

検出ロジックのポイント:
- `text-contamination`: 正規表現 `/問\s*\d{1,3}\s*[（(]/` で「問XXX（」パターンを検出
- `question-text-table-leak`: 同じフレーズが3回以上繰り返されるかチェック
- `question-text-choice-leak`: 選択肢テキストが問題文末尾に出現するかチェック
- `select-count-missing`: 正規表現 `/[^０-９0-9]つ選べ/` で数字欠損を検出
- `choice-count-mismatch`: 問題文から「Nつ選べ」のNを抽出し、correct_answer 配列長と比較
- `choice-text-empty` / `choice-text-truncated`: `choice_type` が `'text'` or `undefined` の場合のみチェック

**M4: 追加ルール判定方針:**
- `image-visual-type`: `image_url` が存在 && `visual_content_type` が未設定 → **info**（画像付き問題にvisualタイプ情報が欠落している可能性の通知）
- `duplicate-question-text`: 全問の `question_text` をハッシュ化してグループ化、2件以上のグループを検出 → **warning**（重複問題文の可能性）
- `image-only-choices`: 全選択肢の text が正規表現 `/^\d+\.?$/` にマッチ → **info**（選択肢が画像のみで番号だけの可能性を通知）
- `display-mode-consistency`: `display_mode_override='text'` なのに `image_url` あり、等の矛盾 → **info**（表示モード設定と実データの不整合通知）

- [ ] **Step 4: テスト実行 → PASS確認**
- [ ] **Step 5: コミット**

```bash
git commit -m "feat: 品質チェック15ルール + テスト（TDD）"
```

- [ ] **Step 6: GPT-5.4レビュー（任意）**

> **M3: TDD粒度の注記:** 上記テストは代表例。全15ルールに対して「正常系・異常系・誤検知防止」の3テストを必ず書くこと。特に choice-text-empty / choice-text-truncated は `choice_type` による除外の誤検知防止テストが重要。

---

### Task 5: バリデーターエントリポイント + CLIスクリプト

**Files:**
- Create: `src/utils/data-validator/index.ts`
- Create: `scripts/validate-data.ts`

- [ ] **Step 1: index.ts を作成**

```typescript
// src/utils/data-validator/index.ts
import type { Question } from '@/types/question'
import type { ValidationContext, ValidationIssue, ValidationReport, Severity } from './types'
import { structuralRules } from './rules/structural'
import { consistencyRules } from './rules/consistency'
import { qualityRules } from './rules/quality'

export function runAllRules(questions: Question[], context: ValidationContext): ValidationReport {
  const allIssues: ValidationIssue[] = [
    ...structuralRules(questions, context),
    ...consistencyRules(questions, context),
    ...qualityRules(questions, context),
  ]

  // 問題ごとのissue有無
  const questionIdsWithIssues = new Set(allIssues.map(i => i.questionId))

  // 年度別集計
  const byYear: Record<number, { total: number; issues: number }> = {}
  for (const q of questions) {
    if (!byYear[q.year]) byYear[q.year] = { total: 0, issues: 0 }
    byYear[q.year].total++
    if (questionIdsWithIssues.has(q.id)) byYear[q.year].issues++
  }

  // ルール別集計
  const byRule: Record<string, number> = {}
  for (const issue of allIssues) {
    byRule[issue.rule] = (byRule[issue.rule] ?? 0) + 1
  }

  // 深刻度別集計
  const summary: Record<Severity, number> = { error: 0, warning: 0, info: 0 }
  for (const issue of allIssues) {
    summary[issue.severity]++
  }

  return {
    timestamp: new Date().toISOString(),
    gitCommit: '', // CLIスクリプト側で埋める
    totalQuestions: questions.length,
    passCount: questions.length - questionIdsWithIssues.size,
    issues: allIssues,
    summary,
    byYear,
    byRule,
  }
}

export type { ValidationIssue, ValidationReport, ValidationContext, Severity } from './types'
```

- [ ] **Step 2: CLIスクリプトを作成**

```typescript
// scripts/validate-data.ts
import { execSync } from 'child_process'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ALL_QUESTIONS } from '../src/data/all-questions'
import { QUESTION_TOPIC_MAP } from '../src/data/question-topic-map'
import { QUESTION_EXEMPLAR_MAP } from '../src/data/question-exemplar-map'
import { EXAM_BLUEPRINT } from '../src/data/exam-blueprint'
import { OFFICIAL_NOTES } from '../src/data/official-notes'
import { runAllRules } from '../src/utils/data-validator/index'
import type { ValidationContext, Severity } from '../src/utils/data-validator/types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const reportsDir = path.join(__dirname, '..', 'reports')

// コンテキスト構築
const blueprintTopicIds = new Set<string>()
for (const bp of EXAM_BLUEPRINT) {
  for (const major of bp.majorCategories) {
    for (const mid of major.middleCategories) {
      blueprintTopicIds.add(mid.id)
    }
  }
}

const context: ValidationContext = {
  topicMap: QUESTION_TOPIC_MAP,
  blueprintTopicIds,
  exemplarQuestionIds: new Set(QUESTION_EXEMPLAR_MAP.map(m => m.questionId)),
  officialNotes: OFFICIAL_NOTES.map(n => ({
    id: n.id,
    linkedQuestionIds: n.linkedQuestionIds,
    topicId: n.topicId,
  })),
  questionIds: new Set(ALL_QUESTIONS.map(q => q.id)),
  imageDir: path.join(__dirname, '..', 'public', 'images', 'questions'),
}

// バリデーション実行
const report = runAllRules(ALL_QUESTIONS, context)

// gitコミット取得
try {
  report.gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim()
} catch {
  report.gitCommit = 'unknown'
}

// ターミナル出力
const total = report.totalQuestions
const errorCount = report.summary.error
const warnCount = report.summary.warning
const infoCount = report.summary.info

console.log(`\n📊 データ品質レポート（${total}問）`)
console.log('━'.repeat(40))
console.log(`❌ error:   ${errorCount}件`)
console.log(`⚠️  warning: ${warnCount}件`)
console.log(`💡 info:    ${infoCount}件`)
console.log()

// 年度別
console.log('年度別:')
for (let year = 100; year <= 111; year++) {
  const y = report.byYear[year]
  if (!y) continue
  const bar = '⬛'.repeat(Math.round((1 - y.issues / y.total) * 10)) + '░'.repeat(Math.round(y.issues / y.total * 10))
  console.log(`  ${year}回: ${bar}  ${y.issues}件`)
}

// ルール別
console.log('\nルール別:')
const sortedRules = Object.entries(report.byRule).sort((a, b) => b[1] - a[1])
for (const [rule, count] of sortedRules.slice(0, 10)) {
  console.log(`  ${rule}: ${count}件`)
}

// JSON出力
if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true })
const reportPath = path.join(reportsDir, 'validation-report.json')
writeFileSync(reportPath, JSON.stringify(report, null, 2))
console.log(`\n📁 詳細: ${reportPath}`)

// エラーがあれば exit 1
if (errorCount > 0) {
  console.log(`\n❌ ${errorCount}件のerrorがあります`)
  process.exit(1)
}
console.log('\n✅ errorなし')
```

- [ ] **Step 3: 実行テスト**

```bash
npm run validate
```
Expected: レポートが表示され、`reports/validation-report.json` が生成される

- [ ] **Step 4: コミット**

```bash
git commit -m "feat: バリデーターエントリポイント + CLIスクリプト（npm run validate）"
```

- [ ] **Step 5: GPT-5.4レビュー（必須）**

---

### Task 6: Vitestテスト統合（実データ回帰テスト）

**Files:**
- Create: `src/utils/data-validator/__tests__/real-data.test.ts`

- [ ] **Step 1: 実データでの回帰テストを作成**

```typescript
// src/utils/data-validator/__tests__/real-data.test.ts
import { describe, it, expect } from 'vitest'
import { ALL_QUESTIONS } from '@/data/all-questions'
import { QUESTION_TOPIC_MAP } from '@/data/question-topic-map'
import { QUESTION_EXEMPLAR_MAP } from '@/data/question-exemplar-map'
import { EXAM_BLUEPRINT } from '@/data/exam-blueprint'
import { OFFICIAL_NOTES } from '@/data/official-notes'
import { runAllRules } from '../index'
import type { ValidationContext } from '../types'

// コンテキスト構築（CLIスクリプトと同じ）
const blueprintTopicIds = new Set<string>()
for (const bp of EXAM_BLUEPRINT) {
  for (const major of bp.majorCategories) {
    for (const mid of major.middleCategories) {
      blueprintTopicIds.add(mid.id)
    }
  }
}

const context: ValidationContext = {
  topicMap: QUESTION_TOPIC_MAP,
  blueprintTopicIds,
  exemplarQuestionIds: new Set(QUESTION_EXEMPLAR_MAP.map(m => m.questionId)),
  officialNotes: OFFICIAL_NOTES.map(n => ({
    id: n.id,
    linkedQuestionIds: n.linkedQuestionIds,
    topicId: n.topicId,
  })),
  questionIds: new Set(ALL_QUESTIONS.map(q => q.id)),
  imageDir: '', // テスト時はファイル存在チェックをスキップ
}

describe('実データバリデーション', () => {
  const report = runAllRules(ALL_QUESTIONS, context)

  it('全4,140問が読み込まれること', () => {
    expect(ALL_QUESTIONS.length).toBeGreaterThanOrEqual(4000)
  })

  it('severity=error が既知の許容範囲内であること', () => {
    // 初回実行時の件数をここに記録し、以降は増えないことを保証
    // 初回は大きめの数値を設定し、修正が進むにつれて下げる
    console.log(`error: ${report.summary.error}, warning: ${report.summary.warning}, info: ${report.summary.info}`)
    // 回帰防止: errorが増えていないことを確認（閾値は初回実行後に設定）
    expect(report.summary.error).toBeLessThanOrEqual(100) // 初期閾値（修正後に下げる）
  })

  it('レポート構造が正しいこと', () => {
    expect(report.totalQuestions).toBe(ALL_QUESTIONS.length)
    expect(report.passCount + new Set(report.issues.map(i => i.questionId)).size).toBe(report.totalQuestions)
    expect(report.summary.error + report.summary.warning + report.summary.info).toBe(report.issues.length)
  })
})
```

- [ ] **Step 2: テスト実行**

```bash
npx vitest run src/utils/data-validator/__tests__/real-data.test.ts
```
Expected: PASS（初期閾値は大きめに設定）

- [ ] **Step 3: 閾値を実際の値に更新**

実行結果の error 件数を確認し、閾値をその値 +10% に設定。

- [ ] **Step 4: コミット**

```bash
git commit -m "feat: 実データ回帰テスト追加"
```

- [ ] **Step 5: GPT-5.4レビュー（任意）**

---

## Phase 2: レビューUI（🅱）

### Task 7: Vite設定 + ルーティング + 型定義

**Files:**
- Modify: `vite.config.ts` — server.fs.allow 追加
- Modify: `src/routes.tsx` — dev-tools ルート追加
- Create: `src/dev-tools/review/types.ts` — ReviewState, Correction型
- Create: `src/dev-tools/review/pdf-file-map.ts` — PDFファイルマッピング
- Modify: `package.json` — pdfjs-dist を devDependencies に追加

- [ ] **Step 1: vite.config.ts に server.fs.allow 追加 + PWA除外設定**

`defineConfig` 内に追加:
```typescript
import path from 'path'

// plugins, build 等の後に:
server: {
  fs: {
    allow: [
      path.resolve(__dirname, 'data/pdfs'),
      path.resolve(__dirname, 'public/images'),
      path.resolve(__dirname, 'reports'),  // H1: validation-report.json 配信用
    ]
  }
},
```

また、`VitePWA` 設定内に以下を追加（M2: dev-tools をService Workerキャッシュから除外）:
```typescript
workbox: {
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  navigateFallbackDenylist: [/^\/dev-tools/],  // M2: dev-toolsをPWAキャッシュから除外
},
```

- [ ] **Step 2: pdfjs-dist をインストール**

```bash
npm install --save-dev pdfjs-dist
```

- [ ] **Step 3: dev-tools/review/types.ts を作成**

設計書の型定義をそのまま実装（Correction, PdfCropRect, CorrectionsFile, ReviewState等）。

- [ ] **Step 4: pdf-file-map.ts を作成**

`data/pdfs/` の実際のファイル一覧から `PDF_FILE_MAP` を構築。

```bash
ls data/pdfs/*.pdf
```
で確認し、マッピングテーブルを生成。

- [ ] **Step 5: src/routes.tsx に dev-tools ルート追加**

```typescript
// 既存の import の後に追加:
const DevToolsReview = import.meta.env.DEV
  ? React.lazy(() => import('./dev-tools/review/ReviewPage'))
  : null

// createBrowserRouter 配列の末尾に追加:
...(import.meta.env.DEV && DevToolsReview ? [{
  path: '/dev-tools/review',
  element: <Suspense fallback={<Loading />}><DevToolsReview /></Suspense>,
}] : []),
```

- [ ] **Step 6: コミット**

```bash
git commit -m "feat: レビューUI基盤（Vite設定 + ルーティング + 型定義）"
```

- [ ] **Step 7: GPT-5.4レビュー（任意）**

---

### Task 8: ReviewPage レイアウトシェル

**Files:**
- Create: `src/dev-tools/review/ReviewPage.tsx`
- Create: `src/dev-tools/review/ReviewPage.module.css`
- Create: `src/dev-tools/review/hooks/useValidationReport.ts`
- Create: `src/dev-tools/review/hooks/useReviewState.ts`

- [ ] **Step 1: useValidationReport フックを作成**

`reports/validation-report.json` を fetch で読み込む。
**H1: fetchパスは `/@fs/` 経由を使用する**（Vite dev serverで `server.fs.allow` に追加したディレクトリのファイルにアクセスするため）:
```typescript
const REPORT_PATH = `/@fs/${import.meta.env.BASE_URL ? '' : ''}${window.location.origin}/reports/validation-report.json`
// 実際にはViteの /@fs/ + 絶対パスでアクセス:
// fetch('/@fs/absolute/path/to/reports/validation-report.json')
```
ファイルがない場合のフォールバック（「先に npm run validate を実行してください」メッセージ）。

- [ ] **Step 2: useReviewState フックを作成**

localStorage に `data-quality-review-v1` キーで保存。
version フィールドによるマイグレーション対応。
judgments, correctionStatuses, lastPosition, confirmedPdfPages を管理。

**M5: confirmedPdfPages の型修正:**
```typescript
confirmedPdfPages: Record<string, { pdfFile: string; page: number }>
```
キーは questionId。PDFファイル名とページ番号の両方を保持することで、年度×区分をまたぐPDFファイル切り替えにも対応する。

- [ ] **Step 3: ReviewPage.tsx レイアウト作成**

設計書のレイアウト（2ペイン: 左PDF / 右カード）を実装。
まずは静的なシェルのみ。データ接続は次のタスク。

- [ ] **Step 4: ReviewPage.module.css を作成**

CSS Grid で2カラムレイアウト。固定ヘッダ。レスポンシブ対応不要（デスクトップ専用ツール）。

- [ ] **Step 5: ブラウザで `/dev-tools/review` にアクセスして表示確認**

```bash
npm run dev
# ブラウザで http://localhost:5173/dev-tools/review を開く
```

- [ ] **Step 6: コミット**

```bash
git commit -m "feat: ReviewPageレイアウトシェル + hooks基盤"
```

- [ ] **Step 7: GPT-5.4レビュー（任意）**

---

### Task 9: ReviewHeader（フィルタ + 進捗バー）

**Files:**
- Create: `src/dev-tools/review/components/ReviewHeader.tsx`

- [ ] **Step 1: ReviewHeader を実装**

内容:
- 進捗カウンター（OK/要修正/NG/未判定の件数）
- プログレスバー（色分け: 緑/黄/赤/灰）
- フィルタ: 深刻度（デフォルト: error+warning）、年度、区分、判定状態、ルール
- フィルタプリセット保存ボタン

- [ ] **Step 2: ReviewPage に接続**

- [ ] **Step 3: ブラウザ確認**
- [ ] **Step 4: コミット + GPT-5.4レビュー（任意）**

---

### Task 10: ReviewCard（右パネル: 問題データ表示 + 判定）

**Files:**
- Create: `src/dev-tools/review/components/ReviewCard.tsx`

- [ ] **Step 1: ReviewCard を実装**

内容:
- 問題メタ情報バッジ（年度/問番/科目/区分/ID）
- バリデーションissueリスト（エラーを赤、警告を黄で表示）
- 問題文テキスト表示
- 選択肢リスト（問題のある選択肢をハイライト）
- アプリ表示プレビュー（簡易版）
- 判定ボタン（✅OK / ⚠️要修正 / ❌NG）
- 修正パネル開閉ボタン

- [ ] **Step 2: ReviewPage に接続**
- [ ] **Step 3: ブラウザ確認**
- [ ] **Step 4: コミット + GPT-5.4レビュー（任意）**

---

### Task 11: PdfViewer（左パネル: PDF表示 + ページ推定）

**Files:**
- Create: `src/dev-tools/review/components/PdfViewer.tsx`
- Create: `src/dev-tools/review/hooks/usePdfNavigation.ts`

- [ ] **Step 1: usePdfNavigation フックを実装**

設計書の3段階フォールバック（確定→補間→按分）を実装。
PDF_FILE_MAP から正しいPDFファイルを選択。
確定ページは ReviewState.confirmedPdfPages に保存。

**M5: confirmedPdfPages の型は以下を使用:**
```typescript
confirmedPdfPages: Record<string, { pdfFile: string; page: number }>
```
useReviewState と同じ型を参照し、pdfFile と page の両方を使ってPDFを特定する。

- [ ] **Step 2: PdfViewer を実装**

pdf.js の dynamic import + GlobalWorkerOptions 初期化。
Canvas にPDFページをレンダリング。
ページ送りボタン（P/N キー対応）。
「✓ このページで確定」ボタン。
confidence 表示（確定=緑、補間=黄、推定=灰）。

- [ ] **Step 3: ReviewPage に接続**
- [ ] **Step 4: ブラウザでPDF表示確認**
- [ ] **Step 5: コミット + GPT-5.4レビュー（必須）**

---

### Task 12: CorrectionPanel + PdfCropper（修正機能）

**Files:**
- Create: `src/dev-tools/review/components/CorrectionPanel.tsx`
- Create: `src/dev-tools/review/components/PdfCropper.tsx`

- [ ] **Step 1: CorrectionPanel を実装**

修正パターン切替:
- テキスト修正: フィールド選択 + テキスト入力
- 選択肢修正: Choice[] エディタ
- 正答修正: number | number[] 入力
- 画像クロップ: PdfCropper 起動
- 画像削除: ワンクリック

修正データを corrections として保存。

- [ ] **Step 2: PdfCropper を実装**

PdfViewer 上にオーバーレイ。
マウスドラッグで矩形選択。
Canvas でクロップ結果プレビュー。
viewport情報（width, height, scale, rotation）をPdfCropRectに含める。

- [ ] **Step 3: エクスポート機能を実装**

ReviewState + corrections を `corrections.json` 形式でダウンロード。
`baseGitCommit` と `dataHash` を含める。
**H4:** `reportTimestamp`（現在読み込んでいる validation-report.json の timestamp）も corrections.json に含めること。apply-corrections.ts 側でレポートの鮮度を検証するために使用する。

- [ ] **Step 4: ブラウザ確認**
- [ ] **Step 5: コミット + GPT-5.4レビュー（必須）**

---

### Task 13: キーボードナビゲーション + ショートカットヘルプ

**Files:**
- Create: `src/dev-tools/review/hooks/useKeyboardNav.ts`
- Create: `src/dev-tools/review/components/KeyboardHelp.tsx`

- [ ] **Step 1: useKeyboardNav フックを実装**

設計書のショートカット全15種を実装:
J/→, K/←, 1/2/3/0, F, C, S, G, E, P/N, /, ?

テキスト入力中（input/textarea にフォーカス時）はショートカット無効化。

- [ ] **Step 2: KeyboardHelp モーダルを実装**

`?` キーで開閉するオーバーレイ。ショートカット一覧表示。

- [ ] **Step 3: ReviewPage に接続**
- [ ] **Step 4: ブラウザ確認**
- [ ] **Step 5: コミット + GPT-5.4レビュー（任意）**

---

### Task 14: apply-corrections.ts（修正反映スクリプト）— 中間JSON方式

**Files:**
- Create: `scripts/apply-corrections.ts`
- Create: `scripts/json-to-exam-ts.ts` （JSON → TypeScript 変換ユーティリティ）

**H5: 設計方針 — 中間JSON方式を採用**

`exam-{year}.ts` を直接 AST/正規表現で書き換えるのではなく、安全な中間JSON方式を使用する:
1. corrections.json を読み込む
2. `exam-{year}.ts` から ALL_QUESTIONS 配列を import して修正を適用
3. 修正後のデータを JSON で書き出す（`reports/corrected-{year}.json`）
4. JSON → TypeScript ファイル変換スクリプト（`json-to-exam-ts.ts`）で `exam-{year}.ts` を再生成

これにより:
- AST操作の複雑さを回避
- 中間JSONで差分を目視確認可能
- TypeScriptファイルのフォーマットが常に統一される

- [ ] **Step 1: apply-corrections.ts を実装**

処理フロー:
1. `corrections.json` を読み込み
2. `reportTimestamp` の鮮度チェック（H4で追加したフィールド）
3. `baseGitCommit` の祖先チェック（`git merge-base --is-ancestor`）
4. 各問題の `dataHash` 一致確認
5. テキスト/選択肢/正答修正: `exam-{year}.ts` から import → 修正適用 → 中間JSON書き出し
6. 画像クロップ: pdf.js (Node.js版) + canvas で PDF からクロップ → PNG 書き出し（**pdftoppm依存は削除**）
7. 画像削除: `image_url` を `undefined` に
8. 適用ログ出力

**CLIオプション:**
```bash
# ドライラン（変更内容のプレビューのみ、ファイルは書き換えない）
npx tsx scripts/apply-corrections.ts --dry-run

# 実際に適用
npx tsx scripts/apply-corrections.ts
```

**バックアップ:** 修正前に `git stash` または自動コミット（`wip: pre-correction backup`）で保険をかける。

- [ ] **Step 2: json-to-exam-ts.ts を実装**

中間JSON（`reports/corrected-{year}.json`）を読み込み、`src/data/exam-{year}.ts` を再生成するユーティリティ。
テンプレートリテラルでTypeScriptファイルを生成し、フォーマットを統一する。

- [ ] **Step 3: テスト用の corrections.json を用意してドライラン**

```bash
npx tsx scripts/apply-corrections.ts --dry-run
```
Expected: 変更内容がコンソールに表示され、ファイルは変更されない

- [ ] **Step 4: 実適用テスト**

```bash
npx tsx scripts/apply-corrections.ts
npx tsx scripts/json-to-exam-ts.ts
npm run validate  # 修正後の再バリデーション
```

- [ ] **Step 5: コミット + GPT-5.4レビュー（必須）**

---

### Task 15: 最終統合テスト + ドキュメント

**Files:**
- Modify: `CLAUDE.md` — コマンド・アーキテクチャセクション更新

- [ ] **Step 1: 全テスト実行**

```bash
npx vitest run
npm run validate
npm run build  # dev-tools がビルドに含まれないことを確認
```

- [ ] **Step 2: ブラウザでE2E確認**

1. `npm run validate` でレポート生成
2. `npm run dev` → `/dev-tools/review` でレビューUI確認
3. フィルタ・キーボード・PDF表示・クロップ・エクスポートの動作確認
4. 本番ビルドに dev-tools が含まれないことを確認

- [ ] **Step 3: CLAUDE.md 更新**

コマンドセクションに追加:
```
- `npm run validate` — 全問データ品質チェック（38ルール）
- `/dev-tools/review` — データ品質レビューUI（dev serverのみ）
```

- [ ] **Step 4: 最終コミット + GPT-5.4レビュー（必須）**

```bash
git commit -m "feat: データ品質バリデーター + レビューUI 完成"
```

---

## 設計書更新ノート（M1）

実装計画と設計書（`docs/superpowers/specs/2026-03-24-data-quality-validator-design.md`）の間に以下の差分が存在する。実装完了後に設計書を計画に合わせて更新すること。

| 差分項目 | 設計書 | 実装計画（こちらが正） |
|----------|--------|----------------------|
| テスト配置 | 設計書での配置記述なし or 異なる | `src/utils/data-validator/__tests__/` に統一 |
| ProgressBar | 独立コンポーネント | ReviewHeader に統合 |
| KeyboardHelp | 設計書に記載なし | `src/dev-tools/review/components/KeyboardHelp.tsx` として追加 |
| confirmedPdfPages 型 | 設計書での型定義 | `Record<string, { pdfFile: string; page: number }>` に変更（M5） |
| apply-corrections 方式 | AST/正規表現による直接書き換え | 中間JSON方式に変更（H5） |
| 画像クロップ依存 | pdftoppm | pdf.js (Node.js版) + canvas に変更（H5） |
| choices-valid ルール | 空配列チェックなし | 空配列もchoices-validでチェック（H3） |
| answer-format ルール | 配列昇順チェックのみ | 単一選択チェックも追加（H2） |
| corrections.json | reportTimestamp なし | reportTimestamp フィールド追加（H4） |
| PWA設定 | dev-tools除外なし | navigateFallbackDenylist 追加（M2） |
