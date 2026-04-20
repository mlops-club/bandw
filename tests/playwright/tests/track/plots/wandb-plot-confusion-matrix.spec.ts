import { test, expect } from '../../../fixtures';

test('wandb-plot-confusion-matrix: run detail charts tab loads', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[5]; // "wandb-plot-confusion-matrix" run

  // Navigate to the run detail page (Charts tab is default)
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}`);

  // Wait for charts tab to load
  await page.getByRole('tab', { name: /Charts/i }).first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(3000);

  // Verify chart content is present (confusion matrix panel)
  await expect(page.getByText(/confusion|matrix|cat|dog|bird/i).first()).toBeVisible({ timeout: 10_000 });
});
