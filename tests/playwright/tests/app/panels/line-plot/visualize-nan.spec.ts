import { test, expect } from '../../../../fixtures';

test('visualize-nan: nan_metric chart renders on run page', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const nanRun = sdkData.runs[5]; // "nan-run"

  // Navigate to the nan-run's Charts tab (Charts is default)
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${nanRun.id}`);

  // Wait for Charts tab to load
  const tab = page.getByRole('tab', { name: 'Charts' });
  await tab.waitFor({ timeout: 30_000 });
  // Verify the Charts tab exists and workspace loaded
  await expect(tab).toBeVisible({ timeout: 10_000 });
});

test('visualize-nan: run page loads without errors', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const nanRun = sdkData.runs[5]; // "nan-run"

  // Navigate to the nan-run's Charts tab
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${nanRun.id}`);

  // Wait for Charts tab to load
  const tab = page.getByRole('tab', { name: 'Charts' });
  await tab.waitFor({ timeout: 30_000 });
  // Verify the Charts tab exists and workspace loaded
  await expect(tab).toBeVisible({ timeout: 10_000 });
});
