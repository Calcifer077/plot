import { createFileRoute } from "@tanstack/react-router";
import Export from "@/components/app/export/Export";

export const Route = createFileRoute("/export")({
  component: Export,
});
