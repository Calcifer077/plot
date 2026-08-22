import { FileText, ArrowUp, LayoutGrid, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportsEmptyState() {
  return (
    <div className="flex min-h-175 w-full flex-col items-center justify-center gap-8 bg-background px-6 text-center">
      {/* Icon composition */}
      <div className="relative flex h-32.5 w-47.5 items-center justify-center">
        <div className="flex size-47.5 h-32.5 w-47.5 -rotate-6 items-center justify-center rounded-3xl bg-surface-container-high">
          <FileText
            className="size-11 rotate-6 text-primary"
            strokeWidth={1.75}
          />
        </div>

        {/* Teal upload badge */}
        <div className="absolute -right-1 -top-6 flex size-11 rotate-[8deg] items-center justify-center rounded-xl bg-secondary-container shadow-lg">
          <ArrowUp
            className="size-5 text-on-secondary-container"
            strokeWidth={2.5}
          />
        </div>

        {/* Chart badge */}
        <div className="absolute -bottom-3 -left-3 flex size-9 -rotate-6 items-center justify-center rounded-lg bg-surface-container-highest shadow-md">
          <BarChart2
            className="size-4 text-on-surface-variant"
            strokeWidth={2}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-3xl font-bold text-on-surface">
          No Reports to Export Yet
        </h2>
        <p className="max-w-md text-base text-on-surface-variant">
          Upload an Excel or CSV file to start generating professional insights
          and high-fidelity reports automatically.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Button className="h-auto gap-3 rounded-xl px-6 py-3">
          <FileText className="size-5" strokeWidth={2} />
          <span className="text-left leading-tight">
            Upload Your First
            <br />
            File
          </span>
        </Button>
        <Button
          variant="outline"
          className="h-auto gap-3 rounded-xl border-outline-variant px-6 py-3 text-on-surface"
        >
          <LayoutGrid className="size-5" strokeWidth={2} />
          <span className="text-left leading-tight">
            Try a Sample
            <br />
            Dataset
          </span>
        </Button>
      </div>
    </div>
  );
}
