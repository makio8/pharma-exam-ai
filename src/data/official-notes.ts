// 公式付箋モックデータ（開発用）
// topicId は exam-blueprint.ts の ALL_TOPICS.id に準拠
// ⚠️ linkedQuestionIds/linkedCardIds はダミー値。実データ投入時に差し替え必須
//    （問題IDの科目とノートの科目が一致していない場合がある）

import type { OfficialNote } from '../types/official-note'

export const OFFICIAL_NOTES: OfficialNote[] = [
  // --- 薬理 ---
  {
    id: 'on-001',
    title: '交感神経 α1受容体の作用機序',
    imageUrl: '/notes/pharmacology-alpha1-receptor.png',
    textSummary:
      'α1受容体はGqタンパク質共役型。活性化するとPLC→IP3→Ca²⁺放出。血管収縮・散瞳・膀胱括約筋収縮を引き起こす。アドレナリン・ノルアドレナリンが作動薬。フェニレフリンは選択的α1作動薬。',
    subject: '薬理',
    topicId: 'pharmacology-autonomic-nervous',
    tags: ['受容体', '自律神経', '交感神経', 'α受容体'],
    linkedQuestionIds: ['r111-021', 'r111-022', 'r110-018', 'r109-025'],
    linkedCardIds: ['card-alpha1-001', 'card-alpha1-002'],
    importance: 4,
    tier: 'free',
  },
  {
    id: 'on-002',
    title: 'β遮断薬の薬効・副作用まとめ',
    imageUrl: '/notes/pharmacology-beta-blocker.png',
    textSummary:
      'β1遮断→心拍数低下・心収縮力低下・降圧。β2遮断→気管支収縮（喘息禁忌）・末梢血管収縮。プロプラノロールは非選択的。アテノロール・メトプロロールはβ1選択的。',
    subject: '薬理',
    topicId: 'pharmacology-cardiovascular',
    tags: ['β遮断薬', '循環器', '副作用', '禁忌'],
    linkedQuestionIds: ['r111-035', 'r110-031', 'r109-030', 'r108-033'],
    linkedCardIds: ['card-beta-blocker-001'],
    importance: 5,
    tier: 'free',
  },
  {
    id: 'on-003',
    title: 'NSAIDsの作用機序と副作用',
    imageUrl: '/notes/pharmacology-nsaids.png',
    textSummary:
      'COX-1・COX-2阻害によりPGE2・TXA2産生抑制。解熱・鎮痛・抗炎症作用。COX-1阻害による胃粘膜障害・血小板凝集抑制（出血傾向）・腎機能低下に注意。',
    subject: '薬理',
    topicId: 'pharmacology-immune-bone',
    tags: ['NSAIDs', 'COX阻害', '抗炎症', '副作用'],
    linkedQuestionIds: ['r111-042', 'r111-043', 'r110-040', 'r108-045'],
    linkedCardIds: ['card-nsaids-001', 'card-nsaids-002'],
    importance: 5,
    tier: 'free',
  },
  // --- 化学 ---
  {
    id: 'on-004',
    title: '有機ハロゲン化合物の置換反応（SN1・SN2）',
    imageUrl: '/notes/chemistry-sn-reaction.png',
    textSummary:
      'SN2は背面攻撃で立体反転（Walden転換）。第一級ハロゲン化アルキルに有利。SN1は平面カルボカチオン中間体経由でラセミ化。第三級ハロゲン化アルキルに有利。',
    subject: '化学',
    topicId: 'chemistry-functional-groups',
    tags: ['置換反応', 'SN1', 'SN2', '立体化学'],
    linkedQuestionIds: ['r111-061', 'r110-058', 'r109-055', 'r108-060'],
    linkedCardIds: ['card-sn-reaction-001'],
    importance: 4,
    tier: 'free',
  },
  {
    id: 'on-005',
    title: '受容体アゴニスト・アンタゴニストの構造活性相関',
    imageUrl: '/notes/chemistry-sar-receptor.png',
    textSummary:
      '受容体との結合に必要な薬効団（ファーマコフォア）を理解する。立体選択性・疎水性相互作用・水素結合・イオン結合が重要。アドレナリン類似体のアゴニスト活性と構造の関係。',
    subject: '化学',
    topicId: 'chemistry-bioreaction',
    tags: ['構造活性相関', 'ファーマコフォア', '受容体', 'アゴニスト'],
    linkedQuestionIds: ['r111-075', 'r110-072', 'r109-070'],
    linkedCardIds: ['card-sar-001'],
    importance: 3,
    tier: 'premium',
  },
  // --- 生物 ---
  {
    id: 'on-006',
    title: '細胞内情報伝達：cAMP経路のまとめ',
    imageUrl: '/notes/biology-camp-pathway.png',
    textSummary:
      'β受容体→Gsタンパク質→アデニル酸シクラーゼ活性化→cAMP増加→PKA活性化。心拍数増加・血糖上昇などに関与。ホスホジエステラーゼ（PDE）がcAMPを分解。テオフィリンはPDE阻害で気管支拡張。',
    subject: '生物',
    topicId: 'biology-signal-transduction',
    tags: ['cAMP', '情報伝達', 'PKA', 'Gsタンパク質'],
    linkedQuestionIds: ['r111-085', 'r110-082', 'r109-080', 'r108-079'],
    linkedCardIds: ['card-camp-001', 'card-camp-002'],
    importance: 5,
    tier: 'free',
  },
  {
    id: 'on-007',
    title: '免疫グロブリンの構造とクラス',
    imageUrl: '/notes/biology-immunoglobulin.png',
    textSummary:
      'IgGは主要な血中抗体・胎盤通過あり。IgMは感染初期に産生・五量体。IgAは分泌型・腸管・乳汁中。IgEはアレルギー・肥満細胞と結合。IgDはB細胞表面受容体。',
    subject: '生物',
    topicId: 'biology-immune-defense',
    tags: ['免疫グロブリン', 'IgG', 'IgM', 'IgA', '抗体'],
    linkedQuestionIds: ['r111-090', 'r110-088', 'r109-085', 'r108-087'],
    linkedCardIds: ['card-ig-001'],
    importance: 4,
    tier: 'free',
  },
  // --- 衛生 ---
  {
    id: 'on-008',
    title: '農薬・重金属の毒性と標的臓器',
    imageUrl: '/notes/hygiene-toxic-chemicals.png',
    textSummary:
      '有機リン系農薬：コリンエステラーゼ阻害→コリン作動性クリーゼ。水銀（メチル水銀）：中枢神経障害（水俣病）。カドミウム：腎障害・骨軟化症（イタイイタイ病）。鉛：ポルフィリン代謝障害・貧血。',
    subject: '衛生',
    topicId: 'hygiene-chemical-radiation',
    tags: ['毒性', '重金属', '農薬', '環境汚染'],
    linkedQuestionIds: ['r111-095', 'r110-092', 'r109-089', 'r108-090'],
    linkedCardIds: ['card-toxicology-001'],
    importance: 4,
    tier: 'free',
  },
  // --- 薬理（追加）---
  {
    id: 'on-009',
    title: '抗菌薬の作用機序と主な薬剤',
    imageUrl: '/notes/pharmacology-antibiotics.png',
    textSummary:
      'β-ラクタム系（ペニシリン・セフェム・カルバペネム）：細胞壁合成阻害。アミノグリコシド系：30Sサブユニット結合・タンパク合成阻害。フルオロキノロン系：DNAジャイレース阻害。マクロライド系：50Sサブユニット結合。',
    subject: '薬理',
    topicId: 'pharmacology-antimicrobial-antitumor',
    tags: ['抗菌薬', '作用機序', 'β-ラクタム', 'キノロン'],
    linkedQuestionIds: ['r111-055', 'r110-052', 'r109-050', 'r108-053', 'r107-051'],
    linkedCardIds: ['card-antibiotics-001', 'card-antibiotics-002'],
    importance: 5,
    tier: 'free',
  },
  {
    id: 'on-010',
    title: '糖尿病治療薬の分類と作用機序',
    imageUrl: '/notes/pharmacology-diabetes-drugs.png',
    textSummary:
      'SU薬：K⁺チャネル閉鎖→インスリン分泌促進。DPP-4阻害薬：GLP-1分解阻害→血糖依存的インスリン分泌。SGLT2阻害薬：尿細管でのブドウ糖再吸収阻害→尿糖排泄促進。ビグアナイド系：肝臓での糖新生抑制。',
    subject: '薬理',
    topicId: 'pharmacology-metabolic-endocrine',
    tags: ['糖尿病', '血糖降下薬', 'DPP-4阻害薬', 'SGLT2阻害薬'],
    linkedQuestionIds: ['r111-048', 'r111-049', 'r110-045', 'r109-043', 'r108-047'],
    linkedCardIds: ['card-diabetes-drug-001', 'card-diabetes-drug-002'],
    importance: 5,
    tier: 'premium',
  },
]
