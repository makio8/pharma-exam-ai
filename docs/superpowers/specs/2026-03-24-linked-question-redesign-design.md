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
  // ※ LinkedGroup に imageUrl はない（GPT-5.4 P1指摘）
}
```
- シナリオ文を QuestionBody（displayMode='text'）で再利用
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

**回答済み状態の復元（※ GPT-5.4 P1指摘）**:
- 現行LinkedQuestionViewerは `getQuestionResult()` で初期状態に回答済みを復元し、選択肢をロックする
- `useQuestionAnswerState` は現在 `existingResult` を参照情報としてのみ保持（isAnsweredを復元しない ← QuestionPageの「再演習可能」仕様のため）
- **連問では再演習不要**（連問は1回解いたら次に進む）。そのため LinkedQuestionItem 側で `existingResult` があれば `restoreFromExisting()` を呼んでロック状態にする
- 実装方法: `useQuestionAnswerState` に `options: { restoreExisting?: boolean }` を追加するか、item側で `useEffect` で `answerState.restoreFromExisting(existingResult)` を明示的に呼ぶ

**useAnswerHistory の重複ロード回避（※ GPT-5.4 P2指摘）**:
- 現行 `useAnswerHistory` はマウントごとに `getAll()` を実行する
- LinkedQuestionItem × N で N回ロードされる問題
- **対策**: LinkedQuestionViewer 親で `useAnswerHistory()` を1回呼び、`history` と `saveAnswer` を props で子に渡す
- LinkedQuestionItem の props に `answerHistory: { history, saveAnswer, getQuestionResult }` を追加
- `useQuestionAnswerState` に外部から history を注入できるオプションを追加: `options: { externalHistory?: ... }`

**OfficialNoteCard の配線（※ GPT-5.4 P3指摘）**:
- QuestionPage と同様に、LinkedQuestionItem 内で以下を配線する:
  ```tsx
  {notes.map(note => (
    <OfficialNoteCard
      key={note.id}
      note={note}
      isBookmarked={isBookmarked(note.id)}
      onToggleBookmark={() => toggleBookmark(note.id)}
      onFlashCard={() => navigate('/cards/review', { state: { filterCardIds: note.linkedCardIds } })}
      onImageTap={() => { /* NoteImageViewer state管理 */ }}
    />
  ))}
  ```

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
  {/* ※ GPT-5.4 P1指摘: LinkedGroup に scenarioImageUrl はない。scenario テキストのみ */}
  <ScenarioCard scenario={group.scenario} />
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
- **数値問題のフォールバック（※ GPT-5.4 P2指摘）**: 現行 LinkedQuestionViewer は `choices.length === 0 && correct_answer === 0` で「データ準備中」を表示する。ChoiceList は 1-9 固定グリッドなのでこの分岐を吸収できない。対策: ChoiceList に `correct_answer === 0` のガード追加（「この問題はデータ準備中です」プレースホルダー表示）か、LinkedQuestionItem 側で分岐
- `LinkedGroup` 型は `useLinkedQuestions` フックが返す既存の型（groupId, scenario, questions）。変更不要。scenarioImageUrl は存在しないので ScenarioCard には scenario テキストのみ渡す
- QuestionPage 側の `linkedGroup ? <LinkedQuestionViewer> : <単問>` 分岐はそのまま維持
