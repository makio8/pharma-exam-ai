# FlashCardPage リデザイン設計 Spec v1.2

> 2026-03-31 作成、2026-04-01 v1.1→v1.2更新。
> エージェントチーム4名（PdM/UXアーキテクト/グロース/教育工学）+ GPT-5.4レビュー × 2回。
> v1.1: P1指摘7件 + Phase1対応P2を反映。
> v1.2: テキストカード3,516枚統合。総枚数4,246枚。cloze形式レンダリング追加。遅延ロードアーキテクチャ確定。
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

### 課金境界（v1.1追加）

Phase 1（4月トライアル期間）は**全カード全開放**。課金制限はDB設計spec Plan 2で別途実装。

```
Phase 1: 全730枚開放（トライアル）
Phase 2: Free=チュートリアルデッキのみ、Pro=全デッキ
```

### オンボーディング（v1.1追加）

初回訪問時にチュートリアルデッキ（5枚）でスワイプ操作を体験させる。

```
初回フロー:
  1. カードタブ初訪問を検知（localStorage 'card-onboarding-done' === null）
  2. 「暗記カードの使い方」チュートリアルデッキを自動開始
  3. 固定5枚: テキストカード2枚 + 構造式カード3枚（操作説明テキスト付き）
     - カード1（テキスト）: 「タップして裏面を見てみよう」→ フリップ体験
     - カード2（テキスト）: 「覚えたら右にスワイプ！」→ スワイプ体験
     - カード3（構造式L0b）: 実際の構造式カードで体験
     - カード4（構造式L0a）: 名前→構造の方向
     - カード5（テキスト）: 「おつかれさま！カードタブから自由に練習しよう」
  4. 完了後: 'card-onboarding-done' = true、通常のカードリスト表示
  5. 2回目以降: 通常表示（チュートリアルはスキップ）

復習CTA 0枚時（初期状態）:
  「まだ復習するカードがありません。カテゴリを選んで練習してみよう！」
```

---

## 2. カードタブ（FlashCardListPage）

### レイアウト: リスト+サブカテゴリ型

```
┌─────────────────────────────┐
│ 暗記カード           4,246枚│  ← ヘッダー
├─────────────────────────────┤
│ 🔥 5日連続学習中！          │  ← ストリーク（条件付き表示）
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ 復習タイミング  23枚     │ │  ← 復習CTA（紫グラデ）
│ │ 約5分     練習する →    │ │     全タイプ混合
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 📖 テキストカード   3,516枚 │  ← メインセクション
│ ┌───────────────────────┐   │
│ │ 🏥 病態・薬物治療 662枚 5│  │  ← 科目別サブカテゴリ
│ │ 💊 実務         662枚  3│  │     期限バッジ赤
│ │ 💉 薬理         533枚  8│  │     タップで練習開始
│ │ 🧫 衛生         453枚  2│  │
│ │ 💊 薬剤         401枚   ›│  │
│ │ + 他4科目                │  │  ← 折りたたみ（アコーディオン）
│ └───────────────────────┘   │
├─────────────────────────────┤
│ 🔬 構造式カード      720枚  │  ← サブセクション
│ [全て] [基礎] [応用]        │  ← Chipフィルタ
│ ┌───────────────────────┐   │
│ │ ⬡ 複素環母核   185枚  3│  │  ← カテゴリ別サブカテゴリ
│ │ 💊 ビタミン     65枚  2│  │
│ │ 🧬 アミノ酸    90枚   ›│  │
│ │ + 他12カテゴリ          │  │  ← 折りたたみ
│ └───────────────────────┘   │
└─────────────────────────────┘
```

折りたたみ: アコーディオン形式。タップで展開/収納。初期状態は上位5カテゴリのみ表示。

### コンポーネント構成

- `FlashCardListPage` — ページ全体（Soft Companion `.sc-page`）
- `ReviewCTA` — 復習タイミングカード（紫グラデボタン）
- `DeckSection` — カテゴリセクション（構造式/テキスト）
- `SubCategoryRow` — サブカテゴリ行（アイコン+名前+枚数+期限バッジ）
- `ChipFilter` — 基礎/応用フィルタ（既存Chipコンポーネント流用）

### データフロー（v1.2更新）

```
カードソース:
  構造式: FLASHCARD_TEMPLATES (730枚、同期import、TSファイル)
  テキスト: generated-cards/ (3,516枚、科目別JSON、dynamic import)

カードリスト表示:
  構造式: FLASHCARD_TEMPLATES → source_type === 'structure_db' でフィルタ → COMPOUND_META でカテゴリ分類
  テキスト: loadCardTemplates(subject) で科目別遅延ロード → 表示中の科目のみメモリに保持
  復習CTA: useCardProgress().dueProgress で全カードの期限枚数計算

タップ時:
  → PracticeContext { mode: 'exemplar', cardIds: [...], returnTo: '/cards' }
  → navigate('/cards/review', { state: { practiceContext } })

練習画面:
  cardIds からテンプレートを1枚ずつ取得（templatesById Map lookup）
  構造式: FLASHCARD_TEMPLATES から同期取得
  テキスト: loadAllCardTemplates() 初回呼び出し時にキャッシュ
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
| フリップ中ガード | フリップアニメーション完了前のtouchmoveは無視 |
| 斜めスワイプ除外 | 水平方向のドラッグ量が垂直方向の2倍未満の場合はスクロール意図と判定 |

### 2層ラッパー構造（v1.1追加）

フリップ（rotateY）とスワイプ（translateX + rotate）を同一要素のtransformに載せると座標系が破綻するため、2層に分離:

```
<SwipeCard>                           ← 外側: translateX + rotate（スワイプ）
  <div class="flipContainer">         ← 内側: rotateY（フリップ）
    <div class="front">...</div>
    <div class="back">...</div>
  </div>
</SwipeCard>
```

状態遷移:
```
frontIdle → (tap) → flipping → backIdle → (drag) → dragging → (release)
  → resolved（閾値超え: exit animation → advancing → reset to frontIdle）
  → snappedBack（閾値未満: backIdleに戻る）

入力ロック: flipping中、resolved中はタッチ/マウスイベントを無視
```

### SM-2マッピング

| スワイプ | SM-2 quality | 効果 |
|---------|-------------|------|
| ← もう1回 | 1 (Again) | ease_factor低下、1日後に再出題 |
| OK → | 3 (Good) | 通常の間隔延長 |

Phase 1は2段階で開始。ユーザーデータを見て「覚えたカードの出題頻度が高すぎる」問題が出た場合、3段階目（Easy = quality 5、右ロングスワイプ or ボタン）を追加。ReviewResult型は既存の4値（'again' | 'hard' | 'good' | 'easy'）を維持し、SwipePracticeからは'again' / 'good'のみ渡す。

### 保存タイミング（v1.1追加）

**1カード評価ごと即保存**（途中離脱でも進捗が失われない）。

```
スワイプ確定 → useCardProgress.reviewCard(templateId, result) → localStorage即書き込み
  → 同時に session snapshot を保存:
    {
      contextHash: hash(practiceContext),  // セッション識別
      currentIndex: number,
      remainingCardIds: string[],
      startedAt: string
    }

次回カードタブ訪問時:
  session snapshot が存在 → 「前回の続き（残りN枚）を再開する？」ダイアログ
  なし or 24時間以上経過 → 通常表示
```

### ゴーストヒント仕様（v1.1簡素化）

```
Phase 1は1段階のみ:
  1-5枚目: テキスト+アイコン opacity 0.7 でフェードイン（スワイプ中のみ）
  6枚目以降: 背景色変化のみ（テキスト/アイコン非表示）

永続化: localStorage 'swipe-hint-seen' = true/false
  初回セッション: ヒント表示
  2回目以降: ヒント非表示（背景色変化のみ）
```

### アクセシビリティ（v1.1追加）

```
キーボード操作:
  Space / Enter = フリップ
  ← = もう1回（Again）
  → = OK（Good）
  Z = アンドゥ（直前1手戻し）

ボタンフォールバック:
  フリップ後、カード下部に「もう1回」「OK」ボタンを常時表示
  スワイプ操作と併用可能（どちらでも評価できる）

ARIA:
  カード: role="article", aria-label="暗記カード {currentIndex}/{total}"
  進捗バー: role="progressbar", aria-valuenow, aria-valuemax
  結果: aria-live="polite" で「OK」「もう1回」を読み上げ

Reduced Motion:
  prefers-reduced-motion: reduce 時:
    3Dフリップ → 即切替（アニメーションなし）
    スワイプ飛び出し → フェードアウト
    完了画面のバウンス → 静止表示
```

### カード表示（v1.2更新: cloze形式追加）

| カードタイプ | 表面 | 裏面 |
|------------|------|------|
| **構造式 L0a**（名前→構造） | 物質名テキスト | SVG画像 + 英名 + ポイント解説 |
| **構造式 L0b**（構造→名前） | SVG画像 + 「この物質名は？」 | SVG画像 + 物質名 + ポイント解説 |
| **構造式 L1**（構造→物質名詳細） | SVG画像 + 構造特徴テキスト | SVG画像 + 物質名 + 詳細説明 |
| **構造式 L2**（物質名→特徴） | 物質名テキスト | SVG画像 + 構造的特徴3つ |
| **構造式 L3**（部分構造→分類） | テキスト問い | SVG画像 + 化合物群 |
| **テキスト cloze**（穴埋め、2,521枚） | `{{c1::答え}}` を `[____]` に置換表示 | 穴埋め箇所を**太字ハイライト**表示 + 全文 |
| **テキスト Q&A**（635枚） | テキスト問い | テキスト答え + ポイント解説 |
| **テキスト comparison**（352枚） | 比較問い（AとBの違いは？） | 比較表 or 箇条書き |
| **テキスト term_definition**（8枚） | 用語 | 定義 + ポイント解説 |

全構造式カードの裏面にSVG画像を表示（視覚記憶の強化）。

### Cloze形式レンダリング（v1.2追加）

2,521枚のclozeカードは `{{c1::答え}}` 形式。SwipeCardで以下のように表示:

```
表面（front）: テキスト中の {{c1::答え}} を [____] に置換
  例: 「タンパク質の[____]とは、アミノ酸の配列順序のことである。」

裏面（back）: {{c1::答え}} を太字+色付きで表示
  例: 「タンパク質の **一次構造** とは、アミノ酸の配列順序のことである。」
  色: var(--accent) で強調

複数穴: {{c1::A}} {{c2::B}} がある場合はc1のみ穴にし、c2はそのまま表示
  （1枚のカードで1つの知識をテスト = 想起テスト原則）
```

実装: `parseCloze(text: string)` 純粋関数でパース → テスト可能

### セッション制御

| 設定 | 値 |
|------|-----|
| デフォルト枚数 | 10枚 |
| 選択可能枚数 | 5 / 10 / 20 / 全部 |
| カード順序 | SM-2期限優先（due first）、同日内はランダム |
| カテゴリ練習 | 選択カテゴリ内からSM-2優先順で枚数分 |
| 初回カード | quality上限3にキャップ（Easyにならない） |
| 時間見積もり表示 | カード構成に応じて動的計算（L0: 4秒/枚、L1-L3: 8秒/枚、テキスト: 6秒/枚） |

### オフライン対応（v1.1追加）

```
SVGキャッシュ戦略:
  PWA Service Worker で public/images/structures/ を事前キャッシュ
  144ファイル × 平均10KB = 約1.5MB（SW precache許容範囲）

SVG取得失敗時のフォールバック:
  img onerror → SMILES文字列をテキスト表示（「構造式: CCO」のような簡易表示）
  カード練習自体は続行可能（テキスト面だけで評価）

カード進捗:
  localStorageベースのため完全オフライン対応済み
  Supabase同期はPhase 2（オンライン復帰時に差分同期）
```

### 性能設計（v1.1追加）

```
描画戦略:
  DOM上に存在するカード = 現在の1枚のみ
  次カードは state で保持、スワイプ確定後に差し替え
  SVGプリロード: current + next 2枚を <link rel="prefetch"> で先読み

メモ化:
  カードリストのフィルタ・ソート結果を useMemo で保持
  due計算は useCardProgress 内で既にメモ化済み

「全部」モード:
  cardIds配列のみ保持（軽量）、カードデータは1枚ずつtemplatesById.get()
  730枚でもメモリ増分は cardIds のstring配列分のみ

性能目標:
  初回表示: < 1.5秒
  ドラッグ中: 60fps維持
  カード遷移: < 100ms
```

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

1. **「もう1回」が1枚以上 かつ 関連問題が1件以上存在する場合のみ**: 「苦手だった{N}枚の関連問題を解いてみる」→ 該当カードのprimary_exemplar_id → LearningLinkService.getQuestionsForExemplar() → 演習ページへ。関連問題0件の場合はこのボタンを非表示（デッドリンク防止）
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

src/utils/
  └── cloze-parser.ts            # {{c1::答え}} のパース（表面用/裏面用）+ テスト

src/data/
  ├── onboarding-cards.ts        # チュートリアル固定5枚（テキスト2+構造式3）
  └── generated-cards/           # テキストカード3,516枚（9科目JSON + index.ts遅延ロード）
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

- `touchstart` / `touchmove` / `touchend` をcard ref に登録（タッチ検知）
- `mousedown` は card ref、`mousemove` / `mouseup` は `document` に登録（ドラッグ中にカード外に出ても追従）。cleanup で必ず `removeEventListener`
- `touch-action: none` でブラウザのデフォルトジェスチャーを無効化
- フリップ済みカードのみスワイプを受け付ける（表面ではスワイプ不可）
- **rAF最適化**: touchmove毎にstate更新せず、`useRef` + `requestAnimationFrame` でDOM直接更新。確定時（touchend）のみstate更新してre-render（ドラッグ中60fps維持）
- **斜めスワイプ除外**: `|deltaX| < |deltaY| * 2` の場合はスクロール意図としてスワイプ無視

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

## 9. 実装順序（v1.2更新）

```
Phase A: SwipePractice（練習画面のコア）
  1. cloze-parser.ts（{{c1::答え}} パース、テスト付き）
  2. useSwipeGesture フック（rAF最適化、斜めスワイプ除外）
  3. SwipeCard コンポーネント（2層構造: flip inner + swipe outer）
  4. GhostHint オーバーレイ
  5. SwipePractice 全体組み立て（ボタンフォールバック、a11y）
  6. PracticeComplete 完了画面（次アクション提案、ストリーク）

Phase B: FlashCardListPage（カードタブ）
  7. テキストカード遅延ロード統合（generated-cards/ dynamic import）
  8. Soft Companion リデザイン（Ant Design完全排除）
  9. サブカテゴリ表示（テキスト=科目別、構造式=カテゴリ別）
  10. 復習CTA + Chipフィルタ + 折りたたみ
  11. オンボーディング（チュートリアル5枚）

Phase C: 統合
  12. FlashCardPage 切替（TemplatePractice → SwipePractice）
  13. ホームからの復習導線確認
  14. 演習→付箋→カードの横断ナビ確認
  15. オフラインSVGキャッシュ確認
```
