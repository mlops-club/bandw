import { test, expect } from '../../../fixtures';

test('resumed run: charts tab loads with metric data', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[2]; // gamma-run

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}`);

  // Wait for charts tab to load
  await page.getByRole('tab', { name: /Charts/i }).first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify chart content is present
  await expect(page.getByText(/loss|accuracy|train/i).first()).toBeVisible({ timeout: 10_000 });
});

test('resumed run: table shows run data', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for table to load
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Verify run names are visible in table
  const runName = sdkData.runs[2].displayName || sdkData.runs[2].name;
  await expect(page.getByText(runName).first()).toBeVisible({ timeout: 10_000 });
});
