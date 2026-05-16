/**
 * Step definitions for app/panels/parameter-importance feature files.
 *
 * Reuses: common.steps.ts, line-plot.steps.ts, project-page.steps.ts
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// When — add parameter importance panel
// ---------------------------------------------------------------------------

When(
  'I add a parameter importance panel',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: 'Add panels' }).click();
    await authedPage.getByText(/evaluation/i).click();
    await authedPage.getByText(/parameter importance/i).click();
  }
);

// ---------------------------------------------------------------------------
// Then — parameter importance assertions
// ---------------------------------------------------------------------------

Then(
  'I should see panel text',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/panel/i).first()).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see parameter importance text',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/parameter importance/i)
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see config key {string} or {string}',
  async ({ authedPage }, key1: string, key2: string) => {
    await expect(
      authedPage.getByText(key1).or(authedPage.getByText(key2))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see SVG chart elements',
  async ({ authedPage }) => {
    await expect(
      authedPage.locator('svg rect, svg path').first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see correlation or importance text',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/correlation/i).or(authedPage.getByText(/importance/i))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see SVG rect elements',
  async ({ authedPage }) => {
    await expect(
      authedPage.locator('svg rect').first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see correlation values',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/correlation/i).or(authedPage.getByText(/0\.\d+/).first())
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see importance text',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/importance/i)).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I click the metric selector',
  async ({ authedPage }) => {
    await authedPage
      .getByRole('combobox', { name: /metric/i })
      .or(authedPage.getByLabel(/metric/i))
      .click();
  }
);

Then(
  'I should see a loss metric option',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('option', { name: /loss/i })
        .or(authedPage.getByText('loss')).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see parameter toggle controls',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('checkbox').first()
        .or(authedPage.getByRole('switch').first())
    ).toBeVisible({ timeout: 10_000 });
  }
);
