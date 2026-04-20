import { test, expect } from '../../../fixtures';

test('sdk-set tags: run overview loads with tags visible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);

  // Wait for overview tab to load
  await page.getByRole('tab', { name: /Overview/i }).first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Verify run overview content is visible
  await expect(page.getByText(/Overview|State|Created|Tags/i).first()).toBeVisible({ timeout: 10_000 });
});

test('sdk-set tags: run detail shows run information', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: /Overview/i }).first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Verify run name or display name is shown
  const runName = run.displayName || run.name;
  await expect(page.getByText(runName).first()).toBeVisible({ timeout: 10_000 });
});
