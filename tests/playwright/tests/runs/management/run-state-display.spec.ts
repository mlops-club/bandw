import { test, expect } from '../../../fixtures';

test('run state: table loads and shows state badges', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/table`);

  // Wait for table to load
  await page.getByText('Name').first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Verify state badges are visible (Finished or Crashed)
  await expect(page.getByText(/Finished|Crashed|Running/i).first()).toBeVisible({ timeout: 10_000 });
});

test('run state: run overview shows state', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);

  // Wait for overview tab to load
  await page.getByRole('tab', { name: /Overview/i }).first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Verify state shows on overview
  await expect(page.getByText(/Finished|Crashed|Running/i).first()).toBeVisible({ timeout: 10_000 });
});

test('run state: run detail shows run name', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: /Overview/i }).first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Verify run name is visible
  const runName = run.displayName || run.name;
  await expect(page.getByText(runName).first()).toBeVisible({ timeout: 10_000 });
});
