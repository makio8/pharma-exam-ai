// src/utils/learning-link-service.ts
// 演習・付箋・暗記カードを Exemplar ハブ経由で相互接続する逆引きサービス。
// コンストラクタで6種の Map を構築し、参照メソッドは O(1) ルックアップ。

import type { FlashCardTemplate } from '../types/flashcard-template'
import type { OfficialNote } from '../types/official-note'
import type { QuestionExemplarMapping } from '../types/blueprint'

export class LearningLinkService {
  private questionToExemplars: Map<string, string[]>
  private exemplarToQuestions: Map<string, string[]>
  private exemplarToNotes: Map<string, string[]>
  private noteToExemplars: Map<string, string[]>
  private exemplarToCards: Map<string, string[]>
  private cardToExemplar: Map<string, string>
  private notesById: Map<string, OfficialNote>
  private templatesById: Map<string, FlashCardTemplate>

  constructor(
    questionExemplarMap: QuestionExemplarMapping[],
    notes: OfficialNote[],
    templates: FlashCardTemplate[],
  ) {
    this.questionToExemplars = new Map()
    this.exemplarToQuestions = new Map()
    this.exemplarToNotes = new Map()
    this.noteToExemplars = new Map()
    this.exemplarToCards = new Map()
    this.cardToExemplar = new Map()
    this.notesById = new Map()
    this.templatesById = new Map()

    for (const m of questionExemplarMap) {
      this.pushToMap(this.questionToExemplars, m.questionId, m.exemplarId)
      this.pushToMap(this.exemplarToQuestions, m.exemplarId, m.questionId)
    }

    for (const note of notes) {
      this.notesById.set(note.id, note)
      if (note.exemplarIds && note.exemplarIds.length > 0) {
        this.noteToExemplars.set(note.id, note.exemplarIds)
        for (const exId of note.exemplarIds) {
          this.pushToMap(this.exemplarToNotes, exId, note.id)
        }
      }
    }

    for (const tpl of templates) {
      this.templatesById.set(tpl.id, tpl)
      this.cardToExemplar.set(tpl.id, tpl.primary_exemplar_id)
      this.pushToMap(this.exemplarToCards, tpl.primary_exemplar_id, tpl.id)
    }
  }

  getNotesForQuestion(questionId: string): OfficialNote[] {
    const exemplarIds = this.questionToExemplars.get(questionId) ?? []
    const noteIds = new Set<string>()
    for (const exId of exemplarIds) {
      for (const nId of this.exemplarToNotes.get(exId) ?? []) {
        noteIds.add(nId)
      }
    }
    return this.resolveNotes(noteIds)
  }

  getCardsForQuestion(questionId: string): FlashCardTemplate[] {
    const exemplarIds = this.questionToExemplars.get(questionId) ?? []
    const cardIds = new Set<string>()
    for (const exId of exemplarIds) {
      for (const cId of this.exemplarToCards.get(exId) ?? []) {
        cardIds.add(cId)
      }
    }
    return this.resolveTemplates(cardIds)
  }

  getSourceCards(noteId: string): FlashCardTemplate[] {
    return [...this.templatesById.values()].filter(
      t => t.source_type === 'fusen' && t.source_id === noteId,
    )
  }

  getExemplarCards(noteId: string): FlashCardTemplate[] {
    const exemplarIds = this.noteToExemplars.get(noteId) ?? []
    const cardIds = new Set<string>()
    for (const exId of exemplarIds) {
      for (const cId of this.exemplarToCards.get(exId) ?? []) {
        cardIds.add(cId)
      }
    }
    return this.resolveTemplates(cardIds)
  }

  getQuestionsForNote(noteId: string): string[] {
    const exemplarIds = this.noteToExemplars.get(noteId) ?? []
    const qIds = new Set<string>()
    for (const exId of exemplarIds) {
      for (const qId of this.exemplarToQuestions.get(exId) ?? []) {
        qIds.add(qId)
      }
    }
    return [...qIds]
  }

  getRelatedNote(card: FlashCardTemplate): OfficialNote | undefined {
    if (card.source_type === 'fusen') {
      return this.notesById.get(card.source_id)
    }
    const noteIds = this.exemplarToNotes.get(card.primary_exemplar_id) ?? []
    return noteIds.length > 0 ? this.notesById.get(noteIds[0]) : undefined
  }

  getQuestionsForCard(card: FlashCardTemplate): string[] {
    return this.exemplarToQuestions.get(card.primary_exemplar_id) ?? []
  }

  private pushToMap(map: Map<string, string[]>, key: string, value: string): void {
    const existing = map.get(key)
    if (existing) {
      existing.push(value)
    } else {
      map.set(key, [value])
    }
  }

  private resolveNotes(ids: Set<string>): OfficialNote[] {
    return [...ids]
      .map(id => this.notesById.get(id))
      .filter((n): n is OfficialNote => n !== undefined)
  }

  private resolveTemplates(ids: Set<string>): FlashCardTemplate[] {
    return [...ids]
      .map(id => this.templatesById.get(id))
      .filter((t): t is FlashCardTemplate => t !== undefined)
  }
}
