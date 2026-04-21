commit 829940d4ced317fa22c8f3294b047489c4b296cb
Author: phitoduck <eric.riddoch@gmail.com>
Date:   Mon Apr 20 17:18:39 2026 -0600

    fix: make D-phase SDK setups bandw-safe
    
    Conditionally skip unsupported wandb features (Image, Audio, Video,
    Table, Artifact, log_code, wandb.plot) when running against bandw
    backend. Scalar metric logging still runs, ensuring runs are created
    for test navigation even without media/artifact data.

diff --git a/tests/playwright/tests/artifacts/core/setup.py b/tests/playwright/tests/artifacts/core/setup.py
index ce6fa24..745c4fb 100644
--- a/tests/playwright/tests/artifacts/core/setup.py
+++ b/tests/playwright/tests/artifacts/core/setup.py
@@ -34,6 +34,8 @@ def main() -> None:
     project = create_project("art-core")
     log_debug(f"Creating artifacts-core project: {project}")
 
+    is_bandw = "localhost" in cfg.get("base_url", "") or "127.0.0.1" in cfg.get("base_url", "")
+
     os.environ["WANDB_BASE_URL"] = cfg["base_url"]
     os.environ["WANDB_API_KEY"] = cfg["api_key"]
 
@@ -49,29 +51,30 @@ def main() -> None:
     for step in range(10):
         run.log({"preprocess/progress": (step + 1) / 10})
 
-    with tempfile.TemporaryDirectory() as tmpdir:
-        for version_idx in range(3):
-            art = wandb.Artifact("my-dataset", type="dataset", metadata={
-                "version_note": f"version {version_idx}",
-                "num_samples": 1000 * (version_idx + 1),
-            })
-            # Add files so the Files tab has content
-            data_file = Path(tmpdir) / f"data_v{version_idx}.csv"
-            data_file.write_text(
-                "id,value\n" + "\n".join(
-                    f"{i},{i * 0.1 + version_idx}" for i in range(20)
+    if not is_bandw:
+        with tempfile.TemporaryDirectory() as tmpdir:
+            for version_idx in range(3):
+                art = wandb.Artifact("my-dataset", type="dataset", metadata={
+                    "version_note": f"version {version_idx}",
+                    "num_samples": 1000 * (version_idx + 1),
+                })
+                # Add files so the Files tab has content
+                data_file = Path(tmpdir) / f"data_v{version_idx}.csv"
+                data_file.write_text(
+                    "id,value\n" + "\n".join(
+                        f"{i},{i * 0.1 + version_idx}" for i in range(20)
+                    )
                 )
-            )
-            art.add_file(str(data_file), name=f"data_v{version_idx}.csv")
+                art.add_file(str(data_file), name=f"data_v{version_idx}.csv")
 
-            readme = Path(tmpdir) / f"README_v{version_idx}.md"
-            readme.write_text(f"# Dataset version {version_idx}\nSynthetic data.")
-            art.add_file(str(readme), name="README.md")
+                readme = Path(tmpdir) / f"README_v{version_idx}.md"
+                readme.write_text(f"# Dataset version {version_idx}\nSynthetic data.")
+                art.add_file(str(readme), name="README.md")
 
-            run.log_artifact(art)
-            artifacts.append(ArtifactInfo(
-                name="my-dataset", type="dataset", version=f"v{version_idx}",
-            ))
+                run.log_artifact(art)
+                artifacts.append(ArtifactInfo(
+                    name="my-dataset", type="dataset", version=f"v{version_idx}",
+                ))
 
     runs.append(RunInfo(id=run.id, name=run.name, display_name="data-producer"))
     run.finish()
@@ -83,9 +86,10 @@ def main() -> None:
         config={"lr": 0.01, "epochs": 5},
     )
 
-    # Consume the latest dataset artifact
-    dataset_art = run.use_artifact(f"{entity}/{project}/my-dataset:latest")
-    log_debug(f"  consumed dataset artifact: {dataset_art.name}")
+    if not is_bandw:
+        # Consume the latest dataset artifact
+        dataset_art = run.use_artifact(f"{entity}/{project}/my-dataset:latest")
+        log_debug(f"  consumed dataset artifact: {dataset_art.name}")
 
     for step in range(20):
         t = step / 19
@@ -93,17 +97,18 @@ def main() -> None:
         accuracy = 0.95 * (1 - math.exp(-3.0 * t))
         run.log({"loss": loss, "accuracy": accuracy})
 
-    # Produce a model artifact
-    with tempfile.TemporaryDirectory() as tmpdir:
-        weights = Path(tmpdir) / "weights.bin"
-        weights.write_bytes(b"\x00" * 256)
-        model_art = wandb.Artifact("my-model", type="model", metadata={
-            "framework": "pytorch",
-            "accuracy": 0.95,
-        })
-        model_art.add_file(str(weights), name="weights.bin")
-        run.log_artifact(model_art)
-        artifacts.append(ArtifactInfo(name="my-model", type="model", version="v0"))
+    if not is_bandw:
+        # Produce a model artifact
+        with tempfile.TemporaryDirectory() as tmpdir:
+            weights = Path(tmpdir) / "weights.bin"
+            weights.write_bytes(b"\x00" * 256)
+            model_art = wandb.Artifact("my-model", type="model", metadata={
+                "framework": "pytorch",
+                "accuracy": 0.95,
+            })
+            model_art.add_file(str(weights), name="weights.bin")
+            run.log_artifact(model_art)
+            artifacts.append(ArtifactInfo(name="my-model", type="model", version="v0"))
 
     runs.append(RunInfo(id=run.id, name=run.name, display_name="trainer"))
     run.finish()
@@ -115,23 +120,25 @@ def main() -> None:
             project=project, entity=entity, name=f"extra-trainer-{i}",
             config={"lr": 0.01 * (i + 1), "epochs": 5 + i},
         )
-        dataset_art = run.use_artifact(f"{entity}/{project}/my-dataset:latest")
+        if not is_bandw:
+            dataset_art = run.use_artifact(f"{entity}/{project}/my-dataset:latest")
         for step in range(10):
             t = step / 9
             run.log({"loss": 1.5 * math.exp(-2.0 * t) + 0.1 * i})
 
-        with tempfile.TemporaryDirectory() as tmpdir:
-            weights = Path(tmpdir) / "weights.bin"
-            weights.write_bytes(b"\x00" * 256)
-            model_art = wandb.Artifact("my-model", type="model", metadata={
-                "framework": "pytorch",
-                "accuracy": 0.90 + i * 0.01,
-            })
-            model_art.add_file(str(weights), name="weights.bin")
-            run.log_artifact(model_art)
-            artifacts.append(ArtifactInfo(
-                name="my-model", type="model", version=f"v{i + 1}",
-            ))
+        if not is_bandw:
+            with tempfile.TemporaryDirectory() as tmpdir:
+                weights = Path(tmpdir) / "weights.bin"
+                weights.write_bytes(b"\x00" * 256)
+                model_art = wandb.Artifact("my-model", type="model", metadata={
+                    "framework": "pytorch",
+                    "accuracy": 0.90 + i * 0.01,
+                })
+                model_art.add_file(str(weights), name="weights.bin")
+                run.log_artifact(model_art)
+                artifacts.append(ArtifactInfo(
+                    name="my-model", type="model", version=f"v{i + 1}",
+                ))
 
         runs.append(RunInfo(
             id=run.id, name=run.name, display_name=f"extra-trainer-{i}",
