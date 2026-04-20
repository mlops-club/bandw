# Artifacts Advanced Test Plan

**W&B Docs Pages:**
- https://docs.wandb.ai/models/artifacts/construct-an-artifact
- https://docs.wandb.ai/models/artifacts/create-a-custom-alias
- https://docs.wandb.ai/models/artifacts/create-a-new-artifact-version
- https://docs.wandb.ai/models/artifacts/update-an-artifact
- https://docs.wandb.ai/models/artifacts/delete-artifacts

**Test Directory:** `tests/playwright/tests/artifacts-advanced/`
**Priority:** P2

---

## Construct Artifacts (from /artifacts/construct-an-artifact)

#### Test: `artifact-with-files-and-dirs.spec.ts`
**SDK Setup:** `setup_artifacts.py` (creates artifacts with single files, directories, and URI references)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to Artifacts → dataset artifact | Artifact loads |
| 2 | Click Files tab | File browser visible |
| 3 | Verify single file appears with correct name | File listed |
| 4 | Verify directory contents appear | Directory structure browsable |
| 5 | Verify file names match SDK `add_file(name=...)` overrides | Custom names applied |

---

## Custom Aliases (from /artifacts/create-a-custom-alias)

#### Test: `artifact-custom-aliases.spec.ts`
**SDK Setup:** `setup_artifacts.py` (logs artifact with `aliases=["latest", "best-model", "production"]`)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to Artifacts → select artifact | Artifact detail loads |
| 2 | Verify "latest" alias shown | Default alias present |
| 3 | Verify custom aliases ("best-model", "production") shown | Custom aliases visible |
| 4 | Click on alias to filter to that version | Correct version shown |

---

## Artifact Versions (from /artifacts/create-a-new-artifact-version)

#### Test: `artifact-version-auto-increment.spec.ts`
**SDK Setup:** `setup_artifacts.py` (logs same artifact name 3 times with different content)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to Artifacts → select artifact → Versions tab | Version list visible |
| 2 | Verify v0, v1, v2 listed | Three versions present |
| 3 | Click v0 | First version details shown |
| 4 | Click v2 | Latest version details shown |
| 5 | Verify content differs between versions | Different file metadata |

#### Test: `artifact-version-from-existing.spec.ts`
**SDK Setup:** `setup_artifacts.py` (creates a new version from an existing artifact version)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to Artifacts → select artifact → Versions tab | Version list visible |
| 2 | Open the derived version | Derived version details shown |
| 3 | Verify inherited content and updated metadata are both visible | Version matches setup behavior |

---

## Delete Artifacts (from /artifacts/delete-artifacts)

#### Test: `artifact-delete.spec.ts`
**SDK Setup:** `setup_artifacts.py`

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to Artifacts → select artifact | Artifact visible |
| 2 | Delete artifact version via UI | Confirmation dialog appears |
| 3 | Confirm deletion | Version removed from list |
| 4 | Verify remaining versions intact | Other versions still present |

---

## Artifact Metadata and Description (from /artifacts/update-an-artifact)

#### Test: `artifact-update-metadata.spec.ts`
**SDK Setup:** `setup_artifacts.py` (artifact with metadata dict and description)

| # | Step | Assertion |
|---|---|---|
| 1 | Navigate to Artifacts → select artifact | Artifact detail loads |
| 2 | Click Metadata tab | Metadata key-values visible |
| 3 | Verify metadata matches SDK-logged values | Values correct |
| 4 | Verify description appears | Description text visible |

---

## SDK Setup Scripts Required

- `setup_artifacts.py` (extended: multiple versions, aliases, files/dirs, metadata)

## Total Tests: 6
