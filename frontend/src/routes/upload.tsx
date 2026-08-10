import { createFileRoute } from "@tanstack/react-router";
import Upload from "@/components/app/upload/Upload";

export const Route = createFileRoute("/upload")({
  component: Upload,
});
