import { test, expect } from '../../../fixtures';

test('metrics-in-workspace: chart panels exist for logged metrics', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/workspace`);

  // Wait for the Charts section header which indicates panels have loaded
  await page.getByText('Charts').first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000); // panels render asynchronously

  // Verify chart panels exist by checking panel title text.
  // Panel titles are rendered as plain text in the workspace.
  // Use locator().first() since titles may render in multiple places.
  await expect(page.getByText('loss').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('accuracy').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('val_loss').first()).toBeVisible({ timeout: 10_000 });
});
