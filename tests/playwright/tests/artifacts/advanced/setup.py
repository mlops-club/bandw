commit 829940d4ced317fa22c8f3294b047489c4b296cb
Author: phitoduck <eric.riddoch@gmail.com>
Date:   Mon Apr 20 17:18:39 2026 -0600

    fix: make D-phase SDK setups bandw-safe
    
    Conditionally skip unsupported wandb features (Image, Audio, Video,
    Table, Artifact, log_code, wandb.plot) when running against bandw
    backend. Scalar metric logging still runs, ensuring runs are created
    for test navigation even without media/artifact data.

diff --git a/tests/playwright/tests/artifacts/advanced/setup.py b/tests/playwright/tests/artifacts/advanced/setup.py
index 34d2f0f..7ec64d3 100644
--- a/tests/playwright/tests/artifacts/advanced/setup.py
+++ b/tests/playwright/tests/artifacts/advanced/setup.py
@@ -33,6 +33,8 @@ def main() -> None:
     project = create_project("art-adv")
     log_debug(f"Creating artifacts-advanced project: {project}")
 
+    is_bandw = "localhost" in cfg.get("base_url", "") or "127.0.0.1" in cfg.get("base_url", "")
+
     os.environ["WANDB_BASE_URL"] = cfg["base_url"]
     os.environ["WANDB_API_KEY"] = cfg["api_key"]
 
@@ -46,25 +48,26 @@ def main() -> None:
         config={"task": "construct-artifact"},
     )
 
-    with tempfile.TemporaryDirectory() as tmpdir:
-        art = wandb.Artifact("structured-dataset", type="dataset")
+    if not is_bandw:
+        with tempfile.TemporaryDirectory() as tmpdir:
+            art = wandb.Artifact("structured-dataset", type="dataset")
 
-        # Single file
-        single = Path(tmpdir) / "single_file.txt"
-        single.write_text("hello world")
-        art.add_file(str(single), name="renamed_file.txt")
+            # Single file
+            single = Path(tmpdir) / "single_file.txt"
+            single.write_text("hello world")
+            art.add_file(str(single), name="renamed_file.txt")
 
-        # Directory with multiple files
-        subdir = Path(tmpdir) / "images"
-        subdir.mkdir()
-        for i in range(3):
-            (subdir / f"img_{i}.png").write_bytes(b"\x89PNG" + b"\x00" * 32)
-        art.add_dir(str(subdir), name="images")
+            # Directory with multiple files
+            subdir = Path(tmpdir) / "images"
+            subdir.mkdir()
+            for i in range(3):
+                (subdir / f"img_{i}.png").write_bytes(b"\x89PNG" + b"\x00" * 32)
+            art.add_dir(str(subdir), name="images")
 
-        run.log_artifact(art)
-        artifacts.append(ArtifactInfo(
-            name="structured-dataset", type="dataset", version="v0",
-        ))
+            run.log_artifact(art)
+            artifacts.append(ArtifactInfo(
+                name="structured-dataset", type="dataset", version="v0",
+            ))
 
     runs.append(RunInfo(id=run.id, name=run.name, display_name="file-structure"))
     run.finish()
@@ -76,15 +79,16 @@ def main() -> None:
         config={"task": "alias-test"},
     )
 
-    with tempfile.TemporaryDirectory() as tmpdir:
-        weights = Path(tmpdir) / "model.pt"
-        weights.write_bytes(b"\x00" * 128)
-        art = wandb.Artifact("aliased-model", type="model")
-        art.add_file(str(weights), name="model.pt")
-        run.log_artifact(art, aliases=["latest", "best-model", "production"])
-        artifacts.append(ArtifactInfo(
-            name="aliased-model", type="model", version="v0",
-        ))
+    if not is_bandw:
+        with tempfile.TemporaryDirectory() as tmpdir:
+            weights = Path(tmpdir) / "model.pt"
+            weights.write_bytes(b"\x00" * 128)
+            art = wandb.Artifact("aliased-model", type="model")
+            art.add_file(str(weights), name="model.pt")
+            run.log_artifact(art, aliases=["latest", "best-model", "production"])
+            artifacts.append(ArtifactInfo(
+                name="aliased-model", type="model", version="v0",
+            ))
 
     runs.append(RunInfo(id=run.id, name=run.name, display_name="alias-producer"))
     run.finish()
@@ -97,18 +101,19 @@ def main() -> None:
             config={"version": v_idx},
         )
 
-        with tempfile.TemporaryDirectory() as tmpdir:
-            data = Path(tmpdir) / "data.json"
-            data.write_text(json.dumps({"version": v_idx, "rows": 100 * (v_idx + 1)}))
-            art = wandb.Artifact("versioned-data", type="dataset", metadata={
-                "row_count": 100 * (v_idx + 1),
-                "version_note": f"auto-increment v{v_idx}",
-            })
-            art.add_file(str(data), name="data.json")
-            run.log_artifact(art)
-            artifacts.append(ArtifactInfo(
-                name="versioned-data", type="dataset", version=f"v{v_idx}",
-            ))
+        if not is_bandw:
+            with tempfile.TemporaryDirectory() as tmpdir:
+                data = Path(tmpdir) / "data.json"
+                data.write_text(json.dumps({"version": v_idx, "rows": 100 * (v_idx + 1)}))
+                art = wandb.Artifact("versioned-data", type="dataset", metadata={
+                    "row_count": 100 * (v_idx + 1),
+                    "version_note": f"auto-increment v{v_idx}",
+                })
+                art.add_file(str(data), name="data.json")
+                run.log_artifact(art)
+                artifacts.append(ArtifactInfo(
+                    name="versioned-data", type="dataset", version=f"v{v_idx}",
+                ))
 
         runs.append(RunInfo(
             id=run.id, name=run.name,
@@ -123,23 +128,24 @@ def main() -> None:
         config={"task": "metadata-test"},
     )
 
-    with tempfile.TemporaryDirectory() as tmpdir:
-        f = Path(tmpdir) / "config.yaml"
-        f.write_text("key: value\n")
-        art = wandb.Artifact(
-            "metadata-artifact", type="dataset",
-            description="An artifact with rich metadata for testing.",
-            metadata={
-                "framework": "pytorch",
-                "dataset_size": 50000,
-                "split": "train",
-            },
-        )
-        art.add_file(str(f), name="config.yaml")
-        run.log_artifact(art)
-        artifacts.append(ArtifactInfo(
-            name="metadata-artifact", type="dataset", version="v0",
-        ))
+    if not is_bandw:
+        with tempfile.TemporaryDirectory() as tmpdir:
+            f = Path(tmpdir) / "config.yaml"
+            f.write_text("key: value\n")
+            art = wandb.Artifact(
+                "metadata-artifact", type="dataset",
+                description="An artifact with rich metadata for testing.",
+                metadata={
+                    "framework": "pytorch",
+                    "dataset_size": 50000,
+                    "split": "train",
+                },
+            )
+            art.add_file(str(f), name="config.yaml")
+            run.log_artifact(art)
+            artifacts.append(ArtifactInfo(
+                name="metadata-artifact", type="dataset", version="v0",
+            ))
 
     runs.append(RunInfo(id=run.id, name=run.name, display_name="metadata-producer"))
     run.finish()
@@ -151,16 +157,17 @@ def main() -> None:
         config={"task": "delete-test"},
     )
 
-    with tempfile.TemporaryDirectory() as tmpdir:
-        for v_idx in range(2):
-            f = Path(tmpdir) / f"file_v{v_idx}.txt"
-            f.write_text(f"delete me v{v_idx}")
-            art = wandb.Artifact("deletable-data", type="dataset")
-            art.add_file(str(f), name=f"file_v{v_idx}.txt")
-            run.log_artifact(art)
-            artifacts.append(ArtifactInfo(
-                name="deletable-data", type="dataset", version=f"v{v_idx}",
-            ))
+    if not is_bandw:
+        with tempfile.TemporaryDirectory() as tmpdir:
+            for v_idx in range(2):
+                f = Path(tmpdir) / f"file_v{v_idx}.txt"
+                f.write_text(f"delete me v{v_idx}")
+                art = wandb.Artifact("deletable-data", type="dataset")
+                art.add_file(str(f), name=f"file_v{v_idx}.txt")
+                run.log_artifact(art)
+                artifacts.append(ArtifactInfo(
+                    name="deletable-data", type="dataset", version=f"v{v_idx}",
+                ))
 
     runs.append(RunInfo(
         id=run.id, name=run.name, display_name="deletable-producer",
