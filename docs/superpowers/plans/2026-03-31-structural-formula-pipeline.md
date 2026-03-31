# 構造式フラッシュカード パイプライン 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase 1の約200枚の構造式フラッシュカードを生成するデータパイプラインを構築する。物質名リスト → PubChem SMILES取得 → RDKit SVG描画 → Claude カードテキスト生成 → FlashCardTemplate統合。

**Architecture:** 3段階パイプライン。(1) TypeScriptスクリプトでPubChem APIからSMILES取得 → JSONレジストリ更新、(2) PythonスクリプトでRDKit SVG生成、(3) TypeScriptスクリプトでClaude Opus 4.6にカードテキスト生成させJSONに出力。各段階は独立実行可能で、中間JSONファイルで繋ぐ。

**Tech Stack:** TypeScript (tsx) + Python 3.9+ (RDKit) + PubChem REST API + Claude API (@anthropic-ai/sdk)

**Spec:** `docs/superpowers/specs/2026-03-31-structural-formula-cards-spec.md`

---

## ファイル構成

### 新規作成
| ファイル | 役割 |
|---------|------|
| `src/data/structural-formula-registry.json` | 物質マスターデータ（名前・CID・SMILES・分類） |
| `scripts/fetch-pubchem-smiles.ts` | PubChem APIからSMILES一括取得 → registry更新 |
| `scripts/generate-structure-svgs.py` | RDKit SVG描画（通常 + ハイライト） |
| `scripts/generate-structural-cards.ts` | Claude Opus 4.6でL1-L3カードテキスト生成 |
| `scripts/lib/pubchem-client.ts` | PubChem REST APIクライアント（テスト可能な純粋関数） |
| `scripts/lib/__tests__/pubchem-client.test.ts` | PubChemクライアントのユニットテスト |
| `scripts/lib/structural-registry-types.ts` | レジストリの型定義 |
| `scripts/lib/__tests__/structural-registry.test.ts` | レジストリバリデーションテスト |
| `public/images/structures/` | SVG出力ディレクトリ |
| `requirements-rdkit.txt` | Python依存関係（rdkit） |

### 変更
| ファイル | 変更内容 |
|---------|---------|
| `src/types/flashcard-template.ts` | CardFormatに構造式タイプ3種追加、source_typeに`'structure_db'`追加 |
| `src/data/flashcard-templates.ts` | 構造式カードテンプレートの追加先（Task 6で生成したJSONをインポート） |

---

## Task 1: Python + RDKit 環境セットアップ

**Files:**
- Create: `requirements-rdkit.txt`

- [ ] **Step 1: Python venv作成 + RDKit インストール**

```bash
cd /Users/ai/projects/personal/pharma-exam-ai
python3 -m venv .venv
source .venv/bin/activate
pip install rdkit-pypi
```

注意: macOS の system Python 3.9.6 では `rdkit-pypi` が動かない場合あり。その場合:
```bash
# Homebrew Python 3.11+ をインストール
brew install python@3.12
/opt/homebrew/bin/python3.12 -m venv .venv
source .venv/bin/activate
pip install rdkit-pypi
```

- [ ] **Step 2: RDKit動作確認**

```bash
source .venv/bin/activate
python3 -c "from rdkit import Chem; m = Chem.MolFromSmiles('c1ccccc1'); print('RDKit OK:', m is not None)"
```

Expected: `RDKit OK: True`

- [ ] **Step 3: requirements-rdkit.txt 作成**

```
rdkit-pypi>=2024.3.1
```

- [ ] **Step 4: .gitignore に venv 追加確認**

`.venv/` が `.gitignore` に含まれていなければ追加。

- [ ] **Step 5: コミット**

```bash
git add requirements-rdkit.txt
git commit -m "chore: add Python RDKit requirements for structural formula pipeline"
```

---

## Task 2: 型定義の拡張（CardFormat + source_type）

**Files:**
- Modify: `src/types/flashcard-template.ts`
- Test: `scripts/lib/__tests__/structural-registry.test.ts`（Task 3で作成）

- [ ] **Step 1: CardFormat に構造式タイプ3種を追加**

`src/types/flashcard-template.ts` を編集:

```typescript
/** カードのフォーマット（表示形式） */
export type CardFormat =
  | 'term_definition'
  | 'question_answer'
  | 'mnemonic'
  | 'structural_identification'   // L1: 構造式→物質名
  | 'structural_features'         // L2: 物質名→構造の特徴
  | 'structural_pattern'          // L3: 部分構造→分類

/** カードフォーマットの表示設定 */
export const CARD_FORMAT_CONFIG: Record<CardFormat, { label: string; emoji: string; frontLabel: string; backLabel: string }> = {
  term_definition: { label: '用語↔定義', emoji: '📖', frontLabel: '用語', backLabel: '定義' },
  question_answer: { label: '問い↔答え', emoji: '❓', frontLabel: '問い', backLabel: '答え' },
  mnemonic: { label: '語呂↔対象', emoji: '🎵', frontLabel: '語呂合わせ', backLabel: '覚える内容' },
  structural_identification: { label: '構造式↔物質名', emoji: '🔬', frontLabel: '構造式', backLabel: '物質名' },
  structural_features: { label: '物質名↔構造的特徴', emoji: '🧪', frontLabel: '物質名', backLabel: '構造的特徴' },
  structural_pattern: { label: '部分構造↔分類', emoji: '🧩', frontLabel: '部分構造', backLabel: '化合物群' },
}
```

- [ ] **Step 2: source_type に 'structure_db' を追加**

同ファイルの `FlashCardTemplate` interface:

```typescript
export interface FlashCardTemplate {
  id: string
  source_type: 'fusen' | 'explanation' | 'structure_db'
  source_id: string               // 構造式カードの場合: 'struct-thiamine' 等
  primary_exemplar_id: string
  subject: QuestionSubject
  front: string
  back: string
  format: CardFormat
  tags: string[]
  media_url?: string              // 構造式SVGのパス（例: '/images/structures/thiamine.svg'）
  smiles?: string                 // PubChem正規SMILES（構造式カードのみ）
}
```

- [ ] **Step 3: 型チェック実行**

```bash
npx tsc --noEmit
```

Expected: エラーなし（既存コードは `'fusen' | 'explanation'` のリテラルしか使っていないので互換性あり）

- [ ] **Step 4: コミット**

```bash
git add src/types/flashcard-template.ts
git commit -m "feat: add structural formula card types to FlashCardTemplate"
```

---

## Task 3: レジストリ型定義 + バリデーションテスト

**Files:**
- Create: `scripts/lib/structural-registry-types.ts`
- Create: `scripts/lib/__tests__/structural-registry.test.ts`

- [ ] **Step 1: レジストリ型定義を作成**

`scripts/lib/structural-registry-types.ts`:

```typescript
// scripts/lib/structural-registry-types.ts
// 構造式レジストリのデータ型

import type { QuestionSubject } from '../../src/types/question'

export type StructureCategory =
  | 'heterocycle'       // 複素環母核
  | 'vitamin'           // ビタミン
  | 'pharmacology'      // 頻出薬理構造
  | 'carcinogen'        // 発がん物質
  | 'food_additive'     // 食品添加物
  | 'amino_acid'        // アミノ酸
  | 'nucleobase'        // 核酸塩基

export interface StructureEntry {
  id: string                      // 'struct-thiamine'
  name_ja: string                 // 'チアミン'
  name_en: string                 // 'Thiamine'
  pubchem_cid: number | null      // PubChem Compound ID（未取得時null）
  smiles: string | null           // 正規SMILES（PubChem取得後に設定）
  scaffold: string                // '母核名: チアゾール環+ピリミジン環'
  functional_groups: string[]     // ['アミノ基', '4級窒素']
  category: StructureCategory
  priority: 1 | 2 | 3 | 4 | 5   // specのPriority 1-5
  subjects: QuestionSubject[]     // ['化学', '衛生']
  representative_of?: string      // 母核名（Priority 1のみ。例: 'チアゾール環'）
}

export interface StructuralFormulaRegistry {
  version: string                 // '1.0.0'
  generated_at: string            // ISO8601
  entries: StructureEntry[]
}
```

- [ ] **Step 2: バリデーションテストを作成**

`scripts/lib/__tests__/structural-registry.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import type { StructureEntry, StructuralFormulaRegistry } from '../structural-registry-types'

function validateEntry(entry: StructureEntry): string[] {
  const errors: string[] = []
  if (!entry.id.startsWith('struct-')) errors.push(`id must start with 'struct-': ${entry.id}`)
  if (!entry.name_ja) errors.push(`name_ja is required: ${entry.id}`)
  if (!entry.name_en) errors.push(`name_en is required: ${entry.id}`)
  if (entry.subjects.length === 0) errors.push(`subjects must not be empty: ${entry.id}`)
  if (entry.priority < 1 || entry.priority > 5) errors.push(`invalid priority: ${entry.id}`)
  return errors
}

function validateRegistry(registry: StructuralFormulaRegistry): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  for (const entry of registry.entries) {
    if (ids.has(entry.id)) errors.push(`duplicate id: ${entry.id}`)
    ids.add(entry.id)
    errors.push(...validateEntry(entry))
  }
  return errors
}

describe('structural-registry validation', () => {
  it('validates a correct entry', () => {
    const entry: StructureEntry = {
      id: 'struct-thiamine',
      name_ja: 'チアミン',
      name_en: 'Thiamine',
      pubchem_cid: 1130,
      smiles: null,
      scaffold: 'チアゾール環+ピリミジン環',
      functional_groups: ['アミノ基', '4級窒素'],
      category: 'vitamin',
      priority: 2,
      subjects: ['化学', '衛生'],
    }
    expect(validateEntry(entry)).toEqual([])
  })

  it('rejects entry without struct- prefix', () => {
    const entry: StructureEntry = {
      id: 'thiamine',
      name_ja: 'チアミン',
      name_en: 'Thiamine',
      pubchem_cid: null,
      smiles: null,
      scaffold: 'チアゾール環+ピリミジン環',
      functional_groups: [],
      category: 'vitamin',
      priority: 2,
      subjects: ['化学'],
    }
    expect(validateEntry(entry)).toContain("id must start with 'struct-': thiamine")
  })

  it('detects duplicate ids in registry', () => {
    const registry: StructuralFormulaRegistry = {
      version: '1.0.0',
      generated_at: '2026-03-31T00:00:00Z',
      entries: [
        {
          id: 'struct-thiamine', name_ja: 'チアミン', name_en: 'Thiamine',
          pubchem_cid: null, smiles: null, scaffold: '', functional_groups: [],
          category: 'vitamin', priority: 2, subjects: ['化学'],
        },
        {
          id: 'struct-thiamine', name_ja: 'チアミン2', name_en: 'Thiamine2',
          pubchem_cid: null, smiles: null, scaffold: '', functional_groups: [],
          category: 'vitamin', priority: 2, subjects: ['化学'],
        },
      ],
    }
    expect(validateRegistry(registry)).toContain('duplicate id: struct-thiamine')
  })
})

export { validateEntry, validateRegistry }
```

- [ ] **Step 3: テスト実行**

```bash
npx vitest run scripts/lib/__tests__/structural-registry.test.ts
```

Expected: 3 tests PASS

- [ ] **Step 4: コミット**

```bash
git add scripts/lib/structural-registry-types.ts scripts/lib/__tests__/structural-registry.test.ts
git commit -m "feat: add structural formula registry types and validation"
```

---

## Task 4: 物質マスターデータ（structural-formula-registry.json）作成

**Files:**
- Create: `src/data/structural-formula-registry.json`

このタスクはPhase 1全対象物質のレジストリJSONを手動作成する。PubChem CIDは手動で調査（PubChem Web検索）するか、Task 5のスクリプトで一括取得する。初期状態は `pubchem_cid: null`, `smiles: null` でよい。

- [ ] **Step 1: レジストリJSONを作成**

`src/data/structural-formula-registry.json` に以下の構造で全物質を登録する。
PubChem CIDは代表的なものを手動で入れる（残りはTask 5で自動取得）。

以下は Priority 1（複素環母核15種の代表化合物）+ Priority 2（ビタミン13種）の例:

```json
{
  "version": "1.0.0",
  "generated_at": "2026-03-31T00:00:00Z",
  "entries": [
    {
      "id": "struct-adenine",
      "name_ja": "アデニン",
      "name_en": "Adenine",
      "pubchem_cid": 190,
      "smiles": null,
      "scaffold": "プリン環",
      "functional_groups": ["アミノ基"],
      "category": "heterocycle",
      "priority": 1,
      "subjects": ["化学", "生物"],
      "representative_of": "プリン環"
    },
    {
      "id": "struct-guanine",
      "name_ja": "グアニン",
      "name_en": "Guanine",
      "pubchem_cid": 135398635,
      "smiles": null,
      "scaffold": "プリン環",
      "functional_groups": ["アミノ基", "カルボニル基"],
      "category": "heterocycle",
      "priority": 1,
      "subjects": ["化学", "生物"],
      "representative_of": "プリン環"
    },
    {
      "id": "struct-caffeine",
      "name_ja": "カフェイン",
      "name_en": "Caffeine",
      "pubchem_cid": 2519,
      "smiles": null,
      "scaffold": "プリン環（キサンチン骨格）",
      "functional_groups": ["N-メチル基"],
      "category": "heterocycle",
      "priority": 1,
      "subjects": ["化学", "生物"],
      "representative_of": "プリン環"
    }
  ]
}
```

**全物質リスト（約80化合物をID順に登録）:**

Priority 1（複素環15種 × 代表2-3化合物 ≈ 40化合物）:
- プリン環: adenine, guanine, caffeine
- ピリミジン環: cytosine, uracil, thymine
- インドール環: serotonin, tryptophan
- キノリン環: quinine
- イミダゾール環: histamine, histidine
- チアゾール環: thiamine（ビタミンB1と重複、代表化合物として1エントリ）
- ピリジン環: nicotinamide（ビタミンB3と重複、代表化合物として1エントリ）
- ピロール環: heme（ポルフィリンのCIDは複雑、hemeで代表）
- フラン環: furosemide
- チオフェン環: ticlopidine
- ベンゾジアゼピン環: diazepam, midazolam
- フェノチアジン環: chlorpromazine
- ステロイド骨格: cholesterol, prednisolone
- β-ラクタム環: penicillin-g, cephalothin
- テトラサイクリン骨格: tetracycline

Priority 2（ビタミン13種）:
- retinol (A), thiamine (B1=上記と共有), riboflavin (B2), niacin (B3=上記と共有), pantothenic-acid (B5), pyridoxine (B6), biotin (B7), folic-acid (B9), cyanocobalamin (B12), ascorbic-acid (C), cholecalciferol (D3), alpha-tocopherol (E), phylloquinone (K1)

Priority 3（薬理構造 ≈ 6化合物、上記と重複除外）:
- dexamethasone, adrenaline, noradrenaline, dopamine

Priority 4（発がん物質・食品添加物 ≈ 8化合物）:
- aflatoxin-b1, benzo-a-pyrene, n-nitrosodimethylamine, sorbic-acid, benzoic-acid

Priority 5（アミノ酸20種 + 核酸塩基は上記と重複）:
- glycine, alanine, valine, leucine, isoleucine, proline, phenylalanine, tryptophan (重複), methionine, serine, threonine, cysteine, tyrosine, asparagine, glutamine, aspartic-acid, glutamic-acid, lysine, arginine, histidine (重複)

注意: Priority 1-2で既に登場する化合物（thiamine, nicotinamide, tryptophan, histidine）はエントリを1つにまとめ、`priority` は最も高い値を設定。

- [ ] **Step 2: レジストリバリデーション実行**

Task 3のテストにレジストリ読み込みテストを追加:

`scripts/lib/__tests__/structural-registry.test.ts` に追記:

```typescript
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('structural-formula-registry.json', () => {
  it('passes validation', () => {
    const raw = fs.readFileSync(
      path.join(__dirname, '../../../src/data/structural-formula-registry.json'), 'utf-8'
    )
    const registry: StructuralFormulaRegistry = JSON.parse(raw)
    const errors = validateRegistry(registry)
    expect(errors).toEqual([])
  })

  it('has at least 60 entries for Phase 1', () => {
    const raw = fs.readFileSync(
      path.join(__dirname, '../../../src/data/structural-formula-registry.json'), 'utf-8'
    )
    const registry: StructuralFormulaRegistry = JSON.parse(raw)
    expect(registry.entries.length).toBeGreaterThanOrEqual(60)
  })

  it('covers all 5 priority levels', () => {
    const raw = fs.readFileSync(
      path.join(__dirname, '../../../src/data/structural-formula-registry.json'), 'utf-8'
    )
    const registry: StructuralFormulaRegistry = JSON.parse(raw)
    const priorities = new Set(registry.entries.map(e => e.priority))
    expect(priorities).toEqual(new Set([1, 2, 3, 4, 5]))
  })
})
```

```bash
npx vitest run scripts/lib/__tests__/structural-registry.test.ts
```

Expected: 6 tests PASS

- [ ] **Step 3: コミット**

```bash
git add src/data/structural-formula-registry.json scripts/lib/__tests__/structural-registry.test.ts
git commit -m "feat: add structural formula registry with ~80 Phase 1 compounds"
```

---

## Task 5: PubChem SMILES 一括取得スクリプト

**Files:**
- Create: `scripts/lib/pubchem-client.ts`
- Create: `scripts/lib/__tests__/pubchem-client.test.ts`
- Create: `scripts/fetch-pubchem-smiles.ts`

### Step群: PubChemクライアント

- [ ] **Step 1: PubChemクライアントのテストを書く**

`scripts/lib/__tests__/pubchem-client.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { buildPubChemUrl, parseSmilesResponse, validateSmiles } from '../pubchem-client'

describe('buildPubChemUrl', () => {
  it('builds URL from CID', () => {
    const url = buildPubChemUrl(2519)
    expect(url).toBe(
      'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/2519/property/CanonicalSMILES,IsomericSMILES,IUPACName/JSON'
    )
  })

  it('builds URL from compound name', () => {
    const url = buildPubChemUrl('Caffeine')
    expect(url).toBe(
      'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/Caffeine/property/CanonicalSMILES,IsomericSMILES,IUPACName/JSON'
    )
  })
})

describe('parseSmilesResponse', () => {
  it('extracts SMILES from PubChem JSON response', () => {
    const response = {
      PropertyTable: {
        Properties: [{
          CID: 2519,
          CanonicalSMILES: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
          IsomericSMILES: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
          IUPACName: '1,3,7-trimethylpurine-2,6-dione',
        }]
      }
    }
    const result = parseSmilesResponse(response)
    expect(result).toEqual({
      cid: 2519,
      canonical_smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
      isomeric_smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
      iupac_name: '1,3,7-trimethylpurine-2,6-dione',
    })
  })

  it('returns null for empty response', () => {
    expect(parseSmilesResponse({})).toBeNull()
    expect(parseSmilesResponse({ PropertyTable: { Properties: [] } })).toBeNull()
  })
})

describe('validateSmiles', () => {
  it('accepts valid SMILES', () => {
    expect(validateSmiles('CN1C=NC2=C1C(=O)N(C(=O)N2C)C')).toBe(true)  // caffeine
    expect(validateSmiles('c1ccccc1')).toBe(true)                         // benzene
    expect(validateSmiles('CC(=O)O')).toBe(true)                          // acetic acid
  })

  it('rejects empty or whitespace', () => {
    expect(validateSmiles('')).toBe(false)
    expect(validateSmiles('  ')).toBe(false)
  })
})
```

- [ ] **Step 2: テスト実行 → 失敗確認**

```bash
npx vitest run scripts/lib/__tests__/pubchem-client.test.ts
```

Expected: FAIL（pubchem-client.ts が存在しない）

- [ ] **Step 3: PubChemクライアント実装**

`scripts/lib/pubchem-client.ts`:

```typescript
// scripts/lib/pubchem-client.ts
// PubChem REST API クライアント（純粋関数 + fetch ラッパー）

const PUBCHEM_BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound'
const PROPERTIES = 'CanonicalSMILES,IsomericSMILES,IUPACName'

export interface PubChemResult {
  cid: number
  canonical_smiles: string
  isomeric_smiles: string
  iupac_name: string
}

/** PubChem REST API の URL を組み立てる */
export function buildPubChemUrl(cidOrName: number | string): string {
  if (typeof cidOrName === 'number') {
    return `${PUBCHEM_BASE}/cid/${cidOrName}/property/${PROPERTIES}/JSON`
  }
  return `${PUBCHEM_BASE}/name/${cidOrName}/property/${PROPERTIES}/JSON`
}

/** PubChem JSON レスポンスをパースする */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseSmilesResponse(data: any): PubChemResult | null {
  const props = data?.PropertyTable?.Properties
  if (!props || props.length === 0) return null
  const p = props[0]
  return {
    cid: p.CID,
    canonical_smiles: p.CanonicalSMILES,
    isomeric_smiles: p.IsomericSMILES,
    iupac_name: p.IUPACName,
  }
}

/** SMILES文字列の簡易バリデーション（空文字・空白を弾く。構文チェックはRDKit側で行う） */
export function validateSmiles(smiles: string): boolean {
  return smiles.trim().length > 0
}

/** PubChem API からSMILES を取得（rate limit対応付き） */
export async function fetchSmiles(cidOrName: number | string): Promise<PubChemResult | null> {
  const url = buildPubChemUrl(cidOrName)
  const res = await fetch(url)
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error(`PubChem API error: ${res.status} ${res.statusText} for ${cidOrName}`)
  }
  const data = await res.json()
  return parseSmilesResponse(data)
}

/** ミリ秒待つ（rate limit用） */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

- [ ] **Step 4: テスト実行 → パス確認**

```bash
npx vitest run scripts/lib/__tests__/pubchem-client.test.ts
```

Expected: 6 tests PASS

- [ ] **Step 5: コミット**

```bash
git add scripts/lib/pubchem-client.ts scripts/lib/__tests__/pubchem-client.test.ts
git commit -m "feat: add PubChem REST API client with tests"
```

### Step群: SMILES取得スクリプト本体

- [ ] **Step 6: fetch-pubchem-smiles.ts 作成**

`scripts/fetch-pubchem-smiles.ts`:

```typescript
/**
 * PubChem SMILES 一括取得スクリプト
 *
 * structural-formula-registry.json の各エントリについて:
 * 1. pubchem_cid がある → CIDでSMILES取得
 * 2. pubchem_cid がない → name_en で検索してCID+SMILES取得
 * 3. 既にsmiles がある → スキップ（--force で上書き）
 *
 * Usage:
 *   npx tsx scripts/fetch-pubchem-smiles.ts [--force] [--dry-run] [--id struct-caffeine]
 *
 * Rate limit: PubChem は 5 req/sec を推奨。200ms 間隔で送信。
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { fetchSmiles, sleep } from './lib/pubchem-client'
import type { StructuralFormulaRegistry } from './lib/structural-registry-types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const REGISTRY_PATH = path.join(__dirname, '..', 'src', 'data', 'structural-formula-registry.json')
const RATE_LIMIT_MS = 250  // PubChem推奨: 5 req/sec

async function main() {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const dryRun = args.includes('--dry-run')
  const idFilter = args.find(a => a.startsWith('--id'))
    ? args[args.indexOf(args.find(a => a === '--id')!) + 1]
    : null

  const raw = fs.readFileSync(REGISTRY_PATH, 'utf-8')
  const registry: StructuralFormulaRegistry = JSON.parse(raw)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const entry of registry.entries) {
    if (idFilter && entry.id !== idFilter) continue
    if (entry.smiles && !force) {
      skipped++
      continue
    }

    const lookup = entry.pubchem_cid ?? entry.name_en
    console.log(`[${entry.id}] Fetching SMILES for ${lookup}...`)

    if (dryRun) {
      console.log(`  [DRY RUN] Would fetch from PubChem`)
      continue
    }

    try {
      const result = await fetchSmiles(lookup)
      if (result) {
        entry.smiles = result.canonical_smiles
        if (!entry.pubchem_cid) entry.pubchem_cid = result.cid
        console.log(`  OK: ${result.canonical_smiles.substring(0, 50)}...`)
        updated++
      } else {
        console.log(`  NOT FOUND`)
        failed++
      }
    } catch (err) {
      console.error(`  ERROR: ${err}`)
      failed++
    }

    await sleep(RATE_LIMIT_MS)
  }

  if (!dryRun) {
    registry.generated_at = new Date().toISOString()
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n')
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped, ${failed} failed`)
}

main().catch(console.error)
```

- [ ] **Step 7: ドライラン実行**

```bash
npx tsx scripts/fetch-pubchem-smiles.ts --dry-run
```

Expected: 各エントリについて `[DRY RUN] Would fetch from PubChem` が表示される

- [ ] **Step 8: 実際のSMILES取得実行**

```bash
npx tsx scripts/fetch-pubchem-smiles.ts
```

Expected: 80+件の SMILES が取得され、`structural-formula-registry.json` が更新される

- [ ] **Step 9: レジストリバリデーション再実行**

```bash
npx vitest run scripts/lib/__tests__/structural-registry.test.ts
```

Expected: 全テスト PASS

- [ ] **Step 10: コミット**

```bash
git add scripts/fetch-pubchem-smiles.ts src/data/structural-formula-registry.json
git commit -m "feat: fetch PubChem SMILES for all Phase 1 compounds"
```

---

## Task 6: RDKit SVG 生成スクリプト

**Files:**
- Create: `scripts/generate-structure-svgs.py`
- Create: `public/images/structures/` (ディレクトリ)

- [ ] **Step 1: 出力ディレクトリ作成**

```bash
mkdir -p public/images/structures
```

- [ ] **Step 2: RDKit SVG 生成スクリプト作成**

`scripts/generate-structure-svgs.py`:

```python
#!/usr/bin/env python3
"""
RDKit SVG 構造式描画スクリプト

structural-formula-registry.json からSMILESを読み込み、
各化合物のSVG画像を生成する。

Usage:
    source .venv/bin/activate
    python scripts/generate-structure-svgs.py [--id struct-caffeine] [--dry-run]

Output:
    public/images/structures/{id}.svg          — 通常の構造式
"""

import json
import sys
import os
from pathlib import Path

try:
    from rdkit import Chem
    from rdkit.Chem import Draw, AllChem
except ImportError:
    print("ERROR: RDKit not installed. Run: source .venv/bin/activate && pip install rdkit-pypi")
    sys.exit(1)

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
REGISTRY_PATH = PROJECT_ROOT / "src" / "data" / "structural-formula-registry.json"
OUTPUT_DIR = PROJECT_ROOT / "public" / "images" / "structures"

# SVG描画設定
SVG_WIDTH = 400
SVG_HEIGHT = 300


def generate_svg(smiles: str, output_path: Path,
                 highlight_atoms: list = None,
                 highlight_color: tuple = (1.0, 0.85, 0.85)) -> bool:
    """SMILES → SVG を生成。成功でTrue、失敗でFalse。"""
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        print(f"  ERROR: Invalid SMILES: {smiles}")
        return False

    AllChem.Compute2DCoords(mol)
    drawer = Draw.MolDraw2DSVG(SVG_WIDTH, SVG_HEIGHT)

    # 描画オプション: 白背景、見やすいフォント
    opts = drawer.drawOptions()
    opts.clearBackground = True
    opts.bondLineWidth = 2.0

    if highlight_atoms:
        colors = {a: highlight_color for a in highlight_atoms}
        drawer.DrawMolecule(mol, highlightAtoms=highlight_atoms,
                            highlightAtomColors=colors)
    else:
        drawer.DrawMolecule(mol)

    drawer.FinishDrawing()
    svg_text = drawer.GetDrawingText()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(svg_text)

    return True


def main():
    args = sys.argv[1:]
    dry_run = "--dry-run" in args
    id_filter = None
    if "--id" in args:
        idx = args.index("--id")
        id_filter = args[idx + 1] if idx + 1 < len(args) else None

    with open(REGISTRY_PATH, 'r', encoding='utf-8') as f:
        registry = json.load(f)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    generated = 0
    skipped = 0
    failed = 0

    for entry in registry["entries"]:
        entry_id = entry["id"]
        smiles = entry.get("smiles")

        if id_filter and entry_id != id_filter:
            continue

        if not smiles:
            print(f"[{entry_id}] No SMILES — skipping")
            skipped += 1
            continue

        # ファイル名: struct-caffeine → caffeine.svg
        svg_name = entry_id.replace("struct-", "") + ".svg"
        output_path = OUTPUT_DIR / svg_name

        print(f"[{entry_id}] Generating {svg_name}...")

        if dry_run:
            print(f"  [DRY RUN] Would generate {output_path}")
            continue

        if generate_svg(smiles, output_path):
            generated += 1
            print(f"  OK: {output_path}")
        else:
            failed += 1

    print(f"\nDone: {generated} generated, {skipped} skipped (no SMILES), {failed} failed")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: 1化合物でテスト実行**

```bash
source .venv/bin/activate
python scripts/generate-structure-svgs.py --id struct-caffeine
```

Expected: `public/images/structures/caffeine.svg` が生成される

- [ ] **Step 4: SVGファイルをブラウザで確認**

```bash
open public/images/structures/caffeine.svg
```

Expected: カフェインの構造式が表示される

- [ ] **Step 5: 全化合物のSVG一括生成**

```bash
source .venv/bin/activate
python scripts/generate-structure-svgs.py
```

Expected: SMILES が設定されている全エントリのSVGが生成される

- [ ] **Step 6: コミット**

```bash
git add scripts/generate-structure-svgs.py public/images/structures/ requirements-rdkit.txt
git commit -m "feat: generate RDKit SVG structural formulas for Phase 1 compounds"
```

---

## Task 7: Claude Opus カードテキスト生成スクリプト

**Files:**
- Create: `scripts/generate-structural-cards.ts`
- Output: `src/data/structural-flashcard-templates.json`

- [ ] **Step 1: カードテキスト生成スクリプト作成**

`scripts/generate-structural-cards.ts`:

```typescript
/**
 * 構造式フラッシュカード テキスト生成スクリプト
 *
 * structural-formula-registry.json の各エントリについて
 * Claude Opus 4.6 で L1/L2/L3 の3枚のカードテキストを生成する。
 *
 * Usage:
 *   npx tsx scripts/generate-structural-cards.ts [--id struct-caffeine] [--dry-run] [--resume]
 *
 * Output:
 *   src/data/structural-flashcard-templates.json
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import Anthropic from '@anthropic-ai/sdk'
import type { StructuralFormulaRegistry, StructureEntry } from './lib/structural-registry-types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const REGISTRY_PATH = path.join(__dirname, '..', 'src', 'data', 'structural-formula-registry.json')
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'structural-flashcard-templates.json')
const RATE_LIMIT_MS = 500  // Claude API rate limit

interface GeneratedCard {
  level: 'L1' | 'L2' | 'L3'
  format: 'structural_identification' | 'structural_features' | 'structural_pattern'
  front: string
  back: string
  tags: string[]
}

function buildPrompt(entry: StructureEntry): string {
  return `あなたは薬剤師国家試験対策の構造式暗記カード作成者です。
化学・薬学的に正確な情報のみ記載してください。

物質: ${entry.name_ja}（${entry.name_en}）
SMILES: ${entry.smiles}
母核: ${entry.scaffold}
官能基: ${entry.functional_groups.join('、')}
カテゴリ: ${entry.category}
科目: ${entry.subjects.join('、')}

以下の3枚のカードを生成してください:

L1（structural_identification）:
  front: 「この構造式の物質名は？」（※構造式画像は別途SVGで表示するため、テキストでは構造の特徴をヒントとして簡潔に記載）
  back: 物質名 + 母核名 + 所属する化合物群

L2（structural_features）:
  front: 「${entry.name_ja}の構造的特徴を3つ挙げよ」
  back: 特徴3つ（化学的に正確に。国試で問われる視点で）

L3（structural_pattern）:
  front: 「${entry.scaffold}を持つ代表的な化合物を3つ挙げよ」
  back: 化合物3つ + それぞれの用途/分類（薬剤師国試の出題範囲内で）

**必ず以下のJSON配列のみを出力してください。説明文は不要です。**

[
  { "level": "L1", "format": "structural_identification", "front": "...", "back": "...", "tags": ["..."] },
  { "level": "L2", "format": "structural_features", "front": "...", "back": "...", "tags": ["..."] },
  { "level": "L3", "format": "structural_pattern", "front": "...", "back": "...", "tags": ["..."] }
]`
}

function buildTemplateId(entryId: string, level: string): string {
  // struct-caffeine + L1 → sfct-caffeine-L1
  return `sfct-${entryId.replace('struct-', '')}-${level}`
}

async function generateCards(client: Anthropic, entry: StructureEntry): Promise<GeneratedCard[]> {
  const message = await client.messages.create({
    model: 'claude-opus-4-6-20250610',
    max_tokens: 2000,
    messages: [{ role: 'user', content: buildPrompt(entry) }],
  })

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('')

  // JSON配列を抽出（前後のテキストを除去）
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error(`Failed to parse JSON from response for ${entry.id}`)

  const cards: GeneratedCard[] = JSON.parse(jsonMatch[0])
  if (cards.length !== 3) throw new Error(`Expected 3 cards, got ${cards.length} for ${entry.id}`)

  return cards
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const resume = args.includes('--resume')
  const idFilter = args.includes('--id')
    ? args[args.indexOf('--id') + 1]
    : null

  const registry: StructuralFormulaRegistry = JSON.parse(
    fs.readFileSync(REGISTRY_PATH, 'utf-8')
  )

  // 既存の出力を読み込み（resume用）
  let existing: Record<string, unknown>[] = []
  if (resume && fs.existsSync(OUTPUT_PATH)) {
    existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'))
    console.log(`Resuming: ${existing.length} existing cards loaded`)
  }
  const existingIds = new Set(existing.map((c: Record<string, unknown>) => c.id as string))

  const client = new Anthropic()
  const allCards: Record<string, unknown>[] = [...existing]
  let generated = 0
  let skipped = 0
  let failed = 0

  const entries = registry.entries.filter(e => e.smiles)  // SMILESがある物質のみ

  for (const entry of entries) {
    if (idFilter && entry.id !== idFilter) continue

    // resume: 既に3枚生成済みならスキップ
    const expectedIds = ['L1', 'L2', 'L3'].map(l => buildTemplateId(entry.id, l))
    if (resume && expectedIds.every(id => existingIds.has(id))) {
      skipped++
      continue
    }

    console.log(`[${entry.id}] Generating L1/L2/L3 cards for ${entry.name_ja}...`)

    if (dryRun) {
      console.log(`  [DRY RUN] Would call Claude API`)
      continue
    }

    try {
      const cards = await generateCards(client, entry)
      const svgName = entry.id.replace('struct-', '') + '.svg'

      for (const card of cards) {
        const templateId = buildTemplateId(entry.id, card.level)
        // 既存を上書き
        const idx = allCards.findIndex((c: Record<string, unknown>) => c.id === templateId)
        const template = {
          id: templateId,
          source_type: 'structure_db',
          source_id: entry.id,
          primary_exemplar_id: '',  // 後で手動 or スクリプトでexemplarにマッピング
          subject: entry.subjects[0],
          front: card.front,
          back: card.back,
          format: card.format,
          tags: card.tags,
          media_url: `/images/structures/${svgName}`,
          smiles: entry.smiles,
        }
        if (idx >= 0) {
          allCards[idx] = template
        } else {
          allCards.push(template)
        }
      }
      generated++
      console.log(`  OK: 3 cards generated`)
    } catch (err) {
      console.error(`  ERROR: ${err}`)
      failed++
    }

    await sleep(RATE_LIMIT_MS)
  }

  if (!dryRun) {
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allCards, null, 2) + '\n')
    console.log(`\nOutput: ${OUTPUT_PATH}`)
  }

  console.log(`Done: ${generated} compounds processed (${generated * 3} cards), ${skipped} skipped, ${failed} failed`)
}

main().catch(console.error)
```

- [ ] **Step 2: 1化合物でテスト実行**

```bash
npx tsx scripts/generate-structural-cards.ts --id struct-caffeine
```

Expected: `src/data/structural-flashcard-templates.json` に3枚のカードが出力される

- [ ] **Step 3: 出力JSONの内容確認**

生成されたJSONを確認:
- `id` が `sfct-caffeine-L1`, `sfct-caffeine-L2`, `sfct-caffeine-L3` の形式
- `format` が `structural_identification`, `structural_features`, `structural_pattern`
- `media_url` が `/images/structures/caffeine.svg`
- `front`/`back` の内容が化学的に正確

- [ ] **Step 4: 全化合物のカードテキスト一括生成**

```bash
npx tsx scripts/generate-structural-cards.ts --resume
```

`--resume` で途中再開可能。失敗分は再実行で追加される。

Expected: 80化合物 × 3枚 = 約240枚のカードが生成される

- [ ] **Step 5: コミット**

```bash
git add scripts/generate-structural-cards.ts src/data/structural-flashcard-templates.json
git commit -m "feat: generate structural formula flashcard texts with Claude Opus"
```

---

## Task 8: FlashCardTemplate への統合

**Files:**
- Modify: `src/data/flashcard-templates.ts`

- [ ] **Step 1: 構造式テンプレートをインポート**

`src/data/flashcard-templates.ts` の末尾に追加:

```typescript
import structuralTemplatesJson from './structural-flashcard-templates.json'

// 構造式カードテンプレート（Phase 1: ~240枚）
const STRUCTURAL_TEMPLATES: FlashCardTemplate[] = structuralTemplatesJson as FlashCardTemplate[]

// 全テンプレートを結合してエクスポート
export const ALL_FLASHCARD_TEMPLATES: FlashCardTemplate[] = [
  ...FLASHCARD_TEMPLATES,
  ...STRUCTURAL_TEMPLATES,
]
```

- [ ] **Step 2: tsconfig.json で JSON import を許可確認**

`tsconfig.app.json` に `"resolveJsonModule": true` があることを確認。なければ追加。

- [ ] **Step 3: 既存の useFlashCardTemplates フックを更新**

`src/hooks/useFlashCardTemplates.ts` で `FLASHCARD_TEMPLATES` を参照している箇所を `ALL_FLASHCARD_TEMPLATES` に変更。

- [ ] **Step 4: 型チェック + テスト**

```bash
npx tsc --noEmit && npx vitest run
```

Expected: 型エラーなし、全テスト PASS

- [ ] **Step 5: コミット**

```bash
git add src/data/flashcard-templates.ts src/hooks/useFlashCardTemplates.ts
git commit -m "feat: integrate structural formula cards into FlashCardTemplate system"
```

---

## 実行順序の依存関係

```
Task 1 (RDKit環境) ──→ Task 6 (SVG生成)
                                ↓
Task 2 (型定義) ───→ Task 8 (統合)
                                ↑
Task 3 (レジストリ型) → Task 4 (レジストリJSON) → Task 5 (SMILES取得) → Task 7 (カードテキスト)
```

- Task 1 と Task 2-3 は並列実行可能
- Task 4 は Task 3 に依存
- Task 5 は Task 4 に依存
- Task 6 は Task 1 + Task 5 に依存
- Task 7 は Task 5 に依存（SVGは不要、SMILESがあればよい）
- Task 8 は Task 2 + Task 7 に依存

---

## 補足: このプランに含まれないもの（後続プランで対応）

- **StructuralRenderer UIコンポーネント**: TemplatePractice.tsx でSVG画像を表示するレンダラー
- **品質検証スクリプト**: SMILES再照合、SVGファイル存在確認、カードテキスト正確性チェック
- **L3ハイライトSVG**: 部分構造をハイライトしたSVG（generate-structure-svgs.py に機能追加）
- **exemplarマッピング**: `primary_exemplar_id` の自動設定
- **薬剤師レビュー**: 全200枚の正確性レビュー
