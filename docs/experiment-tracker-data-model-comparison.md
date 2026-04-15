# Experiment Tracker Data Model Comparison

A comprehensive analysis of the data models behind 5 major ML experiment tracking SDKs,
assessing feasibility of a unified "collector" backend that all SDKs can point to.

**SDKs analyzed:** W&B, MLflow, ClearML, Aim, CometML

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Entity Comparison Matrix](#2-entity-comparison-matrix)
3. [Per-Tool ERD Summaries](#3-per-tool-erd-summaries)
4. [Deep Concept Comparison](#4-deep-concept-comparison)
5. [The Least Common Denominator (LCD)](#5-the-least-common-denominator)
6. [Per-Tool Delta from LCD](#6-per-tool-delta-from-lcd)
7. [Unified Collector API Design Assessment](#7-unified-collector-api-design-assessment)
8. [Recommended Unified Schema](#8-recommended-unified-schema)
9. [SDK Plugin Requirements](#9-sdk-plugin-requirements)

---

## 1. Executive Summary

### Verdict: Feasible, with caveats

A unified collector backend is **feasible** for the core experiment tracking use case. All 5 tools
share a remarkably similar core data model:

```
Organization/Workspace
  └── Project/Experiment (container)
        └── Run/Experiment/Task (execution unit)
              ├── Config/Params (key-value, set once)
              ├── Metrics (step-indexed timeseries)
              ├── Summary (final scalar values)
              ├── System Metrics (CPU/GPU/RAM timeseries)
              ├── Console Output (stdout/stderr logs)
              ├── Git Info (commit, branch, remote, diff)
              ├── Environment Info (OS, Python, packages)
              ├── Tags (labels)
              └── Files/Assets (uploaded binary data)
```

The **shared core** covers ~70-80% of what most users need. The remaining 20-30% is where
tools diverge in opinionated ways (artifacts/lineage, model registries, sweeps, pipelines,
reports, custom visualizations). These can be handled through:

1. A **flexible extension mechanism** in the unified schema (typed JSON metadata, generic
   asset storage with type discriminators)
2. **SDK-specific plugins/adapters** that translate tool-specific concepts to the unified model
3. **Optional modules** in the collector API for advanced features (artifact registry, sweep
   coordination, pipeline DAGs)

### Key Finding: The Naming Problem

The biggest challenge is not structural -- it's **terminological**. Every tool uses different names
for the same concept:

| Concept | W&B | MLflow | ClearML | Aim | CometML |
|---------|-----|--------|---------|-----|---------|
| Top container | Entity | Workspace | Company | Repo | Workspace |
| Run container | Project | Experiment | Project | Experiment | Project |
| Execution unit | Run | Run | Task | Run | Experiment |
| Hyperparams | Config | Params | Hyperparameters | Params (dict) | Parameters |
| Final values | Summary | Latest Metrics | Last Metrics | (via metrics) | (via metrics) |
| HPO group | Sweep | (none built-in) | Optimizer | (none built-in) | Optimizer |
| Files | Files | Artifacts | Artifacts | Artifacts | Assets |
| Versioned data | Artifact | (none built-in) | Dataset | (none built-in) | Artifact |
| Model mgmt | Artifact (model type) | Model Registry | Model | (none built-in) | Registry Model |

---

## 2. Entity Comparison Matrix

### Core Entities (present in all or nearly all tools)

| Entity | W&B | MLflow | ClearML | Aim | CometML |
|--------|:---:|:------:|:-------:|:---:|:-------:|
| **Org/Workspace** | Entity/Org | Workspace | Company | -- | Workspace/Org |
| **Project container** | Project | Experiment | Project (nested!) | Experiment | Project |
| **Run/execution** | Run | Run | Task | Run | Experiment |
| **Run state machine** | running/finished/crashed/failed | SCHEDULED/RUNNING/FINISHED/FAILED/KILLED | created/queued/in_progress/stopped/completed/failed/published | active/finalized | running/finished/crashed |
| **Config/hyperparams** | Config (nested JSON) | Params (flat k-v, string values) | Hyperparams (sectioned k-v) | run[key] (nested dict) | Parameters (flat k-v) |
| **Metrics timeseries** | History (step-indexed) | Metric (step+timestamp) | Events/Scalars (iter-indexed) | Metric Sequence (step+epoch) | Metric (step+epoch) |
| **Summary/final values** | Summary (explicit) | LatestMetric (derived) | last_metrics (derived) | (query latest) | valueCurrent (derived) |
| **System metrics** | Stats (CPU/GPU/RAM/disk/net) | (none built-in) | (none built-in, via events) | System metrics (CPU/GPU/RAM/disk) | GPU/CPU/RAM/Load metrics |
| **Console output** | OutputRecord (stdout/stderr) | (none built-in) | Log events (leveled) | Terminal logs (if enabled) | Console output (stdout/stderr) |
| **Tags** | tags[] on Run | RunTag (k-v pairs) | tags[] + system_tags[] | Tag entity (M:N with color) | Tag (string labels) |
| **Notes/description** | notes field | mlflow.note.content tag | comment field | Note entity (rich) | (via project notes) |
| **Git info** | GitInfo (remote, commit) | System tags (commit, branch, repo, dirty) | Script (repo, branch, commit, entry_point, working_dir) | __system_params.git_info | GitMetadata (user, root, branch, commit, origin) |
| **Git diff/patch** | (code saving → diff file) | mlflow.source.git.diff tag | Script.diff field | (none) | GitPatch (binary zip) |
| **Environment info** | RunInfo (OS, Python, CPU, GPU) | System tags (source.type, .name) | Script.requirements + SystemDetails | __system_params (packages, env_vars, executable) | SystemDetails (Python, OS, GPU, packages) |
| **Files/assets** | File entity (per run) | ArtifactRepository (generic) | Artifact (typed: input/output) | Artifact (name, path, URI) | Asset (typed: image, audio, video, etc.) |
| **User/creator** | User entity | user_id field | user field | (none explicit) | userName |

### Advanced Entities (present in some tools)

| Entity | W&B | MLflow | ClearML | Aim | CometML |
|--------|:---:|:------:|:-------:|:---:|:-------:|
| **Versioned artifacts** | ArtifactSequence + versions | -- | Dataset (versioned, lineaged) | -- | Artifact + ArtifactVersion |
| **Artifact lineage** | Run ↔ Artifact (input/output) | Dataset + DatasetInput | Task ↔ Artifact (input/output) | -- | Experiment ↔ Artifact (input/output) |
| **Model registry** | (via Artifact type=model) | RegisteredModel + ModelVersion + stages | Model entity (parent/child lineage) | -- | RegistryModel + versions + stages |
| **Sweeps/HPO** | Sweep (server-side bayes/random/grid + agents) | -- (use Optuna/Hyperopt externally) | HyperparameterOptimizer (optimizer task + queues) | -- | Optimizer (client-side bayes/random/grid) |
| **Pipelines/DAGs** | -- | (MLflow Projects, limited) | PipelineController (full DAG) | -- | -- |
| **Reports/docs** | Report (rich block-based + live panels) | -- | Report (Markdown + iframe live charts, built on Task entity) | -- | Report (panels + markdown) |
| **Custom viz panels** | View (saved chart configs) | -- | -- | -- | Panel (Python code templates) |
| **Queues/workers/jobs** | Launch (Jobs + RunQueue + Launch Agents) | -- | Queue + Worker (full orchestration) | -- | -- |
| **Nested projects** | -- | -- | Yes (hierarchical) | -- | -- |
| **Task types** | jobType field | -- | 11 types (training, testing, inference, data_processing, controller, optimizer, ...) | -- | -- |
| **Rich media types** | Tables, media in History | -- | Images, Plots (Plotly JSON), Vectors | Images, Audio, Text, Distributions, Figures | Images, Audio, Video, 3D, Embeddings, Curves, Confusion Matrices, Tables |
| **Metric context/variant** | (via metric key naming) | -- | metric + variant (2D naming) | Context dict (arbitrary) | context field (train/validate/test) |

---

## 3. Per-Tool ERD Summaries

### 3.1 W&B (Weights & Biases)

```
Organization ──1:1── Entity
Entity ──1:N── Project
  Project ──1:N── Run
    Run ──1:1── RunInfo (+ GitInfo)
    Run ──1:N── HistoryRecord (metrics timeseries, step-indexed)
    Run ──1:N── ConfigRecord (hyperparams, nested JSON)
    Run ──1:N── SummaryRecord (final values)
    Run ──1:N── OutputRecord (console logs, stdout/stderr)
    Run ──1:N── StatsRecord (system metrics, ~30s interval)
    Run ──1:N── File (uploaded files)
    Run ──N:M── Artifact (input/output lineage)
    Run ──0:1── Sweep
    Run ──1:N── Alert
  Project ──1:N── Sweep
    Sweep ──1:N── SweepAgent
  Project ──1:N── ArtifactSequence
    ArtifactSequence ──1:N── Artifact (versions: v0, v1, ...)
      Artifact ──1:N── ArtifactAlias ("latest", "prod")
      Artifact ──1:1── ArtifactManifest ──1:N── ManifestEntry
      Artifact ──N:1── ArtifactType
  Project ──1:N── Report
  Project ──1:N── View (saved dashboards)
  Project ──1:N── RunQueue (Launch queue)
    RunQueue ──1:N── RunQueueItem (launch_spec JSON)
  Job = Artifact (type=wandb-job)
    Job.source ∈ {git (repo+commit+entrypoint), code (artifact), image (docker)}
    Launch Agent polls RunQueue → executes Job → creates Run
```

**Distinctive features:**
- Protocol buffer-based wire format (Record types)
- Parquet-based history storage (columnar, efficient)
- Artifact content-addressing (SHA-256 digest, dedup across versions)
- Sweep agent coordination (server-side HPO — backend decides next trial via Bayesian GP)
- Launch system (Jobs, RunQueues, Launch Agents — supports local Docker, K8s, SageMaker, Vertex)
- Rich report editor (block-based with embedded live panels, collaborative editing)

### 3.2 MLflow

```
Workspace ──1:N── Experiment
  Experiment ──1:N── Run
    Run = RunInfo + RunData + RunInputs + RunOutputs
    Run ──1:N── Metric (key, value, timestamp, step)
    Run ──1:1── LatestMetric (per key, optimized)
    Run ──1:N── Param (key, value — immutable, string-only)
    Run ──1:N── RunTag (key, value — mutable)
    Run ──1:N── LoggedModel
    Run ──0:1── RunInputs ──1:N── DatasetInput ──1:1── Dataset
    Run ──0:1── RunOutputs ──1:N── LoggedModelOutput
  Experiment ──1:N── ExperimentTag
  Experiment ──1:N── Dataset (name + digest + source)

RegisteredModel ──1:N── ModelVersion
  ModelVersion ──1:N── ModelVersionTag
  ModelVersion → Run (source_run_id)
  RegisteredModel ──1:N── RegisteredModelAlias
```

**Distinctive features:**
- Simplest core model (experiment → run → metrics/params/tags)
- Params are immutable and string-only (no nested structure)
- Separate tracking store + model registry (decoupled)
- Dataset entity with digest-based identity
- Extensive system tag namespace (`mlflow.*`)
- No built-in system metrics, sweeps, or console capture
- Strong SQL schema (well-defined migrations)

### 3.3 ClearML

```
Company ──1:N── Project (supports nesting!)
  Project ──1:N── Task
    Task.type ∈ {training, testing, inference, data_processing,
                  application, monitor, controller, optimizer, service, qc, custom}
    Task ──1:1── Execution (queue, parameters, framework)
    Task ──1:1── Output (destination, result, model ref)
    Task ──1:1── Script (repo, branch, commit, entry_point, diff, requirements)
    Task ──0:1── Container (docker config)
    Task ──1:N── Hyperparameter (sectioned: section/name/value)
    Task ──1:N── Configuration (flat: name/value)
    Task ──1:N── Event (abstract)
      ├── MetricScalar (task, iter, metric, variant, value)
      ├── MetricVector (task, iter, metric, variant, values[])
      ├── MetricImage (task, iter, metric, variant, url, dimensions)
      ├── MetricPlot (task, iter, metric, variant, plotly_json)
      └── LogEvent (task, level, msg)
    Task ──1:N── Artifact (key, type, mode=input|output, uri)
    Task ──N:M── Model (input/output via TaskModelItem)
    Task ──N:M── Dataset
    Task ──0:1── Task (parent — sub-tasks)

  Project ──1:N── Model
    Model ──0:1── Model (parent lineage)

  Project ──1:N── Dataset
    Dataset ──0:1── Dataset (parent version lineage)
    Dataset ──1:N── FileEntry (path, hash, size)

Queue ──1:N── Task (entries)
Worker ──N:M── Queue

PipelineController (Task type=controller)
  ──1:N── Node (DAG steps, each clones a base task)

HyperparameterOptimizer (Task type=optimizer)
  ──1:N── Task (generated child experiments)

Report (implemented as special Task)
  ├── name, project (FK), status (draft/published/archived)
  ├── report (Markdown body with iframe embeds for live charts)
  ├── report_assets[] (external assets: images, linked resources)
  ├── tags[], system_tags[], comment
  └── Embeds reference Tasks/Models by ID via iframe widget codes
```

**Distinctive features:**
- Richest task type system (11 types — training, controller, optimizer, etc.)
- "Everything is a Task" philosophy (even Reports are Tasks under the hood)
- Nested project hierarchy
- Two-dimensional metric naming: metric title + variant (e.g., "loss" / "train")
- Full execution orchestration (queues, workers, pipelines, HPO)
- Most complete code versioning (repo, branch, commit, entry_point, working_dir, diff, requirements)
- Task status state machine with 10+ states
- Sectioned hyperparameters (organized by group)
- Reports with live embedded experiment chart widgets

### 3.4 Aim

```
Repo (filesystem-level container, .aim/ directory)
  ──1:N── Experiment
    Experiment ──1:N── Run
  ──1:N── Run (can exist without experiment)
    Run ──1:1── RunInfo
    Run ──M:N── Tag (with color, description)
    Run ──1:N── Note (rich text)
    Run ──1:N── Artifact (name, path, uri)
    Run.params = arbitrary nested dict (TreeView)
    Run.__system_params = {packages, env_vars, git_info, executable, arguments}
    Run ──1:N── Sequence (organized by name + Context)
      Sequence types:
        ├── Metric (float/int, step + epoch + timestamp)
        ├── ImageSequence (PIL/Tensor → PNG/JPEG, caption, dimensions)
        ├── AudioSequence (MP3/WAV/FLAC, caption)
        ├── TextSequence (str)
        ├── DistributionSequence (histogram: bins + ranges)
        └── FigureSequence (Plotly/Matplotlib → JSON)
      Each identified by (run_hash, name, Context{})
```

**Distinctive features:**
- Simplest hierarchy (Repo → optional Experiment → Run)
- Context-based metric subgrouping (arbitrary dict, not just train/val)
- RocksDB + SQLite dual storage (high-perf timeseries + structured metadata)
- Reservoir sampling for efficient large-scale metric storage
- Rich typed sequences (images, audio, text, distributions, figures)
- No built-in artifact versioning, model registry, sweeps, or pipelines
- Elegant query language for run filtering

### 3.5 CometML

```
Organization ──1:N── Workspace
  Workspace ──1:N── Project
    Project ──1:N── Experiment (= Run)
      Experiment ──1:N── Metric (step + epoch + context timeseries)
      Experiment ──1:N── Parameter (flat key-value, summary only)
      Experiment ──1:N── OtherKeyValue (arbitrary metadata)
      Experiment ──1:N── Tag (string labels)
      Experiment ──1:N── Asset (typed file store)
        Asset.type ∈ {image, audio, video, histogram3d, confusion-matrix,
                      curve, 3d-points, embedding, text-sample, table,
                      dataframe-profile, notebook, asset(generic)}
      Experiment ──1:N── ExperimentModel (named model groups)
      Experiment ──1:1── SystemDetails (OS, Python, GPU, packages)
      Experiment ──1:1── GitMetadata (branch, commit, origin)
      Experiment ──1:1── GitPatch (binary diff zip)
      Experiment ──1:N── SystemMetricSample (GPU/CPU/RAM/Load)
      Experiment ──1:N── ConsoleOutput (stdout/stderr lines)
      Experiment ──1:1── HTML (accumulated blob)
      Experiment ──N:M── Artifact (lineage)

  Workspace ──1:N── Artifact
    Artifact ──1:N── ArtifactVersion
      ArtifactVersion ──1:N── ArtifactAsset (files within version)

  Workspace ──1:N── RegistryModel
    RegistryModel ──1:N── RegistryModelVersion (with stages)

  Optimizer ──1:N── Experiment (trials)

  Workspace ──1:N── Panel (Python code templates)
  Project ──1:N── View (dashboard layouts)
```

**Distinctive features:**
- Richest asset type system (14+ types with type discriminator)
- Parameters and "Others" as separate entity types (not just config)
- HTML as first-class per-experiment blob
- Python Panel system (custom visualization code stored server-side)
- 4 separate system metric endpoints (GPU/CPU/RAM/Load)
- REST API-first design (well-documented endpoints)
- Semantic versioning for artifacts

---

## 4. Deep Concept Comparison

### 4.1 Hierarchy Depth

| Tool | Levels | Path |
|------|--------|------|
| W&B | 4 | Org → Entity → Project → Run |
| MLflow | 3 | Workspace → Experiment → Run |
| ClearML | 4+ | Company → Project (nested!) → Task |
| Aim | 2-3 | Repo → (Experiment) → Run |
| CometML | 4 | Org → Workspace → Project → Experiment |

**Unified model needs:** 3 levels minimum: **Workspace → Project → Run**. ClearML's nested
projects can be flattened with "/" naming. Aim's optional Experiment maps to Project.

### 4.2 Metrics: The Core Differentiator

All tools agree on the fundamental: metrics are **step-indexed numeric timeseries**. But they
diverge on context/grouping:

| Tool | Metric Identity | Context Mechanism |
|------|----------------|-------------------|
| W&B | Flat key string (e.g., `"train/loss"`) | Convention in key naming |
| MLflow | Flat key string | None (convention) |
| ClearML | `(metric_title, variant)` tuple | Variant is a first-class field |
| Aim | `(name, Context{})` tuple | Arbitrary dict context |
| CometML | `(metricName, context)` | Context string field |

**Unified model should:** Support `(name, context_dict)` as the metric identity. This is the
superset. W&B and MLflow keys map to `(key, {})`. ClearML maps to `(title, {"variant": variant})`.
Aim maps directly. CometML maps to `(name, {"split": context})`.

### 4.3 Config/Hyperparameters

| Tool | Structure | Mutability | Value Types |
|------|-----------|------------|-------------|
| W&B | Nested JSON dict | Mutable (merge-update) | Any JSON type |
| MLflow | Flat key-value | Immutable (set once) | String only |
| ClearML | Sectioned key-value | Mutable | String (with type hints) |
| Aim | Nested dict (TreeView) | Mutable | Any Python type |
| CometML | Flat key-value | Mutable (last value wins) | String |

**Unified model should:** Support **nested JSON** (superset of flat k-v). Store as JSON with
optional `section` grouping for ClearML compatibility. Allow mutation (most tools do).

### 4.4 Code Versioning

| Tool | Git Commit | Git Branch | Git Remote | Git Diff | Entry Point | Working Dir | Requirements |
|------|:----------:|:----------:|:----------:|:--------:|:-----------:|:-----------:|:------------:|
| W&B | Y | (via remote) | Y | Y (file) | Y (program) | -- | -- |
| MLflow | Y | Y | Y | Y (tag) | Y (entry_point_name) | -- | -- |
| ClearML | Y | Y | Y | Y (field) | Y | Y | Y (by section) |
| Aim | Y | Y | Y | -- | -- | -- | Y (packages) |
| CometML | Y | Y | Y | Y (binary zip) | Y (fileName) | -- | Y (installedPackages) |

**ClearML is the most complete** — it captures everything needed to reproduce an experiment.
The unified model should capture the full ClearML set as the ceiling.

### 4.5 Artifacts & Lineage

| Feature | W&B | MLflow | ClearML | Aim | CometML |
|---------|:---:|:------:|:-------:|:---:|:-------:|
| Versioned artifacts | Y (ArtifactSequence) | -- | Y (Dataset entity) | -- | Y (ArtifactVersion) |
| Content addressing | Y (SHA-256 digest) | -- | Y (hash) | -- | -- |
| Dedup across versions | Y (birthArtifactID) | -- | Y (parent_dataset_id) | -- | -- |
| Lineage (run ↔ artifact) | Y (use/log) | Y (DatasetInput) | Y (input/output mode) | -- | Y (input/output) |
| Artifact types | Y (user-defined) | -- | Y (system types) | -- | Y (dataset/model/custom) |
| Aliases | Y (latest, prod, v0) | -- | -- | -- | Y (latest, custom) |
| Manifest/file list | Y (ArtifactManifest) | -- | Y (FileEntry) | -- | Y (ArtifactAsset) |
| TTL / auto-cleanup | Y | -- | -- | -- | -- |

**W&B has the most sophisticated artifact system.** MLflow and Aim lack versioned artifacts
entirely (MLflow's "artifacts" are just per-run file uploads). ClearML has a strong Dataset entity.
CometML's artifact system is simpler but functional.

### 4.6 Model Registry

| Feature | W&B | MLflow | ClearML | Aim | CometML |
|---------|:---:|:------:|:-------:|:---:|:-------:|
| Dedicated registry | via Artifact type | Y (RegisteredModel) | Y (Model entity) | -- | Y (RegistryModel) |
| Versioning | Y (artifact versions) | Y (ModelVersion) | Y (parent lineage) | -- | Y (RegistryModelVersion) |
| Stages/lifecycle | via aliases | Y (Staging/Production/Archived) | -- | -- | Y (staging/production) |
| Run → Model link | Y (artifact lineage) | Y (source_run_id) | Y (task FK) | -- | Y (experimentKey) |
| Model metadata | Y (artifact metadata) | Y (tags, params, metrics) | Y (framework, design, labels) | -- | Y (tags, metadata) |

### 4.7 Sweeps / Hyperparameter Optimization

**What makes a "sweep" different from running N experiments and comparing them?**

The answer is: **server-side coordination** — whether the backend (not just the user's script)
decides what hyperparameters to try next based on results from completed trials. This matters
for Bayesian optimization where a surrogate model (e.g., Gaussian Process) is fit on completed
runs to intelligently pick the next trial, and for early stopping where running trials are killed
based on intermediate results.

| Feature | W&B | MLflow | ClearML | Aim | CometML |
|---------|:---:|:------:|:-------:|:---:|:-------:|
| Built-in HPO | Y | -- | Y | -- | Y |
| Search methods | bayes, random, grid | -- | grid, random, optuna, hyperband | -- | grid, random, bayes |
| **Where optimization logic runs** | **Server-side** (sweep controller) | N/A | **Semi-server** (optimizer runs as a Task on ClearML agent infra) | N/A | **Client-side** (optimizer object in user process) |
| Backend stores sweep state | Y | -- | Y (as Task) | -- | -- |
| Backend decides next trial | **Y** (Bayesian GP fits on server) | -- | Partially (optimizer Task runs Optuna/BOHB, uses queue infra) | -- | -- |
| Early stopping decisions | Server-side | -- | Optimizer Task monitors child tasks | -- | Client-side |
| Objective metric | Y | -- | Y | -- | Y |
| Run → Sweep link | sweepName field | -- | Task.parent FK | -- | optimizationId |

**Key distinction:**
- **W&B:** True server-side coordination. The sweep controller (backend) fits a Bayesian model
  on completed runs and tells agents what params to try next. The backend stores sweep state.
- **ClearML:** Infrastructure-coordinated. The HyperParameterOptimizer is a long-running Task
  that creates child Tasks with different configs and enqueues them for Workers. The optimization
  logic runs in the optimizer Task (not the server itself), but uses the server's queue + task
  infrastructure.
- **CometML:** Purely client-side. The `Optimizer` object yields parameter combinations in the
  user's Python process. The server just stores the resulting experiments.
- **MLflow, Aim:** No built-in HPO. Users pair with Optuna/Hyperopt/Ray Tune externally. MLflow
  supports grouping related runs via `mlflow.parentRunId` tag or experiment, but has no
  optimization logic.

**Implication for unified backend:** The backend only needs to store runs grouped by a sweep/optimizer
ID and the sweep configuration (search space, objective, method). Server-side coordination (W&B style)
is a complex feature that can be omitted — users can bring their own optimization library (Optuna etc.)
and the unified backend just records the results with a shared sweep_id.

### 4.8 Rich Media Types

| Type | W&B | MLflow | ClearML | Aim | CometML |
|------|:---:|:------:|:-------:|:---:|:-------:|
| Scalar metrics | Y | Y | Y | Y | Y |
| Images | Y (via media) | -- | Y (MetricImage) | Y (ImageSequence) | Y (Asset type=image) |
| Audio | Y (via media) | -- | -- | Y (AudioSequence) | Y (Asset type=audio) |
| Video | Y (via media) | -- | -- | -- | Y (Asset type=video) |
| Text | Y (via media) | -- | -- | Y (TextSequence) | Y (Asset type=text-sample) |
| Plots/Figures | Y (via media) | -- | Y (MetricPlot, Plotly JSON) | Y (FigureSequence) | Y (Asset type=curve) |
| Distributions/Histograms | Y (via media) | -- | Y (MetricVector) | Y (DistributionSequence) | Y (Asset type=histogram3d) |
| Tables | Y (Table) | -- | -- | -- | Y (Asset type=table) |
| 3D/Point clouds | -- | -- | -- | -- | Y (Asset type=3d-points) |
| Embeddings | -- | -- | -- | -- | Y (Asset type=embedding) |
| Confusion matrices | -- | -- | -- | -- | Y (Asset type=confusion-matrix) |
| HTML | Y (via media) | -- | -- | -- | Y (first-class blob) |

### 4.9 Tags: A Deep Comparison

Tags vary **dramatically** across tools — from simple string labels to rich first-class entities
with CRUD management. This matters because tags are a primary mechanism for organizing,
querying, and filtering runs.

#### Tag Data Models

| Tool | Data Model | Example |
|------|-----------|---------|
| **W&B** | `List[str]` on Runs and Artifacts | `run.tags = ["baseline", "v2"]` |
| **MLflow** | **Key-value pairs** (`key: str, value: str`) on 6 entity types | `mlflow.set_tag("model_type", "resnet50")` |
| **ClearML** | `List[str]` on Tasks, Models, Datasets, Projects + separate `system_tags` | `task.add_tags(["production", "approved"])` |
| **Aim** | **First-class entity** with `uuid, name, color, description, archived` | `run.add_tag("baseline")` → returns `Tag` object |
| **CometML** | `List[str]` on Experiments, Models, Artifacts | `experiment.add_tag("best_model")` |

#### Entities That Can Be Tagged

| Entity | W&B | MLflow | ClearML | Aim | CometML |
|--------|:---:|:------:|:-------:|:---:|:-------:|
| Runs/Tasks/Experiments | Y | Y (`RunTag`) | Y (`tags` + `system_tags`) | Y (M:N via join table) | Y |
| Projects/Experiments | -- | Y (`ExperimentTag`) | Y | -- | -- |
| Models | -- | Y (`RegisteredModelTag`, `ModelVersionTag`) | Y | -- | Y |
| Artifacts/Datasets | Y | Y (`InputTag`) | Y (Datasets are Tasks) | -- | Y |
| Logged Models | -- | Y (`LoggedModelTag`) | -- | -- | -- |

MLflow is the outlier with **6 distinct tag entity types**, all key-value. ClearML gets broad
coverage because "everything is a Task" — Datasets, Pipeline steps, etc. all inherit Task tags.

#### Query/Filter Power

| Feature | W&B | MLflow | ClearML | Aim | CometML |
|---------|:---:|:------:|:-------:|:---:|:-------:|
| Filter runs by tag | Y | Y | **Y (most powerful)** | Y | Y |
| Query syntax | MongoDB-style: `{"tags": {"$in": ["v1"]}}` | SQL-like: `tags.key = 'val'`, `ILIKE` | **Boolean operators**: `["__$all", "prod", "__$not", "deprecated"]` | Search by name via REST API | Basic filtering |
| System vs user tags | -- | **Y (~30+ `mlflow.*` system tags)** | **Y (formal `system_tags` field)** | -- | -- |

ClearML's tag query is the most expressive: `__$all` for AND, `__$not` for exclusion, default is OR.
Example: "find all tasks tagged 'production' AND 'validated' but NOT 'deprecated'":
```python
Task.get_tasks(tags=["__$all", "production", "validated", "__$not", "deprecated"])
```

MLflow uses key-value tags where other tools use dedicated fields. For example, `mlflow.runName`,
`mlflow.user`, `mlflow.source.git.commit`, `mlflow.parentRunId`, and `mlflow.autologging` are all
system tags — over 30 auto-populated. Other tools store these as dedicated fields (run name, user,
git info, parent run) and reserve tags for user-defined labels.

#### Tag Management

| Feature | W&B | MLflow | ClearML | Aim | CometML |
|---------|:---:|:------:|:-------:|:---:|:-------:|
| Add/remove | Y | Y | Y | Y | Y |
| Full CRUD (create, rename, delete, archive) | -- | -- | -- | **Y** | -- |
| Tag colors | -- | -- | -- | **Y** | Partial (UI pills) |
| Tag descriptions | -- | -- | -- | **Y** | -- |
| Dedicated tag REST API | -- | -- | -- | **Y** (`/api/tags/` with full CRUD) | -- |
| Tag archival | -- | -- | -- | **Y** | -- |

Aim has the richest tag entity model — tags are database objects with UUID, color, description, and
full lifecycle management. This is the best model for a collaboration UI where teams curate tags.

#### Implication for Unified Backend

A hybrid approach is strongest:
- **Aim's entity model**: Tags as first-class objects with name, color, description, CRUD
- **ClearML's query operators**: AND/OR/NOT boolean logic for filtering
- **Broad scope**: Tags on runs, artifacts, models, and projects (like MLflow/ClearML)
- **Both user and system tags**: Like ClearML's formal separation
- MLflow's key-value approach can be supported via run metadata/config fields rather than
  overloading the tag system

### 4.10 Reports & Collaboration

| Feature | W&B | MLflow | ClearML | Aim | CometML |
|---------|:---:|:------:|:-------:|:---:|:-------:|
| Has reports | **Y** | -- | **Y** | -- | **Y** |
| Content model | Block-based (typed blocks: markdown, panel grid, LaTeX, images, code, headings) | N/A | Flat Markdown with iframe embeds | N/A | Markdown + embedded panels |
| Live embedded charts | **Y** (Panel Grids with run sets and filters) | N/A | **Y** (iframe widget codes referencing task IDs) | N/A | **Y** (Comet panels referencing experiments) |
| Collaborative editing | **Y** (Google Docs-style, comments) | N/A | -- | N/A | -- |
| Shareable | Y (URL, public or team-private) | N/A | Y (within workspace, export to PDF/Markdown) | N/A | Y (via link) |
| Project-scoped | Y | N/A | Y | N/A | Y |
| Lifecycle | draft → published | N/A | draft → published → archived | N/A | -- |

**W&B Reports** are the most full-featured: block-based document editor with typed content blocks
(markdown, panel grids with live charts, LaTeX, images, code blocks, video, HTML) and real-time
collaborative editing with comments.

**ClearML Reports** are implemented as special Tasks (reflecting the "everything is a Task" philosophy).
They're Markdown documents with `<iframe>` embeds that render live experiment charts. The data model
is: `name`, `project` (FK), `report` (Markdown body), `report_assets[]`, `tags`, `system_tags`,
`comment`, `status` (draft/published/archived). Simpler than W&B but functional.

**CometML Reports** combine Markdown text with embedded Comet panels/charts. Less block-type variety
than W&B, no collaborative editing. Panels are a separate feature (Python code templates for custom
visualizations).

**MLflow and Aim** have no report feature. MLflow relies on Jupyter/Databricks notebooks for
documentation. Aim provides interactive dashboards but no persistent shareable documents.

### 4.11 Queues, Jobs, & Orchestration

Both W&B and ClearML have queue-based job execution systems (not just experiment tracking):

| Feature | W&B (Launch) | ClearML |
|---------|:------------:|:-------:|
| Queue entity | RunQueue (per project, named, with access control + prioritization) | Queue (named, with entries) |
| Queue item | RunQueueItem (launch_spec JSON: job reference, config overrides, resource args, priority) | Entry (task ID + timestamp) |
| Job/reproducibility unit | Job = Artifact (type=wandb-job) with source: git, code artifact, or docker image | Task (cloned from base task for reproduction) |
| Worker/agent | Launch Agent (polls queue, builds containers, tracks job status) | Worker (polls queues, executes tasks) |
| Compute backends | Local Docker, Kubernetes, SageMaker, Vertex AI | ClearML Agent (local, Docker, K8s, AWS, GCP, Azure) |
| Availability | All tiers (SDK is open-source, server infra needed) | Open-source (self-hosted server) |

**Implication for unified backend:** Orchestration is a separate concern from experiment tracking.
A unified collector backend should focus on recording experiment data, not executing jobs. Both W&B
and ClearML's orchestration systems can continue to use their native infrastructure while the
experiment data they produce flows to the unified collector.

---

## 5. The Least Common Denominator

These entities and fields are **universally present** across all 5 tools and form the minimum
viable unified schema:

### LCD Core Schema

```
Workspace
  ├── id, name

Project
  ├── id, name, description
  ├── workspace_id (FK)

Run
  ├── id (UUID), name, display_name, description
  ├── project_id (FK)
  ├── status (enum: running, finished, failed, killed)
  ├── created_at, updated_at, finished_at
  ├── tags[] (string labels)

Config (Run hyperparameters)
  ├── run_id (FK)
  ├── data (JSON dict — nested, supports all tools)

MetricPoint (timeseries)
  ├── run_id (FK)
  ├── key (string)
  ├── value (float64)
  ├── step (int64)
  ├── timestamp (datetime)

Summary (final values)
  ├── run_id (FK)
  ├── data (JSON dict)

GitInfo
  ├── run_id (FK)
  ├── commit (string)
  ├── branch (string, nullable)
  ├── remote_url (string, nullable)
  ├── dirty (bool, nullable)

Tag
  ├── run_id (FK)
  ├── key (string)
  ├── value (string, nullable)  — W&B/Aim use simple strings, MLflow uses k-v

File (generic binary upload)
  ├── run_id (FK)
  ├── path (string — virtual path)
  ├── size_bytes (int64)
  ├── content_type (string)
  ├── digest (string — content hash)
  ├── storage_url (string)
```

### What the LCD Misses

The LCD is **restrictive** in these areas:

1. **No metric context/variant** — ClearML, Aim, and CometML all have this; W&B and MLflow
   use key naming conventions instead
2. **No artifact versioning or lineage** — Only file uploads, no version chains
3. **No model registry** — No stages, no promotion workflow
4. **No sweeps/HPO coordination** — No server-side optimization
5. **No pipelines/DAGs** — No task orchestration
6. **No system metrics** — Not all tools collect them by default
7. **No console output** — MLflow doesn't capture this
8. **No rich media types** — Only generic files, no typed images/audio/plots
9. **No reports/dashboards** — W&B, ClearML, and CometML all have reports; MLflow and Aim do not
10. **No environment details** — No packages, OS info, GPU info

---

## 6. Per-Tool Delta from LCD

### What each SDK logs that the LCD doesn't cover:

### W&B Delta
- **History with nested keys** (e.g., `{"train/loss": 0.5, "images": [<Image>, ...]}`)
- **System metrics** (CPU, GPU, memory, disk, network — every ~30s)
- **Console output** (stdout/stderr with timestamps)
- **Artifact system** (versioned, content-addressed, lineage, aliases, manifests)
- **Sweeps** (bayes/random/grid with server-side agent coordination — backend decides next trial)
- **Launch system** (Jobs as versioned Artifacts, RunQueues, Launch Agents — supports Docker, K8s, SageMaker, Vertex AI)
- **Reports** (rich block-based documents with embedded live panels, collaborative editing)
- **Code saving** (full source code directory upload + git diff)
- **Alerts** (in-run notifications with severity)
- **Tables** (structured data logged as media type in history)
- **Media types** (images, audio, video, HTML, plotly in history stream)

### MLflow Delta
- **Params are immutable and string-only** (actually more restrictive than LCD)
- **Dataset entity** (name + digest + source + schema + profile)
- **DatasetInput lineage** (run consumed dataset with context tags)
- **LoggedModel** (model metadata + status + framework)
- **Model Registry** (RegisteredModel → ModelVersion with stages, aliases, tags)
- **Extensive system tags** (`mlflow.*` namespace — ~30 auto-populated tags)
- **Trace/Span support** (OpenTelemetry integration for LLM tracing)
- **Run nesting** (`mlflow.parentRunId` tag for parent-child runs)

### ClearML Delta
- **Task types** (11 types: training, testing, inference, data_processing, controller, optimizer, service, qc, custom, monitor, application)
- **"Everything is a Task"** philosophy — Datasets, Pipeline steps, Reports are all Tasks under the hood
- **Nested projects** (hierarchical project tree with "/" separator)
- **Sectioned hyperparameters** (organized by named groups)
- **Two-dimensional metrics** (metric title + variant)
- **Rich event types** (scalar, vector, image, plot, log — each with full metadata)
- **Full code versioning** (repo, branch, commit, entry_point, working_dir, diff, requirements by section)
- **Model entity** (with parent lineage chain, framework, design, labels)
- **Dataset entity** (versioned with parent lineage, file entries with dedup)
- **Reports** (Markdown documents with live iframe-embedded experiment charts, built on Task entity)
- **Queue + Worker orchestration** (full remote execution system)
- **Pipeline controller** (DAG of tasks with dependency resolution)
- **Hyperparameter optimizer** (runs as optimizer Task, creates child Tasks, uses queue infra)
- **Task status machine** (10+ states including queued, publishing, closed)
- **Container/Docker config** per task
- **Tags as first-class query mechanism** (boolean AND/OR/NOT operators, formal system_tags separation)

### Aim Delta
- **Context-based metric grouping** (arbitrary dict context per metric sequence)
- **Typed sequences** (Metric, Image, Audio, Text, Distribution, Figure)
- **Rich Note entity** (with audit log)
- **Tag entity** (with color and description)
- **Custom query language** (expression-based run filtering)
- **Reservoir sampling** (efficient storage for large metric histories)
- **System metrics** (CPU, GPU, memory, disk — configurable interval)
- **Terminal log capture** (optional stdout/stderr)

### CometML Delta
- **14+ asset types** (image, audio, video, 3D, embedding, confusion matrix, curve, histogram3d, table, dataframe profile, notebook, text-sample, generic)
- **"Others" key-value store** (arbitrary metadata separate from params)
- **HTML blob** (per-experiment accumulated HTML)
- **System metrics** (4 separate streams: GPU, CPU, RAM, Load)
- **Python Panel system** (custom visualization code stored server-side)
- **Optimizer** (grid/random/bayes HPO coordination)
- **Artifact system** (versioned with semantic versions and aliases)
- **Model Registry** (with stages and webhook notifications)
- **Console output** (stdout/stderr with timestamps)
- **Full environment capture** (OS, Python, GPU static info, installed packages, OS packages)
- **Dashboard templates** (saved view configurations)

---

## 7. Unified Collector API Design Assessment

### 7.1 Recommended Architecture: LCD + Typed Extensions

Rather than trying to capture every tool's unique features, the unified collector should:

1. **Implement the LCD as the core schema** (runs, metrics, config, files, git info, tags)
2. **Add "LCD+" features** that 3+ tools share (system metrics, console output, environment info, metric context)
3. **Provide a generic extension mechanism** for tool-specific features (typed JSON blobs, generic asset store)
4. **Implement optional modules** for advanced features (artifact registry, model registry, sweep coordination)

### 7.2 LCD+ (Recommended Unified Core)

Beyond the LCD, these are worth including in the core because 3-4 tools support them natively:

```
MetricPoint (ENHANCED)
  + context (JSON dict, nullable)   — for ClearML variant, Aim context, CometML context
  + epoch (int64, nullable)         — ClearML, Aim, CometML all have this

SystemMetric (NEW)
  ├── run_id (FK)
  ├── timestamp (datetime)
  ├── cpu_percent (float, nullable)
  ├── memory_percent (float, nullable)
  ├── gpu_utilization (float, nullable)  — per GPU
  ├── gpu_memory_percent (float, nullable)
  ├── gpu_temperature (float, nullable)
  ├── disk_percent (float, nullable)
  ├── network_bytes_sent (int64, nullable)

ConsoleOutput (NEW)
  ├── run_id (FK)
  ├── timestamp (datetime)
  ├── stream (enum: stdout, stderr)
  ├── line (text)
  ├── level (string, nullable)    — for ClearML's leveled logs

EnvironmentInfo (NEW)
  ├── run_id (FK)
  ├── os (string)
  ├── python_version (string)
  ├── gpu_model (string, nullable)
  ├── gpu_count (int, nullable)
  ├── cpu_count (int, nullable)
  ├── installed_packages (JSON dict)  — {package: version}
  ├── environment_variables (JSON dict, nullable)
  ├── command_line_args (string[], nullable)

CodeInfo (ENHANCED GitInfo)
  ├── run_id (FK)
  ├── git_commit (string, nullable)
  ├── git_branch (string, nullable)
  ├── git_remote_url (string, nullable)
  ├── git_dirty (bool, nullable)
  ├── entry_point (string, nullable)     — script/notebook path
  ├── working_directory (string, nullable)
  ├── diff_patch_file_id (FK to File, nullable)  — uploaded diff

Asset (ENHANCED File, typed)
  ├── run_id (FK)
  ├── path (string)
  ├── type (enum: generic, image, audio, video, plot, table, model,
            distribution, text, html, confusion_matrix, embedding, notebook)
  ├── size_bytes (int64)
  ├── content_type (string)
  ├── digest (string)
  ├── storage_url (string)
  ├── step (int64, nullable)        — for step-indexed media
  ├── epoch (int64, nullable)
  ├── context (JSON, nullable)      — for context-grouped media
  ├── metadata (JSON, nullable)     — type-specific metadata
  ├── caption (string, nullable)    — for images/audio
```

### 7.3 Optional Modules

These should be separate API surfaces that can be enabled/disabled:

#### Module: Artifact Registry
```
ArtifactCollection
  ├── id, name, type, description
  ├── project_id (FK)

ArtifactVersion
  ├── id, collection_id (FK), version_index
  ├── digest (content hash)
  ├── metadata (JSON)
  ├── aliases[] (string)
  ├── created_by_run_id (FK, nullable)
  ├── size_bytes, file_count

ArtifactFile
  ├── version_id (FK)
  ├── path, digest, size_bytes
  ├── source_version_id (FK, nullable)  — for dedup

RunArtifactLink (lineage)
  ├── run_id (FK), version_id (FK)
  ├── direction (enum: input, output)
```

#### Module: Model Registry
```
RegisteredModel
  ├── id, name, description
  ├── workspace_id (FK)

ModelVersion
  ├── id, model_id (FK), version
  ├── source_run_id (FK, nullable)
  ├── stage (enum: none, staging, production, archived)
  ├── status (enum: ready, pending, failed)
  ├── artifact_uri (string)
  ├── metadata (JSON)
```

#### Module: Sweep/HPO Coordination
```
Sweep
  ├── id, name, project_id (FK)
  ├── method (enum: grid, random, bayes)
  ├── metric_name, metric_goal (enum: minimize, maximize)
  ├── search_space (JSON)  — parameter ranges/distributions
  ├── state (enum: running, paused, completed, stopped)

Run.sweep_id (FK, nullable)  — links run to sweep
```

#### Module: Reports
```
Report
  ├── id, title, description
  ├── project_id (FK)
  ├── author_id (FK to User)
  ├── status (enum: draft, published, archived)
  ├── created_at, updated_at, published_at
  ├── content_blocks (JSON array of typed blocks)
  │     Block types:
  │       ├── markdown (text content)
  │       ├── panel_grid (chart configs + run set filters)
  │       ├── image (uploaded or referenced)
  │       └── heading, code, callout, etc.
  ├── tags[]

Note: W&B uses rich typed blocks; ClearML uses Markdown + iframe embeds.
The simplest viable approach is Markdown with embedded chart references
(chart_type + run filter + metric names), which can be progressively
enhanced to a full block editor.
```

#### Module: Tags (Enhanced — LCD+ core recommended)
```
Tag (first-class entity, Aim-inspired)
  ├── id (PK), name (UK within scope)
  ├── color (hex string, nullable)
  ├── description (nullable)
  ├── is_archived (bool)
  ├── scope (enum: workspace, project)
  ├── created_at, updated_at

RunTag (join table)
  ├── run_id (FK), tag_id (FK)

ProjectTag, ArtifactTag, ModelTag (additional join tables)

SystemTag (separate from user tags, like ClearML)
  ├── entity_type, entity_id, key, value

Query support: AND/OR/NOT operators (ClearML-style)
```

---

## 8. Recommended Unified Schema

### Complete ERD

```
┌──────────────┐
│  Workspace   │
│──────────────│
│ id (PK)      │
│ name (UK)    │
│ description  │
└──────┬───────┘
       │ 1:N
       ▼
┌──────────────┐
│   Project    │
│──────────────│
│ id (PK)      │
│ workspace_id │◄─── FK
│ name         │     (UK: workspace_id + name)
│ description  │
│ created_at   │
└──────┬───────┘
       │ 1:N
       ▼
┌────────────────────────────────────────────┐
│                   Run                       │
│─────────────────────────────────────────── │
│ id (PK, UUID)                               │
│ project_id (FK)                             │
│ name (display name)                         │
│ description                                 │
│ status (running/finished/failed/killed)     │
│ source_sdk (wandb/mlflow/clearml/aim/comet) │ ◄── identifies origin
│ created_at, updated_at, finished_at         │
│ duration_seconds                            │
│ tags[] ──M:N── Tag (first-class entity)      │
│ config (JSON dict — hyperparams)            │
│ summary (JSON dict — final metrics)         │
│ sweep_id (FK, nullable)                     │
│ parent_run_id (FK, nullable)                │ ◄── for nested runs
│ metadata (JSON — sdk-specific extras)       │
└────┬──────┬──────┬──────┬──────┬───────────┘
     │      │      │      │      │
     │      │      │      │      └──────────────────┐
     │      │      │      └─────────────┐           │
     │      │      └──────────┐         │           │
     │      └───────┐         │         │           │
     ▼              ▼         ▼         ▼           ▼
┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐ ┌──────────────┐
│MetricPoint│ │  Asset   │ │Console │ │SystemMet.│ │  CodeInfo    │
│──────────│ │──────────│ │Output  │ │──────────│ │──────────────│
│run_id FK │ │run_id FK │ │────────│ │run_id FK │ │run_id FK     │
│key       │ │path      │ │run_id  │ │timestamp │ │git_commit    │
│value f64 │ │type enum │ │timestamp│ │cpu_pct   │ │git_branch    │
│step i64  │ │size      │ │stream  │ │mem_pct   │ │git_remote    │
│epoch i64?│ │digest    │ │line    │ │gpu_util  │ │git_dirty     │
│timestamp │ │url       │ │level?  │ │gpu_mem   │ │entry_point   │
│context {}│ │step?     │ └────────┘ │gpu_temp  │ │working_dir   │
└──────────┘ │metadata{}│            │disk_pct  │ │diff_file FK? │
             │caption?  │            └──────────┘ │env_info JSON │
             └──────────┘                         └──────────────┘

First-class entities:
┌────────────────┐
│      Tag       │  ◄── Aim-inspired, with ClearML query power
│────────────────│
│ id, name (UK)  │
│ color, desc    │
│ is_archived    │
│ scope          │
└────────────────┘
  M:N with Run, Project, Artifact, Model

Optional Modules:
┌──────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ArtifactCollection│     │ RegisteredModel  │     │     Sweep       │
│──────────────────│     │──────────────────│     │─────────────────│
│id, name, type    │     │id, name          │     │id, name         │
│project_id FK     │     │workspace_id FK   │     │project_id FK    │
│  │               │     │  │               │     │method, metric   │
│  ├─ Version      │     │  ├─ ModelVersion │     │search_space JSON│
│  │  ├─ files[]   │     │  │  ├─ stage     │     │state            │
│  │  ├─ aliases[] │     │  │  ├─ run_id FK │     └─────────────────┘
│  │  ├─ metadata  │     │  │  ├─ artifact  │
│  │  └─ digest    │     │  │  └─ metadata  │
│  └─ lineage links│     │  └─ aliases[]    │
└──────────────────┘     └──────────────────┘

┌──────────────────┐
│     Report       │
│──────────────────│
│ id, title        │
│ project_id FK    │
│ status           │
│ content_blocks[] │
│ (markdown +      │
│  chart embeds)   │
└──────────────────┘

RunArtifactLink
  run_id FK ──── version_id FK
  direction: input | output
```

---

## 9. SDK Plugin Requirements

For each SDK, here's what a plugin/adapter would need to do to bridge to the unified collector:

### 9.1 W&B SDK Plugin

**Mapping complexity: Medium**

| W&B Concept | Unified Mapping | Notes |
|------------|----------------|-------|
| Entity/Project | Workspace/Project | Direct |
| Run | Run | Direct |
| Config | Run.config (JSON) | Direct |
| Summary | Run.summary (JSON) | Direct |
| History | MetricPoint | Flatten nested keys, no context needed |
| Stats | SystemMetric | Direct |
| Output | ConsoleOutput | Direct |
| GitInfo | CodeInfo | Direct |
| File | Asset (type=generic) | Direct |
| Artifact | ArtifactCollection + Version | Need artifact module |
| Sweep | Sweep module | Need sweep module |
| Report | **Not mappable** | Would need Report module or generic doc store |
| Alert | Run.metadata or separate entity | Minor |
| Media in History | Asset with step | Separate from metric stream |

**Plugin work needed:**
- Intercept `wandb.init()` → create Run via collector API
- Intercept `run.log()` → split into MetricPoints + Assets (for media)
- Intercept artifact operations → artifact module API
- Sweep coordination → sweep module API
- Reports: either drop or build a Report module

### 9.2 MLflow SDK Plugin

**Mapping complexity: Low (simplest to adapt)**

| MLflow Concept | Unified Mapping | Notes |
|---------------|----------------|-------|
| Experiment | Project | Direct |
| Run | Run | Direct |
| Param | Run.config (JSON), flatten k-v | Values stored as strings in MLflow |
| Metric | MetricPoint | Direct |
| LatestMetric | Run.summary | Compute on ingest |
| RunTag | Run.tags + Run.metadata | System tags → metadata |
| Artifact (files) | Asset | Direct |
| Dataset | ArtifactCollection (type=dataset) | Need artifact module |
| LoggedModel | Asset (type=model) + metadata | Or model registry module |
| RegisteredModel | RegisteredModel module | Need model registry module |
| Trace/Span | **Not mappable** | LLM tracing is out of scope |

**Plugin work needed:**
- Override `MlflowClient` or tracking store to point at collector API
- Map `mlflow.*` system tags to CodeInfo + EnvironmentInfo
- String params → JSON config conversion
- Model registry adapter if module enabled

### 9.3 ClearML SDK Plugin

**Mapping complexity: High (richest data model)**

| ClearML Concept | Unified Mapping | Notes |
|----------------|----------------|-------|
| Project (nested) | Project (flatten with "/" names) | Minor adjustment |
| Task | Run | Map task.type to Run.metadata |
| Hyperparameters (sectioned) | Run.config (JSON, nested by section) | Preserve sections as nested keys |
| Configuration | Run.config (separate namespace) | Merge into config JSON |
| MetricScalar | MetricPoint (context={"variant": variant}) | Two-dimensional → context |
| MetricImage | Asset (type=image, step=iter) | |
| MetricPlot | Asset (type=plot, metadata={plotly_json}) | |
| MetricVector | Asset (type=distribution) or MetricPoint[] | Lossy if flattened |
| LogEvent | ConsoleOutput (with level) | Direct |
| Script | CodeInfo | Most complete → direct |
| Artifact | Asset | Direct |
| Model | RegisteredModel module | Need model registry |
| Dataset | ArtifactCollection module | Need artifact module |
| Queue/Worker | **Not mappable** | Orchestration is out of scope |
| Pipeline | **Not mappable** | DAG orchestration is out of scope |
| HPO | Sweep module | Need sweep module |
| Task types | Run.metadata.task_type | Preserve as metadata |
| Task status | Run.status (map 10+ → 4 states) | Lossy compression |

**Plugin work needed:**
- Override `clearml.Task._connect()` to point at collector API
- Map sectioned hyperparams to nested JSON
- Translate two-dimensional metrics to context-based metrics
- Pipeline/queue features: cannot be mapped (orchestration not in scope)
- Most complex adapter due to ClearML's rich type system

### 9.4 Aim SDK Plugin

**Mapping complexity: Low-Medium**

| Aim Concept | Unified Mapping | Notes |
|------------|----------------|-------|
| Repo | Workspace | Direct |
| Experiment | Project | Direct |
| Run | Run | Direct |
| run[params] | Run.config (JSON) | Direct (both nested dicts) |
| Metric + Context | MetricPoint + context | Direct (Aim pioneered this pattern) |
| ImageSequence | Asset (type=image, step) | |
| AudioSequence | Asset (type=audio, step) | |
| TextSequence | Asset (type=text, step) | |
| DistributionSequence | Asset (type=distribution, step) | |
| FigureSequence | Asset (type=plot, step) | |
| Tag | Run.tags (but lose color/description) | Minor loss |
| Note | Run.description or separate entity | Minor loss |
| System metrics | SystemMetric | Direct |
| __system_params | CodeInfo + EnvironmentInfo | Split and map |

**Plugin work needed:**
- Override `aim.Run` or `aim.Repo` to use collector API as storage backend
- Map Context dict directly to MetricPoint.context
- Typed sequences → Assets with step indexing
- System params → split into CodeInfo + EnvironmentInfo

### 9.5 CometML SDK Plugin

**Mapping complexity: Medium (closed-source SDK complicates things)**

| CometML Concept | Unified Mapping | Notes |
|----------------|----------------|-------|
| Workspace/Project | Workspace/Project | Direct |
| Experiment | Run | Direct |
| Metric | MetricPoint (context from context field) | Direct |
| Parameter | Run.config (JSON) | Flatten k-v to dict |
| OtherKeyValue | Run.metadata | Or merge into config |
| Tag | Run.tags | Direct |
| Asset (14+ types) | Asset (with type discriminator) | Direct — CometML pioneered this |
| SystemDetails | EnvironmentInfo | Direct |
| GitMetadata | CodeInfo | Direct |
| GitPatch | Asset (type=generic, path="git.patch") | Upload as file |
| SystemMetrics | SystemMetric | Merge 4 endpoints → 1 |
| ConsoleOutput | ConsoleOutput | Direct |
| HTML | Asset (type=html) or Run.metadata | |
| Artifact | ArtifactCollection module | Need artifact module |
| RegistryModel | RegisteredModel module | Need model registry |
| Optimizer | Sweep module | Need sweep module |
| Panel | **Not mappable** | Custom viz code is tool-specific |

**Plugin work needed:**
- Since SDK is closed-source, plugin must be a **proxy server** that speaks CometML's REST API
  and translates to collector API (cannot modify SDK internals)
- Map 4 system metric endpoints → unified SystemMetric
- Asset type mapping (CometML has most types → good fit for unified Asset)
- Panels: cannot be mapped (tool-specific visualization code)

---

## 10. Feasibility Summary

### What's Easily Achievable (Core)

A unified backend that captures **runs, metrics (with context), config, summary, tags, files,
git info, environment info, system metrics, and console output** from all 5 SDKs. This covers
the day-to-day workflow of:

- Starting an experiment
- Logging hyperparameters
- Tracking loss/accuracy curves
- Comparing runs across tools
- Viewing system resource usage
- Browsing uploaded files and media

**Estimated effort for core:** Medium. The data model is well-defined. The main work is writing
5 SDK adapters.

### What's Achievable with Modules (Advanced)

- **Artifact versioning + lineage** (W&B, ClearML, CometML need this; MLflow/Aim don't)
- **Model registry** (MLflow, ClearML, CometML; W&B uses artifacts)
- **Sweep/HPO coordination** (W&B, ClearML, CometML)

**Estimated effort for modules:** High. Each module is a significant backend feature.

### What's Not Feasible to Unify (Orchestration Concerns)

- **Job execution/orchestration** (W&B Launch, ClearML Queues+Workers+Pipelines) — these are
  job schedulers, not experiment tracking. Let each tool keep its native infra; the unified
  backend just records the experiment data that results from job execution.
- **Server-side sweep coordination** (W&B's Bayesian sweep controller) — complex backend feature
  with diminishing returns. Users can bring Optuna/Hyperopt client-side and group runs by sweep_id.
- **CometML Python Panels** — tool-specific custom visualization code
- **MLflow Traces/Spans** — LLM observability, different domain

### What IS Feasible to Unify (and was initially missed)

- **Reports** — W&B, ClearML, and CometML all have them. A unified report model (markdown +
  embedded chart references) is achievable. ClearML's "reports as Tasks with iframe embeds"
  shows the simplest viable approach.
- **Tags as first-class entities** — with Aim's rich model (color, description, CRUD) +
  ClearML's query operators (AND/OR/NOT) + broad scope (runs, projects, artifacts, models)

### Recommended Approach

1. **Phase 1:** Build the LCD+ core (runs, metrics with context, config, summary, first-class tags
   with CRUD + boolean query, typed assets, git/code info, environment, system metrics, console output)
2. **Phase 2:** Add artifact registry module (critical for W&B and ClearML users)
3. **Phase 3:** Add model registry module
4. **Phase 4:** Add reports module (markdown + embedded chart references)
5. **Phase 5:** Add sweep grouping (store sweep config + run→sweep links; skip server-side
   optimization — let users bring Optuna/etc. client-side)
6. **For each phase:** Build SDK adapters (MLflow first — simplest, then Aim, W&B, CometML, ClearML)

### The CometML Problem

CometML's SDK is closed-source, so the adapter must be a **REST API proxy** that mimics
CometML's REST API surface. This is actually well-documented and feasible — their REST API
has clean endpoint definitions. You'd implement a server that speaks CometML's REST protocol
and translates to your collector API.

### The 80/20 Rule

With just the LCD+ core, you capture ~80% of the data that ~80% of users care about. The
remaining 20% (advanced artifacts, model registry, sweeps) are important for production ML
teams but can be phased in as optional modules.
