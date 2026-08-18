import { createFileRoute } from "@tanstack/react-router";

import Export from "@/features/export/Export";

export const Route = createFileRoute("/export")({
  component: Export,
});
