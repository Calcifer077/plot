import { createFileRoute } from "@tanstack/react-router";
import Charts from "@/features/charts/Charts";

export const Route = createFileRoute("/charts/$datasetId")({
  component: Charts,
});
