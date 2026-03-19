// 薬剤師国家試験 出題基準マスタデータ
// 出典: 厚労省「薬剤師国家試験出題基準」別表Ⅰ〜Ⅶ
// 第106回（令和2年度）から適用

import type { QuestionSubject } from '../types/question'
import type { SubjectBlueprint } from '../types/blueprint'

export const EXAM_BLUEPRINT: SubjectBlueprint[] = [
  // ============================================================
  // 別表Ⅰ 物理・化学・生物（3科目に分割）
  // ============================================================

  // --- 物理 ---
  {
    subject: '物理',
    majorCategories: [
      {
        name: '物質の物理的性質',
        middleCategories: [
          {
            id: 'physics-material-structure',
            name: '物質の構造',
            minorCategories: ['化学結合', '分子間相互作用', '原子・分子の挙動', '放射線と放射能'],
          },
          {
            id: 'physics-energy-equilibrium',
            name: '物質のエネルギーと平衡',
            minorCategories: [
              '気体の微視的状態と巨視的状態',
              'エネルギー',
              '自発的な変化',
              '化学平衡の原理',
              '相平衡',
              '溶液の性質',
              '電気化学',
            ],
          },
          {
            id: 'physics-material-change',
            name: '物質の変化',
            minorCategories: ['反応速度'],
          },
        ],
      },
      {
        name: '化学物質の分析',
        middleCategories: [
          {
            id: 'physics-analysis-basics',
            name: '分析の基礎',
            minorCategories: ['分析の基本'],
          },
          {
            id: 'physics-solution-equilibrium',
            name: '溶液中の化学平衡',
            minorCategories: ['酸・塩基平衡', '各種の化学平衡'],
          },
          {
            id: 'physics-qualitative-quantitative',
            name: '化学物質の定性分析・定量分析',
            minorCategories: ['定性分析', '定量分析（容量分析・重量分析）'],
          },
          {
            id: 'physics-instrumental-analysis',
            name: '機器を用いる分析法',
            minorCategories: [
              '分光分析法',
              '核磁気共鳴（NMR）スペクトル測定法',
              '質量分析法',
              'X線分析法',
              '熱分析',
            ],
          },
          {
            id: 'physics-separation-analysis',
            name: '分離分析法',
            minorCategories: ['クロマトグラフィー', '電気泳動法'],
          },
          {
            id: 'physics-clinical-analysis',
            name: '臨床現場で用いる分析技術',
            minorCategories: ['分析の準備', '分析技術'],
          },
        ],
      },
    ],
  },

  // --- 化学 ---
  {
    subject: '化学',
    majorCategories: [
      {
        name: '化学物質の性質と反応',
        middleCategories: [
          {
            id: 'chemistry-basic-properties',
            name: '化学物質の基本的性質',
            minorCategories: ['基本事項', '有機化合物の立体構造'],
          },
          {
            id: 'chemistry-basic-skeleton',
            name: '有機化合物の基本骨格の構造と反応',
            minorCategories: ['アルカン', 'アルケン・アルキン', '芳香族化合物'],
          },
          {
            id: 'chemistry-functional-groups',
            name: '官能基の性質と反応',
            minorCategories: [
              '概説',
              '有機ハロゲン化合物',
              'アルコール・フェノール・エーテル',
              'アルデヒド・ケトン・カルボン酸・カルボン酸誘導体',
              'アミン',
              '電子効果',
              '酸性度・塩基性度',
            ],
          },
          {
            id: 'chemistry-structure-determination',
            name: '化学物質の構造決定',
            minorCategories: ['核磁気共鳴（NMR）', '赤外吸収（IR）', '質量分析'],
          },
          {
            id: 'chemistry-inorganic-complex',
            name: '無機化合物・錯体の構造と性質',
            minorCategories: ['無機化合物・錯体'],
          },
        ],
      },
      {
        name: '生体分子・医薬品の化学による理解',
        middleCategories: [
          {
            id: 'chemistry-drug-target-molecules',
            name: '医薬品の標的となる生体分子の構造と化学的な性質',
            minorCategories: ['医薬品の標的となる生体高分子の化学構造', '生体内で機能する小分子'],
          },
          {
            id: 'chemistry-bioreaction',
            name: '生体反応の化学による理解',
            minorCategories: [
              '生体内で機能するリン、硫黄化合物',
              '酵素阻害薬と作用様式',
              '受容体のアゴニスト及びアンタゴニスト',
              '生体内で起こる有機反応',
            ],
          },
          {
            id: 'chemistry-drug-structure',
            name: '医薬品の化学構造と性質、作用',
            minorCategories: [
              '医薬品と生体分子の相互作用',
              '医薬品の化学構造に基づく性質',
              '医薬品のコンポーネント',
              '酵素に作用する医薬品の構造と性質',
              '受容体に作用する医薬品の構造と性質',
              'DNAに作用する医薬品の構造と性質',
              'イオンチャネルに作用する医薬品の構造と性質',
            ],
          },
        ],
      },
      {
        name: '自然が生み出す薬物',
        middleCategories: [
          {
            id: 'chemistry-medicinal-plants',
            name: '薬になる動植鉱物',
            minorCategories: [
              '薬用植物',
              '生薬の基原・用途',
              '生薬の副作用',
              '生薬の同定と品質評価',
            ],
          },
          {
            id: 'chemistry-natural-products',
            name: '薬の宝庫としての天然物',
            minorCategories: [
              '生薬由来の生物活性物質の構造と作用',
              '微生物由来の生物活性物質の構造と作用',
              '天然生物活性物質の利用',
            ],
          },
        ],
      },
    ],
  },

  // --- 生物 ---
  {
    subject: '生物',
    majorCategories: [
      {
        name: '生命現象の基礎',
        middleCategories: [
          {
            id: 'biology-cell-structure',
            name: '細胞の構造と機能',
            minorCategories: ['細胞の基本'],
          },
          {
            id: 'biology-biomolecules',
            name: '生命現象を担う分子',
            minorCategories: ['生体の主要構成分子', '生体に必須な微量成分'],
          },
          {
            id: 'biology-proteins',
            name: '生命活動を担うタンパク質',
            minorCategories: ['タンパク質の基本', '酵素'],
          },
          {
            id: 'biology-genes',
            name: '生命情報を担う遺伝子',
            minorCategories: ['遺伝情報を担う分子', '複製', '転写・翻訳', '組換えDNA'],
          },
          {
            id: 'biology-metabolism',
            name: '生体エネルギーと生命活動を支える代謝系',
            minorCategories: [
              'ATPの産生と糖質代謝',
              '脂質代謝',
              '飢餓状態と飽食状態',
              'その他の代謝系',
            ],
          },
          {
            id: 'biology-signal-transduction',
            name: '細胞間コミュニケーションと細胞内情報伝達',
            minorCategories: ['細胞内情報伝達', '細胞間コミュニケーション'],
          },
          {
            id: 'biology-cell-division',
            name: '細胞の分裂と死',
            minorCategories: ['細胞増殖の基本'],
          },
          {
            id: 'biology-human-body',
            name: '人体の成り立ちと生体機能の調節',
            minorCategories: [
              '遺伝と発生',
              '器官系概論',
              '各器官の構造と機能',
            ],
          },
          {
            id: 'biology-regulation',
            name: '生体機能の調節',
            minorCategories: [
              '神経による調節機構',
              '生理活性物質による調節機構',
              '恒常性の調節機構',
            ],
          },
        ],
      },
      {
        name: '生体防御と微生物',
        middleCategories: [
          {
            id: 'biology-immune-defense',
            name: '身体をまもる',
            minorCategories: [
              '生体防御反応',
              '免疫を担当する組織・細胞',
              '分子レベルで見た免疫のしくみ',
            ],
          },
          {
            id: 'biology-immune-control',
            name: '免疫系の制御とその破綻・免疫系の応用',
            minorCategories: ['免疫応答の制御と破綻', '免疫反応の利用'],
          },
          {
            id: 'biology-microbiology-basics',
            name: '微生物の基本',
            minorCategories: ['細菌', 'ウイルス', '真菌・原虫・蠕虫', '消毒と滅菌'],
          },
          {
            id: 'biology-pathogenic-microorganisms',
            name: '病原体としての微生物',
            minorCategories: ['感染の成立と共生', '代表的な病原体'],
          },
        ],
      },
    ],
  },

  // ============================================================
  // 別表Ⅱ 衛生
  // ============================================================
  {
    subject: '衛生',
    majorCategories: [
      {
        name: '健康',
        middleCategories: [
          {
            id: 'hygiene-society-health',
            name: '社会・集団と健康',
            minorCategories: ['健康と疾病の概念', '保健統計', '疫学'],
          },
          {
            id: 'hygiene-disease-prevention',
            name: '疾病の予防',
            minorCategories: [
              '疾病の予防とは',
              '感染症とその予防',
              '生活習慣病とその予防',
              '母子保健',
              '労働衛生',
            ],
          },
          {
            id: 'hygiene-nutrition',
            name: '栄養と健康',
            minorCategories: ['栄養', '食品機能と食品衛生', '食中毒と食品汚染'],
          },
        ],
      },
      {
        name: '環境',
        middleCategories: [
          {
            id: 'hygiene-chemical-radiation',
            name: '化学物質・放射線の生体への影響',
            minorCategories: [
              '化学物質の毒性',
              '化学物質の安全性評価と適正使用',
              '化学物質による発がん',
              '放射線の生体への影響',
            ],
          },
          {
            id: 'hygiene-living-environment',
            name: '生活環境と健康',
            minorCategories: [
              '地球環境と生態系',
              '環境保全と法的規制',
              '水環境',
              '大気環境',
              '室内環境',
              '廃棄物',
            ],
          },
        ],
      },
    ],
  },

  // ============================================================
  // 別表Ⅲ 薬理
  // ============================================================
  {
    subject: '薬理',
    majorCategories: [
      {
        name: '薬の作用と体の変化',
        middleCategories: [
          {
            id: 'pharmacology-drug-mechanism',
            name: '薬の作用機序',
            minorCategories: [
              '用量と作用',
              '薬物の標的分子',
              '受容体',
              '受容体と情報伝達系',
              '薬効に影響を及ぼす要因',
              '薬物相互作用',
              '薬理学実験',
            ],
          },
          {
            id: 'pharmacology-drug-safety',
            name: '医薬品の安全性',
            minorCategories: ['薬物依存性・耐性', '副作用と毒性', '副作用と有害事象'],
          },
        ],
      },
      {
        name: '薬の効き方',
        middleCategories: [
          {
            id: 'pharmacology-autonomic-nervous',
            name: '神経系に作用する薬',
            minorCategories: [
              '自律神経系に作用する薬',
              '体性神経系に作用する薬・運動神経系及び骨格筋に作用する薬',
              '中枢神経系に作用する薬',
            ],
          },
          {
            id: 'pharmacology-immune-bone',
            name: '免疫・炎症・アレルギー及び骨・関節に作用する薬',
            minorCategories: [
              '抗炎症薬',
              '免疫・アレルギーに作用する薬',
              '骨・カルシウム代謝に作用する薬',
            ],
          },
          {
            id: 'pharmacology-cardiovascular',
            name: '循環器系・血液系・造血器系・泌尿器系・生殖器系に作用する薬',
            minorCategories: [
              '循環器系に作用する薬',
              '血液・造血器系に作用する薬',
              '泌尿器系・生殖器系に作用する薬',
            ],
          },
          {
            id: 'pharmacology-respiratory-digestive',
            name: '呼吸器系・消化器系に作用する薬',
            minorCategories: ['呼吸器系に作用する薬', '消化器系に作用する薬'],
          },
          {
            id: 'pharmacology-metabolic-endocrine',
            name: '代謝系・内分泌系に作用する薬',
            minorCategories: ['代謝系に作用する薬', '内分泌系に作用する薬'],
          },
          {
            id: 'pharmacology-sensory-skin',
            name: '感覚器系・皮膚に作用する薬',
            minorCategories: ['感覚器系に作用する薬', '皮膚に作用する薬'],
          },
          {
            id: 'pharmacology-antimicrobial-antitumor',
            name: '病原微生物（感染症）・悪性新生物（がん）に作用する薬',
            minorCategories: [
              '抗菌薬',
              '抗真菌薬',
              '抗ウイルス薬',
              '原虫・寄生虫感染症治療薬',
              '抗悪性腫瘍薬',
            ],
          },
        ],
      },
      {
        name: '薬物の基本構造と薬効',
        middleCategories: [
          {
            id: 'pharmacology-structure-activity',
            name: '化学構造と薬効の関連性',
            minorCategories: ['代表的な薬物の基本構造と薬効の関連'],
          },
        ],
      },
    ],
  },

  // ============================================================
  // 別表Ⅳ 薬剤
  // ============================================================
  {
    subject: '薬剤',
    majorCategories: [
      {
        name: '薬の生体内運命',
        middleCategories: [
          {
            id: 'pharmaceutics-pharmacokinetics',
            name: '薬物の体内動態',
            minorCategories: ['生体膜透過', '吸収', '分布', '代謝', '排泄'],
          },
          {
            id: 'pharmaceutics-pk-analysis',
            name: '薬物動態の解析',
            minorCategories: ['薬物速度論', 'TDM（Therapeutic Drug Monitoring）と投与設計'],
          },
        ],
      },
      {
        name: '製剤化のサイエンス',
        middleCategories: [
          {
            id: 'pharmaceutics-formulation-properties',
            name: '製剤の性質',
            minorCategories: [
              '固形材料',
              '半固形・液状材料',
              '分散系材料',
              '薬物及び製剤材料の物性',
            ],
          },
          {
            id: 'pharmaceutics-formulation-design',
            name: '製剤設計',
            minorCategories: [
              '代表的な製剤（日本薬局方準拠）',
              '製剤化と製剤試験法',
              '生物学的同等性',
            ],
          },
          {
            id: 'pharmaceutics-dds',
            name: 'DDS（Drug Delivery System：薬物送達システム）',
            minorCategories: [
              'DDSの必要性',
              'コントロールドリリース（放出制御）',
              'ターゲティング（標的指向化）',
              '吸収改善',
            ],
          },
        ],
      },
    ],
  },

  // ============================================================
  // 別表Ⅴ 病態・薬物治療
  // ============================================================
  {
    subject: '病態・薬物治療',
    majorCategories: [
      {
        name: '薬の作用と体の変化',
        middleCategories: [
          {
            id: 'pathology-body-changes',
            name: '身体の病的変化を知る',
            minorCategories: ['症候', '病態・臨床検査'],
          },
          {
            id: 'pathology-drug-therapy-positioning',
            name: '薬物治療の位置づけ',
            minorCategories: ['薬物治療の位置づけ'],
          },
          {
            id: 'pathology-drug-safety',
            name: '医薬品の安全性',
            minorCategories: ['医薬品の安全性'],
          },
        ],
      },
      {
        name: '病態・薬物治療',
        middleCategories: [
          {
            id: 'pathology-nervous-system',
            name: '神経系の疾患',
            minorCategories: [
              '体性神経系・筋の疾患の病態、薬物治療',
              '中枢神経系の疾患の病態、薬物治療',
            ],
          },
          {
            id: 'pathology-immune-bone',
            name: '免疫・炎症・アレルギー及び骨・関節の疾患',
            minorCategories: [
              '炎症',
              '免疫・炎症・アレルギー疾患の病態、薬物治療',
              '骨・関節疾患の病態、薬物治療',
            ],
          },
          {
            id: 'pathology-cardiovascular',
            name: '循環器系・血液系・造血器系・泌尿器系・生殖器系の疾患',
            minorCategories: [
              '循環器系疾患の病態、薬物治療',
              '血液・造血器系疾患の病態、薬物治療',
              '泌尿器系・生殖器系疾患の病態、薬物治療',
            ],
          },
          {
            id: 'pathology-respiratory-digestive',
            name: '呼吸器系・消化器系の疾患',
            minorCategories: [
              '呼吸器系疾患の病態、薬物治療',
              '消化器系疾患の病態、薬物治療',
            ],
          },
          {
            id: 'pathology-metabolic-endocrine',
            name: '代謝系・内分泌系の疾患',
            minorCategories: [
              '代謝系疾患の病態、薬物治療',
              '内分泌系疾患の病態、薬物治療',
            ],
          },
          {
            id: 'pathology-sensory-skin',
            name: '感覚器・皮膚の疾患',
            minorCategories: [
              '眼疾患の病態、薬物治療',
              '耳鼻咽喉疾患の病態、薬物治療',
              '皮膚疾患の病態、薬物治療',
            ],
          },
          {
            id: 'pathology-infection-cancer',
            name: '感染症・悪性新生物（がん）',
            minorCategories: [
              '細菌感染症の病態、薬物治療',
              'ウイルス感染症の病態、薬物治療',
              '真菌感染症の病態、薬物治療',
              '原虫・寄生虫感染症の病態、薬物治療',
              '悪性腫瘍',
              '悪性腫瘍の病態、疾患',
              'がん終末期医療と緩和ケア',
            ],
          },
        ],
      },
      {
        name: '医療の中の漢方薬',
        middleCategories: [
          {
            id: 'pathology-kampo',
            name: '漢方薬',
            minorCategories: ['漢方薬の基礎', '漢方薬の応用', '漢方薬の注意点'],
          },
        ],
      },
      {
        name: 'バイオ・細胞医薬品とゲノム情報',
        middleCategories: [
          {
            id: 'pathology-bio-genome',
            name: 'バイオ・細胞医薬品とゲノム情報',
            minorCategories: [
              '組換え体医薬品',
              '遺伝子治療',
              '細胞、組織を利用した移植医療',
            ],
          },
        ],
      },
      {
        name: '薬物治療に役立つ情報',
        middleCategories: [
          {
            id: 'pathology-drug-info',
            name: '医薬品情報',
            minorCategories: ['情報', '情報源', '収集・評価・加工・提供・管理'],
          },
          {
            id: 'pathology-ebm',
            name: 'EBM（Evidence-based Medicine）',
            minorCategories: ['EBMの基本概念と実践'],
          },
          {
            id: 'pathology-biostatistics',
            name: '生物統計',
            minorCategories: ['統計量', '検定と推定', '回帰分析', '生存時間解析'],
          },
          {
            id: 'pathology-clinical-research',
            name: '臨床研究デザインと解析',
            minorCategories: ['臨床研究デザイン', '効果指標'],
          },
          {
            id: 'pathology-drug-comparison',
            name: '医薬品の比較・評価',
            minorCategories: ['医薬品の比較・評価'],
          },
        ],
      },
      {
        name: '患者情報',
        middleCategories: [
          {
            id: 'pathology-patient-info',
            name: '患者情報',
            minorCategories: ['情報と情報源', '収集・評価・管理'],
          },
        ],
      },
      {
        name: '個別化医療',
        middleCategories: [
          {
            id: 'pathology-individualized',
            name: '個別化医療',
            minorCategories: ['遺伝的素因', '年齢的要因', '臓器機能低下', 'その他の要因'],
          },
        ],
      },
    ],
  },

  // ============================================================
  // 別表Ⅵ 法規・制度・倫理
  // ============================================================
  {
    subject: '法規・制度・倫理',
    majorCategories: [
      {
        name: 'プロフェッショナリズム',
        middleCategories: [
          {
            id: 'law-pharmacist-mission',
            name: '薬剤師の使命',
            minorCategories: ['薬剤師の活動分野', '患者安全と薬害の防止', '薬学の歴史と未来'],
          },
          {
            id: 'law-ethics',
            name: '薬剤師に求められる倫理観',
            minorCategories: ['生命倫理', '医療倫理', '患者の権利'],
          },
          {
            id: 'law-research',
            name: '薬学研究',
            minorCategories: [
              '薬学における研究の位置づけ',
              '研究に必要な法規範と倫理',
              '研究の実践',
            ],
          },
          {
            id: 'law-trust',
            name: '信頼関係の構築',
            minorCategories: ['コミュニケーション'],
          },
          {
            id: 'law-self-development',
            name: '自己研鑽と次世代を担う人材の育成',
            minorCategories: ['学習のあり方', '薬学教育の概要', '生涯学習', '次世代を担う人材の育成'],
          },
        ],
      },
      {
        name: '薬学と社会',
        middleCategories: [
          {
            id: 'law-society',
            name: '人と社会に関わる薬剤師',
            minorCategories: ['人と社会に関わる薬剤師'],
          },
          {
            id: 'law-regulations',
            name: '薬剤師と医薬品等に係る法規範',
            minorCategories: [
              '薬剤師の社会的位置づけと責任に係る法規範',
              '医薬品等の品質、有効性及び安全性の確保に係る法規範',
              '特別な管理を要する薬物等に係る法規範',
            ],
          },
          {
            id: 'law-social-security',
            name: '社会保障制度と医療経済',
            minorCategories: ['医療、福祉、介護の制度', '医薬品と医療の経済性'],
          },
          {
            id: 'law-community-pharmacy',
            name: '地域における薬局と薬剤師',
            minorCategories: [
              '地域における薬局の役割',
              '地域における保健、医療、福祉の連携体制と薬剤師',
            ],
          },
        ],
      },
    ],
  },

  // ============================================================
  // 別表Ⅶ 実務
  // ============================================================
  {
    subject: '実務',
    majorCategories: [
      {
        name: '薬学臨床基本事項',
        middleCategories: [
          {
            id: 'practice-medical-professional',
            name: '医療人としての基本',
            minorCategories: ['医療人として'],
          },
          {
            id: 'practice-pharmacy-basics',
            name: '薬剤師業務の基礎',
            minorCategories: ['臨床業務の基礎'],
          },
        ],
      },
      {
        name: '薬学臨床実践',
        middleCategories: [
          {
            id: 'practice-dispensing',
            name: '処方箋に基づく調剤',
            minorCategories: [
              '処方箋と疑義照会',
              '処方箋に基づく医薬品の調製',
              '服薬指導',
              '医薬品の供給と管理',
              '安全管理',
            ],
          },
        ],
      },
      {
        name: '薬物療法の実践',
        middleCategories: [
          {
            id: 'practice-drug-therapy',
            name: '薬物療法の実践',
            minorCategories: [
              '患者情報の把握',
              '医薬品情報の収集と活用',
              '処方設計と薬物療法の実践（処方設計と提案）',
              '処方設計と薬物療法の実践（薬物療法における効果と副作用の評価）',
            ],
          },
        ],
      },
      {
        name: 'チーム医療への参画',
        middleCategories: [
          {
            id: 'practice-team-medicine',
            name: 'チーム医療への参画',
            minorCategories: [
              '多職種連携協働とチーム医療',
              '医療機関におけるチーム医療',
              '地域におけるチーム医療',
            ],
          },
        ],
      },
      {
        name: '地域の保健・医療・福祉への参画',
        middleCategories: [
          {
            id: 'practice-community-health',
            name: '地域の保健・医療・福祉への参画',
            minorCategories: [
              '在宅（訪問）医療・介護への参画',
              '地域保健への参画',
              'プライマリケア・セルフメディケーション',
              '災害時医療と薬剤師',
            ],
          },
        ],
      },
    ],
  },
]

// ヘルパー: 全トピック（中項目）のフラットリスト（検索・マッピング用）
export const ALL_TOPICS: {
  id: string
  subject: QuestionSubject
  major: string
  middle: string
}[] = EXAM_BLUEPRINT.flatMap((s) =>
  s.majorCategories.flatMap((maj) =>
    maj.middleCategories.map((mid) => ({
      id: mid.id,
      subject: s.subject,
      major: maj.name,
      middle: mid.name,
    }))
  )
)
