// src/data/flashcard-templates.ts
// サンプル暗記カードテンプレート（Phase 1: 手動作成10枚）
// 本格データは scripts/generate-flashcard-templates.ts で AI バッチ生成予定
//
// primary_exemplar_id は question-exemplar-map.ts の実データと整合
// source_id は official-notes.ts の付箋ID / 問題ID と整合

import type { FlashCardTemplate } from '../types/flashcard-template'

export const FLASHCARD_TEMPLATES: FlashCardTemplate[] = [
  // ========================================
  // 付箋ベース: fusen-0001（SI基本単位）
  // r100-001→ex-physics-058, r109-001→ex-physics-006
  // ========================================
  {
    id: 'fct-001',
    source_type: 'fusen',
    source_id: 'fusen-0001',
    primary_exemplar_id: 'ex-physics-006',
    subject: '物理',
    front: 'SI基本単位7つは？',
    back: 'm（長さ）, kg（質量）, s（時間）, A（電流）, K（温度）, mol（物質量）, cd（光度）',
    format: 'term_definition',
    tags: ['SI基本単位', '物理基礎'],
  },
  {
    id: 'fct-002',
    source_type: 'fusen',
    source_id: 'fusen-0001',
    primary_exemplar_id: 'ex-physics-006',
    subject: '物理',
    front: 'SI基本単位の語呂合わせ「カドのマスク」の中身は？',
    back: 'Cd m A K s mol kg →「カドのマスク スモールキング」',
    format: 'mnemonic',
    tags: ['SI基本単位', '語呂合わせ'],
  },
  {
    id: 'fct-003',
    source_type: 'fusen',
    source_id: 'fusen-0001',
    primary_exemplar_id: 'ex-physics-006',
    subject: '物理',
    front: '光度のSI単位は？',
    back: 'cd（カンデラ）',
    format: 'question_answer',
    tags: ['SI基本単位', '光度'],
  },
  // ========================================
  // 付箋ベース: fusen-0002（物理量の単位まとめ）
  // r100-002→ex-physics-054
  // ========================================
  {
    id: 'fct-004',
    source_type: 'fusen',
    source_id: 'fusen-0002',
    primary_exemplar_id: 'ex-physics-054',
    subject: '物理',
    front: 'エネルギーのSI単位をkg, m, sで表すと？',
    back: 'J = kg・m²・s⁻²',
    format: 'term_definition',
    tags: ['単位換算', 'エネルギー'],
  },
  {
    id: 'fct-005',
    source_type: 'fusen',
    source_id: 'fusen-0002',
    primary_exemplar_id: 'ex-physics-054',
    subject: '物理',
    front: '圧力のSI単位をkg, m, sで表すと？',
    back: 'Pa = kg・m⁻¹・s⁻²',
    format: 'term_definition',
    tags: ['単位換算', '圧力'],
  },
  // ========================================
  // 付箋ベース: fusen-0003（圧力とエネルギーの定義）
  // r104-001→ex-physics-017
  // ========================================
  {
    id: 'fct-006',
    source_type: 'fusen',
    source_id: 'fusen-0003',
    primary_exemplar_id: 'ex-physics-017',
    subject: '物理',
    front: '1 Pa（パスカル）の定義は？',
    back: '1m²あたりに働く1Nの力（Pa = N/m²）',
    format: 'question_answer',
    tags: ['圧力', '定義'],
  },
  {
    id: 'fct-007',
    source_type: 'fusen',
    source_id: 'fusen-0003',
    primary_exemplar_id: 'ex-physics-017',
    subject: '物理',
    front: '1 J（ジュール）の定義は？',
    back: '1Nの力で物体を1m動かす仕事（J = N・m）',
    format: 'question_answer',
    tags: ['エネルギー', '定義'],
  },
  // ========================================
  // 問題解説ベース
  // ========================================
  {
    id: 'fct-008',
    source_type: 'explanation',
    source_id: 'r100-001',
    primary_exemplar_id: 'ex-physics-058',
    subject: '物理',
    front: 'SI基本単位でないのはどれか？ Pa, kg, mol, cd, s',
    back: 'Pa（パスカル）— 組立単位（Pa = kg・m⁻¹・s⁻²）',
    format: 'question_answer',
    tags: ['SI基本単位', '組立単位'],
  },
  {
    id: 'fct-009',
    source_type: 'explanation',
    source_id: 'r109-001',
    primary_exemplar_id: 'ex-physics-006',
    subject: '物理',
    front: '電流のSI単位は？ヒント: 7つの基本単位の1つ',
    back: 'A（アンペア）',
    format: 'question_answer',
    tags: ['SI基本単位', '電流'],
  },
  {
    id: 'fct-010',
    source_type: 'explanation',
    source_id: 'r100-002',
    primary_exemplar_id: 'ex-physics-054',
    subject: '物理',
    front: '仕事の定義から、J（ジュール）をSI基本単位で表せ',
    back: 'J = N・m = kg・m²・s⁻²',
    format: 'question_answer',
    tags: ['単位換算', '仕事'],
  },
]
