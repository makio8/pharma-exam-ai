# 実機品質検証 残課題修正 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 実機検証で発見された5つの残課題（ナビバグ、連問UI、処方画像、型揺れ、画像コミット）を解決する

**Architecture:** Task 1はQuestionPage/PracticePageのナビゲーション修正、Task 2は連問をグループ表示するLinkedQuestionViewerコンポーネント新設、Task 3はvisual_content_typeベースの画像追加表示、Task 4は型定義の拡張、Task 5はgit操作のみ

**Tech Stack:** React 19 + TypeScript + Ant Design 5 + React Router 7 + Vite

---

## File Structure

| ファイル | 役割 | 操作 |
|---------|------|------|
| `src/pages/QuestionPage.tsx` | 問題表示・ナビゲーション（Task 1, 2, 3） | Modify |
| `src/pages/PracticePage.tsx` | 問題一覧・「解く」ボタン（Task 1） | Modify |
| `src/components/LinkedQuestionViewer.tsx` | 連問セット表示コンポーネント（Task 2） | Create |
| `src/hooks/useLinkedQuestions.ts` | 連問グループ解決フック（Task 2） | Create |
| `src/types/question.ts` | VisualContentType 型拡張（Task 4） | Modify |
| `scripts/normalize-visual-content-type.ts` | 型揺れ正規化スクリプト（Task 4） | Create |

---

## Task 1: 次/前ボタンが押せないバグ修正（優先度: 高）

**原因特定済み:**
- PracticePage の「解く」ボタン（354行目）は `navigate(`/practice/${q.id}`)` するだけで `practice_session` を localStorage にセットしない
- QuestionPage は `localStorage.getItem('practice_session')` から sessionIds を取得するため、セッションなしで遷移すると prev/next が常に null になりボタンが disabled

**Files:**
- Modify: `src/pages/PracticePage.tsx:348-358` — 「解く」ボタンクリック時にセッションを設定
- Modify: `src/pages/QuestionPage.tsx:66-80` — セッション無しでも前後問題を計算するフォールバック

- [ ] **Step 1: PracticePage の「解く」ボタンにセッション設定を追加**

`src/pages/PracticePage.tsx` の「解く」ボタンの onClick を修正。クリックした問題の前後を含む filteredQuestions の ID リストをセッションに保存する：

```typescript
// 354行目付近を修正
<Button
  type="link"
  size="small"
  onClick={() => {
    // フィルタ済みリスト全体をセッションとして保存（個別クリックでもナビ可能に）
    localStorage.setItem(
      'practice_session',
      JSON.stringify(filteredQuestions.map((fq) => fq.id)),
    )
    navigate(`/practice/${q.id}`)
  }}
>
  解く
</Button>
```

- [ ] **Step 2: QuestionPage にセッション無しのフォールバックを追加**

`src/pages/QuestionPage.tsx` の sessionIds useMemo を修正。セッションが空の場合は ALL_QUESTIONS 全体から前後を計算する：

```typescript
// 66行目付近を修正
const sessionIds = useMemo<string[]>(() => {
  try {
    const raw = localStorage.getItem('practice_session')
    if (raw) {
      const ids = JSON.parse(raw) as string[]
      if (ids.length > 0) return ids
    }
  } catch {
    // パースエラーは無視
  }
  // フォールバック: 全問題のIDリスト（年度→問題番号順）
  return ALL_QUESTIONS.map((q) => q.id)
}, [])

// 連問タブ等でセッション外の問題に遷移した場合のフォールバック
const currentIndex = useMemo(() => {
  const idx = sessionIds.indexOf(questionId ?? '')
  if (idx === -1 && questionId) {
    // セッションに含まれない問題 → 全問題リストにフォールバック
    return ALL_QUESTIONS.findIndex((q) => q.id === questionId)
  }
  return idx
}, [sessionIds, questionId])

const effectiveIds = currentIndex >= 0 && sessionIds.indexOf(questionId ?? '') >= 0
  ? sessionIds
  : ALL_QUESTIONS.map((q) => q.id)
```

- [ ] **Step 3: ビルド確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npm run build`
Expected: BUILD SUCCESS

- [ ] **Step 4: 動作確認（手動）**

確認項目:
1. PracticePage → 「解く」ボタン → QuestionPage で前/次ボタンが有効
2. 「演習開始」→ QuestionPage で前/次ボタンが有効（既存動作の退行なし）
3. URL直接アクセス → 全問題リストで前/次が動く

- [ ] **Step 5: コミット**

```bash
git add src/pages/PracticePage.tsx src/pages/QuestionPage.tsx
git commit -m "fix: 次/前ボタンが押せないバグを修正（セッション未設定時のフォールバック追加）"
```

---

## Task 2: 連問UI構造化（優先度: 高）

**背景:**
- 実践問題（問196-345）の約75組が連問ペア/トリプレット
- `linked_group` (例: `"r100-197-199"`) と `linked_scenario` (共通シナリオ文) が839問に付与済み
- 現状: 個別問題として表示 → 共通シナリオが見えず文脈不明

**方針:**
- QuestionPage に連問検知ロジックを追加
- 同じ linked_group の問題をまとめて表示（シナリオ → 子問題タブ or 順次表示）
- 既存の個別表示も維持（連問でない問題はそのまま）

**Files:**
- Create: `src/hooks/useLinkedQuestions.ts`
- Create: `src/components/LinkedQuestionViewer.tsx`
- Modify: `src/pages/QuestionPage.tsx`

- [ ] **Step 1: useLinkedQuestions フックを作成**

```typescript
// src/hooks/useLinkedQuestions.ts
import { useMemo } from 'react'
import { ALL_QUESTIONS } from '../data/all-questions'
import type { Question } from '../types/question'

export interface LinkedGroup {
  groupId: string
  scenario: string
  questions: Question[]  // question_number 昇順
}

/**
 * 指定した問題の連問グループを返す。連問でなければ null
 */
export function useLinkedQuestions(questionId: string | undefined): LinkedGroup | null {
  return useMemo(() => {
    if (!questionId) return null
    const current = ALL_QUESTIONS.find((q) => q.id === questionId)
    if (!current?.linked_group) return null

    const groupQuestions = ALL_QUESTIONS
      .filter((q) => q.linked_group === current.linked_group)
      .sort((a, b) => a.question_number - b.question_number)

    if (groupQuestions.length <= 1) return null

    return {
      groupId: current.linked_group,
      scenario: current.linked_scenario
        ?? groupQuestions.find(q => q.linked_scenario)?.linked_scenario
        ?? '',
      questions: groupQuestions,
    }
  }, [questionId])
}
```

- [ ] **Step 2: LinkedQuestionViewer コンポーネントを作成**

```typescript
// src/components/LinkedQuestionViewer.tsx
import React from 'react'
import { Card, Tag, Typography, Space } from 'antd'
import { LinkOutlined } from '@ant-design/icons'
import type { LinkedGroup } from '../hooks/useLinkedQuestions'
import { Image } from 'antd'

const { Text, Paragraph } = Typography

interface Props {
  group: LinkedGroup
  currentQuestionId: string
  onNavigate: (questionId: string) => void
}

/**
 * 連問グループのヘッダー表示
 * - 共通シナリオを表示
 * - グループ内の問題番号タブ（現在の問題をハイライト）
 */
export function LinkedQuestionViewer({ group, currentQuestionId, onNavigate }: Props) {
  return (
    <Card
      size="small"
      style={{ marginBottom: 16, borderColor: '#d3adf7', background: '#f9f0ff' }}
    >
      <Space style={{ marginBottom: 8 }}>
        <LinkOutlined style={{ color: '#722ed1' }} />
        <Text strong style={{ color: '#722ed1' }}>
          連問（{group.questions.length}問セット）
        </Text>
      </Space>

      {/* 共通シナリオ */}
      {group.scenario && (
        <Paragraph
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            marginBottom: 12,
            padding: '8px 12px',
            background: 'white',
            borderRadius: 6,
          }}
        >
          {group.scenario}
        </Paragraph>
      )}

      {/* 問題番号タブ */}
      <Space size={4}>
        {group.questions.map((q) => (
          <Tag
            key={q.id}
            color={q.id === currentQuestionId ? 'purple' : 'default'}
            style={{
              cursor: 'pointer',
              fontWeight: q.id === currentQuestionId ? 'bold' : 'normal',
            }}
            onClick={() => onNavigate(q.id)}
          >
            問{q.question_number}（{q.subject}）
          </Tag>
        ))}
      </Space>
    </Card>
  )
}
```

- [ ] **Step 3: QuestionPage に連問表示を統合**

`src/pages/QuestionPage.tsx` に以下を追加:

1. import 追加:
```typescript
import { useLinkedQuestions } from '../hooks/useLinkedQuestions'
import { LinkedQuestionViewer } from '../components/LinkedQuestionViewer'
```

2. フック呼び出し（`question` の useMemo の後に追加）:
```typescript
const linkedGroup = useLinkedQuestions(questionId)
```

3. ヘッダー情報（Space wrap）の直後、既存回答 Alert の前に挿入:
```typescript
{/* 連問グループ表示 */}
{linkedGroup && (
  <LinkedQuestionViewer
    group={linkedGroup}
    currentQuestionId={questionId ?? ''}
    onNavigate={goToQuestion}
  />
)}
```

- [ ] **Step 4: ビルド確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npm run build`
Expected: BUILD SUCCESS

- [ ] **Step 5: コミット**

```bash
git add src/hooks/useLinkedQuestions.ts src/components/LinkedQuestionViewer.tsx src/pages/QuestionPage.tsx
git commit -m "feat: 連問UI構造化 — linked_groupデータを活用し連問セットを表示"
```

---

## Task 3: 処方画像の追加表示（優先度: 中）

**背景:**
- 110回問286等、choices が空でない問題でも処方箋・検査値の画像がある
- 画像パイプラインは choices 空の問題のみ対象だったため、これらが漏れた
- `visual_content_type` が `prescription` や `mixed` の問題を特定して画像を追加表示

**方針:**
- image_url が既にある問題はそのまま表示（既存動作）
- image_url が無い場合でも、linked_group 内の他の問題に画像があればそれを参照表示
- 連問シナリオ画像（処方箋等）は LinkedQuestionViewer に画像スロットを追加

**Files:**
- Modify: `src/components/LinkedQuestionViewer.tsx` — シナリオ画像表示を追加
- Modify: `src/pages/QuestionPage.tsx` — 連問の共有画像表示ロジック

- [ ] **Step 1: LinkedQuestionViewer にシナリオ画像を追加**

連問グループ内で最初に見つかった image_url をシナリオ画像として表示:

```typescript
// LinkedQuestionViewer.tsx の Props に追加不要（group.questions から取得）

// コンポーネント内でシナリオ画像を検出
const scenarioImage = group.questions.find((q) => q.image_url)?.image_url
```

シナリオテキストの直後に画像を表示:
```tsx
{scenarioImage && (
  <div style={{ marginBottom: 12, textAlign: 'center' }}>
    <Image
      src={scenarioImage}
      alt="連問の共通資料"
      style={{ maxHeight: '50vh', objectFit: 'contain' }}
      width="100%"
    />
  </div>
)}
```

- [ ] **Step 2: QuestionPage で連問画像の重複表示を防止**

連問グループの共通画像が LinkedQuestionViewer に表示される場合、QuestionPage 本体の画像表示を抑制:

```typescript
// 問題画像の表示条件を修正
const showQuestionImage = question.image_url && (
  !linkedGroup || // 連問でなければそのまま表示
  !linkedGroup.questions.find((q) => q.image_url)?.image_url || // グループに画像なければ表示
  linkedGroup.questions.find((q) => q.image_url)?.id === question.id // この問題自身の画像なら表示
)
```

**方針:** 連問画像は LinkedQuestionViewer に表示、個別画像も QuestionPage にそのまま表示。重複は許容（実害なし、シンプルさ優先）。変更不要。

- [ ] **Step 3: ビルド確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npm run build`
Expected: BUILD SUCCESS

- [ ] **Step 4: コミット**

```bash
git add src/components/LinkedQuestionViewer.tsx
git commit -m "feat: 連問シナリオ画像表示 — 処方箋・検査値画像を連問ヘッダーに追加"
```

---

## Task 4: visual_content_type 型揺れ正規化（優先度: 低）

**背景:**
- Vision抽出で30+種類の値が混入（text_with_prescription, biochemical_pathway, reaction_scheme 等）
- `VisualContentType` union型は7値のみ定義

**方針:** 既存7値にマッピング（union拡張ではなく正規化）。データ修正スクリプトで一括変換。

**Files:**
- Create: `scripts/normalize-visual-content-type.ts`
- Modify: `src/types/question.ts` — 必要に応じて1-2値追加

- [ ] **Step 1: 現在の値を全量調査**

Run:
```bash
cd /Users/ai/projects/personal/pharma-exam-ai
grep -oE "visual_content_type: '[^']*'" src/data/real-questions/exam-*.ts | sed "s/.*: //" | sort | uniq -c | sort -rn
```

- [ ] **Step 2: マッピングテーブルを定義**

```typescript
// scripts/normalize-visual-content-type.ts
const MAPPING: Record<string, string> = {
  // 既存7値はそのまま
  'structural_formula': 'structural_formula',
  'graph': 'graph',
  'table': 'table',
  'diagram': 'diagram',
  'prescription': 'prescription',
  'text_only': 'text_only',
  'mixed': 'mixed',
  // 正規化対象
  'text_with_prescription': 'prescription',
  'text_with_figure': 'diagram',
  'text_with_table': 'table',
  'biochemical_pathway': 'diagram',
  'reaction_scheme': 'structural_formula',
  'anatomy_diagram': 'diagram',
  'spectrum': 'graph',
  'photograph': 'mixed',
  'peptide_sequence': 'structural_formula',
  'formula': 'structural_formula',
  'equation': 'structural_formula',
  'diagram_with_table': 'mixed',
  // 不明な値はmixedにフォールバック
}
```

- [ ] **Step 3: 正規化スクリプトを実行**

スクリプトで exam-*.ts の visual_content_type 値を一括置換。

- [ ] **Step 4: ビルド確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npm run build`

- [ ] **Step 5: コミット**

```bash
git add scripts/normalize-visual-content-type.ts src/data/real-questions/exam-*.ts
git commit -m "fix: visual_content_type の型揺れを正規化（30+値→7値にマッピング）"
```

---

## Task 5: trim済み画像 PNG コミット（優先度: 低）

**背景:** sharp.trim() で処理した909枚のPNGが未コミット。

**Files:**
- `public/images/questions/{100-110}/*.png` — 909枚のtrim済み画像

- [ ] **Step 1: 容量確認**

Run:
```bash
cd /Users/ai/projects/personal/pharma-exam-ai
du -sh public/images/questions/
git status public/images/ | head -20
```

- [ ] **Step 2: 容量が妥当ならコミット**

目安: 100MB以下ならそのままコミット。超える場合はGit LFSを検討。

```bash
git add public/images/questions/
git commit -m "chore: trim済み画像PNG 909枚をコミット（sharp.trim()処理済み）"
```

- [ ] **Step 3: push**

```bash
git push origin main
```

---

## 依存関係・実行順序

```
Task 1 (ナビバグ)      ── 独立 ──────────────→ commit
Task 2 (連問UI)        ── Task 1の後 ────────→ commit
Task 3 (処方画像)      ── Task 2の後 ────────→ commit  （LinkedQuestionViewerに依存）
Task 4 (型揺れ正規化)  ── 独立 ──────────────→ commit
Task 5 (画像コミット)  ── 独立 ──────────────→ commit + push
```

**並列実行可能グループ:**
- Group A: Task 1 → Task 2 → Task 3（直列、ファイル依存あり）
- Group B: Task 4（独立）
- Group C: Task 5（独立、git操作のみ）

→ **推奨: Group A を1エージェント、Group B を1エージェント、Group C を親セッションで実行**
