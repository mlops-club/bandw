/**
 * Step definitions for app/panels/query-panels feature files.
 *
 * Reuses: common.steps.ts, line-plot.steps.ts
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// When — query panel creation
// ---------------------------------------------------------------------------

When(
  'I click the query panel type',
  async ({ authedPage }) => {
    await authedPage
      .getByRole('button', { name: /query panel/i })
      .or(authedPage.getByText(/query panel/i))
      .first()
      .click();
  }
);

When(
  'I enter a table summary expression',
  async ({ authedPage }) => {
    const editor = authedPage.getByRole('textbox').first();
    await editor.fill('runs.summary["results_table"]');
  }
);

// ---------------------------------------------------------------------------
// Then — query panel assertions
// ---------------------------------------------------------------------------

Then(
  'I should see a query expression editor',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('textbox').or(authedPage.getByText(/expression/i))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a query result visualization',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('table').or(authedPage.getByRole('figure')).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see query result with data',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('table').or(authedPage.getByText(/epoch/i))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a column header or metric data',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('columnheader').first()
        .or(authedPage.getByText(/loss/i).first())
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the first run name should be visible in the workspace',
  async ({ authedPage, sdkData }) => {
    const run = sdkData.runs[0];
    await expect(
      authedPage.getByText(run.displayName || run.name)
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see the artifact creator run',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/artifact-creator/i).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see {string} in the workspace',
  async ({ authedPage }, text: string) => {
    await expect(
      authedPage.getByText(new RegExp(text, 'i')).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);
