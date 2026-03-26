# 学習サイクル循環設計 — 3機能の紐付け・ナビゲーション・データ蓄積

**Author**: makio8 + Claude
**Date**: 2026-03-26
**Status**: Draft v1.2
**Reviewed by**: GPT-5.4 (Codex) — セクション1-4全レビュー済み / 5人チーム（PdM/グロース/アナリティクス/アーキテクト/モバイル）レビュー済み
**Based on**: PRD_v1.md, 2026-03-26-notespage-redesign-design.md, 2026-03-22-session-handoff-exemplar-mapping.md

---

## 1. 概要

### 1.1 ビジョン

> 「演習問題・付箋まとめ・暗記フラッシュカードが同じ知識単位で紐付き、ぐるぐる回ることで問題を解けるようになる」

ファウンダーの学習モデル（発見→理解→暗記→確認）をアプリの構造として実現する。

### 1.2 学習サイクル

```
        演習問題
       ↗️     ↘️
      ↙️       ↖️
暗記カード ←→ 付箋まとめ
```

| 起点 | → 次のアクション |
|------|----------------|
| 演習で間違えた | → その知識の**付箋**を見る → **暗記カード**で覚える |
| 付箋を眺めている | → **演習**で本当に解けるか確認 → **カード**で定着 |
| 暗記カード復習後 | → **演習**で実践確認 → **付箋**で全体像を再確認 |

### 1.3 スコープ

| 含む | 含まない（別spec/タスク） |
|------|------------------------|
| Exemplarハブによる3機能紐付けのデータモデル | 付箋→Exemplar AIマッチングの実装 |
| 循環ナビゲーション設計 | FlashCardPage UIリデザイン |
| カード生成パイプライン設計 | NotesPage UIリデザイン（別spec済み） |
| データ蓄積スキーマ定義 | Supabase テーブル作成・認証実装 |
| LearningLinkService の設計 | ランキング・相対評価のUI |

---

## 2. 紐付けの構造（Exemplarハブ）

### 2.1 紐付けの粒度

現状の `topicId`（中項目、約80件）は粗すぎる。4階層目の **Exemplar（例示、986件）** をハブとして3機能を紐付ける。

```
科目（物理）
  └ 大項目（物質の物理的性質）
      └ 中項目（物質の構造）  ← 今のtopicId（ブラウズ用に残す）
          └ 例示「SI基本単位を説明できる」 ← これがハブ（986件、ID付き）
```

たとえ話：図書館の棚（中項目）→引き出し（Exemplar）。引き出しの中にドリル（演習）・まとめカード（付箋）・単語帳（暗記カード）が入っている。

### 2.2 紐付けの全体像

```
演習問題 ←question-exemplar-map→ Exemplar ←note-exemplar-map→ 付箋
                                     ↕
                              暗記カードテンプレート
                            (primary_exemplar_id)
```

- **演習問題↔Exemplar**: 既存。4,095問→986例示の多対多（isPrimaryフラグ付き）
- **付箋↔Exemplar**: 新規。AI半自動マッチング（別タスク）で紐付け
- **カード→Exemplar**: 新規。生成時にprimary_exemplar_idを設定

### 2.3 関連解決のルール

| 場面 | primary exemplar | secondary exemplar |
|------|-----------------|-------------------|
| 直接導線（「この付箋の問題」） | ✅ 表示 | 非表示 |
| 拡張表示（「関連する問題」） | 強調表示 | 薄く表示 |
| linked_group（連問セット） | グループ内1問でも該当→兄弟もまとめて表示 |

---

## 3. データモデル

### 3.1 OfficialNote（付箋）— 変更点

```typescript
interface OfficialNote {
  id: string
  title: string
  imageUrl: string
  textSummary: string
  subject: QuestionSubject
  tags: string[]
  importance: number
  tier: 'free' | 'premium'
  noteType?: NoteType

  // ブラウズ用（便利フィールド。正はexemplar）
  topicId: string

  // フォールバック（exemplarIds未設定時のみ使用）
  linkedQuestionIds: string[]

  // 正の紐付け（AIマッチング後に投入、optional）
  exemplarIds?: string[]

  // ❌ linkedCardIds 廃止予定
  //    Phase 1: optional化 + deprecation コメント（既存23件の [] を壊さない）
  //    Phase 2: 全消費コード更新後に型から削除
  //    理由: 共通マスタにユーザーデータを持たせない
  linkedCardIds?: string[]  // @deprecated — exemplar経由で検索。Phase 2で削除予定
}
```

**導出ルール**:
```typescript
function getRelatedQuestionIds(note: OfficialNote): string[] {
  if (note.exemplarIds && note.exemplarIds.length > 0) {
    return resolveQuestionsFromExemplars(note.exemplarIds)
  }
  return note.linkedQuestionIds  // フォールバック
}
```

### 3.2 NoteExemplarMapping（中間マッピング）

```typescript
// TSではマッピング配列、将来DBでは中間テーブル
interface NoteExemplarMapping {
  noteId: string
  exemplarId: string
  isPrimary: boolean
}
```

DB設計時は `official_note_exemplars(note_id, exemplar_id, is_primary, sort_order)` テーブルに変換。
配列カラム（`exemplarIds: string[]`）ではなく中間テーブルにする（GPT-5.4 P2指摘: 検索・制約・移行で有利）。

### 3.3 FlashCardTemplate（カードテンプレート — 公式コンテンツ）

```typescript
// src/data/flashcard-templates.ts に焼き込み（全ユーザー共通）
interface FlashCardTemplate {
  id: string                    // 'fct-001'
  source_type: 'fusen' | 'explanation'
  source_id: string             // 付箋ID or 問題ID
  primary_exemplar_id: string   // ハブへの接続点
  subject: QuestionSubject
  front: string                 // 表面（問い）
  back: string                  // 裏面（答え）
  format: CardFormat            // 'term_definition' | 'question_answer' | 'mnemonic'
  tags: string[]
}
```

**設計判断**: カードの「中身」と「復習進捗」を分離（GPT-5.4 P1対応）。
- テンプレート = 教科書（全員同じ）→ TSファイル
- 進捗 = 付箋の貼り方（人それぞれ）→ localStorage/Supabase

**旧FlashCard型からの変更点**:
- `question_id` → `source_type` + `source_id` に統合（付箋起点カードで二重の真実源を防止）
- `topic_id` → 廃止（exemplar経由で導出）
- `user_id`, SM-2フィールド → CardProgress に分離

### 3.4 CardProgress（ユーザー復習進捗 — 個人データ）

```typescript
// localStorage / Supabase に保存
interface CardProgress {
  template_id: string           // FlashCardTemplate.id
  user_id: string
  ease_factor: number           // SM-2（デフォルト2.5）
  interval_days: number
  next_review_at: string        // ISO8601
  review_count: number
  correct_streak: number
  last_reviewed_at: string
}
```

### 3.5 リポジトリAPI

```typescript
// テンプレート（読み取り専用、TSファイルから）
interface IFlashCardTemplateRepo {
  getAll(): FlashCardTemplate[]
  getByExemplarId(exemplarId: string): FlashCardTemplate[]
  getBySourceId(sourceId: string): FlashCardTemplate[]
}

// 進捗（ユーザーデータ、localStorage/Supabase）
interface ICardProgressRepo {
  getAll(): CardProgress[]
  upsert(templateId: string, result: ReviewResult): CardProgress
  getDueCards(): CardProgress[]  // next_review_at ≤ 今日
}
```

---

## 4. 循環ナビゲーション設計

### 4.1 LearningLinkService（逆引き表の管理係）

アプリ起動時に6つの逆引きMapを構築。画面表示時はMap参照のみで高速。

```typescript
class LearningLinkService {
  // 事前構築するインデックス（起動時1回だけ）
  private questionToExemplars: Map<string, string[]>
  private exemplarToQuestions: Map<string, string[]>
  private exemplarToNotes: Map<string, string[]>
  private exemplarToCards: Map<string, string[]>
  private noteToExemplars: Map<string, string[]>
  private cardToExemplar: Map<string, string>

  // 問題起点
  getNotesForQuestion(questionId: string): OfficialNote[]
  getCardsForQuestion(questionId: string): FlashCardTemplate[]

  // 付箋起点
  getQuestionsForNote(noteId: string): string[]
  getSourceCards(noteId: string): FlashCardTemplate[]      // その付箋から生成されたカードだけ
  getExemplarCards(noteId: string): FlashCardTemplate[]    // 同exemplarの全カード

  // カード起点
  getRelatedNote(card: FlashCardTemplate): OfficialNote | undefined
    // source_type='fusen' → 直接source_idで取得
    // source_type='explanation' → primary_exemplar_id経由で関連付箋にフォールバック
  getQuestionsForCard(card: FlashCardTemplate): string[]
}
```

### 4.2 FlashCardPracticeContext（練習の文脈）

カード練習画面に「どこから来て、何の練習か」を伝える仕組み。

```typescript
interface FlashCardPracticeContext {
  mode: 'review_queue' | 'exemplar' | 'note'
  exemplarId?: string
  noteId?: string
  cardIds: string[]       // 練習するカードのID一覧
  returnTo: string        // 練習後の戻り先URL
}

// 遷移時に state で渡す
navigate('/cards/review', { state: context })
```

### 4.3 問題解答後の導線（QuestionPage）

```
┌──────────────────────────────┐
│ 正解！                        │
│ 📝 AI解説                     │
│                               │
│ ── この知識をもっと ────── │
│ 📌 付箋を見る (2枚)  ← 主CTA（付箋優先）
│ 🃏 カードで練習 (3枚) ← サブCTA
│                               │
│ コンテンツなしの時:            │
│ 📌 関連付箋はまだありません    │ ← グレー＋行動テキスト
│ 🃏 関連カードはまだありません   │
│                               │
│ → 次の問題                    │
└──────────────────────────────┘
```

**常設枠**: コンテンツあり→アクティブ（青）、なし→グレーアウト＋次行動テキスト。
**優先ルール**: 付箋あり→付箋が主CTA。付箋なし＋カードあり→カードが主CTA。
- 「まず理解（付箋）、次に定着（カード）」の学習意図を反映（GPT-5.4 P2指摘）

**タップ時の挙動**:
| 項目 | 1件の場合 | 2件以上 |
|------|----------|--------|
| 📌 付箋 | 直接 `/notes/:fusenId` | BottomSheetで選択→詳細へ |
| 🃏 カード | 直接練習開始 | 直接練習開始（exemplar単位でまとめて） |

### 4.4 付箋詳細からの導線（FusenDetailPage）

```
── この知識を使う ──────────
📝 関連問題を解く
  ├ 主: primary exemplarの未回答問題 (N問)
  └ 補助: secondary含む全関連問題 (M問) ← 薄く表示
🃏 暗記カードで練習
  ├ この付箋のカード (N枚) ← source由来
  └ 関連カード (M枚) ← exemplar由来

[ この知識の問題を解く ] ← メインCTA
```

### 4.5 カード練習後の導線（FlashCardPage）

```
練習結果: 5枚中 3枚覚えた
── もっと深める ──
📌 関連付箋を見る      ← getRelatedNote（fusen直接 or exemplar経由）
📝 関連問題で確認する   ← primary_exemplar経由
[ 続けて練習 ] [ ホームに戻る ]
```

### 4.6 カード練習の3モード

| モード | 入口 | cardIdsの決め方 | returnTo |
|--------|------|----------------|----------|
| **Exemplar集中** | 問題解答後🃏 | exemplarToCards[exemplarId] | 問題画面 |
| **付箋集中** | 付箋詳細🃏 | getSourceCards(noteId) | /notes/:fusenId |
| **SM-2復習キュー** | ホーム「今日のカード」 | next_review_at ≤ 今日 | /home |

### 4.7 カード練習のUX

- **フリップ型** + **Tinderスワイプ**
  - 表を見る → タップで裏表示 → 左スワイプ「もう一回」/ 右スワイプ「覚えた」
  - `useSwipeNavigation`（QuestionPage実装済み）を流用可能

---

## 5. カード生成パイプライン

### 5.1 生成元は2系統

| 系統 | 入力 | 出力カード例 |
|------|------|------------|
| **付箋ベース** | 付箋の画像＋OCRテキスト | 表「SI基本単位7つは？」裏「m, kg, s, A, K, mol, cd」 |
| **問題解説ベース** | 問題文＋選択肢＋AI解説 | 表「アルキル化薬でないのは？」裏「メトトレキサート（代謝拮抗薬）」 |

### 5.2 生成の優先度

重要なものからバッチ生成:

```
優先度1: 付箋あり × 必須問題（正答率60%以上）
  → 付箋ベース + 問題解説ベース 両方生成

優先度2: 付箋あり × その他の問題
  → 付箋ベースのみ

優先度3: 付箋なし × 必須問題
  → 問題解説ベースのみ

優先度4: 残り
  → 後回し
```

### 5.3 生成フロー

```
バッチスクリプト（CLIで手動実行）
  │
  ├── 1. 付箋ベース生成
  │   入力: OfficialNote（imageUrl + textSummary + tags）
  │   → AI（Claude API）に「この付箋から1〜3枚の一問一答を作って」
  │   → FlashCardTemplate[] を生成
  │   → source_type='fusen', source_id=noteId
  │   → primary_exemplar_id = note.exemplarIds の primary
  │
  └── 2. 問題解説ベース生成
      入力: Question（question_text + choices + explanation）
      → AI に「この問題から覚えるべき知識を1〜5枚のカードにして」
      → FlashCardTemplate[] を生成
      → source_type='explanation', source_id=questionId
      → primary_exemplar_id = questionExemplarMap の primary
```

### 5.4 生成されたカードの保存

テンプレートは `src/data/flashcard-templates.ts` に焼き込み（公式コンテンツ）。
付箋と同じパターン: 共通マスタ（テンプレート）＋ユーザーデータ（復習進捗）。

---

## 6. データ蓄積スキーマ

**注意**: 本セクションは概要設計。詳細なDDL・RLS・インデックス・移行スクリプトは **別spec（DB設計spec）** で策定する。

### 6.1 テーブル一覧

GPT-5.4 + 5人チーム（PdM/グロースハッカー/データアナリティクス/データアーキテクト/モバイルエンジニア）のレビューを経て確定。

```
── 公式コンテンツ（全ユーザー共通、読み取り専用）──
  questions              問題マスタ
  official_notes         付箋マスタ
  note_exemplars         付箋↔例示の中間テーブル
  flashcard_templates    カードテンプレート
  exemplars              例示マスタ（986件）
  question_exemplars     問題↔例示の中間テーブル

── ユーザーデータ（個人、読み書き）──
  users                  ユーザー（auth.usersと分離、PII最小化）
  user_profiles          受験年度・目標・学習フェーズ（レコメンド基盤）★新規
  answer_history         回答履歴（メインの資産）
  card_progress          カード復習進捗（状態テーブル）
  card_review_history    カード復習イベント履歴（SM-2再計算用）★新規
  bookmarks              付箋ブックマーク
  study_sessions         学習セッション
  purchases              課金管理 ★新規
  device_tokens          プッシュ通知トークン ★新規
  notification_preferences 通知設定 ★新規
```

### 6.2 answer_history（メインの資産）

```sql
CREATE TABLE answer_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES users(id) NOT NULL,
  question_id     text NOT NULL,
  session_id      uuid REFERENCES study_sessions(id),  -- ★ どのセッションで解いたか
  selected_answer int[],           -- NULL: スキップ時。単一回答は [N] で格納
  is_correct      boolean NOT NULL,
  time_spent_ms   integer,         -- ミリ秒（既存TSはseconds、移行時に×1000変換）
  skipped         boolean DEFAULT false,
  answered_at     timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now(),
  -- 整合性制約
  CHECK (skipped = false OR selected_answer IS NULL)
);

-- 必須インデックス（GPT-5.4 P1 + アナリティクスエンジニア推奨）
CREATE INDEX idx_ah_user_answered ON answer_history(user_id, answered_at DESC);
CREATE INDEX idx_ah_user_question ON answer_history(user_id, question_id, answered_at DESC);
CREATE INDEX idx_ah_question_correct ON answer_history(question_id, is_correct);
CREATE INDEX idx_ah_answered_at ON answer_history(answered_at);
```

**既存TS型との差分マッピング**:
| 既存 AnswerHistory (TS) | DB (answer_history) | 変換ルール |
|------------------------|---------------------|-----------|
| `selected_answer: number` | `int[]` | `[N]` に包む |
| `selected_answer: number[]` | `int[]` | そのまま |
| `selected_answer: null` | `NULL` | `skipped=true` と併用 |
| `time_spent_seconds?: number` | `time_spent_ms` | `× 1000` 変換 |

### 6.3 user_profiles（レコメンド基盤）★新規

```sql
CREATE TABLE user_profiles (
  user_id              uuid PRIMARY KEY REFERENCES users(id),
  exam_year            integer,          -- 受験年度（例: 2027）
  study_start_date     date,
  target_score         integer,          -- 目標点
  onboarding_completed_at timestamptz,
  last_active_at       timestamptz,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);
```

PdM指摘: これなしに「次に何を勉強すべきか」は実現不可。Phase 1からlocalStorageに構造を持たせる。

### 6.4 card_progress + card_review_history

```sql
-- 状態テーブル（現在のSM-2状態）
CREATE TABLE card_progress (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES users(id) NOT NULL,
  template_id     text NOT NULL,
  ease_factor     double precision DEFAULT 2.5,  -- realではなくdouble precision（GPT-5.4 P3）
  interval_days   integer DEFAULT 0,
  next_review_at  date DEFAULT CURRENT_DATE,
  review_count    integer DEFAULT 0,
  correct_streak  integer DEFAULT 0,
  last_reviewed_at timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(user_id, template_id)
);

CREATE INDEX idx_cp_user_next ON card_progress(user_id, next_review_at);

-- イベント履歴（SM-2再計算・アルゴリズム変更対応）★新規
CREATE TABLE card_review_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES users(id) NOT NULL,
  template_id     text NOT NULL,
  result          text NOT NULL,  -- 'again' | 'hard' | 'good' | 'easy'
  ease_factor_before double precision,
  ease_factor_after  double precision,
  reviewed_at     timestamptz DEFAULT now()
);
```

### 6.5 purchases（課金管理）★新規

```sql
CREATE TABLE purchases (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id) NOT NULL,
  product_id    text NOT NULL,     -- 'fusen_pack' | 'ai_monthly'
  platform      text NOT NULL,     -- 'web' | 'ios' | 'android'
  price_jpy     integer NOT NULL,
  purchased_at  timestamptz DEFAULT now(),
  expires_at    timestamptz,       -- 月額のみ
  status        text DEFAULT 'active'  -- 'active' | 'cancelled' | 'refunded'
);
```

### 6.6 device_tokens + notification_preferences ★新規

```sql
CREATE TABLE device_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) NOT NULL,
  platform    text NOT NULL,       -- 'ios' | 'android' | 'web'
  token       varchar(512) NOT NULL,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE notification_preferences (
  user_id           uuid PRIMARY KEY REFERENCES users(id),
  daily_reminder    boolean DEFAULT true,
  reminder_time     time DEFAULT '20:00',
  review_due_alert  boolean DEFAULT true,
  streak_alert      boolean DEFAULT true,
  marketing         boolean DEFAULT false
);
```

### 6.7 bookmarks / study_sessions（改訂）

```sql
CREATE TABLE bookmarks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) NOT NULL,
  note_id     text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, note_id)
);

CREATE INDEX idx_bm_user ON bookmarks(user_id, created_at DESC);

CREATE TABLE study_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES users(id) NOT NULL,
  session_type    text NOT NULL CHECK (session_type IN ('practice', 'flashcard', 'external')),
  platform        text,            -- 'web' | 'ios' | 'android' ★追加
  started_at      timestamptz NOT NULL,
  ended_at        timestamptz CHECK (ended_at IS NULL OR ended_at >= started_at),
  questions_count integer DEFAULT 0 CHECK (questions_count >= 0),
  cards_count     integer DEFAULT 0 CHECK (cards_count >= 0),
  notes           text
);
```

### 6.8 RLSポリシー方針

```
原則: auth.uid() = user_id（自分のデータのみ参照可能）
公式コンテンツ: 全員 SELECT 可、更新は admin ロールのみ
運営分析: 生テーブル直参照禁止。匿名化ビュー/集計テーブル経由
サービスロール: 集計バッチ、通知キュー投入、データ移行用
```

詳細なRLSポリシーDDLはDB設計specで策定。

### 6.9 コンテンツ改善への活用

ユーザーデータからコンテンツ拡充の優先度を自動判定:

```
付箋追加の優先度:
  不正解率が高い問題 × 紐づく付箋がない
  = 「みんな間違えるのに教材がない」→ 付箋作成の優先度MAX

カード追加の優先度:
  定着率が低いexemplar × カード枚数が少ない
  = 「覚えにくいのにカードが足りない」→ カード追加の優先度UP

類題作成の優先度:
  苦手ユーザーが多いexemplar × 問題数が少ない
  = 「練習したいのに問題が足りない」→ AI類題生成の優先度UP
```

### 6.10 行動イベントログ

行動イベント（画面遷移、タップ、課金ファネル等）は **Supabaseに入れず SaaS に外出し**（グロースハッカー + アナリティクスエンジニア合意）。

推奨: Mixpanel無料枠（月1,000 MTU）or PostHog OSS
理由: 500ユーザー×50イベント/日×365日 = 900万行/年。Supabase無料枠（500MB）を圧迫する。

Supabaseは「結果データ」（answer_history, card_progress）に集中させる。

### 6.11 移行戦略

```
Phase 1（現在）:
  localStorage のまま。データ構造だけ新設計に揃える。
  user_profiles はlocalStorageにJSON保存（Phase 2で移行）。

Phase 2（Supabase + 認証）:
  テーブル作成、RLS設定、インデックス作成。
  user_profiles, purchases, device_tokens, notification_preferences 追加。
  card_review_history 追加。
  プライバシーポリシー作成（App Store審査前提）。

Phase 3（データ移行 + Capacitor）:
  localStorage → Supabase 移行（初回ログイン時アップロード、べき等設計）。
  オフライン同期: sync_queue（ローカルのみ）+ Last Write Wins。
  answer_historyは追記のみで競合リスク低。
  card_progressは last_reviewed_at が新しい方を採用。
```

### 6.12 プラットフォーム戦略（全チーム合意）

> **PWAのまま Phase 1 を進め、データ層だけ先取り設計する。**

- Capacitor化はUXが固まってから（Phase 2以降）
- Repository パターンは既に実装済み（`src/repositories/`）→ このまま活用
- device_tokens スキーマだけ先に用意（PWA Web Push → Capacitor APNs/FCM 統一管理）
- 行動ログはSaaS外出し → Supabaseストレージ温存

### 6.13 スケーリング見通し

| 規模 | 対策 |
|------|------|
| ~500人 | 単一テーブルで十分。マテビュー不要 |
| ~1,000人 | マテリアライズドビュー（user_daily_summary等）検討 |
| ~1万人 | answer_history年度別パーティション、集計テーブル自動更新 |

---

## 7. 既存specとの整合性

### 7.1 NotesPage spec（v1.3）との関係

| 項目 | NotesPage spec | 本spec | 整合性 |
|------|---------------|--------|--------|
| `linkedCardIds` | 廃止済み（v1.3） | 廃止 | ✅ 一致 |
| `exemplarIds` | optional で追加 | optional で追加 | ✅ 一致 |
| `topicId` | ブラウズ用に残す | ブラウズ用に残す | ✅ 一致 |
| `linkedQuestionIds` | フォールバックとして残す | フォールバックとして残す | ✅ 一致 |
| `getRelatedQuestionIds()` | §5.1.1 で定義 | §3.1 で定義 | ✅ 一致 |
| 暗記カードセクション | 「準備中」プレースホルダー | 本specでカード連携を設計 | ⚠️ NotesPage spec §4.1 を将来更新 |

### 7.2 既存FlashCard型との移行

| 旧FlashCard | 新テンプレート | 新進捗 |
|------------|--------------|--------|
| front, back, format, tags | ✅ FlashCardTemplate | — |
| ease_factor, interval_days, next_review_at... | — | ✅ CardProgress |
| source_type, source_id | ✅ FlashCardTemplate | — |
| user_id | — | ✅ CardProgress |
| question_id | ❌ 廃止 → source_type='explanation'時はsource_idが問題ID | — |
| topic_id | ❌ 廃止 → exemplar経由で導出 | — |

### 7.3 FlashCard型変更で影響を受けるファイル

| ファイル | 影響内容 |
|---------|---------|
| `src/types/flashcard.ts` | FlashCard → FlashCardTemplate + CardProgress に分割 |
| `src/repositories/interfaces.ts` | IFlashCardRepo → IFlashCardTemplateRepo + ICardProgressRepo |
| `src/repositories/localStorage/flashCardRepo.ts` | 新リポジトリに書き換え |
| `src/hooks/useFlashCards.ts` | テンプレート用 + 進捗用の2フックに分離 |
| `src/pages/FlashCardPage.tsx` | 新フック利用 + PracticeContext対応 |
| `src/pages/FlashCardListPage.tsx` | 新フック利用 |
| `src/components/FlashCard.tsx` | Props型の変更 |
| `src/pages/QuestionPage.tsx` | onFlashCard の遷移先をPracticeContext付きに |

---

## 8. 将来展望（本specスコープ外）

### 8.1 分析タブ（AnalysisPage）再設計

- 毎週の振り返り機能（study_sessions データ活用）
- 相対評価（「あなたは上位30%」）
- Exemplar別の定着度ヒートマップ
- 正答率・回答時間の推移グラフ

### 8.2 模試データ取り込み

- ユーザーから薬ゼミ模試の結果画像を取得 → OCR → 偏差値・科目別得点を構造化
- 模試偏差値と演習データを組み合わせた学習プラン提案
- 「模試偏差値40の先輩が合格までにどんな学習をしたか」のパターン分析

### 8.3 パーソナライズド学習プラン

- 受験アンケート500件 + 演習データの蓄積
- 「4月にはこういう問題を解くと合格に近づく」の定量的データ
- AI駆動の学習プラン自動生成

### 8.4 もし試験（オリジナル模試）

- 週1回 or 月1回、全ユーザー共通のミニ模試（30問）
- 過去問 + AI類題から出題
- 全ユーザーの結果を集計 → 知識定着の経時変化を可視化

---

## 9. GPT-5.4 レビュー対応記録

### セクション1（データモデル）

| # | 優先度 | 指摘 | 対応 |
|---|--------|------|------|
| 1 | P1 | topicId/subjectとexemplarIdsの整合性 | topicIdをブラウズ用に格下げ、正はexemplar |
| 2 | P1 | FlashCardのquestion_idが二重の真実源 | source_type/source_idに統合、question_id廃止 |
| 3 | P1 | linkedCardIdsは共通マスタの責務ではない | 廃止。exemplar経由で検索 |
| 4 | P2 | 中間テーブル推奨 | NoteExemplarMapping を中間テーブル設計に |
| 5 | P2 | exemplar_id → primary_exemplar_idに改名 | 採用 |
| 6 | P2 | linkedQuestionIdsはキャッシュ不要 | フォールバック用途に限定、キャッシュとしては持たない |
| 7 | P2 | getRelated系の仕様化 | primary/secondary/linked_groupの扱いを明記 |
| 8 | P2 | バリデーション追加 | 実装計画で対応 |
| 9 | P3 | 命名規約の混在 | TS型とDB row型を将来分離 |

### セクション2（循環ナビゲーション）

| # | 優先度 | 指摘 | 対応 |
|---|--------|------|------|
| 1 | P1 | FlashCardPracticeContextの欠如 | §4.2 で導入 |
| 2 | P1 | カード→付箋の循環に穴（explanation由来） | getRelatedNoteでexemplar経由フォールバック |
| 3 | P1 | getCardsForNoteの責務が曖昧 | getSourceCards/getExemplarCardsに分離 |
| 4 | P2 | 付箋>カードの優先度を明示 | §4.3 で優先ルール追加 |
| 5 | P2 | セレクター層の導入 | LearningLinkService §4.1 |
| 6 | P2 | Notes specとの同時改訂 | §7.1 に整合性表 |
| 7 | P2 | 逆引きインデックスのメモ化 | LearningLinkServiceで6種Map事前構築 |
| 8 | P2 | secondary exemplarの関連問題も表示 | §4.4 で主/補助を分離表示 |
| 9 | P3 | カードも1件なら直接遷移に統一 | §4.3 のタップ挙動に反映 |
| 10 | P3 | N枚/N問の数え方仕様化 | 実装計画で対応 |
| 11 | P3 | 0件時に行動テキストを添える | §4.3 に反映 |

### セクション4（データ蓄積スキーマ）— GPT-5.4 + 5人チームレビュー

**GPT-5.4 指摘（P1×10, P2×8, P3×5）+ 5人チーム合意事項を統合反映:**

| # | 優先度 | 指摘元 | 指摘 | 対応 |
|---|--------|--------|------|------|
| 1 | P1 | GPT-5.4 | answer_historyにstudy_session_idがない | §6.2 で session_id 追加 |
| 2 | P1 | GPT-5.4 | skip整合性制約が曖昧 | CHECK制約追加 |
| 3 | P1 | GPT-5.4 | session_typeがfree text | CHECK制約に変更 |
| 4 | P1 | GPT-5.4 | インデックス不足（answer_history, card_progress, bookmarks） | 全テーブルで追加 |
| 5 | P1 | GPT-5.4 | RLSポリシー未定義 | §6.8 で方針明記 |
| 6 | P1 | GPT-5.4 | usersテーブル方針不明 | auth.usersと分離、PII最小化を明記 |
| 7 | P1 | 5人チーム(PdM) | user_profilesがない（レコメンド不可） | §6.3 で追加 |
| 8 | P1 | 5人チーム(PdM) | purchasesがない（課金管理不可） | §6.5 で追加 |
| 9 | P1 | 5人チーム(モバイル) | device_tokensがない（通知不可） | §6.6 で追加 |
| 10 | P2 | GPT-5.4 | card_review_historyがない（SM-2再計算不可） | §6.4 で追加 |
| 11 | P2 | 5人チーム(グロース) | 行動イベントログの方針未定 | §6.10 でSaaS外出し方針 |
| 12 | P2 | GPT-5.4 | ease_factorはreal→double precision | §6.4 で変更 |
| 13 | P2 | 5人チーム(モバイル) | オフライン同期設計が必要 | §6.11 Phase 3 で方針記載 |
| 14 | P2 | 5人チーム(アーキテクト) | GDPR/App Store審査対応 | §6.11 Phase 2 で対応 |
| 15 | P3 | GPT-5.4 | created_at/updated_at統一 | 全テーブルに追加 |
| 16 | P3 | 5人チーム(全員) | PWAのまま進める（データ層だけ先取り） | §6.12 で方針記載 |

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|------|----------|---------|
| 2026-03-26 | v1.0 | 初版作成（セクション1-4 + GPT-5.4レビュー2回分反映済み） |
| 2026-03-26 | v1.1 | Spec Review反映: answer_history SQL/TS型マッピング追加、linkedCardIds段階廃止に変更、影響ファイルリスト追加 |
| 2026-03-26 | v1.2 | セクション4大幅改訂: GPT-5.4(P1×10)+5人チームレビュー反映。user_profiles/purchases/device_tokens/card_review_history追加、RLS方針、行動ログSaaS外出し、プラットフォーム戦略（PWA継続）確定 |
