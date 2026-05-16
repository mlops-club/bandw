/**
 * Step definitions for runs/compare feature files.
 *
 * Most steps are reused from shared definitions:
 * - steps/common.steps.ts (SDK setup, navigation, generic visibility)
 * - tests/app/panels/line-plot/steps/line-plot.steps.ts (workspace load, chart content, controls)
 * - tests/app/panels/scatter-plot/steps/scatter-plot.steps.ts (Add panels button, chart type options)
 * - tests/track/project-page/steps/project-page.steps.ts (first run name visible)
 * - tests/track/summary/steps/summary.steps.ts (open project table page)
 *
 * Only steps unique to compare-runs are defined here.
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// Then — run name assertions
// ---------------------------------------------------------------------------

Then(
  'the second run name should be visible',
  async ({ authedPage, sdkData }) => {
    const run1Name = sdkData.runs[1].displayName || sdkData.runs[1].name;
    await expect(authedPage.getByText(run1Name).first()).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// Then — table metric assertions
// ---------------------------------------------------------------------------

Then(
  'I should see metric column headers in the table',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/loss|accuracy|val/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);
