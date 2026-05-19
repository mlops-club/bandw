/**
 * Step definitions for tables/advanced feature files.
 *
 * Reuses: common.steps.ts, tables-core.steps.ts (table rows, etc.)
 */
import { expect } from '@playwright/test';
import { Given, When, Then } from '../../../../steps/fixtures';

// ---------------------------------------------------------------------------
// When — run detail navigation for specific runs
// ---------------------------------------------------------------------------

When(
  'I open the immutable table run detail page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[0]; // "immutable-table"
    const runId = run.displayName || run.name || run.id;
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${runId}`
    );
    await authedPage.getByText('Name').first().waitFor({ timeout: 30_000 });
  }
);

When(
  'I open the mutable table run detail page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[1]; // "mutable-table"
    const runId = run.displayName || run.name || run.id;
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${runId}`
    );
    await authedPage.getByText('Name').first().waitFor({ timeout: 30_000 });
  }
);

When(
  'I open the incremental table run detail page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[2]; // "incremental-table"
    const runId = run.displayName || run.name || run.id;
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${runId}`
    );
    await authedPage.getByText('Name').first().waitFor({ timeout: 30_000 });
  }
);

When(
  'I open the download table run detail page',
  async ({ authedPage, targetConfig, sdkData }) => {
    const run = sdkData.runs[3]; // "download-table"
    const runId = run.displayName || run.name || run.id;
    await authedPage.goto(
      `${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${runId}`
    );
    await authedPage.getByText('Name').first().waitFor({ timeout: 30_000 });
  }
);

// ---------------------------------------------------------------------------
// Then — immutable mode assertions
// ---------------------------------------------------------------------------

Then(
  'I should see immutable predictions or table content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText('immutable_predictions').or(authedPage.getByRole('table'))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'the edit button should not be visible',
  async ({ authedPage }) => {
    await expect(authedPage.getByRole('button', { name: /edit/i })).not.toBeVisible();
  }
);

// ---------------------------------------------------------------------------
// Then — mutable mode assertions
// ---------------------------------------------------------------------------

Then(
  'I should see mutable results or table content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText('mutable_results').or(authedPage.getByRole('table'))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see animal data',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText('bird').or(authedPage.getByText('cat'))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see latency column',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('columnheader', { name: /latency/i })
        .or(authedPage.getByText('latency_ms'))
    ).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// Then — incremental mode assertions
// ---------------------------------------------------------------------------

Then(
  'I should see incremental results or table content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText('incremental_results').or(authedPage.getByRole('table'))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see step controls',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('slider').or(authedPage.getByLabel(/step/i))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see sample_id column content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText('sample_id')
        .or(authedPage.getByRole('columnheader', { name: 'sample_id' }))
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  'I should see table or incremental results content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByRole('table').or(authedPage.getByText('incremental_results'))
    ).toBeVisible({ timeout: 10_000 });
  }
);

// ---------------------------------------------------------------------------
// Then — download assertions
// ---------------------------------------------------------------------------

Then(
  'I should see download data or table content',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText('download_data').or(authedPage.getByRole('table'))
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I click the export or download button',
  async ({ authedPage }) => {
    await authedPage.getByRole('button', { name: /export/i })
      .or(authedPage.getByRole('button', { name: /download/i }))
      .or(authedPage.getByRole('button', { name: /actions/i }))
      .click();
  }
);

Then(
  'I should see export options',
  async ({ authedPage }) => {
    await expect(
      authedPage.getByText(/download/i)
        .or(authedPage.getByText(/export/i))
        .or(authedPage.getByText(/csv/i))
    ).toBeVisible({ timeout: 10_000 });
  }
);

When(
  'I trigger table download',
  async ({ authedPage }) => {
    const downloadPromise = authedPage.waitForEvent('download');
    await authedPage.getByRole('button', { name: /export/i })
      .or(authedPage.getByRole('button', { name: /download/i }))
      .or(authedPage.getByRole('button', { name: /actions/i }))
      .click();
    await authedPage.getByRole('menuitem', { name: /download/i })
      .or(authedPage.getByText(/csv/i))
      .click();
    (authedPage as any)._lastDownload = await downloadPromise;
  }
);

Then(
  'the download should succeed',
  async ({ authedPage }) => {
    const download = (authedPage as any)._lastDownload;
    expect(download.suggestedFilename()).toBeTruthy();
  }
);
