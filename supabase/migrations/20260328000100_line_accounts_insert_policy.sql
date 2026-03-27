-- LINE Login 後にユーザー自身が line_accounts を INSERT/UPDATE できるように
-- 自分の user_id のレコードのみ操作可能

CREATE POLICY "Users can insert own LINE account" ON line_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own LINE account" ON line_accounts
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
