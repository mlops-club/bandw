import { test, expect } from '../../../fixtures';

test('remove tag: table loads with run data', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for table to load
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Verify run names are visible
  const runName = sdkData.runs[0].displayName || sdkData.runs[0].name;
  await expect(page.getByText(runName).first()).toBeVisible({ timeout: 10_000 });
});

test('remove tag: run overview loads with tags', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);

  // Wait for overview tab to load
  await page.getByRole('tab', { name: /Overview/i }).first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Verify tags section is visible
  await expect(page.getByText(/Tags|tag|baseline|v1/i).first()).toBeVisible({ timeout: 10_000 });
});
