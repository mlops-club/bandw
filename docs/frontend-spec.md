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
- **Runs count** badge (e.g., "Runs 21")
- **Collapse controls**: hide sidebar, expand full runs table
- **Search bar** with regex toggle
- **Toolbar**: Filter, Group, Sort, Columns picker
- **Run list** (paginated, e.g., 1-20 of 21):
  - Each row: visibility toggle (eye icon), color dot (clickable to change), run name (link to run detail), overflow menu
  - Columns configurable (Name + additional columns like State, runtime, etc.)
  - View mode toggles: list view, card view, sort options

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
- Create alert automation button
- View full screen (link to full-screen view with URL params `panelDisplayName` and `panelSectionName`)
- Edit panel button (opens config modal)
- More panel actions overflow menu
- Legend with run name links at bottom

#### Panel Edit Modal (Line Plot)
Full-screen modal with chart preview on left, config on right.

**Tabs:**
1. **Data**
   - X axis: dropdown (Step, Wall Time, Relative Time), Range (min/max), Label
   - Y axis: tag selector (metric keys), regex toggle, Range (min/max), Label
   - Chart title (text input)
   - Max runs to show (slider, numeric input)
   - Outliers toggle (exclude extreme outliers when scaling)
   - Point aggregation method: Random sampling / Full fidelity (for >1000 points)
   - Smoothing: method dropdown (Time weighted EMA, etc.) + slider (0-1)
   - Chart type: line / smoothed line / area (icon toggles)
2. **Grouping**
3. **Display preferences**
4. **Expressions**

Footer: Delete | Cancel | Apply

---

## 2. Runs View

### 2.1 Runs Table

**Route:** `/entity/project/table?nw=<workspace_id>`

Full-width data table with all runs.

**Toolbar:**
- Search runs (with regex toggle)
- Filter button
- Group button
- Sort button
- Export button (download icon)
- Columns button (show/hide/pin columns)

**Table columns** (configurable):
- Checkbox (multi-select)
- Visibility toggle (eye)
- Color dot
- NAME (with "21 visualized" badge)
- STATE (badge: Crashed, Failed, Running, Finished)
- NOTES ("Add notes..." placeholder)
- USER
- TAGS
- CREATED (relative time, e.g., "3w ago")
- RUNTIME (e.g., "35m 31s")
- Config columns (auto-generated from run config): BF16, CHUNK_SIZE, CP_SIZE, CPU_OFFLOAD, CROSS_ENTROPY, DATASET_ID, etc.

**Pagination:** rows per page selector (1-20), page navigation

### 2.2 Individual Run Detail

**Route:** `/entity/project/runs/<run_id>?nw=<workspace_id>`

Header: back arrow, color dot, run name, overflow menu ("Open run overflow menu")

**Tabs:**

#### 2.2.1 Charts Tab
- Same panel system as Workspace but scoped to single run
- Search panels, Settings, New report, Add panels buttons
- "+ Add section" button

#### 2.2.2 Overview Tab
Metadata key-value table:

| Field | Type |
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

#### 2.2.3 Logs Tab
Terminal-style log viewer:
- Timestamp toggle dropdown
- Search input
- Copy to clipboard button
- Log lines with line numbers, timestamps, colored output
- Auto-scroll to bottom

#### 2.2.4 Files Tab
File browser:
- Breadcrumb navigation (root > subfolder)
- Search input
- Table columns: FILE NAME, LAST MODIFIED, SIZE, DOWNLOAD
- Folders show subfolder/file count (e.g., "2 subfolders, 2 files")
- Files show relative time (e.g., "19d ago"), size (e.g., "2KB"), download icon
- Typical files: `artifact/`, `requirements.txt`, `wandb-metadata.json`

#### 2.2.5 Artifacts Tab (run-level)
- "Output artifacts" heading with total count
- Search input, pagination
- Table columns: Type, Name (with version), Consumer count
- Typical artifacts: `wandb-history` (run-{id}-history:v0), `wandb-events` (run-{id}-events:v0)

---

## 3. Artifacts View

**Route:** `/entity/project/artifacts/<type>/<collection>/<version>`

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
  ```
- Each collection has a "More actions" overflow button

### 3.2 Main Content - Artifact Detail

**Header:**
- Artifact name (e.g., "run-5n1up9b1-events")
- Version dropdown (e.g., "Version 0")

**Tabs:**

#### 3.2.1 Version Tab
Version overview key-value display:

| Left column | Right column |
|---|---|
| Full Name | Created At |
| Aliases (tag chips: "latest", "v0", with + button) | Num Consumers |
| Tags (+ button) | Num Files |
| Digest (hash string) | Size |
| Created By (link to run) | |
| Description | |

#### 3.2.2 Metadata Tab
JSON viewer for artifact metadata.

#### 3.2.3 Usage Tab
Code snippets showing how to use/download the artifact.

#### 3.2.4 Files Tab
File browser similar to run Files tab.

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

## Priority for Implementation

Based on the feature-ranking tiers and user priorities:

### Phase 1: Core Dashboard (Workspace + Runs)
- Global layout (nav, sidebar)
- Workspace view with line chart panels
- Runs table with sorting/filtering
- Individual run detail (Overview, Logs, Files tabs)
- Panel edit modal (Data tab only)

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
- Additional panel types (bar, scatter, parallel coordinates)
- Run comparer, parameter importance panels
- Report comments
- Full panel edit modal (Grouping, Display preferences, Expressions tabs)
