# pharma-exam-ai 次セッション要件書

## 前回セッションの成果（2026-03-19）
- **100-106回**: 全データパイプライン完了（e-REC + yakugakulab + 厚労省PDF + 画像）
- **アプリ統合**: all-questions.ts に11年分統合、ダミー問題削除、ビルド成功
- **解説カバー率**: 3,542/3,795問 = 93.3%（詳細解説）
- **画像問題**: 529枚のPDFページ画像を配置、image_url設定済み
- **スキル**: `~/.claude/skills/pharma-exam-add-year.md` 作成（111回追加パイプライン）

## 今回やること

### 1. 画像問題の表示修正 — 最優先 🔴

**現状の問題**:
- QuestionPage.tsx で `image_url` フィールドが完全に無視されている
- 画像問題（構造式・グラフ等）がテキスト崩れで表示される
- 選択肢が空（choices: []）の問題は「回答する」ボタンが無効化

**参考アプリ（スクショ確認済み）**:
- **e-REC**: 問題文テキスト + 反応式/構造式/グラフの画像をインライン表示
- **yakugakulab**: 同上
- **エメリー**: PDFページ画像をインライン表示 + 選択肢は番号（1-5）のみでタップ回答

**必要な実装**:
1. **QuestionPage.tsx に画像表示を追加**
   - `question.image_url` がある場合、問題文の下にPDFページ画像を表示
   - Ant Design の `<Image>` コンポーネント（ピンチズーム対応）推奨
2. **choices空の問題に番号選択UIを追加**
   - エメリー方式: 選択肢テキストがなくても 1-5 の番号ボタンで回答可能
   - `choices: []` かつ `image_url` あり → 画像内の選択肢を見て番号で回答
3. **PracticePage.tsx の一覧表示も対応**
   - 画像問題にアイコンを付けて区別（📷マーク等）

**テスト方法**:
- Playwright E2Eテスト: 全年度の画像問題が正しく表示されるか
- 手動テスト: iPhoneから100回問2、108回問9を確認
- 確認ポイント: 画像のピンチズーム、選択肢の番号タップ、正誤判定

**ファイル**:
- `src/pages/QuestionPage.tsx` — メイン修正対象
- `src/pages/PracticePage.tsx` — 一覧での画像問題表示
- `src/types/question.ts` — image_url フィールド（既に定義済み）

### 2. 残り不完全解説の再生成 — 中

- 約288問がchoices空（画像問題）で「問題データ不完全」
- 画像表示が実装されれば、正答番号のみの解説でもUIとして成立する
- 余裕があれば画像を読み取って具体的な解説に差し替え

### 3. 暗記カード自動生成 — オプション

解説テキストの【覚え方💡】セクションから一問一答形式の暗記カードを自動生成。

### 4. Supabaseデータ投入 — オプション

ローカルのexam-{year}.tsデータをSupabaseに投入し、クラウド同期を有効化。

## 設計メモ: エメリー方式の画像問題対応

```tsx
// QuestionPage.tsx での実装イメージ
{question.image_url && (
  <Image
    src={question.image_url}
    alt={`第${question.year}回 問${question.question_number}`}
    style={{ width: '100%', maxHeight: '60vh' }}
    preview={{ mask: 'タップで拡大' }}
  />
)}

// choices空の場合、番号ボタンで代替
{question.choices.length === 0 && question.image_url && (
  <Radio.Group>
    {[1, 2, 3, 4, 5].map(n => (
      <Radio.Button key={n} value={n}>{n}</Radio.Button>
    ))}
  </Radio.Group>
)}
```

## コマンドリファレンス

```bash
# 開発サーバー起動
npm run dev -- --host

# Playwrightテスト
npx playwright test
npx playwright test --ui      # UIモード
npx playwright test --headed   # ブラウザ表示

# 解説マージ
npx tsx scripts/merge-explanations.ts

# ビルド確認
npm run build
```

## スキル参照
- `~/.claude/skills/pharma-exam-add-year.md` — 新年度追加パイプライン
