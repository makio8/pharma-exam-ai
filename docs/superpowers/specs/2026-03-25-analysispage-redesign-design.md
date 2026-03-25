# AnalysisPage Soft Companion リデザイン 設計書

**Author**: makio8 + Claude
**Date**: 2026-03-25
**Status**: Draft v1.1 (レビュー指摘P0×3 + P1×5 修正済み)
**Based on**: PRD §7.5, ブレスト決定事項

---

## 1. 概要

AnalysisPage（371行、Ant Design 13コンポーネント+7アイコン）を Soft Companion にリデザインする。

**設計方針: 深掘り特化**
- ホーム画面（HomePage）と役割を明確に分離
- ホームにない**苦手問題分析・回答履歴**に集中
- 重複セクション（サマリー・科目別正答率・付箋統計）は削除

**スコープ**: Ant Design → Soft Companion の部品置き換え + ホームとの重複排除。

---

## 2. ホームとの役割分担

| 画面 | 役割 | 主要コンテンツ |
|------|------|--------------|
| **HomePage** | 「今日何やるか決める」 | 今日のメニュー、がんばり記録、科目別進み具合（展開+演習導線）、クイックアクション |
| **AnalysisPage** | 「弱点を深掘りする」 | 苦手問題リスト（2モード）、回答履歴タイムライン |

### 削除するセクション（ホームと重複）

| セクション | 現行AnalysisPage | 代替 |
|-----------|-----------------|------|
| 学習サマリー（総回答数・消化率） | `Statistic` ×3 | ホームの `StatCircles` |
| 科目別正答率テーブル+バー | `Table` + `Progress` | ホームの `SubjectMastery`（展開UI付き） |
| 付箋統計 | `Tag` ×6タイプ | NotesPage リデザイン時に移動 |

### PRD §7.5 との差分（意図的なスコープ変更）

PRD §7.5 では「分野別正答率（科目タップで展開）」「この分野を演習ボタン」が P0 として定義されている。
しかし、ホームの `SubjectMastery` コンポーネントが既にこの機能を実装済み:
- 科目→大項目の展開UI
- 正答率70%未満の分野に「演習→」ボタン

**判断**: この機能はホームに委譲し、分析画面では重複配置しない。
PRD §7.5 のP0要件はホーム経由で充足されている。将来的にホームの `SubjectMastery` を中項目まで展開可能にする改善は別タスクで対応する。

---

## 3. 横展開後の構造

```
AnalysisPage（~120行）
├── ヘッダー「📊 分析」
│
├── セクション1: 苦手問題
│   ├── Chip 切替: 🔥 自分の苦手 | ⚠️ 必須の取りこぼし
│   ├── WeakQuestionCard × N（最大20件）
│   │   └── 科目タグ + 問番号 + 不正解回数/必須タグ + [復習→]ボタン
│   └── 空状態: 💪 + 「苦手問題はまだありません」 + 演習CTA
│
├── セクション2: 回答履歴
│   ├── HistoryItem × N（最大30件）
│   │   └── 正誤アイコン + 日時 + 科目-問番号 + 解答時間
│   └── 空状態: 📝 + 「回答履歴がありません」
│
├── DecoWave（背景装飾、ホームと統一）
└── FloatingNav
```

---

## 4. コンポーネント設計

### 4.1 AnalysisPage（ページ本体）

```tsx
// データ取得
const {
  weakQuestions,     // Question & { incorrectCount }[] — 最大20件
  recentHistory,     // AnswerHistory[] — 最大30件
  allHistory,        // AnswerHistory[] — 全件（必須取りこぼし計算用）
  isEmpty,
} = useAnalytics()

const [mode, setMode] = useState<'weak' | 'missed'>('weak')

// mode に応じて苦手問題をフィルタ・ソート
const displayQuestions = useMemo(() => {
  if (mode === 'weak') {
    return weakQuestions
  }
  return computeMissedEssentials(allHistory, ALL_QUESTIONS)
}, [mode, weakQuestions, allHistory])
```

- 空状態（isEmpty）: DecoWave + 大きな絵文字（📊）+ 演習導線付きウェルカムメッセージ（ホームの空状態パターンに準拠）
- `REDESIGNED_EXACT` に `'/analysis'` を追加（AppLayout.tsx）
- Chip によるモード切替: 両モードとも同じ `variant` （デフォルト紫系）を使用。active/inactive は背景色の有無で区別

### 4.2 WeakQuestionCard

```tsx
interface WeakQuestionCardProps {
  question: Question
  incorrectCount?: number  // 「自分の苦手」モードで使用
  isMissedEssential?: boolean  // 「必須の取りこぼし」モードで使用
  onReview: () => void
}
```

レンダリング:
```
┌─────────────────────────────────────────┐
│ [薬理] 第108回 問45            ❌ 3回   │
│                              [復習 →]   │
└─────────────────────────────────────────┘
```

- 科目: Chip コンポーネント（既存 `src/components/ui/Chip.tsx`）
- 復習ボタン: `navigate(`/practice/${question.id}`)` でQuestionPageに直行
- 「必須の取りこぼし」モードでは不正解回数の代わりに `必須` チップを表示（`incorrectCount` は無視）
- アクセシビリティ: カード全体に `tabIndex={0}` + `onKeyDown`（Enter/Spaceで復習ページへ遷移）

### 4.3 HistoryItem

```tsx
interface HistoryItemProps {
  isCorrect: boolean
  isSkipped: boolean  // AnswerHistory.skipped === true の場合
  answeredAt: string  // ISO8601
  subject: string
  year: number
  questionNumber: number
  questionId: string
  timeSpentSeconds?: number
  onTap: () => void
}
```

レンダリング:
```
┌─────────────────────────────────────────┐
│ ✅  3/25 14:30  薬理 - 第108回 問45  23秒│
└─────────────────────────────────────────┘
```

- アイコン優先度: `isSkipped` → 🤷 / `isCorrect` → ✅ / else → ❌
- `time_spent_seconds` が 0 または undefined の場合は時間非表示（旧データ互換）
- タップで QuestionPage に遷移（`navigate(`/practice/${questionId}`)`)
- 問題が `ALL_QUESTIONS` から見つからない場合: `(ID: ${questionId})` とフォールバック表示
- アクセシビリティ: `tabIndex={0}` + `onKeyDown`

### 4.4 computeMissedEssentials（ユーティリティ関数）

```tsx
/**
 * 「必須問題なのに最新回答が不正解」の問題を抽出
 *
 * ロジック:
 * 1. history を answered_at 降順でソート
 * 2. Map<question_id, AnswerHistory> に各問題の最新回答だけを格納
 *    （最初に見つかったもの = 最新）
 * 3. allQuestions から section === '必須' をフィルタ
 * 4. Map から最新回答を引き、is_correct === false のものを収集
 * 5. 問番号順でソート、最大20件
 */
export function computeMissedEssentials(
  history: AnswerHistory[],
  allQuestions: Question[]
): (Question & { incorrectCount: number })[]
```

- `incorrectCount` は互換性のため型に含めるが、値は常に 1（「最新回答が不正解」= 直近1回の失敗）
- 将来 `correct_rate` が使えるようになったら、条件を `section === '必須'` から `correct_rate >= 0.6` に変更可能

---

## 5. useAnalytics() フック変更

既存の `useAnalytics()` に対する変更:

| 変更箇所 | 現行 | 変更後 |
|---------|------|--------|
| `weakQuestions` の slice | `.slice(0, 10)` (L193) | `.slice(0, 20)` |
| `recentHistory` の slice | `.slice(0, 20)` (L206) | `.slice(0, 30)` |
| 返り値に `allHistory` 追加 | なし | `allHistory` を返す（必須取りこぼし計算用） |

**`allHistory` の追加理由**: `computeMissedEssentials` は全回答履歴から各問題の最新回答を判定する必要がある。`recentHistory`（30件）では直近にない問題の不正解を検出できない。

---

## 6. ファイル構成

### 新規作成

| ファイル | 責務 |
|---------|------|
| `src/components/analysis/WeakQuestionCard.tsx` | 苦手問題カード |
| `src/components/analysis/WeakQuestionCard.module.css` | |
| `src/components/analysis/HistoryItem.tsx` | 回答履歴行 |
| `src/components/analysis/HistoryItem.module.css` | |
| `src/utils/missed-essentials.ts` | 必須取りこぼし計算 |
| `src/utils/__tests__/missed-essentials.test.ts` | テスト |
| `src/pages/AnalysisPage.module.css` | ページスタイル |

### 変更

| ファイル | 変更内容 |
|---------|---------|
| `src/pages/AnalysisPage.tsx` | フルリライト（371行 → ~120行） |
| `src/hooks/useAnalytics.ts` | weakQuestions 20件化、recentHistory 30件化、allHistory 追加 |
| `src/components/layout/AppLayout.tsx` | `REDESIGNED_EXACT` に `'/analysis'` 追加 |

### 削除する Ant Design 依存

| 現在のimport | 置き換え |
|-------------|---------|
| `Card, Typography, Row, Col, Statistic, Progress, Button, Tag, Space, Table, Empty, Divider, List` | CSS Modules + Soft Companion コンポーネント |
| `BarChartOutlined, WarningOutlined, BookOutlined, HistoryOutlined, CheckCircleFilled, CloseCircleFilled, RocketOutlined` | emoji (📊, 🔥, ⚠️, 🕐, ✅, ❌, 🤷) |
| `ColumnsType` 型 | 不要（Table廃止） |

---

## 7. 既存リソースの再利用

| リソース | 用途 |
|---------|------|
| `useAnalytics()` | `weakQuestions`, `recentHistory`, `allHistory`, `isEmpty` |
| `ALL_QUESTIONS` | 問題情報の逆引き + 必須問題フィルタ |
| `Chip` (`src/components/ui/Chip.tsx`) | 科目タグ、モード切替 |
| `FloatingNav` | 画面下ナビゲーション |
| `DecoWave` | 背景装飾（ホームと統一） |
| `tokens.css` | デザイントークン |
| `base.css` | `.sc-page`, `.section-title` |

---

## 8. データ設計の将来拡張

### Phase 1（今回）: 自分のデータのみ

- 「自分の苦手」: `useAnalytics().weakQuestions`（2回以上不正解）
- 「必須の取りこぼし」: `section === '必須'` + 最新回答不正解
- 解答時間: `AnswerHistory.time_spent_seconds`（自分の推移のみ）

### Phase 2 以降: バックエンド統計

バックエンド構築時に以下を追加予定:
- 全ユーザーの問題別正答率（`Question.correct_rate` に動的注入）
- 全ユーザーの平均解答時間（問題別）
- 相対的な自分の位置（偏差値的な指標）

**型の拡張ポイント**:
- `Question.correct_rate?: number` — 既に optional で定義済み。バックエンドから取得時に注入
- `AnswerHistory.time_spent_seconds?: number` — 既に存在。集計用APIを追加するだけ
- 「取りこぼし」モードの条件を `section === '必須'` から `correct_rate >= 0.6 && 自分は不正解` に切り替え可能

---

## 9. 注意事項

- `useAnalytics()` の `weakQuestions` は `Question & { incorrectCount: number }` 型。そのまま `WeakQuestionCard` に渡せる
- `recentHistory` は `AnswerHistory[]`。問題情報は `ALL_QUESTIONS` から `question_id` で逆引きが必要（現行と同じパターン）
- `useAnalytics()` のフック変更（slice数変更 + allHistory追加）は他のページ（HomePage）に影響しないことを確認する（HomePageは `weakQuestions` を使っていない、`recentHistory` も使っていない）
- Chip によるモード切替は active/inactive を背景色の有無で区別する。両モードとも同じ紫系 variant。新規 variant 追加は不要
- AppLayout の `REDESIGNED_EXACT` 配列に `'/analysis'` を追加するのを忘れないこと
- HistoryItem で `AnswerHistory.skipped === true` の場合は `isSkipped=true` とマッピングし、アイコンは 🤷 を優先表示（`isCorrect` より優先）
- HistoryItem で `ALL_QUESTIONS` から問題が見つからない場合は `(ID: ${questionId})` をフォールバック表示する
