# Supabase スキーマ構築 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** DB設計spec v1.1の20テーブル完全DDLをSupabaseマイグレーションとして構築し、RLS・トリガー・シードデータを適用する

**Architecture:** 既存の3マイグレーション（旧スキーマ）を廃止し、新規マイグレーション4ファイルに分割。Supabase CLI（`supabase db push`）でローカルDBに適用後、Supabase Dashboardで本番適用。questions_catalogのシードはTSファイルからIDを抽出するスクリプトで自動生成。

**Tech Stack:** PostgreSQL 15+ / Supabase CLI / Node.js (tsx) for seed script

**Spec:** `docs/superpowers/specs/2026-03-27-db-design-spec.md` v1.1

---

## 引き継ぎコンテキスト

### DB設計specの実装計画 全5プラン

```
Plan 1 (本計画) → Plan 2 → Plan 3 → Plan 4/5
スキーマ構築    認証統合   Repo移行   課金/削除
(SQL only)     (LINE+Apple) (TS+SQL)  (Stripe+IAP)
```

### 既存マイグレーション（廃止対象）
- `001_initial_schema.sql` — 旧スキーマ（question_id=UUID問題あり）
- `002_multi_select_support.sql` — selected_answer JSONB化
- `20260324_answer_history_skipped.sql` — skippedカラム追加

これらは新スキーマで完全に置き換える。

### 重要な設計判断（specで確定済み）
- 認証: ログイン必須（LINE + Apple）。ゲストなし
- 課金: Free + Pro（月額980円/年度パス7,800円）。6テーブル分割
- question_id: text型（"r110-001"形式）。questions_catalog ID台帳でFK制約
- is_correct: NULL許容（スキップ時=正否不明）
- ease_factor: numeric(4,2)（double precisionからの変更）
- users UPDATE: RLSでブロック（自己昇格防止）
- SECURITY DEFINER関数: auth.uid()強制 + search_path固定 + REVOKE/GRANT
- billing_transactions匿名化: sentinel UUID方式

---

## ファイル構成

```
supabase/migrations/
  旧（廃止）:
    001_initial_schema.sql         → 削除
    002_multi_select_support.sql   → 削除
    20260324_answer_history_skipped.sql → 削除
  新（作成）:
    20260327_001_functions.sql     → 共通トリガー関数 + auth連携トリガー
    20260327_002_tables.sql        → 全20テーブル + インデックス + コメント
    20260327_003_rls.sql           → 全テーブルRLSポリシー
    20260327_004_app_functions.sql → 権利判定 + 課金チェック + 削除 + マージ関数
    20260327_005_seed.sql          → product_catalog + sentinel user + questions_catalog

scripts/
  generate-questions-catalog-seed.ts → TSファイルからquestion IDを抽出してSEED SQL生成
```

---

### Task 1: 旧マイグレーション退避 + 新ディレクトリ準備

**Files:**
- Delete: `supabase/migrations/001_initial_schema.sql`
- Delete: `supabase/migrations/002_multi_select_support.sql`
- Delete: `supabase/migrations/20260324_answer_history_skipped.sql`
- Create: `supabase/migrations/archive/` (退避先)

- [ ] **Step 1: 旧マイグレーションを退避**

```bash
mkdir -p supabase/migrations/archive
mv supabase/migrations/001_initial_schema.sql supabase/migrations/archive/
mv supabase/migrations/002_multi_select_support.sql supabase/migrations/archive/
mv supabase/migrations/20260324_answer_history_skipped.sql supabase/migrations/archive/
```

- [ ] **Step 2: 退避を確認**

Run: `ls supabase/migrations/archive/`
Expected: 3 files listed

Run: `ls supabase/migrations/*.sql 2>/dev/null | wc -l`
Expected: `0`

- [ ] **Step 3: コミット**

```bash
git add supabase/migrations/archive/ supabase/migrations/
git commit -m "chore: 旧マイグレーション3ファイルをarchiveに退避（新スキーマで置き換え予定）"
```

---

### Task 2: 共通関数マイグレーション（20260327_001_functions.sql）

**Files:**
- Create: `supabase/migrations/20260327_001_functions.sql`

- [ ] **Step 1: 関数マイグレーションファイル作成**

```sql
-- 20260327_001_functions.sql
-- 共通トリガー関数 + auth.users連携トリガー
-- Spec: docs/superpowers/specs/2026-03-27-db-design-spec.md §3.0

-- updated_at 自動更新トリガー（全テーブル共通）
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- time_spent_ms サーバー側clamp（30分上限）
CREATE OR REPLACE FUNCTION clamp_time_spent()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.time_spent_ms > 1800000 THEN
    NEW.time_spent_ms := 1800000;
    NEW.time_spent_capped := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- auth.users → public.users 自動作成
-- Supabase Auth でユーザーが作成されたとき、public.users にも行を作る
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, status, role)
  VALUES (NEW.id, 'active', 'student')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

- [ ] **Step 2: SQL構文確認**

Run: `npx supabase db lint --level warning 2>&1 || echo "Supabase CLI not configured yet - syntax will be verified at push time"`

- [ ] **Step 3: コミット**

```bash
git add supabase/migrations/20260327_001_functions.sql
git commit -m "feat: 共通トリガー関数 + auth.users連携トリガー（DB設計spec §3.0）"
```

---

### Task 3: テーブル定義マイグレーション（20260327_002_tables.sql）

**Files:**
- Create: `supabase/migrations/20260327_002_tables.sql`

- [ ] **Step 1: テーブル定義ファイル作成**

DB設計spec v1.1 §3.1〜§3.6 のDDLをそのままコピー。以下の全20テーブルを含む:

1. questions_catalog
2. users
3. user_profiles
4. line_accounts
5. study_sessions
6. answer_history（+ clamp_time_spentトリガー）
7. card_progress
8. card_review_history
9. bookmarks
10. billing_customers
11. product_catalog
12. subscription_contracts
13. purchase_events
14. billing_transactions
15. entitlements
16. device_tokens
17. notification_preferences
18. beta_invitations
19. daily_question_stats
20. daily_card_stats

**重要**: spec §3.1〜§3.6 のSQLブロックをそのまま1ファイルに結合する。
各テーブルの後に対応する `CREATE INDEX`、`CREATE TRIGGER`、`COMMENT ON` を配置。

FK依存順序に従ってテーブルを定義（specの記載順序がそのまま正しい）。

- [ ] **Step 2: テーブル数確認**

Run: `grep -c 'CREATE TABLE' supabase/migrations/20260327_002_tables.sql`
Expected: `20`

- [ ] **Step 3: インデックス数確認**

Run: `grep -c 'CREATE.*INDEX' supabase/migrations/20260327_002_tables.sql`
Expected: 16以上（各テーブルの必須インデックス）

- [ ] **Step 4: コミット**

```bash
git add supabase/migrations/20260327_002_tables.sql
git commit -m "feat: 全20テーブルDDL（インデックス+トリガー+コメント）（DB設計spec §3.1-3.6）"
```

---

### Task 4: RLSポリシーマイグレーション（20260327_003_rls.sql）

**Files:**
- Create: `supabase/migrations/20260327_003_rls.sql`

- [ ] **Step 1: RLSポリシーファイル作成**

DB設計spec v1.1 §4.2 のSQLブロックをそのままコピー。

全テーブルに `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + ポリシー定義。

**ポリシー方針（spec §4.1から）:**
- ユーザーデータ: `auth.uid() = user_id`
- users: **SELECTのみ**（UPDATE禁止 → 自己昇格防止）
- 課金データ: ユーザーはSELECTのみ
- 公式コンテンツ: 全員SELECT可
- 統計/β: ポリシーなし = 全拒否

- [ ] **Step 2: RLS有効化の数を確認**

Run: `grep -c 'ENABLE ROW LEVEL SECURITY' supabase/migrations/20260327_003_rls.sql`
Expected: `20`（全テーブル）

- [ ] **Step 3: usersのUPDATEポリシーがないことを確認**

Run: `grep -A2 'ON users' supabase/migrations/20260327_003_rls.sql | grep -c 'UPDATE'`
Expected: `0`

- [ ] **Step 4: コミット**

```bash
git add supabase/migrations/20260327_003_rls.sql
git commit -m "feat: 全20テーブルRLSポリシー（users UPDATE禁止含む）（DB設計spec §4.2）"
```

---

### Task 5: アプリケーション関数マイグレーション（20260327_004_app_functions.sql）

**Files:**
- Create: `supabase/migrations/20260327_004_app_functions.sql`

- [ ] **Step 1: アプリケーション関数ファイル作成**

DB設計spec v1.1 §5.1, §5.2, §6.2, §7.3 の関数をコピー:

1. `check_my_entitlement(p_key, p_exam_year)` — クライアント用権利判定
2. `check_entitlement(p_user_id, p_key, p_exam_year)` — service_role用権利判定
3. `can_purchase(p_product_id, p_exam_year)` — 二重課金防止プリフライト
4. `request_account_deletion()` — アカウント削除リクエスト
5. `merge_card_progress(p_user_id, p_template_id, p_events)` — カード進捗マージ

**全関数に以下を確認:**
- `SECURITY DEFINER`
- `SET search_path = public`
- `auth.uid()` 強制（クライアント用）or 本人確認（p_user_id受取時）
- 適切な `REVOKE` / `GRANT`

- [ ] **Step 2: SECURITY DEFINER の数を確認**

Run: `grep -c 'SECURITY DEFINER' supabase/migrations/20260327_004_app_functions.sql`
Expected: `5`

- [ ] **Step 3: search_path設定の数を確認**

Run: `grep -c 'SET search_path = public' supabase/migrations/20260327_004_app_functions.sql`
Expected: `5`

- [ ] **Step 4: REVOKE/GRANTの確認**

Run: `grep -c 'REVOKE\|GRANT' supabase/migrations/20260327_004_app_functions.sql`
Expected: 4以上（check_entitlement REVOKE, check_my_entitlement GRANT, can_purchase GRANT, request_account_deletion GRANT）

- [ ] **Step 5: コミット**

```bash
git add supabase/migrations/20260327_004_app_functions.sql
git commit -m "feat: アプリケーション関数5つ（権利判定+課金チェック+削除+マージ）（DB設計spec §5-7）"
```

---

### Task 6: questions_catalog シード生成スクリプト

**Files:**
- Create: `scripts/generate-questions-catalog-seed.ts`

- [ ] **Step 1: シード生成スクリプト作成**

TSファイル（`src/data/real-questions/`）からquestion IDを抽出し、`questions_catalog` のINSERT文を生成するスクリプト。

```typescript
// scripts/generate-questions-catalog-seed.ts
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const questionsDir = path.join(__dirname, '..', 'src', 'data', 'real-questions')

interface CatalogEntry {
  id: string
  exam_round: number
  seq: number
}

function extractQuestionIds(): CatalogEntry[] {
  const entries: CatalogEntry[] = []

  // src/data/real-questions/ 配下のディレクトリを走査
  const dirs = fs.readdirSync(questionsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())

  for (const dir of dirs) {
    const examDir = path.join(questionsDir, dir.name)
    const files = fs.readdirSync(examDir)
      .filter(f => f.startsWith('exam-') && f.endsWith('.ts'))

    for (const file of files) {
      const content = fs.readFileSync(path.join(examDir, file), 'utf-8')
      // id: 'r110-001' のパターンを抽出
      const idMatches = content.matchAll(/id:\s*['"]([^'"]+)['"]/g)
      for (const match of idMatches) {
        const id = match[1]
        const parts = id.match(/^r(\d+)-(\d+)$/)
        if (parts) {
          entries.push({
            id,
            exam_round: parseInt(parts[1], 10),
            seq: parseInt(parts[2], 10),
          })
        }
      }
    }
  }

  return entries.sort((a, b) =>
    a.exam_round !== b.exam_round
      ? a.exam_round - b.exam_round
      : a.seq - b.seq
  )
}

function generateSql(entries: CatalogEntry[]): string {
  const lines = [
    '-- Auto-generated by scripts/generate-questions-catalog-seed.ts',
    `-- Generated at: ${new Date().toISOString()}`,
    `-- Total: ${entries.length} questions`,
    '',
    'INSERT INTO questions_catalog (id, source_type, exam_round, seq, is_active) VALUES',
  ]

  const values = entries.map((e, i) => {
    const comma = i < entries.length - 1 ? ',' : ''
    return `  ('${e.id}', 'past_exam', ${e.exam_round}, ${e.seq}, true)${comma}`
  })

  lines.push(...values)
  lines.push('ON CONFLICT (id) DO NOTHING;')
  lines.push('')

  return lines.join('\n')
}

const entries = extractQuestionIds()
console.log(`Found ${entries.length} question IDs`)

const sql = generateSql(entries)
const outputPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260327_005_seed.sql')

// product_catalog + sentinel user も含める
const fullSeed = `-- 20260327_005_seed.sql
-- シードデータ: product_catalog + sentinel user + questions_catalog
-- Spec: docs/superpowers/specs/2026-03-27-db-design-spec.md §3.7

-- Sentinel user（アカウント削除時のbilling_transactions匿名化用）
INSERT INTO auth.users (id, email, encrypted_password, role, aud, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'deleted@system.local',
  '',
  'authenticated',
  'authenticated',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- handle_new_user トリガーで public.users にも自動作成される

-- Product catalog
INSERT INTO product_catalog (id, name, billing_type, price_jpy, interval_months, granted_entitlements) VALUES
  ('pro_monthly', 'Pro月額プラン', 'subscription', 980, 1,
   ARRAY['notes_all', 'cards_all', 'analytics_full', 'cloud_sync']),
  ('pro_annual',  'Pro年度パス',   'subscription', 7800, 12,
   ARRAY['notes_all', 'cards_all', 'analytics_full', 'cloud_sync'])
ON CONFLICT (id) DO NOTHING;

-- Questions catalog
${sql}
`

fs.writeFileSync(outputPath, fullSeed)
console.log(`Seed SQL written to: ${outputPath}`)
```

- [ ] **Step 2: スクリプト実行**

Run: `npx tsx scripts/generate-questions-catalog-seed.ts`
Expected: `Found XXXX question IDs` + `Seed SQL written to: supabase/migrations/20260327_005_seed.sql`

- [ ] **Step 3: 生成されたSQLの確認**

Run: `head -20 supabase/migrations/20260327_005_seed.sql`
Expected: コメント行 + sentinel user INSERT + product_catalog INSERT

Run: `grep -c "('r" supabase/migrations/20260327_005_seed.sql`
Expected: 3400以上（全問題ID数）

- [ ] **Step 4: コミット**

```bash
git add scripts/generate-questions-catalog-seed.ts supabase/migrations/20260327_005_seed.sql
git commit -m "feat: questions_catalogシード生成スクリプト + product_catalog + sentinel user"
```

---

### Task 7: Supabase ローカル検証

**Files:**
- No new files

- [ ] **Step 1: Supabase CLIでローカルDB起動**

```bash
npx supabase start
```

Expected: ローカルSupabaseが起動（Docker必須）

もしDocker未インストールの場合:
```bash
# Supabase Dashboard（Web）で直接マイグレーションを実行する代替手段
# supabase/migrations/ 配下のSQLを順番にSQL Editorに貼り付けて実行
```

- [ ] **Step 2: マイグレーション適用**

```bash
npx supabase db push
```

Expected: 5ファイルが順番に適用される

- [ ] **Step 3: テーブル数確認**

```sql
-- Supabase SQL Editor で実行
SELECT count(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```

Expected: `20`

- [ ] **Step 4: RLS有効確認**

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected: 全テーブルで `rowsecurity = true`

- [ ] **Step 5: questions_catalog行数確認**

```sql
SELECT count(*) FROM questions_catalog;
```

Expected: 3400以上

- [ ] **Step 6: product_catalog確認**

```sql
SELECT * FROM product_catalog;
```

Expected: `pro_monthly` と `pro_annual` の2行

- [ ] **Step 7: sentinel user確認**

```sql
SELECT id, status, role FROM users
WHERE id = '00000000-0000-0000-0000-000000000000';
```

Expected: 1行（status='active', role='admin'）

- [ ] **Step 8: 関数確認**

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

Expected: `can_purchase`, `check_entitlement`, `check_my_entitlement`, `clamp_time_spent`, `handle_new_user`, `merge_card_progress`, `request_account_deletion`, `set_updated_at` の8関数

- [ ] **Step 9: コミット（検証成功後）**

```bash
git commit --allow-empty -m "chore: Supabaseローカル検証完了（20テーブル+8関数+RLS全テーブル）"
```

---

### Task 8: CLAUDE.md 更新

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 開発状況セクションにDB構築完了を追記**

CLAUDE.md の「開発状況」セクションに以下を追加:

```markdown
- **DB設計 + Supabaseスキーマ構築（2026-03-27）**
  - DB設計spec v1.1: 20テーブル完全DDL + RLS + 課金6テーブル + 認証設計
  - GPT-5.4×4回 + エージェントチーム4チーム（データアーキテクト/モバイルエンジニア/セキュリティ/プロダクト課金）レビュー済み
  - Supabaseマイグレーション5ファイル作成・検証済み
  - 次: Plan 2（認証統合: LINE Login + Apple Login）
```

- [ ] **Step 2: コマンドセクションに追記**

```markdown
- `npx supabase start` — ローカルSupabase起動（Docker必須）
- `npx supabase db push` — マイグレーション適用
- `npx tsx scripts/generate-questions-catalog-seed.ts` — questions_catalogシードSQL再生成
```

- [ ] **Step 3: コミット**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md にDB構築完了状況 + Supabaseコマンド追記"
```

---

## 完了基準

- [ ] 旧マイグレーション3ファイルが `archive/` に退避済み
- [ ] 新マイグレーション5ファイルが `supabase/migrations/` に存在
- [ ] ローカルSupabaseで20テーブル・8関数・全テーブルRLS有効を確認
- [ ] questions_catalog に全問題IDがシード済み
- [ ] product_catalog に `pro_monthly` / `pro_annual` がシード済み
- [ ] sentinel user が作成済み
- [ ] CLAUDE.md が最新状態に更新済み

## 次のステップ

Plan 2（認証統合）の計画書作成:
- Supabase Auth + LINE Login Provider 設定
- Apple Sign in with Apple 設定
- `line_accounts` テーブルへのLINE userId保存
- ログイン画面UI（React）
- オンボーディングフロー
