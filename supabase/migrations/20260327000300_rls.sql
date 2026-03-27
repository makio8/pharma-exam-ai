-- Migration: 20260327_003_rls.sql
-- 全テーブルのRLSポリシー
-- DB設計spec §4.2 より

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
