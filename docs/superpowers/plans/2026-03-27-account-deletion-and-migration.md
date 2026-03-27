# アカウント削除 + データ移行 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** App Store審査準拠のアカウント削除フローと、localStorage→Supabaseの安全なデータ移行を実装する

**Architecture:** アカウント削除はrequest_account_deletion RPC→pg_cronバッチで集計化→原本削除。データ移行は初回ログイン時にlocalStorage読み出し→client_event_id付与→バッチINSERT（冪等）。

**Tech Stack:** Supabase Edge Functions / pg_cron / Apple REST API / React

**Depends on:** Plan 1（スキーマ）+ Plan 2（認証）+ Plan 3（Repo移行）完了。Plan 4（課金）とは並行可能。

---

## 引き継ぎコンテキスト

### DB設計specの実装計画 全5プラン

```
Plan 1 → Plan 2 → Plan 3 → Plan 4 / Plan 5(本計画)
スキーマ構築  認証統合  Repo移行  課金    削除+移行
(SQL only)  (LINE+Apple) (TS+SQL) (Stripe+IAP) (Edge Fn+React)
```

Plan 1-3 が前提（テーブル・認証・Repo層が存在する状態）。Plan 4（課金）とは並行可能。

### アカウント削除のDB側はPlan 1で構築済み

- `users.status`: `'active' | 'disabled' | 'pending_deletion'`
- `users.deletion_requested_at` / `scheduled_purge_at` / `purged_at` カラム
- `request_account_deletion()` RPC関数（`20260327_004_app_functions.sql`）
- `daily_question_stats` / `daily_card_stats` 集計テーブル
- sentinel UUID `00000000-0000-0000-0000-000000000000`（billing_transactions匿名化用）

本計画では**UIからの呼び出し**、**purgeバッチ（Edge Function + pg_cron）**、**外部API連携**を実装する。

### localStorage → Supabase 移行の対象データ

| localStorage キー | 既存TS型 | DB先 | 変換内容 |
|-------------------|---------|------|---------|
| `answer_history` | `AnswerHistory` (`src/types/question.ts`) | `answer_history` | `selected_answer: number` → `int[]`に包む、`time_spent_seconds` → `time_spent_ms`（×1000）、`user_id: 'local'` → `auth.uid()` |
| `bookmarked_notes` | `BookmarkedNote` (`src/types/official-note.ts`) | `bookmarks` | `user_id/note_id` のみ（id, review_count 等は移行不要） |
| `card_progress_*` | `CardProgress` (`src/types/card-progress.ts`) | `card_progress` | `user_id: 'local'` → `auth.uid()`、`next_review_at` / `last_reviewed_at` ISO8601→timestamptz |

### 重要な設計判断

- 削除フロー: `active` → `pending_deletion`（即時、ログイン不可）→ 7日後 purge
- billing_transactions: 特商法5年保持義務 → 物理削除禁止、sentinel UUID匿名化
- 移行: client_event_id = `migration_${既存id}` で決定的ID → 冪等バッチINSERT
- Apple revoke: App Store審査で必須（Sign in with Appleの認証解除）
- LINE unlink: Messaging APIでunlink呼び出し（友だち状態は維持でOK）
- FK順序: 子テーブルから順に削除（CASCADEは使わない = 明示的安全策）
- GDPR: JSON形式でユーザーデータエクスポート機能を提供

### 関連ファイル

- DB設計spec: `docs/superpowers/specs/2026-03-27-db-design-spec.md` v1.1（§6, §8）
- スキーマ: `supabase/migrations/20260327_004_app_functions.sql`（request_account_deletion）
- リポジトリ層: `src/repositories/index.ts`（createAnswerHistoryRepo 等）
- localStorage実装: `src/repositories/localStorage/answerHistoryRepo.ts`（STORAGE_KEY='answer_history'）
- ブックマーク: `src/hooks/useBookmarks.ts`（STORAGE_KEY='bookmarked_notes'、旧ID移行ロジック含む）
- カード進捗: `src/repositories/localStorage/cardProgressRepo.ts`
- Supabase client: `src/lib/supabase.ts`

---

## ファイル構成

```
supabase/
  functions/
    purge-deleted-accounts/
      index.ts              ← Edge Function: purgeバッチ本体
    export-user-data/
      index.ts              ← Edge Function: GDPRエクスポート

src/
  services/
    migration/
      local-to-supabase.ts  ← localStorage → Supabase 移行ロジック
      migration-types.ts    ← 移行用型定義
      __tests__/
        local-to-supabase.test.ts
  hooks/
    useAccountDeletion.ts   ← アカウント削除フック
    useDataMigration.ts     ← 初回ログイン時移行フック
  pages/
    SettingsPage.tsx         ← 設定ページ（新規 or 既存拡張）
    SettingsPage.module.css
  components/
    settings/
      DeleteAccountDialog.tsx     ← 削除確認ダイアログ
      DeleteAccountDialog.module.css
      DataMigrationOverlay.tsx    ← 移行中プログレス表示
      DataMigrationOverlay.module.css
      DataExportButton.tsx        ← GDPRエクスポートボタン
```

---

### Task 1: purgeバッチ Edge Function

**Files:**
- Create: `supabase/functions/purge-deleted-accounts/index.ts`

**参照:** DB設計spec §6.3, §6.4

- [ ] **Step 1: Edge Function ディレクトリ作成**

```bash
mkdir -p supabase/functions/purge-deleted-accounts
```

- [ ] **Step 2: purge Edge Function 実装**

以下のロジックを実装:

```typescript
// supabase/functions/purge-deleted-accounts/index.ts
// Deno Deploy Edge Function
//
// 処理フロー:
// 1. scheduled_purge_at < now() の pending_deletion ユーザーを取得
// 2. 各ユーザーに対して:
//    a. answer_history → daily_question_stats に転記（UPSERT）
//    b. card_review_history → daily_card_stats に転記（UPSERT）
//    c. FK順序に従った明示的DELETE:
//       card_review_history → card_progress → answer_history →
//       bookmarks → study_sessions → device_tokens →
//       notification_preferences → user_profiles → line_accounts →
//       entitlements → subscription_contracts → purchase_events →
//       billing_customers
//    d. billing_transactions: user_id を sentinel UUID に UPDATE（物理削除禁止）
//    e. users テーブル: purged_at = now() を設定
//    f. auth.admin.deleteUser(userId) で Supabase Auth から削除
//    g. Apple Sign in with Apple: revoke token API 呼び出し
//    h. LINE: unlink API 呼び出し（optional、失敗してもpurge継続）
// 3. 処理結果ログを返す

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// --- 定数 ---
const SENTINEL_UUID = '00000000-0000-0000-0000-000000000000'

// FK順序に従った削除対象テーブル（子→親の順）
const DELETE_ORDER = [
  'card_review_history',
  'card_progress',
  'answer_history',
  'bookmarks',
  'study_sessions',
  'device_tokens',
  'notification_preferences',
  'user_profiles',
  'line_accounts',
  'entitlements',
  'purchase_events',
  'subscription_contracts',
  'billing_customers',
] as const

// 重要: billing_transactions は DELETE ではなく UPDATE（sentinel匿名化）
// 重要: users は purged_at 更新のみ（auth.admin.deleteUser で auth 側を削除）
```

**集計転記SQL（§6.4そのまま）:**

```sql
-- answer_history → daily_question_stats
INSERT INTO daily_question_stats (question_id, date, attempt_count, correct_count, skip_count, total_time_ms)
SELECT
  question_id,
  answered_at::date,
  COUNT(*),
  COUNT(*) FILTER (WHERE is_correct),
  COUNT(*) FILTER (WHERE skipped),
  SUM(time_spent_ms)
FROM answer_history
WHERE user_id = $1
GROUP BY question_id, answered_at::date
ON CONFLICT (question_id, date)
DO UPDATE SET
  attempt_count = daily_question_stats.attempt_count + EXCLUDED.attempt_count,
  correct_count = daily_question_stats.correct_count + EXCLUDED.correct_count,
  skip_count = daily_question_stats.skip_count + EXCLUDED.skip_count,
  total_time_ms = COALESCE(daily_question_stats.total_time_ms, 0) + COALESCE(EXCLUDED.total_time_ms, 0);

-- card_review_history → daily_card_stats
INSERT INTO daily_card_stats (template_id, date, review_count, again_count, hard_count, good_count, easy_count)
SELECT
  template_id,
  reviewed_at::date,
  COUNT(*),
  COUNT(*) FILTER (WHERE result = 'again'),
  COUNT(*) FILTER (WHERE result = 'hard'),
  COUNT(*) FILTER (WHERE result = 'good'),
  COUNT(*) FILTER (WHERE result = 'easy')
FROM card_review_history
WHERE user_id = $1
GROUP BY template_id, reviewed_at::date
ON CONFLICT (template_id, date)
DO UPDATE SET
  review_count = daily_card_stats.review_count + EXCLUDED.review_count,
  again_count = daily_card_stats.again_count + EXCLUDED.again_count,
  hard_count = daily_card_stats.hard_count + EXCLUDED.hard_count,
  good_count = daily_card_stats.good_count + EXCLUDED.good_count,
  easy_count = daily_card_stats.easy_count + EXCLUDED.easy_count;
```

**Apple revoke API:**

```typescript
// Apple Sign in with Apple revoke token
// https://developer.apple.com/documentation/sign_in_with_apple/revoke_tokens
async function revokeAppleToken(refreshToken: string): Promise<void> {
  const response = await fetch('https://appleid.apple.com/auth/revoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('APPLE_CLIENT_ID') ?? '',
      client_secret: generateAppleClientSecret(), // JWT生成
      token: refreshToken,
      token_type_hint: 'refresh_token',
    }),
  })
  if (!response.ok) {
    console.error('Apple revoke failed:', response.status)
    // 失敗してもpurge継続（Apple側のトークン無効化は最善努力）
  }
}
```

**LINE unlink API:**

```typescript
// LINE userId の紐付け解除（友だち状態は維持）
async function unlinkLine(lineUserId: string): Promise<void> {
  const response = await fetch('https://api.line.me/v2/bot/user/' + lineUserId + '/richmenu', {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer ' + Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN'),
    },
  })
  // LINE unlink は最善努力。失敗しても purge 継続
  if (!response.ok) {
    console.error('LINE unlink failed:', response.status)
  }
}
```

- [ ] **Step 3: 環境変数の整理**

必要な環境変数（Supabase Dashboard > Edge Functions > Secrets）:
- `SUPABASE_SERVICE_ROLE_KEY` — auth.admin.deleteUser に必要
- `APPLE_CLIENT_ID` — Apple revoke API
- `APPLE_TEAM_ID` — Apple JWT生成
- `APPLE_KEY_ID` — Apple JWT生成
- `APPLE_PRIVATE_KEY` — Apple JWT生成（P8形式）
- `LINE_CHANNEL_ACCESS_TOKEN` — LINE unlink API

- [ ] **Step 4: コミット**

```bash
git add supabase/functions/purge-deleted-accounts/
git commit -m "feat: purgeバッチ Edge Function（集計転記+FK順DELETE+billing匿名化+Apple revoke+LINE unlink）"
```

---

### Task 2: pg_cron ジョブ設定マイグレーション

**Files:**
- Create: `supabase/migrations/20260327_006_purge_cron.sql`

**参照:** DB設計spec §6.3

- [ ] **Step 1: pg_cron マイグレーション作成**

```sql
-- 20260327_006_purge_cron.sql
-- pg_cron: 日次 purge バッチ呼び出し
-- Supabase Pro で pg_cron が利用可能
-- AM 3:00 JST (UTC 18:00) に Edge Function を呼び出す

-- pg_net 拡張を有効化（Edge Function HTTP呼び出し用）
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 日次 purge ジョブ
-- Edge Function 'purge-deleted-accounts' を HTTP POST で呼び出す
SELECT cron.schedule(
  'purge-deleted-accounts',    -- ジョブ名
  '0 18 * * *',                -- UTC 18:00 = JST 03:00
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.edge_function_base_url') || '/purge-deleted-accounts',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

COMMENT ON COLUMN cron.job.jobname IS 'purge-deleted-accounts: 7日経過のpending_deletionユーザーをパージ';
```

- [ ] **Step 2: 設定値の文書化**

pg_cron が Edge Function を呼び出すには以下の設定が必要:
```sql
-- Supabase Dashboard > SQL Editor で設定
ALTER DATABASE postgres SET app.settings.edge_function_base_url = 'https://<project-ref>.supabase.co/functions/v1';
ALTER DATABASE postgres SET app.settings.service_role_key = '<service_role_key>';
```

**注意:** service_role_key はDBの設定に入るため、Supabase Pro環境のセキュリティ前提。

代替案（pg_cron が使えない場合）:
- GitHub Actions の scheduled workflow で Edge Function を定期呼び出し
- Supabase の `pg_cron` は Pro プラン以上で利用可能

- [ ] **Step 3: コミット**

```bash
git add supabase/migrations/20260327_006_purge_cron.sql
git commit -m "feat: pg_cron日次purgeジョブ設定（UTC 18:00 = JST 03:00）"
```

---

### Task 3: localStorage → Supabase 移行ロジック（コアモジュール）

**Files:**
- Create: `src/services/migration/migration-types.ts`
- Create: `src/services/migration/local-to-supabase.ts`
- Create: `src/services/migration/__tests__/local-to-supabase.test.ts`

**参照:** DB設計spec §8.1-8.3

- [ ] **Step 1: 型定義**

```typescript
// src/services/migration/migration-types.ts

/** 移行進捗 */
export interface MigrationProgress {
  status: 'idle' | 'migrating' | 'completed' | 'failed'
  totalRecords: number
  migratedRecords: number
  currentTable: string
  error?: string
}

/** 移行結果 */
export interface MigrationResult {
  answerHistory: { total: number; migrated: number; skipped: number }
  bookmarks: { total: number; migrated: number; skipped: number }
  cardProgress: { total: number; migrated: number; skipped: number }
  completedAt: string
}

/** localStorage のキー一覧 */
export const STORAGE_KEYS = {
  ANSWER_HISTORY: 'answer_history',
  BOOKMARKS: 'bookmarked_notes',
  CARD_PROGRESS: 'card_progress',
  MIGRATION_COMPLETED: 'supabase_migration_completed',
  MIGRATION_RESULT: 'supabase_migration_result',
} as const
```

- [ ] **Step 2: 移行コアロジック実装**

```typescript
// src/services/migration/local-to-supabase.ts
//
// 責務:
// - localStorage から answer_history / bookmarks / card_progress を読み出し
// - 既存TS型 → DB型へ変換（§8.2のマッピング）
// - client_event_id 付与（既存IDベースの決定的ID → 冪等性）
// - Supabase へバッチINSERT（100件ずつ、ON CONFLICT DO NOTHING）
// - 完了フラグを localStorage に書き込み
//
// 冪等性保証:
// - client_event_id = `migration_${既存レコードのid}` → 同じデータを2回送っても重複しない
// - supabase_migration_completed フラグ → 2回目以降は即スキップ
//
// エラー処理:
// - 個別バッチの失敗は記録してスキップ（全体を中断しない）
// - 全バッチ完了後に成功/失敗の集計を返す
// - 失敗時はフラグを立てない → 次回ログイン時に再試行

import { STORAGE_KEYS } from './migration-types'
import type { MigrationResult } from './migration-types'
```

**変換ルール（spec §8.2）:**

```typescript
// answer_history の変換
function convertAnswerHistory(
  local: LocalAnswerHistory,
  userId: string
): DbAnswerHistory {
  return {
    user_id: userId,
    question_id: local.question_id,
    selected_answer:
      local.selected_answer === null ? null :
      typeof local.selected_answer === 'number' ? [local.selected_answer] :
      local.selected_answer,
    is_correct: local.skipped ? null : local.is_correct,
    time_spent_ms: local.time_spent_seconds
      ? Math.min(local.time_spent_seconds * 1000, 1800000)
      : null,
    time_spent_capped: (local.time_spent_seconds ?? 0) * 1000 > 1800000,
    skipped: local.skipped ?? false,
    answered_at: local.answered_at,
    client_event_id: `migration_${local.id}`,
  }
}

// bookmarks の変換
function convertBookmark(
  local: LocalBookmark,
  userId: string
): DbBookmark {
  return {
    user_id: userId,
    note_id: local.note_id,
    created_at: local.bookmarked_at,
  }
}

// card_progress の変換
function convertCardProgress(
  local: LocalCardProgress,
  userId: string
): DbCardProgress {
  return {
    user_id: userId,
    template_id: local.template_id,
    ease_factor: local.ease_factor,
    interval_days: local.interval_days,
    next_review_at: local.next_review_at,
    review_count: local.review_count,
    correct_streak: local.correct_streak,
    last_reviewed_at: local.last_reviewed_at,
  }
}
```

**バッチINSERT:**

```typescript
// 100件ずつバッチINSERT
async function batchInsert<T>(
  supabase: SupabaseClient,
  table: string,
  records: T[],
  conflictColumns: string,
): Promise<{ migrated: number; skipped: number }> {
  const BATCH_SIZE = 100
  let migrated = 0
  let skipped = 0

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE)
    const { error, count } = await supabase
      .from(table)
      .upsert(batch, {
        onConflict: conflictColumns,
        ignoreDuplicates: true,
        count: 'exact',
      })

    if (error) {
      console.error(`Migration batch error (${table}):`, error)
      skipped += batch.length
    } else {
      migrated += count ?? batch.length
      skipped += batch.length - (count ?? batch.length)
    }
  }

  return { migrated, skipped }
}
```

- [ ] **Step 3: テスト**

```typescript
// src/services/migration/__tests__/local-to-supabase.test.ts
// 変換ロジックの純粋関数テスト:
// - selected_answer: number → [number] 変換
// - selected_answer: number[] → そのまま
// - selected_answer: null → null (skipped=true)
// - time_spent_seconds: 30 → time_spent_ms: 30000
// - time_spent_seconds: 2000 → time_spent_ms: 1800000 + capped=true
// - user_id: 'local' → 指定UUID
// - client_event_id が決定的（同じ入力 → 同じ出力）
// - bookmark の note_id が fusen-NNNN 形式で移行される
// - isMigrationCompleted() のフラグチェック
```

- [ ] **Step 4: コミット**

```bash
git add src/services/migration/
git commit -m "feat: localStorage→Supabase移行コアロジック（型変換+冪等バッチINSERT）"
```

---

### Task 4: 移行フック + 移行中UI

**Files:**
- Create: `src/hooks/useDataMigration.ts`
- Create: `src/components/settings/DataMigrationOverlay.tsx`
- Create: `src/components/settings/DataMigrationOverlay.module.css`

**参照:** DB設計spec §8.1

- [ ] **Step 1: useDataMigration フック**

```typescript
// src/hooks/useDataMigration.ts
//
// 初回ログイン時に自動実行される移行フック:
// 1. supabase_migration_completed フラグを確認
// 2. 未完了なら移行を開始
// 3. 進捗状態を MigrationProgress として返す
// 4. 完了後にフラグを立てる
//
// 使い方: App.tsx の認証チェック後に呼び出し
//   const { progress, isMigrating } = useDataMigration()
//   if (isMigrating) return <DataMigrationOverlay progress={progress} />

export function useDataMigration() {
  // progress: MigrationProgress 状態管理
  // useEffect で初回マウント時に移行チェック → 実行
  // supabase セッションの user_id を取得して移行関数に渡す
}
```

- [ ] **Step 2: DataMigrationOverlay コンポーネント**

```
┌────────────────────────────────┐
│                                │
│       📦 データ移行中...        │
│                                │
│   これまでの学習データを         │
│   クラウドに安全に移行しています  │
│                                │
│   ████████░░░░░  156 / 234件   │
│   回答履歴を移行中...            │
│                                │
│   アプリを閉じないでください      │
│                                │
└────────────────────────────────┘
```

- Soft Companion デザイン（`--bg`, `--accent` トークン使用）
- 全画面オーバーレイ（z-index: 2000）
- プログレスバー + テーブル名 + 件数表示
- 完了時: 1秒後に自動で閉じる

- [ ] **Step 3: コミット**

```bash
git add src/hooks/useDataMigration.ts src/components/settings/DataMigrationOverlay.*
git commit -m "feat: データ移行フック + 移行中オーバーレイUI（初回ログイン時自動実行）"
```

---

### Task 5: アカウント削除フック

**Files:**
- Create: `src/hooks/useAccountDeletion.ts`

- [ ] **Step 1: useAccountDeletion フック実装**

```typescript
// src/hooks/useAccountDeletion.ts
//
// 責務:
// - request_account_deletion() RPC 呼び出し
// - 呼び出し前にローカルデータのクリーンアップ
// - 呼び出し後に Supabase セッション破棄 + ログイン画面へリダイレクト
//
// フロー:
// 1. confirmDeletion() → ユーザーが確認テキストを入力
// 2. supabase.rpc('request_account_deletion') 呼び出し
// 3. localStorage の全学習データをクリア
//    - answer_history, bookmarked_notes, card_progress, supabase_migration_completed
// 4. supabase.auth.signOut() でセッション破棄
// 5. window.location.href = '/login' でログイン画面へ

export function useAccountDeletion() {
  // state: { isDeleting, error, step }
  // requestDeletion(): Promise<void>
  // 返り値: { requestDeletion, isDeleting, error }
}
```

**RPCエラーハンドリング:**
- 認証切れ → 「再度ログインしてからお試しください」
- ネットワークエラー → 「通信エラーが発生しました。再試行してください」
- 既にpending_deletion → 「削除リクエストは受付済みです」（users.statusチェック）

- [ ] **Step 2: コミット**

```bash
git add src/hooks/useAccountDeletion.ts
git commit -m "feat: useAccountDeletion フック（RPC呼び出し+ローカルクリーンアップ+セッション破棄）"
```

---

### Task 6: 削除確認ダイアログ

**Files:**
- Create: `src/components/settings/DeleteAccountDialog.tsx`
- Create: `src/components/settings/DeleteAccountDialog.module.css`

- [ ] **Step 1: 削除確認ダイアログ実装**

```
┌────────────────────────────────┐
│                                │
│  ⚠️ アカウントを削除しますか？   │
│                                │
│  以下のデータが完全に削除されます:│
│  • 回答履歴（○○件）             │
│  • ブックマーク（○○件）          │
│  • カード進捗                   │
│  • プロフィール情報              │
│                                │
│  ※ 削除リクエスト後7日間は       │
│    取り消し可能です              │
│  ※ 課金情報は法令に基づき       │
│    5年間保持されます             │
│                                │
│  確認のため「アカウントを削除」と │
│  入力してください:               │
│  ┌────────────────────────┐    │
│  │                        │    │
│  └────────────────────────┘    │
│                                │
│  [キャンセル]  [削除する] ← 赤   │
│                                │
└────────────────────────────────┘
```

設計ポイント:
- `<dialog>` 要素ベース（BottomSheet ではなく中央モーダル = 誤タップ防止）
- 確認テキスト入力が完全一致するまで「削除する」ボタン disabled
- 「削除する」ボタンは `--color-error`（赤系）
- 削除対象データの件数を表示（`useAnalytics` の `allHistory.length` 等を流用）
- 7日間の取り消し可能期間を明示
- 課金データの法定保持義務を明示

- [ ] **Step 2: コミット**

```bash
git add src/components/settings/DeleteAccountDialog.*
git commit -m "feat: アカウント削除確認ダイアログ（テキスト入力確認+データ件数表示+法的説明）"
```

---

### Task 7: 設定ページ（アカウント削除導線）

**Files:**
- Create: `src/pages/SettingsPage.tsx`
- Create: `src/pages/SettingsPage.module.css`
- Modify: `src/routes.tsx` — `/settings` ルート追加
- Modify: `src/components/layout/AppLayout.tsx` — REDESIGNED_EXACT に `/settings` 追加

**参照:** App Store審査ガイドライン 5.1.1(v)

- [ ] **Step 1: SettingsPage コンポーネント**

```
┌──────────────────────────────┐
│ ← 設定                       │
├──────────────────────────────┤
│                              │
│ アカウント                    │
│ ┌──────────────────────────┐ │
│ │ 👤 makio                 │ │
│ │ LINE でログイン中          │ │
│ └──────────────────────────┘ │
│                              │
│ データ                        │
│ ┌──────────────────────────┐ │
│ │ 📥 データをエクスポート    │ │
│ │    JSON形式でダウンロード  │ │
│ └──────────────────────────┘ │
│                              │
│ 法的情報                      │
│ ┌──────────────────────────┐ │
│ │ 📄 利用規約              │ │
│ │ 🔒 プライバシーポリシー    │ │
│ │ 📋 特定商取引法に基づく表記│ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ 🗑️ アカウントを削除       │ │
│ │    ← 赤文字              │ │
│ └──────────────────────────┘ │
│                              │
│ アプリバージョン: 1.0.0       │
└──────────────────────────────┘
```

- Soft Companion デザイン
- FloatingNav から歯車アイコンで遷移（またはプロフィールアイコンから）
- 「アカウントを削除」タップ → DeleteAccountDialog 表示

- [ ] **Step 2: ルーティング追加**

`src/routes.tsx` に `/settings` ルートを追加。
`AppLayout.tsx` の `REDESIGNED_EXACT` に `'/settings'` を追加。

- [ ] **Step 3: FloatingNav にリンク追加**

設定ページへの導線を FloatingNav or ヘッダーに追加。

- [ ] **Step 4: コミット**

```bash
git add src/pages/SettingsPage.* src/routes.tsx src/components/layout/AppLayout.tsx
git commit -m "feat: SettingsPage（アカウント削除導線+データエクスポート+法的情報）+ ルーティング"
```

---

### Task 8: GDPRデータエクスポート Edge Function

**Files:**
- Create: `supabase/functions/export-user-data/index.ts`
- Create: `src/components/settings/DataExportButton.tsx`

**参照:** GDPR第20条（データポータビリティ権）

- [ ] **Step 1: export-user-data Edge Function**

```typescript
// supabase/functions/export-user-data/index.ts
// Deno Deploy Edge Function
//
// 認証済みユーザーの全データをJSON形式で返す
// auth.uid() を使用して自分のデータのみ取得
//
// 出力形式:
// {
//   "exported_at": "2026-03-27T12:00:00Z",
//   "user": { ... },
//   "profile": { ... },
//   "answer_history": [...],
//   "bookmarks": [...],
//   "card_progress": [...],
//   "card_review_history": [...],
//   "study_sessions": [...],
//   "subscriptions": [...],
//   "billing_transactions": [...],
//   "entitlements": [...]
// }
//
// セキュリティ:
// - auth.uid() を強制（他人のデータは取得不可）
// - レートリミット: 1回/日（Supabase Edge Function のレート制限）
// - レスポンスは JSON ダウンロード（Content-Disposition: attachment）
```

- [ ] **Step 2: DataExportButton コンポーネント**

SettingsPage 内の「データをエクスポート」ボタンを押すと:
1. Edge Function `export-user-data` を呼び出し
2. レスポンスの JSON を Blob → URL.createObjectURL → `<a>` click でダウンロード
3. ファイル名: `pharma-exam-data-{YYYY-MM-DD}.json`

- [ ] **Step 3: コミット**

```bash
git add supabase/functions/export-user-data/ src/components/settings/DataExportButton.tsx
git commit -m "feat: GDPRデータエクスポート（Edge Function + ダウンロードUI）"
```

---

### Task 9: App.tsx への移行・削除フロー統合

**Files:**
- Modify: `src/App.tsx` — 初回ログイン時に移行チェック挿入
- Modify: `src/hooks/useDataMigration.ts` — App レベルの統合

- [ ] **Step 1: App.tsx に移行チェック追加**

認証状態の取得後、Supabase セッションが有効な場合:
1. `useDataMigration()` で移行チェック
2. `isMigrating === true` なら `<DataMigrationOverlay />` を全画面表示
3. 完了後に通常のアプリ画面を表示

```typescript
// App.tsx（擬似コード）
function App() {
  const session = useSupabaseSession()
  const { progress, isMigrating } = useDataMigration(session?.user?.id)

  if (isMigrating) {
    return <DataMigrationOverlay progress={progress} />
  }

  return <RouterProvider ... />
}
```

- [ ] **Step 2: 認証状態変更時のリダイレクト**

`request_account_deletion` RPC 成功後:
- `supabase.auth.signOut()` → セッション破棄
- 認証状態の変更を検知 → ログインページにリダイレクト
- ログインページに「アカウント削除リクエストを受け付けました。7日後に完全に削除されます。」バナー表示

- [ ] **Step 3: コミット**

```bash
git add src/App.tsx src/hooks/useDataMigration.ts
git commit -m "feat: App.tsx に移行フロー統合 + 削除後リダイレクト"
```

---

### Task 10: テスト + CLAUDE.md 更新

**Files:**
- Run: `npx vitest run`
- Modify: `CLAUDE.md`

- [ ] **Step 1: テスト実行**

```bash
npx vitest run
```

Expected: 全テスト通過 + 新規テスト（local-to-supabase.test.ts）通過

- [ ] **Step 2: tsc 型チェック**

```bash
npx tsc --noEmit
```

Expected: エラーなし

- [ ] **Step 3: CLAUDE.md 更新**

「開発状況」セクションに追記:

```markdown
- **アカウント削除 + データ移行（2026-03-27）**
  - purgeバッチ Edge Function: 集計転記→FK順DELETE→billing匿名化→Apple revoke→LINE unlink
  - pg_cron日次ジョブ（AM 3:00 JST）
  - localStorage→Supabase移行: 型変換+client_event_id冪等バッチINSERT
  - SettingsPage: アカウント削除確認ダイアログ（テキスト入力+件数表示+法的説明）
  - GDPRデータエクスポート（JSON形式）
  - 次: スマホ実機テスト → App Store審査準備
```

「コマンド」セクションに追記:

```markdown
- `supabase functions serve purge-deleted-accounts` — purgeバッチのローカルテスト
- `supabase functions serve export-user-data` — エクスポートのローカルテスト
```

「アーキテクチャ」セクションに追記:

```markdown
- アカウント削除: SettingsPage → useAccountDeletion → request_account_deletion RPC → pg_cron → purge Edge Function
- データ移行: useDataMigration → local-to-supabase.ts（初回ログイン時、冪等）
- Edge Functions: `supabase/functions/`（purge-deleted-accounts, export-user-data）
```

- [ ] **Step 4: コミット**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md にアカウント削除+データ移行の実装状況追記"
```

---

## 完了基準

- [ ] purge Edge Function が集計転記→FK順DELETE→billing匿名化→auth削除を正しく実行
- [ ] Apple revoke API / LINE unlink API が呼び出される（失敗時も purge 継続）
- [ ] pg_cron ジョブが JST AM 3:00 に purge Edge Function を呼び出す
- [ ] localStorage → Supabase 移行が初回ログイン時に1回だけ実行される
- [ ] 移行の冪等性: 同じデータを2回送っても重複しない（client_event_id）
- [ ] 型変換: `selected_answer: number` → `int[]`、`time_spent_seconds` → `time_spent_ms` が正しい
- [ ] 設定画面に「アカウントを削除」ボタンが存在し、確認ダイアログが表示される
- [ ] GDPRエクスポートが JSON 形式でユーザーの全データをダウンロード可能
- [ ] テスト全件パス + tsc エラーなし
- [ ] CLAUDE.md が最新状態に更新済み

## 次のステップ

- スマホ実機テスト（削除フロー + 移行フロー）
- App Store 審査チェックリスト消化（DB設計spec §10.1）
- プライバシーポリシー + 特定商取引法に基づく表記の作成
- Apple App Privacy Labels 設定
