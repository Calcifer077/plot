import EmptyState from "@/components/app/export/EmptyState";
import Export from "@/features/export/Export";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/export/$datasetId")({
  loader: ({ params }) => {
    if (params.datasetId === "no-dataset-id") throw notFound();
  },
  notFoundComponent: EmptyState,
  component: Export,
});
