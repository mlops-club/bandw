import { test, expect } from '../../../fixtures';

test('change-baseline-run: workspace loads with run names', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);

  // Wait for workspace to fully load
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify the workspace has chart content
  await expect(page.getByText(/Charts|train|val/).first()).toBeVisible({ timeout: 10_000 });
});

test('change-baseline-run: run names are displayed', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify run names are visible
  const runA = sdkData.runs[0].displayName || sdkData.runs[0].name;
  const runB = sdkData.runs[1].displayName || sdkData.runs[1].name;
  await expect(page.getByText(runA).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(runB).first()).toBeVisible({ timeout: 10_000 });
});
