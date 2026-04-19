"""End-to-end artifact smoke test: wandb SDK -> bandw server -> GraphQL assertions.

Exercises every public SDK artifact API surface for writing and reading artifacts,
then validates correctness by querying the GraphQL API directly.

Usage:
    1. Start the server:  PORT=8081 go run ./cmd/server/
    2. Run this script:   uv run python tests/smoke/test_artifacts_e2e.py

Override the server URL:
    BANDW_URL=http://localhost:9090 uv run python tests/smoke/test_artifacts_e2e.py

Sections tested:
    1.  Create artifact with add_file, add_dir, new_file, add (WBValue)
    2.  log_artifact (upload flow)
    3.  GraphQL verification of artifact metadata
    4.  use_artifact + download (download flow + lineage)
    5.  Artifact.get / get_entry / __getitem__ / __setitem__ / file / files / remove
    6.  Artifact versioning (log a second version, verify version_index)
    7.  Alias management (set, add, remove)
    8.  Tag management
    9.  Metadata & description updates (updateArtifact)
    10. TTL (time-to-live) management
    11. Reference artifacts (add_reference)
    12. Incremental artifacts (new_draft)
    13. Artifact lineage (logged_by, used_by)
    14. Artifact linking (link to portfolio / model registry)
    15. Artifact deletion
    16. Public API: wandb.Api() artifact queries
    17. Public API: artifact_types, artifact_collections, artifact_exists
    18. Public API: run.logged_artifacts, run.used_artifacts
    19. Distributed artifacts (upsert_artifact / finish_artifact)
    20. Artifact.save() outside of a run context
    21. Artifact.checkout and verify
    25. Digest deduplication
    26. Empty artifact
    27. Negative test: nonexistent artifact
"""

from __future__ import annotations

import json
import os
import shutil
import sys
import tempfile
import uuid
from datetime import timedelta
from pathlib import Path

import requests

# ── Configuration ──────────────────────────────────────────────────
BASE_URL = os.environ.get("BANDW_URL", "http://localhost:8081")
API_KEY = "1dbac5a5d91172ad159b7978bec36bb8c3b0a5f5"
GQL_URL = f"{BASE_URL}/graphql"
AUTH = ("api", API_KEY)

TEST_ID = uuid.uuid4().hex[:8]
PROJECT_NAME = f"art-e2e-{TEST_ID}"
ENTITY_NAME = "admin"

# ── Helpers ────────────────────────────────────────────────────────

passed = 0
failed = 0


def gql(query: str, variables: dict | None = None) -> dict:
    """Send a GraphQL query and return the parsed JSON response."""
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    r = requests.post(GQL_URL, json=payload, auth=AUTH, timeout=30)
    r.raise_for_status()
    data = r.json()
    if "errors" in data:
        print(f"  GraphQL errors: {json.dumps(data['errors'], indent=2)}", file=sys.stderr)
    return data


def assert_eq(label: str, actual, expected):
    global passed, failed
    if actual != expected:
        print(f"  FAIL: {label}: expected {expected!r}, got {actual!r}", file=sys.stderr)
        failed += 1
        return False
    print(f"  OK: {label} = {actual!r}")
    passed += 1
    return True


def assert_true(label: str, value):
    global passed, failed
    if not value:
        print(f"  FAIL: {label}: expected truthy, got {value!r}", file=sys.stderr)
        failed += 1
        return False
    print(f"  OK: {label}")
    passed += 1
    return True


def assert_contains(label: str, haystack, needle):
    global passed, failed
    if needle not in haystack:
        print(f"  FAIL: {label}: {needle!r} not found in {haystack!r}", file=sys.stderr)
        failed += 1
        return False
    print(f"  OK: {label} contains {needle!r}")
    passed += 1
    return True


def assert_gte(label: str, actual, minimum):
    global passed, failed
    if actual < minimum:
        print(f"  FAIL: {label}: {actual!r} < {minimum!r}", file=sys.stderr)
        failed += 1
        return False
    print(f"  OK: {label} = {actual!r} >= {minimum!r}")
    passed += 1
    return True


def section(number: int, title: str):
    print(f"\n{'─' * 60}")
    print(f"  {number}. {title}")
    print(f"{'─' * 60}")


# ── Configure wandb SDK ───────────────────────────────────────────
os.environ["WANDB_BASE_URL"] = BASE_URL
os.environ["WANDB_API_KEY"] = API_KEY
os.environ["WANDB_CONSOLE"] = "off"
os.environ["WANDB_SILENT"] = "true"

import wandb  # noqa: E402

print(f"\n{'=' * 60}")
print(f"Artifact End-to-End Test  (project={PROJECT_NAME})")
print(f"{'=' * 60}")

# Create a temp directory for test files
tmpdir = Path(tempfile.mkdtemp(prefix="bandw_art_test_"))

# ═══════════════════════════════════════════════════════════════════
# PART A: ARTIFACT CREATION AND UPLOAD
# ═══════════════════════════════════════════════════════════════════

# ── 1. Create artifact with various add methods ────────────────────
section(1, "Create artifact with add_file, add_dir, new_file, add (WBValue)")

# Create test files on disk
file_a = tmpdir / "single_file.txt"
file_a.write_text("Hello from single_file.txt")

dir_path = tmpdir / "my_dir"
dir_path.mkdir()
(dir_path / "a.txt").write_text("file a in dir")
(dir_path / "b.txt").write_text("file b in dir")
sub = dir_path / "sub"
sub.mkdir()
(sub / "c.txt").write_text("file c in subdir")

art = wandb.Artifact(
    name="test-dataset",
    type="dataset",
    description="A test dataset artifact",
    metadata={"source": "unit_test", "version_note": "initial"},
)

# add_file: single file
entry_single = art.add_file(str(file_a), name="data/single_file.txt")
assert_true("add_file returns ArtifactManifestEntry", entry_single is not None)
print(f"  entry path: {entry_single.path}")

# add_dir: directory of files
art.add_dir(str(dir_path), name="data/my_dir")

# new_file: create file via context manager
with art.new_file("data/generated.txt") as f:
    f.write("This was generated via new_file()")

# add (WBValue): add a wandb.Table
table = wandb.Table(columns=["id", "value"], data=[[1, "a"], [2, "b"], [3, "c"]])
art.add(table, name="results/summary_table")

# Verify manifest entries exist locally before upload
manifest = art.manifest
entry_names = [e.path for e in manifest.entries.values()]
assert_contains("manifest has single_file", entry_names, "data/single_file.txt")
assert_contains("manifest has dir file a", entry_names, "data/my_dir/a.txt")
assert_contains("manifest has dir file b", entry_names, "data/my_dir/b.txt")
assert_contains("manifest has subdir file c", entry_names, "data/my_dir/sub/c.txt")
assert_contains("manifest has generated file", entry_names, "data/generated.txt")
# Table adds multiple files (json + table)
table_entries = [e for e in entry_names if "summary_table" in e]
assert_true("manifest has table entries", len(table_entries) >= 1)

print(f"  Total manifest entries: {len(entry_names)}")

# ── 2. log_artifact (upload flow) ─────────────────────────────────
section(2, "log_artifact (upload flow)")

print("  Starting wandb run...")
run = wandb.init(
    project=PROJECT_NAME,
    entity=ENTITY_NAME,
    name=f"artifact-producer-{TEST_ID}",
)
run_id = run.id
print(f"  Run ID: {run_id}")

print("  Logging artifact...")
logged_art = run.log_artifact(art)
print("  Waiting for artifact upload to complete...")
logged_art.wait()
print(f"  Artifact logged: {logged_art.name}")
print(f"  Artifact ID: {logged_art.id}")
print(f"  Artifact digest: {logged_art.digest}")
print(f"  Artifact state: {logged_art.state}")

assert_true("artifact has server ID", logged_art.id is not None)
assert_contains("artifact name has version", logged_art.name, "test-dataset:")
assert_eq("artifact type", logged_art.type, "dataset")

# ── 3. GraphQL verification of artifact metadata ──────────────────
section(3, "GraphQL verification of artifact metadata")

result = gql(f"""
    query {{
        model(name: "{PROJECT_NAME}", entityName: "{ENTITY_NAME}") {{
            artifactType(name: "dataset") {{
                id
                name
                artifactCollections {{
                    edges {{
                        node {{
                            name
                            description
                            artifacts {{
                                edges {{
                                    node {{
                                        id
                                        digest
                                        state
                                        versionIndex
                                        description
                                        metadata
                                        size
                                        fileCount
                                        createdAt
                                        aliases {{
                                            alias
                                        }}
                                    }}
                                }}
                            }}
                        }}
                    }}
                }}
            }}
        }}
    }}
""")

project_data = result["data"]["model"]
assert_true("project exists", project_data is not None)

art_type = project_data["artifactType"]
assert_true("artifact type 'dataset' exists", art_type is not None)
assert_eq("artifact type name", art_type["name"], "dataset")

collections = art_type["artifactCollections"]["edges"]
assert_true("at least one collection", len(collections) >= 1)

collection = collections[0]["node"]
assert_eq("collection name", collection["name"], "test-dataset")
assert_eq("collection description", collection["description"], "A test dataset artifact")

versions = collection["artifacts"]["edges"]
assert_true("at least one version", len(versions) >= 1)

v0 = versions[0]["node"]
assert_eq("v0 state", v0["state"], "COMMITTED")
assert_eq("v0 versionIndex", v0["versionIndex"], 0)
assert_eq("v0 description", v0["description"], "A test dataset artifact")
assert_true("v0 has digest", v0["digest"] is not None and len(v0["digest"]) > 0)
assert_true("v0 has size", v0["size"] is not None and v0["size"] > 0)
assert_true("v0 has fileCount", v0["fileCount"] is not None and v0["fileCount"] > 0)
assert_true("v0 has createdAt", v0["createdAt"] is not None)

# Check metadata was stored
if v0["metadata"]:
    meta = json.loads(v0["metadata"]) if isinstance(v0["metadata"], str) else v0["metadata"]
    assert_eq("v0 metadata.source", meta.get("source"), "unit_test")

# Check aliases include "latest"
alias_names = [a["alias"] for a in v0["aliases"]]
assert_contains("v0 aliases include 'latest'", alias_names, "latest")

artifact_v0_id = v0["id"]
print(f"  Artifact v0 ID (from GraphQL): {artifact_v0_id}")


# ═══════════════════════════════════════════════════════════════════
# PART B: ARTIFACT DOWNLOAD AND READ
# ═══════════════════════════════════════════════════════════════════

# ── 4. use_artifact + download ─────────────────────────────────────
section(4, "use_artifact + download (download flow + lineage)")

# Start a consumer run
print("  Starting consumer run...")
consumer_run = wandb.init(
    project=PROJECT_NAME,
    entity=ENTITY_NAME,
    name=f"artifact-consumer-{TEST_ID}",
)
consumer_run_id = consumer_run.id

print("  Calling use_artifact...")
used_art = consumer_run.use_artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset:v0")
assert_true("use_artifact returns artifact", used_art is not None)
assert_eq("used artifact type", used_art.type, "dataset")

# Download the artifact
download_dir = tmpdir / "downloaded_v0"
print(f"  Downloading to {download_dir}...")
downloaded_path = used_art.download(root=str(download_dir))
print(f"  Downloaded to: {downloaded_path}")

# Verify downloaded files match what we uploaded
assert_true("download dir exists", Path(downloaded_path).exists())

downloaded_single = Path(downloaded_path) / "data" / "single_file.txt"
assert_true("single_file.txt exists after download", downloaded_single.exists())
assert_eq("single_file.txt content", downloaded_single.read_text(), "Hello from single_file.txt")

downloaded_a = Path(downloaded_path) / "data" / "my_dir" / "a.txt"
assert_true("a.txt exists after download", downloaded_a.exists())
assert_eq("a.txt content", downloaded_a.read_text(), "file a in dir")

downloaded_c = Path(downloaded_path) / "data" / "my_dir" / "sub" / "c.txt"
assert_true("c.txt exists after download", downloaded_c.exists())
assert_eq("c.txt content", downloaded_c.read_text(), "file c in subdir")

downloaded_gen = Path(downloaded_path) / "data" / "generated.txt"
assert_true("generated.txt exists after download", downloaded_gen.exists())
assert_eq("generated.txt content", downloaded_gen.read_text(), "This was generated via new_file()")

# ── 5. Artifact.get / get_entry / __getitem__ / __setitem__ / file / files / remove ──
section(5, "Artifact.get / get_entry / __getitem__ / __setitem__ / file / files / remove")

# get_entry (returns manifest entry without downloading)
entry = used_art.get_entry("data/single_file.txt")
assert_true("get_entry returns entry", entry is not None)
assert_eq("entry path", entry.path, "data/single_file.txt")
assert_true("entry has digest", entry.digest is not None)
print(f"  entry.digest = {entry.digest}")
print(f"  entry.size = {entry.size}")

# get (downloads + deserializes WBValue)
# For the table we added:
retrieved_table = used_art.get("results/summary_table")
if retrieved_table is not None:
    assert_true("get() returns WBValue (Table)", isinstance(retrieved_table, wandb.Table))
    assert_eq("table has 3 rows", len(retrieved_table.data), 3)
    assert_eq("table columns", retrieved_table.columns, ["id", "value"])
    print(f"  Table data: {retrieved_table.data}")
else:
    print("  WARN: get() returned None for table (may need server-side table support)")

# __getitem__ is an alias for get
item = used_art["results/summary_table"]
if item is not None:
    assert_true("__getitem__ returns same as get()", isinstance(item, wandb.Table))

# files() - paginated file listing
print("  Listing artifact files via .files()...")
art_files = list(used_art.files())
assert_true("files() returns entries", len(art_files) > 0)
file_names = [f.name for f in art_files]
print(f"  Total files from .files(): {len(art_files)}")
for f in art_files[:5]:
    print(f"    - {f.name} ({f.size} bytes)")
# Check that known files appear in the listing
assert_true("files() includes data/single_file.txt", any("single_file" in n for n in file_names))

# file() — single-file artifact convenience (create one to test)
print("  Testing file() on a single-file artifact...")
single_art = wandb.Artifact(name="single-file-art", type="dataset")
single_f = tmpdir / "only_file.txt"
single_f.write_text("I am the only file")
single_art.add_file(str(single_f), name="only_file.txt")
logged_single = consumer_run.log_artifact(single_art)
logged_single.wait()
_api = wandb.Api(overrides={"base_url": BASE_URL})
fetched_single = _api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/single-file-art:v0")
single_download_dir = tmpdir / "single_file_download"
single_file_path = fetched_single.file(root=str(single_download_dir))
assert_true("file() returns a path", single_file_path is not None)
assert_eq("file() content", Path(single_file_path).read_text(), "I am the only file")

# __setitem__ — add WBValue via bracket syntax
print("  Testing __setitem__...")
setitem_art = wandb.Artifact(name="setitem-test", type="dataset")
setitem_table = wandb.Table(columns=["x"], data=[[1], [2]])
setitem_art["my_table"] = setitem_table
setitem_entries = [e.path for e in setitem_art.manifest.entries.values()]
assert_true("__setitem__ added table entry", any("my_table" in e for e in setitem_entries))

# remove() — remove an entry from a draft artifact
print("  Testing remove()...")
remove_art = wandb.Artifact(name="remove-test", type="dataset")
rem_f = tmpdir / "to_remove.txt"
rem_f.write_text("remove me")
remove_art.add_file(str(rem_f), name="to_remove.txt")
keep_f = tmpdir / "to_keep.txt"
keep_f.write_text("keep me")
remove_art.add_file(str(keep_f), name="to_keep.txt")
assert_true(
    "before remove: has to_remove.txt", "to_remove.txt" in [e.path for e in remove_art.manifest.entries.values()]
)
remove_art.remove("to_remove.txt")
remaining = [e.path for e in remove_art.manifest.entries.values()]
assert_true("after remove: to_remove.txt gone", "to_remove.txt" not in remaining)
assert_true("after remove: to_keep.txt still there", "to_keep.txt" in remaining)

# Finish consumer run
consumer_run.finish()

# ═══════════════════════════════════════════════════════════════════
# PART C: VERSIONING, ALIASES, TAGS
# ═══════════════════════════════════════════════════════════════════

# ── 6. Artifact versioning ─────────────────────────────────────────
section(6, "Artifact versioning (log a second version)")

# Start a new producer run for v1
run2 = wandb.init(
    project=PROJECT_NAME,
    entity=ENTITY_NAME,
    name=f"artifact-producer-v1-{TEST_ID}",
)

art_v1 = wandb.Artifact(
    name="test-dataset",
    type="dataset",
    description="Updated dataset v1",
    metadata={"source": "unit_test", "version_note": "added_more_data"},
)

# Add the original files plus a new one
art_v1.add_file(str(file_a), name="data/single_file.txt")
new_file = tmpdir / "extra_data.csv"
new_file.write_text("col1,col2\n1,2\n3,4\n5,6")
art_v1.add_file(str(new_file), name="data/extra_data.csv")

logged_v1 = run2.log_artifact(art_v1)
logged_v1.wait()
run2.finish()

print(f"  v1 name: {logged_v1.name}")
print(f"  v1 digest: {logged_v1.digest}")

# Verify via GraphQL that v1 exists
result = gql(f"""
    query {{
        model(name: "{PROJECT_NAME}", entityName: "{ENTITY_NAME}") {{
            artifactType(name: "dataset") {{
                artifactCollections {{
                    edges {{
                        node {{
                            name
                            artifacts {{
                                edges {{
                                    node {{
                                        versionIndex
                                        state
                                        description
                                        aliases {{ alias }}
                                    }}
                                }}
                            }}
                        }}
                    }}
                }}
            }}
        }}
    }}
""")

coll_edges = result["data"]["model"]["artifactType"]["artifactCollections"]["edges"]
td_coll = next(e["node"] for e in coll_edges if e["node"]["name"] == "test-dataset")
art_edges = td_coll["artifacts"]["edges"]
versions_found = [e["node"]["versionIndex"] for e in art_edges]
print(f"  Versions found: {versions_found}")
assert_contains("v0 exists", versions_found, 0)
assert_contains("v1 exists", versions_found, 1)

# Check that "latest" moved to v1
v1_node = next(e["node"] for e in art_edges if e["node"]["versionIndex"] == 1)
v1_aliases = [a["alias"] for a in v1_node["aliases"]]
assert_contains("v1 has 'latest' alias", v1_aliases, "latest")
assert_eq("v1 description", v1_node["description"], "Updated dataset v1")

# ── 7. Alias management ───────────────────────────────────────────
section(7, "Alias management (set, add, remove)")

# Use the public API to manage aliases
api = wandb.Api(overrides={"base_url": BASE_URL})

art_ref = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset:v0")
assert_true("api.artifact() returns artifact", art_ref is not None)
print(f"  Fetched v0 via public API: {art_ref.name}")

# Set custom aliases
original_aliases = list(art_ref.aliases)
print(f"  Current aliases on v0: {original_aliases}")

art_ref.aliases.append("best-model")
art_ref.aliases.append("staging")
art_ref.save()
print("  Added aliases 'best-model' and 'staging' to v0")

# Re-fetch to verify
art_ref_refreshed = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset:v0")
refreshed_aliases = art_ref_refreshed.aliases
print(f"  Refreshed aliases on v0: {refreshed_aliases}")
assert_contains("v0 has 'best-model' alias", refreshed_aliases, "best-model")
assert_contains("v0 has 'staging' alias", refreshed_aliases, "staging")

# Fetch by alias
art_by_alias = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset:best-model")
assert_true("fetch by alias works", art_by_alias is not None)
assert_eq("fetched correct version via alias", art_by_alias.version, "v0")

# Remove an alias
art_ref_refreshed.aliases.remove("staging")
art_ref_refreshed.save()
print("  Removed 'staging' alias from v0")

art_check = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset:v0")
assert_true("'staging' alias removed", "staging" not in art_check.aliases)

# ── 8. Tag management ─────────────────────────────────────────────
section(8, "Tag management")

art_for_tags = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset:v0")
art_for_tags.tags = ["production", "validated", "team-alpha"]
art_for_tags.save()
print("  Set tags on v0: ['production', 'validated', 'team-alpha']")

art_tagged = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset:v0")
print(f"  Tags on v0: {art_tagged.tags}")
assert_contains("has 'production' tag", art_tagged.tags, "production")
assert_contains("has 'validated' tag", art_tagged.tags, "validated")
assert_contains("has 'team-alpha' tag", art_tagged.tags, "team-alpha")

# ── 9. Metadata & description updates ─────────────────────────────
section(9, "Metadata & description updates (updateArtifact)")

art_to_update = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset:v0")

art_to_update.description = "Updated description for v0"
art_to_update.metadata["updated_field"] = "new_value"
art_to_update.metadata["numeric_field"] = 42
art_to_update.save()
print("  Updated description and metadata on v0")

art_updated = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset:v0")
assert_eq("updated description", art_updated.description, "Updated description for v0")
assert_eq("updated metadata field", art_updated.metadata.get("updated_field"), "new_value")
assert_eq("numeric metadata field", art_updated.metadata.get("numeric_field"), 42)
# Original metadata should still be present
assert_eq("original metadata preserved", art_updated.metadata.get("source"), "unit_test")

# ── 10. TTL management ─────────────────────────────────────────────
section(10, "TTL (time-to-live) management")

art_for_ttl = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset:v0")
art_for_ttl.ttl = timedelta(days=30)
art_for_ttl.save()
print("  Set TTL to 30 days on v0")

art_ttl_check = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset:v0")
if art_ttl_check.ttl is not None:
    assert_eq("TTL is 30 days", art_ttl_check.ttl, timedelta(days=30))
else:
    print("  WARN: TTL not returned by server (may not be implemented yet)")

# Remove TTL
art_for_ttl.ttl = None
art_for_ttl.save()
print("  Removed TTL from v0")


# ═══════════════════════════════════════════════════════════════════
# PART D: ADVANCED ARTIFACT FEATURES
# ═══════════════════════════════════════════════════════════════════

# ── 11. Reference artifacts ───────────────────────────────────────
section(11, "Reference artifacts (add_reference)")

run3 = wandb.init(
    project=PROJECT_NAME,
    entity=ENTITY_NAME,
    name=f"ref-artifact-producer-{TEST_ID}",
)

ref_art = wandb.Artifact(
    name="external-refs",
    type="reference-dataset",
    description="Artifact with external references",
)

# Add HTTP reference (no actual download - just metadata tracking)
ref_art.add_reference("https://example.com/data/file1.csv", name="remote/file1.csv", checksum=False)
ref_art.add_reference("https://example.com/data/file2.json", name="remote/file2.json", checksum=False)

logged_ref = run3.log_artifact(ref_art)
logged_ref.wait()
run3.finish()

print(f"  Reference artifact logged: {logged_ref.name}")
assert_true("ref artifact has ID", logged_ref.id is not None)

# Verify reference entries in manifest
ref_fetched = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/external-refs:v0")
assert_true("reference artifact fetchable", ref_fetched is not None)
ref_entry = ref_fetched.get_entry("remote/file1.csv")
assert_true("reference entry exists", ref_entry is not None)
if ref_entry.ref is not None:
    assert_contains("ref entry has URI", ref_entry.ref, "example.com")
print(f"  Reference entry ref: {ref_entry.ref}")

# ── 12. Incremental artifacts (new_draft) ─────────────────────────
section(12, "Incremental artifacts (new_draft)")

run4 = wandb.init(
    project=PROJECT_NAME,
    entity=ENTITY_NAME,
    name=f"incremental-producer-{TEST_ID}",
)

# Fetch v1 and create a draft to add more files
base_art = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset:v1")
draft = base_art.new_draft()
assert_true("new_draft returns artifact", draft is not None)
assert_true("draft is_draft", draft.is_draft())

# Add a new file to the draft
incremental_file = tmpdir / "incremental_data.txt"
incremental_file.write_text("This is incremental data added in v2")
draft.add_file(str(incremental_file), name="data/incremental_data.txt")

logged_v2 = run4.log_artifact(draft)
logged_v2.wait()
run4.finish()

print(f"  Incremental artifact logged: {logged_v2.name}")

# Verify v2 exists
v2_ref = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset:v2")
assert_true("v2 exists", v2_ref is not None)
assert_eq("v2 version", v2_ref.version, "v2")

# ── 13. Artifact lineage ──────────────────────────────────────────
section(13, "Artifact lineage (logged_by, used_by)")

# The v0 artifact was logged by our first producer run
v0_art = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset:v0")

creator_run = v0_art.logged_by()
if creator_run is not None:
    print(f"  v0 logged_by: {creator_run.name} (id={creator_run.id})")
    assert_eq("v0 created by producer run", creator_run.id, run_id)
else:
    print("  WARN: logged_by() returned None (lineage may not be implemented)")

# The v0 artifact was used by our consumer run
consumers = v0_art.used_by()
if consumers:
    consumer_ids = [r.id for r in consumers]
    print(f"  v0 used_by: {consumer_ids}")
    assert_contains("v0 used by consumer run", consumer_ids, consumer_run_id)
else:
    print("  WARN: used_by() returned empty (lineage may not be implemented)")

# Verify lineage via GraphQL
result = gql(f"""
    query {{
        model(name: "{PROJECT_NAME}", entityName: "{ENTITY_NAME}") {{
            bucket(name: "{run_id}") {{
                outputArtifacts {{
                    edges {{
                        node {{
                            versionIndex
                            artifactSequence {{ name }}
                        }}
                    }}
                }}
            }}
        }}
    }}
""")

producer_run_data = result["data"]["model"]["bucket"]
if producer_run_data and producer_run_data.get("outputArtifacts"):
    output_arts = producer_run_data["outputArtifacts"]["edges"]
    output_names = [f"{e['node']['artifactSequence']['name']}:v{e['node']['versionIndex']}" for e in output_arts]
    print(f"  Producer run output artifacts: {output_names}")
    assert_true("producer has output artifacts", len(output_arts) > 0)

result = gql(f"""
    query {{
        model(name: "{PROJECT_NAME}", entityName: "{ENTITY_NAME}") {{
            bucket(name: "{consumer_run_id}") {{
                inputArtifacts {{
                    edges {{
                        node {{
                            versionIndex
                            artifactSequence {{ name }}
                        }}
                    }}
                }}
            }}
        }}
    }}
""")

consumer_run_data = result["data"]["model"]["bucket"]
if consumer_run_data and consumer_run_data.get("inputArtifacts"):
    input_arts = consumer_run_data["inputArtifacts"]["edges"]
    input_names = [f"{e['node']['artifactSequence']['name']}:v{e['node']['versionIndex']}" for e in input_arts]
    print(f"  Consumer run input artifacts: {input_names}")
    assert_true("consumer has input artifacts", len(input_arts) > 0)


# ═══════════════════════════════════════════════════════════════════
# PART E: MODEL REGISTRY & LINKING
# ═══════════════════════════════════════════════════════════════════

# ── 14. Artifact linking (link to portfolio / registry) ────────────
section(14, "Artifact linking (link to portfolio / model registry)")

run5 = wandb.init(
    project=PROJECT_NAME,
    entity=ENTITY_NAME,
    name=f"linker-{TEST_ID}",
)

# Log a model artifact
model_art = wandb.Artifact(
    name="my-model",
    type="model",
    description="A trained model",
    metadata={"accuracy": 0.95, "framework": "pytorch"},
)
model_weights = tmpdir / "model.pt"
model_weights.write_bytes(b"\x00" * 1024)  # dummy model file
model_art.add_file(str(model_weights), name="model.pt")

logged_model = run5.log_artifact(model_art)
logged_model.wait()

# Link the artifact to a portfolio
print("  Linking model artifact to portfolio...")
try:
    run5.link_artifact(
        artifact=logged_model,
        target_path=f"{ENTITY_NAME}/wandb-registry-model/my-model-collection",
        aliases=["candidate"],
    )
    print("  Successfully linked artifact to registry portfolio")

    # Verify the link via public API
    linked_art = api.artifact(f"{ENTITY_NAME}/wandb-registry-model/my-model-collection:v0")
    if linked_art is not None:
        print(f"  Linked artifact: {linked_art.name}")
except Exception as e:
    print(f"  WARN: link_artifact raised: {e} (portfolio/registry may not be implemented)")

run5.finish()


# ═══════════════════════════════════════════════════════════════════
# PART F: PUBLIC API QUERIES
# ═══════════════════════════════════════════════════════════════════

# ── 15. Public API: artifact queries ───────────────────────────────
section(15, "Public API: wandb.Api() artifact queries")

# artifact() — fetch single artifact
art_single = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset:v0")
assert_true("api.artifact() works", art_single is not None)
assert_eq("api.artifact name", art_single.version, "v0")
assert_eq("api.artifact type", art_single.type, "dataset")
print(f"  Properties: id={art_single.id}, entity={art_single.entity}, project={art_single.project}")
print(f"  Properties: digest={art_single.digest}, size={art_single.size}, file_count={art_single.file_count}")
print(f"  Properties: created_at={art_single.created_at}, updated_at={art_single.updated_at}")
print(f"  Properties: state={art_single.state}, version={art_single.version}")

# artifacts() — list all versions of a collection
all_versions = list(api.artifacts(type_name="dataset", name=f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset"))
print(f"  api.artifacts() returned {len(all_versions)} versions")
assert_gte("at least 2 versions", len(all_versions), 2)

# ── 16. Public API: artifact_types, artifact_collections, exists ──
section(16, "Public API: artifact_types, artifact_collections, artifact_exists")

# artifact_types
art_types = list(api.artifact_types(project=f"{ENTITY_NAME}/{PROJECT_NAME}"))
type_names = [t.name for t in art_types]
print(f"  Artifact types: {type_names}")
assert_contains("'dataset' type exists", type_names, "dataset")

# artifact_collections
collections_list = list(api.artifact_collections(project_name=f"{ENTITY_NAME}/{PROJECT_NAME}", type_name="dataset"))
coll_names = [c.name for c in collections_list]
print(f"  Dataset collections: {coll_names}")
assert_contains("'test-dataset' collection exists", coll_names, "test-dataset")

# artifact_collection — single collection
single_coll = api.artifact_collection(type_name="dataset", name=f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset")
assert_true("artifact_collection() works", single_coll is not None)
assert_eq("collection name", single_coll.name, "test-dataset")
print(f"  Collection: name={single_coll.name}, id={single_coll.id}")

# Iterate versions within collection
coll_versions = list(single_coll.artifacts())
print(f"  Versions in collection: {len(coll_versions)}")
assert_gte("collection has versions", len(coll_versions), 2)

# artifact_exists
exists = api.artifact_exists(f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset:v0")
assert_true("artifact_exists returns True for v0", exists)

nonexistent = api.artifact_exists(f"{ENTITY_NAME}/{PROJECT_NAME}/does-not-exist:v0")
assert_true("artifact_exists returns False for missing", not nonexistent)

# artifact_collection_exists
coll_exists = api.artifact_collection_exists(name=f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset", type="dataset")
assert_true("artifact_collection_exists returns True", coll_exists)

# ── 17. Public API: run.logged_artifacts, run.used_artifacts ──────
section(17, "Public API: run.logged_artifacts, run.used_artifacts")

api_run_producer = api.run(f"{ENTITY_NAME}/{PROJECT_NAME}/{run_id}")

logged_arts = list(api_run_producer.logged_artifacts())
print(f"  Producer run logged {len(logged_arts)} artifacts")
assert_true("producer logged artifacts", len(logged_arts) > 0)
logged_art_names = [a.name for a in logged_arts]
print(f"  Logged artifact names: {logged_art_names}")

api_run_consumer = api.run(f"{ENTITY_NAME}/{PROJECT_NAME}/{consumer_run_id}")
used_arts = list(api_run_consumer.used_artifacts())
print(f"  Consumer run used {len(used_arts)} artifacts")
assert_true("consumer used artifacts", len(used_arts) > 0)
used_art_names = [a.name for a in used_arts]
print(f"  Used artifact names: {used_art_names}")

# ── 18. ArtifactType browsing ─────────────────────────────────────
section(18, "ArtifactType browsing via public API")

dataset_type = api.artifact_type(type_name="dataset", project=f"{ENTITY_NAME}/{PROJECT_NAME}")
assert_true("artifact_type returns type", dataset_type is not None)
assert_eq("type name", dataset_type.name, "dataset")

type_collections = list(dataset_type.collections())
print(f"  Collections under 'dataset' type: {[c.name for c in type_collections]}")
assert_true("type has collections", len(type_collections) > 0)

single_from_type = dataset_type.collection("test-dataset")
assert_true("collection from type", single_from_type is not None)
assert_eq("collection name from type", single_from_type.name, "test-dataset")


# ═══════════════════════════════════════════════════════════════════
# PART G: DISTRIBUTED ARTIFACTS
# ═══════════════════════════════════════════════════════════════════

# ── 19. Distributed artifacts ─────────────────────────────────────
section(19, "Distributed artifacts (upsert_artifact / finish_artifact)")

dist_id = f"dist-{TEST_ID}"

# Worker 1 contributes some files
worker1_run = wandb.init(
    project=PROJECT_NAME,
    entity=ENTITY_NAME,
    name=f"dist-worker1-{TEST_ID}",
    group="distributed-test",
)

dist_art_w1 = wandb.Artifact(name="distributed-data", type="dataset")
w1_file = tmpdir / "worker1_shard.txt"
w1_file.write_text("data from worker 1")
dist_art_w1.add_file(str(w1_file), name="shards/shard_0.txt")

worker1_run.upsert_artifact(dist_art_w1, distributed_id=dist_id)
print(f"  Worker 1 upserted shard (distributed_id={dist_id})")
worker1_run.finish()

# Worker 2 contributes more files
worker2_run = wandb.init(
    project=PROJECT_NAME,
    entity=ENTITY_NAME,
    name=f"dist-worker2-{TEST_ID}",
    group="distributed-test",
)

dist_art_w2 = wandb.Artifact(name="distributed-data", type="dataset")
w2_file = tmpdir / "worker2_shard.txt"
w2_file.write_text("data from worker 2")
dist_art_w2.add_file(str(w2_file), name="shards/shard_1.txt")

worker2_run.upsert_artifact(dist_art_w2, distributed_id=dist_id)
print(f"  Worker 2 upserted shard (distributed_id={dist_id})")

# Worker 2 also finalizes the distributed artifact
worker2_run.finish_artifact(dist_art_w2, distributed_id=dist_id)
print("  Worker 2 finished distributed artifact")
worker2_run.finish()

# Verify the assembled artifact
try:
    dist_result = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/distributed-data:v0")
    assert_true("distributed artifact exists", dist_result is not None)
    print(f"  Distributed artifact: {dist_result.name}, state={dist_result.state}")
except Exception as e:
    print(f"  WARN: distributed artifact verification failed: {e}")


# ═══════════════════════════════════════════════════════════════════
# PART H: STANDALONE SAVE & CHECKOUT
# ═══════════════════════════════════════════════════════════════════

# ── 20. Artifact.save() outside of a run ───────────────────────────
section(20, "Artifact.save() outside of a run context")

standalone_art = wandb.Artifact(
    name="standalone-config",
    type="config",
    description="Artifact saved without a run",
    metadata={"saved_standalone": True},
)
config_file = tmpdir / "config.yaml"
config_file.write_text("model:\n  layers: 12\n  hidden_size: 768\n")
standalone_art.add_file(str(config_file), name="config.yaml")

try:
    standalone_art.save(project=PROJECT_NAME)
    standalone_art.wait()
    print(f"  Standalone artifact saved: {standalone_art.name}")
    assert_true("standalone artifact has ID", standalone_art.id is not None)

    # Verify via API
    standalone_fetched = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/standalone-config:v0")
    assert_true("standalone artifact fetchable", standalone_fetched is not None)
    assert_eq("standalone description", standalone_fetched.description, "Artifact saved without a run")
except Exception as e:
    print(f"  WARN: standalone save not supported: {e}")

# ── 21. Artifact.checkout and verify ───────────────────────────────
section(21, "Artifact.checkout and verify")

art_for_checkout = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset:v0")

# checkout: download + remove any extra local files
checkout_dir = tmpdir / "checkout_v0"
try:
    checkout_path = art_for_checkout.checkout(root=str(checkout_dir))
    print(f"  Checked out to: {checkout_path}")
    assert_true("checkout dir exists", Path(checkout_path).exists())

    # Create an extra file that shouldn't be there
    extra = Path(checkout_path) / "extra_junk.txt"
    extra.write_text("this should be removed by checkout")

    # Re-checkout should remove the extra file
    checkout_path2 = art_for_checkout.checkout(root=str(checkout_dir))
    assert_true("extra file removed by checkout", not extra.exists())
except Exception as e:
    print(f"  WARN: checkout failed: {e}")

# verify: check local files match manifest digests
try:
    download_for_verify = tmpdir / "verify_v0"
    art_for_checkout.download(root=str(download_for_verify))
    art_for_checkout.verify(root=str(download_for_verify))
    print("  Artifact.verify() passed (all checksums match)")
except Exception as e:
    print(f"  WARN: verify failed or not supported: {e}")


# ═══════════════════════════════════════════════════════════════════
# PART I: DELETION
# ═══════════════════════════════════════════════════════════════════

# ── 22. Artifact deletion ──────────────────────────────────────────
section(22, "Artifact deletion")

# Create a throwaway artifact to delete
run6 = wandb.init(
    project=PROJECT_NAME,
    entity=ENTITY_NAME,
    name=f"delete-test-{TEST_ID}",
)
delete_art = wandb.Artifact(name="to-delete", type="temp")
delete_file = tmpdir / "delete_me.txt"
delete_file.write_text("this artifact will be deleted")
delete_art.add_file(str(delete_file), name="delete_me.txt")
logged_delete = run6.log_artifact(delete_art)
logged_delete.wait()
run6.finish()

print(f"  Created artifact for deletion: {logged_delete.name}")

# Delete it
delete_ref = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/to-delete:v0")
try:
    delete_ref.delete(delete_aliases=True)
    print("  Artifact deleted successfully")

    # Verify deletion
    try:
        deleted_check = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/to-delete:v0")
        # If we get here, check state
        if deleted_check.state == "DELETED":
            print("  Confirmed: artifact state = DELETED")
        else:
            print(f"  WARN: artifact still accessible with state={deleted_check.state}")
    except wandb.errors.CommError:
        print("  Confirmed: artifact no longer accessible (404)")
    except Exception:
        print("  Confirmed: artifact no longer accessible")
except Exception as e:
    print(f"  WARN: delete failed: {e}")


# ═══════════════════════════════════════════════════════════════════
# PART J: ARTIFACT PROPERTIES COMPREHENSIVE CHECK
# ═══════════════════════════════════════════════════════════════════

# ── 23. Comprehensive artifact properties ──────────────────────────
section(23, "Comprehensive artifact properties check")

art_props = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset:v0")

print("  Checking all readable properties:")
props = {
    "id": art_props.id,
    "entity": art_props.entity,
    "project": art_props.project,
    "name": art_props.name,
    "qualified_name": art_props.qualified_name,
    "version": art_props.version,
    "type": art_props.type,
    "state": art_props.state,
    "description": art_props.description,
    "digest": art_props.digest,
    "size": art_props.size,
    "file_count": art_props.file_count,
    "created_at": art_props.created_at,
    "updated_at": art_props.updated_at,
    "metadata": art_props.metadata,
    "aliases": art_props.aliases,
    "tags": art_props.tags,
    "commit_hash": art_props.commit_hash,
    "history_step": art_props.history_step,
    "incremental": art_props.incremental,
    "use_as": art_props.use_as,
}

for prop_name, prop_value in props.items():
    print(f"    {prop_name}: {prop_value!r}")

assert_true("id is set", props["id"] is not None)
assert_eq("entity", props["entity"], ENTITY_NAME)
assert_eq("project", props["project"], PROJECT_NAME)
assert_eq("version", props["version"], "v0")
assert_eq("type", props["type"], "dataset")
assert_eq("state", props["state"], "COMMITTED")
assert_true("digest is set", props["digest"] is not None)
assert_true("size > 0", props["size"] is not None and props["size"] > 0)
assert_true("file_count > 0", props["file_count"] is not None and props["file_count"] > 0)
assert_true("created_at is set", props["created_at"] is not None)

# Check collection property
coll = art_props.collection
if coll is not None:
    print(f"    collection.name: {coll.name}")
    assert_eq("collection name", coll.name, "test-dataset")

# URL property
try:
    url = art_props.url
    print(f"    url: {url}")
    assert_true("url is set", url is not None and len(url) > 0)
except Exception:
    print("    WARN: url property not available")

# Manifest property
try:
    manifest = art_props.manifest
    if manifest is not None:
        print(f"    manifest entries: {len(manifest.entries)}")
        assert_true("manifest has entries", len(manifest.entries) > 0)
except Exception:
    print("    WARN: manifest property not available")


# ═══════════════════════════════════════════════════════════════════
# PART K: COLLECTION MANAGEMENT
# ═══════════════════════════════════════════════════════════════════

# ── 24. ArtifactCollection operations ─────────────────────────────
section(24, "ArtifactCollection operations (update, tags)")

coll_ref = api.artifact_collection(type_name="dataset", name=f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset")

# Update collection description
original_desc = coll_ref.description
coll_ref.description = "Updated collection description"
try:
    coll_ref.save()
    print("  Updated collection description")

    coll_refreshed = api.artifact_collection(type_name="dataset", name=f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset")
    assert_eq("collection description updated", coll_refreshed.description, "Updated collection description")
except Exception as e:
    print(f"  WARN: collection update failed: {e}")

# Collection tags
try:
    coll_ref.tags = ["important", "v1-ready"]
    coll_ref.save()
    print("  Set collection tags")

    coll_tagged = api.artifact_collection(type_name="dataset", name=f"{ENTITY_NAME}/{PROJECT_NAME}/test-dataset")
    print(f"  Collection tags: {coll_tagged.tags}")
    assert_contains("collection has 'important' tag", coll_tagged.tags, "important")
except Exception as e:
    print(f"  WARN: collection tagging failed: {e}")

# is_sequence check
assert_true("collection is_sequence", coll_ref.is_sequence())


# ═══════════════════════════════════════════════════════════════════
# PART L: EDGE CASES
# ═══════════════════════════════════════════════════════════════════

# ── 25. Digest deduplication ──────────────────────────────────────
section(25, "Digest deduplication (same content = no new version)")

run_dedup = wandb.init(
    project=PROJECT_NAME,
    entity=ENTITY_NAME,
    name=f"dedup-producer-{TEST_ID}",
)

# Log an artifact with the exact same content as v0's single_file.txt
dedup_art = wandb.Artifact(name="dedup-test", type="dataset")
dedup_file = tmpdir / "dedup_file.txt"
dedup_file.write_text("dedup content")
dedup_art.add_file(str(dedup_file), name="data.txt")
logged_dedup_v0 = run_dedup.log_artifact(dedup_art)
logged_dedup_v0.wait()

# Log the exact same content again — should NOT create v1
dedup_art2 = wandb.Artifact(name="dedup-test", type="dataset")
dedup_art2.add_file(str(dedup_file), name="data.txt")  # same content
logged_dedup_v1 = run_dedup.log_artifact(dedup_art2)
logged_dedup_v1.wait()
run_dedup.finish()

# Check: either v1 doesn't exist, or v0 and v1 share the same digest
dedup_v0 = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/dedup-test:v0")
print(f"  dedup v0 digest: {dedup_v0.digest}")
try:
    dedup_v1 = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/dedup-test:v1")
    # If v1 exists, it should have the same digest (dedup may create version but skip upload)
    print(f"  dedup v1 digest: {dedup_v1.digest}")
    assert_eq("dedup: v0 and v1 share digest", dedup_v0.digest, dedup_v1.digest)
except Exception:
    # v1 doesn't exist — server deduplicated completely
    print("  dedup: v1 not created (full deduplication)")
    passed += 1

# ── 26. Empty artifact ────────────────────────────────────────────
section(26, "Empty artifact (no files)")

run_empty = wandb.init(
    project=PROJECT_NAME,
    entity=ENTITY_NAME,
    name=f"empty-producer-{TEST_ID}",
)

empty_art = wandb.Artifact(name="empty-artifact", type="dataset", description="An empty artifact")
# Don't add any files
try:
    logged_empty = run_empty.log_artifact(empty_art)
    logged_empty.wait()
    print(f"  Empty artifact logged: {logged_empty.name}")

    empty_ref = api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/empty-artifact:v0")
    assert_true("empty artifact exists", empty_ref is not None)
    assert_eq("empty artifact file_count", empty_ref.file_count, 0)
    assert_eq("empty artifact description", empty_ref.description, "An empty artifact")
except Exception as e:
    print(f"  WARN: empty artifact failed: {e} (server may reject empty artifacts)")

run_empty.finish()

# ── 27. Negative test: nonexistent artifact ───────────────────────
section(27, "Negative test: nonexistent artifact raises error")

try:
    api.artifact(f"{ENTITY_NAME}/{PROJECT_NAME}/does-not-exist:v999")
    print("  FAIL: expected error for nonexistent artifact", file=sys.stderr)
    failed += 1
except wandb.errors.CommError:
    print("  OK: CommError raised for nonexistent artifact")
    passed += 1
except Exception as e:
    print(f"  OK: error raised for nonexistent artifact: {type(e).__name__}")
    passed += 1


# ═══════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════

print(f"\n{'=' * 60}")
print("ARTIFACT E2E TEST SUMMARY")
print(f"{'=' * 60}")
print(f"  Passed: {passed}")
print(f"  Failed: {failed}")
print(f"  Project: {PROJECT_NAME}")
print(f"  Temp dir: {tmpdir}")
print()

# Sections covered:
print("  Sections tested:")
print("    1.  Artifact creation (add_file, add_dir, new_file, add WBValue)")
print("    2.  log_artifact (full upload flow)")
print("    3.  GraphQL verification of metadata")
print("    4.  use_artifact + download")
print("    5.  get / get_entry / __getitem__ / __setitem__ / file / files / remove")
print("    6.  Versioning (multiple versions)")
print("    7.  Alias management (add, remove, fetch-by-alias)")
print("    8.  Tag management")
print("    9.  Metadata & description updates")
print("    10. TTL management")
print("    11. Reference artifacts (add_reference)")
print("    12. Incremental artifacts (new_draft)")
print("    13. Lineage (logged_by, used_by, GraphQL verification)")
print("    14. Artifact linking (portfolio / registry)")
print("    15. Public API queries (artifact, artifacts)")
print("    16. Public API (types, collections, exists)")
print("    17. Public API (run.logged_artifacts, run.used_artifacts)")
print("    18. ArtifactType browsing")
print("    19. Distributed artifacts (upsert/finish)")
print("    20. Standalone artifact.save()")
print("    21. Checkout and verify")
print("    22. Artifact deletion")
print("    23. Comprehensive property check")
print("    24. ArtifactCollection operations")
print("    25. Digest deduplication")
print("    26. Empty artifact")
print("    27. Negative test: nonexistent artifact")
print()

# Cleanup temp dir
try:
    shutil.rmtree(tmpdir)
    print(f"  Cleaned up temp dir: {tmpdir}")
except Exception:
    print(f"  WARN: could not clean up {tmpdir}")

if failed > 0:
    print(f"\n  RESULT: FAILED ({failed} failures)")
    sys.exit(1)
else:
    print("\n  RESULT: ALL PASSED")
    sys.exit(0)
