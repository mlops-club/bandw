# Backend Unlocks — Research Answers

Research conducted 2026-04-20 via SDK source inspection (v0.26 installed in tests/.venv),
backend Go code reading, GraphQL schema analysis, and Chrome DevTools inspection of wandb.ai.

---

## 1. Artifact System (D2a/D2b — ~11 tests)

### SDK → Backend flow

**Q1. What exact GraphQL mutations does the SDK call during `run.log_artifact()`?**

The full sequence (from `artifact_saver.py:99-262`):

1. **`createArtifact`** — Creates a PENDING artifact record.
   - Input: `CreateArtifactInput` with entity, project, run, type, collection name, digest, aliases, tags, clientID, sequenceClientID
   - Response: `{ artifact { id, state, ... } }` — SDK checks `state == "COMMITTED"` (dedup hit) or `"PENDING"` (new)
   - If COMMITTED already, skips upload and optionally calls `useArtifact`. Returns early.

2. **`createArtifactManifest`** — Creates a manifest record (initially with `includeUpload: false`).
   - Input: `CreateArtifactManifestInput` with artifactID, name (`"wandb_manifest.json"`), digest (empty initially), type (`FULL`/`INCREMENTAL`/`PATCH`)
   - Response: `{ artifactManifest { id, file { uploadUrl, uploadHeaders } } }`
   - SDK stores `artifact_manifest_id` for later use.

3. **`createArtifactFiles`** — Requests upload URLs for each file in the artifact.
   - Input: `CreateArtifactFilesInput` with array of `{ artifactID, artifactManifestID, name, md5 }`, `storageLayout: V2`
   - Response: `{ files { edges { node { name, uploadUrl, directUrl, storagePath } } } }`
   - SDK uses the returned `uploadUrl` for each file.

4. **HTTP PUT to `uploadUrl`** — SDK uploads each file via PUT.
   - Auth: Uses upload headers from step 3 or API key header (`Authorization: Basic base64(api:$WANDB_API_KEY)`)
   - Content-Type: inferred from file or `application/octet-stream`

5. **`createArtifactManifest` (2nd call)** or **`updateArtifactManifest`** — Re-creates manifest with final digest after all files uploaded.
   - SDK writes manifest JSON to temp file, computes MD5, then uploads via the returned `uploadUrl`.
   - For distributed/incremental: uses `updateArtifactManifest` instead.

6. **`commitArtifact`** — Transitions state PENDING → COMMITTED.
   - Input: `CommitArtifactInput { artifactID }`
   - Response: `{ artifact { id, state, ... } }`
   - Backend creates "latest" and "vN" aliases.

**Source:** `tests/playwright/.venv/.../wandb/sdk/artifacts/artifact_saver.py:99-262`

---

**Q2. Why does adding `createRunFiles` as a stub cause 30+ test regressions?**

The `createRunFiles` mutation is used by `upload_urls()` in `internal_api.py:2134-2202`. The SDK calls it for **all run file uploads** — not just source code, but also:
- `wandb-summary.json`
- `config.yaml`
- `wandb-metadata.json`
- `output.log`
- `requirements.txt`
- Media files (images, audio, video logged during training)

The SDK expects this exact response shape:

```graphql
mutation CreateRunFiles($entity: String!, $project: String!, $run: String!, $files: [String!]!) {
    createRunFiles(input: {entityName: $entity, projectName: $project, runName: $run, files: $files}) {
        runID
        uploadHeaders
        files {
            name
            uploadUrl
        }
    }
}
```

**Critical fields:**
- `runID` — must be non-null or SDK raises `CommError` and aborts
- `uploadHeaders` — list of `"Key:Value"` strings for authenticated uploads
- `files` — array of `{ name, uploadUrl }` — SDK maps these by name to determine where to PUT each file

If the stub returns incorrect data (null runID, missing upload URLs, or malformed response), the SDK will:
- Abort the entire run if `runID` is null (`internal_api.py:2196-2200`)
- Fail to upload files (no upload URLs)
- The 30+ regressions are because every SDK run uses `createRunFiles` for basic telemetry files

**Source:** `tests/playwright/.venv/.../wandb/sdk/internal/internal_api.py:2134-2202`

---

**Q3. What makes `artifactCollectionNames` null in the SDK's createArtifact call?**

In the Go resolver (`artifact_mutations.go:54`), `ArtifactCollectionNames` is typed as `*[]string` (optional pointer). The SDK **always** passes `artifactCollectionName` (singular, required) as the primary collection name. The `artifactCollectionNames` (plural) field is:

- **Null/omitted** in the default case — single-collection artifacts (most common)
- **Non-null** only when an artifact is being linked to multiple collections simultaneously (e.g., registry portfolio linking)

In practice the SDK almost never sets this field. Our backend can safely treat it as optional and ignore it.

---

**Q4. How does `run.use_artifact("name:alias")` resolve on the backend?**

The SDK resolves artifact references via `Project.artifact(name: String!)` query. The name format is `"collection_name:version_or_alias"`.

Resolution path in our backend (`store/artifact.go`):
1. Parse name into `collection_name` and `version_or_alias` (default: `"latest"` if no colon)
2. Find `ArtifactCollection` by name within the project
3. If version_or_alias starts with `"v"` + digits: look up by `version_index`
4. Otherwise: look up `ArtifactAlias` where `collection_id = ? AND alias = ?`
5. Return the `Artifact` via the alias's `artifact_id`

The SDK then calls `useArtifact` mutation with the resolved `artifactID` to record lineage.

---

**Q5. What URL pattern does the SDK expect for artifact file downloads?**

The SDK uses **`directUrl`** from the `File` type for downloads. When downloading artifacts, it calls `artifact.files(names: [...])` or `filesByManifestEntries(...)` and reads `directUrl` from each file node.

For our local storage backend, `directUrl` is generated by `r.store.DirectURL(storagePath)` — typically `http://localhost:PORT/files/STORAGE_PATH`.

The `uploadUrl` is used only for uploads (PUT requests).

---

**Q6. Does the SDK upload files via PUT to `uploadUrl`? What auth headers?**

**Yes, HTTP PUT to `uploadUrl`.** The upload flow (`artifact_saver.py:224-236`):

```python
upload_url = resp["uploadUrl"]
upload_headers = resp["uploadHeaders"]
extra_headers = {}
for upload_header in upload_headers:
    key, val = upload_header.split(":", 1)
    extra_headers[key] = val
self._api.upload_file_retry(upload_url, fp, extra_headers=extra_headers)
```

Auth headers come from `uploadHeaders` in the GraphQL response — these are `"Key:Value"` strings like `"Authorization:Basic ..."`. For local storage (no pre-signed URLs), the backend should return appropriate auth headers or the upload endpoint should accept the API key.

---

**Q7. How are artifact manifest entries structured?**

The manifest JSON contains entries with these fields (from `ArtifactManifestEntry` model at `store/models.go:258-274`):

| Field | Type | Description |
|-------|------|-------------|
| `path` | string | File path within artifact (e.g., `"data/train.csv"`) |
| `digest` | string | Content hash (MD5 base64) |
| `ref` | string | Reference URI for external refs (e.g., `"wandb-artifact://..."`) |
| `size` | int64 | File size in bytes |
| `birthArtifactID` | string | Source artifact for dedup (incremental manifests) |
| `extra` | JSON | Additional metadata |

GraphQL input (`schema.go:663-668`):
```graphql
input ArtifactManifestEntryInput {
    name: String!       # = path
    digest: String!
    birthArtifactID: String
    storageRegion: String
}
```

### Frontend

**Q8. What does the wandb.ai artifact browser look like?**

From Chrome inspection of `wandb.ai/subquadratic/bandw-probe/artifacts`:

**Layout:** Three-column design:
- **Left sidebar:** Artifact types as collapsible groups (e.g., "dataset", "model", "wandb-events"), with collection names as links under each type. Each collection has a "More actions" button.
- **Center:** Version selector as a listbox with "All Versions" option, alias entries (e.g., "latest"), and individual versions.
- **Right panel:** Tabbed view with tabs: **Version** | **Metadata** | **Usage** | **Files** | **Lineage**

**Version overview panel shows:**
- Full Name (e.g., `subquadratic/bandw-probe/cifar10-sample:v0`)
- Aliases (with "+" button to add)
- Tags (with "+" button to add)
- Digest, Created By (link to run), Created At, Num Consumers, Num Files, Size, TTL Remaining, Description

**ARIA structure:** Links for navigation, listbox for version selection, alert for current version.

---

**Q9. How are artifact versions displayed?**

As a **vertical list** in a listbox widget. Each entry shows either:
- An alias name (e.g., "latest") with a link to that version
- A version number option

There's an "All Versions" option at the top. The currently selected version is shown as an `alert` role.

---

**Q10. What does the lineage DAG look like?**

From Chrome inspection of the `/lineage` tab:

- **Built with React Flow** (has React Flow attribution link)
- **Interactive DAG** with zoom controls (Zoom In, Zoom Out, Fit View, Toggle Interactivity)
- **Filter modes:** "Basic" and "Custom" radio buttons with a "Custom view configuration" button
- **Keyboard accessible:** "Press enter or space to select a node. Arrow keys to move. Press delete to remove or escape to cancel."
- Nodes represent artifacts and runs, edges represent run→artifact relationships (input/output)

---

## 2. Run Files / Code Panels (D1b — ~14 tests)

### Backend

**Q11. What mutation does the SDK use to upload run source files?**

**`createRunFiles`** — defined at `internal_api.py:2170-2182`:

```graphql
mutation CreateRunFiles($entity: String!, $project: String!, $run: String!, $files: [String!]!) {
    createRunFiles(input: {entityName: $entity, projectName: $project, runName: $run, files: $files}) {
        runID
        uploadHeaders
        files {
            name
            uploadUrl
        }
    }
}
```

This is the **sole mutation** for run file uploads. The SDK passes a list of filenames, gets back upload URLs, then PUTs files to those URLs. There's also a `legacy_upload_urls()` fallback (`internal_api.py:2204-2260`) that uses a query instead of a mutation — for servers older than 0.15.4.

---

**Q12. Where does the SDK expect `run.log_code()` files to be stored?**

**As an artifact of type `"code"`.** From `wandb_run.py:1090-1169`:

```python
def log_code(self, root=".", name=None, include_fn=..., exclude_fn=...):
    art = InternalArtifact(name, "code")  # type = "code"
    for file_path in filenames.filtered_dir(root, include_fn, exclude_fn):
        art.add_file(file_path, name=save_name)
    return self.log_artifact(art)
```

Key details:
- Default name: `source-{project}-{entrypoint_relpath}`
- Artifact type: `"code"`
- Files are added with relative paths from root
- Stored via the standard artifact upload pipeline (createArtifact → createArtifactFiles → PUT → commitArtifact)
- **Not** stored via `createRunFiles` — code is an artifact, not a run file

---

**Q13. Does our backend have a `RunFile` model?**

**No.** Our `store/models.go` has no `RunFile` model. We only have `ArtifactFileStored`. To implement `createRunFiles`, we need a `RunFile` model with fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | varchar(36) | Primary key |
| `runID` | varchar(36) | FK to Run |
| `name` | varchar(2048) | File path (e.g., `"config.yaml"`) |
| `storagePath` | varchar(2048) | Local storage path |
| `uploadURL` | varchar(4096) | Pre-signed or local upload URL |
| `directURL` | varchar(4096) | Download URL |
| `md5` | varchar(32) | Content hash |
| `size` | int64 | File size in bytes |
| `mimetype` | varchar(255) | MIME type |
| `createdAt` | datetime | Upload timestamp |

---

**Q14. What GraphQL query does the frontend use to list files for a run?**

From the schema (`graphql-schema.graphql:291`):

```graphql
type Run {
    files(names: [String], pattern: String, after: String, first: Int): FileConnection
}
```

The Files tab uses `run { files(first: N) { edges { node { name, url, directUrl, sizeBytes, updatedAt } } } }` with Relay pagination. The `pattern` parameter supports glob-style filtering.

Our backend's `RunResolver` does **not** implement this field yet.

### Frontend

**Q15. What does the wandb.ai run detail "Files" tab look like?**

From Chrome inspection of the Files tab:

**Directory tree layout** with a file browser grid:
- **Breadcrumbs** at top: `root` → `subfolder` → etc.
- **Search bar** with "Search" placeholder and clear button
- **Grid** (`role="grid"`) with columns: **Name** | **Last modified** | **Size**
- Folders shown with trailing `/` and sub-item counts (e.g., "artifact / — 25 subfolders, 25 files — 8.5KB")
- Files shown with modification time (e.g., "4d ago") and size
- Top-level structure: `artifact/`, `code/`, `media/`, `smoke/`, `config.yaml`, `output.log`, `requirements.txt`, `wandb-metadata.json`, `wandb-summary.json`

---

**Q16. What does the "Code" tab look like?**

From Chrome inspection:

**Single file viewer** (not side-by-side diff):
- **Breadcrumbs** path showing the file location (5 levels deep for `code/tests/smoke/probe_pytorch.py`)
- **Toolbar:** "Copy file contents" button + "Download" link (direct link to `api.wandb.ai/files/...`)
- **Code viewer:** Syntax-highlighted file contents in a scrollable container
- Shows the main entry point script automatically

---

## 3. Tables (D4a/D4b — ~10 tests)

### Backend

**Q17. How does the wandb SDK log a `wandb.Table`?**

Tables are stored as **artifact files (JSON)**. From `table.py:198-297` and `table.py:708-797`:

When logged via `wandb.log({"my_table": table})`:
1. Table is bound to the run's "media" artifact
2. Serialized to JSON and saved as an artifact file (e.g., `media/table/my_table_0_abc123.table.json`)
3. History row gets a reference: `{"my_table": {"_type": "table-file", "ncols": N, "nrows": M, "path": "media/table/..."}}`

When added to an artifact via `art.add(table, "results")`:
1. Serialized to JSON within the artifact
2. Stored as an artifact file alongside the manifest

---

**Q18. What's the JSON schema of a logged wandb.Table?**

From `table.py` analysis, the JSON structure is:

```json
{
    "_type": "table",
    "columns": ["col1", "col2", "col3"],
    "data": [
        ["val1", 1, true],
        ["val2", 2, false]
    ],
    "column_types": {
        "params": {
            "type_map": {
                "col1": {"wb_type": "string"},
                "col2": {"wb_type": "number"},
                "col3": {"wb_type": "boolean"}
            }
        }
    }
}
```

For artifact-bound tables, media columns (Image, Audio, etc.) are serialized as references to artifact files. The `column_types` field enables type-aware rendering in the frontend.

Limits: `MAX_ROWS = 10000` (inline), `MAX_ARTIFACT_ROWS = 200000` (artifact-bound).

---

**Q19. How does `run.summaryMetrics` reference a table?**

Tables in summary appear as **file reference objects**:

```json
{
    "my_table": {
        "_type": "table-file",
        "ncols": 3,
        "nrows": 100,
        "path": "media/table/my_table_0_abc123.table.json",
        "artifact_path": "wandb-client-artifact://abc123/media/table/my_table.table.json",
        "sha256": "...",
        "size": 12345
    }
}
```

The frontend resolves `artifact_path` to fetch the actual JSON file from artifact storage. The `_type: "table-file"` signals to the frontend to render a table viewer instead of a scalar value.

---

**Q20. Does table rendering need any backend query beyond fetching the JSON file?**

**No.** Table rendering is self-contained:
1. Frontend reads the `_type: "table-file"` reference from `summaryMetrics` or `sampledHistory`
2. Fetches the JSON file from artifact storage via `directUrl`
3. Renders the table client-side from the JSON data

No special backend query needed — just the ability to serve the JSON file.

### Frontend

**Q21. What does the wandb.ai table viewer look like?**

From the Runs tab (which itself is a table viewer at `/table`):

- **Sortable columns** — click column headers to sort
- **Filterable** — filter controls in the toolbar
- **Paginated** — relay-style cursor pagination
- **Column customization** — add/remove/reorder columns
- **Cell renderers** — media types (images, plots) rendered inline
- **Data types** — numbers, strings, booleans, media references all supported

---

**Q22. How does the step slider work for tables logged at multiple steps?**

Tables logged at multiple steps via `wandb.log({"table": table}, step=N)` appear in `sampledHistory`. The frontend:
1. Queries `sampledHistory(specs: [{"keys": ["table"]}])` to get table refs at sampled steps
2. Shows a **step slider** allowing the user to scrub through steps
3. Each step's table reference points to a different artifact file
4. Frontend fetches and renders the corresponding JSON file when the slider position changes

---

## 4. Reports (D3a/D3b — ~18 tests)

### Backend

**Q23. What GraphQL type does wandb use for reports?**

Reports use the **`View`** type — there is no separate `Report` type. From `graphql-schema.graphql:223-232`:

```graphql
type View {
    id: ID!
    name: String
    displayName: String
    description: String
    user: User
    spec: JSONString      # <-- The report content lives here
    updatedAt: DateTime
    createdAt: DateTime
}
```

**Query:** `Project.allViews(viewType: String, viewName: String, first: Int, after: String): ViewConnection`

The SDK queries reports via (`reports.py:42-75`):
```graphql
query ProjectViews($project: String!, $entity: String!, ...) {
    project(name: $project, entityName: $entity) {
        allViews(viewType: $viewType, viewName: $viewName, first: $reportLimit, after: $reportCursor) {
            edges { node { id, name, displayName, description, user { username, photoUrl, email }, spec, updatedAt, createdAt } cursor }
            pageInfo { endCursor, hasNextPage }
        }
    }
}
```

**`viewType` parameter:** `"runs"` for standard workspace reports.

**Mutations needed (not yet in our schema):**
- `upsertView(input: UpsertViewInput!): UpsertViewPayload` — create or update a report
- `deleteView(input: DeleteViewInput!): DeleteViewPayload` — delete a report

---

**Q24. What's the report spec format?**

The spec is a **custom JSON structure** stored as `JSONString`. It is NOT Prosemirror or markdown. The spec contains:

```json
{
    "version": 5,
    "panelGroups": [
        {
            "name": "Section Title",
            "openRunSet": 0,
            "runSets": [
                {
                    "filters": { "$or": [{ "$and": [...] }] },
                    "sort": { "key": "createdAt", "ascending": false },
                    "selections": { "tree": ["run-id-1", "run-id-2"] },
                    "groupBy": [],
                    "columns": [...]
                }
            ],
            "panels": [
                {
                    "viewType": "Run History Line Plot",
                    "config": { "xAxis": "_step", "yAxis": "loss" }
                }
            ]
        }
    ],
    "blocks": [
        { "type": "heading", "children": [{ "text": "Title" }] },
        { "type": "paragraph", "children": [{ "text": "Description" }] },
        { "type": "panel-grid", "metadata": { "panelGroupId": "..." } }
    ]
}
```

The `blocks` array uses a Slate.js-compatible document structure (not Prosemirror). Panel grids are blocks that reference `panelGroups` by ID.

**Source:** `reports.py:197-228` — `self.spec["panelGroups"]` and `section["runSets"]` structure.

---

**Q25. How are run sets and panel grids embedded in reports?**

From the report spec structure:
- **Run sets** are arrays within each `panelGroup` — each run set defines filters, sort order, selections, and column config
- **Panel grids** are `blocks` of type `"panel-grid"` that reference a `panelGroup` via metadata
- Each panel grid block has panels that render charts (line plots, scatter plots, etc.) using data from the run set's filter results
- A report can have multiple panel grid blocks, each with its own run set configuration

---

**Q26. What does "freeze run set" do on the backend?**

Freezing a run set **snapshots run IDs into the report spec**. Specifically:
- The `runSets[].selections.tree` array gets populated with explicit run name/ID strings
- The `runSets[].filters` may get additional constraints pinning specific runs
- This means the report always shows those exact runs, regardless of new runs being created

This is entirely a **spec mutation** — no special backend support needed beyond storing the updated spec via `upsertView`.

### Frontend

**Q27. What does the wandb.ai report editor look like?**

From Chrome inspection of the reports creation flow:

- **Rich text editor** with block-based content (similar to Notion)
- **Title field** — editable textbox or contenteditable element at the top
- **Block-based content** — headings, paragraphs, panel grids as inline blocks
- **Slash command menu** — type `/` to open a command palette
- **Create Report** workflow: button on workspace or reports tab → modal with options (filter run sets checkbox) → opens editor

---

**Q28. How does the slash command menu work?**

From the Playwright test (`reports-core.spec.ts:69-77`):
- Type `/` to open the command menu
- Options appear as `role="option"` or `role="menuitem"` elements
- Available block types include: **Line plot**, **Scatter plot**, and other panel types
- Clicking an option inserts that block into the report

---

**Q29. How does the "Share" modal work?**

Reports are accessed via URL pattern: `/{entity}/{project}/reports/{slug}--{id}`.
The URL generation (`reports.py:260-285`) creates a slug from the display name:
- Special characters replaced with `-`, multiple dashes collapsed
- URL-encoded, then joined with the report ID (with `=` stripped)

Sharing likely changes report visibility settings and/or generates a shareable link. The exact modal is not visible from SDK code — this is a frontend-only feature.

---

## 5. Media Panels (D1a — ~16 tests)

### Backend

**Q30. How does `wandb.Image(array)` get stored?**

Images are stored as **run files within a media directory**, then referenced in history. From `image.py:403-494`:

1. **Save to temp:** `tmp_path = os.path.join(MEDIA_TMP, runid.generate_id() + "." + format)` — image saved as PNG/JPEG
2. **Register as file:** `self._set_file(tmp_path, is_tmp=True)`
3. **Bind to run:** In `bind_to_run()`, files are saved to `media/images/` directory
4. **Upload:** Files uploaded via `createRunFiles` → PUT to uploadUrl
5. **History reference:** `{"_type": "image-file", "path": "media/images/img_0_abc123.png", "width": W, "height": H, "format": "png"}`

For artifact-bound images, they're stored as artifact files instead of run files.

---

**Q31. What does `sampledHistory` return for image keys?**

For image keys, `sampledHistory` returns **file reference objects**, not inline data:

```json
[{
    "_step": 0,
    "images": {
        "_type": "images/separated",
        "width": 28,
        "height": 28,
        "format": "png",
        "count": 10,
        "filenames": ["media/images/img_0_abc.png", "media/images/img_1_def.png", ...]
    }
}]
```

For single images: `{"_type": "image-file", "path": "media/images/...", "width": W, "height": H}`

The frontend fetches actual image data from the file URLs.

---

**Q32. How do segmentation masks and bounding boxes get stored alongside images?**

From `image.py:313-327, 581-589`:

- **Segmentation masks:** Stored as separate image files. `self._masks[key] = ImageMask(mask_item, key)` — each mask is a separate PNG with class IDs as pixel values.
- **Bounding boxes:** Stored as JSON metadata. `self._boxes[key] = BoundingBoxes2D(box_item, key)` — box coordinates in the image's JSON metadata.

In the serialized JSON:
```json
{
    "_type": "image-file",
    "path": "media/images/img_0.png",
    "masks": {
        "predictions": { "_type": "mask-file", "path": "media/images/mask_0.png", "class_labels": {...} }
    },
    "boxes": {
        "predictions": { "_type": "boxes2d", "box_data": [{"position": {...}, "class_id": 1}] }
    }
}
```

---

**Q33. Audio/video/3D — all artifact files with different MIME types?**

**Yes.** All media types use the same `Media` base class pattern:

| Type | `_log_type` | Directory | Formats |
|------|------------|-----------|---------|
| Image | `"image-file"` | `media/images/` | png, jpg, gif, bmp, tiff |
| Audio | `"audio-file"` | `media/audio/` | wav |
| Video | `"video-file"` | `media/videos/` | gif, mp4, webm, ogg |
| 3D | `"object3D-file"` | `media/object3D/` | obj, gltf, glb, etc. |
| HTML | `"html-file"` | `media/html/` | html |

All stored as run files or artifact files. The `_type` field in the history JSON tells the frontend which viewer to use.

### Frontend

**Q34. What does the media panel look like?**

- **Grid of thumbnails** showing images logged at each step
- **Step slider** to navigate through training steps
- Clicking an image opens a larger view with mask/bbox overlays
- Multiple images per step shown in a horizontal grid

---

**Q35. How does "compare mode" work for multiple runs' images?**

- Side-by-side display of images from different runs at the same step
- Each column represents a run, each row represents a step or key
- Step slider syncs across all runs

---

## 6. Custom Charts (D4c — ~8 tests)

### Backend

**Q36. How does `wandb.plot.line()` / `wandb.plot.bar()` get stored?**

From `plot/line.py:69-75` and `plot/custom_chart.py:66-139`:

Custom charts use `plot_table()` which returns a `CustomChart` object:
1. A `wandb.Table` is created with the chart data
2. The table is logged under a unique key (e.g., `"custom_chart_table_key"`)
3. A Vega-Lite spec reference is stored in the run's config: `_wandb.visualize.{key} = {vega_spec_name, table_key, fieldSettings}`

```python
# wandb.plot.line() calls:
plot_table(
    vega_spec_name="wandb/line/v0",
    data_table=table,
    fields={"x": x_column, "y": y_column, "stroke": stroke_column}
)
```

The `CustomChart` is stored as:
- **Table data:** As a `wandb.Table` artifact file (see Q17)
- **Chart spec reference:** In `run.config["_wandb"]["visualize"][key]` containing `{vega_spec_name, table_key, fieldSettings}`

---

**Q37. What's the relationship between `wandb.Table` and custom charts?**

Every custom chart is backed by a `wandb.Table`. The `CustomChart` object (`custom_chart.py:66-75`) holds:
- `table: wandb.Table` — the data source
- `spec: CustomChartSpec` — Vega spec name + field mappings

The `fieldSettings` map Vega-Lite channel names (x, y, color, etc.) to table column names. The frontend uses this mapping to bind the Vega spec to the table data.

---

**Q38. Does the backend need a `CustomChart` model?**

**No.** Custom charts are **workspace view state** — there's no dedicated model needed. The backend stores:
1. The table as an artifact file (already supported)
2. The spec reference in the run's config JSON (already supported via `summaryMetrics`/`config`)

The GraphQL schema does have `createCustomChart` mutation and a minimal `Chart { id }` type (`graphql-schema.graphql:911-918, 1041-1047`), but this appears to be for saved/shared chart presets — not for per-run chart instances.

### Frontend

**Q39. What Vega-Lite spec format does wandb.ai use?**

Wandb uses **named Vega-Lite presets** referenced by `vega_spec_name`:
- `"wandb/line/v0"` — line chart
- `"wandb/bar/v0"` — bar chart
- `"wandb/scatter/v0"` — scatter plot
- `"wandb/area-under-curve/v0"` — ROC/PR curves
- `"wandb/confusion_matrix/v0"` — confusion matrix

These are standard Vega-Lite specs stored on the wandb.ai server. The `fieldSettings` from the run config maps Vega channels to table columns. Custom user-defined Vega specs are stored via `createCustomChart`.

---

**Q40. How are custom chart presets rendered differently from regular plots?**

- **Regular plots** (Line Plot, Scatter Plot) render from `sampledHistory` data using built-in chart components
- **Custom charts** render from `wandb.Table` data using Vega-Lite specs. They:
  - Fetch the table JSON from artifact storage
  - Apply the field mappings from `_wandb.visualize`
  - Render via a Vega-Lite renderer with the named spec

The visual distinction: custom charts typically show a "Custom Chart" label and may have different interaction patterns (Vega-Lite tooltips vs. built-in chart interactions).

---

## 7. Overview Panel Management (C1b remaining — ~8 tests)

### Frontend-only questions

**Q41. How does wandb.ai implement drag-and-drop panel reorder?**

The workspace UI shows panels in sections with reorder capability. Based on React Flow usage for lineage and the overall React ecosystem, wandb.ai likely uses **@dnd-kit/sortable** or a similar React DnD library. The workspace has:
- "Undo last action" / "Redo last action" buttons
- "Workspace actions" overflow menu
- Panel sections that can be collapsed and rearranged

---

**Q42. How does the pagination control work for panels within a section?**

Panels within a section are rendered in a grid layout. When there are too many panels for the viewport:
- Section headers may show panel counts
- Scroll within the section or use "show more" controls
- The workspace saves panel layout state via the View spec

---

**Q43. How does full-screen panel prev/next navigation work?**

From the workspace UI structure:
- **Overlay-based** — clicking a panel opens it in a full-screen overlay (not URL-based)
- Previous/next navigation cycles through panels in the same section
- Keyboard shortcuts likely supported (arrow keys)
- The URL may update with a panel reference but the primary mechanism is an overlay

---

**Q44. How does the "back" button from full-screen panel view work?**

- **Close button** or Escape key to dismiss the overlay
- Returns to the workspace view with the same scroll position
- URL may revert to the base workspace URL (no panel reference)

---

## 8. Cross-cutting Infrastructure

### File serving

**Q45. Do we need a unified file serving endpoint for both artifact files AND run files?**

**Yes — a unified `/files/` endpoint is recommended.** Both artifact files and run files use the same `File` GraphQL type with `url()`, `directUrl`, and `uploadUrl` fields. The storage pattern is the same:
- Artifact files: `{storageRoot}/artifacts/{artifactID}/{filename}`
- Run files: `{storageRoot}/runs/{runID}/{filename}`

A single endpoint with path-based routing handles both:
- `PUT /files/{storagePath}` — upload
- `GET /files/{storagePath}` — download

Our existing `internal/storage/local.go` already provides this pattern for artifact files.

---

**Q46. How does auth work for file downloads?**

Three options in the wandb ecosystem:
1. **Pre-signed URLs** (S3/GCS) — auth embedded in the URL
2. **Cookie auth** — browser sessions for frontend access
3. **Bearer token / API key** — `Authorization: Basic base64(api:KEY)` header

For our local backend: use API key auth on the file serving endpoint. The `uploadHeaders` returned by `createRunFiles` and `createArtifactFiles` should include the auth header.

---

**Q47. What content types should the file server return?**

**Infer from extension** for known types, fall back to `application/octet-stream`:
- `.json` → `application/json`
- `.yaml` / `.yml` → `application/x-yaml`
- `.png` → `image/png`
- `.jpg` / `.jpeg` → `image/jpeg`
- `.txt` / `.log` → `text/plain`
- `.py` → `text/x-python`
- `.html` → `text/html`
- `.wav` → `audio/wav`
- `.mp4` → `video/mp4`
- Everything else → `application/octet-stream`

### SDK compatibility

**Q48. What GraphQL introspection queries does the SDK run on startup?**

From `internal_api.py:599-619`, the SDK runs **`ServerFeaturesQuery`** on startup:

```graphql
query ServerFeaturesQuery {
    serverInfo {
        features {
            name
            isEnabled
        }
    }
}
```

The SDK caches results and checks for specific features like `USE_ARTIFACT_WITH_ENTITY_AND_PROJECT_INFORMATION`. If the server doesn't support the `features` field, the SDK gracefully falls back to empty feature set.

The SDK also calls `viewer` query to validate auth and get the default entity.

---

**Q49. Does the SDK expect any specific server-side capabilities?**

Beyond what's in the schema, the SDK checks feature flags for conditional behavior:
- `USE_ARTIFACT_WITH_ENTITY_AND_PROJECT_INFORMATION` — whether to pass entity/project in `useArtifact`
- CLI version checks for backward compatibility (e.g., `>= 0.12.10` for image filename support)
- The SDK gracefully degrades when features are missing — it doesn't hard-fail on unknown features

---

**Q50. How does the SDK handle partial failures?**

**The SDK aborts on errors — no silent skip.** From `internal_api.py:2196-2200`:

```python
result = query_result["createRunFiles"]
run_id = result["runID"]
if not run_id:
    raise CommError(
        f"Error uploading files to {entity}/{project}/{run_name}. "
        "Check that this project exists and you have access to this entity and project"
    )
```

Specific behaviors:
- `createRunFiles` returns null `runID` → raises `CommError`, aborts upload
- `createArtifact` returns unexpected state → raises Exception
- File upload fails → retries via `upload_file_retry()`, eventually fails
- GraphQL errors → caught by `@normalize_exceptions` decorator, converted to `CommError`

The SDK has retry logic for transient failures but will ultimately abort the operation on persistent errors.

---

## Implementation Priority Summary

Based on test counts and dependency analysis:

| Priority | Area | Tests | Key Backend Work |
|----------|------|-------|-----------------|
| 1 | **createRunFiles** | ~14 | Implement mutation + RunFile model + file upload/serve endpoint |
| 2 | **Reports/Views** | ~18 | Add View model + upsertView/deleteView mutations + allViews query |
| 3 | **Media serving** | ~16 | File serving endpoint for run files (images, audio, video) |
| 4 | **Artifacts** | ~11 | Already mostly implemented; needs file download serving |
| 5 | **Tables** | ~10 | Table JSON file serving (already works if artifacts work) |
| 6 | **Custom Charts** | ~8 | No backend work — just table + config storage (already works) |
| 7 | **Panel Management** | ~8 | Frontend-only — no backend work |

**Critical path:** `createRunFiles` → file serving endpoint → media uploads → tables/reports
