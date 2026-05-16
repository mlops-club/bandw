import { test, expect } from '../../../fixtures';

test('metric-naming: panel titles match metric names exactly without mangling', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[2]; // "metric-naming" run

  // Navigate to the run detail page (Charts tab is default)
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}`);

  // Verify the Charts tab is active
  await page.getByRole('tab', { name: 'Charts' }).waitFor();
  await page.waitForTimeout(2000); // panels render async

  // Verify panels exist with exact metric names — no mangling
  await expect(page.getByText('accuracy').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('val_loss').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('modelAccuracy').first()).toBeVisible({ timeout: 10_000 });
});
