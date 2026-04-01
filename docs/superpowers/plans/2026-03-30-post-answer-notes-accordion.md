# Post-Answer Notes Accordion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 解答後エリアで「類似問題→暗記カード→付箋」の順に並べ替え、正解時は付箋を折りたたみ、不正解時は全展開にする。

**Architecture:** `answerState.isCorrect` と `answerState.isSkipped` はすでに `QuestionPageContent` と `LinkedQuestionItem` で利用可能。`useState` + `useEffect` で `notesOpen` を制御する。`LinkedQuestionItem` にはCTAがないため、アコーディオンのみ追加。

**Tech Stack:** React 19 useState/useEffect, CSS Modules, existing components (OfficialNoteCard, NoNotesMessage)

---

### Task 1: QuestionPage.tsx — 順序変更 + アコーディオン

**Files:**
- Modify: `src/pages/QuestionPage.tsx` (lines ~170, 271-357)

- [ ] **Step 1: `notesOpen` stateを追加する**

`QuestionPageContent` 関数内（`const location = useLocation()` の直下）に追加：

```tsx
const [notesOpen, setNotesOpen] = useState(false)

useEffect(() => {
  if (answerState.isAnswered) {
    // 不正解時だけデフォルト展開
    setNotesOpen(!answerState.isCorrect && !answerState.isSkipped)
  }
}, [answerState.isAnswered, answerState.isCorrect, answerState.isSkipped])
```

- [ ] **Step 2: 解答後エリアを書き替える（順序変更 + アコーディオン）**

現在の `{answerState.isAnswered && (...)}` ブロック（lines 271-357）を以下に置き換える：

```tsx
{answerState.isAnswered && (
  <>
    <div ref={resultRef}>
      <ResultBanner
        isCorrect={answerState.isCorrect}
        isSkipped={answerState.isSkipped}
        correctAnswer={question.correct_answer}
        elapsedSeconds={getElapsedSeconds()}
      />
    </div>

    {question.explanation && (
      <ExplanationSection
        explanation={normalizeForDisplay(question.explanation)}
      />
    )}

    {/* CTA群（類似問題 → 暗記カード の順） */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '12px 0' }}>
      {relatedQuestionIds.length > 0 && (
        <button
          type="button"
          onClick={() => {
            localStorage.setItem('practice_session', JSON.stringify(relatedQuestionIds))
            navigate(`/practice/${relatedQuestionIds[0]}`)
          }}
          style={{
            width: '100%', padding: '12px 16px', background: 'var(--card)',
            border: '1px solid var(--border)', borderRadius: '10px',
            color: 'var(--text-1)', fontSize: '0.9rem', textAlign: 'left',
            cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <span>📝 同じ単元の問題（{relatedQuestionIds.length}問）</span>
          <span style={{ color: 'var(--accent)' }}>→</span>
        </button>
      )}
      {topicCardCount > 0 && (
        <button
          type="button"
          onClick={() => {
            const cards = linkService.getCardsForQuestion(questionId)
            const ctx: FlashCardPracticeContext = {
              mode: 'topic',
              cardIds: cards.map(c => c.id),
              returnTo: location.pathname,
            }
            navigate('/cards/review', { state: ctx })
          }}
          style={{
            width: '100%', padding: '12px 16px', background: 'var(--card)',
            border: '1px solid var(--border)', borderRadius: '10px',
            color: 'var(--text-1)', fontSize: '0.9rem', textAlign: 'left',
            cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <span>🃏 この単元の暗記カード（{topicCardCount}枚）</span>
          <span style={{ color: 'var(--accent)' }}>→</span>
        </button>
      )}
    </div>

    {/* 付箋アコーディオン */}
    <div style={{ margin: '4px 0' }}>
      <button
        type="button"
        onClick={() => setNotesOpen(o => !o)}
        style={{
          width: '100%', padding: '10px 16px', background: 'var(--card)',
          border: '1px solid var(--border)', borderRadius: '10px',
          color: 'var(--text-1)', fontSize: '0.9rem', textAlign: 'left',
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span>📌 関連付箋（{notes.length}枚）</span>
        <span style={{ color: 'var(--accent)', transition: 'transform 0.2s', transform: notesOpen ? 'rotate(90deg)' : 'none' }}>▶</span>
      </button>
      {notesOpen && (
        <div style={{ marginTop: '8px' }}>
          {notes.length === 0 && <NoNotesMessage />}
          {notes.map((note) => (
            <OfficialNoteCard
              key={note.id}
              note={note}
              isBookmarked={isBookmarked(note.id)}
              onToggleBookmark={() => toggleBookmark(note.id)}
              onFlashCard={() => {
                const cards = linkService.getSourceCards(note.id)
                if (cards.length > 0) {
                  const ctx: FlashCardPracticeContext = {
                    mode: 'note',
                    noteId: note.id,
                    cardIds: cards.map(c => c.id),
                    returnTo: location.pathname,
                  }
                  navigate('/cards/review', { state: ctx })
                } else {
                  navigate('/cards')
                }
              }}
              flashCardCount={linkService.getSourceCards(note.id).length}
              onImageTap={() => {}}
            />
          ))}
        </div>
      )}
    </div>

    <MetaAccordion question={question} topicName={topicName} />
  </>
)}
```

- [ ] **Step 3: `useState` import を確認（既存のものを使う）**

`QuestionPage.tsx` の先頭に `useState` が import されていることを確認。なければ追加：
```tsx
import { useMemo, useRef, useEffect, useState } from 'react'
```

- [ ] **Step 4: ビルド確認**

```bash
npx tsc --noEmit
```
Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/pages/QuestionPage.tsx
git commit -m "feat: 解答後エリア — CTAを付箋の上へ、正解時折りたたみアコーディオン"
```

---

### Task 2: LinkedQuestionItem.tsx — アコーディオン追加

**Files:**
- Modify: `src/components/question/LinkedQuestionItem.tsx`

※ LinkedQuestionItem には類似問題・暗記カードCTAがないため、アコーディオンのみ追加する。

- [ ] **Step 1: `notesOpen` stateを追加する**

```tsx
import { useRef, useEffect, useState } from 'react'
```

`const { getElapsedSeconds } = useTimeTracking(question.id)` の後に追加：

```tsx
const [notesOpen, setNotesOpen] = useState(false)

useEffect(() => {
  if (answerState.isAnswered) {
    setNotesOpen(!answerState.isCorrect && !answerState.isSkipped)
  }
}, [answerState.isAnswered, answerState.isCorrect, answerState.isSkipped])
```

- [ ] **Step 2: 解答後の付箋エリアをアコーディオンに変更**

現在の付箋表示（lines 143-154）を以下に置き換える：

```tsx
{/* 付箋アコーディオン */}
<div style={{ margin: '4px 0' }}>
  <button
    type="button"
    onClick={() => setNotesOpen(o => !o)}
    style={{
      width: '100%', padding: '10px 16px', background: 'var(--card)',
      border: '1px solid var(--border)', borderRadius: '10px',
      color: 'var(--text-1)', fontSize: '0.9rem', textAlign: 'left',
      cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}
  >
    <span>📌 関連付箋（{notes.length}枚）</span>
    <span style={{ color: 'var(--accent)', transition: 'transform 0.2s', transform: notesOpen ? 'rotate(90deg)' : 'none' }}>▶</span>
  </button>
  {notesOpen && (
    <div style={{ marginTop: '8px' }}>
      {notes.length === 0 && <NoNotesMessage />}
      {notes.map((note) => (
        <OfficialNoteCard
          key={note.id}
          note={note}
          isBookmarked={isBookmarked(note.id)}
          onToggleBookmark={() => toggleBookmark(note.id)}
          onFlashCard={() => navigate('/cards')}
          flashCardCount={0}
          onImageTap={() => {}}
        />
      ))}
    </div>
  )}
</div>
```

- [ ] **Step 3: ビルド確認**

```bash
npx tsc --noEmit
```
Expected: エラーなし

- [ ] **Step 4: テスト実行**

```bash
npx vitest run
```
Expected: 全件パス（既存テストに影響なし）

- [ ] **Step 5: コミット**

```bash
git add src/components/question/LinkedQuestionItem.tsx
git commit -m "feat: LinkedQuestionItem — 付箋アコーディオン（正解時折りたたみ）"
```

---

### Task 3: Vercel デプロイ

- [ ] **Step 1: Push**

```bash
git push origin main
```

Expected: Vercel の自動デプロイが開始される

---

## Self-Review

**Spec coverage:**
1. ✅ 順序変更: 類似問題 → 暗記カード → 付箋（Task 1 Step 2）
2. ✅ 正解時折りたたみ: `setNotesOpen(!isCorrect && !isSkipped)`（Task 1 Step 1）
3. ✅ 不正解時全展開: `setNotesOpen(!isCorrect && !isSkipped)` = true（Task 1 Step 1）
4. ✅ LinkedQuestionItem にもアコーディオン適用（Task 2）

**Placeholder scan:** なし（全ステップにコード記載済み）

**Type consistency:**
- `FlashCardPracticeContext`（Task 1）: 既存の型、`mode: 'topic'` / `mode: 'note'` どちらも既存コードと一致
- `linkService.getSourceCards(note.id)` / `linkService.getCardsForQuestion(questionId)`: 既存QuestionPageから流用
- `useState` / `useEffect`: React 19から既import済み（Task 1 Step 3で確認）

**Notes:**
- `notes.length === 0` の場合でもアコーディオンヘッダーを表示（「関連付箋（0枚）」）し、開くと `NoNotesMessage` が出る設計。付箋なし問題（46問）でもCTAは常に表示される。
