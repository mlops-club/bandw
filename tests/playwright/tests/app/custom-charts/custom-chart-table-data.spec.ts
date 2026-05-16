import { test, expect } from '../../../fixtures';

test('custom-chart-table-data: workspace loads', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await expect(page.getByText(sdkData.project)).toBeVisible({ timeout: 10_000 });
});

test('custom-chart-table-data: custom chart panel exists', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[6]; // "custom-table-chart"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Find custom chart panel created from logged table
  await expect(page.getByText('Training Progress').or(page.getByText('custom-table-viz'))).toBeVisible({ timeout: 10_000 });
});

test('custom-chart-table-data: data renders from logged table', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[6];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Verify chart displays data from the logged table
  await expect(page.getByText('Training Progress').or(page.getByText('custom-table-viz'))).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('svg path, svg rect, canvas').first()).toBeVisible({ timeout: 10_000 });
});
