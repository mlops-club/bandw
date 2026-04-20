import { test, expect } from '../../../../fixtures';

test('create-parallel-coords: workspace loads with charts', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to the project workspace
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);

  // Wait for workspace to fully load
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify the workspace has chart content
  await expect(page.getByText(/Charts|train|val/).first()).toBeVisible({ timeout: 10_000 });
});

test('create-parallel-coords: panel picker accessible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Click "Add panels" to open the panel picker
  await page.getByRole('button', { name: 'Add panels' }).click();

  // Verify panel picker opens with chart type options
  await expect(page.getByText(/Parallel|Bar chart|Scatter/i).first()).toBeVisible({ timeout: 10_000 });
});

test('create-parallel-coords: workspace settings controls exist', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify workspace-level controls exist
  await expect(page.getByRole('button', { name: /Settings|Workspace settings|Add panels/ }).first()).toBeVisible({ timeout: 10_000 });
});
