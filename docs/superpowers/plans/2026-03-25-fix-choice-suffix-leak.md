# fix-choice-suffix-leak.ts 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** question_text 末尾に漏れた選択肢サフィックスを自動検出・修正し、corrections.json 互換の中間JSONを出力するスクリプトを作成する

**Architecture:** 検出→分類→修正生成の3段パイプライン。既存 `apply-corrections.ts` → `json-to-exam-ts.ts` のパイプラインと互換性のある corrections JSON を出力。AUTO_HIGH のみ自動修正、それ以外は手動レビュー用レポートに分離。

**Tech Stack:** TypeScript (tsx), Node.js, 既存の exam-*.ts データファイル読み込み

---

## ファイル構成

| ファイル | 役割 |
|---------|------|
| `scripts/fix-choice-suffix-leak.ts` | メインCLI（検出→分類→出力） |
| `scripts/lib/suffix-leak-detector.ts` | 検出ロジック（純粋関数、テスト容易） |
| `scripts/lib/__tests__/suffix-leak-detector.test.ts` | テスト |

## 出力ファイル

| ファイル | 内容 |
|---------|------|
| `reports/suffix-leak-auto-corrections.json` | AUTO_HIGH の修正（`CorrectionsFile` 互換） |
| `reports/suffix-leak-review.json` | REVIEW 候補（手動確認用レポート） |

---

### Task 1: suffix-leak-detector コア関数 — テスト＋実装

**Files:**
- Create: `scripts/lib/suffix-leak-detector.ts`
- Create: `scripts/lib/__tests__/suffix-leak-detector.test.ts`

**設計:**

```typescript
// suffix-leak-detector.ts

interface LeakDetectionResult {
  questionId: string
  confidence: 'AUTO_HIGH' | 'AUTO_MEDIUM' | 'REVIEW'
  leakedLines: string[]          // question_text 末尾の漏れ行
  cleanedQuestionText: string    // 漏れ行除去後の question_text
  mergedChoices: Choice[] | null // 修正後の選択肢（AUTO のみ）
  reason: string                 // 分類理由
}

/** question_text の終端パターンを検出し、その後の行を返す */
function extractLeakedLines(questionText: string): { termLine: number; lines: string[] } | null

/** 漏れ行と choices を結合して修正候補を生成 */
function tryMerge(leakedLines: string[], choices: Choice[]): { merged: Choice[]; confidence: 'AUTO_HIGH' | 'AUTO_MEDIUM' | 'REVIEW'; reason: string }

/** メインの検出関数 */
function detectSuffixLeak(question: { id: string; question_text: string; choices: Choice[] }): LeakDetectionResult | null
```

**分類ロジック（GPT-5.4レビュー反映）:**

- **終端検出**: `はどれか / を選べ / つ選べ / 選びなさい / 正しい組合せはどれか / 誤っているのはどれか` の後の行を取得
- **除外**: `ただし / なお / ここで / 図 / 下図 / 表 / 次の式 / 問\d+` で始まる行は leak ではない（条件文・連問ヘッダ）
- **AUTO_HIGH**: `leakedLines.length === choices.length` AND 各行が短い（≤30文字）AND 結合後に重複が減る
- **AUTO_MEDIUM**: `leakedLines.length === choices.length - 1` AND 上記条件
- **REVIEW**: それ以外

- [ ] **Step 1: テストファイル作成**

```typescript
// scripts/lib/__tests__/suffix-leak-detector.test.ts
import { describe, it, expect } from 'vitest'
import { extractLeakedLines, tryMerge, detectSuffixLeak } from '../suffix-leak-detector'

describe('extractLeakedLines', () => {
  it('終端パターン後の行を検出する', () => {
    const text = 'テトラカインの機序はどれか。１つ選べ。\nチャネル活性化\nチャネル遮断'
    const result = extractLeakedLines(text)
    expect(result).not.toBeNull()
    expect(result!.lines).toEqual(['チャネル活性化', 'チャネル遮断'])
  })

  it('「ただし」で始まる行は除外する', () => {
    const text = '機序はどれか。１つ選べ。\nただし、温度は25℃とする。'
    const result = extractLeakedLines(text)
    expect(result).toBeNull()
  })

  it('連問ヘッダ「問196-197」は除外する', () => {
    const text = '適切なのはどれか。１つ選べ。\n問196−197'
    const result = extractLeakedLines(text)
    expect(result).toBeNull()
  })

  it('空行のみの場合はnull', () => {
    const text = '正しいのはどれか。２つ選べ。\n\n'
    const result = extractLeakedLines(text)
    expect(result).toBeNull()
  })

  it('choices が空配列の場合はnull（画像問題）', () => {
    const result = detectSuffixLeak({
      id: 'r106-006',
      question_text: '第二級アミンはどれか。1つ選べ。',
      choices: [],
    })
    expect(result).toBeNull()
  })
})

describe('tryMerge', () => {
  it('EXACT MATCH: leaked行数 = choices数 → AUTO_HIGH', () => {
    const leaked = ['チャネル活性化', 'チャネル遮断', 'チャネル活性化', 'チャネル遮断', 'チャネル活性化']
    const choices = [
      { key: 1, text: 'K＋' },
      { key: 2, text: 'K＋' },
      { key: 3, text: 'Na＋' },
      { key: 4, text: 'Na＋' },
      { key: 5, text: 'Ca2＋' },
    ]
    const result = tryMerge(leaked, choices)
    expect(result.confidence).toBe('AUTO_HIGH')
    expect(result.merged[0].text).toBe('K＋チャネル活性化')
    expect(result.merged[3].text).toBe('Na＋チャネル遮断')
  })

  it('受容体サフィックス: 同一suffix → AUTO_HIGH', () => {
    const leaked = ['受容体', '受容体', '受容体', '受容体', '受容体']
    const choices = [
      { key: 1, text: 'アドレナリンβ1' },
      { key: 2, text: 'ドパミンD2' },
      { key: 3, text: 'オピオイドµ' },
      { key: 4, text: 'アセチルコリンM2' },
      { key: 5, text: 'ヒスタミンH1' },
    ]
    const result = tryMerge(leaked, choices)
    expect(result.confidence).toBe('AUTO_HIGH')
    expect(result.merged[0].text).toBe('アドレナリンβ1受容体')
  })

  it('行数不一致 → REVIEW', () => {
    const leaked = ['受容体', '受容体']
    const choices = [
      { key: 1, text: 'A' },
      { key: 2, text: 'B' },
      { key: 3, text: 'C' },
    ]
    const result = tryMerge(leaked, choices)
    expect(result.confidence).toBe('REVIEW')
  })

  it('結合後に重複が増える場合は REVIEW に降格', () => {
    // choice が既に完全で、suffix を付けると壊れるケース
    const leaked = ['受容体']
    const choices = [{ key: 1, text: 'ヒスタミンH1受容体' }]
    const result = tryMerge(leaked, choices)
    expect(result.confidence).toBe('REVIEW')
    expect(result.reason).toContain('二重結合')
  })
})

describe('detectSuffixLeak', () => {
  it('r100-028 パターンを検出する', () => {
    const result = detectSuffixLeak({
      id: 'r100-028',
      question_text: 'テトラカインの局所麻酔作用の機序はどれか。１つ選べ。\n\nチャネル活性化\t\nチャネル遮断\t\nチャネル活性化\nチャネル遮断\t\nチャネル活性化',
      choices: [
        { key: 1, text: 'K＋' },
        { key: 2, text: 'K＋' },
        { key: 3, text: 'Na＋' },
        { key: 4, text: 'Na＋' },
        { key: 5, text: 'Ca2＋' },
      ],
    })
    expect(result).not.toBeNull()
    expect(result!.confidence).toBe('AUTO_HIGH')
    expect(result!.mergedChoices![3].text).toBe('Na＋チャネル遮断')
  })

  it('正常な問題は null を返す', () => {
    const result = detectSuffixLeak({
      id: 'r100-001',
      question_text: '正しいのはどれか。１つ選べ。',
      choices: [
        { key: 1, text: '選択肢A' },
        { key: 2, text: '選択肢B' },
      ],
    })
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: テスト実行 → 失敗確認**

```bash
npx vitest run scripts/lib/__tests__/suffix-leak-detector.test.ts
```
Expected: FAIL（モジュール未作成）

- [ ] **Step 3: suffix-leak-detector.ts 実装**

```typescript
// scripts/lib/suffix-leak-detector.ts

interface Choice {
  key: number
  text: string
  choice_type?: string
}

export interface LeakDetectionResult {
  questionId: string
  confidence: 'AUTO_HIGH' | 'AUTO_MEDIUM' | 'REVIEW'
  leakedLines: string[]
  cleanedQuestionText: string
  mergedChoices: Choice[] | null
  reason: string
}

// 終端パターン: question_text の「問いかけ」部分の終わり
const TERMINATOR_RE = /(?:はどれか|を選べ|つ選べ|選びなさい|正しい組合せ|誤っている(?:の|もの)はどれか)[。．.]?\s*$/

// leak ではない行の開始パターン（条件文・注記・連問ヘッダ）
const SAFE_LINE_STARTS = [
  /^ただし/,
  /^なお[、,]/,
  /^ここで/,
  /^[（(]?(?:図|下図|表|次の|以下)/,
  /^問\s*\d/,       // 連問ヘッダ
  /^注[）)：:]/,
  /^ただし[、,]/,
]

// 既に choice に含まれている suffix パターン（二重結合検出用）
const COMMON_SUFFIXES = ['受容体', 'チャネル', 'ATPase', '共輸送体', '逆輸送体', '阻害', '遮断', '刺激', '活性化']

export function extractLeakedLines(questionText: string): { termLineIndex: number; lines: string[] } | null {
  const allLines = questionText.split('\n')

  // 終端行を後ろから探す
  let termLineIndex = -1
  for (let i = allLines.length - 1; i >= 0; i--) {
    if (TERMINATOR_RE.test(allLines[i].trim())) {
      termLineIndex = i
      break
    }
  }

  if (termLineIndex === -1) return null

  // 終端行の後の非空白行を収集
  const leaked: string[] = []
  for (let i = termLineIndex + 1; i < allLines.length; i++) {
    const trimmed = allLines[i].replace(/\t/g, '').trim()
    if (!trimmed) continue
    // 安全な行なら leak ではない
    if (SAFE_LINE_STARTS.some(re => re.test(trimmed))) return null
    leaked.push(trimmed)
  }

  if (leaked.length === 0) return null
  return { termLineIndex, lines: leaked }
}

export function tryMerge(
  leakedLines: string[],
  choices: Choice[],
): { merged: Choice[] | null; confidence: 'AUTO_HIGH' | 'AUTO_MEDIUM' | 'REVIEW'; reason: string } {
  const n = leakedLines.length
  const c = choices.length

  if (c === 0) return { merged: null, confidence: 'REVIEW', reason: '選択肢が空（画像問題）' }

  // EXACT MATCH: leaked行数 = choices数
  if (n === c) {
    // 各行が短い（suffix らしい）か確認
    const allShort = leakedLines.every(l => l.length <= 40)
    if (!allShort) return { merged: null, confidence: 'REVIEW', reason: `漏れ行が長い（>40文字）` }

    const merged = choices.map((ch, i) => ({
      ...ch,
      text: ch.text + leakedLines[i],
    }))

    // 二重結合チェック: 結合後に既知 suffix が2回出現しないか
    const hasDuplicate = merged.some(m =>
      COMMON_SUFFIXES.some(s => {
        const count = (m.text.match(new RegExp(s, 'g')) ?? []).length
        return count >= 2
      })
    )
    if (hasDuplicate) {
      return { merged: null, confidence: 'REVIEW', reason: '二重結合の可能性（suffix が既に choice に含まれている）' }
    }

    return { merged, confidence: 'AUTO_HIGH', reason: `EXACT: ${n}行 = ${c}選択肢` }
  }

  // CLOSE MATCH: leaked行数 = choices数 - 1
  if (n === c - 1) {
    const allShort = leakedLines.every(l => l.length <= 40)
    if (!allShort) return { merged: null, confidence: 'REVIEW', reason: `CLOSE だが漏れ行が長い` }

    // 最後の choice は既に完全と仮定して、先頭 n 個だけ結合
    const merged = choices.map((ch, i) => {
      if (i < n) return { ...ch, text: ch.text + leakedLines[i] }
      return { ...ch }
    })

    const hasDuplicate = merged.some(m =>
      COMMON_SUFFIXES.some(s => ((m.text.match(new RegExp(s, 'g')) ?? []).length) >= 2)
    )
    if (hasDuplicate) {
      return { merged: null, confidence: 'REVIEW', reason: '二重結合の可能性（CLOSE）' }
    }

    return { merged, confidence: 'AUTO_MEDIUM', reason: `CLOSE: ${n}行 = ${c}選択肢 - 1` }
  }

  return { merged: null, confidence: 'REVIEW', reason: `行数不一致: ${n}行 vs ${c}選択肢` }
}

export function detectSuffixLeak(question: {
  id: string
  question_text: string
  choices: Choice[]
}): LeakDetectionResult | null {
  if (!question.choices || question.choices.length === 0) return null
  if (!question.question_text) return null

  const extracted = extractLeakedLines(question.question_text)
  if (!extracted) return null

  const { termLineIndex, lines } = extracted
  const allLines = question.question_text.split('\n')
  const cleanedQuestionText = allLines.slice(0, termLineIndex + 1).join('\n').trim()

  const { merged, confidence, reason } = tryMerge(lines, question.choices)

  return {
    questionId: question.id,
    confidence,
    leakedLines: lines,
    cleanedQuestionText,
    mergedChoices: merged,
    reason,
  }
}
```

- [ ] **Step 4: テスト実行 → 全パス確認**

```bash
npx vitest run scripts/lib/__tests__/suffix-leak-detector.test.ts
```

- [ ] **Step 5: コミット**

```bash
git add scripts/lib/suffix-leak-detector.ts scripts/lib/__tests__/suffix-leak-detector.test.ts
git commit -m "feat: suffix-leak-detector コア関数（検出・分類・結合ロジック）"
```

---

### Task 2: メインCLI スクリプト

**Files:**
- Create: `scripts/fix-choice-suffix-leak.ts`

**CLI仕様:**
```bash
npx tsx scripts/fix-choice-suffix-leak.ts                    # 全年度スキャン + レポート出力
npx tsx scripts/fix-choice-suffix-leak.ts --dry-run          # 差分表示のみ
npx tsx scripts/fix-choice-suffix-leak.ts --year 100-106     # 年度範囲指定
npx tsx scripts/fix-choice-suffix-leak.ts --apply            # AUTO_HIGH を corrections.json に出力
```

- [ ] **Step 1: CLIスクリプト実装**

```typescript
// scripts/fix-choice-suffix-leak.ts
/**
 * 選択肢サフィックス漏れを検出・修正するスクリプト
 *
 * 用法:
 *   npx tsx scripts/fix-choice-suffix-leak.ts                  # スキャン + レポート
 *   npx tsx scripts/fix-choice-suffix-leak.ts --dry-run        # 差分プレビュー
 *   npx tsx scripts/fix-choice-suffix-leak.ts --apply          # corrections JSON 出力
 *   npx tsx scripts/fix-choice-suffix-leak.ts --year 103-106   # 年度範囲指定
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { detectSuffixLeak } from './lib/suffix-leak-detector'
import type { LeakDetectionResult } from './lib/suffix-leak-detector'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

interface Question {
  id: string
  year: number
  question_number: number
  question_text: string
  choices: Array<{ key: number; text: string; choice_type?: string }>
  correct_answer: number | number[]
}

// ===== dataHash (apply-corrections.ts と同一アルゴリズム) =====
function computeDataHash(q: Question): string {
  const str = q.question_text + JSON.stringify(q.choices) + JSON.stringify(q.correct_answer)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return hash.toString(36)
}

// ===== CLI引数パース =====
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const apply = args.includes('--apply')
const yearArg = args.find(a => a.startsWith('--year'))
  ? args[args.indexOf(args.find(a => a.startsWith('--year'))!) + 1]
  : null

function parseYearRange(arg: string | null): number[] {
  if (!arg) return Array.from({ length: 12 }, (_, i) => 100 + i)
  const [start, end] = arg.split('-').map(Number)
  if (!end) return [start]
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

const years = parseYearRange(yearArg)

// ===== メイン処理 =====
async function main() {
  const allResults: LeakDetectionResult[] = []

  for (const year of years) {
    const filePath = path.join(PROJECT_ROOT, `src/data/real-questions/exam-${year}.ts`)
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠ exam-${year}.ts not found, skipping`)
      continue
    }

    // TypeScript ファイルから Question 配列を動的読み込み
    const mod = await import(filePath)
    const questions: Question[] = Object.values(mod).find(v => Array.isArray(v)) as Question[] ?? []

    for (const q of questions) {
      const result = detectSuffixLeak(q)
      if (result) allResults.push(result)
    }
  }

  // ===== 集計 =====
  const autoHigh = allResults.filter(r => r.confidence === 'AUTO_HIGH')
  const autoMedium = allResults.filter(r => r.confidence === 'AUTO_MEDIUM')
  const review = allResults.filter(r => r.confidence === 'REVIEW')

  console.log(`\n📊 選択肢サフィックス漏れ検出結果`)
  console.log(`   対象年度: ${years.join(', ')}`)
  console.log(`   検出総数: ${allResults.length}`)
  console.log(`   AUTO_HIGH:   ${autoHigh.length} (自動修正可)`)
  console.log(`   AUTO_MEDIUM: ${autoMedium.length} (条件付き自動修正)`)
  console.log(`   REVIEW:      ${review.length} (手動確認必要)`)

  // ===== dry-run: 差分表示 =====
  if (dryRun) {
    for (const r of [...autoHigh, ...autoMedium].slice(0, 20)) {
      console.log(`\n--- ${r.questionId} [${r.confidence}] ${r.reason}`)
      console.log(`  漏れ行: ${r.leakedLines.join(' | ')}`)
      if (r.mergedChoices) {
        r.mergedChoices.forEach(c => console.log(`  → 選択肢${c.key}: ${c.text}`))
      }
    }
    if (allResults.length > 20) console.log(`\n  ... and ${allResults.length - 20} more`)
    return
  }

  // ===== apply: corrections JSON 出力 =====
  if (apply) {
    const reportsDir = path.join(PROJECT_ROOT, 'reports')
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true })

    // AUTO corrections (apply-corrections.ts 互換)
    const autoResults = [...autoHigh, ...autoMedium].filter(r => r.mergedChoices)
    const corrections: Record<string, { dataHash: string; items: unknown[] }> = {}

    for (const r of autoResults) {
      // 元の question データを再取得して dataHash 計算
      const year = parseInt(r.questionId.split('-')[0].replace('r', ''), 10)
      const filePath = path.join(PROJECT_ROOT, `src/data/real-questions/exam-${year}.ts`)
      const mod = await import(filePath)
      const questions: Question[] = Object.values(mod).find(v => Array.isArray(v)) as Question[] ?? []
      const q = questions.find(q => q.id === r.questionId)
      if (!q) continue

      corrections[r.questionId] = {
        dataHash: computeDataHash(q),
        items: [
          { type: 'text', field: 'question_text', value: r.cleanedQuestionText },
          { type: 'choices', value: r.mergedChoices },
        ],
      }
    }

    const correctionsFile = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      baseGitCommit: '',  // 実行時に git rev-parse HEAD で埋める
      reportTimestamp: new Date().toISOString(),
      corrections,
    }

    const autoPath = path.join(reportsDir, 'suffix-leak-auto-corrections.json')
    fs.writeFileSync(autoPath, JSON.stringify(correctionsFile, null, 2))
    console.log(`\n✅ AUTO corrections: ${autoPath} (${Object.keys(corrections).length}件)`)

    // REVIEW レポート
    const reviewReport = review.map(r => ({
      questionId: r.questionId,
      confidence: r.confidence,
      reason: r.reason,
      leakedLines: r.leakedLines,
      currentChoices: null,  // 軽量化のため省略
    }))

    const reviewPath = path.join(reportsDir, 'suffix-leak-review.json')
    fs.writeFileSync(reviewPath, JSON.stringify(reviewReport, null, 2))
    console.log(`📋 REVIEW candidates: ${reviewPath} (${review.length}件)`)

    return
  }

  // ===== デフォルト: サマリ + 上位20件表示 =====
  console.log(`\n🔍 上位検出結果:`)
  for (const r of allResults.slice(0, 20)) {
    const tag = r.confidence === 'AUTO_HIGH' ? '✅' : r.confidence === 'AUTO_MEDIUM' ? '🟡' : '📋'
    console.log(`  ${tag} ${r.questionId} [${r.confidence}] ${r.reason}`)
    console.log(`     漏れ: ${r.leakedLines.slice(0, 3).join(' | ')}${r.leakedLines.length > 3 ? '...' : ''}`)
  }

  console.log(`\n💡 --dry-run で差分プレビュー、--apply で corrections JSON 出力`)
}

main().catch(console.error)
```

- [ ] **Step 2: 全年度でスキャン実行（dry-run）**

```bash
npx tsx scripts/fix-choice-suffix-leak.ts --dry-run
```

Expected: 検出結果のサマリと上位20件の差分表示

- [ ] **Step 3: 実データで検出精度を確認**

100回の手動レビュー済み corrections と比較:
- r100-028（チャネル）→ AUTO_HIGH で検出されるか
- r100-027（受容体）→ AUTO_HIGH で検出されるか
- r100-092（表データ）→ REVIEW に分類されるか

- [ ] **Step 4: コミット**

```bash
git add scripts/fix-choice-suffix-leak.ts
git commit -m "feat: fix-choice-suffix-leak.ts CLIスクリプト（検出・分類・corrections出力）"
```

---

### Task 3: 実データ検証 + GPT-5.4 レビュー

- [ ] **Step 1: --apply で corrections JSON 生成**

```bash
npx tsx scripts/fix-choice-suffix-leak.ts --apply
```

- [ ] **Step 2: 生成された corrections を手動レビュー用UIで確認**

```bash
# reports/suffix-leak-auto-corrections.json の件数と内容を確認
cat reports/suffix-leak-auto-corrections.json | npx tsx -e "
  const data = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'))
  console.log('修正対象:', Object.keys(data.corrections).length, '問')
  for (const [id, c] of Object.entries(data.corrections).slice(0, 5)) {
    console.log(id, '→', c.items.length, '件の修正')
  }
"
```

- [ ] **Step 3: GPT-5.4 レビュー**

```bash
codex review --commit HEAD
```

プロンプト:
- suffix-leak-detector の検出ロジックにエッジケース漏れはないか
- tryMerge の二重結合チェックは十分か
- corrections JSON の出力形式は apply-corrections.ts と互換か

- [ ] **Step 4: レビュー指摘修正 → 再コミット**

---

### Task 4: apply-corrections.ts で実データ修正適用

- [ ] **Step 1: 生成された corrections を適用（dry-run）**

```bash
npx tsx scripts/apply-corrections.ts --dry-run reports/suffix-leak-auto-corrections.json
```

- [ ] **Step 2: 差分確認 → 本適用**

```bash
npx tsx scripts/apply-corrections.ts reports/suffix-leak-auto-corrections.json
npx tsx scripts/json-to-exam-ts.ts
```

- [ ] **Step 3: ビルド・テスト確認**

```bash
npm run build && npx vitest run
```

- [ ] **Step 4: コミット**

```bash
git add src/data/real-questions/exam-*.ts reports/
git commit -m "fix: 選択肢サフィックス漏れ自動修正適用（AUTO_HIGH N問）"
```

---

### Task 5: バリデーターに新ルール追加（後続レビュー効率化）

**Files:**
- Modify: `src/utils/data-validator/rules/quality.ts`

- [ ] **Step 1: Rule 39 追加 — choice-suffix-in-question-text**

question_text の終端パターン後に非空白行がある問題を検出する warning ルール。
全問表示モードで REVIEW 候補を優先表示するために使用。

- [ ] **Step 2: npm run validate で確認**

- [ ] **Step 3: コミット**
