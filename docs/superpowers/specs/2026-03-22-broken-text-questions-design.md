# テキスト崩れ問題の修復設計 v2

> GPT-5.4レビュー（critical×2, major×4）を反映した再設計

## 問題

PDF抽出時のテキスト崩れ。数式・表・構造式を含む問題で顕著。連問に限らず全4,094問が対象。

### 根本原因
pdftotext が数式・表のレイアウトを保持できず、テキストがバラバラに展開される。

## 設計原則（GPT-5.4レビュー反映）

1. **question_textは不変** — データを直接書き換えない（正答判定・連問分割ロジックへの影響を防止）
2. **表示レイヤーで対応** — runtime正規化 or visual_content_typeによる表示モード分岐
3. **検出器ファースト** — まず問題の分類を自動化し、対象を機械的に特定
4. **visual_content_typeを活用** — 既存の839問のメタデータを first-class に扱う

## 解決策: E（表示レイヤー分岐）

### Step 1: 検出器スクリプト
`scripts/detect-broken-text.ts` を作成。全問題をスキャンし分類:
- `text_only`: テキストのみ（修復不要）
- `has_image`: image_urlあり（画像表示で対応可能）
- `broken_formula`: 数式崩れ検出（特殊記号パターン）
- `broken_table`: 表崩れ検出
- `next_q_mixed`: 次問の混入あり

### Step 2: 表示時のruntime正規化ヘルパー
`src/utils/text-normalizer.ts` を新規作成:

```typescript
/** 表示用のテキスト正規化（元データは変更しない） */
export function normalizeForDisplay(text: string): string {
  return text
    .replace(/\\n/g, '\n')           // リテラル\nを改行に
    .replace(/\n{3,}/g, '\n\n')      // 過剰な改行を圧縮
    .replace(/[ 　]{3,}/g, ' ')      // 過剰な空白を圧縮（3文字以上のみ）
    .trim()
}
```

**注意:** 「問XXX」マーカーや「つ選べ」は除去しない（ロジック依存あり）

### Step 3: LinkedQuestionViewer + QuestionPage でimage_url表示条件を緩和

現在: `q.image_url && q.choices.length === 0` でのみ画像表示
変更後: `q.image_url && (q.choices.length === 0 || q.visual_content_type !== 'text_only')` で画像併用表示

```tsx
{q.image_url && (q.choices.length === 0 || hasVisualContent(q)) && (
  <Image src={q.image_url} ... />
)}
```

これにより、選択肢付きでも数式/構造式画像がある問題では画像も表示される。

## 対象ファイル
- Create: `scripts/detect-broken-text.ts` — 検出器
- Create: `src/utils/text-normalizer.ts` — 表示用正規化
- Modify: `src/components/LinkedQuestionViewer.tsx` — 画像表示条件緩和 + 正規化適用
- Modify: `src/pages/QuestionPage.tsx` — 同上

## 完了基準
- question_textデータは一切変更しない
- visual_content_typeがtext_only以外の問題で画像が表示される
- 表示テキストの過剰な改行・空白が圧縮される
- ビルド成功 + E2Eテスト全通過
- 正答判定ロジックに影響なし
