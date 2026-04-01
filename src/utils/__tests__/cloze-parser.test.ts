import { describe, it, expect } from 'vitest'
import { parseCloze, sanitizeHtml } from '../cloze-parser'

describe('sanitizeHtml', () => {
  it('& を &amp; に変換する', () => {
    expect(sanitizeHtml('A & B')).toBe('A &amp; B')
  })

  it('< を &lt; に変換する', () => {
    expect(sanitizeHtml('<tag>')).toBe('&lt;tag&gt;')
  })

  it('" を &quot; に変換する', () => {
    expect(sanitizeHtml('"hello"')).toBe('&quot;hello&quot;')
  })

  it('複数の特殊文字を同時に変換する', () => {
    expect(sanitizeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })
})

describe('parseCloze', () => {
  // テストケース1: 基本
  it('1: 基本 — c1が[____]に、裏面が**答え**になる', () => {
    const result = parseCloze('タンパク質の{{c1::一次構造}}はアミノ酸配列である')
    expect(result.frontHtml).toBe('タンパク質の[____]はアミノ酸配列である')
    expect(result.backHtml).toBe('タンパク質の**一次構造**はアミノ酸配列である')
    expect(result.blanks).toHaveLength(1)
    expect(result.blanks[0]).toEqual({ index: 1, answer: '一次構造' })
    expect(result.hasError).toBe(false)
  })

  // テストケース2: 化学式
  it('2: 化学式 — HCO3- が正しく取得される', () => {
    const result = parseCloze('重炭酸イオンの化学式は{{c1::HCO3-}}である')
    expect(result.blanks[0].answer).toBe('HCO3-')
    expect(result.hasError).toBe(false)
  })

  // テストケース3: イオン
  it('3: イオン — Ca2+ が正しく処理される', () => {
    const result = parseCloze('{{c1::Ca2+}}は細胞外液に多い')
    expect(result.blanks[0].answer).toBe('Ca2+')
    expect(result.frontHtml).toBe('[____]は細胞外液に多い')
    expect(result.hasError).toBe(false)
  })

  // テストケース4: 酵素
  it('4: 酵素名 — Na+/K+-ATPase が正しく処理される', () => {
    const result = parseCloze('{{c1::Na+/K+-ATPase}}はナトリウムを細胞外へ排出する')
    expect(result.blanks[0].answer).toBe('Na+/K+-ATPase')
    expect(result.hasError).toBe(false)
  })

  // テストケース5: ギリシャ文字
  it('5: ギリシャ文字 — β-ラクタムが正しく処理される', () => {
    const result = parseCloze('{{c1::β-ラクタム}}系抗菌薬はペニシリン結合タンパクに作用する')
    expect(result.blanks[0].answer).toBe('β-ラクタム')
    expect(result.hasError).toBe(false)
  })

  // テストケース6: 複数穴
  it('6: 複数穴 — c1は[____]、c2はテキスト表示', () => {
    const result = parseCloze('{{c1::A}}と{{c2::B}}')
    expect(result.frontHtml).toBe('[____]とB')
    expect(result.backHtml).toBe('**A**とB')
    expect(result.blanks).toHaveLength(1)
    expect(result.blanks[0]).toEqual({ index: 1, answer: 'A' })
    expect(result.hasError).toBe(false)
  })

  // テストケース7: 空cloze
  it('7: 空cloze — hasError=true を返す', () => {
    const result = parseCloze('空欄{{c1::}}テスト')
    expect(result.hasError).toBe(true)
    expect(result.blanks).toHaveLength(0)
  })

  // テストケース8: clozeなし
  it('8: clozeなし — 入力テキストをそのまま返す', () => {
    const text = '普通のテキスト'
    const result = parseCloze(text)
    expect(result.frontHtml).toBe(text)
    expect(result.backHtml).toBe(text)
    expect(result.blanks).toHaveLength(0)
    expect(result.hasError).toBe(false)
  })

  // テストケース9: ネスト
  it('9: ネスト — hasError=true を返す', () => {
    const result = parseCloze('{{c1::A{{c2::B}}}}')
    expect(result.hasError).toBe(true)
    expect(result.blanks).toHaveLength(0)
  })

  // テストケース10: XSS
  it('10: XSS — answerの<script>がエスケープされる', () => {
    const result = parseCloze('{{c1::<script>alert(1)</script>}}')
    expect(result.hasError).toBe(false)
    // answer には HTMLエスケープ済みの文字列が入る
    expect(result.blanks[0].answer).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
    // frontHtml に生の <script> タグが含まれてはならない
    expect(result.frontHtml).not.toContain('<script>')
    expect(result.backHtml).not.toContain('<script>')
    // backHtml は **エスケープ済みanswer** でラップ
    expect(result.backHtml).toBe('**&lt;script&gt;alert(1)&lt;/script&gt;**')
  })

  // テストケース11: CO2, H2SO4 — 数字連続パターン
  it('11: CO2 — 数字連続パターンが正しく処理される', () => {
    const result1 = parseCloze('二酸化炭素の化学式は{{c1::CO2}}である')
    expect(result1.blanks[0].answer).toBe('CO2')
    expect(result1.hasError).toBe(false)

    const result2 = parseCloze('硫酸の化学式は{{c1::H2SO4}}である')
    expect(result2.blanks[0].answer).toBe('H2SO4')
    expect(result2.hasError).toBe(false)
  })

  // 追加: clozeなしテキストのXSS
  it('clozeなしテキストにHTMLが含まれる場合もエスケープされる', () => {
    const result = parseCloze('<b>太字</b>テスト')
    expect(result.frontHtml).toBe('&lt;b&gt;太字&lt;/b&gt;テスト')
    expect(result.backHtml).toBe('&lt;b&gt;太字&lt;/b&gt;テスト')
    expect(result.hasError).toBe(false)
  })
})
