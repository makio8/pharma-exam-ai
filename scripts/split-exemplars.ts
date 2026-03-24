/**
 * 粗い例示6件を27サブカテゴリに分割するスクリプト
 *
 * Usage: npx tsx scripts/split-exemplars.ts
 *
 * 対象:
 *   ex-practice-043 (137問) → 9 sub-categories (043a〜043j、043gは0マッピングで除外)
 *   ex-practice-045 (48問)  → 4 sub-categories (045a〜045d)
 *   ex-practice-087 (38問)  → 3 sub-categories (087a〜087c)
 *   ex-pharmacology-067 (36問) → 4 sub-categories (067a〜067d)
 *   ex-practice-074 (32問)  → 3 sub-categories (074a〜074c)
 *   ex-practice-082 (30問)  → 3 sub-categories (082a〜082c)
 *
 * 分類対象フィールド: question_text + linked_scenario のみ
 * （explanation, question_concepts は除外 — 解説文キーワードによる誤分類防止）
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { EXEMPLARS } from '../src/data/exemplars'
import { QUESTION_EXEMPLAR_MAP } from '../src/data/question-exemplar-map'
import { ALL_QUESTIONS } from '../src/data/all-questions'
import type { Exemplar, QuestionExemplarMapping } from '../src/types/blueprint'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// =============================================
// 分類定義
// =============================================

interface SubCategory {
  id: string
  minorCategory: string
  text: string
  keywords: string[]
  /** Special matching logic */
  matchFn?: (searchText: string) => boolean
}

interface SplitTarget {
  oldId: string
  subCategories: SubCategory[]
  catchAllIndex: number // index of the catch-all sub-category
}

const splitTargets: SplitTarget[] = [
  {
    oldId: 'ex-practice-043',
    catchAllIndex: 8, // 043j（043gを削除したため8に変更）
    subCategories: [
      { id: 'ex-practice-043a', minorCategory: '糖尿病・代謝の服薬指導', text: '糖尿病、脂質異常症等の代謝疾患の患者に対する服薬指導ができる。', keywords: ['糖尿病', 'インスリン', 'HbA1c', '血糖', 'コレステロール', '脂質', '痛風'] },
      { id: 'ex-practice-043b', minorCategory: '循環器の服薬指導', text: '高血圧、心不全、狭心症等の循環器疾患の患者に対する服薬指導ができる。', keywords: ['高血圧', '心不全', '狭心症', '不整脈', 'ワルファリン', '抗凝固'] },
      { id: 'ex-practice-043c', minorCategory: '精神・神経の服薬指導', text: '精神・神経疾患の患者に対する服薬指導ができる。', keywords: ['精神', '認知症', '統合失調', 'てんかん', 'パーキンソン', '抗うつ', '不眠', 'うつ'] },
      { id: 'ex-practice-043d', minorCategory: '悪性腫瘍の服薬指導', text: '悪性腫瘍の患者に対する服薬指導ができる。', keywords: ['抗がん', '腫瘍', 'がん', '化学療法', 'レジメン'] },
      { id: 'ex-practice-043e', minorCategory: '感染症の服薬指導', text: '感染症の患者に対する服薬指導ができる。', keywords: ['感染', '抗菌', '抗生', 'HIV', '肝炎', 'ウイルス'] },
      { id: 'ex-practice-043f', minorCategory: '腎機能関連の服薬指導', text: '腎機能障害のある患者に対する服薬指導ができる。', keywords: ['腎', '透析', 'eGFR', 'クレアチニン'] },
      // 043g（呼吸器・吸入）は0マッピングのため削除（GPT-5.4指摘対応）
      { id: 'ex-practice-043h', minorCategory: '小児・妊婦・授乳婦の服薬指導', text: '小児、妊婦、授乳婦に対する服薬指導ができる。', keywords: ['小児', '乳児', '幼児', '妊婦', '妊娠', '授乳'] },
      { id: 'ex-practice-043i', minorCategory: '疼痛・緩和の服薬指導', text: '疼痛管理・緩和ケアの患者に対する服薬指導ができる。', keywords: ['疼痛', '鎮痛', 'オピオイド', 'モルヒネ', '緩和'] },
      { id: 'ex-practice-043j', minorCategory: '一般的な服薬指導', text: '患者・来局者の病状や背景に配慮し、一般的な服薬指導ができる。', keywords: [] },
    ]
  },
  {
    oldId: 'ex-practice-045',
    catchAllIndex: 3, // 045d
    subCategories: [
      { id: 'ex-practice-045a', minorCategory: '吸入薬の使用説明', text: '吸入剤の取扱い方法を患者に説明できる。', keywords: ['吸入', '喘息', 'COPD'] },
      { id: 'ex-practice-045b', minorCategory: '自己注射の使用説明', text: '自己注射剤の取扱い方法を患者に説明できる。', keywords: ['注射', 'インスリン', '自己注射', 'アドレナリン'] },
      { id: 'ex-practice-045c', minorCategory: '点眼薬の使用説明', text: '点眼剤の取扱い方法を患者に説明できる。', keywords: ['点眼'] },
      { id: 'ex-practice-045d', minorCategory: 'その他外用剤の使用説明', text: '坐剤、貼付剤、軟膏等の外用剤の取扱い方法を患者に説明できる。', keywords: ['坐剤', '貼付', '軟膏', 'テープ'] },
    ]
  },
  {
    oldId: 'ex-practice-087',
    catchAllIndex: 2, // 087c
    subCategories: [
      { id: 'ex-practice-087a', minorCategory: '副作用の原因薬剤特定', text: '副作用の原因となる薬剤を特定できる。', keywords: ['原因', '疑', '可能性が高い', '該当する薬剤'] },
      { id: 'ex-practice-087b', minorCategory: '副作用の検査所見評価', text: '副作用を検査所見等から評価できる。', keywords: ['検査', '所見', 'データ', '値'] },
      { id: 'ex-practice-087c', minorCategory: '副作用評価一般', text: '副作用への対処や代替薬の提案など、副作用評価一般について説明できる。', keywords: ['対処', '代替', '変更', '中止', '提案'] },
    ]
  },
  {
    oldId: 'ex-pharmacology-067',
    catchAllIndex: 3, // 067d
    subCategories: [
      { id: 'ex-pharmacology-067a', minorCategory: '細胞傷害性抗悪性腫瘍薬', text: '細胞傷害性の抗悪性腫瘍薬の薬理を説明できる。', keywords: ['アルキル化', '代謝拮抗', '白金', 'シスプラチン', 'ドキソルビシン', 'パクリタキセル', 'フルオロウラシル', 'ビンクリスチン', 'エトポシド', 'イリノテカン'] },
      { id: 'ex-pharmacology-067b', minorCategory: '分子標的薬', text: '分子標的薬の薬理を説明できる。', keywords: ['分子標的', 'チロシンキナーゼ', '抗体', 'イマチニブ', 'ゲフィチニブ', 'トラスツズマブ', 'リツキシマブ', 'ベバシズマブ'] },
      { id: 'ex-pharmacology-067c', minorCategory: 'ホルモン・免疫チェックポイント', text: 'ホルモン療法・免疫チェックポイント阻害薬の薬理を説明できる。', keywords: ['ホルモン', 'タモキシフェン', 'アナストロゾール', '免疫チェックポイント', 'ニボルマブ', 'ペムブロリズマブ'] },
      { id: 'ex-pharmacology-067d', minorCategory: '抗悪性腫瘍支持療法', text: '抗悪性腫瘍薬の支持療法について説明できる。', keywords: ['制吐', 'G-CSF', '支持', '骨髄抑制対策'] },
    ]
  },
  {
    oldId: 'ex-practice-074',
    catchAllIndex: 2, // 074c
    subCategories: [
      { id: 'ex-practice-074a', minorCategory: '生活習慣病の処方提案', text: '生活習慣病に対する適切な処方を提案できる。', keywords: ['糖尿病', '高血圧', '脂質', '血圧'] },
      { id: 'ex-practice-074b', minorCategory: '感染症の処方提案', text: '感染症に対する適切な処方を提案できる。', keywords: ['感染', '抗菌', '抗ウイルス'] },
      { id: 'ex-practice-074c', minorCategory: 'その他の処方提案', text: '患者の状態に基づき適切な処方を提案できる。', keywords: [] },
    ]
  },
  {
    oldId: 'ex-practice-082',
    catchAllIndex: 2, // 082c
    subCategories: [
      { id: 'ex-practice-082a', minorCategory: '循環器薬モニタリング', text: '循環器薬の効果と副作用をモニタリングできる。', keywords: ['高血圧', '心不全', 'ワルファリン', '抗凝固', '心房細動'] },
      { id: 'ex-practice-082b', minorCategory: '抗がん・免疫抑制モニタリング', text: '抗がん薬・免疫抑制薬の効果と副作用をモニタリングできる。', keywords: ['がん', '腫瘍', 'メトトレキサート', 'リウマチ', '免疫抑制'] },
      { id: 'ex-practice-082c', minorCategory: 'その他モニタリング', text: '医薬品の効果と副作用のモニタリングができる。', keywords: [] },
    ]
  },
]

// =============================================
// メイン処理
// =============================================

// 問題IDから問題テキストを取得するMap
const questionMap = new Map(ALL_QUESTIONS.map(q => [q.id, q]))

// 元のexemplar情報を取得するMap
const exemplarMap = new Map(EXEMPLARS.map(e => [e.id, e]))

// Before counts
const beforeMappingCount = QUESTION_EXEMPLAR_MAP.length
console.log(`\n📊 分割前の状態:`)
console.log(`  マッピング総数: ${beforeMappingCount}`)
console.log(`  例示総数: ${EXEMPLARS.length}`)

// 各ターゲットの分割前カウント表示
for (const target of splitTargets) {
  const count = QUESTION_EXEMPLAR_MAP.filter(m => m.exemplarId === target.oldId).length
  console.log(`  ${target.oldId}: ${count}マッピング`)
}

// =============================================
// Step 1: 問題を分類
// =============================================

function classifyQuestion(questionId: string, target: SplitTarget): string {
  const question = questionMap.get(questionId)
  if (!question) {
    console.warn(`  ⚠️ 問題ID ${questionId} が見つかりません → catch-all`)
    return target.subCategories[target.catchAllIndex].id
  }

  // 検索対象テキストを結合（question_text と linked_scenario のみ）
  // explanation と question_concepts は除外 — 解説文中のキーワードによる誤分類を防ぐ
  const searchText = [
    question.question_text,
    question.linked_scenario || '',
  ].join(' ')

  // 優先順位で最初にマッチしたサブカテゴリに分類
  for (let i = 0; i < target.subCategories.length; i++) {
    const sub = target.subCategories[i]

    // catch-all はスキップ（最後に使う）
    if (i === target.catchAllIndex && sub.keywords.length === 0) continue

    // カスタムマッチ関数がある場合はそちらを使う
    if (sub.matchFn) {
      if (sub.matchFn(searchText)) return sub.id
      continue
    }

    // キーワードマッチ
    for (const kw of sub.keywords) {
      if (searchText.includes(kw)) {
        return sub.id
      }
    }
  }

  // どれにもマッチしなければ catch-all
  return target.subCategories[target.catchAllIndex].id
}

// 分類結果を格納
const classificationResults = new Map<string, Map<string, string[]>>() // oldId -> (newId -> questionId[])

for (const target of splitTargets) {
  const resultMap = new Map<string, string[]>()
  for (const sub of target.subCategories) {
    resultMap.set(sub.id, [])
  }

  // このexemplarに紐づくマッピングを全取得
  const mappings = QUESTION_EXEMPLAR_MAP.filter(m => m.exemplarId === target.oldId)

  for (const m of mappings) {
    const newId = classifyQuestion(m.questionId, target)
    resultMap.get(newId)!.push(m.questionId)
  }

  classificationResults.set(target.oldId, resultMap)

  // 結果を表示
  console.log(`\n📋 ${target.oldId} の分類結果:`)
  let total = 0
  for (const sub of target.subCategories) {
    const count = resultMap.get(sub.id)!.length
    total += count
    console.log(`  ${sub.id} (${sub.minorCategory}): ${count}マッピング`)
  }
  console.log(`  合計: ${total}マッピング`)
}

// =============================================
// Step 2: 新しいExemplarエントリを作成
// =============================================

const newExemplars: Exemplar[] = []
const oldIds = new Set(splitTargets.map(t => t.oldId))

// 既存のexemplarから旧IDを除外
const filteredExemplars = EXEMPLARS.filter(e => !oldIds.has(e.id))

// 新しいサブカテゴリを追加
for (const target of splitTargets) {
  const original = exemplarMap.get(target.oldId)!
  for (const sub of target.subCategories) {
    newExemplars.push({
      id: sub.id,
      minorCategory: sub.minorCategory,
      middleCategoryId: original.middleCategoryId,
      subject: original.subject,
      text: sub.text,
    })
  }
}

// 全exemplarを結合（元の位置に挿入するため、元の配列を走査）
const finalExemplars: Exemplar[] = []
for (const e of EXEMPLARS) {
  if (oldIds.has(e.id)) {
    // 旧IDの位置に新サブカテゴリを挿入
    const target = splitTargets.find(t => t.oldId === e.id)!
    for (const sub of target.subCategories) {
      finalExemplars.push(newExemplars.find(n => n.id === sub.id)!)
    }
  } else {
    finalExemplars.push(e)
  }
}

// =============================================
// Step 3: マッピングを更新
// =============================================

const newMappings: QuestionExemplarMapping[] = []

for (const m of QUESTION_EXEMPLAR_MAP) {
  if (oldIds.has(m.exemplarId)) {
    const target = splitTargets.find(t => t.oldId === m.exemplarId)!
    const newId = classifyQuestion(m.questionId, target)
    newMappings.push({ ...m, exemplarId: newId })
  } else {
    newMappings.push(m)
  }
}

// =============================================
// Step 4: バリデーション
// =============================================

console.log(`\n🔍 バリデーション:`)

// マッピング総数の一致
const afterMappingCount = newMappings.length
const mappingCountMatch = afterMappingCount === beforeMappingCount
console.log(`  マッピング総数: ${beforeMappingCount} → ${afterMappingCount} ${mappingCountMatch ? '✅' : '❌ 不一致!'}`)

// 旧IDが0マッピングであること
for (const target of splitTargets) {
  const remaining = newMappings.filter(m => m.exemplarId === target.oldId).length
  console.log(`  ${target.oldId} 残存マッピング: ${remaining} ${remaining === 0 ? '✅' : '❌'}`)
}

// 新IDがすべてexemplarsに存在すること
const finalExemplarIds = new Set(finalExemplars.map(e => e.id))
let allNewIdsExist = true
for (const target of splitTargets) {
  for (const sub of target.subCategories) {
    if (!finalExemplarIds.has(sub.id)) {
      console.log(`  ❌ ${sub.id} がexemplarsに見つかりません`)
      allNewIdsExist = false
    }
  }
}
if (allNewIdsExist) console.log(`  新ID 26件すべて存在 ✅`)

// 例示総数
console.log(`  例示総数: ${EXEMPLARS.length} → ${finalExemplars.length} (差: +${finalExemplars.length - EXEMPLARS.length})`)

if (!mappingCountMatch) {
  console.error('\n❌ マッピング総数が変わっています。中断します。')
  process.exit(1)
}

// =============================================
// Step 5: ファイル書き出し
// =============================================

// exemplars.ts
const exemplarsLines = finalExemplars.map(e => {
  return `  { id: '${e.id}', minorCategory: '${e.minorCategory.replace(/'/g, "\\'")}', middleCategoryId: '${e.middleCategoryId}', subject: '${e.subject}', text: '${e.text.replace(/'/g, "\\'")}' },`
})

const exemplarsTsContent = `// 薬剤師国家試験 出題基準 例示マスタデータ（${finalExemplars.length}件）
// 出典: 厚労省「薬剤師国家試験出題基準」別表Ⅰ〜Ⅶ
// 自動生成: /tmp/parse-exemplars.js + scripts/split-exemplars.ts

import type { Exemplar } from '../types/blueprint'

export const EXEMPLARS: Exemplar[] = [
${exemplarsLines.join('\n')}
]
`

const exemplarsPath = path.join(__dirname, '..', 'src', 'data', 'exemplars.ts')
fs.writeFileSync(exemplarsPath, exemplarsTsContent, 'utf-8')
console.log(`\n📝 exemplars.ts 更新 (${finalExemplars.length}件)`)

// question-exemplar-map.ts
const mapLines = newMappings.map(m => {
  return `  { questionId: "${m.questionId}", exemplarId: "${m.exemplarId}", isPrimary: ${m.isPrimary} },`
})

const mapTsContent = `import type { QuestionExemplarMapping } from '../types/blueprint'

// 問題→例示の多対多マッピング（v3 AI直接推論版）
// 4094問を951例示にAI直接推論で分類（スクリプト不使用、12年分）
export const QUESTION_EXEMPLAR_MAP: QuestionExemplarMapping[] = [
${mapLines.join('\n')}
]

export function getExemplarsForQuestion(questionId: string): QuestionExemplarMapping[] {
  return QUESTION_EXEMPLAR_MAP.filter(m => m.questionId === questionId)
}

export function getQuestionsForExemplar(exemplarId: string): QuestionExemplarMapping[] {
  return QUESTION_EXEMPLAR_MAP.filter(m => m.exemplarId === exemplarId)
}
`

const mapPath = path.join(__dirname, '..', 'src', 'data', 'question-exemplar-map.ts')
fs.writeFileSync(mapPath, mapTsContent, 'utf-8')
console.log(`📝 question-exemplar-map.ts 更新 (${newMappings.length}件)`)

// =============================================
// サマリー
// =============================================

console.log(`\n📊 分割サマリー:`)
console.log(`  旧例示: 6件削除`)
console.log(`  新例示: 26件追加（043g除外）`)
console.log(`  例示総数: ${EXEMPLARS.length} → ${finalExemplars.length}`)
console.log(`  マッピング総数: ${beforeMappingCount} → ${afterMappingCount} (変化なし ✅)`)

console.log(`\n✅ 分割完了！次のステップ:`)
console.log(`  1. npx tsx scripts/validate-data-integrity.ts`)
console.log(`  2. npm test`)
console.log(`  3. npx tsx scripts/compute-exemplar-stats.ts`)
console.log(`  4. npx tsx scripts/generate-heatmap-data.ts`)
