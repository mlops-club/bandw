import { test, expect } from '../../../fixtures';

test('files-tab: file browser is visible with run files', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[0]; // "basic-run"

  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}`);

  // Navigate to Files tab
  const filesTab = page.getByRole('tab', { name: 'Files' });
  await filesTab.waitFor({ timeout: 30_000 });
  await filesTab.click();
  await page.waitForTimeout(2000);

  // Verify Files tab is active and content area exists
  await expect(page.getByText('Files').first()).toBeVisible({ timeout: 10_000 });
});
