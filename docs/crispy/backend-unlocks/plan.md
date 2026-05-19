# Backend-Unlocks Implementation Plan

## Context

The spec at `docs/crispy/backend-unlocks/spec.md` defines 7 deliverables (D1-D7) that unlock ~67 new Playwright tests by implementing missing backend features: run file uploads, file serving, reports/views, artifact mutations, artifact queries, and workspace views. This plan organizes implementation into 16 vertical slices that each deliver end-to-end functionality spanning backend, database, tests, and (where needed) frontend. All 175 existing Playwright spec files are tracked in a progress matrix.

## Slice Overview

| Slice | Name | Deliverable | Dependencies | Parallel With |
|-------|------|-------------|-------------|---------------|
| **S0** | Video recording infrastructure | Cross-cutting | None | None (do first) |
| **S1** | createRunFiles + Run.files | D1 + D2 | S0 | S3, S4 |
| **S2** | Unified file serving | D3 | S1 | S3-S7 |
| **S3** | View model + report CRUD | D4 | S0 | S1, S4 |
| **S4** | updateArtifact | D5a | S0 | S1, S3 |
| **S5** | addAliases / deleteAliases | D5b | S4 | S6 |
| **S6** | deleteArtifact / deleteSequence | D5c | S0 | S5 |
| **S7** | linkArtifact / unlinkArtifact / updates | D5d | S4-S6 | - |
| **S8** | Saved workspace views | D7 | S3 | S7 |
| **S9** | Verify: config + logging + summary | - | S0 | S10-S15 |
| **S10** | Verify: run view + display | - | S1 | S9, S11-S15 |
| **S11** | Verify: filter + compare + management | - | S0 | S9-S10, S12-S15 |
| **S12** | Verify: project page + plots | - | S3, S8 | S9-S11, S13-S15 |
| **S13** | Verify: line plot + overview + bar/scatter + media panels | - | S2 | S9-S12, S14-S15 |
| **S14** | Verify: specialized panels + cascade + custom charts | - | S2 | S9-S13, S15 |
| **S15** | Verify: tables + workspaces + artifacts + reports E2E | - | S3, S7, S8 | S9-S14 |

## Phase Diagram

```
Phase 1:  S0 (video infra)
              |
Phase 2:  S1 (RunFiles)  ||  S3 (Views)  ||  S4 (updateArtifact)  ||  S6 (delete)
              |                |                |
Phase 3:  S2 (file serve) ||  S5 (aliases)    |
                               |               |
Phase 4:                   S7 (link/unlink) <--+
                               |
Phase 5:                   S8 (workspace views) <-- S3

Verification (S9-S15): begin at Phase 2, run continuously in parallel with backend slices
```

---

## Slice 0: Video Recording Infrastructure

**Purpose:** Add video recording to all Playwright tests; set up directory structure and .gitignore.

**Changes:**
- `tests/playwright/playwright.config.ts` -- add `video: 'on'` to `use` block; configure output to `test-videos/{projectName}/`
- `.gitignore` -- add `tests/playwright/test-videos/`

**Video directory convention:**
```
tests/playwright/test-videos/
  bandw/   -- videos from --project=bandw runs
  wandb/   -- videos from --project=wandb runs
```

Video paths mirror the test directory structure so each spec's video is easy to locate.

**Verification:**
- Run any existing spec for both targets; `.webm` files appear under `test-videos/bandw/` and `test-videos/wandb/`
- `git status` shows no video files staged

---

## Slice 1: createRunFiles + Run.files (D1 + D2)

**Backend:**
1. **Model** (`internal/store/models.go`): Add `RunFile` struct (ID, RunID, Name, StoragePath, UploadURL, DirectURL, Size, MD5, CreatedAt, UpdatedAt). Add to `AutoMigrate`.
2. **Resolver** (new `internal/graphql/run_files.go`): Implement `CreateRunFiles` -- resolve entity/project/run, create `RunFile` records with storage paths via `r.store.UploadURL()` / `r.store.DirectURL()`, return `CreateRunFilesPayload`.
3. **Schema** (`internal/graphql/schema.go`): Add `files(names: [String], pattern: String, after: String, first: Int): FileConnection` to `Run` type.
4. **Run.files resolver** on `RunResolver` -- query `RunFile` records, apply name/pattern filters, relay pagination.

**Go tests** (`internal/graphql/run_files_test.go`):
- `TestCreateRunFilesReturnsUploadURLs`
- `TestCreateRunFilesUploadAndDownload`
- `TestRunFilesQuery`
- `TestCreateRunFilesDuplicateUpserts`

**Playwright:** `runs/view/files-tab.spec.ts`

**Critical files:**
- `internal/store/models.go`
- `internal/graphql/schema.go`
- `internal/graphql/run_files.go` (new)
- `internal/graphql/run_resolver.go`

---

## Slice 2: Unified File Serving (D3)

**Backend:**
1. **Storage** (`internal/storage/local.go`): Enhance `DownloadHandler` to infer content-type from file extension via Go `mime.TypeByExtension`.
2. Content-type map fallbacks for extensions not in Go's registry: `.yaml`/`.yml` -> `application/x-yaml`, `.py` -> `text/x-python`, `.log` -> `text/plain`.

**Go tests** (`internal/server/file_serving_test.go`):
- `TestFileServingContentTypePNG`
- `TestFileServingContentTypeJSON`
- `TestFileServingContentTypeYAML`
- `TestFileServingNotFound`

**Critical files:**
- `internal/storage/local.go`

---

## Slice 3: View Model + Report CRUD (D4)

**Backend:**
1. **Model** (`internal/store/models.go`): Add `View` struct (ID, Name, DisplayName, Type, Description, Spec as datatypes.JSON, ProjectID, UserID, CreatedAt, UpdatedAt). Add to `AutoMigrate`.
2. **Schema** (`internal/graphql/schema.go`): Add `View` type, `ViewConnection`/`ViewEdge`, `upsertView` mutation, `deleteView` mutation, `Project.allViews` query.
3. **Resolvers** (new `internal/graphql/view_resolver.go`, `internal/graphql/view_mutations.go`): Full CRUD.

**Go tests** (`internal/graphql/view_test.go`):
- `TestUpsertViewCreatesNew`
- `TestUpsertViewUpdatesExisting`
- `TestDeleteView`
- `TestAllViewsFilterByType`
- `TestViewSpecRoundTrip`

**Playwright:** `reports/core/reports-core.spec.ts`, `reports/advanced/reports-advanced.spec.ts`, `track/project-page/reports-tab.spec.ts`

**Critical files:**
- `internal/store/models.go`
- `internal/graphql/schema.go`
- `internal/graphql/view_resolver.go` (new)
- `internal/graphql/view_mutations.go` (new)

---

## Slice 4: updateArtifact (D5a)

**Backend:** Replace `errNotImplemented("updateArtifact")` in `internal/graphql/artifact_mutations.go` with working implementation that updates description, metadata, TTL, and syncs aliases/tags.

**Go tests** (`internal/graphql/artifact_update_test.go`):
- `TestUpdateArtifactDescription`
- `TestUpdateArtifactMetadata`
- `TestUpdateArtifactAliases`

**Critical files:** `internal/graphql/artifact_mutations.go`

---

## Slice 5: addAliases / deleteAliases (D5b)

**Backend:** Replace stubs for `AddAliases`, `DeleteAliases` in `artifact_mutations.go`. Also fix `ArtifactCollectionResolver.Aliases()` to return actual data.

**Go tests** (`internal/graphql/artifact_alias_test.go`):
- `TestAddAliasesSingle`
- `TestDeleteAliases`
- `TestAddAliasIdempotent`
- `TestCollectionAliasesPopulated`

**Critical files:** `internal/graphql/artifact_mutations.go`, `internal/graphql/artifact_resolvers.go`

---

## Slice 6: deleteArtifact / deleteSequence (D5c)

**Backend:** Replace stubs for `DeleteArtifact`, `DeleteArtifactSequence`, `DeleteArtifactPortfolio`. Soft-delete (state=DELETED), optionally cascade aliases.

**Go tests** (`internal/graphql/artifact_delete_test.go`):
- `TestDeleteArtifactSetsDeleted`
- `TestDeleteArtifactWithAliases`
- `TestDeleteArtifactSequence`

**Critical files:** `internal/graphql/artifact_mutations.go`

---

## Slice 7: linkArtifact / unlinkArtifact + updates (D5d)

**Backend:** Replace stubs for `LinkArtifact`, `UnlinkArtifact`, `UpdateArtifactSequence`, `UpdateArtifactPortfolio`, `MoveArtifactSequence`, tag assignment mutations. Fix `ArtifactCollectionMembershipResolver`.

**Go tests** (`internal/graphql/artifact_link_test.go`):
- `TestLinkArtifactToPortfolio`
- `TestUnlinkArtifactFromPortfolio`
- `TestUpdateArtifactSequenceName`
- `TestCollectionTagAssignments`

**Playwright:** `artifacts/advanced/artifacts-advanced.spec.ts`, `track/project-page/artifacts-tab.spec.ts`

**Critical files:** `internal/graphql/artifact_mutations.go`, `internal/graphql/artifact_resolvers.go`

---

## Slice 8: Saved Workspace Views (D7)

**Backend:** Reuse `View` model from S3 with `type="workspace"`. Ensure `allViews(type: "workspace")` filter works.

**Go tests** (`internal/graphql/workspace_view_test.go`):
- `TestUpsertWorkspaceView`
- `TestAllViewsWorkspaceFilter`

**Playwright:** `track/workspaces/saved-views-crud.spec.ts`, `track/workspaces/workspace-types.spec.ts`, `track/project-page/workspace-tab.spec.ts`

**Critical files:** Same as S3 (no new files needed)

---

## Slices 9-15: Verification Slices (No Backend Changes)

These slices verify existing Playwright specs work against both targets. Each requires:
1. Ensuring setup.py seeds data correctly for bandw target
2. Running specs, recording video
3. Fixing any frontend rendering gaps discovered by tests

All verification slices can run in parallel with each other.

---

## Full Task Matrix

### Column Definitions & How to Check Off

| Column | Gate | Command to Verify |
|--------|------|------------------|
| **Go** | Go integration tests pass | `go test ./internal/... -run "TestName" -v -count=1` |
| **SDK** | SDK setup.py succeeds against bandw | `WANDB_BASE_URL=http://localhost:8080 WANDB_API_KEY=<key> WANDB_ENTITY=admin uv run python tests/<folder>/setup.py` |
| **PW-W** | Playwright passes on the reference | `npx playwright test tests/<spec> --project=wandb` |
| **PW-B** | Playwright passes on bandw | `npx playwright test tests/<spec> --project=bandw` |
| **Vid-W** | Video recorded on the reference UI | `ls tests/playwright/test-videos/wandb/<spec-folder>/*.webm` |
| **Vid-B** | Video recorded on bandw UI | `ls tests/playwright/test-videos/bandw/<spec-folder>/*.webm` |

**SDK conformance gate (run after every slice):**
```bash
./tests/wandb-conformance/run.sh --quick   # 8 smoke tests
go test ./...                                # all Go tests
```

---

### S0: Video Infrastructure

| Item | Go | SDK | PW-W | PW-B | Vid-W | Vid-B |
|------|:--:|:---:|:----:|:----:|:-----:|:-----:|
| playwright.config.ts `video: 'on'` | n/a | n/a | n/a | n/a | [x] | [x] |
| .gitignore `test-videos/` | n/a | n/a | n/a | n/a | [x] | [x] |

### S1: createRunFiles + Run.files (D1+D2)

| Item | Go | SDK | PW-W | PW-B | Vid-W | Vid-B |
|------|:--:|:---:|:----:|:----:|:-----:|:-----:|
| RunFile model + migration | [x] | n/a | n/a | n/a | n/a | n/a |
| CreateRunFiles resolver | [x] | [x] | n/a | n/a | n/a | n/a |
| Run.files resolver | [x] | n/a | n/a | n/a | n/a | n/a |
| **runs/view/files-tab.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |

### S2: Unified File Serving (D3)

| Item | Go | SDK | PW-W | PW-B | Vid-W | Vid-B |
|------|:--:|:---:|:----:|:----:|:-----:|:-----:|
| Content-type inference | [x] | n/a | n/a | n/a | n/a | n/a |
| HEAD request support | [x] | n/a | n/a | n/a | n/a | n/a |

### S3: View Model + Report CRUD (D4)

| Item | Go | SDK | PW-W | PW-B | Vid-W | Vid-B |
|------|:--:|:---:|:----:|:----:|:-----:|:-----:|
| View model + migration | [x] | n/a | n/a | n/a | n/a | n/a |
| upsertView resolver | [x] | n/a | n/a | n/a | n/a | n/a |
| deleteView resolver | [x] | n/a | n/a | n/a | n/a | n/a |
| allViews resolver | [x] | n/a | n/a | n/a | n/a | n/a |
| **reports/core/reports-core.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **reports/advanced/reports-advanced.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |

### S4: updateArtifact (D5a)

| Item | Go | SDK | PW-W | PW-B | Vid-W | Vid-B |
|------|:--:|:---:|:----:|:----:|:-----:|:-----:|
| updateArtifact resolver | [x] | [x] | n/a | n/a | n/a | n/a |

### S5: addAliases / deleteAliases (D5b)

| Item | Go | SDK | PW-W | PW-B | Vid-W | Vid-B |
|------|:--:|:---:|:----:|:----:|:-----:|:-----:|
| addAliases resolver | [x] | [x] | n/a | n/a | n/a | n/a |
| deleteAliases resolver | [x] | [x] | n/a | n/a | n/a | n/a |
| ArtifactCollection.aliases fix | [x] | n/a | n/a | n/a | n/a | n/a |

### S6: deleteArtifact / deleteSequence (D5c)

| Item | Go | SDK | PW-W | PW-B | Vid-W | Vid-B |
|------|:--:|:---:|:----:|:----:|:-----:|:-----:|
| deleteArtifact resolver | [x] | [x] | n/a | n/a | n/a | n/a |
| deleteArtifactSequence resolver | [x] | [x] | n/a | n/a | n/a | n/a |

### S7: linkArtifact / unlinkArtifact + updates (D5d)

| Item | Go | SDK | PW-W | PW-B | Vid-W | Vid-B |
|------|:--:|:---:|:----:|:----:|:-----:|:-----:|
| linkArtifact resolver | [x] | [x] | n/a | n/a | n/a | n/a |
| unlinkArtifact resolver | [x] | [x] | n/a | n/a | n/a | n/a |
| updateArtifactSequence resolver | [x] | [x] | n/a | n/a | n/a | n/a |
| Tag assignment resolvers | [x] | n/a | n/a | n/a | n/a | n/a |
| **artifacts/advanced/artifacts-advanced.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |

### S8: Saved Workspace Views (D7)

| Item | Go | SDK | PW-W | PW-B | Vid-W | Vid-B |
|------|:--:|:---:|:----:|:----:|:-----:|:-----:|
| Workspace view CRUD | [x] | n/a | n/a | n/a | n/a | n/a |
| **track/workspaces/saved-views-crud.spec.ts** | n/a | [x] | [ ] | [x] | [ ] | [ ] |

### S9: Config + Logging + Summary (16 specs)

| Spec | Go | SDK | PW-W | PW-B | Vid-W | Vid-B |
|------|:--:|:---:|:----:|:----:|:-----:|:-----:|
| **track/config/config-at-init.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/config/config-from-argparse.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/config/config-from-file.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/config/config-updated-after-finish.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/config/config-updated-mid-run.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/logging/metrics-in-workspace.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/logging/multiple-metrics.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/logging/logging-best-practices-surface.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/logging/metric-naming.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/logging/define-metric-glob.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/logging/api-call-data-surfaces.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/logging/custom-x-axis.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/logging/automatically-logged-data.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/summary/summary-in-overview.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/summary/summary-in-table.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/summary/custom-aggregation.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |

### S10: Run View + Run Display (23 specs)

| Spec | Go | SDK | PW-W | PW-B | Vid-W | Vid-B |
|------|:--:|:---:|:----:|:----:|:-----:|:-----:|
| **runs/view/overview-summary.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/view/tab-navigation.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/view/charts-tab.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/view/logs-tab.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/view/overview-config.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/view/overview-metadata.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/view/overview-editable.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/view/overview-artifacts.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/view/artifacts-tab.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/view/files-tab.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/display/color-by-config-key.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/display/delete-runs.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/display/export-runs-csv.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/display/fork-run-display.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/display/key-based-run-coloring.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/display/manage-columns-add-remove.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/display/manage-columns-move-pin.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/display/resumed-run-display.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/display/rewind-run-display.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/display/search-runs-by-name.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/display/search-runs-regex-toggle.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/display/sort-by-column-with-aggregation.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/display/stop-run-from-ui.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |

### S11: Filtering + Comparison + Management (26 specs)

| Spec | Go | SDK | PW-W | PW-B | Vid-W | Vid-B |
|------|:--:|:---:|:----:|:----:|:-----:|:-----:|
| **runs/filter/default-filters.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/filter/filter-by-metric.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/filter/filter-by-state.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/filter/filter-by-tags.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/filter/filter-operators-by-type.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/filter/remove-filter.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/compare/baseline-comparison-tooltips.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/compare/change-baseline-run.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/compare/compare-runs-full-workflow.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/compare/compare-runs-limitations.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/compare/hide-metric-deltas.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/compare/pin-runs.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/compare/remove-baseline.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/compare/set-baseline-run.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/compare/summary-metric-deltas.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/management/add-tags-project.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/management/add-tags-run.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/management/add-tags-sdk.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/management/delete-group.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/management/group-by-job-type.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/management/group-runs-sdk.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/management/group-runs-ui.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/management/move-between-groups.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/management/move-to-project.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/management/remove-tags.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **runs/management/run-state-display.spec.ts** | n/a | [x] | [ ] | [x] | [ ] | [x] |

### S12: Project Page + Plots (26 specs)

| Spec | Go | SDK | PW-W | PW-B | Vid-W | Vid-B |
|------|:--:|:---:|:----:|:----:|:-----:|:-----:|
| **track/project-page/overview.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/project-page/runs-table-columns.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/project-page/artifacts-tab.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/project-page/workspace-tab.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/project-page/project-lifecycle.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/project-page/project-notes.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/project-page/reports-tab.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/project-page/runs-table-bulk-ops.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/project-page/runs-table-filter.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/project-page/runs-table-group.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/project-page/runs-table-search.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/project-page/runs-table-sort.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/project-page/runs-table-visibility-sync.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/plots/define-metric-custom-x.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/plots/define-metric-glob.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/plots/matplotlib-plotly-logging.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/plots/point-aggregation-modes.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/plots/smoothing-methods.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/plots/wandb-plot-bar.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/plots/wandb-plot-confusion-matrix.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/plots/wandb-plot-histogram.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/plots/wandb-plot-line.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/plots/wandb-plot-multiline.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/plots/wandb-plot-pr-curve.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/plots/wandb-plot-roc-curve.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **track/plots/wandb-plot-scatter.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |

### S13: Line Plot + Overview + Bar/Scatter + Media Panels (36 specs)

| Spec | Go | SDK | PW-W | PW-B | Vid-W | Vid-B |
|------|:--:|:---:|:----:|:----:|:-----:|:-----:|
| **app/panels/line-plot/add-single-metric.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/line-plot/add-multi-metric.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/line-plot/change-colors-legend.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/line-plot/change-colors-table.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/line-plot/compare-metrics-one-chart.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/line-plot/custom-x-axis.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/line-plot/data-settings.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/line-plot/edit-individual.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/line-plot/edit-section.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/line-plot/edit-workspace.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/line-plot/expressions.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/line-plot/grouping-settings.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/line-plot/hide-legend.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/line-plot/legend-settings.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/line-plot/point-aggregation.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/line-plot/regex-groups.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/line-plot/smoothing-methods.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/line-plot/switch-x-axis.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/line-plot/visualize-averaged.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/line-plot/visualize-nan.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/line-plot/zoom.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/overview/add-panel-manually.spec.ts** | n/a | [x] | [ ] | [x] | [ ] | [x] |
| **app/panels/overview/manage-panels-crud.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **app/panels/overview/manage-sections.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **app/panels/overview/panel-full-screen.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **app/panels/overview/quick-add-panels.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **app/panels/overview/share-panel-embed-options.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **app/panels/overview/share-panel-url.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **app/panels/overview/workspace-layout-config.spec.ts** | n/a | [x] | [ ] | [x] | [ ] | [x] |
| **app/panels/overview/workspace-modes.spec.ts** | n/a | [x] | [ ] | [x] | [ ] | [x] |
| **app/panels/bar-plot/bar-plot-grouped-by-config.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/bar-plot/create-bar-plot.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/bar-plot/customize-bar-to-box-plot.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/scatter-plot/create-scatter-plot.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/scatter-plot/scatter-plot-example.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/media/media-panels.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |

### S14: Specialized Panels + Cascade + Custom Charts + Keyboard (27 specs)

| Spec | Go | SDK | PW-W | PW-B | Vid-W | Vid-B |
|------|:--:|:---:|:----:|:----:|:-----:|:-----:|
| **app/panels/parallel-coordinates/create-parallel-coords.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/parallel-coordinates/parallel-coords-filter.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/parallel-coordinates/parallel-coords-settings.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/parameter-importance/create-param-importance.spec.ts** | n/a | [x] | [ ] | [x] | [ ] | [x] |
| **app/panels/parameter-importance/param-importance-interpretation.spec.ts** | n/a | [x] | [ ] | [x] | [ ] | [x] |
| **app/panels/run-comparer/add-run-comparer.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/run-comparer/run-comparer-diff-only.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/run-comparer/run-comparer-dynamic-update.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/run-comparer/run-comparer-formatting.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/run-comparer/run-comparer-search.spec.ts** | n/a | [x] | [x] | [x] | [x] | [x] |
| **app/panels/code/code-panels.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **app/panels/query-panels/query-panels.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **app/cascade-settings/panel-level-settings.spec.ts** | n/a | [x] | [ ] | [x] | [ ] | [x] |
| **app/cascade-settings/section-level-settings.spec.ts** | n/a | [x] | [ ] | [x] | [ ] | [x] |
| **app/cascade-settings/settings-cascade-hierarchy.spec.ts** | n/a | [x] | [ ] | [x] | [ ] | [x] |
| **app/cascade-settings/workspace-layout-options.spec.ts** | n/a | [x] | [ ] | [x] | [ ] | [x] |
| **app/cascade-settings/workspace-level-settings.spec.ts** | n/a | [x] | [ ] | [x] | [ ] | [x] |
| **app/cascade-settings/workspace-line-plot-defaults.spec.ts** | n/a | [x] | [ ] | [x] | [ ] | [x] |
| **app/custom-charts/custom-chart-bar.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **app/custom-charts/custom-chart-edit-in-ui.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **app/custom-charts/custom-chart-histogram.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **app/custom-charts/custom-chart-line.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **app/custom-charts/custom-chart-pr-curve.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **app/custom-charts/custom-chart-roc-curve.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **app/custom-charts/custom-chart-scatter.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **app/custom-charts/custom-chart-table-data.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **app/keyboard-shortcuts/keyboard-shortcuts.spec.ts** | n/a | [x] | [ ] | [x] | [ ] | [x] |

### S15: Tables + Workspaces + Artifacts + Reports E2E (21 specs)

| Spec | Go | SDK | PW-W | PW-B | Vid-W | Vid-B |
|------|:--:|:---:|:----:|:----:|:-----:|:-----:|
| **tables/core/log-and-view-table.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **tables/core/table-compare-across-models.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **tables/core/table-compare-across-time.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **tables/core/table-merged-view.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **tables/core/table-side-by-side-view.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **tables/core/table-step-slider.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **tables/advanced/table-download.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **tables/advanced/table-immutable-mode.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **tables/advanced/table-incremental-mode.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **tables/advanced/table-mutable-mode.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **track/workspaces/saved-views-crud.spec.ts** | n/a | [x] | [ ] | [x] | [ ] | [x] |
| **track/workspaces/workspace-default-settings.spec.ts** | n/a | [x] | [ ] | [x] | [ ] | [x] |
| **track/workspaces/workspace-filter-group-sort.spec.ts** | n/a | [x] | [ ] | [x] | [ ] | [x] |
| **track/workspaces/workspace-panel-sections.spec.ts** | n/a | [x] | [ ] | [x] | [ ] | [x] |
| **track/workspaces/workspace-runs-sidebar.spec.ts** | n/a | [x] | [ ] | [x] | [ ] | [x] |
| **track/workspaces/workspace-types.spec.ts** | n/a | [x] | [ ] | [x] | [ ] | [x] |
| **track/workspaces/workspace-undo-redo.spec.ts** | n/a | [x] | [ ] | [x] | [ ] | [x] |
| **artifacts/core/artifacts-core.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **artifacts/advanced/artifacts-advanced.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **reports/core/reports-core.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |
| **reports/advanced/reports-advanced.spec.ts** | n/a | [x] | [ ] | [ ] | [ ] | [ ] |

---

## End-to-End Verification

After all slices are complete:

```bash
# 1. All Go tests pass
go test ./... -count=1

# 2. SDK conformance holds
./tests/wandb-conformance/run.sh --quick
./tests/wandb-conformance/run.sh

# 3. All 175 Playwright specs pass on both targets
cd tests/playwright
npx playwright test --project=bandw
npx playwright test --project=wandb

# 4. Videos exist for all specs — the reference UI
find test-videos/wandb -name "*.webm" | wc -l   # should be >= 175

# 5. Videos exist for all specs — bandw UI
find test-videos/bandw -name "*.webm" | wc -l   # should be >= 175

# 6. No videos committed
git status test-videos/  # should show nothing tracked
```
