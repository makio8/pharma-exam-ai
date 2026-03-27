import { describe, it, expect } from 'vitest'
import { noteValidationRules } from '../rules/note-validation'
import type { ValidationContext } from '../types'
import type { Exemplar } from '../../../types/blueprint'

const testExemplars: Exemplar[] = [
  { id: 'ex-physics-001', minorCategory: '化学結合', middleCategoryId: 'physics-material-structure', subject: '物理', text: '化学結合の様式について説明できる。' },
  { id: 'ex-chemistry-001', minorCategory: '基本性質', middleCategoryId: 'chemistry-basic-properties', subject: '化学', text: '基本性質を説明できる。' },
]

const baseContext: ValidationContext = {
  topicMap: {},
  blueprintTopicIds: new Set(['physics-material-structure', 'chemistry-basic-properties']),
  exemplarQuestionIds: new Set(),
  officialNotes: [],
  questionIds: new Set(),
  imageDir: '',
  exemplars: testExemplars,
  officialNotesWithExemplars: [],
}

describe('note-exemplar-exists', () => {
  it('存在するexemplarIdはエラーなし', () => {
    const ctx: ValidationContext = {
      ...baseContext,
      officialNotesWithExemplars: [
        { id: 'fusen-0001', exemplarIds: ['ex-physics-001'], subject: '物理', topicId: 'physics-material-structure' },
      ],
    }
    const issues = noteValidationRules([], ctx)
    const exists = issues.filter(i => i.rule === 'note-exemplar-exists')
    expect(exists).toHaveLength(0)
  })

  it('存在しないexemplarIdはerror', () => {
    const ctx: ValidationContext = {
      ...baseContext,
      officialNotesWithExemplars: [
        { id: 'fusen-0001', exemplarIds: ['ex-nonexistent'], subject: '物理', topicId: 'physics-material-structure' },
      ],
    }
    const issues = noteValidationRules([], ctx)
    const exists = issues.filter(i => i.rule === 'note-exemplar-exists')
    expect(exists).toHaveLength(1)
    expect(exists[0].severity).toBe('error')
  })
})

describe('note-exemplar-no-duplicates', () => {
  it('重複なしはエラーなし', () => {
    const ctx: ValidationContext = {
      ...baseContext,
      officialNotesWithExemplars: [
        { id: 'fusen-0001', exemplarIds: ['ex-physics-001', 'ex-chemistry-001'], subject: '物理', topicId: 'physics-material-structure' },
      ],
    }
    const issues = noteValidationRules([], ctx).filter(i => i.rule === 'note-exemplar-no-duplicates')
    expect(issues).toHaveLength(0)
  })

  it('重複ありはerror', () => {
    const ctx: ValidationContext = {
      ...baseContext,
      officialNotesWithExemplars: [
        { id: 'fusen-0001', exemplarIds: ['ex-physics-001', 'ex-physics-001'], subject: '物理', topicId: 'physics-material-structure' },
      ],
    }
    const issues = noteValidationRules([], ctx).filter(i => i.rule === 'note-exemplar-no-duplicates')
    expect(issues).toHaveLength(1)
    expect(issues[0].severity).toBe('error')
  })
})

describe('note-exemplar-subject-match', () => {
  it('subject一致はwarningなし', () => {
    const ctx: ValidationContext = {
      ...baseContext,
      officialNotesWithExemplars: [
        { id: 'fusen-0001', exemplarIds: ['ex-physics-001'], subject: '物理', topicId: 'physics-material-structure' },
      ],
    }
    const issues = noteValidationRules([], ctx).filter(i => i.rule === 'note-exemplar-subject-match')
    expect(issues).toHaveLength(0)
  })

  it('subject不一致はwarning', () => {
    const ctx: ValidationContext = {
      ...baseContext,
      officialNotesWithExemplars: [
        { id: 'fusen-0001', exemplarIds: ['ex-chemistry-001'], subject: '物理', topicId: 'physics-material-structure' },
      ],
    }
    const issues = noteValidationRules([], ctx).filter(i => i.rule === 'note-exemplar-subject-match')
    expect(issues).toHaveLength(1)
    expect(issues[0].severity).toBe('warning')
  })
})

describe('note-exemplar-topic-match', () => {
  it('topicId一致はwarningなし', () => {
    const ctx: ValidationContext = {
      ...baseContext,
      officialNotesWithExemplars: [
        { id: 'fusen-0001', exemplarIds: ['ex-physics-001'], subject: '物理', topicId: 'physics-material-structure' },
      ],
    }
    const issues = noteValidationRules([], ctx).filter(i => i.rule === 'note-exemplar-topic-match')
    expect(issues).toHaveLength(0)
  })

  it('topicId不一致はwarning', () => {
    const ctx: ValidationContext = {
      ...baseContext,
      officialNotesWithExemplars: [
        { id: 'fusen-0001', exemplarIds: ['ex-chemistry-001'], subject: '化学', topicId: 'physics-material-structure' },
      ],
    }
    const issues = noteValidationRules([], ctx).filter(i => i.rule === 'note-exemplar-topic-match')
    expect(issues).toHaveLength(1)
    expect(issues[0].severity).toBe('warning')
  })
})

describe('note-has-exemplars', () => {
  it('exemplarIds未設定はinfo', () => {
    const ctx: ValidationContext = {
      ...baseContext,
      officialNotesWithExemplars: [
        { id: 'fusen-0001', exemplarIds: undefined, subject: '物理', topicId: 'physics-material-structure' },
      ],
    }
    const issues = noteValidationRules([], ctx).filter(i => i.rule === 'note-has-exemplars')
    expect(issues).toHaveLength(1)
    expect(issues[0].severity).toBe('info')
  })

  it('空配列もinfo', () => {
    const ctx: ValidationContext = {
      ...baseContext,
      officialNotesWithExemplars: [
        { id: 'fusen-0001', exemplarIds: [], subject: '物理', topicId: 'physics-material-structure' },
      ],
    }
    const issues = noteValidationRules([], ctx).filter(i => i.rule === 'note-has-exemplars')
    expect(issues).toHaveLength(1)
  })
})
