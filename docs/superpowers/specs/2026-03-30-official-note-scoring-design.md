# 公式付箋レコメンドロジック改善 設計仕様

- バージョン: v1.0
- 作成日: 2026-03-30
- レビュー: エージェント3チーム（PdM / アーキテクト / QA）
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

## 3. スコアリングロジック

### スコア計算式

```
score(note, question) =
  + SCORING_WEIGHTS.primaryExemplar   // primary exemplarId一致
  + SCORING_WEIGHTS.secondaryExemplar // secondary exemplarId一致
  + (question.tags ∩ note.tags).length × SCORING_WEIGHTS.tagMatch
  + Math.min(note.importance, 10) × SCORING_WEIGHTS.importance
```

### 重み定数

```ts
const SCORING_WEIGHTS = {
  primaryExemplar: 2,
  secondaryExemplar: 1,
  tagMatch: 1,        // タグ一致1件あたり
  importance: 0.01,   // タイブレーク用（importance最大4 × 0.01 = 0.04）
} as const
```

> importanceの実データ範囲: 2〜4（上限キャップ10は余裕を持たせた設定）

### exemplarId一致の判定

`QUESTION_EXEMPLAR_MAP`（フラット配列）から対象questionIdのエントリをフック初期化時に**Mapに変換**してO(1)参照する。

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

### タグ一致の判定

キーワードトークナイズ（スペース分割）は日本語で機能しないため採用しない。
代わりに `question.tags` と `note.tags` の集合積を使用する。

```ts
const tagScore = question.tags.filter(t => note.tags.includes(t)).length
```

### correct_answer の扱い

`correct_answer: number | number[]` の型に対応する。
（選択肢参照はタグ方式に変更したため、直接参照は不要）

---

## 4. フィルタリング・ソート

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

## 5. ビタミンB12問題でのシミュレーション

問題ID: `r100-016`（野菜に含まれないビタミン、正解: ビタミンB12）
`question.tags`: `['ビタミンB12', 'コバラミン', '動物性食品', '衛生']`（想定）

| 付箋 | exemplar | タグ一致 | total |
|------|---------|---------|-------|
| fusen-0373「ビタミンB12（コバラミン）」| +2 | B12,コバラミン → +2 | **4.04** |
| fusen-0265「ビタミンのポイント」| +2 | ビタミン系のみ → +1 | 3.03 |
| fusen-0367「ビタミンB1 (チアミン)」| +2 | ビタミン系のみ → +1 | 3.04 |

→ fusen-0373が1位

---

## 6. テスト方針

`OfficialNoteScoringCore` クラスに純粋関数を実装し、以下のケースをカバーする。

| # | テストケース |
|---|------------|
| T1 | primary exemplarが一致する付箋が高スコアになる |
| T2 | secondary exemplarはprimaryより低スコア |
| T3 | タグ一致数に応じてスコアが加算される |
| T4 | `correct_answer` が配列でもクラッシュしない |
| T5 | `exemplarIds` が未定義の付箋はexemplarスコア0で処理 |
| T6 | スコア全0のとき importance降順フォールバックが返る |
| T7 | `question.tags` が空のときタグスコアは0 |
| T8 | importanceが最大値(4)でもexemplar不一致を逆転しない |
| T9 | `limit` 引数で返却件数を変更できる |

---

## 7. 呼び出し側の変更

`QuestionPage.tsx` で `useOfficialNotes` を `useScoredOfficialNotes` に切り替える。

```ts
// 変更前
const { notes } = useOfficialNotes(questionId)

// 変更後
const { notes } = useScoredOfficialNotes(question)
```

`question` が `undefined`（問題ロード前）の場合は空配列を返す。

---

## 8. GPT-5.4レビュー対応記録

- GPT-5.4（codex exec）: サンドボックス制限によりセッション内実行不可（2026-03-30）
- エージェントチームレビュー（PdM / アーキテクト / QA）: 実施済み
  - P1指摘5件 → 全て設計に反映済み
  - P2指摘3件 → SCORING_WEIGHTS定数化・importanceキャップ・フォールバック改善を反映
  - P3指摘2件 → OfficialNoteScoringCoreクラス分離・limit引数化を採用

---

## 9. 対象ファイル

| ファイル | 変更種別 |
|--------|---------|
| `src/utils/official-note-scoring-core.ts` | 新規作成 |
| `src/hooks/useScoredOfficialNotes.ts` | 新規作成 |
| `src/pages/QuestionPage.tsx` | 変更（フック切り替え） |
| `src/hooks/useOfficialNotes.ts` | 変更なし |
