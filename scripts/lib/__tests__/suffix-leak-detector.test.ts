import { describe, it, expect } from 'vitest'
import {
  extractLeakedLines,
  tryMerge,
  detectSuffixLeak,
} from '../suffix-leak-detector'
import type { Choice, LeakDetectionResult } from '../suffix-leak-detector'

// ============================================================
// extractLeakedLines
// ============================================================
describe('extractLeakedLines', () => {
  it('「１つ選べ。」の後の行をリークとして検出する', () => {
    const text = '薬物の作用機序として正しいのはどれか。１つ選べ。\nチャネル活性化\nチャネル遮断'
    const result = extractLeakedLines(text)
    expect(result).not.toBeNull()
    expect(result!.leakedLines).toEqual(['チャネル活性化', 'チャネル遮断'])
    expect(result!.cleanedText).toBe('薬物の作用機序として正しいのはどれか。１つ選べ。')
  })

  it('「２つ選べ。」でも検出する', () => {
    const text = '正しいのはどれか。２つ選べ。\n選択肢A\n選択肢B'
    const result = extractLeakedLines(text)
    expect(result).not.toBeNull()
    expect(result!.leakedLines).toEqual(['選択肢A', '選択肢B'])
  })

  it('「選びなさい」ターミネータでも検出する', () => {
    const text = '正しいものを選びなさい。\nアイテムX\nアイテムY'
    const result = extractLeakedLines(text)
    expect(result).not.toBeNull()
    expect(result!.leakedLines).toEqual(['アイテムX', 'アイテムY'])
  })

  it('「正しい組合せ」ターミネータでも検出する', () => {
    const text = '正しい組合せはどれか。\n阻害\n活性化'
    const result = extractLeakedLines(text)
    expect(result).not.toBeNull()
    expect(result!.leakedLines).toEqual(['阻害', '活性化'])
  })

  it('「誤っているのはどれか」ターミネータでも検出する', () => {
    const text = '誤っているのはどれか。\n阻害\n活性化'
    const result = extractLeakedLines(text)
    expect(result).not.toBeNull()
    expect(result!.leakedLines).toEqual(['阻害', '活性化'])
  })

  it('「誤っているものはどれか」ターミネータでも検出する', () => {
    const text = '誤っているものはどれか。\n阻害\n活性化'
    const result = extractLeakedLines(text)
    expect(result).not.toBeNull()
    expect(result!.leakedLines).toEqual(['阻害', '活性化'])
  })

  it('safe line（ただし）はリークとみなさない', () => {
    const text = '正しいのはどれか。１つ選べ。\nただし、条件は以下とする。'
    const result = extractLeakedLines(text)
    expect(result).toBeNull()
  })

  it('safe line（なお、）はリークとみなさない', () => {
    const text = '正しいのはどれか。１つ選べ。\nなお、体重は60kgとする。'
    const result = extractLeakedLines(text)
    expect(result).toBeNull()
  })

  it('safe line（問\\d+）はリークとみなさない（連問ヘッダー）', () => {
    const text = '正しいのはどれか。１つ選べ。\n問209 次の問題は何か。'
    const result = extractLeakedLines(text)
    expect(result).toBeNull()
  })

  it('safe line（図）はリークとみなさない', () => {
    const text = '正しいのはどれか。１つ選べ。\n図に示すように'
    const result = extractLeakedLines(text)
    expect(result).toBeNull()
  })

  it('safe line（表）はリークとみなさない', () => {
    const text = '正しいのはどれか。１つ選べ。\n表１を参照せよ。'
    const result = extractLeakedLines(text)
    expect(result).toBeNull()
  })

  it('safe line（注）はリークとみなさない', () => {
    const text = '正しいのはどれか。１つ選べ。\n注：特別な条件下で行う。'
    const result = extractLeakedLines(text)
    expect(result).toBeNull()
  })

  it('safe line（ここで）はリークとみなさない', () => {
    const text = '正しいのはどれか。１つ選べ。\nここで、Aは定数である。'
    const result = extractLeakedLines(text)
    expect(result).toBeNull()
  })

  it('safe line（次の）はリークとみなさない', () => {
    const text = '正しいのはどれか。１つ選べ。\n次の文章を読んで答えよ。'
    const result = extractLeakedLines(text)
    expect(result).toBeNull()
  })

  it('safe line（以下）はリークとみなさない', () => {
    const text = '正しいのはどれか。１つ選べ。\n以下の条件で計算せよ。'
    const result = extractLeakedLines(text)
    expect(result).toBeNull()
  })

  it('safe line（下図）はリークとみなさない', () => {
    const text = '正しいのはどれか。１つ選べ。\n下図を参照。'
    const result = extractLeakedLines(text)
    expect(result).toBeNull()
  })

  it('ターミネータがない場合はnullを返す', () => {
    const text = '薬物の作用機序について述べよ。'
    const result = extractLeakedLines(text)
    expect(result).toBeNull()
  })

  it('ターミネータの後に行がない場合はnullを返す', () => {
    const text = '正しいのはどれか。１つ選べ。'
    const result = extractLeakedLines(text)
    expect(result).toBeNull()
  })

  it('タブ文字を含むリーク行はタブが除去される', () => {
    const text = '正しいのはどれか。１つ選べ。\n\tチャネル活性化\n\tチャネル遮断'
    const result = extractLeakedLines(text)
    expect(result).not.toBeNull()
    expect(result!.leakedLines).toEqual(['チャネル活性化', 'チャネル遮断'])
  })

  it('空行を含む場合、空行はスキップされる', () => {
    const text = '正しいのはどれか。１つ選べ。\n\nチャネル活性化\n\nチャネル遮断'
    const result = extractLeakedLines(text)
    expect(result).not.toBeNull()
    expect(result!.leakedLines).toEqual(['チャネル活性化', 'チャネル遮断'])
  })

  it('全角ピリオド（．）でも正しくターミネータを認識する', () => {
    const text = '正しいのはどれか．１つ選べ．\n阻害\n活性化'
    const result = extractLeakedLines(text)
    expect(result).not.toBeNull()
    expect(result!.leakedLines).toEqual(['阻害', '活性化'])
  })

  // ── Issue 1: 連問テキスト (grouped questions) ──

  it('連問テキストで複数ターミネータがある場合はnullを返す', () => {
    // 問232と問233の両方にターミネータがある連問
    const text = [
      '問232-233',
      '以下の症例について問に答えよ。',
      '問232（薬理）',
      '薬物の作用機序として正しいのはどれか。１つ選べ。',
      '問233（病態）',
      '考えられる病態として正しいのはどれか。１つ選べ。',
    ].join('\n')
    const result = extractLeakedLines(text)
    expect(result).toBeNull()
  })

  it('候補行に小問ヘッダー（問NNN（科目）パターン）があればnullを返す', () => {
    // ターミネータは1つだが、後続に小問ヘッダーがある
    const text = [
      '薬物の作用機序として正しいのはどれか。１つ選べ。',
      '問233（病態）',
      '考えられる病態はどれか。',
    ].join('\n')
    const result = extractLeakedLines(text)
    expect(result).toBeNull()
  })

  it('候補行に小問ヘッダー（問NNN スペース区切り）があればnullを返す', () => {
    const text = [
      '薬物の作用機序として正しいのはどれか。１つ選べ。',
      '問234 次の薬物について答えよ。',
    ].join('\n')
    const result = extractLeakedLines(text)
    expect(result).toBeNull()
  })
})

// ============================================================
// tryMerge
// ============================================================
describe('tryMerge', () => {
  it('リーク行数 === 選択肢数 → AUTO_HIGH で接尾辞を結合', () => {
    const leakedLines = ['チャネル活性化', 'チャネル遮断']
    const choices: Choice[] = [
      { key: 1, text: 'K＋' },
      { key: 2, text: 'Na＋' },
    ]
    const result = tryMerge(leakedLines, choices)
    expect(result.confidence).toBe('AUTO_HIGH')
    expect(result.mergedChoices[0].text).toBe('K＋チャネル活性化')
    expect(result.mergedChoices[1].text).toBe('Na＋チャネル遮断')
  })

  it('受容体サフィックスを正しく結合する', () => {
    const leakedLines = ['受容体刺激', '受容体遮断', '受容体活性化']
    const choices: Choice[] = [
      { key: 1, text: 'アドレナリンα₁' },
      { key: 2, text: 'アドレナリンβ₁' },
      { key: 3, text: 'ムスカリンM₃' },
    ]
    const result = tryMerge(leakedLines, choices)
    expect(result.confidence).toBe('AUTO_HIGH')
    expect(result.mergedChoices[0].text).toBe('アドレナリンα₁受容体刺激')
    expect(result.mergedChoices[1].text).toBe('アドレナリンβ₁受容体遮断')
    expect(result.mergedChoices[2].text).toBe('ムスカリンM₃受容体活性化')
  })

  it('リーク行数 === 選択肢数 - 1 → AUTO_MEDIUM', () => {
    const leakedLines = ['チャネル活性化', 'チャネル遮断']
    const choices: Choice[] = [
      { key: 1, text: 'K＋' },
      { key: 2, text: 'Na＋' },
      { key: 3, text: 'Ca²＋チャネル阻害' },
    ]
    const result = tryMerge(leakedLines, choices)
    expect(result.confidence).toBe('AUTO_MEDIUM')
    expect(result.mergedChoices[0].text).toBe('K＋チャネル活性化')
    expect(result.mergedChoices[1].text).toBe('Na＋チャネル遮断')
    expect(result.mergedChoices[2].text).toBe('Ca²＋チャネル阻害') // unchanged
  })

  it('リーク行数と選択肢数が合わない → REVIEW', () => {
    const leakedLines = ['チャネル活性化']
    const choices: Choice[] = [
      { key: 1, text: 'K＋' },
      { key: 2, text: 'Na＋' },
      { key: 3, text: 'Ca²＋' },
    ]
    const result = tryMerge(leakedLines, choices)
    expect(result.confidence).toBe('REVIEW')
  })

  it('40文字を超えるリーク行 → REVIEW', () => {
    const longLine = 'あ'.repeat(41)
    const leakedLines = [longLine, 'チャネル遮断']
    const choices: Choice[] = [
      { key: 1, text: 'K＋' },
      { key: 2, text: 'Na＋' },
    ]
    const result = tryMerge(leakedLines, choices)
    expect(result.confidence).toBe('REVIEW')
  })

  it('結合後に「受容体」が二重になる場合 → REVIEW にダウングレード', () => {
    const leakedLines = ['受容体遮断', '受容体刺激']
    const choices: Choice[] = [
      { key: 1, text: 'アドレナリンα₁受容体' },
      { key: 2, text: 'ムスカリンM₃受容体' },
    ]
    const result = tryMerge(leakedLines, choices)
    // 結合すると「アドレナリンα₁受容体受容体遮断」→ 二重受容体 → REVIEW
    expect(result.confidence).toBe('REVIEW')
  })

  it('結合後に「チャネル」が二重になる場合 → REVIEW にダウングレード', () => {
    const leakedLines = ['チャネル活性化', 'チャネル遮断']
    const choices: Choice[] = [
      { key: 1, text: 'K＋チャネル' },
      { key: 2, text: 'Na＋チャネル' },
    ]
    const result = tryMerge(leakedLines, choices)
    expect(result.confidence).toBe('REVIEW')
  })

  it('結合後に「阻害」が二重になる場合 → REVIEW にダウングレード', () => {
    const leakedLines = ['阻害', '阻害']
    const choices: Choice[] = [
      { key: 1, text: 'COX阻害' },
      { key: 2, text: 'LOX阻害' },
    ]
    const result = tryMerge(leakedLines, choices)
    expect(result.confidence).toBe('REVIEW')
  })

  it('結合後に「ATPase」が二重になる場合 → REVIEW にダウングレード', () => {
    const leakedLines = ['ATPase阻害', 'ATPase活性化']
    const choices: Choice[] = [
      { key: 1, text: 'Na＋/K＋ATPase' },
      { key: 2, text: 'H＋/K＋ATPase' },
    ]
    const result = tryMerge(leakedLines, choices)
    expect(result.confidence).toBe('REVIEW')
  })

  it('結合後に「共輸送体」が二重になる場合 → REVIEW にダウングレード', () => {
    const leakedLines = ['共輸送体阻害', '共輸送体活性化']
    const choices: Choice[] = [
      { key: 1, text: 'Na＋-グルコース共輸送体' },
      { key: 2, text: 'Na＋-Cl⁻共輸送体' },
    ]
    const result = tryMerge(leakedLines, choices)
    expect(result.confidence).toBe('REVIEW')
  })

  it('結合後に「逆輸送体」が二重になる場合 → REVIEW にダウングレード', () => {
    const leakedLines = ['逆輸送体阻害', '逆輸送体活性化']
    const choices: Choice[] = [
      { key: 1, text: 'Na＋/Ca²＋逆輸送体' },
      { key: 2, text: 'Na＋/H＋逆輸送体' },
    ]
    const result = tryMerge(leakedLines, choices)
    expect(result.confidence).toBe('REVIEW')
  })

  it('結合後に「遮断」が二重になる場合 → REVIEW にダウングレード', () => {
    const leakedLines = ['遮断', '遮断']
    const choices: Choice[] = [
      { key: 1, text: 'α₁遮断' },
      { key: 2, text: 'β₁遮断' },
    ]
    const result = tryMerge(leakedLines, choices)
    expect(result.confidence).toBe('REVIEW')
  })

  it('結合後に「刺激」が二重になる場合 → REVIEW にダウングレード', () => {
    const leakedLines = ['刺激', '刺激']
    const choices: Choice[] = [
      { key: 1, text: 'α₁刺激' },
      { key: 2, text: 'β₁刺激' },
    ]
    const result = tryMerge(leakedLines, choices)
    expect(result.confidence).toBe('REVIEW')
  })

  it('結合後に「活性化」が二重になる場合 → REVIEW にダウングレード', () => {
    const leakedLines = ['活性化', '活性化']
    const choices: Choice[] = [
      { key: 1, text: 'AMPK活性化' },
      { key: 2, text: 'mTOR活性化' },
    ]
    const result = tryMerge(leakedLines, choices)
    expect(result.confidence).toBe('REVIEW')
  })

  it('二重サフィックスがない正常ケースではダウングレードされない', () => {
    const leakedLines = ['受容体遮断', '受容体刺激']
    const choices: Choice[] = [
      { key: 1, text: 'アドレナリンα₁' },
      { key: 2, text: 'ムスカリンM₃' },
    ]
    const result = tryMerge(leakedLines, choices)
    expect(result.confidence).toBe('AUTO_HIGH')
    expect(result.mergedChoices[0].text).toBe('アドレナリンα₁受容体遮断')
    expect(result.mergedChoices[1].text).toBe('ムスカリンM₃受容体刺激')
  })

  // ── Issue 2: 非suffix行のAUTO_HIGH昇格防止 ──

  it('全角数字で始まるリーク行（表の行）→ REVIEW にダウングレード', () => {
    const leakedLines = ['１　心拍数増加', '２　血圧低下']
    const choices: Choice[] = [
      { key: 1, text: 'a' },
      { key: 2, text: 'b' },
    ]
    const result = tryMerge(leakedLines, choices)
    expect(result.confidence).toBe('REVIEW')
  })

  it('全角数字２〜６で始まるリーク行も REVIEW', () => {
    for (const num of ['２', '３', '４', '５', '６']) {
      const leakedLines = [`${num}　テスト項目`]
      const choices: Choice[] = [{ key: 1, text: 'X' }]
      const result = tryMerge(leakedLines, choices)
      expect(result.confidence).toBe('REVIEW')
    }
  })

  it('連続スペース（表フォーマット）を含むリーク行 → REVIEW', () => {
    const leakedLines = ['心拍数  120bpm', '血圧  80/50']
    const choices: Choice[] = [
      { key: 1, text: 'パラメータA' },
      { key: 2, text: 'パラメータB' },
    ]
    const result = tryMerge(leakedLines, choices)
    expect(result.confidence).toBe('REVIEW')
  })

  it('全角スペースの連続を含むリーク行 → REVIEW', () => {
    const leakedLines = ['心拍数　　120回/分', '血圧　　80/50']
    const choices: Choice[] = [
      { key: 1, text: 'A' },
      { key: 2, text: 'B' },
    ]
    const result = tryMerge(leakedLines, choices)
    expect(result.confidence).toBe('REVIEW')
  })

  it('句点「。」で終わるリーク行（完全文）→ REVIEW', () => {
    const leakedLines = ['心拍数が増加する。', '血圧が低下する。']
    const choices: Choice[] = [
      { key: 1, text: 'パラメータA' },
      { key: 2, text: 'パラメータB' },
    ]
    const result = tryMerge(leakedLines, choices)
    expect(result.confidence).toBe('REVIEW')
  })

  it('正常なsuffix断片（句点なし・表形式でない）はAUTO_HIGHのまま', () => {
    const leakedLines = ['チャネル活性化', 'チャネル遮断']
    const choices: Choice[] = [
      { key: 1, text: 'K＋' },
      { key: 2, text: 'Na＋' },
    ]
    const result = tryMerge(leakedLines, choices)
    expect(result.confidence).toBe('AUTO_HIGH')
  })
})

// ============================================================
// detectSuffixLeak
// ============================================================
describe('detectSuffixLeak', () => {
  it('r100-028 パターン: リーク行と選択肢を結合してAUTO_HIGHを返す', () => {
    const question = {
      id: 'r100-028',
      question_text:
        '交感神経興奮時の効果器応答として正しいのはどれか。１つ選べ。\nチャネル活性化\nチャネル遮断\n受容体刺激\n受容体遮断\n受容体活性化',
      choices: [
        { key: 1, text: 'K＋' },
        { key: 2, text: 'Na＋' },
        { key: 3, text: 'アドレナリンα₁' },
        { key: 4, text: 'アドレナリンβ₁' },
        { key: 5, text: 'ムスカリンM₃' },
      ],
    }
    const result = detectSuffixLeak(question)
    expect(result).not.toBeNull()
    expect(result!.confidence).toBe('AUTO_HIGH')
    expect(result!.cleanedText).toBe(
      '交感神経興奮時の効果器応答として正しいのはどれか。１つ選べ。'
    )
    expect(result!.mergedChoices).toHaveLength(5)
    expect(result!.mergedChoices[0].text).toBe('K＋チャネル活性化')
    expect(result!.mergedChoices[4].text).toBe('ムスカリンM₃受容体活性化')
  })

  it('正常な問題文（リークなし）はnullを返す', () => {
    const question = {
      id: 'r100-001',
      question_text: '薬物の代謝について正しいのはどれか。１つ選べ。',
      choices: [
        { key: 1, text: '肝臓で代謝される' },
        { key: 2, text: '腎臓で代謝される' },
      ],
    }
    const result = detectSuffixLeak(question)
    expect(result).toBeNull()
  })

  it('選択肢が空の場合はnullを返す', () => {
    const question = {
      id: 'r100-002',
      question_text: '正しいのはどれか。１つ選べ。\nチャネル活性化',
      choices: [],
    }
    const result = detectSuffixLeak(question)
    expect(result).toBeNull()
  })

  it('ターミネータ後にsafe lineのみの場合はnullを返す', () => {
    const question = {
      id: 'r100-003',
      question_text: '正しいのはどれか。１つ選べ。\nただし、条件は以下とする。',
      choices: [
        { key: 1, text: '選択肢A' },
        { key: 2, text: '選択肢B' },
      ],
    }
    const result = detectSuffixLeak(question)
    expect(result).toBeNull()
  })

  it('結果のLeakDetectionResultに必須フィールドが含まれる', () => {
    const question = {
      id: 'r100-028',
      question_text: '正しいのはどれか。１つ選べ。\n活性化\n阻害',
      choices: [
        { key: 1, text: 'COX' },
        { key: 2, text: 'LOX' },
      ],
    }
    const result = detectSuffixLeak(question) as LeakDetectionResult
    expect(result).not.toBeNull()
    expect(result).toHaveProperty('questionId')
    expect(result).toHaveProperty('confidence')
    expect(result).toHaveProperty('cleanedText')
    expect(result).toHaveProperty('mergedChoices')
    expect(result).toHaveProperty('leakedLines')
    expect(result.questionId).toBe('r100-028')
    expect(result.leakedLines).toEqual(['活性化', '阻害'])
  })
})
