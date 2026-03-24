# QuestionPage Soft Companion リデザイン設計書

**Author**: makio8 + Claude
**Date**: 2026-03-24
**Status**: Draft v1.0
**Reviewed by**: GPT-5.4 (Codex) — Round 1: 11件, Round 2: 5件, 全16件の指摘を反映済み
**Based on**: PRD_v1.md §7.3, Phase1 Week1-2 リデザイン設計書, ブレスト決定事項

---

## 1. 概要

QuestionPage（問題解答画面）を Ant Design から Soft Companion デザインシステムにリデザインする。
PRDの学習サイクル「発見→理解→暗記→確認」をUI上で途切れさせない「フロー型」レイアウトを採用。

### スコープ

| 含む | 含まない（後続） |
|------|----------------|
| 単問の QuestionPage リデザイン | LinkedQuestionViewer（単問完了後すぐ横展開） |
| 公式付箋の表示・ブックマーク | 付箋データの制作パイプライン |
| 暗記カード導線（遷移ボタン） | FlashCardPage のリデザイン |
| スワイプナビゲーション | セッション結果サマリー画面 |
| Ant Design 完全排除（icons含む） | AppLayout 自体のリデザイン |
| 自信度UIの廃止 → 解答時間自動計測 | AnswerHistory のDBスキーマ変更 |

### 設計原則（PRDより）

1. **2タップで演習開始** — 問題への集中を最優先
2. **分野でマスターする** — メタ情報は解答後に
3. **問題→付箋→暗記カードは1つの流れ** — フロー型で途切れない
4. **隙間時間ファースト** — 最短操作ステップ
5. **データは絶対消えない** — 後方互換を維持

---

## 2. 画面構成とレイアウト

### アプローチ: フロー型

解答→フィードバック→学習素材が1本の縦スクロールで途切れず流れる。

```
┌─────────────────────────────┐
│  薬理  問 3/10        ← → │  ← ① ProgressHeader
├─────────────────────────────┤
│                              │
│  交感神経のα1受容体を刺激    │  ← ② QuestionBody
│  した際の反応はどれか。      │
│                              │
│  ┌─ 1. 血管収縮 ──────────┐│  ← ③ ChoiceList
│  ├─ 2. 心拍数減少 ────────┤│
│  ├─ 3. 気管支拡張 ────────┤│
│  ├─ 4. 瞳孔縮小 ─────────┤│
│  └─ 5. 消化管運動亢進 ───┘│
│                              │
│  [🤷 わからん]               │  ← ④ ActionArea
│  ━━━━ [解答する] ━━━━━━━   │
│                              │
│ ─── 解答後（↓スクロール）──│
│                              │
│  ✅ 正解！ (12.3秒)          │  ← ⑤ ResultBanner
│                              │
│  ── 💡 解説 ────────────── │  ← ⑥ ExplanationSection
│  α1受容体は血管平滑筋に...  │
│                              │
│  ── 📌 公式付箋 ─────────  │  ← ⑦ OfficialNoteCard
│  ┌───────────────────────┐ │
│  │ 🖼 [手書きフロー図]     │ │
│  │ 交感神経の受容体と作用  │ │
│  │ 🔥 12問で使う知識       │ │
│  │ [☆ 保存] [🃏 暗記]     │ │
│  └───────────────────────┘ │
│                              │
│  ▸ 問題の詳細情報           │  ← ⑧ MetaAccordion
│                              │
│         ← スワイプで次へ →   │
├─────────────────────────────┤
│  🏠    📝    📌    📊       │  ← FloatingNav
└─────────────────────────────┘
```

### レイアウトルール

| 項目 | 値 | 根拠 |
|------|------|------|
| コンテナ | `.sc-page`（max-width 480px, padding 20px 16px 160px） | 既存パターン |
| セクション間余白 | `24px` | コンテンツ区切り |
| カード | `var(--card)` + `var(--shadow-sm)` + `border-radius: var(--r-card)` | 既存パターン |
| フォント | `var(--font)`（Quicksand + Noto Sans JP） | 既存パターン |
| 解答後の境界 | ResultBanner 出現で視覚的に切り替わる | フロー型の核心 |

### 解答後の自動スクロール

```
解答送信 → ResultBanner にスムーズスクロール
  scrollIntoView({ behavior: 'smooth', block: 'start' })
```

---

## 3. スワイプナビゲーション

```
← 左スワイプ: 次の問題
→ 右スワイプ: 前の問題
  - セッション内の sessionIds に基づく
  - 連問セットは getGroupStartId() でグループ先頭にスキップ
  - セッション端でバウンスアニメーション
  - スワイプ中は問題が横スライド
```

---

## 4. 選択肢UIと操作フロー

### 選択肢カードの状態

| 状態 | 番号の背景 | カード背景 | ボーダー |
|------|-----------|-----------|---------|
| 通常 | `var(--bg)` + `var(--text-2)` | `var(--card)` | `1.5px solid var(--border)` |
| 選択中 | `var(--accent)` + 白 | `var(--accent-light)` | `2px solid var(--accent)` |
| 正解 | `var(--ok)` + 白 | `rgba(16,185,129,0.08)` | `2px solid var(--ok)` |
| 不正解（選択） | `var(--ng)` + 白 | `rgba(239,68,68,0.08)` | `2px solid var(--ng)` |
| 解答後その他 | `var(--bg)` + `var(--text-3)` | `var(--card)` | `1.5px solid var(--border)` |

### 選択肢カードのCSS概要

```css
.choice {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--card);
  border: 1.5px solid var(--border);
  border-radius: var(--r);
  cursor: pointer;
  transition: all 0.15s ease;
}
.choice:active { transform: scale(0.98); }
.choiceNumber {
  width: 28px; height: 28px;
  border-radius: 50%;
  font-weight: 700; font-size: 13px;
}
```

### 3つの問題タイプ

| タイプ | 判定条件 | UI |
|--------|---------|-----|
| 単一選択 | `!isMultiAnswer(question)` | ラジオ的（1つだけ選択可能） |
| 複数選択 | `isMultiAnswer(question)` | チェック的 + 「N個選んでください（M/N）」ヒント |
| 数値入力 | `choices.length === 0` | 数字ボタン（1〜9）グリッド |

### アクションエリア

```
解答前:
  [🤷 わからん]          ← テキストリンク風（控えめ）
  ━━ [▶ 解答する] ━━    ← グラデーションCTA
                            linear-gradient(135deg, #aa3bff, #8b5cf6)
                            disabled until 選択肢選択

解答後:
  両ボタンとも消滅。選択肢はロック。
```

### 「わからん」ボタンの挙動

```
タップ → 確認なしで即実行
  - 正解の選択肢をハイライト表示（緑ボーダー）
  - 記録: { selected_answer: null, is_correct: false, skipped: true }
  - 正答率には影響しない
  - 解説 + 公式付箋は通常通り表示
```

### アクセシビリティ

| 要素 | 対応 |
|------|------|
| 選択肢カード | `role="radio"` / `role="checkbox"` + `aria-checked` + `tabIndex={0}` + `onKeyDown` |
| 選択肢グループ | `role="radiogroup"` / `role="group"` + `aria-label="選択肢"` |
| 正誤フィードバック | `aria-live="polite"` |
| 「わからん」 | `role="button"` + `aria-label="この問題をスキップする"` |
| 解答ボタン | `aria-disabled` + 理由を `aria-describedby` |

---

## 5. 解答後フィードバック

### ResultBanner（正誤表示）

| パターン | アイコン | 背景 | 左ボーダー |
|---------|---------|------|-----------|
| 正解 | ✅ | `rgba(16,185,129,0.1)` | `3px solid var(--ok)` |
| 不正解 | ❌ + 正解番号 | `rgba(239,68,68,0.1)` | `3px solid var(--ng)` |
| スキップ | 🤷 + 正解番号 | `var(--bg)` | `3px solid var(--text-3)` |

解答時間は常に表示（控えめ、`var(--text-3)`）。
フォーマット: 60秒未満 → "12.3秒"、60秒以上 → "1:23"

### ExplanationSection（AI解説）

- 背景: `var(--card)` + `1px solid var(--border)` + `border-radius: var(--r-card)`
- padding: `20px`、本文: `14px`、`line-height: 1.75`、`white-space: pre-wrap`

### OfficialNoteCard（公式付箋 — 核心機能）

**表示条件**: `OfficialNote.linkedQuestionIds` にこの問題IDが含まれる場合のみ。なければセクションごと非表示（PRD Q-5）。

```
┌──────────────────────────────┐
│  📌 この問題の公式付箋         │
│  ┌──────────────────────────┐│
│  │ 🖼 [手書きフロー図]       ││  ← タップで全画面表示（BottomSheet）
│  │   bg: #faf5ee（紙風）     ││     object-fit: contain
│  ├──────────────────────────┤│
│  │ 交感神経の受容体と作用機序 ││  ← title (15px, bold)
│  │ α1: 血管収縮、瞳孔散大   ││  ← textSummary (14px, var(--text-2))
│  │ 🔥 12問で使う知識         ││  ← importance badge
│  │ [☆ 保存] [🃏 暗記カード] ││  ← アクションボタン
│  └──────────────────────────┘│
└──────────────────────────────┘
```

**重要度バッジ**:

| 条件 | 表示 | 色 |
|------|------|-----|
| linkedQuestionIds ≥ 10 | `🔥 {N}問で使う知識` | `var(--ng)` |
| linkedQuestionIds ≥ 5 | `📊 {N}問で使う知識` | `var(--warn)` |
| < 5 | `📝 {N}問で使う知識` | `var(--text-3)` |

**アクションボタン**:

| ボタン | 初期 | タップ後 |
|--------|------|---------|
| ☆ 保存 | 白bg + accent border | ★ 保存済み（accent塗り + 白文字）→ BookmarkedNote 作成 |
| 🃏 暗記カード | 白bg + border | FlashCardPage に遷移（linkedCardIds フィルター） |

**Premium付箋**:
- 画像: `filter: blur(8px)` + 🔒マーク + 「付箋パックで解放」CTA

### MetaAccordion（詳細情報 — 折りたたみ）

デフォルト閉じ。タップで展開。
- 回次、区分、科目、分野、タグ（Chipコンポーネント）、正答率

---

## 6. データモデル

### 6.1 新規型定義

```typescript
// === 公式付箋（運営提供コンテンツ） ===
interface OfficialNote {
  id: string
  title: string                // 「交感神経 α1受容体の作用機序」
  imageUrl: string             // 手書きノート画像（PNG/WebP）
  textSummary: string          // AIテキスト要約
  subject: QuestionSubject     // 「薬理」
  topicId: string              // ALL_TOPICS.id で join（※ P2指摘: field → topicId）
  tags: string[]
  linkedQuestionIds: string[]  // この知識が必要な問題ID群
  linkedCardIds: string[]      // 紐づく暗記カードID群
  importance: number           // 紐づく問題数から自動算出
  tier: 'free' | 'premium'
}

// === ユーザーのブックマーク ===
// 既存 SavedNote (note.ts) と同じ snake_case 規約に統一（※ R2-P2指摘）
// SavedNote はユーザー作成付箋の保存用。BookmarkedNote は公式付箋のブックマーク用。
// 将来的に SavedNote を廃止し BookmarkedNote に統合する可能性あり。
interface BookmarkedNote {
  id: string
  user_id: string
  note_id: string              // OfficialNote.id（snake_case に統一）
  bookmarked_at: string        // ISO8601
  review_count: number         // 何回見たか
  last_reviewed_at?: string    // 最後に確認した日時
}
```

### 6.2 既存型の後方互換拡張（※ P1指摘対応）

**方針**: `AnswerHistory` を直接破壊変更しない。optional フィールドで拡張し、既存データ・repo・DB がそのまま動くようにする。

```typescript
// src/types/question.ts — 既存 AnswerHistory を拡張
interface AnswerHistory {
  id: string
  user_id: string
  question_id: string
  selected_answer: number | number[] | null  // ← null 追加（スキップ時）
  is_correct: boolean
  answered_at: string
  confidence_level?: ConfidenceLevel         // ← optional化（新UIでは送らない）
  time_spent_seconds?: number
  skipped?: boolean                          // ← 新規追加（optional）
}
```

**移行戦略**:
- 新UIからは `confidence_level` を送らない（undefined）
- 新UIからは `skipped: true` + `selected_answer: null` を送る
- 既存データは `confidence_level` あり + `skipped` なし → 正常に動作
- repo interface `Omit<AnswerHistory, 'id'>` はそのまま互換

**repo 層の変更（※ R2-P1指摘: Supabase互換の詳細化）**:
- `LocalAnswerHistoryRepo`: JSON.stringify/parse のみなので型変更だけで互換（null / undefined は自然にシリアライズ）
- `SupabaseAnswerHistoryRepo.save()`: `confidence_level` を `answer.confidence_level ?? null` に変更（DB nullable 前提）
- `SupabaseAnswerHistoryRepo.save()`: `skipped: answer.skipped ?? false` を insert に追加
- `SupabaseAnswerHistoryRepo.mapRow()`: `skipped` / null 対応を追加
- **DBスキーマ変更（実装時に同時実施）**:
  - `ALTER TABLE answer_history ALTER COLUMN confidence_level DROP NOT NULL;`
  - `ALTER TABLE answer_history ALTER COLUMN selected_answer DROP NOT NULL;`
  - `ALTER TABLE answer_history ADD COLUMN skipped boolean DEFAULT false;`
  - ※ 全て nullable / default 追加なので既存行に影響なし

**LinkedQuestionViewer の互換性（※ R2-P1指摘）**:
- 現行 LinkedQuestionViewer は `selected_answer: null` のレコードを `isAnswered: true, isCorrect: false`（不正解）として表示する
- 今回の単問リデザインスコープでは LinkedQuestionViewer は変更しない
- 連問の横展開リデザイン時に `useQuestionAnswerState` を導入し、`isSkipped` 状態を正しく表示する
- 移行期間中のデグレ影響: スキップした問題が「不正解」と表示される → 学習上は大きな問題なし（むしろ復習対象に含まれる方が安全）

### 6.3 データソース

```typescript
// src/data/official-notes.ts（初期はモック5-10枚）
export const OFFICIAL_NOTES: OfficialNote[] = [...]

// questionId → OfficialNote[] の逆引きマップ
// useMemo で OfficialNote.linkedQuestionIds から動的生成
```

### 6.4 既存データとの関係

- `QUESTION_TOPIC_MAP`: questionId → topicId（問題→中項目。OfficialNote.topicId と同じ体系）
- `ALL_TOPICS`: { id, major, middle, minor, subject }[]（topicId の表示名解決に使用）
- `EXAM_BLUEPRINT`: 科目→大項目→中項目の階層
- `EXEMPLAR_STATS`: 出題頻度統計

---

## 7. フック設計

### 7.1 新規フック

```typescript
// === 回答ロジックの凝集（※ P2指摘: useQuestionAnswerState 切り出し） ===
// QuestionPage で単問用に使用。
// LinkedQuestionViewer 横展開時は、各問題を LinkedQuestionItem 子コンポーネントに
// 分割し、子コンポーネント内でこのフックを呼ぶ設計とする。
// （※ R2-P2指摘: 複数問題の同時管理は子コンポーネント分割で解決）
// useAnswerHistory の非同期ロード完了を deps で監視し、既存回答を自動同期する。
useQuestionAnswerState(question: Question): {
  // 状態
  selectedAnswer: number | null
  selectedAnswers: number[]
  isAnswered: boolean
  isCorrect: boolean
  isSkipped: boolean
  existingResult: AnswerHistory | undefined

  // 操作
  selectAnswer: (key: number) => void
  selectMultiAnswers: (keys: number[]) => void
  submitAnswer: () => void
  skipQuestion: () => void

  // 判定
  canSubmit: boolean
  isMulti: boolean
  requiredCount: number
}

// === 公式付箋の取得 ===
useOfficialNotes(questionId: string): {
  notes: OfficialNote[]       // この問題に紐づく付箋（0〜N枚）
  isLoading: boolean
}

// === ブックマーク管理 ===
useBookmarks(): {
  bookmarks: BookmarkedNote[]
  isBookmarked: (noteId: string) => boolean
  toggleBookmark: (noteId: string) => void
}

// === スワイプナビゲーション（※ P2指摘: API拡張） ===
// linked_group のスキップロジックもフック内に吸収
useSwipeNavigation(sessionIds: string[], currentId: string): {
  // タッチハンドラー
  onTouchStart: TouchEventHandler
  onTouchMove: TouchEventHandler
  onTouchEnd: TouchEventHandler

  // ナビゲーション状態（※ P2指摘: prevId/nextId/goPrev/goNext 追加）
  prevId: string | null
  nextId: string | null
  canGoPrev: boolean
  canGoNext: boolean
  goPrev: () => void          // navigate() まで実行
  goNext: () => void          // navigate() まで実行
  currentIndex: number        // 0-based
  totalCount: number
}

// === 時間計測（※ P2指摘: ref を完全に隠蔽） ===
// Page Visibility API で離席時間を除外
useTimeTracking(questionId: string): {
  getElapsedSeconds: () => number
  // questionId 変更で内部自動 reset（外部に ref を露出しない）
}
```

### 7.2 既存フックの変更

| フック | 変更内容 |
|--------|---------|
| `useAnswerHistory` | `AnswerHistory` 型の拡張に追従（型変更のみ、ロジック変更なし） |
| `useLinkedQuestions` | 変更なし |
| `useFlashCards` | 変更なし |

### 7.3 QuestionPage の状態（※ P2指摘: 回答ロジックを切り出し後）

```typescript
// QuestionPage 本体に残る状態（UIのみ）
const [metaOpen, setMetaOpen] = useState(false)          // 詳細情報アコーディオン
const [imageViewOpen, setImageViewOpen] = useState(false) // 付箋画像の全画面表示
const [imageViewNoteId, setImageViewNoteId] = useState<string | null>(null)

// 回答ロジックは useQuestionAnswerState に移動
const answerState = useQuestionAnswerState(question)

// 時間計測は useTimeTracking に移動（ref 露出なし）
const { getElapsedSeconds } = useTimeTracking(questionId)

// ナビゲーションは useSwipeNavigation に移動
const swipe = useSwipeNavigation(sessionIds, questionId)
```

---

## 8. コンポーネント設計

### 8.1 コンポーネントツリー

```
QuestionPage（ページコンテナ）
│   - .sc-page レイアウト
│   - useQuestionAnswerState, useTimeTracking, useSwipeNavigation を束ねる
│   - スワイプハンドラーをルート要素に適用
│
├── ProgressHeader
│     - 科目名 + 「問 M/N」+ スワイプヒント矢印
│
├── QuestionBody
│     - props: bodyText, imageUrl, displayMode
│     - (※ P2指摘: bodyText を props で受ける。連問では extractQuestionBody() の結果を渡す)
│
├── ChoiceList
│     - props: question, answerState
│     └── ChoiceCard（各選択肢）
│
├── ActionArea
│     - props: canSubmit, onSubmit, onSkip, isAnswered
│
├── ResultBanner
│     - props: isCorrect, isSkipped, correctAnswer, elapsedSeconds
│
├── ExplanationSection
│     - props: explanation (string)
│
├── OfficialNoteCard
│     - props: note, isBookmarked, onToggleBookmark, onFlashCard
│     └── NoteImageViewer（BottomSheet でラップ）
│
├── MetaAccordion
│     - props: question, topicName
│
└── FloatingNav（既存、変更なし）
```

### 8.2 ファイル構成

```
src/
├── pages/
│   ├── QuestionPage.tsx              — ページコンテナ（フック束ね + レイアウト）
│   └── QuestionPage.module.css
│
├── components/
│   ├── question/                     — 問題ドメイン共有コンポーネント
│   │   │                               LinkedQuestionViewer からも import 可能
│   │   │                               (※ P2指摘: page-specific ではなく shared domain)
│   │   ├── ProgressHeader.tsx + .module.css
│   │   ├── QuestionBody.tsx + .module.css
│   │   ├── ChoiceList.tsx
│   │   ├── ChoiceCard.tsx
│   │   ├── Choice.module.css         — ChoiceList + ChoiceCard 共有
│   │   ├── ActionArea.tsx + .module.css
│   │   ├── ResultBanner.tsx + .module.css
│   │   ├── ExplanationSection.tsx + .module.css
│   │   ├── OfficialNoteCard.tsx + .module.css
│   │   ├── NoteImageViewer.tsx       — BottomSheet でラップ
│   │   ├── MetaAccordion.tsx + .module.css
│   │   └── index.ts                  — barrel export
│   │
│   ├── ui/                           — 既存共通UIコンポーネント（変更なし）
│   └── LinkedQuestionViewer.tsx      — 既存（後で question/ 部品で書き直し）
│
├── hooks/
│   ├── useQuestionAnswerState.ts     — ★ 新規（回答ロジック凝集）
│   ├── useOfficialNotes.ts           — ★ 新規
│   ├── useBookmarks.ts               — ★ 新規
│   ├── useSwipeNavigation.ts         — ★ 新規
│   ├── useTimeTracking.ts            — ★ 新規
│   ├── useAnswerHistory.ts           — 既存（型拡張に追従）
│   ├── useLinkedQuestions.ts         — 既存（変更なし）
│   └── useFlashCards.ts              — 既存（変更なし）
│
├── data/
│   ├── official-notes.ts             — ★ 新規（モックデータ5-10枚）
│   └── ...既存
│
├── types/
│   ├── note.ts                       — OfficialNote, BookmarkedNote 追加
│   └── question.ts                   — AnswerHistory 後方互換拡張
│
└── styles/
    ├── tokens.css                    — 既存（変更なし）
    └── base.css                      — 既存（変更なし）
```

### 8.3 コンポーネント分割の根拠

1. 現状 730行 → 各80-150行に分割
2. `components/question/` は**ドメイン共有**。LinkedQuestionViewer の横展開で再利用
3. `useQuestionAnswerState` で回答ロジックを凝集 → QuestionPage と LinkedQuestionViewer の重複排除
4. `components/ui/` はデザインシステム汎用、`components/question/` はドメイン固有

---

## 9. Ant Design 完全排除マッピング

### コンポーネント

| Ant Design | 置き換え先 |
|------------|-----------|
| `Card` | CSS Module カードスタイル |
| `Typography` (Text, Paragraph) | ネイティブ `<p>`, `<span>` + CSS Module |
| `Radio` / `Radio.Group` | ChoiceCard + ChoiceList |
| `Checkbox` / `Checkbox.Group` | ChoiceCard + ChoiceList |
| `Button` | ネイティブ `<button>` + CSS Module |
| `Tag` | 既存 Chip コンポーネント |
| `Space` | CSS `gap` / `flex` |
| `Divider` | CSS `border-top` or セクション余白 |
| `Modal` | 削除（自作機能廃止。画像拡大は BottomSheet） |
| `Form` / `Input` / `Select` | 削除（自作機能廃止） |
| `Result` | カスタム 404 コンポーネント |
| `Alert` | ResultBanner（カスタム） |
| `Image` | ネイティブ `<img>` + NoteImageViewer |

### アイコン（※ P3指摘: icons の置き換え方針を明記）

| @ant-design/icons | 置き換え |
|-------------------|---------|
| `CheckCircleFilled` | ✅ emoji（既存 QuestionCard パターン） |
| `CloseCircleFilled` | ❌ emoji |
| `ArrowLeftOutlined` | `←` テキスト or CSS矢印 |
| `ArrowRightOutlined` | `→` テキスト or CSS矢印 |
| `UnorderedListOutlined` | 削除（一覧ボタン自体がスワイプで代替） |
| `FormOutlined` | 削除（ノート自作機能廃止） |
| `LinkOutlined` | 🔗 emoji（LinkedQuestionViewer 用、横展開時） |

---

## 10. REDESIGNED_EXACT の変更（※ P3指摘: matchPath 採用）

```typescript
// src/components/layout/AppLayout.tsx
import { matchPath } from 'react-router-dom'

const REDESIGNED_EXACT = ['/', '/practice']

const isRedesigned =
  REDESIGNED_EXACT.includes(location.pathname) ||
  matchPath('/practice/:questionId', location.pathname) !== null
```

- `startsWith` より安全。`/practice/settings` 等の将来ルートを巻き込まない
- react-router-dom の `matchPath` を利用するので追加依存なし

---

## 11. モックデータ構造

```typescript
// src/data/official-notes.ts
import type { OfficialNote } from '../types/note'

export const OFFICIAL_NOTES: OfficialNote[] = [
  {
    id: 'note-001',
    title: '交感神経の受容体と作用機序',
    imageUrl: '/notes/sympathetic-receptors.webp',
    textSummary: 'α1: 血管収縮、瞳孔散大、括約筋収縮\nα2: NA遊離抑制\nβ1: 心拍数↑、心収縮力↑\nβ2: 気管支拡張、血管拡張',
    subject: '薬理',
    topicId: 'yakuri-kokanshinkeikei',  // ALL_TOPICS.id
    tags: ['α受容体', 'β受容体', '血管収縮', 'ノルアドレナリン'],
    // ※ R2-P2指摘: Question.id は 3桁ゼロ埋め形式 (r111-001)
    linkedQuestionIds: ['r101-001', 'r102-003', 'r103-005', 'r104-002', 'r105-001',
                        'r106-003', 'r107-002', 'r108-004', 'r109-001', 'r110-003',
                        'r111-002', 'r101-045'],
    linkedCardIds: ['card-001', 'card-002', 'card-003'],
    importance: 12,
    tier: 'free',
  },
  // ... モック 5-10枚（サンプルデータ差し替え用）
]
```

---

## 12. GPT-5.4 レビュー指摘の対応表

| # | 優先度 | 指摘 | 対応 | セクション |
|---|--------|------|------|-----------|
| 1 | P1 | AnswerRecord が既存 AnswerHistory と非互換 | optional フィールドで後方互換拡張 | §6.2 |
| 2 | P2 | OfficialNote.field が表記揺れリスク | `topicId` に変更、ALL_TOPICS.id で join | §6.1 |
| 3 | P2 | BookmarkedNote に id, user_id 不足 | 追加 + last_reviewed_at | §6.1 |
| 4 | P2 | 再利用部品が question/ に閉じている | ドメイン共有として明記、barrel export | §8.2 |
| 5 | P2 | useSwipeNavigation の API 不足 | prevId/nextId/goPrev/goNext 追加 | §7.1 |
| 6 | P2 | useTimeTracking と page state の二重管理 | ref を完全隠蔽、questionId で自動reset | §7.1 |
| 7 | P2 | 回答ロジックの凝集が必要 | useQuestionAnswerState 切り出し | §7.1 |
| 8 | P2 | QuestionBody が連問本文抽出に未対応 | bodyText を props で受ける設計 | §8.1 |
| 9 | P2 | LinkedQuestionViewer の非同期履歴ロード | useQuestionAnswerState で吸収 | §7.1 |
| 10 | P3 | startsWith より matchPath が堅い | matchPath 採用 | §10 |
| 11 | P3 | @ant-design/icons の置き換え方針が未記載 | emoji / CSS矢印 で代替、マッピング表追加 | §9 |

### Round 2 レビュー指摘

| # | 優先度 | 指摘 | 対応 | セクション |
|---|--------|------|------|-----------|
| R2-1 | P1 | Supabase repo が null/optional に未対応 | repo層の変更手順 + DBスキーマ変更を明記 | §6.2 |
| R2-2 | P1 | LinkedQuestionViewer がスキップ表示不可 | 移行期間のデグレ影響を明記、横展開時に解消 | §6.2 |
| R2-3 | P2 | useQuestionAnswerState が複数問題未対応 | LinkedQuestionItem 子コンポーネント分割方針を明記 | §7.1 |
| R2-4 | P2 | BookmarkedNote が snake_case 規約と不一致 | snake_case に統一、SavedNote との関係を明記 | §6.1 |
| R2-5 | P2 | モックID形式が実データと不一致 | 3桁ゼロ埋め (r111-001) に修正 | §11 |
