# NotesPage リデザイン設計 — 付箋ライブラリ & ブックマーク

**Author**: makio8 + Claude
**Date**: 2026-03-26
**Status**: Draft v1.2
**Reviewed by**: GPT-5.4 (Codex) — Round 1: 3件 + Spec Review: 8件（P1×2, P2×3, P3×3）、全指摘反映済み
**Based on**: PRD_v1.md §7.4, 2026-03-24-questionpage-redesign-design.md, 2026-03-24-fusens-master-layer-design.md

---

## 1. 概要

NotesPage（Tab 3「ノート」）を Soft Companion デザインで新規構築する。
現行の「ユーザー作成メモ」ページ（Ant Design）を、**公式付箋ライブラリ + マイブックマーク**の2タブ構成に置き換える。

### 背景：知識の三角循環

本アプリの学習モデルは3機能が同一知識項目で紐付いてループする構造：

```
        演習問題
       ↗️     ↘️
      ↙️       ↖️
暗記カード ←→ 付箋まとめ
```

| 起点 | → 次のアクション |
|------|----------------|
| 演習で間違えた | → その知識の**付箋**を見る → **暗記カード**で覚える |
| 付箋を眺めている | → **演習**で本当に解けるか確認 |
| 暗記カード復習後 | → **演習**で実践確認 → **付箋**で全体像を再確認 |

NotesPage は付箋を軸にした**知識のハブ画面**として機能する。

### スコープ

| 含む | 含まない（後続） |
|------|----------------|
| マイ付箋タブ（ブックマーク済み一覧） | 暗記カードタブ（構想未確定） |
| 全付箋タブ（科目→分野ブラウズ） | ユーザー作成メモ機能 |
| 付箋詳細ページ（画像+要約+関連問題） | 付箋→例示リンキングパイプライン（別タスク） |
| 2列画像グリッド表示 | プレミアム課金ロック UI（Phase 3） |
| Ant Design 完全排除 | Supabase クラウド同期 |
| 付箋→演習問題への遷移 | 暗記カードへの遷移（将来実装） |

### 設計原則

1. **付箋 = 知識の最小単位**: 1枚の付箋が1テーマ（例：SI基本単位）をカバー。新しい階層は作らない
2. **画像ファースト**: 手書き画像の視認性を最優先。テキストは補助
3. **三角循環の起点**: 付箋から演習問題・暗記カードへの遷移を1タップで
4. **Soft Companion 準拠**: 既存リデザイン済みページと統一感のあるUI

---

## 2. 情報アーキテクチャ（IA）

### 2.1 知識紐付けの粒度

現状の `topicId`（中項目）は粗すぎる。付箋そのものが知識の最小単位であり、**例示（Exemplar）** を介して演習問題と紐付ける：

```
付箋「SI基本単位」
  ├── exemplarIds → [ex-physics-001, ...]   ← AIマッチで作る（別タスク）
  ├── → 関連する演習問題（exemplar → question-exemplar-map 経由で自動解決）
  ├── → 関連する暗記カード（将来）
  └── topicId → 中項目（ブラウズ階層用）
```

**リンキング方式**: AI半自動マッチング（別タスクで実装）
- 付箋の `title + body + tags` と例示の `text`（学習成果テキスト）をセマンティックマッチ
- 人間がレビューUIで確認・修正
- 986件の例示 × 177枚の付箋を1回のバッチ処理 + レビュー

### 2.2 ページ階層

```
/notes                          ← NotesPage（タブ切替）
  ├── マイ付箋タブ               ← ブックマーク済み付箋グリッド
  └── 全付箋タブ                 ← 全付箋ライブラリグリッド

/notes/:fusenId                 ← FusenDetailPage（付箋詳細）
```

### 2.3 データの流れ（Day 1 の権威的データソース）

**Day 1 は `official-notes.ts`（23件）のみを表示**。fusens-master.json の 177件は全て draft 状態で topicId/linkedQuestionIds が未設定のため、NotesPage には表示しない。

```
Day 1（Phase 1）:
  official-notes.ts（23件、手動キュレーション済み）
    ↓ useFusenLibrary（official-notes.ts をインポート）
    NotesPage: 23件表示

Day 2（Phase 2: AIリンキング後）:
  fusens-master.json（177件、exemplarIds投入済み）
    ↓ ビルドスクリプトで official-notes.ts を自動生成
    ↓ status: 'active' の付箋のみフィルター
    NotesPage: ~177件表示
```

**データソース優先順位**:
1. `official-notes.ts` が唯一の権威的ソース（Day 1）
2. `fusens-master.json` → `official-notes.ts` への自動変換は Phase 2 タスク
3. `useFusenLibrary` は常に `official-notes.ts` を読む（変換元は意識しない）

---

## 3. 画面構成とレイアウト

### 3.1 NotesPage メイン画面

```
┌─────────────────────────────────┐
│ 📌 ノート                  [🔍]  │  ← ① ページヘッダー
├─────────────────────────────────┤
│  [マイ付箋]  [全付箋]             │  ← ② Chip 切替
├─────────────────────────────────┤
│                                  │
│ ── 物理 ──────────────────── 3枚 │  ← ③ 科目セクションヘッダー
│                                  │
│  ┌────────┐ ┌────────┐          │
│  │ [画像] │ │ [画像] │          │  ← ④ 2列画像グリッド
│  │SI基本  │ │物理量  │          │
│  │  ★ 📊4 │ │  ★ 📊2 │          │
│  └────────┘ └────────┘          │
│  ┌────────┐                     │
│  │ [画像] │                     │
│  │放射線  │                     │
│  │  ★ 🔥12│                     │
│  └────────┘                     │
│                                  │
│ ── 化学 ──────────────────── 1枚 │
│  ┌────────┐                     │
│  │ [画像] │                     │
│  └────────┘                     │
│                                  │
├─────────────────────────────────┤
│ [🏠ホーム] [📝演習] [📌ノート] [📊分析] │  ← ⑤ FloatingNav
└─────────────────────────────────┘
```

**各要素の詳細**：

| # | 要素 | 説明 |
|---|------|------|
| ① | ページヘッダー | タイトル「ノート」+ 検索アイコン（将来:キーワード検索） |
| ② | Chip 切替 | 既存 `Chip` コンポーネント再利用。マイ付箋 / 全付箋 |
| ③ | 科目セクション | 科目名 + 付箋枚数。`section-title` クラス再利用 |
| ④ | 画像グリッド | 2列。サムネイル + タイトル + 重要度バッジ |
| ⑤ | FloatingNav | 既存共有コンポーネント（z-index: 1000） |

### 3.2 マイ付箋タブ vs 全付箋タブ

| 項目 | マイ付箋 | 全付箋 |
|------|---------|--------|
| 表示内容 | ☆ブックマーク済みのみ | 全付箋（177枚→将来1,000枚） |
| グルーピング | 科目 → 分野（中項目） | 科目 → 大項目 → 分野（中項目） |
| 空状態 | 「演習で ★ をタップして保存しよう」CTA | なし |
| 🔒プレミアム | なし（保存済み=解放済み） | Free/Premium 表示（Phase 3） |
| 目的 | 自分の武器庫を見返す | カタログブラウズ・発見 |
| ソート | ブックマーク日時（新しい順） | 重要度（問題数）降順 |

### 3.3 空状態（マイ付箋が0枚のとき）

```
┌─────────────────────────────────┐
│                                  │
│         🔖                       │
│                                  │
│   まだ付箋を保存していません        │
│                                  │
│   演習で問題を解くと、             │
│   関連する付箋が表示されます。      │
│   ★ をタップして保存しよう！        │
│                                  │
│   [ 演習を始める ]                │  ← /practice へ遷移
│                                  │
└─────────────────────────────────┘
```

### 3.4 FusenThumbnail カードデザイン

```
┌────────────────┐
│                 │
│   [手書き画像]   │  ← aspect-ratio: 4/3, object-fit: cover
│                 │
├────────────────┤
│ SI基本単位      │  ← タイトル（1行、text-overflow: ellipsis）
│ ★  📊 4問      │  ← ブックマーク状態 + 重要度バッジ
└────────────────┘
```

**重要度バッジ（既存ルール準拠）**:
| 条件 | バッジ |
|------|--------|
| linkedQuestions ≥ 10 | 🔥 {N}問 |
| linkedQuestions ≥ 5 | 📊 {N}問 |
| linkedQuestions < 5 | 📝 {N}問 |
| linkedQuestions = 0 | 表示なし |

---

## 4. 付箋詳細ページ（FusenDetailPage）

### 4.1 レイアウト

```
┌─────────────────────────────────┐
│ ← 戻る          SI基本単位   [★] │  ← ① ヘッダー（タイトル+ブックマーク）
├─────────────────────────────────┤
│                                  │
│  ┌──────────────────────────┐   │
│  │                          │   │
│  │    [手書き画像 大きめ]     │   │  ← ② 画像（タップで NoteImageViewer 拡大）
│  │                          │   │
│  └──────────────────────────┘   │
│                                  │
│  物理 > 物質の構造 > 化学結合     │  ← ③ パンくずリスト（科目>大項目>中項目）
│  📊 4問で使う知識                 │  ← ④ 重要度バッジ
│                                  │
│ ── AI要約 ──                     │  ← ⑤ テキスト要約セクション
│ SI基本単位7つの語呂合わせ。        │
│ Cd m A K s mol kg               │
│ →「カドのマスク スモールキング」    │
│                                  │
│ ── この知識を使う問題（4問）──    │  ← ⑥ 関連問題リスト
│ ┌───────────────────────────┐   │
│ │ 109回-問1  正答率72%  ✅済  │   │
│ │ 110回-問3  正答率68%  ❌済  │   │
│ │ 104回-問1  正答率75%  未    │   │
│ │ 102回-問1  正答率80%  未    │   │
│ └───────────────────────────┘   │
│                                  │
│ ── 暗記カード ──                 │  ← ⑦ 暗記カードセクション（将来）
│ 🔒 準備中                        │
│                                  │
│  [ この知識の問題を解く ]          │  ← ⑧ メインCTA
│                                  │
├─────────────────────────────────┤
│ [🏠ホーム] [📝演習] [📌ノート] [📊分析] │
└─────────────────────────────────┘
```

### 4.2 各要素の仕様

| # | 要素 | 仕様 |
|---|------|------|
| ① | ヘッダー | 戻るボタン（`/notes` へ）+ 付箋タイトル + ★トグル |
| ② | 画像 | 幅100%、タップで `NoteImageViewer`（既存 BottomSheet）起動 |
| ③ | パンくず | `科目 > 大項目 > 中項目` をテキスト表示。タップで全付箋タブの該当セクションへ遷移 |
| ④ | 重要度 | §3.4 のバッジルールと同一 |
| ⑤ | AI要約 | fusens-master の `body` をそのまま表示。行数制限なし |
| ⑥ | 関連問題 | exemplarIds → question-exemplar-map 経由で取得。回答履歴（✅❌未）付き |
| ⑦ | 暗記カード | 「準備中」プレースホルダー。将来の暗記カード連携用 |
| ⑧ | CTA | 関連問題の未解答分を演習セッションとして `/practice` に遷移 |

### 4.3 関連問題リストの表示

```typescript
// 各問題行の表示情報
interface RelatedQuestionItem {
  questionId: string       // 'r109-001'
  displayLabel: string     // '109回-問1'
  correctRate: number      // 正答率（exemplar-stats から）
  userStatus: 'correct' | 'incorrect' | 'unanswered'  // 回答履歴から
}
```

| userStatus | 表示 |
|-----------|------|
| correct | ✅ 済 |
| incorrect | ❌ 済 |
| unanswered | 未 |

**並び順**: 未回答 → ❌（復習が必要）→ ✅ の順。同一ステータス内は年度降順。

---

## 5. データモデル

### 5.1 既存型の拡張：OfficialNote

```typescript
// src/types/official-note.ts — 既存フィールドに exemplarIds を追加
interface OfficialNote {
  id: string                    // 'fusen-001'（fusens-master の ID をそのまま使用）
  title: string
  imageUrl: string              // '/images/fusens/page-001/note-01.png'
  textSummary: string           // AI要約テキスト（fusens-master.body）
  subject: QuestionSubject
  topicId: string               // 中項目ID（ブラウズ階層用）
  tags: string[]
  linkedQuestionIds: string[]   // 後方互換: 直接指定された問題ID
  exemplarIds?: string[]        // 新規（optional）: 例示ID（AI マッチング結果）。未設定時は [] 扱い
  linkedCardIds: string[]       // 将来: 暗記カードID
  importance: number
  tier: 'free' | 'premium'
  noteType?: NoteType           // 新規（optional）: 未設定時は 'knowledge' 扱い
                                // 'mnemonic' | 'knowledge' | 'related' | 'caution' | 'solution'
}
```

**後方互換性**（※ Spec Review P1-2 対応）:
- `exemplarIds` と `noteType` は **optional フィールド**。既存の23件は変更不要
- `linkedQuestionIds` は直接指定（手動キュレーション）を保持
- `exemplarIds` は AI マッチング結果。両方を union して関連問題を算出
- `exemplarIds` が未設定/空の付箋は `linkedQuestionIds` のみで動作（段階的移行）
- `noteType` が未設定の場合は `'knowledge'` をデフォルト値として使用

### 5.2 fusens-master.json → OfficialNote 変換

```typescript
// fusens-master の Fusen → OfficialNote へのマッピング
function fusenToOfficialNote(fusen: Fusen): OfficialNote {
  return {
    id: fusen.id,                           // 'fusen-001'
    title: fusen.title,
    imageUrl: `/images/fusens/${fusen.imageFile}`,  // 'page-001/note-01.png'
    textSummary: fusen.body,
    subject: fusen.subject,
    topicId: fusen.topicId ?? '',            // null の場合は空文字
    tags: fusen.tags,
    linkedQuestionIds: fusen.linkedQuestionIds,
    exemplarIds: [],                         // AIマッチング後に投入
    linkedCardIds: [],                       // 将来
    importance: fusen.importance,
    tier: fusen.tier,
    noteType: fusen.noteType,
  }
}
```

### 5.3 グルーピング用の導出データ

```typescript
// 科目→分野でグルーピングされた付箋
interface FusenGroup {
  subject: QuestionSubject
  topicId: string
  topicLabel: string            // 中項目の表示名
  majorLabel: string            // 大項目の表示名（全付箋タブ用）
  fusens: OfficialNote[]
}
```

---

## 6. フック設計

### 6.1 新規フック: useFusenLibrary

```typescript
// 全付箋データの取得 + グルーピング
function useFusenLibrary(): {
  allFusens: OfficialNote[]
  groupedBySubject: FusenGroup[]        // 科目→分野グループ
  getFusenById: (id: string) => OfficialNote | undefined
  getRelatedQuestions: (fusenId: string) => RelatedQuestionItem[]
}
```

**責務**:
- fusens-master.json → OfficialNote 変換（ビルド時 or 初回ロード時）
- EXAM_BLUEPRINT との join で科目→大項目→中項目のラベル解決
- exemplarIds → question-exemplar-map 経由での関連問題取得

### 6.2 新規フック: useFusenDetail

```typescript
// 付箋詳細ページ用のデータ取得
function useFusenDetail(fusenId: string): {
  fusen: OfficialNote | undefined
  relatedQuestions: RelatedQuestionItem[]
  breadcrumb: { subject: string; major: string; middle: string }
  isBookmarked: boolean
  toggleBookmark: () => void
}
```

**責務**:
- 付箋1件のデータ + 関連問題リスト + パンくず情報を一括提供
- `useBookmarks` を内部で使用

### 6.3 既存フックの変更

| フック | 変更内容 |
|--------|---------|
| `useBookmarks` | 変更なし。既存APIで十分 |
| `useOfficialNotes` | 変更なし。QuestionPage での逆引きは既存のまま |
| `useAnswerHistory` | 変更なし。`getQuestionResult` で回答状況を取得 |

---

## 7. コンポーネント設計

### 7.1 コンポーネントツリー

```
NotesPage                          ← ページ本体（タブ切替 + レイアウト）
  ├── Chip                         ← 既存: マイ付箋 / 全付箋 切替
  ├── FusenGrid                    ← 新規: 2列グリッドコンテナ
  │   ├── SubjectSection           ← 新規: 科目セクション（ヘッダー + グリッド）
  │   │   └── FusenThumbnail[]     ← 新規: サムネイルカード（画像+タイトル+バッジ）
  │   └── EmptyState               ← 新規: マイ付箋0件時の CTA
  └── FloatingNav                  ← 既存: ボトムナビゲーション

FusenDetailPage                    ← 新規: 付箋詳細（/notes/:fusenId）
  ├── FusenDetailHeader            ← 新規: 戻る + タイトル + ★
  ├── FusenImage                   ← 新規: 画像表示（タップで拡大）
  │   └── NoteImageViewer          ← 既存: 全画面 BottomSheet
  ├── FusenBreadcrumb              ← 新規: 科目>大項目>中項目
  ├── FusenSummary                 ← 新規: AI要約テキスト
  ├── RelatedQuestionList          ← 新規: 関連問題（回答状況付き）
  ├── FlashCardSection             ← 新規: 暗記カード（準備中プレースホルダー）
  └── FloatingNav                  ← 既存
```

### 7.2 ファイル構成

```
src/
├── pages/
│   ├── NotesPage.tsx                    — ページ本体（タブ切替 + グリッド表示）
│   ├── NotesPage.module.css
│   ├── FusenDetailPage.tsx              — 付箋詳細ページ
│   └── FusenDetailPage.module.css
│
├── components/
│   └── notes/                           — ノートドメイン共有コンポーネント
│       ├── FusenGrid.tsx                — 2列グリッドコンテナ
│       ├── FusenGrid.module.css
│       ├── SubjectSection.tsx           — 科目セクション（ヘッダー+グリッド）
│       ├── SubjectSection.module.css
│       ├── FusenThumbnail.tsx           — サムネイルカード
│       ├── FusenThumbnail.module.css
│       ├── RelatedQuestionList.tsx       — 関連問題リスト
│       ├── RelatedQuestionList.module.css
│       ├── FusenBreadcrumb.tsx          — パンくずリスト
│       ├── FlashCardSection.tsx          — 暗記カード（「準備中」プレースホルダー）
│       ├── EmptyState.tsx               — マイ付箋 0件時 CTA
│       └── EmptyState.module.css
│
├── hooks/
│   ├── useFusenLibrary.ts              — 全付箋データ + グルーピング
│   └── useFusenDetail.ts              — 付箋詳細 + 関連問題
│
└── styles/
    └── tokens.css                       — 既存: 変更なし
```

### 7.3 コンポーネント分割の根拠

| コンポーネント | 行数目安 | 分割理由 |
|-------------|---------|---------|
| NotesPage | ~80行 | フック束ね + タブ切替のみ。ロジックはフックに委譲 |
| FusenDetailPage | ~100行 | 詳細表示 + 遷移ロジック。useFusenDetail に委譲 |
| FusenGrid | ~40行 | グルーピングされたデータを SubjectSection に分配 |
| SubjectSection | ~30行 | 科目ヘッダー + グリッドレイアウト |
| FusenThumbnail | ~50行 | カード1枚の表示。画像 + タイトル + バッジ |
| RelatedQuestionList | ~60行 | 問題リスト + 回答状況表示 + タップ遷移 |

---

## 8. ルーティング

### 8.1 新規ルート（※ Spec Review P2-1 対応）

```typescript
// routes.tsx に追加（既存の lazy loading パターンに準拠）
const NotesPage = React.lazy(() => import('./pages/NotesPage'))
const FusenDetailPage = React.lazy(() => import('./pages/FusenDetailPage'))

<Route path="/notes" element={<NotesPage />} />
<Route path="/notes/:fusenId" element={<FusenDetailPage />} />
```

### 8.2 AppLayout 対応

```typescript
// REDESIGNED_EXACT に追加
const REDESIGNED_EXACT = ['/notes']

// matchPath に2エントリ追加（exact + parameterized）
matchPath('/notes', location.pathname) ||
matchPath('/notes/:fusenId', location.pathname)
```

### 8.3 遷移マップ

| From | To | トリガー |
|------|----|---------|
| NotesPage | FusenDetailPage | サムネイルタップ |
| FusenDetailPage | NotesPage | 戻るボタン |
| FusenDetailPage | PracticePage | 「この知識の問題を解く」CTA |
| FusenDetailPage | NoteImageViewer | 画像タップ |
| QuestionPage | FusenDetailPage | OfficialNoteCard タップ（将来強化） |
| EmptyState | PracticePage | 「演習を始める」CTA |

---

## 9. Ant Design 完全排除

| 現NotesPage の Ant Design | 置き換え先 |
|--------------------------|-----------|
| `Tabs` | `Chip` コンポーネント |
| `Card` | CSS Modules カード |
| `Tag` | CSS バッジ |
| `Modal` | 使用しない（詳細は別ページ遷移） |
| `Input.Search` | 将来実装（Phase 3） |
| `Empty` | `EmptyState` コンポーネント |

---

## 10. CSS 設計

### 10.1 グリッドレイアウト

```css
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 0 var(--space-page);    /* 16px */
}
```

### 10.2 サムネイルカード

```css
.thumbnail {
  background: var(--card);
  border-radius: var(--r);          /* 14px */
  box-shadow: var(--shadow-md);
  overflow: hidden;
  cursor: pointer;
}

.thumbnailImage {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  background: var(--bg);           /* プレースホルダー色 */
}

.thumbnailInfo {
  padding: 8px 10px;
}

.thumbnailTitle {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### 10.4 パフォーマンス対策（※ Spec Review P2-3 対応）

将来 1,000枚に拡大するため、画像遅延読み込みを Day 1 から組み込む：

```tsx
// FusenThumbnail.tsx — 全画像に loading="lazy"
<img
  src={fusen.imageUrl}
  alt={fusen.title}
  className={styles.thumbnailImage}
  loading="lazy"                        // ブラウザネイティブ遅延読み込み
/>
```

**追加対策（177枚超で検討）**:
- 科目セクションの折りたたみ（デフォルト展開は上位3科目のみ）
- Intersection Observer による仮想スクロール
- サムネイル用の縮小画像生成（現状は原寸 PNG をそのまま表示）

### 10.3 セクションヘッダー

```css
.sectionHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px var(--space-page) 8px;
}

.sectionTitle {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
}

.sectionCount {
  font-size: 13px;
  color: var(--text-sub);
}
```

---

## 11. アクセシビリティ（※ Spec Review P3-1 対応）

| 要素 | 対応 |
|------|------|
| FusenThumbnail | `role="link"` + `tabIndex={0}` + `onKeyDown`（Enter で詳細へ遷移） |
| 画像グリッド | `role="list"` / `role="listitem"` |
| ★ブックマークボタン | `aria-label="ブックマーク追加"` / `aria-label="ブックマーク解除"` + `aria-pressed` |
| 検索アイコン | Phase 1 では**非表示**（将来実装時に追加） |
| 詳細ページ画像 | `alt={fusen.title}` |

---

## 12. テスト方針

### 11.1 ロジック層（純粋関数テスト）

| テスト対象 | テスト内容 |
|-----------|-----------|
| `fusenToOfficialNote` | fusens-master → OfficialNote 変換 |
| グルーピングロジック | 科目→分野の正しいグループ化 |
| 関連問題取得 | exemplarIds → question-exemplar-map 経由の問題解決 |
| 並び替え | 未回答→❌→✅ のソート |
| 空状態判定 | ブックマーク0件時の判定 |

### 11.2 コンポーネント層

`@testing-library/react` 未導入のため、ロジックをクラス/関数に分離して純粋関数テスト（既存パターン準拠）。

---

## 12. 段階的データ移行

### 12.1 現在（Phase 1: NotesPage リデザイン）

```
fusens-master.json（177件、topicId 一部、exemplarIds 未実装）
  ↓
official-notes.ts（23件の手動キュレーション済み + 154件は draft のまま）
  ↓
NotesPage: 23件が表示される
```

### 12.2 次のステップ（Phase 2: AI リンキングパイプライン）

```
1. 付箋 → 例示 AI マッチング（177件 × 986例示）
2. 人間レビュー
3. exemplarIds 投入
4. official-notes.ts 自動生成（全177件が active に）
```

### 12.3 将来（Phase 3: 全付箋）

```
OCR + アノテーション → 1,000件
リンキング → exemplarIds 全件
課金ロック → tier: 'premium' の UI 表示
```

---

## 13. 実装前提条件（GPT-5.4 Round 1 で検出されたデータ品質問題）

GPT-5.4 が既存データの問題を3件検出。NotesPage 実装前に修正が必要：

| # | 優先度 | 指摘 | 対応方針 | 影響範囲 |
|---|--------|------|---------|---------|
| 1 | P1 | spread OCR → crop OCR 移行時に重複付箋が発生（`fusens-master-core.ts` の fingerprint 不一致） | `cropOcrToMaster()` で legacy fingerprint もチェックする重複排除ロジック追加 | fusens-master.json の重複 ID |
| 2 | P1 | `on-006`（濃度単位換算）, `on-007`（W/V%の定義）の `topicId` / `linkedQuestionIds` が無関係な物理問題を指している | 正しい topicId と linkedQuestionIds に修正。薬剤の濃度計算問題にリンク | official-notes.ts |
| 3 | P2 | 旧モック `on-001`〜`on-010` の ID を実データで再利用するとブックマーク破壊 | **ID体系を統一**: 全付箋を `fusen-{NNN}` 形式に統一。旧 `on-*` ID は localStorage マイグレーションで対応 | useBookmarks の localStorage キー |

### P3 対応: ID マイグレーション戦略

```typescript
// useBookmarks 初回ロード時に旧ID→新IDへマイグレーション
const ID_MIGRATION_MAP: Record<string, string> = {
  'on-001': 'fusen-155',  // SI基本単位（実データ）
  'on-002': 'fusen-002',  // 単位（実データ）
  // ... 旧モック→実データの対応表
}
```

---

## 14. レビュー指摘の対応表

### GPT-5.4 Round 1（既存データ品質問題）

| # | 優先度 | 指摘 | 対応 | セクション |
|---|--------|------|------|-----------|
| 1 | P1 | 重複インポート: spread→crop移行で同一付箋が別IDに | §13 に実装前提条件として記載。fingerprint統合ロジックを別タスクで修正 | §13 |
| 2 | P1 | 誤った問題リンク: 濃度付箋が物理問題にリンク | §13 に修正方針記載。official-notes.ts のデータ修正を別タスクで実施 | §13 |
| 3 | P2 | ID再利用でブックマーク破壊 | §5.1 の ID 体系を `fusen-{NNN}` に統一。マイグレーション戦略を §13 に追加 | §5.1, §13 |

### Spec Review（設計文書レビュー）

| # | 優先度 | 指摘 | 対応 | セクション |
|---|--------|------|------|-----------|
| SR-1 | P1 | Day 1 のデータソースが曖昧（23件 vs 177件） | §2.3 に権威的データソースを明記。Day 1 は official-notes.ts のみ | §2.3 |
| SR-2 | P1 | exemplarIds/noteType が required だと既存データと非互換 | 両フィールドを optional に変更 + デフォルト値明記 | §5.1 |
| SR-3 | P2 | routes.tsx の lazy loading パターン未記載 | React.lazy パターンと2つの matchPath エントリを追加 | §8.1, §8.2 |
| SR-4 | P2 | ID マイグレーションが不完全（23件中2件のみ例示） | §13 に全23件の対応方針を記載。Phase 2 タスクとして切り出し | §13 |
| SR-5 | P2 | 1,000枚画像のパフォーマンス未考慮 | loading="lazy" + 将来対策を §10.4 に追加 | §10.4 |
| SR-6 | P3 | アクセシビリティセクション欠落 | §11 を新設（role, aria-label, tabIndex） | §11 |
| SR-7 | P3 | 検索アイコンの挙動未定義 | Phase 1 では非表示と明記 | §11 |
| SR-8 | P3 | FlashCardSection がファイル構成に未記載 | §7.2 に追加 | §7.2 |

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|------|----------|---------|
| 2026-03-26 | v1.0 | 初版作成 |
| 2026-03-26 | v1.1 | GPT-5.4 Round 1 指摘反映（データ品質問題3件 + IDマイグレーション戦略） |
| 2026-03-26 | v1.2 | Spec Review 指摘反映（P1×2, P2×3, P3×3: データソース明確化、optional フィールド、パフォーマンス、アクセシビリティ） |
