# Backend Unlocks — Research Questions

## Context

344/~507 Playwright tests pass against bandw. The remaining ~163 failures need backend features
that don't exist yet. This document lists research questions to answer before creating the
implementation plan.

**Goal:** Implement backend features to unlock the remaining tests, wired up to the frontend.

---

## 1. Artifact System (D2a/D2b — ~11 tests)

### SDK → Backend flow
1. What exact GraphQL mutations does the wandb SDK v0.26 call during `run.log_artifact()`? Capture the full sequence: createArtifact → createArtifactManifest → createArtifactFiles → PUT files → commitArtifact.
2. Why does adding `createRunFiles` as a stub cause 30+ test regressions? What response shape does the SDK expect from `createRunFiles`? Does it need upload URLs with actual file upload capability?
3. What makes `artifactCollectionNames` null in the SDK's createArtifact call? Is it always null or only in certain cases?
4. How does `run.use_artifact("name:alias")` resolve on the backend? What GraphQL query does the SDK use — is it `artifact(id)`, `artifactCollection`, or a different query path?

### File serving
5. What URL pattern does the SDK expect for artifact file downloads? Does it use the `directUrl` from `createArtifactFiles`, or does it go through a different path?
6. Does the wandb SDK upload files via PUT to the `uploadUrl` returned by `createArtifactFiles`, or does it use multipart upload? What auth headers does it send on the PUT?
7. How are artifact manifest entries structured? What fields does `ArtifactManifestEntry` need (path, digest, size, birthArtifactID)?

### Frontend
8. What does the the reference artifact browser look like? (screenshot needed) What ARIA roles/structure does it use?
9. How are artifact versions displayed — as a list, grid, or timeline?
10. What does the lineage DAG look like? How are run→artifact edges rendered?

---

## 2. Run Files / Code Panels (D1b — ~14 tests)

### Backend
11. What mutation does the SDK use to upload run source files? Is it `createRunFiles` or something else entirely?
12. Where does the SDK expect `run.log_code()` files to be stored? As artifacts, run files, or a separate endpoint?
13. Does our backend have a `RunFile` model? If not, what fields does it need (runID, path, storageURL, size, md5)?
14. What GraphQL query does the frontend use to list files for a run? `run.files(first, after)` connection?

### Frontend
15. What does the the reference run detail "Files" tab look like? Directory tree or flat list?
16. What does the "Code" tab look like — side-by-side diff or single file viewer?

---

## 3. Tables (D4a/D4b — ~10 tests)

### Backend
17. How does the wandb SDK log a `wandb.Table`? Is it stored as an artifact file (JSON), a special metric type, or both?
18. What's the JSON schema of a logged wandb.Table? Column names, column types, data rows?
19. How does `run.summaryMetrics` reference a table? Is it a key like `"results_table"` pointing to an artifact path?
20. Does table rendering need any backend query beyond fetching the JSON file from storage?

### Frontend
21. What does the the reference table viewer look like? Sortable columns, filters, pagination?
22. How does the step slider work for tables logged at multiple steps?

---

## 4. Reports (D3a/D3b — ~18 tests)

### Backend
23. What GraphQL type does wandb use for reports — `View` or `Report`? What mutations create/update/delete them?
24. What's the report spec format? Is it a Prosemirror doc, custom JSON, or markdown?
25. How are run sets and panel grids embedded in reports? Are they references to project views?
26. What does "freeze run set" do on the backend? Does it snapshot run IDs into the report spec?

### Frontend
27. What does the the reference report editor look like? Rich text with blocks, or markdown?
28. How does the slash command menu work — what block types are available?
29. How does the "Share" modal work — does it change report visibility or generate a link?

---

## 5. Media Panels (D1a — ~16 tests)

### Backend
30. How does `wandb.Image(array)` get stored? As an artifact file, inline in history, or a separate media endpoint?
31. What does the `sampledHistory` response look like for image keys? Does it return file references or inline data?
32. How do segmentation masks and bounding boxes get stored alongside images?
33. What about audio/video/3D — are they all stored as artifact files with different MIME types?

### Frontend
34. What does the the reference media panel look like — grid of thumbnails with step slider?
35. How does the "compare mode" work for multiple runs' images?

---

## 6. Custom Charts (D4c — ~8 tests)

### Backend
36. How does `wandb.plot.line()` / `wandb.plot.bar()` etc. get stored? As special metric types, artifacts, or custom chart specs?
37. What's the relationship between `wandb.Table` and custom charts — does every custom chart need table data?
38. Does the backend need a `CustomChart` model or are custom charts just workspace view state?

### Frontend
39. What Vega-Lite spec format does the reference UI use for custom charts?
40. How are custom chart presets rendered differently from regular line/bar plots?

---

## 7. Overview Panel Management (C1b remaining — ~8 tests)

### Frontend-only questions
41. How does the reference UI implement drag-and-drop panel reorder? What library (dnd-kit, @dnd-kit/sortable)?
42. How does the pagination control work for panels within a section?
43. How does full-screen panel prev/next navigation work — URL-based or overlay-based?
44. How does the "back" button from full-screen panel view work?

---

## 8. Cross-cutting Infrastructure

### File serving
45. Do we need a unified file serving endpoint that handles both artifact files AND run files? Or separate paths?
46. How does auth work for file downloads — pre-signed URLs, cookie auth, or bearer tokens?
47. What content types should the file server return — always `application/octet-stream` or infer from extension?

### SDK compatibility
48. What GraphQL introspection queries does the SDK run on startup? Does it check for specific mutations/types?
49. Does the SDK version (0.26) expect any specific server-side capabilities beyond what's in our schema?
50. How does the SDK handle partial failures — if `createRunFiles` returns an error, does it skip silently or abort the run?

---

## Research Methods

For each question, answer using one or more of:
- **Code inspection**: Read wandb SDK source, our backend Go code, or our schema
- **Network capture**: Run a test against the reference with HAR recording enabled
- **Chrome DevTools**: Use the Chrome MCP to inspect the reference UI
- **Documentation**: Check docs.the reference for API specs
- **Experiment**: Run the SDK against our backend with debug logging
