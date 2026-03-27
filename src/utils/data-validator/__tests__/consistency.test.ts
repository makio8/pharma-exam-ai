import { describe, it, expect } from 'vitest'
import { consistencyRules } from '../rules/consistency'
import type { Question, QuestionSection, QuestionSubject } from '../../../types/question'
import type { ValidationContext } from '../types'

// ─────────────────────────────────────────────
// テストファクトリ
// ─────────────────────────────────────────────

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'r110-001',
    year: 110,
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
    topicMap: { 'r110-001': 'physics-material-structure' },
    blueprintTopicIds: new Set(['physics-material-structure']),
    exemplarQuestionIds: new Set(['r110-001']),
    officialNotes: [
      { id: 'fusen-0001', topicId: 'physics-material-structure' },
    ],
    questionIds: new Set(['r110-001']),
    imageDir: '', // テスト時はファイルチェックスキップ
    ...overrides,
  }
}

// ─────────────────────────────────────────────
// ルール 14: topic-map-exists
// ─────────────────────────────────────────────

describe('ルール14: topic-map-exists', () => {
  it('正常系: topicMapにエントリがある問題はwarningなし', () => {
    const q = makeQuestion({ id: 'r110-001' })
    const ctx = makeContext({ topicMap: { 'r110-001': 'physics-material-structure' } })
    const issues = consistencyRules([q], ctx)
    expect(issues.filter(i => i.rule === 'topic-map-exists')).toHaveLength(0)
  })

  it('異常系: topicMapにエントリがない問題はwarning', () => {
    const q = makeQuestion({ id: 'r110-002' })
    const ctx = makeContext({
      topicMap: {},
      questionIds: new Set(['r110-001', 'r110-002']),
    })
    const issues = consistencyRules([q], ctx)
    const found = issues.filter(i => i.rule === 'topic-map-exists')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('warning')
  })

  it('誤検知防止: topicMapに別の問題IDのエントリしかない場合は検出する', () => {
    const q = makeQuestion({ id: 'r110-003' })
    const ctx = makeContext({
      topicMap: { 'r110-001': 'physics-material-structure' },
      questionIds: new Set(['r110-001', 'r110-003']),
    })
    const issues = consistencyRules([q], ctx)
    expect(issues.filter(i => i.rule === 'topic-map-exists')).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────
// ルール 15: topic-id-valid
// ─────────────────────────────────────────────

describe('ルール15: topic-id-valid', () => {
  it('正常系: topicIdがblueprintTopicIdsに存在する', () => {
    const q = makeQuestion({ id: 'r110-001' })
    const ctx = makeContext({
      topicMap: { 'r110-001': 'physics-material-structure' },
      blueprintTopicIds: new Set(['physics-material-structure']),
    })
    const issues = consistencyRules([q], ctx)
    expect(issues.filter(i => i.rule === 'topic-id-valid')).toHaveLength(0)
  })

  it('異常系: topicIdがblueprintTopicIdsに存在しない場合はerror', () => {
    const q = makeQuestion({ id: 'r110-001' })
    const ctx = makeContext({
      topicMap: { 'r110-001': 'non-existent-topic' },
      blueprintTopicIds: new Set(['physics-material-structure']),
    })
    const issues = consistencyRules([q], ctx)
    const found = issues.filter(i => i.rule === 'topic-id-valid')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('error')
  })

  it('誤検知防止: topicMapにエントリがない問題はtopic-id-validをスキップ', () => {
    const q = makeQuestion({ id: 'r110-002' })
    const ctx = makeContext({
      topicMap: {},
      blueprintTopicIds: new Set(['physics-material-structure']),
      questionIds: new Set(['r110-001', 'r110-002']),
    })
    const issues = consistencyRules([q], ctx)
    expect(issues.filter(i => i.rule === 'topic-id-valid')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 16: exemplar-map-exists
// ─────────────────────────────────────────────

describe('ルール16: exemplar-map-exists', () => {
  it('正常系: exemplarQuestionIdsにIDがある問題はwarningなし', () => {
    const q = makeQuestion({ id: 'r110-001' })
    const ctx = makeContext({ exemplarQuestionIds: new Set(['r110-001']) })
    const issues = consistencyRules([q], ctx)
    expect(issues.filter(i => i.rule === 'exemplar-map-exists')).toHaveLength(0)
  })

  it('異常系: exemplarQuestionIdsにIDがない問題はwarning', () => {
    const q = makeQuestion({ id: 'r110-002' })
    const ctx = makeContext({
      exemplarQuestionIds: new Set(['r110-001']),
      questionIds: new Set(['r110-001', 'r110-002']),
    })
    const issues = consistencyRules([q], ctx)
    const found = issues.filter(i => i.rule === 'exemplar-map-exists')
    expect(found).toHaveLength(1)
    expect(found[0].severity).toBe('warning')
  })

  it('誤検知防止: exemplarMapはwarningのみ（errorではない）', () => {
    const q = makeQuestion({ id: 'r110-002' })
    const ctx = makeContext({
      exemplarQuestionIds: new Set([]),
      questionIds: new Set(['r110-001', 'r110-002']),
    })
    const issues = consistencyRules([q], ctx)
    const found = issues.filter(i => i.rule === 'exemplar-map-exists')
    expect(found.every(i => i.severity !== 'error')).toBe(true)
  })
})

// ─────────────────────────────────────────────
// ルール 17: linked-group-format
// ─────────────────────────────────────────────

describe('ルール17: linked-group-format', () => {
  it('正常系: r100-196-199 形式はOK', () => {
    const q = makeQuestion({ id: 'r100-196', year: 100, question_number: 196, linked_group: 'r100-196-199' })
    const ctx = makeContext({
      questionIds: new Set(['r100-196', 'r100-197', 'r100-198', 'r100-199']),
    })
    const issues = consistencyRules([q], ctx)
    expect(issues.filter(i => i.rule === 'linked-group-format')).toHaveLength(0)
  })

  it('異常系: r100-196-199x などフォーマット違反はerror', () => {
    const q = makeQuestion({ id: 'r100-196', year: 100, question_number: 196, linked_group: 'r100-196-199x' })
    const ctx = makeContext({
      questionIds: new Set(['r100-196']),
    })
    const issues = consistencyRules([q], ctx)
    const found = issues.filter(i => i.rule === 'linked-group-format')
    expect(found.length).toBeGreaterThanOrEqual(1)
    expect(found[0].severity).toBe('error')
  })

  it('誤検知防止: linked_groupがundefined/nullの問題はスキップ', () => {
    const q = makeQuestion({ id: 'r110-001', linked_group: undefined })
    const ctx = makeContext()
    const issues = consistencyRules([q], ctx)
    expect(issues.filter(i => i.rule === 'linked-group-format')).toHaveLength(0)
  })

  it('異常系: r100-96-99（2桁）はエラー', () => {
    const q = makeQuestion({ id: 'r100-096', year: 100, question_number: 96, linked_group: 'r100-96-99' })
    const ctx = makeContext({ questionIds: new Set(['r100-096']) })
    const issues = consistencyRules([q], ctx)
    const found = issues.filter(i => i.rule === 'linked-group-format')
    expect(found.length).toBeGreaterThanOrEqual(1)
  })
})

// ─────────────────────────────────────────────
// ルール 18: linked-group-complete
// ─────────────────────────────────────────────

describe('ルール18: linked-group-complete', () => {
  it('正常系: r100-196-199 で196〜199が全て存在', () => {
    const questions = [
      makeQuestion({ id: 'r100-196', year: 100, question_number: 196, linked_group: 'r100-196-199' }),
      makeQuestion({ id: 'r100-197', year: 100, question_number: 197, linked_group: 'r100-196-199' }),
      makeQuestion({ id: 'r100-198', year: 100, question_number: 198, linked_group: 'r100-196-199' }),
      makeQuestion({ id: 'r100-199', year: 100, question_number: 199, linked_group: 'r100-196-199' }),
    ]
    const ctx = makeContext({
      questionIds: new Set(['r100-196', 'r100-197', 'r100-198', 'r100-199']),
    })
    const issues = consistencyRules(questions, ctx)
    expect(issues.filter(i => i.rule === 'linked-group-complete')).toHaveLength(0)
  })

  it('異常系: r100-196-199 で r100-197 が存在しない（歯抜け）', () => {
    const questions = [
      makeQuestion({ id: 'r100-196', year: 100, question_number: 196, linked_group: 'r100-196-199' }),
      makeQuestion({ id: 'r100-198', year: 100, question_number: 198, linked_group: 'r100-196-199' }),
      makeQuestion({ id: 'r100-199', year: 100, question_number: 199, linked_group: 'r100-196-199' }),
    ]
    const ctx = makeContext({
      questionIds: new Set(['r100-196', 'r100-198', 'r100-199']),
    })
    const issues = consistencyRules(questions, ctx)
    const found = issues.filter(i => i.rule === 'linked-group-complete')
    expect(found.length).toBeGreaterThanOrEqual(1)
    expect(found[0].severity).toBe('error')
  })

  it('誤検知防止: linked_groupがundefinedの問題はスキップ', () => {
    const q = makeQuestion({ id: 'r110-001', linked_group: undefined })
    const ctx = makeContext({ questionIds: new Set(['r110-001']) })
    const issues = consistencyRules([q], ctx)
    expect(issues.filter(i => i.rule === 'linked-group-complete')).toHaveLength(0)
  })

  it('正常系: r108-090-092 で090〜092が全て存在', () => {
    const questions = [
      makeQuestion({ id: 'r108-090', year: 108, question_number: 90, linked_group: 'r108-090-092' }),
      makeQuestion({ id: 'r108-091', year: 108, question_number: 91, linked_group: 'r108-090-092' }),
      makeQuestion({ id: 'r108-092', year: 108, question_number: 92, linked_group: 'r108-090-092' }),
    ]
    const ctx = makeContext({
      questionIds: new Set(['r108-090', 'r108-091', 'r108-092']),
    })
    const issues = consistencyRules(questions, ctx)
    expect(issues.filter(i => i.rule === 'linked-group-complete')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 19: linked-group-same-year
// ─────────────────────────────────────────────

describe('ルール19: linked-group-same-year', () => {
  it('正常系: グループ内全問が同一year・section', () => {
    const questions = [
      makeQuestion({ id: 'r100-196', year: 100, section: '実践', question_number: 196, linked_group: 'r100-196-198' }),
      makeQuestion({ id: 'r100-197', year: 100, section: '実践', question_number: 197, linked_group: 'r100-196-198' }),
      makeQuestion({ id: 'r100-198', year: 100, section: '実践', question_number: 198, linked_group: 'r100-196-198' }),
    ]
    const ctx = makeContext({
      questionIds: new Set(['r100-196', 'r100-197', 'r100-198']),
    })
    const issues = consistencyRules(questions, ctx)
    expect(issues.filter(i => i.rule === 'linked-group-same-year')).toHaveLength(0)
  })

  it('異常系: グループ内でyearが違う問題がある', () => {
    const questions = [
      makeQuestion({ id: 'r100-196', year: 100, section: '実践', question_number: 196, linked_group: 'r100-196-198' }),
      makeQuestion({ id: 'r100-197', year: 101, section: '実践', question_number: 197, linked_group: 'r100-196-198' }),
      makeQuestion({ id: 'r100-198', year: 100, section: '実践', question_number: 198, linked_group: 'r100-196-198' }),
    ]
    const ctx = makeContext({
      questionIds: new Set(['r100-196', 'r100-197', 'r100-198']),
    })
    const issues = consistencyRules(questions, ctx)
    const found = issues.filter(i => i.rule === 'linked-group-same-year')
    expect(found.length).toBeGreaterThanOrEqual(1)
    expect(found[0].severity).toBe('error')
  })

  it('異常系: グループ内でsectionが違う問題がある', () => {
    const questions = [
      makeQuestion({ id: 'r100-196', year: 100, section: '実践', question_number: 196, linked_group: 'r100-196-198' }),
      makeQuestion({ id: 'r100-197', year: 100, section: '理論', question_number: 197, linked_group: 'r100-196-198' }),
      makeQuestion({ id: 'r100-198', year: 100, section: '実践', question_number: 198, linked_group: 'r100-196-198' }),
    ]
    const ctx = makeContext({
      questionIds: new Set(['r100-196', 'r100-197', 'r100-198']),
    })
    const issues = consistencyRules(questions, ctx)
    const found = issues.filter(i => i.rule === 'linked-group-same-year')
    expect(found.length).toBeGreaterThanOrEqual(1)
  })

  it('誤検知防止: linked_groupがundefinedの問題はスキップ', () => {
    const q = makeQuestion({ id: 'r110-001', year: 110, linked_group: undefined })
    const ctx = makeContext({ questionIds: new Set(['r110-001']) })
    const issues = consistencyRules([q], ctx)
    expect(issues.filter(i => i.rule === 'linked-group-same-year')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 20: linked-scenario-shared
// ─────────────────────────────────────────────

describe('ルール20: linked-scenario-shared', () => {
  it('正常系: グループ内全問が同一linked_scenario', () => {
    const questions = [
      makeQuestion({ id: 'r100-196', year: 100, question_number: 196, linked_group: 'r100-196-198', linked_scenario: 'シナリオA' }),
      makeQuestion({ id: 'r100-197', year: 100, question_number: 197, linked_group: 'r100-196-198', linked_scenario: 'シナリオA' }),
      makeQuestion({ id: 'r100-198', year: 100, question_number: 198, linked_group: 'r100-196-198', linked_scenario: 'シナリオA' }),
    ]
    const ctx = makeContext({
      questionIds: new Set(['r100-196', 'r100-197', 'r100-198']),
    })
    const issues = consistencyRules(questions, ctx)
    expect(issues.filter(i => i.rule === 'linked-scenario-shared')).toHaveLength(0)
  })

  it('異常系: グループ内でlinked_scenarioが異なる', () => {
    const questions = [
      makeQuestion({ id: 'r100-196', year: 100, question_number: 196, linked_group: 'r100-196-198', linked_scenario: 'シナリオA' }),
      makeQuestion({ id: 'r100-197', year: 100, question_number: 197, linked_group: 'r100-196-198', linked_scenario: 'シナリオB' }),
      makeQuestion({ id: 'r100-198', year: 100, question_number: 198, linked_group: 'r100-196-198', linked_scenario: 'シナリオA' }),
    ]
    const ctx = makeContext({
      questionIds: new Set(['r100-196', 'r100-197', 'r100-198']),
    })
    const issues = consistencyRules(questions, ctx)
    const found = issues.filter(i => i.rule === 'linked-scenario-shared')
    expect(found.length).toBeGreaterThanOrEqual(1)
    expect(found[0].severity).toBe('warning')
  })

  it('誤検知防止: linked_groupがundefinedの問題はスキップ', () => {
    const q = makeQuestion({ id: 'r110-001', linked_group: undefined, linked_scenario: 'シナリオA' })
    const ctx = makeContext({ questionIds: new Set(['r110-001']) })
    const issues = consistencyRules([q], ctx)
    expect(issues.filter(i => i.rule === 'linked-scenario-shared')).toHaveLength(0)
  })

  it('誤検知防止: 全問のlinked_scenarioがundefinedの場合はwarningなし（全員同じ）', () => {
    const questions = [
      makeQuestion({ id: 'r100-196', year: 100, question_number: 196, linked_group: 'r100-196-198', linked_scenario: undefined }),
      makeQuestion({ id: 'r100-197', year: 100, question_number: 197, linked_group: 'r100-196-198', linked_scenario: undefined }),
      makeQuestion({ id: 'r100-198', year: 100, question_number: 198, linked_group: 'r100-196-198', linked_scenario: undefined }),
    ]
    const ctx = makeContext({
      questionIds: new Set(['r100-196', 'r100-197', 'r100-198']),
    })
    const issues = consistencyRules(questions, ctx)
    expect(issues.filter(i => i.rule === 'linked-scenario-shared')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// ルール 21: note-question-exists
// ─────────────────────────────────────────────

describe('ルール21: note-question-exists', () => {
  it('正常系: 付箋が参照するquestionIdが全て存在する', () => {
    const q = makeQuestion({ id: 'r110-001' })
    const ctx = makeContext({
      officialNotes: [
        { id: 'fusen-0001', topicId: 'physics-material-structure' },
      ],
      questionIds: new Set(['r110-001']),
    })
    const issues = consistencyRules([q], ctx)
    expect(issues.filter(i => i.rule === 'note-question-exists')).toHaveLength(0)
  })

  it('異常系: 付箋が参照するquestionIdが存在しない場合はwarning', () => {
    const q = makeQuestion({ id: 'r110-001' })
    const ctx = makeContext({
      officialNotes: [
        { id: 'fusen-0001', linkedQuestionIds: ['r110-999'], topicId: 'physics-material-structure' },
      ],
      questionIds: new Set(['r110-001']),
    })
    const issues = consistencyRules([q], ctx)
    const found = issues.filter(i => i.rule === 'note-question-exists')
    expect(found.length).toBeGreaterThanOrEqual(1)
    expect(found[0].severity).toBe('warning')
  })

  it('linkedQuestionIds省略（undefined）の付箋はスキップ', () => {
    const q = makeQuestion({ id: 'r110-001' })
    const ctx = makeContext({
      officialNotes: [
        { id: 'fusen-0001', topicId: 'physics-material-structure' },
      ],
      questionIds: new Set(['r110-001']),
    })
    const issues = consistencyRules([q], ctx)
    expect(issues.filter(i => i.rule === 'note-question-exists')).toHaveLength(0)
  })

  it('異常系: issueのquestionIdには付箋ID（問題IDではない）が入る', () => {
    const q = makeQuestion({ id: 'r110-001' })
    const ctx = makeContext({
      officialNotes: [
        { id: 'on-special-001', linkedQuestionIds: ['r110-999'], topicId: 'physics-material-structure' },
      ],
      questionIds: new Set(['r110-001']),
    })
    const issues = consistencyRules([q], ctx)
    const found = issues.filter(i => i.rule === 'note-question-exists')
    expect(found.length).toBeGreaterThanOrEqual(1)
    expect(found[0].questionId).toBe('on-special-001')
  })
})

// ─────────────────────────────────────────────
// ルール 22: note-topic-valid
// ─────────────────────────────────────────────

describe('ルール22: note-topic-valid', () => {
  it('正常系: 付箋のtopicIdがblueprintTopicIdsに存在する', () => {
    const q = makeQuestion({ id: 'r110-001' })
    const ctx = makeContext({
      officialNotes: [
        { id: 'fusen-0001', topicId: 'physics-material-structure' },
      ],
      blueprintTopicIds: new Set(['physics-material-structure']),
      questionIds: new Set(['r110-001']),
    })
    const issues = consistencyRules([q], ctx)
    expect(issues.filter(i => i.rule === 'note-topic-valid')).toHaveLength(0)
  })

  it('異常系: 付箋のtopicIdがblueprintTopicIdsに存在しない場合はwarning', () => {
    const q = makeQuestion({ id: 'r110-001' })
    const ctx = makeContext({
      officialNotes: [
        { id: 'fusen-0001', topicId: 'non-existent-topic' },
      ],
      blueprintTopicIds: new Set(['physics-material-structure']),
      questionIds: new Set(['r110-001']),
    })
    const issues = consistencyRules([q], ctx)
    const found = issues.filter(i => i.rule === 'note-topic-valid')
    expect(found.length).toBeGreaterThanOrEqual(1)
    expect(found[0].severity).toBe('warning')
  })

  it('誤検知防止: issueのquestionIdには付箋IDが入る', () => {
    const q = makeQuestion({ id: 'r110-001' })
    const ctx = makeContext({
      officialNotes: [
        { id: 'on-abc-123', topicId: 'bad-topic' },
      ],
      blueprintTopicIds: new Set(['physics-material-structure']),
      questionIds: new Set(['r110-001']),
    })
    const issues = consistencyRules([q], ctx)
    const found = issues.filter(i => i.rule === 'note-topic-valid')
    expect(found.length).toBeGreaterThanOrEqual(1)
    expect(found[0].questionId).toBe('on-abc-123')
  })
})

// ─────────────────────────────────────────────
// ルール 23: image-file-exists
// ─────────────────────────────────────────────

describe('ルール23: image-file-exists', () => {
  it('誤検知防止: image_urlがundefinedの問題はスキップ', () => {
    const q = makeQuestion({ id: 'r110-001', image_url: undefined })
    const ctx = makeContext({ imageDir: '' })
    const issues = consistencyRules([q], ctx)
    expect(issues.filter(i => i.rule === 'image-file-exists')).toHaveLength(0)
  })

  it('誤検知防止: imageDirが空文字の場合はファイルチェックをスキップ', () => {
    const q = makeQuestion({ id: 'r110-001', image_url: '/images/questions/r110-001.png' })
    const ctx = makeContext({ imageDir: '' })
    const issues = consistencyRules([q], ctx)
    expect(issues.filter(i => i.rule === 'image-file-exists')).toHaveLength(0)
  })

  it('異常系: imageDirが設定済みでファイルが存在しない場合はwarning', () => {
    const q = makeQuestion({ id: 'r110-001', image_url: '/images/questions/r110-001.png' })
    // 存在しないディレクトリを指定してファイルが見つからないケース
    const ctx = makeContext({ imageDir: '/non-existent-dir' })
    const issues = consistencyRules([q], ctx)
    const found = issues.filter(i => i.rule === 'image-file-exists')
    expect(found.length).toBeGreaterThanOrEqual(1)
    expect(found[0].severity).toBe('warning')
  })
})

// ─────────────────────────────────────────────
// 複合テスト
// ─────────────────────────────────────────────

describe('複合テスト: 整合性チェック', () => {
  it('全て正しい問題群はエラー・warningを返さない', () => {
    const q = makeQuestion({ id: 'r110-001' })
    const ctx = makeContext()
    const issues = consistencyRules([q], ctx)
    expect(issues.filter(i => i.severity === 'error')).toHaveLength(0)
    expect(issues.filter(i => i.severity === 'warning')).toHaveLength(0)
  })

  it('複数の問題で異なるルール違反が全て検出される', () => {
    const questions = [
      makeQuestion({ id: 'r110-001' }),
      makeQuestion({ id: 'r110-002', question_number: 2 }),
    ]
    const ctx = makeContext({
      topicMap: { 'r110-001': 'physics-material-structure' }, // r110-002はtopicMapにない
      exemplarQuestionIds: new Set(['r110-001']), // r110-002はexemplarMapにない
      questionIds: new Set(['r110-001', 'r110-002']),
    })
    const issues = consistencyRules(questions, ctx)
    expect(issues.some(i => i.rule === 'topic-map-exists' && i.questionId === 'r110-002')).toBe(true)
    expect(issues.some(i => i.rule === 'exemplar-map-exists' && i.questionId === 'r110-002')).toBe(true)
  })
})
