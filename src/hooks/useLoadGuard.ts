import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  approveLoadPlan,
  commitLoadPlan,
  ensureSession,
  fetchActionLedger,
  fetchLoadState,
  planLoad,
  rejectLoadPlan,
  resetJudgeScenario,
  stageLoadPlan,
} from "@/lib/loadguard.functions";
import type { LedgerEvent, LoadState } from "@/lib/loadguard/types";

/** The session lives in an HttpOnly cookie; this only surfaces a short label. */
export function useSessionKey() {
  const session = useQuery({
    queryKey: ["session"],
    queryFn: () => ensureSession(),
    staleTime: Infinity,
  });
  return session.data?.sessionKey ?? null;
}

export function useLoadGuard() {
  const sessionKey = useSessionKey();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["load-state"] });
    queryClient.invalidateQueries({ queryKey: ["ledger"] });
  };

  const state = useQuery<LoadState>({
    queryKey: ["load-state", sessionKey],
    enabled: Boolean(sessionKey),
    queryFn: () => fetchLoadState({ data: { actor: "human" } }),
  });

  const ledger = useQuery<LedgerEvent[]>({
    queryKey: ["ledger", sessionKey],
    enabled: Boolean(sessionKey),
    queryFn: () => fetchActionLedger(),
  });

  const plan = useMutation({
    mutationFn: () => planLoad({ data: {} }),
    onSuccess: invalidate,
  });

  const stage = useMutation({
    mutationFn: (planId: string) => stageLoadPlan({ data: { planId } }),
    onSuccess: invalidate,
  });

  const approve = useMutation({
    mutationFn: (planId: string) => approveLoadPlan({ data: { planId } }),
    onSuccess: invalidate,
  });

  const reject = useMutation({
    mutationFn: (planId: string) => rejectLoadPlan({ data: { planId } }),
    onSuccess: invalidate,
  });

  const commit = useMutation({
    mutationFn: (planId: string) => commitLoadPlan({ data: { planId } }),
    onSuccess: invalidate,
  });

  const reset = useMutation({
    mutationFn: () => resetJudgeScenario(),
    onSuccess: invalidate,
  });

  return { sessionKey, state, ledger, plan, stage, approve, reject, commit, reset, invalidate };
}
