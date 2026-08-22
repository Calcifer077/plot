import Export from "@/features/export/Export";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/export/$datasetId")({
  component: Export,
});
