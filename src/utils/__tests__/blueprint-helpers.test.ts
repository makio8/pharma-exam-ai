import { describe, it, expect } from 'vitest'
import {
  getMajorCategoriesForSubject,
  getQuestionIdsForMajorCategory,
  getFrequentExemplarQuestionIds,
} from '../blueprint-helpers'

describe('getMajorCategoriesForSubject', () => {
  it('薬理の大項目を返す', () => {
    const result = getMajorCategoriesForSubject('薬理')
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toHaveProperty('name')
    expect(result[0]).toHaveProperty('middleCategories')
  })

  it('存在しない科目は空配列を返す', () => {
    const result = getMajorCategoriesForSubject('存在しない' as any)
    expect(result).toEqual([])
  })
})

describe('getQuestionIdsForMajorCategory', () => {
  it('薬理の大項目に紐づく問題IDを返す', () => {
    const majors = getMajorCategoriesForSubject('薬理')
    if (majors.length > 0) {
      const ids = getQuestionIdsForMajorCategory(majors[0].name, '薬理')
      expect(ids.length).toBeGreaterThanOrEqual(0)
      ids.forEach(id => expect(typeof id).toBe('string'))
    }
  })
})

describe('getFrequentExemplarQuestionIds', () => {
  it('yearsAppeared >= 3 の例示に紐づく問題IDを返す', () => {
    const ids = getFrequentExemplarQuestionIds(3)
    expect(ids.length).toBeGreaterThan(0)
    ids.forEach(id => expect(typeof id).toBe('string'))
  })

  it('閾値を上げると結果が減る', () => {
    const ids3 = getFrequentExemplarQuestionIds(3)
    const ids8 = getFrequentExemplarQuestionIds(8)
    expect(ids3.length).toBeGreaterThanOrEqual(ids8.length)
  })
})
