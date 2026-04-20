import { test, expect } from '../../../fixtures';

test('add tags from project table: table loads with runs', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for table to load
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Verify run names are visible in table
  const runName = sdkData.runs[0].displayName || sdkData.runs[0].name;
  await expect(page.getByText(runName).first()).toBeVisible({ timeout: 10_000 });
});

test('add tags from project table: table has checkboxes for run selection', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Verify checkboxes exist in the table for run selection
  const checkboxes = page.getByRole('checkbox');
  const count = await checkboxes.count();
  expect(count).toBeGreaterThanOrEqual(1);
});

test('add tags from project table: multiple runs visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Verify multiple runs are displayed
  const run0 = sdkData.runs[0].displayName || sdkData.runs[0].name;
  const run1 = sdkData.runs[1].displayName || sdkData.runs[1].name;
  await expect(page.getByText(run0).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(run1).first()).toBeVisible({ timeout: 10_000 });
});
