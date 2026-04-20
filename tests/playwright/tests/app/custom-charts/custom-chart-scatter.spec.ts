import { test, expect } from '../../../fixtures';

test('custom-chart-scatter: workspace loads', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await expect(page.getByText(sdkData.project)).toBeVisible({ timeout: 10_000 });
});

test('custom-chart-scatter: panel exists', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[1]; // "custom-scatter"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Find custom scatter plot panel
  await expect(page.getByText('Custom Scatter')).toBeVisible({ timeout: 10_000 });
});

test('custom-chart-scatter: scatter pattern visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[1];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Verify unconnected points render
  await expect(page.getByText('Custom Scatter')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('svg circle, svg path, canvas').first()).toBeVisible({ timeout: 10_000 });
});
