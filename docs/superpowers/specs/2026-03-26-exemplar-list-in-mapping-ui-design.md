# 同topicId全Exemplar一覧 追加設計 v1.1

## 概要

付箋→例示マッチングレビューUI（`/dev-tools/exemplar-mapping`）の MappingCard に、同 topicId 内の全 exemplar を折りたたみ表示するセクションを追加する。一覧からタップで候補に追加可能。

**目的**: Claude 推論の候補が妥当かを「他にどんな exemplar があるか」を見て判断し、不足があればその場で追加できるようにする。

## 1. UIレイアウト

### 1.1 配置

既存候補リスト（ExemplarCandidate群）の直下、判定バーの上。

```
── Exemplar候補 (2件) ──────────────────
  [既存の ExemplarCandidate コンポーネント群]

── 同トピックの全Exemplar (10件) ▶ ─────  ← デフォルト閉じ
  （展開時）
  ✅ ex-physics-058                       ← 候補済み: バッジ付き, ボタン無効
     化学結合の様式について説明できる。

  ex-physics-001                          ← 未追加: アクティブ
     物質の状態変化を分子間力で説明できる。
     [🟢 Primary] [🔵 Secondary]          ← タップで即追加
  ...

── 判定バー ────────────────────────────
```

### 1.2 UI仕様

- `<details>/<summary>` ベース（ネイティブ折りたたみ、JS最小）
- デフォルト: 閉じた状態
- 見出し: `同トピックの全Exemplar (N件)`（N = 同 topicId の exemplar 総数）
- 候補済み exemplar: `✅` バッジ + ボタン非表示（重複追加防止）
- 未追加 exemplar: `[🟢 Primary]` `[🔵 Secondary]` の2ボタン
- タップ → 即 approved + 指定ロールで候補リストに出現
- topicId に exemplar が 0 件 → 折りたたみの代わりに「⚠️ このトピックに Exemplar はありません」メッセージ表示（`needs-manual` エントリで読み込み失敗と区別するため）
- スタイル: ダーク系（`#16162a` 背景）、既存 ExemplarCandidate と統一

### 1.3 データソース

- `EXEMPLARS` 配列（986件）から `middleCategoryId === entry.topicId` でフィルタ
- `useMemo` で topicId 変更時のみ再計算
- 各行: exemplarId（モノスペース） + text + minorCategory

## 2. データフロー & 状態管理

### 2.1 設計原則: effective list 統一

**全ての操作は `getEffectiveMatches()` の結果を基準にする。`entry.matches` を直接参照する箇所を廃止する。**

対象操作:
- MappingCard 表示（候補リスト、件数）
- approveAll / rejectAll（一括操作）
- togglePrimary（Primary 降格対象）
- 判定バー表示条件
- resetEntry
- handleExport

### 2.2 getEffectiveMatches() — 単一真実源

```typescript
function getEffectiveMatches(
  originalMatches: NoteExemplarMatch[],
  addedMatches: Record<string, AddedMatch>,
  matchStatuses: Record<string, MatchStatus>,
  primaryOverrides: Record<string, boolean>,
  noteId: string
): NoteExemplarMatch[]
```

**適用順序:**
1. `originalMatches` をコピー
2. `addedMatches` から `noteId:` で始まるエントリを `NoteExemplarMatch` に変換して追加:
   ```typescript
   // AddedMatch → NoteExemplarMatch 変換規則
   {
     exemplarId: キーの "noteId:" 以降の部分,
     isPrimary: addedMatch.isPrimary,
     confidence: 0,           // 手動追加は常に 0
     reasoning: '手動追加',    // 手動追加は常にこの文字列
     status: 'pending',       // ← 既定値。matchStatuses で上書きされる（step 5）
   }
   ```
   **注**: `source: 'manual'` は `AddedMatch`（localStorage）内部専用。`NoteExemplarMatch` / export には持ち上げない。手動追加の識別は `confidence === 0 && reasoning === '手動追加'` で行う。
3. `exemplarId` で dedupe（**original 優先** — 重複時は added を捨てる）
4. `EXEMPLARS` 配列に存在しない exemplarId を除外（stale 対策）
5. `matchStatuses` / `primaryOverrides` で上書き（status / isPrimary を localStorage の値で置換）
6. **Primary 1件以下を正規化**（複数あれば先頭のみ Primary、残りは Secondary に降格）

**配置**: `src/dev-tools/exemplar-mapping/utils/effective-matches.ts` に純粋関数として配置。テスト可能にする。

### 2.3 localStorage 変更

```typescript
// src/dev-tools/exemplar-mapping/types.ts
interface MappingReviewState {
  version: 2                                    // v1 → v2
  matchStatuses: Record<string, MatchStatus>    // キー: "noteId:exemplarId"
  primaryOverrides: Record<string, boolean>     // キー: "noteId:exemplarId"
  entryStatuses: Record<string, EntryReviewStatus> // キー: noteId
  addedMatches: Record<string, AddedMatch>      // NEW — キー: "noteId:exemplarId"
  lastPosition: string
  updatedAt: string
}

interface AddedMatch {
  isPrimary: boolean
  source: 'manual'
  reasoning: '手動追加'
}
// 注: exemplarId はキーから取得。値に持たない（二重管理防止）
```

**migration**: v1 ロード時に `addedMatches: {}` を補完して v2 として扱う。localStorage キーは変更しない（`exemplar-mapping-review-v1`）。

### 2.4 既存操作の effective list 統一

現状コードは `entry.matches.map(m => m.exemplarId)` で exemplarId リストを作り、それを `approveAll` / `rejectAll` / `togglePrimary` / `resetEntry` に渡している。手動追加分を取りこぼさないよう、**呼び出し側で effective list から exemplarId リストを作る**。

```typescript
// ExemplarMappingPage.tsx — 全操作で effective list を使う
const effectiveMatches = getEffectiveMatches(
  entry.matches, state.addedMatches, state.matchStatuses, state.primaryOverrides, entry.noteId
)
const allExemplarIds = effectiveMatches.map(m => m.exemplarId)

// approveAll: effective list 全件を approved に
approveAll(entry.noteId, allExemplarIds)

// rejectAll: effective list 全件を rejected に
rejectAll(entry.noteId, allExemplarIds)

// togglePrimary: effective list 内で Primary 降格
togglePrimary(entry.noteId, exemplarId, currentIsPrimary, allExemplarIds)

// resetEntry: effective list の exemplarId + addedMatches も削除
resetEntry(entry.noteId, allExemplarIds)
// ← useMappingReviewState 内部で addedMatches のキーも削除（§2.6）
```

**MappingCard の Props 変更**:
- `entry.matches` は表示に使わない。代わりに `effectiveMatches: NoteExemplarMatch[]` を Props として受け取る
- 件数表示、判定バー表示条件、ExemplarCandidate のレンダリングすべて `effectiveMatches` 基準

### 2.5 追加フロー

```
ユーザーが [🟢 Primary] をタップ
  ↓
addMatch(noteId, exemplarId, isPrimary: true)
  → addedMatches["noteId:exemplarId"] = { isPrimary, source: 'manual', reasoning: '手動追加' }
  → matchStatuses["noteId:exemplarId"] = 'approved'
  → primaryOverrides["noteId:exemplarId"] = true
  → isPrimary=true の場合:
    effective list 内の既存 Primary を全て Secondary に降格
    （primaryOverrides を更新）
  → entryStatuses[noteId] = 'modified'
  ↓
getEffectiveMatches() 再計算 → UI更新
  → 候補リストに新しい ExemplarCandidate として出現
  → 折りたたみ一覧で ✅ バッジに変化
```

### 2.6 resetEntry の修正

```
resetEntry(noteId, exemplarIds)
  既存: matchStatuses / primaryOverrides / entryStatuses 削除
  追加: addedMatches から "noteId:" で始まるキーも全削除
  結果: getEffectiveMatches() = 原本のみに戻る
```

### 2.7 エクスポート

`getEffectiveMatches()` の結果をそのまま `NoteExemplarMatch[]` として出力。
手動追加分は `confidence: 0`, `reasoning: '手動追加'` で識別可能。
Primary 正規化済みなので追加処理不要。

**entryStatus の遷移ルール（親 spec downstream 要件との整合）**:
- 手動追加があった entry → `entryStatuses[noteId]` は `'modified'` に自動遷移
- 元が `needs-manual` の entry に手動追加 → `'modified'` に遷移（`official-notes.ts` 反映対象になる）
- export 時、`entryStatuses` の値をそのまま `entry.reviewStatus` に出力
- 親 spec の反映ルール: `reviewStatus === 'approved' || 'modified'` の entry のみ反映対象

## 3. キーボードショートカット修正

`useMappingKeyboardNav` の handler で、インタラクティブ要素内でのショートカット発火を防止:

```typescript
// tagName ベースではなく closest() で堅牢に判定
const interactive = (e.target as HTMLElement).closest(
  'button, summary, [contenteditable], input, textarea, select'
)
if (interactive) return
```

## 4. エッジケース

| ケース | 対応 |
|--------|------|
| 同一 exemplar 再追加 | ボタン非表示で防止 + addedMatches にも重複チェック |
| 手動追加後に Reset | addedMatches も全削除（§2.5） |
| Primary 追加時に既存 Primary | effective list 内の既存 Primary を全て Secondary 降格 |
| topicId に exemplar 0 件 | 「⚠️ このトピックに Exemplar はありません」メッセージ表示 |
| stale addedMatches | `getEffectiveMatches()` 内で EXEMPLARS に存在しない ID を除外 |
| 表示順 | effective matches: original → added の順 |
| dedupe | original 優先。added に同一 exemplarId があれば added を捨てる |
| Primary 複数 | `getEffectiveMatches()` で先頭のみ Primary に正規化 |

## 5. テスト方針

### 5.1 getEffectiveMatches 純粋関数テスト

FusenLibraryCore パターンに倣い、純粋関数テストで網羅:

- original のみ（added なし）→ そのまま返す
- original + added のマージ
- dedupe: original 優先で added を捨てる
- overrides 適用（matchStatuses, primaryOverrides）
- Primary 1件以下の正規化
- stale exemplarId の除外
- reset 後は original のみに戻る

### 5.2 migration テスト

- v1 state をロード → `addedMatches: {}` が補完されること

### 5.3 UI テスト

ブラウザ手動確認（dev-tools は既存パターン踏襲）:
- 折りたたみの開閉
- 候補済み exemplar の ✅ 表示
- [Primary] / [Secondary] タップで追加
- approveAll / rejectAll が手動追加含む全候補に適用
- Reset で手動追加が消えること
- キーボードショートカットが折りたたみ内ボタンで誤発火しないこと

## 6. 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `src/dev-tools/exemplar-mapping/types.ts` | `MappingReviewState` v2 + `AddedMatch` 型追加 |
| `src/dev-tools/exemplar-mapping/hooks/useMappingReviewState.ts` | v1→v2 migration, `addMatch()`, `resetEntry` 修正 |
| `src/dev-tools/exemplar-mapping/components/MappingCard.tsx` | 折りたたみセクション追加, effective list 基準に統一 |
| `src/dev-tools/exemplar-mapping/components/MappingCard.module.css` | 折りたたみセクションのスタイル |
| `src/dev-tools/exemplar-mapping/ExemplarMappingPage.tsx` | `addMatch` コールバック追加, effective list 基準に統一 |
| `src/dev-tools/exemplar-mapping/hooks/useMappingKeyboardNav.ts` | `closest()` ベースの除外判定 |
| `src/dev-tools/exemplar-mapping/utils/effective-matches.ts` | `getEffectiveMatches()` 純粋関数 |
| `src/dev-tools/exemplar-mapping/__tests__/effective-matches.test.ts` | 純粋関数テスト |
| `src/dev-tools/exemplar-mapping/__tests__/migration-v1-v2.test.ts` | migration テスト |

## 7. 設計判断の記録

| 判断 | 決定 | 理由 |
|------|------|------|
| 一覧の範囲 | 同 topicId のみ | 5-30件で十分。cross-subject は将来 SearchModal で対応 |
| 追加時の状態 | Primary or Secondary 選択 + 即 approved | 手動追加 = ユーザー意思。二度手間防止 |
| 折りたたみ実装 | `<details>/<summary>` | JS最小、ネイティブ、アクセシブル |
| 配置 | 候補リスト直下、判定バーの上 | 上から下の流れ: 確認 → 追加 → 判定 |
| アプローチ | MappingCard インライン | 5-30件の一覧に専用コンポーネントは過剰 |
| confidence | `source` は内部 state 専用、export は `confidence: 0` + `reasoning: '手動追加'` で識別 | NoteExemplarMatch 型変更なし、downstream 互換維持 |
| dedupe | original 優先 | 元データの推論結果を尊重 |
| AddedMatch の exemplarId | キーのみ（値に持たない） | 二重管理防止（GPT-5.4 P3 指摘） |
| キーボード除外 | `closest()` ベース | tagName だけだと入れ子要素で漏れる |
| Primary 正規化 | `getEffectiveMatches()` 内で常時 | export 時のみだと UI とズレる |

## GPT-5.4 レビュー対応記録

### レビュー1回目（§2 初版）

**P1 修正（3件）**:
1. **effectiveMatches 単一真実源** — `getEffectiveMatches()` を 1 箇所で計算する設計に変更。MappingCard 表示・reset・export すべてこれを使う
2. **resetEntry が addedMatches を消さない** — resetEntry で `addedMatches` から該当 noteId のキーも全削除する仕様を追加
3. **エクスポートマージ漏れ** — 適用順序（original → added → overrides → dedupe）、重複排除、Primary 1 件以下保証を定義

**P2 修正（1件）**:
4. **キーボードショートカット競合** — `useMappingKeyboardNav` の handler に `BUTTON` / `SUMMARY` 要素の除外を追加

**P3 修正（2件）**:
5. **localStorage migration** — v1 ロード時に `addedMatches: {}` を補完して v2 扱い
6. **候補ゼロ系エッジケース** — テスト方針のエッジケースに追加

**設計提案の採用**:
- `confidence: 0` → `source: 'manual'` フィールド追加で区別（採用）
- `addedMatches` は separate store（採用、ただし `getEffectiveMatches()` 単一真実源が前提）

### レビュー2回目（§1-3 統合）

**P1 修正（2件）**:
1. **Primary 正規化を `getEffectiveMatches()` に含める** — export 時のみではなく常時保証に変更。§2.2 に明記
2. **全操作を effective list 基準に統一** — §2.1 に設計原則として明記。`entry.matches` 直接参照の廃止を宣言

**P2 修正（3件）**:
3. **dedupe 優先順位** — original 優先（重複時は added を捨てる）を §2.2 と §4 に明記
4. **stale addedMatches の判定場所** — `getEffectiveMatches()` 内に閉じ込め。§2.2 に EXEMPLARS 存在チェックを追加
5. **キーボード除外を `closest()` ベースに** — §3 で `closest()` ベースの判定に変更

**P3 修正（2件）**:
6. **AddedMatch の exemplarId 二重管理** — キーのみに変更、値から exemplarId を削除。§2.3 に注記
7. **migration テスト追加** — §5.2 に追加

### レビュー3回目（spec ドキュメント v1.0）

**P1 修正（2件）**:
1. **AddedMatch → NoteExemplarMatch 変換の status 既定値** — §2.2 に変換規則を TypeScript コード付きで明記。`status: 'pending'` を既定とし step 5 の `matchStatuses` で上書きされる設計
2. **全操作の effective list 統一が未具体化** — §2.4 を新設。`approveAll`/`rejectAll`/`togglePrimary`/`resetEntry` の呼び出しコード例を追加。MappingCard の Props に `effectiveMatches` を追加し `entry.matches` 直接参照を完全廃止

**P2 修正（3件）**:
3. **`source: 'manual'` の矛盾** — `source` は `AddedMatch`（localStorage）内部専用と明記。`NoteExemplarMatch` / export には持ち上げない。手動追加の識別は `confidence === 0 && reasoning === '手動追加'` で行う
4. **topicId exemplar 0 件の空状態** — 「⚠️ このトピックに Exemplar はありません」メッセージ表示に変更（§1.2, §4）
5. **export の entryStatus 遷移** — §2.7 に entryStatus 遷移ルールを追加。`needs-manual` → `modified` 遷移、親 spec の反映ルールとの整合を明記

**P3 修正（1件）**:
6. **テスト配置** — `src/__tests__/` → `src/dev-tools/exemplar-mapping/__tests__/` に修正。`getEffectiveMatches()` の配置も `src/dev-tools/exemplar-mapping/utils/` に固定
