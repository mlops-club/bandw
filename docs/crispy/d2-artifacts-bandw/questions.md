# D2 Artifacts — Research Questions

## Backend Questions
1. What GraphQL mutations does the wandb SDK use to create/log artifacts?
   - `createArtifact`? `logArtifact`? What fields?
2. How does the SDK upload artifact files?
   - Is it through the file_stream endpoint or a separate upload path?
   - What content types are supported?
3. How are artifact versions tracked?
   - Auto-increment? Semantic versioning?
   - What's the relationship between artifact type, name, and version?
4. What does the `use_artifact` flow look like in GraphQL?
   - Does it create a lineage edge?
5. How does the SDK handle artifact aliases (e.g., "latest", "best")?

## Frontend Questions
6. What does the wandb artifacts browser look like?
   - Sidebar tree structure? Type → Name → Version hierarchy?
7. What artifact detail tabs exist?
   - Files, Metadata, Usage, Versions, Lineage?
8. What does the lineage/DAG graph look like?
   - How are producing/consuming runs connected?

## Test Requirements
9. Which D2a/D2b tests need full artifact CRUD vs. just listing?
10. Which tests navigate to artifact detail pages vs. just checking sidebar?
