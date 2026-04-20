# Playwright Test Pass Rate

Last updated: 2026-04-20 12:00 PM MDT

## FINAL SESSION STATUS

### wandb.ai: 285/285 — ALL TESTS PASS
### bandw: ~261/285 — 92% passing

| Phase | Batch | Total | wandb.ai | bandw |
|-------|-------|-------|----------|-------|
| P0 | B1-B6 | 101 | **101** | **101** |
| P1 C1a | workspaces | ~30 | **30** | ~25 |
| P1 C1b | overview | 9 | **9** | **9** |
| P1 C1c | cascade | 35 | **35** | **31** |
| P1 C2+C3 | panels/runs | 95 | **95** | **95** |
| P2 D1-D4 | various | ~15 | **15** | ~few (SDK deps) |
| **Total** | | **~285** | **285** | **~261** |

## What was built this session:
- 175 Playwright spec files + 32 SDK setup scripts
- Chrome Keychain cookie extraction for auth
- Go backend: GraphQL schema fixes, Public API support
- Svelte frontend: Run detail (tabs, config/summary search, notes, tags, files/artifacts), Workspace (charts, metric discovery, settings panel, section settings, edit panel modal with 5 tabs, Add panels + Settings buttons), Table (auto-generated columns, checkboxes, group-by, filter, sort), Overview (contributors), Reports/Artifacts pages
- ARIA: All tests use getByText/getByRole
- Infrastructure: File-based SDK caching, OptanonConsent cookies, addInitScript auth

## Remaining ~24 bandw failures:
- C1a: 5 (keyboard shortcuts, regex search)
- C1c: 4 (multi-section workspace)
- D1-D4: ~15 (SDK setup dependencies: pillow, sklearn, plotly)

## 250+ uncommitted files ready for commit
