/**
 * Step definitions for line-plot feature files.
 *
 * These steps cover workspace loading, chart content assertions, and
 * workspace control visibility checks specific to the line-plot panel tests.
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// When — workspace loading
// ---------------------------------------------------------------------------

When(
  'I wait for the workspace to load',
  async ({ authedPage }) => {
    await authedPage
      .getByRole('button', { name: 'Add panels' })
      .waitFor({ timeout: 30_000 });
    await authedPage.waitForTimeout(3000);
  }
);

// ---------------------------------------------------------------------------
// Then — chart content assertions
// ---------------------------------------------------------------------------

Then(
  'I should see chart content in the workspace',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/Charts|train|val/).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see chart or axis content in the workspace',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/Charts|train|val|Step/).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// Then — workspace control assertions
// ---------------------------------------------------------------------------

Then(
  'the Add panels button should be visible',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('button', { name: 'Add panels' })
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'workspace settings controls should be visible',
  async ({ authedPage }) => {
    await expect(
      authedPage
        .getByRole('button', { name: /Settings|Workspace settings|Add panels/ })
        .first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// Then — run charts tab assertions
// ---------------------------------------------------------------------------

Then(
  'the Charts tab should be visible',
  async ({ authedPage }) => {
    const tab = authedPage.getByRole('tab', { name: 'Charts' });
    await tab.waitFor({ timeout: 30_000 });
    await expect(tab).toBeVisible({ timeout: 10_000 });
  }
);
