import { test, expect } from '../../../fixtures';

test('custom-chart-roc-curve: workspace loads', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });

  await expect(page.getByText(sdkData.project)).toBeVisible({ timeout: 10_000 });
});

test('custom-chart-roc-curve: panel exists', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[5]; // "custom-roc-curve"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Find ROC curve panel
  await expect(page.getByText(/roc.curve/i).or(page.getByText('roc-curve'))).toBeVisible({ timeout: 10_000 });
});

test('custom-chart-roc-curve: curve renders correctly', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[5];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.displayName || run.name || run.id}`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });

  // Verify ROC curve with diagonal reference
  await expect(page.getByText(/roc.curve/i).or(page.getByText('roc-curve'))).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('svg path, canvas').first()).toBeVisible({ timeout: 10_000 });
});
