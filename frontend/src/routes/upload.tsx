import { createFileRoute } from "@tanstack/react-router";

import Upload from "@/features/upload/Upload";

export const Route = createFileRoute("/upload")({
  component: Upload,
});
