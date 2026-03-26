# 付箋→例示マッチング パイプライン設計 v1.1

## 概要

付箋（OfficialNote）23枚を例示（Exemplar）986件にAI半自動マッチングする。
3機能循環（演習→付箋→暗記カード）の「ミッシングリンク」を埋める。

```
演習問題 ←question-exemplar-map→ Exemplar ←note-exemplar-map→ 付箋
                                     ↕
                            暗記カードテンプレート
```

## 1. マッチングフロー

### 1.1 全体フロー

```
① Claude推論（このセッション内）
   23枚 × 986 exemplar → セマンティックマッチング
   ↓
② 中間JSON保存
   src/data/fusens/note-exemplar-mappings.json
   ↓
③ レビューUI で確認・修正
   /dev-tools/exemplar-mapping
   ↓
④ official-notes.ts へ反映（Claude Codeセッションで手動実行）
   承認済み mapping → exemplarIds[] 投入
   反映前後に npm run validate 実行
```

### 1.2 マッチング方式

- **実行者**: このClaude Codeセッション自身（外部API不使用）
- **方式**: 1枚ずつ推論。付箋の `title + textSummary + tags + subject + topicId` と exemplar の `text + minorCategory + middleCategoryId + subject` をセマンティックマッチ
- **第一制約（topicId）**: 付箋の `topicId` と exemplar の `middleCategoryId` が一致するものを最優先候補とする
- **第二制約（subject）**: topicId 一致がない場合、同一 subject 内で検索
- **cross-subject**: 科目横断マッチは許可するが、reasoning に明記し confidence を下げる
- **精度目標**: 95%以上（セッションハンドオフ spec v3 と同等）

### 1.3 マッチングルール

| ルール | 条件 |
|--------|------|
| Primary | 付箋の内容を直接カバーする例示。1付箋あたり1-3件。confidence >= 0.80 |
| Secondary | 関連するが直接的でない例示。0-2件。confidence >= 0.60 |
| no-match | 適切な例示がない場合。matches を空配列にし reviewStatus を `needs-manual` に設定 |
| topicId一致 | `topicId === middleCategoryId` は confidence +0.1 のボーナス |
| cross-subject | reasoning に明記。confidence は最大 0.85 に制限 |

## 2. 中間データ形式

### 2.1 型定義

```typescript
// src/types/note-exemplar-mapping.ts（新規）

/** 候補単位のレビュー状態 */
type MatchStatus = 'pending' | 'approved' | 'rejected'

/** 付箋→例示マッチング結果（1件） */
interface NoteExemplarMatch {
  exemplarId: string        // "ex-physics-017"
  isPrimary: boolean        // true = 直接紐付け
  confidence: number        // 0.0-1.0
  reasoning: string         // マッチング根拠（日本語）
  status: MatchStatus       // 候補単位の承認状態
}

/** 付箋単位のレビュー状態 */
type EntryReviewStatus = 'pending' | 'approved' | 'rejected' | 'modified' | 'needs-manual'

/** 1枚の付箋のマッチング結果 */
interface NoteExemplarMappingEntry {
  noteId: string            // "on-001"
  noteTitle: string         // 表示用（レビューUIで使う）
  subject: string           // 科目
  topicId: string           // 付箋の topicId（バリデーション用）
  matches: NoteExemplarMatch[]
  reviewStatus: EntryReviewStatus
  reviewedAt?: string       // ISO8601
}

/** マッチング結果ファイル全体 */
interface NoteExemplarMappingsFile {
  version: 1
  generatedAt: string       // ISO8601
  generatedBy: 'claude-session'
  noteCount: number
  mappings: NoteExemplarMappingEntry[]
}
```

### 2.2 保存先

**正本（source of truth）**: localStorage（キー `exemplar-mapping-review-v1`）
- 理由: dev server からファイル書き込みは不可能。既存 dev-tools（fusen-review, fusen-annotate）の実績あるパターンに合わせる
- エクスポート機能で JSON ダウンロード可能

**初期データ**: `src/data/fusens/note-exemplar-mappings.json`
- Claude セッションが推論結果を書き出す
- レビューUI はこの JSON を初期ロード → localStorage にマージ
- localStorage に既存データがあればそちらを優先（レビュー途中の復元）

**反映フロー**: エクスポートした JSON を Claude Code セッションで読み取り → official-notes.ts に反映

### 2.3 サンプル

```json
{
  "version": 1,
  "generatedAt": "2026-03-26T10:00:00.000Z",
  "generatedBy": "claude-session",
  "noteCount": 23,
  "mappings": [
    {
      "noteId": "on-001",
      "noteTitle": "SI基本単位",
      "subject": "物理",
      "topicId": "physics-material-structure",
      "matches": [
        {
          "exemplarId": "ex-physics-058",
          "isPrimary": true,
          "confidence": 0.85,
          "reasoning": "付箋はSI基本単位7つの暗記。例示はSI基本単位系の概念を説明する内容。topicId一致。",
          "status": "pending"
        },
        {
          "exemplarId": "ex-physics-017",
          "isPrimary": false,
          "confidence": 0.65,
          "reasoning": "原子構造の基礎として単位系の知識が関連。topicId一致だが直接的ではない。",
          "status": "pending"
        }
      ],
      "reviewStatus": "pending"
    },
    {
      "noteId": "on-006",
      "noteTitle": "濃度単位換算",
      "subject": "薬剤",
      "topicId": "physics-energy-equilibrium",
      "matches": [],
      "reviewStatus": "needs-manual"
    }
  ]
}
```

**注意**: on-006 のように `subject: '薬剤'` だが `topicId: 'physics-energy-equilibrium'` の不一致データがある。マッチング時は topicId を第一制約とし、subject 不一致は warning ログに記録する。

## 3. レビューUI

### 3.1 ルーティング

- パス: `/dev-tools/exemplar-mapping`
- dev環境のみ（`import.meta.env.DEV`）
- 既存パターン: `React.lazy` + `Suspense`

### 3.2 レイアウト（1カラム、fusen-reviewパターン）

```
┌─────────────────────────────────────────┐
│ 📋 Exemplar Mapping Review              │
│ ✅ 5  ❌ 1  ✏️ 2  ⏳ 15                  │
├─────────────────────────────────────────┤
│                                         │
│ [on-001] SI基本単位        物理         │
│ ┌─────────────────────────────────────┐ │
│ │ 🖼️ 付箋画像                         │ │
│ └─────────────────────────────────────┘ │
│ SI基本単位7つの語呂合わせ。Cd m A K ... │
│ 🏷️ SI基本単位 | 語呂合わせ | 物理量    │
│ 📁 topicId: physics-material-structure  │
│                                         │
│ ── Exemplar候補 ──────────────────────  │
│                                         │
│ ✅ 🟢 Primary  0.85                     │
│ ex-physics-058: SI基本単位系の概念を... │
│ 📁 物質の構造 > physics-material-str... │
│ [✅ 承認] [❌ 却下] [🔄 Secondary に変更]│
│                                         │
│ ⏳ 🔵 Secondary  0.65                   │
│ ex-physics-017: 原子の構造と放射壊変... │
│ [✅ 承認] [❌ 却下] [🔄 Primary に変更]  │
│                                         │
│ ── ナビ ──────────────────────────────  │
│ [← Prev k]  3 / 23  [Next j →]         │
│                                         │
│ 判定: [✅ Approve 1] [✏️ Modified 2]    │
│       [❌ Reject 3]  [↩️ Reset 0]       │
│                                         │
│ [📥 Export JSON (e)]                    │
└─────────────────────────────────────────┘
```

### 3.3 コンポーネント構成（MVP）

```
src/dev-tools/exemplar-mapping/
├── ExemplarMappingPage.tsx          # ページコンポーネント (~150行)
├── ExemplarMappingPage.module.css   # スタイル
├── types.ts                         # レビュー固有の型
├── components/
│   ├── MappingCard.tsx              # 付箋情報 + exemplar候補リスト
│   └── ExemplarCandidate.tsx        # 個別exemplar候補の表示・操作
└── hooks/
    ├── useMappingData.ts            # JSON読み込み + exemplarデータ結合
    ├── useMappingReviewState.ts     # レビュー状態管理（localStorage）
    └── useMappingKeyboardNav.ts     # キーボードナビ
```

**MVP スコープ**: 候補確認・候補単位の承認/却下/primary⇔secondary変更・エクスポート。
**将来追加**: ExemplarSearchModal（検索追加モーダル）は177枚展開時に実装。23枚なら Claude Code セッション内で手動追加した方が速い。

### 3.4 状態管理

**正本: localStorage**（キー `exemplar-mapping-review-v1`）

```typescript
interface MappingReviewState {
  version: 1
  // 候補単位の状態（noteId:exemplarId → MatchStatus）
  matchStatuses: Record<string, MatchStatus>
  // 候補の isPrimary 変更（noteId:exemplarId → boolean）
  primaryOverrides: Record<string, boolean>
  // 付箋単位のレビュー状態
  entryStatuses: Record<string, EntryReviewStatus>
  // 最終位置
  lastPosition: string
  updatedAt: string
}
```

**ポイント**:
- 候補単位のステータスは `matchStatuses` で管理（キー: `${noteId}:${exemplarId}`）
- primary/secondary の変更は `primaryOverrides` で管理
- 元の中間 JSON は読み取り専用（マッチング結果の原本として保存）
- エクスポート時に中間 JSON + localStorage の状態をマージして出力

### 3.5 キーボードショートカット

| キー | 機能 |
|------|------|
| j / → | 次の付箋 |
| k / ← | 前の付箋 |
| 1 | Approve（全候補承認） |
| 2 | Modified（変更あり） |
| 3 | Reject（全候補却下） |
| 0 | Reset |
| g | 次の未レビューへジャンプ |
| e | エクスポート（JSONダウンロード） |
| ? | ヘルプ表示 |

### 3.6 エクスポート形式

エクスポート JSON は中間 JSON の形式に localStorage の変更をマージしたもの:
- `match.status` に候補単位のステータスを反映
- `match.isPrimary` に primary/secondary の変更を反映
- `entry.reviewStatus` に付箋単位のステータスを反映

## 4. official-notes.ts への反映

### 4.1 反映フロー

```
エクスポート JSON（レビュー済み）
  ↓ Claude Code セッションで手動実行
  ↓ 1. エクスポート JSON を読み取り
  ↓ 2. 承認済み候補を抽出
  ↓ 3. official-notes.ts の各ノートに exemplarIds 追加
  ↓ 4. npm run validate 実行（反映後チェック）
official-notes.ts 更新完了
```

### 4.2 反映ルール

- `entry.reviewStatus === 'approved' || 'modified'` の entry のみ反映
- `match.status === 'approved'` の候補のみ `exemplarIds` に投入
- Primary（`isPrimary: true`）を先頭に、Secondary を後ろに配置
- `linkedQuestionIds` は残す（フォールバック用）
- 重複チェック: 同一 exemplarId の重複投入を防止
- 未レビュー（`reviewStatus === 'pending'`）のエントリが残っている場合は警告

### 4.3 中間JSONの永続保持

中間 JSON（`note-exemplar-mappings.json`）は反映後も削除しない。
- 理由: primary/secondary 情報、confidence、reasoning が保持される
- 将来 `LearningLinkService` で primary/secondary を区別する際のソースになる
- git で履歴管理される

### 4.4 変換例

```typescript
// Before
{
  id: 'on-001',
  title: 'SI基本単位',
  // ... other fields
  linkedQuestionIds: ['r100-001', 'r102-001', 'r104-001', 'r109-001'],
  // exemplarIds なし
}

// After
{
  id: 'on-001',
  title: 'SI基本単位',
  // ... other fields
  linkedQuestionIds: ['r100-001', 'r102-001', 'r104-001', 'r109-001'],
  exemplarIds: ['ex-physics-058', 'ex-physics-017'],  // Primary先頭, Secondary後
}
```

## 5. バリデーション

### 5.1 追加ルール（data-validator）

| ルール名 | レベル | チェック内容 |
|---------|--------|------------|
| `note-exemplar-exists` | error | `exemplarIds` の各IDが `EXEMPLARS` に存在するか |
| `note-exemplar-no-duplicates` | error | `exemplarIds` 内に重複がないか |
| `note-exemplar-subject-match` | warning | 付箋の `subject` と exemplar の `subject` が一致するか（cross-subject は warning） |
| `note-exemplar-topic-match` | warning | 付箋の `topicId` と exemplar の `middleCategoryId` が一致するか |
| `note-has-exemplars` | info | `exemplarIds` が未設定の付箋を報告 |

### 5.2 実装場所

- `src/utils/data-validator/rules/` に新規ルールファイル追加
- 既存の `runAllRules()` に統合
- `ValidationContext` に `exemplars: Exemplar[]` と `officialNotes: OfficialNote[]` を追加

## 6. 設計判断の記録

| 判断 | 決定 | 理由 |
|------|------|------|
| マッチングAPI | Claude Codeセッション自身 | トークン余剰、最高精度、スクリプト不要 |
| 対象 | official-notes.ts 23枚 | キュレーション済みで精度検証しやすい |
| 中間形式 | JSON（reasoning + 候補単位status付き） | 推論根拠の保存、やり直し可能、候補単位で承認/却下 |
| レビューUI | 新規 `/dev-tools/exemplar-mapping` | fusen-review と関心分離 |
| レイアウト | 1カラム | シンプル、fusen-reviewパターン踏襲 |
| 状態保存 | localStorage（正本）+ エクスポート | dev server 制約、既存パターン踏襲 |
| マッチング第一制約 | topicId ↔ middleCategoryId | subject だけでは不十分（on-006問題） |
| 候補ステータス | match単位でpending/approved/rejected | 付箋単位だけでは却下候補を特定不能 |
| primary/secondary保持 | 中間JSON永続 + exemplarIds配列順 | 情報損失を最小化 |
| UIスコープ | MVP（検索モーダルなし） | 23枚なら手動追加で十分 |

## 7. スコープ外（将来タスク）

- **同topicId全exemplar一覧表示**: レビュー時に「なぜこの候補が選ばれたか」を判断するため、同じtopicId（middleCategoryId）内の全exemplarを折りたたみセクションで表示。ユーザーフィードバック（2026-03-26スマホ実機確認時）
- fusens-master.json 177枚への横展開
- ExemplarSearchModal（検索追加モーダル）
- Supabase `official_note_exemplars` テーブル
- LearningLinkService の逆引きマップ実装
- 暗記カードテンプレートとの紐付け
- 2カラムレイアウトへの変更（1カラムで不便なら）

## GPT-5.4 レビュー対応記録

### v1.0 → v1.1（レビュー1回目）

**P1 修正（3件）**:
1. **候補単位のレビュー状態** — `NoteExemplarMatch` に `status: MatchStatus` フィールド追加。`MappingReviewState.matchStatuses` で候補単位の承認/却下を管理
2. **topicId ↔ middleCategoryId の活用** — マッチングの第一制約を `topicId === middleCategoryId` に変更。subject だけの判定を廃止。バリデーションに `note-exemplar-topic-match` ルール追加
3. **状態保存方針の矛盾解消** — localStorage を正本に一本化。中間 JSON は初期データ兼原本として読み取り専用に。§2.2 と §3.4 の矛盾を除去

**P2 修正（4件）**:
1. **confidence サンプル矛盾** — サンプルの Primary confidence を 0.70→0.85 に修正。`needs-manual` ステータス追加（マッチなし時）
2. **反映フローの安全策** — 反映前後の validator 実行、重複チェック、未レビュー残存警告を追加
3. **バリデーション追加** — `note-exemplar-no-duplicates`, `note-exemplar-topic-match` ルール追加
4. **primary/secondary情報保持** — 中間 JSON を永続アセットとして保持する方針を明記

**P3 対応（1件）**:
1. **UIスコープ縮小** — ExemplarSearchModal を将来タスクに移動。MVP は候補確認・承認/却下・エクスポートに絞る
