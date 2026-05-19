/**
 * Step definitions for scatter-plot feature files.
 *
 * Scatter-plot-specific steps that complement the shared steps in
 * line-plot.steps.ts and common.steps.ts.
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// When — panel picker interactions
// ---------------------------------------------------------------------------

// NOTE: 'I click the Add panels button' is defined in media.steps.ts (shared)

// ---------------------------------------------------------------------------
// Then — panel picker assertions
// ---------------------------------------------------------------------------

Then(
  'I should see chart type options in the panel picker',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/Scatter|Bar chart|Parallel/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);
