/**
 * Step definitions for bar-plot feature files.
 *
 * Most steps are reused from common.steps.ts and line-plot.steps.ts.
 * "I click the Add panels button" is defined in scatter-plot.steps.ts
 * and loaded globally by playwright-bdd.
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// Then — panel picker assertions
// ---------------------------------------------------------------------------

Then(
  'I should see panel type options in the picker',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/Bar chart|Scatter|Parallel/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);
