/**
 * 問題→中項目マッピングスクリプト
 *
 * 既存の3,795問を出題基準の86中項目にマッピングする。
 * アプローチ:
 *   1. Subject（科目）フィルタで候補を絞り込み
 *   2. 中項目名 + 小項目キーワードで question_text / explanation をスコアリング
 *   3. 最高スコアの中項目を割り当て
 *
 * 実行: npx tsx scripts/map-questions-to-topics.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// --- 型定義（スクリプト用に軽量に再定義） ---
interface Question {
  id: string
  year: number
  question_number: number
  section: string
  subject: string
  category: string
  question_text: string
  choices: { key: number; text: string }[]
  correct_answer: number
  explanation: string
  tags: string[]
}

interface MiddleCategory {
  id: string
  name: string
  minorCategories: string[]
}

interface MajorCategory {
  name: string
  middleCategories: MiddleCategory[]
}

interface SubjectBlueprint {
  subject: string
  majorCategories: MajorCategory[]
}

// --- データ読み込み ---
// exam-blueprint.ts からブループリントを取得（動的import）
async function loadBlueprint(): Promise<SubjectBlueprint[]> {
  const mod = await import(path.resolve(__dirname, '../src/data/exam-blueprint.ts'))
  return mod.EXAM_BLUEPRINT
}

async function loadAllQuestions(): Promise<Question[]> {
  const allQuestions: Question[] = []
  for (let year = 100; year <= 110; year++) {
    const mod = await import(
      path.resolve(__dirname, `../src/data/real-questions/exam-${year}.ts`)
    )
    const exportName = `EXAM_${year}_QUESTIONS`
    const questions = mod[exportName] as Question[]
    if (questions) {
      allQuestions.push(...questions)
    }
  }
  return allQuestions
}

// --- キーワード抽出・マッチング ---

/**
 * テキストからキーワードを抽出（日本語対応）
 * 短すぎる語（1文字）は除外
 */
function extractWords(text: string): string[] {
  if (!text) return []
  // 句読点・記号を除去してスペース区切り
  const cleaned = text
    .replace(/[、。，．・：；！？「」『』（）【】\[\]{}〔〕〈〉《》\n\r\t]/g, ' ')
    .replace(/[,.:;!?()[\]{}]/g, ' ')
  return cleaned.split(/\s+/).filter((w) => w.length >= 2)
}

/**
 * 科目ごとのキーワードインデックスを構築
 * Map<subject, { topicId, keyword, weight }[]>
 */
interface KeywordEntry {
  topicId: string
  keyword: string
  weight: number // 中項目名マッチ=3, 小項目名マッチ=5（より具体的）
}

function buildKeywordIndex(
  blueprint: SubjectBlueprint[]
): Map<string, KeywordEntry[]> {
  const index = new Map<string, KeywordEntry[]>()

  for (const subj of blueprint) {
    const entries: KeywordEntry[] = []

    for (const major of subj.majorCategories) {
      for (const middle of major.middleCategories) {
        // 中項目名のキーワード
        const middleWords = extractWords(middle.name)
        for (const word of middleWords) {
          entries.push({ topicId: middle.id, keyword: word, weight: 3 })
        }
        // 中項目名全体も（完全一致ボーナス）
        if (middle.name.length >= 3) {
          entries.push({ topicId: middle.id, keyword: middle.name, weight: 8 })
        }

        // 小項目キーワード（より具体的なので高ウエイト）
        for (const minor of middle.minorCategories) {
          // 小項目名全体
          if (minor.length >= 3) {
            entries.push({ topicId: middle.id, keyword: minor, weight: 10 })
          }
          // 小項目名を分割
          const minorWords = extractWords(minor)
          for (const word of minorWords) {
            entries.push({ topicId: middle.id, keyword: word, weight: 5 })
          }
        }

        // 大項目名のキーワード（補助的）
        const majorWords = extractWords(major.name)
        for (const word of majorWords) {
          entries.push({ topicId: middle.id, keyword: word, weight: 1 })
        }
      }
    }

    index.set(subj.subject, entries)
  }

  return index
}

/**
 * 実務科目の追加キーワードマッピング
 * 実務は他の科目の内容と重複するが、「実務」的な観点のキーワードで分類する
 */
const PRACTICE_KEYWORDS: Record<string, string[]> = {
  'practice-medical-professional': [
    '患者の権利', '医療倫理', '医療人', 'インフォームドコンセント', '守秘義務',
    'コミュニケーション', '接遇', '身だしなみ',
  ],
  'practice-pharmacy-basics': [
    '薬剤師業務', '臨床業務', '薬局業務', '病棟業務', '医薬品管理',
    '薬歴', 'SOAP', '服薬指導', '初回面談',
  ],
  'practice-dispensing': [
    '処方箋', '調剤', '疑義照会', '計量', '混合', '無菌操作', '散剤',
    '水剤', '注射剤', '輸液', '配合変化', '粉砕', 'TPN', '高カロリー輸液',
    '処方監査', '処方鑑査', '服薬指導', 'お薬手帳', '薬袋',
    '医薬品の供給', '在庫管理', '安全管理', 'インシデント', 'アクシデント',
    'リスクマネジメント', '医療安全', 'ヒヤリハット',
  ],
  'practice-drug-therapy': [
    '薬物療法', '処方設計', '処方提案', '副作用モニタリング', 'TDM',
    '薬物動態', '血中濃度', '腎機能', '肝機能', 'eGFR', 'CCr',
    '投与量', '投与設計', '用法用量', '相互作用', '禁忌',
    '検査値', '臨床検査', '薬効評価', '副作用評価',
  ],
  'practice-team-medicine': [
    'チーム医療', '多職種連携', 'NST', '栄養サポートチーム',
    'ICT', '感染制御チーム', '緩和ケアチーム', 'PCT',
    '糖尿病チーム', 'CKDチーム', '褥瘡チーム',
    '病棟薬剤業務', 'カンファレンス', '回診',
  ],
  'practice-community-health': [
    '在宅', '訪問薬剤', '介護', '居宅療養管理指導',
    '地域包括ケア', 'かかりつけ薬局', '健康サポート薬局',
    'セルフメディケーション', 'OTC', '要指導医薬品',
    '一般用医薬品', 'プライマリケア', '学校薬剤師',
    '災害', '避難所', 'お薬手帳', 'DMAT',
  ],
}

/**
 * 衛生科目の追加キーワード
 */
const HYGIENE_KEYWORDS: Record<string, string[]> = {
  'hygiene-society-health': [
    '疫学', '保健統計', '人口動態', '死亡率', '罹患率', '有病率',
    '国民健康・栄養調査', '国民生活基礎調査', '人口ピラミッド',
    '平均寿命', '健康寿命', 'WHO', '健康日本21', 'オッズ比', '相対危険',
    'コホート研究', '症例対照研究', '介入研究', 'スクリーニング',
    '感度', '特異度', '陽性的中率',
  ],
  'hygiene-disease-prevention': [
    '感染症', '予防接種', 'ワクチン', '消毒', '滅菌', '院内感染',
    '生活習慣病', '糖尿病', '高血圧', '脂質異常症', 'メタボリック',
    '母子保健', '母子健康手帳', '乳幼児健診', '新生児マススクリーニング',
    '労働衛生', '職業病', '特殊健康診断', '作業環境測定',
    '結核', 'HIV', 'インフルエンザ', 'ノロウイルス',
  ],
  'hygiene-nutrition': [
    '栄養', '食品', '食品添加物', '食品衛生', '食中毒',
    'ビタミン', 'ミネラル', 'たんぱく質', '脂質', '炭水化物',
    '食物繊維', 'アミノ酸', '必須脂肪酸',
    '特定保健用食品', '栄養機能食品', '機能性表示食品',
    'HACCP', '食品安全', '残留農薬',
    'カビ毒', 'アフラトキシン', 'ボツリヌス', 'サルモネラ',
    '腸管出血性大腸菌', 'カンピロバクター', 'ヒスタミン',
  ],
  'hygiene-chemical-radiation': [
    '化学物質', '毒性', '中毒', '解毒', '有害金属',
    'カドミウム', '水銀', 'ヒ素', '鉛', 'クロム',
    '発がん', '変異原性', 'Ames試験', '遺伝毒性',
    '放射線', '放射能', '被ばく', 'シーベルト', 'グレイ', 'ベクレル',
    '化学物質の安全性', 'LD50', 'NOAEL', 'ADI', 'TDI',
    '有機溶剤', 'ダイオキシン', 'PCB', 'アスベスト',
  ],
  'hygiene-living-environment': [
    '地球環境', '生態系', 'オゾン層', '温暖化', '酸性雨',
    '環境基準', '排出基準', '水質汚濁', '大気汚染', '土壌汚染',
    'BOD', 'COD', 'DO', 'SS', 'pH',
    '上水道', '下水道', '浄水', '塩素消毒',
    'PM2.5', 'NOx', 'SOx', '光化学オキシダント',
    '室内環境', 'シックハウス', 'ホルムアルデヒド',
    '廃棄物', 'マニフェスト', 'リサイクル', '産業廃棄物',
  ],
}

/**
 * 薬理科目の追加キーワード
 */
const PHARMACOLOGY_KEYWORDS: Record<string, string[]> = {
  'pharmacology-drug-mechanism': [
    '用量反応曲線', 'ED50', 'pD2', '受容体', 'アゴニスト', 'アンタゴニスト',
    '親和性', '内活性', '競合的', '非競合的', 'Gタンパク質', 'イオンチャネル',
    '酵素', 'トランスポーター', 'セカンドメッセンジャー', 'cAMP', 'IP3',
    '薬物相互作用', '薬効', '薬力学', '薬物動態', '生物学的同等性',
  ],
  'pharmacology-drug-safety': [
    '薬物依存', '耐性', '離脱症状', '副作用', '有害事象',
    '薬害', '催奇形性', '発がん性', '肝毒性', '腎毒性',
  ],
  'pharmacology-autonomic-nervous': [
    '交感神経', '副交感神経', 'アドレナリン', 'ノルアドレナリン',
    'アセチルコリン', 'ムスカリン', 'ニコチン', 'α受容体', 'β受容体',
    '局所麻酔', '筋弛緩', '全身麻酔', '催眠', '鎮静',
    '抗不安', '抗うつ', '抗精神病', '抗てんかん', 'パーキンソン',
    'アルツハイマー', '鎮痛', 'オピオイド', 'モルヒネ', 'NSAIDs',
    '中枢神経', '末梢神経', '自律神経', '運動神経', '骨格筋',
    'ドパミン', 'セロトニン', 'GABA', 'グルタミン酸',
    '統合失調症', 'うつ病', '躁うつ病', '不眠症', 'てんかん',
    '片頭痛', '認知症',
  ],
  'pharmacology-immune-bone': [
    '抗炎症', 'ステロイド', '非ステロイド', 'NSAIDs', 'COX',
    'プロスタグランジン', 'ロイコトリエン', 'ヒスタミン',
    '免疫抑制', '抗アレルギー', '抗ヒスタミン', 'アナフィラキシー',
    '関節リウマチ', '骨粗鬆症', 'ビスホスホネート', 'カルシウム',
    'ビタミンD', '副甲状腺', 'RANKL', 'デノスマブ',
    '痛風', '高尿酸血症', 'アロプリノール', 'コルヒチン',
  ],
  'pharmacology-cardiovascular': [
    '降圧', '高血圧', 'ACE阻害', 'ARB', 'Ca拮抗', 'β遮断',
    '利尿', '強心', 'ジギタリス', '抗不整脈', '抗狭心症',
    '抗血栓', '抗凝固', 'ワルファリン', 'ヘパリン', '血小板',
    '心不全', '不整脈', '狭心症', '心筋梗塞',
    '脂質異常症', 'スタチン', 'フィブラート',
    '貧血', 'エリスロポエチン', '鉄', '葉酸',
    '腎', '腎不全', '透析', '利尿薬', 'ループ利尿', 'サイアザイド',
    'カリウム保持性利尿', '浸透圧利尿',
    '子宮', 'オキシトシン', 'エストロゲン', 'プロゲステロン',
    '勃起不全', 'PDE5',
  ],
  'pharmacology-respiratory-digestive': [
    '気管支喘息', 'β2刺激', 'テオフィリン', '抗コリン', '吸入ステロイド',
    'COPD', '鎮咳', '去痰', '呼吸',
    '消化性潰瘍', 'PPI', 'H2ブロッカー', '制酸', '胃',
    '下剤', '止瀉', '制吐', '腸', '肝', '膵',
    'プロトンポンプ', 'ヘリコバクター', 'ピロリ',
  ],
  'pharmacology-metabolic-endocrine': [
    '糖尿病', 'インスリン', 'SU薬', 'ビグアナイド', 'αGI',
    'DPP-4', 'GLP-1', 'SGLT2', 'チアゾリジン',
    '甲状腺', '副腎', 'ステロイドホルモン',
    '脂質異常', '高脂血症', '痛風', '高尿酸血症',
  ],
  'pharmacology-sensory-skin': [
    '緑内障', '白内障', '眼', '点眼', '縮瞳', '散瞳',
    '皮膚', '乾癬', 'アトピー', '湿疹',
    '耳', '鼻', 'めまい', '耳鳴',
  ],
  'pharmacology-antimicrobial-antitumor': [
    '抗菌', '抗生物質', 'ペニシリン', 'セフェム', 'カルバペネム',
    'アミノグリコシド', 'マクロライド', 'キノロン', 'テトラサイクリン',
    'グリコペプチド', 'バンコマイシン', 'MRSA',
    '抗真菌', 'アゾール', 'アムホテリシン',
    '抗ウイルス', 'HIV', 'HBV', 'HCV', 'インフルエンザ', 'ヘルペス',
    'マラリア', '寄生虫',
    '抗がん', '抗腫瘍', 'アルキル化', '代謝拮抗', '白金製剤',
    '分子標的', '免疫チェックポイント', 'モノクローナル抗体',
    'がん', '腫瘍', '悪性新生物',
  ],
  'pharmacology-structure-activity': [
    '構造活性相関', 'SAR', '基本骨格', 'ファーマコフォア',
  ],
}

/**
 * 法規科目の追加キーワード
 */
const LAW_KEYWORDS: Record<string, string[]> = {
  'law-pharmacist-mission': [
    '薬剤師法', '薬剤師の任務', '調剤の場所', '処方箋', '名簿',
    '薬害', 'サリドマイド', 'スモン', 'HIV', 'ヤコブ', 'C型肝炎',
  ],
  'law-ethics': [
    '生命倫理', 'ヘルシンキ宣言', 'ニュルンベルク', 'インフォームドコンセント',
    '個人情報保護', '患者の権利', '自己決定権', '守秘義務',
    '臓器移植', '脳死', '終末期', '安楽死', '尊厳死',
  ],
  'law-research': [
    '臨床研究', '治験', 'GCP', 'GLP', 'GMP', 'GVP', 'GPSP',
    '承認申請', '治験審査委員会', 'IRB',
  ],
  'law-trust': [
    'コミュニケーション', '服薬指導', '患者対応', '傾聴',
  ],
  'law-self-development': [
    '生涯学習', '自己研鑽', '実務実習', '薬学教育',
  ],
  'law-society': [
    '地域社会', '公衆衛生', '薬剤師の職能',
  ],
  'law-regulations': [
    '薬機法', '医薬品医療機器等法', '薬事法',
    '毒薬', '劇薬', '処方箋医薬品', '要指導医薬品', '一般用医薬品',
    '麻薬', '向精神薬', '覚醒剤', '大麻', 'あへん',
    '麻薬及び向精神薬取締法', '覚醒剤取締法', '大麻取締法',
    '毒物及び劇物取締法', '医薬品副作用被害救済制度',
    '日本薬局方', '生物由来製品', '特定生物由来製品',
    '製造販売承認', 'GMP', 'GQP', 'GDP',
    '添付文書', '安全性情報', '副作用報告', 'PMDA',
    '医薬品リスク管理計画', 'RMP',
  ],
  'law-social-security': [
    '医療保険', '国民健康保険', '社会保険', '後期高齢者医療',
    '介護保険', '診療報酬', '調剤報酬', '薬価',
    '高額療養費', '公費負担医療', '生活保護',
    '医療費', '国民医療費', 'ジェネリック', '後発医薬品',
    'フォーミュラリ',
  ],
  'law-community-pharmacy': [
    '薬局', 'かかりつけ薬剤師', '健康サポート薬局', '地域連携薬局',
    '専門医療機関連携薬局',
    '地域包括ケア', '在宅医療', '訪問薬剤管理指導',
    'お薬手帳', '薬歴',
  ],
}

/**
 * 病態・薬物治療科目の追加キーワード
 */
const PATHOLOGY_KEYWORDS: Record<string, string[]> = {
  'pathology-body-changes': [
    '症候', '症状', 'バイタルサイン', '血圧', '脈拍', '体温',
    '臨床検査', '血液検査', '尿検査', '画像診断',
    'AST', 'ALT', 'γ-GTP', 'BUN', 'クレアチニン', 'CRP',
    '白血球', '赤血球', '血小板', 'ヘモグロビン',
  ],
  'pathology-drug-therapy-positioning': [
    '薬物治療の位置づけ', 'ガイドライン', '治療方針',
  ],
  'pathology-drug-safety': [
    '副作用', '有害事象', '薬物アレルギー', '薬疹',
    'スティーブンスジョンソン', '中毒性表皮壊死症', 'TEN',
    '肝障害', '腎障害', '骨髄抑制', '間質性肺炎',
  ],
  'pathology-nervous-system': [
    '脳梗塞', '脳出血', 'てんかん', 'パーキンソン', 'アルツハイマー',
    '認知症', '統合失調症', 'うつ病', '双極性障害', '不安障害',
    '不眠症', '片頭痛', '重症筋無力症', 'ALS', '多発性硬化症',
    '神経', '脊髄', '末梢神経障害',
  ],
  'pathology-immune-bone': [
    '関節リウマチ', 'SLE', '全身性エリテマトーデス',
    '骨粗鬆症', '変形性関節症', '痛風',
    'アレルギー', '花粉症', 'アナフィラキシー', '喘息',
    'アトピー性皮膚炎', 'クローン病', '潰瘍性大腸炎',
  ],
  'pathology-cardiovascular': [
    '高血圧', '心不全', '不整脈', '狭心症', '心筋梗塞',
    '動脈硬化', '大動脈瘤', '深部静脈血栓症', '肺塞栓',
    '脂質異常症', '貧血', '鉄欠乏性貧血',
    '白血病', 'リンパ腫', '多発性骨髄腫',
    'DIC', '播種性血管内凝固', 'ITP', '血友病',
    '腎不全', '透析', 'CKD', 'ネフローゼ', '糸球体腎炎',
    'BPH', '前立腺肥大', '子宮内膜症', '更年期障害',
  ],
  'pathology-respiratory-digestive': [
    '肺炎', 'COPD', '気管支喘息', '間質性肺炎', '肺がん',
    '気胸', '肺結核', '睡眠時無呼吸',
    '消化性潰瘍', '胃潰瘍', '十二指腸潰瘍',
    'GERD', '逆流性食道炎', '肝炎', '肝硬変', '肝がん',
    '膵炎', '胆石', '大腸がん', '胃がん',
    '炎症性腸疾患', '過敏性腸症候群', 'IBS',
  ],
  'pathology-metabolic-endocrine': [
    '糖尿病', '1型糖尿病', '2型糖尿病', 'HbA1c',
    '甲状腺', 'バセドウ', '橋本病', '甲状腺機能低下',
    '副腎', 'クッシング', 'アジソン',
    '脂質異常症', '高尿酸血症', '痛風',
    '骨粗鬆症',
  ],
  'pathology-sensory-skin': [
    '緑内障', '白内障', '加齢黄斑変性', '網膜',
    '中耳炎', 'アレルギー性鼻炎', '副鼻腔炎',
    'アトピー', '乾癬', '蕁麻疹', '帯状疱疹', '白癬',
    '褥瘡', 'やけど', '熱傷',
  ],
  'pathology-infection-cancer': [
    '細菌感染', 'ウイルス感染', '真菌感染', '寄生虫',
    'MRSA', '結核', 'HIV', 'AIDS', 'B型肝炎', 'C型肝炎',
    'インフルエンザ', 'COVID', 'ヘルペス', 'サイトメガロ',
    '敗血症', '髄膜炎', '肺炎', '尿路感染',
    'がん', '腫瘍', '抗がん剤', '化学療法', '放射線療法',
    '緩和ケア', '終末期', 'ホスピス', '疼痛管理',
    '制吐', '支持療法', 'G-CSF',
  ],
  'pathology-kampo': [
    '漢方', '生薬', '証', '気血水', '虚実',
    '葛根湯', '小柴胡湯', '大建中湯', '抑肝散', '六君子湯',
    '芍薬甘草湯', '補中益気湯', '十全大補湯', '麻黄湯',
    '防風通聖散', '当帰芍薬散', '桂枝茯苓丸',
  ],
  'pathology-bio-genome': [
    'バイオ医薬品', '抗体医薬', 'バイオシミラー',
    '遺伝子治療', '細胞治療', 'CAR-T', 'iPS細胞',
    'ゲノム', '遺伝子診断', 'ファーマコゲノミクス',
    '組換え', 'モノクローナル抗体',
  ],
  'pathology-drug-info': [
    '医薬品情報', '添付文書', 'インタビューフォーム',
    'PMDA', '医薬品安全性情報', '緊急安全性情報',
    'ブルーレター', 'イエローレター',
    'DI', 'ドラッグインフォメーション',
  ],
  'pathology-ebm': [
    'EBM', 'エビデンス', 'メタアナリシス', 'システマティックレビュー',
    'ランダム化比較試験', 'RCT', 'コクラン',
  ],
  'pathology-biostatistics': [
    '統計', 't検定', 'カイ二乗', '分散分析', '回帰分析',
    'p値', '有意水準', '信頼区間', '標準偏差', '中央値',
    '生存時間', 'カプランマイヤー', 'ハザード比', 'ログランク',
    'NNT', 'ARR', 'オッズ比', '相対リスク',
  ],
  'pathology-clinical-research': [
    '臨床研究', '観察研究', '介入研究', 'コホート', '症例対照',
    '横断研究', 'クロスオーバー', '非劣性試験', '同等性試験',
    'ITT', 'PP', '感度', '特異度', 'ROC',
  ],
  'pathology-drug-comparison': [
    '医薬品比較', '薬物経済学', '費用対効果', 'QALY', 'ICER',
  ],
  'pathology-patient-info': [
    '患者情報', '薬歴', '問診', 'アドヒアランス', 'コンプライアンス',
    'ポリファーマシー', '残薬',
  ],
  'pathology-individualized': [
    '個別化', '遺伝的素因', 'CYP', '遺伝子多型', 'SNP',
    '小児', '高齢者', '妊婦', '授乳婦', '腎機能低下', '肝機能低下',
    '透析患者', 'TDM', '用量調節',
  ],
}

/**
 * 物理科目の追加キーワード
 */
const PHYSICS_KEYWORDS: Record<string, string[]> = {
  'physics-material-structure': [
    '化学結合', '共有結合', 'イオン結合', '水素結合', 'ファンデルワールス',
    '電子配置', '分子軌道', '混成軌道', '原子', '分子',
    '放射線', '放射能', '半減期', '壊変', 'α線', 'β線', 'γ線',
    '核種', '同位体', '放射性',
  ],
  'physics-energy-equilibrium': [
    '熱力学', 'エンタルピー', 'エントロピー', 'ギブズ',
    '化学平衡', '平衡定数', 'ルシャトリエ', '相図', '相転移',
    '蒸気圧', '沸点', '凝固点', '浸透圧', 'コロイド',
    '溶解度', '溶液', '希薄溶液', '束一的性質',
    '電気化学', '電極電位', 'ネルンスト', '電池', '電気分解',
    'ダニエル電池', '標準電極電位', '起電力',
  ],
  'physics-material-change': [
    '反応速度', '速度定数', '活性化エネルギー', 'アレニウス',
    '反応次数', '半減期', '触媒',
  ],
  'physics-analysis-basics': [
    '分析化学', '精度', '正確さ', '有効数字', '検出限界',
    '定量限界', '標準液', '検量線',
  ],
  'physics-solution-equilibrium': [
    '酸塩基', 'pH', 'pKa', '緩衝液', '緩衝能',
    'Henderson-Hasselbalch', '解離定数', '電離定数',
    '溶解度積', '錯形成', 'EDTA', 'キレート',
    '酸化還元', '電位差滴定',
  ],
  'physics-qualitative-quantitative': [
    '定性分析', '定量分析', '容量分析', '重量分析',
    '中和滴定', '酸化還元滴定', 'キレート滴定', '沈殿滴定',
    '滴定', '当量点', '終点',
  ],
  'physics-instrumental-analysis': [
    'UV', '紫外', '可視', '吸光度', 'ランベルトベール',
    '蛍光', '原子吸光', 'ICP', '発光分析',
    'NMR', '核磁気共鳴', 'ケミカルシフト', 'スピン結合',
    '質量分析', 'MS', 'm/z', 'フラグメンテーション',
    'X線', '粉末X線', '結晶', '回折',
    '赤外', 'IR', '熱分析', 'DSC', 'TG', 'DTA',
  ],
  'physics-separation-analysis': [
    'クロマトグラフィー', 'HPLC', 'GC', 'TLC',
    'カラムクロマトグラフィー', 'イオン交換', 'ゲルろ過',
    '電気泳動', 'SDS-PAGE', '等電点電気泳動',
    'ウエスタンブロット', 'キャピラリー電気泳動',
  ],
  'physics-clinical-analysis': [
    '臨床分析', '血液ガス', '電解質', 'イムノアッセイ',
    'ELISA', 'ラテックス凝集', 'イムノクロマト',
    'ドライケミストリー', 'POCT', '血糖測定',
  ],
}

/**
 * 化学科目の追加キーワード
 */
const CHEMISTRY_KEYWORDS: Record<string, string[]> = {
  'chemistry-basic-properties': [
    '命名法', 'IUPAC', '異性体', '立体化学', '光学異性体',
    'エナンチオマー', 'ジアステレオマー', 'キラル', '不斉',
    'R,S表記', 'E,Z表記', 'シス', 'トランス',
    '配座', 'ニューマン投影式', 'フィッシャー投影式',
  ],
  'chemistry-basic-skeleton': [
    'アルカン', 'アルケン', 'アルキン', '芳香族',
    'ベンゼン', 'ナフタレン', '求電子置換', '求核置換',
    '付加反応', '脱離反応', '求電子付加', 'ディールスアルダー',
    'ペリ環状反応', 'Friedel-Crafts', 'フリーデルクラフツ',
  ],
  'chemistry-functional-groups': [
    'ハロゲン化', 'SN1', 'SN2', 'E1', 'E2',
    'アルコール', 'フェノール', 'エーテル',
    'アルデヒド', 'ケトン', 'カルボン酸', 'エステル', 'アミド',
    'アミン', '求核付加', 'アルドール', 'クライゼン',
    'グリニャール', 'Wittig', '酸化', '還元',
    '電子供与', '電子吸引', '共鳴', '誘起効果',
  ],
  'chemistry-structure-determination': [
    '構造決定', 'NMR', 'IR', 'MS', 'スペクトル',
    '1H-NMR', '13C-NMR', 'DEPT', 'COSY', 'HMQC',
    '赤外吸収', '吸収帯', '指紋領域',
    '質量分析', 'm/z', '分子イオンピーク',
  ],
  'chemistry-inorganic-complex': [
    '無機化合物', '錯体', '配位結合', '配位数',
    '結晶場理論', 'd軌道', '遷移金属',
  ],
  'chemistry-drug-target-molecules': [
    'タンパク質', 'アミノ酸', 'ペプチド結合', '一次構造', '二次構造',
    'αヘリックス', 'βシート', '四次構造',
    '核酸', 'DNA', 'RNA', 'ヌクレオチド', '塩基対',
    '糖', '単糖', '二糖', '多糖', 'グリコシド結合',
    '脂質', 'リン脂質', 'ステロイド', 'コレステロール',
    'ATP', 'NAD', 'FAD', '補酵素',
  ],
  'chemistry-bioreaction': [
    'リン酸化', '脱リン酸化', 'チオール', 'ジスルフィド',
    '酵素阻害', '可逆的阻害', '不可逆的阻害', '遷移状態',
    'ミカエリスメンテン', 'Km', 'Vmax',
    '受容体', 'アゴニスト', 'アンタゴニスト',
    '生体内反応', '酸化還元', '加水分解', '転移反応',
  ],
  'chemistry-drug-structure': [
    '医薬品', '構造', '構造活性相関', 'プロドラッグ',
    'バイオアイソスター', 'ファーマコフォア',
    'ドラッグデザイン', 'ドッキング', 'QSAR',
  ],
  'chemistry-medicinal-plants': [
    '生薬', '薬用植物', '基原', '和漢薬',
    '日本薬局方', '生薬総則', '確認試験',
    'アルカロイド', 'テルペノイド', 'フラボノイド',
  ],
  'chemistry-natural-products': [
    '天然物', '二次代謝産物', 'ポリケタイド',
    '抗生物質', 'ペニシリン', 'エリスロマイシン',
    'タキソール', 'ビンクリスチン', 'カンプトテシン',
    '微生物', '発酵', '生合成',
  ],
}

/**
 * 生物科目の追加キーワード
 */
const BIOLOGY_KEYWORDS: Record<string, string[]> = {
  'biology-cell-structure': [
    '細胞', '細胞膜', '核', 'ミトコンドリア', '小胞体', 'ゴルジ体',
    'リソソーム', '細胞骨格', '微小管', 'アクチン',
  ],
  'biology-biomolecules': [
    'アミノ酸', 'タンパク質', '糖質', '脂質', '核酸',
    'ビタミン', 'ミネラル', '微量元素', '補酵素',
  ],
  'biology-proteins': [
    '酵素', '酵素反応', 'ミカエリスメンテン', '阻害', 'アロステリック',
    'タンパク質', 'フォールディング', 'シャペロン', '翻訳後修飾',
    'プロテアーゼ', 'キナーゼ', 'ホスファターゼ',
  ],
  'biology-genes': [
    'DNA', 'RNA', '複製', '転写', '翻訳', 'mRNA', 'tRNA', 'rRNA',
    '遺伝子', 'プロモーター', 'エンハンサー', 'スプライシング',
    'PCR', 'クローニング', 'ベクター', 'プラスミド',
    '制限酵素', 'ゲル電気泳動', 'サザンブロット', 'ノーザンブロット',
    'シークエンス', 'マイクロアレイ', 'CRISPR',
    '遺伝子組換え', 'トランスフェクション', 'ノックアウト',
  ],
  'biology-metabolism': [
    '解糖', 'TCA回路', 'クエン酸回路', '電子伝達系', '酸化的リン酸化',
    'ATP', 'NADH', 'FADH2', 'ペントースリン酸回路',
    '脂肪酸合成', 'β酸化', 'ケトン体', 'コレステロール合成',
    '糖新生', 'グリコーゲン', 'インスリン', 'グルカゴン',
    '尿素回路', 'アミノ酸代謝', 'ヘム合成', 'ビリルビン',
  ],
  'biology-signal-transduction': [
    '情報伝達', 'シグナル伝達', 'Gタンパク質', 'cAMP', 'cGMP',
    'IP3', 'DAG', 'カルシウムシグナリング', 'PKC', 'PKA',
    'MAPK', 'JAK-STAT', 'NFκB', 'Wnt',
    'ホルモン', 'サイトカイン', '増殖因子', '受容体',
  ],
  'biology-cell-division': [
    '細胞周期', '有糸分裂', '減数分裂', 'アポトーシス', 'ネクローシス',
    'CDK', 'サイクリン', 'p53', 'Rb', 'がん遺伝子', 'がん抑制遺伝子',
    'テロメア', '老化',
  ],
  'biology-human-body': [
    '器官', '組織', '心臓', '肺', '肝臓', '腎臓', '脳',
    '消化管', '血管', '筋肉', '骨', '皮膚',
    '発生', '分化', '幹細胞',
  ],
  'biology-regulation': [
    '神経伝達', 'シナプス', '活動電位', '興奮',
    'ホルモン', 'インスリン', 'グルカゴン', '甲状腺ホルモン',
    '副腎皮質ホルモン', 'エストロゲン', 'テストステロン',
    '恒常性', 'フィードバック', '体温調節', '浸透圧調節',
    '血圧調節', 'レニン・アンジオテンシン', '抗利尿ホルモン',
  ],
  'biology-immune-defense': [
    '免疫', '自然免疫', '獲得免疫', 'T細胞', 'B細胞', 'NK細胞',
    'マクロファージ', '好中球', '樹状細胞',
    '抗体', '免疫グロブリン', 'IgG', 'IgM', 'IgA', 'IgE',
    '補体', 'MHC', 'HLA', '抗原提示',
  ],
  'biology-immune-control': [
    '免疫寛容', '自己免疫', 'アレルギー', 'I型', 'IV型',
    '移植免疫', '拒絶反応', '免疫抑制',
    'ワクチン', '抗血清', 'モノクローナル抗体',
    'フローサイトメトリー', 'ELISA',
  ],
  'biology-microbiology-basics': [
    '細菌', 'グラム陽性', 'グラム陰性', '芽胞', '鞭毛',
    'ウイルス', 'DNA ウイルス', 'RNAウイルス', 'レトロウイルス',
    '真菌', '原虫', '蠕虫', 'マラリア',
    '消毒', '滅菌', 'オートクレーブ', '紫外線殺菌',
  ],
  'biology-pathogenic-microorganisms': [
    '感染', '病原性', '毒素', 'エンドトキシン', 'エキソトキシン',
    '日和見感染', '院内感染', 'バイオフィルム',
    '黄色ブドウ球菌', '大腸菌', '結核菌', '緑膿菌',
    'HIV', 'インフルエンザウイルス', 'ヘルペスウイルス', 'HBV', 'HCV',
  ],
}

/**
 * 薬剤科目の追加キーワード
 */
const PHARMACEUTICS_KEYWORDS: Record<string, string[]> = {
  'pharmaceutics-pharmacokinetics': [
    '吸収', '分布', '代謝', '排泄', 'ADME',
    '生体膜', '受動拡散', '能動輸送', 'トランスポーター',
    'P-糖タンパク質', 'P-gp', 'OATP', 'OAT', 'OCT',
    'CYP', '薬物代謝', 'グルクロン酸抱合', '硫酸抱合',
    '初回通過効果', 'バイオアベイラビリティ', '生物学的利用率',
    '血漿タンパク結合', 'アルブミン', '分布容積',
    '腎排泄', '胆汁排泄', '糸球体ろ過', '尿細管分泌', '尿細管再吸収',
    '腸肝循環',
  ],
  'pharmaceutics-pk-analysis': [
    '薬物動態', 'コンパートメントモデル', 'クリアランス', '半減期',
    'AUC', 'Cmax', 'Tmax', '定常状態', '蓄積係数',
    'TDM', '治療薬物モニタリング', '投与設計',
    'トラフ値', 'ピーク値', '有効血中濃度',
    'ミカエリスメンテン', '非線形薬物動態',
    '線形薬物動態', '消失速度定数', '吸収速度定数',
  ],
  'pharmaceutics-formulation-properties': [
    '粉体', '粒子径', '比表面積', '流動性', '充填性',
    '結晶', '非晶質', '多形', '水和物',
    '乳剤', '懸濁剤', 'コロイド', '界面活性剤', 'HLB',
    '溶解度', '溶解速度', 'Noyes-Whitney',
    '粘度', 'レオロジー', 'ニュートン流体',
  ],
  'pharmaceutics-formulation-design': [
    '製剤', '錠剤', 'カプセル', '散剤', '顆粒剤',
    '注射剤', '坐剤', '軟膏', '点眼剤', '吸入剤',
    '添加剤', '賦形剤', '結合剤', '崩壊剤', '滑沢剤', 'コーティング',
    '崩壊試験', '溶出試験', '含量均一性', '質量偏差',
    '日本薬局方', '製剤試験法',
    '生物学的同等性', 'BE試験',
  ],
  'pharmaceutics-dds': [
    'DDS', 'ドラッグデリバリー', '徐放', '放出制御',
    'リポソーム', 'ナノ粒子', 'ミセル', 'PEG修飾',
    'プロドラッグ', '標的指向化', 'ターゲティング',
    'EPR効果', '能動的ターゲティング', '受動的ターゲティング',
    '経皮吸収', 'パッチ', 'マイクロニードル',
    '浸透圧ポンプ', 'マトリックス', 'リザーバー',
  ],
}

// 全追加キーワードをまとめる
const EXTRA_KEYWORDS: Record<string, Record<string, string[]>> = {
  '実務': PRACTICE_KEYWORDS,
  '衛生': HYGIENE_KEYWORDS,
  '薬理': PHARMACOLOGY_KEYWORDS,
  '法規・制度・倫理': LAW_KEYWORDS,
  '病態・薬物治療': PATHOLOGY_KEYWORDS,
  '物理': PHYSICS_KEYWORDS,
  '化学': CHEMISTRY_KEYWORDS,
  '生物': BIOLOGY_KEYWORDS,
  '薬剤': PHARMACEUTICS_KEYWORDS,
}

/**
 * 問題を中項目にマッピング
 */
function scoreQuestionForTopic(
  question: Question,
  entries: KeywordEntry[],
  extraKeywords: Record<string, string[]> | undefined
): Map<string, number> {
  const scores = new Map<string, number>()

  // テキストを連結して検索対象にする
  const questionText = question.question_text || ''
  const explanation = question.explanation || ''
  const choicesText = (question.choices || []).map((c) => c.text).join(' ')

  // 検索対象テキスト（全体）
  const fullText = `${questionText} ${choicesText} ${explanation}`

  // ブループリントのキーワードでスコアリング
  for (const entry of entries) {
    if (fullText.includes(entry.keyword)) {
      const current = scores.get(entry.topicId) || 0
      scores.set(entry.topicId, current + entry.weight)
    }
  }

  // 追加キーワードでスコアリング
  if (extraKeywords) {
    for (const [topicId, keywords] of Object.entries(extraKeywords)) {
      for (const keyword of keywords) {
        if (fullText.includes(keyword)) {
          const current = scores.get(topicId) || 0
          scores.set(topicId, current + 6) // 追加キーワードは中程度のウエイト
        }
      }
    }
  }

  return scores
}

/**
 * 科目ごとのデフォルト（最も一般的な）中項目を取得
 */
function getDefaultTopicForSubject(
  subject: string,
  blueprint: SubjectBlueprint[]
): string {
  const subjectBp = blueprint.find((b) => b.subject === subject)
  if (subjectBp && subjectBp.majorCategories.length > 0) {
    const firstMajor = subjectBp.majorCategories[0]
    if (firstMajor.middleCategories.length > 0) {
      return firstMajor.middleCategories[0].id
    }
  }
  return 'unknown'
}

// --- メイン処理 ---
async function main() {
  console.log('=== 問題→中項目マッピングスクリプト ===\n')

  // 1. データ読み込み
  console.log('データ読み込み中...')
  const blueprint = await loadBlueprint()
  const allQuestions = await loadAllQuestions()
  console.log(`  ブループリント: ${blueprint.length} 科目`)
  console.log(`  問題数: ${allQuestions.length} 問\n`)

  // 科目一覧を表示
  for (const bp of blueprint) {
    const topicCount = bp.majorCategories.reduce(
      (sum, m) => sum + m.middleCategories.length,
      0
    )
    console.log(`  ${bp.subject}: ${topicCount} 中項目`)
  }
  console.log()

  // 2. キーワードインデックス構築
  console.log('キーワードインデックス構築中...')
  const keywordIndex = buildKeywordIndex(blueprint)
  for (const [subject, entries] of keywordIndex) {
    console.log(`  ${subject}: ${entries.length} エントリ`)
  }
  console.log()

  // 3. マッピング実行
  console.log('マッピング実行中...')
  const mapping: Record<string, string> = {}
  const stats = {
    total: 0,
    mapped: 0,
    unknown: 0,
    bySubject: new Map<string, { total: number; mapped: number }>(),
    byTopic: new Map<string, number>(),
  }

  for (const question of allQuestions) {
    stats.total++

    // 科目に対応するブループリントのキーワードエントリ取得
    const entries = keywordIndex.get(question.subject) || []
    const extraKw = EXTRA_KEYWORDS[question.subject]

    // スコアリング
    const scores = scoreQuestionForTopic(question, entries, extraKw)

    // 最高スコアのトピックを選択
    let bestTopic = 'unknown'
    let bestScore = 0

    for (const [topicId, score] of scores) {
      if (score > bestScore) {
        bestScore = score
        bestTopic = topicId
      }
    }

    // スコアが低すぎる場合はデフォルトに
    if (bestScore < 5) {
      bestTopic = getDefaultTopicForSubject(question.subject, blueprint)
    }

    mapping[question.id] = bestTopic

    // 統計更新
    if (bestTopic !== 'unknown') {
      stats.mapped++
    } else {
      stats.unknown++
    }

    const subjStats = stats.bySubject.get(question.subject) || {
      total: 0,
      mapped: 0,
    }
    subjStats.total++
    if (bestTopic !== 'unknown') subjStats.mapped++
    stats.bySubject.set(question.subject, subjStats)

    const topicCount = stats.byTopic.get(bestTopic) || 0
    stats.byTopic.set(bestTopic, topicCount + 1)
  }

  // 4. 統計表示
  console.log('\n=== マッピング結果 ===')
  console.log(`全体: ${stats.mapped}/${stats.total} マッピング済み (${((stats.mapped / stats.total) * 100).toFixed(1)}%)`)
  console.log(`unknown: ${stats.unknown} 問\n`)

  console.log('科目別カバレッジ:')
  for (const [subject, s] of stats.bySubject) {
    const rate = ((s.mapped / s.total) * 100).toFixed(1)
    console.log(`  ${subject}: ${s.mapped}/${s.total} (${rate}%)`)
  }

  console.log('\nトピック別問題数 (上位20):')
  const topicCounts = [...stats.byTopic.entries()].sort((a, b) => b[1] - a[1])
  for (const [topicId, count] of topicCounts.slice(0, 20)) {
    console.log(`  ${topicId}: ${count} 問`)
  }

  // トピック別問題数が0のトピックを表示
  const allTopicIds = new Set<string>()
  for (const bp of blueprint) {
    for (const major of bp.majorCategories) {
      for (const middle of major.middleCategories) {
        allTopicIds.add(middle.id)
      }
    }
  }
  const unmappedTopics = [...allTopicIds].filter((id) => !stats.byTopic.has(id))
  if (unmappedTopics.length > 0) {
    console.log(`\n問題が0のトピック (${unmappedTopics.length}個):`)
    for (const id of unmappedTopics) {
      console.log(`  ${id}`)
    }
  }

  // 5. ファイル出力
  console.log('\nファイル出力中...')
  const outputPath = path.resolve(
    __dirname,
    '../src/data/question-topic-map.ts'
  )

  // マッピングデータをソートして出力
  const sortedEntries = Object.entries(mapping).sort((a, b) =>
    a[0].localeCompare(b[0])
  )

  let output = `// 問題ID → 中項目ID マッピングデータ\n`
  output += `// 自動生成: scripts/map-questions-to-topics.ts\n`
  output += `// 生成日: ${new Date().toISOString().slice(0, 10)}\n`
  output += `// 全${stats.total}問中 ${stats.mapped}問マッピング済み (${((stats.mapped / stats.total) * 100).toFixed(1)}%)\n\n`
  output += `import type { TopicId } from '../types/blueprint'\n\n`
  output += `export const QUESTION_TOPIC_MAP: Record<string, TopicId> = {\n`

  for (const [id, topicId] of sortedEntries) {
    output += `  "${id}": "${topicId}",\n`
  }

  output += `}\n`

  fs.writeFileSync(outputPath, output, 'utf-8')
  console.log(`  ${outputPath} に出力しました`)
  console.log(`\n完了!`)
}

main().catch(console.error)
