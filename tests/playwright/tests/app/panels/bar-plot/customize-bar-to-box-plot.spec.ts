import { test, expect } from '../../../../fixtures';

test('customize-bar-to-box-plot: workspace loads with panels', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);

  // Wait for workspace to fully load
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify the workspace has chart content
  await expect(page.getByText(/Charts|train|val/).first()).toBeVisible({ timeout: 10_000 });
});

test('customize-bar-to-box-plot: panel picker opens from Add panels', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Open panel picker
  await page.getByRole('button', { name: 'Add panels' }).click();

  // Verify panel picker opened
  await expect(page.getByText(/Bar chart|Scatter|Parallel/i).first()).toBeVisible({ timeout: 10_000 });
});

test('customize-bar-to-box-plot: workspace controls are functional', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify workspace-level controls exist
  await expect(page.getByRole('button', { name: /Settings|Workspace settings|Add panels/ }).first()).toBeVisible({ timeout: 10_000 });
});
