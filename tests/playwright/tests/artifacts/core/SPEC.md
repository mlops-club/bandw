# Artifacts Test Plan

**W&B Docs Pages:**
- https://docs.wandb.ai/models/artifacts
- https://docs.wandb.ai/models/artifacts/explore-and-traverse-an-artifact-graph

**Test Directory:** `tests/playwright/tests/artifacts/`
**Priority:** P2

---

## Tests by Docs Heading

### Artifacts Overview

#### Test: `artifact-create-and-browse.spec.ts`
**SDK Setup:** `setup_artifacts.py` (creates dataset artifact with files, model artifact)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to project → Artifacts tab | Artifact types listed |
| 2 | Select "dataset" type | Dataset artifacts shown |
| 3 | Select specific artifact | Latest version detail loads |
| 4 | Verify artifact name and type | Matches SDK-created artifact |
| 5 | Click "Metadata" tab | Metadata key-values visible |
| 6 | Click "Usage" tab | Code snippet shown, producing run listed |
| 7 | Click "Files" tab | File list visible (files from `add_file()`) |

#### Test: `artifact-download.spec.ts`
**SDK Setup:** `setup_artifacts.py` (artifact with downloadable files)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to Artifacts → select artifact → Files tab | File list visible |
| 2 | Download a file from the artifact | File download succeeds |

#### Test: `artifact-versions.spec.ts`
**SDK Setup:** `setup_artifacts.py` (creates multiple versions of same artifact)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to Artifacts → select artifact | Latest version shown |
| 2 | Click "Versions" tab | Version list visible |
| 3 | Verify v0, v1, etc. listed | Versions match SDK creation count |
| 4 | Click on specific version | That version's details load |
| 5 | Verify version metadata differs | Each version has distinct content |

---

### Artifact Lineage (from /artifacts/explore-and-traverse-an-artifact-graph)

#### Test: `artifact-lineage-view.spec.ts`
**SDK Setup:** `setup_artifacts.py` (dataset artifact → training run → model artifact)
**Heading:** "View an artifact's lineage graph"

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to Artifacts → select artifact | Detail loads |
| 2 | Click "Lineage" tab | DAG graph renders |
| 3 | Verify green nodes (runs) and blue nodes (artifacts) | Color coding correct |
| 4 | Verify directional arrows show flow | Arrows indicate production and consumption flow |

#### Test: `artifact-lineage-navigate.spec.ts`
**SDK Setup:** `setup_artifacts.py`
**Heading:** "Navigate lineage graphs"

| # | Step | Assertion |
|---|---|---|
| 1 | View lineage graph | Graph visible |
| 2 | Click on a run node | Run metadata panel appears (timestamps, author) |
| 3 | Click on an artifact node | Artifact details shown (name:version format) |
| 4 | Rearrange nodes using the documented graph interaction | Layout changes |
| 5 | Zoom in and out | Graph scales |
| 6 | Use the node visibility toggle | Node visibility toggles |

#### Test: `artifact-lineage-clusters.spec.ts`
**SDK Setup:** `setup_artifacts.py` (create 5+ versions to trigger clustering)
**Heading:** "Artifact clusters"

| # | Step | Assertion |
|---|---|---|
| 1 | View lineage graph with many versions | Clustered nodes appear |
| 2 | Search within cluster | Search bar filters versions |
| 3 | Click node in cluster | Preview/metadata overview shown |
| 4 | Click arrow to extract individual node | Node shown separately for examination |

---

### Artifact Input/Output Tracking

#### Test: `artifact-input-output.spec.ts`
**SDK Setup:** `setup_artifacts.py` (run uses dataset artifact as input, produces model artifact as output)
**Heading:** "Enable lineage graph tracking"

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to training run → Artifacts tab | Tab loads |
| 2 | Verify input artifacts section shows dataset | Consumed artifact listed |
| 3 | Verify output artifacts section shows model | Produced artifact listed |
| 4 | Navigate to dataset artifact → Usage tab | Consuming runs listed |
| 5 | Navigate to model artifact → Usage tab | Producing run listed |

---

## SDK Setup Scripts Required

- `setup_artifacts.py`

## Total Tests: 7
