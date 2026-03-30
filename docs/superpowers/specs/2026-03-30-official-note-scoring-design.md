# 公式付箋レコメンドロジック改善 設計仕様

- バージョン: v1.1
- 作成日: 2026-03-30
- レビュー: エージェント3チーム×2ラウンド（PdM / アーキテクト / QA）
- ステータス: 承認済み

---

## 1. 背景・課題

### 現状
`useOfficialNotes(questionId)` は以下のロジックで動作している：

```
questionId → topicId（QUESTION_TOPIC_MAPで変換）
          → 同じtopicIdの付箋を全件返す（ソートなし・JSON登録順）
```

### 問題例
「野菜に含まれないビタミンはどれか（正解: B12）」という問題を解くと、
topicId `hygiene-nutrition` に属する**43枚**の付箋がJSON登録順で表示される。
ビタミンB12の付箋（fusen-0373）は登録順で6番目のため、最も関連性の高い付箋が先頭に来ない。

### 目標
問題に最も関連性の高い付箋を上位5件に絞り込んで表示する。

---

## 2. 設計方針

### フック分離
既存の `useOfficialNotes` は**変更しない**。スコアリング用の新規フックを追加する。

```ts
// 既存（変更なし）
useOfficialNotes(questionId: string): { notes: OfficialNote[], isLoading: boolean }

// 新規追加
useScoredOfficialNotes(question: Question, limit?: number): { notes: OfficialNote[], isLoading: boolean }
// limit デフォルト: 5
```

### 純粋関数の分離（FusenLibraryCoreパターン）
スコアリングロジックは `OfficialNoteScoringCore` クラスに純粋関数として切り出す。
フックはこのクラスをラップするだけ（ロジックなし）。

```
src/utils/official-note-scoring-core.ts   ← スコアリング純粋クラス
src/hooks/useScoredOfficialNotes.ts       ← フック（ラップのみ）
```

---

## 3. データ層変更（v1.1追加）

### 背景
`OfficialNote.exemplarIds` は現状フラット配列（`string[]`）で primary/secondary の区別がない。
`note-exemplar-mappings.json` には `isPrimary: boolean` が存在するが、`official-notes.json` 生成時に情報が脱落していた。

### OfficialNote 型変更

```ts
// 変更前
exemplarIds?: string[]

// 変更後
primaryExemplarIds?: string[]    // 主要な紐づき（isPrimary=true）
secondaryExemplarIds?: string[]  // 補助的な紐づき（isPrimary=false）
/** @deprecated primaryExemplarIds / secondaryExemplarIds に移行済み */
exemplarIds?: string[]
```

### generate-official-notes.ts 修正
`note-exemplar-mappings.json` の `isPrimary` を参照して primary/secondary を分けて出力する。

```ts
primaryExemplarIds: matches.filter(m => m.isPrimary).map(m => m.exemplarId),
secondaryExemplarIds: matches.filter(m => !m.isPrimary).map(m => m.exemplarId),
```

---

## 4. スコアリングロジック

### スコア計算式

```
score(note, question) =
  + SCORING_WEIGHTS.primaryExemplar    // note.primaryExemplarIds ∩ question の primary exemplarIds
  + SCORING_WEIGHTS.secondaryExemplar  // note.secondaryExemplarIds ∩ question の全 exemplarIds
  + (note.tags の中で question_text に含まれる語の数) × SCORING_WEIGHTS.textMatch
  + Math.min(note.importance, 10) × SCORING_WEIGHTS.importance
```

> **v1.1変更点**: タグスコア `question.tags ∩ note.tags` を削除（全問 `tags:[]` のため機能しない）。
> 代わりに `question_text` と `note.tags` の部分一致を採用。

### 重み定数

```ts
const SCORING_WEIGHTS = {
  primaryExemplar: 2,
  secondaryExemplar: 1,
  textMatch: 0.5,      // question_text に note.tags の語が含まれる（1件あたり）
  importance: 0.01,    // タイブレーク用（importance最大4 × 0.01 = 0.04）
} as const
```

### exemplarId一致の判定

`QUESTION_EXEMPLAR_MAP`（フラット配列）をモジュールスコープで**Mapに変換**してO(1)参照する。

```ts
// モジュールスコープで事前構築（再マウントでも再計算しない）
type ExemplarEntry = { primary: string[], secondary: string[] }
const Q_EXEMPLAR_INDEX = new Map<string, ExemplarEntry>()
for (const { questionId, exemplarId, isPrimary } of QUESTION_EXEMPLAR_MAP) {
  const entry = Q_EXEMPLAR_INDEX.get(questionId) ?? { primary: [], secondary: [] }
  if (isPrimary) entry.primary.push(exemplarId)
  else entry.secondary.push(exemplarId)
  Q_EXEMPLAR_INDEX.set(questionId, entry)
}
```

### テキストマッチの判定

```ts
// note.tagsの各語がquestion_textに含まれるか
const textScore = note.tags.filter(tag => question.question_text.includes(tag)).length
```

> `question.tags` は全問空配列のため使用しない。`question_text` のテキスト検索で代替。

---

## 5. フィルタリング・ソート

### 処理フロー

1. topicIdが一致する付箋を全件取得
2. 各付箋のスコアを計算
3. **スコア > 0 の付箋のみ**を対象にする（スコア0は表示しない）
4. スコア降順でソート
5. 上位 `limit` 件（デフォルト5）を返す

### スコア全0のフォールバック

スコア > 0 の付箋が1件もない場合（exemplarマッピング漏れ等）は、
topicIdが一致する付箋を `importance` 降順で `limit` 件返す。

```ts
if (scored.length === 0) {
  return topicNotes.sort((a, b) => b.importance - a.importance).slice(0, limit)
}
```

---

## 6. ビタミンB12問題でのシミュレーション（実データ検証済み）

- 問題ID: `r100-016`「野菜に含まれていないビタミンはどれか」
- question_text: `"野菜に含まれていないビタミンはどれか。１つ選べ。"`
- r100-016 のexemplar: primary=`ex-biology-012`、secondary=`ex-hygiene-022`

fusen-0373「ビタミンB12（コバラミン）」の実tags:
`['ビタミンB12', 'コバラミン', '巨赤芽球性貧血', '語呂合わせ', '内因子', 'コバルト', 'メチル転位']`

| 付箋 | exemplar | textMatch | total |
|------|---------|-----------|-------|
| fusen-0373「ビタミンB12（コバラミン）」| secondary +1（ex-hygiene-022） | 「ビタミン」ヒット → +0.5 | **1.54** |
| fusen-0265「ビタミンのポイント」| secondary +1 | 「ビタミン」ヒット → +0.5 | 1.53 |
| fusen-0269「脂溶性ビタミン」| secondary +1 | 「ビタミン」ヒット → +0.5 | 1.53 |

> r100-016 の primary exemplar は `ex-biology-012`（生物系）であり、hygiene-nutrition の付箋とは一致しない。
> secondary の `ex-hygiene-022` が一致するため +1。importance(4) × 0.01 = 0.04 のタイブレークで fusen-0373 が1位。

---

## 7. テスト方針

`OfficialNoteScoringCore` クラスに純粋関数を実装し、以下のケースをカバーする。

| # | テストケース |
|---|------------|
| T1 | primary exemplarが一致する付箋が高スコアになる（+2） |
| T2 | secondary exemplarはprimaryより低スコア（+1） |
| T3 | note.tagsのうちquestion_textに含まれる語でスコアが加算される |
| T4 | `question.tags` が空でもクラッシュしない |
| T5 | `primaryExemplarIds` が未定義の付箋はexemplarスコア0で処理 |
| T6 | スコア全0のとき importance降順フォールバックが返る |
| T7 | `note.tags` が空のときtextMatchスコアは0 |
| T8 | importanceが最大値(4)でもexemplar不一致を逆転しない |
| T9 | `limit` 引数で返却件数を変更できる |
| T10 | 同一exemplarIdがprimary/secondary両方に存在しても二重加算しない |
| T11 | limit=0、limit>全件数の境界値 |

---

## 8. 呼び出し側の変更

`QuestionPage.tsx` と **`LinkedQuestionItem.tsx`**（v1.1追加）で切り替える。

```ts
// 変更前
const { notes } = useOfficialNotes(questionId)

// 変更後
const { notes } = useScoredOfficialNotes(question)
```

`question` が `undefined`（問題ロード前）の場合は空配列を返す。

---

## 9. GPT-5.4レビュー対応記録

- GPT-5.4（codex exec）: サンドボックス制限によりセッション内実行不可（2026-03-30）
- エージェントチームレビュー Round 1（PdM / アーキテクト / QA）: 実施済み → P1×5修正
- エージェントチームレビュー Round 2（PdM / アーキテクト / QA）: 実施済み → 以下を修正
  - P1: `question.tags` 全件空 → タグスコア削除、`question_text` 部分一致に変更
  - P1: `exemplarIds` にprimary/secondary区別なし → 型変更 + スクリプト修正をスコープ追加
  - P1: `LinkedQuestionItem.tsx` 変更漏れ → 対象ファイルに追加
  - P1: シミュレーション§5を実データで書き直し（r100-016、fusen-0373の実tags使用）
  - P2: テストケースT10・T11追加

---

## 10. 対象ファイル

| ファイル | 変更種別 |
|--------|---------|
| `src/types/official-note.ts` | 変更（primaryExemplarIds/secondaryExemplarIds追加） |
| `scripts/generate-official-notes.ts` | 変更（isPrimary情報を保持して出力） |
| `src/data/official-notes.json` | 再生成 |
| `src/utils/official-note-scoring-core.ts` | 新規作成 |
| `src/hooks/useScoredOfficialNotes.ts` | 新規作成 |
| `src/pages/QuestionPage.tsx` | 変更（フック切り替え） |
| `src/components/question/LinkedQuestionItem.tsx` | 変更（フック切り替え） |
| `src/hooks/useOfficialNotes.ts` | 変更なし |
