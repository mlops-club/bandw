import { test, expect } from '../../../fixtures';

test('multiple-metrics: separate panels for each logged metric', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[1]; // "multiple-metrics" run

  // Navigate to the run detail page (Charts tab is default)
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}`);

  // Verify the Charts tab is active
  await page.getByRole('tab', { name: 'Charts' }).waitFor();
  await page.waitForTimeout(2000); // panels render async

  // Verify separate chart panels exist for each metric
  await expect(page.getByText('loss').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('accuracy').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('learning_rate').first()).toBeVisible({ timeout: 10_000 });
});
