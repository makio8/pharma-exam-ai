# 画像欠落137問の修復 — 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 画像を参照しているのに `image_url` が未設定の137問に対し、PDFから画像を抽出して設定する

**Architecture:** 既存の座標クロップパイプライン（`crop-question-images.ts`）のフィルタ条件を「choices空のみ」から「確定IDリスト + キーワードヒット」に拡張し、全11年度で再実行。スクリプトのパス設定を永続ディレクトリ（`data/`）に統一。

**Tech Stack:** TypeScript (tsx), Sharp (画像処理), pdftotext/pdftoppm (PDF処理), Node.js

**Spec:** `docs/superpowers/specs/2026-03-23-missing-image-repair-design.md`

---

## ファイル構成

| 操作 | ファイル | 責務 |
|------|---------|------|
| 新規 | `scripts/lib/paths.ts` | パス定数の一元管理 |
| 新規 | `src/data/real-questions/missing-image-ids.json` | 確定IDリスト（137問） |
| 新規 | `scripts/generate-missing-image-ids.ts` | 確定IDリスト生成スクリプト |
| 変更 | `scripts/crop-question-images.ts:73-102` | `loadEmptyChoicesQuestions` → `loadTargetQuestions` にリネーム・拡張 |
| 変更 | `scripts/crop-question-images.ts:113-117` | パス定数を `paths.ts` から読み込み |
| 変更 | `scripts/add-image-urls-batch.ts:17` | years 配列を 100-110 に拡張 |
| 変更 | `scripts/add-image-urls-batch.ts:34-41` | 既存 `image_url` 保護ロジック追加 |
| 変更 | `scripts/download-exam-pdfs.sh` | 107-110回のURL追加、出力先変更 |
| 変更 | `.gitignore` | `data/pdfs/`, `data/exam-pages/` 追加 |
| 変更 | `src/data/real-questions/exam-{100-110}.ts` | image_url フィールド追加（パイプライン出力） |

---

### Task 1: 確定IDリスト生成

**Files:**
- Create: `scripts/generate-missing-image-ids.ts`
- Create: `src/data/real-questions/missing-image-ids.json`

- [ ] **Step 1: 診断スクリプトを作成**

```typescript
// scripts/generate-missing-image-ids.ts
/**
 * 画像参照キーワードを含むが image_url が未設定の問題IDリストを生成
 * npx tsx scripts/generate-missing-image-ids.ts
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.join(__dirname, '..', 'src', 'data', 'real-questions')

const IMAGE_KEYWORDS = /下図|この図|次の図|図[1-9１-９]|構造式[をがはの]|下の構造|模式図|グラフ[をがはの]|以下の図|図に示|スキーム|下表|処方[箋せん]/

interface MissingEntry {
  id: string
  year: number
  question_number: number
  tier: 1 | 2 | 3
  keyword_match: string
}

function classifyTier(text: string): 1 | 2 | 3 {
  if (/下図|この図|次の図/.test(text)) return 1
  if (/構造式|模式図|グラフ|スキーム|以下の図|図に示|図[1-9１-９]/.test(text)) return 2
  return 3
}

const results: MissingEntry[] = []

for (let year = 100; year <= 110; year++) {
  const tsPath = path.join(dataDir, `exam-${year}.ts`)
  if (!fs.existsSync(tsPath)) continue
  const content = fs.readFileSync(tsPath, 'utf-8')
  const arrayStart = content.indexOf('[\n')
  if (arrayStart === -1) continue
  const questions = JSON.parse(content.substring(arrayStart).trimEnd())

  for (const q of questions) {
    if (q.image_url) continue  // 既に設定済み → スキップ
    const match = q.question_text?.match(IMAGE_KEYWORDS)
    if (match) {
      results.push({
        id: q.id,
        year: q.year ?? year,
        question_number: q.question_number,
        tier: classifyTier(q.question_text),
        keyword_match: match[0],
      })
    }
  }
}

const output = {
  description: '画像参照キーワードを含むが image_url 未設定の問題IDリスト',
  generated: new Date().toISOString().split('T')[0],
  total: results.length,
  tier1: results.filter(r => r.tier === 1).length,
  tier2: results.filter(r => r.tier === 2).length,
  tier3: results.filter(r => r.tier === 3).length,
  ids: results.map(r => r.id),
  details: results,
}

const outPath = path.join(dataDir, 'missing-image-ids.json')
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8')
console.log(`✅ ${results.length}問のIDを ${outPath} に書き出しました`)
console.log(`  Tier 1 (回答不能): ${output.tier1}問`)
console.log(`  Tier 2 (画像推奨): ${output.tier2}問`)
console.log(`  Tier 3 (テキスト代替可能): ${output.tier3}問`)
```

- [ ] **Step 2: スクリプトを実行して確定IDリストを生成**

Run: `cd /Users/ai/projects/personal/pharma-exam-ai && npx tsx scripts/generate-missing-image-ids.ts`
Expected: `✅ 137問のIDを ... に書き出しました`（前後の変動は許容）

- [ ] **Step 3: 出力を確認**

Run: `node -e "const d=require('./src/data/real-questions/missing-image-ids.json'); console.log('Total:', d.total, 'Tier1:', d.tier1, 'IDs sample:', d.ids.slice(0,5))"`
Expected: Total: 137前後, Tier1: 79前後

- [ ] **Step 4: コミット**

```bash
git add scripts/generate-missing-image-ids.ts src/data/real-questions/missing-image-ids.json
git commit -m "feat: 画像欠落137問の確定IDリスト生成"
```

---

### Task 2: インフラ整備（paths.ts, .gitignore, ディレクトリ作成）

**Files:**
- Create: `scripts/lib/paths.ts`
- Modify: `.gitignore`

- [ ] **Step 1: パス定数ファイルを作成**

```typescript
// scripts/lib/paths.ts
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const PROJECT_ROOT = path.join(__dirname, '..', '..')
export const DATA_DIR = path.join(PROJECT_ROOT, 'data')
export const PDF_DIR = path.join(DATA_DIR, 'pdfs')
export const PAGES_DIR = path.join(DATA_DIR, 'exam-pages')
export const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'images', 'questions')
export const REAL_QUESTIONS_DIR = path.join(PROJECT_ROOT, 'src', 'data', 'real-questions')
```

- [ ] **Step 2: .gitignore にデータディレクトリを追加**

`.gitignore` の末尾に追加:
```
# PDF & page images (large binary files)
data/pdfs/
data/exam-pages/
```

- [ ] **Step 3: ディレクトリを作成**

```bash
mkdir -p data/pdfs data/exam-pages
```

- [ ] **Step 4: 100-106のページ画像を永続ディレクトリにコピー**

```bash
for y in 100 101 102 103 104 105 106; do
  if [ -d "/tmp/claude/exam-pages/$y" ]; then
    echo "第${y}回: コピー中..."
    cp -rn "/tmp/claude/exam-pages/$y" "data/exam-pages/$y"
    echo "  $(ls data/exam-pages/$y/*.png 2>/dev/null | wc -l | tr -d ' ')枚"
  fi
done
```

`-n` フラグ = 既存ファイルは上書きしない。

- [ ] **Step 5: コミット**

```bash
git add scripts/lib/paths.ts .gitignore
git commit -m "chore: paths.ts新設 + data/ディレクトリをgitignore追加"
```

---

### Task 3: 107-110回のPDFダウンロードとページ画像生成

**Files:**
- Modify: `scripts/download-exam-pdfs.sh`

- [ ] **Step 1: 厚労省サイトから107-110回のPDF URLを調査**

Run: 厚労省過去問ページ（ https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iyakuhin/yakuzaishi-shiken/kakomon/ ）をWebFetchで確認し、107-110回のPDF URLを特定する。

- [ ] **Step 2: download-exam-pdfs.sh に107-110回を追加し、出力先をdata/pdfs/に変更**

スクリプト冒頭の `DIR="/tmp/claude"` を `DIR="data/pdfs"` に変更。
107-110回分の `curl` コマンドを追加。

- [ ] **Step 3: PDFをダウンロード**

```bash
bash scripts/download-exam-pdfs.sh
```

確認: `ls data/pdfs/q107-*.pdf data/pdfs/q108-*.pdf data/pdfs/q109-*.pdf data/pdfs/q110-*.pdf | wc -l`
Expected: 24ファイル（6PDF × 4年度）

- [ ] **Step 4: 107-110のページ画像を生成**

```bash
for y in 107 108 109 110; do
  mkdir -p "data/exam-pages/$y"
  for pdf in data/pdfs/q${y}-*.pdf; do
    prefix=$(basename "$pdf" .pdf)
    echo "  $prefix → data/exam-pages/$y/"
    pdftoppm -png -r 200 "$pdf" "data/exam-pages/$y/$prefix"
  done
  echo "第${y}回: $(ls data/exam-pages/$y/*.png 2>/dev/null | wc -l | tr -d ' ')ページ画像"
done
```

Expected: 各年度200-280枚程度のページ画像

- [ ] **Step 5: コミット**

```bash
git add scripts/download-exam-pdfs.sh
git commit -m "feat: download-exam-pdfs.sh 107-110回対応+出力先をdata/pdfs/に変更"
```

---

### Task 4: crop-question-images.ts のフィルタ拡張

**Files:**
- Modify: `scripts/crop-question-images.ts:73-102` (loadEmptyChoicesQuestions → loadTargetQuestions)
- Modify: `scripts/crop-question-images.ts:113-117,133-134` (パス設定変更)

- [ ] **Step 1: paths.ts をインポート**

`scripts/crop-question-images.ts` 冒頭のimportセクション（6-7行目付近）に追加:
```typescript
import { PAGES_DIR, OUTPUT_DIR, REAL_QUESTIONS_DIR } from './lib/paths.ts'
```

- [ ] **Step 2: loadEmptyChoicesQuestions を loadTargetQuestions に置換**

`scripts/crop-question-images.ts` の73-102行を以下に置換:

```typescript
const IMAGE_KEYWORDS = /下図|この図|次の図|図[1-9１-９]|構造式[をがはの]|下の構造|模式図|グラフ[をがはの]|以下の図|図に示|スキーム|下表|処方[箋せん]/

/** 確定IDリスト（missing-image-ids.json）を読み込む */
function loadConfirmedIds(): Set<string> {
  const listPath = path.join(REAL_QUESTIONS_DIR, 'missing-image-ids.json')
  if (!fs.existsSync(listPath)) return new Set()
  const data = JSON.parse(fs.readFileSync(listPath, 'utf-8'))
  return new Set(data.ids as string[])
}

const confirmedIds = loadConfirmedIds()

/** 画像抽出対象の問題番号セットを返す（拡張版） */
function loadTargetQuestions(year: number): Set<number> {
  const tsPath = path.join(REAL_QUESTIONS_DIR, `exam-${year}.ts`)
  if (!fs.existsSync(tsPath)) {
    console.log(`  警告: ${tsPath} が見つかりません`)
    return new Set()
  }
  const content = fs.readFileSync(tsPath, 'utf-8')
  const arrayStart = content.indexOf('[\n')
  if (arrayStart === -1) {
    console.log(`  警告: exam-${year}.ts のパースに失敗`)
    return new Set()
  }
  const jsonPart = content.substring(arrayStart).trimEnd()
  try {
    const questions = JSON.parse(jsonPart)
    const targets = new Set<number>()
    for (const q of questions) {
      const inConfirmedList = confirmedIds.has(q.id)
      const emptyChoices = !q.choices || q.choices.length === 0
      const keywordHit = IMAGE_KEYWORDS.test(q.question_text || '') && !q.image_url

      if (inConfirmedList || emptyChoices || keywordHit) {
        targets.add(q.question_number)
      }
    }
    return targets
  } catch (e) {
    console.log(`  警告: exam-${year}.ts のJSONパースエラー: ${(e as Error).message}`)
    return new Set()
  }
}
```

- [ ] **Step 3: processYear 内のパスを paths.ts の定数に変更**

`processYear()` 関数内（113-118行付近）:
```typescript
// BEFORE:
const pagesDir = `/tmp/claude/exam-pages/${year}`
const outputDir = path.join(__dirname, '..', 'public', 'images', 'questions', String(year))

// AFTER:
const pagesDir = path.join(PAGES_DIR, String(year))
const outputDir = path.join(OUTPUT_DIR, String(year))
```

- [ ] **Step 4: loadEmptyChoicesQuestions の呼び出しを loadTargetQuestions に変更**

`processYear()` 関数内（121行付近）:
```typescript
// BEFORE:
const targetSet = loadEmptyChoicesQuestions(year)
console.log(`  対象問題（choices空）: ${targetSet.size}問`)

// AFTER:
const targetSet = loadTargetQuestions(year)
console.log(`  対象問題: ${targetSet.size}問（確定ID + choices空 + キーワード）`)
```

- [ ] **Step 5: 既存画像スキップロジックを追加**

`processYear()` 関数内のクロップ処理ループ（targetPositions処理の直前、180行付近）に追加:

```typescript
for (const tPos of targetPositions) {
  const destFile = path.join(
    outputDir,
    `q${String(tPos.questionNumber).padStart(3, '0')}.png`
  )

  // 既存画像はスキップ（上書き防止）
  if (fs.existsSync(destFile)) {
    console.log(`    ⏭ q${tPos.questionNumber}: 既存画像あり — スキップ`)
    skipped++
    continue
  }

  // ... 既存のクロップ処理 ...
}
```

- [ ] **Step 6: PDFパスも paths.ts に統一**

```typescript
// BEFORE:
const pdfPath = `/tmp/claude/${pdf.file}`

// AFTER:
import { PDF_DIR } from './lib/paths.ts'
const pdfPath = path.join(PDF_DIR, pdf.file)
```

- [ ] **Step 7: dry-run で確認**

```bash
npx tsx scripts/crop-question-images.ts --year 100 2>&1 | head -30
```

Expected: `対象問題: XX問（確定ID + choices空 + キーワード）` — 従来より多い数が表示

- [ ] **Step 8: コミット**

```bash
git add scripts/crop-question-images.ts
git commit -m "feat: crop-question-images フィルタ拡張（確定IDリスト+キーワード対応）"
```

---

### Task 5: add-image-urls-batch.ts の拡張

**Files:**
- Modify: `scripts/add-image-urls-batch.ts`

- [ ] **Step 1: years 配列を100-110に拡張**

```typescript
// BEFORE (line 17):
const years = [100, 101, 102, 103, 104, 105, 106]

// AFTER:
const years = Array.from({ length: 11 }, (_, i) => 100 + i) // 100-110
```

- [ ] **Step 2: image_url 既存値の保護ロジックを追加**

`add-image-urls-batch.ts` のメインループ（34-41行）を以下に置換:

```typescript
  let added = 0
  let skippedExisting = 0
  let warned = 0

  for (const q of questions) {
    const qNum = String(q.question_number).padStart(3, '0')
    const expectedUrl = `/images/questions/${year}/q${qNum}.png`
    const imgPath = path.join(__dirname, '..', 'public', 'images', 'questions', String(year), `q${qNum}.png`)
    const imageExists = fs.existsSync(imgPath)

    // 既存 image_url がある場合
    if (q.image_url) {
      if (q.image_url !== expectedUrl && imageExists) {
        console.warn(`  ⚠ ${q.id}: 既存image_url="${q.image_url}" と生成値"${expectedUrl}"が不一致。スキップ`)
        warned++
      }
      skippedExisting++
      continue  // 上書きしない
    }

    // image_url 未設定 & 画像ファイルが存在する → 設定
    if (imageExists) {
      q.image_url = expectedUrl
      added++
    }
  }

  const newContent = header + JSON.stringify(questions, null, 2) + '\n'
  fs.writeFileSync(tsPath, newContent, 'utf-8')
  console.log(`第${year}回: 新規${added}問 / 既存スキップ${skippedExisting}問 / 警告${warned}件`)
  totalAdded += added
```

- [ ] **Step 3: image-urls JSONへの依存を除去（ファイルスキャンに変更）**

image-urls-{year}.json を読む代わりに、`public/images/questions/{year}/` の実在ファイルをスキャンする方式に変更。これにより Step 5 (JSON生成) は不要になる。

メインループの冒頭:
```typescript
for (const year of years) {
  const tsPath = path.join(dataDir, `exam-${year}.ts`)
  if (!fs.existsSync(tsPath)) continue
  // JSON マップファイルは使わない — public/ の実在ファイルをスキャン
  const tsContent = fs.readFileSync(tsPath, 'utf-8')
  // ... 以降同じ
```

- [ ] **Step 4: コミット**

```bash
git add scripts/add-image-urls-batch.ts
git commit -m "feat: add-image-urls-batch 全年度対応+既存値保護+ファイルスキャン方式"
```

---

### Task 6: パイプライン実行

**前提**: Task 1-5 が完了していること

- [ ] **Step 1: PDFダウンロード（必要な年度のみ）**

107-110回のPDFが `data/pdfs/` になければダウンロード:
```bash
bash scripts/download-exam-pdfs.sh
```

確認: `for y in 100 101 102 103 104 105 106 107 108 109 110; do echo -n "第${y}回: "; ls data/pdfs/q${y}-*.pdf 2>/dev/null | wc -l | tr -d ' '; done`

- [ ] **Step 2: ページ画像生成（107-110のみ）**

```bash
for y in 107 108 109 110; do
  if [ $(ls data/exam-pages/$y/*.png 2>/dev/null | wc -l) -lt 50 ]; then
    echo "=== 第${y}回: ページ画像生成 ==="
    mkdir -p "data/exam-pages/$y"
    for pdf in data/pdfs/q${y}-*.pdf; do
      prefix=$(basename "$pdf" .pdf)
      pdftoppm -png -r 200 "$pdf" "data/exam-pages/$y/$prefix"
    done
    echo "  生成: $(ls data/exam-pages/$y/*.png | wc -l | tr -d ' ')枚"
  else
    echo "第${y}回: ページ画像十分 — スキップ"
  fi
done
```

- [ ] **Step 3: 座標クロップ実行（全年度）**

```bash
npx tsx scripts/crop-question-images.ts --year 100-110
```

Expected: 既存画像は「⏭ スキップ」、新規135問前後が「クロップ」されるログ

- [ ] **Step 4: 新規画像のトリミング（ページ番号除去）**

```bash
npx tsx scripts/trim-image-whitespace.ts
```

注: 既にトリミング済みの画像は `origH <= 180` でスキップされるため、既存画像への二重適用は発生しない。新規クロップ画像（ページ全体高さ ≈ 2334px）は正常にトリミングされる。

- [ ] **Step 5: image_url をデータファイルに反映**

```bash
npx tsx scripts/add-image-urls-batch.ts
```

Expected: `新規XX問 / 既存スキップYY問` のログ

- [ ] **Step 6: コミット**

```bash
git add public/images/questions/ src/data/real-questions/exam-*.ts
git commit -m "feat: 画像欠落問題にimage_url設定（137問修復パイプライン実行）"
```

---

### Task 7: 検証

- [ ] **Step 1: 自動検証スクリプト**

```bash
node -e "
const fs = require('fs');
const missing = require('./src/data/real-questions/missing-image-ids.json');
let ok = 0, ng = 0;
for (const id of missing.ids) {
  const [, yearStr, numStr] = id.match(/r(\d+)-(\d+)/);
  const year = parseInt(yearStr);
  const num = numStr;
  // exam-{year}.ts から image_url を確認
  const tsPath = 'src/data/real-questions/exam-' + year + '.ts';
  const content = fs.readFileSync(tsPath, 'utf-8');
  const arrayStart = content.indexOf('[\\n');
  const questions = JSON.parse(content.substring(arrayStart).trimEnd());
  const q = questions.find(q => q.id === id);
  if (!q) { console.log('❌ NOT FOUND:', id); ng++; continue; }
  if (!q.image_url) { console.log('❌ NO URL:', id); ng++; continue; }
  const imgPath = 'public' + q.image_url;
  if (!fs.existsSync(imgPath)) { console.log('❌ NO FILE:', id, q.image_url); ng++; continue; }
  ok++;
}
console.log('\\n=== 結果 ===');
console.log('✅ OK:', ok + '/' + missing.ids.length);
console.log('❌ NG:', ng);
"
```

Expected: `✅ OK: 137/137`

- [ ] **Step 2: ビルド確認**

```bash
npm run build
```

Expected: エラーなし

- [ ] **Step 3: getDisplayMode の動作確認**

```bash
node -e "
const fs = require('fs');
// exam-100.ts の r100-011 (Tier1: 下図) の表示モードを確認
const content = fs.readFileSync('src/data/real-questions/exam-100.ts', 'utf-8');
const questions = JSON.parse(content.substring(content.indexOf('[\\n')).trimEnd());
const q = questions.find(q => q.id === 'r100-011');
console.log('id:', q.id);
console.log('image_url:', q.image_url);
console.log('choices:', q.choices?.length, 'items');
// getDisplayMode のロジックを手動シミュレート
const mode = !q.image_url ? 'text' : (!q.choices || q.choices.length === 0) ? 'image' : 'both';
console.log('display_mode:', mode);
console.log('Expected: both ✅' === mode ? 'both' : '');
"
```

Expected: `display_mode: both`

- [ ] **Step 4: 既存画像の整合性確認**

```bash
node -e "
const fs = require('fs');
// 既存909枚の画像がすべて存在するか確認
let total = 0, ok = 0;
for (let y = 100; y <= 110; y++) {
  const dir = 'public/images/questions/' + y;
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
  total += files.length;
  for (const f of files) {
    const stat = fs.statSync(dir + '/' + f);
    if (stat.size > 0) ok++;
    else console.log('⚠ Empty:', dir + '/' + f);
  }
}
console.log('画像ファイル: ' + ok + '/' + total + ' OK');
console.log('(元々909枚 + 新規追加分 = ' + total + '枚)');
"
```

Expected: 909 + 135 = 1044枚前後

- [ ] **Step 5: Tier 1 目視確認用リスト出力**

```bash
node -e "
const missing = require('./src/data/real-questions/missing-image-ids.json');
const tier1 = missing.details.filter(d => d.tier === 1);
console.log('=== Tier 1 目視確認リスト (' + tier1.length + '問) ===');
tier1.forEach(d => {
  console.log(d.id + ': /images/questions/' + d.year + '/q' + String(d.question_number).padStart(3,'0') + '.png');
});
"
```

このリストを使い、devサーバー (`npm run dev -- --host`) で各問題の画像が正しいことを目視確認する。

- [ ] **Step 6: 最終コミット（検証通過後）**

```bash
git add -A
git commit -m "chore: 画像欠落修復の検証完了・TODO更新"
```

---

## 実行順まとめ

```
Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7
 IDリスト   インフラ   PDF/ページ画像  crop拡張   URL設定拡張  パイプライン  検証
```

Task 1-2 は並行実行可能。Task 4-5 も並行実行可能。
