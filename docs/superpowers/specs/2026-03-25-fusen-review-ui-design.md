# 付箋レビューUI 設計

## 概要

OCR生成された付箋データ（fusens-master.json）の品質を人間がレビュー・修正するための開発者ツール。既存の問題レビューUI（`src/dev-tools/review/`）と同じアーキテクチャパターンで構築する。

**dev-only**（`import.meta.env.DEV` 時のみロード、本番バンドルに含まない）。

## 機能スコープ

### 含む
1. **切り抜き範囲の調整（bbox）** — ページ画像上でbboxをドラッグ調整
2. **テキスト・タグの修正** — title / body / tags / subject / noteType の編集
3. **OK/NG判定** — draft → active / archived / duplicate のステータス変更

### 含まない（後フェーズ）
- topicId マッピングUI（AIで自動マッピング後に別途レビュー）
- リアルタイム切り抜きプレビュー（エクスポート後にバッチ処理）
- 複数ユーザー対応

## レイアウト

2カラム構成（既存の問題レビューUIと統一）。

```
┌─────────────────────────────────────────────────────┐
│ Header: フィルター + 進捗バー + fusen-NNN / N件     │
├──────────────────────┬──────────────────────────────┤
│                      │ 付箋カード                    │
│  ページ画像ビューア    │  ├ 切り抜きプレビュー         │
│                      │  ├ メタデータ (id/subject/type)│
│  • A3見開き全体を表示  │  ├ title (編集可)            │
│  • 全bboxを薄い枠で表示│  ├ body (編集可)             │
│  • 選択中のbboxを強調  │  ├ tags (編集可)             │
│  • ドラッグでbbox調整  │  └ 判定ボタン [1][2][3]      │
│                      │                              │
│                      │ 編集パネル (折りたたみ)        │
│                      │  ├ subject ドロップダウン      │
│                      │  ├ noteType ドロップダウン     │
│                      │  └ メモ欄                     │
├──────────────────────┴──────────────────────────────┤
│ キーボードヘルプ (? で表示)                           │
└─────────────────────────────────────────────────────┘
```

## データフロー

```
fusens-master.json
  ↓ fetch（開発サーバー経由）
FusenReviewPage（状態管理）
  ↓
localStorage に一時保存（judgments / corrections / bbox調整）
  ↓
エクスポート（E キー）→ fusen-corrections-YYYY-MM-DD.json
  ↓
scripts/apply-fusen-corrections.ts → fusens-master.json 更新 + 画像再切り抜き
```

### なぜ localStorage + エクスポート方式か

既存の問題レビューUIと同じ理由：
- fusens-master.json を直接書き換えると、devサーバーのHMRで画面がリロードされる
- localStorage なら即座に反映され、ブラウザを閉じても保持される
- エクスポートしてスクリプトで適用する方が安全（バックアップ可能）

## コンポーネント構成

```
src/dev-tools/fusen-review/
├── FusenReviewPage.tsx          # オーケストレーター（状態管理 + レイアウト）
├── FusenReviewPage.module.css   # ページスタイル
├── types.ts                     # レビュー固有の型定義
│
├── hooks/
│   ├── useFusenData.ts          # fusens-master.json の読み込み
│   ├── useFusenReviewState.ts   # localStorage 永続化（judgments / corrections）
│   └── useFusenKeyboardNav.ts   # 付箋レビュー用キーボードハンドラ（新規作成）
│
└── components/
    ├── FusenReviewHeader.tsx     # フィルター + 進捗バー
    ├── PageImageViewer.tsx       # ページ画像 + bbox オーバーレイ
    ├── BboxEditor.tsx            # bbox ドラッグ調整オーバーレイ
    ├── FusenCard.tsx             # 付箋カード（プレビュー + メタデータ + 判定）
    ├── FusenEditPanel.tsx        # テキスト・タグ編集（折りたたみパネル）
    └── KeyboardHelp.tsx          # ショートカット一覧モーダル
```

## 各コンポーネントの責務

### FusenReviewPage（オーケストレーター）

**状態:**
- `currentIndex` — 現在表示中の付箋のインデックス
- `filters` — 科目 / ステータス / 判定状態でフィルター
- `bboxEditMode` — bbox調整モード ON/OFF
- `editPanelOpen` — 編集パネルの開閉

**データフロー:**
1. `useFusenData()` で fusens-master.json を読み込み
2. フィルター適用 → `filteredFusens` を算出（useMemo）
3. `currentFusen = filteredFusens[currentIndex]`
4. 子コンポーネントに渡す

### useFusenData

`fusens-master.json` を fetch して `FusenMaster` として返す。

ファイルは `public/data/fusens/fusens-master.json` に配置（`src/data/` だとViteのモジュール変換が入るため）。ビルドスクリプトの出力先を変更するか、`cp` でコピーする。

```typescript
const res = await fetch('/data/fusens/fusens-master.json')
if (!res.ok) throw new Error('fusens-master.json not found. Run: npx tsx scripts/build-fusens-master.ts')
const data: FusenMaster = await res.json()
```

**エラーハンドリング:**
- 404（ファイル未生成）→ 「OCRパイプラインを先に実行してください」メッセージ表示
- JSONパースエラー → エラー表示
- fusens が空オブジェクト → 「レビュー対象がありません」表示

### useFusenReviewState

既存 `useReviewState` と同じパターン。localStorage キー: `fusen-review-v1`。

```typescript
interface FusenReviewState {
  version: 1                                              // マイグレーション用
  judgments: Record<string, 'ok' | 'needs-fix' | 'ng'>   // fusenId → 判定
  corrections: Record<string, FusenCorrection[]>          // fusenId → 修正リスト（bbox含む）
  lastPosition: string       // 最後に見ていた fusenId（ページ復帰時に使用）
  updatedAt: string
}
```

**`lastPosition` の復元:** `FusenReviewPage` 初期化時に `lastPosition` から `filteredFusens` 内のインデックスを算出して `currentIndex` にセットする。見つからなければ 0。

**`bboxAdjustments` は廃止。** bbox変更は `FusenCorrection` の `{ type: 'bbox' }` として corrections に統一保存する（既存レビューUIの `image-crop` と同じ方式）。BboxEditor内のドラッグ中はコンポーネントローカルstateで管理し、mouseup時にcorrectionsに確定保存。

### FusenCorrection 型

```typescript
type FusenCorrection =
  | { type: 'title'; value: string }
  | { type: 'body'; value: string }
  | { type: 'tags'; value: string[] }
  | { type: 'subject'; value: QuestionSubject }
  | { type: 'noteType'; value: NoteType }
  | { type: 'bbox'; value: [number, number, number, number] }
  | { type: 'notes'; value: string }  // 運用メモ
```

**注:** `status` 型は削除。ステータス変更は `judgments` マッピング（ok→active, ng→archived）で一元管理する。

### PageImageViewer

**役割:** ページ画像の表示 + bbox オーバーレイ

- ページ画像: `public/images/fusens/pages/page-NNN.png` から配信
  - OCR完了後に `cp /tmp/claude/fusens/pages/page-*.png public/images/fusens/pages/` でコピー済み前提
  - Vite devサーバーが `public/` を静的配信するので追加設定不要
- 全付箋の bbox を薄い枠で表示（同一ページの兄弟ノート）
- 選択中の付箋の bbox を太枠 + 半透明ハイライト
- bbox をクリックすると、その付箋にジャンプ

**実装:**
```typescript
// bboxは正規化座標(0-1000) → CSS %に変換して absolute positioned div
const style = {
  left: `${x1 / 10}%`,
  top: `${y1 / 10}%`,
  width: `${(x2 - x1) / 10}%`,
  height: `${(y2 - y1) / 10}%`,
}
```

### BboxEditor

**役割:** bbox のドラッグ調整

- PageImageViewer の上にオーバーレイとして配置
- 4つの角 + 4つの辺をドラッグ可能（リサイズハンドル）
- ドラッグ中はコンポーネントローカルstate で枠をリアルタイム更新
- マウスアップ時に確定値を `FusenCorrection { type: 'bbox' }` として corrections に保存
- **境界クランプ:** 全座標を `[0, 1000]` の範囲に制限。ドラッグ中も画像外にはみ出さない
- **pointer-events:** bboxEditMode OFF時はオーバーレイに `pointer-events: none` を設定し、画像のスクロール・拡大を阻害しない
- `b` キーでモードON/OFF

### FusenCard

**役割:** 付箋のメタデータ表示 + 判定ボタン

表示内容:
- 切り抜き画像プレビュー（`public/images/fusens/page-NNN/note-NN.png`）
- ID + 科目 + 分類（バッジ）
- title（テキスト表示、クリックで編集パネルへ）
- body（折りたたみ表示）
- tags（チップ表示）
- 判定ボタン: OK[1] / Fix[2] / NG[3] / Reset[0]
- ナビゲーション: ← Prev / Next →

### FusenEditPanel

**役割:** テキスト・タグの編集フォーム（折りたたみ）

- title: テキスト入力
- body: テキストエリア
- tags: コンマ区切り入力
- subject: 9科目ドロップダウン
- noteType: 6タイプドロップダウン
- status: 4ステータスドロップダウン
- メモ: テキストエリア
- 「適用」ボタン → FusenCorrection として保存

### FusenReviewHeader

**役割:** フィルター + 進捗表示

フィルター:
- 科目: チェックボックス（9科目）
- ステータス: draft / active / archived / duplicate
- 判定状態: pending / ok / needs-fix / ng / all
- 検索: title / tags でテキスト検索

進捗:
- OK / Fix / NG / Pending のカウント + 色付きプログレスバー
- 現在位置: `fusen-042 / 154件`

## キーボードショートカット

既存レビューUIと統一。`useKeyboardNav` のactionsRefパターンを踏襲。

| キー | 操作 |
|------|------|
| `j` / `→` | 次の付箋 |
| `k` / `←` | 前の付箋 |
| `1` | OK（active） |
| `2` | 要修正（needs-fix） |
| `3` | NG（archived） |
| `0` | 判定リセット |
| `g` | 次の未判定にジャンプ |
| `c` | 編集パネル開閉 |
| `b` | bbox調整モード ON/OFF |
| `e` | エクスポート |
| `?` | ショートカットヘルプ |
| `/` | 検索フォーカス |

## エクスポート形式

```json
{
  "version": "1.0.0",
  "timestamp": "2026-03-25T...",
  "corrections": {
    "fusen-001": {
      "judgment": "ok",
      "items": [
        { "type": "bbox", "value": [90, 60, 195, 300] }
      ]
    },
    "fusen-007": {
      "judgment": "needs-fix",
      "items": [
        { "type": "title", "value": "ppmと%の換算" },
        { "type": "subject", "value": "物理" }
      ]
    }
  }
}
```

## 適用スクリプト

`scripts/apply-fusen-corrections.ts`

```
入力: fusen-corrections-YYYY-MM-DD.json + fusens-master.json
出力: fusens-master.json（更新） + 画像再切り抜き（bbox変更分）

Usage:
  npx tsx scripts/apply-fusen-corrections.ts corrections.json
```

処理:
1. corrections JSON を読み込み
2. fusens-master.json の該当エントリを更新
3. judgment → status マッピング: ok→active, ng→archived
4. bbox 変更があれば sharp で再切り抜き
5. reviewedAt を現在時刻に設定
6. fusens-master.json をアトミック書き込み

## ルーティング

```typescript
// src/routes.tsx に追加
const FusenReview = import.meta.env.DEV
  ? React.lazy(() => import('./dev-tools/fusen-review/FusenReviewPage'))
  : null

// path: '/dev-tools/fusen-review'
```

## ページ画像の配信

ページ画像は `/tmp/claude/fusens/pages/` にあるが、Vite devサーバーからは直接配信できない。

**方法:** `public/images/fusens/` に既に切り抜き画像がある。ページ全体画像もここにコピーする。

```bash
# OCR実行後に全体画像もpublicにコピー
cp /tmp/claude/fusens/pages/page-*.png public/images/fusens/pages/
```

これにより `/images/fusens/pages/page-001.png` でアクセス可能になる。

## 技術的制約

- CSS Modules（プロジェクト全体のパターン）
- React 19 + TypeScript 5.9
- Vite 8 devサーバー
- デザイントークン: `src/styles/tokens.css` の CSS変数を使用
- Soft Companion デザインシステムに準拠（ただしdev-toolsは簡素でOK）
