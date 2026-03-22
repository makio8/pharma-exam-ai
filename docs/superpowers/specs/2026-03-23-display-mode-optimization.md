# 画像問題の表示モード全体最適化

## 背景

薬剤師国試アプリで問題画像（PDF抽出）の表示モード（text / image / both）を制御する `getDisplayMode()` に複数の問題が発見された。個別問題の部分修正ではなく、全4,094問に対する全体最適化が必要。

## 現状データ（全11年分 100-110回）

| 項目 | 件数 |
|---|---|
| 全問題数 | 4,094 |
| image_url あり | 909 |
| visual_content_type あり | 838 |
| image_url あり + VCT なし | 71 |

### 現在の getDisplayMode 分類結果

| モード | 件数 | 説明 |
|---|---|---|
| text | 3,758 | テキストのみ表示 |
| image | 35 | 画像のみ（choices空） |
| both | 301 | テキスト+画像の両方表示 |

## 発見した問題

### P0: choices空テキストバグ（131件）— 修正済み

**問題**: choices配列にオブジェクトはあるが全`text`が空文字`""`。`choices.length > 0` なので `image` モードにならず `both` にフォールバック。結果、空のテキスト領域 + 画像が表示される。

**修正**: `getDisplayMode` に `choices.every(c => c.text === '')` チェック追加。

```typescript
// Before
if (question.choices.length === 0) return 'image'

// After
if (question.choices.length === 0 || question.choices.every(c => c.text === '')) return 'image'
```

**影響**: 131件が `both` → `image` に正しく分類される。

### P1: コンテンツ重複リスク（残りの both 170件）

修正後の `both` モード170件のうち、テキストが長い（150文字超）59件は画像との内容重複リスクが高い。

特に以下のパターン:
- VCT=table で問題文に表形式データを含む（11件）
- VCT=prescription で問題文に処方内容を含む（16件）

**提案**:
- A案: テキスト150文字超 + image_url あり → デフォルト `image` モードにする（積極的）
- B案: `display_mode_override` でバッチ判定スクリプトを作り、AI（Vision API）で画像とテキストの重複度を判定して自動設定（精度高い）
- C案: 現状維持 + 実機確認ベースで手動 `display_mode_override` を追加（確実だが遅い）

### P2: VCT未設定で画像非表示（42件）

image_url があるのに visual_content_type が未設定 → `text` モードにフォールバックし、画像が表示されない。exam-110 に集中（43件中42件）。

**提案**: image_url がある問題は最低でも `both` にすべき。ロジック変更:

```typescript
// 現在: VCTが非テキストの場合のみ both
if (question.visual_content_type && question.visual_content_type !== 'text_only') return 'both'

// 提案: image_url があれば VCT未設定でも both にフォールバック
if (question.image_url) return 'both'  // VCTチェック不要に
```

## 今回実施した変更

### 1. `display_mode_override` フィールド追加
- Question型に `display_mode_override?: 'text' | 'image' | 'both'` を追加
- `getDisplayMode()` で最優先チェック
- 実機確認に基づく手動上書きが可能に

### 2. P0バグ修正（空テキストchoices）
- 131件が正しく `image` モードに

### 3. 100回 問197/198/199 の個別修正
- 問197: `display_mode_override: "image"`（画像に問題文が含まれ、テキストと重複）
- 問198: `display_mode_override: "text"`（テキストが十分きれいで画像不要）
- 問199: `display_mode_override: "image"`（同上 + 画像トリミング）

### 4. 全年度画像トリミング
- 全11年分 906枚の余白をトリミング（ページ番号除去 + 白余白除去）

## レビューで確認してほしいこと

1. **P2の修正方針**: `image_url` があれば VCT 未設定でも `both` にすべきか？副作用はないか？
2. **P1の重複判定**: A/B/C案のどれが現実的か？スクリプトでバッチ判定する場合の設計
3. **getDisplayMode の設計**: 現在のロジック階層（override → choices空 → VCT → fallback）は妥当か？
4. **画像トリミング**: 全画像一括トリミングの副作用リスク（必要な余白まで削った可能性）

## ファイル一覧

- `src/utils/text-normalizer.ts` — getDisplayMode 定義
- `src/types/question.ts` — Question型（display_mode_override追加）
- `src/pages/QuestionPage.tsx` — 問題表示UI
- `src/components/LinkedQuestionViewer.tsx` — 連問表示UI
- `src/data/real-questions/exam-100.ts` — 100回データ（override追加）
- `scripts/trim-image-whitespace.ts` — 画像トリミングスクリプト
