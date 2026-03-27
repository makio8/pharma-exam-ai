# DB設計spec — 薬剤師国試対策アプリ Supabase スキーマ

**Author**: makio8 + Claude + GPT-5.4
**Date**: 2026-03-27
**Status**: Draft v1.1
**Based on**: 2026-03-26-learning-cycle-architecture-design.md §6
**Reviewed by**: GPT-5.4 (Codex) 3回 + エージェントチーム（データアーキテクト/モバイルエンジニア/セキュリティ/プロダクト課金）

---

## 1. 概要

### 1.1 目的

学習サイクル循環設計（v1.2）§6「データ蓄積スキーマ」を独立した詳細DB設計specに昇格。全テーブルの完全DDL、RLS、認証、課金、移行、削除を網羅する。

### 1.2 前提（確定済み判断）

| 判断項目 | 決定 | 根拠 |
|---------|------|------|
| 認証方式 | **ログイン必須**（D案）。LINE Login + Apple Login。ゲストなし | GPT-5.4推奨。DB設計シンプル化+LINE CRM活用 |
| 課金ティア | Free + Pro（月額980円 / 年度パス7,800円） | PRD v1.2改訂。Premium/単発パックは将来 |
| Free体験設計 | チュートリアル固定問題で付箋+カードを体験 → 課金導線 | 「量」より「体験」でCVR向上 |
| 決済プラットフォーム | Web=Stripe / アプリ=IAP。DBが唯一の真実源 | クロスプラットフォーム二重課金防止 |
| 課金テーブル設計 | 6テーブル分割（billing_customers / product_catalog / subscription_contracts / purchase_events / billing_transactions / entitlements） | GPT-5.4 P1指摘: 1テーブルは破綻する |
| question_id | text型、`questions_catalog` ID台帳でFK制約 | GPT-5.4: typo/不正ID防止 |
| アカウント削除 | 即disabled → 7日猶予 → 集計化 → 原本削除 | セキュリティレビュー: 30日は長い |
| オフライン同期 | client_event_id冪等 + SyncRepository層 + サーバー側マージ | モバイルエンジニアレビュー |
| Supabase Pro | Phase 2から（課金データ導入時） | データアーキテクトレビュー |
| time_spent_ms | 30分cap + `time_spent_capped` boolean | 4値フラグは過剰→boolean簡素化 |
| study_sessions.notes | 削除（要配慮情報リスク排除） | 全レビューアー合意 |
| 無料トライアル | なし（offer codeでキャンペーン対応） | GPT-5.4: Freeが十分強い |

### 1.3 スコープ

| 含む | 含まない |
|------|---------|
| 全テーブル完全DDL（型、制約、デフォルト） | UI/フロントエンド実装 |
| RLSポリシー具体SQL | LINE Login/Apple Login のOAuth実装詳細 |
| 課金5テーブル+entitlementsの設計 | Stripe/IAP Webhook実装 |
| オフライン同期のDB側設計 | SyncRepository層のTS実装 |
| アカウント削除のDB+バッチ設計 | プライバシーポリシー文面 |
| localStorage→Supabase移行戦略 | 特定商取引法に基づく表記 |
| questions_catalog同期スクリプト設計 | AI類題生成の実装 |
| βアクセス管理 | Mixpanel/PostHog設定 |

### 1.4 Phase計画

```
Phase 1（現在〜）: localStorage + TSファイル焼き込み
  → データ構造を新設計に揃える（型変更のみ）
  → Supabase Free でスキーマ作成・RLS設定

Phase 2（認証+DB導入）:
  → LINE Login + Apple Login 実装
  → Supabase Pro 切替
  → localStorage → Supabase 移行（初回ログイン時）
  → 課金実装（Stripe）
  → プライバシーポリシー + 特商法表記
  → クローズドβ（コミュニティ30人）

Phase 3（Capacitor + IAP）:
  → App Store / Google Play 公開
  → IAP追加（課金テーブルは設計済み）
  → オフライン同期本格化（SyncRepository層）
  → プッシュ通知（device_tokens活用）
```

---

## 2. テーブル一覧

### 2.1 全体マップ（20テーブル）

```
── 公式コンテンツ（ID台帳のみ。本文はTSファイル）──
  questions_catalog        問題ID台帳（FK整合性用）

── ユーザー管理 ──
  users                    ユーザー基本（auth.usersと分離）
  user_profiles            受験年度・目標（レコメンド基盤）
  line_accounts            LINE userId・友だち状態（CRM用）

── 学習データ ──
  answer_history           回答履歴（メイン資産）
  study_sessions           学習セッション
  card_progress            カード復習進捗（状態テーブル）
  card_review_history      カード復習イベント（SM-2再計算用）
  bookmarks                付箋ブックマーク

── 課金（6テーブル）──
  billing_customers        決済プロバイダ紐付け
  product_catalog          商品→権利マッピング（シード）
  subscription_contracts   購読契約
  purchase_events          決済イベント履歴（冪等処理用）
  billing_transactions     会計記録（特商法5年保持）
  entitlements             ユーザー権利（「何が使えるか」）

── インフラ ──
  device_tokens            プッシュ通知トークン
  notification_preferences 通知設定
  beta_invitations         βアクセス管理

── 統計（アカウント削除時の匿名化集計）──
  daily_question_stats     問題別日次集計
  daily_card_stats         カード別日次集計
```

---

## 3. 完全DDL

### 3.0 共通トリガー関数

```sql
-- updated_at 自動更新トリガー（全テーブル共通）
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- time_spent_ms サーバー側clamp
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

### 3.1 公式コンテンツ

```sql
CREATE TABLE questions_catalog (
  id          text PRIMARY KEY,             -- 'r110-001'
  source_type text NOT NULL DEFAULT 'past_exam'
              CHECK (source_type IN ('past_exam', 'ai_generated', 'user_submitted')),
  exam_round  int,                          -- 110（回次）
  seq         int,                          -- 1（連番）
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 同一回次+同一番号の重複防止
CREATE UNIQUE INDEX idx_qc_round_seq
  ON questions_catalog(exam_round, seq)
  WHERE source_type = 'past_exam' AND exam_round IS NOT NULL;

-- 同期: マイグレーションでSEED。年1回の新問追加時に追記
COMMENT ON TABLE questions_catalog IS
  'ID台帳のみ。問題本文はTSファイル（src/data/）に焼き込み。二重管理コスト最小化';
```

### 3.2 ユーザー管理

```sql
CREATE TABLE users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id),
  status      text NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'disabled', 'pending_deletion')),
  role        text NOT NULL DEFAULT 'student'
              CHECK (role IN ('student', 'graduate', 'lecturer', 'admin')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  -- アカウント削除関連
  deletion_requested_at  timestamptz,
  scheduled_purge_at     timestamptz,
  purged_at              timestamptz
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 受験年度・目標（レコメンド・セグメント配信の基盤）
CREATE TABLE user_profiles (
  user_id                uuid PRIMARY KEY REFERENCES users(id),
  display_name           text,
  target_exam_year       int,              -- 受験予定年度（2027）。課金のexam_yearとは区別
  university             text,
  study_start_date       date,
  target_score           int
              CHECK (target_score IS NULL OR (target_score >= 0 AND target_score <= 345)),
  onboarding_completed_at timestamptz,
  last_active_at         timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- LINE CRM用。LINEログイン時に取得
CREATE TABLE line_accounts (
  user_id        uuid PRIMARY KEY REFERENCES users(id),
  line_user_id   text NOT NULL UNIQUE,     -- LINE userId
  display_name   text,
  picture_url    text
              CHECK (picture_url IS NULL OR length(picture_url) <= 2048),
  is_friend      boolean DEFAULT false,    -- 公式アカウント友だち状態
  friend_added_at timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_line_accounts_updated_at
  BEFORE UPDATE ON line_accounts FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

COMMENT ON COLUMN user_profiles.target_exam_year IS
  '受験予定年度。subscription_contracts.exam_year（商品スコープ年度）とは別物';
```

### 3.3 学習データ

```sql
CREATE TABLE study_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id),
  session_type    text NOT NULL
                  CHECK (session_type IN ('practice', 'flashcard', 'mixed')),
  platform        text
                  CHECK (platform IS NULL OR platform IN ('web', 'ios', 'android')),
  started_at      timestamptz NOT NULL,
  ended_at        timestamptz
                  CHECK (ended_at IS NULL OR ended_at >= started_at),
  questions_count int NOT NULL DEFAULT 0 CHECK (questions_count >= 0),
  cards_count     int NOT NULL DEFAULT 0 CHECK (cards_count >= 0),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ss_user ON study_sessions(user_id);
-- 未完了セッション検出用
CREATE INDEX idx_ss_orphan ON study_sessions(user_id, started_at)
  WHERE ended_at IS NULL;

CREATE TABLE answer_history (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(id),
  question_id       text NOT NULL REFERENCES questions_catalog(id),
  session_id        uuid REFERENCES study_sessions(id),
  selected_answer   int[],                 -- NULL=スキップ。単一回答=[N]
  is_correct        boolean,               -- NULL=スキップ時（正否不明）
  time_spent_ms     int
                    CHECK (time_spent_ms IS NULL OR (time_spent_ms >= 0 AND time_spent_ms <= 1800000)),
  time_spent_capped boolean NOT NULL DEFAULT false,
  skipped           boolean NOT NULL DEFAULT false,
  answered_at       timestamptz NOT NULL DEFAULT now(),
  -- オフライン同期用
  client_event_id   text,                  -- クライアント生成UUID（回答時に生成）
  synced_at         timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  -- 整合性（スキップ時: selected_answer=NULL, is_correct=NULL）
  CHECK (skipped = false OR (selected_answer IS NULL AND is_correct IS NULL)),
  CHECK (skipped = true OR is_correct IS NOT NULL)
);

COMMENT ON COLUMN answer_history.selected_answer IS
  '選択肢番号の配列。1-indexed、通常 1-5 の範囲。アプリ層でバリデーション必須';

CREATE INDEX idx_ah_user_answered
  ON answer_history(user_id, answered_at DESC);
CREATE INDEX idx_ah_user_question
  ON answer_history(user_id, question_id, answered_at DESC);
CREATE INDEX idx_ah_question_correct
  ON answer_history(question_id, is_correct);
CREATE INDEX idx_ah_answered_at
  ON answer_history(answered_at);
CREATE UNIQUE INDEX idx_ah_client_event
  ON answer_history(user_id, client_event_id)
  WHERE client_event_id IS NOT NULL;

CREATE TRIGGER trg_clamp_time
  BEFORE INSERT OR UPDATE ON answer_history
  FOR EACH ROW EXECUTE FUNCTION clamp_time_spent();

-- カード復習進捗（状態テーブル。現在のSM-2状態）
CREATE TABLE card_progress (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id),
  template_id     text NOT NULL,
  ease_factor     numeric(4,2) NOT NULL DEFAULT 2.50
                  CHECK (ease_factor >= 1.00 AND ease_factor <= 5.00),
  interval_days   int NOT NULL DEFAULT 0 CHECK (interval_days >= 0),
  next_review_at  date NOT NULL DEFAULT CURRENT_DATE,
  review_count    int NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  correct_streak  int NOT NULL DEFAULT 0 CHECK (correct_streak >= 0),
  last_reviewed_at timestamptz,
  -- オフライン同期用
  client_updated_at timestamptz,           -- クライアント側の最終更新時刻
  sync_version    int NOT NULL DEFAULT 0 CHECK (sync_version >= 0),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, template_id)
);

COMMENT ON COLUMN card_progress.template_id IS
  'FlashCardTemplate.id（クライアント側マスター）。DB上のFKは設けない設計判断';

CREATE INDEX idx_cp_user_next
  ON card_progress(user_id, next_review_at);

CREATE TRIGGER trg_card_progress_updated_at
  BEFORE UPDATE ON card_progress FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- カード復習イベント履歴（SM-2再計算用。append-only）
CREATE TABLE card_review_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id),
  template_id     text NOT NULL,
  result          text NOT NULL
                  CHECK (result IN ('again', 'hard', 'good', 'easy')),
  ease_factor_before numeric(4,2),
  ease_factor_after  numeric(4,2),
  reviewed_at     timestamptz NOT NULL DEFAULT now(),
  -- オフライン同期用
  client_event_id text,
  synced_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_crh_client_event
  ON card_review_history(user_id, client_event_id)
  WHERE client_event_id IS NOT NULL;
CREATE INDEX idx_crh_user_template
  ON card_review_history(user_id, template_id, reviewed_at DESC);

-- 付箋ブックマーク
CREATE TABLE bookmarks (
  user_id     uuid NOT NULL REFERENCES users(id),
  note_id     text NOT NULL,               -- OfficialNote.id
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, note_id)           -- 自然キーPK
);

COMMENT ON COLUMN bookmarks.note_id IS
  'OfficialNote.id（クライアント側マスター）。将来notes_catalogテーブル追加時にFK設定予定';

CREATE INDEX idx_bm_user
  ON bookmarks(user_id, created_at DESC);
```

### 3.4 課金（6テーブル）

```sql
-- 決済プロバイダとの紐付け
CREATE TABLE billing_customers (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES users(id) UNIQUE,
  stripe_customer_id      text UNIQUE,
  app_store_original_tx_id text UNIQUE,
  google_play_token       text UNIQUE,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  -- 同時に複数プロバイダIDを持たない（初期段階の安全弁）
  CHECK (num_nonnulls(stripe_customer_id, app_store_original_tx_id, google_play_token) <= 1)
);

CREATE TRIGGER trg_billing_customers_updated_at
  BEFORE UPDATE ON billing_customers FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE billing_customers IS
  '将来、1ユーザーが複数プラットフォームを持つ場合はuser_billing_accountsに分離検討';

-- 商品カタログ（シードデータ。権利マッピング定義）
CREATE TABLE product_catalog (
  id              text PRIMARY KEY,        -- 'pro_monthly', 'pro_annual'
  name            text NOT NULL,
  billing_type    text NOT NULL
                  CHECK (billing_type IN ('subscription', 'one_time')),
  price_jpy       int NOT NULL CHECK (price_jpy >= 0),
  interval_months int,                     -- サブスク: 1 or 12。買い切り: NULL
  granted_entitlements text[] NOT NULL,     -- ['notes_all','cards_all','analytics_full','cloud_sync']
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  -- billing_typeとinterval_monthsの整合性
  CHECK (
    (billing_type = 'subscription' AND interval_months IS NOT NULL AND interval_months > 0)
    OR
    (billing_type = 'one_time' AND interval_months IS NULL)
  )
);

COMMENT ON COLUMN product_catalog.granted_entitlements IS
  '将来複雑化する場合はproduct_entitlements中間テーブルに分離';

-- 購読契約
CREATE TABLE subscription_contracts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES users(id),
  product_id            text NOT NULL REFERENCES product_catalog(id),
  status                text NOT NULL DEFAULT 'active'
                        CHECK (status IN (
                          'trialing', 'active', 'cancelled', 'expired',
                          'past_due', 'paused', 'revoked'
                        )),
  payment_platform      text NOT NULL
                        CHECK (payment_platform IN ('stripe', 'app_store', 'google_play')),
  -- プロバイダ識別子
  provider_subscription_id text,
  store_product_id      text,              -- App Store/Google Play のプロダクトID
  app_account_token     uuid,              -- Apple appAccountToken（二重課金防止）
  environment           text NOT NULL DEFAULT 'production'
                        CHECK (environment IN ('production', 'sandbox')),
  -- 期間管理
  current_period_start  timestamptz NOT NULL,
  current_period_end    timestamptz NOT NULL,
  cancel_at             timestamptz,       -- 解約予約日
  cancelled_at          timestamptz,
  grace_period_end      timestamptz,       -- Apple billing retry猶予
  -- 年度スコープ（年度パス用。月額はNULL）
  exam_year             int,
  -- 自動更新
  auto_renew_status     boolean NOT NULL DEFAULT true,
  -- 返金・失効
  revoked_at            timestamptz,
  refund_at             timestamptz,
  refund_reason         text,
  -- メタ
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  -- 年度パスはexam_year必須
  CHECK (
    (product_id NOT IN ('pro_annual') OR exam_year IS NOT NULL)
  )
);

COMMENT ON COLUMN subscription_contracts.status IS
  'cancelled = 期間満了待ち（current_period_endまでサービス提供）。past_due = 猶予中（サービス提供あり）';
COMMENT ON COLUMN subscription_contracts.exam_year IS
  '商品がカバーする年度。user_profiles.target_exam_year（受験予定年度）とは別物';

-- 契約は複数持てる（将来のPremium + addon対応）。
-- 権利判定はentitlementsテーブルで行う。
CREATE INDEX idx_sc_user ON subscription_contracts(user_id);
CREATE INDEX idx_sc_period_end
  ON subscription_contracts(current_period_end)
  WHERE status IN ('active', 'trialing', 'past_due');
-- ストア側契約IDの重複防止
CREATE UNIQUE INDEX idx_sc_provider_sub
  ON subscription_contracts(payment_platform, provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;

CREATE TRIGGER trg_subscription_contracts_updated_at
  BEFORE UPDATE ON subscription_contracts FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 決済イベント履歴（Webhook受信ログ。冪等処理の砦）
CREATE TABLE purchase_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES users(id),  -- Webhook先行時はNULL許容
  contract_id       uuid REFERENCES subscription_contracts(id),
  event_type        text NOT NULL
                    CHECK (event_type IN (
                      'initial_purchase', 'renewal', 'cancellation',
                      'refund', 'revocation', 'grace_period',
                      'price_change', 'offer_redeemed'
                    )),
  payment_platform  text NOT NULL
                    CHECK (payment_platform IN ('stripe', 'app_store', 'google_play')),
  -- プロバイダからの生データ
  provider_event_id text NOT NULL,         -- Stripe event ID / Apple notificationUUID
  provider_payload  jsonb,                 -- 生のWebhookペイロード（デバッグ用）
  -- 時刻（「いつ起きたか」と「いつ受信したか」を区別）
  occurred_at       timestamptz,           -- イベント発生日時
  received_at       timestamptz NOT NULL DEFAULT now(),  -- DB受信日時
  -- 金額
  amount_jpy        int,
  currency          text DEFAULT 'JPY',
  -- 処理状態
  processing_state  text NOT NULL DEFAULT 'pending'
                    CHECK (processing_state IN ('pending', 'processed', 'failed', 'skipped')),
  processed_at      timestamptz,
  processing_error  text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- 冪等性: 同じイベントを2回処理しない
CREATE UNIQUE INDEX idx_pe_provider_event
  ON purchase_events(payment_platform, provider_event_id);
-- 未紐付けイベント検出用
CREATE INDEX idx_pe_unlinked ON purchase_events(created_at)
  WHERE user_id IS NULL AND processing_state = 'pending';
CREATE INDEX idx_pe_user ON purchase_events(user_id)
  WHERE user_id IS NOT NULL;

-- 会計記録（特商法5年保持義務。物理削除禁止）
CREATE TABLE billing_transactions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(id),
  contract_id       uuid REFERENCES subscription_contracts(id),
  product_id        text NOT NULL REFERENCES product_catalog(id),
  transaction_type  text NOT NULL
                    CHECK (transaction_type IN ('charge', 'refund', 'credit')),
  amount_jpy        int NOT NULL,
  currency          text NOT NULL DEFAULT 'JPY',
  payment_platform  text NOT NULL
                    CHECK (payment_platform IN ('stripe', 'app_store', 'google_play')),
  provider_txn_id   text,                  -- Stripe charge_id, Apple transactionId等
  occurred_at       timestamptz NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE billing_transactions IS
  '特商法により5年間保持義務あり。物理削除禁止。アカウント削除時はuser_idを匿名化';

CREATE INDEX idx_bt_user ON billing_transactions(user_id);

-- ユーザー権利（「このユーザーは何が使えるか」の判定テーブル）
CREATE TABLE entitlements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id),
  entitlement_key text NOT NULL,           -- 'notes_all','cards_all','analytics_full','cloud_sync','beta_access'
  source_type     text NOT NULL
                  CHECK (source_type IN ('subscription', 'one_time', 'beta', 'admin_grant')),
  source_id       uuid,                    -- subscription_contracts.id or NULL
  exam_year       int,                     -- 権利スコープ（年度パスの場合）
  granted_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz,             -- NULLなら無期限
  revoked_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN entitlements.source_id IS
  'source_type=subscription → subscription_contracts.id, beta/admin_grant → NULL';

-- 有効な付与のみユニーク（式インデックスでCOALESCE対応）
CREATE UNIQUE INDEX idx_ent_unique_grant
  ON entitlements(user_id, entitlement_key, source_type, COALESCE(exam_year, 0))
  WHERE revoked_at IS NULL;
-- 権利判定クエリ用インデックス
CREATE INDEX idx_ent_user_active
  ON entitlements(user_id, entitlement_key)
  WHERE revoked_at IS NULL;

-- 二重課金防止DB制約: 同一ユーザー×同一権利×同一年度は有効1件のみ
-- （can_purchase関数のレースコンディション対策としてDB制約で物理的にブロック）
CREATE UNIQUE INDEX idx_ent_no_duplicate_active
  ON entitlements(user_id, entitlement_key, COALESCE(exam_year, 0))
  WHERE revoked_at IS NULL AND expires_at IS NULL OR expires_at > now();
```

### 3.5 インフラ

```sql
CREATE TABLE device_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id),
  platform    text NOT NULL
              CHECK (platform IN ('web', 'ios', 'android')),
  token       varchar(512) NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

-- 同一トークンが複数ユーザーに紐づく異常防止
CREATE UNIQUE INDEX idx_dt_platform_token
  ON device_tokens(platform, token)
  WHERE is_active = true;

CREATE INDEX idx_dt_user ON device_tokens(user_id);

CREATE TRIGGER trg_device_tokens_updated_at
  BEFORE UPDATE ON device_tokens FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TABLE notification_preferences (
  user_id           uuid PRIMARY KEY REFERENCES users(id),
  daily_reminder    boolean NOT NULL DEFAULT true,
  reminder_time     time DEFAULT '20:00',
  review_due_alert  boolean NOT NULL DEFAULT true,
  streak_alert      boolean NOT NULL DEFAULT true,
  marketing         boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- βアクセス管理（クローズドβ用）
CREATE TABLE beta_invitations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code     text NOT NULL UNIQUE,
  user_id         uuid REFERENCES users(id),  -- 使用済みの場合
  max_uses        int NOT NULL DEFAULT 1 CHECK (max_uses > 0),
  used_count      int NOT NULL DEFAULT 0
                  CHECK (used_count >= 0 AND used_count <= max_uses),
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

### 3.6 統計（アカウント削除時の匿名化集計）

```sql
-- 問題別日次集計（user_idなし = 匿名。再構築可能）
CREATE TABLE daily_question_stats (
  question_id     text NOT NULL REFERENCES questions_catalog(id),
  date            date NOT NULL,
  attempt_count   int NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  correct_count   int NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
  skip_count      int NOT NULL DEFAULT 0 CHECK (skip_count >= 0),
  total_time_ms   bigint DEFAULT 0,        -- 再計算用に合計値を保持（avgは導出）
  PRIMARY KEY (question_id, date)          -- 自然キーPK
);

-- カード別日次集計
CREATE TABLE daily_card_stats (
  template_id     text NOT NULL,
  date            date NOT NULL,
  review_count    int NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  again_count     int NOT NULL DEFAULT 0 CHECK (again_count >= 0),
  hard_count      int NOT NULL DEFAULT 0 CHECK (hard_count >= 0),
  good_count      int NOT NULL DEFAULT 0 CHECK (good_count >= 0),
  easy_count      int NOT NULL DEFAULT 0 CHECK (easy_count >= 0),
  PRIMARY KEY (template_id, date)          -- 自然キーPK
);

COMMENT ON TABLE daily_question_stats IS
  '匿名化集計。真実の源泉はanswer_history。このテーブルは再構築可能';
COMMENT ON TABLE daily_card_stats IS
  '匿名化集計。真実の源泉はcard_review_history。このテーブルは再構築可能';
```

### 3.7 シードデータ

```sql
INSERT INTO product_catalog (id, name, billing_type, price_jpy, interval_months, granted_entitlements) VALUES
  ('pro_monthly', 'Pro月額プラン', 'subscription', 980, 1,
   ARRAY['notes_all', 'cards_all', 'analytics_full', 'cloud_sync']),
  ('pro_annual',  'Pro年度パス',   'subscription', 7800, 12,
   ARRAY['notes_all', 'cards_all', 'analytics_full', 'cloud_sync']);

-- 将来追加例:
-- ('premium_monthly', 'Premium月額', 'subscription', 1980, 1,
--  ARRAY['notes_all','cards_all','analytics_full','cloud_sync','ai_coach','ai_questions'])
-- ('mock_exam_111', '第111回オリジナル模試', 'one_time', 500, NULL,
--  ARRAY['mock_exam_111_access'])
```

---

## 4. RLSポリシー

### 4.1 原則

```
ユーザーデータ: auth.uid() = user_id（自分のデータのみ参照可能）
公式コンテンツ: 全員 SELECT 可。変更は admin / service_role のみ
課金データ: ユーザーはSELECTのみ。変更はWebhookハンドラー（service_role）経由
統計テーブル: service_roleのみ（アプリからは直接アクセスしない）
```

### 4.2 具体SQL

```sql
-- ユーザー管理（usersテーブルはSELECTのみ。UPDATE禁止→role/status改ざん防止）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);
-- UPDATE/INSERT/DELETEポリシーなし → ユーザーからの直接変更不可
-- status/role変更はSECURITY DEFINER関数（service_role経由）のみ

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own profile" ON user_profiles
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE line_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own LINE data" ON line_accounts
  FOR SELECT USING (auth.uid() = user_id);
-- INSERT/UPDATEはサーバーサイド（認証フロー）から

-- 学習データ
ALTER TABLE answer_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own answers" ON answer_history
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own sessions" ON study_sessions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE card_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own card progress" ON card_progress
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE card_review_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own card reviews" ON card_review_history
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own bookmarks" ON bookmarks
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 課金（ユーザーはSELECTのみ。変更はservice_role）
ALTER TABLE billing_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own billing" ON billing_customers
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE subscription_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own contracts" ON subscription_contracts
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE purchase_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own events" ON purchase_events
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE billing_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own transactions" ON billing_transactions
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own entitlements" ON entitlements
  FOR SELECT USING (auth.uid() = user_id);

-- 公式コンテンツ（全員読み取り可）
ALTER TABLE questions_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON questions_catalog
  FOR SELECT USING (true);

ALTER TABLE product_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON product_catalog
  FOR SELECT USING (true);

-- インフラ
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own tokens" ON device_tokens
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 統計・β招待はRLS不要（service_roleのみアクセス）
ALTER TABLE daily_question_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_card_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_invitations ENABLE ROW LEVEL SECURITY;
-- ポリシーなし = authenticatedからは全拒否
```

### 4.3 セキュリティチェックリスト（Phase 2移行前に必須）

```
[ ] 全テーブルでRLS有効化を確認
[ ] ポリシーなしテーブル = 全拒否であることを確認
[ ] service_role_keyがクライアントに含まれていないことを確認
[ ] .env.local に VITE_SUPABASE_SERVICE_ROLE_KEY が存在しないことを確認
[ ] auth.admin.deleteUser はサーバーサイド（Edge Function）からのみ実行
```

---

## 5. 権利判定クエリ

### 5.1 「このユーザーはPro機能が使えるか？」

```sql
-- クライアント用: auth.uid()を強制（他人の権利は確認できない）
CREATE OR REPLACE FUNCTION check_my_entitlement(
  p_key text,
  p_exam_year int DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM entitlements
    WHERE user_id = auth.uid()
      AND entitlement_key = p_key
      AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > now())
      AND (
        (p_exam_year IS NULL AND exam_year IS NULL)  -- 年度未指定→年度なし権利のみ
        OR exam_year = p_exam_year                    -- 年度指定→一致する権利のみ
      )
  );
$$;

-- service_role用: 管理画面等で他ユーザーの権利確認
CREATE OR REPLACE FUNCTION check_entitlement(
  p_user_id uuid,
  p_key text,
  p_exam_year int DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM entitlements
    WHERE user_id = p_user_id
      AND entitlement_key = p_key
      AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > now())
      AND (
        (p_exam_year IS NULL AND exam_year IS NULL)
        OR exam_year = p_exam_year
      )
  );
$$;

-- 権限制御: check_entitlementはservice_roleのみ
REVOKE EXECUTE ON FUNCTION check_entitlement FROM PUBLIC, anon, authenticated;
-- check_my_entitlementはauthenticatedユーザーが使用可
GRANT EXECUTE ON FUNCTION check_my_entitlement TO authenticated;

-- 使用例
SELECT check_my_entitlement('notes_all');
SELECT check_my_entitlement('notes_all', 2027);
```

### 5.2 二重課金防止プリフライトチェック

```sql
-- 購入フロー開始前に呼ぶ（auth.uid()を強制）
CREATE OR REPLACE FUNCTION can_purchase(
  p_product_id text,
  p_exam_year int DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_product product_catalog;
  v_has_active boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'not_authenticated');
  END IF;

  SELECT * INTO v_product FROM product_catalog WHERE id = p_product_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'product_not_found');
  END IF;

  -- 同等の有効権利があるかチェック（exam_yearも考慮）
  SELECT EXISTS (
    SELECT 1 FROM entitlements
    WHERE user_id = v_user_id
      AND entitlement_key = ANY(v_product.granted_entitlements)
      AND revoked_at IS NULL
      AND (expires_at IS NULL OR expires_at > now())
      AND (
        (p_exam_year IS NULL AND exam_year IS NULL)
        OR exam_year = p_exam_year
      )
  ) INTO v_has_active;

  IF v_has_active THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'already_entitled');
  END IF;

  RETURN jsonb_build_object('allowed', true);
END;
$$;

GRANT EXECUTE ON FUNCTION can_purchase TO authenticated;
```

---

## 6. アカウント削除フロー

### 6.1 状態遷移

```
active → pending_deletion（即時。ログイン不可 + 7日カウントダウン開始）
  → purged（7日後。完全削除完了）
```

### 6.2 削除リクエスト処理

```sql
-- ユーザーがアカウント削除をリクエスト（auth.uid()を強制）
CREATE OR REPLACE FUNCTION request_account_deletion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE users SET
    status = 'pending_deletion',          -- ← disabled→pending_deletionに統一
    deletion_requested_at = now(),
    scheduled_purge_at = now() + interval '7 days'
  WHERE id = v_user_id AND status = 'active';

  -- Supabase Auth で即時バン（JWT有効期限内のアクセス防止）
  -- Edge Functionから: auth.admin.updateUserById(userId, { ban_duration: 'none' })
END;
$$;

GRANT EXECUTE ON FUNCTION request_account_deletion TO authenticated;
```

### 6.3 Purgeバッチ（pg_cron日次実行）

```sql
-- 毎日AM3:00 JST に実行
-- 1. 集計テーブルへ転記（匿名化）
-- 2. 原本削除（明示的DELETE。CASCADEは使わない）
-- 3. auth.users削除（Edge Function経由）
-- 4. Apple revoke / LINE unlink

-- 削除順序（FK制約に従う）:
-- card_review_history → card_progress → answer_history →
-- bookmarks → study_sessions → device_tokens →
-- notification_preferences → user_profiles → line_accounts →
-- entitlements → subscription_contracts → billing_customers →
-- billing_transactions（匿名化のみ。物理削除禁止）→
-- users

-- billing_transactions は特商法5年保持義務:
-- sentinel UUID（00000000-0000-0000-0000-000000000000）に置換して匿名化
-- ※ sentinelユーザーはマイグレーション時に事前作成:
--   INSERT INTO users (id, status, role) VALUES
--     ('00000000-0000-0000-0000-000000000000', 'active', 'admin')
--   ON CONFLICT DO NOTHING;
```

### 6.4 集計テーブルへの転記

```sql
-- purge前にanswer_historyを集計化
INSERT INTO daily_question_stats (question_id, date, attempt_count, correct_count, skip_count, total_time_ms)
SELECT
  question_id,
  answered_at::date,
  COUNT(*),
  COUNT(*) FILTER (WHERE is_correct),
  COUNT(*) FILTER (WHERE skipped),
  SUM(time_spent_ms)
FROM answer_history
WHERE user_id IN (
  SELECT id FROM users
  WHERE status = 'pending_deletion'
  AND scheduled_purge_at < now()
)
GROUP BY question_id, answered_at::date
ON CONFLICT (question_id, date)
DO UPDATE SET
  attempt_count = daily_question_stats.attempt_count + EXCLUDED.attempt_count,
  correct_count = daily_question_stats.correct_count + EXCLUDED.correct_count,
  skip_count = daily_question_stats.skip_count + EXCLUDED.skip_count,
  total_time_ms = COALESCE(daily_question_stats.total_time_ms, 0) + COALESCE(EXCLUDED.total_time_ms, 0);
```

---

## 7. オフライン同期設計

### 7.1 アーキテクチャ

```
ユーザー操作
  → SyncRepo（新規。Repository パターンに挟む）
    → LocalRepo（即座に保存→UI反映）
    → SyncQueue（IndexedDB、上限1,000件）
    → SupabaseRepo（オンライン時に送信、100件/バッチ）
```

### 7.2 テーブル別戦略

| テーブル | 方式 | 競合解決 |
|---------|------|---------|
| answer_history | append-only | `ON CONFLICT(client_event_id) DO NOTHING` |
| card_review_history | append-only | `ON CONFLICT(client_event_id) DO NOTHING` |
| card_progress | state table | **サーバー側マージ関数**（単純LWWは危険） |
| bookmarks | toggle | `ON CONFLICT(user_id, note_id) DO NOTHING` / DELETE |

### 7.3 サーバー側マージ関数（card_progress）

```sql
CREATE OR REPLACE FUNCTION merge_card_progress(
  p_user_id uuid,
  p_template_id text,
  p_events jsonb  -- [{result, reviewed_at, client_event_id, ...}, ...]
)
RETURNS card_progress
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current card_progress;
  v_event jsonb;
BEGIN
  -- 本人確認
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: user_id mismatch';
  END IF;

  -- 現在の状態を取得（なければ作成）
  INSERT INTO card_progress (user_id, template_id)
  VALUES (p_user_id, p_template_id)
  ON CONFLICT (user_id, template_id) DO NOTHING;

  SELECT * INTO v_current
  FROM card_progress
  WHERE user_id = p_user_id AND template_id = p_template_id
  FOR UPDATE;

  -- イベントを時系列順に適用
  FOR v_event IN
    SELECT * FROM jsonb_array_elements(p_events)
    ORDER BY (value->>'reviewed_at')::timestamptz
  LOOP
    -- 既に適用済みのイベントはスキップ（冪等性）
    IF v_current.last_reviewed_at IS NOT NULL
       AND (v_event->>'reviewed_at')::timestamptz <= v_current.last_reviewed_at THEN
      CONTINUE;
    END IF;

    -- イベント履歴にも記録
    INSERT INTO card_review_history (
      user_id, template_id, result, reviewed_at, client_event_id
    ) VALUES (
      p_user_id, p_template_id,
      v_event->>'result',
      (v_event->>'reviewed_at')::timestamptz,
      v_event->>'client_event_id'
    ) ON CONFLICT DO NOTHING;

    -- SM-2状態を更新（完全なSM-2ロジックは実装計画で詳細化）
    v_current.review_count := v_current.review_count + 1;
    v_current.last_reviewed_at := (v_event->>'reviewed_at')::timestamptz;
    v_current.sync_version := v_current.sync_version + 1;
  END LOOP;

  -- 更新を書き戻し
  UPDATE card_progress SET
    ease_factor = v_current.ease_factor,
    interval_days = v_current.interval_days,
    next_review_at = v_current.next_review_at,
    review_count = v_current.review_count,
    correct_streak = v_current.correct_streak,
    last_reviewed_at = v_current.last_reviewed_at,
    sync_version = v_current.sync_version,
    updated_at = now()
  WHERE user_id = p_user_id AND template_id = p_template_id
  RETURNING * INTO v_current;

  RETURN v_current;
END;
$$;
```

### 7.4 オフラインキャッシュ（課金状態）

```
端末に last_verified_entitlement を保存:
  - ソフトTTL: 24-72時間（オンライン時に再検証）
  - ハードTTL: 7日（超過したらPro機能ブロック）
  - 起動時・resume時・オンライン復帰時に再検証
  - 返金・失効の即時反映はオフラインでは不可能
    → フェイルソフト（短期猶予あり）
```

---

## 8. localStorage → Supabase 移行戦略

### 8.1 移行タイミング

```
初回ログイン時に1回だけ実行:
  1. localStorage から answer_history, bookmarks 等を読み出し
  2. client_event_id を付与（冪等性確保）
  3. Supabase にバッチ INSERT（ON CONFLICT DO NOTHING）
  4. 成功したら localStorage にマイグレーション完了フラグを設定
  5. 以降はSupabaseのみ使用
```

### 8.2 既存TS型 → DB型 マッピング

| 既存 (TS) | DB | 変換ルール |
|-----------|-----|-----------|
| `selected_answer: number` | `int[]` | `[N]` に包む |
| `selected_answer: number[]` | `int[]` | そのまま |
| `selected_answer: null` | `NULL` | `skipped=true` と併用 |
| `time_spent_seconds?: number` | `time_spent_ms` | `× 1000` 変換 |
| `user_id: 'local'` | `auth.uid()` | ログインユーザーIDに置換 |

### 8.3 べき等性の保証

```typescript
// 移行スクリプト（擬似コード）
async function migrateLocalToSupabase(userId: string) {
  const migrationKey = 'supabase_migration_completed';
  if (localStorage.getItem(migrationKey)) return; // 済みならスキップ

  const localHistory = loadFromStorage<AnswerHistory>('answer_history');

  // client_event_id を付与（既存データには未設定）
  const records = localHistory.map(h => ({
    ...h,
    user_id: userId,
    client_event_id: `migration_${h.id}`, // 既存IDを元にした決定的ID
    time_spent_ms: h.time_spent_seconds ? h.time_spent_seconds * 1000 : null,
    selected_answer: typeof h.selected_answer === 'number'
      ? [h.selected_answer]
      : h.selected_answer,
  }));

  // バッチINSERT（100件ずつ）
  for (const batch of chunk(records, 100)) {
    await supabase.from('answer_history').upsert(batch, {
      onConflict: 'user_id,client_event_id',
      ignoreDuplicates: true,
    });
  }

  localStorage.setItem(migrationKey, new Date().toISOString());
}
```

---

## 9. 認証フロー設計

### 9.1 ログイン画面構成

```
┌──────────────────────────────┐
│  [アプリロゴ + タイトル]       │
│                              │
│  利用規約 | プライバシーポリシー │
│  □ 利用規約に同意する          │
│                              │
│  [🟢 LINEでログイン]   ← 主CTA│
│  [🍎 Appleでログイン]  ← 副CTA│
│                              │
└──────────────────────────────┘
```

### 9.2 LINE Login フロー

```
LINEでログイン タップ
  → LINE OAuth 認証画面
  → 「友だち追加」チェックボックス表示（Add friend option API）
  → 認証成功 → Supabase Auth にセッション作成
  → handle_new_user トリガー → public.users 作成
  → line_accounts に LINE userId / friendFlag 保存
  → オンボーディング（初回のみ）
```

### 9.3 App Store 審査対応

| 要件 | 対応 |
|------|------|
| Sign in with Apple 必須 | Apple Login ボタンを提供 |
| 審査用デモアカウント | レビューノートにテスト用LINE/Appleアカウント記載 |
| アカウント削除導線 | 設定画面に「アカウント削除」ボタン |
| CSRF対策 | Supabase Auth が state パラメータを自動管理 |

---

## 10. App Store審査・法務チェックリスト

### 10.1 Phase 2（認証+課金）までに必須

```
[ ] プライバシーポリシー（日本語）
    - 収集する個人情報の種類
    - 利用目的
    - 第三者提供（Supabase = データ処理委託先）
    - 削除方法と期間（7日以内）
    - 問い合わせ窓口
[ ] 特定商取引法に基づく表記
    - 販売者名、所在地、連絡先
    - 返品・返金ポリシー
[ ] Apple App Privacy Labels 設定
[ ] アプリ内アカウント削除導線
[ ] Apple revoke API 対応
```

### 10.2 課金関連

```
[ ] IAP商品登録（App Store Connect）
[ ] サブスクリプショングループ設定
[ ] 返金Webhook（App Store Server Notifications）ハンドラー
[ ] billing_transactions の5年保持ポリシー
```

---

## 11. GPT-5.4 + エージェントチーム レビュー対応記録

### GPT-5.4 レビュー（3回）

| 回 | テーマ | P1 | P2 | 対応 |
|----|--------|----|----|------|
| 1 | 課金設計 | 4テーブル分割必須、二重課金防止の穴、ゲスト購入禁止、日本App Store IAP必須 | 浪人生対応、無料トライアルなし、年額中途解約 | 全件反映 |
| 2 | ゲストモード | D案推奨（ログイン必須+強いFree） | LINE CRM、App Store審査、先行事例 | D案採用 |
| 3 | DDL全体 | auth.users同期トリガー、active UNIQUE制約の危険性、entitlements COALESCE、purchase_events時刻分離 | questions_catalog拡張、ease_factor精度、全user_idインデックス | 全件反映 |

### エージェントチームレビュー

| チーム | P1指摘 | 対応 |
|--------|--------|------|
| データアーキテクト | COALESCE UNIQUE構文エラー、updated_atトリガー不在、ease_factor無制限、FK方針未決定、orphanセッション検出 | UNIQUE INDEX化、トリガー追加、CHECK追加、マイグレーション方針確定、orphanインデックス追加 |
| プロダクト課金 | billing_transactions不足、trialing未対応、二重課金防止不十分、exam_year CHECK制約なし | billing_transactions追加、trialing追加、プリフライトチェック関数、CHECK追加 |
| モバイルエンジニア | SyncRepository層必要、FK違反時のUX、visibilitychange未発火エッジケース | SyncRepo設計追加、デプロイ順序明記、pagehideフォールバック |
| セキュリティ | RLS未設計、Apple revoke必須、レートリミット、k-匿名性 | RLS全テーブル設計、チェックリスト追加、同期サイズ制限 |

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|------|----------|---------|
| 2026-03-27 | v1.0 | 初版。GPT-5.4×3回 + エージェントチーム4チームレビュー反映済み |
| 2026-03-27 | v1.1 | 最終レビュー7件修正: ❶users UPDATE禁止(自己昇格防止) ❷SECURITY DEFINER全関数にauth.uid()強制+search_path+REVOKE/GRANT ❸削除フロー状態遷移統一(active→pending_deletion) ❹billing_transactions匿名化をsentinel UUID方式に ❺二重課金防止DB制約追加 ❻check_entitlementのexam_year条件厳格化 ❼is_correctをNULL許容(スキップ時=正否不明) |
