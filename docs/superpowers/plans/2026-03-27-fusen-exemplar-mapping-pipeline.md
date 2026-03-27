# 付箋→例示マッチング横展開パイプライン 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 1,642枚の付箋にtopicIdを推定し、986件のExemplarとマッチングする

**Architecture:** 2パス設計。Phase 1でtopicId推定（16並列エージェント）、Phase 2でexemplarマッチング（20並列エージェント、2段階shortlist方式）。前提タスクとしてID体系をon-NNN→fusen-NNNNに統一

**Tech Stack:** TypeScript, Vitest, Claude Code Agent API (background agents), fusens-master.json, note-exemplar-mappings.json

**Spec:** `docs/superpowers/specs/2026-03-27-fusen-exemplar-mapping-pipeline-design.md`

---

## ファイル構成

### 新規作成
| ファイル | 責務 |
|---------|------|
| `scripts/lib/id-migration.ts` | on-NNN→fusen-NNNN 対応表 + 変換ユーティリティ |
| `scripts/migrate-note-ids.ts` | ID一括置換CLIスクリプト |
| `scripts/lib/__tests__/id-migration.test.ts` | ID変換テスト |

### 変更
| ファイル | 変更内容 |
|---------|---------|
| `src/data/official-notes.ts` | 23件のid: on-NNN→fusen-NNNN |
| `src/data/flashcard-templates.ts` | 10件のsource_id: on-NNN→fusen-NNNN |
| `src/data/fusens/note-exemplar-mappings.json` | 23件のnoteId: on-NNN→fusen-NNNN |
| `src/hooks/useBookmarks.ts` | localStorage migration関数追加 |
| `src/dev-tools/exemplar-mapping/hooks/useMappingReviewState.ts` | localStorage migration追加 |
| `src/utils/data-validator/rules/note-validation.ts` | 新規3ルール追加 |
| `src/utils/data-validator/__tests__/note-validation.test.ts` | 新ルールテスト + ID更新 |
| `src/dev-tools/exemplar-mapping/__tests__/effective-matches.test.ts` | ID更新 |

---

## Part A: ID統一（前提タスク）

### Task 1: ID対応表の作成とテスト

**Files:**
- Create: `scripts/lib/id-migration.ts`
- Create: `scripts/lib/__tests__/id-migration.test.ts`
- Read: `src/data/official-notes.ts`
- Read: `src/data/fusens/fusens-master.json`

- [ ] **Step 1: テストを書く**

```typescript
// scripts/lib/__tests__/id-migration.test.ts
import { describe, it, expect } from 'vitest'
import { ON_TO_FUSEN_MAP, onIdToFusenId, fusenIdToOnId } from '../id-migration'

describe('id-migration', () => {
  it('対応表が23件ある', () => {
    expect(Object.keys(ON_TO_FUSEN_MAP).length).toBe(23)
  })

  it('on-001 → fusen-0001 に変換できる', () => {
    expect(onIdToFusenId('on-001')).toBe('fusen-0001')
  })

  it('fusen-0001 → on-001 に逆変換できる', () => {
    expect(fusenIdToOnId('fusen-0001')).toBe('on-001')
  })

  it('未知のIDはそのまま返す', () => {
    expect(onIdToFusenId('on-999')).toBe('on-999')
    expect(fusenIdToOnId('fusen-9999')).toBe('fusen-9999')
  })

  it('全てのon-IDがfusens-master.jsonに対応するエントリを持つ', () => {
    // imageFileパスで照合
    for (const [onId, fusenId] of Object.entries(ON_TO_FUSEN_MAP)) {
      expect(fusenId).toMatch(/^fusen-\d{4}$/)
    }
  })
})
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npx vitest run scripts/lib/__tests__/id-migration.test.ts`
Expected: FAIL — `id-migration` モジュールが存在しない

- [ ] **Step 3: ID対応表を実装**

`official-notes.ts` の各 `on-NNN` エントリの `imageUrl` と `fusens-master.json` の各エントリの `imageFile` を照合して対応表を作る。

```typescript
// scripts/lib/id-migration.ts
/**
 * on-NNN（旧official-notes ID）→ fusen-NNNN（マスターID）の対応表。
 * imageFileパスで機械的に照合して生成。
 *
 * 背景: NotesPage redesign spec §13 の方針に基づきID統一。
 * エージェントチーム4対1で合意（spec §8参照）。
 */

// official-notes.ts の imageUrl から抽出したパスと fusens-master.json の imageFile を照合
// on-001 の imageUrl: '/images/fusens/page-001-left/note-01.png'
// fusen-0001 の imageFile: 'page-001-left/note-01.png'
export const ON_TO_FUSEN_MAP: Record<string, string> = {
  'on-001': 'fusen-0001',  // page-001-left/note-01.png — SI基本単位
  'on-002': 'fusen-0002',  // page-001-left/note-02.png — 物理量と次元
  'on-003': 'fusen-0003',  // page-001-left/note-03.png — 有効数字
  'on-004': 'fusen-0004',  // page-001-left/note-04.png — 力（ニュートン）
  'on-005': 'fusen-0005',  // page-001-left/note-05.png — エネルギーと仕事
  'on-006': 'fusen-0006',  // page-001-left/note-06.png — 濃度単位換算
  'on-007': 'fusen-0007',  // page-001-left/note-07.png — W/V%の定義
  'on-008': 'fusen-0008',  // page-001-left/note-08.png — 分析天秤
  'on-009': 'fusen-0009',  // page-001-right/note-01.png — 電磁波スペクトル
  'on-010': 'fusen-0010',  // page-001-right/note-02.png — 分光法
  'on-011': 'fusen-0011',  // page-001-right/note-03.png — UV吸収
  'on-012': 'fusen-0012',  // page-001-right/note-04.png — Lambert-Beer
  'on-013': 'fusen-0013',  // page-001-right/note-05.png — 蛍光
  'on-014': 'fusen-0014',  // page-001-right/note-06.png — NMR基礎
  'on-015': 'fusen-0015',  // page-002-left/note-01.png — 質量分析
  'on-016': 'fusen-0016',  // page-002-left/note-02.png — クロマト基礎
  'on-017': 'fusen-0017',  // page-002-left/note-03.png — HPLC
  'on-018': 'fusen-0018',  // page-002-left/note-04.png — GC
  'on-019': 'fusen-0019',  // page-002-left/note-05.png — 電気泳動
  'on-020': 'fusen-0020',  // page-002-left/note-06.png — 免疫測定法
  'on-021': 'fusen-0021',  // page-002-right/note-01.png — 滴定曲線
  'on-022': 'fusen-0022',  // page-002-right/note-02.png — 酸塩基指示薬
  'on-023': 'fusen-0023',  // page-002-right/note-03.png — 酸化還元滴定
}

// 注: 上記の対応は実装時に official-notes.ts と fusens-master.json の
// imageFile パスを実際に照合して確定すること。コメントのタイトルは参考値。

const FUSEN_TO_ON_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(ON_TO_FUSEN_MAP).map(([on, fusen]) => [fusen, on])
)

/** on-NNN → fusen-NNNN に変換。未知のIDはそのまま返す */
export function onIdToFusenId(onId: string): string {
  return ON_TO_FUSEN_MAP[onId] ?? onId
}

/** fusen-NNNN → on-NNN に逆変換。未知のIDはそのまま返す */
export function fusenIdToOnId(fusenId: string): string {
  return FUSEN_TO_ON_MAP[fusenId] ?? fusenId
}
```

**重要**: `ON_TO_FUSEN_MAP` の値は、実装時に `official-notes.ts` の `imageUrl` と `fusens-master.json` の `imageFile` を実際に照合して確定すること。上記は物理的なページ順の推定値。

- [ ] **Step 4: テスト通過を確認**

Run: `npx vitest run scripts/lib/__tests__/id-migration.test.ts`
Expected: PASS（5件）

- [ ] **Step 5: コミット**

```bash
git add scripts/lib/id-migration.ts scripts/lib/__tests__/id-migration.test.ts
git commit -m "feat: on-NNN → fusen-NNNN ID対応表を作成"
```

---

### Task 2: データファイルのID一括置換

**Files:**
- Modify: `src/data/official-notes.ts` (23件のid値)
- Modify: `src/data/flashcard-templates.ts` (10件のsource_id値)
- Modify: `src/data/fusens/note-exemplar-mappings.json` (23件のnoteId値)

- [ ] **Step 1: official-notes.ts のIDを置換**

`ON_TO_FUSEN_MAP` に基づいて、23件の `id: 'on-NNN'` を `id: 'fusen-NNNN'` に一括置換。

例:
```typescript
// Before
{ id: 'on-001', title: 'SI基本単位', ...}
// After
{ id: 'fusen-0001', title: 'SI基本単位', ...}
```

全23件を置換する。`replace_all` で `'on-001'` → `'fusen-0001'` 等を実行。

- [ ] **Step 2: flashcard-templates.ts のsource_idを置換**

```typescript
// Before
source_id: 'on-001',
// After
source_id: 'fusen-0001',
```

10件のテンプレートの `source_id` を置換。

- [ ] **Step 3: note-exemplar-mappings.json のnoteIdを置換**

```json
// Before
"noteId": "on-001",
// After
"noteId": "fusen-0001",
```

23件の `noteId` を置換。

- [ ] **Step 4: ビルド確認**

Run: `npm run build`
Expected: PASS（型エラーなし）

- [ ] **Step 5: テスト実行**

Run: `npx vitest run`
Expected: 一部テストがFAIL（テスト内のモックIDがまだ `on-NNN` のため）。これはTask 3で修正。

- [ ] **Step 6: コミット**

```bash
git add src/data/official-notes.ts src/data/flashcard-templates.ts src/data/fusens/note-exemplar-mappings.json
git commit -m "feat: データファイルのIDを on-NNN → fusen-NNNN に統一"
```

---

### Task 3: テストファイルのID更新

**Files:**
- Modify: `src/utils/data-validator/__tests__/note-validation.test.ts`
- Modify: `src/dev-tools/exemplar-mapping/__tests__/effective-matches.test.ts`

- [ ] **Step 1: note-validation.test.ts のモックIDを更新**

テスト内の `'on-001'` 等のモックIDを `'fusen-0001'` 等に置換。
`replace_all` で `on-001` → `fusen-0001`、`on-002` → `fusen-0002` 等を実行。

- [ ] **Step 2: effective-matches.test.ts のモックIDを更新**

同様に `on-001` → `fusen-0001` 等を置換。

- [ ] **Step 3: 全テスト通過を確認**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 4: コミット**

```bash
git add src/utils/data-validator/__tests__/ src/dev-tools/exemplar-mapping/__tests__/
git commit -m "test: テストファイルのモックIDを fusen-NNNN 形式に更新"
```

---

### Task 4: localStorage マイグレーション

**Files:**
- Modify: `src/hooks/useBookmarks.ts`
- Modify: `src/dev-tools/exemplar-mapping/hooks/useMappingReviewState.ts`

- [ ] **Step 1: useBookmarks.ts にマイグレーション関数を追加**

`loadBookmarks()` 内で、localStorage から読み込んだ `note_id` が `on-` で始まる場合に `fusen-` に変換して再保存する。

```typescript
// useBookmarks.ts に追加

// on-NNN → fusen-NNNN マイグレーション（1回限り）
const BOOKMARK_ID_MIGRATION: Record<string, string> = {
  'on-001': 'fusen-0001',
  'on-002': 'fusen-0002',
  // ... 全23件（Task 1 の ON_TO_FUSEN_MAP と同じ値）
  // scripts/lib/ は src/ から import 不可なのでインライン定義
}

function migrateBookmarkIds(bookmarks: BookmarkedNote[]): BookmarkedNote[] {
  let migrated = false
  const result = bookmarks.map(b => {
    const newId = BOOKMARK_ID_MIGRATION[b.note_id]
    if (newId) {
      migrated = true
      return { ...b, note_id: newId }
    }
    return b
  })
  if (migrated) {
    saveBookmarks(result) // 変換済みデータを再保存
  }
  return result
}
```

`loadBookmarks()` の戻り値を `migrateBookmarkIds()` でラップする。

- [ ] **Step 2: useMappingReviewState.ts にキーマイグレーションを追加**

`matchStatuses` / `primaryOverrides` / `addedMatches` のキーが `on-NNN:ex-xxx` 形式の場合、`fusen-NNNN:ex-xxx` に変換する。

```typescript
// v2 → v3 マイグレーション（ID統一）
function migrateV2ToV3(state: MappingReviewState): MappingReviewState {
  // キー内の on-NNN を fusen-NNNN に変換
  const migrateKeys = (obj: Record<string, unknown>) => {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      const newKey = key.replace(/^(on-\d+)(:)/, (_, onId, sep) => {
        return (MAPPING_ID_MIGRATION[onId] ?? onId) + sep
      })
      result[newKey] = value
    }
    return result
  }
  return {
    ...state,
    version: 2, // version番号は変えない（構造変更ではないため）
    matchStatuses: migrateKeys(state.matchStatuses) as Record<string, MatchStatus>,
    primaryOverrides: migrateKeys(state.primaryOverrides) as Record<string, boolean>,
    entryStatuses: migrateEntryKeys(state.entryStatuses),
    addedMatches: migrateKeys(state.addedMatches ?? {}) as Record<string, AddedMatch>,
  }
}
```

- [ ] **Step 3: ビルド + テスト確認**

Run: `npm run build && npx vitest run`
Expected: ALL PASS

- [ ] **Step 4: コミット**

```bash
git add src/hooks/useBookmarks.ts src/dev-tools/exemplar-mapping/hooks/useMappingReviewState.ts
git commit -m "feat: localStorage の on-NNN IDを fusen-NNNN に自動マイグレーション"
```

---

### Task 5: バリデーションルール追加

**Files:**
- Modify: `src/utils/data-validator/rules/note-validation.ts`
- Modify: `src/utils/data-validator/__tests__/note-validation.test.ts`

- [ ] **Step 1: 新ルールのテストを書く**

```typescript
// note-validation.test.ts に追加

describe('note-exemplar-max-count', () => {
  it('exemplarIds が6件以上でerror', () => {
    const notes = [{
      id: 'fusen-0001',
      exemplarIds: ['ex-1', 'ex-2', 'ex-3', 'ex-4', 'ex-5', 'ex-6'],
      subject: '物理',
      topicId: 'physics-material-structure',
    }]
    const ctx = buildContext({ officialNotesWithExemplars: notes })
    const issues = noteValidationRules([], ctx)
    expect(issues.some(i => i.rule === 'note-exemplar-max-count')).toBe(true)
    expect(issues.find(i => i.rule === 'note-exemplar-max-count')?.severity).toBe('error')
  })

  it('exemplarIds が5件以下はOK', () => {
    const notes = [{
      id: 'fusen-0001',
      exemplarIds: ['ex-physics-001', 'ex-physics-002', 'ex-physics-003'],
      subject: '物理',
      topicId: 'physics-material-structure',
    }]
    const ctx = buildContext({ officialNotesWithExemplars: notes })
    const issues = noteValidationRules([], ctx)
    expect(issues.some(i => i.rule === 'note-exemplar-max-count')).toBe(false)
  })
})

describe('note-exemplar-primary-count', () => {
  // primary数はmappings.jsonにしかないため、このルールはmappings用
  // → validate拡張時に追加。現時点ではofficial-notes.tsにprimary情報なし
  // → P3として先送り（mappingsバリデーション追加時に実装）
})

describe('note-id-unique', () => {
  it('同じIDが2件あるとerror', () => {
    const notes = [
      { id: 'fusen-0001', exemplarIds: ['ex-physics-001'], subject: '物理', topicId: 'physics-material-structure' },
      { id: 'fusen-0001', exemplarIds: ['ex-physics-002'], subject: '物理', topicId: 'physics-material-structure' },
    ]
    const ctx = buildContext({ officialNotesWithExemplars: notes })
    const issues = noteValidationRules([], ctx)
    expect(issues.some(i => i.rule === 'note-id-unique')).toBe(true)
  })
})
```

- [ ] **Step 2: テスト失敗を確認**

Run: `npx vitest run src/utils/data-validator/__tests__/note-validation.test.ts`
Expected: FAIL — 新ルールが未実装

- [ ] **Step 3: 新ルールを実装**

```typescript
// note-validation.ts の noteValidationRules 関数内に追加

// note-id-unique: ID重複チェック
const seenIds = new Set<string>()
for (const note of notes) {
  if (seenIds.has(note.id)) {
    issues.push({
      questionId: note.id,
      rule: 'note-id-unique',
      severity: 'error',
      message: `付箋ID ${note.id} が重複しています`,
      field: 'id',
      actual: note.id,
    })
  }
  seenIds.add(note.id)
}

// note-exemplar-max-count: 1付箋あたり5件以内
for (const note of notes) {
  const exemplarIds = note.exemplarIds
  if (exemplarIds && exemplarIds.length > 5) {
    issues.push({
      questionId: note.id,
      rule: 'note-exemplar-max-count',
      severity: 'error',
      message: `付箋 ${note.id} の exemplarIds が ${exemplarIds.length} 件（上限5件）`,
      field: 'exemplarIds',
      actual: String(exemplarIds.length),
      expected: '5以下',
    })
  }
}
```

- [ ] **Step 4: テスト通過を確認**

Run: `npx vitest run src/utils/data-validator/__tests__/note-validation.test.ts`
Expected: ALL PASS

- [ ] **Step 5: npm run validate で全体確認**

Run: `npm run validate`
Expected: 新ルールが既存データに対してエラーなし

- [ ] **Step 6: コミット**

```bash
git add src/utils/data-validator/rules/note-validation.ts src/utils/data-validator/__tests__/note-validation.test.ts
git commit -m "feat: バリデーションルール追加（note-id-unique, note-exemplar-max-count）"
```

---

### Task 6: Part A 最終検証

- [ ] **Step 1: フルビルド**

Run: `npm run build`
Expected: PASS

- [ ] **Step 2: 全テスト**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 3: バリデーション**

Run: `npm run validate`
Expected: エラー0件

- [ ] **Step 4: GPT-5.4 レビュー**

Run: `codex review --base <Task 1開始前のSHA>`
Expected: P1指摘なし

---

## Part B: Phase 1 — topicId推定

### Task 7: Phase 1 薬理バッチ1 実行（校正用）

**Files:**
- Read: `src/data/fusens/fusens-master.json`
- Read: `src/data/exam-blueprint.ts`
- Write: `/tmp/claude/fusens/topicid-pharmacology-1.json`

- [ ] **Step 1: 薬理の付箋IDリストを取得**

fusens-master.json から `subject === '薬理'` の付箋を抽出し、最初の138枚を特定。

- [ ] **Step 2: 薬理のALL_TOPICSを整理**

exam-blueprint.ts から薬理科目の中項目一覧を抽出:
```
id | name | majorCategory | minorCategories代表語
```

- [ ] **Step 3: バックグラウンドエージェントを起動**

spec §3.3 のプロンプトテンプレートに薬理データを埋め込み、Opus 4.6エージェントをバックグラウンドで起動。

出力先: `/tmp/claude/fusens/topicid-pharmacology-1.json`

- [ ] **Step 4: 結果のJSON形式を確認**

エージェント完了後、出力JSONが `TopicIdResult` スキーマに準拠しているか確認:
- `results` 配列の件数 === 入力付箋数
- 全件に `topicId`, `confidence`, `topCandidates` が存在
- `topicId` が薬理の ALL_TOPICS.id に含まれる

---

### Task 8: 校正（薬理60枚サンプル検証）

- [ ] **Step 1: confidence帯別にサンプリング**

薬理バッチ1の結果から:
- confidence ≥ 0.9: 30枚ランダム抽出
- confidence 0.7-0.9: 20枚ランダム抽出
- confidence < 0.7: 10枚（あれば全件）

サンプルを一覧表示（fusenId, title, topicId, confidence, reasoning）。

- [ ] **Step 2: ユーザーが正誤判定**

ユーザーに一覧を提示し、各付箋のtopicIdが正しいか判定してもらう。

- [ ] **Step 3: precision計算**

各帯域のprecision（正解率）を計算:
- ≥0.9帯: X/30 = Y%
- 0.7-0.9帯: X/20 = Y%
- <0.7帯: X/10 = Y%

→ 閾値を確定（例: precision 90%以上なら0.9以上を自動承認）

---

### Task 9: 残り15エージェント並列実行

- [ ] **Step 1: 全バッチの入力データを準備**

残り15バッチ分の付箋データ + ALL_TOPICS を科目ごとに整理。

- [ ] **Step 2: 15エージェントをバックグラウンドで並列起動**

spec §3.2 のバッチ分割に従い、各エージェントにプロンプトを渡して起動。
全て `run_in_background: true`, `model: "opus"` で実行。

出力先: `/tmp/claude/fusens/topicid-{subject}-{batch}.json`

- [ ] **Step 3: 全エージェント完了を待つ**

完了通知を確認。エラーがあったバッチは再実行。

---

### Task 10: 番兵検証 + gate通過判定

- [ ] **Step 1: 番兵サンプル検証**

病態・薬物治療から10枚、法規・制度・倫理から10枚をランダム抽出。
ユーザーに正誤判定してもらい、科目間のconfidence信頼度に差がないか確認。

- [ ] **Step 2: 自動チェック実行**

全16バッチの結果を読み込み、以下を集計:
- confidence分布（≥0.9 / 0.7-0.9 / <0.7）
- subjectSuspected: true の一覧
- needsReview: true の一覧
- top1-top2 margin < 0.15 の一覧
- topicId が ALL_TOPICS に存在するか全件チェック
- subject-topicId 整合性チェック

- [ ] **Step 3: gate条件チェック**

spec §4.4 の8項目を全て確認:
- [ ] subjectSuspected=true 全件レビュー完了
- [ ] confidence < 0.7 全件レビュー完了
- [ ] needsReview=true && confidence < 0.9 全件レビュー完了
- [ ] top1-top2 margin < 0.15 全件レビュー完了
- [ ] 高confidence帯(≥0.9)の監査precision ≥ 90%
- [ ] topic偏りに説明不能な集中なし
- [ ] npm run validate エラー 0
- [ ] topicId === null が 0件

---

### Task 11: topicId結果をfusens-master.jsonに反映

**Files:**
- Modify: `src/data/fusens/fusens-master.json`
- Modify: `public/data/fusens/fusens-master.json`（同一ファイルが2箇所に存在）

- [ ] **Step 1: 全バッチ結果をマージ**

`/tmp/claude/fusens/topicid-*.json` を読み込み、fusenId → topicId のマッピングを構築。

- [ ] **Step 2: fusens-master.json に topicId を書き込み**

各 fusen エントリの `topicId: null` を推定値で上書き。

- [ ] **Step 3: 件数確認**

`topicId !== null` の件数が 1,642 であることを確認。

- [ ] **Step 4: npm run validate**

Run: `npm run validate`
Expected: エラー0件

- [ ] **Step 5: コミット**

```bash
git add src/data/fusens/fusens-master.json public/data/fusens/fusens-master.json
git commit -m "feat: 1,642枚の付箋にtopicIdを設定（Phase 1完了）"
```

---

## Part C: Phase 2 — exemplarマッチング

### Task 12: shortlist構築（Stage A）

**Files:**
- Read: `src/data/fusens/fusens-master.json`（topicId確定済み）
- Read: `src/data/exemplars.ts`
- Read: `src/data/exam-blueprint.ts`

- [ ] **Step 1: shortlist構築ロジックを実装**

各付箋に対して:
1. `topicId` 完全一致のexemplar を全件取得
2. 同科目・同大項目（majorCategory一致）のexemplarを全件取得
3. 合計が10件未満の場合、同科目の全exemplarに拡大
4. 重複排除して shortlist を構築

- [ ] **Step 2: shortlist統計を出力**

科目別に:
- 平均shortlist件数
- 最小/最大shortlist件数
- 10件未満で拡大したケースの数

期待値: 1付箋あたり15-45件

---

### Task 13: Phase 2 エージェント並列実行

- [ ] **Step 1: 既存23件を除外リストに設定**

official-notes.ts に存在する fusenId をセットで持ち、Phase 2 対象から除外。

- [ ] **Step 2: 各バッチのプロンプトを構築**

spec §5.4 のプロンプトテンプレートに:
- 付箋データ（title, topicId, body, tags, noteType）
- shortlist（各付箋ごと）
を埋め込む。

- [ ] **Step 3: 20エージェントをバックグラウンドで並列起動**

spec §5.3 のバッチ分割に従い実行。
出力先: `/tmp/claude/fusens/exemplar-{subject}-{batch}.json`

- [ ] **Step 4: 全エージェント完了を待つ**

完了通知を確認。エラーバッチは再実行。

---

### Task 14: exemplar結果をマージ

**Files:**
- Modify: `src/data/fusens/note-exemplar-mappings.json`

- [ ] **Step 1: 全バッチ結果を読み込み**

`/tmp/claude/fusens/exemplar-*.json` から全 `FusenExemplarMatch` を収集。

- [ ] **Step 2: NoteExemplarMappingEntry 形式に変換**

各結果を既存の mappings.json 形式に変換:
```typescript
{
  noteId: fusenId,        // fusen-NNNN（ID統一済み）
  noteTitle: fusen.title,
  subject: fusen.subject,
  topicId: fusen.topicId,
  matches: result.matches.map(m => ({
    ...m,
    status: 'pending' as const,
  })),
  reviewStatus: 'pending' as const,
}
```

- [ ] **Step 3: 既存23件と結合**

既存の mappings.json（23件）を保持し、新規エントリ（最大1,619件）を追加。
`noteCount` を更新。

- [ ] **Step 4: バリデーション**

```bash
npm run validate
```

確認ポイント:
- note-exemplar-exists: 全exemplarIdが986件の中に存在
- note-exemplar-no-duplicates: 重複なし
- note-exemplar-max-count: 全件5件以内
- note-id-unique: ID重複なし

- [ ] **Step 5: コミット**

```bash
git add src/data/fusens/note-exemplar-mappings.json
git commit -m "feat: 1,642枚のexemplarマッチング結果を追加（Phase 2完了）"
```

---

### Task 15: 最終レビュー

- [ ] **Step 1: GPT-5.4 レビュー**

```bash
codex review --base <Phase 2開始前のSHA>
```

確認ポイント:
- 分布異常（特定topicにexemplarが集中していないか）
- マッチング品質（reasoningが妥当か）
- ID整合性

- [ ] **Step 2: 異常値をレビューUIで修正**

`npm run dev` → `/dev-tools/exemplar-mapping` でwarning/errorの付箋を確認。
必要に応じて手動修正。

- [ ] **Step 3: 最終コミット**

```bash
git add -A
git commit -m "fix: exemplarマッチング異常値を手動修正"
```

---

## 実行順序サマリー

```
Part A（コード変更、1セッション）:
  Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6

Part B（Phase 1、2-3セッション）:
  Task 7（薬理校正バッチ）
  → Task 8（ユーザー検証、隙間時間30分）
  → Task 9（残り15並列、寝てる間に実行）
  → Task 10（番兵+gate、隙間時間30分）
  → Task 11（マージ+コミット）

Part C（Phase 2、1-2セッション）:
  Task 12（shortlist構築）
  → Task 13（20並列、寝てる間に実行）
  → Task 14（マージ+バリデーション）
  → Task 15（最終レビュー）
```
