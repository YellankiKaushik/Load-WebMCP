import { createFileRoute } from "@tanstack/react-router";

import { LoadGuardWorkspace } from "@/components/loadguard/LoadGuardWorkspace";

const TITLE = "LoadGuard 3D - Live Workspace";
const DESCRIPTION =
  "The verified LoadGuard 3D operational workspace for deterministic WebMCP load planning and human-authorized execution.";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:image", content: "/loadguard-og.png" },
    ],
  }),
  component: LoadGuardWorkspace,
});
