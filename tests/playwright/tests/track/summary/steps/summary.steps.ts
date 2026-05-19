/**
 * Step definitions specific to track/summary features.
 *
 * Reuses from common.steps.ts: Given a run named, When I open the run overview page,
 *   Then the summary section should show {string} with value {string}
 * Reuses from common.steps.ts: When I scroll to the bottom of the page,
 *   Then the summary section should show {string}
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// When — navigation
// ---------------------------------------------------------------------------

When(
  'I open the project table page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const url = `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`;
    await authedPage.goto(url);
    await authedPage.getByText('NAME').first().waitFor({ timeout: 30_000 });
  }
);

// Note: "I click the Sort button" is defined in project-page.steps.ts

// ---------------------------------------------------------------------------
// Then — runs table assertions
// ---------------------------------------------------------------------------

Then(
  'the run {string} should be visible in the table',
  async ({ authedPage }, displayName: string) => {
    await expect(
      authedPage.getByText(displayName).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the table should have a column named {string}',
  async ({ authedPage }, columnName: string) => {
    await expect(
      authedPage.getByText(columnName).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);
