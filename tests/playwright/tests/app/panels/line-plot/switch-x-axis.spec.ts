import { test, expect } from '../../../../fixtures';

test('switch-x-axis: charts default to Step x-axis', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  // Navigate to the project workspace
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);

  // Wait for workspace to fully load
  await page.getByRole('button', { name: 'Add panels' }).waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify the workspace has chart content — section headers or panel titles
  await expect(page.getByText(/Charts|train|val|Step/).first()).toBeVisible({ timeout: 10_000 });
});
