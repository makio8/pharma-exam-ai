# レビューUI改善: シナリオ編集 & 複数画像クロップ

**日付**: 2026-03-27
**ステータス**: Draft → GPT-5.4 Review Passed (P1×3修正済み)

## §1. 背景と課題

データ品質レビューUI（`/dev-tools/review`）で連問（linked questions）を扱う際、以下の問題がある:

1. **シナリオテキストの編集が発見しにくい**: 「テキスト」タブのドロップダウンに「シナリオ」が隠れており、専用タブがない
2. **シナリオ内の処方画像をクロップできない**: シナリオに「以下の処方が出された」と書かれていてもPDFから処方画像を切り出してシナリオに紐付ける手段がない
3. **画像クロップが1問1枚に制限**: PDFで画像が離れた位置にある場合（例: グラフと構造式）に対応できない

## §2. 設計方針

- シナリオと問題文で**同じプレースホルダー方式**（`{{image:N}}`）を使い、テキスト内の任意位置に複数画像を差し込める
- クロップ完了時にテキストエリアの**カーソル位置**にプレースホルダーを自動挿入（手入力不要）
- 既存の `image-crop` Correction型は後方互換で読み込み可能に残し、新規作成は `multi-image-crop` 型を使う
- **シナリオ修正は連問グループ全体に伝播させる**（GPT-5.4 P1-1対応）
- **画像プレビューは in-memory キャッシュのみ**。localStorage には保存しない（GPT-5.4 P1-2対応）
- **問題文もシナリオと同じく「テキスト+画像」を1タブに統合**（GPT-5.4 P2-5対応）

## §3. データモデル

### §3.1 新しいCorrection型

```typescript
// types.ts に追加
export type CropTarget = 'question' | 'scenario'

export interface CropImage {
  id: number              // 1, 2, 3...（プレースホルダー {{image:N}} の N）
  crop: PdfCropRect
  pdfFile: string
  pdfPage: number
  label?: string          // 任意ラベル（例: '処方箋', '検査値'）
  // preview は CropImage に含めない（§3.3参照）
}

// Correction union に追加
| { type: 'multi-image-crop'; target: CropTarget; images: CropImage[] }
```

### §3.2 既存型の扱い

| 型 | 扱い |
|---|---|
| `image-crop`（既存） | 読み込み可。export時も既存データはそのまま出力。新規作成はしない |
| `multi-image-crop`（新規） | 今後の標準。target='question' or 'scenario' |
| `text[linked_scenario]`（既存） | そのまま使う。シナリオタブからのテキスト修正もこの型で保存 |

### §3.3 画像プレビューの管理（GPT-5.4 P1-2対応）

画像プレビュー（data URL）は `CropImage` に含めず、**コンポーネント state の in-memory Map** で管理する:

```typescript
// CorrectionPanel 内の state
const [previews, setPreviews] = useState<Map<string, string>>(new Map())
// key: `${target}-${imageId}` (例: "scenario-1", "question-2")
// value: data URL
```

**理由**: PDF crop の PNG data URL は1枚あたり数十KB〜数百KB。`localStorage` に保存すると数枚で5MB上限に達するリスクがある。プレビューはセッション中のみ保持し、ページリロードで消える（crop 座標は corrections に永続化されているので、再クロップの手間のみ）。

### §3.4 エクスポートバージョン管理（GPT-5.4 P1-3対応）

`CorrectionsFile.version` を `'1.0.0'` → `'1.1.0'` に上げる。`apply-corrections.ts` はバージョンチェックで `'1.1.0'` を reject し、明示的に未対応であることを示す:

```typescript
// apply-corrections.ts に追加
if (file.version !== '1.0.0') {
  console.error(`未対応の corrections バージョン: ${file.version}`)
  process.exit(1)
}
```

さらに、export時に `multi-image-crop` を含む corrections がある場合は **警告バナー** を表示:

```
⚠️ 画像クロップ修正を含むエクスポートです。apply-corrections.ts はまだ multi-image-crop に未対応です。
```

## §4. CorrectionPanel 変更

### §4.1 タブ構成（変更後）

| タブ | 内容 | 新規/変更 |
|------|------|----------|
| **問題文** | 問題文テキスト編集 + 画像クロップ（統合） | **変更**: 旧「テキスト」から問題文を独立。画像クロップ統合 |
| テキスト | 解説・カテゴリの編集 | **変更**: 問題文・シナリオを除外。解説・カテゴリのみ |
| 選択肢 | 選択肢テキスト・type編集 | 変更なし |
| 正答 | 正答番号編集 | 変更なし |
| **シナリオ** | シナリオテキスト編集 + 画像クロップ（統合） | **新規** |
| 画像削除 | image_url 削除 | 変更なし |

**設計判断**: 問題文もシナリオも「テキスト＋画像」を1タブで完結させる。旧設計では問題文だけ2タブまたぎ（テキストタブ＋画像タブ）だったが、メンタルモデルが揃わないためGPT-5.4 P2-5で指摘を受けて統合。

### §4.2 問題文タブ UI

```
┌─────────────────────────────────┐
│ 問題文                           │
│ ┌─────────────────────────────┐ │
│ │ 下図の構造式で示される薬物は... │ │
│ │ {{image:1}}                  │ │  ← テキストエリア（rows=8）
│ │ 上記について正しいのはどれか   │ │
│ └─────────────────────────────┘ │
│                                 │
│ [📷 PDFからクロップ]             │
│                                 │
│ クロップ済み画像:                │
│ ┌──────┐  ┌──────┐              │
│ │ 🖼️ 1 │  │ 🖼️ 2 │             │
│ │[×削除]│  │[×削除]│             │
│ └──────┘  └──────┘              │
│                                 │
│ [適用]                          │
└─────────────────────────────────┘
```

**動作フロー**: シナリオタブ（§4.3）と完全に同一。テキスト初期値が `question.question_text` なだけ。

### §4.3 シナリオタブ UI

```
┌─────────────────────────────────┐
│ シナリオテキスト                  │
│ ┌─────────────────────────────┐ │
│ │ 28歳女性。以下の処方が出された │ │
│ │ {{image:1}}                  │ │  ← テキストエリア（rows=8）
│ │ この処方について...            │ │
│ └─────────────────────────────┘ │
│                                 │
│ [📷 PDFからクロップ]  ← カーソル位置にプレースホルダー自動挿入 │
│                                 │
│ クロップ済み画像:                │
│ ┌──────┐                        │
│ │ 🖼️ 1 │ [×削除]               │  ← サムネイル + 削除ボタン
│ └──────┘                        │
│                                 │
│ [適用]                          │
└─────────────────────────────────┘
```

**動作フロー:**
1. テキストエリアにシナリオテキストが表示される（初期値 = `question.linked_scenario`）
2. ユーザーがテキストエリア内でカーソルを画像挿入したい位置に置く
3. 「PDFからクロップ」ボタンを押す → PdfCropperが起動
4. ドラッグ完了 → `CropImage` が追加され、テキストエリアのカーソル位置に `{{image:N}}` が自動挿入される
5. 「適用」ボタンで2つのCorrectionが同時追加:
   - `{ type: 'text', field: 'linked_scenario', value: '...({{image:1}}入り)...' }`
   - `{ type: 'multi-image-crop', target: 'scenario', images: [...] }`

**シナリオ非表示時**: `question.linked_scenario` が空の問題では、シナリオタブは `(この問題にシナリオはありません)` と表示し、テキストエリア・クロップボタンは非表示。

### §4.4 画像削除時のプレースホルダー自動除去（GPT-5.4 P2-6対応）

クロップ済み画像の「×削除」ボタンを押したとき:
1. `CropImage` リストから該当画像を除去
2. テキストエリア内の対応する `{{image:N}}` プレースホルダーを自動除去
3. in-memory プレビューキャッシュからも除去

**適用時バリデーション**:
- テキスト内の `{{image:N}}` と `CropImage[]` の id を突合
- orphan プレースホルダー（画像なし）があれば警告: `⚠️ {{image:3}} に対応する画像がありません`
- 未参照画像（プレースホルダーなし）があれば警告: `⚠️ 画像2がテキスト内で参照されていません`

### §4.5 クロップ完了→プレースホルダー挿入の仕組み

**コールバックの流れ（宣言的、GPT-5.4 P2-4対応）:**

```
CorrectionPanel: onStartCrop(target: CropTarget) →
  ReviewPage: setCropMode(true), setCropTarget(target) →
    PdfCropper: onSave(crop, previewDataUrl) →
      ReviewPage: setPendingCropResult({ target, crop, pdfFile, pdfPage, preview }) →
        CorrectionPanel: props.pendingCropResult を検知 → handleCropResult() → props.onConsumeCropResult()
```

**useImperativeHandle は使わない**。代わりに `pendingCropResult` prop で宣言的にデータを渡し、CorrectionPanel が useEffect で消費する:

```typescript
// ReviewPage 側
const [pendingCropResult, setPendingCropResult] = useState<PendingCropResult | null>(null)

// CorrectionPanel props に追加
interface CorrectionPanelProps {
  // ...既存
  onStartCrop: (target: CropTarget) => void  // 変更: target引数追加
  pendingCropResult: PendingCropResult | null
  onConsumeCropResult: () => void
}

interface PendingCropResult {
  target: CropTarget
  crop: PdfCropRect
  pdfFile: string
  pdfPage: number
  preview: string  // data URL
}
```

CorrectionPanel 内の useEffect:
```typescript
useEffect(() => {
  if (!pendingCropResult) return
  // 1. CropImage リストに追加
  // 2. テキストエリアのカーソル位置に {{image:N}} 挿入
  // 3. in-memory preview Map に追加
  onConsumeCropResult()  // 親の pendingCropResult を null に戻す
}, [pendingCropResult])
```

## §5. 連問グループへのシナリオ修正伝播（GPT-5.4 P1-1対応）

### §5.1 問題

`linked_scenario` は連問グループ（例: r108-119-121）の全問で共有される。問196のシナリオを修正して問197-198を直さないと不整合が起きる。

### §5.2 設計

シナリオタブで「適用」を押したとき、同じ `linked_group` を持つ**全問に同一の correction を自動追加**する:

```typescript
// CorrectionPanel から onAddCorrection を呼ぶ代わりに
// onAddScenarioCorrection(corrections: Correction[]) を呼ぶ

// ReviewPage 側
function handleAddScenarioCorrection(corrections: Correction[]) {
  if (!currentQuestion?.linked_group) {
    // 連問でなければ通常の追加
    corrections.forEach(c => reviewState.addCorrection(currentQuestion.id, c))
    return
  }
  // 同じ linked_group の全問に伝播
  const groupQuestions = ALL_QUESTIONS.filter(
    q => q.linked_group === currentQuestion.linked_group
  )
  for (const q of groupQuestions) {
    corrections.forEach(c => reviewState.addCorrection(q.id, c))
  }
}
```

**UI フィードバック**: 適用時に `✅ 連問グループ ${linked_group} の ${count}問に適用しました` を表示。

### §5.3 シナリオ画像クロップも同様に伝播

`multi-image-crop` with `target: 'scenario'` も同グループ全問に追加。同じシナリオに紐づく画像なので、全問で共有されるべき。

## §6. ReviewCard 変更

### §6.1 シナリオ内の画像プレビュー

ReviewCard のシナリオ表示で `{{image:N}}` プレースホルダーを検出し、対応する `multi-image-crop` Correction の画像プレビューに置換して表示する。

```typescript
// プレースホルダーをパースしてテキスト+画像ブロックに分割
function parseTextWithImages(
  text: string,
  images: CropImage[],
  previews: Map<string, string>  // in-memory preview cache
): Array<{ type: 'text'; content: string } | { type: 'image'; imageId: number; previewUrl?: string }> {
  // {{image:N}} でスプリットし、N に対応する CropImage を差し込む
}
```

**表示:**
- テキスト部分: 既存の `<p className={styles.scenarioText}>` と同じスタイル
- 画像部分（プレビューあり）: サムネイル表示（max-height: 150px, border-radius: 8px）
- 画像部分（プレビューなし = リロード後）: プレースホルダーバッジ `[📷 image:1]`

### §6.2 corrections と previews を ReviewCard に渡す

```typescript
interface ReviewCardProps {
  // ...既存
  corrections: Correction[]        // 追加
  previews: Map<string, string>    // 追加: in-memory preview cache
}
```

ReviewCard はこの中から `type === 'multi-image-crop'` & `target === 'scenario'` を抽出してプレビュー表示に使う。

## §7. PdfCropper 変更

### §7.1 プレビュー data URL の返却

現在 `onSave(crop: PdfCropRect)` だが、クロップ済み画像のプレビューも一緒に返す:

```typescript
// 変更後
onSave: (crop: PdfCropRect, previewDataUrl: string) => void
```

`handleMouseUp` 内で Canvas.getImageData → data URL 生成を行い、crop と一緒に返す。既存の `handlePreview()` ロジックを流用。

## §8. ReviewPage 変更

### §8.1 新規 state

```typescript
const [cropTarget, setCropTarget] = useState<CropTarget | null>(null)
const [pendingCropResult, setPendingCropResult] = useState<PendingCropResult | null>(null)
```

### §8.2 onStartCrop の拡張

CorrectionPanel の `onStartCrop` を `onStartCrop(target: CropTarget)` に変更。ReviewPage 側で `cropTarget` をセットする。

### §8.3 handleCropSave の変更

```typescript
const handleCropSave = useCallback((crop: PdfCropRect, previewDataUrl: string) => {
  setPendingCropResult({
    target: cropTarget!,
    crop,
    pdfFile: activePdfFile,
    pdfPage: activePage,
    preview: previewDataUrl,
  })
  setCropMode(false)
}, [cropTarget, activePdfFile, activePage])
```

### §8.4 CorrectionPanel への props 追加

```tsx
<CorrectionPanel
  question={currentQuestion}
  corrections={currentCorrections}
  onAddCorrection={handleAddCorrection}
  onAddScenarioCorrection={handleAddScenarioCorrection}
  onRemoveCorrection={handleRemoveCorrection}
  onStartCrop={(target) => {
    setCropTarget(target)
    setCropMode(true)
    syncViewportSize()
  }}
  pendingCropResult={pendingCropResult}
  onConsumeCropResult={() => setPendingCropResult(null)}
/>
```

## §9. 影響範囲まとめ

| ファイル | 変更内容 |
|---------|---------|
| `types.ts` | `CropTarget`, `CropImage`, `PendingCropResult`, `multi-image-crop` 型追加 |
| `CorrectionPanel.tsx` | 問題文タブ（テキスト+画像統合）、シナリオタブ新設、テキストタブを解説・カテゴリのみに縮小、pendingCropResult消費、画像削除時placeholder除去、適用時バリデーション |
| `ReviewCard.tsx` | corrections/previews prop追加、シナリオ内プレースホルダー→画像置換表示 |
| `ReviewPage.tsx` | cropTarget/pendingCropResult state、onStartCrop拡張、handleCropSave変更、handleAddScenarioCorrection（グループ伝播）|
| `PdfCropper.tsx` | onSave にpreview data URLを追加 |
| `CorrectionPanel.module.css` | 問題文タブ、シナリオタブ、画像サムネイルのスタイル |
| `ReviewCard.module.css` | シナリオ内画像プレビューのスタイル |
| `apply-corrections.ts` | バージョンチェック追加（`'1.1.0'` reject） |

## §10. エクスポートへの影響

### §10.1 バージョン

`CorrectionsFile.version` を `'1.1.0'` に上げる。`multi-image-crop` を含まないエクスポートでも `'1.1.0'`（下流での明示的なバージョンチェックを促す）。

### §10.2 multi-image-crop 含有時の警告

export時に `multi-image-crop` を含む corrections がある場合、確認ダイアログを表示:

```
⚠️ 画像クロップ修正を含むエクスポートです。
apply-corrections.ts はまだ multi-image-crop に未対応のため、
画像関連の修正は適用されません。続行しますか？
```

### §10.3 preview 除外

`CropImage` に preview フィールドを持たないため、export時のストリップ処理は不要。

## §11. スコープ外（将来対応）

- `apply-corrections.ts` の `multi-image-crop` 対応（実際にプレースホルダーを画像パスに変換して exam-*.ts に反映）
- プレースホルダー画像のファイル書き出し（crop座標からPNG生成してpublic/に配置）
- 問題文内のプレースホルダープレビュー表示（ReviewCard の問題文エリアでの `{{image:N}}` 画像展開。現時点ではシナリオのプレビューのみ対応）

## §12. GPT-5.4 レビュー対応記録

### レビュー1回目（2026-03-27）

| # | 優先度 | 指摘 | 対応 |
|---|--------|------|------|
| 1 | P1 | 連問グループ内のシナリオ修正が問題単位で破綻する | §5 新設: シナリオ修正を `linked_group` 全問に自動伝播 |
| 2 | P1 | preview data URL を localStorage に載せると容量超過 | §3.3 改訂: in-memory Map に変更、CropImage に preview を含めない |
| 3 | P1 | 後方互換が不十分。export version 管理と下流 reject が必要 | §3.4 新設: version `'1.1.0'` + apply-corrections.ts にバージョンチェック + export時警告 |
| 4 | P2 | useImperativeHandle は状態責務を悪化させる | §4.5 改訂: pendingCropResult + onConsumeCropResult の宣言的 props 方式に変更 |
| 5 | P2 | 問題文が2タブまたぎでメンタルモデルが揃わない | §4.1-§4.2 改訂: 問題文もシナリオと同じ「テキスト+画像」統合タブに |
| 6 | P2 | 画像削除時の orphan placeholder、整合性ルール不足 | §4.4 新設: 削除時の自動除去 + 適用時バリデーション（orphan/未参照の警告） |
| 7 | P3 | スコープが end-to-end に見える、review-only を明示すべき | §10.2 新設: export時に multi-image-crop 未対応警告ダイアログ。§11 に問題文プレビュー未対応を明記 |
