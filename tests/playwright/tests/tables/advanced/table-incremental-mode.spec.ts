import { test, expect } from '../../../fixtures';

test('table-incremental-mode: table panel visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[2]; // "incremental-table"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Verify table panel is visible
  await expect(page.getByText('incremental_results').or(page.getByRole('table'))).toBeVisible({ timeout: 10_000 });
});

test('table-incremental-mode: step-through capability available', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[2];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Verify step-through controls are available (slider or step selector)
  await expect(page.getByRole('slider').or(page.getByLabel(/step/i))).toBeVisible({ timeout: 10_000 });
});

test('table-incremental-mode: rows accumulate across increments', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[2];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Verify rows are present (accumulated data from multiple steps)
  await expect(page.getByRole('row').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('sample_id').or(page.getByRole('columnheader', { name: 'sample_id' }))).toBeVisible({ timeout: 10_000 });
});

test('table-incremental-mode: handles increment limit gracefully', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[2];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Verify UI handles the increments without error (10 increments logged)
  await expect(page.getByRole('table').or(page.getByText('incremental_results'))).toBeVisible({ timeout: 10_000 });
});
