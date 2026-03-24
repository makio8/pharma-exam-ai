// src/utils/__tests__/extract-question-body.test.ts
import { describe, it, expect } from 'vitest'
import { extractQuestionBody } from '../extract-question-body'

describe('extractQuestionBody', () => {
  it('シナリオ部分を除去して問題文を返す', () => {
    const text = 'シナリオ文\n問196（実務）\n質問文196\n問197（実務）\n質問文197'
    const result = extractQuestionBody(text, 196, 'シナリオ文')
    expect(result).toBe('質問文196')
  })

  it('シナリオなし: マーカーで分割して該当問番号を抽出', () => {
    const text = '問196（実務）\n質問文196\n問197（実務）\n質問文197'
    const result = extractQuestionBody(text, 197, '')
    expect(result).toBe('質問文197')
  })

  it('マーカーなし: ヘッダー除去してテキスト全体を返す', () => {
    const text = '問1（必須）\nシンプルな問題文'
    const result = extractQuestionBody(text, 1, '')
    expect(result).toBe('シンプルな問題文')
  })

  it('自分のマーカーがない場合: 最初のマーカー手前を返す', () => {
    const text = '前文テキスト（20文字以上の十分な長さのテキスト）\n問197（実務）\n質問文197'
    const result = extractQuestionBody(text, 196, '')
    expect(result).toBe('前文テキスト（20文字以上の十分な長さのテキスト）')
  })

  it('空のシナリオ: 正しく処理される', () => {
    const text = '問196（実務）\n質問文'
    const result = extractQuestionBody(text, 196, '')
    expect(result).toBe('質問文')
  })
})
