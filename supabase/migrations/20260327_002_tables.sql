-- Migration: 20260327_002_tables.sql
-- 全20テーブル + インデックス + トリガー + コメント
-- DB設計spec §3.1〜§3.6 より
--
-- テーブル構成:
--   §3.1 公式コンテンツ: questions_catalog
--   §3.2 ユーザー管理: users, user_profiles, line_accounts
--   §3.3 学習データ: study_sessions, answer_history, card_progress, card_review_history, bookmarks
--   §3.4 課金: billing_customers, product_catalog, subscription_contracts, purchase_events, billing_transactions, entitlements
--   §3.5 インフラ: device_tokens, notification_preferences, beta_invitations
--   §3.6 統計: daily_question_stats, daily_card_stats

-- =============================================================================
-- §3.1 公式コンテンツ
-- =============================================================================

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

-- =============================================================================
-- §3.2 ユーザー管理
-- =============================================================================

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

-- auth.users → public.users 自動作成トリガー（001で関数定義済み、usersテーブル作成後にここで作成）
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

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

-- =============================================================================
-- §3.3 学習データ
-- =============================================================================

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

-- =============================================================================
-- §3.4 課金（6テーブル）
-- =============================================================================

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
-- NOTE: now()は不変関数ではないため部分インデックス述語に使えない
-- expires_atの有効期限チェックはアプリケーション層（can_purchase RPC）で行う
CREATE UNIQUE INDEX idx_ent_no_duplicate_active
  ON entitlements(user_id, entitlement_key, COALESCE(exam_year, 0))
  WHERE revoked_at IS NULL;

-- =============================================================================
-- §3.5 インフラ
-- =============================================================================

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

-- =============================================================================
-- §3.6 統計（アカウント削除時の匿名化集計）
-- =============================================================================

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
