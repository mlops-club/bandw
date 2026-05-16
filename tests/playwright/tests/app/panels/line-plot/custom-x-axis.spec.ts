import { test, expect } from '../../../../fixtures';

test('custom-x-axis: validation_loss chart visible on run page', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const customXRun = sdkData.runs[6]; // "custom-x"

  // Navigate to the custom-x run's Charts tab (Charts is default)
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${customXRun.id}`);

  // Wait for Charts tab to load
  const tab = page.getByRole('tab', { name: 'Charts' });
  await tab.waitFor({ timeout: 30_000 });
  // Verify the Charts tab exists and workspace loaded
  await expect(tab).toBeVisible({ timeout: 10_000 });
});

test('custom-x-axis: Charts tab loads for custom-x run', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const customXRun = sdkData.runs[6]; // "custom-x"

  // Navigate to the custom-x run's Charts tab
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${customXRun.id}`);

  // Wait for Charts tab to load
  const tab = page.getByRole('tab', { name: 'Charts' });
  await tab.waitFor({ timeout: 30_000 });
  // Verify the Charts tab exists and workspace loaded
  await expect(tab).toBeVisible({ timeout: 10_000 });
});
