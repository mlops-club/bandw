import { test, expect } from '../../../fixtures';

test('smoothing-methods: run detail charts tab loads', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[11]; // "smoothing" run

  // Navigate to the run detail page (Charts tab is default)
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}`);

  // Wait for charts tab to load
  await page.getByRole('tab', { name: /Charts/i }).first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify chart content is present
  await expect(page.getByText(/loss|noisy|train/i).first()).toBeVisible({ timeout: 10_000 });
});
