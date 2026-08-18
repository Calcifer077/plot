import { Image, FileText, Table, Link2, Download, Lock } from "lucide-react";

interface SelectFieldProps {
  label: string;
  value: string;
}

function SelectField({ label, value }: SelectFieldProps) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
        {label}
      </div>
      <div className="relative">
        <select
          className="w-full appearance-none bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground pr-8 cursor-pointer"
          defaultValue={value}
        >
          <option>{value}</option>
        </select>
        <svg
          className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

interface CardHeaderProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
}

function CardHeader({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
}: CardHeaderProps) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-card-foreground">
          {title}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
      </div>
    </div>
  );
}

export default function Export() {
  return (
    <div className="min-h-screen bg-background p-8 font-sans text-foreground">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Export &amp; share
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-lg leading-relaxed">
              Distribute your data insights in professional formats. Select your
              scope and customize output settings for high-fidelity reports.
            </p>
          </div>
          <span className="bg-muted text-muted-foreground text-xs font-medium px-3 py-1.5 rounded-md whitespace-nowrap">
            {/* ChartDashboardWorkspace */}
            File name
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* High-Res PNG */}
          <div className="bg-card border border-border rounded-xl p-5">
            <CardHeader
              icon={<Image className="w-4.5 h-4.5" />}
              iconBg="var(--accent)"
              iconColor="var(--accent-foreground)"
              title="High-res PNG"
              subtitle="Transparent or solid background"
            />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <SelectField label="Resolution" value="2x (Standard)" />
              <SelectField label="Theme" value="System default" />
            </div>
            <button className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity">
              <Download className="w-4 h-4" />
              Download PNG
            </button>
          </div>

          {/* Vector PDF */}
          <div className="bg-card border border-border rounded-xl p-5">
            <CardHeader
              icon={<FileText className="w-4.5 h-4.5" />}
              iconBg="#ffdad6"
              iconColor="#ba1a1a"
              title="Vector PDF"
              subtitle="Multi-page report structure"
            />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <SelectField label="Orientation" value="Landscape" />
              <SelectField label="Data detail" value="Summary only" />
            </div>
            <button className="w-full flex items-center justify-center gap-2 bg-card border border-border text-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-accent transition-colors">
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>

          {/* Excel Workbook */}
          <div className="bg-card border border-border rounded-xl p-5">
            <CardHeader
              icon={<Table className="w-4.5 h-4.5" />}
              iconBg="#e1f5ee"
              iconColor="#0f6e56"
              title="Excel workbook"
              subtitle="Raw data with pivot support"
            />
            <div className="mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Formatting
              </div>
              <div className="flex items-center gap-5">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 accent-primary rounded"
                  />
                  Keep formulas
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-primary rounded"
                  />
                  Frozen headers
                </label>
              </div>
            </div>
            <button className="w-full flex items-center justify-center gap-2 bg-muted text-muted-foreground rounded-lg py-2.5 text-sm font-medium cursor-not-allowed">
              <Download className="w-4 h-4" />
              Export workbook
            </button>
          </div>

          {/* Live Share Link */}
          <div className="bg-card border border-border rounded-xl p-5">
            <CardHeader
              icon={<Link2 className="w-4.5 h-4.5" />}
              iconBg="var(--accent)"
              iconColor="var(--accent-foreground)"
              title="Live share link"
              subtitle="Real-time collaborative access"
            />
            <div className="mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                Access permissions
              </div>
              <div className="flex gap-2">
                <input
                  readOnly
                  value="https://insights.excel/v/8x2j-k1p9-qw02"
                  className="flex-1 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground truncate"
                />
                <button className="bg-primary text-primary-foreground rounded-lg px-4 text-sm font-medium whitespace-nowrap hover:opacity-90 transition-opacity">
                  Copy link
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Anyone with link can view
              </span>
              {/* <span className="text-primary font-medium cursor-pointer hover:underline">
                Manage settings
              </span> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
