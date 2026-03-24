import { describe, it, expect } from 'vitest'
import { qualityRules } from '../rules/quality'
import type { Question, QuestionSection, QuestionSubject } from '../../../types/question'
import type { ValidationContext } from '../types'

// ─────────────────────────────────────────────
// テストファクトリ
// ─────────────────────────────────────────────

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'r108-001',
    year: 108,
    question_number: 1,
    section: '必須' as QuestionSection,
    subject: '薬理' as QuestionSubject,
    category: '薬物動態',
    question_text: '次の薬物のうち正しいものを1つ選べ。',
    choices: [
      { key: 1, text: '選択肢アイウエオ' },
      { key: 2, text: '選択肢カキクケコ' },
      { key: 3, text: '選択肢サシスセソ' },
      { key: 4, text: '選択肢タチツテト' },
      { key: 5, text: '選択肢ナニヌネノ' },
    ],
    correct_answer: 1,
    explanation: '解説テキストが20文字以上あることを確認します',
    tags: [],
    ...overrides,
  }
}

function makeContext(overrides: Partial<ValidationContext> = {}): ValidationContext {
  return {
    topicMap: {},
    blueprintTopicIds: new Set(),
    exemplarQuestionIds: new Set(),
    officialNotes: [],
    questionIds: new Set(),
    imageDir: '/images',
    ...overrides,
  }
}

// ─────────────────────────────────────────────
// ルール 24: question-text-length
// ─────────────────────────────────────────────

describe('ルール24: question-text-length', () => {
  it('正常系: 10〜2000文字の問題文はOK', () => {
    const issues = qualityRules([makeQuestion({ question_text: '次の薬物のうち正しいものを1つ選べ。' })], makeContext())
    expect(issues.filter(i => i.rule === 'question-text-length')).toHaveLength(0)
  })

  it('異常系: 9文字以下の問題文はwarning', () => {
    const issues = qualityRules([makeQuestion({ question_text: '短い問題。' })], makeContext())
    const found = issues.filter(i => i.rule === 'question-text-length')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('warning')
  })

  it('異常系: 2001文字以上の問題文はwarning', () => {
    const longText = 'あ'.repeat(2001)
    const issues = qualityRules([makeQuestion({ question_text: longText })], makeContext())
    const found = issues.filter(i => i.rule === 'question-text-length')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('warning')
  })

  it('境界値: ちょうど10文字はOK', () => {
    const issues = qualityRules([makeQuestion({ question_text: 'あいうえおかきくけこ' })], makeContext())
    expect(issues.filter(i => i.rule === 'question-text-length')).toHaveLength(0)
  })

  it('境界値: ちょうど2000文字はOK', () => {
    const text = 'あ'.repeat(2000)
    const issues = qualityRules([makeQuestion({ question_text: text })], makeContext())
    expect(issues.filter(i => i.rule === 'question-text-length')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 25: explanation-length
// ─────────────────────────────────────────────

describe('ルール25: explanation-length', () => {
  it('正常系: 20文字以上の解説はOK', () => {
    const issues = qualityRules([makeQuestion({ explanation: '解説テキストが20文字以上あることを確認します' })], makeContext())
    expect(issues.filter(i => i.rule === 'explanation-length')).toHaveLength(0)
  })

  it('正常系: explanationが空（未設定相当）はスキップ', () => {
    const issues = qualityRules([makeQuestion({ explanation: '' })], makeContext())
    expect(issues.filter(i => i.rule === 'explanation-length')).toHaveLength(0)
  })

  it('異常系: 19文字以下の解説はwarning', () => {
    const issues = qualityRules([makeQuestion({ explanation: '短い解説テキスト。' })], makeContext())
    const found = issues.filter(i => i.rule === 'explanation-length')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('warning')
  })

  it('境界値: ちょうど20文字はOK', () => {
    const issues = qualityRules([makeQuestion({ explanation: 'あ'.repeat(20) })], makeContext())
    expect(issues.filter(i => i.rule === 'explanation-length')).toHaveLength(0)
  })

  it('境界値: ちょうど19文字はwarning', () => {
    const issues = qualityRules([makeQuestion({ explanation: 'あ'.repeat(19) })], makeContext())
    expect(issues.filter(i => i.rule === 'explanation-length')).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────
// ルール 26: correct-rate-range
// ─────────────────────────────────────────────

describe('ルール26: correct-rate-range', () => {
  it('正常系: correct_rate=0.75はOK', () => {
    const issues = qualityRules([makeQuestion({ correct_rate: 0.75 })], makeContext())
    expect(issues.filter(i => i.rule === 'correct-rate-range')).toHaveLength(0)
  })

  it('正常系: correct_rate=0はOK（下限）', () => {
    const issues = qualityRules([makeQuestion({ correct_rate: 0 })], makeContext())
    expect(issues.filter(i => i.rule === 'correct-rate-range')).toHaveLength(0)
  })

  it('正常系: correct_rate=1はOK（上限）', () => {
    const issues = qualityRules([makeQuestion({ correct_rate: 1 })], makeContext())
    expect(issues.filter(i => i.rule === 'correct-rate-range')).toHaveLength(0)
  })

  it('正常系: correct_rate未設定はスキップ', () => {
    const issues = qualityRules([makeQuestion()], makeContext())
    expect(issues.filter(i => i.rule === 'correct-rate-range')).toHaveLength(0)
  })

  it('異常系: correct_rate=-0.1はerror', () => {
    const issues = qualityRules([makeQuestion({ correct_rate: -0.1 })], makeContext())
    const found = issues.filter(i => i.rule === 'correct-rate-range')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('error')
  })

  it('異常系: correct_rate=1.1はerror', () => {
    const issues = qualityRules([makeQuestion({ correct_rate: 1.1 })], makeContext())
    const found = issues.filter(i => i.rule === 'correct-rate-range')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('error')
  })
})

// ─────────────────────────────────────────────
// ルール 27: image-visual-type
// ─────────────────────────────────────────────

describe('ルール27: image-visual-type', () => {
  it('正常系: image_urlあり + visual_content_type設定済みはOK', () => {
    const issues = qualityRules(
      [makeQuestion({ image_url: '/images/test.png', visual_content_type: 'graph' })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'image-visual-type')).toHaveLength(0)
  })

  it('正常系: image_url未設定でvisual_content_type未設定はOK', () => {
    const issues = qualityRules([makeQuestion()], makeContext())
    expect(issues.filter(i => i.rule === 'image-visual-type')).toHaveLength(0)
  })

  it('異常系: image_urlありでvisual_content_type未設定はinfo', () => {
    const issues = qualityRules(
      [makeQuestion({ image_url: '/images/test.png' })],
      makeContext(),
    )
    const found = issues.filter(i => i.rule === 'image-visual-type')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('info')
  })

  it('誤検知防止: visual_content_type設定済みであればimage_urlがあってもOK', () => {
    const issues = qualityRules(
      [makeQuestion({ image_url: '/images/test.png', visual_content_type: 'structural_formula' })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'image-visual-type')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 28: text-contamination
// ─────────────────────────────────────────────

describe('ルール28: text-contamination', () => {
  it('正常系: 通常の問題文はOK', () => {
    const issues = qualityRules([makeQuestion()], makeContext())
    expect(issues.filter(i => i.rule === 'text-contamination')).toHaveLength(0)
  })

  it('異常系: 「問123（薬理）」パターン混入でwarning', () => {
    const issues = qualityRules(
      [makeQuestion({ question_text: '次の薬物について問123（薬理）で示したように選べ。' })],
      makeContext(),
    )
    const found = issues.filter(i => i.rule === 'text-contamination')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('warning')
  })

  it('異常系: 全角括弧パターン「問45（」でも検出', () => {
    const issues = qualityRules(
      [makeQuestion({ question_text: '問45（衛生）の解答を参照のこと。' })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'text-contamination')).toHaveLength(1)
  })

  it('異常系: 「問 3 (」スペースあり半角括弧でも検出', () => {
    const issues = qualityRules(
      [makeQuestion({ question_text: '問 3 (理論) に関して述べよ。' })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'text-contamination')).toHaveLength(1)
  })

  it('誤検知防止: 「問題」「問う」等の一般的な語は検出しない', () => {
    const issues = qualityRules(
      [makeQuestion({ question_text: '次の問題に正しく答えよ。薬物動態を問う問題である。' })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'text-contamination')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 29: choice-text-empty
// ─────────────────────────────────────────────

describe('ルール29: choice-text-empty', () => {
  it('正常系: 全選択肢にテキストありはOK', () => {
    const issues = qualityRules([makeQuestion()], makeContext())
    expect(issues.filter(i => i.rule === 'choice-text-empty')).toHaveLength(0)
  })

  it('異常系: choice_type=textで空テキストはerror', () => {
    const issues = qualityRules(
      [makeQuestion({ choices: [
        { key: 1, text: '', choice_type: 'text' },
        { key: 2, text: '選択肢B' },
        { key: 3, text: '選択肢C' },
        { key: 4, text: '選択肢D' },
        { key: 5, text: '選択肢E' },
      ]})],
      makeContext(),
    )
    const found = issues.filter(i => i.rule === 'choice-text-empty')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('error')
  })

  it('異常系: choice_type未設定で空テキストはerror', () => {
    const issues = qualityRules(
      [makeQuestion({ choices: [
        { key: 1, text: '' },
        { key: 2, text: '選択肢B' },
        { key: 3, text: '選択肢C' },
        { key: 4, text: '選択肢D' },
        { key: 5, text: '選択肢E' },
      ]})],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'choice-text-empty')).toHaveLength(1)
  })

  it('誤検知防止: choice_type=imageで空テキストはエラーにならない', () => {
    const issues = qualityRules(
      [makeQuestion({ choices: [
        { key: 1, text: '', choice_type: 'image' },
        { key: 2, text: '', choice_type: 'image' },
        { key: 3, text: '', choice_type: 'image' },
        { key: 4, text: '', choice_type: 'image' },
        { key: 5, text: '', choice_type: 'image' },
      ]})],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'choice-text-empty')).toHaveLength(0)
  })

  it('誤検知防止: choice_type=structural_formulaで空テキストはエラーにならない', () => {
    const issues = qualityRules(
      [makeQuestion({ choices: [
        { key: 1, text: '', choice_type: 'structural_formula' },
        { key: 2, text: '', choice_type: 'structural_formula' },
        { key: 3, text: '', choice_type: 'structural_formula' },
        { key: 4, text: '', choice_type: 'structural_formula' },
        { key: 5, text: '', choice_type: 'structural_formula' },
      ]})],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'choice-text-empty')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 30: duplicate-question-text
// ─────────────────────────────────────────────

describe('ルール30: duplicate-question-text', () => {
  it('正常系: 全問が異なる問題文はOK', () => {
    const questions = [
      makeQuestion({ id: 'r108-001', question_text: '問題文Aを1つ選べ。' }),
      makeQuestion({ id: 'r108-002', question_number: 2, question_text: '問題文Bを1つ選べ。' }),
    ]
    const issues = qualityRules(questions, makeContext())
    expect(issues.filter(i => i.rule === 'duplicate-question-text')).toHaveLength(0)
  })

  it('異常系: 2問が同じ問題文ならwarning（最初の1件のみ）', () => {
    const questions = [
      makeQuestion({ id: 'r108-001', question_text: '同じ問題文を1つ選べ。' }),
      makeQuestion({ id: 'r108-002', question_number: 2, question_text: '同じ問題文を1つ選べ。' }),
    ]
    const issues = qualityRules(questions, makeContext())
    const found = issues.filter(i => i.rule === 'duplicate-question-text')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('warning')
  })

  it('異常系: 3問が同じ問題文でも最初の1件のみwarning', () => {
    const questions = [
      makeQuestion({ id: 'r108-001', question_text: '同じ問題文。' }),
      makeQuestion({ id: 'r108-002', question_number: 2, question_text: '同じ問題文。' }),
      makeQuestion({ id: 'r108-003', question_number: 3, question_text: '同じ問題文。' }),
    ]
    const issues = qualityRules(questions, makeContext())
    const found = issues.filter(i => i.rule === 'duplicate-question-text')
    expect(found).toHaveLength(1)
  })

  it('誤検知防止: 1問しかない場合はOK', () => {
    const issues = qualityRules([makeQuestion()], makeContext())
    expect(issues.filter(i => i.rule === 'duplicate-question-text')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 31: choice-text-truncated
// ─────────────────────────────────────────────

describe('ルール31: choice-text-truncated', () => {
  it('正常系: 3文字以上のテキストはOK', () => {
    const issues = qualityRules([makeQuestion()], makeContext())
    expect(issues.filter(i => i.rule === 'choice-text-truncated')).toHaveLength(0)
  })

  it('異常系: choice_type=textで2文字以下はwarning', () => {
    const issues = qualityRules(
      [makeQuestion({ choices: [
        { key: 1, text: 'AB', choice_type: 'text' },
        { key: 2, text: '選択肢B長いテキスト' },
        { key: 3, text: '選択肢C長いテキスト' },
        { key: 4, text: '選択肢D長いテキスト' },
        { key: 5, text: '選択肢E長いテキスト' },
      ]})],
      makeContext(),
    )
    const found = issues.filter(i => i.rule === 'choice-text-truncated')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('warning')
  })

  it('異常系: choice_type未設定で1文字はwarning', () => {
    const issues = qualityRules(
      [makeQuestion({ choices: [
        { key: 1, text: 'A' },
        { key: 2, text: '選択肢B長いテキスト' },
        { key: 3, text: '選択肢C長いテキスト' },
        { key: 4, text: '選択肢D長いテキスト' },
        { key: 5, text: '選択肢E長いテキスト' },
      ]})],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'choice-text-truncated')).toHaveLength(1)
  })

  it('誤検知防止: choice_type=structural_formulaで1文字テキストはwarningにならない', () => {
    const issues = qualityRules(
      [makeQuestion({ choices: [
        { key: 1, text: '1', choice_type: 'structural_formula' },
        { key: 2, text: '2', choice_type: 'structural_formula' },
        { key: 3, text: '3', choice_type: 'structural_formula' },
        { key: 4, text: '4', choice_type: 'structural_formula' },
        { key: 5, text: '5', choice_type: 'structural_formula' },
      ]})],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'choice-text-truncated')).toHaveLength(0)
  })

  it('誤検知防止: choice_type=graphで2文字テキストはwarningにならない', () => {
    const issues = qualityRules(
      [makeQuestion({ choices: [
        { key: 1, text: 'AB', choice_type: 'graph' },
        { key: 2, text: 'CD', choice_type: 'graph' },
        { key: 3, text: 'EF', choice_type: 'graph' },
        { key: 4, text: 'GH', choice_type: 'graph' },
        { key: 5, text: 'IJ', choice_type: 'graph' },
      ]})],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'choice-text-truncated')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 32: choice-text-duplicate
// ─────────────────────────────────────────────

describe('ルール32: choice-text-duplicate', () => {
  it('正常系: 全選択肢テキストが異なるはOK', () => {
    const issues = qualityRules([makeQuestion()], makeContext())
    expect(issues.filter(i => i.rule === 'choice-text-duplicate')).toHaveLength(0)
  })

  it('異常系: 同一問題内で同じテキストの選択肢はerror', () => {
    const issues = qualityRules(
      [makeQuestion({ choices: [
        { key: 1, text: '重複テキスト' },
        { key: 2, text: '重複テキスト' },
        { key: 3, text: '選択肢C' },
        { key: 4, text: '選択肢D' },
        { key: 5, text: '選択肢E' },
      ]})],
      makeContext(),
    )
    const found = issues.filter(i => i.rule === 'choice-text-duplicate')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('error')
  })

  it('異常系: 画像選択肢でも「1.」が重複すればerror（実際のバグケース）', () => {
    const issues = qualityRules(
      [makeQuestion({ choices: [
        { key: 1, text: '1.', choice_type: 'image' },
        { key: 2, text: '1.', choice_type: 'image' },
        { key: 3, text: '2.', choice_type: 'image' },
        { key: 4, text: '3.', choice_type: 'image' },
        { key: 5, text: '4.', choice_type: 'image' },
      ]})],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'choice-text-duplicate')).toHaveLength(1)
  })

  it('誤検知防止: 全選択肢が異なるテキストはOK', () => {
    const issues = qualityRules(
      [makeQuestion({ choices: [
        { key: 1, text: 'テキストA' },
        { key: 2, text: 'テキストB' },
        { key: 3, text: 'テキストC' },
        { key: 4, text: 'テキストD' },
        { key: 5, text: 'テキストE' },
      ]})],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'choice-text-duplicate')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 33: question-text-table-leak
// ─────────────────────────────────────────────

describe('ルール33: question-text-table-leak', () => {
  it('正常系: 繰り返しパターンのない問題文はOK', () => {
    const issues = qualityRules([makeQuestion()], makeContext())
    expect(issues.filter(i => i.rule === 'question-text-table-leak')).toHaveLength(0)
  })

  it('異常系: 同じフレーズが3回以上繰り返される問題文はwarning', () => {
    const text = 'チャネル活性化\nチャネル遮断\nチャネル活性化\nチャネル遮断\nチャネル活性化\n正しいものを1つ選べ。'
    const issues = qualityRules([makeQuestion({ question_text: text })], makeContext())
    const found = issues.filter(i => i.rule === 'question-text-table-leak')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('warning')
  })

  it('異常系: 「薬物A」が3回出現するとwarning', () => {
    const text = '薬物A\n薬物B\n薬物A\n薬物C\n薬物A\n以下から正しいものを選べ。'
    const issues = qualityRules([makeQuestion({ question_text: text })], makeContext())
    expect(issues.filter(i => i.rule === 'question-text-table-leak')).toHaveLength(1)
  })

  it('誤検知防止: 2回程度の繰り返しはOK（意図的な対比表現）', () => {
    const text = 'チャネル活性化の場合と\nチャネル活性化でない場合を比較して正しいものを1つ選べ。'
    const issues = qualityRules([makeQuestion({ question_text: text })], makeContext())
    expect(issues.filter(i => i.rule === 'question-text-table-leak')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 34: question-text-choice-leak
// ─────────────────────────────────────────────

describe('ルール34: question-text-choice-leak', () => {
  it('正常系: 選択肢テキストが問題文末尾に含まれていないはOK', () => {
    const issues = qualityRules([makeQuestion()], makeContext())
    expect(issues.filter(i => i.rule === 'question-text-choice-leak')).toHaveLength(0)
  })

  it('異常系: 選択肢テキスト(4文字以上)が問題文末尾200文字に含まれるとwarning', () => {
    const choiceText = 'アセトアミノフェン'
    const questionText = `次の薬物について選べ。正しいものを1つ選べ。${choiceText}`
    const issues = qualityRules(
      [makeQuestion({
        question_text: questionText,
        choices: [
          { key: 1, text: choiceText },
          { key: 2, text: '選択肢B長いテキスト' },
          { key: 3, text: '選択肢C長いテキスト' },
          { key: 4, text: '選択肢D長いテキスト' },
          { key: 5, text: '選択肢E長いテキスト' },
        ],
      })],
      makeContext(),
    )
    const found = issues.filter(i => i.rule === 'question-text-choice-leak')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('warning')
  })

  it('誤検知防止: 短い選択肢（3文字以下）が問題文に含まれてもOK', () => {
    const issues = qualityRules(
      [makeQuestion({
        question_text: '次の薬物のK+について選べ。正しいものを1つ選べ。',
        choices: [
          { key: 1, text: 'K+' },
          { key: 2, text: '選択肢B長い' },
          { key: 3, text: '選択肢C長い' },
          { key: 4, text: '選択肢D長い' },
          { key: 5, text: '選択肢E長い' },
        ],
      })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'question-text-choice-leak')).toHaveLength(0)
  })

  it('誤検知防止: 問題文の先頭に選択肢テキストがあっても末尾200文字以外はスキップ', () => {
    const prefix = 'あ'.repeat(300)
    const choiceText = '長い選択肢テキスト'
    const questionText = `${choiceText}${prefix}正しいものを1つ選べ。`
    const issues = qualityRules(
      [makeQuestion({
        question_text: questionText,
        choices: [
          { key: 1, text: choiceText },
          { key: 2, text: '選択肢B長いテキスト' },
          { key: 3, text: '選択肢C長いテキスト' },
          { key: 4, text: '選択肢D長いテキスト' },
          { key: 5, text: '選択肢E長いテキスト' },
        ],
      })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'question-text-choice-leak')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 35: select-count-missing
// ─────────────────────────────────────────────

describe('ルール35: select-count-missing', () => {
  it('正常系: 「2つ選べ」のように数字が前にあるはOK', () => {
    const issues = qualityRules(
      [makeQuestion({ question_text: '正しいものを2つ選べ。', correct_answer: [1, 2] })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'select-count-missing')).toHaveLength(0)
  })

  it('正常系: 「つ選べ」が問題文にない場合はOK', () => {
    const issues = qualityRules([makeQuestion()], makeContext())
    expect(issues.filter(i => i.rule === 'select-count-missing')).toHaveLength(0)
  })

  it('正常系: 「二つ選べ」（漢数字）はOK', () => {
    const issues = qualityRules(
      [makeQuestion({ question_text: '正しいものを二つ選べ。', correct_answer: [1, 2] })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'select-count-missing')).toHaveLength(0)
  })

  it('正常系: 「３つ選べ」（全角数字）はOK', () => {
    const issues = qualityRules(
      [makeQuestion({
        question_text: '正しいものを３つ選べ。',
        choices: [
          { key: 1, text: 'A' }, { key: 2, text: 'B' }, { key: 3, text: 'C' },
          { key: 4, text: 'D' }, { key: 5, text: 'E' },
        ],
        correct_answer: [1, 2, 3],
      })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'select-count-missing')).toHaveLength(0)
  })

  it('異常系: 「つ選べ」の前に数字も漢数字もない（「正しいつ選べ」等）はwarning', () => {
    const issues = qualityRules(
      [makeQuestion({ question_text: '正しいつ選べ。' })],
      makeContext(),
    )
    const found = issues.filter(i => i.rule === 'select-count-missing')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('warning')
  })

  it('誤検知防止: 「１つ選べ」の場合（1つ=単一選択）はOK', () => {
    const issues = qualityRules(
      [makeQuestion({ question_text: '正しいものを１つ選べ。' })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'select-count-missing')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 36: image-only-choices
// ─────────────────────────────────────────────

describe('ルール36: image-only-choices', () => {
  it('正常系: テキスト選択肢のみの問題はOK', () => {
    const issues = qualityRules([makeQuestion()], makeContext())
    expect(issues.filter(i => i.rule === 'image-only-choices')).toHaveLength(0)
  })

  it('正常系: display_mode_override設定済みならOK', () => {
    const issues = qualityRules(
      [makeQuestion({
        display_mode_override: 'image',
        choices: [
          { key: 1, text: '1.' },
          { key: 2, text: '2.' },
          { key: 3, text: '3.' },
          { key: 4, text: '4.' },
          { key: 5, text: '5.' },
        ],
      })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'image-only-choices')).toHaveLength(0)
  })

  it('異常系: 全選択肢が番号のみ(「1.」「2」等)でdisplay_mode_override未設定はinfo', () => {
    const issues = qualityRules(
      [makeQuestion({
        choices: [
          { key: 1, text: '1.' },
          { key: 2, text: '2.' },
          { key: 3, text: '3.' },
          { key: 4, text: '4.' },
          { key: 5, text: '5.' },
        ],
      })],
      makeContext(),
    )
    const found = issues.filter(i => i.rule === 'image-only-choices')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('info')
  })

  it('異常系: 「1」「2」「3」（ドットなし番号のみ）でもinfo', () => {
    const issues = qualityRules(
      [makeQuestion({
        choices: [
          { key: 1, text: '1' },
          { key: 2, text: '2' },
          { key: 3, text: '3' },
          { key: 4, text: '4' },
          { key: 5, text: '5' },
        ],
      })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'image-only-choices')).toHaveLength(1)
  })

  it('誤検知防止: 1つでも番号以外のテキストがあればOK', () => {
    const issues = qualityRules(
      [makeQuestion({
        choices: [
          { key: 1, text: '1.' },
          { key: 2, text: '2.' },
          { key: 3, text: 'アセトアミノフェン' },
          { key: 4, text: '4.' },
          { key: 5, text: '5.' },
        ],
      })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'image-only-choices')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 37: choice-count-mismatch
// ─────────────────────────────────────────────

describe('ルール37: choice-count-mismatch', () => {
  it('正常系: 「2つ選べ」でcorrect_answer=[1,2]はOK', () => {
    const issues = qualityRules(
      [makeQuestion({ question_text: '正しいものを2つ選べ。', correct_answer: [1, 2] })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'choice-count-mismatch')).toHaveLength(0)
  })

  it('正常系: 「つ選べ」なし（単一選択）でscalarはOK', () => {
    const issues = qualityRules([makeQuestion()], makeContext())
    expect(issues.filter(i => i.rule === 'choice-count-mismatch')).toHaveLength(0)
  })

  it('正常系: 「三つ選べ」でcorrect_answer=[1,2,3]はOK', () => {
    const issues = qualityRules(
      [makeQuestion({
        question_text: '正しいものを三つ選べ。',
        choices: [
          { key: 1, text: 'A' }, { key: 2, text: 'B' }, { key: 3, text: 'C' },
          { key: 4, text: 'D' }, { key: 5, text: 'E' },
        ],
        correct_answer: [1, 2, 3],
      })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'choice-count-mismatch')).toHaveLength(0)
  })

  it('異常系: 「2つ選べ」でcorrect_answer=[1,2,3]（3個）はerror', () => {
    const issues = qualityRules(
      [makeQuestion({
        question_text: '正しいものを2つ選べ。',
        choices: [
          { key: 1, text: 'A' }, { key: 2, text: 'B' }, { key: 3, text: 'C' },
          { key: 4, text: 'D' }, { key: 5, text: 'E' },
        ],
        correct_answer: [1, 2, 3],
      })],
      makeContext(),
    )
    const found = issues.filter(i => i.rule === 'choice-count-mismatch')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('error')
  })

  it('異常系: 「3つ選べ」でcorrect_answer=[1,2]（2個）はerror', () => {
    const issues = qualityRules(
      [makeQuestion({
        question_text: '正しいものを3つ選べ。',
        choices: [
          { key: 1, text: 'A' }, { key: 2, text: 'B' }, { key: 3, text: 'C' },
          { key: 4, text: 'D' }, { key: 5, text: 'E' },
        ],
        correct_answer: [1, 2],
      })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'choice-count-mismatch')).toHaveLength(1)
  })

  it('異常系: 「1つ選べ」でcorrect_answerがscalarでない（配列）はerror', () => {
    const issues = qualityRules(
      [makeQuestion({
        question_text: '正しいものを1つ選べ。',
        correct_answer: [1, 2] as unknown as number,
      })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'choice-count-mismatch')).toHaveLength(1)
  })

  it('誤検知防止: 全角「２つ選べ」でcorrect_answer=[1,2]はOK', () => {
    const issues = qualityRules(
      [makeQuestion({ question_text: '正しいものを２つ選べ。', correct_answer: [1, 2] })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'choice-count-mismatch')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 38: display-mode-consistency
// ─────────────────────────────────────────────

describe('ルール38: display-mode-consistency', () => {
  it('正常系: display_mode_override未設定はOK', () => {
    const issues = qualityRules([makeQuestion()], makeContext())
    expect(issues.filter(i => i.rule === 'display-mode-consistency')).toHaveLength(0)
  })

  it('正常系: display_mode_override=textでimage_url未設定はOK', () => {
    const issues = qualityRules(
      [makeQuestion({ display_mode_override: 'text' })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'display-mode-consistency')).toHaveLength(0)
  })

  it('正常系: display_mode_override=imageでimage_url設定済みはOK', () => {
    const issues = qualityRules(
      [makeQuestion({ display_mode_override: 'image', image_url: '/images/test.png' })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'display-mode-consistency')).toHaveLength(0)
  })

  it('異常系: display_mode_override=textなのにimage_urlありはinfo', () => {
    const issues = qualityRules(
      [makeQuestion({ display_mode_override: 'text', image_url: '/images/test.png' })],
      makeContext(),
    )
    const found = issues.filter(i => i.rule === 'display-mode-consistency')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('info')
  })

  it('異常系: display_mode_override=imageなのにimage_url未設定はinfo', () => {
    const issues = qualityRules(
      [makeQuestion({ display_mode_override: 'image' })],
      makeContext(),
    )
    const found = issues.filter(i => i.rule === 'display-mode-consistency')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('info')
  })

  it('誤検知防止: display_mode_override=bothはどちらのケースも問題なし', () => {
    const issues = qualityRules(
      [makeQuestion({ display_mode_override: 'both', image_url: '/images/test.png' })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'display-mode-consistency')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// 複合テスト
// ─────────────────────────────────────────────

describe('複合テスト', () => {
  it('完全に正しい問題群はqualityルールのエラーを返さない', () => {
    const questions = [
      makeQuestion({ id: 'r108-001', year: 108, question_number: 1 }),
      makeQuestion({ id: 'r108-002', year: 108, question_number: 2, question_text: '別の問題文を1つ選べ。' }),
    ]
    const issues = qualityRules(questions, makeContext())
    expect(issues.filter(i => i.severity === 'error')).toHaveLength(0)
  })
})
