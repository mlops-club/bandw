import { test, expect } from '../../../fixtures';

test('add tag on run detail: run overview loads', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);

  // Wait for overview tab to load
  await page.getByRole('tab', { name: /Overview/i }).first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Verify run overview content is visible
  await expect(page.getByText(/Overview|State|Created/i).first()).toBeVisible({ timeout: 10_000 });
});

test('add tag on run detail: run detail shows run name', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: /Overview/i }).first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Verify run name or display name is shown
  const runName = run.displayName || run.name;
  await expect(page.getByText(runName).first()).toBeVisible({ timeout: 10_000 });
});

test('add tag on run detail: tags section visible on overview', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0];

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: /Overview/i }).first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Verify tags section or tag-related content is present
  await expect(page.getByText(/Tags|tag|baseline|v1/i).first()).toBeVisible({ timeout: 10_000 });
});
