import { createFileRoute } from "@tanstack/react-router";

import DataOverview from "@/features/data_overview/DataOverview";

export const Route = createFileRoute("/data-overview")({
  component: DataOverview,
});
