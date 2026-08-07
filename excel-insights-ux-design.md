# Excel Insights — Product Design Specification

**Tagline:** Turn Excel Files into Beautiful Insights.
**Type:** Desktop-first analytics web app (React frontend, FastAPI + Matplotlib backend)
**Design register:** Notion-calm structure + Power BI density, minimal chrome, soft shadows, generous spacing.

---

## 1. Design System

### 1.1 Color palette

Neutral-cool base with a single trustworthy indigo-teal accent. No decorative gradients on data surfaces — color is reserved for meaning.

**Light mode**
| Token | Value | Use |
|---|---|---|
| `bg/canvas` | `#F7F8FA` | App background |
| `bg/surface` | `#FFFFFF` | Cards, panels, table |
| `bg/subtle` | `#F0F2F5` | Hover rows, inert chips |
| `border/default` | `#E3E6EB` | Card & table borders |
| `text/primary` | `#111827` | Headings, values |
| `text/secondary` | `#5B6472` | Labels, captions |
| `accent/primary` | `#2F5BEA` | CTAs, active nav, focus ring |
| `accent/hover` | `#2547C4` | Pressed state |
| `accent/soft` | `#E8EDFD` | Selected nav pill, badge bg |
| `success` | `#128A5B` | Healthy dataset indicators |
| `warning` | `#B4700A` | Missing-value warnings |
| `danger` | `#C0392F` | Errors, failed parse |

**Dark mode**
| Token | Value |
|---|---|
| `bg/canvas` | `#0E1116` |
| `bg/surface` | `#161B22` |
| `bg/subtle` | `#1E242D` |
| `border/default` | `#272E38` |
| `text/primary` | `#E9ECF1` |
| `text/secondary` | `#9AA4B2` |
| `accent/primary` | `#6B8CFF` |
| `accent/soft` | `#1B2440` |
| `success` / `warning` / `danger` | `#3DBE8B` / `#E0A63C` / `#F0736A` |

**Categorical chart palette (colorblind-safe, 8 steps)**
`#2F5BEA` · `#12A5A5` · `#F2A93B` · `#C0392F` · `#7A4FD1` · `#3DBE8B` · `#E06BA8` · `#6B7683`

**Sequential (heatmap / correlation):** `#F0F4FF → #2F5BEA → #14245C`
**Diverging (correlation −1…+1):** `#C0392F → #F5F5F5 → #2F5BEA`

### 1.2 Typography
- **UI + headings:** Inter Tight / Inter — 600 for headings, 500 for labels.
- **Numerals & table cells:** Inter with `tabular-nums` (column alignment is non-negotiable in a data app).
- Scale: Display 40/48 · H1 30/38 · H2 22/30 · H3 17/24 · Body 14/22 · Label 13/18 · Caption 12/16 · Mono-num 13.

### 1.3 Form language
- Radius: 6px controls · 12px cards · 16px modals/upload zone · 999px pills.
- Elevation: `0 1px 2px rgba(16,24,40,.05)` resting; `0 8px 24px rgba(16,24,40,.10)` popovers/drag.
  Dark mode replaces shadow with a 1px lighter border + subtle inner glow.
- Spacing scale 4/8/12/16/24/32/48/64. Card padding 24. Panel gutter 24. Page max-width 1440 centered.
- Motion: 120ms ease-out for hover, 200ms for panel/drawer, 320ms spring for chart re-render. Charts fade+scale from 0.98 — never re-animate on filter tweaks, only on chart-type change.

### 1.4 Grid
12-column, 24px gutters, 32px page margins.
Breakpoints: `1440+` full three-panel · `1280` right panel collapses to icon rail with drawer · `1024` left column selector becomes a top dropdown · `<768` single column, chart-first, config in a bottom sheet.

---

## 2. Information Architecture

```
Landing
 └─ Upload  ────────────────────────────┐
     └─ Workspace (file loaded)         │
         ├─ Data Overview   (default)   │  Recent files re-enter here
         ├─ Charts (Chart Builder)      │
         ├─ Dashboard (Builder)         │
         ├─ Exports                     │
         └─ Settings                    │
```

Persistent shell after upload: **top navbar** (64px) + **left sidebar** (240px expanded / 64px icon-only). Everything else is the content region. The file is the session context — switching files resets the workspace, never the nav.

---

## 3. Screen Designs

### 3.1 Landing Page

Full-bleed page, no app shell. Sticky transparent header (blurs to `bg/surface` on scroll): wordmark left, `Features · Charts · Docs` center, `Try Demo` ghost + `Upload File` solid right.

**Hero** — asymmetric 55/45 split, 96px top padding.
- Left: eyebrow pill "No code required" · Display headline **"Turn Excel Files into Beautiful Insights."** · 18px subline: *Drop in a spreadsheet. Get profiling, charts, and shareable dashboards in seconds.* · Button pair: primary **Upload File** (with upload glyph), secondary outline **Try Demo** · micro-caption: `.xlsx · .csv · files up to 50 MB · nothing leaves your workspace`.
- Right: **illustration** — an isometric spreadsheet grid tilted back in perspective; from its cells, translucent bar columns rise vertically, a line-chart ribbon arcs out of the top-right, and a donut segment floats above. Cells nearest the charts glow accent-soft. Flat vector, 3 palette colors max, no photoreal, no purple neon.

**Features** — 4-up card row (2×2 at ≤1024), each with a 32px line icon in an accent-soft rounded square:
1. **Upload Excel files** — Drag any .xlsx or .csv; multi-sheet workbooks detected automatically.
2. **Automatic data profiling** — Types, missing values, distributions, and outliers computed on arrival.
3. **Interactive charts** — Nine chart types with live aggregation, filtering, and sorting.
4. **Export visualizations** — PNG, PDF, Excel report, or a shareable link.

**Flow strip** — 5 numbered steps with connector line: Upload → Explore → Chart → Compose → Share. Each with a 3-line thumbnail of the real UI.

**Closing CTA band** — accent-soft panel, centered headline "Your first chart is 30 seconds away", same button pair.
**Footer** — 4 slim columns (Product, Charts, Resources, Legal), theme toggle bottom-right.

---

### 3.2 Upload Screen

Centered single column, max-width 720, page canvas background, breadcrumb `Home / Upload` above.

**Drop zone** — 100% width, 320px tall, 2px dashed `border/default`, radius 16, `bg/surface`.
- Idle: cloud-upload glyph 48px in accent-soft circle · "Drag & drop your file here" (H3) · "or" divider · **Browse Files** outline button · format row of two chips: `.xlsx` `.csv` + caption "Max 50 MB · First sheet used by default".
- Drag-over: border becomes solid accent, fill `accent/soft`, zone scales 1.01, copy swaps to "Release to upload".
- Invalid file: border `danger`, inline red row "PPTX isn't supported — use .xlsx or .csv".

**Upload progress** — the zone collapses into a 96px file card: file-type icon, filename, size, determinate progress bar (accent, 6px) with `%` and `2.1 MB / 4.4 MB`, cancel ✕. On completion the bar is replaced by a staged checklist that ticks in sequence: `Uploaded ✓ · Parsing sheets ✓ · Profiling columns …`. Then auto-navigate to Data Overview with a toast "orders_2026.xlsx ready — 12,480 rows".

**Multi-sheet modal** — if the workbook has >1 sheet: list of sheets with row/column counts and a radio, primary "Open sheet".

**Recent files** — section header + "Clear all" text button. Rows (not cards) in a bordered list: icon · filename · `12,480 rows · 18 cols` · relative time · overflow menu (Open, Rename, Download, Remove). Empty state: dashed illustration + "No files yet — your uploads will appear here."

---

### 3.3 Dataset Overview Dashboard

**Top navbar** (64px, `bg/surface`, 1px bottom border, sticky)
Left: logo mark + "Excel Insights" · vertical divider · **file chip**: sheet icon + `orders_2026.xlsx` + caret (dropdown: Switch sheet, Replace file, Recent files, File details).
Center: nothing (keeps the bar calm).
Right: global search `⌘K` · dark-mode toggle (sun/moon pill, animated knob) · Share button · avatar with profile menu (Account, Preferences, Billing, Help, Sign out).

**Left sidebar** (240px, `bg/surface`, collapsible to 64px via a chevron at the bottom)
Nav items with 20px line icons, 40px rows, 8px radius; active = `accent/soft` fill + accent text + 3px left bar:
`Data Overview · Charts · Dashboard · Exports · Settings`.
Below a divider: **Saved views** list (max 5) and a "＋ New chart" ghost button. Footer of sidebar: storage meter + Help.

**Main area** (24px padding, page header row: H2 filename + subline `Uploaded 3 min ago · Sheet: Orders` and right-aligned `Refresh` / `Create chart` primary.)

**Stat cards** — one row of 5, equal width, 12px radius, 24px padding:
| Card | Content |
|---|---|
| Rows | `12,480` + caption "0 duplicates" |
| Columns | `18` + caption "3 sheets available" |
| Missing values | `326` + `2.1% of cells` in warning tone + mini sparkline of missingness by column |
| Numeric columns | `9` + inline type chips |
| Categorical columns | `6` + caption "3 date/other" |

Each card: 13px uppercase-ish label in `text/secondary`, 30px tabular value, caption row. Subtle hover lift; click filters the Column Info list below.

**Data preview table** — card with header (`Data preview` + "Showing 100 of 12,480 rows" + column-visibility button + density toggle + full-screen icon).
Table: sticky header row with type glyph (`#`, `Abc`, `📅`) beside each column name, sortable carets, 40px rows, zebra off / hover `bg/subtle`, numeric right-aligned tabular, nulls shown as a muted `—` chip, long text truncated with tooltip. Horizontal scroll with a pinned first column. Footer: pagination + "Open in full screen".

**Column information cards** — responsive 3-up grid. Each card:
- Header: column name + type badge (Numeric / Categorical / Date).
- Micro-visual: histogram sparkbars for numeric, top-5 horizontal category bars for categorical, timeline strip for dates.
- Stat pairs in a two-column key/value list: min · max · mean · median · std (numeric) or unique · mode · top share (categorical).
- Completeness bar: filled accent = present, hatched warning = missing, with `98.4% complete`.
- Hover reveals a "Chart this" ghost button that deep-links to Chart Builder pre-configured.

**Dataset health indicators** — right-hand card (or full-width strip below): overall **Health score 82/100** as a thin arc gauge, then a checklist of rows with status dots:
`Missing values 2.1% — acceptable` · `Duplicate rows 0 — good` · `Outliers detected in 2 columns — review` · `Mixed types in "order_id" — needs attention` · `Constant columns 1 — consider dropping`.
Each row expands to show affected columns and a one-click "Fix" / "Ignore" action.

---

### 3.4 Chart Builder

Three-panel layout: **280 | fluid | 320**, all `bg/surface` cards separated by canvas gutters.

**Left panel — Column selector**
- Sticky search bar at top ("Search columns…", ⌘F).
- Two collapsible groups with counts: **Numeric (9)** and **Categorical (6)**, plus **Date (3)**.
- Each column is a draggable pill row: type glyph · name · tiny distribution sparkline on hover. Dragging shows a ghost chip; valid drop targets (X, Y, Color wells in the right panel) glow accent-soft.
- Bottom: "Show unused only" toggle.

**Center — Chart preview**
- Toolbar above the canvas: chart title (inline-editable) · undo/redo · zoom-to-fit · legend toggle · gridline toggle · full-screen · **Add to dashboard** primary.
- Canvas: white/surface card with 32px inner padding, chart rendered centered, responsive. Loading = skeleton axes + shimmer, never a spinner over old data.
- Below canvas: **applied-config summary bar** of removable chips — `Sum(revenue)` `by region` `Top 10` `filter: year = 2026`.
- Empty state: dotted chart glyph, "Pick a chart type and drop in columns to begin", plus 3 "Suggested charts" cards generated from profiling (e.g. "Revenue by Region — Bar").

**Right panel — Configuration** (scrollable, sectioned with 13px section labels)
1. **Chart type** — 3×3 icon grid of the nine types; selected has accent border + soft fill; hover tooltip names it and states required inputs.
2. **X-axis** — column select with type filter; shows a warning if the type mismatches the chart.
3. **Y-axis** — column select + "＋ Add series" (line/bar/area only).
4. **Aggregation** — segmented control: `Sum · Average · Count · Median` (disabled and greyed for scatter/histogram/box, with a tooltip explaining why).
5. **Color** — palette picker: 5 swatch strips (Default, Cool, Warm, Colorblind-safe, Mono) + "Custom" opening a per-series color popover; for continuous charts a sequential/diverging toggle.
6. **Sorting** — sort by X / Y / original, ascending–descending toggle, and a "Top N" stepper.
7. **Filters** — filter builder: stacked condition rows `[column] [operator] [value]` with numeric ranges as dual sliders, categorical as multi-select checklist with search, dates as a range picker. `+ Add filter`, AND/OR toggle between rows, per-row enable switch and delete.
8. Footer bar pinned to panel bottom: `Reset` ghost · `Save chart` primary.

**Per-chart-type interface notes**
| Chart | Required wells | Type-specific controls |
|---|---|---|
| Bar | X categorical, Y numeric | Orientation (vertical/horizontal), grouped vs stacked vs 100%-stacked, bar gap, value labels |
| Line | X ordinal/date, Y numeric | Smoothing, markers on/off, multi-series, missing-value handling (gap / connect / zero) |
| Pie | Category, Value | Donut toggle + inner radius, "group small slices under X%", label mode (%, value, both) |
| Scatter | X numeric, Y numeric | Point size column, color-by column, opacity, trendline (linear/loess) with R² badge |
| Histogram | One numeric | Bin count slider + "auto", density vs count, KDE overlay |
| Box Plot | Numeric value, optional group-by | Show outliers, notched, orientation, overlay jittered points |
| Heatmap | X cat, Y cat, Value numeric | Sequential scale picker, cell labels, null cell style, scale min/max clamp |
| Area | X ordinal/date, Y numeric | Stacked / overlapping / streamgraph, fill opacity, baseline at zero |
| Correlation Matrix | Auto: all numeric columns (checklist to include/exclude) | Method (Pearson/Spearman), diverging scale, show coefficients, cluster-order rows |

All nine share the same three-panel frame — only the right panel's section 3 onward swaps. Panel changes debounce 300ms then re-request the Matplotlib render; the previous chart stays visible and dims to 60% while pending.

---

### 3.5 Dashboard Builder

**Header bar**: dashboard name (inline edit) · last-saved timestamp · `Add Chart` primary · grid-snap toggle · `Present` (full-screen) · `Save` · overflow (Duplicate, Export, Delete).

**Canvas**: 12-column grid, 8px row height units, faint dot grid visible only while dragging. Canvas background `bg/canvas` so widget cards read as elevated.

**Widgets**: each is a card with a 40px header (title, chart-type glyph, drag handle appearing on hover, overflow menu: Edit in builder, Duplicate, Change type, Remove). Body renders the chart, auto-refitting on resize. Corner + edge **resize handles** appear on hover as small accent squares; live resize shows a translucent accent placeholder snapped to grid cells while other widgets reflow with a 200ms shift.

**Add Chart** opens a right drawer: saved charts as thumbnail cards with checkbox multi-select, plus "Create new chart" which routes to the builder and returns to the canvas on save.

Extra widget types available in the drawer: KPI stat tile, text/markdown note, divider, filter widget (dashboard-wide filter that scopes all charts).

**Empty state**: centered dashed grid outline, "Your canvas is empty", `Add Chart` + "Start from a template" (Sales overview, Data quality report, Distribution study).

**Presentation mode**: chrome hides, canvas scales to viewport, dark backdrop, bottom-center floating pill on mouse-move (exit ✕, prev/next page, fit toggle). `Esc` exits.

---

### 3.6 Export Screen

Page header "Export & Share" + subline "Choose a format for your charts or the full dashboard".
Scope selector segmented control at top: `Current chart · Dashboard · Entire workspace`.

**Export cards** — 2×2 grid of 220px-tall cards, each: icon tile, title, description, config row, action button. Hover raises + accent border.

| Card | Description | Options | Action |
|---|---|---|---|
| **PNG** | Crisp raster image of the selected chart or dashboard | Resolution (1×/2×/3×), transparent background toggle, theme (light/dark) | Download PNG |
| **PDF** | Print-ready multi-page document | Page size (A4/Letter), orientation, "Include data summary page" | Download PDF |
| **Excel report** | Workbook with source data, profiling sheet, and embedded charts | Sheets to include (checkboxes), "Include raw data" | Download .xlsx |
| **Share link** | Read-only live link to this dashboard | Access (Anyone with link / Workspace only), expiry (24h / 7d / Never), password toggle | Copy link (field + copy button, "Copied ✓") |

Below: **Export history** table — file, format, scope, size, created, re-download icon.
Generating state: card button becomes a progress button with an indeterminate bar; completion shows a toast with "Download" and "Show in history".

---

## 4. Cross-cutting UX

- **Dark mode** is a first-class theme, not an inversion: charts re-render with dark-adapted Matplotlib styling (surface `#161B22`, gridlines `#272E38`, brighter categorical palette). Toggle in navbar; preference persists per user; respects `prefers-color-scheme` on first visit.
- **Empty, loading, error states** for every surface: skeletons that match the final layout, never centered spinners over content; errors are inline cards with cause + one recovery action.
- **Command palette (⌘K)**: jump to column, chart type, screen, or recent file.
- **Keyboard**: `U` upload, `C` new chart, `D` dashboard, `E` export, `Esc` closes panels, arrows nudge widgets 1 grid cell.
- **Accessibility**: WCAG AA contrast on both themes, 2px accent focus rings, all charts paired with a "View as table" toggle and an alt-text summary, colorblind-safe palette default, no color-only encoding (patterns available for stacked charts).
- **Performance-visible cues**: row-count badge when a preview is sampled ("Chart built from a 50k-row sample") so users trust what they see.

---

## 5. Flow Recap

`Landing → Upload (drop → parse → profile) → Data Overview (trust the data) → Chart Builder (one chart at a time) → Dashboard Builder (compose) → Export (PNG / PDF / Excel / Link)`

Each step ends with a single, obvious primary action that opens the next — the app never leaves the user on a dead-end screen.
