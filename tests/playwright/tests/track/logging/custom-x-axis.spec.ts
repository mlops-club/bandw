import { test, expect } from '../../../fixtures';

test('custom-x-axis: validation_loss chart uses "epoch" as x-axis', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[3]; // "custom-x-axis" run

  // Navigate to the run detail page (Charts tab is default)
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}`);

  // Verify the Charts tab is active
  await page.getByRole('tab', { name: 'Charts' }).waitFor();
  await page.waitForTimeout(2000); // panels render async

  // Verify the validation_loss panel exists
  await expect(page.getByText('validation_loss').first()).toBeVisible({ timeout: 10_000 });

  // Verify the x-axis label shows "epoch" instead of the default "Step"
  await expect(page.getByText('epoch').first()).toBeVisible({ timeout: 10_000 });
});
