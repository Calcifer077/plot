import Dashboard from "@/features/dashboard/Dashboard";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/$datasetId")({
  component: Dashboard,
});
