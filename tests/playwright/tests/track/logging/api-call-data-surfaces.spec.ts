import { test, expect } from '../../../fixtures';

test('api-call-data-surfaces: config, metrics, and summary appear on correct UI surfaces', async ({ authedPage, targetConfig, sdkData }) => {
  const page = authedPage;
  const run = sdkData.runs[1]; // "multiple-metrics" run

  // --- Overview tab: verify config and summary values ---
  await page.goto(`${targetConfig.baseURL}/${sdkData.entity}/${sdkData.project}/runs/${run.id}/overview`);
  await page.getByRole('tab', { name: 'Overview' }).waitFor();

  // Scroll to below-fold content (Summary section)
  await page.keyboard.press('End');
  await page.waitForTimeout(1000);

  // Summary section should show final metric values — scope to Summary list
  const summarySection = page.getByRole('list').filter({ hasText: 'Summary metrics' });
  await expect(summarySection).toBeVisible({ timeout: 10_000 });
  await expect(summarySection.getByText('loss')).toBeVisible({ timeout: 10_000 });
  await expect(summarySection.getByText('accuracy')).toBeVisible({ timeout: 10_000 });
  await expect(summarySection.getByText('learning_rate')).toBeVisible({ timeout: 10_000 });

  // --- Charts tab: verify metrics render as charts ---
  await page.getByRole('tab', { name: 'Charts' }).click();
  await page.waitForTimeout(2000); // panels render async

  await expect(page.getByText('loss').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('accuracy').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('learning_rate').first()).toBeVisible({ timeout: 10_000 });
});
