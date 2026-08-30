import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// The session key is NEVER accepted from the client: it is resolved server-side
// from an HttpOnly cookie, so no caller can address another session's load.
const planSchema = z.object({ planId: z.string().uuid() });

export const ensureSession = createServerFn({ method: "POST" }).handler(async () => {
  const { resolveSessionKey } = await import("./loadguard.server");
  return { sessionKey: resolveSessionKey().slice(0, 8) };
});

export const fetchLoadState = createServerFn({ method: "POST" })
  .validator((data) =>
    z.object({ actor: z.enum(["agent", "human", "system"]).default("human") }).parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const { getLoadState, resolveSessionKey } = await import("./loadguard.server");
    return getLoadState(resolveSessionKey(), data.actor);
  });

export const fetchPackageConstraints = createServerFn({ method: "POST" })
  .validator((data) => z.object({ codes: z.array(z.string()).optional() }).parse(data ?? {}))
  .handler(async ({ data }) => {
    const { getPackageConstraints, resolveSessionKey } = await import("./loadguard.server");
    return getPackageConstraints(resolveSessionKey(), data.codes);
  });

export const planLoad = createServerFn({ method: "POST" })
  .validator((data) => z.object({ includeCodes: z.array(z.string()).optional() }).parse(data ?? {}))
  .handler(async ({ data }) => {
    const { createCandidatePlan, resolveSessionKey } = await import("./loadguard.server");
    return createCandidatePlan(resolveSessionKey(), data.includeCodes);
  });

export const validateLoadPlan = createServerFn({ method: "POST" })
  .validator((data) => z.object({ planId: z.string().uuid().optional() }).parse(data ?? {}))
  .handler(async ({ data }) => {
    const { validateLoad, resolveSessionKey } = await import("./loadguard.server");
    return validateLoad(resolveSessionKey(), data.planId);
  });

export const stageLoadPlan = createServerFn({ method: "POST" })
  .validator((data) => planSchema.parse(data))
  .handler(async ({ data }) => {
    const { stagePlan, resolveSessionKey } = await import("./loadguard.server");
    return stagePlan(resolveSessionKey(), data.planId);
  });

export const approveLoadPlan = createServerFn({ method: "POST" })
  .validator((data) => planSchema.parse(data))
  .handler(async ({ data }) => {
    const { approvePlan, resolveSessionKey } = await import("./loadguard.server");
    return approvePlan(resolveSessionKey(), data.planId);
  });

export const rejectLoadPlan = createServerFn({ method: "POST" })
  .validator((data) => planSchema.parse(data))
  .handler(async ({ data }) => {
    const { rejectPlan, resolveSessionKey } = await import("./loadguard.server");
    return rejectPlan(resolveSessionKey(), data.planId);
  });

export const commitLoadPlan = createServerFn({ method: "POST" })
  .validator((data) => planSchema.parse(data))
  .handler(async ({ data }) => {
    const { commitPlan, resolveSessionKey } = await import("./loadguard.server");
    return commitPlan(resolveSessionKey(), data.planId);
  });

export const fetchActionLedger = createServerFn({ method: "POST" }).handler(async () => {
  const { getLedger, resolveSessionKey } = await import("./loadguard.server");
  return getLedger(resolveSessionKey());
});

export const resetJudgeScenario = createServerFn({ method: "POST" }).handler(async () => {
  const { resetScenario, getLoadState, resolveSessionKey } = await import("./loadguard.server");
  const sessionKey = resolveSessionKey();
  await resetScenario(sessionKey);
  return getLoadState(sessionKey, "system");
});
