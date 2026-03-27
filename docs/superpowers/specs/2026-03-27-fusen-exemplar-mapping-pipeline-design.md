# 付箋→例示マッチング 横展開パイプライン設計 v1.0

## 概要

fusens-master.json の 1,642枚を Exemplar（986件）にマッチングする。
2パス設計（topicId推定 → exemplarマッチング）で、並列バックグラウンドエージェント（Opus 4.6）が処理。

**前提**: 既存23枚マッチング（v1.1 spec）のスケールアウト版。
**前spec**: `2026-03-26-note-exemplar-mapping-design.md`（23枚版）

```
fusens-master.json (1,642枚, topicId=null)
  ↓ Phase 1: topicId推定（16並列エージェント）
  ↓ 校正 + gate通過
  ↓ Phase 2: exemplarマッチング（20並列エージェント）
  ↓ マージ + バリデーション + GPT-5.4レビュー
note-exemplar-mappings.json (1,642件)
```

## レビュー履歴

| 日付 | レビュアー | 対象 | 結果 |
|------|-----------|------|------|
| 2026-03-27 | GPT-5.4 | セクション1: 全体アーキテクチャ | P1×2修正（科目横断先送り不可、科目名正式名統一） |
| 2026-03-27 | GPT-5.4 | セクション2: Phase 1 topicId推定 | P1×3修正（科目誤り検知、confidence校正、topCandidates拡張） |
| 2026-03-27 | GPT-5.4 | セクション3: Phase 1レビュー手順 | P1×3修正（番兵サンプル、サンプル数拡大、移行gate定義） |
| 2026-03-27 | GPT-5.4 | セクション4: Phase 2 exemplarマッチング | P1×2修正（ID対応表、マージ後バリデーション）、P2×3修正（2段階検索、cap例外、crossSubjectHints廃止） |
| 2026-03-27 | エージェントチーム(5人) | ID体系 + Phase 2設計 | 4対1でA案（fusen-NNNN統一）採用 |

---

## 1. 全体アーキテクチャ

### 1.1 2パス設計

```
【前提タスク】ID統一（on-NNN → fusen-NNNN、8ファイル）
    ↓
【Phase 1: topicId推定】
  16並列バックグラウンドエージェント（科目単位、大科目は分割）
  入力: fusens-master.json 該当科目分 + 同科目の ALL_TOPICS
  出力: /tmp/claude/fusens/topicid-{subject}-{batch}.json
    ↓
【校正】薬理バッチ1で60枚検証 → 番兵サンプル(病態・法規各10枚)
    ↓
【gate通過】移行条件8項目を全て満たす
    ↓
【Phase 2: exemplarマッチング】
  20並列バックグラウンドエージェント
  入力: topicId確定済み付箋 + 2段階shortlist（30-45件）
  出力: /tmp/claude/fusens/exemplar-{subject}-{batch}.json
    ↓
【マージ】既存エントリ保持 + 新規追加 → note-exemplar-mappings.json
    ↓
【最終レビュー】npm run validate + GPT-5.4 codex review
```

### 1.2 科目名ルール

全ての入出力で `QuestionSubject` 型の正式名を使用:

```
'物理' | '化学' | '生物' | '衛生' | '薬理' | '薬剤'
| '病態・薬物治療' | '法規・制度・倫理' | '実務'
```

略称（「病態」「法規」等）は禁止。

### 1.3 ファイル競合回避

- 各エージェントは独立した中間ファイルに書き出し
- 同一ファイルへの並列書き込みなし
- マージは全エージェント完了後に1回だけ実行

---

## 2. 前提タスク: ID統一

### 2.1 方針

**全付箋IDを `fusen-NNNN` に統一**（エージェントチーム4対1で合意）。

理由:
- マスターデータ（fusens-master.json）のIDをそのまま使える
- 倉庫（データ）から店頭（アプリ画面）まで同じ名札で追跡可能
- 対応表の保守コストを排除
- 現在23件のみなので移行コスト最小（8ファイル、約35分）

### 2.2 変更対象

| ファイル | 変更内容 | 件数 |
|---------|---------|------|
| `src/data/official-notes.ts` | `id: 'on-001'` → `id: 'fusen-0001'` | 23件 |
| `src/data/flashcard-templates.ts` | `source_id: 'on-001'` → `source_id: 'fusen-0001'` | 10件 |
| `src/data/fusens/note-exemplar-mappings.json` | `noteId: 'on-001'` → `noteId: 'fusen-0001'` | 23件 |
| `src/hooks/useBookmarks.ts` | migration関数追加（localStorage） | 1関数 |
| テストファイル | モックID更新 | 4ファイル |

### 2.3 on-NNN → fusen-NNNN 対応表

既存23件の対応は `imageFile` パスで機械的に特定可能（両方とも同じ画像を参照）。
対応表を作成し、一括置換を実行。

### 2.4 localStorage マイグレーション

```typescript
// useBookmarks.ts 内
function migrateBookmarkIds(bookmarks: BookmarkedNote[]): BookmarkedNote[] {
  const ID_MAP: Record<string, string> = {
    'on-001': 'fusen-0001',
    'on-002': 'fusen-0002',
    // ... 23件
  }
  return bookmarks.map(b => ({
    ...b,
    note_id: ID_MAP[b.note_id] ?? b.note_id
  }))
}
```

---

## 3. Phase 1: topicId推定

### 3.1 エージェント構成

| 項目 | 内容 |
|------|------|
| モデル | Opus 4.6 |
| 実行 | バックグラウンド |
| 入力 | fusens-master.json 該当科目分 + 同科目の ALL_TOPICS |
| 出力 | `/tmp/claude/fusens/topicid-{subject}-{batch}.json` |

### 3.2 バッチ分割

| 科目 | 枚数 | バッチ数 | 1バッチ上限 |
|------|------|---------|------------|
| 薬理 | 413 | 3 | ~138枚 |
| 病態・薬物治療 | 385 | 3 | ~129枚 |
| 薬剤 | 236 | 2 | ~118枚 |
| 生物 | 198 | 2 | ~99枚 |
| 物理 | 121 | 1 | 121枚 |
| 衛生 | 117 | 1 | 117枚 |
| 法規・制度・倫理 | 72 | 1 | 72枚 |
| 化学 | 63 | 1 | 63枚 |
| 実務 | 37 | 1 | 37枚 |
| **合計** | **1,642** | **16** | |

### 3.3 プロンプト設計

```
あなたは薬剤師国家試験の出題基準に精通した専門家です。

## タスク
以下の付箋データに最も適切な topicId（中項目ID）を割り当ててください。

## 科目: {subject}
## 選択肢となる中項目一覧:
{id} | {name} | {majorCategory} | {minorCategories代表語}
...

## 付箋データ（{N}枚）:
--- {fusenId} ---
title: ...
body: ...（OCRテキスト、誤字・略語あり）
tags: [...]
noteType: ...
---

## 出力形式（JSON配列）:
[{fusenId, topicId, confidence, reasoning, topCandidates, subjectSuspected, needsReview}]

## ルール
1. 必ず選択肢一覧の中から選ぶ
2. confidence: 1つに絞れる=0.9+、2候補迷い=0.7-0.9、3候補以上=<0.7
3. topCandidates: 上位2-3件を {topicId, score} で返す
4. body はOCRテキスト。意味で判断
5. 判断優先順位: tags > title > body
6. mnemonic（語呂合わせ）は覚える対象の知識で分類
7. どの語が根拠か reasoning に明示（1-2文）
8. どのtopicにも合わない場合 subjectSuspected: true
9. 難例（mnemonic/solution/短文/数式中心/タグなし）は needsReview: true
```

### 3.4 出力スキーマ

```typescript
interface TopicIdResult {
  subject: string              // QuestionSubject正式名
  batchId: string              // "pharmacology-1"
  processedAt: string          // ISO8601
  promptVersion: string        // "v1.0"
  results: TopicIdAssignment[]
}

interface TopicIdAssignment {
  fusenId: string              // "fusen-0001"
  topicId: string              // "physics-material-structure"
  confidence: number           // 0.0-1.0
  reasoning: string            // 1-2文、根拠語を明示
  topCandidates: Array<{       // 上位2-3件（1位含む）
    topicId: string
    score: number
  }>
  subjectSuspected: boolean    // 科目誤り疑い
  needsReview: boolean         // 難例フラグ
}
```

---

## 4. Phase 1 レビュー手順

### 4.1 校正フロー

```
Step 1: 薬理バッチ1（~138枚）を先行実行
Step 2: 一次校正（薬理から60枚）
  - confidence ≥ 0.9 から30枚
  - confidence 0.7-0.9 から20枚
  - confidence < 0.7 から10枚（あれば全件）
  → precision測定、暫定閾値を設定
Step 3: 残り15エージェント実行
Step 4: 番兵検証（病態・法規から各10枚 = 20枚）
  → 科目間でconfidenceの信頼度に差がないか確認
  → 差があれば科目別閾値に調整
```

### 4.2 手動レビュー対象（優先順）

| 優先度 | 条件 | 推定枚数 | 対応 |
|--------|------|---------|------|
| 1 | `subjectSuspected: true` | ~20-50枚 | 全件確認、科目変更→re-run |
| 2 | `confidence < 0.7` | ~100-200枚 | topCandidatesから選択 |
| 2b | `needsReview: true` && `confidence < 0.9` | ~50-100枚 | 全件確認 |
| 3 | `top1-top2 margin < 0.15` | ~50-100枚 | 僅差は要確認 |
| 4 | `confidence 0.7-0.9` | ~300枚 | 10%層化サンプリング |
| 5 | `confidence ≥ 0.9` | ~1,000枚 | 校正で精度確認済みなら自動承認 |

### 4.3 自動チェック（マージ後）

- 全1,642枚のconfidence分布サマリー
- subjectSuspected / needsReview の一覧
- subject別 × topic分布、noteType別 × topic分布
- top1-top2 margin分布
- topicIdが ALL_TOPICS に存在するか全件チェック
- topicIdから逆引きした科目 === fusen.subject の整合性

### 4.4 Phase 1→Phase 2 移行gate

以下を **全て** 満たしたら Phase 2 へ:

- [ ] `subjectSuspected=true` 全件レビュー完了（修正 or 承認）
- [ ] `confidence < 0.7` 全件レビュー完了
- [ ] `needsReview=true && confidence < 0.9` 全件レビュー完了
- [ ] `top1-top2 margin < 0.15` 全件レビュー完了
- [ ] 高confidence帯(≥0.9)の監査precision ≥ 90%
- [ ] topic偏りに説明不能な集中なし
- [ ] `npm run validate` エラー 0
- [ ] `topicId === null` が 0件

### 4.5 レビューUI拡張（最小限）

既存 `/dev-tools/fusen-review` に追加:
- topicId表示（confidence値、margin付き）
- topCandidatesからワンクリック差し替え
- フィルター: confidence帯 / subjectSuspected / needsReview
- reasoning表示

---

## 5. Phase 2: exemplarマッチング

### 5.1 2段階shortlist方式

GPT-5.4 P2指摘（ランキングノイズ）への対応として、986件フル投入ではなく2段階方式を採用。

```
Stage A: shortlist作成（データ処理のみ、AI推論不要）
  - topicId完全一致のexemplar: 全件（平均5-15件）
  - 同科目・同大項目（majorCategory一致）: 全件（10-30件）
  → 1付箋あたり15-45件のshortlist
  → shortlistが10件未満の場合: 同科目の全exemplarに拡大

Stage B: shortlistをプロンプトに含めてClaude推論スコアリング
```

**科目横断マッチング**: Phase 2のスコープ外。バリデーションのwarningで検出→手動対応。
**shortlist生成**: エージェントプロンプトに付箋データを渡す前に、親セッションがデータ処理でshortlistを構築し、プロンプトに埋め込む。

### 5.2 エージェント構成

| 項目 | 内容 |
|------|------|
| モデル | Opus 4.6 |
| 実行 | バックグラウンド |
| 入力 | topicId確定済み付箋 + shortlist（15-45件/枚） |
| 出力 | `/tmp/claude/fusens/exemplar-{subject}-{batch}.json` |

### 5.3 バッチ分割

| 科目 | 枚数 | バッチ数 | 1バッチ上限 |
|------|------|---------|------------|
| 薬理 | 413 | 4 | ~103枚 |
| 病態・薬物治療 | 385 | 4 | ~97枚 |
| 薬剤 | 236 | 3 | ~79枚 |
| 生物 | 198 | 2 | ~99枚 |
| 物理 | 121 | 2 | ~61枚 |
| 衛生 | 117 | 2 | ~59枚 |
| 法規・制度・倫理 | 72 | 1 | 72枚 |
| 化学 | 63 | 1 | 63枚 |
| 実務 | 37 | 1 | 37枚 |
| **合計** | **1,642** | **20** | |

### 5.4 プロンプト設計

```
あなたは薬剤師国家試験の出題基準に精通した専門家です。

## タスク
以下の付箋に関連するExemplar（学習目標）をマッチングしてください。

## 付箋データ（{N}枚、科目: {subject}）:
--- {fusenId} ---
title: ...
topicId: {確定済み}
body: ...
tags: [...]
noteType: ...
---

## Exemplar候補（shortlist、各付箋ごとに提示）:
fusen-0501 の候補:
  ex-pharmacology-023 | pharmacology-ans-drug | アドレナリン受容体 | α1受容体の...
  ex-pharmacology-024 | pharmacology-ans-drug | 交感神経作用薬 | ...
  ...

## 出力形式（JSON配列）:
[{fusenId, matches[{exemplarId, isPrimary, confidence, reasoning}]}]

## マッチングルール
1. Primary: 付箋の知識を直接カバー。1-3件、confidence ≥ 0.80
2. Secondary: 間接的に関連。0-2件、confidence ≥ 0.60
3. no-match: 適切なものがなければ matches を空配列
4. 合計5件以内
5. reasoning は1文で簡潔に

## confidence上限ルール
- topicId一致: 上限なし
- 同科目・topicId不一致: 上限 0.90
- 概念完全一致かつ同topicに候補なし: 0.90 まで許可（例外、モデル判断。reasoning に根拠明記必須）
```

### 5.5 出力スキーマ

```typescript
interface ExemplarMatchResult {
  subject: string              // QuestionSubject正式名
  batchId: string              // "pharmacology-1"
  processedAt: string
  promptVersion: string        // "v1.0"
  results: FusenExemplarMatch[]
}

interface FusenExemplarMatch {
  fusenId: string
  matches: Array<{
    exemplarId: string
    isPrimary: boolean
    confidence: number
    reasoning: string          // 1文
  }>
}
```

### 5.6 既存23件との整合

- 既存23件（ID統一後は `fusen-NNNN`）は Phase 2 対象から **除外**
- 除外判定: official-notes.ts に存在する fusenId をセットで持ち、マッチ → スキップ
- 既存マッピングは note-exemplar-mappings.json 内でそのまま保持

---

## 6. マージ・バリデーション・成果物

### 6.1 マージ手順

1. `/tmp/claude/fusens/exemplar-*.json` を全て読み込み
2. 既存 `note-exemplar-mappings.json`（23件）を読み込み
3. 新規エントリを追加（fusenId = noteId、reviewStatus: 'pending'）
4. noteCount を更新
5. JSON書き出し → git commit

### 6.2 バリデーションルール（既存5 + 新規3）

| ルール | 新規/既存 | severity |
|--------|----------|----------|
| `note-exemplar-exists` | 既存 | error |
| `note-exemplar-no-duplicates` | 既存 | error |
| `note-exemplar-subject-match` | 既存 | warning |
| `note-exemplar-topic-match` | 既存 | warning |
| `note-has-exemplars` | 既存 | info |
| `note-exemplar-max-count` | **新規** | error |
| `note-exemplar-primary-count` | **新規** | warning |
| `note-id-unique` | **新規** | error |

### 6.3 GPT-5.4 最終レビュー

```bash
codex review --base <Phase2開始前のSHA>
```

### 6.4 成果物

| 成果物 | 内容 |
|--------|------|
| `fusens-master.json` | 1,642件全てに topicId 設定済み |
| `note-exemplar-mappings.json` | 1,642件のexemplarマッチング結果 |
| バリデーションルール3件 | `npm run validate` 拡張 |

### 6.5 スコープ外（後続タスク）

- official-notes.ts 1,642件生成スクリプト
- FlashCardテンプレート自動生成
- ID統一マイグレーション実装（本パイプライン実行前の前提タスク）
- レビューUI拡張（Phase 1レビュー時に最小限で実装）

---

## 7. 実行順序まとめ

```
① ID統一（on-NNN → fusen-NNNN、8ファイル・35分）
② Phase 1: topicId推定
   - 薬理バッチ1を先行実行 → 60枚校正
   - 残り15エージェント並列実行
   - 番兵検証（病態・法規各10枚）
   - gate通過判定
③ Phase 2: 2段階exemplarマッチング
   - Stage A: shortlist作成
   - Stage B: 20並列エージェントでスコアリング
④ マージ → npm run validate → GPT-5.4 codex review
⑤ 異常値のみレビューUIで手動修正
```

---

## 8. エージェントチームレビュー記録

### ID体系（セクション2）

5人のエージェント + GPT-5.4 で多角的に議論:

| 役割 | 推奨 | 理由 |
|------|------|------|
| PdM | A（fusen統一） | ブックマーク移行23件のみ、今が最善タイミング |
| データアーキテクト | A（fusen統一） | マスターから一気通貫、対応表は必ず腐る |
| QAエンジニア | A寄り | 2系統は見えないデータ消失の温床 |
| フロントエンド | A（fusen統一） | 8ファイル35分、ロジック変更ゼロ |
| GPT-5.4 | C（2系統維持） | 移行コストと破壊リスク |

**結果**: 4対1で A案採用。GPT-5.4の懸念はフロントエンド調査で「影響は文字列置換のみ」と判明し解消。

### QA リスク分析

| リスク | 発生確率 | 影響度 | 緩和策 |
|--------|---------|--------|--------|
| ID変換事故 | High | High | 対応表 + migration関数 + テスト |
| エージェント品質ばらつき | High | Medium | gate + サンプリング検査 |
| マージ時事故 | Medium | High | 既存保護 + 件数アサーション + dry-run |
| ロールバック不能 | Low | High | 段階別git commit + スナップショット |

### 絶対やるべきテスト TOP3

1. ブックマークが消えないか（localStorage migration）
2. 件数が合っているか（1,642件、重複なし）
3. topicIdと科目が矛盾していないか（Phase 1 gate）
