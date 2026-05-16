#!/usr/bin/env python3
"""
Verify backend-unlocks mutations work end-to-end against the bandw server.

Uses raw GraphQL queries to test mutations directly, avoiding SDK artifact
upload issues with wandb-core.

Usage:
    # Start the bandw server first, then:
    WANDB_BASE_URL=http://127.0.0.1:<port> \
    WANDB_API_KEY=1dbac5a5d91172ad159b7978bec36bb8c3b0a5f5 \  # gitleaks:allow (local dev key)
    WANDB_ENTITY=admin \
    uv run python scripts/verify_backend_unlocks.py
"""

import json
import os
import sys
import uuid

import requests

import wandb

ENTITY = os.environ.get("WANDB_ENTITY", "admin")
PROJECT = "backend-unlocks-verify"
BASE_URL = os.environ["WANDB_BASE_URL"]
API_KEY = os.environ["WANDB_API_KEY"]
PASSED = 0
FAILED = 0


def check(name: str, condition: bool, detail: str = ""):
    global PASSED, FAILED
    if condition:
        PASSED += 1
        print(f"  PASS: {name}")
    else:
        FAILED += 1
        print(f"  FAIL: {name} -- {detail}")


def gql(query: str, variables: dict = None) -> dict:
    """Execute a GraphQL query against the bandw server."""
    resp = requests.post(
        f"{BASE_URL}/graphql",
        json={"query": query, "variables": variables or {}},
        auth=("api", API_KEY),
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    if "errors" in data:
        raise Exception(f"GraphQL errors: {data['errors']}")
    return data["data"]


def create_test_run() -> str:
    """Create a run via the SDK and return its ID."""
    run = wandb.init(project=PROJECT, entity=ENTITY, config={"test": True})
    run.log({"metric": 1.0})
    run.finish()
    return run.id


def create_test_artifact(run_name: str, art_name: str, art_type: str = "dataset") -> str:
    """Create an artifact via GraphQL (no file upload needed) and return its ID."""
    client_id = str(uuid.uuid4())
    seq_client_id = str(uuid.uuid4())

    data = gql(
        """
        mutation CreateArtifact($input: CreateArtifactInput!) {
            createArtifact(input: $input) {
                artifact { id state versionIndex }
            }
        }
    """,
        {
            "input": {
                "entityName": ENTITY,
                "projectName": PROJECT,
                "runName": run_name,
                "artifactTypeName": art_type,
                "artifactCollectionName": art_name,
                "digest": "abc123",
                "digestAlgorithm": "MANIFEST_MD5",
                "description": "test artifact",
                "aliases": [],
                "clientID": client_id,
                "sequenceClientID": seq_client_id,
                "enableDigestDeduplication": False,
            }
        },
    )
    art_id = data["createArtifact"]["artifact"]["id"]

    # Commit the artifact so it gets aliases
    gql(
        """
        mutation CommitArtifact($input: CommitArtifactInput!) {
            commitArtifact(input: $input) {
                artifact { id state }
            }
        }
    """,
        {"input": {"artifactID": art_id}},
    )

    return art_id


# ── S1: createRunFiles ──────────────────────────────────────────────


def test_s1_create_run_files():
    """S1: createRunFiles is called implicitly when a run finishes."""
    print("\n=== S1: createRunFiles ===")
    run = wandb.init(project=PROJECT, entity=ENTITY, config={"lr": 0.01})
    run.log({"loss": 0.5, "acc": 0.8})
    run.finish()
    check("run completed without error", run.id is not None)
    check("run has valid ID", len(run.id) > 0, f"got: {run.id}")

    # Also test createRunFiles directly via GraphQL
    data = gql(
        """
        mutation CreateRunFiles($input: CreateRunFilesInput!) {
            createRunFiles(input: $input) {
                runID
                uploadHeaders
                files { name uploadUrl }
            }
        }
    """,
        {
            "input": {
                "entityName": ENTITY,
                "projectName": PROJECT,
                "runName": run.id,
                "files": ["config.yaml", "wandb-summary.json"],
            }
        },
    )
    payload = data["createRunFiles"]
    check(
        "createRunFiles returns runID",
        payload["runID"] is not None and len(payload["runID"]) > 0,
        f"got: {payload['runID']}",
    )
    check("createRunFiles returns files", len(payload["files"]) == 2, f"got: {len(payload['files'])} files")
    check("files have uploadUrl", all(f["uploadUrl"] for f in payload["files"]), f"got: {payload['files']}")


# ── S4: updateArtifact ──────────────────────────────────────────────


def test_s4_update_artifact():
    """S4: updateArtifact mutation."""
    print("\n=== S4: updateArtifact ===")
    run_id = create_test_run()
    art_id = create_test_artifact(run_id, "test-update-art")

    # Update description
    data = gql(
        """
        mutation UpdateArtifact($input: UpdateArtifactInput!) {
            updateArtifact(input: $input) {
                artifact { id description metadata }
            }
        }
    """,
        {
            "input": {
                "artifactID": art_id,
                "description": "Updated description",
            }
        },
    )
    check(
        "description updated",
        data["updateArtifact"]["artifact"]["description"] == "Updated description",
        f"got: {data['updateArtifact']['artifact']['description']}",
    )

    # Update metadata
    data = gql(
        """
        mutation UpdateArtifact($input: UpdateArtifactInput!) {
            updateArtifact(input: $input) {
                artifact { id description metadata }
            }
        }
    """,
        {
            "input": {
                "artifactID": art_id,
                "metadata": json.dumps({"key": "value", "num": 42}),
            }
        },
    )
    meta = json.loads(data["updateArtifact"]["artifact"]["metadata"])
    check("metadata updated", meta.get("key") == "value", f"got: {meta}")


# ── S5: addAliases / deleteAliases ──────────────────────────────────


def test_s5_aliases():
    """S5: addAliases / deleteAliases."""
    print("\n=== S5: addAliases / deleteAliases ===")
    run_id = create_test_run()
    art_id = create_test_artifact(run_id, "test-alias-art")

    # Add alias
    data = gql(
        """
        mutation AddAliases($input: AddAliasesInput!) {
            addAliases(input: $input) { success }
        }
    """,
        {
            "input": {
                "artifactID": art_id,
                "aliases": [{"alias": "production", "artifactCollectionName": "test-alias-art"}],
            }
        },
    )
    check("addAliases succeeds", data["addAliases"]["success"] is True)

    # Verify alias exists
    data = gql(
        f"""
        query {{ artifact(id: "{art_id}") {{ aliases {{ alias }} }} }}
    """
    )
    aliases = [a["alias"] for a in data["artifact"]["aliases"]]
    check("'production' alias present", "production" in aliases, f"got: {aliases}")

    # Delete alias
    data = gql(
        """
        mutation DeleteAliases($input: DeleteAliasesInput!) {
            deleteAliases(input: $input) { success }
        }
    """,
        {
            "input": {
                "artifactID": art_id,
                "aliases": [{"alias": "production", "artifactCollectionName": "test-alias-art"}],
            }
        },
    )
    check("deleteAliases succeeds", data["deleteAliases"]["success"] is True)

    # Verify alias removed
    data = gql(
        f"""
        query {{ artifact(id: "{art_id}") {{ aliases {{ alias }} }} }}
    """
    )
    aliases = [a["alias"] for a in data["artifact"]["aliases"]]
    check("'production' alias removed", "production" not in aliases, f"got: {aliases}")


# ── S6: deleteArtifact ──────────────────────────────────────────────


def test_s6_delete_artifact():
    """S6: deleteArtifact / deleteArtifactSequence."""
    print("\n=== S6: deleteArtifact / deleteSequence ===")
    run_id = create_test_run()
    art_id = create_test_artifact(run_id, "test-delete-art")

    # Delete artifact
    data = gql(
        """
        mutation DeleteArtifact($input: DeleteArtifactInput!) {
            deleteArtifact(input: $input) {
                artifact { id state }
            }
        }
    """,
        {"input": {"artifactID": art_id, "deleteAliases": True}},
    )
    check(
        "deleteArtifact returns DELETED state",
        data["deleteArtifact"]["artifact"]["state"] == "DELETED",
        f"got: {data['deleteArtifact']['artifact']}",
    )

    # Create another artifact to test sequence deletion
    art_id2 = create_test_artifact(run_id, "test-delete-seq")

    # Get the collection ID
    data = gql(
        f"""
        query {{ artifact(id: "{art_id2}") {{ artifactSequence {{ id }} }} }}
    """
    )
    seq_id = data["artifact"]["artifactSequence"]["id"]

    data = gql(
        """
        mutation DeleteArtifactSequence($input: DeleteArtifactSequenceInput!) {
            deleteArtifactSequence(input: $input) {
                artifactCollection { id state }
            }
        }
    """,
        {"input": {"artifactSequenceID": seq_id}},
    )
    check(
        "deleteArtifactSequence returns deleted state",
        data["deleteArtifactSequence"]["artifactCollection"]["state"] == "deleted",
        f"got: {data['deleteArtifactSequence']['artifactCollection']}",
    )


# ── S7: linkArtifact / unlinkArtifact ───────────────────────────────


def test_s7_link_unlink():
    """S7: linkArtifact / unlinkArtifact + updateArtifactSequence."""
    print("\n=== S7: linkArtifact / unlinkArtifact ===")
    run_id = create_test_run()
    art_id = create_test_artifact(run_id, "test-link-art", "model")

    # Link artifact to a portfolio
    data = gql(
        """
        mutation LinkArtifact($input: LinkArtifactInput!) {
            linkArtifact(input: $input) { versionIndex }
        }
    """,
        {
            "input": {
                "artifactPortfolioName": "test-portfolio",
                "entityName": ENTITY,
                "projectName": PROJECT,
                "artifactID": art_id,
            }
        },
    )
    check(
        "linkArtifact returns versionIndex",
        data["linkArtifact"]["versionIndex"] is not None,
        f"got: {data['linkArtifact']}",
    )

    # Unlink artifact from portfolio
    data = gql(
        """
        mutation UnlinkArtifact($input: UnlinkArtifactInput!) {
            unlinkArtifact(input: $input) { success }
        }
    """,
        {
            "input": {
                "artifactID": art_id,
                "portfolioName": "test-portfolio",
                "entityName": ENTITY,
                "projectName": PROJECT,
            }
        },
    )
    check("unlinkArtifact succeeds", data["unlinkArtifact"]["success"] is True)

    # Test updateArtifactSequence
    data = gql(
        f"""
        query {{ artifact(id: "{art_id}") {{ artifactSequence {{ id }} }} }}
    """
    )
    seq_id = data["artifact"]["artifactSequence"]["id"]

    data = gql(
        """
        mutation UpdateArtifactSequence($input: UpdateArtifactSequenceInput!) {
            updateArtifactSequence(input: $input) {
                artifactCollection { id name description }
            }
        }
    """,
        {
            "input": {
                "artifactSequenceID": seq_id,
                "description": "Updated sequence description",
            }
        },
    )
    check(
        "updateArtifactSequence description updated",
        data["updateArtifactSequence"]["artifactCollection"]["description"] == "Updated sequence description",
        f"got: {data['updateArtifactSequence']['artifactCollection']}",
    )

    # Test tag assignments
    data = gql(
        f"""
        query {{ artifact(id: "{art_id}") {{ artifactSequence {{ id }} }} }}
    """
    )
    coll_id = data["artifact"]["artifactSequence"]["id"]

    data = gql(
        """
        mutation CreateTags($input: CreateArtifactCollectionTagAssignmentsInput!) {
            createArtifactCollectionTagAssignments(input: $input) {
                tags { id name }
            }
        }
    """,
        {
            "input": {
                "artifactCollectionID": coll_id,
                "tags": [{"tagName": "production"}, {"tagName": "v1"}],
            }
        },
    )
    tags = data["createArtifactCollectionTagAssignments"]["tags"]
    check("tag assignments created", len(tags) == 2, f"got: {tags}")

    # Delete tag assignment
    data = gql(
        """
        mutation DeleteTags($input: DeleteArtifactCollectionTagAssignmentsInput!) {
            deleteArtifactCollectionTagAssignments(input: $input) { success }
        }
    """,
        {
            "input": {
                "artifactCollectionID": coll_id,
                "tags": [{"tagName": "v1"}],
            }
        },
    )
    check("tag assignment deleted", data["deleteArtifactCollectionTagAssignments"]["success"] is True)


def main():
    print("=" * 60)
    print("Backend Unlocks SDK Verification")
    print(f"Server: {BASE_URL}")
    print("=" * 60)

    test_s1_create_run_files()
    test_s4_update_artifact()
    test_s5_aliases()
    test_s6_delete_artifact()
    test_s7_link_unlink()

    print("\n" + "=" * 60)
    print(f"Results: {PASSED} passed, {FAILED} failed")
    print("=" * 60)

    sys.exit(0 if FAILED == 0 else 1)


if __name__ == "__main__":
    main()
