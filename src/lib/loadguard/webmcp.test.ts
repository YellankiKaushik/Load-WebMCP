import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/loadguard.functions", () => ({
  commitLoadPlan: vi.fn(),
  fetchActionLedger: vi.fn(),
  fetchLoadState: vi.fn(),
  fetchPackageConstraints: vi.fn(),
  planLoad: vi.fn(),
  stageLoadPlan: vi.fn(),
  validateLoadPlan: vi.fn(),
}));

import { LOADGUARD_WEBMCP_TOOL_NAMES, registerLoadGuardTools } from "./webmcp";

describe("LoadGuard WebMCP registration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("LG-007 registers the intended tool inventory through document.modelContext", () => {
    const registered: { name: string; annotations?: Record<string, unknown> }[] = [];
    vi.stubGlobal("document", {
      modelContext: {
        registerTool: (tool: { name: string; annotations?: Record<string, unknown> }) => {
          registered.push(tool);
          return { unregister: vi.fn() };
        },
      },
    });

    const result = registerLoadGuardTools("session-label", vi.fn());

    expect(result.registered).toBe(true);
    expect(registered.map((tool) => tool.name)).toEqual([...LOADGUARD_WEBMCP_TOOL_NAMES]);
    expect(registered.find((tool) => tool.name === "get_load_state")?.annotations).toEqual({
      readOnlyHint: true,
    });
    expect(
      registered.find((tool) => tool.name === "commit_load_plan")?.annotations,
    ).toBeUndefined();
  });

  it("LG-008 does not expose any human approval capability", () => {
    expect([...LOADGUARD_WEBMCP_TOOL_NAMES].join(" ")).not.toMatch(/approve|authorize|confirm/i);
  });

  it("LG-009 degrades gracefully without document.modelContext", () => {
    vi.stubGlobal("document", {});

    const result = registerLoadGuardTools("session-label", vi.fn());

    expect(result.registered).toBe(false);
    expect(result.toolNames).toEqual([...LOADGUARD_WEBMCP_TOOL_NAMES]);
    expect(() => result.unregister()).not.toThrow();
  });
});
