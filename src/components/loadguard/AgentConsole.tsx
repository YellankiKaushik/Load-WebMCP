import { useMutation } from "@tanstack/react-query";
import { Bot, ShieldAlert, Terminal } from "lucide-react";
import { useState } from "react";

import {
  commitLoadPlan,
  planLoad,
  stageLoadPlan,
  validateLoadPlan,
} from "@/lib/loadguard.functions";
import type { PlanSummary } from "@/lib/loadguard/types";

type Props = {
  sessionKey: string;
  plan: PlanSummary | null;
  onChange: () => void;
};

// Lets a human exercise the exact same tool surface an MCP agent would call,
// so the authority boundary can be demonstrated without an agent browser.
export default function AgentConsole({ sessionKey, plan, onChange }: Props) {
  const [log, setLog] = useState<{ tone: "ok" | "err"; text: string }[]>([]);

  const push = (tone: "ok" | "err", text: string) =>
    setLog((prev) => [{ tone, text }, ...prev].slice(0, 6));

  const call = useMutation({
    mutationFn: async (tool: "create" | "validate" | "stage" | "commit") => {
      if (tool === "create") {
        const r = await planLoad({ data: { sessionKey } });
        return `create_load_plan -> ${r.plan?.status} | ${r.validation.utilizationPct}% | ${r.moves.length} move(s)`;
      }
      if (!plan) throw new Error("no plan in this session yet");
      if (tool === "validate") {
        const r = await validateLoadPlan({ data: { sessionKey, planId: plan.planId } });
        if (!r.ok) throw new Error(`validate_load_plan refused (${r.code})`);
        return `validate_load_plan -> ${
          r.validation.valid ? "valid" : `${r.validation.violations.length} violation(s)`
        }`;
      }
      if (tool === "stage") {
        const r = await stageLoadPlan({ data: { sessionKey, planId: plan.planId } });
        if (!r.ok) throw new Error(`stage_load_plan refused (${r.code})`);
        return `stage_load_plan -> STAGED | hash ${String(r.plan?.planHash).slice(0, 12)}`;
      }
      const r = await commitLoadPlan({ data: { sessionKey, planId: plan.planId } });
      if (!r.ok) throw new Error(`commit_load_plan refused (${r.code})`);
      return `commit_load_plan -> EXECUTED | ${r.items_applied} placements applied`;
    },

    onSuccess: (msg) => {
      push("ok", msg);
      onChange();
    },
    onError: (err: Error) => {
      push("err", err.message);
      onChange();
    },
  });

  const buttons: { key: "create" | "validate" | "stage" | "commit"; label: string }[] = [
    { key: "create", label: "create_load_plan" },
    { key: "validate", label: "validate_load_plan" },
    { key: "stage", label: "stage_load_plan" },
    { key: "commit", label: "commit_load_plan" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {buttons.map((b) => (
          <button
            key={b.key}
            type="button"
            disabled={call.isPending}
            onClick={() => call.mutate(b.key)}
            className={
              b.key === "commit"
                ? "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-destructive/45 bg-destructive/10 px-2 py-2 font-mono text-[0.68rem] font-semibold text-destructive transition-colors hover:bg-destructive/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-55"
                : "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-secondary/55 px-2 py-2 font-mono text-[0.68rem] font-semibold text-foreground transition-colors hover:border-primary/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-55"
            }
          >
            {b.key === "commit" ? (
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Bot className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {b.label}
          </button>
        ))}
      </div>
      <div className="rounded-md border border-border/60 bg-background/60 p-2.5">
        {log.length === 0 ? (
          <p className="flex items-center gap-2 font-mono text-[0.65rem] text-muted-foreground">
            <Terminal className="h-3.5 w-3.5" /> awaiting tool call...
          </p>
        ) : (
          <ul className="space-y-1 font-mono text-[0.65rem]">
            {log.map((entry, i) => (
              <li key={i} className={entry.tone === "ok" ? "text-success" : "text-destructive"}>
                {entry.tone === "ok" ? "OK " : "ERR "}
                {entry.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
