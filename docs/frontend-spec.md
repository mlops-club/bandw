# Frontend Spec: W&B-Compatible Web UI

A Svelte 5 SPA (TypeScript) that consumes the same GraphQL/REST backend described in `system-spec.md`
and reproduces the core W&B dashboard experience.

---

## Global Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Top Nav Bar                                                     │
│  [Logo] [entity] > [Projects] > [project] > [page]              │
│                           [Search] [Alerts] [Help] [Avatar]      │
├────────┬────────────────────────────────────────────────────────┤
│ Left   │                                                         │
│ Side   │             Main Content Area                           │
│ bar    │                                                         │
│        │                                                         │
│ Project│                                                         │
│ Worksp.│                                                         │
│ Runs   │                                                         │
│ Reports│                                                         │
│ Artif. │                                                         │
└────────┴────────────────────────────────────────────────────────┘
```

### Top Navigation Bar
- Breadcrumb: `entity > Projects > project-name > page`
- Project name with privacy icon (PRIVATE/PUBLIC)
- Global search button
- Notification bell
- Help/resource button
- User avatar with org name

### Left Sidebar
Fixed vertical icon nav. Each icon links to a project-level page:

| Icon | Label | Route |
|---|---|---|
| (i) | Project | `/entity/project/overview` |
| grid | Workspace | `/entity/project/workspace` |
| table | Runs | `/entity/project/table` |
| doc | Reports | `/entity/project/reportlist` |
| layers | Artifacts | `/entity/project/artifacts` |

---

## 1. Workspace View

**Route:** `/entity/project/workspace?nw=<workspace_id>`

The primary experiment visualization page. Three-region layout:

### 1.1 Header
- Workspace name (editable)
- Workspace selector: Personal workspace badge, toggle for named workspaces
- Undo/Redo buttons
- "Workspace actions" overflow menu
- "Saved just now" / autosave indicator
- Refresh button

### 1.2 Runs Sidebar (left, collapsible)
- **Runs count** badge (e.g., "Runs 21" — shows total vs visualized count)
- **Collapse controls**: hide sidebar (Cmd+. / Ctrl+.), or expand to full runs table
- **Search bar** with regex toggle — filters runs by name and updates visible plots
- **Toolbar**: Filter, Group, Sort, Columns picker
  - **Filter**: narrow the visible run set by expressions
  - **Group**: select a config column to dynamically group runs (e.g., by architecture); grouped charts show mean with variance shading
  - **Sort**: sort runs by any metric (e.g., loss ascending) — affects graph display order
  - **Columns**: pin, hide, or reorder columns; changes sync with the full runs table
- **Run list** (paginated, e.g., 1-20 of 21):
  - Each row: visibility checkbox (eye icon — toggles run on/off in ALL charts), color dot (clickable to change line color), run name (link to run detail), overflow menu
  - Columns configurable (Name + additional columns like State, runtime, etc.)
  - Searching filters runs and immediately updates which runs appear in plots

### 1.3 Charts Panel (main content area)
- **Search bar**: "Search panels with regex"
- **Toolbar**: More actions, Workspace settings, New Report, Add panels
- **Sections** (collapsible, draggable):
  - Section header: drag handle, collapse toggle, section name, panel count badge
  - Pagination within section (e.g., "1-6 of 8"), prev/next
  - Pin section, Section settings, Section actions buttons
  - **Panel grid** within section (responsive 3-column layout)

#### Panel Types Available (via "Add panels" modal)

**Charts:**
| Panel | Description |
|---|---|
| Line plot | Display data trends and changes over time |
| Bar chart | Compare categories using vertical or horizontal bars |
| Scatter plot | Display relationships and correlations between data |
| Parallel coordinates | Compare multiple parameters across several dimensions |

**Evaluation:**
| Panel | Description |
|---|---|
| Run comparer | Compare metrics across runs and highlight differences |
| Parameter importance | Compare hyper-parameters linked to desired outcomes |

**Other categories** (collapsed by default):
- Query Panels
- Media
- Text and Code

#### Individual Panel Controls
Each panel has:
- Drag handle (reorder)
- View full screen (link to full-screen view with URL params `panelDisplayName` and `panelSectionName`)
- Edit panel button (opens config modal)
- More panel actions overflow menu
- Legend with color-coded run name links at bottom

#### Panel Types — Detailed

**Line Plot** (most important — the default panel for `wandb.log` metrics):
- Shows metrics logged via `wandb.log()` over time
- Multiple runs overlaid as separate colored lines
- X-axis options: Step (default), Relative Time (elapsed since start), Wall Time (absolute timestamp)
- Y-axis: one or more metric keys
- Smoothing: configurable noise reduction (Time weighted EMA, slider 0–1)
- Point aggregation: Random sampling or Full fidelity (10k buckets in fullscreen, 1k otherwise)
- Outlier exclusion toggle
- Chart type: line / smoothed line / area
- Zoom: click-and-drag rectangle zooms both axes
- Zoom sync: optionally synchronize zoom across plots with matching x-axes
- Grouping: can average values across experiments, showing consolidated mean lines
- Legend: color-coded run names, clickable to navigate to run detail

**Bar Plot:**
- Shows categorical comparisons (scalar values across runs)
- Auto-generated when logging single-length values
- Can group runs by config parameters
- Alternative display: Box or Violin plot via Grouping tab
- Good for comparing final metrics across runs (e.g., best accuracy per experiment)

**Scatter Plot:**
- Shows relationships between two metrics across runs
- Each point = one run
- X-axis and Y-axis: select any metric
- Optional Z-axis (third dimension)
- Shows min, max, and average lines overlaid
- Logarithmic scale support on each axis
- Tooltip shows run metadata (batch size, dropout, axis values)
- Useful for hyperparameter vs. outcome visualization

**Parallel Coordinates:**
- Summarizes relationships between many hyperparameters and metrics at a glance
- Each vertical axis = one hyperparameter (from `wandb.config`) or metric (from `wandb.log`)
- Each line = one run, crossing all axes at that run's values
- Hover shows tooltip for that run
- Filters: matching lines stay visible, non-matching grayed out
- Per-axis options: log scale, flip direction, rename
- Custom color gradient based on a selected metric

**Run Comparer:**
- Side-by-side comparison of config and metrics for up to 10 visible runs
- One column per run
- Search/filter by config key or metadata key
- "Diff only" toggle: hides identical values, shows only differences
- Adjustable column width and row height
- Auto-updates when runs sidebar selection changes

#### Panel Edit Modal (Line Plot — representative)
Full-screen modal with chart preview on left, config on right.

**Tabs:**
1. **Data** — X axis (Step/Wall Time/Relative Time, range, label), Y axis (metric keys, range, label), chart title, max runs, outliers toggle, point aggregation, smoothing, chart type
2. **Grouping** — aggregate runs, show mean with variance shading
3. **Chart** — panel title, axis titles, legend visibility and position
4. **Legend** — customize legend content and appearance
5. **Expressions** — custom calculated axes using JS regex

Footer: Delete | Cancel | Apply

---

## 2. Runs View

### 2.1 Runs Table

**Route:** `/{entity}/{project}/table`

Full-width data table with all runs. This is the expanded version of the workspace's runs sidebar.

**Toolbar:**
- Search runs (with regex toggle)
- Filter button: expression-based row filtering (column + operator + value dropdowns)
- Group button: group rows by a config column's values (e.g., group by `model_type`)
- Sort button: multi-column priority sorting (e.g., sort by loss ASC, then by created DESC)
- Export button (download icon)
- Columns button: show, hide, pin, or reorder columns

**Table columns** (configurable):
- Checkbox (multi-select for bulk operations)
- Visibility toggle (eye icon — same as workspace sidebar, controls chart visibility)
- Color dot (clickable to change run color in charts)
- NAME (run display name, clickable link to run detail)
- STATE (badge: Crashed, Failed, Running, Finished)
- NOTES ("Add notes..." placeholder, inline editable)
- USER
- TAGS (chips)
- CREATED (relative time, e.g., "3w ago")
- RUNTIME (e.g., "35m 31s")
- Config columns (auto-generated from `wandb.config` keys for all runs in the project)
- Summary columns (auto-generated from `wandb.summary` keys)

**Column management:**
- Drag columns left/right to reorder
- Pin columns to keep them visible during horizontal scroll
- Hide columns individually or via the Columns button
- Column changes sync with the workspace sidebar

**Bulk operations** (when rows are selected):
- Tag selected runs
- Move to group
- Move to project
- Delete

**Pagination:** rows per page selector, page navigation

**Grouping behavior:** When grouped by a config column, runs with the same value are collapsed under a group header. The group header shows aggregated metrics. Expand to see individual runs.

### 2.2 Individual Run Detail

**Route:** `/{entity}/{project}/runs/{runId}/overview`

Header: back arrow, color dot, run display name, state badge, overflow menu

**Tabs:** Overview | Charts | Logs | System | Files | Code | Artifacts

#### 2.2.1 Overview Tab (`/runs/{runId}/overview`)

Metadata key-value table organized in sections:

**Run Info:**

| Field | Value |
|---|---|
| Notes | Editable text ("What makes this run special?") |
| Tags | Tag chips with + button |
| Author | Avatar + link to user profile |
| State | Status badge (Crashed, Failed, Running, Finished) |
| Start time | Formatted datetime (e.g., "March 24th, 2026 8:49:46 AM") |
| Runtime | Duration string (e.g., "35m 31s") |
| Tracked hours | Duration with info tooltip |
| Run path | `entity/project/run_id` with copy button |
| Hostname | Machine hostname |
| OS | OS string |
| Python version | e.g., "CPython 3.12.13" |
| Python executable | Path |
| Git repository | `git clone` command in code block |
| Git state | `git checkout` command in code block |
| Command | Full training command in code block |
| System Hardware | Hardware info |

**Config section:**
- Searchable key-value display of `wandb.config`
- Each config key shows its value (wandb wraps values in `{"value": ...}` dicts)
- Flat display with search/filter box

**Summary section:**
- Key-value display of final summary metrics (from `wandb.log` / `wandb.summary`)
- Same searchable format as config

**Artifact Outputs:**
- List of artifacts produced by this run

#### 2.2.2 Charts Tab (`/runs/{runId}/charts`)
- Same panel system as Workspace but scoped to single run
- Auto-generates one line chart per logged metric key
- Search panels, Settings, New report, Add panels buttons
- "+ Add section" button
- Panels organized into sections by metric name prefix

#### 2.2.3 Logs Tab (`/runs/{runId}/logs`)

Terminal-style log viewer showing `stdout`/`stderr` output. Live-streams for active runs.
- **Timestamp toggle**: dropdown in top left ("Timestamp visible" / "Timestamp hidden")
- **Search bar**: filter logs by keyword at the top
- **Copy to clipboard** and **Download** buttons in top right
- **Log lines**: line numbers on the left, optional timestamps, colored output
- **Auto-scroll** to bottom for active runs
- **Limits**: max 100,000 lines stored per run; max 10,000 lines displayed at once (scroll for older entries)
- Log levels indicated by prefix: `wandb:` (info), `WARNING:` (warnings), `ERROR:` (errors)

#### 2.2.4 System Tab (`/runs/{runId}/system`)
- System metrics charts (auto-logged every 15 seconds by the SDK)
- One line chart per system metric key (CPU, memory, disk, network, GPU)
- Organized into sections by metric category
- See Section 8 for full list of auto-logged system metrics

#### 2.2.5 Files Tab (`/runs/{runId}/files`)

File browser for files captured by the wandb SDK during the run.

**Breadcrumb trail**: `root` > `dir1` > `dir2` > ... displayed above the table. Clickable — navigating to any breadcrumb level shows that directory's contents.

**Table columns:**

| Column | Files | Folders |
|--------|-------|---------|
| FILE NAME | File name (clickable — opens file viewer) | Folder name (clickable — navigates into folder) |
| LAST MODIFIED | Relative time (e.g., "2 days ago") | Summary (e.g., "2 folders, 2 files") |
| SIZE | File size (e.g., "2KB") | — |
| DOWNLOAD | Download button | — (no download for folders) |

**Typical files:**
- `requirements.txt` — Python dependencies
- `wandb-metadata.json` — Run metadata
- `wandb-summary.json` — Final summary metrics
- `diff.patch` — Git diff generated by the SDK. Combined with the recorded git hash, this can restore the exact code state when the run started
- `config.yaml` — Run config
- `output.log` — Console output

**File viewer**: Clicking a file opens an inline viewer:
- **Code files** (`.py`, `.yaml`, etc.): syntax-highlighted source
- **Jupyter notebooks** (`.ipynb`): simplified rendered view showing cells with syntax-highlighted code, cell outputs (logs, images, etc.) beneath each cell, and cell execution order numbers on the left
- **JSON files**: formatted JSON viewer
- **Other files**: raw text or download prompt

#### 2.2.6 Code Tab (`/runs/{runId}/code`)

Displays the entrypoint script used to start the run:
- If the entrypoint was a `.py` file: syntax-highlighted Python source
- If the entrypoint was a Jupyter notebook: rendered notebook view (same as Files tab notebook viewer — cells, outputs, execution numbers)
- **Breadcrumb trail** is still present. Clicking breadcrumb items navigates to the Files tab at that directory location
- Essentially a shortcut into the Files tab focused on the entry script

#### 2.2.7 Artifacts Tab — run-level (`/runs/{runId}/artifacts`)

Table of artifacts produced by or consumed by this run.

**Table columns:**

| Column | Description |
|--------|-------------|
| Type | Artifact type (e.g., "wandb-events", "wandb-history", "raw_data", "model") |
| Name | Artifact name with version (e.g., "run-abc123-history:v0") |
| Consumer count | Number of runs that consume this artifact |

Clicking a row navigates to the dedicated artifact detail view at `/{entity}/{project}/artifacts/{type}/{collection}/{version}`

---

## 3. Artifacts View

**Route:** `/{entity}/{project}/artifacts/{type}/{collection}/{version}`

Two-panel layout:

### 3.1 Left Sidebar - Artifact Tree
- Search: "Find matching artifacts"
- Tree structure grouped by artifact type:
  ```
  wandb-events (collapsible)
    run-{id}-events (link, with "More actions" context menu)
      v0  latest  (version badges)
    run-{id}-events
      v0  latest
    ...
  wandb-history (collapsible)
    run-{id}-history
      v0  latest
    ...
  raw_data (collapsible)
    bdd_simple_1k
      v0  latest
  ```
- Each collection has a "More actions" overflow button

### 3.2 Main Content - Artifact Detail

**Header:**
- Artifact name (e.g., "bdd_simple_1k")
- **Version/alias dropdown** to the right of the name:
  - "All versions" (top item)
  - **Aliases** (unclickable label), followed by clickable aliases (e.g., "Latest")
  - **Versions** (unclickable label), followed by clickable versions (e.g., "v0", "v3")

**Tabs:** Version | Metadata | Usage | Files | Lineage

#### 3.2.1 Version Tab (`/artifacts/{type}/{collection}/{version}/overview`)

Key-value overview table:

| Field | Value |
|---|---|
| Link to registry | — |
| Full Name | `entity/project/collection:version` (e.g., `av-team/mlops-course-001/bdd_simple_1k:v0`) |
| Aliases | Version tags (e.g., "v0") |
| Tags | Tag chips with + button |
| Digest | Hash string (e.g., `40f7ff46865c4c48e8cc53432e2baf9e`) |
| Created By | Hyperlink to the run that produced this artifact (run display name as anchor text) |
| Created At | Formatted datetime (e.g., "November 11th, 2022 06:52:16") |
| Num Consumers | Count of runs that consume this artifact |
| Num Files | Count of files in the artifact |
| Size | Human-readable size (e.g., "853.3MB") |
| TTL Remaining | Status (e.g., "Inactive"). Has an info icon tooltip: "TTL allows users to set an expiration period, after which the version will be deleted." |
| Description | Editable text |

#### 3.2.2 Metadata Tab (`/artifacts/{type}/{collection}/{version}/metadata`)
- JSON viewer for artifact metadata
- If no metadata was logged, shows an admonition: "No metadata or history metrics were logged for this artifact."
- **Note:** investigate further what this view shows when metadata IS present

#### 3.2.3 Usage Tab (`/artifacts/{type}/{collection}/{version}/usage`)

**Section 1: "Usage API"** (h2)

Syntax-highlighted, copy-able Python code blocks:

*Track usage of the artifact:*
```python
import wandb
run = wandb.init(entity="...", project="...")
artifact = run.use_artifact("entity/project/collection:version", type="...")
artifact_dir = artifact.download()
```

*Read-only artifact access:*
```python
import wandb
api = wandb.Api()
artifact = api.artifact("entity/project/collection:version")
artifact_dir = artifact.download()
```

**Section 2: "Used By"** (h2)

Table of runs that consume this artifact:

| Column | Description |
|--------|-------------|
| Runs | Run name, clickable link to the run page |
| Job Type | e.g., "data_split" |
| Project | Project name, clickable link to the project runs page |
| User | User who created the run |
| Used Artifacts | Artifact names. On hover, shows a full-screen icon. Clicking opens a modal with the artifact content |
| Logged Artifacts | Artifact names. Same hover/modal behavior as Used Artifacts |
| Ran On | Timestamp |
| Duration | Run duration |

- Each row has a light-gray hover state
- Individual cells get a slightly darker hover highlight
- The **artifact modal** (from Used/Logged Artifacts cells) is nearly full-window size with two dropdowns:
  - **Mode**: Plaintext, Markdown, Diff, JSON
  - **Render Whitespace**: True, False

#### 3.2.4 Files Tab
File browser — same layout as the run Files tab (breadcrumb trail, table with File Name / Last Modified / Size / Download columns, inline file viewer).

#### 3.2.5 Lineage Tab
DAG (directed acyclic graph) visualization:
- **Basic** / **Custom** view toggle
- Breadcrumb showing current artifact path
- Graph nodes:
  - **Run node**: circular refresh icon, "Run" label, run name
  - **Artifact node**: diamond icon, artifact type label, "Base artifact" badge, artifact name with version
- Directed edges (arrows) connecting runs to artifacts they produce/consume
- Zoom controls (+ button at bottom)

---

## 4. Reports View

### 4.1 Reports List

**Route:** `/entity/project/reportlist`

- "Reports" heading
- "Create report" button (top right)
- Empty state: preview image, description text, "Create report" CTA
- When populated: list/grid of report cards with title, description, author, date

### 4.2 Report Editor

**Route:** `/entity/project/reports/<title>--<id>/edit?draftId=<draft_id>`

Block-based rich text editor (Notion-like):

#### 4.2.1 Editor Toolbar
- Formatting icons (4 buttons: appears to be callout, math, duplicate, share options)
- Page width toggles: Narrow | Wide | Full-width (3 icon buttons)
- Autosave indicator ("Autosaved just now")
- "Edits visible only to you..." badge
- "Publish to project" button (primary CTA)
- More actions menu: Set preview image, Make a copy, Download, Delete draft

#### 4.2.2 Report Header
- **Title**: large editable heading ("Untitled Report")
- **Description**: placeholder text input
- **Authors**: list of user links with + button to add co-authors (shows team member picker)

#### 4.2.3 Content Area
Slash command (`/`) block insertion menu:

| Block Type | Icon |
|---|---|
| Panel grid | grid icon - embeds workspace-style chart panels |
| Heading 1 | H1 |
| Heading 2 | H2 |
| Heading 3 | H3 |
| Bulleted list | bullet icon |
| Numbered list | number icon |
| Checklist | check icon |
| Horizontal rule | line icon |
| Block quote | quote icon |
| Table of Contents | table icon |
| Callout | callout icon |
| Code | code icon |
| Markdown | M+ icon |
| Image | image icon |
| Inline equation (LaTeX) | x icon |
| Block equation (LaTeX) | x icon |
| Link to report | link icon |
| Query panel | query icon |

#### 4.2.4 Panel Grid (embedded in report)
When a Panel grid block is added, it embeds the same chart panel system from the Workspace view, including:
- All panel types (line plot, bar chart, scatter, etc.)
- Panel configuration (same edit modal)
- Run selector / filter controls
- The same X axis, smoothing, and outlier controls from the workspace toolbar

#### 4.2.5 Comments
- Comment thread at bottom of report
- Avatar, user link, "Add a comment" input
- "@" mention support for team members
- Post / Cancel buttons

### 4.3 Report Viewer
Published reports render as read-only documents with:
- Same block types rendered non-editable
- Interactive chart panels (hover tooltips, zoom, etc.)
- Comment thread visible

---

---

## 5. Navigation Hierarchy & Entry Points

In W&B, the navigation flow is:

```
Home (/) → Entity/Projects (/{entity}/projects) → Project (/{entity}/{project}/workspace) → Run (/{entity}/{project}/runs/{runId})
```

The top nav breadcrumb reflects this: `entity > Projects > project-name > page`.

### 5.1 Home / Landing Page

**Route:** `/`

The home page for bandw should redirect to the default entity's projects list. Since bandw is single-tenant (one admin user), `/` redirects to `/{entity}/projects` (e.g., `/admin/projects`).

### 5.2 Entity / Projects List Page

**Route:** `/{entity}/projects`

This is the primary discovery page — how users find and navigate to their projects. In W&B, this page shows:

**Header:**
- Entity name as heading
- "New project" button

**Projects Table:**
- Search bar: "Search by project name"
- Pagination: "showing N" count, page back/forward
- Table columns:
  | Column | Description |
  |--------|-------------|
  | Name | Project name, clickable link to `/{entity}/{project}/workspace` |
  | Last Run | Timestamp of most recent run (e.g., "2026-04-13 19:25") |
  | Runs | Total run count for the project |

- Each project row links to its workspace page
- Sorted by last activity (most recent first)

**bandw simplification:** Skip project visibility (always private), skip star/favorite, skip Traces column. The essential columns are Name, Last Run, and Runs count.

### 5.3 Project Overview Page

**Route:** `/{entity}/{project}/overview`

Project-level summary page showing:
- Project name and description (editable)
- Last active timestamp
- Total number of runs
- Total compute time
- List of contributors/authors

**bandw simplification:** Show project name, description, run count, and last activity. Skip access management, visibility settings, and undelete.

---

## 6. Run Detail Page (enriched)

**Route:** `/{entity}/{project}/runs/{runId}/overview`

The run detail page has a header and tabbed content area.

### 6.1 Run Header
- Back arrow (returns to project runs table)
- Color dot (matching the run's assigned color)
- Run display name (or run ID if no display name)
- State badge (colored: green=finished, red=crashed, blue=running, gray=failed)
- Overflow menu (delete, move, etc.)

### 6.2 Tabs

#### 6.2.1 Overview Tab (`/runs/{runId}/overview`)

Key-value metadata table organized in sections:

**Run Info:**
| Field | Value |
|-------|-------|
| State | Status badge |
| Author | User who created the run |
| Start time | Formatted datetime (e.g., "April 13th, 2026 7:12 PM") |
| Runtime | Duration string (e.g., "35m 31s") |
| Run path | `entity/project/runId` with copy button |
| Host | Machine hostname |
| OS | Operating system |
| Python version | e.g., "CPython 3.12.13" |
| Git repository | Repo URL |
| Command | Full training command |

**Config section:**
- Searchable key-value display of `wandb.config`
- Each config key shows its value (wandb wraps values in `{"value": ...}` dicts)
- Flat display with search/filter box

**Summary section:**
- Key-value display of final summary metrics (from `wandb.log` / `wandb.summary`)
- Same searchable format as config

#### 6.2.2 Charts Tab (`/runs/{runId}/charts`)

Same panel system as workspace but scoped to a single run's data:
- Auto-generates one line chart per logged metric key
- X-axis = step, Y-axis = metric value
- Panels organized into sections by metric name prefix
- Search bar to filter panels

#### 6.2.3 Logs Tab (`/runs/{runId}/logs`)

Terminal-style log viewer showing `stdout`/`stderr` output:
- Line numbers on the left
- Timestamp toggle (show/hide via dropdown)
- Search bar to filter by keyword
- Copy-to-clipboard and download buttons
- Max 10,000 lines displayed at once; scroll for older entries
- Auto-scroll to bottom for active runs

#### 6.2.4 System Tab (`/runs/{runId}/system`)

System metrics charts (auto-logged every 15 seconds by the SDK):

**CPU & Memory:**
- `cpu` — Process CPU percent (normalized by available CPUs)
- `proc.memory.rssMB` — Process memory in MB
- `proc.memory.percent` — Process memory as % of total
- `memory_percent` — Total system memory usage %

**Disk:**
- `disk.{path}.usagePercent` — Disk usage %
- `disk.in` / `disk.out` — Disk read/write in MB

**Network:**
- `network.sent` / `network.recv` — Bytes sent/received

**GPU (if present):**
- GPU utilization %, memory allocation, temperature, power usage

Each metric gets its own line chart panel, organized into sections.

**bandw simplification:** Display whatever system metrics arrive via `wandb-events.jsonl` in the file_stream. No need to enumerate every possible metric — just render charts for whatever keys exist in the `run_events` table.

#### 6.2.5 Files Tab (`/runs/{runId}/files`) — future

File browser for artifacts attached to the run. Not in scope for Phase 2.

---

## 7. Workspace View (enriched)

**Route:** `/{entity}/{project}/workspace`

The workspace is the primary experiment **comparison** page. It shows charts with data from **multiple runs overlaid** — this is what distinguishes it from the single-run Charts tab.

### 7.1 Three-Region Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Workspace Header (name, undo/redo, settings)                 │
├──────────────┬───────────────────────────────────────────────┤
│ Runs Sidebar │              Charts Panel                      │
│ (collapsible)│                                                │
│              │  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ ☐ run-1      │  │ loss    │ │accuracy │ │ lr      │        │
│ ☐ run-2      │  │ ───     │ │  ───    │ │  ───    │        │
│ ☐ run-3      │  │ ───     │ │  ───    │ │  ───    │        │
│              │  └─────────┘ └─────────┘ └─────────┘        │
│ Filter|Group │                                                │
│ Sort|Columns │  ┌─────────┐ ┌─────────┐                    │
│              │  │ val_loss│ │step_time│                    │
│ 1-10 of 21   │  │ ───     │ │  ───    │                    │
│              │  └─────────┘ └─────────┘                    │
└──────────────┴───────────────────────────────────────────────┘
```

### 7.2 Runs Sidebar (left, collapsible)

Controls which runs appear in all charts:
- **Run count badge** (e.g., "Runs 21")
- **Hide/Expand buttons**: collapse sidebar, or expand to full runs table
- **Search bar** with regex toggle
- **Toolbar**: Filter, Group, Sort, Columns picker
- **Run list** (paginated):
  - Each row: visibility checkbox (eye), color dot (clickable), run name (link to run detail), overflow menu
  - Toggling visibility on/off adds/removes that run's data from all charts
  - Color dot determines the line color in charts

### 7.3 Charts Panel (main content area)

- **Auto-generated panels**: One line chart per metric key logged by any visible run
- **Section organization**: Panels grouped by metric name prefix (e.g., metrics `train/loss` and `train/acc` go in a "train" section)
- **Panel grid**: Responsive 3-column layout within each section
- **Section controls**: collapse, drag to reorder, pagination within section (e.g., "1-6 of 8")
- **Each chart** shows one metric across all visible runs, with each run as a different colored line
- **X-axis options**: Step (default), Wall Time, Relative Time
- **Smoothing**: Configurable per-chart
- **Legend**: Color-coded run name links at bottom of each chart

### 7.4 Run Comparison

The workspace IS the comparison tool. The key mechanic:
1. All visible runs overlay on the same charts
2. Toggle runs on/off to compare subsets
3. Each run gets a distinct color
4. Hover on a chart shows a tooltip with all run values at that step
5. Click a run name in the legend → navigates to run detail

**bandw simplification for Phase 2:** Start with auto-generated line charts only (one per metric key). Skip panel editing, custom chart types, drag-to-reorder, and smoothing. The core value is seeing multiple runs overlaid on the same charts.

---

## 8. System Metrics Auto-Logged by W&B SDK

The SDK sends these via `wandb-events.jsonl` in the file_stream. They appear in the System tab of a run and in workspace charts under a "System" section.

| Metric Key | Description | Unit |
|------------|-------------|------|
| `cpu` | Process CPU usage (normalized) | % |
| `proc.cpu.threads` | Process thread count | count |
| `proc.memory.rssMB` | Process RSS memory | MB |
| `proc.memory.percent` | Process memory % of total | % |
| `proc.memory.availableMB` | Available system memory | MB |
| `memory_percent` | Total system memory usage | % |
| `disk./.usagePercent` | Root disk usage | % |
| `disk./.usageGB` | Root disk usage | GB |
| `disk.in` | Disk read | MB |
| `disk.out` | Disk write | MB |
| `network.sent` | Network bytes sent | bytes |
| `network.recv` | Network bytes received | bytes |
| `gpu.{i}.gpu` | GPU utilization | % |
| `gpu.{i}.memory` | GPU memory utilization | % |
| `gpu.{i}.memoryAllocated` | GPU memory allocated | % |
| `gpu.{i}.temp` | GPU temperature | °C |
| `gpu.{i}.powerWatts` | GPU power draw | W |
| `gpu.{i}.powerPercent` | GPU power % of cap | % |

Sampling interval: every 15 seconds.

---

## Priority for Implementation (revised)

Based on the feature-ranking tiers, user priorities, and the navigation gap identified:

### Phase 1: Core Dashboard (Workspace + Runs)
- Global layout (nav, sidebar)
- **Projects list page** (entry point — discover and navigate to projects)
- Workspace view with auto-generated line chart panels (multi-run comparison)
- Runs table with sorting/filtering
- Individual run detail (Overview, Charts, Logs tabs)

### Phase 2: Artifacts
- Artifact tree browser
- Artifact detail (Version, Files, Lineage tabs)
- Lineage DAG visualization

### Phase 3: Reports
- Report list page
- Block-based editor with Panel grid embedding
- Slash command menu
- Publish workflow

### Phase 4: Polish
- System metrics tab
- Additional panel types (bar, scatter, parallel coordinates)
- Run comparer, parameter importance panels
- Report comments
- Full panel edit modal (Grouping, Display preferences, Expressions tabs)
