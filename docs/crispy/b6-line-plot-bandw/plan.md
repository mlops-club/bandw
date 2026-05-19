# B6 Line Plot bandw — Plan

## Vertical Slices

### Slice 1: Add "Add panels" + "Settings" buttons to workspace
**What**: Add toolbar buttons that match the reference UI's workspace toolbar
**Why**: Tests use these as workspace load signals and entry points
**Verification**: `npx playwright test --project=bandw tests/app/panels/line-plot/add-single-metric.spec.ts` passes

- [x] Add "Add panels" button to workspace toolbar
- [x] Add "Settings" button to workspace toolbar
- [x] Verify: add-single-metric passes bandw (2/2)
- [x] Verify: add-single-metric still passes the reference

### Slice 2: Run B6 suite and count pass rate
**What**: Run all 38 B6 tests against bandw
**Verification**: Count passes

- [x] Run full B6 against bandw — **38/38 PASSED**
- [x] Record pass/fail count — 38 passed, 0 failed
- [x] Update INDEX.md B6 row — all 6 columns checked

### Slice 3: Fix remaining failures (if any)
**What**: Iterate on remaining failures using screenshot-driven fixes
**Verification**: All 38 pass bandw

- [ ] Analyze remaining failure screenshots
- [ ] Fix frontend gaps
- [ ] Re-run until green
