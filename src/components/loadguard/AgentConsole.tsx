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
    <div className="agent-console">
      <div className="agent-console__actions">
        {buttons.map((b) => (
          <button
            key={b.key}
            type="button"
            disabled={call.isPending}
            onClick={() => call.mutate(b.key)}
            className={
              b.key === "commit"
                ? "agent-console__button agent-console__button--commit"
                : "agent-console__button"
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
      <div className="agent-console__log">
        {log.length === 0 ? (
          <p className="agent-console__empty">
            <Terminal className="h-3.5 w-3.5" /> awaiting tool call...
          </p>
        ) : (
          <ul className="agent-console__entries">
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
