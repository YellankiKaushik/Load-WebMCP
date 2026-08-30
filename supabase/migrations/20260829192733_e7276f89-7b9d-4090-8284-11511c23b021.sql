REVOKE ALL ON FUNCTION public.approve_load_plan(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reject_load_plan(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.commit_load_plan(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.canonical_plan_hash(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_load_plan(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.reject_load_plan(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.commit_load_plan(text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.canonical_plan_hash(uuid) TO service_role;