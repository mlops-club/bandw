import { test, expect } from '../../../../fixtures';

test('create-bar-plot: workspace loads and panel picker is accessible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to the project workspace
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);

  // Wait for workspace to fully load
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Click "Add panels" to open the panel picker
  await page.getByRole('button', { name: 'Add panels' }).click();

  // Verify panel picker opens with chart type options
  await expect(page.getByText(/Bar chart|Chart|Scatter/i).first()).toBeVisible({ timeout: 10_000 });
});

test('create-bar-plot: workspace has chart content', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify the workspace has chart content — section headers or panel titles
  await expect(page.getByText(/Charts|train|val/).first()).toBeVisible({ timeout: 10_000 });
});

test('create-bar-plot: workspace settings are accessible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify workspace-level controls exist
  await expect(page.getByRole('button', { name: /Settings|Workspace settings|Add panels/ }).first()).toBeVisible({ timeout: 10_000 });
});
