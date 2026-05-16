/**
 * Step definitions specific to track/config feature files.
 *
 * Steps that are reusable across areas live in steps/common.steps.ts.
 * Only config-area-specific steps belong here.
 */
import { expect } from '@playwright/test';
import { When, Then } from '../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// When — navigation with scroll (config-from-file needs this)
// ---------------------------------------------------------------------------

When(
  'I open the run overview page and scroll to the bottom',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = (sdkData as any)._currentRun ?? sdkData.runs[0];
    const url = `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`;
    await authedPage.goto(url);
    await authedPage.getByRole('tab', { name: 'Overview' }).waitFor();

    // Scroll to the bottom so config section below the fold is visible
    await authedPage.keyboard.press('End');
    await authedPage.waitForTimeout(1000);
  }
);

// ---------------------------------------------------------------------------
// Then — config key presence (without checking a specific value)
// ---------------------------------------------------------------------------

Then(
  'the config section should contain key {string}',
  async ({ authedPage }, key: string) => {
    const configSection = authedPage
      .getByRole('list')
      .filter({ hasText: 'Config parameters' });
    await configSection.waitFor({ timeout: 10_000 });

    await expect(configSection.getByText(`${key}:`)).toBeVisible();
  }
);
