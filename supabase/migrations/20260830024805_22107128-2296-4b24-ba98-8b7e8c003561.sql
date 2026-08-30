ALTER TABLE public.trucks ADD COLUMN IF NOT EXISTS state_revision integer NOT NULL DEFAULT 1;
ALTER TABLE public.load_plans ADD COLUMN IF NOT EXISTS source_state_revision integer;
ALTER TABLE public.load_plans ADD COLUMN IF NOT EXISTS plan_code text;
ALTER TABLE public.load_plans ADD COLUMN IF NOT EXISTS executing_at timestamptz;
ALTER TABLE public.load_plans ADD COLUMN IF NOT EXISTS failed_at timestamptz;

CREATE OR REPLACE FUNCTION public.commit_load_plan(p_session_key text, p_plan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_plan public.load_plans;
  v_hash text;
  v_count integer;
  v_revision integer;
BEGIN
  SELECT * INTO v_plan FROM public.load_plans
    WHERE id = p_plan_id AND session_key = p_session_key FOR UPDATE;
  IF v_plan.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  END IF;

  IF v_plan.status = 'EXECUTED' THEN
    SELECT count(*) INTO v_count FROM public.load_plan_items WHERE plan_id = p_plan_id;
    RETURN jsonb_build_object('ok', false, 'code', 'ALREADY_EXECUTED',
      'status', 'EXECUTED', 'items_applied', v_count, 'executed_at', v_plan.executed_at);
  END IF;

  IF v_plan.status <> 'APPROVED' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'APPROVAL_REQUIRED', 'status', v_plan.status);
  END IF;

  IF v_plan.expires_at IS NOT NULL AND v_plan.expires_at < now() THEN
    UPDATE public.load_plans SET status = 'EXPIRED' WHERE id = p_plan_id;
    RETURN jsonb_build_object('ok', false, 'code', 'EXPIRED');
  END IF;

  v_hash := public.canonical_plan_hash(p_plan_id);
  IF v_plan.approved_hash IS DISTINCT FROM v_hash THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PLAN_HASH_MISMATCH');
  END IF;

  SELECT state_revision INTO v_revision FROM public.trucks
    WHERE id = v_plan.truck_id AND session_key = p_session_key FOR UPDATE;
  IF v_revision IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  END IF;
  IF v_plan.source_state_revision IS NOT NULL AND v_plan.source_state_revision <> v_revision THEN
    RETURN jsonb_build_object('ok', false, 'code', 'STALE_PLAN',
      'source_state_revision', v_plan.source_state_revision, 'state_revision', v_revision);
  END IF;

  UPDATE public.load_plans SET status = 'EXECUTING', executing_at = now() WHERE id = p_plan_id;

  BEGIN
    UPDATE public.boxes b
      SET pos_x = i.pos_x, pos_y = i.pos_y, pos_z = i.pos_z, loaded = true
      FROM public.load_plan_items i
      WHERE i.plan_id = p_plan_id AND b.id = i.box_id AND b.session_key = p_session_key;
    SELECT count(*) INTO v_count FROM public.load_plan_items WHERE plan_id = p_plan_id;

    UPDATE public.trucks SET state_revision = state_revision + 1
      WHERE id = v_plan.truck_id AND session_key = p_session_key
      RETURNING state_revision INTO v_revision;

    UPDATE public.load_plans SET status = 'EXECUTED', executed_at = now() WHERE id = p_plan_id;
    UPDATE public.load_plans SET status = 'SUPERSEDED'
      WHERE session_key = p_session_key AND id <> p_plan_id AND status IN ('DRAFT', 'STAGED', 'APPROVED');
  EXCEPTION WHEN OTHERS THEN
    UPDATE public.load_plans SET status = 'FAILED', failed_at = now() WHERE id = p_plan_id;
    RETURN jsonb_build_object('ok', false, 'code', 'EXECUTION_FAILED', 'message', SQLERRM);
  END;

  RETURN jsonb_build_object('ok', true, 'status', 'EXECUTED',
    'items_applied', v_count, 'state_revision', v_revision);
END;
$function$;

REVOKE ALL ON FUNCTION public.commit_load_plan(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.commit_load_plan(text, uuid) TO service_role;