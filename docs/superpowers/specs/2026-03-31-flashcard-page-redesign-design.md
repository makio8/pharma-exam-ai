# FlashCardPage リデザイン設計 Spec v1.0

> 2026-03-31 作成。エージェントチーム4名（PdM/UXアーキテクト/グロース/教育工学）+ GPT-5.4レビュー済み。
> Soft Companion デザインシステム準拠。

---

## 1. 設計方針

### 学習サイクル連動型 + SM-2復習キュー

ファウンダーの学習モデル「発見→理解→暗記→確認」に沿い、暗記カードは以下2つのモードで機能する:

- **文脈付き練習（主導線）**: 演習→付箋→カードの流れで到達。LearningLinkService経由で関連カードが提示される
- **独立練習（日次復習）**: SM-2が決めた復習タイミングのカードを回す。学習サイクル全体を横断する保守活動

### ページ役割分担

| ページ | 役割 | 主なUI |
|--------|------|--------|
| **ホーム** | 学習ハブ（次の1手を1タップで開始） | 「復習カード23枚」「苦手演習8問」ウィジェット |
| **カードタブ** | カテゴリ別の任意練習ランチャー | リスト+サブカテゴリ。復習CTAは上部に1つ |
| **練習画面** | スワイプでカードを回す | タップ→フリップ→スワイプ評価 |

**棲み分け**: ホームは「全体をまとめて」の粗い粒度、カードタブは「自分で選んで」の細かい粒度。

---

## 2. カードタブ（FlashCardListPage）

### レイアウト: リスト+サブカテゴリ型

```
┌─────────────────────────────┐
│ 暗記カード              730枚│  ← ヘッダー
├─────────────────────────────┤
│ 🔥 5日連続学習中！          │  ← ストリーク（条件付き表示）
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 復習タイミング  23枚     │ │  ← 復習CTA（紫グラデ）
│ │ 約5分     練習する →    │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 🔬 構造式カード      720枚  │  ← セクションヘッダー
│ [全て] [基礎] [応用]        │  ← Chipフィルタ
│ ┌───────────────────────┐   │
│ │ ⬡ 複素環母核   185枚  3│  │  ← サブカテゴリ行
│ │ 💊 ビタミン     65枚  2│  │     期限バッジ赤
│ │ 🧬 アミノ酸    90枚   ›│  │     タップで練習開始
│ │ 💉 プロドラッグ  40枚  ›│  │
│ │ ☠️ 発がん物質   60枚   ›│  │
│ │ + 他10カテゴリ          │  │  ← 折りたたみ
│ └───────────────────────┘   │
├─────────────────────────────┤
│ 📖 テキストカード    10枚   │  ← 将来3,000枚に拡大
│ （準備中...）                │
└─────────────────────────────┘
```

### コンポーネント構成

- `FlashCardListPage` — ページ全体（Soft Companion `.sc-page`）
- `ReviewCTA` — 復習タイミングカード（紫グラデボタン）
- `DeckSection` — カテゴリセクション（構造式/テキスト）
- `SubCategoryRow` — サブカテゴリ行（アイコン+名前+枚数+期限バッジ）
- `ChipFilter` — 基礎/応用フィルタ（既存Chipコンポーネント流用）

### データフロー

```
useFlashCardTemplates() → FLASHCARD_TEMPLATES (730枚)
  → source_type === 'structure_db' でフィルタ
  → COMPOUND_META のcategoryでサブカテゴリ分類
  → useCardProgress().dueProgress で期限枚数計算

タップ時:
  → PracticeContext { mode: 'exemplar', cardIds: [...], returnTo: '/cards' }
  → navigate('/cards/review', { state: { practiceContext } })
```

---

## 3. 練習画面（FlashCardPage → TemplatePractice）

### インタラクション: スワイプ2段階

**フロー: タップ → フリップ → スワイプ評価**

```
1. カード表面を見る（構造式SVG or テキスト）
2. タップ → 3Dフリップ（rotateY 180deg）
3. 裏面を確認（構造式SVG + テキスト解説）
4. 右スワイプ = OK / 左スワイプ = もう1回
5. 次のカードへ（スタックから飛び出すアニメーション）
```

### スワイプ実装仕様

| 仕様 | 値 |
|------|-----|
| 閾値 | 画面横幅の30% |
| カード回転 | ドラッグ量に比例して0-15° |
| 背景色変化 | 右=緑フェード、左=オレンジフェード |
| テキストラベル | 「OK 👍」/「🔄 もう1回」（ゴーストヒント、5枚後フェードアウト） |
| スナップバック | 閾値未満で離すと中央に戻る |
| アンドゥ | 右下に「↩ 戻す」ボタン（直前1手のみ） |
| touch-action | `none`（SVG画像のブラウザジェスチャー無効化） |

### SM-2マッピング

| スワイプ | SM-2 quality | 効果 |
|---------|-------------|------|
| ← もう1回 | 1 (Again) | ease_factor低下、1日後に再出題 |
| OK → | 3 (Good) | 通常の間隔延長 |

### ゴーストヒント仕様

```
セッション内カウント:
  1-5枚目: テキスト+アイコン opacity 0.7 でフェードイン（スワイプ中のみ）
  6-10枚目: アイコンのみ opacity 0.4
  11枚目以降: 背景色変化のみ（テキスト/アイコン非表示）

永続化: localStorage 'swipe-hint-seen' カウンター
  初回セッションは常にヒント表示
  2回目以降は6枚目から非表示にスキップ
```

### カード表示

| カードタイプ | 表面 | 裏面 |
|------------|------|------|
| L0a（名前→構造） | 物質名テキスト | SVG画像 + 英名 + ポイント解説 |
| L0b（構造→名前） | SVG画像 + 「この物質名は？」 | SVG画像 + 物質名 + ポイント解説 |
| L1（構造→物質名詳細） | SVG画像 + 構造特徴テキスト | SVG画像 + 物質名 + 詳細説明 |
| L2（物質名→特徴） | 物質名テキスト | SVG画像 + 構造的特徴3つ |
| L3（部分構造→分類） | テキスト問い | SVG画像 + 化合物群 |
| テキストカード | テキスト問い | テキスト答え |

全構造式カードの裏面にSVG画像を表示（視覚記憶の強化）。

### セッション制御

| 設定 | 値 |
|------|-----|
| デフォルト枚数 | 10枚 |
| 選択可能枚数 | 5 / 10 / 20 / 全部 |
| カード順序 | SM-2期限優先（due first）、同日内はランダム |
| カテゴリ練習 | 選択カテゴリ内からSM-2優先順で枚数分 |
| 初回カード | quality上限3にキャップ（Easyにならない） |

---

## 4. 完了画面

### レイアウト

```
┌─────────────────────────────┐
│                              │
│        🎉（軽いアニメ）       │
│                              │
│     15枚の練習が完了！        │
│                              │
│   ┌──────┐  ┌──────┐        │
│   │ OK   │  │もう1回│        │
│   │  12  │  │   3  │        │
│   └──────┘  └──────┘        │
│                              │
│   🔥 連続学習 6日目！         │  ← ストリーク更新（条件付き）
│                              │
├─────────────────────────────┤
│ 次のアクション                │
│                              │
│ 📝 苦手だった3枚の関連問題   │  ← 学習サイクル接続
│    を解いてみる →             │
│                              │
│ 🔬 構造式をもう10枚 →        │  ← 追加練習
│                              │
│ 🏠 ホームに戻る              │
│                              │
└─────────────────────────────┘
```

### 次アクション提案ロジック

1. **「もう1回」が1枚以上あった場合**: 「苦手だった{N}枚の関連問題を解いてみる」→ 該当カードのprimary_exemplar_id → LearningLinkService.getQuestionsForExemplar() → 演習ページへ
2. **全部OKだった場合**: 「同じカテゴリをもう{N}枚」or「別のカテゴリを試す」
3. **常時**: 「ホームに戻る」

### 達成感演出

- 完了時: 軽いスケールアニメーション（emoji bounce）。紙吹雪は重いのでなし
- ストリーク更新: 連続日数+1のカウントアップ。新記録時のみ特別メッセージ
- 全部OK: 「パーフェクト！」テキスト（条件付き）

---

## 5. Soft Companion デザイン仕様

### 既存トークン使用

```css
--bg: #fef7ed        /* ページ背景 */
--card: #ffffff      /* カード背景 */
--accent: #aa3bff    /* CTA、アクティブChip */
--text: #3d2c1e      /* 主テキスト */
--text-2: #8b7355    /* 副テキスト */
--ok: #10b981        /* OK（右スワイプ） */
--warn: #f59e0b      /* もう1回（左スワイプ） */
--r: 14px            /* カード角丸 */
--r-sm: 10px         /* 小要素角丸 */
--shadow-sm           /* カード影 */
--shadow-cta          /* CTA紫グロー */
```

### Ant Design依存の排除

FlashCardListPage, FlashCardPage, TemplatePractice から Ant Design コンポーネント（Button, Card, Collapse, Progress, Result, Badge, Typography等）を全て除去。CSS Modules + デザイントークンに置換。

### コンポーネントファイル構成

```
src/components/flashcard/
  ├── SwipeCard.tsx              # スワイプ可能なカード本体
  ├── SwipeCard.module.css
  ├── SwipePractice.tsx          # スワイプ練習全体（旧TemplatePractice）
  ├── SwipePractice.module.css
  ├── PracticeComplete.tsx       # 完了画面
  ├── PracticeComplete.module.css
  ├── GhostHint.tsx              # ゴーストヒントオーバーレイ
  └── ProgressBar.tsx            # セッション進捗バー

src/pages/
  ├── FlashCardListPage.tsx      # カードタブ（リデザイン）
  ├── FlashCardListPage.module.css
  ├── FlashCardPage.tsx          # 練習画面（リデザイン）
  └── FlashCardPage.module.css

src/hooks/
  └── useSwipeGesture.ts         # タッチ/マウスのスワイプ検知フック
```

---

## 6. スワイプジェスチャー実装

### useSwipeGesture フック

```typescript
interface SwipeGestureOptions {
  threshold?: number      // 発火閾値（default: 0.3 = 30%）
  onSwipeLeft: () => void
  onSwipeRight: () => void
}

interface SwipeGestureState {
  offsetX: number         // 現在のドラッグ量（px）
  isDragging: boolean
  direction: 'left' | 'right' | null
  progress: number        // 0-1（閾値に対する進捗）
}
```

- `touchstart` / `touchmove` / `touchend` でタッチ検知
- `mousedown` / `mousemove` / `mouseup` でデスクトップ対応
- `touch-action: none` でブラウザのデフォルトジェスチャーを無効化
- フリップ済みカードのみスワイプを受け付ける（表面ではスワイプ不可）

---

## 7. 既存コードとの関係

### 維持するもの
- `FlashCardPracticeContext` 型 — 変更なし
- `useCardProgress` フック — SM-2スケジューリングは維持
- `SM2Scheduler` — quality 1/3 の2値入力に対応済み（元々0-5の範囲）
- `LearningLinkService` — 完了画面の「関連問題」提案に使用
- レガシーFlashCard型 — @deprecated維持、段階的に削除

### 削除するもの
- `TemplatePractice.tsx` — `SwipePractice.tsx` に置換
- `FlashCard.tsx`（レガシーコンポーネント）— レガシーカード自体がなくなれば削除
- Ant Design import（Button, Card, Collapse, Progress, Result, Badge, Typography, Space）

### 変更するもの
- `FlashCardListPage.tsx` — 全面リデザイン（Soft Companion + サブカテゴリ）
- `FlashCardPage.tsx` — TemplatePractice → SwipePractice に切替

---

## 8. テスト方針

### 純粋ロジックテスト
- `useSwipeGesture` のロジック部分（閾値判定、progress計算）を純粋関数に抽出してテスト
- ゴーストヒントのカウンターロジック
- SM-2 quality 1/3 マッピングの検証（既存SM2Schedulerテストで対応済み）
- 完了画面の「次アクション提案」ロジック

### 手動テスト
- スマホ実機でのスワイプ操作感（Safari, Chrome）
- SVG画像のスワイプ干渉なし確認
- フリップ→スワイプの連続操作テンポ
- ゴーストヒントのフェードアウトタイミング

---

## 9. 実装順序

```
Phase A: SwipePractice（練習画面のコア）
  1. useSwipeGesture フック
  2. SwipeCard コンポーネント（フリップ+スワイプ）
  3. GhostHint オーバーレイ
  4. SwipePractice 全体組み立て
  5. PracticeComplete 完了画面

Phase B: FlashCardListPage（カードタブ）
  6. Soft Companion リデザイン
  7. サブカテゴリ表示
  8. 復習CTA + Chipフィルタ

Phase C: 統合
  9. FlashCardPage 切替（TemplatePractice → SwipePractice）
  10. ホームからの復習導線確認
  11. 演習→付箋→カードの横断ナビ確認
```
