# 画像問題の表示・回答UI設計

**日付**: 2026-03-19
**ステータス**: 承認済み（レビュー反映済み）
**目的**: 画像付き問題を正しく表示し、choices空の問題でも回答できるようにする（問題演習アプリの根幹機能）

## 背景

- 11年分3,795問のうち、**909問**に `image_url` フィールドが設定済み
- うち **867問** は `choices: []`（選択肢が画像内に含まれる、全体の23%）
- choices空の問題は全て image_url を持っている（孤立なし ✅）
- 現状 `QuestionPage.tsx` に画像表示コードが0行 → **867問が回答不能**

## データ品質の問題

**correct_answer が 1〜5 の範囲外の問題が21問**（100〜106回に存在）:
- correct_answer = 0: データ不完全（正答不明）
- correct_answer = 6: 6択問題

**対応**: 実装前のデータ修正タスクとして、21問の correct_answer を厚労省正答PDFと照合・修正する。修正不能な場合は「回答不可」としてUIでスキップ表示する。

## データ構造

```typescript
// choices空 + image_urlあり（構造式・グラフ問題）— 867問
{
  id: "r110-006",
  question_text: "図はダニエル電池の模式図である。",
  choices: [],              // 空！選択肢は画像内
  correct_answer: 4,
  image_url: "/images/questions/110/q006.png"
}

// choicesあり + image_urlあり（補助画像付き問題）— 42問
{
  id: "r110-045",
  question_text: "以下の図を参考に...",
  choices: [{ key: 1, text: "アスピリン" }, ...],
  correct_answer: 2,
  image_url: "/images/questions/110/q045.png"
}
```

## 設計

### 1. QuestionPage — 画像表示

**対象**: `image_url` フィールドが存在する全問題（909問）

**配置**: 問題文（`question_text`）の直下、選択肢の上

**コンポーネント**: Ant Design `<Image>`
- 幅: 100%
- max-height: 60vh
- object-fit: contain（画像のアスペクト比を維持）
- タップでプレビューモード（Ant Design Image 標準のピンチ拡大対応）
- alt テキスト: `第{year}回 問{question_number} の図`
- **fallback**: 画像読み込み失敗時は「画像を読み込めません」プレースホルダーを表示
- **placeholder**: 読み込み中はスケルトン表示（Ant Design Image の placeholder prop）

**表示ロジック**:
```
if (question.image_url) {
  <Image src={question.image_url} fallback={errorPlaceholder} ... />
}
```

### 2. QuestionPage — 番号ボタン回答UI

**対象**: `choices.length === 0` の問題のみ（867問）

**UI**: 1〜5の横並びボタン（基本5つ。correct_answer > 5 の場合はその数まで表示）
- 未選択: グレー枠（`#d9d9d9`）
- 選択中: primary色枠（`#1890ff`）+ 薄い背景
- 回答後 正答: 緑枠（`#52c41a`）+ 緑背景
- 回答後 誤答: 選んだボタン = 赤枠（`#ff4d4f`）、正答ボタン = 緑枠
- correct_answer = 0 の場合: 「この問題はデータ準備中です」と表示し回答不可

**UI切り替えロジック**: 既存の Radio.Group 選択肢カード全体を条件分岐で差し替える:
```tsx
{choices.length === 0 ? (
  // 新規: 番号ボタン横並び
  <NumberButtons />
) : (
  // 既存: Radio.Group + Card選択肢（変更なし）
  <Radio.Group>...</Radio.Group>
)}
```

**回答フロー**: 既存の `handleSubmitAnswer()` をそのまま使用。
`selectedAnswer` に番号（1〜5）をセットするだけなので、既存ロジックと完全互換。

### 3. PracticePage — 画像アイコン + フィルタ

**アイコン**: 問題リストの各行に、`image_url` がある問題は `FileImageOutlined`（Ant Design アイコン）を表示
- 既存のアイコン使用パターン（`CheckCircleOutlined` 等）に合わせる

**フィルタ**: 既存のフィルタUIに「画像問題のみ」トグル（Switch または Checkbox）を追加
- ON: `image_url` が存在する問題のみ表示
- OFF: 全問題表示（デフォルト）

## 影響範囲

| ファイル | 変更内容 |
|---|---|
| `src/pages/QuestionPage.tsx` | 画像表示 + 番号ボタンUI + 正誤色表示 + エラーハンドリング |
| `src/pages/PracticePage.tsx` | アイコン + 画像フィルタ追加 |
| `src/types/question.ts` | `QuestionFilter` に `hasImage?: boolean` フィールド追加 |
| `src/data/real-questions/exam-{100-106}.ts` | correct_answer 範囲外21問のデータ修正 |

## スコープ外

- 画像のキャッシュ・遅延読み込み最適化（PWA workbox で自然にキャッシュされる）
- 画像問題専用の解説UI
- 暗記カード連携
- 画像がない問題への画像追加

## テスト方針

- Playwright e2e: 画像問題（choices空）を開いて番号ボタンで回答→正誤表示を確認
- Playwright e2e: 画像付き問題（choicesあり）で画像が表示されることを確認
- Playwright e2e: PracticePageで画像フィルタが動作することを確認
- Playwright e2e: correct_answer=0 の問題で「データ準備中」が表示されることを確認
- 手動確認: 画像のタップ拡大がスマホサイズで動作すること
