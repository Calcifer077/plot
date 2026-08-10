import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/components/app/dashboard/Dashboard";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});
