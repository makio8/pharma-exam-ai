# LinkedQuestionViewer Soft Companion 横展開 設計書

**Author**: makio8 + Claude
**Date**: 2026-03-24
**Status**: Draft v1.0
**Based on**: QuestionPage リデザイン設計書, ブレスト決定事項

---

## 1. 概要

LinkedQuestionViewer（連問セット表示、409行、Ant Design 9コンポーネント+3アイコン）を、QuestionPage リデザインで作成した `components/question/` の部品を再利用して Soft Companion にリデザインする。

**スコープ**: Ant Design → Soft Companion の純粋な部品置き換え。機能追加なし。

---

## 2. 現状の構造

```
LinkedQuestionViewer（409行、Ant Designベタ書き）
├── シナリオカード（Card + Tag + Space）
│     └── linked_scenario テキスト + 画像
├── 各問題 × N（ループ内にロジック密結合）
│     ├── メタ情報（Tag群）
│     ├── 問題文（Typography）
│     ├── 選択肢（Radio/Checkbox/numberボタン + Card + inline style）
│     ├── 回答ボタン（Button）
│     └── 正誤表示（Alert + Tag）
└── 状態管理: Record<questionId, QuestionState> を1コンポーネント内で管理
```

**問題点**:
- 1コンポーネント409行に全ロジックが密結合
- 選択肢のスタイルがインラインでハードコード（`#1890ff`, `#f6ffed`等）
- `confidence_level: 'medium'` を固定値で送信（設計上は廃止済み）
- `time_spent_seconds: 0` 固定（時間計測なし）
- 公式付箋の表示なし
- 「わからん」スキップ機能なし

---

## 3. 横展開後の構造

```
LinkedQuestionViewer（~60行のコンテナ）
├── ScenarioCard（新規）
│     └── QuestionBody を再利用（bodyText=scenario）
│
├── LinkedQuestionItem × N（新規、各問題の独立コンポーネント）
│     └── 内部で useQuestionAnswerState + useTimeTracking を呼ぶ
│     ├── 問題ヘッダー（問番号 + 複数選択ヒント）
│     ├── QuestionBody（個別問題文）
│     ├── ChoiceList + ChoiceCard（再利用）
│     ├── ActionArea（再利用 — わからん + 解答する）
│     └── 解答後:
│           ├── ResultBanner（再利用）
│           ├── ExplanationSection（再利用）
│           └── OfficialNoteCard（再利用 — 新機能追加！）
│
└── FloatingNav（既存、QuestionPageから表示）
```

---

## 4. コンポーネント設計

### 4.1 ScenarioCard

```tsx
interface ScenarioCardProps {
  scenario: string
  imageUrl?: string
}
```
- シナリオ文を QuestionBody（displayMode='text'）で再利用
- 画像があれば displayMode='both'
- カード背景: `var(--card)` + `1px solid var(--accent-border)` で単問と区別
- ラベル: 「📋 共通シナリオ」

### 4.2 LinkedQuestionItem

```tsx
interface LinkedQuestionItemProps {
  question: Question
  questionIndex: number  // 連問内の何番目（1-based表示用）
  totalInGroup: number   // 連問内の総数
}
```

内部で呼ぶフック:
- `useQuestionAnswerState(question)` — 回答ロジック
- `useTimeTracking(question.id)` — 時間計測
- `useOfficialNotes(question.id)` — 公式付箋
- `useBookmarks()` — ブックマーク

レンダリング:
```
問 195 (1/3)                    ← ヘッダー
──────────────────────────────
[QuestionBody]                  ← 問題文
[ChoiceList]                    ← 選択肢
[ActionArea]                    ← わからん + 解答する
── 解答後 ──
[ResultBanner]                  ← 正誤
[ExplanationSection]            ← 解説
[OfficialNoteCard × N]          ← 公式付箋（あれば）
```

### 4.3 LinkedQuestionViewer（コンテナ書き直し）

```tsx
interface Props {
  group: LinkedGroup  // 既存の型（useLinkedQuestions から）
}
```

レンダリング:
```tsx
<div className={styles.container}>
  <ScenarioCard scenario={group.scenario} imageUrl={group.scenarioImageUrl} />
  {group.questions.map((q, i) => (
    <LinkedQuestionItem
      key={q.id}
      question={q}
      questionIndex={i + 1}
      totalInGroup={group.questions.length}
    />
  ))}
</div>
```

---

## 5. ファイル構成

### 新規作成

| ファイル | 責務 |
|---------|------|
| `src/components/question/ScenarioCard.tsx` | シナリオ表示 |
| `src/components/question/ScenarioCard.module.css` | |
| `src/components/question/LinkedQuestionItem.tsx` | 個別問題（フック使用） |
| `src/components/question/LinkedQuestionItem.module.css` | |

### 変更

| ファイル | 変更内容 |
|---------|---------|
| `src/components/LinkedQuestionViewer.tsx` | フルリライト（409行 → ~60行） |
| `src/components/question/index.ts` | ScenarioCard, LinkedQuestionItem を export 追加 |

### 削除するAnt Design依存

| 現在のimport | 置き換え |
|-------------|---------|
| `Card, Tag, Typography, Space, Image, Radio, Button, Alert, Checkbox` | `components/question/` 部品 |
| `LinkOutlined, CheckCircleFilled, CloseCircleFilled` | emoji (🔗, ✅, ❌) |
| `useAnswerHistory` 直接呼び出し | `useQuestionAnswerState` 経由 |
| `confidence_level: 'medium'` 固定 | 廃止（フックが処理） |
| `time_spent_seconds: 0` 固定 | `useTimeTracking` で自動計測 |

---

## 6. 新機能（部品置き換えによる自動追加）

QuestionPage の部品を再利用するため、以下が**自動的に**連問にも追加される：

| 機能 | 現状 | 横展開後 |
|------|------|---------|
| 公式付箋の自動表示 | なし | ✅ OfficialNoteCard で表示 |
| ブックマーク | なし | ✅ useBookmarks で保存 |
| 「わからん」スキップ | なし | ✅ ActionArea 経由 |
| 解答時間の自動計測 | 0固定 | ✅ useTimeTracking で計測 |
| スキップ状態の正しい表示 | 不正解として表示 | ✅ ResultBanner で「スキップ」表示 |
| Soft Companion デザイン | Ant Design | ✅ トークンベース |

---

## 7. 注意事項

- `extractQuestionBody()` 関数は既存 LinkedQuestionViewer 内にある。LinkedQuestionItem に移動するか、utils に切り出す
- `LinkedGroup` 型は `useLinkedQuestions` フックが返す既存の型。変更不要
- QuestionPage 側の `linkedGroup ? <LinkedQuestionViewer> : <単問>` 分岐はそのまま維持
