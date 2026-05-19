# B6 Line Plot — bandw Research Questions

## Context
B6 has 38 line-plot tests that pass against the reference (38/38). They need to also pass against our bandw frontend. The tests check workspace features: chart panels, "Add panels" button, Settings button, Edit panel, chart section headers, run sidebar, etc.

## Research Questions

1. **Which B6 tests fail against bandw and why?** What are the specific failure screenshots and error locators?

2. **What does our bandw workspace page currently render?** What ARIA roles and text content does it expose?

3. **Does our workspace have an "Add panels" button?** The B6 tests use `getByRole('button', { name: 'Add panels' })` as the workspace load signal.

4. **Does our workspace show "Settings" or "Workspace settings" button?** Several tests check for settings entry points.

5. **Does our workspace show chart section headers** like "Charts", "train", "val"? Tests use `getByText(/Charts|train|val/).first()`.

6. **Does our run detail page have a Charts tab** that renders chart panels? Tests navigate to `runs/{runId}` and check for chart content.

7. **What UI elements are missing** from our bandw workspace that the tests expect? (Edit panel button, panel drag handles, section collapse/expand, etc.)

8. **What's the minimal set of UI additions** needed to get B6 passing against bandw without compromising test quality?
