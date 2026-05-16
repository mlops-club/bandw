/**
 * Step definitions for artifacts/advanced feature files.
 *
 * Reuses navigation steps from artifacts/core/steps/artifacts-core.steps.ts
 * (loaded globally by playwright-bdd). Only advanced-specific steps here.
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// When — file browser
// ---------------------------------------------------------------------------

When(
  'I click on {string} in the file browser',
  async ({ authedPage }, itemName: string) => {
    await authedPage.getByText(itemName).click();
  }
);

// ---------------------------------------------------------------------------
// When — delete flow
// ---------------------------------------------------------------------------

When(
  'I click the delete artifact button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /delete/i }).click();
  }
);

Then(
  'I should see a confirmation dialog',
  async ({ authedPage }) => {
    await expect(authedPage.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
  }
);

// NOTE: 'I confirm the deletion' is defined in workspaces.steps.ts (shared)
