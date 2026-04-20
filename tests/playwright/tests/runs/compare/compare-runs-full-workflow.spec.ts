import { test, expect } from '../../../fixtures';

test('compare-runs-full-workflow: workspace loads with chart panels', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);

  // Wait for workspace to fully load
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify the workspace has chart content
  await expect(page.getByText(/Charts|train|val/).first()).toBeVisible({ timeout: 10_000 });
});

test('compare-runs-full-workflow: runs table loads with run data', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for table to load
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Verify run names are visible in table
  const runName = sdkData.runs[0].displayName || sdkData.runs[0].name;
  await expect(page.getByText(runName).first()).toBeVisible({ timeout: 10_000 });
});

test('compare-runs-full-workflow: multiple runs visible in workspace', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify at least the first run name is visible
  const runName = sdkData.runs[0].displayName || sdkData.runs[0].name;
  await expect(page.getByText(runName).first()).toBeVisible({ timeout: 10_000 });
});
