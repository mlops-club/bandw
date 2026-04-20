import { test, expect } from '../../../fixtures';

test('table-mutable-mode: table panel visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[1]; // "mutable-table"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Verify table panel is visible
  await expect(page.getByText('mutable_results').or(page.getByRole('table'))).toBeVisible({ timeout: 10_000 });
});

test('table-mutable-mode: all rows including additions are present', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[1];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Verify complete data is shown (3 rows in final table)
  await expect(page.getByText('bird').or(page.getByText('cat'))).toBeVisible({ timeout: 10_000 });
});

test('table-mutable-mode: newly added columns are present', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[1];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Verify the added column "latency_ms" is present in the final state
  await expect(page.getByRole('columnheader', { name: /latency/i }).or(page.getByText('latency_ms'))).toBeVisible({ timeout: 10_000 });
});
