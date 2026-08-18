import { useState } from "react";
import {
  Pencil,
  Undo2,
  Redo2,
  ListTree,
  Grid3x3,
  LayoutDashboard,
  BarChart3,
  LineChart,
  PieChart,
  Share2,
  Table2,
  MoreHorizontal,
  X,
  Plus,
  ArrowDownAZ,
  TrendingUp,
} from "lucide-react";

interface ChartTypeButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function ChartTypeButton({
  icon,
  label,
  active,
  onClick,
}: ChartTypeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-lg py-3 text-xs font-medium transition-all ${
        active
          ? "ring-2 ring-primary text-primary bg-accent"
          : "ring-1 ring-muted-foreground/30 text-foreground hover:bg-accent"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

interface PillProps {
  children: React.ReactNode;
  tone?: "primary" | "secondary" | "muted";
  onRemove?: () => void;
}

function Pill({ children, tone = "primary", onRemove }: PillProps) {
  const tones = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${tones[tone]}`}
    >
      {children}
      <X className="w-3 h-3 cursor-pointer" onClick={onRemove} />
    </span>
  );
}

interface FieldChipProps {
  icon: React.ReactNode;
  label: string;
}

function FieldChip({ icon, label }: FieldChipProps) {
  return (
    <div className="flex items-center justify-between border border-border rounded-lg px-3 py-2 bg-card">
      <span className="flex items-center gap-2 text-sm text-foreground">
        {icon}
        {label}
      </span>
      <X className="w-3.5 h-3.5 text-muted-foreground cursor-pointer" />
    </div>
  );
}

export default function Charts() {
  const [chartType, setChartType] = useState("Bar");

  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex">
      {/* Canvas */}
      <div className="flex-1 p-5">
        <div className="bg-card border border-border rounded-xl p-4 h-full">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold">Revenue by region</h2>
              <Pencil className="w-3.5 h-3.5 text-muted-foreground cursor-pointer" />
              <Undo2 className="w-4 h-4 text-muted-foreground cursor-pointer ml-1" />
              <Redo2 className="w-4 h-4 text-muted-foreground cursor-pointer" />
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 text-sm font-medium border border-border rounded-lg px-3 py-1.5 hover:bg-accent transition-colors">
                <ListTree className="w-4 h-4" />
                Legend
              </button>
              <button className="flex items-center gap-1.5 text-sm font-medium border border-border rounded-lg px-3 py-1.5 hover:bg-accent transition-colors">
                <Grid3x3 className="w-4 h-4" />
                Grid
              </button>
              <button className="flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity">
                <LayoutDashboard className="w-4 h-4" />
                Add to dashboard
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs mb-3 flex-wrap">
            <span className="text-muted-foreground font-medium">
              Active configuration:
            </span>
            <Pill tone="primary">Sum(Revenue)</Pill>
            <Pill tone="secondary">By region</Pill>
            <Pill tone="muted">Top 10</Pill>
          </div>

          <div
            className="w-full rounded-lg border border-border"
            style={{
              height: "440px",
              backgroundImage:
                "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              backgroundColor: "var(--card)",
            }}
          />
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-75 border-l border-border p-5 bg-background">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2.5">
          Chart type
        </div>
        <div className="grid grid-cols-3 gap-2 mb-5">
          <ChartTypeButton
            icon={<BarChart3 className="w-4 h-4" />}
            label="Bar"
            active={chartType === "Bar"}
            onClick={() => setChartType("Bar")}
          />
          <ChartTypeButton
            icon={<LineChart className="w-4 h-4" />}
            label="Line"
            active={chartType === "Line"}
            onClick={() => setChartType("Line")}
          />
          <ChartTypeButton
            icon={<PieChart className="w-4 h-4" />}
            label="Pie"
            active={chartType === "Pie"}
            onClick={() => setChartType("Pie")}
          />
          <ChartTypeButton
            icon={<Share2 className="w-4 h-4" />}
            label="Scatter"
            active={chartType === "Scatter"}
            onClick={() => setChartType("Scatter")}
          />
          <ChartTypeButton
            icon={<Table2 className="w-4 h-4" />}
            label="Table"
            active={chartType === "Table"}
            onClick={() => setChartType("Table")}
          />
          <ChartTypeButton
            icon={<MoreHorizontal className="w-4 h-4" />}
            label="More"
            active={chartType === "More"}
            onClick={() => setChartType("More")}
          />
        </div>

        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2.5">
          Data mapping
        </div>
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1.5">
            X-axis (dimension)
          </div>
          <FieldChip
            icon={<Share2 className="w-3.5 h-3.5 text-secondary" />}
            label="Region"
          />
        </div>
        <div className="mb-4">
          <div className="text-xs text-muted-foreground mb-1.5">
            Y-axis (measure)
          </div>
          <FieldChip
            icon={<span className="text-primary font-semibold text-sm">#</span>}
            label="Revenue"
          />
        </div>

        <div className="flex items-center justify-between mb-5">
          <span className="text-xs text-muted-foreground">Aggregation:</span>
          <span className="text-xs font-medium flex items-center gap-1">
            Sum
            <svg
              className="w-3 h-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </div>

        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2.5">
          Appearance
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm">Primary color</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">#0040CF</span>
            <div className="w-6 h-6 rounded-md bg-primary" />
          </div>
        </div>

        <div className="flex items-center justify-between mb-5">
          <span className="text-sm">Sorting</span>
          <div className="flex gap-1.5">
            <button className="w-8 h-8 flex items-center justify-center border border-border rounded-md hover:bg-accent">
              <ArrowDownAZ className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-border rounded-md hover:bg-accent">
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Filters (2)
          </span>
          <span className="text-xs font-medium text-primary cursor-pointer flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" />
            Add
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between border border-border rounded-lg px-3 py-2 bg-card text-sm">
            Year is 2026
            <X className="w-3.5 h-3.5 text-muted-foreground cursor-pointer" />
          </div>
          <div className="flex items-center justify-between border border-border rounded-lg px-3 py-2 bg-card text-sm">
            Profit &gt; 15%
            <X className="w-3.5 h-3.5 text-muted-foreground cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );
}
