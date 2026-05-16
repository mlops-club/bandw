import { test, expect } from '../../../fixtures';

test('point-aggregation: run detail charts tab loads with loss chart', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[12]; // "high-volume" run (2000 data points)

  // Navigate to the run detail page (Charts tab is default)
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}`);

  // Wait for charts tab to load
  await page.getByRole('tab', { name: /Charts/i }).first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify chart content exists
  await expect(page.getByText(/loss|accuracy|train/i).first()).toBeVisible({ timeout: 10_000 });
});
