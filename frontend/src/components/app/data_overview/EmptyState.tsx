import { FileUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmptyState() {
  return (
    <div className="flex min-h-150 w-full flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-2xl bg-primary-container/15">
        <FileUp className="size-9 text-primary" strokeWidth={2} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-xl font-semibold text-on-surface">
          No Data to Analyze Yet
        </h2>
        <p className="max-w-md text-base text-on-surface-variant">
          Upload an Excel or CSV file to start generating beautiful insights and
          health reports automatically.
        </p>
      </div>

      <div className="flex items-center gap-6">
        <Button className="gap-2">
          <Plus className="size-4" />
          Upload Your First File
        </Button>
        <Button variant="outline" className="text-primary">
          Try a Sample Dataset
        </Button>
      </div>
    </div>
  );
}
