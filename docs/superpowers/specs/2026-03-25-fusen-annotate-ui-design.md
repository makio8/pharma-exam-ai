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
| エクスポートJSON | 全ページのbbox座標をJSON出力 |

### やらないこと

- テキスト編集パネル（Phase 2b）
- topicId紐付け（Phase 2c）
- OCR再実行スクリプト（Phase 2a完了後に開発）
- 既存OCRデータとのマージ
- エクスポート→適用スクリプト（cropスクリプトは次Phase）

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

### ディレクトリ構造（複数PDF対応）

将来、別の先輩からのPDFが追加されることを想定し、ソース単位で管理する。

```
public/images/fusens/
├── sources/
│   ├── makio/                      ← 今回のPDF
│   │   ├── page-001-left.png
│   │   ├── page-001-right.png
│   │   ├── page-002-left.png
│   │   ...
│   │   └── meta.json               ← { name, totalPages, createdAt }
│   └── senpai-tanaka/              ← 将来追加されるPDF
│       ├── page-001-left.png
│       ...
│       └── meta.json
└── cropped/                         ← bbox確定後の切り抜き画像（fusen-ID単位）
```

## スクリプト: `scripts/split-pages.ts`

### 用途

見開きA3画像を中央で左右分割し、ソースディレクトリに配置。

### CLI

```bash
# 基本
npx tsx scripts/split-pages.ts --source makio --input /tmp/claude/fusens/pages/

# PDFから不足ページを抽出してから分割
npx tsx scripts/split-pages.ts --source makio --pdf /tmp/claude/fusens/all-subjects.pdf
```

### 処理

1. `--input` から `page-NNN.png` を検索（`-left`/`-right`/`-api`/`-small` を除外）
2. 各画像を sharp で中央分割 → `page-NNN-left.png`, `page-NNN-right.png`
3. 出力先: `public/images/fusens/sources/{source}/`
4. `meta.json` 生成:
   ```json
   {
     "name": "makio",
     "pdf": "fusen-note-makio.pdf",
     "totalPages": 129,
     "splitImages": 258,
     "createdAt": "2026-03-25T..."
   }
   ```
5. 冪等: 既に存在するファイルはスキップ（`--force` で上書き）

### 依存

- `sharp`（既にプロジェクトで使用中、OCR切り抜きで導入済み）

## アノテーションUI

### ルート

`/dev-tools/fusen-annotate` — dev serverのみ（既存 `/dev-tools/fusen-review` と同パターン）

### 画面構成

```
┌─────────────────────────────────────────────┐
│  📒 makio ▾   ◀ page-003-left (5/258) ▶    │  ヘッダー
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
│  bbox: 3枚   [↩ 取消] [🗑 選択削除]          │  アクションバー
│  [⏭ 付箋なし]  [✅ 確定 → 次へ]              │
└─────────────────────────────────────────────┘
```

### 操作フロー

1. ページ画像が表示される
2. 付箋がある場所をマウスドラッグして矩形を描画
3. 繰り返し描画（1ページに複数枚）
4. 間違えたら Undo or 選択して削除
5. 「✅ 確定」で保存 → 自動で次ページへ遷移
6. 付箋がないページは「⏭ 付箋なし」でスキップ
7. 全ページ完了後「e」キーでエクスポート

### 操作詳細

| 操作 | マウス | キーボード |
|------|--------|-----------|
| bbox描画 | 画像上でドラッグ | — |
| bbox選択 | bbox上をクリック | — |
| bbox削除 | — | `Delete` / `Backspace`（選択中のbbox） |
| Undo | 取消ボタン | `Ctrl+Z`（直前のbbox描画を取消） |
| 付箋なし | スキップボタン | `s` |
| 確定→次へ | 確定ボタン | `Enter` |
| ページ送り | ヘッダーの◀▶ | `←` `→` |
| 未完了ジャンプ | — | `g` |
| エクスポート | — | `e` |
| ヘルプ | — | `?` |

### bbox描画のインタラクション

- **ドラッグ開始**: mousedown で開始点を記録
- **ドラッグ中**: mousemove で矩形をリアルタイムプレビュー（半透明の青枠）
- **ドラッグ終了**: mouseup で確定。最小サイズ（20×20px相当）未満は無視（誤クリック防止）
- **描画済みbbox**: 半透明の青い枠線 + 左上に番号バッジ
- **選択状態**: 枠線がオレンジに変化、Deleteで削除可能
- **座標**: Canvas座標をそのまま 0〜1 比率に変換して保存

## コンポーネント構成

```
src/dev-tools/fusen-annotate/
├── FusenAnnotatePage.tsx          オーケストレーター
├── FusenAnnotatePage.module.css
├── components/
│   ├── AnnotateCanvas.tsx         画像表示 + bbox描画（HTML Canvas API）
│   ├── AnnotateCanvas.module.css
│   ├── BboxOverlay.tsx            描画済みbbox表示（番号・選択状態）
│   ├── AnnotateToolbar.tsx        下部アクションバー
│   └── AnnotateHeader.tsx         ソース選択・ページ送り・進捗表示
├── hooks/
│   ├── useAnnotationState.ts      localStorage永続化（ソース単位）
│   ├── useCanvasDraw.ts           マウスドラッグ→矩形描画ロジック
│   └── useAnnotateKeyboard.ts     キーボードショートカット
└── types.ts                       型定義
```

### 各コンポーネントの責務

**FusenAnnotatePage**: ページ全体のオーケストレーション。ソース選択、現在ページ管理、エクスポート処理。

**AnnotateCanvas**: HTML Canvas上に画像を描画し、マウスイベントでbbox矩形を描画。drawImage → 既存bbox描画 → ドラッグ中のプレビュー描画の順でレンダリング。

**BboxOverlay**: AnnotateCanvasの描画レイヤーの一部として、既存bboxの番号バッジ・選択ハイライトを描画。Canvas描画関数として実装（ReactコンポーネントではなくCanvas描画ユーティリティ）。

**AnnotateToolbar**: bbox数表示、取消・削除・スキップ・確定ボタン。状態に応じてボタンの有効/無効を制御。

**AnnotateHeader**: ソースドロップダウン（将来複数PDF対応）、ページ送りボタン、進捗カウント表示。

### 各フックの責務

**useAnnotationState**: localStorage `fusen-annotate-{source}` キーで永続化。ページ単位のbboxリストと状態（done/skipped）を管理。最終位置の記憶と復元。

**useCanvasDraw**: mousedown/mousemove/mouseup ハンドラ。ドラッグ中の矩形プレビュー座標、確定時の比率変換、最小サイズフィルタ。選択・削除のクリック判定。

**useAnnotateKeyboard**: ショートカットキーのイベントリスナー登録と解除。修飾キー（Ctrl+Z）対応。

## 技術選択

| 要素 | 選択 | 理由 |
|------|------|------|
| 描画 | HTML Canvas API | bbox描画パフォーマンス。DOM矩形より滑らか |
| 画像表示 | Canvas上にdrawImage | 画像とbboxを同一座標系で管理 |
| 状態管理 | localStorage | Phase 1レビューUIと同パターン。シンプル |
| 画像加工 | sharp（Node.js） | split-pages.ts用。ブラウザ側は不要 |
| 座標系 | 0〜1 比率 | 画像サイズ非依存。将来の異なるPDFにも対応 |

## データ構造

### 型定義

```typescript
// --- アノテーション状態（localStorage永続化） ---

interface AnnotationState {
  version: 1
  source: string                              // "makio"
  pages: Record<string, PageAnnotation>       // key: "page-001-left"
  lastPosition: string                        // 最後に作業したページID
  updatedAt: string                           // ISO8601
}

interface PageAnnotation {
  status: 'done' | 'skipped'
  bboxes: NormalizedBbox[]
}

// [y1, x1, y2, x2] — 0〜1比率、top-left原点
type NormalizedBbox = [number, number, number, number]

// --- ソースメタデータ ---

interface SourceMeta {
  name: string                  // "makio"
  pdf: string                   // "fusen-note-makio.pdf"
  totalPages: number            // 129
  splitImages: number           // 258 (totalPages × 2)
  createdAt: string             // ISO8601
}
```

### localStorage キー

- `fusen-annotate-makio` — makioソースのアノテーション状態
- `fusen-annotate-senpai-tanaka` — 将来の別ソース

ソース単位でキーを分離し、複数PDF間でデータが混ざらない設計。

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
      "status": "done",
      "bboxes": [
        [0.09, 0.06, 0.195, 0.30],
        [0.20, 0.05, 0.35, 0.29]
      ]
    },
    {
      "pageId": "page-001-right",
      "status": "skipped",
      "bboxes": []
    }
  ]
}
```

### 座標の扱い

- **保存時**: `x / canvasDisplayWidth` → 0〜1 比率
- **表示時**: `ratio × canvasDisplayWidth` → ピクセル座標
- **切り抜き時**（将来のcropスクリプト）: `ratio × 元画像の実ピクセル` → sharp crop座標
- **座標順序**: `[y1, x1, y2, x2]`（既存OCRデータと同じ row-major 形式）

## 既存コードとの関係

| 既存 | 関係 |
|------|------|
| `/dev-tools/fusen-review` | そのまま残す。Phase 2b以降のテキストレビューで使う |
| `fusens-master.json` | 今回は読み書きしない。cropスクリプト→build-master で更新（次Phase） |
| `ocr-results.json` | 今回は使わない。bbox描画後にOCR再実行で上書き予定 |
| `routes.tsx` | dev-onlyルート `/dev-tools/fusen-annotate` を追加 |
| Soft Companion デザイントークン | `tokens.css` のCSS変数を使用 |

## 将来の接続（次Phase以降）

```
[今回] エクスポートJSON
  ↓
[次Phase] scripts/crop-from-annotations.ts
  - エクスポートJSON + 左右分割画像 → 付箋画像を切り抜き
  - 出力: public/images/fusens/cropped/fusen-NNN.png
  ↓
[次Phase] scripts/ocr-fusens-v2.ts
  - 切り抜き画像 → Gemini OCR（テキスト抽出のみ、bbox不要）
  ↓
[次Phase] build-fusens-master.ts の拡張
  - アノテーションJSON + OCR結果 → fusens-master.json
  ↓
[次Phase] /dev-tools/fusen-review でテキスト確認・修正
  ↓
[次Phase] topicId紐付け
```

## テスト方針

- `useCanvasDraw`: ドラッグロジックをクラスに分離（`CanvasDrawManager`）して純粋関数テスト（既存パターン: `TimeTracker`, `AnswerStateManager`, `SwipeNavigator`）
- `useAnnotationState`: localStorage読み書きロジックをクラスに分離してテスト
- `split-pages.ts`: 画像分割ロジックのユニットテスト（sharpモック）
- E2Eテスト: スコープ外（dev-toolsのため）
