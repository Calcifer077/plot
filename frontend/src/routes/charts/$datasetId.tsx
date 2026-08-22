import { createFileRoute, notFound } from "@tanstack/react-router";
import Charts from "@/features/charts/Charts";

import EmptyState from "@/components/app/charts/EmptyState";

export const Route = createFileRoute("/charts/$datasetId")({
  loader: ({ params }) => {
    if (params.datasetId === "no-dataset-id") throw notFound();
  },
  notFoundComponent: EmptyState,
  component: Charts,
});
