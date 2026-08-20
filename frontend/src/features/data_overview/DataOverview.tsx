import {
  RefreshCw,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  // AlertTriangle,
  // CheckCircle2,
  // Square,
  // Zap,
  // CircleDot,
} from "lucide-react";

import TableComponent from "@/components/app/data_overview/TableComponent";
import { Route } from "@/routes/data-overview/$datasetId";
import { Button } from "@/components/ui/button";

interface StatCardProps {
  label: string;
  labelColor: string;
  value: string | number;
  warning?: boolean;
  barColor?: string;
  barWidth?: string;
  missing?: boolean;
}

function StatCard({
  label,
  labelColor,
  value,
  warning,
  barColor,
  barWidth,
  missing,
}: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div
        className={`text-[11px] font-semibold uppercase tracking-wide ${labelColor}`}
      >
        {label}
      </div>
      <div className="text-2xl font-bold mt-1 text-card-foreground flex items-center gap-1">
        {value}
        {warning && <span className="text-sm">⚠️</span>}
      </div>
      {missing ? (
        <div className="flex gap-1 mt-2.5 h-3.5 items-end">
          {[6, 10, 5, 4, 12].map((h, i) => (
            <div
              key={i}
              className={`w-3 rounded-sm ${i === 1 || i === 4 ? "bg-[#D85A30]" : "bg-[#F5C4B3]"}`}
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
      ) : (
        <div
          className={`h-1 rounded-full mt-2.5 ${barColor}`}
          style={{ width: barWidth }}
        />
      )}
    </div>
  );
}

interface IssueRowProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  sub: string;
  action?: React.ReactNode;
}

// function IssueRow({
//   icon,
//   iconBg,
//   iconColor,
//   title,
//   sub,
//   action,
// }: IssueRowProps) {
//   return (
//     <div className="flex gap-2.5 mb-3.5">
//       <div
//         className="w-6.5 h-6.5 min-w-6.5 rounded-md flex items-center justify-center"
//         style={{ background: iconBg, color: iconColor }}
//       >
//         {icon}
//       </div>
//       <div>
//         <div className="text-sm font-semibold text-card-foreground">
//           {title}
//         </div>
//         <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
//         {action && (
//           <div className="text-xs font-semibold text-primary mt-1 cursor-pointer flex items-center gap-1">
//             {action}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

const orders = [
  {
    id: "#ORD-00124",
    date: "2026-01-15",
    customer: "Acme Corp",
    revenue: "$12,400.00",
    qty: 42,
    highlight: false,
  },
  {
    id: "#ORD-00125",
    date: "2026-01-16",
    customer: "Globex Ltd",
    revenue: "$9,250.00",
    qty: 15,
    highlight: true,
  },
  {
    id: "#ORD-00126",
    date: "2026-01-16",
    customer: "Soylent Corp",
    revenue: "$1,420.00",
    qty: 3,
    highlight: false,
  },
  {
    id: "#ORD-00127",
    date: "2026-01-17",
    customer: "Initech LLC",
    revenue: "$18,900.00",
    qty: 112,
    highlight: false,
  },
  {
    id: "#ORD-00128",
    date: "2026-01-18",
    customer: "Umbrella Inc",
    revenue: "$5,400.50",
    qty: 28,
    highlight: false,
  },
  {
    id: "#ORD-00129",
    date: "2026-01-18",
    customer: "Hooli",
    revenue: "$22,000.00",
    qty: 89,
    highlight: true,
  },
];

export default function DataOverview() {
  const { datasetId } = Route.useParams();
  const { page } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { metadata, values } = Route.useLoaderData();

  function goToPage(newPage: number) {
    navigate({ search: (prev) => ({ ...prev, page: newPage }) });
  }

  function handleNextPage() {
    if (page < values.total_pages) {
      goToPage(page + 1);
    }
  }

  function handlePrevPage() {
    if (page > 1) {
      goToPage(page - 1);
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 font-sans text-foreground">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <div className="font-semibold text-[15px]">orders_2026.xlsx</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              Uploaded 3 min ago
              <span className="bg-muted text-primary px-2 py-px rounded-full text-[11px]">
                Sheet: Orders
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 text-sm font-medium border border-border bg-card rounded-lg px-3.5 py-2 hover:bg-accent transition-colors">
              <RefreshCw className="w-4 h-4" />
              Refresh data
            </button>
            <button className="flex items-center gap-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg px-3.5 py-2 hover:opacity-90 transition-opacity">
              <BarChart3 className="w-4 h-4" />
              Create chart
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
          <StatCard
            label="Total rows"
            labelColor="text-primary"
            value={metadata.total_rows}
            barColor="bg-primary"
            barWidth="60%"
          />
          <StatCard
            label="Columns"
            labelColor="text-primary"
            value={metadata.total_columns}
            barColor="bg-primary"
            barWidth="80%"
          />
          <StatCard
            label="Missing values"
            labelColor="text-[#993C1D]"
            value={metadata.missing_values}
            warning
            missing
          />
          <StatCard
            label="Numeric cols"
            labelColor="text-secondary"
            value={metadata.numeric_cols}
            barColor="bg-[#639922]"
            barWidth="60%"
          />
          <StatCard
            label="Categorical"
            labelColor="text-[#993C1D]"
            value={metadata.categorical_cols}
            barColor="bg-[#BA7517]"
            barWidth="40%"
          />
        </div>

        {/* Main grid */}
        <div className="">
          {/* Data preview */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-sm font-semibold">Data preview</div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                Showing 1-10 of {metadata.total_rows}
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevPage}
                    className="size-8 rounded-md border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextPage}
                    className="size-8 rounded-md border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <TableComponent data={values.data} />

            <div className="text-center text-sm text-primary pt-3 cursor-pointer hover:underline">
              View all {metadata.total_rows} rows
            </div>
          </div>

          {/* Dataset health */}
          {/* <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-sm font-semibold mb-2.5">Dataset health</div>

            <div className="flex flex-col items-center py-2.5">
              <div className="w-37.5 h-37.5 rounded-full border-8 border-primary flex flex-col items-center justify-center relative">
                <div
                  className="absolute -inset-2 rounded-full border-8 border-transparent -z-10"
                  style={{
                    borderRightColor: "var(--muted)",
                    borderBottomColor: "var(--muted)",
                    transform: "rotate(45deg)",
                  }}
                />
                <div className="text-4xl font-bold">82</div>
                <div className="text-[10px] text-muted-foreground tracking-wide">
                  GOOD SCORE
                </div>
              </div>
              <div className="text-xs text-muted-foreground text-center mt-3 leading-relaxed">
                Your data is looking healthy. We found a few areas for
                optimization below.
              </div>
            </div>

            <div className="text-[11px] font-semibold text-muted-foreground tracking-wide mt-4 mb-2.5">
              CRITICAL ISSUES
            </div>

            <IssueRow
              icon={<AlertTriangle className="w-3.5 h-3.5" />}
              iconBg="var(--error-container, #ffdad6)"
              iconColor="var(--on-error-container, #93000a)"
              title="Missing values detected"
              sub="2.1% of 'Shipping region' is empty."
              action={
                <>
                  <Zap className="w-3.5 h-3.5" /> Auto-fill
                </>
              }
            />
            <IssueRow
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              iconBg="#e1f5ee"
              iconColor="#0f6e56"
              title="Duplicate rows"
              sub="No duplicate records found."
            />
            <IssueRow
              icon={<Square className="w-3.5 h-3.5" />}
              iconBg="var(--tertiary-container, #ffe4da)"
              iconColor="var(--on-tertiary-container, #7e2c00)"
              title="Outliers detected"
              sub="12 rows in 'Revenue' exceed 3σ."
              action={
                <>
                  <CircleDot className="w-3.5 h-3.5" /> Review outliers
                </>
              }
            />
          </div> */}
        </div>
      </div>
    </div>
  );
}
