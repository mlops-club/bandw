import { test, expect } from '../../../fixtures';

test('fork display: run overview loads', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[6]; // eta-forked

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);

  // Wait for overview tab to load
  await page.getByRole('tab', { name: /Overview/i }).first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Verify run overview content is visible
  await expect(page.getByText(/Overview|State|Created/i).first()).toBeVisible({ timeout: 10_000 });
});

test('fork display: run detail shows run name', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[6]; // eta-forked

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: /Overview/i }).first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Verify run name is displayed
  const runName = run.displayName || run.name;
  await expect(page.getByText(runName).first()).toBeVisible({ timeout: 10_000 });
});

test('fork display: run charts tab loads', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[6]; // eta-forked

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}`);

  // Wait for charts tab to load
  await page.getByRole('tab', { name: /Charts/i }).first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify chart content loads
  await expect(page.getByText(/loss|accuracy|train/i).first()).toBeVisible({ timeout: 10_000 });
});
