import {
  createRootRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import {
  LayoutGrid,
  Database,
  BarChart3,
  LayoutDashboard,
  Upload,
  Download,
  Search,
  Share2,
  Sun,
  Moon,
  RefreshCw,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { useTheme } from "@/lib/hooks/useTheme";

export const Route = createRootRoute({
  component: RootLayout,
});

const navItems = [
  { to: "/data-overview", label: "Data Overview", icon: Database },
  { to: "/charts", label: "Charts", icon: BarChart3 },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/export", label: "Export", icon: Download },
];

// eslint-disable-next-line react-refresh/only-export-components
function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface text-on-surface">
      {/* Sidebar */}
      <aside className="flex w-54.5 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        {/* Project switcher */}
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutGrid className="h-4.5 w-4.5" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold font-heading text-sidebar-foreground">
              Project Alpha
            </p>
            <p className="truncate text-xs text-on-surface-variant">V2.4.1</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary-container text-on-secondary-container"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                ].join(" ")}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={2} />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-between px-4 pb-4 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Synced
          </span>
          <span className="h-2 w-2 rounded-full bg-secondary" />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Navbar */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-surface-container-lowest px-6">
          <div className="flex items-center gap-2 font-heading text-[15px] font-bold text-foreground">
            <LayoutGrid className="h-4 w-4 text-primary" />
            Excel Insights
          </div>

          <div className="mx-4 flex max-w-md flex-1 items-center gap-2 rounded-lg border border-input bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">
            <Search className="h-4 w-4 shrink-0" />
            <input
              placeholder="Search insights..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-on-surface-variant"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-on-surface-variant">
              orders_2026.xlsx
            </span>
            <button className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-on-surface-variant hover:bg-accent"
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {/* <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary" /> */}
          </div>
        </header>

        {/* Routed page content */}
        <main className="flex-1 overflow-y-auto bg-surface p-6">
          <Outlet />
          <Toaster />
        </main>
      </div>
    </div>
  );
}
