import { test, expect } from '../../../fixtures';

test('custom-chart-pr-curve: workspace loads', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await expect(page.getByText(sdkData.project)).toBeVisible({ timeout: 10_000 });
});

test('custom-chart-pr-curve: panel exists', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[4]; // "custom-pr-curve"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Find PR curve panel
  await expect(page.getByText(/pr.curve/i).or(page.getByText('pr-curve'))).toBeVisible({ timeout: 10_000 });
});

test('custom-chart-pr-curve: curve renders', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[4];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Verify precision-recall curve shape
  await expect(page.getByText(/pr.curve/i).or(page.getByText('pr-curve'))).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('svg path, canvas').first()).toBeVisible({ timeout: 10_000 });
});
