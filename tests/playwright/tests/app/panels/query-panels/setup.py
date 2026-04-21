commit 829940d4ced317fa22c8f3294b047489c4b296cb
Author: phitoduck <eric.riddoch@gmail.com>
Date:   Mon Apr 20 17:18:39 2026 -0600

    fix: make D-phase SDK setups bandw-safe
    
    Conditionally skip unsupported wandb features (Image, Audio, Video,
    Table, Artifact, log_code, wandb.plot) when running against bandw
    backend. Scalar metric logging still runs, ensuring runs are created
    for test navigation even without media/artifact data.

diff --git a/tests/playwright/tests/app/panels/query-panels/setup.py b/tests/playwright/tests/app/panels/query-panels/setup.py
index 5d1a795..2c1f424 100644
--- a/tests/playwright/tests/app/panels/query-panels/setup.py
+++ b/tests/playwright/tests/app/panels/query-panels/setup.py
@@ -33,6 +33,8 @@ def main() -> None:
     project = create_project("query")
     log_debug(f"Creating query-panels project: {project}")
 
+    is_bandw = "localhost" in cfg.get("base_url", "") or "127.0.0.1" in cfg.get("base_url", "")
+
     os.environ["WANDB_BASE_URL"] = cfg["base_url"]
     os.environ["WANDB_API_KEY"] = cfg["api_key"]
 
@@ -66,14 +68,15 @@ def main() -> None:
             })
 
         # Log a wandb.Table for query-panel expressions
-        table = wandb.Table(
-            columns=["epoch", "loss", "accuracy", "model"],
-            data=[
-                [e, 2.0 * math.exp(-0.15 * e) + random.gauss(0, 0.01), min(0.98, 0.5 + 0.04 * e), rc.get("model", "unknown")]
-                for e in range(10)
-            ],
-        )
-        run.log({"results_table": table})
+        if not is_bandw:
+            table = wandb.Table(
+                columns=["epoch", "loss", "accuracy", "model"],
+                data=[
+                    [e, 2.0 * math.exp(-0.15 * e) + random.gauss(0, 0.01), min(0.98, 0.5 + 0.04 * e), rc.get("model", "unknown")]
+                    for e in range(10)
+                ],
+            )
+            run.log({"results_table": table})
 
         # Summary metrics for runs-object tests
         run.summary["best_accuracy"] = min(0.98, 0.55 + 0.40 + idx * 0.02)
@@ -85,22 +88,24 @@ def main() -> None:
     # ---- Artifact for artifactVersion() query tests ----
     log_debug("Creating query-test artifact")
     run = wandb.init(project=project, entity=entity, name="artifact-creator")
-    artifact = wandb.Artifact("query-test-data", type="dataset")
-    artifact_table = wandb.Table(
-        columns=["id", "value", "category"],
-        data=[
-            [1, 0.95, "A"],
-            [2, 0.87, "B"],
-            [3, 0.92, "A"],
-            [4, 0.78, "C"],
-            [5, 0.91, "B"],
-        ],
-    )
-    artifact.add(artifact_table, "data_table")
-    run.log_artifact(artifact)
+    if not is_bandw:
+        artifact = wandb.Artifact("query-test-data", type="dataset")
+        artifact_table = wandb.Table(
+            columns=["id", "value", "category"],
+            data=[
+                [1, 0.95, "A"],
+                [2, 0.87, "B"],
+                [3, 0.92, "A"],
+                [4, 0.78, "C"],
+                [5, 0.91, "B"],
+            ],
+        )
+        artifact.add(artifact_table, "data_table")
+        run.log_artifact(artifact)
     runs.append(RunInfo(id=run.id, name=run.name, display_name="artifact-creator"))
     run.finish()
-    artifacts.append(ArtifactInfo(name="query-test-data", type="dataset", version="v0"))
+    if not is_bandw:
+        artifacts.append(ArtifactInfo(name="query-test-data", type="dataset", version="v0"))
 
     manifest = Manifest(project=project, entity=entity, runs=runs, artifacts=artifacts)
     output_manifest(manifest)
