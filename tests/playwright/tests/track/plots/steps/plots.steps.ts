/**
 * Step definitions for track/plots feature files.
 */
import { expect } from '@playwright/test';
import { When, Then } from '../../../../steps/fixtures';

When(
  'I wait for charts to render',
  async ({ authedPage }) => {
    // Run detail Charts tab doesn't have "Add panels" — wait for the Charts tab instead
    await authedPage
      .getByRole('tab', { name: /Charts/i })
      .first()
      .waitFor({ timeout: 30_000 });
    await authedPage.waitForTimeout(3000);
  }
);

Then(
  'I should see chart content matching {string}',
  async ({ authedPage }, pattern: string) => {
    const re = new RegExp(pattern, 'i');
    await expect(
      authedPage.getByText(re).first()
    ).toBeVisible({ timeout: 15_000 });
  }
);
