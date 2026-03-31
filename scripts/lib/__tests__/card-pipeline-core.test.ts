import { describe, it, expect } from 'vitest'
import {
  filterTargetExemplars,
  classifyTier,
  buildExemplarContext,
  formatContextForPrompt,
} from '../card-pipeline-core'
import type { ExemplarStats, Exemplar, QuestionExemplarMapping } from '../../../src/types/blueprint'
import type { Question } from '../../../src/types/question'
import type { OfficialNote } from '../../../src/types/official-note'
import type { ExemplarContext } from '../card-pipeline-types'

// ──────────────────────────────────────────────
// テストデータファクトリ
// ──────────────────────────────────────────────

function makeStats(overrides: Partial<ExemplarStats> & { exemplarId: string }): ExemplarStats {
  return {
    subject: '物理',
    yearsAppeared: 0,
    totalQuestions: 0,
    yearDetails: [],
    primaryQuestions: 0,
    secondaryQuestions: 0,
    primaryYearsAppeared: 0,
    linkedGroupCount: 0,
    avgQuestionsPerYear: 0,
    ...overrides,
  }
}

function makeExemplar(overrides: Partial<Exemplar> & { id: string }): Exemplar {
  return {
    minorCategory: '小項目',
    middleCategoryId: 'topic-001',
    subject: '物理',
    text: 'テスト例示のテキスト',
    ...overrides,
  }
}

function makeMapping(overrides: Partial<QuestionExemplarMapping> & { questionId: string; exemplarId: string }): QuestionExemplarMapping {
  return {
    isPrimary: true,
    ...overrides,
  }
}

function makeQuestion(overrides: Partial<Question> & { id: string; year: number }): Question {
  return {
    question_number: 1,
    section: '必須',
    subject: '物理',
    category: 'テスト',
    question_text: 'テスト問題文',
    choices: [
      { key: 1, text: '選択肢1' },
      { key: 2, text: '選択肢2' },
    ],
    correct_answer: 1,
    explanation: 'テスト解説',
    tags: [],
    ...overrides,
  }
}

function makeNote(overrides: Partial<OfficialNote> & { id: string }): OfficialNote {
  return {
    title: 'テスト付箋',
    imageUrl: '/images/test.png',
    textSummary: 'テストサマリー',
    subject: '物理',
    topicId: 'topic-001',
    tags: [],
    primaryExemplarIds: [],
    secondaryExemplarIds: [],
    importance: 3,
    tier: 'free',
    ...overrides,
  }
}

// ──────────────────────────────────────────────
// classifyTier
// ──────────────────────────────────────────────

describe('classifyTier', () => {
  it('6年以上は frequent', () => {
    expect(classifyTier(6)).toBe('frequent')
    expect(classifyTier(10)).toBe('frequent')
    expect(classifyTier(12)).toBe('frequent')
  })

  it('4-5年は regular', () => {
    expect(classifyTier(4)).toBe('regular')
    expect(classifyTier(5)).toBe('regular')
  })

  it('2-3年は selective', () => {
    expect(classifyTier(2)).toBe('selective')
    expect(classifyTier(3)).toBe('selective')
  })

  it('0-1年は null（対象外）', () => {
    expect(classifyTier(0)).toBeNull()
    expect(classifyTier(1)).toBeNull()
  })
})

// ──────────────────────────────────────────────
// filterTargetExemplars
// ──────────────────────────────────────────────

describe('filterTargetExemplars', () => {
  const stats: ExemplarStats[] = [
    makeStats({ exemplarId: 'ex-001', yearsAppeared: 8, subject: '物理' }),
    makeStats({ exemplarId: 'ex-002', yearsAppeared: 5, subject: '化学' }),
    makeStats({ exemplarId: 'ex-003', yearsAppeared: 3, subject: '生物' }),
    makeStats({ exemplarId: 'ex-004', yearsAppeared: 1, subject: '薬理' }),
    makeStats({ exemplarId: 'ex-005', yearsAppeared: 4, subject: '衛生' }),
  ]

  it('デフォルト（minYears=4）: 4年以上のみ返す', () => {
    const result = filterTargetExemplars(stats)
    expect(result).toHaveLength(3)
    expect(result.map(r => r.exemplarId)).toEqual(['ex-001', 'ex-002', 'ex-005'])
  })

  it('minYears=2 で 2年以上を含む', () => {
    const result = filterTargetExemplars(stats, { minYears: 2 })
    expect(result).toHaveLength(4)
    expect(result.map(r => r.exemplarId)).toEqual(['ex-001', 'ex-002', 'ex-003', 'ex-005'])
  })

  it('結果に tier と maxAtoms が含まれる', () => {
    const result = filterTargetExemplars(stats)
    const ex001 = result.find(r => r.exemplarId === 'ex-001')!
    expect(ex001.tier).toBe('frequent')
    expect(ex001.maxAtoms).toBe(15)

    const ex002 = result.find(r => r.exemplarId === 'ex-002')!
    expect(ex002.tier).toBe('regular')
    expect(ex002.maxAtoms).toBe(8)
  })

  it('結果に subject と yearsAppeared が含まれる', () => {
    const result = filterTargetExemplars(stats)
    const ex001 = result.find(r => r.exemplarId === 'ex-001')!
    expect(ex001.subject).toBe('物理')
    expect(ex001.yearsAppeared).toBe(8)
  })

  it('空配列を渡すと空配列を返す', () => {
    const result = filterTargetExemplars([])
    expect(result).toEqual([])
  })
})

// ──────────────────────────────────────────────
// buildExemplarContext
// ──────────────────────────────────────────────

describe('buildExemplarContext', () => {
  const exemplars: Exemplar[] = [
    makeExemplar({ id: 'ex-001', text: '化学結合の様式について説明できる。', subject: '物理' }),
  ]

  const mappings: QuestionExemplarMapping[] = [
    makeMapping({ questionId: 'r110-001', exemplarId: 'ex-001', isPrimary: true }),
    makeMapping({ questionId: 'r108-005', exemplarId: 'ex-001', isPrimary: false }),
  ]

  const questions: Question[] = [
    makeQuestion({ id: 'r110-001', year: 110, question_text: '110回の問題' }),
    makeQuestion({ id: 'r108-005', year: 108, question_text: '108回の問題' }),
  ]

  const notes: OfficialNote[] = [
    makeNote({
      id: 'fusen-0001',
      title: '化学結合メモ',
      textSummary: '結合の種類まとめ',
      primaryExemplarIds: ['ex-001'],
      secondaryExemplarIds: [],
      noteType: 'knowledge',
    }),
    makeNote({
      id: 'fusen-0002',
      title: '関連メモ',
      textSummary: '補足情報',
      primaryExemplarIds: [],
      secondaryExemplarIds: ['ex-001'],
    }),
  ]

  it('exemplar の問題と付箋を集約する', () => {
    const ctx = buildExemplarContext(
      'ex-001', 'frequent', 15,
      exemplars, mappings, questions, notes,
    )

    expect(ctx.exemplarId).toBe('ex-001')
    expect(ctx.exemplarText).toBe('化学結合の様式について説明できる。')
    expect(ctx.subject).toBe('物理')
    expect(ctx.tier).toBe('frequent')
    expect(ctx.maxAtoms).toBe(15)
    expect(ctx.questions).toHaveLength(2)
    expect(ctx.notes).toHaveLength(2)
  })

  it('問題は年度順にソートされる', () => {
    const ctx = buildExemplarContext(
      'ex-001', 'frequent', 15,
      exemplars, mappings, questions, notes,
    )

    expect(ctx.questions[0].year).toBe(108)
    expect(ctx.questions[1].year).toBe(110)
  })

  it('isPrimary フラグが保持される', () => {
    const ctx = buildExemplarContext(
      'ex-001', 'frequent', 15,
      exemplars, mappings, questions, notes,
    )

    const q110 = ctx.questions.find(q => q.id === 'r110-001')!
    expect(q110.isPrimary).toBe(true)

    const q108 = ctx.questions.find(q => q.id === 'r108-005')!
    expect(q108.isPrimary).toBe(false)
  })

  it('紐づく問題が0件でも動作する', () => {
    const ctx = buildExemplarContext(
      'ex-001', 'regular', 8,
      exemplars, [], questions, notes,
    )

    expect(ctx.questions).toEqual([])
    expect(ctx.notes).toHaveLength(2)
  })

  it('付箋の noteType が NoteSummary に含まれる', () => {
    const ctx = buildExemplarContext(
      'ex-001', 'frequent', 15,
      exemplars, mappings, questions, notes,
    )

    const note1 = ctx.notes.find(n => n.id === 'fusen-0001')!
    expect(note1.noteType).toBe('knowledge')

    const note2 = ctx.notes.find(n => n.id === 'fusen-0002')!
    expect(note2.noteType).toBeUndefined()
  })
})

// ──────────────────────────────────────────────
// formatContextForPrompt
// ──────────────────────────────────────────────

describe('formatContextForPrompt', () => {
  it('exemplar 情報 + 問題 + 付箋をマークダウンで出力する', () => {
    const ctx: ExemplarContext = {
      exemplarId: 'ex-001',
      subject: '物理',
      exemplarText: '化学結合の様式について説明できる。',
      tier: 'frequent',
      maxAtoms: 15,
      questions: [
        {
          id: 'r108-005',
          year: 108,
          questionText: '108回の問題',
          choices: ['1. 選択肢A', '2. 選択肢B'],
          correctAnswer: 1,
          explanation: '解説テキスト',
          isPrimary: false,
        },
      ],
      notes: [
        {
          id: 'fusen-0001',
          title: '化学結合メモ',
          textSummary: '結合の種類まとめ',
          noteType: 'knowledge',
        },
      ],
    }

    const output = formatContextForPrompt(ctx)

    // ヘッダー
    expect(output).toContain('## Exemplar: ex-001')
    expect(output).toContain('化学結合の様式について説明できる。')
    expect(output).toContain('物理')
    expect(output).toContain('frequent')

    // 過去問セクション
    expect(output).toContain('### 過去問')
    expect(output).toContain('第108回')
    expect(output).toContain('108回の問題')
    expect(output).toContain('選択肢A')

    // 付箋セクション
    expect(output).toContain('### 付箋メモ')
    expect(output).toContain('化学結合メモ')
    expect(output).toContain('結合の種類まとめ')
  })

  it('問題が0件の場合、過去問セクションを出力しない', () => {
    const ctx: ExemplarContext = {
      exemplarId: 'ex-002',
      subject: '化学',
      exemplarText: 'テスト例示',
      tier: 'regular',
      maxAtoms: 8,
      questions: [],
      notes: [
        {
          id: 'fusen-0010',
          title: 'メモ',
          textSummary: 'サマリー',
        },
      ],
    }

    const output = formatContextForPrompt(ctx)

    expect(output).not.toContain('### 過去問')
    expect(output).toContain('### 付箋メモ')
  })

  it('付箋が0件の場合、付箋セクションを出力しない', () => {
    const ctx: ExemplarContext = {
      exemplarId: 'ex-003',
      subject: '生物',
      exemplarText: 'テスト例示',
      tier: 'selective',
      maxAtoms: 3,
      questions: [
        {
          id: 'r110-001',
          year: 110,
          questionText: 'テスト',
          choices: ['1. A'],
          correctAnswer: 1,
          explanation: '解説',
          isPrimary: true,
        },
      ],
      notes: [],
    }

    const output = formatContextForPrompt(ctx)

    expect(output).toContain('### 過去問')
    expect(output).not.toContain('### 付箋メモ')
  })
})
