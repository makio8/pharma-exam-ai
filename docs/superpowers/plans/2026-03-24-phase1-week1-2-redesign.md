# Phase 1 Week 1-2: 演習ページ＋ホーム画面リデザイン Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PracticePage と HomePage を Ant Design から完全脱却し、Soft Companion デザインシステムでリデザインする

**Architecture:** CSS Modules + CSS変数ベースのデザイントークンで、Ant Design を一切使わない新UIを構築。共通コンポーネント（FloatingNav, Chip, ProgressBar 等）を `src/components/ui/` に作成し、ページコンポーネントで組み合わせる。既存のカスタムフック（useAnswerHistory, useTopicMastery 等）はそのまま活用。

**Tech Stack:** React 19 / TypeScript 5.9 / CSS Modules / Vite 8 / vitest 4

**Spec:** `docs/superpowers/specs/2026-03-24-phase1-week1-2-redesign-design.md`

---

## File Structure

### New Files

```
src/
├── styles/
│   ├── tokens.css                    ← デザイントークン（色・角丸・影・フォント）
│   └── base.css                      ← リセット + body + 共通ユーティリティ
│
├── components/ui/
│   ├── Chip.tsx                      ← 汎用チップ部品
│   ├── Chip.module.css
│   ├── ChipFilter.tsx                ← チップフィルター列（ラベル + 横スクロールチップ群）
│   ├── ChipFilter.module.css
│   ├── SubFieldChips.tsx             ← 分野チップ（科目選択で動的展開）
│   ├── SubFieldChips.module.css
│   ├── PresetCard.tsx                ← スマートプリセットカード
│   ├── PresetCard.module.css
│   ├── QuestionCard.tsx              ← 問題プレビューカード
│   ├── QuestionCard.module.css
│   ├── BottomSheet.tsx               ← 詳細フィルターのスライドアップパネル
│   ├── BottomSheet.module.css
│   ├── StickyActionBar.tsx           ← 「演習開始」固定バー
│   ├── StickyActionBar.module.css
│   ├── FloatingNav.tsx               ← 浮遊pill型ボトムナビ
│   ├── FloatingNav.module.css
│   ├── DecoWave.tsx                  ← オレンジグラデーション装飾バー
│   ├── DecoWave.module.css
│   ├── StatCircle.tsx                ← 円形統計バブル
│   ├── StatCircle.module.css
│   ├── SubjectMastery.tsx            ← 科目→分野2階層プログレス
│   ├── SubjectMastery.module.css
│   ├── ProgressBar.tsx               ← 汎用プログレスバー
│   └── ProgressBar.module.css
│
├── utils/
│   └── blueprint-helpers.ts          ← 分野集約・頻出テーマ抽出ユーティリティ
│
├── pages/
│   ├── PracticePage.module.css       ← 演習ページ固有スタイル
│   └── HomePage.module.css           ← ホーム画面固有スタイル
```

### Modified Files

```
src/
├── main.tsx                          ← tokens.css / base.css のimport追加
├── pages/
│   ├── PracticePage.tsx              ← 完全書き直し
│   └── HomePage.tsx                  ← 完全書き直し
├── components/
│   └── layout/AppLayout.tsx          ← FloatingNav条件分岐追加
├── styles/
│   └── global.css                    ← Ant Design依存のメディアクエリ整理
│
vitest.config.ts                      ← src/ テストを含むよう拡張
```

---

## Task 1: デザイントークンとベーススタイルの作成

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/base.css`
- Modify: `src/main.tsx`

- [ ] **Step 1: `src/styles/tokens.css` を作成**

```css
/* Soft Companion Design Tokens */
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;600;700&display=swap');

:root {
  /* Brand Colors */
  --accent: #aa3bff;
  --accent-light: rgba(170, 59, 255, 0.08);
  --accent-mid: rgba(170, 59, 255, 0.15);
  --accent-border: rgba(170, 59, 255, 0.25);

  /* Backgrounds */
  --bg: #fef7ed;
  --card: #ffffff;

  /* Text */
  --text: #3d2c1e;
  --text-2: #8b7355;
  --text-3: #9ca3af;

  /* Borders */
  --border: #e8e5ee;

  /* Status Colors */
  --ok: #10b981;
  --ng: #ef4444;
  --warn: #f59e0b;
  --blue: #2563eb;
  --orange: #ea580c;
  --green: #16a34a;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06);
  --shadow-nav: 0 4px 20px rgba(0, 0, 0, 0.08);
  --shadow-cta: 0 4px 16px rgba(170, 59, 255, 0.3);

  /* Radii */
  --r: 14px;
  --r-sm: 10px;
  --r-chip: 20px;
  --r-nav: 28px;
  --r-card: 16px;

  /* Font */
  --font: 'Quicksand', 'Noto Sans JP', sans-serif;
}
```

- [ ] **Step 2: `src/styles/base.css` を作成**

```css
/* Reset & base styles for Soft Companion pages */
.sc-page {
  background: var(--bg);
  font-family: var(--font);
  color: var(--text);
  min-height: 100dvh;
  padding: 20px 16px 160px;
  max-width: 480px;
  margin: 0 auto;
}

.sc-page *,
.sc-page *::before,
.sc-page *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 12px;
}
```

- [ ] **Step 3: `src/main.tsx` にimportを追加**

`src/main.tsx` のCSS importに追加。`antd/dist/reset.css` の後、`./styles/global.css` の前に配置:

```typescript
import 'antd/dist/reset.css'
import './styles/tokens.css'    // ← 追加
import './styles/base.css'      // ← 追加
import './styles/global.css'
```

- [ ] **Step 4: ブラウザで確認**

Run: `npm run dev`
Expected: アプリが正常に起動し、既存ページに影響なし（tokens.css/base.cssはクラス指定なのでグローバル汚染なし）

- [ ] **Step 5: コミット**

```bash
git add src/styles/tokens.css src/styles/base.css src/main.tsx
git commit -m "feat: Soft Companionデザイントークンとベーススタイルを追加"
```

---

## Task 2: vitest設定拡張 + blueprint-helpers ユーティリティ

**Files:**
- Modify: `vitest.config.ts`
- Create: `src/utils/blueprint-helpers.ts`
- Create: `src/utils/__tests__/blueprint-helpers.test.ts`

- [ ] **Step 1: vitest.config.ts を拡張してsrc/テストも対象にする**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'scripts/lib/__tests__/**/*.test.ts',
      'src/**/__tests__/**/*.test.ts',
      'src/**/*.test.ts',
    ],
    globals: true,
  },
})
```

- [ ] **Step 2: テストを作成 — `src/utils/__tests__/blueprint-helpers.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import {
  getMajorCategoriesForSubject,
  getQuestionIdsForMajorCategory,
  getFrequentExemplarQuestionIds,
} from '../blueprint-helpers'

describe('getMajorCategoriesForSubject', () => {
  it('薬理の大項目を返す', () => {
    const result = getMajorCategoriesForSubject('薬理')
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toHaveProperty('name')
    expect(result[0]).toHaveProperty('middleCategories')
  })

  it('存在しない科目は空配列を返す', () => {
    const result = getMajorCategoriesForSubject('存在しない' as any)
    expect(result).toEqual([])
  })
})

describe('getQuestionIdsForMajorCategory', () => {
  it('薬理の大項目に紐づく問題IDを返す', () => {
    const majors = getMajorCategoriesForSubject('薬理')
    if (majors.length > 0) {
      const ids = getQuestionIdsForMajorCategory(majors[0].name, '薬理')
      expect(ids.length).toBeGreaterThanOrEqual(0)
      ids.forEach(id => expect(typeof id).toBe('string'))
    }
  })
})

describe('getFrequentExemplarQuestionIds', () => {
  it('yearsAppeared >= 3 の例示に紐づく問題IDを返す', () => {
    const ids = getFrequentExemplarQuestionIds(3)
    expect(ids.length).toBeGreaterThan(0)
    ids.forEach(id => expect(typeof id).toBe('string'))
  })

  it('閾値を上げると結果が減る', () => {
    const ids3 = getFrequentExemplarQuestionIds(3)
    const ids8 = getFrequentExemplarQuestionIds(8)
    expect(ids3.length).toBeGreaterThanOrEqual(ids8.length)
  })
})
```

- [ ] **Step 3: テスト実行 — 失敗確認**

Run: `npx vitest run src/utils/__tests__/blueprint-helpers.test.ts`
Expected: FAIL（blueprint-helpers.ts が存在しない）

- [ ] **Step 4: `src/utils/blueprint-helpers.ts` を実装**

```typescript
import { EXAM_BLUEPRINT, ALL_TOPICS } from '../data/exam-blueprint'
import { QUESTION_TOPIC_MAP } from '../data/question-topic-map'
import { EXEMPLAR_STATS } from '../data/exemplar-stats'
import { getQuestionsForExemplar } from '../data/question-exemplar-map'
import type { MajorCategory } from '../types/blueprint'
import type { QuestionSubject } from '../types/question'

/**
 * 科目の大項目（MajorCategory）一覧を取得
 */
export function getMajorCategoriesForSubject(
  subject: QuestionSubject
): MajorCategory[] {
  const blueprint = EXAM_BLUEPRINT.find(b => b.subject === subject)
  return blueprint?.majorCategories ?? []
}

/**
 * 大項目名 + 科目から、紐づく問題IDの一覧を取得
 * QUESTION_TOPIC_MAP（MiddleCategory）→ MajorCategory に集約
 */
export function getQuestionIdsForMajorCategory(
  majorCategoryName: string,
  subject: QuestionSubject
): string[] {
  // 大項目に属する中項目IDを取得
  const blueprint = EXAM_BLUEPRINT.find(b => b.subject === subject)
  const major = blueprint?.majorCategories.find(
    m => m.name === majorCategoryName
  )
  if (!major) return []

  const middleCategoryIds = new Set(
    major.middleCategories.map(mc => mc.id)
  )

  // QUESTION_TOPIC_MAP から該当する問題IDを抽出
  const questionIds: string[] = []
  for (const [questionId, topicId] of Object.entries(QUESTION_TOPIC_MAP)) {
    if (middleCategoryIds.has(topicId)) {
      questionIds.push(questionId)
    }
  }
  return questionIds
}

/**
 * 出題頻度が高い例示（yearsAppeared >= threshold）に紐づく問題IDを取得
 * 「頻出テーマ」プリセット用
 */
export function getFrequentExemplarQuestionIds(
  minYearsAppeared: number = 3
): string[] {
  const frequentExemplars = EXEMPLAR_STATS.filter(
    e => e.yearsAppeared >= minYearsAppeared
  )

  const questionIdSet = new Set<string>()
  for (const exemplar of frequentExemplars) {
    const mappings = getQuestionsForExemplar(exemplar.exemplarId)
    for (const m of mappings) {
      questionIdSet.add(m.questionId)
    }
  }

  return Array.from(questionIdSet)
}
```

- [ ] **Step 5: テスト実行 — 成功確認**

Run: `npx vitest run src/utils/__tests__/blueprint-helpers.test.ts`
Expected: 全テストPASS

- [ ] **Step 6: コミット**

```bash
git add vitest.config.ts src/utils/blueprint-helpers.ts src/utils/__tests__/blueprint-helpers.test.ts
git commit -m "feat: blueprint-helpersユーティリティ追加（分野集約・頻出テーマ抽出）"
```

---

## Task 3: FloatingNav コンポーネント

**Files:**
- Create: `src/components/ui/FloatingNav.tsx`
- Create: `src/components/ui/FloatingNav.module.css`

- [ ] **Step 1: `src/components/ui/FloatingNav.module.css` を作成**

```css
.nav {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: 350px;
  max-width: calc(100vw - 32px);
  background: var(--card);
  border-radius: var(--r-nav);
  padding: 10px 0;
  display: flex;
  justify-content: space-around;
  box-shadow: var(--shadow-nav);
  border: 1px solid #f0ecf4;
  z-index: 1000;
}

.item {
  text-align: center;
  font-size: 10px;
  color: var(--text-3);
  text-decoration: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: color 0.2s;
}

.item.active {
  color: var(--accent);
}

.icon {
  font-size: 20px;
}
```

- [ ] **Step 2: `src/components/ui/FloatingNav.tsx` を作成**

```tsx
import { Link, useLocation } from 'react-router-dom'
import styles from './FloatingNav.module.css'

const NAV_ITEMS = [
  { path: '/', icon: '🏠', label: 'ホーム' },
  { path: '/practice', icon: '📝', label: '演習' },
  { path: '/notes', icon: '📌', label: 'ノート' },
  { path: '/analysis', icon: '📊', label: '分析' },
] as const

export function FloatingNav() {
  const { pathname } = useLocation()

  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`${styles.item} ${pathname === item.path ? styles.active : ''}`}
        >
          <span className={styles.icon}>{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
```

- [ ] **Step 3: ブラウザで確認**

`src/pages/HomePage.tsx` の末尾に一時的に `<FloatingNav />` を追加して表示確認。確認後に戻す。

- [ ] **Step 4: コミット**

```bash
git add src/components/ui/FloatingNav.tsx src/components/ui/FloatingNav.module.css
git commit -m "feat: FloatingNav浮遊pill型ナビコンポーネント追加"
```

---

## Task 4: Chip + ChipFilter コンポーネント

**Files:**
- Create: `src/components/ui/Chip.tsx` + `Chip.module.css`
- Create: `src/components/ui/ChipFilter.tsx` + `ChipFilter.module.css`

- [ ] **Step 1: `src/components/ui/Chip.module.css` を作成**

```css
.chip {
  padding: 5px 14px;
  border-radius: var(--r-chip);
  font-size: 11px;
  font-weight: 600;
  border: 1.5px solid var(--border);
  background: var(--card);
  color: #6b7280;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.chip:hover {
  border-color: var(--accent-border);
}

.active {
  background: var(--accent-light);
  color: var(--accent);
  border-color: var(--accent-border);
}

.activeBlue {
  background: rgba(37, 99, 235, 0.08);
  color: var(--blue);
  border-color: rgba(37, 99, 235, 0.3);
}

.activeGreen {
  background: rgba(22, 163, 74, 0.08);
  color: var(--green);
  border-color: rgba(22, 163, 74, 0.3);
}
```

- [ ] **Step 2: `src/components/ui/Chip.tsx` を作成**

```tsx
import styles from './Chip.module.css'

type ChipVariant = 'default' | 'blue' | 'green'

interface ChipProps {
  label: string
  active?: boolean
  variant?: ChipVariant
  onClick?: () => void
}

const variantClass: Record<ChipVariant, string> = {
  default: styles.active,
  blue: styles.activeBlue,
  green: styles.activeGreen,
}

export function Chip({ label, active = false, variant = 'default', onClick }: ChipProps) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${active ? variantClass[variant] : ''}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
```

- [ ] **Step 3: `src/components/ui/ChipFilter.module.css` を作成**

```css
.section {
  margin-bottom: 14px;
}

.label {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-2);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 6px;
}

.row {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}

.row::-webkit-scrollbar {
  display: none;
}
```

- [ ] **Step 4: `src/components/ui/ChipFilter.tsx` を作成**

```tsx
import { Chip } from './Chip'
import styles from './ChipFilter.module.css'

type ChipVariant = 'default' | 'blue' | 'green'

interface ChipFilterProps<T extends string | number> {
  label: string
  items: { value: T; label: string; variant?: ChipVariant }[]
  selected: T[]
  onToggle: (value: T) => void
}

export function ChipFilter<T extends string | number>({
  label,
  items,
  selected,
  onToggle,
}: ChipFilterProps<T>) {
  return (
    <div className={styles.section}>
      <div className={styles.label}>{label}</div>
      <div className={styles.row}>
        {items.map(item => (
          <Chip
            key={String(item.value)}
            label={item.label}
            active={selected.includes(item.value)}
            variant={item.variant ?? 'default'}
            onClick={() => onToggle(item.value)}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: コミット**

```bash
git add src/components/ui/Chip.tsx src/components/ui/Chip.module.css src/components/ui/ChipFilter.tsx src/components/ui/ChipFilter.module.css
git commit -m "feat: Chip + ChipFilterコンポーネント追加"
```

---

## Task 5: SubFieldChips（分野チップ）コンポーネント

**Files:**
- Create: `src/components/ui/SubFieldChips.tsx` + `SubFieldChips.module.css`

- [ ] **Step 1: `src/components/ui/SubFieldChips.module.css` を作成**

```css
.section {
  margin-left: 12px;
  padding-left: 12px;
  border-left: 2px solid rgba(170, 59, 255, 0.15);
  margin-bottom: 14px;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.label {
  font-size: 9px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.row {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.row::-webkit-scrollbar {
  display: none;
}

.chip {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 10px;
  font-weight: 600;
  border: 1px solid rgba(170, 59, 255, 0.15);
  background: rgba(170, 59, 255, 0.03);
  color: var(--text-2);
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
}

.chip:hover {
  border-color: var(--accent-border);
}

.active {
  background: rgba(170, 59, 255, 0.1);
  color: var(--accent);
  border-color: rgba(170, 59, 255, 0.3);
}
```

- [ ] **Step 2: `src/components/ui/SubFieldChips.tsx` を作成**

```tsx
import { useMemo } from 'react'
import { getMajorCategoriesForSubject } from '../../utils/blueprint-helpers'
import type { QuestionSubject } from '../../types/question'
import styles from './SubFieldChips.module.css'

interface SubFieldChipsProps {
  subject: QuestionSubject
  selectedMajors: string[]
  onToggle: (majorName: string) => void
}

export function SubFieldChips({ subject, selectedMajors, onToggle }: SubFieldChipsProps) {
  const majors = useMemo(
    () => getMajorCategoriesForSubject(subject),
    [subject]
  )

  if (majors.length === 0) return null

  return (
    <div className={styles.section}>
      <div className={styles.label}>📂 {subject}の分野</div>
      <div className={styles.row}>
        {majors.map(m => (
          <button
            key={m.name}
            type="button"
            className={`${styles.chip} ${selectedMajors.includes(m.name) ? styles.active : ''}`}
            onClick={() => onToggle(m.name)}
          >
            {m.name}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: コミット**

```bash
git add src/components/ui/SubFieldChips.tsx src/components/ui/SubFieldChips.module.css
git commit -m "feat: SubFieldChips分野チップコンポーネント追加"
```

---

## Task 6: PresetCard + ProgressBar + QuestionCard コンポーネント

**Files:**
- Create: `src/components/ui/PresetCard.tsx` + `PresetCard.module.css`
- Create: `src/components/ui/ProgressBar.tsx` + `ProgressBar.module.css`
- Create: `src/components/ui/QuestionCard.tsx` + `QuestionCard.module.css`

- [ ] **Step 1: PresetCard の CSS + TSX を作成**

`src/components/ui/PresetCard.module.css`:
```css
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;
}

.card {
  background: var(--card);
  border: 1.5px solid var(--border);
  border-radius: var(--r-card);
  padding: 12px;
  text-align: center;
  position: relative;
  cursor: pointer;
  transition: border-color 0.2s;
}

.card:hover {
  border-color: var(--accent-border);
}

.active {
  border-color: rgba(170, 59, 255, 0.4);
  background: rgba(170, 59, 255, 0.04);
}

.badge {
  position: absolute;
  top: -6px;
  right: 8px;
  background: linear-gradient(135deg, var(--accent), #8b5cf6);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}

.emoji {
  font-size: 22px;
  margin-bottom: 4px;
}

.title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.desc {
  font-size: 10px;
  color: var(--text-2);
  margin-top: 2px;
}
```

`src/components/ui/PresetCard.tsx`:
```tsx
import styles from './PresetCard.module.css'

export interface PresetConfig {
  id: string
  icon: string
  title: string
  description: string
  badge?: string
}

interface PresetCardGridProps {
  presets: PresetConfig[]
  activeId: string | null
  onSelect: (id: string) => void
}

export function PresetCardGrid({ presets, activeId, onSelect }: PresetCardGridProps) {
  return (
    <div className={styles.grid}>
      {presets.map(p => (
        <button
          key={p.id}
          type="button"
          className={`${styles.card} ${activeId === p.id ? styles.active : ''}`}
          onClick={() => onSelect(p.id)}
        >
          {p.badge && <span className={styles.badge}>{p.badge}</span>}
          <div className={styles.emoji}>{p.icon}</div>
          <div className={styles.title}>{p.title}</div>
          <div className={styles.desc}>{p.description}</div>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: ProgressBar の CSS + TSX を作成**

`src/components/ui/ProgressBar.module.css`:
```css
.bar {
  height: 8px;
  background: #f0ecf4;
  border-radius: 4px;
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.green { background: linear-gradient(90deg, #10b981, #34d399); }
.yellow { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.red { background: linear-gradient(90deg, #ef4444, #f87171); }
.gray { background: #d1d5db; }
.accent { background: linear-gradient(90deg, var(--accent), #8b5cf6); }

.small { height: 4px; }
```

`src/components/ui/ProgressBar.tsx`:
```tsx
import styles from './ProgressBar.module.css'

type BarColor = 'green' | 'yellow' | 'red' | 'gray' | 'accent'

interface ProgressBarProps {
  percent: number
  color?: BarColor
  size?: 'default' | 'small'
}

function autoColor(percent: number): BarColor {
  if (percent === 0) return 'gray'
  if (percent >= 70) return 'green'
  if (percent >= 30) return 'yellow'
  return 'red'
}

export function ProgressBar({ percent, color, size = 'default' }: ProgressBarProps) {
  const c = color ?? autoColor(percent)
  return (
    <div className={`${styles.bar} ${size === 'small' ? styles.small : ''}`}>
      <div
        className={`${styles.fill} ${styles[c]}`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 3: QuestionCard の CSS + TSX を作成**

`src/components/ui/QuestionCard.module.css`:
```css
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--r-card);
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: var(--shadow-sm);
}

.card:nth-child(odd) { transform: rotate(-0.3deg); }
.card:nth-child(even) { transform: rotate(0.2deg); }

.top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}

.badgeBlue { background: rgba(37, 99, 235, 0.1); color: var(--blue); }
.badgeGreen { background: rgba(22, 163, 74, 0.1); color: var(--green); }
.badgeOrange { background: rgba(234, 88, 12, 0.1); color: var(--orange); }

.number {
  font-size: 11px;
  color: var(--text-2);
}

.subject {
  font-size: 10px;
  color: var(--accent);
  background: var(--accent-light);
  padding: 2px 8px;
  border-radius: 10px;
}

.field {
  font-size: 9px;
  color: var(--text-2);
  background: rgba(139, 115, 85, 0.08);
  padding: 2px 6px;
  border-radius: 8px;
}

.status {
  margin-left: auto;
  font-size: 14px;
}

.text {
  font-size: 13px;
  color: var(--text);
  line-height: 1.5;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.freq {
  font-size: 10px;
  color: var(--orange);
  font-weight: 600;
}
```

`src/components/ui/QuestionCard.tsx`:
```tsx
import type { Question, QuestionSection } from '../../types/question'
import styles from './QuestionCard.module.css'

interface QuestionCardProps {
  question: Question
  status: 'correct' | 'incorrect' | 'unanswered'
  fieldName?: string
  frequency?: number
  onClick?: () => void
}

const sectionBadge: Record<QuestionSection, { class: string; label: string }> = {
  '必須': { class: styles.badgeBlue, label: '必須' },
  '理論': { class: styles.badgeOrange, label: '理論' },
  '実践': { class: styles.badgeGreen, label: '実践' },
}

const statusIcon = { correct: '✅', incorrect: '❌', unanswered: '—' }

export function QuestionCard({ question, status, fieldName, frequency, onClick }: QuestionCardProps) {
  const badge = sectionBadge[question.section]
  return (
    <div className={styles.card} onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className={styles.top}>
        <span className={`${styles.badge} ${badge.class}`}>{badge.label}</span>
        <span className={styles.number}>第{question.year}回 問{question.question_number}</span>
        <span className={styles.subject}>{question.subject}</span>
        {fieldName && <span className={styles.field}>{fieldName}</span>}
        <span className={styles.status}>{statusIcon[status]}</span>
      </div>
      <div className={styles.text}>{question.question_text}</div>
      <div className={styles.meta}>
        {frequency && frequency >= 3 && (
          <span className={styles.freq}>🔥 頻出（{frequency}回出題）</span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: コミット**

```bash
git add src/components/ui/PresetCard.tsx src/components/ui/PresetCard.module.css \
  src/components/ui/ProgressBar.tsx src/components/ui/ProgressBar.module.css \
  src/components/ui/QuestionCard.tsx src/components/ui/QuestionCard.module.css
git commit -m "feat: PresetCard, ProgressBar, QuestionCardコンポーネント追加"
```

---

## Task 7: BottomSheet + StickyActionBar コンポーネント

**Files:**
- Create: `src/components/ui/BottomSheet.tsx` + `BottomSheet.module.css`
- Create: `src/components/ui/StickyActionBar.tsx` + `StickyActionBar.module.css`

- [ ] **Step 1: BottomSheet の CSS + TSX を作成**

`src/components/ui/BottomSheet.module.css`:
```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 900;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

.overlayOpen {
  opacity: 1;
  pointer-events: auto;
}

.sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--card);
  border-radius: 20px 20px 0 0;
  padding: 20px 16px 32px;
  z-index: 901;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  max-height: 80vh;
  overflow-y: auto;
}

.sheetOpen {
  transform: translateY(0);
}

.handle {
  width: 40px;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  margin: 0 auto 16px;
}

.title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 16px;
}
```

`src/components/ui/BottomSheet.tsx`:
```tsx
import type { ReactNode } from 'react'
import styles from './BottomSheet.module.css'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  return (
    <>
      <div
        className={`${styles.overlay} ${open ? styles.overlayOpen : ''}`}
        onClick={onClose}
      />
      <div className={`${styles.sheet} ${open ? styles.sheetOpen : ''}`}>
        <div className={styles.handle} />
        {title && <div className={styles.title}>{title}</div>}
        {children}
      </div>
    </>
  )
}
```

- [ ] **Step 2: StickyActionBar の CSS + TSX を作成**

`src/components/ui/StickyActionBar.module.css`:
```css
.bar {
  position: fixed;
  bottom: 72px;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: rgba(254, 247, 237, 0.95);
  backdrop-filter: blur(8px);
  border-top: 1px solid var(--border);
  display: flex;
  gap: 10px;
  align-items: center;
  z-index: 800;
}

.barInner {
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
}

.startBtn {
  flex: 1;
  background: linear-gradient(135deg, var(--accent), #8b5cf6);
  color: #fff;
  border: none;
  padding: 14px;
  border-radius: var(--r);
  font-size: 15px;
  font-weight: 700;
  font-family: var(--font);
  box-shadow: var(--shadow-cta);
  cursor: pointer;
  transition: opacity 0.15s;
}

.startBtn:hover {
  opacity: 0.9;
}

.startBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.settingsBtn {
  width: 48px;
  height: 48px;
  border-radius: var(--r);
  border: 1.5px solid var(--border);
  background: var(--card);
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
```

`src/components/ui/StickyActionBar.tsx`:
```tsx
import styles from './StickyActionBar.module.css'

interface StickyActionBarProps {
  count: number
  onStart: () => void
  onSettings?: () => void
  disabled?: boolean
}

export function StickyActionBar({ count, onStart, onSettings, disabled }: StickyActionBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.barInner}>
        <button
          type="button"
          className={styles.startBtn}
          onClick={onStart}
          disabled={disabled || count === 0}
        >
          ▶ 演習開始（{count}問）
        </button>
        {onSettings && (
          <button type="button" className={styles.settingsBtn} onClick={onSettings}>
            ⚙
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: コミット**

```bash
git add src/components/ui/BottomSheet.tsx src/components/ui/BottomSheet.module.css \
  src/components/ui/StickyActionBar.tsx src/components/ui/StickyActionBar.module.css
git commit -m "feat: BottomSheet + StickyActionBarコンポーネント追加"
```

---

## Task 8: PracticePage 完全リデザイン

**Files:**
- Modify: `src/pages/PracticePage.tsx` (完全書き直し)
- Create: `src/pages/PracticePage.module.css`

これは最大のタスクです。既存の462行のPracticePageを、新しいコンポーネントを使って全面書き直しします。

- [ ] **Step 1: `src/pages/PracticePage.module.css` を作成**

```css
.header h1 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.header p {
  font-size: 12px;
  color: var(--text-2);
  margin: 4px 0 16px;
}

.detailBtn {
  width: 100%;
  padding: 10px;
  border: 1.5px dashed #d1cdd9;
  border-radius: 12px;
  background: transparent;
  text-align: center;
  font-size: 12px;
  font-family: var(--font);
  color: var(--text-2);
  margin-bottom: 16px;
  cursor: pointer;
}

.detailBtn:hover {
  border-color: var(--accent-border);
}

.resultBar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.resultCount {
  font-size: 14px;
  color: var(--text);
}

.resultCount span {
  font-weight: 800;
  color: var(--accent);
}

.sortBtn {
  font-size: 11px;
  color: var(--text-2);
  background: var(--card);
  border: 1px solid var(--border);
  padding: 4px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-family: var(--font);
}

/* BottomSheet filter items */
.filterGroup {
  margin-bottom: 20px;
}

.filterLabel {
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
}

.statusBtns {
  display: flex;
  gap: 8px;
}

.statusBtn {
  flex: 1;
  padding: 10px;
  border: 1.5px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--card);
  text-align: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.15s;
}

.statusBtn.selected {
  border-color: var(--accent-border);
  background: var(--accent-light);
}

.toggleRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.toggleLabel {
  font-size: 13px;
  color: var(--text);
}

.toggle {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: var(--border);
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}

.toggle.on {
  background: var(--accent);
}

.toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s;
}

.toggle.on::after {
  transform: translateX(20px);
}

.keywordInput {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--r-sm);
  font-size: 13px;
  font-family: var(--font);
  color: var(--text);
  background: var(--card);
  outline: none;
}

.keywordInput:focus {
  border-color: var(--accent-border);
}
```

- [ ] **Step 2: `src/pages/PracticePage.tsx` を完全書き直し**

既存のPracticePage.tsxの全内容を以下に置き換えます。保持するロジック: フィルタリング、連問セット処理、handleStartSession。削除するもの: Ant Design の全import + コンポーネント使用。

```tsx
import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ALL_QUESTIONS } from '../data/all-questions'
import { QUESTION_TOPIC_MAP } from '../data/question-topic-map'
import { ALL_TOPICS } from '../data/exam-blueprint'
import { useAnswerHistory } from '../hooks/useAnswerHistory'
import {
  getQuestionIdsForMajorCategory,
  getFrequentExemplarQuestionIds,
} from '../utils/blueprint-helpers'
import type { QuestionSection, QuestionSubject, Question } from '../types/question'
import { ChipFilter } from '../components/ui/ChipFilter'
import { SubFieldChips } from '../components/ui/SubFieldChips'
import { PresetCardGrid } from '../components/ui/PresetCard'
import type { PresetConfig } from '../components/ui/PresetCard'
import { QuestionCard } from '../components/ui/QuestionCard'
import { BottomSheet } from '../components/ui/BottomSheet'
import { StickyActionBar } from '../components/ui/StickyActionBar'
import { FloatingNav } from '../components/ui/FloatingNav'
import styles from './PracticePage.module.css'

const SUBJECTS: QuestionSubject[] = [
  '物理', '化学', '生物', '衛生', '薬理', '薬剤', '病態・薬物治療', '法規・制度・倫理', '実務',
]
const YEARS = Array.from({ length: 12 }, (_, i) => 100 + i) // 100-111
const SECTIONS: { value: QuestionSection; label: string; variant: 'default' | 'blue' | 'green' }[] = [
  { value: '必須', label: '必須', variant: 'blue' },
  { value: '理論', label: '理論', variant: 'default' },
  { value: '実践', label: '実践', variant: 'green' },
]

type CorrectStatus = 'all' | 'correct' | 'incorrect' | 'unanswered'

const PRESETS: PresetConfig[] = [
  { id: 'weak', icon: '🎯', title: '苦手克服', description: '間違えた問題を優先', badge: 'おすすめ' },
  { id: 'frequent', icon: '📋', title: '頻出テーマ', description: 'よく出るテーマの未回答' },
  { id: 'unanswered', icon: '⭐', title: '未回答を潰す', description: 'まだ解いてない問題' },
  { id: 'random', icon: '🔄', title: 'ランダム演習', description: 'フィルター結果からシャッフル' },
]

// TopicId → 分野名（MajorCategory.name）のルックアップ
const TOPIC_TO_MAJOR = new Map<string, string>()
const TOPIC_TO_MIDDLE = new Map<string, string>()
for (const t of ALL_TOPICS) {
  TOPIC_TO_MAJOR.set(t.id, t.major)
  TOPIC_TO_MIDDLE.set(t.id, t.middle)
}

export function PracticePage() {
  const navigate = useNavigate()
  const { history } = useAnswerHistory()

  // Filter state
  const [selectedSubjects, setSelectedSubjects] = useState<QuestionSubject[]>([])
  const [selectedMajors, setSelectedMajors] = useState<Record<string, string[]>>({}) // subject → majorName[]
  const [selectedYears, setSelectedYears] = useState<number[]>([])
  const [selectedSections, setSelectedSections] = useState<QuestionSection[]>([])
  const [correctStatus, setCorrectStatus] = useState<CorrectStatus>('all')
  const [keyword, setKeyword] = useState('')
  const [imageOnly, setImageOnly] = useState(false)
  const [randomOrder, setRandomOrder] = useState(false)
  const [sessionCount, setSessionCount] = useState<10 | 20 | 0>(10)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)

  // Answer history lookup
  const answerMap = useMemo(() => {
    const map = new Map<string, boolean>()
    for (const a of history) {
      map.set(a.question_id, a.is_correct)
    }
    return map
  }, [history])

  const answeredIds = useMemo(() => new Set(history.map(a => a.question_id)), [history])

  // Frequent exemplar question IDs (for 頻出テーマ preset)
  const frequentQuestionIds = useMemo(() => new Set(getFrequentExemplarQuestionIds(3)), [])

  // Toggle helpers
  const toggleArrayItem = useCallback(<T,>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item],
  [])

  const handleSubjectToggle = useCallback((subject: QuestionSubject) => {
    setSelectedSubjects(prev => toggleArrayItem(prev, subject))
    setActivePreset(null)
  }, [toggleArrayItem])

  const handleMajorToggle = useCallback((subject: string, majorName: string) => {
    setSelectedMajors(prev => ({
      ...prev,
      [subject]: toggleArrayItem(prev[subject] ?? [], majorName),
    }))
    setActivePreset(null)
  }, [toggleArrayItem])

  // Preset handler
  const handlePresetSelect = useCallback((presetId: string) => {
    setActivePreset(presetId)
    switch (presetId) {
      case 'weak':
        setCorrectStatus('incorrect')
        setRandomOrder(true)
        setSessionCount(10)
        break
      case 'frequent':
        setCorrectStatus('unanswered')
        setRandomOrder(false)
        setSessionCount(10)
        break
      case 'unanswered':
        setCorrectStatus('unanswered')
        setRandomOrder(false)
        setSessionCount(10)
        break
      case 'random':
        setRandomOrder(true)
        setSessionCount(10)
        break
    }
  }, [])

  // Filtering
  const filteredQuestions = useMemo(() => {
    let qs = [...ALL_QUESTIONS]

    // Subject filter
    if (selectedSubjects.length > 0) {
      qs = qs.filter(q => selectedSubjects.includes(q.subject))
    }

    // Major category filter
    const activeMajorIds = new Set<string>()
    for (const [subject, majors] of Object.entries(selectedMajors)) {
      for (const majorName of majors) {
        const ids = getQuestionIdsForMajorCategory(majorName, subject as QuestionSubject)
        ids.forEach(id => activeMajorIds.add(id))
      }
    }
    if (activeMajorIds.size > 0) {
      qs = qs.filter(q => activeMajorIds.has(q.id))
    }

    // Year filter
    if (selectedYears.length > 0) {
      qs = qs.filter(q => selectedYears.includes(q.year))
    }

    // Section filter
    if (selectedSections.length > 0) {
      qs = qs.filter(q => selectedSections.includes(q.section))
    }

    // 頻出テーマ preset
    if (activePreset === 'frequent') {
      qs = qs.filter(q => frequentQuestionIds.has(q.id))
    }

    // Correct status
    if (correctStatus === 'correct') {
      qs = qs.filter(q => answerMap.get(q.id) === true)
    } else if (correctStatus === 'incorrect') {
      qs = qs.filter(q => answerMap.get(q.id) === false)
    } else if (correctStatus === 'unanswered') {
      qs = qs.filter(q => !answeredIds.has(q.id))
    }

    // Image only
    if (imageOnly) {
      qs = qs.filter(q => !!q.image_url)
    }

    // Keyword
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      qs = qs.filter(q =>
        q.question_text.toLowerCase().includes(kw) ||
        q.tags?.some(t => t.toLowerCase().includes(kw))
      )
    }

    return qs
  }, [selectedSubjects, selectedMajors, selectedYears, selectedSections,
      correctStatus, imageOnly, keyword, activePreset, answerMap, answeredIds, frequentQuestionIds])

  // Get question status helper
  const getStatus = (q: Question): 'correct' | 'incorrect' | 'unanswered' => {
    if (!answeredIds.has(q.id)) return 'unanswered'
    return answerMap.get(q.id) ? 'correct' : 'incorrect'
  }

  // Get field name for question
  const getFieldName = (q: Question): string | undefined => {
    const topicId = QUESTION_TOPIC_MAP[q.id]
    return topicId ? TOPIC_TO_MIDDLE.get(topicId) : undefined
  }

  // Start session (preserve linked_group logic from original)
  const handleStartSession = () => {
    let questions = [...filteredQuestions]

    if (randomOrder) {
      // Shuffle preserving linked_group sets
      const groups = new Map<string, Question[]>()
      const singles: Question[] = []
      for (const q of questions) {
        if (q.linked_group) {
          const group = groups.get(q.linked_group) ?? []
          group.push(q)
          groups.set(q.linked_group, group)
        } else {
          singles.push(q)
        }
      }
      const units: Question[][] = [
        ...singles.map(q => [q]),
        ...Array.from(groups.values()),
      ]
      for (let i = units.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [units[i], units[j]] = [units[j], units[i]]
      }
      questions = units.flat()
    }

    // Apply session count limit (respect linked_group boundaries)
    if (sessionCount > 0) {
      const limited: Question[] = []
      for (const q of questions) {
        if (limited.length >= sessionCount && !q.linked_group) break
        if (limited.length >= sessionCount && q.linked_group) {
          const lastQ = limited[limited.length - 1]
          if (lastQ?.linked_group !== q.linked_group) break
        }
        limited.push(q)
      }
      questions = limited
    }

    if (questions.length === 0) return

    // NOTE: QuestionPage reads 'practice_session' as string[] (plain ID array)
    localStorage.setItem('practice_session', JSON.stringify(questions.map(q => q.id)))
    navigate(`/practice/${questions[0].id}`)
  }

  return (
    <div className="sc-page">
      {/* Header */}
      <div className={styles.header}>
        <h1>💊 演習モード</h1>
        <p>{ALL_QUESTIONS.length.toLocaleString()}問から出題・11年分の過去問</p>
      </div>

      {/* Smart Presets */}
      <PresetCardGrid
        presets={PRESETS}
        activeId={activePreset}
        onSelect={handlePresetSelect}
      />

      {/* Subject chips */}
      <ChipFilter
        label="科目"
        items={SUBJECTS.map(s => ({ value: s, label: s }))}
        selected={selectedSubjects}
        onToggle={handleSubjectToggle}
      />

      {/* Sub-field chips (dynamic) */}
      {selectedSubjects.map(subject => (
        <SubFieldChips
          key={subject}
          subject={subject}
          selectedMajors={selectedMajors[subject] ?? []}
          onToggle={(majorName) => handleMajorToggle(subject, majorName)}
        />
      ))}

      {/* Year chips */}
      <ChipFilter
        label="年度（回）"
        items={YEARS.map(y => ({ value: y, label: `第${y}回` }))}
        selected={selectedYears}
        onToggle={(y) => { setSelectedYears(prev => toggleArrayItem(prev, y)); setActivePreset(null) }}
      />

      {/* Section chips */}
      <ChipFilter
        label="区分"
        items={SECTIONS}
        selected={selectedSections}
        onToggle={(s) => { setSelectedSections(prev => toggleArrayItem(prev, s)); setActivePreset(null) }}
      />

      {/* Detail filter button */}
      <button
        type="button"
        className={styles.detailBtn}
        onClick={() => setBottomSheetOpen(true)}
      >
        🔍 詳細フィルター（正誤・キーワード・画像問題）
      </button>

      {/* Result bar */}
      <div className={styles.resultBar}>
        <div className={styles.resultCount}>
          <span>{filteredQuestions.length}</span> 問ヒット
        </div>
        <button
          type="button"
          className={styles.sortBtn}
          onClick={() => setRandomOrder(prev => !prev)}
        >
          {randomOrder ? '🔀 ランダム' : '▼ 年度順'}
        </button>
      </div>

      {/* Question cards (show first 20) */}
      {filteredQuestions.slice(0, 20).map(q => (
        <QuestionCard
          key={q.id}
          question={q}
          status={getStatus(q)}
          fieldName={getFieldName(q)}
          onClick={() => {
            // Save full filtered list so QuestionPage can navigate prev/next
            localStorage.setItem('practice_session', JSON.stringify(filteredQuestions.map(qq => qq.id)))
            navigate(`/practice/${q.id}`)
          }}
        />
      ))}

      {filteredQuestions.length > 20 && (
        <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 12, margin: '16px 0' }}>
          他 {filteredQuestions.length - 20} 問...「演習開始」で出題されます
        </p>
      )}

      {/* Bottom Sheet */}
      <BottomSheet
        open={bottomSheetOpen}
        onClose={() => setBottomSheetOpen(false)}
        title="詳細フィルター"
      >
        <div className={styles.filterGroup}>
          <div className={styles.filterLabel}>正誤ステータス</div>
          <div className={styles.statusBtns}>
            {([
              { value: 'all', label: '全て' },
              { value: 'correct', label: '○' },
              { value: 'incorrect', label: '✕' },
              { value: 'unanswered', label: '—' },
            ] as const).map(s => (
              <button
                key={s.value}
                type="button"
                className={`${styles.statusBtn} ${correctStatus === s.value ? styles.selected : ''}`}
                onClick={() => { setCorrectStatus(s.value); setActivePreset(null) }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.toggleRow}>
          <span className={styles.toggleLabel}>画像問題のみ</span>
          <button
            type="button"
            className={`${styles.toggle} ${imageOnly ? styles.on : ''}`}
            onClick={() => setImageOnly(prev => !prev)}
          />
        </div>

        <div className={styles.toggleRow}>
          <span className={styles.toggleLabel}>ランダム順</span>
          <button
            type="button"
            className={`${styles.toggle} ${randomOrder ? styles.on : ''}`}
            onClick={() => setRandomOrder(prev => !prev)}
          />
        </div>

        <div className={styles.filterGroup} style={{ marginTop: 16 }}>
          <div className={styles.filterLabel}>キーワード検索</div>
          <input
            type="text"
            className={styles.keywordInput}
            placeholder="問題文やタグで検索..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.filterLabel}>問題数</div>
          <div className={styles.statusBtns}>
            {([10, 20, 0] as const).map(n => (
              <button
                key={n}
                type="button"
                className={`${styles.statusBtn} ${sessionCount === n ? styles.selected : ''}`}
                onClick={() => setSessionCount(n)}
              >
                {n === 0 ? '全問' : `${n}問`}
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>

      {/* Sticky Action Bar */}
      <StickyActionBar
        count={sessionCount === 0 ? filteredQuestions.length : Math.min(sessionCount, filteredQuestions.length)}
        onStart={handleStartSession}
        onSettings={() => setBottomSheetOpen(true)}
      />

      <FloatingNav />
    </div>
  )
}
```

- [ ] **Step 3: ブラウザで確認**

Run: `npm run dev`
Expected: `/practice` にアクセスするとSoft Companion デザインの演習ページが表示される。プリセット選択、チップフィルター、分野チップ展開、ボトムシート、演習開始が動作する。

- [ ] **Step 4: TypeScriptエラーがないか確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/pages/PracticePage.tsx src/pages/PracticePage.module.css
git commit -m "feat: 演習ページをSoft Companionデザインでリデザイン（Ant Design脱却）"
```

---

## Task 9: AppLayout の条件分岐（FloatingNav 対応）

**Files:**
- Modify: `src/components/layout/AppLayout.tsx`
- Modify: `src/styles/global.css`

- [ ] **Step 1: AppLayout.tsx にリデザイン済みページ判定を追加**

`AppLayout.tsx` に以下の変更を加える:

1. コンポーネント内の先頭に判定ロジックを追加:
```typescript
const REDESIGNED_PATHS = ['/', '/practice']
const isRedesigned = REDESIGNED_PATHS.some(
  p => location.pathname === p || location.pathname.startsWith(p + '/')
)
```

NOTE: `/practice/r105-12` のようなサブルートもマッチさせるため `startsWith` を使用。

3. JSXの変更:
- `isRedesigned` が `true` の場合: Ant DesignのHeader/Footerを非表示にする
- `isRedesigned` が `false` の場合: 既存のHeader/Footerをそのまま表示
- **FloatingNav は各ページが自身でレンダリング**するため、AppLayout には追加しない

具体的には、Header部分を `{!isRedesigned && (<Layout.Header>...</Layout.Header>)}` でラップし、Footer部分も同様にラップ。

- [ ] **Step 2: `src/styles/global.css` を整理**

Ant Design依存のメディアクエリに `.ant-layout-header` 等がリデザインページで不要になったが、未移行ページには依存するため、**現時点では変更しない**（全ページ移行後に削除）。

- [ ] **Step 3: ブラウザで確認**

Run: `npm run dev`
Expected: `/practice` と `/` でFloatingNavが表示され、Ant Designのヘッダー/フッターが非表示。`/analysis` 等では従来通り。

- [ ] **Step 4: コミット**

```bash
git add src/components/layout/AppLayout.tsx
git commit -m "feat: AppLayoutにFloatingNav条件分岐追加（リデザイン済みページのみ表示）"
```

---

## Task 10: ホーム画面用コンポーネント（DecoWave, StatCircle, SubjectMastery）

**Files:**
- Create: `src/components/ui/DecoWave.tsx` + `DecoWave.module.css`
- Create: `src/components/ui/StatCircle.tsx` + `StatCircle.module.css`
- Create: `src/components/ui/SubjectMastery.tsx` + `SubjectMastery.module.css`

- [ ] **Step 1: DecoWave を作成**

`src/components/ui/DecoWave.module.css`:
```css
.wave {
  height: 4px;
  background: linear-gradient(90deg, #f97316, #fb923c, #fdba74, #fed7aa);
  border-radius: 2px;
  margin-bottom: 16px;
}
```

`src/components/ui/DecoWave.tsx`:
```tsx
import styles from './DecoWave.module.css'
export function DecoWave() {
  return <div className={styles.wave} />
}
```

- [ ] **Step 2: StatCircle を作成**

`src/components/ui/StatCircle.module.css`:
```css
.container {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}

.circle {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px solid;
}

.blue { border-color: rgba(37, 99, 235, 0.2); background: rgba(37, 99, 235, 0.04); }
.yellow { border-color: rgba(245, 158, 11, 0.2); background: rgba(245, 158, 11, 0.04); }
.orange { border-color: rgba(249, 115, 22, 0.2); background: rgba(249, 115, 22, 0.04); }

.num {
  font-size: 26px;
  font-weight: 800;
  color: var(--text);
  line-height: 1;
}

.label {
  font-size: 10px;
  color: var(--text-2);
  margin-top: 2px;
}
```

`src/components/ui/StatCircle.tsx`:
```tsx
import styles from './StatCircle.module.css'

interface Stat {
  value: number
  label: string
  color: 'blue' | 'yellow' | 'orange'
}

interface StatCirclesProps {
  stats: Stat[]
}

export function StatCircles({ stats }: StatCirclesProps) {
  return (
    <div className={styles.container}>
      {stats.map(s => (
        <div key={s.label} className={`${styles.circle} ${styles[s.color]}`}>
          <span className={styles.num}>{s.value}</span>
          <span className={styles.label}>{s.label}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: SubjectMastery を作成**

`src/components/ui/SubjectMastery.module.css`:
```css
.card {
  background: var(--card);
  border-radius: var(--r-card);
  padding: 16px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  margin-bottom: 16px;
}

.row { margin-bottom: 12px; }
.row:last-child { margin-bottom: 0; }

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  cursor: pointer;
}

.name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.pct {
  font-size: 12px;
  font-weight: 700;
}

.subFields {
  padding: 8px 0 0 16px;
  border-left: 2px solid rgba(170, 59, 255, 0.1);
  margin-left: 4px;
  margin-top: 8px;
}

.subField {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.subField:last-child { margin-bottom: 0; }

.sfName {
  font-size: 11px;
  color: var(--text);
  flex: 1;
}

.sfBar {
  width: 80px;
  height: 4px;
  background: #f0ecf4;
  border-radius: 2px;
  overflow: hidden;
}

.sfFill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.sfPct {
  font-size: 10px;
  font-weight: 700;
  width: 32px;
  text-align: right;
}

.sfLink {
  font-size: 10px;
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  background: none;
  border: none;
  font-family: var(--font);
}
```

`src/components/ui/SubjectMastery.tsx`:
```tsx
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTopicMastery } from '../../hooks/useTopicMastery'
import { EXAM_BLUEPRINT } from '../../data/exam-blueprint'
import { ProgressBar } from './ProgressBar'
import type { QuestionSubject } from '../../types/question'
import type { TopicMastery as TopicMasteryType } from '../../types/blueprint'
import styles from './SubjectMastery.module.css'

const ALL_SUBJECTS: QuestionSubject[] = [
  '物理', '化学', '生物', '衛生', '薬理', '薬剤', '病態・薬物治療', '法規・制度・倫理', '実務',
]

function statusColor(pct: number): string {
  if (pct === 0) return 'var(--text-3)'
  if (pct >= 70) return 'var(--ok)'
  if (pct >= 30) return 'var(--warn)'
  return 'var(--ng)'
}

function statusIcon(pct: number): string {
  if (pct >= 70) return '✅'
  if (pct >= 30) return '📘'
  if (pct > 0) return '⚠️'
  return '🔲'
}

interface MajorGroup {
  name: string
  topics: TopicMasteryType[]
  avgCorrectRate: number
}

export function SubjectMastery() {
  const navigate = useNavigate()
  const { topicsBySubject, getSubjectSummary } = useTopicMastery()
  const [expandedSubject, setExpandedSubject] = useState<QuestionSubject | null>(null)

  // Group topics by MajorCategory for expanded view
  const getMajorGroups = (subject: QuestionSubject): MajorGroup[] => {
    const blueprint = EXAM_BLUEPRINT.find(b => b.subject === subject)
    if (!blueprint) return []

    const topics = topicsBySubject[subject] ?? []
    return blueprint.majorCategories.map(major => {
      const middleIds = new Set(major.middleCategories.map(mc => mc.id))
      const groupTopics = topics.filter(t => middleIds.has(t.topicId))
      const answered = groupTopics.filter(t => t.answeredQuestions > 0)
      const avgRate = answered.length > 0
        ? answered.reduce((sum, t) => sum + t.correctRate, 0) / answered.length
        : 0
      return { name: major.name, topics: groupTopics, avgCorrectRate: Math.round(avgRate * 100) }
    })
  }

  return (
    <div className={styles.card}>
      {ALL_SUBJECTS.map(subject => {
        const summary = getSubjectSummary(subject)
        const pct = summary.total > 0
          ? Math.round(((summary.mastered + summary.almost * 0.7) / summary.total) * 100)
          : 0
        const isExpanded = expandedSubject === subject

        return (
          <div key={subject} className={styles.row}>
            <div
              className={styles.header}
              onClick={() => setExpandedSubject(isExpanded ? null : subject)}
            >
              <span className={styles.name}>
                {isExpanded ? '▼' : '▶'} {subject}
              </span>
              <span className={styles.pct} style={{ color: statusColor(pct) }}>
                {pct}%
              </span>
            </div>
            <ProgressBar percent={pct} />

            {isExpanded && (
              <div className={styles.subFields}>
                {getMajorGroups(subject).map(group => (
                  <div key={group.name} className={styles.subField}>
                    <span className={styles.sfName}>{group.name}</span>
                    <div className={styles.sfBar}>
                      <div
                        className={styles.sfFill}
                        style={{
                          width: `${group.avgCorrectRate}%`,
                          background: statusColor(group.avgCorrectRate),
                        }}
                      />
                    </div>
                    <span className={styles.sfPct} style={{ color: statusColor(group.avgCorrectRate) }}>
                      {group.avgCorrectRate}%
                    </span>
                    <span>{statusIcon(group.avgCorrectRate)}</span>
                    {group.avgCorrectRate < 70 && (
                      <button
                        className={styles.sfLink}
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate('/practice') // TODO: pass field filter as state
                        }}
                      >
                        演習→
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: コミット**

```bash
git add src/components/ui/DecoWave.tsx src/components/ui/DecoWave.module.css \
  src/components/ui/StatCircle.tsx src/components/ui/StatCircle.module.css \
  src/components/ui/SubjectMastery.tsx src/components/ui/SubjectMastery.module.css
git commit -m "feat: DecoWave, StatCircles, SubjectMasteryコンポーネント追加"
```

---

## Task 11: TodayMenu リデザイン

**Files:**
- Modify: `src/components/TodayMenu.tsx` (完全書き直し)
- Create: `src/components/TodayMenu.module.css`

- [ ] **Step 1: `src/components/TodayMenu.module.css` を作成**

```css
.card {
  background: var(--card);
  border-radius: var(--r-card);
  padding: 14px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.15s;
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.priority::before { background: linear-gradient(180deg, #ef4444, #f87171); }
.review::before { background: linear-gradient(180deg, #f59e0b, #fbbf24); }
.challenge::before { background: linear-gradient(180deg, var(--accent), #c084fc); }

.card:nth-child(2) { transform: rotate(-0.3deg); }
.card:nth-child(3) { transform: rotate(0.2deg); }

.icon { font-size: 28px; flex-shrink: 0; }

.content { flex: 1; }

.badge {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  margin-bottom: 4px;
  display: inline-block;
}

.badgeRed { background: rgba(239, 68, 68, 0.1); color: var(--ng); }
.badgeYellow { background: rgba(245, 158, 11, 0.1); color: var(--warn); }
.badgePurple { background: rgba(170, 59, 255, 0.1); color: var(--accent); }

.title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 2px;
}

.desc {
  font-size: 11px;
  color: var(--text-2);
}

.arrow {
  color: #d1cdd9;
  font-size: 18px;
}

.fallback {
  text-align: center;
  padding: 20px;
  color: var(--text-3);
  font-size: 13px;
}
```

- [ ] **Step 2: `src/components/TodayMenu.tsx` を書き直し**

既存の176行を以下に置き換え:

```tsx
import { useNavigate } from 'react-router-dom'
import type { QuestionSubject } from '../types/question'
import styles from './TodayMenu.module.css'

interface TodayMenuProps {
  weakestTopic?: {
    topicId: string
    subject: QuestionSubject
    middleCategory: string
    correctRate: number
  }
  dueCardsCount: number
  almostMasteredTopic?: {
    topicId: string
    subject: QuestionSubject
    middleCategory: string
    correctRate: number
  }
  yesterdayMistakeCount: number
}

export function TodayMenu({
  weakestTopic,
  dueCardsCount,
  almostMasteredTopic,
  yesterdayMistakeCount,
}: TodayMenuProps) {
  const navigate = useNavigate()

  const hasPriority = !!weakestTopic
  const hasReview = dueCardsCount > 0 || yesterdayMistakeCount > 0
  const hasChallenge = !!almostMasteredTopic

  if (!hasPriority && !hasReview && !hasChallenge) {
    return <div className={styles.fallback}>今日のメニューはまだありません。まず演習を始めてみましょう！</div>
  }

  return (
    <>
      {hasPriority && (
        <div
          className={`${styles.card} ${styles.priority}`}
          onClick={() => navigate('/practice')}
        >
          <span className={styles.icon}>🔴</span>
          <div className={styles.content}>
            <span className={`${styles.badge} ${styles.badgeRed}`}>優先</span>
            <div className={styles.title}>苦手克服：{weakestTopic!.subject} {weakestTopic!.middleCategory}</div>
            <div className={styles.desc}>正答率 {Math.round(weakestTopic!.correctRate * 100)}% → 復習しよう</div>
          </div>
          <span className={styles.arrow}>›</span>
        </div>
      )}

      {hasReview && (
        <div
          className={`${styles.card} ${styles.review}`}
          onClick={() => dueCardsCount > 0 ? navigate('/cards/review') : navigate('/practice')}
        >
          <span className={styles.icon}>🟡</span>
          <div className={styles.content}>
            <span className={`${styles.badge} ${styles.badgeYellow}`}>復習</span>
            <div className={styles.title}>
              {dueCardsCount > 0
                ? `復習カード ${dueCardsCount}枚`
                : `昨日の間違い ${yesterdayMistakeCount}問`
              }
            </div>
            <div className={styles.desc}>
              {dueCardsCount > 0 ? '暗記カードの復習期限です（2分）' : '昨日間違えた問題を復習しよう'}
            </div>
          </div>
          <span className={styles.arrow}>›</span>
        </div>
      )}

      {hasChallenge && (
        <div
          className={`${styles.card} ${styles.challenge}`}
          onClick={() => navigate('/practice')}
        >
          <span className={styles.icon}>🟣</span>
          <div className={styles.content}>
            <span className={`${styles.badge} ${styles.badgePurple}`}>チャレンジ</span>
            <div className={styles.title}>頻出テーマ：{almostMasteredTopic!.middleCategory}</div>
            <div className={styles.desc}>もう少しでマスター！正答率 {Math.round(almostMasteredTopic!.correctRate * 100)}%</div>
          </div>
          <span className={styles.arrow}>›</span>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3: コミット**

```bash
git add src/components/TodayMenu.tsx src/components/TodayMenu.module.css
git commit -m "feat: TodayMenuをSoft Companionデザインにリデザイン"
```

---

## Task 12: HomePage 完全リデザイン

**Files:**
- Modify: `src/pages/HomePage.tsx` (完全書き直し)
- Create: `src/pages/HomePage.module.css`

- [ ] **Step 1: `src/pages/HomePage.module.css` を作成**

```css
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
}

.streak {
  background: linear-gradient(135deg, #f3e8ff, #ede9fe);
  color: #7c3aed;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid rgba(124, 58, 237, 0.15);
}

.greeting {
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 20px;
}

.quickActions {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;
}

.qaBtn {
  background: var(--card);
  border: 1.5px solid var(--border);
  border-radius: var(--r);
  padding: 14px 8px;
  text-align: center;
  cursor: pointer;
  font-family: var(--font);
  transition: border-color 0.15s;
}

.qaBtn:hover {
  border-color: var(--accent-border);
}

.qaIcon {
  font-size: 22px;
  margin-bottom: 4px;
}

.qaLabel {
  font-size: 11px;
  font-weight: 600;
  color: var(--text);
}
```

- [ ] **Step 2: `src/pages/HomePage.tsx` を完全書き直し**

```tsx
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalytics } from '../hooks/useAnalytics'
import { useTopicMastery } from '../hooks/useTopicMastery'
import { useFlashCards } from '../hooks/useFlashCards'
import { DecoWave } from '../components/ui/DecoWave'
import { StatCircles } from '../components/ui/StatCircle'
import { SubjectMastery } from '../components/ui/SubjectMastery'
import { FloatingNav } from '../components/ui/FloatingNav'
import { TodayMenu } from '../components/TodayMenu'
import styles from './HomePage.module.css'

export function HomePage() {
  const navigate = useNavigate()
  const { totalAnswered, isEmpty, streakDays, yesterdayMistakeCount } = useAnalytics()
  const { allTopics } = useTopicMastery()
  const { dueCards } = useFlashCards()

  // Find weakest topic (learning with lowest correctRate, or first not_started)
  const weakestTopic = useMemo(() => {
    const notStarted = allTopics.find(t => t.status === 'not_started')
    if (notStarted) return notStarted
    const learning = allTopics
      .filter(t => t.status === 'learning')
      .sort((a, b) => a.correctRate - b.correctRate)
    return learning[0]
  }, [allTopics])

  // Find almost mastered topic
  const almostMasteredTopic = useMemo(() => {
    return allTopics
      .filter(t => t.status === 'almost')
      .sort((a, b) => b.correctRate - a.correctRate)[0]
  }, [allTopics])

  // Welcome screen for first-time users
  if (isEmpty) {
    return (
      <div className="sc-page">
        <DecoWave />
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💊</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            国試ノートへようこそ！
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 32, lineHeight: 1.6 }}>
            11年分・3,470問の過去問で<br />薬剤師国家試験対策を始めましょう
          </p>
          <button
            type="button"
            onClick={() => navigate('/practice')}
            style={{
              background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
              color: '#fff',
              border: 'none',
              padding: '14px 32px',
              borderRadius: 'var(--r)',
              fontSize: 16,
              fontWeight: 700,
              fontFamily: 'var(--font)',
              boxShadow: 'var(--shadow-cta)',
              cursor: 'pointer',
            }}
          >
            ▶ 最初の演習を始める
          </button>
        </div>
        <FloatingNav />
      </div>
    )
  }

  return (
    <div className="sc-page">
      <DecoWave />

      {/* Header */}
      <div className={styles.header}>
        <span className={styles.title}>💊 国試ノート</span>
        {streakDays > 0 && (
          <span className={styles.streak}>🔥 {streakDays}日連続</span>
        )}
      </div>
      <div className={styles.greeting}>こんにちは！今日も頑張りましょう 💪</div>

      {/* Today's Menu */}
      <div className="section-title">🎯 今日のメニュー</div>
      <TodayMenu
        weakestTopic={weakestTopic ? {
          topicId: weakestTopic.topicId,
          subject: weakestTopic.subject,
          middleCategory: weakestTopic.middleCategory,
          correctRate: weakestTopic.correctRate,
        } : undefined}
        dueCardsCount={dueCards.length}
        almostMasteredTopic={almostMasteredTopic ? {
          topicId: almostMasteredTopic.topicId,
          subject: almostMasteredTopic.subject,
          middleCategory: almostMasteredTopic.middleCategory,
          correctRate: almostMasteredTopic.correctRate,
        } : undefined}
        yesterdayMistakeCount={yesterdayMistakeCount}
      />

      {/* Stats */}
      <div className="section-title">📈 がんばり記録</div>
      <StatCircles stats={[
        { value: totalAnswered, label: '解いた問題', color: 'blue' },
        { value: dueCards.length, label: '復習カード', color: 'yellow' },
        { value: streakDays, label: '連続学習', color: 'orange' },
      ]} />

      {/* Subject Mastery */}
      <div className="section-title">📊 科目べつ進み具合</div>
      <SubjectMastery />

      {/* Quick Actions */}
      <div className="section-title">⚡ クイックアクション</div>
      <div className={styles.quickActions}>
        <button type="button" className={styles.qaBtn} onClick={() => navigate('/practice')}>
          <div className={styles.qaIcon}>📝</div>
          <div className={styles.qaLabel}>自分で選ぶ</div>
        </button>
        <button type="button" className={styles.qaBtn} onClick={() => navigate('/notes')}>
          <div className={styles.qaIcon}>📌</div>
          <div className={styles.qaLabel}>付箋</div>
        </button>
        <button type="button" className={styles.qaBtn} onClick={() => {
          // Quick random 10 — navigate to practice with random preset
          navigate('/practice')
        }}>
          <div className={styles.qaIcon}>🎲</div>
          <div className={styles.qaLabel}>ランダム10</div>
        </button>
      </div>

      <FloatingNav />
    </div>
  )
}
```

- [ ] **Step 3: ブラウザで確認**

Run: `npm run dev`
Expected: `/` にアクセスするとSoft Companionデザインのホーム画面が表示。今日のメニュー、統計バブル、科目進捗、クイックアクションが動作。

- [ ] **Step 4: TypeScriptエラーがないか確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/pages/HomePage.tsx src/pages/HomePage.module.css
git commit -m "feat: ホーム画面をSoft Companionデザインでリデザイン（Ant Design脱却）"
```

---

## Task 13: ビルド確認 + 最終クリーンアップ

**Files:**
- Possibly modify: `vite.config.ts` (Ant Design chunk split if needed)

- [ ] **Step 1: 全テスト実行**

Run: `npx vitest run`
Expected: 全テストPASS

- [ ] **Step 2: TypeScript型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: プロダクションビルド**

Run: `npm run build`
Expected: ビルド成功。warningは許容（unused antd imports in未移行ページ）

- [ ] **Step 4: ビルド結果を確認**

Run: `npm run preview`
Expected: `/` と `/practice` がSoft Companionデザインで表示。他ページ（`/analysis` 等）は従来通り動作。

- [ ] **Step 5: コミット**

```bash
git add -A
git commit -m "chore: Phase 1 Week 1-2 リデザイン完了（演習+ホーム）"
```
