# 連問修復 残課題3件 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 実機検証で発見した3つの体験直結バグ（シナリオすり替わり・解説プレースホルダー・複数選択UI未対応）を修正し、連問の学習体験を完成させる

**Architecture:** Task 1でrepair-linked-groups.tsのextractScenario関数を修正しデータ再生成、Task 2でcorrect_answerの型を`number | number[]`に拡張しCheckbox UIを追加、Task 3で「親問題参照」解説をAI生成バッチで置換する。各タスクは独立して実行可能。

**Tech Stack:** TypeScript, React 19, Ant Design 6, Vite 8, Playwright (E2E), Claude API (@anthropic-ai/sdk)

**コードレビュー方針:** 各タスク完了時、Codex CLI（GPT-5.4）でコードレビューを実施する

---

## ファイル構成

| 操作 | ファイルパス | 責務 |
|------|-------------|------|
| Modify | `scripts/repair-linked-groups.ts` | extractScenario バグ修正 |
| Modify | `src/data/real-questions/exam-{100..111}.ts` | 修復スクリプト再実行で更新 |
| Modify | `src/types/question.ts` | correct_answer 型拡張 |
| Modify | `src/components/LinkedQuestionViewer.tsx` | Checkbox UI 追加 |
| Modify | `src/pages/QuestionPage.tsx` | 複数選択の正誤判定追加 |
| Modify | `src/hooks/useLinkedQuestions.ts` | 必要に応じ型更新 |
| Modify | `src/hooks/useAnswerHistory.ts` | selected_answer 型を number \| number[] に拡張 |
| Create | `src/utils/question-helpers.ts` | isMultiAnswer / getRequiredSelections ヘルパー |
| Create | `scripts/detect-multi-answer.ts` | 「2つ選べ」検出＋correct_answer修正 |
| Create | `scripts/regenerate-explanations.ts` | AI解説再生成バッチ |
| Modify | `e2e/smoke.spec.ts` | 連問・複数選択のE2Eテスト追加 |

> **注意:** `src/utils/` ディレクトリが存在しない場合は作成が必要

---

## Task 1: シナリオすり替わりバグ修正

**問題:** r100-196の連問ヘッダーが問196のシナリオでなく問197のテキストになっている
**原因:** `extractScenario()`がquestion_text_originalの「問XXX（科目）」マーカー検出で、先頭問題のシナリオを正しく抽出できないケースがある

**Files:**
- Modify: `scripts/repair-linked-groups.ts:214-280` — extractScenario関数
- Modify: `src/data/real-questions/exam-{100..111}.ts` — 再実行で自動更新

- [ ] **Step 1: 現状のシナリオデータを検証**

```bash
cd ~/projects/personal/pharma-exam-ai
npx tsx scripts/repair-linked-groups.ts --validate 2>&1 | head -50
```

Expected: バリデーション結果でシナリオ問題のある問題が特定できる

- [ ] **Step 2: extractScenario関数のバグを特定するデバッグログ追加**

`scripts/repair-linked-groups.ts` の extractScenario 関数冒頭にログを追加：

```typescript
function extractScenario(leadQ: QuestionInfo, allGroupQuestions: QuestionInfo[]): string {
  // DEBUG: どの問題のどのテキストからシナリオを抽出しているか確認
  console.log(`  [extractScenario] leadQ: r${leadQ.year}-${leadQ.questionNumber}`)
  console.log(`  [extractScenario] has questionTextOriginal: ${!!leadQ.questionTextOriginal} (len=${leadQ.questionTextOriginal?.length ?? 0})`)
  console.log(`  [extractScenario] has questionText: ${!!leadQ.questionText} (len=${leadQ.questionText?.length ?? 0})`)
```

```bash
npx tsx scripts/repair-linked-groups.ts --dry-run 2>&1 | grep -A3 "extractScenario.*r100-196"
```

Expected: leadQが確実にr100-196であること、かつどのStrategyでシナリオが抽出されるかを確認

- [ ] **Step 3: extractScenario関数を修正**

修正方針:
1. Strategy 1（question_text_original）でマーカーが見つからない場合、先頭問題のoriginal全文をシナリオ候補にする
2. 先頭問題の `category` フィールドからグループメンバー番号を取得し、最初の「問{最小番号}」マーカーより前をシナリオとする
3. allGroupQuestionsの全員のquestion_text_originalを結合して最初のマーカーより前を取る戦略を追加

```typescript
function extractScenario(leadQ: QuestionInfo, allGroupQuestions: QuestionInfo[]): string {
  // Strategy 1: question_text_original の先頭問題マーカーより前を抽出
  if (leadQ.questionTextOriginal) {
    const orig = leadQ.questionTextOriginal
    // グループの最初の問題番号でマーカーを探す
    const leadNum = leadQ.questionNumber
    const specificMarker = new RegExp(`問\\s*${leadNum}\\s*[（(]`)
    const specificMatch = orig.match(specificMarker)

    if (specificMatch && specificMatch.index !== undefined && specificMatch.index > 20) {
      const scenario = orig.slice(0, specificMatch.index).trim()
        .replace(/\\n/g, '\n')
        .replace(/\n+/g, ' ')
        .trim()
      if (scenario.length > 10) return escapeForJson(scenario)
    }

    // フォールバック: グループ最小番号でマーカー検索
    // （汎用マーカーだと問197が先にマッチしてバグるため、グループ内最小番号を使う）
    const minNum = Math.min(...allGroupQuestions.map(q => q.questionNumber))
    const minMarker = new RegExp(`問\\s*${minNum}\\s*[（(]`)
    const minMatch = orig.match(minMarker)
    if (minMatch && minMatch.index !== undefined && minMatch.index > 20) {
      const scenario = orig.slice(0, minMatch.index).trim()
        .replace(/\\n/g, '\n')
        .replace(/\n+/g, ' ')
        .trim()
      if (scenario.length > 10) return escapeForJson(scenario)
    }

    // 最終フォールバック: 汎用マーカー（上記で見つからない場合のみ）
    const markerRegex = /問\s*\d+\s*[（(]/
    const markerMatch = orig.match(markerRegex)
    if (markerMatch && markerMatch.index !== undefined && markerMatch.index > 20) {
      const scenario = orig.slice(0, markerMatch.index).trim()
        .replace(/\\n/g, '\n')
        .replace(/\n+/g, ' ')
        .trim()
      if (scenario.length > 10) return escapeForJson(scenario)
    }
  }

  // Strategy 2: question_text から抽出（既存ロジック維持）
  // ... (既存コードそのまま)

  // Strategy 3: 既存の linked_scenario を利用
  // ... (既存コードそのまま)

  return ''
}
```

- [ ] **Step 4: --dry-run で修正結果を確認**

```bash
npx tsx scripts/repair-linked-groups.ts --dry-run 2>&1 | grep -B2 -A5 "r100-196"
```

Expected: r100-196のシナリオが「慢性動脈閉塞症」等の正しい内容になっている（問197のテキストではない）

- [ ] **Step 5: 本実行でデータファイルを更新**

```bash
npx tsx scripts/repair-linked-groups.ts
```

Expected: 全年度のexamファイルが更新される

- [ ] **Step 6: バリデーション実行**

```bash
npx tsx scripts/repair-linked-groups.ts --validate
```

Expected: エラー0件

- [ ] **Step 7: ビルド確認**

```bash
npm run build
```

Expected: TypeScriptエラーなし、ビルド成功

- [ ] **Step 8: デバッグログを削除してコミット**

```bash
git add scripts/repair-linked-groups.ts src/data/real-questions/
git commit -m "fix: extractScenario関数を修正しシナリオすり替わりバグを解消"
```

- [ ] **Step 9: E2Eテスト追加（シナリオ表示確認）**

```typescript
// e2e/smoke.spec.ts に追加
test('連問のシナリオが正しく表示される', async ({ page }) => {
  await page.goto('/practice/r100-196')
  // 連問ヘッダーが表示される
  await expect(page.getByText('連問')).toBeVisible()
  // シナリオが表示される（問197のテキストではないこと）
  const scenarioText = await page.locator('[data-testid="linked-scenario"]').textContent()
  // シナリオが空でないこと
  expect(scenarioText?.length).toBeGreaterThan(10)
})
```

- [ ] **Step 10: Codex CLIでコードレビュー**

```bash
codex --model gpt-5.4 "以下のdiffをレビューしてください。変更の目的: repair-linked-groups.tsのextractScenario関数が先頭問題のシナリオではなく2番目の問題のテキストを取得していたバグの修正。$(git diff HEAD~1)"
```

---

## Task 2: 複数選択問題（「2つ選べ」）UI対応

**問題:** 「2つ選べ」問題が40問以上あるが、RadioGroup（単一選択）しかなく、correct_answerも単一数値
**対応:** ① 型拡張 → ② データ検出・修正 → ③ UI切替

**Files:**
- Modify: `src/types/question.ts:71` — correct_answer型拡張
- Create: `scripts/detect-multi-answer.ts` — 「2つ選べ」検出＋correct_answer修正
- Modify: `src/components/LinkedQuestionViewer.tsx:181-216` — Checkbox追加
- Modify: `src/pages/QuestionPage.tsx` — 個別問題ページにもCheckbox追加
- Modify: `e2e/smoke.spec.ts` — 複数選択テスト追加

### Task 2a: correct_answer 型拡張

- [ ] **Step 1: question.ts の型定義を変更**

```typescript
// src/types/question.ts
// Before:
correct_answer: number    // 1〜5

// After:
correct_answer: number | number[]    // 単一選択: number, 複数選択（「2つ選べ」）: number[]
```

- [ ] **Step 2: correct_answer を比較している全箇所をGrepで洗い出す**

```bash
cd ~/projects/personal/pharma-exam-ai
grep -rn "correct_answer" src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules" | grep -v "real-questions"
```

Expected: 以下の箇所が見つかる（各ファイルで `===` や表示に使用）:
- `src/components/LinkedQuestionViewer.tsx` — 約5箇所（正誤判定、choiceStyle、解答表示）
- `src/pages/QuestionPage.tsx` — 約6箇所（同上）
- `src/hooks/useAnswerHistory.ts` — selected_answer保存
- `src/types/question.ts` — 型定義

> **重要:** TSの `===` は `number | number[]` と `number` の比較でビルドエラーにならない場合がある。Grepで全箇所を特定し、手動で修正すること。

- [ ] **Step 2b: 比較箇所ごとにヘルパー関数で置き換え**

各箇所で `correct_answer === selectedAnswer` を以下に置換:

```typescript
// src/utils/question-helpers.ts に追加
export function isCorrectAnswer(
  correctAnswer: number | number[],
  selected: number | number[]
): boolean {
  if (Array.isArray(correctAnswer)) {
    if (!Array.isArray(selected)) return false
    const a = [...correctAnswer].sort()
    const b = [...selected].sort()
    return a.length === b.length && a.every((v, i) => v === b[i])
  }
  return correctAnswer === selected
}
```

- [ ] **Step 2c: useAnswerHistory の selected_answer 型を拡張**

```typescript
// src/hooks/useAnswerHistory.ts
// Before:
selected_answer: number
// After:
selected_answer: number | number[]
```

> **注意:** localStorage保存時のJSON.stringify/parseは配列も自動対応。Supabase移行時はJSONB型カラムに変更が必要。

- [ ] **Step 3: ビルドして残りのエラーを確認・修正**

```bash
npm run build 2>&1 | head -40
```

Expected: 全エラーが解消されていること

- [ ] **Step 3b: コミット**

```bash
git add src/types/question.ts src/utils/question-helpers.ts src/hooks/useAnswerHistory.ts
git commit -m "feat: correct_answerの型をnumber | number[]に拡張（複数選択対応）"
```

### Task 2b: 「2つ選べ」問題の検出＋correct_answer修正スクリプト

- [ ] **Step 4: 検出スクリプトを作成**

```typescript
// scripts/detect-multi-answer.ts
// 機能:
// 1. 全exam-{100..111}.tsを走査
// 2. question_textに「2つ選べ」を含む問題を検出
// 3. 該当問題のcorrect_answerが number なら警告表示
// 4. --fixモード: correct_answerを number[] に書き換え（手動確認用リスト出力）

import fs from 'fs'
import path from 'path'

const EXAM_DIR = path.join(__dirname, '../src/data/real-questions')

interface MultiAnswerQuestion {
  file: string
  id: string
  questionNumber: number
  year: number
  currentAnswer: number
  questionText: string  // 先頭100文字
}

function detectMultiAnswerQuestions(): MultiAnswerQuestion[] {
  const results: MultiAnswerQuestion[] = []

  for (let year = 100; year <= 111; year++) {
    const filePath = path.join(EXAM_DIR, `exam-${year}.ts`)
    if (!fs.existsSync(filePath)) continue
    const content = fs.readFileSync(filePath, 'utf-8')

    // question_text に「2つ選べ」「３つ選べ」を含む問題を検出
    const questionRegex = /\{\s*id:\s*"(r\d+-\d+)"[\s\S]*?question_number:\s*(\d+)[\s\S]*?question_text:\s*"([\s\S]*?)"[\s\S]*?correct_answer:\s*(\d+)/g

    let match
    while ((match = questionRegex.exec(content)) !== null) {
      const [, id, numStr, questionText, answerStr] = match
      if (/[2２二][つ]選べ/.test(questionText)) {
        results.push({
          file: `exam-${year}.ts`,
          id,
          questionNumber: parseInt(numStr),
          year,
          currentAnswer: parseInt(answerStr),
          questionText: questionText.slice(0, 100),
        })
      }
    }
  }

  return results
}

const results = detectMultiAnswerQuestions()
console.log(`\n「2つ選べ」問題: ${results.length}件\n`)
results.forEach(q => {
  console.log(`${q.file} | ${q.id} | 問${q.questionNumber} | 現在のanswer: ${q.currentAnswer}`)
})
```

- [ ] **Step 5: 検出スクリプトを実行**

```bash
npx tsx scripts/detect-multi-answer.ts
```

Expected: 40件以上の「2つ選べ」問題が一覧表示される

- [ ] **Step 6: correct_answer修正方針を決定**

> **注意:** 正解データの修正は薬剤師国試の正式解答に基づく必要がある。
> - 選択肢1: AI（Claude API）に問題文＋選択肢を渡して正解を推定 → 手動確認
> - 選択肢2: 公式解答データ（外部ソース）を参照して手動設定
> - **推奨:** まずAI推定 → CSVで出力 → 手動レビュー → データ反映

このステップは対話的に進める（正解データの正確性が最優先のため）。

- [ ] **Step 7: コミット**

```bash
git add scripts/detect-multi-answer.ts
git commit -m "feat: 「2つ選べ」問題検出スクリプトを追加"
```

### Task 2c: Checkbox UI 実装

- [ ] **Step 8: isMultiAnswer ヘルパー関数を作成**

```typescript
// src/utils/question-helpers.ts（新規作成 or 既存ファイルに追加）
export function isMultiAnswer(question: { question_text: string; correct_answer: number | number[] }): boolean {
  // correct_answerが配列なら確実に複数選択
  if (Array.isArray(question.correct_answer)) return true
  // question_textに「2つ選べ」「3つ選べ」を含む
  return /[2-9２-９二三四五][つ]選べ/.test(question.question_text)
}

export function getRequiredSelections(questionText: string): number {
  const match = questionText.match(/([2-9２-９])[つ]選べ/)
  if (!match) return 1
  const num = match[1]
  // 全角→半角変換
  const halfWidth = num.replace(/[２-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
  return parseInt(halfWidth) || 2
}
```

- [ ] **Step 9: LinkedQuestionViewer.tsx に Checkbox UI を追加**

修正箇所: `src/components/LinkedQuestionViewer.tsx` の選択肢レンダリング部分（現在 lines 181-216）

```tsx
// Before: Radio.Group のみ
// After: isMultiAnswer(q) で分岐

import { Checkbox, Radio } from 'antd'
import { isMultiAnswer, getRequiredSelections } from '../utils/question-helpers'

// state管理を拡張（selectedAnswer → selectedAnswers: number[]）
// 型定義:
interface QuestionState {
  selectedAnswer: number | null       // 単一選択用（既存）
  selectedAnswers: number[]           // 複数選択用（新規）
  isAnswered: boolean
  isCorrect: boolean | null
}

// 複数選択の場合:
{isMultiAnswer(q) ? (
  <Checkbox.Group
    value={state.selectedAnswers}
    onChange={(values) => {
      if (!state.isAnswered) {
        handleMultiSelect(q.id, values as number[])
      }
    }}
    style={{ width: '100%' }}
  >
    <Space direction="vertical" style={{ width: '100%' }}>
      {q.choices.map((choice) => (
        <Card key={choice.key} /* 既存スタイル */>
          <Checkbox value={choice.key} disabled={state.isAnswered}>
            <Text style={{ fontSize: 15 }}>
              {choice.key}. {choice.text}
            </Text>
          </Checkbox>
        </Card>
      ))}
    </Space>
  </Checkbox.Group>
) : (
  // 既存の Radio.Group（そのまま）
)}
```

- [ ] **Step 10: 正誤判定ロジックを修正**

```typescript
// LinkedQuestionViewer.tsx
function checkAnswer(questionId: string) {
  const question = group.questions.find(q => q.id === questionId)
  if (!question) return

  const state = states[questionId]
  let isCorrect: boolean

  if (Array.isArray(question.correct_answer)) {
    // 複数選択: 選択した値のソートと正解のソートが一致するか
    const sorted = [...state.selectedAnswers].sort()
    const correctSorted = [...question.correct_answer].sort()
    isCorrect = sorted.length === correctSorted.length &&
      sorted.every((v, i) => v === correctSorted[i])
  } else {
    // 単一選択（既存）
    isCorrect = state.selectedAnswer === question.correct_answer
  }

  setStates(prev => ({
    ...prev,
    [questionId]: { ...state, isAnswered: true, isCorrect }
  }))
}
```

- [ ] **Step 11: QuestionPage.tsx にも同様の複数選択対応を追加**

QuestionPage.tsx の個別問題表示（非連問）でも同じCheckbox分岐を適用。
`isMultiAnswer` ヘルパーを再利用する。

- [ ] **Step 12: 「Nつ選べ」ラベルを表示**

```tsx
// 問題ヘッダー部分に選択数のバッジを追加
{isMultiAnswer(q) && (
  <Tag color="orange" style={{ marginLeft: 8 }}>
    {getRequiredSelections(q.question_text)}つ選べ
  </Tag>
)}
```

- [ ] **Step 13: ビルド確認**

```bash
npm run build
```

Expected: エラーなし

- [ ] **Step 14: E2Eテスト追加**

```typescript
// e2e/smoke.spec.ts に追加
test('複数選択問題（2つ選べ）でCheckboxが表示される', async ({ page }) => {
  // 「2つ選べ」を含む問題に遷移（例: r100-197）
  await page.goto('/practice/r100-197')
  // Checkbox が表示される（Radio ではない）
  await expect(page.locator('.ant-checkbox')).toHaveCount({ minimum: 2 })
  // 「2つ選べ」タグが表示される
  await expect(page.getByText('2つ選べ')).toBeVisible()
})
```

- [ ] **Step 15: E2Eテスト実行**

```bash
npx playwright test e2e/smoke.spec.ts --headed
```

Expected: 全テスト PASS

- [ ] **Step 16: コミット**

```bash
git add src/types/question.ts src/utils/question-helpers.ts src/components/LinkedQuestionViewer.tsx src/pages/QuestionPage.tsx e2e/smoke.spec.ts
git commit -m "feat: 複数選択問題（2つ選べ）のCheckbox UI対応"
```

- [ ] **Step 17: Codex CLIでコードレビュー**

```bash
codex --model gpt-5.4 "以下のdiffをレビューしてください。変更の目的: 「2つ選べ」問題にCheckbox UIを追加し、correct_answerをnumber | number[]に拡張。正誤判定も複数回答に対応。$(git diff HEAD~1)"
```

---

## Task 3: 解説「親問題参照」プレースホルダーの置換

**問題:** 連問の各問の解説が「（連問のため親問題の解説を参照）」のまま
**対応:** Claude APIで各問ごとに独立した解説をバッチ生成（約600問対象）

**Files:**
- Create: `scripts/regenerate-explanations.ts` — AI解説再生成バッチ
- Modify: `src/data/real-questions/exam-{100..111}.ts` — 解説更新

- [ ] **Step 1: 対象問題を検出**

```bash
cd ~/projects/personal/pharma-exam-ai
grep -r "親問題の解説を参照" src/data/real-questions/ | wc -l
```

Expected: 約600件

- [ ] **Step 2: 解説再生成スクリプトを作成**

```typescript
// scripts/regenerate-explanations.ts
// 機能:
// 1. 全examファイルから「親問題の解説を参照」を含む問題を検出
// 2. 各問題について:
//    - 共通シナリオ（linked_scenario）
//    - 問題文（question_text）
//    - 選択肢（choices）
//    - 正解（correct_answer）
//    を Claude API に渡して解説を生成
// 3. 生成した解説でファイルを更新
// 4. --dry-run: 対象件数のみ表示
// 5. --batch N: N件ずつ処理（API制限対策、デフォルト10）
// 6. --year N: 特定年度のみ処理

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM_PROMPT = `あなたは薬剤師国家試験の解説を作成する専門家です。
以下の形式で簡潔かつ正確な解説を作成してください：

【ポイント】この問題の核心を1-2文で
【正答の根拠】正解の選択肢がなぜ正しいかを説明
【誤答の理由】各誤答がなぜ間違いかを簡潔に
【補足】関連する重要な知識（あれば）

注意：
- 薬剤師国試レベルの正確性を維持
- 選択肢番号を明示して解説
- 200-400文字程度に収める`

async function generateExplanation(scenario: string, questionText: string, choices: string, correctAnswer: string): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `【共通シナリオ】\n${scenario}\n\n【問題文】\n${questionText}\n\n【選択肢】\n${choices}\n\n【正解】${correctAnswer}\n\n上記の薬剤師国家試験問題の解説を作成してください。`
    }],
    system: SYSTEM_PROMPT,
  })

  return (message.content[0] as { text: string }).text
}

// メイン処理: ファイル走査 → API呼び出し → ファイル更新
// 進捗表示: [123/600] r100-197 ... done (1.2s)
// エラーハンドリング: リトライ3回、失敗はスキップしてログ出力
```

- [ ] **Step 3: --dry-run で対象確認**

```bash
npx tsx scripts/regenerate-explanations.ts --dry-run
```

Expected: 対象問題一覧と件数が表示される

- [ ] **Step 4: 1年度分でテスト実行**

```bash
npx tsx scripts/regenerate-explanations.ts --year 100 --batch 5
```

Expected: exam-100.tsの対象問題の解説が更新される

- [ ] **Step 5: 更新された解説を目視確認**

```bash
git diff src/data/real-questions/exam-100.ts | head -100
```

Expected: 「親問題の解説を参照」が具体的な解説に置き換わっている

- [ ] **Step 6: 全年度実行**

```bash
npx tsx scripts/regenerate-explanations.ts --batch 10
```

Expected: 全600問の解説が更新される（API呼び出しのため所要時間: 約30-60分）

> **⏰ 時間注意:** このステップは隙間時間（30分）では完了しない可能性あり。バックグラウンド実行するか、別セッションで実行すること。`--year` オプションで年度単位に分割実行も可能。

- [ ] **Step 7: 残りの「親問題参照」がゼロであることを確認**

```bash
grep -r "親問題の解説を参照" src/data/real-questions/ | wc -l
```

Expected: 0

- [ ] **Step 8: ビルド確認**

```bash
npm run build
```

Expected: エラーなし

- [ ] **Step 9: コミット**

```bash
git add scripts/regenerate-explanations.ts src/data/real-questions/
git commit -m "feat: 連問600問の解説をAI生成で置換（親問題参照プレースホルダー解消）"
```

- [ ] **Step 10: Codex CLIでコードレビュー**

```bash
codex --model gpt-5.4 "以下のスクリプトをレビューしてください。変更の目的: 連問約600問の「親問題の解説を参照」プレースホルダーをClaude APIで生成した解説に置換するバッチスクリプト。$(cat scripts/regenerate-explanations.ts)"
```

---

## タスク依存関係

```
Task 1 (シナリオ修正)  ──→ 独立実行可能
Task 2 (複数選択UI)    ──→ 独立実行可能（ただし2bの正解データ修正はTask 3と並行不可）
Task 3 (解説再生成)    ──→ Task 1完了後が望ましい（正しいシナリオでAI生成するため）
```

**推奨実行順序:** Task 1 → Task 2a/2b/2c → Task 3

---

## 完了基準

- [ ] 全連問のlinked_scenarioが正しいシナリオ（すり替わりゼロ）
- [ ] 「2つ選べ」問題でCheckbox UIが表示される
- [ ] 「親問題の解説を参照」が全問ゼロ
- [ ] `npm run build` 成功
- [ ] E2Eテスト全PASS
- [ ] 各タスクでCodex CLI（GPT-5.4）コードレビュー実施済み
