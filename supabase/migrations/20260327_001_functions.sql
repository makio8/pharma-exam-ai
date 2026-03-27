-- Migration: 20260327_001_functions.sql
-- 共通トリガー関数3つ + auth.usersトリガー
-- DB設計spec §3.0 より

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

-- NOTE: on_auth_user_created トリガーは 002_tables.sql で users テーブル作成後に作成
-- （handle_new_user() が public.users に INSERT するため、テーブル存在が前提）
