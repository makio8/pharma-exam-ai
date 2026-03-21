import { describe, it, expect } from 'vitest'
import { computeExemplarStats } from '../exemplar-stats-core'
import type { QuestionExemplarMapping } from '../../../src/types/blueprint'
import type { Question } from '../../../src/types/question'

// テスト用の最小データ
const mockExemplars = [
  { id: 'ex-test-001', minorCategory: 'テスト', middleCategoryId: 'test-cat', subject: '物理' as const, text: 'テスト例示1' },
  { id: 'ex-test-002', minorCategory: 'テスト', middleCategoryId: 'test-cat', subject: '物理' as const, text: 'テスト例示2' },
  { id: 'ex-test-003', minorCategory: 'テスト', middleCategoryId: 'test-cat', subject: '化学' as const, text: '未使用例示' },
]

const mockMappings: QuestionExemplarMapping[] = [
  { questionId: 'r100-001', exemplarId: 'ex-test-001', isPrimary: true },
  { questionId: 'r100-002', exemplarId: 'ex-test-001', isPrimary: true },
  { questionId: 'r100-002', exemplarId: 'ex-test-002', isPrimary: false },
  { questionId: 'r101-001', exemplarId: 'ex-test-001', isPrimary: true },
  { questionId: 'r101-001', exemplarId: 'ex-test-002', isPrimary: false },
]

const mockQuestions: Pick<Question, 'id' | 'year' | 'linked_group'>[] = [
  { id: 'r100-001', year: 100, linked_group: undefined },
  { id: 'r100-002', year: 100, linked_group: 'group-A' },
  { id: 'r101-001', year: 101, linked_group: 'group-A' },
]

describe('computeExemplarStats', () => {
  const results = computeExemplarStats(mockExemplars, mockMappings, mockQuestions)

  it('全例示分の結果を返す（未使用含む）', () => {
    expect(results).toHaveLength(3)
  })

  it('totalQuestions はマッピング件数ベース', () => {
    const stat1 = results.find(s => s.exemplarId === 'ex-test-001')!
    expect(stat1.totalQuestions).toBe(3)
    expect(stat1.primaryQuestions).toBe(3)
    expect(stat1.secondaryQuestions).toBe(0)
  })

  it('yearsAppeared は出題年度のユニーク数', () => {
    const stat1 = results.find(s => s.exemplarId === 'ex-test-001')!
    expect(stat1.yearsAppeared).toBe(2)
    expect(stat1.yearDetails).toEqual([
      { year: 100, count: 2 },
      { year: 101, count: 1 },
    ])
  })

  it('secondary のみの例示も正しく集計', () => {
    const stat2 = results.find(s => s.exemplarId === 'ex-test-002')!
    expect(stat2.totalQuestions).toBe(2)
    expect(stat2.primaryQuestions).toBe(0)
    expect(stat2.secondaryQuestions).toBe(2)
    expect(stat2.primaryYearsAppeared).toBe(0)
  })

  it('未使用例示は totalQuestions=0', () => {
    const stat3 = results.find(s => s.exemplarId === 'ex-test-003')!
    expect(stat3.totalQuestions).toBe(0)
    expect(stat3.yearsAppeared).toBe(0)
    expect(stat3.avgQuestionsPerYear).toBe(0)
    expect(stat3.linkedGroupCount).toBe(0)
  })

  it('avgQuestionsPerYear が正しい', () => {
    const stat1 = results.find(s => s.exemplarId === 'ex-test-001')!
    expect(stat1.avgQuestionsPerYear).toBe(1.5)
  })

  it('linkedGroupCount は連問を1ケースとして数える', () => {
    const stat1 = results.find(s => s.exemplarId === 'ex-test-001')!
    // r100-001(no group=1), r100-002(group-A Y100), r101-001(group-A Y101) → 3 unique keys
    expect(stat1.linkedGroupCount).toBe(3)
  })

  it('subject がセットされる', () => {
    const stat1 = results.find(s => s.exemplarId === 'ex-test-001')!
    expect(stat1.subject).toBe('物理')
  })
})
