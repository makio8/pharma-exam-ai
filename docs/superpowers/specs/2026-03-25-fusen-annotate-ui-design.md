# 付箋アノテーションUI設計（Phase 2a）

## 背景と動機

既存のOCRパイプライン（Gemini 2.5 Flash）のbbox検出精度が不十分。
切り抜きが不正確だとOCRテキストも劣化するため、**人間がbboxを描画してから**OCR再実行する方針に転換。

### 旧パイプライン（廃止）

```
Gemini bbox検出 → 人間が修正 → OCR
```

### 新パイプライン

```
人間がbbox描画 → 切り抜き → OCR → テキスト確認 → トピック紐付け
                ^^^^^^^^^^
                今回のスコープ（Phase 2a）
```

## スコープ

### やること

| 成果物 | 説明 |
|--------|------|
| `scripts/split-pages.ts` | 見開き画像→左右分割の一括生成 |
| `/dev-tools/fusen-annotate` | ページ画像上でbbox矩形を描画するアノテーションUI |
| エクスポートJSON | 全ページのbbox座標をJSON出力（安定ID付き） |

### やらないこと

- テキスト編集パネル（Phase 2b）
- topicId紐付け（Phase 2c）
- OCR再実行スクリプト（Phase 2a完了後に開発）
- 既存OCRデータとのマージ
- エクスポート→適用スクリプト（cropスクリプトは次Phase）
- 複数ソース切替UI（将来対応。MVP は makio 単一ソース）

## ページ画像の前提

### ソースPDF

- `fusen-note-makio.pdf`（129ページ、見開きA3）
- `/tmp/claude/fusens/pages/` に見開きPNG 91枚あり（page-001〜090 + 110）
- 残り38ページ（091〜109, 111〜129）はPDFから追加抽出が必要

### 画像フォーマット

- 見開きA3を中央で左右分割して使用
- 左右分割により付箋が大きく表示され、正確なbbox描画が可能
- 1見開き → 2枚（left/right）→ 129ページ × 2 = 最大258画面
- 空白ページ（付箋なし）は1〜3ページ程度

### ディレクトリ構造

MVP は makio 単一ソース。将来の複数PDF対応は `sources/` 配下にディレクトリ追加で拡張可能。

```
public/images/fusens/
├── sources/
│   └── makio/                      ← 今回のPDF
│       ├── page-001-left.png
│       ├── page-001-right.png
│       ├── page-002-left.png
│       ...
│       └── meta.json               ← { name, totalPages, createdAt }
└── cropped/                         ← bbox確定後の切り抜き画像（次Phase、中間名で保存）
    └── makio/
        ├── page-001-left-0.png      ← {source}/{pageId}-{noteIndex}.png
        ├── page-001-left-1.png
        ...
```

**切り抜き画像の命名**: `fusen-NNN` の安定IDは `build-fusens-master.ts` の責務。Phase 2a のエクスポート・切り抜き段階では `{source}/{pageId}-{noteIndex}.png` の中間名を使い、master 生成時に `fusen-NNN` に変換する。

## スクリプト: `scripts/split-pages.ts`

### 用途

見開きA3画像を中央で左右分割し、ソースディレクトリに配置。

### CLI

```bash
# 既存の見開きPNGから分割
npx tsx scripts/split-pages.ts --source makio --input /tmp/claude/fusens/pages/

# PDFから全ページをPNG化してから分割（pdftoppm使用、300 DPI）
npx tsx scripts/split-pages.ts --source makio --pdf /tmp/claude/fusens/all-subjects.pdf

# 既存ファイルを強制上書き
npx tsx scripts/split-pages.ts --source makio --input /tmp/claude/fusens/pages/ --force
```

### 処理

1. `--input` から `page-NNN.png` を検索（`-left`/`-right`/`-api`/`-small` を除外）
2. `--pdf` 指定時: `pdftoppm -png -r 300` でPDF→PNG変換（不足ページのみ。既存PNGはスキップ）
3. 各画像を sharp で中央分割 → `page-NNN-left.png`, `page-NNN-right.png`
4. 出力先: `public/images/fusens/sources/{source}/`
5. `meta.json` 生成:
   ```json
   {
     "name": "makio",
     "pdf": "fusen-note-makio.pdf",
     "totalPages": 129,
     "splitImages": 258,
     "createdAt": "2026-03-25T..."
   }
   ```
6. 冪等: 既に存在するファイルはスキップ（`--force` で上書き）

### 依存

- `sharp`（既にプロジェクトで使用中、OCR切り抜きで導入済み）
- `pdftoppm`（`--pdf` モード時のみ。Homebrew: `brew install poppler`）

## アノテーションUI

### ルート

`/dev-tools/fusen-annotate` — dev serverのみ（既存 `/dev-tools/fusen-review` と同パターン）

### 画面構成

```
┌─────────────────────────────────────────────┐
│  📒 makio   ◀ page-003-left (5/258) ▶      │  ヘッダー
│  ✅ 12完了  ⏭ 3スキップ  ⏳ 243残り          │  進捗
├─────────────────────────────────────────────┤
│                                             │
│   ┌──────────────────────┐                  │
│   │                      │                  │
│   │   [ページ画像]         │                  │
│   │     ┌───┐  ┌────┐    │                  │
│   │     │ 1 │  │ 2  │    │  描画済みbbox     │
│   │     └───┘  └────┘    │  （番号付き）      │
│   │        ┌──────┐      │                  │
│   │        │  3   │      │                  │
│   │        └──────┘      │                  │
│   │                      │                  │
│   └──────────────────────┘                  │
│                                             │
├─────────────────────────────────────────────┤
│  bbox: 3枚  [↩ 取消] [🗑 削除] [📥 Export]  │  アクションバー
│  [⏭ 付箋なし]       [✅ 確定 → 次へ]         │
└─────────────────────────────────────────────┘
```

### 操作フロー

1. ページ画像が表示される
2. 付箋がある場所をマウスドラッグして矩形を描画
3. 繰り返し描画（1ページに複数枚）
4. 間違えたら Undo or 選択して削除。選択中のbboxはドラッグで移動可能
5. 「✅ 確定」で保存 → 自動で次ページへ遷移
6. 付箋がないページは「⏭ 付箋なし」でスキップ
7. 全ページ完了後「📥 Export」ボタン or `e` キーでエクスポート

### 操作詳細

| 操作 | マウス | キーボード |
|------|--------|-----------|
| bbox描画 | 画像上でドラッグ | — |
| bbox選択 | bbox上をクリック | — |
| bbox移動 | 選択中のbboxをドラッグ | — |
| bbox削除 | — | `Delete` / `Backspace`（選択中のbbox） |
| Undo | 取消ボタン | `Ctrl+Z`（シングルレベル: 直前の操作1つのみ取消） |
| 付箋なし | スキップボタン | `s` |
| 確定→次へ | 確定ボタン | `Enter` |
| ページ送り | ヘッダーの◀▶ | `←` `→`（※ドラッグ中は無効） |
| 未完了ジャンプ | — | `g`（※ドラッグ中は無効） |
| エクスポート | Exportボタン | `e` |
| ヘルプ | — | `?` |

**キーボード制御**: `useAnnotateKeyboard` は `useCanvasDraw` の `isDrawing` フラグを参照し、ドラッグ操作中は全ショートカットを無効化する。

### bbox描画のインタラクション

- **ドラッグ開始**: mousedown で開始点を記録（既存bbox上でない場所のみ）
- **ドラッグ中**: mousemove で矩形をリアルタイムプレビュー（半透明の青枠）
- **ドラッグ終了**: mouseup で確定。最小サイズ（20×20px相当）未満は無視（誤クリック防止）
- **描画済みbbox**: 半透明の青い枠線 + 左上に番号バッジ（描画順 = noteIndex）
- **選択状態**: 枠線がオレンジに変化、Deleteで削除可能、ドラッグで移動可能
- **bbox移動**: 選択中のbboxをドラッグで位置変更。移動中もリアルタイムプレビュー
- **座標保存**: Canvas表示座標を 0〜1000 正規化座標に変換して保存（既存パイプラインと統一）

### Canvas座標変換チェーン

ブラウザのマウスイベント → 正規化座標の変換は以下の3段階:

```
1. クライアント座標の取得
   clientX/Y - canvas.getBoundingClientRect().left/top
   → Canvas上のピクセル位置（CSS表示サイズ基準）

2. 画像表示領域内の座標
   Canvas全体 = 画像表示領域（letterbox なし、画像をCanvas全体にfit）
   → canvasX, canvasY はそのまま画像内座標

3. 正規化（0〜1000）
   normalizedX = Math.round(canvasX / canvas.clientWidth * 1000)
   normalizedY = Math.round(canvasY / canvas.clientHeight * 1000)
```

**Canvas設定**: `canvas.width`/`height`（backing store）はCSS表示サイズに合わせる。`devicePixelRatio` によるスケーリングは行わない（dev-toolsのためRetina最適化は不要。シンプルさ優先）。

**逆変換（表示時）**: `displayX = normalized / 1000 * canvas.clientWidth`

## コンポーネント構成

```
src/dev-tools/fusen-annotate/
├── FusenAnnotatePage.tsx          オーケストレーター
├── FusenAnnotatePage.module.css
├── components/
│   ├── AnnotateCanvas.tsx         画像表示 + bbox描画（HTML Canvas API）
│   ├── AnnotateCanvas.module.css
│   ├── AnnotateToolbar.tsx        下部アクションバー（Export含む）
│   └── AnnotateHeader.tsx         ページ送り・進捗表示
├── hooks/
│   ├── useAnnotationState.ts      localStorage永続化
│   ├── useCanvasDraw.ts           マウスドラッグ→矩形描画・移動ロジック
│   └── useAnnotateKeyboard.ts     キーボードショートカット（isDrawingガード付き）
├── utils/
│   └── drawBboxes.ts              Canvas bbox描画ユーティリティ（番号バッジ・選択ハイライト）
└── types.ts                       型定義
```

### 各コンポーネントの責務

**FusenAnnotatePage**: ページ全体のオーケストレーション。現在ページ管理、エクスポート処理。MVP は makio ハードコード（将来の複数ソース対応時にソース選択UIを追加）。

**AnnotateCanvas**: HTML Canvas上に画像を描画し、マウスイベントでbbox矩形を描画・移動。drawImage → `drawBboxes()` → ドラッグ中のプレビュー描画の順でレンダリング。

**drawBboxes.ts**: Canvas 2D Context を受け取り、既存bboxの枠線・番号バッジ・選択ハイライトを描画する純粋関数。Reactコンポーネントではない。

**AnnotateToolbar**: bbox数表示、取消・削除・スキップ・確定・エクスポートボタン。状態に応じてボタンの有効/無効を制御。

**AnnotateHeader**: ページ送りボタン、進捗カウント表示（完了/スキップ/残り）。

### 各フックの責務

**useAnnotationState**: localStorage `fusen-annotate-v1` キーで永続化。ページ単位のbboxリストと状態を管理。最終位置の記憶と復元。**自動保存**: bbox描画・移動・削除のたびに `in-progress` 状態で保存（500msデバウンス）。ページ遷移時にデータ消失しない。`QuotaExceededError` 時はコンソール警告 + UIにエラー表示。

**useCanvasDraw**: mousedown/mousemove/mouseup ハンドラ。ドラッグ中の矩形プレビュー座標、確定時の0〜1000正規化変換、最小サイズフィルタ。選択・削除・移動のクリック/ドラッグ判定。**`isDrawing` フラグをexpose** → キーボードハンドラが参照。

**useAnnotateKeyboard**: ショートカットキーのイベントリスナー登録と解除。修飾キー（Ctrl+Z）対応。`isDrawing === true` の間はすべてのショートカットを無効化。

## 技術選択

| 要素 | 選択 | 理由 |
|------|------|------|
| 描画 | HTML Canvas API | bbox描画パフォーマンス。DOM矩形より滑らか |
| 画像表示 | Canvas上にdrawImage | 画像とbboxを同一座標系で管理 |
| 状態管理 | localStorage（500msデバウンス） | Phase 1レビューUIと同パターン。自動保存でデータ消失防止 |
| 画像加工 | sharp（Node.js） | split-pages.ts用。ブラウザ側は不要 |
| 座標系 | 0〜1000 正規化 | **既存OCR/master/review パイプラインと統一**。`x / 1000 * imgWidth` で実ピクセルに変換 |

## データ構造

### 型定義

```typescript
// --- 座標 ---

// [y1, x1, y2, x2] — 0〜1000正規化、top-left原点
// 既存 FusenSource.bbox / ocr-fusens.ts と同じスケール
type NormalizedBbox = [number, number, number, number]

// --- アノテーション状態（localStorage永続化） ---

interface AnnotationState {
  version: 1
  source: string                              // "makio"
  pages: Record<string, PageAnnotation>       // key: "page-001-left"
  lastPosition: string                        // 最後に作業したページID
  updatedAt: string                           // ISO8601
}

interface PageAnnotation {
  status: 'in-progress' | 'done' | 'skipped'
  bboxes: NormalizedBbox[]
  // localStorage内部では配列で保持（描画順）
  // エクスポート時に noteIndex を明示付与
  // 削除時: splice で詰める（in-progress中のみ）
  // 確定（done）後は順序固定 → noteIndex 確定
}

// エクスポート用（noteIndex 明示）
interface ExportBbox {
  noteIndex: number
  bbox: NormalizedBbox
}

// --- ソースメタデータ ---

interface SourceMeta {
  name: string                  // "makio"
  pdf: string                   // "fusen-note-makio.pdf"
  totalPages: number            // 129
  splitImages: number           // 258 (totalPages × 2)
  createdAt: string             // ISO8601
}
```

### 状態遷移

```
(ページ未アクセス) → bbox描画 → "in-progress"
"in-progress" → 「✅ 確定」→ "done"
"in-progress" → 「⏭ 付箋なし」→ "skipped"（bboxes クリア）
"done" → ページ再訪問 → bbox追加/削除 → "in-progress"
"skipped" → ページ再訪問 → bbox描画 → "in-progress"
```

### localStorage キー

- `fusen-annotate-v1` — 全ソースのアノテーション状態
  - MVP は単一ソースだが、将来 `source` フィールドで区別可能

### 画像読み込み

- 現在ページの画像を `<img>` で読み込み → Canvas に drawImage
- **プリロード**: 次ページ（N+1）の画像を `new Image()` で先読み → スムーズなページ遷移
- **読み込み中**: Canvas にスピナー表示
- **画像なし**: 「画像が見つかりません」メッセージ表示、スキップ可能

### エクスポートJSON

```json
{
  "version": "1.0.0",
  "source": "makio",
  "exportedAt": "2026-03-25T...",
  "summary": {
    "totalPages": 258,
    "annotatedPages": 255,
    "skippedPages": 3,
    "totalBboxes": 892
  },
  "pages": [
    {
      "pageId": "page-001-left",
      "spreadPage": 1,
      "side": "left",
      "status": "done",
      "bboxes": [
        { "noteIndex": 0, "bbox": [90, 60, 195, 300] },
        { "noteIndex": 1, "bbox": [200, 50, 350, 290] }
      ]
    },
    {
      "pageId": "page-001-right",
      "spreadPage": 1,
      "side": "right",
      "status": "skipped",
      "bboxes": []
    }
  ]
}
```

### 安定ID体系

各 bbox は `source + spreadPage + side + noteIndex` の4要素で一意に識別される。`noteIndex` はエクスポートJSON に明示出力される（配列順からの暗黙導出に依存しない）。

**既存 `FusenSource` との互換変換（この設計書で確定）:**

| エクスポート | FusenSource | 変換式 |
|-------------|-------------|--------|
| `source` | `pdf` | `source` → `"fusen-note-{source}.pdf"` |
| `spreadPage` + `side` | `page` | `page = (spreadPage - 1) * 2 + (side === 'left' ? 1 : 2)` |
| `noteIndex` | `noteIndex` | そのまま |

**変換例:**
- `page-001-left` → `FusenSource.page = 1` （(1-1)*2+1 = 1）
- `page-001-right` → `FusenSource.page = 2` （(1-1)*2+2 = 2）
- `page-002-left` → `FusenSource.page = 3` （(2-1)*2+1 = 3）
- `page-065-right` → `FusenSource.page = 130` （(65-1)*2+2 = 130）

この変換式は `crop-from-annotations.ts` および `build-fusens-master.ts` の拡張で使用する。

**重要**: `done` 状態のページの bbox 順序は確定済みであり、noteIndex が割り振られた状態でエクスポートされる。

### 座標の扱い

- **保存時**: `Math.round(canvasX / canvas.clientWidth * 1000)` → 0〜1000 正規化
- **表示時**: `normalized / 1000 * canvas.clientWidth` → ピクセル座標
- **切り抜き時**（将来のcropスクリプト）: `normalized / 1000 * 元画像の実ピクセル` → sharp crop座標
- **座標順序**: `[y1, x1, y2, x2]`（既存OCRデータと同じ row-major 形式）

## 既存コードとの関係

| 既存 | 関係 |
|------|------|
| `/dev-tools/fusen-review` | そのまま残す。Phase 2b以降のテキストレビューで使う |
| `fusens-master.json` | 今回は読み書きしない。cropスクリプト→build-master で更新（次Phase） |
| `ocr-results.json` | 今回は使わない。bbox描画後にOCR再実行で上書き予定 |
| `FusenSource.bbox` | 同じ 0〜1000 スケール、同じ `[y1, x1, y2, x2]` 順序 |
| `routes.tsx` | dev-onlyルート `/dev-tools/fusen-annotate` を追加 |
| Soft Companion デザイントークン | `tokens.css` のCSS変数を使用 |

## 将来の接続（次Phase以降）

```
[今回] エクスポートJSON（source + spreadPage + side + noteIndex で安定ID）
  ↓
[次Phase] scripts/crop-from-annotations.ts
  - エクスポートJSON + 左右分割画像 → 付箋画像を切り抜き
  - 命名: {source}/{pageId}-{noteIndex}.png（中間名）
  - 出力: public/images/fusens/cropped/makio/
  ↓
[次Phase] scripts/ocr-fusens-v2.ts
  - 切り抜き画像 → Gemini OCR（テキスト抽出のみ、bbox不要）
  ↓
[次Phase] build-fusens-master.ts の拡張
  - アノテーションJSON + OCR結果 → fusens-master.json
  - ここで fusen-NNN の安定ID採番
  - spreadPage + side → FusenSource.page は本設計書の確定済みルールを使用
  ↓
[次Phase] /dev-tools/fusen-review でテキスト確認・修正
  ↓
[次Phase] topicId紐付け
```

## テスト方針

- `useCanvasDraw`: ドラッグロジックをクラスに分離（`CanvasDrawManager`）して純粋関数テスト（既存パターン: `TimeTracker`, `AnswerStateManager`, `SwipeNavigator`）
  - テスト項目: ドラッグ→bbox生成、最小サイズフィルタ、座標正規化（0〜1000）、選択判定、移動計算
- `useAnnotationState`: localStorage読み書きロジックをクラスに分離（`AnnotationStateManager`）してテスト
  - テスト項目: 状態遷移（in-progress/done/skipped）、デバウンス保存、エクスポートJSON生成
- `split-pages.ts`: 画像分割ロジックのユニットテスト（sharpモック）
- `drawBboxes.ts`: 入出力が座標配列→Canvas描画コマンドなので、Canvas context モックでテスト可能
- E2Eテスト: スコープ外（dev-toolsのため）

## ヘルプオーバーレイ

`?` キーで表示。既存 `KeyboardHelp.tsx` パターンを踏襲。

| キー | 操作 |
|------|------|
| ドラッグ | bbox描画 |
| クリック | bbox選択 |
| 選択+ドラッグ | bbox移動 |
| Delete / Backspace | 選択bbox削除 |
| Ctrl+Z | 取消（直前1操作） |
| ← → | ページ送り |
| Enter | 確定→次へ |
| s | 付箋なし（スキップ） |
| g | 未完了ページへジャンプ |
| e | エクスポート |
| ? | このヘルプ |
