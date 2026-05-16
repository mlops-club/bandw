import { test, expect } from '../../../fixtures';

test('define-metric-custom-x: run detail charts tab loads', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[9]; // "custom-x-axis" run

  // Navigate to the run detail page (Charts tab is default)
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}`);

  // Wait for charts tab to load
  await page.getByRole('tab', { name: /Charts/i }).first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify chart content is present
  await expect(page.getByText(/loss|accuracy|epoch|validation/i).first()).toBeVisible({ timeout: 10_000 });
});
