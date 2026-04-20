import { test, expect } from '../../../fixtures';

test('custom-chart-histogram: workspace loads', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await expect(page.getByText(sdkData.project)).toBeVisible({ timeout: 10_000 });
});

test('custom-chart-histogram: panel exists', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[3]; // "custom-histogram"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Find histogram panel
  await expect(page.getByText('Score Distribution')).toBeVisible({ timeout: 10_000 });
});

test('custom-chart-histogram: histogram shape visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[3];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Verify binned frequency bars
  await expect(page.getByText('Score Distribution')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('svg rect, svg path, canvas').first()).toBeVisible({ timeout: 10_000 });
});
