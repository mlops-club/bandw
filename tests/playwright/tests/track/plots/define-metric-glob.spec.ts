import { test, expect } from '../../../fixtures';

test('define-metric-glob: run detail charts tab loads with metrics', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[10]; // "glob-pattern" run

  // Navigate to the run detail page (Charts tab is default)
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}`);

  // Wait for charts tab to load
  await page.getByRole('tab', { name: /Charts/i }).first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify chart panels exist for train/* metrics
  await expect(page.getByText(/train|loss|accuracy/i).first()).toBeVisible({ timeout: 10_000 });
});
