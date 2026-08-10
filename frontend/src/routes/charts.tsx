import { createFileRoute } from "@tanstack/react-router";
import Charts from "@/components/app/charts/Charts";

export const Route = createFileRoute("/charts")({
  component: Charts,
});
