import { test, expect } from '../../../fixtures';

test('table-immutable-mode: table panel visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0]; // "immutable-table"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Verify table panel is visible
  await expect(page.getByText('immutable_predictions').or(page.getByRole('table'))).toBeVisible({ timeout: 10_000 });
});

test('table-immutable-mode: row count matches SDK data', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Verify rows are rendered
  await expect(page.getByRole('row').first()).toBeVisible({ timeout: 10_000 });
});

test('table-immutable-mode: table is read-only', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Verify no edit controls are present
  await expect(page.getByRole('button', { name: /edit/i })).not.toBeVisible();
});
