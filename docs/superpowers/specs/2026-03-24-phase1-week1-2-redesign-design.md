# Phase 1 Week 1-2: 演習ページ＋ホーム画面リデザイン — 設計書

**Date**: 2026-03-24
**Status**: Approved
**PRD**: docs/specs/PRD_v1.md
**Design Direction**: Soft Companion（variation-b）

---

## 1. スコープ

### Week 1: 演習ページ（PracticePage.tsx）リデザイン
### Week 2: ホーム画面（HomePage.tsx）リデザイン

**含まれるもの**:
- デザイントークン基盤（全ページ共通）
- 共通UIコンポーネント（Chip, FloatingNav 等）
- PracticePage の完全リデザイン
- HomePage の完全リデザイン
- Ant Design の完全脱却（対象2ページ）

**含まれないもの**:
- 他ページ（Question, Analysis, Notes, FlashCard）のリデザイン → Week 3-6
- バックエンド変更
- オンボーディング → Week 6
- 公式付箋機能 → Week 3-4

---

## 2. 技術的決定事項

| 決定事項 | 選択 | 理由 |
|---------|------|------|
| Ant Design | **完全脱却** | モックアップの独自感を再現。バンドルサイズ減 |
| 移行戦略 | **段階的** | Week 1-2 は Practice + Home のみ。他は Week 3-6 |
| スタイリング | **CSS Modules + デザイントークン** | Vite標準サポート。スコープ付きでAnt Designと衝突しない |
| ボトムシート | **自前実装** | CSS transform + transition。依存ゼロ。Phase 2 Capacitor対応にも有利 |
| 問題カードの指標 | **出題頻度**（出題回数） | 難易度・正答率データなし。ExemplarStats を活用 |

---

## 3. デザインシステム：Soft Companion

### 3.1 デザイントークン（`src/styles/tokens.css`）

```css
:root {
  /* Colors */
  --accent: #aa3bff;
  --accent-light: rgba(170, 59, 255, 0.08);
  --accent-mid: rgba(170, 59, 255, 0.15);
  --accent-border: rgba(170, 59, 255, 0.25);
  --bg: #fef7ed;
  --card: #ffffff;
  --text: #3d2c1e;
  --text-2: #8b7355;
  --text-3: #9ca3af;
  --border: #e8e5ee;
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

  /* Radii */
  --r: 14px;
  --r-sm: 10px;
  --r-chip: 20px;
  --r-nav: 28px;
  --r-card: 16px;

  /* Fonts */
  --font: 'Quicksand', 'Noto Sans JP', sans-serif;
}
```

### 3.2 Soft Companion 固有の視覚特徴

| 要素 | 実装 |
|------|------|
| 暖色クリーム背景 | `background: var(--bg)` (#fef7ed) |
| カードの微傾き | `transform: rotate(±0.3deg)` — 付箋ノートのような質感 |
| デコウェーブ | `linear-gradient(90deg, #f97316, #fb923c, #fdba74, #fed7aa)` — 4px高さ |
| 浮遊pill型ナビ | `bottom: 16px`, `width: 350px`, `border-radius: 28px` |
| 円形スタッツ | 96×96px の円形バブル（ホーム画面） |
| 紫グラデーションCTA | `linear-gradient(135deg, #aa3bff, #8b5cf6)` + box-shadow |
| 親しみやすい語調 | 「がんばり記録」「科目べつ進み具合」 |

### 3.3 ファイル構成

```
src/
├── styles/
│   ├── tokens.css          ← CSS変数（全トークン）
│   ├── base.css            ← リセット + body + 共通
│   └── components.css      ← チップ・カード等の共通クラス（必要に応じて）
│
├── components/
│   └── ui/                 ← 新設：共通UIコンポーネント
│       ├── Chip.tsx + Chip.module.css
│       ├── ChipFilter.tsx + ChipFilter.module.css
│       ├── BottomSheet.tsx + BottomSheet.module.css
│       ├── PresetCard.tsx + PresetCard.module.css
│       ├── QuestionCard.tsx + QuestionCard.module.css
│       ├── StickyActionBar.tsx + StickyActionBar.module.css
│       ├── FloatingNav.tsx + FloatingNav.module.css
│       ├── DecoWave.tsx + DecoWave.module.css
│       ├── StatCircle.tsx + StatCircle.module.css
│       ├── SubjectMastery.tsx + SubjectMastery.module.css
│       └── ProgressBar.tsx + ProgressBar.module.css
│
├── pages/
│   ├── PracticePage.tsx     ← 完全リデザイン
│   ├── PracticePage.module.css
│   ├── HomePage.tsx         ← 完全リデザイン
│   └── HomePage.module.css
```

---

## 4. 演習ページ（PracticePage）設計

### 4.1 画面構成（上から下）

| # | エリア | コンポーネント | 説明 |
|---|--------|-------------|------|
| 1 | ヘッダー | ページ直書き | 「💊 演習モード」+ 問題総数 |
| 2 | スマートプリセット | `PresetCard` ×4 | 2×2グリッド。タップでフィルター自動設定 |
| 3 | 科目チップ | `ChipFilter` | 横スクロール。9科目 |
| 4 | 分野チップ | `ChipFilter`（動的） | 科目選択時に展開。MajorCategory レベル |
| 5 | 年度チップ | `ChipFilter` | 横スクロール。第100〜111回 |
| 6 | 区分チップ | `ChipFilter` | 必須（青）/ 理論 / 実践（緑） |
| 7 | 詳細フィルターボタン | ボタン → `BottomSheet` | 破線ボーダー。タップでボトムシート展開 |
| 8 | 結果サマリー | ページ直書き | 「248問ヒット」+ ソートボタン |
| 9 | 問題カード一覧 | `QuestionCard` ×N | 微傾き付き。出題頻度バッジ。分野バッジ |
| 10 | 固定アクションバー | `StickyActionBar` | bottom: 72px。「▶ 演習開始（10問）」+ ⚙ |
| 11 | ナビ | `FloatingNav` | 浮遊pill型。4タブ |

### 4.2 スマートプリセット定義（更新版）

| プリセット | アイコン | フィルター自動設定 | 説明文 |
|-----------|--------|-----------------|--------|
| **苦手克服** | 🎯 | 正誤=不正解 + ランダム順 + 10問 | 間違えた問題を優先 |
| **頻出テーマ** | 📋 | ExemplarStats.yearsAppeared≧3 + 未回答 + 10問 | よく出るテーマの未回答 |
| **未回答を潰す** | ⭐ | 正誤=未回答 + 年度順 + 10問 | まだ解いてない問題 |
| **ランダム演習** | 🔄 | 現在のフィルター結果 + シャッフル + 10問 | フィルター結果からシャッフル |

**変更点**（PRDからの差分）:
- 「直前対策」→「**頻出テーマ**」に名称変更（時期を問わない表現に）
- 「正答率60%以上+未回答」→「**出題頻度≧3年+未回答**」に条件変更（正答率データなしのため）
- 「ランダム演習」= フィルター結果のシャッフル（全問ランダムではない）

### 4.3 分野チップフィルター（新機能）

**動作**: 科目チップを1つ以上選択すると、その直下に分野（MajorCategory）チップが動的に展開される。

**データソース**: `exam-blueprint.ts` の `SubjectBlueprint.majorCategories`

**UI**:
- 紫の左ボーダー（2px）でインデント表示
- `📂 薬理の分野` のようなラベル付き
- スライドダウンアニメーション（0.2s ease）
- 科目未選択時は非表示

**フィルタリング**: `QUESTION_TOPIC_MAP` を使用して、選択した分野に紐づく問題IDを取得。

### 4.4 ボトムシート（詳細フィルター）

**トリガー**: 「🔍 詳細フィルター」ボタンをタップ

**実装**: CSS transform + transition で画面下からスライドイン。半透明オーバーレイ付き。

**フィルター項目**:

| フィルター | UI | 優先度 |
|-----------|------|--------|
| 正誤ステータス | ○ △ ✕ — の4ボタン | P0 |
| 画像問題のみ | トグルスイッチ | P1 |
| ランダム順 | トグルスイッチ | P0 |
| キーワード検索 | テキスト入力 | P1 |
| 問題数 | 10問 / 20問 / 全問 のチップ | P0 |

### 4.5 問題カード（QuestionCard）

**表示情報**:
- 区分バッジ（必須=青 / 理論=オレンジ / 実践=緑）
- 問題番号（例：第105回 問12）
- 科目チップ（アクセント紫）
- **分野バッジ（グレー）** ← 新規追加
- 正誤ステータス（✅ / ❌ / —）
- 問題文（2行打ち切り）
- **出題頻度バッジ**（🔥 頻出（5回出題））← データがある場合のみ表示

**Soft Companion の演出**:
- 奇数カード: `transform: rotate(-0.3deg)`
- 偶数カード: `transform: rotate(0.2deg)`

---

## 5. ホーム画面（HomePage）設計

### 5.1 画面構成（上から下）

| # | エリア | コンポーネント | 説明 |
|---|--------|-------------|------|
| 1 | デコウェーブ | `DecoWave` | オレンジグラデーション4pxバー |
| 2 | ヘッダー | ページ直書き | 「💊 国試ノート」+ ストリークバッジ + 挨拶 |
| 3 | 今日のメニュー | `TodayMenu`（既存改修） | 3カード：優先/復習/チャレンジ。**最上部に移動** |
| 4 | がんばり記録 | `StatCircle` ×3 | 円形バブル（問題数/カード/連続日数） |
| 5 | 科目べつ進み具合 | `SubjectMastery` | 科目→分野の2階層。タップ展開。「演習→」リンク |
| 6 | クイックアクション | ページ直書き | 3列ボタン（自分で選ぶ/付箋/ランダム10） |
| 7 | ナビ | `FloatingNav` | 演習ページと共有 |

### 5.2 今日のメニュー

**PRDからの変更点**: ページ最下部 → **最上部**に移動（最重要）

**3カードの構成**:

| カード | 左ボーダー色 | バッジ | タイトル例 | 説明例 |
|--------|-----------|-------|----------|--------|
| 苦手克服 | 赤グラデーション | 🔴 優先 | 苦手克服：薬理 交感神経系 | 前回3問中1問不正解 → 復習しよう |
| 復習カード | 黄グラデーション | 🟡 復習 | 復習カード 8枚 | 暗記カードの復習期限です（2分） |
| チャレンジ | 紫グラデーション | 🟣 チャレンジ | 頻出テーマ：化学物質の反応 | 出題頻度の高い未回答問題 5問 |

**Soft Companion の演出**: カードに微傾き（rotate ±0.3deg）

### 5.3 科目べつ進み具合（SubjectMastery）

**2階層表示**:
- **折りたたみ時**: 科目名 + パーセンテージ + プログレスバー（色分け：緑≧70% / 黄≧30% / 赤＜30% / グレー=0%）
- **展開時**: 分野ごとの小バー + パーセンテージ + ステータスアイコン + 「演習→」リンク

**データソース**: `useTopicMastery` フック + `exam-blueprint.ts` の科目→分野階層

**「演習→」リンク**: タップで PracticePage に遷移し、該当分野のフィルターを自動設定

---

## 6. 共有コンポーネント

以下のコンポーネントは演習ページとホーム画面で共有:

| コンポーネント | 使用箇所 | 備考 |
|-------------|---------|------|
| `FloatingNav` | 全ページ | 浮遊pill型ナビ。4タブ |
| `ProgressBar` | HomePage（マスター進捗）, QuestionCard | 色分けプログレスバー |
| `Chip` | PracticePage, HomePage（将来的にNotesでも） | 基本チップ部品 |
| デザイントークン | 全ページ | tokens.css |

---

## 7. データフロー

### 演習ページのフィルタリング

```
ユーザー操作（プリセット/チップ/ボトムシート）
    ↓
フィルター状態（useState）
    ↓
useMemo でフィルタリング
    ↓ questions × answerHistory × QUESTION_TOPIC_MAP × ExemplarStats
フィルター済み問題リスト
    ↓
QuestionCard 一覧表示 + 結果カウント
```

### ホーム画面のデータ取得

```
useAnalytics → 解いた問題数、連続日数
useTopicMastery → 科目×分野の正答率
useFlashCards → 復習カード数
ExemplarStats → 頻出テーマの特定（チャレンジメニュー用）
QUESTION_TOPIC_MAP + exam-blueprint → 分野階層
```

---

## 8. Ant Design 脱却の移行戦略

### Week 1-2 で行うこと
1. `src/styles/tokens.css` と `src/styles/base.css` を新設
2. `src/components/ui/` に共通コンポーネントを新設
3. PracticePage と HomePage を完全に新しいコンポーネントで書き直し
4. `FloatingNav` を `AppLayout.tsx` に組み込み（対象ページのみ）
5. Ant Design の import は残す（他ページが依存中）

### Week 3-6 で行うこと（本設計書のスコープ外）
- Question, Analysis, Notes, FlashCard ページの順次移行
- 全ページ移行完了後に `antd` を package.json から削除

---

## 9. 未解決事項・今後の検討

| # | 項目 | 対応時期 |
|---|------|---------|
| 1 | ユーザビリティテスト | バックエンド完成後に実施 |
| 2 | 出題頻度データの精度検証 | Week 1 実装時に ExemplarStats の分布を確認 |
| 3 | 分野チップの粒度（MajorCategory vs MiddleCategory） | 大項目で開始し、ユーザーフィードバック次第で中項目まで展開検討 |
| 4 | QUESTION_TOPIC_MAP のカバレッジ | 全3,470問がマッピング済みか実装時に検証 |
| 5 | 「衛生」科目が PracticePage の SUBJECTS 配列から漏れている | Week 1 で修正 |

---

## 10. 実装上の注意点（スペックレビューより）

1. **分野チップのデータ結合**: `QUESTION_TOPIC_MAP` は MiddleCategory レベル。MajorCategory チップへの集約には `exam-blueprint.ts` 経由で MiddleCategory → MajorCategory のルックアップが必要
2. **SubjectMastery の集約**: `useTopicMastery` は `topicsBySubject` を返すが、科目→大項目→中項目の3階層表示にはコンポーネント内で追加グルーピングが必要
3. **FloatingNav の条件分岐**: `AppLayout.tsx` は現在 Ant Design の Layout/Header/Footer を使用。リデザイン済みページのみ FloatingNav を表示し、未移行ページは旧ナビを維持するルートベースの条件レンダリングが必要
4. **頻出テーマプリセットのデータ結合**: `ExemplarStats` → `QUESTION_EXEMPLAR_MAP` → 問題ID という新しいデータ結合パスが必要（現在の PracticePage には存在しない）
