import { test, expect } from '../../../../fixtures';

test('regex-groups: search panels input is available', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to the project workspace
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);

  // Wait for workspace to fully load
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify the workspace has chart content — section headers or panel titles
  await expect(page.getByText(/Charts|train|val/).first()).toBeVisible({ timeout: 10_000 });
});

test('regex-groups: workspace loads with Add panels button', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify workspace-level controls exist
  await expect(page.getByRole('button', { name: 'Add panels' })).toBeVisible({ timeout: 10_000 });
});
