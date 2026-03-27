-- Migration: 20260327_004_app_functions.sql
-- アプリケーション関数5つ + REVOKE/GRANT文
-- DB設計spec §5.1, §5.2, §6.2, §7.3 より
--
-- 関数一覧:
--   §5.1 check_my_entitlement — クライアント用権利判定
--   §5.1 check_entitlement — service_role用権利判定
--   §5.2 can_purchase — 二重課金防止プリフライトチェック
--   §6.2 request_account_deletion — アカウント削除リクエスト
--   §7.3 merge_card_progress — カード進捗サーバー側マージ

-- =============================================================================
-- §5.1 権利判定クエリ
-- =============================================================================

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

-- 権限制御（関数シグネチャ付き）
-- PostgreSQL関数はデフォルトでPUBLICにEXECUTE付与されるため、明示的にREVOKE必須
REVOKE EXECUTE ON FUNCTION check_entitlement(uuid, text, int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION check_my_entitlement(text, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION check_my_entitlement(text, int) TO authenticated;

-- =============================================================================
-- §5.2 二重課金防止プリフライトチェック
-- =============================================================================

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

REVOKE EXECUTE ON FUNCTION can_purchase(text, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION can_purchase(text, int) TO authenticated;

-- =============================================================================
-- §6.2 削除リクエスト処理
-- =============================================================================

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
    status = 'pending_deletion',
    deletion_requested_at = now(),
    scheduled_purge_at = now() + interval '7 days'
  WHERE id = v_user_id AND status = 'active';

  -- Supabase Auth で即時バン（JWT有効期限内のアクセス防止）
  -- Edge Functionから: auth.admin.updateUserById(userId, { ban_duration: 'none' })
END;
$$;

REVOKE EXECUTE ON FUNCTION request_account_deletion() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION request_account_deletion() TO authenticated;

-- =============================================================================
-- §7.3 サーバー側マージ関数（card_progress）
-- =============================================================================

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
    SELECT value FROM jsonb_array_elements(p_events) AS arr(value)
    ORDER BY (arr.value->>'reviewed_at')::timestamptz
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

REVOKE EXECUTE ON FUNCTION merge_card_progress(uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION merge_card_progress(uuid, text, jsonb) TO authenticated;
