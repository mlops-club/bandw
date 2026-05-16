/**
 * Step definitions for app/panels/code feature files.
 *
 * Reuses: common.steps.ts, line-plot.steps.ts
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// When — run tab navigation
// ---------------------------------------------------------------------------

When(
  'I open the first run files tab',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[0];
    const runId = run.displayName || run.name || run.id;
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${runId}/files`
    );
  }
);

When(
  'I open the second run files tab',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[1];
    const runId = run.displayName || run.name || run.id;
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${runId}/files`
    );
  }
);

When(
  'I open the first run artifacts tab',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[0];
    const runId = run.displayName || run.name || run.id;
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${runId}/artifacts`
    );
  }
);

// ---------------------------------------------------------------------------
// Then — file browser assertions
// ---------------------------------------------------------------------------

Then(
  'I should see a files heading',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('heading', { name: /files/i })
        .or(authedPage.getByText(/files/i).first())
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see a source file name',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/train\.py/i).or(authedPage.getByText(/model\.py/i)).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I click on the train.py file',
  async ({ authedPage }) => {
    await authedPage.getByText(/train\.py/i).first().click();
  }
);

When(
  'I click the code panel type',
  async ({ authedPage }) => {
    await authedPage
      .getByRole('button', { name: /code/i })
      .or(authedPage.getByText(/code/i))
      .first()
      .click();
  }
);

Then(
  'I should see a code panel action',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('button', { name: /apply|add|create|save/i })
        .or(authedPage.getByText(/code/i)).first()
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see artifact text',
  async ({ authedPage }) => {
    await expect(authedPage.getByText(/artifact/i).first()).toBeVisible({ timeout: 10_000 });
  }
);
