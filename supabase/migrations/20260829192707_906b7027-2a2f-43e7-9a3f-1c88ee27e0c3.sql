CREATE TABLE public.trucks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key text NOT NULL,
  code text NOT NULL,
  length_cm numeric NOT NULL,
  width_cm numeric NOT NULL,
  height_cm numeric NOT NULL,
  max_weight_kg numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX trucks_session_code_idx ON public.trucks (session_key, code);

CREATE TABLE public.boxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key text NOT NULL,
  truck_id uuid NOT NULL REFERENCES public.trucks(id) ON DELETE CASCADE,
  code text NOT NULL,
  length_cm numeric NOT NULL,
  width_cm numeric NOT NULL,
  height_cm numeric NOT NULL,
  weight_kg numeric NOT NULL,
  destination text NOT NULL,
  delivery_stop integer NOT NULL DEFAULT 1,
  fragile boolean NOT NULL DEFAULT false,
  priority text NOT NULL DEFAULT 'normal',
  loaded boolean NOT NULL DEFAULT false,
  pos_x numeric,
  pos_y numeric,
  pos_z numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX boxes_session_code_idx ON public.boxes (session_key, code);
CREATE INDEX boxes_truck_idx ON public.boxes (truck_id);

CREATE TABLE public.load_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key text NOT NULL,
  truck_id uuid NOT NULL REFERENCES public.trucks(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'DRAFT',
  created_by text NOT NULL DEFAULT 'agent',
  algorithm_version text NOT NULL DEFAULT 'planner-v1',
  plan_hash text,
  approved_hash text,
  utilization_pct numeric,
  total_weight_kg numeric,
  validation jsonb,
  failure_reason text,
  staged_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  executed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX load_plans_session_idx ON public.load_plans (session_key, created_at DESC);

CREATE TABLE public.load_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.load_plans(id) ON DELETE CASCADE,
  box_id uuid NOT NULL REFERENCES public.boxes(id) ON DELETE CASCADE,
  box_code text NOT NULL,
  pos_x numeric NOT NULL,
  pos_y numeric NOT NULL,
  pos_z numeric NOT NULL,
  sequence integer NOT NULL
);
CREATE INDEX load_plan_items_plan_idx ON public.load_plan_items (plan_id, sequence);

CREATE TABLE public.action_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor text NOT NULL,
  event_type text NOT NULL,
  tool_name text,
  resource_type text,
  resource_id text,
  result text NOT NULL,
  summary text NOT NULL,
  metadata jsonb
);
CREATE INDEX action_ledger_session_idx ON public.action_ledger (session_key, occurred_at DESC);

GRANT ALL ON public.trucks TO service_role;
GRANT ALL ON public.boxes TO service_role;
GRANT ALL ON public.load_plans TO service_role;
GRANT ALL ON public.load_plan_items TO service_role;
GRANT ALL ON public.action_ledger TO service_role;

ALTER TABLE public.trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_ledger ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.canonical_plan_hash(p_plan_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT md5(coalesce(string_agg(
    i.box_code || ':' || round(i.pos_x::numeric, 3) || ':' || round(i.pos_y::numeric, 3) || ':' || round(i.pos_z::numeric, 3),
    '|' ORDER BY i.box_code
  ), 'empty'))
  FROM public.load_plan_items i
  WHERE i.plan_id = p_plan_id;
$$;

CREATE OR REPLACE FUNCTION public.approve_load_plan(p_session_key text, p_plan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan public.load_plans;
  v_hash text;
BEGIN
  SELECT * INTO v_plan FROM public.load_plans
    WHERE id = p_plan_id AND session_key = p_session_key FOR UPDATE;
  IF v_plan.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PLAN_NOT_FOUND');
  END IF;
  IF v_plan.status <> 'STAGED' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_STATE', 'status', v_plan.status);
  END IF;
  IF v_plan.expires_at IS NOT NULL AND v_plan.expires_at < now() THEN
    UPDATE public.load_plans SET status = 'EXPIRED' WHERE id = p_plan_id;
    RETURN jsonb_build_object('ok', false, 'code', 'PROPOSAL_EXPIRED');
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
$$;

CREATE OR REPLACE FUNCTION public.reject_load_plan(p_session_key text, p_plan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  SELECT status INTO v_status FROM public.load_plans
    WHERE id = p_plan_id AND session_key = p_session_key FOR UPDATE;
  IF v_status IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PLAN_NOT_FOUND');
  END IF;
  IF v_status <> 'STAGED' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_STATE', 'status', v_status);
  END IF;
  UPDATE public.load_plans SET status = 'REJECTED', rejected_at = now() WHERE id = p_plan_id;
  RETURN jsonb_build_object('ok', true, 'status', 'REJECTED');
END;
$$;

CREATE OR REPLACE FUNCTION public.commit_load_plan(p_session_key text, p_plan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan public.load_plans;
  v_hash text;
  v_count integer;
BEGIN
  SELECT * INTO v_plan FROM public.load_plans
    WHERE id = p_plan_id AND session_key = p_session_key FOR UPDATE;
  IF v_plan.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PLAN_NOT_FOUND');
  END IF;
  IF v_plan.status = 'EXECUTED' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'ALREADY_EXECUTED');
  END IF;
  IF v_plan.status <> 'APPROVED' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_APPROVED', 'status', v_plan.status);
  END IF;
  IF v_plan.expires_at IS NOT NULL AND v_plan.expires_at < now() THEN
    UPDATE public.load_plans SET status = 'EXPIRED' WHERE id = p_plan_id;
    RETURN jsonb_build_object('ok', false, 'code', 'PROPOSAL_EXPIRED');
  END IF;
  v_hash := public.canonical_plan_hash(p_plan_id);
  IF v_plan.approved_hash IS DISTINCT FROM v_hash THEN
    RETURN jsonb_build_object('ok', false, 'code', 'APPROVED_HASH_MISMATCH');
  END IF;

  UPDATE public.boxes b
    SET pos_x = i.pos_x, pos_y = i.pos_y, pos_z = i.pos_z, loaded = true
    FROM public.load_plan_items i
    WHERE i.plan_id = p_plan_id AND b.id = i.box_id AND b.session_key = p_session_key;
  SELECT count(*) INTO v_count FROM public.load_plan_items WHERE plan_id = p_plan_id;

  UPDATE public.load_plans SET status = 'EXECUTED', executed_at = now() WHERE id = p_plan_id;
  UPDATE public.load_plans SET status = 'SUPERSEDED'
    WHERE session_key = p_session_key AND id <> p_plan_id AND status IN ('DRAFT', 'STAGED', 'APPROVED');

  RETURN jsonb_build_object('ok', true, 'status', 'EXECUTED', 'items_applied', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.approve_load_plan(text, uuid) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.reject_load_plan(text, uuid) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.commit_load_plan(text, uuid) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.canonical_plan_hash(uuid) FROM anon, authenticated;