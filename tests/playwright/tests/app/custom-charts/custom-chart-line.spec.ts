import { test, expect } from '../../../fixtures';

test('custom-chart-line: workspace loads', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  // Verify charts load
  await expect(page.getByText(sdkData.project)).toBeVisible({ timeout: 10_000 });
});

test('custom-chart-line: panel with title exists', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0]; // "custom-line"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Find custom line plot panel
  await expect(page.getByText('Custom Line')).toBeVisible({ timeout: 10_000 });
});

test('custom-chart-line: line visible in chart', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Verify chart renders connected points (line element in SVG/canvas)
  await expect(page.getByText('Custom Line')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('svg path, canvas').first()).toBeVisible({ timeout: 10_000 });
});
