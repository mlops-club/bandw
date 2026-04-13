# W&B Feature Ranking: Core to Least Core

Ranked by what the SDK **must** talk to vs. what is nice-to-have.
Each tier builds on the previous one.

---

## Tier 0: Absolute Minimum (SDK won't start without these)

These are called on every `wandb.init()` before a single metric is logged.

| Feature | GraphQL Operations | Why Critical |
|---|---|---|
| **Authentication** | HTTP Basic or Bearer on every request; `POST /oidc/token` if using identity tokens | SDK refuses to start without valid auth |
| **Viewer + server info** | `Viewer`, `ServerInfo` | SDK needs identity and version metadata during init |
| **Run create/update** | `UpsertBucket` mutation | `wandb.init()` creates the run record |
| **File stream endpoint** | `POST /files/{entity}/{project}/{run}/file_stream` | Metrics, summary, console output, heartbeats, and final completion all flow here |

**Effort to implement:** ~1-2 weeks. This gets `wandb.init()` + `wandb.log()` + `wandb.finish()` working.

---

## Tier 1: Core Experiment Tracking (the "hello world" experience)

| Feature | Operations | Why Important |
|---|---|---|
| **Feature flags / compatibility probes** | `ServerFeaturesQuery` | Gates artifact/download behavior on newer servers |
| **Run resume** | `RunResumeStatus` query | Used when resume/rewind is requested |
| **Run file upload** | `CreateRunFiles` mutation + pre-signed URL PUT | Upload model checkpoints, saved files |
| **Config & summary** | Part of `UpsertBucket` + file_stream | Hyperparameters and final metrics |
| **History query** | `HistoryPage`, `SampledHistoryPage` | Read back logged metrics (needed by UI and public API) |
| **Run stop status** | `RunStoppedStatus` query | Check if user requested run stop from UI |
| **Projects CRUD** | `GetProjects`, `GetProject`, `CreateProject` | Organize runs into projects |
| **Run detail screens** | `RunInfo`, `RunState`, `RunDownloadUrls`, `RunDownloadUrl` | Needed for restoring files and viewing run metadata |
| **Console output** | Part of file_stream (`output.log`) | Capture stdout/stderr |
| **System metrics** | Part of file_stream (`wandb-events.jsonl`) | GPU/CPU/memory utilization |
| **Alerts** | `NotifyScriptableRunAlert` | `wandb.alert()` sends notifications |

**Effort:** ~2-4 weeks on top of Tier 0. This gives you a working experiment tracker.

---

## Tier 2: Artifacts & Model Registry (your stated priority)

| Feature | Operations | Why Important |
|---|---|---|
| **Create artifact** | `CreateArtifact`, `CreateArtifactType` | Register dataset/model artifacts |
| **Artifact manifest** | `CreateArtifactManifest`, `UpdateArtifactManifest` | Describe artifact contents and upload the finalized manifest |
| **Artifact file upload** | `CreateArtifactFiles`, `CompleteMultipartUploadArtifact` + URL PUT | Upload artifact binary data to object storage |
| **Commit artifact** | `CommitArtifact` | Finalize artifact after upload |
| **Use artifact** | `UseArtifact`, `ClientIDMapping` | Track lineage and resolve client IDs during save |
| **Artifact queries** | `ArtifactByID`, `ArtifactByName`, `ArtifactMembershipByName`, `FetchArtifactManifest`, `GetArtifactFiles`, `GetArtifactFileUrls`, `ArtifactFileURLsByManifestEntries` | Download and inspect artifacts |
| **Artifact download handlers** | `GET /artifacts/...`, `GET /artifactsV2/...` | The SDK uses these in addition to signed URLs |
| **Artifact collections** | `ProjectArtifactCollections`, `ProjectArtifactCollection`, `ProjectArtifactTypes`, `ProjectArtifactType`, `ArtifactCollectionAliases` | Browse artifact types and sequences |
| **Run I/O artifacts** | `RunInputArtifacts`, `RunOutputArtifacts` | Lineage graph |
| **Artifact lineage metadata** | `ArtifactCreatedBy`, `ArtifactUsedBy`, `FetchLinkedArtifacts` | Needed for detail views and registry links |
| **Link to registry** | `LinkArtifact`, `UnlinkArtifact` | Promote artifacts to model registry |
| **Aliases** | `AddAliases`, `DeleteAliases` | Tag versions ("production", "staging") |
| **Artifact metadata updates** | `UpdateArtifact` | Update metadata after create |
| **Registry CRUD** | `FetchRegistries`, `FetchRegistry`, `UpsertRegistry`, `DeleteRegistry`, `RenameRegistry` | Manage model registries |
| **Registry collections** | `RegistryCollections`, `RegistryVersions` | Browse registry contents |
| **Registry members** | `RegistryTeamMembers`, `RegistryUserMembers`, `CreateRegistryMembers`, `DeleteRegistryMembers` | Access control |
| **Registry roles** | `UpdateUserRegistryRole`, `UpdateTeamRegistryRole` | Permission management |
| **Artifact tags** | `AddArtifactCollectionTags`, `DeleteArtifactCollectionTags` | Organize artifacts |
| **Artifact deletion** | `DeleteArtifact`, `DeleteArtifactSequence`, `DeleteArtifactPortfolio` | Cleanup |

**Effort:** ~4-6 weeks. This is the largest tier and gives you full model lifecycle management.

---

## Tier 3: Collaboration & SSO (your stated priority)

| Feature | Operations | Why Important |
|---|---|---|
| **OIDC/SSO authentication** | `/oidc/token` identity-token exchange, JWT validation | Enterprise SSO (Okta, Azure AD, Auth0, Keycloak) |
| **Teams** | `CreateTeam`, `GetTeamEntity` | Organize users into teams |
| **Invitations** | `CreateInvite`, `DeleteInvite` | Team member management |
| **Service accounts** | `CreateServiceAccount` | CI/CD pipelines need non-human accounts |
| **API key management** | `GenerateApiKey`, `DeleteApiKey` | Per-user/per-service auth tokens |
| **User search** | `SearchUsers` | Find users for collaboration |
| **Admin user creation** | `CreateUserFromAdmin` | Self-hosted admin bootstrap |
| **Org/entity resolution** | `FetchOrgEntityFromEntity`, `FetchOrgEntityFromOrganization`, `FetchOrgInfoFromEntity`, `GetDefaultEntity` | Multi-org support |

**Effort:** ~2-3 weeks. OIDC integration is the main work item.

---

## Tier 4: Advanced Features (nice to have)

| Feature | Description | Effort |
|---|---|---|
| **Tables & custom charts** | Log structured data (wandb.Table), custom Vega/Plotly charts | Medium |
| **Media logging** | Images, audio, video, 3D objects, molecules | Medium (mostly storage + UI rendering) |
| **Reports** | Collaborative documents with embedded charts | Large (requires rich text editor) |
| **Run rewind** | `RewindRun` mutation - roll back a run to earlier state | Small |
| **Parquet export** | `RunParquetHistory` query - export history as Parquet | Medium |
| **Webhooks** | Fire HTTP callbacks on artifact events | Medium |

---

## Implementation Priority Recommendation

For your goals (experiment tracking + model registry + SSO + collaboration):

```
Phase 1 (MVP):       Tier 0 + Tier 1     ~3-4 weeks
Phase 2 (Registry):  Tier 2              ~4-6 weeks
Phase 3 (Enterprise): Tier 3             ~2-3 weeks
                                         ─────────
                                Total:   ~9-13 weeks
```

Phase 1 alone makes the `wandb` SDK functional. Phase 2 adds the model registry.
Phase 3 adds SSO and team collaboration. Everything after that is optional.
