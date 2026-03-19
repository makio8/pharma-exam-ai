# V2 MVP 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 出題基準ベースの単元マスター管理＋暗記カード生成・復習＋コーチ型ホーム画面を実装し、「隙間時間を合格力に変えるコーチ」体験を実現する。

**Architecture:** 厚労省出題基準PDFから科目→大項目→中項目→小項目の階層マスタデータを構築し、既存3,795問を中項目にAI自動マッピング。暗記カードは既存Repository Patternに沿ってFlashCard型を追加。ホーム画面は既存useAnalyticsを拡張してマスター進捗を表示。

**Tech Stack:** React 19 + TypeScript 5.9 (strict) + Ant Design 6 + Vite 8 + localStorage (Repository Pattern)

**Design Spec:** `docs/superpowers/specs/2026-03-19-v2-learning-experience-design.md`

---

## ファイル構成（新規作成・変更対象）

### 新規作成

| ファイル | 責務 |
|---------|------|
| `src/data/exam-blueprint.ts` | 出題基準マスタデータ（科目→大項目→中項目→小項目の階層） |
| `src/data/question-topic-map.ts` | 問題ID→中項目のマッピングテーブル |
| `scripts/build-blueprint.ts` | 出題基準PDFからマスタデータを生成するスクリプト |
| `scripts/map-questions-to-topics.ts` | 既存問題を中項目に自動マッピングするスクリプト |
| `src/types/flashcard.ts` | FlashCard型定義（表/裏/単元紐付け/復習状態） |
| `src/repositories/interfaces-flashcard.ts` | IFlashCardRepo インターフェース |
| `src/repositories/localStorage/flashCardRepo.ts` | localStorage実装 |
| `src/hooks/useFlashCards.ts` | フラッシュカードCRUD + 復習ロジック |
| `src/hooks/useTopicMastery.ts` | 単元マスター判定ロジック（中項目単位） |
| `src/pages/FlashCardPage.tsx` | カード復習画面（フリック/タップ操作） |
| `src/pages/FlashCardListPage.tsx` | カードデッキ一覧画面 |
| `src/components/FlashCard.tsx` | カード表示コンポーネント（表裏切替） |
| `src/components/TopicMasteryBar.tsx` | 科目別マスター進捗バー |
| `src/components/TodayMenu.tsx` | 今日のメニュー提案コンポーネント |

### 変更対象

| ファイル | 変更内容 |
|---------|---------|
| `src/pages/HomePage.tsx` | コーチ型ホーム画面にリニューアル |
| `src/hooks/useAnalytics.ts` | 単元マスターデータの算出を追加 |
| `src/components/layout/AppLayout.tsx` | ナビゲーションに「カード」タブ追加 |
| `src/pages/QuestionPage.tsx` | 解説画面にカード生成ボタン追加 |
| `vite.config.ts` | blueprint/mapデータのチャンク設定 |

---

## Task 1: 出題基準マスタデータ構築（独立タスク）

**依存:** なし（他タスクの前提）
**並列実行:** 単独で先行

**Files:**
- Create: `src/data/exam-blueprint.ts`
- Create: `src/types/blueprint.ts`

### ステップ

- [ ] **Step 1: 出題基準の型定義を作成**

`src/types/blueprint.ts`:
```typescript
export interface BlueprintItem {
  subject: QuestionSubject
  majorCategory: string    // 大項目
  middleCategory: string   // 中項目（マスター判定単位）
  minorCategories: string[] // 小項目リスト
}

export interface SubjectBlueprint {
  subject: QuestionSubject
  majorCategories: {
    name: string
    middleCategories: {
      name: string
      id: string  // "pharmacology-antibiotics" 形式
      minorCategories: string[]
    }[]
  }[]
}

export type TopicId = string  // 中項目のユニークID

export interface TopicMastery {
  topicId: TopicId
  subject: QuestionSubject
  majorCategory: string
  middleCategory: string
  status: 'not_started' | 'learning' | 'almost' | 'mastered'
  totalQuestions: number
  answeredQuestions: number
  correctRate: number  // 0-1
}
```

- [ ] **Step 2: 出題基準PDFからデータを抽出するスクリプトを作成**

`scripts/build-blueprint.ts`:
- 厚労省出題基準PDF（https://www.mhlw.go.jp/file/05-Shingikai-10803000-Iseikyoku-Ijika/0000143747.pdf）をpdftotext で抽出
- 科目→大項目→中項目→小項目の階層をパース
- `src/data/exam-blueprint.ts` に出力

実行コマンド:
```bash
cd ~/projects/personal/pharma-exam-ai
npx tsx scripts/build-blueprint.ts
```

- [ ] **Step 3: 手動調整＋データ確認**

出力された `exam-blueprint.ts` を確認。PDFパースの精度が不足する場合は手動補正。
目標: 全9科目の中項目リスト（推定40-60単元）が正確に構造化されていること。

- [ ] **Step 4: ビルド確認**

```bash
npm run build
```
Expected: 型エラーなしでビルド成功

- [ ] **Step 5: コミット**

```bash
git add src/types/blueprint.ts src/data/exam-blueprint.ts scripts/build-blueprint.ts
git commit -m "feat: 出題基準マスタデータを構築（科目→大項目→中項目→小項目）"
```

---

## Task 2: 問題→中項目マッピング（Task 1完了後）

**依存:** Task 1（出題基準マスタ）
**並列実行:** Task 1完了後に単独実行

**Files:**
- Create: `scripts/map-questions-to-topics.ts`
- Create: `src/data/question-topic-map.ts`

### ステップ

- [ ] **Step 1: マッピングスクリプトを作成**

`scripts/map-questions-to-topics.ts`:
- 全3,795問の `subject` + `category` + `question_text` + `tags` を読み込み
- exam-blueprint.ts の中項目リストと照合
- 各問題を最適な中項目にマッピング（キーワードマッチ + AIフォールバック）
- 出力: `{ [questionId: string]: TopicId }` の形式

```bash
npx tsx scripts/map-questions-to-topics.ts
```

- [ ] **Step 2: マッピング結果の出力ファイル生成**

`src/data/question-topic-map.ts`:
```typescript
import type { TopicId } from '../types/blueprint'

// 問題ID → 中項目ID のマッピング
export const QUESTION_TOPIC_MAP: Record<string, TopicId> = {
  "r100-001": "physics-analytical-chemistry",
  "r100-002": "physics-thermodynamics",
  // ... 3,795問分
}
```

- [ ] **Step 3: カバレッジ確認**

マッピング率を確認。目標: 90%以上の問題が中項目にマッピングされること。
未マッピング問題は `unknown` カテゴリに仮分類。

- [ ] **Step 4: Viteチャンク設定追加**

`vite.config.ts` に追加:
```typescript
if (id.includes('question-topic-map')) return 'data-topic-map'
if (id.includes('exam-blueprint')) return 'data-blueprint'
```

- [ ] **Step 5: ビルド確認＋コミット**

```bash
npm run build
git add src/data/question-topic-map.ts scripts/map-questions-to-topics.ts vite.config.ts
git commit -m "feat: 問題→中項目マッピングを生成（3,795問→出題基準単元）"
```

---

## Task 3: 単元マスター判定ロジック（Task 2完了後、Task 4-5と並列可能）

**依存:** Task 2（マッピングデータ）
**並列実行:** Task 4, Task 5 と並列可能

**Files:**
- Create: `src/hooks/useTopicMastery.ts`
- Create: `src/components/TopicMasteryBar.tsx`

### ステップ

- [ ] **Step 1: useTopicMastery フックを作成**

`src/hooks/useTopicMastery.ts`:
```typescript
import { useMemo } from 'react'
import { EXAM_BLUEPRINT } from '../data/exam-blueprint'
import { QUESTION_TOPIC_MAP } from '../data/question-topic-map'
import { ALL_QUESTIONS } from '../data/all-questions'
import type { TopicMastery, TopicId } from '../types/blueprint'
import type { AnswerHistory } from '../types/question'
import type { QuestionSubject } from '../types/question'

export function useTopicMastery(): {
  allTopics: TopicMastery[]
  topicsBySubject: Record<QuestionSubject, TopicMastery[]>
  masteredCount: number
  totalTopics: number
  getTopicMastery: (topicId: TopicId) => TopicMastery | undefined
  getSubjectSummary: (subject: QuestionSubject) => {
    mastered: number
    learning: number
    notStarted: number
    total: number
  }
}
```

マスター判定ロジック:
- `mastered`: その中項目の問題を3問以上解いて正答率80%+
- `almost`: 正答率60-79%（あと少し）
- `learning`: 1問以上解いたが60%未満
- `not_started`: 未着手

- [ ] **Step 2: TopicMasteryBar コンポーネントを作成**

`src/components/TopicMasteryBar.tsx`:
- Ant Design の Progress コンポーネントベース
- 科目名 + マスター数/総数 + 色分けプログレスバー
- 緑=マスター、黄=学習中、赤=要強化、グレー=未着手

- [ ] **Step 3: ビルド確認＋コミット**

```bash
npm run build
git add src/hooks/useTopicMastery.ts src/components/TopicMasteryBar.tsx
git commit -m "feat: 単元マスター判定ロジック＋進捗バーコンポーネント"
```

---

## Task 4: 暗記カードシステム（Task 2完了後、Task 3と並列可能）

**依存:** Task 2（カードを単元に紐付けるため）
**並列実行:** Task 3, Task 5 と並列可能

**Files:**
- Create: `src/types/flashcard.ts`
- Create: `src/repositories/interfaces-flashcard.ts`
- Create: `src/repositories/localStorage/flashCardRepo.ts`
- Create: `src/hooks/useFlashCards.ts`
- Create: `src/components/FlashCard.tsx`
- Create: `src/pages/FlashCardPage.tsx`
- Create: `src/pages/FlashCardListPage.tsx`
- Modify: `src/components/layout/AppLayout.tsx`（タブ追加）
- Modify: `src/pages/QuestionPage.tsx`（カード生成ボタン）

### ステップ

- [ ] **Step 1: FlashCard 型定義**

`src/types/flashcard.ts`:
```typescript
export type CardFormat = 'term_definition' | 'question_answer' | 'mnemonic'

export interface FlashCard {
  id: string
  user_id: string
  question_id: string       // 元の問題ID
  topic_id: string           // 中項目ID
  subject: QuestionSubject
  front: string              // 表面（問い/用語/語呂）
  back: string               // 裏面（答え/定義/対象）
  format: CardFormat
  tags: string[]
  ease_factor: number        // 復習間隔の調整係数（デフォルト2.5）
  interval_days: number      // 次の復習までの日数
  next_review_at: string     // ISO8601 次回復習日
  review_count: number       // 復習回数
  correct_streak: number     // 連続正答数
  created_at: string
  updated_at: string
}

export type ReviewResult = 'again' | 'hard' | 'good' | 'easy'

export interface FlashCardFormValues {
  front: string
  back: string
  format: CardFormat
  tags: string[]
}
```

- [ ] **Step 2: Repository インターフェース＋localStorage実装**

`src/repositories/interfaces-flashcard.ts`:
```typescript
export interface IFlashCardRepo {
  getAll(): Promise<FlashCard[]>
  add(input: Omit<FlashCard, 'id' | 'created_at' | 'updated_at'>): Promise<FlashCard>
  update(id: string, updates: Partial<FlashCard>): Promise<void>
  delete(id: string): Promise<void>
  getByTopicId(topicId: string): Promise<FlashCard[]>
  getDueCards(now?: Date): Promise<FlashCard[]>  // next_review_at <= now
}
```

`src/repositories/localStorage/flashCardRepo.ts`:
- 既存の `stickyNoteRepo.ts` と同じパターンで実装
- STORAGE_KEY = `'flash_cards'`
- `getDueCards()`: `next_review_at` が現在時刻以前のカードを返す

- [ ] **Step 3: useFlashCards フック**

`src/hooks/useFlashCards.ts`:
```typescript
export function useFlashCards(): {
  cards: FlashCard[]
  dueCards: FlashCard[]       // 今日復習すべきカード
  loading: boolean
  addCard: (input: FlashCardFormValues & { question_id: string; topic_id: string; subject: QuestionSubject }) => void
  reviewCard: (cardId: string, result: ReviewResult) => void  // 復習結果を記録→次回日を計算
  deleteCard: (id: string) => void
  getCardsByTopic: (topicId: string) => FlashCard[]
  generateCardsFromExplanation: (question: Question) => FlashCardFormValues[]  // AI生成
}
```

復習スケジュール（簡易SM-2）:
- `again`: interval = 1日、ease_factor -= 0.2
- `hard`: interval *= 1.2、ease_factor -= 0.15
- `good`: interval *= ease_factor
- `easy`: interval *= ease_factor * 1.3、ease_factor += 0.15
- ease_factor の下限 = 1.3

- [ ] **Step 4: FlashCard 表示コンポーネント**

`src/components/FlashCard.tsx`:
- カードの表/裏を切り替え表示
- タップで裏面表示
- 下部に4つの評価ボタン（もう一回/難しい/OK/簡単）
- カード種別（用語↔定義/問い↔答え/語呂↔対象）に応じたスタイル

- [ ] **Step 5: カード復習画面**

`src/pages/FlashCardPage.tsx`:
- `/cards/review` ルート
- dueCards を順に表示
- 評価ボタンで reviewCard() を呼び出し → 次のカードへ
- 全カード完了時に「今日の復習完了！」メッセージ
- プログレスバー（残りカード数）

- [ ] **Step 6: カードデッキ一覧画面**

`src/pages/FlashCardListPage.tsx`:
- `/cards` ルート
- 上部: 「今日の復習」ボタン（dueCards.length 表示）
- 科目別→単元別にカードをグループ表示
- カードの追加/削除

- [ ] **Step 7: ナビゲーション更新**

`src/components/layout/AppLayout.tsx`:
```typescript
const NAV_ITEMS = [
  { key: '/', label: 'ホーム', icon: <HomeOutlined /> },
  { key: '/practice', label: '演習', icon: <ReadOutlined /> },
  { key: '/cards', label: 'カード', icon: <CreditCardOutlined /> },  // 追加
  { key: '/analysis', label: '分析', icon: <BarChartOutlined /> },
]
```
※ 付箋タブは「分析」内のサブメニューまたは問題演習画面のサイドパネルに移動

- [ ] **Step 8: 問題演習画面にカード生成ボタン追加**

`src/pages/QuestionPage.tsx`:
- 解説表示エリアの下部に「🃏 暗記カードを作る」ボタン追加
- タップ → モーダルで表/裏を編集 → 保存
- AIによるカード自動生成（解説テキストから表/裏を抽出）もオプション

- [ ] **Step 9: ビルド確認＋コミット**

```bash
npm run build
git add src/types/flashcard.ts src/repositories/ src/hooks/useFlashCards.ts \
  src/components/FlashCard.tsx src/pages/FlashCard*.tsx \
  src/components/layout/AppLayout.tsx src/pages/QuestionPage.tsx
git commit -m "feat: 暗記カードシステム（生成・復習・SM-2スケジュール）"
```

---

## Task 5: ホーム画面リニューアル（Task 3完了後）

**依存:** Task 3（useTopicMastery）
**並列実行:** Task 4 と並列可能

**Files:**
- Create: `src/components/TodayMenu.tsx`
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/hooks/useAnalytics.ts`

### ステップ

- [ ] **Step 1: useAnalytics を拡張**

`src/hooks/useAnalytics.ts` に追加:
```typescript
// 追加の返り値
streakDays: number              // 連続学習日数
dueFlashCards: number           // 今日の復習カード数
weeklyMasteredCount: number     // 今週マスターした単元数
```

- [ ] **Step 2: TodayMenu コンポーネント作成**

`src/components/TodayMenu.tsx`:
- useTopicMastery から弱点単元を取得
- useFlashCards から dueCards 数を取得
- useAnswerHistory から昨日間違えた問題を取得
- 3つのメニューを優先度付きで表示:
  1. 🔴 優先: 弱点単元の必須問題（正答率が低い中項目）
  2. 🟡 復習: 昨日間違えた問題 or 暗記カード
  3. 🟢 チャレンジ: あと少しでマスターの単元
- タップで対応する画面に遷移

- [ ] **Step 3: HomePage を書き換え**

`src/pages/HomePage.tsx` を全面リニューアル:

上部セクション:
- メインKPI: 単元マスター数 / 全単元数（大きく表示）
- サブ統計: 解いた問題数 / 復習カード数 / 連続学習日数
- 科目別 TopicMasteryBar（全9科目）

下部セクション:
- 🎯 今日のメニュー（TodayMenu コンポーネント）
- クイックアクセス（自分で選ぶ / 付箋 / ランダム10問）

- [ ] **Step 4: ビルド確認＋コミット**

```bash
npm run build
git add src/components/TodayMenu.tsx src/pages/HomePage.tsx src/hooks/useAnalytics.ts
git commit -m "feat: コーチ型ホーム画面（単元マスター＋今日のメニュー）"
```

---

## 実行順序と並列化

```
Task 1（出題基準マスタ）
  ↓
Task 2（問題マッピング）
  ↓
  ├── Task 3（マスター判定） ──→ Task 5（ホーム画面）
  └── Task 4（暗記カード）   ──→ （Task 5 と合流）
```

- **Task 1 → 2**: 順序実行（依存関係あり）
- **Task 3, 4**: 並列実行可能（Task 2完了後）
- **Task 5**: Task 3 完了後（useTopicMastery を使用）。Task 4 の dueCards 数も使うが、なければ 0 表示で可

---

## 検証方法

1. **ビルド確認**: `npm run build` で全タスク完了後にエラーなし
2. **開発サーバー**: `npm run dev` で各画面の動作確認
3. **ホーム画面**: 単元マスターKPI + 科目別バー + 今日のメニューが表示される
4. **暗記カード**: 問題演習→解説→カード生成→カード一覧→復習フロー
5. **マスター判定**: 同じ中項目の問題を3問正解 → マスター状態に変化
6. **Playwright**: `npx playwright test` で既存テストが壊れていないこと
