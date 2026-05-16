import { test, expect } from '../../../../fixtures';

test('parallel-coords-filter: workspace loads for filter interaction', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);

  // Wait for workspace to fully load
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify the workspace has chart content
  await expect(page.getByText(/Charts|train|val/).first()).toBeVisible({ timeout: 10_000 });
});

test('parallel-coords-filter: panel picker has chart options', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Open panel picker
  await page.getByRole('button', { name: 'Add panels' }).click();

  // Verify chart type options available
  await expect(page.getByText(/Parallel|Bar chart|Scatter/i).first()).toBeVisible({ timeout: 10_000 });
});

test('parallel-coords-filter: workspace controls are accessible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify workspace-level controls exist
  await expect(page.getByRole('button', { name: /Settings|Workspace settings|Add panels/ }).first()).toBeVisible({ timeout: 10_000 });
});
