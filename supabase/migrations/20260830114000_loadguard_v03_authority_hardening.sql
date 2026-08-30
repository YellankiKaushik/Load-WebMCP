ALTER TABLE public.boxes
  DROP CONSTRAINT IF EXISTS boxes_priority_check,
  ADD CONSTRAINT boxes_priority_check CHECK (priority IN ('normal', 'high', 'urgent'));

ALTER TABLE public.load_plans
  DROP CONSTRAINT IF EXISTS load_plans_status_check,
  ADD CONSTRAINT load_plans_status_check CHECK (
    status IN (
      'DRAFT',
      'STAGED',
      'APPROVED',
      'REJECTED',
      'EXPIRED',
      'EXECUTING',
      'EXECUTED',
      'FAILED',
      'SUPERSEDED'
    )
  );

CREATE OR REPLACE FUNCTION public.canonical_plan_hash(p_plan_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT md5(
    coalesce(
      jsonb_build_object(
        'plan_id', p.id,
        'truck_id', p.truck_id,
        'source_state_revision', p.source_state_revision,
        'algorithm_version', p.algorithm_version,
        'items', coalesce(
          jsonb_agg(
            jsonb_build_object(
              'box_id', i.box_id,
              'box_code', i.box_code,
              'length_cm', round(b.length_cm::numeric, 3),
              'width_cm', round(b.width_cm::numeric, 3),
              'height_cm', round(b.height_cm::numeric, 3),
              'weight_kg', round(b.weight_kg::numeric, 3),
              'delivery_stop', b.delivery_stop,
              'fragile', b.fragile,
              'priority', b.priority,
              'pos_x', round(i.pos_x::numeric, 3),
              'pos_y', round(i.pos_y::numeric, 3),
              'pos_z', round(i.pos_z::numeric, 3),
              'sequence', i.sequence
            )
            ORDER BY i.sequence, i.box_code, i.box_id
          ),
          '[]'::jsonb
        )
      )::text,
      'missing-plan'
    )
  )
  FROM public.load_plans p
  LEFT JOIN public.load_plan_items i ON i.plan_id = p.id
  LEFT JOIN public.boxes b ON b.id = i.box_id
  WHERE p.id = p_plan_id
  GROUP BY p.id, p.truck_id, p.source_state_revision, p.algorithm_version;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_approved_plan_item_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_plan_id uuid;
  v_status text;
BEGIN
  v_plan_id := coalesce(NEW.plan_id, OLD.plan_id);
  SELECT status INTO v_status FROM public.load_plans WHERE id = v_plan_id;

  IF v_status IN ('APPROVED', 'EXECUTING', 'EXECUTED') THEN
    RAISE EXCEPTION 'approved plan items are immutable';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS load_plan_items_immutable_after_approval ON public.load_plan_items;
CREATE TRIGGER load_plan_items_immutable_after_approval
BEFORE INSERT OR UPDATE OR DELETE ON public.load_plan_items
FOR EACH ROW
EXECUTE FUNCTION public.prevent_approved_plan_item_mutation();

CREATE OR REPLACE FUNCTION public.approve_load_plan(p_session_key text, p_plan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_plan public.load_plans;
  v_hash text;
BEGIN
  SELECT * INTO v_plan FROM public.load_plans
    WHERE id = p_plan_id AND session_key = p_session_key FOR UPDATE;

  IF v_plan.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  END IF;

  IF v_plan.status <> 'STAGED' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_STATE_TRANSITION', 'status', v_plan.status);
  END IF;

  IF v_plan.expires_at IS NOT NULL AND v_plan.expires_at < now() THEN
    UPDATE public.load_plans SET status = 'EXPIRED' WHERE id = p_plan_id;
    RETURN jsonb_build_object('ok', false, 'code', 'EXPIRED');
  END IF;

  v_hash := public.canonical_plan_hash(p_plan_id);
  IF v_plan.plan_hash IS DISTINCT FROM v_hash THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PLAN_HASH_MISMATCH');
  END IF;

  UPDATE public.load_plans
    SET status = 'APPROVED', approved_at = now(), approved_hash = v_hash
    WHERE id = p_plan_id;

  RETURN jsonb_build_object('ok', true, 'status', 'APPROVED', 'approved_hash', v_hash);
END;
$function$;

CREATE OR REPLACE FUNCTION public.reject_load_plan(p_session_key text, p_plan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_status text;
BEGIN
  SELECT status INTO v_status FROM public.load_plans
    WHERE id = p_plan_id AND session_key = p_session_key FOR UPDATE;

  IF v_status IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  END IF;

  IF v_status <> 'STAGED' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_STATE_TRANSITION', 'status', v_status);
  END IF;

  UPDATE public.load_plans SET status = 'REJECTED', rejected_at = now() WHERE id = p_plan_id;
  RETURN jsonb_build_object('ok', true, 'status', 'REJECTED');
END;
$function$;

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
  v_applied integer;
  v_revision integer;
BEGIN
  SELECT * INTO v_plan FROM public.load_plans
    WHERE id = p_plan_id AND session_key = p_session_key FOR UPDATE;

  IF v_plan.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  END IF;

  IF v_plan.status = 'EXECUTED' THEN
    SELECT count(*) INTO v_count FROM public.load_plan_items WHERE plan_id = p_plan_id;
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'ALREADY_EXECUTED',
      'status', 'EXECUTED',
      'items_applied', v_count,
      'executed_at', v_plan.executed_at
    );
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
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'STALE_PLAN',
      'source_state_revision', v_plan.source_state_revision,
      'state_revision', v_revision
    );
  END IF;

  UPDATE public.load_plans SET status = 'EXECUTING', executing_at = now() WHERE id = p_plan_id;

  BEGIN
    SELECT count(*) INTO v_count FROM public.load_plan_items WHERE plan_id = p_plan_id;

    UPDATE public.boxes b
      SET pos_x = i.pos_x, pos_y = i.pos_y, pos_z = i.pos_z, loaded = true
      FROM public.load_plan_items i
      WHERE i.plan_id = p_plan_id AND b.id = i.box_id AND b.session_key = p_session_key;
    GET DIAGNOSTICS v_applied = ROW_COUNT;

    IF v_applied <> v_count THEN
      RAISE EXCEPTION 'plan item application count mismatch';
    END IF;

    UPDATE public.trucks SET state_revision = state_revision + 1
      WHERE id = v_plan.truck_id AND session_key = p_session_key
      RETURNING state_revision INTO v_revision;

    UPDATE public.load_plans SET status = 'EXECUTED', executed_at = now() WHERE id = p_plan_id;
    UPDATE public.load_plans SET status = 'SUPERSEDED'
      WHERE session_key = p_session_key AND id <> p_plan_id AND status IN ('DRAFT', 'STAGED', 'APPROVED');
  EXCEPTION WHEN OTHERS THEN
    UPDATE public.load_plans SET status = 'FAILED', failed_at = now() WHERE id = p_plan_id;
    RETURN jsonb_build_object('ok', false, 'code', 'EXECUTION_FAILED');
  END;

  RETURN jsonb_build_object(
    'ok', true,
    'status', 'EXECUTED',
    'items_applied', v_count,
    'state_revision', v_revision
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.approve_load_plan(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reject_load_plan(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.commit_load_plan(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.canonical_plan_hash(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_approved_plan_item_mutation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_load_plan(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.reject_load_plan(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.commit_load_plan(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.canonical_plan_hash(uuid) TO service_role;
