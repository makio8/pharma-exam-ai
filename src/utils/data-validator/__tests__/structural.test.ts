import { describe, it, expect } from 'vitest'
import { structuralRules } from '../rules/structural'
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
      { key: 1, text: '選択肢A' },
      { key: 2, text: '選択肢B' },
      { key: 3, text: '選択肢C' },
      { key: 4, text: '選択肢D' },
      { key: 5, text: '選択肢E' },
    ],
    correct_answer: 1,
    explanation: '解説テキスト',
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
// ルール 1: id-format
// ─────────────────────────────────────────────

describe('ルール1: id-format', () => {
  it('正常系: r108-001 はOK', () => {
    const issues = structuralRules([makeQuestion({ id: 'r108-001' })], makeContext())
    const idIssues = issues.filter(i => i.rule === 'id-format')
    expect(idIssues).toHaveLength(0)
  })

  it('異常系: "r10-001"（年度2桁）はエラー', () => {
    const issues = structuralRules([makeQuestion({ id: 'r10-001' })], makeContext())
    const idIssues = issues.filter(i => i.rule === 'id-format')
    expect(idIssues).toHaveLength(1)
    expect(idIssues[0].severity).toBe('error')
  })

  it('異常系: "108-001"（r接頭辞なし）はエラー', () => {
    const issues = structuralRules([makeQuestion({ id: '108-001' })], makeContext())
    const idIssues = issues.filter(i => i.rule === 'id-format')
    expect(idIssues).toHaveLength(1)
  })

  it('異常系: "r108_001"（ハイフンなし）はエラー', () => {
    const issues = structuralRules([makeQuestion({ id: 'r108_001' })], makeContext())
    const idIssues = issues.filter(i => i.rule === 'id-format')
    expect(idIssues).toHaveLength(1)
  })

  it('誤検知防止: r111-360 のような最大値もOK', () => {
    const issues = structuralRules(
      [makeQuestion({ id: 'r111-360', year: 111, question_number: 360 })],
      makeContext(),
    )
    const idIssues = issues.filter(i => i.rule === 'id-format')
    expect(idIssues).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 2: id-year-match
// ─────────────────────────────────────────────

describe('ルール2: id-year-match', () => {
  it('正常系: id r108-001 と year 108 は一致', () => {
    const issues = structuralRules([makeQuestion({ id: 'r108-001', year: 108 })], makeContext())
    expect(issues.filter(i => i.rule === 'id-year-match')).toHaveLength(0)
  })

  it('異常系: id r108-001 と year 109 は不一致でエラー', () => {
    const issues = structuralRules([makeQuestion({ id: 'r108-001', year: 109 })], makeContext())
    const found = issues.filter(i => i.rule === 'id-year-match')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('error')
  })

  it('誤検知防止: id-format 不正問題はid-year-matchをスキップ', () => {
    const issues = structuralRules([makeQuestion({ id: 'invalid' })], makeContext())
    expect(issues.filter(i => i.rule === 'id-year-match')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 3: id-qnum-match
// ─────────────────────────────────────────────

describe('ルール3: id-qnum-match', () => {
  it('正常系: id r108-100 と question_number 100 は一致', () => {
    const issues = structuralRules(
      [makeQuestion({ id: 'r108-100', year: 108, question_number: 100 })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'id-qnum-match')).toHaveLength(0)
  })

  it('異常系: id r108-001 と question_number 2 は不一致でエラー', () => {
    const issues = structuralRules(
      [makeQuestion({ id: 'r108-001', year: 108, question_number: 2 })],
      makeContext(),
    )
    const found = issues.filter(i => i.rule === 'id-qnum-match')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('error')
  })

  it('誤検知防止: id-format 不正問題はid-qnum-matchをスキップ', () => {
    const issues = structuralRules([makeQuestion({ id: 'invalid' })], makeContext())
    expect(issues.filter(i => i.rule === 'id-qnum-match')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 4: year-range
// ─────────────────────────────────────────────

describe('ルール4: year-range', () => {
  it('正常系: year=100はOK（下限）', () => {
    const issues = structuralRules(
      [makeQuestion({ id: 'r100-001', year: 100, question_number: 1 })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'year-range')).toHaveLength(0)
  })

  it('正常系: year=111はOK（上限）', () => {
    const issues = structuralRules(
      [makeQuestion({ id: 'r111-001', year: 111, question_number: 1 })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'year-range')).toHaveLength(0)
  })

  it('異常系: year=99はエラー（下限未満）', () => {
    const issues = structuralRules(
      [makeQuestion({ id: 'r099-001', year: 99, question_number: 1 })],
      makeContext(),
    )
    const found = issues.filter(i => i.rule === 'year-range')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('error')
  })

  it('異常系: year=112はエラー（上限超え）', () => {
    const issues = structuralRules(
      [makeQuestion({ id: 'r112-001', year: 112, question_number: 1 })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'year-range')).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────
// ルール 5: required-fields
// ─────────────────────────────────────────────

describe('ルール5: required-fields', () => {
  it('正常系: 全フィールドあり', () => {
    const issues = structuralRules([makeQuestion()], makeContext())
    expect(issues.filter(i => i.rule === 'required-fields')).toHaveLength(0)
  })

  it('異常系: question_text が空文字でエラー', () => {
    const issues = structuralRules([makeQuestion({ question_text: '' })], makeContext())
    const found = issues.filter(i => i.rule === 'required-fields')
    expect(found).toHaveLength(1)
    expect(found[0].field).toBe('question_text')
  })

  it('異常系: correct_answer が undefined 相当（空配列ではなくnull的）でエラー', () => {
    // correct_answer を不正値で渡す
    const issues = structuralRules(
      [makeQuestion({ correct_answer: undefined as unknown as number })],
      makeContext(),
    )
    const found = issues.filter(i => i.rule === 'required-fields')
    expect(found).toHaveLength(1)
    expect(found[0].field).toBe('correct_answer')
  })

  it('異常系: subject が空文字でエラー', () => {
    const issues = structuralRules(
      [makeQuestion({ subject: '' as QuestionSubject })],
      makeContext(),
    )
    const found = issues.filter(i => i.rule === 'required-fields')
    expect(found).toHaveLength(1)
    expect(found[0].field).toBe('subject')
  })

  it('誤検知防止: explanation が空でも required-fields はエラーにしない（任意フィールド）', () => {
    const issues = structuralRules([makeQuestion({ explanation: '' })], makeContext())
    expect(issues.filter(i => i.rule === 'required-fields')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 6: choices-valid
// ─────────────────────────────────────────────

describe('ルール6: choices-valid', () => {
  it('正常系: 5択（key 1-5）はOK', () => {
    const issues = structuralRules([makeQuestion()], makeContext())
    expect(issues.filter(i => i.rule === 'choices-valid')).toHaveLength(0)
  })

  it('正常系: 2択（key 1,2）もOK', () => {
    const issues = structuralRules(
      [makeQuestion({ choices: [{ key: 1, text: 'A' }, { key: 2, text: 'B' }], correct_answer: 1 })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'choices-valid')).toHaveLength(0)
  })

  it('異常系: 空配列はエラー', () => {
    const issues = structuralRules([makeQuestion({ choices: [] })], makeContext())
    const found = issues.filter(i => i.rule === 'choices-valid')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('error')
  })

  it('異常系: key が重複しているとエラー', () => {
    const issues = structuralRules(
      [makeQuestion({ choices: [{ key: 1, text: 'A' }, { key: 1, text: 'B' }] })],
      makeContext(),
    )
    const found = issues.filter(i => i.rule === 'choices-valid')
    expect(found).toHaveLength(1)
  })

  it('異常系: key が0（範囲外）はエラー', () => {
    const issues = structuralRules(
      [makeQuestion({ choices: [{ key: 0, text: 'A' }, { key: 1, text: 'B' }] })],
      makeContext(),
    )
    const found = issues.filter(i => i.rule === 'choices-valid')
    expect(found).toHaveLength(1)
  })

  it('異常系: key が6（範囲外）はエラー', () => {
    const issues = structuralRules(
      [makeQuestion({ choices: [{ key: 6, text: 'A' }, { key: 1, text: 'B' }] })],
      makeContext(),
    )
    const found = issues.filter(i => i.rule === 'choices-valid')
    expect(found).toHaveLength(1)
  })

  it('異常系: 6択（7個以上）はエラー', () => {
    const choices = [1, 2, 3, 4, 5, 6].map(k => ({ key: k, text: `選択肢${k}` }))
    const issues = structuralRules([makeQuestion({ choices })], makeContext())
    const found = issues.filter(i => i.rule === 'choices-valid')
    expect(found).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────
// ルール 7: answer-in-choices
// ─────────────────────────────────────────────

describe('ルール7: answer-in-choices', () => {
  it('正常系: correct_answer=1 が choices[key=1] に存在', () => {
    const issues = structuralRules([makeQuestion()], makeContext())
    expect(issues.filter(i => i.rule === 'answer-in-choices')).toHaveLength(0)
  })

  it('正常系: correct_answer=[1,3] が全て choices に存在', () => {
    const q = makeQuestion({
      question_text: '正しいものを2つ選べ。',
      correct_answer: [1, 3],
    })
    const issues = structuralRules([q], makeContext())
    expect(issues.filter(i => i.rule === 'answer-in-choices')).toHaveLength(0)
  })

  it('異常系: correct_answer=6 が choices に存在しない', () => {
    const issues = structuralRules([makeQuestion({ correct_answer: 6 })], makeContext())
    const found = issues.filter(i => i.rule === 'answer-in-choices')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('error')
  })

  it('異常系: correct_answer=[1,9] の9が choices に存在しない', () => {
    const q = makeQuestion({
      question_text: '正しいものを2つ選べ。',
      correct_answer: [1, 9],
    })
    const issues = structuralRules([q], makeContext())
    const found = issues.filter(i => i.rule === 'answer-in-choices')
    expect(found).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────
// ルール 8: section-enum
// ─────────────────────────────────────────────

describe('ルール8: section-enum', () => {
  it('正常系: 必須・理論・実践はOK', () => {
    const sections: QuestionSection[] = ['必須', '理論', '実践']
    for (const section of sections) {
      const issues = structuralRules([makeQuestion({ section })], makeContext())
      expect(issues.filter(i => i.rule === 'section-enum')).toHaveLength(0)
    }
  })

  it('異常系: "一般" はエラー', () => {
    const issues = structuralRules(
      [makeQuestion({ section: '一般' as QuestionSection })],
      makeContext(),
    )
    const found = issues.filter(i => i.rule === 'section-enum')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('error')
  })

  it('異常系: 空文字はエラー', () => {
    const issues = structuralRules(
      [makeQuestion({ section: '' as QuestionSection })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'section-enum')).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────
// ルール 9: subject-enum
// ─────────────────────────────────────────────

describe('ルール9: subject-enum', () => {
  it('正常系: 9科目すべてOK', () => {
    const subjects: QuestionSubject[] = [
      '物理', '化学', '生物', '衛生', '薬理', '薬剤',
      '病態・薬物治療', '法規・制度・倫理', '実務',
    ]
    for (const subject of subjects) {
      const issues = structuralRules([makeQuestion({ subject })], makeContext())
      expect(issues.filter(i => i.rule === 'subject-enum')).toHaveLength(0)
    }
  })

  it('異常系: "薬学" はエラー', () => {
    const issues = structuralRules(
      [makeQuestion({ subject: '薬学' as QuestionSubject })],
      makeContext(),
    )
    const found = issues.filter(i => i.rule === 'subject-enum')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('error')
  })

  it('誤検知防止: "病態・薬物治療"（長い名前）はOK', () => {
    const issues = structuralRules(
      [makeQuestion({ subject: '病態・薬物治療' })],
      makeContext(),
    )
    expect(issues.filter(i => i.rule === 'subject-enum')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 10: id-unique
// ─────────────────────────────────────────────

describe('ルール10: id-unique', () => {
  it('正常系: 全IDが一意', () => {
    const questions = [
      makeQuestion({ id: 'r108-001' }),
      makeQuestion({ id: 'r108-002', question_number: 2 }),
    ]
    const issues = structuralRules(questions, makeContext())
    expect(issues.filter(i => i.rule === 'id-unique')).toHaveLength(0)
  })

  it('異常系: 同じIDが2問あればエラー×2', () => {
    const questions = [
      makeQuestion({ id: 'r108-001' }),
      makeQuestion({ id: 'r108-001' }),
    ]
    const issues = structuralRules(questions, makeContext())
    const found = issues.filter(i => i.rule === 'id-unique')
    expect(found.length).toBeGreaterThanOrEqual(1)
    expect(found[0].severity).toBe('error')
  })

  it('誤検知防止: 3問が全て異なるIDならエラーなし', () => {
    const questions = [
      makeQuestion({ id: 'r108-001' }),
      makeQuestion({ id: 'r108-002', question_number: 2 }),
      makeQuestion({ id: 'r109-001', year: 109 }),
    ]
    const issues = structuralRules(questions, makeContext())
    expect(issues.filter(i => i.rule === 'id-unique')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 11: qnum-unique-in-year
// ─────────────────────────────────────────────

describe('ルール11: qnum-unique-in-year', () => {
  it('正常系: 同一年度内でquestion_numberが一意', () => {
    const questions = [
      makeQuestion({ id: 'r108-001', year: 108, question_number: 1 }),
      makeQuestion({ id: 'r108-002', year: 108, question_number: 2 }),
      makeQuestion({ id: 'r109-001', year: 109, question_number: 1 }),
    ]
    const issues = structuralRules(questions, makeContext())
    expect(issues.filter(i => i.rule === 'qnum-unique-in-year')).toHaveLength(0)
  })

  it('異常系: 同一年度で同じquestion_numberが重複', () => {
    const questions = [
      makeQuestion({ id: 'r108-001', year: 108, question_number: 1 }),
      makeQuestion({ id: 'r108-001b', year: 108, question_number: 1 }),
    ]
    const issues = structuralRules(questions, makeContext())
    const found = issues.filter(i => i.rule === 'qnum-unique-in-year')
    expect(found.length).toBeGreaterThanOrEqual(1)
    expect(found[0].severity).toBe('error')
  })

  it('誤検知防止: 異なる年度で同じquestion_numberは許可', () => {
    const questions = [
      makeQuestion({ id: 'r108-001', year: 108, question_number: 1 }),
      makeQuestion({ id: 'r109-001', year: 109, question_number: 1 }),
    ]
    const issues = structuralRules(questions, makeContext())
    expect(issues.filter(i => i.rule === 'qnum-unique-in-year')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 12: answer-format
// ─────────────────────────────────────────────

describe('ルール12: answer-format', () => {
  it('正常系: 「1つ選べ」でscalar（number）はOK', () => {
    const q = makeQuestion({ question_text: '正しいものを1つ選べ。', correct_answer: 1 })
    const issues = structuralRules([q], makeContext())
    expect(issues.filter(i => i.rule === 'answer-format')).toHaveLength(0)
  })

  it('正常系: 「2つ選べ」で昇順配列 [1,3] はOK', () => {
    const q = makeQuestion({ question_text: '正しいものを2つ選べ。', correct_answer: [1, 3] })
    const issues = structuralRules([q], makeContext())
    expect(issues.filter(i => i.rule === 'answer-format')).toHaveLength(0)
  })

  it('正常系: 「つ選べ」不在でscalarはOK（デフォルト単一選択扱い）', () => {
    const q = makeQuestion({ question_text: '正しいものはどれか。', correct_answer: 2 })
    const issues = structuralRules([q], makeContext())
    expect(issues.filter(i => i.rule === 'answer-format')).toHaveLength(0)
  })

  it('異常系: 「1つ選べ」なのに配列はエラー', () => {
    const q = makeQuestion({
      question_text: '正しいものを1つ選べ。',
      correct_answer: [1, 2],
    })
    const issues = structuralRules([q], makeContext())
    const found = issues.filter(i => i.rule === 'answer-format')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('error')
  })

  it('異常系: 「つ選べ」不在なのに配列はエラー', () => {
    const q = makeQuestion({
      question_text: '正しいものはどれか。',
      correct_answer: [1, 2],
    })
    const issues = structuralRules([q], makeContext())
    expect(issues.filter(i => i.rule === 'answer-format')).toHaveLength(1)
  })

  it('異常系: 「2つ選べ」なのにscalarはエラー', () => {
    const q = makeQuestion({ question_text: '正しいものを2つ選べ。', correct_answer: 1 })
    const issues = structuralRules([q], makeContext())
    const found = issues.filter(i => i.rule === 'answer-format')
    expect(found).toHaveLength(1)
  })

  it('異常系: 「2つ選べ」で降順配列 [3,1] はエラー', () => {
    const q = makeQuestion({ question_text: '正しいものを2つ選べ。', correct_answer: [3, 1] })
    const issues = structuralRules([q], makeContext())
    expect(issues.filter(i => i.rule === 'answer-format')).toHaveLength(1)
  })

  it('正常系: 全角「２つ選べ」で配列 [1,2] はOK', () => {
    const q = makeQuestion({ question_text: '正しいものを２つ選べ。', correct_answer: [1, 2] })
    const issues = structuralRules([q], makeContext())
    expect(issues.filter(i => i.rule === 'answer-format')).toHaveLength(0)
  })

  it('異常系: 全角「１つ選べ」なのに配列はエラー', () => {
    const q = makeQuestion({
      question_text: '正しいものを１つ選べ。',
      correct_answer: [1, 2],
    })
    const issues = structuralRules([q], makeContext())
    expect(issues.filter(i => i.rule === 'answer-format')).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────
// ルール 13: answer-no-duplicate
// ─────────────────────────────────────────────

describe('ルール13: answer-no-duplicate', () => {
  it('正常系: [1,3] は重複なしOK', () => {
    const q = makeQuestion({ question_text: '2つ選べ。', correct_answer: [1, 3] })
    const issues = structuralRules([q], makeContext())
    expect(issues.filter(i => i.rule === 'answer-no-duplicate')).toHaveLength(0)
  })

  it('正常系: scalarはスキップ（チェック対象外）', () => {
    const issues = structuralRules([makeQuestion({ correct_answer: 1 })], makeContext())
    expect(issues.filter(i => i.rule === 'answer-no-duplicate')).toHaveLength(0)
  })

  it('異常系: [1,1] は重複でエラー', () => {
    const q = makeQuestion({ question_text: '2つ選べ。', correct_answer: [1, 1] })
    const issues = structuralRules([q], makeContext())
    const found = issues.filter(i => i.rule === 'answer-no-duplicate')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('error')
  })

  it('異常系: [2,2,3] も重複でエラー', () => {
    const q = makeQuestion({ question_text: '3つ選べ。', correct_answer: [2, 2, 3] })
    const issues = structuralRules([q], makeContext())
    expect(issues.filter(i => i.rule === 'answer-no-duplicate')).toHaveLength(1)
  })

  it('誤検知防止: [1,2,3,4] は全て異なるのでOK', () => {
    const q = makeQuestion({ question_text: '4つ選べ。', correct_answer: [1, 2, 3, 4] })
    const issues = structuralRules([q], makeContext())
    expect(issues.filter(i => i.rule === 'answer-no-duplicate')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// 複合テスト: 正常データはエラーなし
// ─────────────────────────────────────────────

describe('複合テスト', () => {
  it('完全に正しい問題群はエラーを返さない', () => {
    const questions = [
      makeQuestion({ id: 'r108-001', year: 108, question_number: 1 }),
      makeQuestion({ id: 'r108-002', year: 108, question_number: 2 }),
      makeQuestion({ id: 'r109-001', year: 109, question_number: 1 }),
    ]
    const issues = structuralRules(questions, makeContext())
    expect(issues.filter(i => i.severity === 'error')).toHaveLength(0)
  })

  it('複数の問題で異なるエラーが混在していても全て検出する', () => {
    const questions = [
      makeQuestion({ id: 'invalid-id' }),           // id-format
      makeQuestion({ id: 'r108-001', year: 109 }),   // id-year-match
    ]
    const issues = structuralRules(questions, makeContext())
    expect(issues.some(i => i.rule === 'id-format')).toBe(true)
    expect(issues.some(i => i.rule === 'id-year-match')).toBe(true)
  })
})
