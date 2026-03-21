import { describe, it, expect } from 'vitest'
import { extractKeywords, calculateSimilarity } from '../keyword-matcher'

describe('extractKeywords', () => {
  it('定型フレーズを除去してキーワードを抽出する', () => {
    const text = 'エンドサイトーシスとエキソサイトーシスについて説明できる。'
    const keywords = extractKeywords(text)
    expect(keywords).toContain('エンドサイトーシス')
    expect(keywords).toContain('エキソサイトーシス')
    expect(keywords).not.toContain('説明できる')
    expect(keywords).not.toContain('について')
  })

  it('短すぎるテキスト（10文字未満）は空配列を返す', () => {
    expect(extractKeywords('短い文')).toEqual([])
  })
})

describe('calculateSimilarity', () => {
  it('完全一致で高スコアを返す', () => {
    const exemplarKeywords = ['エンドサイトーシス', 'エキソサイトーシス']
    const questionText = 'エンドサイトーシスとエキソサイトーシスの違いを述べよ'
    const concepts = ['エンドサイトーシス', 'エキソサイトーシス']
    const result = calculateSimilarity(exemplarKeywords, questionText, '', concepts, [])
    expect(result.score).toBeLessThanOrEqual(1.0)
    expect(result.score).toBeGreaterThan(0.5)
    expect(result.matchedKeywords).toContain('エンドサイトーシス')
  })

  it('一致なしで0を返す', () => {
    const exemplarKeywords = ['エンドサイトーシス']
    const result = calculateSimilarity(exemplarKeywords, '全く関係ないテキスト', '', [], [])
    expect(result.score).toBe(0)
    expect(result.matchedKeywords).toHaveLength(0)
  })

  it('question_concepts の一致は2倍の重み', () => {
    const exemplarKeywords = ['エンドサイトーシス', 'エキソサイトーシス']
    // concepts経由のみで一致（1/2キーワード × 2倍 = score 1.0）
    const r1 = calculateSimilarity(exemplarKeywords, '', '', ['エンドサイトーシス'], [])
    // question_text経由のみで一致（1/2キーワード × 1倍 = score 0.5）
    const r2 = calculateSimilarity(exemplarKeywords, 'エンドサイトーシス', '', [], [])
    expect(r1.score).toBeGreaterThan(r2.score)
  })

  it('スコアは1.0を超えない（concepts 2倍加算でもクリップ）', () => {
    const exemplarKeywords = ['糖尿病']
    // concepts一致で2倍 → rawScore=2.0 → Math.min で1.0にクリップ
    const result = calculateSimilarity(
      exemplarKeywords,
      '糖尿病の治療',
      '糖尿病の解説',
      ['糖尿病', '糖尿病合併症'],
      ['糖尿病薬'],
    )
    expect(result.score).toBe(1.0)
  })
})
