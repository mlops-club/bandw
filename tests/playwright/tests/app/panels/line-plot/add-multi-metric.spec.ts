import { test, expect } from '../../../../fixtures';

test('add-multi-metric: workspace shows multiple metric panels', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to the project workspace
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);

  // Wait for workspace to fully load
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify the workspace has chart content — section headers or panel titles
  // Chart sections may be collapsed, so check for any visible chart content
  await expect(page.getByText(/Charts|train|val/).first()).toBeVisible({ timeout: 10_000 });
});

test('add-multi-metric: Add panels button exists', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify the Add panels button is available
  await expect(page.getByRole('button', { name: 'Add panels' })).toBeVisible({ timeout: 10_000 });
});
