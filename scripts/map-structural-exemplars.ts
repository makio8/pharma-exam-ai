/**
 * 構造式フラッシュカード720枚に primary_exemplar_id を設定するスクリプト
 *
 * マッピング戦略:
 *   Level 1: カテゴリ→デフォルトexemplar
 *   Level 2: 化合物固有のオーバーライド
 *
 * 同じsource_idのカード（L0a/L0b/L1/L2/L3）は全て同一のexemplar_idを持つ
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

// ---------- データ読み込み ----------

interface RegistryEntry {
  id: string
  name_ja: string
  name_en: string
  category: string
}

interface Registry {
  entries: RegistryEntry[]
}

interface FlashCard {
  id: string
  source_id: string
  primary_exemplar_id: string
  [key: string]: unknown
}

const registry: Registry = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/data/structural-formula-registry.json'), 'utf-8')
)

const cardsJson: FlashCard[] = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/data/structural-flashcard-templates.json'), 'utf-8')
)

// ---------- Level 1: カテゴリ→デフォルトexemplar ----------

const CATEGORY_TO_EXEMPLAR: Record<string, string> = {
  // 複素環母核 → 医薬品に含まれる代表的な複素環
  heterocycle: 'ex-chemistry-080',

  // ビタミン → ビタミンの種類、構造、性質、役割
  vitamin: 'ex-biology-012',

  // アミノ酸 → 生体高分子を構成する小分子の構造に基づく化学的性質
  amino_acid: 'ex-chemistry-060',

  // 核酸塩基 → ヌクレオシド及び核酸塩基アナログ
  nucleobase: 'ex-chemistry-081',

  // プロドラッグ → プロドラッグ等の薬物動態を考慮した化学構造
  prodrug: 'ex-chemistry-077',

  // 発がん物質 → 発がん性物質の代謝的活性化
  carcinogen: 'ex-chemistry-074',

  // 甘味料 → 代表的な食品添加物
  sweetener: 'ex-hygiene-034',

  // 保存料 → 代表的な食品添加物
  preservative: 'ex-hygiene-034',

  // 酸化防止剤 → 代表的な食品添加物
  antioxidant: 'ex-hygiene-034',

  // 防カビ剤 → 化学物質やカビによる食品汚染
  antifungal: 'ex-hygiene-038',

  // 農薬 → 有害化学物質や農薬の急性毒性、慢性毒性
  pesticide: 'ex-hygiene-041',

  // 内分泌撹乱物質 → 有害化学物質や農薬の急性毒性、慢性毒性
  endocrine_disruptor: 'ex-hygiene-041',

  // 中毒解毒薬 → 代表的な中毒原因物質の解毒処置法
  antidote: 'ex-hygiene-044',

  // トクホ → 特別用途食品と保健機能食品
  foshu: 'ex-hygiene-035',

  // 薬理（デフォルト: カテコールアミン骨格の代表的医薬品）
  pharmacology: 'ex-chemistry-088',
}

// ---------- Level 2: 化合物固有のオーバーライド ----------

const COMPOUND_OVERRIDE: Record<string, string> = {
  // === heterocycle カテゴリ内のオーバーライド ===

  // 母核（プリン、ピリミジン等）は芳香族複素環の性質
  'struct-purine': 'ex-chemistry-028',
  'struct-pyrimidine': 'ex-chemistry-028',
  'struct-indole': 'ex-chemistry-028',
  'struct-quinoline': 'ex-chemistry-028',
  'struct-imidazole': 'ex-chemistry-028',
  'struct-thiazole': 'ex-chemistry-028',
  'struct-pyridine': 'ex-chemistry-028',
  'struct-pyrrole': 'ex-chemistry-028',
  'struct-furan': 'ex-chemistry-028',
  'struct-thiophene': 'ex-chemistry-028',

  // ベンゾジアゼピン骨格 → ベンゾジアゼピン骨格及びバルビタール骨格
  'struct-benzodiazepine': 'ex-chemistry-091',
  'struct-diazepam': 'ex-chemistry-091',
  'struct-midazolam': 'ex-chemistry-091',

  // フェノチアジン骨格（クロルプロマジン等）→ 受容体に作用するその他の代表的医薬品
  'struct-phenothiazine': 'ex-chemistry-093',
  'struct-chlorpromazine': 'ex-chemistry-093',

  // ステロイド骨格 → ステロイドアナログ
  'struct-steroid': 'ex-chemistry-090',
  'struct-cholesterol': 'ex-chemistry-090',
  'struct-prednisolone': 'ex-chemistry-090',

  // β-ラクタム → β-ラクタム構造をもつ代表的医薬品
  'struct-beta-lactam': 'ex-chemistry-085',
  'struct-penicillin-g': 'ex-chemistry-085',
  'struct-cephalothin': 'ex-chemistry-085',

  // テトラサイクリン → 抗菌薬の薬理
  'struct-tetracycline': 'ex-pharmacology-063',

  // 核酸塩基（heterocycleカテゴリだが核酸系） → ヌクレオシド及び核酸塩基アナログ
  'struct-adenine': 'ex-chemistry-081',
  'struct-guanine': 'ex-chemistry-081',
  'struct-cytosine': 'ex-chemistry-081',
  'struct-uracil': 'ex-chemistry-081',
  'struct-thymine': 'ex-chemistry-081',

  // カフェイン・ヒポキサンチン・尿酸 → プリン代謝系（ヌクレオチドの生合成と分解）
  'struct-caffeine': 'ex-biology-046',
  'struct-hypoxanthine': 'ex-biology-046',
  'struct-uric-acid': 'ex-biology-046',

  // セロトニン → 代表的な神経伝達物質
  'struct-serotonin': 'ex-biology-087',

  // トリプトファン → アミノ酸を列挙し、その構造に基づいて性質
  'struct-tryptophan': 'ex-biology-008',

  // キニーネ → 複素環を構造に基づいて分類（キノリン骨格の天然物）
  // デフォルト（ex-chemistry-080）のまま

  // ヒスタミン → 受容体に作用するその他の代表的医薬品
  'struct-histamine': 'ex-chemistry-093',

  // ヒスチジン → アミノ酸
  'struct-histidine': 'ex-biology-008',

  // フロセミド → スルホンアミド構造
  'struct-furosemide': 'ex-chemistry-083',

  // チクロピジン → 複素環のまま（デフォルト）

  // === prodrug カテゴリ内のオーバーライド ===

  // PPI（ランソプラゾール、オメプラゾール）→ 胃・十二指腸潰瘍治療薬
  'struct-lansoprazole': 'ex-pharmacology-048',
  'struct-omeprazole': 'ex-pharmacology-048',

  // レボドパ → パーキンソン病治療薬
  'struct-levodopa': 'ex-pharmacology-024',

  // バラシクロビル → 抗ウイルス薬
  'struct-valacyclovir': 'ex-pharmacology-065',

  // オセルタミビル → 抗ウイルス薬
  'struct-oseltamivir': 'ex-pharmacology-065',

  // セフカペンピボキシル → β-ラクタム構造
  'struct-cefcapene-pivoxil': 'ex-chemistry-085',

  // クロピドグレル → 抗血栓薬、抗凝固薬
  'struct-clopidogrel': 'ex-pharmacology-041',

  // ドカルパミン → カテコールアミン骨格
  'struct-docarpamine': 'ex-chemistry-088',

  // === carcinogen カテゴリ内のオーバーライド ===

  // アフラトキシン → 食品成分由来の発がん性物質
  'struct-aflatoxin-b1': 'ex-hygiene-033',

  // デオキシニバレノール → カビによる食品汚染
  'struct-deoxynivalenol': 'ex-hygiene-038',

  // TCDD → 重金属、PCB、ダイオキシン等の有害化学物質
  'struct-tcdd': 'ex-hygiene-041',

  // フェナセチン → 発がん性物質の代謝的活性化（デフォルト）

  // === pharmacology カテゴリ内のオーバーライド ===

  // アドレナリン、ノルアドレナリン、ドパミン → カテコールアミン骨格
  // struct-adrenaline: デフォルト（ex-chemistry-088）
  // struct-noradrenaline: デフォルト（ex-chemistry-088）
  // struct-dopamine: デフォルト（ex-chemistry-088）

  // アセチルコリン → アセチルコリンアナログ
  'struct-acetylcholine': 'ex-chemistry-089',

  // インドメタシン、ジクロフェナク → フェニル酢酸、フェニルプロピオン酸構造
  'struct-indomethacin': 'ex-chemistry-082',
  'struct-diclofenac': 'ex-chemistry-082',

  // シメチジン → 胃・十二指腸潰瘍治療薬
  'struct-cimetidine': 'ex-pharmacology-048',

  // ワルファリン → 抗血栓薬、抗凝固薬
  'struct-warfarin': 'ex-pharmacology-041',

  // メタンフェタミン → 薬物の乱用による健康への影響
  'struct-methamphetamine': 'ex-hygiene-043',

  // コデイン、モルヒネ → オピオイドアナログ
  'struct-codeine': 'ex-chemistry-092',
  'struct-morphine': 'ex-chemistry-092',

  // デキサメタゾン → ステロイドアナログ
  'struct-dexamethasone': 'ex-chemistry-090',

  // === antidote カテゴリ内のオーバーライド ===

  // PAM → 有機リン系農薬の解毒（中毒原因物質の解毒処置法のまま）
  // アトロピン → アセチルコリンアナログ（副交感神経遮断）
  'struct-atropine': 'ex-chemistry-089',

  // ナロキソン → オピオイドアナログ
  'struct-naloxone': 'ex-chemistry-092',

  // フルマゼニル → ベンゾジアゼピン骨格
  'struct-flumazenil': 'ex-chemistry-091',

  // メチレンブルー → 中毒解毒（デフォルト）

  // === pesticide カテゴリ内のオーバーライド ===

  // マラチオン、パラチオン、ダイアジノン → 有機リン系（農薬）
  'struct-malathion': 'ex-hygiene-041',
  'struct-parathion': 'ex-hygiene-041',
  'struct-diazinon': 'ex-hygiene-041',

  // DDT → 有害化学物質（デフォルト）

  // === endocrine_disruptor カテゴリ内のオーバーライド ===

  // PCB、TCDD系 → 重金属、PCB、ダイオキシン等
  'struct-pcb': 'ex-hygiene-041',

  // === amino_acid のオーバーライド ===
  // 全アミノ酸 → アミノ酸を列挙し、その構造に基づいて性質
  'struct-glycine': 'ex-biology-008',
  'struct-alanine': 'ex-biology-008',
  'struct-valine': 'ex-biology-008',
  'struct-leucine': 'ex-biology-008',
  'struct-isoleucine': 'ex-biology-008',
  'struct-proline': 'ex-biology-008',
  'struct-phenylalanine': 'ex-biology-008',
  'struct-methionine': 'ex-biology-008',
  'struct-serine': 'ex-biology-008',
  'struct-threonine': 'ex-biology-008',
  'struct-cysteine': 'ex-biology-008',
  'struct-tyrosine': 'ex-biology-008',
  'struct-asparagine': 'ex-biology-008',
  'struct-glutamine': 'ex-biology-008',
  'struct-aspartic-acid': 'ex-biology-008',
  'struct-glutamic-acid': 'ex-biology-008',
  'struct-lysine': 'ex-biology-008',
  'struct-arginine': 'ex-biology-008',
}

// ---------- マッピング実行 ----------

// レジストリからsource_id→categoryの逆引きMap
const idToCategory = new Map<string, string>()
for (const entry of registry.entries) {
  idToCategory.set(entry.id, entry.category)
}

// source_id → exemplar_id のマッピング結果
const sourceIdToExemplar = new Map<string, string>()

// 全source_idを一意に抽出
const allSourceIds = [...new Set(cardsJson.map(c => c.source_id))]

let mappedCount = 0
let overrideCount = 0
let categoryCount = 0
let unmappedCount = 0
const unmappedIds: string[] = []

for (const sourceId of allSourceIds) {
  const category = idToCategory.get(sourceId)

  // Level 2: 化合物固有オーバーライド
  if (COMPOUND_OVERRIDE[sourceId]) {
    sourceIdToExemplar.set(sourceId, COMPOUND_OVERRIDE[sourceId])
    overrideCount++
    mappedCount++
    continue
  }

  // Level 1: カテゴリデフォルト
  if (category && CATEGORY_TO_EXEMPLAR[category]) {
    sourceIdToExemplar.set(sourceId, CATEGORY_TO_EXEMPLAR[category])
    categoryCount++
    mappedCount++
    continue
  }

  // マッピングなし → 空文字列のまま
  unmappedIds.push(sourceId)
  unmappedCount++
}

// ---------- カードに反映 ----------

let updatedCardCount = 0

for (const card of cardsJson) {
  const exemplarId = sourceIdToExemplar.get(card.source_id)
  if (exemplarId) {
    card.primary_exemplar_id = exemplarId
    updatedCardCount++
  }
}

// ---------- JSON書き出し ----------

const jsonPath = path.join(ROOT, 'src/data/structural-flashcard-templates.json')
fs.writeFileSync(jsonPath, JSON.stringify(cardsJson, null, 2) + '\n', 'utf-8')

// ---------- TS書き出し ----------

const tsPath = path.join(ROOT, 'src/data/structural-flashcard-templates.ts')
const tsContent = `// src/data/structural-flashcard-templates.ts
// 構造式フラッシュカードテンプレート
// L0a/L0b(基礎: 名前↔画像) 288枚 + L1/L2/L3(応用) 432枚 = 720枚

import type { FlashCardTemplate } from "../types/flashcard-template"

export const STRUCTURAL_FLASHCARD_TEMPLATES: FlashCardTemplate[] = ${JSON.stringify(cardsJson, null, 2)}
`

fs.writeFileSync(tsPath, tsContent, 'utf-8')

// ---------- レポート ----------

console.log('=== 構造式カード exemplar マッピング結果 ===')
console.log(`化合物数: ${allSourceIds.length}`)
console.log(`マッピング成功: ${mappedCount} (Level 2 オーバーライド: ${overrideCount}, Level 1 カテゴリ: ${categoryCount})`)
console.log(`マッピングなし: ${unmappedCount}`)
console.log(`更新カード数: ${updatedCardCount} / ${cardsJson.length}`)

if (unmappedIds.length > 0) {
  console.log('\n--- マッピングなしの化合物 ---')
  for (const id of unmappedIds) {
    const cat = idToCategory.get(id) ?? '(unknown)'
    console.log(`  ${id} [${cat}]`)
  }
}

// マッピング内容の詳細サマリー
console.log('\n--- カテゴリ別マッピングサマリー ---')
const categoryStats: Record<string, { total: number; override: number; default: number }> = {}
for (const sourceId of allSourceIds) {
  const cat = idToCategory.get(sourceId) ?? 'unknown'
  if (!categoryStats[cat]) categoryStats[cat] = { total: 0, override: 0, default: 0 }
  categoryStats[cat].total++
  if (COMPOUND_OVERRIDE[sourceId]) {
    categoryStats[cat].override++
  } else {
    categoryStats[cat].default++
  }
}
for (const [cat, stats] of Object.entries(categoryStats).sort((a, b) => b[1].total - a[1].total)) {
  console.log(`  ${cat}: ${stats.total}件 (override ${stats.override}, default ${stats.default})`)
}
