// src/data/onboarding-cards.ts
// オンボーディング固定6枚（チュートリアル専用）
// テキスト3枚 + 構造式2枚 + cloze1枚 — 全主力カードタイプを初回で体験

import type { FlashCardTemplate } from '../types/flashcard-template'

export const ONBOARDING_CARDS: FlashCardTemplate[] = [
  // ========================================
  // 1. テキストQ&A: フリップ体験
  // ========================================
  {
    id: 'onboarding-01-flip',
    source_type: 'knowledge_atom',
    source_id: '',
    primary_exemplar_id: '',
    subject: '物理',
    format: 'question_answer',
    front: '👆 タップして裏面を見てみよう！\n\nこれは暗記カードの表面です。',
    back: '🎉 裏面が見えました！\n\nこのアプリでは表面の問いに答えてから\n裏面で確認します。',
    tags: ['チュートリアル'],
  },

  // ========================================
  // 2. テキストQ&A: スワイプ体験
  // ========================================
  {
    id: 'onboarding-02-swipe',
    source_type: 'knowledge_atom',
    source_id: '',
    primary_exemplar_id: '',
    subject: '物理',
    format: 'question_answer',
    front: '覚えたら右にスワイプ →\n← まだなら左にスワイプ\n\nまず裏面を見てから試してみよう！',
    back: '✅ OK → 右にスワイプ\n🔄 もう1回 → 左にスワイプ\n\n下のボタンでもOKです！',
    tags: ['チュートリアル'],
  },

  // ========================================
  // 3. Cloze: 穴埋め体験（生物学の基本問題）
  // ========================================
  {
    id: 'onboarding-03-cloze',
    source_type: 'knowledge_atom',
    source_id: '',
    primary_exemplar_id: '',
    subject: '生物',
    format: 'cloze',
    front: 'タンパク質の{{c1::一次構造}}とは、アミノ酸の配列順序のことである。',
    back: 'タンパク質の{{c1::一次構造}}とは、アミノ酸の配列順序のことである。\n\n💡 穴埋めカード: [____]の答えを思い出してからタップ！',
    tags: ['チュートリアル'],
  },

  // ========================================
  // 4. 構造式L0b: 構造→名前（カフェインSVG）
  // ========================================
  {
    id: 'onboarding-04-structural',
    source_type: 'structure_db',
    source_id: 'struct-caffeine',
    primary_exemplar_id: '',
    subject: '化学',
    format: 'structural_image_to_name',
    media_url: '/images/structures/caffeine.svg',
    front: 'この構造式の物質名は？',
    back: 'カフェイン（Caffeine）。プリン環（キサンチン骨格）。中枢興奮作用を持つ。',
    tags: ['チュートリアル'],
  },

  // ========================================
  // 5. 構造式L0a: 名前→構造（アスコルビン酸SVG）
  // ========================================
  {
    id: 'onboarding-05-name-to-struct',
    source_type: 'structure_db',
    source_id: 'struct-ascorbic-acid',
    primary_exemplar_id: '',
    subject: '衛生',
    format: 'structural_name_to_image',
    media_url: '/images/structures/ascorbic-acid.svg',
    front: 'アスコルビン酸（ビタミンC）',
    back: 'Ascorbic acid。ラクトン環。エンジオール基が還元作用の本体。',
    tags: ['チュートリアル'],
  },

  // ========================================
  // 6. テキストQ&A: 完了メッセージ
  // ========================================
  {
    id: 'onboarding-06-done',
    source_type: 'knowledge_atom',
    source_id: '',
    primary_exemplar_id: '',
    subject: '物理',
    format: 'question_answer',
    front: '🎓 おつかれさま！\n\n暗記カードの使い方をマスターしました。',
    back: '✅ スワイプで高速復習\n✅ 穴埋めで想起練習\n✅ 構造式で視覚暗記\n\nカードタブから自由に練習しよう！',
    tags: ['チュートリアル'],
  },
]
