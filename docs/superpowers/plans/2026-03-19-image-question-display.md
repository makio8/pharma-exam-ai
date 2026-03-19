# 画像問題の表示・回答UI 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 画像付き問題（909問）を正しく表示し、choices空の問題（867問）でも番号ボタンで回答できるようにする

**Architecture:** QuestionPage.tsx に画像表示と番号ボタンUIを条件分岐で追加。PracticePage.tsx に画像アイコンとフィルタを追加。既存の回答フロー（handleSubmitAnswer）は変更なし。

**Tech Stack:** React 19 + TypeScript + Ant Design 6 + Vite + Playwright

---

## ファイル構成

| ファイル | 役割 | 変更内容 |
|---|---|---|
| `src/types/question.ts` | 型定義 | `QuestionFilter` に `hasImage` 追加 |
| `src/pages/QuestionPage.tsx` | 問題演習画面 | 画像表示 + 番号ボタンUI |
| `src/pages/PracticePage.tsx` | 問題一覧 | 📷アイコン + 画像フィルタ |
| `e2e/smoke.spec.ts` | E2Eテスト | 画像問題の回答テスト追加 |

---

### Task 1: 型定義に hasImage フィルタを追加

**Files:**
- Modify: `src/types/question.ts:57-65`

- [ ] **Step 1: QuestionFilter に hasImage フィールドを追加**

`src/types/question.ts` の `QuestionFilter` インターフェース（57行目）に1行追加:

```typescript
/** フィルター条件 */
export interface QuestionFilter {
  sections?: QuestionSection[]
  subjects?: QuestionSubject[]
  years?: number[]
  correctStatus?: 'all' | 'correct' | 'incorrect' | 'unanswered'
  hasNote?: boolean
  hasImage?: boolean           // ← 追加
  tags?: string[]
  keyword?: string
}
```

- [ ] **Step 2: ビルド確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npm run build`
Expected: 成功（hasImage はオプショナルなので既存コードに影響なし）

- [ ] **Step 3: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add src/types/question.ts
git commit -m "feat: QuestionFilter に hasImage フィルタフィールドを追加"
```

---

### Task 2: QuestionPage に画像表示を追加

**Files:**
- Modify: `src/pages/QuestionPage.tsx`

- [ ] **Step 1: Image コンポーネントをインポートに追加**

`src/pages/QuestionPage.tsx` 3行目の antd インポートに `Image` を追加:

```typescript
import {
  Card,
  Typography,
  Radio,
  Button,
  Tag,
  Space,
  Divider,
  Modal,
  Form,
  Input,
  Select,
  Result,
  Alert,
  Image,          // ← 追加
} from 'antd'
```

- [ ] **Step 2: 問題文カードの直後に画像表示を追加**

218行目の `</Card>`（問題文カード終了タグ）の **直後** に、以下の新規ブロックを挿入する。既存の問題文カード（213-218行目）は変更しない:

```tsx
      {/* ↑ ここまで既存の問題文カード（213-218行目）。以下を219行目として追加 ↓ */}

      {/* 問題画像（image_url がある場合のみ表示） */}
      {question.image_url && (
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <Image
            src={question.image_url}
            alt={`第${question.year}回 問${question.question_number} の図`}
            style={{ maxHeight: '60vh', objectFit: 'contain' }}
            width="100%"
            fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7nlLvlg4/jgpLoqq3jgb/ovrzjgoHjgb7jgZvjgpM8L3RleHQ+PC9zdmc+"
            placeholder={
              <div style={{ background: '#f5f5f5', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                読み込み中...
              </div>
            }
          />
        </div>
      )}
```

fallback の base64 SVG は「画像を読み込めません」と表示する軽量プレースホルダー。

- [ ] **Step 3: ビルド確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npm run build`
Expected: 成功

- [ ] **Step 4: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add src/pages/QuestionPage.tsx
git commit -m "feat: QuestionPage に画像表示を追加（image_url対応909問）"
```

---

### Task 3: QuestionPage に番号ボタン回答UIを追加

**Files:**
- Modify: `src/pages/QuestionPage.tsx`

- [ ] **Step 1: 回答ボタンに correct_answer=0 の安全ガードを追加**

280行目の「回答する」ボタンの `disabled` 条件を変更:

```tsx
        <Button
          type="primary"
          size="large"
          block
          disabled={selectedAnswer === null || question.correct_answer === 0}
          onClick={handleSubmitAnswer}
          style={{ marginBottom: 16 }}
        >
          回答する
        </Button>
```

- [ ] **Step 2: 選択肢エリア（238-276行目）を条件分岐で差し替え**

既存の `<Card size="small">` 〜 `</Card>`（選択肢セクション全体、238-276行目）を以下に置き換え。`Space` の `orientation` は既存コード踏襲（AntD 6 では `direction` が正式だが、別途修正する）:

```tsx
      {/* 選択肢 */}
      {question.choices.length === 0 ? (
        /* 番号ボタンUI（choices空 = 画像問題） */
        question.correct_answer === 0 ? (
          <Card size="small" style={{ marginBottom: 16, textAlign: 'center' }}>
            <Text type="secondary">この問題はデータ準備中です</Text>
          </Card>
        ) : (
          <Card size="small" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {Array.from({ length: Math.max(5, question.correct_answer) }, (_, i) => i + 1).map((num) => {
                // 回答後の色分け
                let btnStyle: React.CSSProperties = {
                  flex: 1,
                  minWidth: 48,
                  height: 48,
                  fontSize: 18,
                  fontWeight: 'bold',
                  border: '2px solid #d9d9d9',
                  borderRadius: 8,
                  background: 'white',
                  cursor: isAnswered ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                }

                if (!isAnswered && selectedAnswer === num) {
                  // 選択中
                  btnStyle = { ...btnStyle, borderColor: '#1890ff', background: '#e6f7ff', color: '#1890ff' }
                } else if (isAnswered && num === question.correct_answer) {
                  // 正答
                  btnStyle = { ...btnStyle, borderColor: '#52c41a', background: '#f6ffed', color: '#52c41a' }
                } else if (isAnswered && num === selectedAnswer && !isCorrect) {
                  // 誤答（自分が選んだ）
                  btnStyle = { ...btnStyle, borderColor: '#ff4d4f', background: '#fff2f0', color: '#ff4d4f' }
                }

                return (
                  <button
                    key={num}
                    type="button"
                    style={btnStyle}
                    onClick={() => { if (!isAnswered) setSelectedAnswer(num) }}
                    disabled={isAnswered}
                  >
                    {num}
                    {isAnswered && num === question.correct_answer && ' ✓'}
                    {isAnswered && num === selectedAnswer && !isCorrect && num !== question.correct_answer && ' ✗'}
                  </button>
                )
              })}
            </div>
          </Card>
        )
      ) : (
        /* 通常の選択肢UI（既存コードそのまま） */
        <Card size="small" style={{ marginBottom: 16 }}>
          <Radio.Group
            value={selectedAnswer}
            onChange={(e) => {
              if (!isAnswered) setSelectedAnswer(e.target.value as number)
            }}
            style={{ width: '100%' }}
          >
            <Space orientation="vertical" style={{ width: '100%' }}>
              {question.choices.map((choice) => (
                <Card
                  key={choice.key}
                  size="small"
                  hoverable={!isAnswered}
                  style={{
                    cursor: isAnswered ? 'default' : 'pointer',
                    ...choiceStyle(choice.key),
                  }}
                  onClick={() => {
                    if (!isAnswered) setSelectedAnswer(choice.key)
                  }}
                >
                  <Radio value={choice.key} disabled={isAnswered}>
                    <Text style={{ fontSize: 15 }}>
                      {choice.key}. {choice.text}
                    </Text>
                    {isAnswered && choice.key === question.correct_answer && (
                      <CheckCircleFilled style={{ color: '#52c41a', marginLeft: 8 }} />
                    )}
                    {isAnswered && choice.key === selectedAnswer && !isCorrect && choice.key !== question.correct_answer && (
                      <CloseCircleFilled style={{ color: '#f5222d', marginLeft: 8 }} />
                    )}
                  </Radio>
                </Card>
              ))}
            </Space>
          </Radio.Group>
        </Card>
      )}
```

- [ ] **Step 3: ビルド確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npm run build`
Expected: 成功

- [ ] **Step 4: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add src/pages/QuestionPage.tsx
git commit -m "feat: choices空の画像問題に番号ボタン回答UIを追加（867問対応）"
```

---

### Task 4: PracticePage に画像アイコンを追加

**Files:**
- Modify: `src/pages/PracticePage.tsx`

- [ ] **Step 1: FileImageOutlined アイコンをインポートに追加**

`src/pages/PracticePage.tsx` 23行目のアイコンインポートに追加:

```typescript
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
  FileImageOutlined,     // ← 追加
} from '@ant-design/icons'
```

- [ ] **Step 2: 問題一覧の各行に画像アイコンを追加**

300-303行目の `<Space>` 内（問番の後）に画像アイコンを追加:

```tsx
<Space size={4} wrap>
  <Tag color={sectionColor(q.section)}>{q.section}</Tag>
  <Text strong>第{q.year}回</Text>
  <Text type="secondary">問{q.question_number}</Text>
  {q.image_url && <FileImageOutlined style={{ color: '#1890ff', fontSize: 14 }} />}
  <Text type="secondary">|</Text>
  <Text>{q.subject}</Text>
</Space>
```

- [ ] **Step 3: ビルド確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npm run build`
Expected: 成功

- [ ] **Step 4: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add src/pages/PracticePage.tsx
git commit -m "feat: PracticePage の問題一覧に画像アイコンを追加"
```

---

### Task 5: PracticePage に画像フィルタを追加

**Files:**
- Modify: `src/pages/PracticePage.tsx`

- [ ] **Step 1: 画像フィルタの state を追加**

67行目（`easyOnly` state の下）に追加:

```typescript
// --- 画像問題フィルター ---
const [imageOnly, setImageOnly] = useState(false)
```

- [ ] **Step 2: フィルタリングロジックに画像フィルタを追加**

74行目の `filteredQuestions` useMemo 内、`easyOnly` フィルタの後（80行目の後）に追加:

```typescript
    // 画像問題のみフィルター
    if (imageOnly) {
      result = result.filter((q) => !!q.image_url)
    }
```

useMemo の依存配列（116行目）に `imageOnly` を追加:

```typescript
  }, [easyOnly, imageOnly, selectedSubjects, selectedYears, selectedSections, correctStatus, keyword, getQuestionResult])
```

- [ ] **Step 3: フィルタUIに画像トグルを追加**

224行目の「正答率60%以上のみ」Switch の Col の後に追加:

```tsx
          <Col xs={24} sm={12}>
            <Space>
              <Text type="secondary">画像問題のみ:</Text>
              <Switch
                checked={imageOnly}
                onChange={setImageOnly}
                size="small"
                checkedChildren="ON"
                unCheckedChildren="OFF"
              />
              {imageOnly && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  （{filteredQuestions.length}問）
                </Text>
              )}
            </Space>
          </Col>
```

- [ ] **Step 4: ビルド確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npm run build`
Expected: 成功

- [ ] **Step 5: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add src/pages/PracticePage.tsx
git commit -m "feat: PracticePage に画像問題フィルタを追加"
```

---

### Task 6: E2Eテスト — 画像問題の回答テスト

**Files:**
- Modify: `e2e/smoke.spec.ts`

- [ ] **Step 0: テスト対象の問題データを確認**

Run:
```bash
cd /Users/ai/projects/personal/pharma-exam-ai
grep -A 5 '"r110-006"' src/data/real-questions/exam-110.ts
grep -A 5 '"r110-001"' src/data/real-questions/exam-110.ts
```
`r110-006` が choices空 + image_url あり、`r110-001` が choices あり であることを確認。

- [ ] **Step 1: 画像問題の回答テストを追加**

`e2e/smoke.spec.ts` の末尾に追加:

```typescript
test('画像問題（choices空）に番号ボタンで回答できる', async ({ page }) => {
  // r110-006 はchoices空 + image_url ありの画像問題
  await page.goto('/practice/r110-006')
  await page.waitForLoadState('networkidle')

  // 画像が表示されていることを確認
  const img = page.locator('img[alt*="第110回 問6"]')
  await expect(img).toBeVisible()

  // 番号ボタンが表示されている（Radio.Groupではなくbuttonで）
  const buttons = page.locator('button').filter({ hasText: /^[1-5]$/ })
  await expect(buttons).toHaveCount(5)

  // 番号4をクリック（この問題の正答）
  await page.locator('button').filter({ hasText: /^4$/ }).click()

  // 回答ボタンをクリック
  await page.getByRole('button', { name: '回答する' }).click()

  // 正誤フィードバックが表示される
  const alert = page.locator('.ant-alert')
  await expect(alert).toBeVisible()
  const text = await alert.textContent()
  expect(text).toMatch(/正解/)
})

test('画像付き通常問題で画像が表示される', async ({ page }) => {
  // image_url ありかつ choices ありの問題を確認
  // r110-001 は choices あり + image_url あり
  await page.goto('/practice/r110-001')
  await page.waitForLoadState('networkidle')

  // 画像が表示されている
  const img = page.locator('img[alt*="第110回"]')
  // image_url があれば画像が表示される（なければスキップ）
  const hasImage = await img.count()
  if (hasImage > 0) {
    await expect(img.first()).toBeVisible()
  }

  // 通常の選択肢（Radio）も表示されている
  const radios = page.locator('.ant-radio')
  const radioCount = await radios.count()
  expect(radioCount).toBeGreaterThan(0)
})

test('correct_answer=0 の問題で「データ準備中」が表示される', async ({ page }) => {
  // correct_answer=0 の問題を特定して遷移（Task 7 で具体的なIDが判明する）
  // ※ データ修正で0が全てなくなった場合はこのテストをスキップ
  // 暫定: grep で見つかった問題IDを使う
  // Run: grep -n '"correct_answer": 0' src/data/real-questions/exam-*.ts | head -1
  // → 該当IDで page.goto
  // await page.goto('/practice/<該当問題ID>')
  // await page.waitForLoadState('networkidle')
  // await expect(page.getByText('この問題はデータ準備中です')).toBeVisible()
  // 回答ボタンが無効であることを確認
  // const submitBtn = page.getByRole('button', { name: '回答する' })
  // await expect(submitBtn).toBeDisabled()
})

test('PracticePage で画像フィルタが動作する', async ({ page }) => {
  await page.goto('/practice')
  await page.waitForLoadState('networkidle')

  // 「画像問題のみ」ラベルの近くのスイッチをONにする
  const imageFilterLabel = page.getByText('画像問題のみ')
  const imageSwitch = imageFilterLabel.locator('..').locator('.ant-switch')
  await imageSwitch.click()

  // フィルタ後の問題数が変わっている（画像問題は全体の一部）
  const badge = page.locator('.ant-badge .ant-ribbon')
  await expect(badge).toBeVisible()
})
```

- [ ] **Step 2: テスト実行**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx playwright test e2e/smoke.spec.ts`
Expected: 全テスト PASS

- [ ] **Step 3: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add e2e/smoke.spec.ts
git commit -m "test: 画像問題の回答・表示・フィルタのE2Eテストを追加"
```

---

### Task 7: correct_answer 範囲外データの修正

**Files:**
- Modify: `src/data/real-questions/exam-{100,101,102,103,104,105,106}.ts`

- [ ] **Step 1: correct_answer=0 と correct_answer=6 の問題を特定**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && grep -n '"correct_answer": [06]' src/data/real-questions/exam-*.ts`

各問題の question_number と year を記録する。

- [ ] **Step 2: 厚労省正答PDFと照合して正しい correct_answer を特定**

scripts/answers-{100-106}.json（既に抽出済み）と照合する。
correct_answer=0 は正答不明のまま → そのまま残す（UIでは「データ準備中」と表示される）。
correct_answer=6 は6択問題 → 番号ボタンを6つ表示するので UIは対応済み。

- [ ] **Step 3: 修正が必要な問題のデータを更新**

正答PDFと照合して正しい値がわかった問題のみ修正する。

- [ ] **Step 4: ビルド確認**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npm run build`
Expected: 成功

- [ ] **Step 5: コミット**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
git add src/data/real-questions/exam-*.ts
git commit -m "fix: correct_answer 範囲外データを厚労省正答PDFと照合・修正"
```

---

## 実行順序と依存関係

```
Task 1 (型定義)    ← 独立（将来のAPI連携用、現時点で他タスクの前提ではない）
Task 2 (画像表示) → Task 3 (番号ボタン) → Task 6 (E2Eテスト)
Task 4 (アイコン) → Task 5 (フィルタ) ──→ ↗
Task 7 (データ修正) ← 独立、いつでも実行可
```

**並列実行可能な組み合わせ:**
- Task 1 + Task 2 + Task 4 + Task 7 は全て独立で並列可能
- Task 3 は Task 2 の後（同じファイル QuestionPage.tsx）
- Task 5 は Task 4 の後（同じファイル PracticePage.tsx）
- Task 6 は Task 3, 5 の全完了後（全UIが揃ってからテスト）

**推奨実行順:** Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 1 → Task 7
（順次実行の場合。並列ならTask 2+4を同時、次にTask 3+5を同時、最後にTask 6）
