// 公式付箋データ（Phase 1 サンプル: 手書きノートからパイプライン生成）
// パイプライン: 人間アノテーション → crop → Gemini OCR → master → ここ
//
// topicId は exam-blueprint.ts の ALL_TOPICS.id に準拠
// ⚠️ linkedQuestionIds は暫定マッピング。本格運用時にトピック紐付けで自動化予定
import type { OfficialNote } from '../types/official-note'

export const OFFICIAL_NOTES: OfficialNote[] = [
  // ========================================
  // 物理 — 物質の構造（SI単位・物理量）
  // ========================================
  {
    id: 'on-001',
    title: 'SI基本単位',
    imageUrl: '/images/fusens/page-001-left/note-01.png',
    textSummary:
      'SI基本単位7つの語呂合わせ。Cd m A K s mol kg →「カドのマスク スモールキング」「マスク で CD くもる」。単位の暗記に最適。',
    subject: '物理',
    topicId: 'physics-material-structure',
    tags: ['SI基本単位', '語呂合わせ', '物理量'],
    linkedQuestionIds: ['r100-001', 'r102-001', 'r104-001', 'r109-001'],
    importance: 4,
    tier: 'free',
  },
  {
    id: 'on-002',
    title: '物理量の単位まとめ',
    imageUrl: '/images/fusens/page-001-left/note-02.png',
    textSummary:
      'エネルギー(仕事・熱) J = N・m = kg・m²・s⁻²、圧力 Pa = N・m⁻² = kg・m⁻¹・s⁻²、力 N = J・m⁻¹ = kg・m・s⁻²。SI基本単位への分解が頻出。',
    subject: '物理',
    topicId: 'physics-material-structure',
    tags: ['単位', 'エネルギー', '圧力', '力'],
    linkedQuestionIds: ['r100-001', 'r100-002', 'r105-003'],
    importance: 3,
    tier: 'free',
  },
  {
    id: 'on-003',
    title: '圧力とエネルギーの定義',
    imageUrl: '/images/fusens/page-001-left/note-03.png',
    textSummary:
      '圧力 Pa = N/m²（1m²あたりに働く1Nの力）。エネルギー J = N・m（1Nの力で物体を1m動かす仕事）。定義から単位を導出できるようにする。',
    subject: '物理',
    topicId: 'physics-material-structure',
    tags: ['圧力', 'パスカル', 'エネルギー', 'ジュール', '定義'],
    linkedQuestionIds: ['r100-002', 'r104-001'],
    importance: 3,
    tier: 'free',
  },
  {
    id: 'on-004',
    title: '力（ニュートン）を覚える',
    imageUrl: '/images/fusens/page-001-left/note-04.png',
    textSummary:
      'N = kg・m・s⁻²。ニュートンは1kgのリンゴを重さ(重力)で加速させたもの。加速度 m/s²の定義（単位時間あたりの速度変化）も図解。',
    subject: '物理',
    topicId: 'physics-material-structure',
    tags: ['ニュートン', '力', '加速度', '物理基礎'],
    linkedQuestionIds: ['r100-001', 'r102-001'],
    importance: 3,
    tier: 'free',
  },
  {
    id: 'on-005',
    title: 'SI単位換算',
    imageUrl: '/images/fusens/page-001-left/note-05.png',
    textSummary:
      '力 N = kg・m・s⁻² から圧力 Pa = kg・m⁻¹・s⁻²、エネルギー J = kg・m²・s⁻² への変換手順。基本単位に分解→組み合わせる思考プロセス。',
    subject: '物理',
    topicId: 'physics-material-structure',
    tags: ['SI単位', '単位換算', '力', '圧力', 'エネルギー'],
    linkedQuestionIds: ['r100-001', 'r104-001', 'r109-001'],
    importance: 3,
    tier: 'free',
  },
  // ========================================
  // 薬剤 — 濃度・計算
  // ========================================
  {
    id: 'on-006',
    title: '濃度単位換算',
    imageUrl: '/images/fusens/page-001-left/note-06.png',
    textSummary:
      '濃度単位の相互換算。ppm = mg/L = μg/mL。W/V% → mg/mL変換など、薬剤の計算問題で必須の換算表。',
    subject: '薬剤',
    topicId: 'physics-energy-equilibrium',
    tags: ['濃度', '単位換算', 'ppm', 'W/V%'],
    linkedQuestionIds: ['r100-091', 'r101-001'],
    importance: 4,
    tier: 'free',
  },
  {
    id: 'on-007',
    title: 'W/V%の定義',
    imageUrl: '/images/fusens/page-001-left/note-07.png',
    textSummary:
      'W/V%（重量対容量百分率）の定義と計算方法。溶液100mL中の溶質のg数。薬剤の濃度計算で頻出。',
    subject: '薬剤',
    topicId: 'physics-energy-equilibrium',
    tags: ['W/V%', '濃度', '定義'],
    linkedQuestionIds: ['r100-091', 'r100-092'],
    importance: 3,
    tier: 'free',
  },
  {
    id: 'on-008',
    title: '10^0.3 = 2',
    imageUrl: '/images/fusens/page-001-left/note-08.png',
    textSummary:
      '対数計算の暗記必須値。10^0.3 ≈ 2。pH計算・薬物動態のlog計算で頻出。log2 ≈ 0.3 も同時に覚える。',
    subject: '物理',
    topicId: 'physics-material-structure',
    tags: ['対数', '暗記', 'pH', '計算'],
    linkedQuestionIds: ['r100-002', 'r101-003'],
    importance: 4,
    tier: 'free',
  },
  // ========================================
  // 化学 — 分子間相互作用・物性
  // ========================================
  {
    id: 'on-009',
    title: '双極子の種類',
    imageUrl: '/images/fusens/page-001-right/note-01.png',
    textSummary:
      '永久双極子と誘起双極子の違い。極性分子は永久双極子を持つ。無極性分子でも分散力（ロンドン力）で誘起双極子が生じる。',
    subject: '化学',
    topicId: 'chemistry-basic-properties',
    tags: ['双極子', '分子間力', '極性'],
    linkedQuestionIds: ['r100-006', 'r104-006', 'r107-007'],
    importance: 3,
    tier: 'free',
  },
  {
    id: 'on-010',
    title: 'アルカンの沸点',
    imageUrl: '/images/fusens/page-001-right/note-02.png',
    textSummary:
      'アルカンの炭素数と沸点の関係。炭素数↑ → 分子量↑ → 分散力↑ → 沸点↑。分岐が多い異性体ほど球形に近づき分散力↓ → 沸点↓。',
    subject: '化学',
    topicId: 'chemistry-basic-properties',
    tags: ['アルカン', '沸点', '分散力', '分子間力'],
    linkedQuestionIds: ['r100-006', 'r102-009', 'r105-006'],
    importance: 3,
    tier: 'free',
  },
  {
    id: 'on-011',
    title: 'H₂OとHFの水素結合',
    imageUrl: '/images/fusens/page-001-right/note-03.png',
    textSummary:
      'H₂OとHFの水素結合の比較。HFは直線的な水素結合チェーン、H₂Oは立体的ネットワーク構造。沸点への影響の違い。',
    subject: '化学',
    topicId: 'chemistry-basic-properties',
    tags: ['水素結合', '沸点', 'H₂O', 'HF'],
    linkedQuestionIds: ['r100-009', 'r103-010'],
    importance: 3,
    tier: 'free',
  },
  {
    id: 'on-012',
    title: '沸点まとめ',
    imageUrl: '/images/fusens/page-001-right/note-04.png',
    textSummary:
      '各種分子間相互作用と沸点の関係を比較表で整理。水素結合 > 双極子相互作用 > 分散力の強さの序列。',
    subject: '化学',
    topicId: 'chemistry-basic-properties',
    tags: ['沸点', '分子間力', '比較表'],
    linkedQuestionIds: ['r100-006', 'r101-006', 'r106-006'],
    importance: 3,
    tier: 'free',
  },
  {
    id: 'on-013',
    title: 'ヨウ素の電荷移動相互作用',
    imageUrl: '/images/fusens/page-001-right/note-05.png',
    textSummary:
      '電荷移動(力)相互作用で色が変わる例。ベンゼンにヨウ素を加えると赤色を呈する。電子供与体（ベンゼン）と電子受容体（I₂）の相互作用。',
    subject: '物理',
    topicId: 'physics-material-structure',
    tags: ['電荷移動', 'ヨウ素', 'ベンゼン'],
    linkedQuestionIds: ['r104-001', 'r109-003'],
    importance: 2,
    tier: 'free',
  },
  {
    id: 'on-014',
    title: '水素結合と物性',
    imageUrl: '/images/fusens/page-001-right/note-06.png',
    textSummary:
      '水素結合が物性に与える影響のまとめ。沸点上昇・水溶性・粘度への影響。DNA二重鎖の安定化など生体での役割。',
    subject: '化学',
    topicId: 'chemistry-basic-properties',
    tags: ['水素結合', '物性', '沸点', '水溶性'],
    linkedQuestionIds: ['r100-009', 'r102-010', 'r104-007'],
    importance: 3,
    tier: 'free',
  },
  // ========================================
  // 物理・化学 — 原子・放射線
  // ========================================
  {
    id: 'on-015',
    title: '原子の構成',
    imageUrl: '/images/fusens/page-002-left/note-01.png',
    textSummary:
      '原子の基本構成。原子核（陽子+中性子）と電子殻。質量数 = 陽子数 + 中性子数。原子番号 = 陽子数 = 電子数。',
    subject: '化学',
    topicId: 'chemistry-basic-properties',
    tags: ['原子', '陽子', '中性子', '電子'],
    linkedQuestionIds: ['r100-006', 'r104-006'],
    importance: 3,
    tier: 'free',
  },
  {
    id: 'on-016',
    title: '素粒子',
    imageUrl: '/images/fusens/page-002-left/note-02.png',
    textSummary:
      '素粒子の基本分類。クォーク（u, d等）、レプトン（電子、ニュートリノ等）、ゲージボソン（光子、W/Z等）。原子核を構成するハドロン。',
    subject: '物理',
    topicId: 'physics-material-structure',
    tags: ['素粒子', 'クォーク', 'レプトン'],
    linkedQuestionIds: ['r100-001', 'r105-003'],
    importance: 2,
    tier: 'free',
  },
  {
    id: 'on-017',
    title: '壊変様式と質量数・原子番号の変化',
    imageUrl: '/images/fusens/page-002-left/note-03.png',
    textSummary:
      '壊変様式の比較表。α壊変: 質量数-4, 原子番号-2（He原子核放出）。β⁻壊変: 質量数不変, 原子番号+1。β⁺壊変: 質量数不変, 原子番号-1。EC: 質量数不変, 原子番号-1。核異性体転移: どちらも不変。',
    subject: '物理',
    topicId: 'physics-material-structure',
    tags: ['壊変', 'α壊変', 'β壊変', 'EC', '質量数', '原子番号'],
    linkedQuestionIds: ['r100-002', 'r104-096', 'r107-091', 'r108-091'],
    importance: 4,
    tier: 'free',
  },
  {
    id: 'on-018',
    title: 'β⁻線のみ放出する核種',
    imageUrl: '/images/fusens/page-002-left/note-04.png',
    textSummary:
      'β⁻線のみを放出する核種の語呂合わせ。³H, ¹⁴C, ³²P, ³⁵S, ⁹⁰Sr 等。壊変でZ+1になる（中性子→陽子+電子）。',
    subject: '物理',
    topicId: 'physics-material-structure',
    tags: ['β⁻線', '放射性核種', '語呂合わせ', '壊変'],
    linkedQuestionIds: ['r104-096', 'r107-092', 'r110-095'],
    importance: 4,
    tier: 'free',
  },
  {
    id: 'on-019',
    title: 'β⁺線を放出する核種',
    imageUrl: '/images/fusens/page-002-left/note-05.png',
    textSummary:
      'β⁺線(陽電子)を放出する核種。¹¹C, ¹³N, ¹⁵O, ¹⁸F等。PET検査で使用。壊変でZ-1になる（陽子→中性子+陽電子）。',
    subject: '物理',
    topicId: 'physics-material-structure',
    tags: ['β⁺線', 'PET', '放射性核種', '語呂合わせ'],
    linkedQuestionIds: ['r104-096', 'r109-003', 'r110-095'],
    importance: 4,
    tier: 'free',
  },
  {
    id: 'on-020',
    title: '電子捕獲とX線・オージェ',
    imageUrl: '/images/fusens/page-002-left/note-06.png',
    textSummary:
      '電子捕獲（EC）: 内殻電子を原子核が捕獲→特性X線またはオージェ電子を放出。¹²⁵I, ⁵¹Cr等が該当。',
    subject: '物理',
    topicId: 'physics-material-structure',
    tags: ['電子捕獲', 'X線', 'オージェ電子', '放射線'],
    linkedQuestionIds: ['r107-091', 'r109-001'],
    importance: 3,
    tier: 'free',
  },
  {
    id: 'on-021',
    title: '核異性体転移',
    imageUrl: '/images/fusens/page-002-left/note-07.png',
    textSummary:
      '核異性体転移（IT）: 励起状態の原子核がγ線を放出してエネルギーを放出。⁹⁹ᵐTc → ⁹⁹Tc（γ線放出）。質量数・原子番号は変化しない。',
    subject: '物理',
    topicId: 'physics-material-structure',
    tags: ['核異性体転移', 'γ線', '⁹⁹ᵐTc'],
    linkedQuestionIds: ['r107-092', 'r108-091'],
    importance: 3,
    tier: 'free',
  },
  {
    id: 'on-022',
    title: '被曝の上限線量',
    imageUrl: '/images/fusens/page-002-left/note-08.png',
    textSummary:
      '一般公衆の年間被曝限度: 1mSv。放射線防護の基本数値として暗記必須。',
    subject: '衛生',
    topicId: 'hygiene-chemical-radiation',
    tags: ['被曝', '線量限度', '1mSv', '一般公衆'],
    linkedQuestionIds: ['r100-020', 'r100-130', 'r104-126'],
    importance: 4,
    tier: 'free',
  },
  {
    id: 'on-023',
    title: '⁹⁹ᵐTcについて',
    imageUrl: '/images/fusens/page-002-left/note-09.png',
    textSummary:
      '⁹⁹ᵐTc（テクネチウム-99m）: 核医学検査で最も使用される核種。半減期6時間。γ線(140keV)放出。⁹⁹Mo→⁹⁹ᵐTcジェネレータで院内生成。',
    subject: '物理',
    topicId: 'physics-material-structure',
    tags: ['⁹⁹ᵐTc', '核医学', '半減期', 'ジェネレータ'],
    linkedQuestionIds: ['r107-091', 'r108-091', 'r109-003'],
    importance: 4,
    tier: 'free',
  },
]
