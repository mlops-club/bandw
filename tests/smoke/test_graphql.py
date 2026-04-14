"""Smoke test: write and read a run via the GraphQL API.

Usage:
    1. Start the server:  PORT=8081 go run ./cmd/server/
    2. Run this script:   uv run python tests/smoke/test_graphql.py

Override the server URL:
    BANDW_URL=http://localhost:9090 uv run python tests/smoke/test_graphql.py
"""

import json
import os
import sys

import requests

BASE = os.environ.get("BANDW_URL", "http://localhost:8081")
API_KEY = "1dbac5a5d91172ad159b7978bec36bb8c3b0a5f5"
GQL = f"{BASE}/graphql"
AUTH = ("api", API_KEY)


def gql(query: str) -> dict:
    r = requests.post(GQL, json={"query": query}, auth=AUTH)
    r.raise_for_status()
    return r.json()


def main():
    # ── Step 1: Write — create a run via upsertBucket ──────────────
    print("1) Creating run via upsertBucket...")
    result = gql("""
        mutation {
            upsertBucket(input: {
                name: "smoke-run-1"
                modelName: "smoke-project"
                entityName: "admin"
                config: "{\\"lr\\": 0.001, \\"epochs\\": 10}"
            }) {
                bucket { id name config project { name entity { name } } }
                inserted
            }
        }
    """)

    if "errors" in result:
        print(f"FAIL: {json.dumps(result['errors'], indent=2)}", file=sys.stderr)
        sys.exit(1)

    payload = result["data"]["upsertBucket"]
    bucket = payload["bucket"]
    print(f"   inserted: {payload['inserted']}")
    print(f"   run:      {bucket['name']}  (id={bucket['id'][:8]}...)")
    print(f"   project:  {bucket['project']['entity']['name']}/{bucket['project']['name']}")
    print(f"   config:   {bucket['config']}")

    # ── Step 2: Read — query it back via model() ───────────────────
    print("\n2) Reading run back via model query...")
    result = gql("""
        query {
            model(name: "smoke-project", entityName: "admin") {
                id name
                bucket(name: "smoke-run-1", missingOk: false) {
                    id name config state createdAt historyLineCount
                }
            }
        }
    """)

    if "errors" in result:
        print(f"FAIL: {json.dumps(result['errors'], indent=2)}", file=sys.stderr)
        sys.exit(1)

    project = result["data"]["model"]
    run = project["bucket"]
    print(f"   project:  {project['name']}  (id={project['id'][:8]}...)")
    print(f"   run:      {run['name']}")
    print(f"   state:    {run['state']}")
    print(f"   config:   {run['config']}")
    print(f"   created:  {run['createdAt']}")

    # ── Step 3: Update — upsert again with summaryMetrics ──────────
    print("\n3) Updating run with summary metrics...")
    result = gql("""
        mutation {
            upsertBucket(input: {
                name: "smoke-run-1"
                modelName: "smoke-project"
                entityName: "admin"
                summaryMetrics: "{\\"loss\\": 0.42, \\"accuracy\\": 0.95}"
            }) {
                bucket { name summaryMetrics }
                inserted
            }
        }
    """)

    if "errors" in result:
        print(f"FAIL: {json.dumps(result['errors'], indent=2)}", file=sys.stderr)
        sys.exit(1)

    payload = result["data"]["upsertBucket"]
    print(f"   inserted: {payload['inserted']}  (should be false — update)")
    print(f"   metrics:  {payload['bucket']['summaryMetrics']}")

    print("\nPASS: all smoke tests passed")


if __name__ == "__main__":
    main()
