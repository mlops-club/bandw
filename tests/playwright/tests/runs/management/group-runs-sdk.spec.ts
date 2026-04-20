import { test, expect } from '../../../fixtures';

test('sdk groups: table loads with run data', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for table to load
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Verify run names are visible
  const runName = sdkData.runs[0].displayName || sdkData.runs[0].name;
  await expect(page.getByText(runName).first()).toBeVisible({ timeout: 10_000 });
});

test('sdk groups: Group button is accessible in table view', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Verify Group button exists
  await expect(page.getByRole('button', { name: /Group/i }).first()).toBeVisible({ timeout: 10_000 });
});
