import { test, expect } from '../../../../fixtures';

test('run-comparer-diff-only: workspace loads with chart panels', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);

  // Wait for workspace to fully load
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify the workspace has chart content
  await expect(page.getByText(/Charts|train|val/).first()).toBeVisible({ timeout: 10_000 });
});

test('run-comparer-diff-only: panel picker is accessible', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Open the panel picker
  await page.getByRole('button', { name: 'Add panels' }).click();

  // Verify panel picker opened
  await expect(page.getByText(/Evaluation|Bar chart|Scatter|Run comparer/i).first()).toBeVisible({ timeout: 10_000 });
});
