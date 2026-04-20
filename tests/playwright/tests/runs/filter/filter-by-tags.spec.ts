import { test, expect } from '../../../fixtures';

test('filter by tags: table loads with run data', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for table to load
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Verify run names are visible
  const runName = sdkData.runs[0].displayName || sdkData.runs[0].name;
  await expect(page.getByText(runName).first()).toBeVisible({ timeout: 10_000 });
});

test('filter by tags: Filter button is accessible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Verify Filter button exists
  await expect(page.getByRole('button', { name: /Filter/i }).first()).toBeVisible({ timeout: 10_000 });
});

test('filter by tags: multiple runs visible in table', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Verify multiple runs are present
  const run0 = sdkData.runs[0].displayName || sdkData.runs[0].name;
  const run1 = sdkData.runs[1].displayName || sdkData.runs[1].name;
  await expect(page.getByText(run0).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(run1).first()).toBeVisible({ timeout: 10_000 });
});
