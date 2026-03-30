import { describe, it, expect } from 'vitest'
import { OfficialNoteScoringCore, SCORING_WEIGHTS } from '../official-note-scoring-core'
import type { OfficialNote } from '../../types/official-note'
import type { Question } from '../../types/question'

function makeNote(overrides: Partial<OfficialNote> = {}): OfficialNote {
  return {
    id: 'fusen-0001',
    title: 'テスト付箋',
    imageUrl: '/images/test.png',
    textSummary: 'テスト要約',
    subject: '衛生',
    topicId: 'hygiene-nutrition',
    tags: [],
    primaryExemplarIds: [],
    secondaryExemplarIds: [],
    importance: 2,
    tier: 'free',
    ...overrides,
  }
}

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'r100-001',
    year: 100,
    question_number: 1,
    section: '必須',
    subject: '衛生',
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

// mockQEM: ex-hygiene-001=primary, ex-hygiene-002=secondary
const mockQEM = [
  { questionId: 'r100-001', exemplarId: 'ex-hygiene-001', isPrimary: true },
  { questionId: 'r100-001', exemplarId: 'ex-hygiene-002', isPrimary: false },
]

describe('OfficialNoteScoringCore', () => {
  // T1: primary exemplar一致で+2
  it('T1: note.primaryExemplarIdsがquestionのprimary exemplarと一致すると+2点', () => {
    const note = makeNote({ primaryExemplarIds: ['ex-hygiene-001'] })
    const question = makeQuestion()
    const core = new OfficialNoteScoringCore(mockQEM)
    const score = core.score(note, question)
    expect(score).toBeCloseTo(
      SCORING_WEIGHTS.primaryExemplar + 2 * SCORING_WEIGHTS.importance
    )
  })

  // T2: secondary < primary（ex-hygiene-002はsecondary）
  it('T2: secondary一致(+1)はprimary一致(+2)より低スコア', () => {
    const notePrimary = makeNote({ primaryExemplarIds: ['ex-hygiene-001'] })
    const noteSecondary = makeNote({ secondaryExemplarIds: ['ex-hygiene-002'] })
    const question = makeQuestion()
    const core = new OfficialNoteScoringCore(mockQEM)
    const scorePrimary = core.score(notePrimary, question)
    const scoreSecondary = core.score(noteSecondary, question)
    expect(scorePrimary).toBeGreaterThan(scoreSecondary)
    expect(scoreSecondary).toBeCloseTo(
      SCORING_WEIGHTS.secondaryExemplar + 2 * SCORING_WEIGHTS.importance
    )
  })

  // T3: textMatchスコア加算
  it('T3: note.tagsの語がquestion_textに含まれると+0.5/件', () => {
    const note = makeNote({ tags: ['コバラミン', 'ビタミンB12'] })
    const question = makeQuestion({ question_text: 'コバラミンとビタミンB12について' })
    const core = new OfficialNoteScoringCore([])
    const score = core.score(note, question)
    expect(score).toBeCloseTo(
      2 * SCORING_WEIGHTS.textMatch + 2 * SCORING_WEIGHTS.importance
    )
  })

  // T4: question.tagsが空でもクラッシュしない
  it('T4: question.tagsが空配列でもクラッシュしない', () => {
    const note = makeNote()
    const question = makeQuestion({ tags: [] })
    const core = new OfficialNoteScoringCore(mockQEM)
    expect(() => core.score(note, question)).not.toThrow()
  })

  // T5: primaryExemplarIds空の付箋はexemplarスコア0（importanceスコアのみ）
  it('T5: primaryExemplarIdsが空の付箋はexemplarスコア0でimportanceスコアのみ', () => {
    const note = makeNote({ primaryExemplarIds: [], secondaryExemplarIds: [] })
    const question = makeQuestion()
    const core = new OfficialNoteScoringCore(mockQEM)
    const score = core.score(note, question)
    expect(score).toBeCloseTo(2 * SCORING_WEIGHTS.importance)
  })

  // T6: importance降順ソート確認（exemplarなし環境）
  it('T6: exemplarマッチなしのとき importance降順で返る', () => {
    const notes = [
      makeNote({ id: 'n1', importance: 2 }),
      makeNote({ id: 'n2', importance: 4 }),
      makeNote({ id: 'n3', importance: 3 }),
    ]
    const question = makeQuestion({ id: 'no-exemplar-question' })
    const core = new OfficialNoteScoringCore([]) // exemplarなし
    const result = core.topNotes(notes, question, 5)
    expect(result[0].id).toBe('n2') // importance=4が1位
    expect(result[1].id).toBe('n3') // importance=3が2位
  })

  // T6b: フォールバック実際の発動確認（importance=1でfilterを抜けない）
  it('T6b: 全件importance=1のときフォールバックが発動しimportance降順を返す', () => {
    const notes = [
      makeNote({ id: 'n1', importance: 1 }),
      makeNote({ id: 'n2', importance: 1 }),
    ]
    const question = makeQuestion({ id: 'no-match-question' })
    const core = new OfficialNoteScoringCore([])
    const result = core.topNotes(notes, question, 5)
    expect(result).toHaveLength(2) // フォールバックは全件返す
  })

  // T7: note.tagsが空のときtextMatch=0
  it('T7: note.tagsが空のときtextMatchスコアは0', () => {
    const note = makeNote({ tags: [] })
    const question = makeQuestion({ question_text: 'コバラミン' })
    const core = new OfficialNoteScoringCore([])
    const score = core.score(note, question)
    expect(score).toBeCloseTo(2 * SCORING_WEIGHTS.importance)
  })

  // T8: importanceタイブレークがexemplar不一致を逆転しない
  it('T8: importance=4でもexemplar不一致はexemplar一致(importance=2)に勝てない', () => {
    const noteWithExemplar = makeNote({ primaryExemplarIds: ['ex-hygiene-001'], importance: 2 })
    const noteHighImportance = makeNote({ primaryExemplarIds: [], importance: 4 })
    const question = makeQuestion()
    const core = new OfficialNoteScoringCore(mockQEM)
    expect(core.score(noteWithExemplar, question)).toBeGreaterThan(
      core.score(noteHighImportance, question)
    )
  })

  // T9: limit引数で返却件数を変更できる
  it('T9: limit=3のとき3件だけ返る', () => {
    const notes = Array.from({ length: 10 }, (_, i) =>
      makeNote({ id: `n${i}`, primaryExemplarIds: ['ex-hygiene-001'] })
    )
    const question = makeQuestion()
    const core = new OfficialNoteScoringCore(mockQEM)
    expect(core.topNotes(notes, question, 3)).toHaveLength(3)
  })

  // T10: 同一exemplarIdの二重加算防止
  it('T10: questionの同一exemplarIdがprimary/secondary両方にあっても二重加算しない', () => {
    const dupQEM = [
      { questionId: 'r100-001', exemplarId: 'ex-hygiene-001', isPrimary: true },
      { questionId: 'r100-001', exemplarId: 'ex-hygiene-001', isPrimary: false },
    ]
    const note = makeNote({ primaryExemplarIds: ['ex-hygiene-001'] })
    const question = makeQuestion()
    const core = new OfficialNoteScoringCore(dupQEM)
    const score = core.score(note, question)
    // primary一致の+2のみ（二重加算されると+3になる）
    expect(score).toBeCloseTo(
      SCORING_WEIGHTS.primaryExemplar + 2 * SCORING_WEIGHTS.importance
    )
  })

  // T11: limit境界値
  it('T11: limit=0のとき空配列を返す', () => {
    const notes = [makeNote()]
    const question = makeQuestion()
    const core = new OfficialNoteScoringCore(mockQEM)
    expect(core.topNotes(notes, question, 0)).toHaveLength(0)
  })

  // T12: 正解選択肢テキストとのマッチング
  it('T12: note.tagsが正解選択肢テキストと一致するとcorrectAnswerMatchが加算される', () => {
    const note = makeNote({ tags: ['ビタミンB12', 'コバラミン'] })
    const question = makeQuestion({
      choices: [{ key: 1, text: 'ビタミンB1' }, { key: 2, text: 'ビタミンB12' }],
      correct_answer: 2,
    })
    const core = new OfficialNoteScoringCore([])
    const score = core.score(note, question)
    // correctAnswerMatch(1.5) + 2 * importance(0.02)
    expect(score).toBeCloseTo(SCORING_WEIGHTS.correctAnswerMatch + 2 * SCORING_WEIGHTS.importance)
  })

  // T13: 短いタグ（4文字以下）は reverse match しない（誤マッチ防止）
  it('T13: 正解「ビタミンB12」に対しタグ「ビタミン」(4文字)はcorrectAnswerMatchしない', () => {
    const noteGeneric = makeNote({ tags: ['ビタミン'] })   // 4文字 → reverse matchしない
    const noteSpecific = makeNote({ tags: ['ビタミンB12'] }) // exact match → する
    const question = makeQuestion({
      choices: [{ key: 1, text: 'ビタミンB12' }],
      correct_answer: 1,
    })
    const core = new OfficialNoteScoringCore([])
    expect(core.score(noteGeneric, question)).toBeCloseTo(2 * SCORING_WEIGHTS.importance)
    expect(core.score(noteSpecific, question)).toBeCloseTo(
      SCORING_WEIGHTS.correctAnswerMatch + 2 * SCORING_WEIGHTS.importance
    )
  })
})
